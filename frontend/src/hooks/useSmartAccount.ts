import { useState, useEffect, useCallback } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type Address,
  parseEther,
  encodeFunctionData,
} from "viem";
import {
  Implementation,
  toMetaMaskSmartAccount,
} from "@metamask/delegation-toolkit";
import { monadTestnet } from "../components/Providers/Web3Provider";
import { getMetaMaskProviderSafe } from "@/lib/metamask/provider";

interface Delegation {
  id: string;
  delegate: Address;
  contract: Address;
  selector: string;
  validUntil: bigint;
}

export function useSmartAccount() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();

  const [smartAccount, setSmartAccount] = useState<unknown>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [isDeployed, setIsDeployed] = useState(false);
  const [balance, setBalance] = useState("0");
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create public client
  const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http(process.env.NEXT_PUBLIC_MONAD_RPC_URL),
  });

  // Create bundler client for ERC-4337
  const bundlerClient = createPublicClient({
    chain: monadTestnet,
    transport: http(
      process.env.NEXT_PUBLIC_BUNDLER_URL || "https://testnet-rpc.monad.xyz"
    ),
  });

  // Create smart account
  const createSmartAccount = useCallback(async () => {
    if (!authenticated || wallets.length === 0) {
      setError("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const wallet = wallets[0];
      await wallet.switchChain(monadTestnet.id);

      // Get the MetaMask provider safely (handles conflicts)
      await getMetaMaskProviderSafe();
      const privyProvider = await wallet.getEthereumProvider();

      // Use MetaMask provider for delegation toolkit, Privy provider for wallet client
      const walletClient = createWalletClient({
        chain: monadTestnet,
        transport: custom(privyProvider),
      });

      const [ownerAddress] = await walletClient.getAddresses();

      // Create MetaMask Smart Account (Hybrid implementation)
      const account = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [ownerAddress, [], [], []], // [eoaOwner, passkeyIds, xCoords, yCoords]
        deploySalt: `0x${Date.now().toString(16).padStart(64, "0")}`, // Unique salt per user
        signer: { walletClient },
      });

      setSmartAccount(account);
      setAddress(account.address);

      // Check if deployed
      const code = await publicClient.getBytecode({ address: account.address });
      setIsDeployed(code !== undefined && code !== "0x");

      // Get balance
      const accountBalance = await publicClient.getBalance({
        address: account.address,
      });
      setBalance(accountBalance.toString());

      console.log("✅ Smart Account created:", account.address);
    } catch (err: unknown) {
      console.error("Error creating smart account:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create smart account"
      );
    } finally {
      setIsLoading(false);
    }
  }, [authenticated, wallets, publicClient]);

  // Deploy smart account (if not already deployed)
  const deploySmartAccount = useCallback(async () => {
    if (!smartAccount || isDeployed) return;

    setIsLoading(true);
    try {
      // Send a deployment transaction
      const userOpHash = await bundlerClient.sendUserOperation({
        account: smartAccount,
        calls: [], // Empty call deploys the account
      });

      // Wait for confirmation
      const receipt = await bundlerClient.waitForUserOperationReceipt({
        hash: userOpHash,
      });

      console.log("✅ Smart Account deployed:", receipt.userOpHash);
      setIsDeployed(true);
    } catch (err: unknown) {
      console.error("Error deploying smart account:", err);
      setError(
        err instanceof Error ? err.message : "Failed to deploy smart account"
      );
    } finally {
      setIsLoading(false);
    }
  }, [smartAccount, isDeployed, bundlerClient]);

  // Create delegation for AI agent
  const createDelegation = useCallback(
    async (
      delegateAddress: Address,
      targetContract: Address,
      functionSelector: string
    ) => {
      if (!smartAccount) {
        throw new Error("Smart account not created");
      }

      setIsLoading(true);
      try {
        // Create delegation using ERC-7710
        const delegation = {
          delegate: delegateAddress,
          authority: targetContract, // The contract the delegate can call
          caveats: [
            {
              enforcer: process.env
                .NEXT_PUBLIC_CAVEAT_ENFORCER_ADDRESS as Address,
              terms: encodeCaveats({
                maxAmount: parseEther("1000"), // Max $1000 per tx
                allowedFunctions: [functionSelector],
                validUntil: BigInt(
                  Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
                ), // 1 week
              }),
            },
          ],
        };

        // Sign delegation
        const wallet = wallets[0];
        const provider = await wallet.getEthereumProvider();
        const walletClient = createWalletClient({
          chain: monadTestnet,
          transport: custom(provider),
        });

        // This would require implementing ERC-7710 delegation signing
        // For now, we'll store delegation data
        const newDelegation: Delegation = {
          id: `${delegateAddress}-${targetContract}-${functionSelector}`,
          delegate: delegateAddress,
          contract: targetContract,
          selector: functionSelector,
          validUntil: BigInt(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60),
        };

        setDelegations((prev) => [...prev, newDelegation]);
        console.log("✅ Delegation created:", newDelegation);
      } catch (err: unknown) {
        console.error("Error creating delegation:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [smartAccount, wallets]
  );

  // Helper to encode caveats
  function encodeCaveats(params: unknown): `0x${string}` {
    // This should encode according to your caveat enforcer contract
    // Simplified version:
    return encodeFunctionData({
      abi: [
        {
          type: "function",
          name: "encodeCaveats",
          inputs: [
            { name: "maxAmount", type: "uint256" },
            { name: "allowedFunctions", type: "bytes4[]" },
            { name: "validUntil", type: "uint256" },
          ],
          outputs: [{ type: "bytes" }],
        },
      ],
      functionName: "encodeCaveats",
      args: [params.maxAmount, params.allowedFunctions, params.validUntil],
    });
  }

  // Refresh smart account data
  const refreshSmartAccount = useCallback(async () => {
    if (!address) return;

    try {
      const code = await publicClient.getBytecode({ address });
      setIsDeployed(code !== undefined && code !== "0x");

      const accountBalance = await publicClient.getBalance({ address });
      setBalance(accountBalance.toString());
    } catch (err) {
      console.error("Error refreshing smart account:", err);
    }
  }, [address, publicClient]);

  // Auto-refresh on mount
  useEffect(() => {
    if (address) {
      refreshSmartAccount();
    }
  }, [address, refreshSmartAccount]);

  return {
    smartAccount,
    address,
    isDeployed,
    balance,
    delegations,
    isLoading,
    error,
    createSmartAccount,
    deploySmartAccount,
    createDelegation,
    refreshSmartAccount,
  };
}

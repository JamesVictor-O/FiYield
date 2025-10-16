import { useState, useEffect, useCallback } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type Address,
} from "viem";
import {
  Implementation,
  toMetaMaskSmartAccount,
} from "@metamask/delegation-toolkit";
import { createBundlerClient } from "viem/account-abstraction";
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

  // Create bundler client for ERC-4337 operations
  const bundlerClient = createBundlerClient({
    client: publicClient,
    transport: http(process.env.NEXT_PUBLIC_BUNDLER_RPC_URL), // Your bundler URL (e.g., Pimlico, Stackup)
  });

  // Create smart account
  const createSmartAccount = useCallback(async () => {
    if (!authenticated) {
      setError("Please authenticate first");
      return;
    }
    
    if (wallets.length === 0) {
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
      
      // Check if wallet is still connected
      if (!wallet.address) {
        setError("Wallet connection lost. Please reconnect your wallet.");
        return;
      }
      
      let privyProvider;
      try {
        privyProvider = await wallet.getEthereumProvider();
      } catch (err) {
        console.error("Error getting ethereum provider:", err);
        setError("Wallet is not currently connected. Please reconnect your wallet.");
        return;
      }

      // Get the owner address first
      const ownerAddress = wallet.address as Address;

      // Create wallet client with the account from the start
      const walletClient = createWalletClient({
        account: ownerAddress,
        chain: monadTestnet,
        transport: custom(privyProvider),
      });

      // Create MetaMask Smart Account (Hybrid implementation)
      const account = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [ownerAddress, [], [], []], // [eoaOwner, passkeyIds, xCoords, yCoords]
        deploySalt: `0x${Date.now().toString(16).padStart(64, "0")}`, // Unique salt per user
        signer: {
          account: {
            address: ownerAddress,
            async signMessage({ message }: { message: any }) {
              return await walletClient.signMessage({
                account: ownerAddress,
                message,
              });
            },
            async signTypedData(typedData: any) {
              return await walletClient.signTypedData({
                account: ownerAddress,
                ...typedData,
              });
            },
          },
        },
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
    if (!smartAccount || isDeployed) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Send user operation with the smart account
      // The account handles signing automatically
      const userOpHash = await bundlerClient.sendUserOperation({
        account: smartAccount as any,
        calls: [], // Empty calls - just deploying the account
      });

      // Wait for the user operation to be included in a block
      await bundlerClient.waitForUserOperationReceipt({
        hash: userOpHash,
      });

      setIsDeployed(true);

      // Refresh balance after deployment
      if (address) {
        const accountBalance = await publicClient.getBalance({ address });
        setBalance(accountBalance.toString());
      }
    } catch (err: unknown) {
      console.error("Error deploying smart account:", err);
      setError(
        err instanceof Error ? err.message : "Failed to deploy smart account"
      );
    } finally {
      setIsLoading(false);
    }
  }, [smartAccount, isDeployed, bundlerClient, address, publicClient]);

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
        // const delegation = {
        //   delegate: delegateAddress,
        //   authority: targetContract, // The contract the delegate can call
        //   caveats: [
        //     {
        //       enforcer: process.env
        //         .NEXT_PUBLIC_CAVEAT_ENFORCER_ADDRESS as Address,
        //       terms: encodeCaveats({
        //         maxAmount: parseEther("1000"), // Max $1000 per tx
        //         allowedFunctions: [functionSelector],
        //         validUntil: BigInt(
        //           Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
        //         ), // 1 week
        //       }),
        //     },
        //   ],
        // };

        // Sign delegation
        // const wallet = wallets[0];
        // const walletClient = createWalletClient({
        //   chain: monadTestnet,
        //   transport: custom(provider),
        // });

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
      } catch (err: unknown) {
        console.error("Error creating delegation:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [smartAccount]
  );

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

  // Auto-refresh on mount - only if authenticated and wallet is connected
  useEffect(() => {
    if (authenticated && wallets.length > 0 && address) {
      refreshSmartAccount();
    }
  }, [authenticated, wallets.length, address, refreshSmartAccount]);

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

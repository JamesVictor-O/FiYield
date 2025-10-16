import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAccount } from "wagmi";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type Address,
  keccak256,
  encodePacked,
} from "viem";
import {
  Implementation,
  toMetaMaskSmartAccount,
} from "@metamask/delegation-toolkit";
import { createBundlerClient } from "viem/account-abstraction";
import { monadTestnet } from "../components/Providers/Web3Provider";
import { getMetaMaskProviderSafe } from "@/lib/metamask/provider";
import { SmartAccountStorage } from "@/lib/storage/smartAccount";

interface Delegation {
  id: string;
  delegate: Address;
  contract: Address;
  selector: string;
  validUntil: bigint;
}

// Validate environment variables
const MONAD_RPC_URL = process.env.NEXT_PUBLIC_MONAD_RPC_URL;
const BUNDLER_RPC_URL = process.env.NEXT_PUBLIC_BUNDLER_RPC_URL;

if (!MONAD_RPC_URL) {
  console.error("Missing NEXT_PUBLIC_MONAD_RPC_URL environment variable");
}

if (!BUNDLER_RPC_URL) {
  console.error("Missing NEXT_PUBLIC_BUNDLER_RPC_URL environment variable");
}

export function useSmartAccount() {
  const { address, isConnected } = useAccount();
  const isMountedRef = useRef(true);

  const [smartAccount, setSmartAccount] = useState<unknown>(null);
  const [smartAccountAddress, setSmartAccountAddress] =
    useState<Address | null>(null);
  const [isDeployed, setIsDeployed] = useState(false);
  const [balance, setBalance] = useState("0");
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize clients so they're not recreated on every render
  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: monadTestnet,
        transport: http(MONAD_RPC_URL),
      }),
    []
  );

  const bundlerClient = useMemo(() => {
    if (!BUNDLER_RPC_URL) {
      console.warn(
        "BUNDLER_RPC_URL not configured, bundler client will not be available"
      );
      return null;
    }

    try {
      return createBundlerClient({
        client: publicClient,
        transport: http(BUNDLER_RPC_URL),
      });
    } catch (error) {
      console.warn("Failed to create bundler client:", error);
      return null;
    }
  }, [publicClient]);

  // Generate deterministic salt based on owner address
  // This ensures the same owner always gets the same smart account address
  const generateDeterministicSalt = useCallback((ownerAddress: Address) => {
    // Create a consistent salt based on owner address
    return keccak256(encodePacked(["address"], [ownerAddress]));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Safe state setter that checks if component is still mounted
  const safeSetError = useCallback((error: string | null) => {
    if (isMountedRef.current) {
      setError(error);
    }
  }, []);

  const safeSetIsLoading = useCallback((loading: boolean) => {
    if (isMountedRef.current) {
      setIsLoading(loading);
    }
  }, []);

  const safeSetSmartAccount = useCallback((account: unknown) => {
    if (isMountedRef.current) {
      setSmartAccount(account);
    }
  }, []);

  const safeSetSmartAccountAddress = useCallback((address: Address | null) => {
    if (isMountedRef.current) {
      setSmartAccountAddress(address);
    }
  }, []);

  const safeSetIsDeployed = useCallback((deployed: boolean) => {
    if (isMountedRef.current) {
      setIsDeployed(deployed);
    }
  }, []);

  const safeSetBalance = useCallback((balance: string) => {
    if (isMountedRef.current) {
      setBalance(balance);
    }
  }, []);

  const safeSetDelegations = useCallback(
    (delegations: Delegation[] | ((prev: Delegation[]) => Delegation[])) => {
      if (isMountedRef.current) {
        setDelegations(delegations);
      }
    },
    []
  );

  // Create smart account
  const createSmartAccount = useCallback(async () => {
    if (!isConnected) {
      safeSetError("Please connect your wallet first");
      return;
    }

    if (!address) {
      safeSetError("No wallet address found");
      return;
    }

    if (!MONAD_RPC_URL || !BUNDLER_RPC_URL) {
      safeSetError(
        "Missing RPC configuration. Please check environment variables."
      );
      return;
    }

    safeSetIsLoading(true);
    safeSetError(null);

    try {
      // Get and validate MetaMask provider
      const provider = await getMetaMaskProviderSafe();

      if (!provider) {
        throw new Error("MetaMask not found. Please install MetaMask.");
      }

      // Check current chain and switch if needed
      const currentChainId = (await provider.request({
        method: "eth_chainId",
      })) as string;
      const chainIdDecimal = parseInt(currentChainId, 16);

      if (chainIdDecimal !== monadTestnet.id) {
        try {
          // Try to switch to Monad Testnet
          await provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${monadTestnet.id.toString(16)}` }],
          });

          // Wait a moment for the switch to complete
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Verify the switch was successful
          const newChainId = (await provider.request({
            method: "eth_chainId",
          })) as string;
          const newChainIdDecimal = parseInt(newChainId, 16);

          if (newChainIdDecimal !== monadTestnet.id) {
            throw new Error(
              "Failed to switch to Monad Testnet. Please switch manually."
            );
          }
        } catch (switchError: any) {
          // If the chain doesn't exist in the wallet, try to add it
          if (switchError.code === 4902) {
            try {
              await provider.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: `0x${monadTestnet.id.toString(16)}`,
                    chainName: monadTestnet.name,
                    nativeCurrency: monadTestnet.nativeCurrency,
                    rpcUrls: monadTestnet.rpcUrls.default.http,
                    blockExplorerUrls: [
                      monadTestnet.blockExplorers.default.url,
                    ],
                  },
                ],
              });

              // Wait for the chain to be added and switched
              await new Promise((resolve) => setTimeout(resolve, 2000));
            } catch (addError) {
              console.error("Error adding Monad Testnet to wallet:", addError);
              throw new Error(
                `Please add Monad Testnet to your wallet manually. Chain ID: ${monadTestnet.id}`
              );
            }
          } else {
            throw new Error(
              `Please switch your wallet to Monad Testnet (Chain ID: ${monadTestnet.id}). Currently on chain ${chainIdDecimal}.`
            );
          }
        }
      }

      // Get the owner address
      const ownerAddress = address as Address;

      // Create wallet client with the account
      const walletClient = createWalletClient({
        account: ownerAddress,
        chain: monadTestnet,
        transport: custom(provider),
      });

      // Generate deterministic salt for consistent smart account address
      const salt = generateDeterministicSalt(ownerAddress);

      // Create MetaMask Smart Account (Hybrid implementation)
      const account = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [ownerAddress, [], [], []], // [eoaOwner, passkeyIds, xCoords, yCoords]
        deploySalt: salt, // Use deterministic salt
        signer: {
          account: {
            address: ownerAddress,
            async signMessage({ message }: { message: any }) {
              // Use walletClient to sign
              return await walletClient.signMessage({
                account: ownerAddress,
                message,
              });
            },
            async signTypedData(typedData: any) {
              // Use walletClient to sign typed data
              return await walletClient.signTypedData({
                account: ownerAddress,
                ...typedData,
              });
            },
          },
        },
      });

      safeSetSmartAccount(account);
      safeSetSmartAccountAddress(account.address);

      // ✅ Store smart account data using the storage utility
      SmartAccountStorage.save(ownerAddress, {
        address: account.address,
        type: "eoa", // Default to EOA for now
        eoaOwner: ownerAddress,
      });

      // Check if deployed
      const code = await publicClient.getBytecode({ address: account.address });
      safeSetIsDeployed(code !== undefined && code !== "0x");

      // Get balance
      const accountBalance = await publicClient.getBalance({
        address: account.address,
      });
      safeSetBalance(accountBalance.toString());
    } catch (err: unknown) {
      console.error("Error creating smart account:", err);
      safeSetError(
        err instanceof Error ? err.message : "Failed to create smart account"
      );
    } finally {
      safeSetIsLoading(false);
    }
  }, [
    isConnected,
    address,
    publicClient,
    generateDeterministicSalt,
    safeSetError,
    safeSetIsLoading,
    safeSetSmartAccount,
    safeSetSmartAccountAddress,
    safeSetIsDeployed,
    safeSetBalance,
  ]);

  // Deploy smart account (if not already deployed)
  const deploySmartAccount = useCallback(async () => {
    if (!smartAccount || isDeployed) {
      console.log("Smart account already deployed or not created yet");
      return;
    }

    if (!bundlerClient) {
      console.warn("Bundler client not available, skipping deployment");
      safeSetError(
        "Bundler not available for Monad Testnet. Smart account will be deployed on first transaction."
      );
      return;
    }

    safeSetIsLoading(true);
    safeSetError(null);

    try {
      if (!bundlerClient) {
        throw new Error("Bundler client not available");
      }

      const userOpHash = await bundlerClient.sendUserOperation({
        account: smartAccount as any,
        calls: [], // Empty calls - just deploying the account
      });

      // Wait for the user operation to be included in a block
      const receipt = await bundlerClient.waitForUserOperationReceipt({
        hash: userOpHash,
      });

      console.log("Smart account deployment receipt:", receipt);

      safeSetIsDeployed(true);

      // Refresh balance after deployment
      if (smartAccountAddress) {
        const accountBalance = await publicClient.getBalance({
          address: smartAccountAddress,
        });
        safeSetBalance(accountBalance.toString());
      }
    } catch (err: unknown) {
      console.error("Error deploying smart account:", err);
      safeSetError(
        err instanceof Error ? err.message : "Failed to deploy smart account"
      );
    } finally {
      safeSetIsLoading(false);
    }
  }, [
    smartAccount,
    isDeployed,
    bundlerClient,
    smartAccountAddress,
    publicClient,
    safeSetIsLoading,
    safeSetError,
    safeSetIsDeployed,
    safeSetBalance,
  ]);

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

      safeSetIsLoading(true);
      try {
        // Create delegation using ERC-7710
        // TODO: Implement proper ERC-7710 delegation signing
        // const delegation = {
        //   delegate: delegateAddress,
        //   authority: targetContract,
        //   caveats: [
        //     {
        //       enforcer: process.env
        //         .NEXT_PUBLIC_CAVEAT_ENFORCER_ADDRESS as Address,
        //       terms: encodeCaveats({
        //         maxAmount: parseEther("1000"),
        //         allowedFunctions: [functionSelector],
        //         validUntil: BigInt(
        //           Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
        //         ),
        //       }),
        //     },
        //   ],
        // };

        // For now, store delegation data locally
        const newDelegation: Delegation = {
          id: `${delegateAddress}-${targetContract}-${functionSelector}`,
          delegate: delegateAddress,
          contract: targetContract,
          selector: functionSelector,
          validUntil: BigInt(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60),
        };

        safeSetDelegations((prev) => [...prev, newDelegation]);

        return newDelegation;
      } catch (err: unknown) {
        console.error("Error creating delegation:", err);
        throw err;
      } finally {
        safeSetIsLoading(false);
      }
    },
    [smartAccount, safeSetIsLoading, safeSetDelegations]
  );

  // Refresh smart account data
  const refreshSmartAccount = useCallback(async () => {
    if (!smartAccountAddress) return;

    try {
      const code = await publicClient.getBytecode({
        address: smartAccountAddress,
      });
      safeSetIsDeployed(code !== undefined && code !== "0x");

      const accountBalance = await publicClient.getBalance({
        address: smartAccountAddress,
      });
      safeSetBalance(accountBalance.toString());
    } catch (err) {
      console.error("Error refreshing smart account:", err);
    }
  }, [smartAccountAddress, publicClient, safeSetIsDeployed, safeSetBalance]);

  // Load saved smart account on mount
  useEffect(() => {
    const loadSavedSmartAccount = async () => {
      if (!isConnected || !address) return;

      try {
        const smartAccountData = SmartAccountStorage.load(address);

        if (smartAccountData) {
          safeSetSmartAccountAddress(smartAccountData.address);

          // Check if it's deployed
          const code = await publicClient.getBytecode({
            address: smartAccountData.address,
          });
          safeSetIsDeployed(code !== undefined && code !== "0x");

          // Get balance
          const balance = await publicClient.getBalance({
            address: smartAccountData.address,
          });
          safeSetBalance(balance.toString());
        }
      } catch (err) {
        console.error("Error loading saved smart account:", err);
      }
    };

    loadSavedSmartAccount();
  }, [
    isConnected,
    address,
    publicClient,
    safeSetSmartAccountAddress,
    safeSetIsDeployed,
    safeSetBalance,
  ]);

  useEffect(() => {
    if (isConnected && smartAccountAddress) {
      refreshSmartAccount();
    }
  }, [isConnected, smartAccountAddress, refreshSmartAccount]);

  useEffect(() => {
    if (!isConnected) {
      // Clear smart account data
      setSmartAccount(null);
      setSmartAccountAddress(null);
      setIsDeployed(false);
      setBalance("0");
      setDelegations([]);
      setError(null);

      // Clear smart account storage when disconnecting
      if (address) {
        SmartAccountStorage.clear(address);
      }
    }
  }, [isConnected, address]);

  return {
    smartAccount,
    address: smartAccountAddress,
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

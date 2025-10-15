import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther } from "viem";
import { CONTRACT_ADDRESSES } from "@/components/contract/addresses";
import FiYieldVaultABI from "@/components/contract/abis/FiYieldVault.json";

// Extract the ABI array from the JSON object
const vaultABI = FiYieldVaultABI.abi;
import { VaultInfo } from "@/components/contract/types";

export function useVaultInfo() {
  const { data: totalAssets } = useReadContract({
    address: CONTRACT_ADDRESSES.FI_YIELD_VAULT,
    abi: vaultABI,
    functionName: "totalAssets",
  });

  const { data: totalSupply } = useReadContract({
    address: CONTRACT_ADDRESSES.FI_YIELD_VAULT,
    abi: vaultABI,
    functionName: "totalSupply",
  });

  const { data: asset } = useReadContract({
    address: CONTRACT_ADDRESSES.FI_YIELD_VAULT,
    abi: vaultABI,
    functionName: "asset",
  });

  const { data: strategy } = useReadContract({
    address: CONTRACT_ADDRESSES.FI_YIELD_VAULT,
    abi: vaultABI,
    functionName: "strategy",
  });

  return {
    totalAssets: totalAssets || BigInt(0),
    totalSupply: totalSupply || BigInt(0),
    asset: asset || "0x0",
    strategy: strategy || "0x0",
    paused: false, // Our contract doesn't have a paused function
  } as VaultInfo;
}

// FIXED: Hook for depositing into vault
export function useVaultDeposit(vaultAddress?: string) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const deposit = async (
    amount: string,
    receiver: string,
    tokenDecimals: number = 18
  ) => {
    try {
      // Parse amount based on token decimals
      let assets: bigint;

      if (tokenDecimals === 6) {
        // For USDC (6 decimals)
        assets = BigInt(Math.floor(parseFloat(amount) * 1e6));
      } else if (tokenDecimals === 8) {
        // For WBTC (8 decimals)
        assets = BigInt(Math.floor(parseFloat(amount) * 1e8));
      } else {
        // For 18 decimals (default)
        assets = parseEther(amount);
      }

      // Use the provided vault address or fallback to default
      const targetVault = vaultAddress || CONTRACT_ADDRESSES.FI_YIELD_VAULT;


      // Return the promise so it can be awaited
      return writeContract({
        address: targetVault as `0x${string}`,
        abi: vaultABI,
        functionName: "deposit",
        args: [assets, receiver as `0x${string}`],
      });
    } catch (err) {
      console.error("Error in deposit function:", err);
      throw err;
    }
  };

  return {
    deposit,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

// FIXED: Hook for withdrawing from vault
export function useVaultWithdraw() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const withdraw = async (amount: string) => {
    try {

      const assets = parseEther(amount);

      return writeContract({
        address: CONTRACT_ADDRESSES.FI_YIELD_VAULT as `0x${string}`,
        abi: vaultABI,
        functionName: "withdraw",
        args: [assets],
      });
    } catch (err) {
      console.error("Error in withdraw function:", err);
      throw err;
    }
  };

  return {
    withdraw,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

// Hook for setting strategy
export function useSetStrategy() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const setStrategy = async (strategyAddress: string) => {
    try {
      return writeContract({
        address: CONTRACT_ADDRESSES.FI_YIELD_VAULT as `0x${string}`,
        abi: vaultABI,
        functionName: "setStrategy",
        args: [strategyAddress as `0x${string}`],
      });
    } catch (err) {
      console.error("Error in setStrategy function:", err);
      throw err;
    }
  };

  return {
    setStrategy,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

// Hook for emergency withdraw
export function useEmergencyWithdraw() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const emergencyWithdraw = async () => {
    try {
      return writeContract({
        address: CONTRACT_ADDRESSES.FI_YIELD_VAULT as `0x${string}`,
        abi: vaultABI,
        functionName: "emergencyWithdraw",
      });
    } catch (err) {
      console.error("Error in emergencyWithdraw function:", err);
      throw err;
    }
  };

  return {
    emergencyWithdraw,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

// Hook for checking vault balance
export function useVaultBalance() {
  const { address } = useAccount();
  const {
    data: balance,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: CONTRACT_ADDRESSES.FI_YIELD_VAULT as `0x${string}`,
    abi: vaultABI,
    functionName: "getBalance",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  return {
    balance: balance || BigInt(0),
    isLoading,
    error,
    refetch,
  };
}

// Hook for sending vault tokens
export function useVaultSend() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const send = async (to: string, amount: string) => {
    try {
      const shares = parseEther(amount);

      // Use sendShares function to transfer shares to recipient
      return writeContract({
        address: CONTRACT_ADDRESSES.FI_YIELD_VAULT as `0x${string}`,
        abi: vaultABI,
        functionName: "sendShares",
        args: [to as `0x${string}`, shares],
      });
    } catch (err) {
      console.error("Error in send function:", err);
      throw err;
    }
  };

  return {
    send,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

// Additional hook to check vault status
export function useVaultStatus() {
  const { data: totalAssets, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.FI_YIELD_VAULT as `0x${string}`,
    abi: vaultABI,
    functionName: "totalAssets",
  });

  return {
    totalAssets: totalAssets || BigInt(0),
    refetch,
  };
}

import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { CONTRACT_ADDRESSES } from "@/components/contract/addresses";
import AaveStrategyABI from "@/components/contract/abis/AaveStrategy.json";

// Use the generated ABI from deployed AaveStrategy contract
const AAVE_STRATEGY_ABI = AaveStrategyABI;

export function useAaveStrategyInfo() {
  const { data: totalAssets } = useReadContract({
    address: CONTRACT_ADDRESSES.AAVE_STRATEGY,
    abi: AAVE_STRATEGY_ABI,
    functionName: "totalAssets",
  });

  const { data: asset } = useReadContract({
    address: CONTRACT_ADDRESSES.AAVE_STRATEGY,
    abi: AAVE_STRATEGY_ABI,
    functionName: "asset",
  });

  const { data: vault } = useReadContract({
    address: CONTRACT_ADDRESSES.AAVE_STRATEGY,
    abi: AAVE_STRATEGY_ABI,
    functionName: "vault",
  });

  const { data: aavePool } = useReadContract({
    address: CONTRACT_ADDRESSES.AAVE_STRATEGY,
    abi: AAVE_STRATEGY_ABI,
    functionName: "aavePool",
  });

  const { data: aToken } = useReadContract({
    address: CONTRACT_ADDRESSES.AAVE_STRATEGY,
    abi: AAVE_STRATEGY_ABI,
    functionName: "aToken",
  });

  return {
    totalAssets: totalAssets || 0n,
    asset: asset || "0x0000000000000000000000000000000000000000",
    vault: vault || "0x0000000000000000000000000000000000000000",
    aavePool: aavePool || "0x0000000000000000000000000000000000000000",
    aToken: aToken || "0x0000000000000000000000000000000000000000",
  };
}

export function useAaveStrategyInvest() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const invest = async (amount: string) => {
    try {
      const amountWei = parseEther(amount);
      return writeContract({
        address: CONTRACT_ADDRESSES.AAVE_STRATEGY,
        abi: AAVE_STRATEGY_ABI,
        functionName: "invest",
        args: [amountWei],
      });
    } catch (err) {
      console.error("Error in invest function:", err);
      throw err;
    }
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return {
    invest,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function useAaveStrategyWithdraw() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const withdraw = async (amount: string) => {
    try {
      const amountWei = parseEther(amount);
      return writeContract({
        address: CONTRACT_ADDRESSES.AAVE_STRATEGY,
        abi: AAVE_STRATEGY_ABI,
        functionName: "withdraw",
        args: [amountWei],
      });
    } catch (err) {
      console.error("Error in withdraw function:", err);
      throw err;
    }
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return {
    withdraw,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function useAaveStrategyEmergencyWithdraw() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const emergencyWithdraw = async () => {
    try {
      return writeContract({
        address: CONTRACT_ADDRESSES.AAVE_STRATEGY,
        abi: AAVE_STRATEGY_ABI,
        functionName: "emergencyWithdraw",
        args: [],
      });
    } catch (err) {
      console.error("Error in emergencyWithdraw function:", err);
      throw err;
    }
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return {
    emergencyWithdraw,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function useAaveStrategyBalance() {
  const { data: totalAssets } = useReadContract({
    address: CONTRACT_ADDRESSES.AAVE_STRATEGY,
    abi: AAVE_STRATEGY_ABI,
    functionName: "totalAssets",
  });

  const balanceFormatted = totalAssets 
    ? (parseFloat(formatEther(totalAssets))).toFixed(2)
    : "0.00";

  return {
    balance: totalAssets || 0n,
    balanceFormatted,
  };
}

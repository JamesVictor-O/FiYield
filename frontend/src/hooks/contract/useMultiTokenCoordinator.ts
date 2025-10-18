import { useWriteContract, useReadContract } from "wagmi";
import { CONTRACT_ADDRESSES } from "@/components/contract/addresses";
import { parseEther, formatEther } from "viem";
import MultiTokenCoordinatorVaultABI from "@/components/contract/abis/MultiTokenCoordinatorVault.json";

// ABI for MultiTokenCoordinatorVault
const MULTI_TOKEN_COORDINATOR_ABI = MultiTokenCoordinatorVaultABI;

export function useMultiTokenCoordinator() {
  const { writeContract, isPending, error } = useWriteContract();

  const deposit = async (tokenAddress: string, amount: string) => {
    try {
      // Convert amount to proper decimals based on token
      let parsedAmount: bigint;

      if (tokenAddress === CONTRACT_ADDRESSES.USDC) {
        // USDC has 6 decimals
        parsedAmount = BigInt(Math.floor(parseFloat(amount) * 1e6));
      } else if (tokenAddress === CONTRACT_ADDRESSES.WRAPPED_BTC) {
        // WBTC has 8 decimals
        parsedAmount = BigInt(Math.floor(parseFloat(amount) * 1e8));
      } else {
        // Default to 18 decimals (CURR, MockUSDC)
        parsedAmount = parseEther(amount);
      }

      return writeContract({
        address: CONTRACT_ADDRESSES.MULTI_TOKEN_COORDINATOR as `0x${string}`,
        abi: MULTI_TOKEN_COORDINATOR_ABI,
        functionName: "deposit",
        args: [tokenAddress as `0x${string}`, parsedAmount],
      });
    } catch (err) {
      console.error("Error in deposit:", err);
      throw err;
    }
  };

  const withdraw = async (tokenAddress: string, amount: string) => {
    try {
      // Convert amount to proper decimals based on token
      let parsedAmount: bigint;

      if (tokenAddress === CONTRACT_ADDRESSES.USDC) {
        // USDC has 6 decimals
        parsedAmount = BigInt(Math.floor(parseFloat(amount) * 1e6));
      } else if (tokenAddress === CONTRACT_ADDRESSES.WRAPPED_BTC) {
        // WBTC has 8 decimals
        parsedAmount = BigInt(Math.floor(parseFloat(amount) * 1e8));
      } else {
        // Default to 18 decimals (CURR, MockUSDC)
        parsedAmount = parseEther(amount);
      }

      return writeContract({
        address: CONTRACT_ADDRESSES.MULTI_TOKEN_COORDINATOR as `0x${string}`,
        abi: MULTI_TOKEN_COORDINATOR_ABI,
        functionName: "withdraw",
        args: [tokenAddress as `0x${string}`, parsedAmount],
      });
    } catch (err) {
      console.error("Error in withdraw:", err);
      throw err;
    }
  };

  return {
    deposit,
    withdraw,
    isPending,
    error,
  };
}

export function useMultiTokenBalance(userAddress?: string) {
  const { data: totalValue, error: totalValueError } = useReadContract({
    address: CONTRACT_ADDRESSES.MULTI_TOKEN_COORDINATOR as `0x${string}`,
    abi: MULTI_TOKEN_COORDINATOR_ABI,
    functionName: "getUserTotalValue",
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    query: { enabled: !!userAddress },
  });

  const { data: usdcBalance, error: usdcBalanceError } = useReadContract({
    address: CONTRACT_ADDRESSES.MULTI_TOKEN_COORDINATOR as `0x${string}`,
    abi: MULTI_TOKEN_COORDINATOR_ABI,
    functionName: "getUserTokenBalance",
    args:
      userAddress && CONTRACT_ADDRESSES.USDC
        ? [
            userAddress as `0x${string}`,
            CONTRACT_ADDRESSES.USDC as `0x${string}`,
          ]
        : undefined,
    query: { enabled: !!userAddress && !!CONTRACT_ADDRESSES.USDC },
  });

  const { data: wbtcBalance, error: wbtcBalanceError } = useReadContract({
    address: CONTRACT_ADDRESSES.MULTI_TOKEN_COORDINATOR as `0x${string}`,
    abi: MULTI_TOKEN_COORDINATOR_ABI,
    functionName: "getUserTokenBalance",
    args:
      userAddress && CONTRACT_ADDRESSES.WRAPPED_BTC
        ? [
            userAddress as `0x${string}`,
            CONTRACT_ADDRESSES.WRAPPED_BTC as `0x${string}`,
          ]
        : undefined,
    query: { enabled: !!userAddress && !!CONTRACT_ADDRESSES.WRAPPED_BTC },
  });

  const { data: currBalance, error: currBalanceError } = useReadContract({
    address: CONTRACT_ADDRESSES.MULTI_TOKEN_COORDINATOR as `0x${string}`,
    abi: MULTI_TOKEN_COORDINATOR_ABI,
    functionName: "getUserTokenBalance",
    args:
      userAddress && CONTRACT_ADDRESSES.CURRANCES
        ? [
            userAddress as `0x${string}`,
            CONTRACT_ADDRESSES.CURRANCES as `0x${string}`,
          ]
        : undefined,
    query: { enabled: !!userAddress && !!CONTRACT_ADDRESSES.CURRANCES },
  });

  const { data: mockUsdcBalance, error: mockUsdcBalanceError } =
    useReadContract({
      address: CONTRACT_ADDRESSES.MULTI_TOKEN_COORDINATOR as `0x${string}`,
      abi: MULTI_TOKEN_COORDINATOR_ABI,
      functionName: "getUserTokenBalance",
      args:
        userAddress && CONTRACT_ADDRESSES.MOCK_USDC
          ? [
              userAddress as `0x${string}`,
              CONTRACT_ADDRESSES.MOCK_USDC as `0x${string}`,
            ]
          : undefined,
      query: { enabled: !!userAddress && !!CONTRACT_ADDRESSES.MOCK_USDC },
    });

  return {
    totalValue: totalValue ? Number(formatEther(totalValue as bigint)) : 0,
    usdcBalance: usdcBalance ? Number(formatEther(usdcBalance as bigint)) : 0,
    wbtcBalance: wbtcBalance ? Number(formatEther(wbtcBalance as bigint)) : 0,
    currBalance: currBalance ? Number(formatEther(currBalance as bigint)) : 0,
    mockUsdcBalance: mockUsdcBalance
      ? Number(formatEther(mockUsdcBalance as bigint))
      : 0,
    error:
      totalValueError ||
      usdcBalanceError ||
      wbtcBalanceError ||
      currBalanceError ||
      mockUsdcBalanceError,
  };
}

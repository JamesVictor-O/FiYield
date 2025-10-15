import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, formatEther, erc20Abi } from "viem";
import { CONTRACT_ADDRESSES } from "@/components/contract/addresses";

// Use the standard ERC20 ABI from viem
const ERC20_ABI = erc20Abi;

// Hook for reading ERC20 token information
export function useERC20Info(tokenAddress: string) {
  const { data: balance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [CONTRACT_ADDRESSES.YIELDMAKER_VAULT],
  });

  const { data: decimals } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "decimals",
  });

  const { data: symbol } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "symbol",
  });

  return {
    balance: balance || BigInt(0),
    decimals: decimals || 18,
    symbol: symbol || "TOKEN",
  };
}

// Hook for user's token balance
export function useUserTokenBalance(
  tokenAddress: string,
  userAddress?: string
) {
  const { data: balance, refetch } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    query: { enabled: !!userAddress },
  });

  const { data: decimals } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "decimals",
  });

  // Format balance based on token decimals
  const formatBalance = (balance: bigint, decimals: number) => {
    if (decimals === 6) {
      // For USDC (6 decimals)
      return (Number(balance) / 1e6).toFixed(6);
    } else if (decimals === 8) {
      // For WBTC (8 decimals)
      return (Number(balance) / 1e8).toFixed(8);
    } else {
      // For 18 decimals (default)
      return formatEther(balance);
    }
  };

  return {
    balance: balance || BigInt(0),
    formatted: balance && decimals ? formatBalance(balance, decimals) : "0",
    decimals: decimals || 18,
    refetch,
  };
}

// Hook for token approval
export function useTokenApproval(tokenAddress: string) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const { data: decimals } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "decimals",
  });

  const approve = (spender: string, amount: string) => {
    if (!amount || amount === "0") {
      console.error("Invalid amount for approval:", amount);
      return;
    }

    // Parse amount based on token decimals
    let amountWei: bigint;
    const tokenDecimals = decimals || 18;

    if (tokenDecimals === 6) {
      // For USDC (6 decimals)
      amountWei = BigInt(Math.floor(parseFloat(amount) * 1e6));
    } else if (tokenDecimals === 8) {
      // For WBTC (8 decimals)
      amountWei = BigInt(Math.floor(parseFloat(amount) * 1e8));
    } else {
      // For 18 decimals (default)
      amountWei = parseEther(amount);
    }

    try {
      writeContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [spender as `0x${string}`, amountWei],
      });
    } catch (error) {
      console.error("Error calling writeContract:", error);
    }
  };

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

// Hook for checking allowance
export function useTokenAllowance(
  tokenAddress: string,
  owner: string,
  spender: string
) {
  const { data: allowance, refetch } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [owner as `0x${string}`, spender as `0x${string}`],
  });

  return {
    allowance: allowance || BigInt(0),
    formatted: allowance ? formatEther(allowance) : "0",
    refetch,
  };
}

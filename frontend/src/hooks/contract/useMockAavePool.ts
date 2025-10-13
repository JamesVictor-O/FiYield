import { useReadContract } from "wagmi";
import { formatEther } from "viem";
import { CONTRACT_ADDRESSES } from "@/components/contract/addresses";
import MockAavePoolABI from "@/components/contract/abis/MockAavePool.json";

// Use the generated ABI from deployed MockAavePool contract
const MOCK_AAVE_POOL_ABI = MockAavePoolABI;

export function useMockAavePoolInfo() {
  const { data: currentAPY } = useReadContract({
    address: CONTRACT_ADDRESSES.MOCK_AAVE_POOL,
    abi: MOCK_AAVE_POOL_ABI,
    functionName: "getCurrentAPY",
    args: [CONTRACT_ADDRESSES.MOCK_USDC],
  });

  const { data: reserveData } = useReadContract({
    address: CONTRACT_ADDRESSES.MOCK_AAVE_POOL,
    abi: MOCK_AAVE_POOL_ABI,
    functionName: "getReserveData",
    args: [CONTRACT_ADDRESSES.MOCK_USDC],
  });

  return {
    currentAPY: currentAPY || 0n,
    reserveData: reserveData || {
      configuration: 0n,
      liquidityIndex: 0n,
      currentLiquidityRate: 0n,
      variableBorrowIndex: 0n,
      currentVariableBorrowRate: 0n,
      currentStableBorrowRate: 0n,
      lastUpdateTimestamp: 0n,
      id: 0n,
      aTokenAddress: "0x0000000000000000000000000000000000000000",
      stableDebtTokenAddress: "0x0000000000000000000000000000000000000000",
      variableDebtTokenAddress: "0x0000000000000000000000000000000000000000",
      interestRateStrategyAddress: "0x0000000000000000000000000000000000000000",
      accruedToTreasury: 0n,
      unbacked: 0n,
      isolationModeTotalDebt: 0n,
    },
  };
}

export function useMockAavePoolAPY() {
  const { data: currentAPY, isLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.MOCK_AAVE_POOL,
    abi: MOCK_AAVE_POOL_ABI,
    functionName: "getCurrentAPY",
    args: [CONTRACT_ADDRESSES.MOCK_USDC],
  });

  const apyDisplay = currentAPY
    ? (parseFloat(formatEther(currentAPY)) * 100).toFixed(2) + "%"
    : "0.00%";

  return {
    apy: currentAPY || 0n,
    apyDisplay,
    isLoading,
  };
}

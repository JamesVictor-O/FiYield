import { useReadContract } from "wagmi";
import { formatEther } from "viem";
import { CONTRACT_ADDRESSES } from "@/components/contract/addresses";
import MockAavePoolABI from "@/components/contract/abis/MockAavePool.json";

// Use the generated ABI from deployed MockAavePool contract
const MOCK_AAVE_POOL_ABI = MockAavePoolABI as any;

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
    currentAPY: currentAPY || BigInt(0),
    reserveData: reserveData || {
      configuration: BigInt(0),
      liquidityIndex: BigInt(0),
      currentLiquidityRate: BigInt(0),
      variableBorrowIndex: BigInt(0),
      currentVariableBorrowRate: BigInt(0),
      currentStableBorrowRate: BigInt(0),
      lastUpdateTimestamp: BigInt(0),
      id: BigInt(0),
      aTokenAddress: "0x0000000000000000000000000000000000000000",
      stableDebtTokenAddress: "0x0000000000000000000000000000000000000000",
      variableDebtTokenAddress: "0x0000000000000000000000000000000000000000",
      interestRateStrategyAddress: "0x0000000000000000000000000000000000000000",
      accruedToTreasury: BigInt(0),
      unbacked: BigInt(0),
      isolationModeTotalDebt: BigInt(0),
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
    ? (parseFloat(formatEther(currentAPY as bigint)) * 100).toFixed(2) + "%"
    : "0.00%";

  return {
    apy: currentAPY || BigInt(0),
    apyDisplay,
    isLoading,
  };
}

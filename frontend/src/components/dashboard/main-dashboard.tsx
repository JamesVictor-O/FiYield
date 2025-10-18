import React, { useState, useEffect } from "react";
import { User } from "@/types";
import WelcomeFlow from "./WelcomeFlow";
import FundsManagement from "./FundsManagement";
import StrategyManager from "../manager/StrategyManager";
import AIDelegationModal from "./modals/ai-delegation-modal";
import { useVaultBalance, useVaultInfo } from "@/hooks/contract/useVault";
import { useAvailableStrategies } from "@/hooks/contract/useStrategies";
import { useMockAavePoolAPY } from "@/hooks/contract/useMockAavePool";
import { useAaveStrategyBalance } from "@/hooks/contract/useAaveStrategy";
import { useAccount, useReadContract } from "wagmi";
import { CONTRACT_ADDRESSES } from "@/components/contract/addresses";
import FiYieldVaultABI from "@/components/contract/abis/FiYieldVault.json";

interface MainDashboardProps {
  user: User;
  onOnboardingComplete?: (
    riskProfile: "conservative" | "moderate" | "aggressive"
  ) => void;
}

const MainDashboard: React.FC<MainDashboardProps> = ({
  user,
  onOnboardingComplete,
}) => {
  const [showWelcome, setShowWelcome] = useState(user.isNewUser);
  const [userInitialDeposit, setUserInitialDeposit] = useState(0);
  const [showDelegationModal, setShowDelegationModal] = useState(false);

  const { address } = useAccount();

  // Smart contract hooks for real-time data
  const { balance: vaultBalance, isLoading: balanceLoading } =
    useVaultBalance();
  const { strategy: currentStrategy } = useVaultInfo();

  // Direct contract call for debugging
  const { data: directVaultBalance, error: directVaultError } = useReadContract(
    {
      address: CONTRACT_ADDRESSES.FI_YIELD_VAULT as `0x${string}`,
      abi: FiYieldVaultABI.abi,
      functionName: "getBalance",
      args: address ? [address as `0x${string}`] : undefined,
      query: { enabled: !!address },
    }
  );

  // Check vault's total assets to see if there's any money in the vault
  const { data: totalAssets, error: totalAssetsError } = useReadContract({
    address: CONTRACT_ADDRESSES.FI_YIELD_VAULT as `0x${string}`,
    abi: FiYieldVaultABI.abi,
    functionName: "totalAssets",
    query: { enabled: !!address },
  });

  // Check vault's asset address to confirm it's using MockUSDC
  const { data: vaultAsset, error: vaultAssetError } = useReadContract({
    address: CONTRACT_ADDRESSES.FI_YIELD_VAULT as `0x${string}`,
    abi: FiYieldVaultABI.abi,
    functionName: "asset",
    query: { enabled: !!address },
  });

  // Check strategy's total assets to see if funds are there
  const { data: strategyAssets, error: strategyAssetsError } = useReadContract({
    address: currentStrategy as `0x${string}`,
    abi: [
      {
        inputs: [],
        name: "totalAssets",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "totalAssets",
    query: { enabled: !!currentStrategy && currentStrategy !== "0x0" },
  });

  const availableStrategies = useAvailableStrategies();

  
  const {} = useMockAavePoolAPY();

  // Get Aave strategy balance
  const {} = useAaveStrategyBalance();

  // Convert vault balance to readable format - MockUSDC has 6 decimals, not 18
  const vaultBalanceFormatted =
    vaultBalance && typeof vaultBalance === "bigint"
      ? Number(vaultBalance) / 1e6 // MockUSDC has 6 decimals
      : 0;

  // Use the vault balance from the main FI_YIELD_VAULT
  // If funds are invested in strategy, use strategy balance instead
  const strategyBalanceFormatted = strategyAssets
    ? Number(strategyAssets) / 1e6
    : 0;
  const userBalance =
    strategyBalanceFormatted > 0
      ? strategyBalanceFormatted
      : vaultBalanceFormatted || 0;

  // Debug logging
  useEffect(() => {
    console.log("🔍 Balance Debug Info:", {
      address,
      vaultBalance: vaultBalance?.toString(),
      vaultBalanceFormatted,
      userBalance,
      userInitialDeposit,
      currentStrategy,
      availableStrategies: availableStrategies.map((s) => ({
        name: s.name,
        address: s.address,
      })),
      // Additional debugging
      vaultBalanceType: typeof vaultBalance,
      vaultBalanceValue: vaultBalance,
      isVaultBalanceZero: vaultBalance === BigInt(0),
      isVaultBalanceNull: vaultBalance === null,
      isVaultBalanceUndefined: vaultBalance === undefined,
      // Contract address debugging
      fiYieldVaultAddress: CONTRACT_ADDRESSES.FI_YIELD_VAULT,
      mockUsdcVaultAddress: CONTRACT_ADDRESSES.MOCK_USDC_VAULT,
      addressesMatch:
        CONTRACT_ADDRESSES.FI_YIELD_VAULT ===
        CONTRACT_ADDRESSES.MOCK_USDC_VAULT,
      // Direct contract call debugging
      directVaultBalance: directVaultBalance?.toString(),
      directVaultError: directVaultError?.message,
      directVaultBalanceFormatted: directVaultBalance
        ? Number(directVaultBalance) / 1e6
        : 0,
      // Vault state debugging
      totalAssets: totalAssets?.toString(),
      totalAssetsError: totalAssetsError?.message,
      totalAssetsFormatted: totalAssets ? Number(totalAssets) / 1e6 : 0,
      vaultAsset: vaultAsset,
      vaultAssetError: vaultAssetError?.message,
      expectedMockUsdc: CONTRACT_ADDRESSES.MOCK_USDC,
      assetMatches: vaultAsset === CONTRACT_ADDRESSES.MOCK_USDC,
      // Strategy debugging
      strategyAssets: strategyAssets?.toString(),
      strategyAssetsError: strategyAssetsError?.message,
      strategyAssetsFormatted: strategyAssets
        ? Number(strategyAssets) / 1e6
        : 0,
      // Combined balance logic
      strategyBalanceFormatted,
      finalUserBalance: userBalance,
    });
  }, [
    address,
    vaultBalance,
    vaultBalanceFormatted,
    userBalance,
    userInitialDeposit,
    currentStrategy,
    availableStrategies,
    directVaultBalance,
    directVaultError,
    totalAssets,
    totalAssetsError,
    vaultAsset,
    vaultAssetError,
    strategyAssets,
    strategyAssetsError,
    strategyBalanceFormatted,
  ]);

  // Load user's initial deposit from localStorage (or could be from blockchain events)
  useEffect(() => {
    if (address) {
      const savedInitialDeposit = localStorage.getItem(
        `initialDeposit_${address}`
      );
      if (savedInitialDeposit) {
        setUserInitialDeposit(parseFloat(savedInitialDeposit));
      } else {
        if (vaultBalanceFormatted > 0) {
          setUserInitialDeposit(vaultBalanceFormatted);
          localStorage.setItem(
            `initialDeposit_${address}`,
            vaultBalanceFormatted.toString()
          );
        }
      }
    }
  }, [address, vaultBalanceFormatted]);

  // Calculate real earnings - with proper defaults
  const realEarnings = Math.max(
    0,
    (userBalance || 0) - (userInitialDeposit || 0)
  );

  // Update initial deposit when user makes new deposits
  const handleBalanceUpdate = (newBalance: number) => {
    if (address && newBalance > userBalance) {
      // User made a deposit, update initial deposit tracker
      const additionalDeposit = newBalance - userBalance;
      const newInitialDeposit = (userInitialDeposit || 0) + additionalDeposit;
      setUserInitialDeposit(newInitialDeposit);
      localStorage.setItem(
        `initialDeposit_${address}`,
        newInitialDeposit.toString()
      );
    }
  };

  const handleWelcomeComplete = (
    riskProfile: "conservative" | "moderate" | "aggressive"
  ) => {
    user.riskProfile = riskProfile;
    setShowWelcome(false);

    if (onOnboardingComplete) {
      onOnboardingComplete(riskProfile);
    }
  };

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-[#101110]">
        <WelcomeFlow user={user} onComplete={handleWelcomeComplete} />
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (!num || num === 0) return "0";
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-[#101110] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white font-pop mb-2">
            Dashboard
          </h1>
          <p className="text-gray-400">
            Monitor your DeFi investments and earnings
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Portfolio */}
          <div className="bg-white/5 border h-fit border-white/10 rounded-2xl p-2 md:p-6 hover:border-white/20 transition-colors duration-300">
            <div className="flex items-center gap-3 md:mb-4">
              <div className="w-10 h-10 rounded-full hidden md:flex bg-white/5 border border-white/10 items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400 font-medium">
                  Total Portfolio
                </p>
                <h3 className="text-2xl font-bold text-white font-pop">
                  ${formatNumber(userBalance)}
                </h3>
              </div>
            </div>
          </div>

          {/* Current Earnings */}
          <div className="bg-white/5 border h-fit border-white/10 rounded-2xl p-2 md:p-6 hover:border-white/20 transition-colors duration-300">
            <div className="flex items-center gap-3 md:mb-4">
              <div className="w-10 h-10 hidden md:flex rounded-full bg-white/5 border border-white/10  items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400 font-medium">
                  Total Earnings
                </p>
                {balanceLoading ? (
                  <div className="w-20 h-8 bg-white/10 animate-pulse rounded"></div>
                ) : (
                  <h3 className="text-2xl font-bold text-green-400 font-pop">
                    ${formatNumber(realEarnings)}
                  </h3>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-400">
              {userInitialDeposit > 0
                ? `${((realEarnings / userInitialDeposit) * 100).toFixed(
                    2
                  )}% return`
                : "0% return"}
            </p>
          </div>

          {/* Risk Level */}
          <div className="bg-white/5 border h-fit border-white/10 rounded-2xl p-2 md:p-6 hover:border-white/20 transition-colors duration-300">
            <div className="flex items-center gap-3 md:mb-4">
              <div className="w-10 hidden md:flex h-10 rounded-full bg-white/5 border border-white/10  items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400 font-medium">
                  Risk Profile
                </p>
                <h3 className=" text-sm md:text-2xl font-bold text-white font-pop capitalize">
                  {user.riskProfile || "moderate"}
                </h3>
              </div>
            </div>
          </div>

          {/* Active Strategy */}
          <div className="bg-white/5 border h-fit border-white/10 rounded-2xl p-2 md:p-6 hover:border-white/20 transition-colors duration-300">
            <div className="flex  items-center gap-3 md:mb-4">
              <div className="w-10 h-10 hidden md:flex rounded-full bg-white/5 border border-white/10 items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400 font-medium">
                  Active Strategy
                </p>
                <h3 className="text-lg font-bold text-white font-pop">
                  {availableStrategies.find(
                    (s) => s.address === currentStrategy
                  )?.name || "Simple Hold"}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* AI Delegation Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white font-pop mb-1">
                    AI Portfolio Delegation
                  </h3>
                  <p className="text-sm text-blue-200">
                    Let our AI optimize your portfolio allocation and strategy
                    selection
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDelegationModal(true)}
                className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Delegate to AI
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Funds Management - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white font-pop">
                    Funds Management
                  </h2>
                  <p className="text-sm text-gray-400">
                    Deposit and withdraw funds
                  </p>
                </div>
              </div>
              <FundsManagement
                userBalance={userBalance}
                userInitialDeposit={userInitialDeposit}
                realEarnings={realEarnings}
                onBalanceUpdate={handleBalanceUpdate}
              />
            </div>
          </div>

          {/* Strategy Manager - Takes 1 column on large screens */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white font-pop">
                    Strategy Manager
                  </h2>
                  <p className="text-sm text-gray-400">
                    Manage your investment strategy
                  </p>
                </div>
              </div>
              <StrategyManager />
            </div>
          </div>
        </div>
      </div>

      {/* AI Delegation Modal */}
      <AIDelegationModal
        isOpen={showDelegationModal}
        onClose={() => setShowDelegationModal(false)}
        onDelegate={(preferences) => {
          console.log("AI Delegation preferences:", preferences);
          // Here you would implement the actual AI delegation logic
          // For now, we'll just show a success message
          alert(
            "Portfolio delegated to AI successfully! Your portfolio will be optimized based on your preferences."
          );
        }}
      />
    </div>
  );
};

export default MainDashboard;

import React, { useState, useEffect } from "react";
import { formatEther } from "viem";
import { User } from "@/types";
import WelcomeFlow from "./WelcomeFlow";
import FundsManagement from "./FundsManagement";
import StrategyManager from "../manager/StrategyManager";
import { useVaultBalance, useVaultInfo } from "@/hooks/contract/useVault";
import { useAvailableStrategies } from "@/hooks/contract/useStrategies";
import { useMockAavePoolAPY } from "@/hooks/contract/useMockAavePool";
import { useAaveStrategyBalance } from "@/hooks/contract/useAaveStrategy";
import { useAccount } from "wagmi";

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

  // Smart contract hooks for real-time data
  const { balance: vaultBalance, isLoading: balanceLoading } =
    useVaultBalance();
  const { totalAssets, strategy: currentStrategy } = useVaultInfo();
  const { address } = useAccount();

  const availableStrategies = useAvailableStrategies();

  // Get real-time APY from our deployed MockAavePool
  const { apyDisplay, isLoading: apyLoading } = useMockAavePoolAPY();

  // Get Aave strategy balance
  const { balanceFormatted: aaveStrategyBalance } = useAaveStrategyBalance();

  // Convert vault balance to readable format - handle BigInt properly
  const vaultBalanceFormatted =
    vaultBalance && typeof vaultBalance === "bigint"
      ? parseFloat(formatEther(vaultBalance))
      : 0;
  const totalAssetsFormatted =
    totalAssets && typeof totalAssets === "bigint"
      ? parseFloat(formatEther(totalAssets))
      : 0;

  // Use real vault balance instead of mock balance - with proper default
  const userBalance = vaultBalanceFormatted || 0;

  // Load user's initial deposit from localStorage (or could be from blockchain events)
  useEffect(() => {
    if (address) {
      const savedInitialDeposit = localStorage.getItem(
        `initialDeposit_${address}`
      );
      if (savedInitialDeposit) {
        setUserInitialDeposit(parseFloat(savedInitialDeposit));
      } else {
        // If no initial deposit saved, assume current balance is the initial deposit
        // This handles existing users who already have deposits
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

    // Mark onboarding as complete in the parent component
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Portfolio */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors duration-300">
            <div className="flex items-center gap-3 mb-4">
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
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
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
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors duration-300">
            <div className="flex items-center gap-3 mb-4">
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400 font-medium">
                  Risk Profile
                </p>
                <h3 className="text-2xl font-bold text-white font-pop capitalize">
                  {user.riskProfile || "moderate"}
                </h3>
              </div>
            </div>
          </div>

          {/* Active Strategy */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors duration-300">
            <div className="flex items-center gap-3 mb-4">
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

        {/* Recent Activity Section */}
        <div className="mt-8">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white font-pop">
                  Recent Activity
                </h2>
                <p className="text-sm text-gray-400">
                  Your latest transactions and updates
                </p>
              </div>
            </div>

            {/* Activity List */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-full bg-green-400/20 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    Deposit Successful
                  </p>
                  <p className="text-xs text-gray-400">2 hours ago</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-400">+$1,000</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-full bg-blue-400/20 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    Strategy Updated
                  </p>
                  <p className="text-xs text-gray-400">1 day ago</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-400">
                    Aave Strategy
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    Earnings Generated
                  </p>
                  <p className="text-xs text-gray-400">3 days ago</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-yellow-400">+$45.20</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;

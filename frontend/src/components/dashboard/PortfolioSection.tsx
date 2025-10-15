import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";

import { useVaultInfo, useVaultBalance } from "@/hooks/contract/useVault";
import { useUserTokenBalance } from "@/hooks/contract/useERC20";
import { useReadContract } from "wagmi";
import FiYieldVaultABI from "@/components/contract/abis/FiYieldVault.json";
import { CONTRACT_ADDRESSES } from "@/components/contract/addresses";
import {
  usePortfolioAnalytics,
  useVaultStats,
  useRecentActivity,
} from "@/hooks/useEnvioAnalytics";

interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  vaultAddress: string;
}

const SUPPORTED_TOKENS: TokenInfo[] = [
  {
    address: "0x5D876D73f4441D5f2438B1A3e2A51771B337F27A",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    vaultAddress: CONTRACT_ADDRESSES.USDC_VAULT,
  },
  {
    address: "0x6BB379A2056d1304E73012b99338F8F581eE2E18",
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    decimals: 8,
    vaultAddress: CONTRACT_ADDRESSES.WBTC_VAULT,
  },
  {
    address: "0xB5481b57fF4e23eA7D2fda70f3137b16D0D99118",
    symbol: "CURR",
    name: "Currances",
    decimals: 18,
    vaultAddress: CONTRACT_ADDRESSES.CURR_VAULT,
  },
  {
    address: "0xd455943dbc86A559A822AF08f5FDdD6B122E0748",
    symbol: "MockUSDC",
    name: "Mock USDC",
    decimals: 6,
    vaultAddress: CONTRACT_ADDRESSES.MOCK_USDC_VAULT,
  },
];

interface VaultBalance {
  token: TokenInfo;
  vaultBalance: number;
  walletBalance: number;
  isVaultDeployed: boolean;
}

export const PortfolioSection: React.FC = () => {
  const { address } = useAccount();
  const [vaultBalances, setVaultBalances] = useState<VaultBalance[]>([]);
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Get vault info for the main vault (MockUSDC)
  const {} = useVaultInfo();
  const {} = useVaultBalance();

  // Envio Analytics
  const { analytics, loading: analyticsLoading } = usePortfolioAnalytics(
    address || ""
  );
  const { stats, loading: statsLoading } = useVaultStats();
  const { activity, loading: activityLoading } = useRecentActivity(10);

  // Get wallet balances for tokens
  const usdcWalletBalance = useUserTokenBalance(
    "0x5D876D73f4441D5f2438B1A3e2A51771B337F27A",
    address
  );
  const wbtcWalletBalance = useUserTokenBalance(
    "0x6BB379A2056d1304E73012b99338F8F581eE2E18",
    address
  );
  const currWalletBalance = useUserTokenBalance(
    "0xB5481b57fF4e23eA7D2fda70f3137b16D0D99118",
    address
  );
  const mockUsdcWalletBalance = useUserTokenBalance(
    "0xd455943dbc86A559A822AF08f5FDdD6B122E0748",
    address
  );

  // Get vault balances using the correct vault function
  const { data: usdcVaultBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.USDC_VAULT as `0x${string}`,
    abi: FiYieldVaultABI.abi,
    functionName: "getBalance",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address },
  });

  const { data: wbtcVaultBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.WBTC_VAULT as `0x${string}`,
    abi: FiYieldVaultABI.abi,
    functionName: "getBalance",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address },
  });

  const { data: currVaultBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.CURR_VAULT as `0x${string}`,
    abi: FiYieldVaultABI.abi,
    functionName: "getBalance",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address },
  });

  const { data: mockUsdcVaultBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.MOCK_USDC_VAULT as `0x${string}`,
    abi: FiYieldVaultABI.abi,
    functionName: "getBalance",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address },
  });

  // Helper function to format vault balance based on token decimals
  const formatVaultBalance = (
    balance: bigint | undefined,
    decimals: number
  ): number => {
    if (!balance) return 0;

    if (decimals === 6) {
      return Number(balance) / 1e6;
    } else if (decimals === 8) {
      return Number(balance) / 1e8;
    } else {
      return Number(balance) / 1e18;
    }
  };

  useEffect(() => {
    if (!address) return;

    const balances: VaultBalance[] = [
      {
        token: SUPPORTED_TOKENS[0], // USDC
        vaultBalance: formatVaultBalance(
          usdcVaultBalance as bigint | undefined,
          6
        ),
        walletBalance: parseFloat(usdcWalletBalance.formatted) || 0,
        isVaultDeployed: true, // USDC vault is deployed
      },
      {
        token: SUPPORTED_TOKENS[1], // WBTC
        vaultBalance: formatVaultBalance(
          wbtcVaultBalance as bigint | undefined,
          8
        ),
        walletBalance: parseFloat(wbtcWalletBalance.formatted) || 0,
        isVaultDeployed: true, // WBTC vault is deployed
      },
      {
        token: SUPPORTED_TOKENS[2], // CURR
        vaultBalance: formatVaultBalance(
          currVaultBalance as bigint | undefined,
          18
        ),
        walletBalance: parseFloat(currWalletBalance.formatted) || 0,
        isVaultDeployed: false, // CURR vault is pending deployment
      },
      {
        token: SUPPORTED_TOKENS[3], // MockUSDC
        vaultBalance: formatVaultBalance(
          mockUsdcVaultBalance as bigint | undefined,
          6
        ),
        walletBalance: parseFloat(mockUsdcWalletBalance.formatted) || 0,
        isVaultDeployed: true, // MockUSDC vault is deployed
      },
    ];


    setVaultBalances(balances);

    // Calculate total portfolio value
    const total = balances.reduce(
      (sum, balance) => sum + balance.vaultBalance,
      0
    );
    setTotalPortfolioValue(total);
    setIsLoading(false);
  }, [
    address,
    usdcVaultBalance,
    wbtcVaultBalance,
    currVaultBalance,
    mockUsdcVaultBalance,
    currWalletBalance.formatted,
    mockUsdcWalletBalance.formatted,
    usdcWalletBalance.formatted,
    wbtcWalletBalance.formatted,
  ]);

  const formatBalance = (balance: number, decimals: number) => {
    if (decimals === 6) {
      return balance.toFixed(6);
    } else if (decimals === 8) {
      return balance.toFixed(8);
    } else {
      return balance.toFixed(4);
    }
  };

  const getTokenIcon = (symbol: string) => {
    switch (symbol) {
      case "USDC":
        return "💵";
      case "WBTC":
        return "₿";
      case "CURR":
        return "💰";
      case "MockUSDC":
        return "🪙";
      default:
        return "🪙";
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-white/5 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Portfolio Overview */}
      <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white font-pop mb-1 sm:mb-2">
              Portfolio Overview
            </h2>
            <p className="text-sm sm:text-base text-gray-400">
              Track your investments across all supported tokens
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs sm:text-sm text-gray-400">Total Value</p>
            <p className="text-2xl sm:text-3xl font-bold text-white font-pop">
              ${totalPortfolioValue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white/5 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-400 mb-1">
              Active Vaults
            </p>
            <p className="text-lg sm:text-xl font-bold text-white">
              {
                vaultBalances.filter(
                  (b) => b.isVaultDeployed && b.vaultBalance > 0
                ).length
              }
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-400 mb-1">
              Total Deposits
            </p>
            <p className="text-lg sm:text-xl font-bold text-white">
              ${totalPortfolioValue.toLocaleString()}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
            <p className="text-xs sm:text-sm text-gray-400 mb-1">
              Supported Tokens
            </p>
            <p className="text-lg sm:text-xl font-bold text-white">
              {SUPPORTED_TOKENS.length}
            </p>
          </div>
        </div>
      </div>

      {/* Token Holdings */}
      <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold text-white font-pop mb-4 sm:mb-6">
          Token Holdings
        </h3>

        <div className="space-y-3 sm:space-y-4">
          {vaultBalances.map((balance, index) => (
            <div
              key={index}
              className="bg-white/5 border border-white/10 rounded-lg p-3 sm:p-4 hover:border-white/20 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="text-xl sm:text-2xl">
                    {getTokenIcon(balance.token.symbol)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white font-pop text-sm sm:text-base truncate">
                      {balance.token.name} ({balance.token.symbol})
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-400">
                      {balance.isVaultDeployed
                        ? "Vault Active"
                        : "Vault Pending"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-end sm:gap-4 sm:text-right">
                  <div className="flex-1 sm:flex-none">
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">
                      In Vault
                    </p>
                    <p className="font-semibold text-white text-sm sm:text-base">
                      {formatBalance(
                        balance.vaultBalance,
                        balance.token.decimals
                      )}{" "}
                      {balance.token.symbol}
                    </p>
                  </div>
                  <div className="flex-1 sm:flex-none">
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">
                      In Wallet
                    </p>
                    <p className="text-xs sm:text-sm text-gray-300">
                      {formatBalance(
                        balance.walletBalance,
                        balance.token.decimals
                      )}{" "}
                      {balance.token.symbol}
                    </p>
                  </div>
                </div>
              </div>

              {!balance.isVaultDeployed && (
                <div className="mt-3 p-2 sm:p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-xs sm:text-sm text-yellow-400">
                    ⏳ Vault for {balance.token.symbol} is being deployed.
                    Deposits will be available soon.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold text-white font-pop mb-4">
          How Your Portfolio Works
        </h3>

        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-1">
              <span className="text-blue-400 font-bold text-xs sm:text-sm">
                1
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white mb-1 text-sm sm:text-base">
                Deposit Tokens
              </h4>
              <p className="text-gray-400 text-xs sm:text-sm">
                When you deposit USDC, WBTC, or other tokens, they go into
                dedicated vaults for each token type.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-1">
              <span className="text-green-400 font-bold text-xs sm:text-sm">
                2
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white mb-1 text-sm sm:text-base">
                Generate Yield
              </h4>
              <p className="text-gray-400 text-xs sm:text-sm">
                Your deposited funds are automatically invested in
                yield-generating strategies like Aave lending to earn passive
                income.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-1">
              <span className="text-purple-400 font-bold text-xs sm:text-sm">
                3
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white mb-1 text-sm sm:text-base">
                Track Performance
              </h4>
              <p className="text-gray-400 text-xs sm:text-sm">
                Monitor your portfolio value, earnings, and strategy performance
                in real-time through the dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold text-white font-pop mb-4 sm:mb-6">
          Performance Metrics
        </h3>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white/5 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-400 mb-1">
              Total Deposits
            </p>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
              ${totalPortfolioValue.toLocaleString()}
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-400 mb-1">
              Active Strategies
            </p>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
              {
                vaultBalances.filter(
                  (b) => b.isVaultDeployed && b.vaultBalance > 0
                ).length
              }
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-400 mb-1">Avg. APY</p>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-400">
              2.4%
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-400 mb-1">
              Est. Monthly Yield
            </p>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
              ${((totalPortfolioValue * 0.024) / 12).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold text-white font-pop mb-4 sm:mb-6">
          Quick Actions
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <button className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 sm:p-4 hover:bg-blue-500/30 transition-colors text-left">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                <span className="text-blue-400 text-sm sm:text-base">+</span>
              </div>
              <h4 className="font-semibold text-white text-sm sm:text-base">
                Deposit Funds
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-gray-400">
              Add more tokens to your portfolio
            </p>
          </button>

          <button className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 sm:p-4 hover:bg-green-500/30 transition-colors text-left">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                <span className="text-green-400 text-sm sm:text-base">📊</span>
              </div>
              <h4 className="font-semibold text-white text-sm sm:text-base">
                View Analytics
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-gray-400">
              Detailed performance analysis
            </p>
          </button>

          <button className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-3 sm:p-4 hover:bg-purple-500/30 transition-colors text-left sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                <span className="text-purple-400 text-sm sm:text-base">⚙️</span>
              </div>
              <h4 className="font-semibold text-white text-sm sm:text-base">
                Manage Strategy
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-gray-400">
              Configure your investment strategy
            </p>
          </button>
        </div>
      </div>

      {/* Envio Analytics Section */}
      <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-white"
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
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-white font-pop">
              🚀 Real-Time Analytics
            </h2>
            <p className="text-xs sm:text-sm text-gray-400">
              Powered by Envio - Advanced portfolio analytics and AI
              optimization
            </p>
          </div>
        </div>

        {/* Analytics Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Portfolio Analytics */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-white">
              Portfolio Analytics
            </h3>
            {analyticsLoading ? (
              <div className="space-y-2 sm:space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-10 sm:h-12 bg-white/5 rounded animate-pulse"
                  ></div>
                ))}
              </div>
            ) : analytics ? (
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between items-center p-2 sm:p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-400 text-xs sm:text-sm">
                    Total Deposits
                  </span>
                  <span className="text-white font-semibold text-sm sm:text-base">
                    ${analytics.totalDeposits || "0"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 sm:p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-400 text-xs sm:text-sm">
                    Total Withdrawals
                  </span>
                  <span className="text-white font-semibold text-sm sm:text-base">
                    ${analytics.totalWithdrawals || "0"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 sm:p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-400 text-xs sm:text-sm">
                    Net Flow
                  </span>
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      Number(analytics.netFlow || "0") >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    ${analytics.netFlow || "0"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <p className="text-gray-400 mb-2 text-sm sm:text-base">
                  No analytics data available
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  Start using the platform to see your analytics
                </p>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-white">
              Recent Activity
            </h3>
            {activityLoading ? (
              <div className="space-y-2 sm:space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-10 sm:h-12 bg-white/5 rounded animate-pulse"
                  ></div>
                ))}
              </div>
            ) : activity &&
              (activity.deposits?.length > 0 ||
                activity.withdrawals?.length > 0 ||
                activity.rebalances?.length > 0) ? (
              <div className="space-y-2 sm:space-y-3">
                {activity.deposits?.slice(0, 3).map((deposit, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 sm:p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500"></div>
                      <span className="text-white text-xs sm:text-sm">
                        Deposit
                      </span>
                    </div>
                    <span className="text-green-400 font-semibold text-xs sm:text-sm">
                      +${(Number(deposit.amount) / 1e6).toFixed(2)}
                    </span>
                  </div>
                ))}
                {activity.withdrawals?.slice(0, 3).map((withdrawal, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 sm:p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500"></div>
                      <span className="text-white text-xs sm:text-sm">
                        Withdrawal
                      </span>
                    </div>
                    <span className="text-red-400 font-semibold text-xs sm:text-sm">
                      -${(Number(withdrawal.amount) / 1e6).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <p className="text-gray-400 mb-2 text-sm sm:text-base">
                  No recent activity
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  Your transactions will appear here
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Vault Statistics */}
        {stats && !statsLoading && (
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/10">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
              Vault Statistics
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-400">
                  $
                  {stats.totalDeposits?.length > 0
                    ? (
                        stats.totalDeposits.reduce(
                          (sum, item) => sum + Number(item.amount),
                          0
                        ) / 1e6
                      ).toFixed(0)
                    : "0"}
                </div>
                <p className="text-xs sm:text-sm text-gray-400">
                  Total Deposits
                </p>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-400">
                  $
                  {stats.totalWithdrawals?.length > 0
                    ? (
                        stats.totalWithdrawals.reduce(
                          (sum, item) => sum + Number(item.amount),
                          0
                        ) / 1e6
                      ).toFixed(0)
                    : "0"}
                </div>
                <p className="text-xs sm:text-sm text-gray-400">
                  Total Withdrawals
                </p>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-400">
                  $
                  {stats.totalInvestments?.length > 0
                    ? (
                        stats.totalInvestments.reduce(
                          (sum, item) => sum + Number(item.amount),
                          0
                        ) / 1e6
                      ).toFixed(0)
                    : "0"}
                </div>
                <p className="text-xs sm:text-sm text-gray-400">
                  Total Investments
                </p>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-400">
                  {stats.totalRebalances?.length || "0"}
                </div>
                <p className="text-xs sm:text-sm text-gray-400">Rebalances</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

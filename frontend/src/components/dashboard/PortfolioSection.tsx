import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { useVaultInfo, useVaultBalance } from "@/hooks/contract/useVault";
import { useUserTokenBalance } from "@/hooks/contract/useERC20";
import { useReadContract } from "wagmi";
import FiYieldVaultABI from "@/components/contract/abis/FiYieldVault.json";
import { CONTRACT_ADDRESSES } from "@/components/contract/addresses";

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
  const { totalAssets, totalSupply } = useVaultInfo();
  const { balance: mainVaultBalance } = useVaultBalance();

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
        vaultBalance: formatVaultBalance(usdcVaultBalance, 6),
        walletBalance: parseFloat(usdcWalletBalance.formatted) || 0,
        isVaultDeployed:
          CONTRACT_ADDRESSES.USDC_VAULT !==
          "0x0000000000000000000000000000000000000000",
      },
      {
        token: SUPPORTED_TOKENS[1], // WBTC
        vaultBalance: formatVaultBalance(wbtcVaultBalance, 8),
        walletBalance: parseFloat(wbtcWalletBalance.formatted) || 0,
        isVaultDeployed:
          CONTRACT_ADDRESSES.WBTC_VAULT !==
          "0x0000000000000000000000000000000000000000",
      },
      {
        token: SUPPORTED_TOKENS[2], // CURR
        vaultBalance: formatVaultBalance(currVaultBalance, 18),
        walletBalance: parseFloat(currWalletBalance.formatted) || 0,
        isVaultDeployed:
          CONTRACT_ADDRESSES.CURR_VAULT !==
          "0x0000000000000000000000000000000000000000",
      },
      {
        token: SUPPORTED_TOKENS[3], // MockUSDC
        vaultBalance: formatVaultBalance(mockUsdcVaultBalance, 6),
        walletBalance: parseFloat(mockUsdcWalletBalance.formatted) || 0,
        isVaultDeployed:
          CONTRACT_ADDRESSES.MOCK_USDC_VAULT !==
          "0x0000000000000000000000000000000000000000",
      },
    ];

    console.log("Portfolio Debug:", {
      usdcVaultBalance: usdcVaultBalance?.toString(),
      usdcVaultBalanceFormatted: formatVaultBalance(usdcVaultBalance, 6),
      balances,
    });

    setVaultBalances(balances);

    // Calculate total portfolio value
    const total = balances.reduce(
      (sum, balance) => sum + balance.vaultBalance,
      0
    );
    console.log("Total portfolio value:", total);
    setTotalPortfolioValue(total);
    setIsLoading(false);
  }, [
    address,
    usdcVaultBalance,
    wbtcVaultBalance,
    currVaultBalance,
    mockUsdcVaultBalance,
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
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white font-pop mb-2">
              Portfolio Overview
            </h2>
            <p className="text-gray-400">
              Track your investments across all supported tokens
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Total Value</p>
            <p className="text-3xl font-bold text-white font-pop">
              ${totalPortfolioValue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Active Vaults</p>
            <p className="text-xl font-bold text-white">
              {
                vaultBalances.filter(
                  (b) => b.isVaultDeployed && b.vaultBalance > 0
                ).length
              }
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Total Deposits</p>
            <p className="text-xl font-bold text-white">
              ${totalPortfolioValue.toLocaleString()}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Supported Tokens</p>
            <p className="text-xl font-bold text-white">
              {SUPPORTED_TOKENS.length}
            </p>
          </div>
        </div>
      </div>

      {/* Token Holdings */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white font-pop mb-6">
          Token Holdings
        </h3>

        <div className="space-y-4">
          {vaultBalances.map((balance, index) => (
            <div
              key={index}
              className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-white/20 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">
                    {getTokenIcon(balance.token.symbol)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white font-pop">
                      {balance.token.name} ({balance.token.symbol})
                    </h4>
                    <p className="text-sm text-gray-400">
                      {balance.isVaultDeployed
                        ? "Vault Active"
                        : "Vault Pending"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="space-y-1">
                    <div>
                      <p className="text-sm text-gray-400">In Vault</p>
                      <p className="font-semibold text-white">
                        {formatBalance(
                          balance.vaultBalance,
                          balance.token.decimals
                        )}{" "}
                        {balance.token.symbol}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">In Wallet</p>
                      <p className="text-sm text-gray-300">
                        {formatBalance(
                          balance.walletBalance,
                          balance.token.decimals
                        )}{" "}
                        {balance.token.symbol}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {!balance.isVaultDeployed && (
                <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm text-yellow-400">
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
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white font-pop mb-4">
          How Your Portfolio Works
        </h3>

        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-blue-400 font-bold text-sm">1</span>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-1">Deposit Tokens</h4>
              <p className="text-gray-400 text-sm">
                When you deposit USDC, WBTC, or other tokens, they go into
                dedicated vaults for each token type.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-green-400 font-bold text-sm">2</span>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-1">Generate Yield</h4>
              <p className="text-gray-400 text-sm">
                Your deposited funds are automatically invested in
                yield-generating strategies like Aave lending to earn passive
                income.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-purple-400 font-bold text-sm">3</span>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-1">
                Track Performance
              </h4>
              <p className="text-gray-400 text-sm">
                Monitor your portfolio value, earnings, and strategy performance
                in real-time through the dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white font-pop mb-6">
          Performance Metrics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Total Deposits</p>
            <p className="text-2xl font-bold text-white">
              ${totalPortfolioValue.toLocaleString()}
            </p>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Active Strategies</p>
            <p className="text-2xl font-bold text-white">
              {vaultBalances.filter(b => b.isVaultDeployed && b.vaultBalance > 0).length}
            </p>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Avg. APY</p>
            <p className="text-2xl font-bold text-green-400">2.4%</p>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Est. Monthly Yield</p>
            <p className="text-2xl font-bold text-white">
              ${(totalPortfolioValue * 0.024 / 12).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white font-pop mb-6">
          Quick Actions
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 hover:bg-blue-500/30 transition-colors text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                <span className="text-blue-400">+</span>
              </div>
              <h4 className="font-semibold text-white">Deposit Funds</h4>
            </div>
            <p className="text-sm text-gray-400">Add more tokens to your portfolio</p>
          </button>
          
          <button className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 hover:bg-green-500/30 transition-colors text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                <span className="text-green-400">📊</span>
              </div>
              <h4 className="font-semibold text-white">View Analytics</h4>
            </div>
            <p className="text-sm text-gray-400">Detailed performance analysis</p>
          </button>
          
          <button className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4 hover:bg-purple-500/30 transition-colors text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                <span className="text-purple-400">⚙️</span>
              </div>
              <h4 className="font-semibold text-white">Manage Strategy</h4>
            </div>
            <p className="text-sm text-gray-400">Configure your investment strategy</p>
          </button>
        </div>
      </div>
    </div>
  );
};

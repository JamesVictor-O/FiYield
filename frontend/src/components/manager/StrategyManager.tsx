import React, { useState } from "react";
import { useAccount } from "wagmi";
import { useMockAavePoolAPY } from "@/hooks/contract/useMockAavePool";
import {
  useAaveStrategyBalance,
  useAaveStrategyInfo,
} from "@/hooks/contract/useAaveStrategy";
import {
  useVaultBalance,
  useVaultInfo,
  useSetStrategy,
} from "@/hooks/contract/useVault";
import { formatNumber } from "@/lib/utils";
import { CONTRACT_ADDRESSES } from "@/components/contract/addresses";

const StrategyManager: React.FC = () => {
  const [showDetails, setShowDetails] = useState(false);
  const { address } = useAccount();

  // Get strategy data
  const { apyDisplay, isLoading: apyLoading } = useMockAavePoolAPY();
  const { balanceFormatted: strategyBalance } = useAaveStrategyBalance();
  const { asset, vault, aToken, aavePool } = useAaveStrategyInfo();
  const { balance: vaultBalance } = useVaultBalance();

  // Get vault info to check current strategy
  const { strategy: currentStrategy } = useVaultInfo();

  // Strategy management
  const {
    setStrategy,
    isPending: isSettingStrategy,
    isConfirmed: strategyChanged,
    error: strategyError,
  } = useSetStrategy();

  // Convert vault balance to readable format
  const vaultBalanceFormatted = vaultBalance
    ? parseFloat(vaultBalance.toString()) / 1e18
    : 0;

  // Check if Aave strategy is currently active
  const isAaveStrategyActive =
    currentStrategy?.toLowerCase() ===
    CONTRACT_ADDRESSES.AAVE_STRATEGY.toLowerCase();

  // Handle strategy switching
  const handleSwitchToAave = async () => {
    try {
      await setStrategy(CONTRACT_ADDRESSES.AAVE_STRATEGY);
    } catch (error) {
      console.error("Failed to switch to Aave strategy:", error);
    }
  };

  if (!address) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg font-pop">
              Strategy Manager
            </h3>
            <p className="text-gray-400 text-sm">
              Connect your wallet to view strategy details
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-white font-semibold text-lg font-pop">
              Aave Strategy
            </h3>
            <p className="text-gray-400 text-sm">
              Automated yield optimization
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-gray-400 hover:text-white text-sm transition-colors duration-300"
        >
          {showDetails ? "Hide Details" : "Show Details"}
        </button>
      </div>

      {/* Strategy Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-green-400"
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
              <p className="text-gray-400 text-xs font-medium">Current APY</p>
              <div className="text-white font-bold text-lg font-pop">
                {apyLoading ? (
                  <div className="w-16 h-6 bg-white/10 animate-pulse rounded"></div>
                ) : (
                  apyDisplay || "8.2%"
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
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
              <p className="text-gray-400 text-xs font-medium">
                Strategy Balance
              </p>
              <p className="text-white font-bold text-lg font-pop">
                ${formatNumber(strategyBalance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Vault Balance Info */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <div>
            <p className="text-gray-400 text-xs font-medium">
              Your Vault Balance
            </p>
            <p className="text-white font-bold text-lg font-pop">
              ${formatNumber(vaultBalanceFormatted)}
            </p>
          </div>
        </div>
        <p className="text-gray-400 text-xs">
          Available for strategy deployment
        </p>
      </div>

      {/* Strategy Status */}
      <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              isAaveStrategyActive ? "bg-green-400" : "bg-yellow-400"
            }`}
          ></div>
          <div>
            <p className="text-white text-sm font-medium">
              {isAaveStrategyActive
                ? "Aave Strategy Active"
                : "Different Strategy Active"}
            </p>
            <p className="text-gray-400 text-xs">
              {isAaveStrategyActive
                ? "Optimizing your yields"
                : "Switch to maximize returns"}
            </p>
          </div>
        </div>

        {!isAaveStrategyActive && (
          <button
            onClick={handleSwitchToAave}
            disabled={isSettingStrategy}
            className="bg-white text-black hover:bg-white/90 disabled:bg-white/50 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300"
          >
            {isSettingStrategy ? "Switching..." : "Switch to Aave"}
          </button>
        )}
      </div>

      {/* Strategy change success/error messages */}
      {strategyChanged && (
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-green-400/20 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <p className="text-green-400 text-sm font-medium">
                Strategy Updated
              </p>
              <p className="text-gray-400 text-xs">
                Successfully switched to Aave strategy
              </p>
            </div>
          </div>
        </div>
      )}

      {strategyError && (
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-red-400/20 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <div>
              <p className="text-red-400 text-sm font-medium">
                Strategy Update Failed
              </p>
              <p className="text-gray-400 text-xs">{strategyError.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Strategy Details */}
      {showDetails && (
        <div className="space-y-4">
          <div className="border-t border-white/10 pt-4">
            <h4 className="text-white font-semibold text-lg font-pop mb-4">
              Strategy Details
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white/5 border border-white/10 rounded-lg">
                <span className="text-gray-400 text-sm">Current Strategy:</span>
                <span className="text-white font-mono text-sm">
                  {currentStrategy && typeof currentStrategy === "string"
                    ? `${currentStrategy.slice(0, 6)}...${currentStrategy.slice(
                        -4
                      )}`
                    : "Loading..."}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 border border-white/10 rounded-lg">
                <span className="text-gray-400 text-sm">Asset:</span>
                <span className="text-white font-mono text-sm">
                  {asset && typeof asset === "string"
                    ? `${asset.slice(0, 6)}...${asset.slice(-4)}`
                    : "Loading..."}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 border border-white/10 rounded-lg">
                <span className="text-gray-400 text-sm">Vault:</span>
                <span className="text-white font-mono text-sm">
                  {vault && typeof vault === "string"
                    ? `${vault.slice(0, 6)}...${vault.slice(-4)}`
                    : "Loading..."}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 border border-white/10 rounded-lg">
                <span className="text-gray-400 text-sm">aToken:</span>
                <span className="text-white font-mono text-sm">
                  {aToken && typeof aToken === "string"
                    ? `${aToken.slice(0, 6)}...${aToken.slice(-4)}`
                    : "Loading..."}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 border border-white/10 rounded-lg">
                <span className="text-gray-400 text-sm">Aave Pool:</span>
                <span className="text-white font-mono text-sm">
                  {aavePool && typeof aavePool === "string"
                    ? `${aavePool.slice(0, 6)}...${aavePool.slice(-4)}`
                    : "Loading..."}
                </span>
              </div>
            </div>

            {/* Expected Earnings */}
            {parseFloat(strategyBalance) > 0 && apyDisplay && (
              <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div>
                    <p className="text-green-400 text-sm font-medium">
                      Projected Annual Earnings
                    </p>
                    <p className="text-white font-bold text-lg font-pop">
                      $
                      {formatNumber(
                        (parseFloat(strategyBalance) *
                          parseFloat(apyDisplay?.replace("%", "") || "0")) /
                          100
                      )}
                    </p>
                  </div>
                </div>
                <p className="text-gray-400 text-xs">
                  ~$
                  {formatNumber(
                    (parseFloat(strategyBalance) *
                      parseFloat(apyDisplay?.replace("%", "") || "0")) /
                      100 /
                      365
                  )}{" "}
                  per day
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Note about strategy management */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-blue-400/20 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-blue-400 text-sm font-medium">
              Strategy Management
            </p>
            <p className="text-gray-400 text-xs">
              Strategy investments are managed automatically by the vault. Use
              the deposit function to add funds that can be deployed to this
              strategy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyManager;

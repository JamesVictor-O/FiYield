import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";

interface AIDelegationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelegate: (preferences: {
    riskTolerance: string;
    timeHorizon: string;
    focus: string[];
  }) => void;
}

const AIDelegationModal: React.FC<AIDelegationModalProps> = ({
  isOpen,
  onClose,
  onDelegate,
}) => {
  const [riskTolerance, setRiskTolerance] = useState("moderate");
  const [timeHorizon, setTimeHorizon] = useState("medium");
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
  const [isDelegating, setIsDelegating] = useState(false);

  const focusOptions = [
    { id: "yield", label: "Maximize Yield", icon: "📈" },
    { id: "safety", label: "Capital Preservation", icon: "🛡️" },
    { id: "diversification", label: "Portfolio Diversification", icon: "🌐" },
    { id: "liquidity", label: "High Liquidity", icon: "💧" },
    { id: "defi", label: "DeFi Innovation", icon: "⚡" },
    { id: "staking", label: "Staking Rewards", icon: "🔒" },
  ];

  const handleFocusToggle = (focusId: string) => {
    setSelectedFocus((prev) =>
      prev.includes(focusId)
        ? prev.filter((id) => id !== focusId)
        : [...prev, focusId]
    );
  };

  const handleDelegate = async () => {
    if (selectedFocus.length === 0) return;

    setIsDelegating(true);

    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    onDelegate({
      riskTolerance,
      timeHorizon,
      focus: selectedFocus,
    });

    setIsDelegating(false);
    onClose();
  };

  const mockPortfolioData = {
    currentAllocation: {
      USDC: 40,
      WBTC: 25,
      ETH: 20,
      Other: 15,
    },
    suggestedAllocation: {
      USDC: 30,
      WBTC: 35,
      ETH: 25,
      Other: 10,
    },
    expectedReturn: 12.5,
    riskScore: 6.2,
    strategies: [
      { name: "Aave Lending", apy: 8.5, allocation: 40 },
      { name: "Compound Staking", apy: 6.2, allocation: 30 },
      { name: "Uniswap LP", apy: 15.8, allocation: 20 },
      { name: "Yearn Vault", apy: 9.1, allocation: 10 },
    ],
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold text-gray-900 font-pop">
            AI Portfolio Delegation
          </DialogTitle>
          <DialogDescription className="text-gray-600 font-pop">
            Configure your preferences and let our AI optimize your portfolio
            allocation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8">
          {/* Risk Tolerance */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 font-pop">
              Risk Tolerance
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  id: "conservative",
                  label: "Conservative",
                  desc: "Low risk, stable returns",
                },
                {
                  id: "moderate",
                  label: "Moderate",
                  desc: "Balanced risk/reward",
                },
                {
                  id: "aggressive",
                  label: "Aggressive",
                  desc: "High risk, high potential",
                },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setRiskTolerance(option.id)}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                    riskTolerance === option.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-semibold text-gray-900">
                    {option.label}
                  </div>
                  <div className="text-sm text-gray-600">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Time Horizon */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 font-pop">
              Investment Time Horizon
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: "short", label: "Short Term", desc: "1-6 months" },
                {
                  id: "medium",
                  label: "Medium Term",
                  desc: "6 months - 2 years",
                },
                { id: "long", label: "Long Term", desc: "2+ years" },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setTimeHorizon(option.id)}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                    timeHorizon === option.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-semibold text-gray-900">
                    {option.label}
                  </div>
                  <div className="text-sm text-gray-600">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Focus Areas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 font-pop">
              Investment Focus (Select multiple)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {focusOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleFocusToggle(option.id)}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                    selectedFocus.includes(option.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{option.icon}</span>
                    <span className="font-semibold text-gray-900">
                      {option.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* AI Recommendations Preview */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 font-pop mb-4">
              AI Portfolio Preview
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current vs Suggested Allocation */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  Portfolio Allocation
                </h4>
                <div className="space-y-3">
                  {Object.entries(mockPortfolioData.suggestedAllocation).map(
                    ([asset, percentage]) => (
                      <div
                        key={asset}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-600">{asset}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Strategy Breakdown */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  Recommended Strategies
                </h4>
                <div className="space-y-2">
                  {mockPortfolioData.strategies.map((strategy, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-white rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {strategy.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {strategy.allocation}% allocation
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        {strategy.apy}% APY
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600">
                  Expected Annual Return
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {mockPortfolioData.expectedReturn}%
                </div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600">Risk Score</div>
                <div className="text-2xl font-bold text-orange-600">
                  {mockPortfolioData.riskScore}/10
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 w-full mt-6 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDelegating}
            className="w-full sm:w-auto h-12 font-pop border-gray-300 hover:border-gray-900 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelegate}
            disabled={selectedFocus.length === 0 || isDelegating}
            className="w-full sm:w-auto h-12 font-pop bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isDelegating ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                AI is optimizing...
              </span>
            ) : (
              "Delegate to AI"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AIDelegationModal;


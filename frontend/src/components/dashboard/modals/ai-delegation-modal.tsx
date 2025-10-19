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
import { useVaultBalance } from "@/hooks/contract/useVault";
import { formatEther } from "viem";

interface AIDelegationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelegate: (preferences: {
    delegationAmount: number;
    delegationPercentage: number;
  }) => void;
}

const AIDelegationModal: React.FC<AIDelegationModalProps> = ({
  isOpen,
  onClose,
  onDelegate,
}) => {
  const [delegationAmount, setDelegationAmount] = useState("");
  const [delegationPercentage, setDelegationPercentage] = useState(50);
  const [isDelegating, setIsDelegating] = useState(false);

  // Get real vault balance
  const { balance: vaultBalance, isLoading: balanceLoading } =
    useVaultBalance();
  const vaultBalanceFormatted = vaultBalance
    ? formatEther(vaultBalance as bigint)
    : "0";

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDelegationAmount(value);

    // Calculate percentage based on vault balance
    if (value && parseFloat(vaultBalanceFormatted) > 0) {
      const amount = parseFloat(value);
      const balance = parseFloat(vaultBalanceFormatted);
      const percentage = Math.round((amount / balance) * 100);
      setDelegationPercentage(Math.min(percentage, 100));
    }
  };

  const handlePercentageChange = (percentage: number) => {
    setDelegationPercentage(percentage);

    // Calculate amount based on percentage
    if (parseFloat(vaultBalanceFormatted) > 0) {
      const balance = parseFloat(vaultBalanceFormatted);
      const amount = (balance * percentage) / 100;
      setDelegationAmount(amount.toFixed(2));
    }
  };

  const handleDelegate = async () => {
    const amount = parseFloat(delegationAmount);
    if ((!amount || amount === 0) && delegationPercentage === 0) return;

    setIsDelegating(true);

    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    onDelegate({
      delegationAmount: amount || 0,
      delegationPercentage,
    });

    setIsDelegating(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-xs sm:max-w-md md:max-w-lg p-2 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-pop font-semibold text-gray-900">
            Delegate to AI
          </DialogTitle>
          <DialogDescription className="text-gray-600 font-pop">
            Set how much you want to delegate to AI for automated portfolio
            management.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Balance */}
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-500 font-pop mb-1">
              Available for Delegation
            </p>
            <p className="text-2xl font-pop font-semibold text-gray-900">
              {balanceLoading ? (
                <div className="w-20 h-8 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                `$${parseFloat(vaultBalanceFormatted).toLocaleString()} USDC`
              )}
            </p>
          </div>

          {/* Amount Input */}
          <div className="space-y-3">
            <label className="text-sm font-pop font-medium text-gray-700">
              Delegation Amount (USDC)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-pop">
                $
              </span>
              <input
                type="number"
                placeholder="0.00"
                value={delegationAmount}
                onChange={handleAmountChange}
                className="pl-8 w-full h-12 text-lg font-pop border-gray-300 focus:border-gray-900 focus:ring-0 rounded-lg"
                disabled={isDelegating}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="space-y-3">
            <label className="text-sm font-pop font-medium text-gray-700">
              Quick Delegation
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[25, 50, 75, 100].map((percentage) => (
                <button
                  key={percentage}
                  onClick={() => handlePercentageChange(percentage)}
                  disabled={isDelegating}
                  className={`text-sm font-pop border rounded-lg h-10 transition-colors ${
                    delegationPercentage === percentage
                      ? "border-gray-900 bg-gray-50 text-gray-900"
                      : "border-gray-300 hover:border-gray-900 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  {percentage}%
                </button>
              ))}
            </div>
          </div>

          {/* Percentage Slider */}
          <div className="space-y-3">
            <label className="text-sm font-pop font-medium text-gray-700">
              Percentage of Portfolio
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="0"
                max="100"
                value={delegationPercentage}
                onChange={(e) => handlePercentageChange(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                disabled={isDelegating}
              />
              <span className="text-sm font-semibold text-gray-900 w-12 text-center">
                {delegationPercentage}%
              </span>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-pop">Delegation Amount</span>
              <span className="font-pop font-medium text-gray-900">
                $
                {delegationAmount
                  ? parseFloat(delegationAmount).toLocaleString()
                  : "0.00"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-pop">Percentage</span>
              <span className="font-pop font-medium text-gray-900">
                {delegationPercentage}%
              </span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between text-sm font-pop font-semibold">
              <span>AI Control</span>
              <span className="text-emerald-600">
                {delegationPercentage > 0 ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* Info Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800 font-pop">
              <strong>🤖 AI Delegation:</strong> The AI will automatically
              manage your delegated funds using advanced strategies to maximize
              yield while managing risk.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 w-full mt-6 pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
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
            disabled={
              ((!delegationAmount || parseFloat(delegationAmount) === 0) &&
                delegationPercentage === 0) ||
              isDelegating
            }
            className="w-full sm:w-auto h-12 font-pop bg-gray-900 hover:bg-gray-800 text-white"
          >
            {isDelegating ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                AI is optimizing...
              </div>
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

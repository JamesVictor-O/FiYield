import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
import { useVaultWithdraw, useVaultBalance } from "@/hooks/contract/useVault";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amount: number) => void;
  currentBalance: number;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentBalance,
}) => {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { address } = useAccount();

  // Smart contract hooks
  const {
    withdraw,
    isPending,
    isConfirming,
    isConfirmed,
    error: withdrawError,
  } = useVaultWithdraw();
  const { balance: vaultBalance } = useVaultBalance();

  const isLoading = isPending || isConfirming;
  const vaultBalanceFormatted = vaultBalance
    ? formatEther(vaultBalance as bigint)
    : "0";

  const validateAmount = (value: string): boolean => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      setError("Please enter a valid amount greater than 0");
      return false;
    }

    // Check against actual vault balance
    const maxWithdraw = Math.min(
      currentBalance,
      parseFloat(vaultBalanceFormatted)
    );
    if (numValue > maxWithdraw) {
      setError(
        `Insufficient balance. Max withdrawal: ${maxWithdraw.toFixed(4)}`
      );
      return false;
    }

    if (numValue > 50000) {
      setError("Maximum withdrawal amount is $50,000 per transaction");
      return false;
    }
    setError("");
    return true;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    if (value) {
      validateAmount(value);
    } else {
      setError("");
    }
  };

  const handleQuickAmount = (percentage: number) => {
    const maxWithdraw = Math.min(
      currentBalance,
      parseFloat(vaultBalanceFormatted)
    );
    const quickAmount = (maxWithdraw * percentage) / 100;
    setAmount(quickAmount.toFixed(2));
    setError("");
  };

  const handleWithdrawAll = () => {
    const maxWithdraw = Math.min(
      currentBalance,
      parseFloat(vaultBalanceFormatted)
    );
    setAmount(maxWithdraw.toFixed(2));
    setError("");
  };

  const handleWithdraw = async () => {
    if (!validateAmount(amount) || !address) {
      return;
    }

    setError("");

    try {
      withdraw(amount);
    } catch (err) {
      setError(
        `Withdrawal failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  };

  // Handle withdrawal confirmation
  useEffect(() => {
    if (isConfirmed) {
      setSuccess(true);
      setTimeout(() => {
        onSuccess(parseFloat(amount));
        setAmount("");
        setSuccess(false);
      }, 1500);
    }
  }, [isConfirmed, amount, onSuccess]);

  // Handle errors
  useEffect(() => {
    if (withdrawError) {
      setError(`Withdrawal failed: ${withdrawError.message}`);
    }
  }, [withdrawError]);

  const handleClose = () => {
    if (!isLoading) {
      setAmount("");
      setError("");
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-xs sm:max-w-md md:max-w-lg p-2 sm:p-6">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-pop font-semibold text-gray-900">
            Withdraw Funds
          </DialogTitle>
          <DialogDescription className="text-gray-600 font-pop">
            Withdraw funds from your FiYield account to your connected wallet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Balance */}
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-500 font-pop mb-1">
              Available Balance
            </p>
            <p className="text-2xl font-pop font-semibold text-gray-900">
              ${currentBalance.toLocaleString()}
            </p>
          </div>

          {/* Amount Input */}
          <div className="space-y-3">
            <Label
              htmlFor="withdraw-amount"
              className="text-sm font-pop font-medium text-gray-700"
            >
              Amount (USD)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-pop">
                $
              </span>
              <Input
                id="withdraw-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={handleAmountChange}
                className="pl-8 w-full h-12 text-lg font-pop border-gray-300 focus:border-gray-900 focus:ring-0"
                disabled={isLoading}
                min="0"
                max={currentBalance}
                step="0.01"
              />
            </div>
            {error && <p className="text-sm text-red-600 font-pop">{error}</p>}
          </div>

          {/* Quick Amount Buttons */}
          <div className="space-y-3">
            <Label className="text-sm font-pop font-medium text-gray-700">
              Quick Withdrawal
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAmount(25)}
                disabled={isLoading}
                className="text-sm font-pop border-gray-300 hover:border-gray-900 hover:bg-gray-50 h-10"
              >
                25% (${(currentBalance * 0.25).toFixed(0)})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAmount(50)}
                disabled={isLoading}
                className="text-sm font-pop border-gray-300 hover:border-gray-900 hover:bg-gray-50 h-10"
              >
                50% (${(currentBalance * 0.5).toFixed(0)})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAmount(75)}
                disabled={isLoading}
                className="text-sm font-pop border-gray-300 hover:border-gray-900 hover:bg-gray-50 h-10"
              >
                75% (${(currentBalance * 0.75).toFixed(0)})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleWithdrawAll}
                disabled={isLoading}
                className="text-sm font-pop border-gray-300 hover:border-gray-900 hover:bg-gray-50 h-10"
              >
                All (${currentBalance.toFixed(0)})
              </Button>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-pop">Withdrawal Amount</span>
              <span className="font-pop font-medium text-gray-900">
                ${amount ? parseFloat(amount).toLocaleString() : "0.00"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-pop">Network Fee</span>
              <span className="font-pop font-medium text-gray-900">$0.00</span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between text-sm font-pop font-semibold">
              <span>You&apos;ll Receive</span>
              <span>
                ${amount ? parseFloat(amount).toLocaleString() : "0.00"}
              </span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between text-sm">
              <span className="text-gray-500 font-pop">Remaining Balance</span>
              <span className="font-pop font-medium text-gray-900">
                $
                {amount
                  ? (currentBalance - parseFloat(amount)).toLocaleString()
                  : currentBalance.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Success State */}
          {success && (
            <div className="border border-green-200 bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800 border-green-200 font-pop">
                  ✓ Success
                </Badge>
                <span className="text-sm text-green-800 font-pop">
                  Withdrawal successful! Funds will be sent to your wallet
                  shortly.
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 w-full">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="w-full sm:w-auto h-12 font-pop border-gray-300 hover:border-gray-900 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleWithdraw}
            disabled={!amount || isLoading || !!error}
            className="w-full sm:w-auto h-12 font-pop bg-gray-900 hover:bg-gray-800 text-white"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : (
              "Confirm Withdrawal"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawModal;

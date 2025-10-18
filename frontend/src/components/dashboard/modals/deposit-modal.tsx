import React, { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { parseEther } from "viem";
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
import { useMultiTokenCoordinator } from "@/hooks/contract/useMultiTokenCoordinator";
import {
  useTokenApproval,
  useUserTokenBalance,
  useTokenAllowance,
} from "@/hooks/contract/useERC20";
import { CONTRACT_ADDRESSES } from "@/components/contract/addresses";
import { TokenSelector } from "./token-selector";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amount: number) => void;
  currentBalance: number;
}

const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose }) => {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [selectedToken, setSelectedToken] = useState(
    "0xd455943dbc86A559A822AF08f5FDdD6B122E0748" // Default to MockUSDC
  );
  const [pendingDeposit, setPendingDeposit] = useState<{
    amount: string;
    address: string;
    decimals: number;
  } | null>(null);

  const { address } = useAccount();

  // Use MultiTokenCoordinatorVault as the main vault for all tokens
  const currentVaultAddress = CONTRACT_ADDRESSES.MULTI_TOKEN_COORDINATOR;

  // Multi-token coordinator hook
  const {
    deposit: coordinatorDeposit,
    isPending: isDepositPending,
    error: depositError,
  } = useMultiTokenCoordinator();

  const {
    approve,
    isPending: isApprovePending,
    isConfirming: isApproveConfirming,
    isConfirmed: isApproveConfirmed,
    error: approveError,
  } = useTokenApproval(selectedToken);

  // Get user's token balance
  const {
    formatted: formattedBalance,
    decimals: tokenDecimals,
    refetch: refetchBalance,
  } = useUserTokenBalance(selectedToken, address);

  // Check current allowance
  const { allowance, refetch: refetchAllowance } = useTokenAllowance(
    selectedToken,
    address || "0x0",
    currentVaultAddress
  );

  // Overall loading state
  const isLoading = isApprovePending || isApproveConfirming || isDepositPending;

  const validateAmount = (value: string): boolean => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      setError("Please enter a valid amount greater than 0");
      return false;
    }

    // Check if user has enough balance
    const userBalance = parseFloat(formattedBalance);
    if (numValue > userBalance) {
      setError(`Insufficient balance. You have ${formattedBalance} tokens`);
      return false;
    }

    if (numValue > 100000) {
      setError("Maximum deposit amount is $100,000");
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
      // Check if approval will be needed for this amount
      checkApprovalNeeded(value);
    } else {
      setError("");
      setNeedsApproval(false);
    }
  };

  const handleQuickAmount = (quickAmount: number) => {
    const amountStr = quickAmount.toString();
    setAmount(amountStr);
    setError("");
    // Check if approval will be needed for this amount
    checkApprovalNeeded(amountStr);
  };

  // Check if approval is needed
  const checkApprovalNeeded = useCallback(
    async (amountToDeposit: string) => {
      try {
        await refetchAllowance();

        // Parse amount based on token decimals
        let amountWei: bigint;
        if (tokenDecimals === 6) {
          // For USDC (6 decimals)
          amountWei = BigInt(Math.floor(parseFloat(amountToDeposit) * 1e6));
        } else if (tokenDecimals === 8) {
          // For WBTC (8 decimals)
          amountWei = BigInt(Math.floor(parseFloat(amountToDeposit) * 1e8));
        } else {
          // For 18 decimals (default)
          amountWei = parseEther(amountToDeposit);
        }

        const needed = allowance < amountWei;
        setNeedsApproval(needed);
      } catch (err) {
        console.error("Error checking approval:", err);
        setNeedsApproval(true);
      }
    },
    [allowance, refetchAllowance, tokenDecimals]
  );

  // Main deposit handler
  const handleDeposit = async () => {
    if (!validateAmount(amount) || !address) {
      return;
    }

    setError("");

    try {
      // Validate amount before proceeding
      if (!amount || parseFloat(amount) <= 0) {
        setError("Please enter a valid amount");
        return;
      }

      // Check user balance first
      const userBalance = parseFloat(formattedBalance);
      const depositAmount = parseFloat(amount);

      if (depositAmount > userBalance) {
        setError(
          `Insufficient balance. You have ${userBalance.toFixed(6)} tokens`
        );
        return;
      }

      // MultiTokenCoordinatorVault supports all tokens, no need to check

      // Check if approval is needed
      await checkApprovalNeeded(amount);

      if (needsApproval) {
        // Trigger approval with coordinator vault address as spender
        await approve(currentVaultAddress, amount);
        // Store pending deposit to trigger after approval
        setPendingDeposit({ amount, address, decimals: tokenDecimals });
      } else {
        // Proceed with deposit using MultiTokenCoordinatorVault
        await coordinatorDeposit(selectedToken, amount);
      }
    } catch (err) {
      console.error("Transaction error:", err);
      setError(
        `Transaction failed: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  };

  // Handle approval success - trigger deposit
  useEffect(() => {
    if (isApproveConfirmed && pendingDeposit) {
      // Wait a moment for blockchain state to update, then deposit
      const timer = setTimeout(() => {
        coordinatorDeposit(selectedToken, pendingDeposit.amount);
        setPendingDeposit(null); // Clear pending state
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isApproveConfirmed, pendingDeposit, coordinatorDeposit, selectedToken]);

  // Handle errors
  useEffect(() => {
    if (approveError) {
      console.error("Approve error:", approveError);
      setError(`Approval failed: ${approveError.message}`);
      setPendingDeposit(null);
    }
    if (depositError) {
      console.error("Deposit error:", depositError);
      setError(`Deposit failed: ${depositError.message}`);
      setPendingDeposit(null);
    }
  }, [approveError, depositError]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setError("");
      setSuccess(false);
      setNeedsApproval(false);
      setPendingDeposit(null);
      setAmount("");

      // Refresh allowance when modal opens
      if (address) {
        refetchAllowance();
        refetchBalance();
      }
    }
  }, [isOpen, address, refetchAllowance, refetchBalance]);

  const handleClose = useCallback(() => {
    if (!isLoading) {
      setAmount("");
      setError("");
      setSuccess(false);
      setNeedsApproval(false);
      setPendingDeposit(null);
      onClose();
    }
  }, [isLoading, onClose]);

  // Handle deposit success - this will be triggered by the parent component
  // when the deposit transaction is confirmed

  const getStepMessage = () => {
    if (isApprovePending || isApproveConfirming) {
      return "Step 1: Approving token access...";
    }
    if (isDepositPending) {
      return "Step 2: Depositing funds...";
    }
    return "Processing...";
  };

  const getButtonText = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          {getStepMessage()}
        </div>
      );
    }

    // Show different button text based on approval status
    if (needsApproval) {
      return "Approve & Deposit";
    }

    return "Confirm Deposit";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-xs sm:max-w-md md:max-w-lg p-2 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-pop font-semibold text-gray-900">
            Deposit Funds
          </DialogTitle>
          <DialogDescription className="text-gray-600 font-pop">
            Add funds to your FiYield vault to start earning yield.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Token Selection */}
          <TokenSelector
            selectedToken={selectedToken}
            onTokenSelect={setSelectedToken}
          />

          {/* Info Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              <strong>✅ Multi-Token Support:</strong> You can now deposit USDC,
              WBTC, or MockUSDC tokens. Each token has its own dedicated vault
              for optimal yield generation. CURR vault is pending deployment.
            </p>
          </div>

          {/* Current Balance */}
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-500 font-pop mb-1">
              Your Token Balance
            </p>
            <p className="text-2xl font-pop font-semibold text-gray-900">
              ${parseFloat(formattedBalance).toLocaleString()}
            </p>
          </div>

          {/* Amount Input */}
          <div className="space-y-3">
            <Label
              htmlFor="deposit-amount"
              className="text-sm font-pop font-medium text-gray-700"
            >
              Amount (USD)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-pop">
                $
              </span>
              <Input
                id="deposit-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={handleAmountChange}
                className="pl-8 w-full h-12 text-lg font-pop border-gray-300 focus:border-gray-900 focus:ring-0"
                disabled={isLoading}
                min="0"
                step="0.01"
              />
            </div>
            {error && <p className="text-sm text-red-600 font-pop">{error}</p>}
          </div>

          {/* Quick Amount Buttons */}
          <div className="space-y-3">
            <Label className="text-sm font-pop font-medium text-gray-700">
              Quick amounts
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[10, 50, 100, 500].map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(quickAmount)}
                  disabled={isLoading}
                  className="text-sm font-pop border-gray-300 hover:border-gray-900 hover:bg-gray-50 h-10"
                >
                  ${quickAmount}
                </Button>
              ))}
            </div>
          </div>

          {/* Transaction Details */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-pop">Amount</span>
              <span className="font-pop font-medium text-gray-900">
                ${amount ? parseFloat(amount).toLocaleString() : "0.00"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-pop">Network Fee</span>
              <span className="font-pop font-medium text-gray-900">$0.00</span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between text-sm font-pop font-semibold">
              <span>Total</span>
              <span>
                ${amount ? parseFloat(amount).toLocaleString() : "0.00"}
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
                  Deposit successful! Your funds will be available shortly.
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 w-full mt-6 pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="w-full sm:w-auto h-12 font-pop border-gray-300 hover:border-gray-900 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeposit}
            disabled={!amount || isLoading || !!error || !address}
            className="w-full sm:w-auto h-12 font-pop bg-gray-900 hover:bg-gray-800 text-white"
          >
            {getButtonText()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DepositModal;

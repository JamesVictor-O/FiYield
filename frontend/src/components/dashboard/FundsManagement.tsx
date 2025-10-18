import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";

import DepositModal from "@/components/dashboard/modals/deposit-modal";
import WithdrawModal from "./modals/withdrawalmodal";
import SendModal from "@/components/dashboard/modals/send-modal";

interface FundsManagementProps {
  userBalance: number;
  userInitialDeposit: number;
  realEarnings: number;
  onBalanceUpdate: (newBalance: number) => void;
}

interface Transaction {
  id: string;
  type: "deposit" | "withdraw" | "send";
  amount: number;
  timestamp: Date;
  status: "completed" | "pending" | "failed";
  hash?: string;
}

const FundsManagement: React.FC<FundsManagementProps> = ({
  userBalance = 0,
  userInitialDeposit = 0,
  realEarnings = 0,
  onBalanceUpdate,
}) => {
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  );

  // Load transaction history from localStorage (in a real app, this would come from blockchain events)
  useEffect(() => {
    const savedTransactions = localStorage.getItem("userTransactions");
    if (savedTransactions) {
      try {
        const rawTransactions = JSON.parse(savedTransactions);

        const transactions = rawTransactions.map((tx: Partial<Transaction>) => {
          return {
            ...tx,
            amount: Number(tx.amount) || 0, // Ensure amount is a valid number
            timestamp: new Date(tx.timestamp || Date.now()),
          };
        });
        // Sort by timestamp descending and take the most recent 5
        const sortedTransactions = transactions
          .sort(
            (a: Transaction, b: Transaction) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
          .slice(0, 5);
        setRecentTransactions(sortedTransactions);
      } catch (error) {
        console.error(
          "Error loading transactions, clearing localStorage:",
          error
        );
        localStorage.removeItem("userTransactions");
      }
    }
  }, []);

  const addTransaction = (
    type: "deposit" | "withdraw" | "send",
    amount: number
  ) => {
    // Ensure amount is a valid positive number
    const validAmount = Math.abs(Number(amount)) || 0;

    const newTransaction: Transaction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // More unique ID
      type,
      amount: validAmount,
      timestamp: new Date(),
      status: "completed",
    };

    // Get existing transactions from localStorage
    const existingTransactions = JSON.parse(
      localStorage.getItem("userTransactions") || "[]"
    );

    // Check for duplicates based on amount, type, and recent timestamp (within 5 seconds)
    const isDuplicate = existingTransactions.some((tx: Transaction) => {
      const timeDiff = Math.abs(
        new Date(tx.timestamp).getTime() - newTransaction.timestamp.getTime()
      );
      return (
        tx.type === newTransaction.type &&
        Math.abs(tx.amount - newTransaction.amount) < 0.01 &&
        timeDiff < 5000
      ); // 5 seconds
    });

    if (isDuplicate) {
      console.log("Duplicate transaction detected, skipping...");
      return;
    }

    // Add new transaction to the beginning of the list
    const updatedTransactions = [newTransaction, ...recentTransactions].slice(
      0,
      5
    );
    setRecentTransactions(updatedTransactions);

    // Save to localStorage with new transaction at the beginning
    const allTransactions = [newTransaction, ...existingTransactions];

    // Keep only the most recent 20 transactions to prevent localStorage from growing too large
    const limitedTransactions = allTransactions.slice(0, 20);
    localStorage.setItem(
      "userTransactions",
      JSON.stringify(limitedTransactions)
    );
  };

  const handleDepositSuccess = (amount: number) => {
    console.log("Deposit success - amount:", amount, "type:", typeof amount);
    const validAmount = Number(amount) || 0;
    onBalanceUpdate((userBalance || 0) + validAmount);
    addTransaction("deposit", validAmount);
    setIsDepositOpen(false);
  };

  const handleWithdrawSuccess = (amount: number) => {
    console.log("Withdraw success - amount:", amount, "type:", typeof amount);
    const validAmount = Number(amount) || 0;
    onBalanceUpdate((userBalance || 0) - validAmount);
    addTransaction("withdraw", validAmount);
    setIsWithdrawOpen(false);
  };

  const handleSendSuccess = (amount: number) => {
    console.log("Send success - amount:", amount, "type:", typeof amount);
    const validAmount = Number(amount) || 0;
    onBalanceUpdate((userBalance || 0) - validAmount);
    addTransaction("send", validAmount);
    setIsSendOpen(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return (
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
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        );
      case "withdraw":
        return (
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
              d="M12 6v6m0 0v6m0-6H6m6 0h6"
            />
          </svg>
        );
      case "send":
        return (
          <svg
            className="w-4 h-4 text-purple-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        );
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "deposit":
        return "text-green-400";
      case "withdraw":
        return "text-blue-400";
      case "send":
        return "text-purple-400";
      default:
        return "text-gray-400";
    }
  };

  // Calculate 24h change (simplified - in reality this would be more complex)
  const dailyChangePercent = realEarnings > 0 ? 2.4 : 0;

  return (
    <div className="w-full space-y-6">
      {/* Balance Card - Clean Design */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-white font-semibold text-lg font-pop">
                Portfolio Balance
              </h3>
              <p className="text-gray-400 text-sm">Available for investment</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-green-400 text-sm font-medium">Active</span>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-4xl font-bold text-white font-pop">
            ${(userBalance || 0).toLocaleString()}
          </p>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-green-400 font-medium">
              +{dailyChangePercent}%
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-400">Last 24h</span>
          </div>
        </div>
      </div>

      {/* Action Buttons - Clean Design */}
      <div className="grid grid-cols-3 gap-4">
        <Button
          onClick={() => setIsDepositOpen(true)}
          className="bg-white text-black hover:bg-white/90 py-3 px-4 rounded-lg font-medium text-sm transition-colors duration-300"
        >
          <svg
            className="w-4 h-4 mr-2 hidden md:block"
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
          Deposit
        </Button>
        <Button
          onClick={() => setIsWithdrawOpen(true)}
          className="bg-white/10 border border-white/20 text-white hover:bg-white/20 py-3 px-4 rounded-lg font-medium text-sm transition-colors duration-300"
        >
          <svg
            className="w-4 h-4 mr-2 hidden md:block"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6v6m0 0v6m0-6H6m6 0h6"
            />
          </svg>
          Withdraw
        </Button>
        <Button
          onClick={() => setIsSendOpen(true)}
          className="bg-white/10 border border-white/20 text-white hover:bg-white/20 py-3 px-4 rounded-lg font-medium text-sm transition-colors duration-300"
        >
          <svg
            className="w-4 h-4 mr-2 hidden md:block"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
          Send
        </Button>
      </div>

      {/* Quick Stats - Clean Design */}
      <div className="grid grid-cols-2 gap-4">
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
                Total Deposits
              </p>
              <p className="text-white font-bold text-lg font-pop">
                ${(userInitialDeposit || 0).toLocaleString()}
              </p>
            </div>
          </div>
          <p className="text-gray-400 text-xs">
            {userInitialDeposit > 0 ? "Principal amount" : "No deposits yet"}
          </p>
        </div>
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
              <p className="text-gray-400 text-xs font-medium">Total Earned</p>
              <p className="text-green-400 font-bold text-lg font-pop">
                ${(realEarnings || 0).toLocaleString()}
              </p>
            </div>
          </div>
          <p className="text-gray-400 text-xs">
            {userInitialDeposit > 0
              ? `${(
                  ((realEarnings || 0) / (userInitialDeposit || 1)) *
                  100
                ).toFixed(2)}% return`
              : "0% APY"}
          </p>
        </div>
      </div>

      {/* Recent Activity - Clean Design */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-white font-semibold text-lg font-pop">
            Recent Activity
          </h4>
          <div className="flex gap-3">
            <button
              onClick={() => {
                localStorage.removeItem("userTransactions");
                setRecentTransactions([]);
              }}
              className="text-gray-400 text-sm hover:text-white transition-colors duration-300"
            >
              Clear
            </button>
            <button className="text-gray-400 text-sm hover:text-white transition-colors duration-300">
              View All
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between hover:border-white/20 transition-colors duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium capitalize">
                      {transaction.type}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {formatDate(transaction.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-semibold ${getTransactionColor(
                      transaction.type
                    )}`}
                  >
                    {transaction.type === "deposit" ? "+" : "-"}$
                    {Number(transaction.amount || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        transaction.status === "completed"
                          ? "bg-green-400"
                          : transaction.status === "pending"
                          ? "bg-yellow-400"
                          : "bg-red-400"
                      }`}
                    ></div>
                    <span className="text-gray-400 text-xs capitalize">
                      {transaction.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <p className="text-gray-400 text-sm mb-1">No recent activity</p>
              <p className="text-gray-500 text-xs">
                Make your first deposit to get started
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onSuccess={handleDepositSuccess}
        currentBalance={userBalance || 0}
      />
      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        onSuccess={handleWithdrawSuccess}
        currentBalance={userBalance || 0}
      />
      <SendModal
        isOpen={isSendOpen}
        onClose={() => setIsSendOpen(false)}
        onSuccess={handleSendSuccess}
        currentBalance={userBalance || 0}
      />
    </div>
  );
};

export default FundsManagement;

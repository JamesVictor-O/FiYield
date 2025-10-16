"use client";

import { useState, useEffect, useCallback } from "react";
import {
  createSmartAccount,
  getSmartAccount,
  getSmartAccountBalance,
} from "@/lib/metamask/smartAccount";
import {
  createDelegation,
  createDepositDelegation,
  getActiveDelegations,
  isDelegationActive,
} from "@/lib/metamask/delegation";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

interface DelegationSetupProps {
  vaultAddress: string;
  agentExecutorAddress: string;
  onDelegationCreated?: (delegation: any) => void;
}

export function DelegationSetup({
  vaultAddress,
  agentExecutorAddress,
  onDelegationCreated,
}: DelegationSetupProps) {
  const [smartAccount, setSmartAccount] = useState<string | null>(null);
  const [smartAccountBalance, setSmartAccountBalance] = useState<string>("0");
  const [loading, setLoading] = useState(false);
  const [delegationCreated, setDelegationCreated] = useState(false);
  const [depositDelegationCreated, setDepositDelegationCreated] =
    useState(false);
  const [activeDelegations, setActiveDelegations] = useState<any[]>([]);

  const checkExistingSetup = useCallback(async () => {
    try {
      // Check if wallet is connected first
      if (!window.ethereum) {
        console.log("MetaMask not installed");
        return;
      }

      // Check for existing smart account
      const existingAccount = await getSmartAccount();
      if (existingAccount) {
        setSmartAccount(existingAccount);

        // Get balance
        const balance = await getSmartAccountBalance(existingAccount);
        setSmartAccountBalance(balance);

        // Check for existing delegations
        const delegations = await getActiveDelegations(existingAccount);
        setActiveDelegations(delegations);

        // Check if rebalance delegation exists
        const hasRebalanceDelegation = await isDelegationActive(
          existingAccount,
          agentExecutorAddress
        );
        setDelegationCreated(hasRebalanceDelegation);

        // Check if deposit delegation exists (you might want to implement this check)
        setDepositDelegationCreated(false); // Implement based on your needs
      }
    } catch (error) {
      console.error("Error checking existing setup:", error);
    }
  }, [agentExecutorAddress]);

  // Check for existing smart account and delegations on mount
  useEffect(() => {
    checkExistingSetup();
  }, [checkExistingSetup]);

  const handleCreateSmartAccount = async () => {
    setLoading(true);
    try {
      // Check if user already has Smart Account
      let account = await getSmartAccount();

      if (!account) {
        // Create new Smart Account
        const newAccount = await createSmartAccount();
        account = newAccount.address;
      }

      setSmartAccount(account);

      // Get balance
      const balance = await getSmartAccountBalance(account);
      setSmartAccountBalance(balance);
    } catch (error) {
      console.error("Error creating smart account:", error);
      alert("Failed to create Smart Account");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRebalanceDelegation = async () => {
    if (!smartAccount) return;

    setLoading(true);
    try {
      const delegation = await createDelegation(
        smartAccount,
        agentExecutorAddress,
        vaultAddress,
        BigInt(1000 * 10 ** 6), // $1000 max per rebalance
        7 * 24 * 60 * 60 // 1 week
      );

      setDelegationCreated(true);

      // Store delegation data for AI agent to use
      await fetch("/api/delegation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smartAccount,
          delegation,
          type: "rebalance",
        }),
      });

      // Update active delegations
      await checkExistingSetup();

      onDelegationCreated?.(delegation);
    } catch (error) {
      console.error("Error creating rebalance delegation:", error);
      alert("Failed to create rebalance delegation");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepositDelegation = async () => {
    if (!smartAccount) return;

    setLoading(true);
    try {
      const delegation = await createDepositDelegation(
        smartAccount,
        agentExecutorAddress,
        vaultAddress,
        BigInt(5000 * 10 ** 6), // $5000 max per deposit
        30 * 24 * 60 * 60 // 30 days
      );

      setDepositDelegationCreated(true);

      // Store delegation data
      await fetch("/api/delegation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smartAccount,
          delegation,
          type: "deposit",
        }),
      });

      // Update active delegations
      await checkExistingSetup();
    } catch (error) {
      console.error("Error creating deposit delegation:", error);
      alert("Failed to create deposit delegation");
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (balance: string) => {
    const balanceNum = parseInt(balance, 16) / 1e18;
    return balanceNum.toFixed(4);
  };

  return (
    <div className="space-y-6 p-6 border border-gray-200 rounded-lg">
      <div>
        <h2 className="text-2xl font-pop font-semibold text-gray-900 mb-2">
          Smart Account & AI Delegation
        </h2>
        <p className="text-gray-600 font-pop">
          Enable automated yield optimization with AI-powered rebalancing.
        </p>
      </div>

      {!smartAccount ? (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-pop font-semibold text-blue-900 mb-2">
              Step 1: Create Smart Account
            </h3>
            <p className="text-sm text-blue-800 font-pop mb-4">
              A Smart Account enables advanced features like automated
              transactions and AI delegation.
            </p>
            <Button
              onClick={handleCreateSmartAccount}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-pop"
            >
              {loading ? "Creating..." : "Create Smart Account"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Smart Account Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-pop font-semibold text-green-900">
                Smart Account Active
              </h3>
              <Badge className="bg-green-100 text-green-800 border-green-200 font-pop">
                Connected
              </Badge>
            </div>
            <p className="text-sm text-gray-600 font-pop mb-1">Address:</p>
            <p className="font-mono text-sm text-gray-900 break-all">
              {smartAccount}
            </p>
            <p className="text-sm text-gray-600 font-pop mt-2">
              Balance: {formatBalance(smartAccountBalance)} MON
            </p>
          </div>

          {/* Rebalance Delegation */}
          <div className="space-y-4">
            <h3 className="text-lg font-pop font-semibold text-gray-900">
              Step 2: Grant Rebalancing Permissions
            </h3>

            {!delegationCreated ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-600 font-pop mb-4">
                  Allow FiYield AI to automatically rebalance your portfolio
                  for optimal yields.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <h4 className="font-pop font-medium text-gray-900">
                      ✅ Allowed Actions:
                    </h4>
                    <ul className="text-sm space-y-1 text-gray-600 font-pop">
                      <li>• Rebalance between protocols</li>
                      <li>• Optimize yield strategies</li>
                      <li>• Adjust allocation ratios</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-pop font-medium text-gray-900">
                      🛡️ Safety Limits:
                    </h4>
                    <ul className="text-sm space-y-1 text-gray-600 font-pop">
                      <li>• Max $1,000 per transaction</li>
                      <li>• Valid for 1 week</li>
                      <li>• Only vault operations</li>
                      <li>• Cannot withdraw funds</li>
                    </ul>
                  </div>
                </div>

                <Button
                  onClick={handleCreateRebalanceDelegation}
                  disabled={loading}
                  className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white font-pop"
                >
                  {loading
                    ? "Creating Delegation..."
                    : "Grant Rebalancing Permissions"}
                </Button>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-green-100 text-green-800 border-green-200 font-pop">
                    ✅ Active
                  </Badge>
                  <span className="font-pop font-semibold text-green-900">
                    Rebalancing Delegation Active
                  </span>
                </div>
                <p className="text-sm text-gray-600 font-pop">
                  AI agent can now optimize your yields automatically within the
                  set limits.
                </p>
              </div>
            )}
          </div>

          {/* Deposit Delegation */}
          <div className="space-y-4">
            <h3 className="text-lg font-pop font-semibold text-gray-900">
              Step 3: Grant Deposit Permissions (Optional)
            </h3>

            {!depositDelegationCreated ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-600 font-pop mb-4">
                  Allow AI to automatically deposit additional funds when
                  opportunities arise.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <h4 className="font-pop font-medium text-gray-900">
                      ✅ Allowed Actions:
                    </h4>
                    <ul className="text-sm space-y-1 text-gray-600 font-pop">
                      <li>• Deposit additional funds</li>
                      <li>• Compound earnings</li>
                      <li>• DCA strategies</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-pop font-medium text-gray-900">
                      🛡️ Safety Limits:
                    </h4>
                    <ul className="text-sm space-y-1 text-gray-600 font-pop">
                      <li>• Max $5,000 per deposit</li>
                      <li>• Valid for 30 days</li>
                      <li>• Only deposit operations</li>
                      <li>• Cannot withdraw funds</li>
                    </ul>
                  </div>
                </div>

                <Button
                  onClick={handleCreateDepositDelegation}
                  disabled={loading}
                  className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white font-pop"
                >
                  {loading
                    ? "Creating Delegation..."
                    : "Grant Deposit Permissions"}
                </Button>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-green-100 text-green-800 border-green-200 font-pop">
                    ✅ Active
                  </Badge>
                  <span className="font-pop font-semibold text-green-900">
                    Deposit Delegation Active
                  </span>
                </div>
                <p className="text-sm text-gray-600 font-pop">
                  AI agent can now automatically deposit funds when profitable
                  opportunities are detected.
                </p>
              </div>
            )}
          </div>

          {/* Active Delegations Summary */}
          {activeDelegations.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-pop font-semibold text-gray-900 mb-2">
                Active Delegations ({activeDelegations.length})
              </h4>
              <div className="space-y-2">
                {activeDelegations.map((delegation, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-pop text-gray-600">
                      {delegation.type || "Unknown Type"}
                    </span>
                    <Badge className="bg-green-100 text-green-800 border-green-200 font-pop">
                      Active
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

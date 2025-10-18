/*
 * ===========================================
 * NEXYIELD ENVIO ANALYTICS DASHBOARD - HACKATHON WINNER
 * ===========================================
 * Simplified analytics dashboard powered by Envio
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  useVaultStats,
  useRecentActivity,
  useActivitySubscription,
  usePortfolioAnalytics,
  formatBigInt,
  calculateTotalAmount,
  getTimeAgo,
} from "../../hooks/useEnvioAnalytics";

// ===========================================
// REAL-TIME PORTFOLIO OVERVIEW
// ===========================================

export const RealTimePortfolioOverview: React.FC<{ userAddress: string }> = ({
  userAddress,
}) => {
  const { analytics, loading, error } = usePortfolioAnalytics(userAddress);

  if (loading) return <div className="animate-pulse">Loading portfolio...</div>;
  if (error)
    return (
      <div className="text-red-500">
        Error loading portfolio: {String(error)}
      </div>
    );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Deposits */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${formatBigInt(analytics?.totalDeposits || "0", 6)}
          </div>
          <p className="text-xs text-muted-foreground">
            {analytics?.depositCount || 0} transactions
          </p>
        </CardContent>
      </Card>

      {/* Total Withdrawals */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Total Withdrawals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            ${formatBigInt(analytics?.totalWithdrawals || "0", 6)}
          </div>
          <p className="text-xs text-muted-foreground">
            {analytics?.withdrawalCount || 0} transactions
          </p>
        </CardContent>
      </Card>

      {/* Net Flow */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Net Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${formatBigInt(analytics?.netFlow || "0", 6)}
          </div>
          <p className="text-xs text-muted-foreground">
            {Number(analytics?.netFlow || "0") >= 0 ? "Positive" : "Negative"}
          </p>
        </CardContent>
      </Card>

      {/* Rebalances */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Rebalances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {analytics?.rebalanceCount || 0}
          </div>
          <p className="text-xs text-muted-foreground">Strategy updates</p>
        </CardContent>
      </Card>
    </div>
  );
};

// ===========================================
// RECENT ACTIVITY FEED
// ===========================================

export const RecentActivityFeed: React.FC = () => {
  const { activity, loading, error } = useRecentActivity(10);

  if (loading) return <div className="animate-pulse">Loading activity...</div>;
  if (error)
    return (
      <div className="text-red-500">
        Error loading activity: {String(error)}
      </div>
    );

  const allActivities = [
    ...(activity?.deposits || []).map(
      (deposit: {
        id: string;
        user: string;
        amount: string;
        riskLevel: string;
      }) => ({
        ...deposit,
        type: "deposit",
        timestamp: deposit.id,
      })
    ),
    ...(activity?.withdrawals || []).map(
      (withdrawal: { id: string; user: string; amount: string }) => ({
        ...withdrawal,
        type: "withdraw",
        timestamp: withdrawal.id,
      })
    ),
    ...(activity?.rebalances || []).map(
      (rebalance: {
        id: string;
        user: string;
        fromProtocol: string;
        toProtocol: string;
        amount: string;
      }) => ({
        ...rebalance,
        type: "rebalance",
        timestamp: rebalance.id,
      })
    ),
  ].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {allActivities
            .slice(0, 10)
            .map(
              (activity: {
                id: string;
                user: string;
                amount: string;
                type: string;
                timestamp: string;
                riskLevel?: string;
              }) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activity.type === "deposit"
                          ? "bg-green-500"
                          : activity.type === "withdraw"
                          ? "bg-red-500"
                          : "bg-blue-500"
                      }`}
                    />
                    <div>
                      <p className="font-medium capitalize">{activity.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.user?.slice(0, 6)}...
                        {activity.user?.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ${formatBigInt(activity.amount, 6)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                </div>
              )
            )}
        </div>
      </CardContent>
    </Card>
  );
};

// ===========================================
// VAULT STATISTICS
// ===========================================

export const VaultStatistics: React.FC = () => {
  const { stats, loading, error } = useVaultStats();

  if (loading) return <div className="animate-pulse">Loading stats...</div>;
  if (error)
    return (
      <div className="text-red-500">Error loading stats: {String(error)}</div>
    );

  const totalDeposits = calculateTotalAmount(stats?.totalDeposits || []);
  const totalWithdrawals = calculateTotalAmount(stats?.totalWithdrawals || []);
  const totalInvestments = calculateTotalAmount(stats?.totalInvestments || []);
  const totalRebalances = calculateTotalAmount(stats?.totalRebalances || []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Vault Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              ${formatBigInt(totalDeposits, 6)}
            </div>
            <p className="text-sm text-muted-foreground">Total Deposits</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              ${formatBigInt(totalWithdrawals, 6)}
            </div>
            <p className="text-sm text-muted-foreground">Total Withdrawals</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              ${formatBigInt(totalInvestments, 6)}
            </div>
            <p className="text-sm text-muted-foreground">Total Investments</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              ${formatBigInt(totalRebalances, 6)}
            </div>
            <p className="text-sm text-muted-foreground">Total Rebalances</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


export const RealTimeActivityFeed: React.FC = () => {
  const { activity, loading, error } = useActivitySubscription();

  if (loading)
    return <div className="animate-pulse">Loading live activity...</div>;
  if (error)
    return (
      <div className="text-red-500">
        Error loading live activity: {String(error)}
      </div>
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          ⚡ Live Activity
          <Badge variant="secondary" className="ml-2">
            Real-time
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activity?.deposits
            ?.slice(0, 5)
            .map((deposit: { id: string; user: string; amount: string }) => (
              <div
                key={deposit.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-green-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <div>
                    <p className="font-medium">Deposit</p>
                    <p className="text-sm text-muted-foreground">
                      {deposit.user?.slice(0, 6)}...{deposit.user?.slice(-4)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">
                    +${formatBigInt(deposit.amount, 6)}
                  </p>
                </div>
              </div>
            ))}
          {activity?.withdrawals
            ?.slice(0, 5)
            .map((withdrawal: { id: string; user: string; amount: string }) => (
              <div
                key={withdrawal.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-red-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <div>
                    <p className="font-medium">Withdrawal</p>
                    <p className="text-sm text-muted-foreground">
                      {withdrawal.user?.slice(0, 6)}...
                      {withdrawal.user?.slice(-4)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-red-600">
                    -${formatBigInt(withdrawal.amount, 6)}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ===========================================
// MAIN ANALYTICS DASHBOARD
// ===========================================

export const EnvioAnalyticsDashboard: React.FC<{ userAddress: string }> = ({
  userAddress,
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "activity" | "stats" | "live"
  >("overview");

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: "overview", label: "Overview", icon: "📊" },
          { id: "activity", label: "Activity", icon: "📈" },
          { id: "stats", label: "Statistics", icon: "📊" },
          { id: "live", label: "Live Feed", icon: "⚡" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() =>
              setActiveTab(tab.id as "overview" | "activity" | "stats" | "live")
            }
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
              activeTab === tab.id
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <span>{tab.icon}</span>
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <RealTimePortfolioOverview userAddress={userAddress} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentActivityFeed />
            <VaultStatistics />
          </div>
        </div>
      )}

      {activeTab === "activity" && <RecentActivityFeed />}

      {activeTab === "stats" && <VaultStatistics />}

      {activeTab === "live" && <RealTimeActivityFeed />}
    </div>
  );
};

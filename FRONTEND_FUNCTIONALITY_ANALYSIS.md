# Frontend Functionality Analysis for NexYield Platform

## 📊 Available Smart Contract Data & Functions

Based on our smart contract implementation, here's what data and functionality we can display on the frontend:

---

## 🏦 **Dashboard Section**

### **User Portfolio Overview**

```typescript
// From FiYieldVault contract
interface UserPortfolio {
  userBalance: bigint; // getBalance(user)
  userShares: bigint; // shares[user]
  riskLevel: number; // getRiskLevel(user) (0=Conservative, 1=Balanced, 2=Aggressive)
  totalAssets: bigint; // totalAssets()
  totalSupply: bigint; // totalSupply()
}
```

### **Vault Statistics**

```typescript
interface VaultStats {
  totalAssets: bigint; // Total assets under management
  totalSupply: bigint; // Total shares issued
  assetAddress: string; // Asset token address (USDC, WBTC, etc.)
  agentExecutor: string; // AI agent address
  strategy: string; // Current strategy address
}
```

### **User Actions Available**

- ✅ **Deposit**: `deposit(assets, receiver)`
- ✅ **Withdraw**: `withdraw(amount)`
- ✅ **Redeem**: `redeem(shares, receiver, owner)`
- ✅ **Send Shares**: `sendShares(to, sharesAmount)`
- ✅ **Deposit with Risk**: `depositWithRisk(amount, riskLevel)`

---

## 📈 **Portfolio Section** (New!)

### **Personal Portfolio Metrics**

```typescript
interface PersonalPortfolio {
  // User's individual data
  myBalance: bigint; // getBalance(user)
  myShares: bigint; // shares[user]
  myRiskLevel: number; // getRiskLevel(user)

  // Portfolio performance
  totalDeposited: bigint; // Tracked via events
  totalWithdrawn: bigint; // Tracked via events
  currentValue: bigint; // myShares * pricePerShare
  unrealizedPnl: bigint; // currentValue - totalDeposited

  // Share information
  sharePrice: bigint; // totalAssets / totalSupply
  maxWithdraw: bigint; // maxWithdraw(user)
  maxRedeem: bigint; // maxRedeem(user)
}
```

### **Investment Performance**

```typescript
interface InvestmentPerformance {
  // Strategy performance
  totalInvested: bigint; // From AaveStrategy.getStrategyInfo()
  totalWithdrawn: bigint; // From AaveStrategy.getStrategyInfo()
  totalYield: bigint; // From AaveStrategy.getStrategyInfo()
  currentBalance: bigint; // From AaveStrategy.getStrategyInfo()

  // APY and rates
  currentAPY: number; // From MockAavePool.getCurrentAPY()
  liquidityRate: bigint; // From MockAavePool.getReserveData()

  // Historical data (from events)
  depositHistory: DepositEvent[];
  withdrawHistory: WithdrawEvent[];
  rebalanceHistory: RebalanceEvent[];
}
```

### **Risk Management**

```typescript
interface RiskProfile {
  currentRiskLevel: number; // 0=Conservative, 1=Balanced, 2=Aggressive
  riskLevelOptions: {
    Conservative: { apy: number; description: string };
    Balanced: { apy: number; description: string };
    Aggressive: { apy: number; description: string };
  };
  canChangeRisk: boolean; // Based on cooldowns
}
```

---

## 🤖 **AI Agent Section**

### **Agent Status & Operations**

```typescript
interface AgentStatus {
  // Agent configuration
  rebalanceCooldown: bigint; // AgentExecutor.rebalanceCooldown()
  depositCooldown: bigint; // AgentExecutor.depositCooldown()
  maxRebalanceAmount: bigint; // AgentExecutor.maxRebalanceAmount()
  maxDepositAmount: bigint; // AgentExecutor.maxDepositAmount()
  isPaused: boolean; // AgentExecutor.paused()

  // User-specific agent data
  lastRebalance: bigint; // getUserTimestamps(user).lastRebalance
  lastDeposit: bigint; // getUserTimestamps(user).lastDeposit
  canRebalance: boolean; // canRebalance(user)
  canDeposit: boolean; // canDeposit(user)
  rebalanceTimeRemaining: bigint;
  depositTimeRemaining: bigint;
}
```

### **Agent Activity Feed**

```typescript
interface AgentActivity {
  // Recent operations
  recentRebalances: RebalanceEvent[];
  recentInvestments: InvestEvent[];
  recentOptimizations: StrategyOptimizedEvent[];

  // Performance metrics
  totalOperations: number;
  successfulOperations: number;
  averageGasUsed: bigint;
  lastActivity: bigint;
}
```

---

## 💰 **Investment Section**

### **Strategy Information**

```typescript
interface StrategyInfo {
  // Strategy details
  asset: string; // AaveStrategy.getStrategyInfo()._asset
  aavePool: string; // AaveStrategy.getStrategyInfo()._aavePool
  aToken: string; // AaveStrategy.getStrategyInfo()._aToken

  // Performance metrics
  totalInvested: bigint; // AaveStrategy.getStrategyInfo()._totalInvested
  totalWithdrawn: bigint; // AaveStrategy.getStrategyInfo()._totalWithdrawn
  totalYield: bigint; // AaveStrategy.getStrategyInfo()._totalYield
  currentBalance: bigint; // AaveStrategy.getStrategyInfo()._currentBalance

  // Protocol data
  currentAPY: number; // MockAavePool.getCurrentAPY()
  liquidityRate: bigint; // MockAavePool.getReserveData()
  reserveData: ReserveData; // Full reserve data from MockAavePool
}
```

### **Yield Analytics**

```typescript
interface YieldAnalytics {
  // Current yields
  aaveAPY: number; // From MockAavePool
  compoundAPY: number; // Future integration
  yearnAPY: number; // Future integration

  // Historical performance
  dailyYield: number[];
  weeklyYield: number[];
  monthlyYield: number[];

  // Comparison metrics
  benchmarkComparison: {
    traditionalSavings: number;
    defiAverage: number;
    ourPerformance: number;
  };
}
```

---

## 🔄 **Transaction History**

### **User Transaction History**

```typescript
interface TransactionHistory {
  deposits: {
    amount: bigint;
    timestamp: bigint;
    riskLevel: number;
    txHash: string;
  }[];

  withdrawals: {
    amount: bigint;
    timestamp: bigint;
    txHash: string;
  }[];

  shareTransfers: {
    to: string;
    amount: bigint;
    timestamp: bigint;
    txHash: string;
  }[];

  rebalances: {
    fromProtocol: string;
    toProtocol: string;
    amount: bigint;
    timestamp: bigint;
    txHash: string;
  }[];
}
```

---

## 🎯 **Expected Frontend Components**

### **1. Dashboard Components**

- **Portfolio Overview Card**: Total balance, shares, risk level
- **Quick Actions**: Deposit, Withdraw, Send buttons
- **Performance Chart**: Historical balance/APY chart
- **AI Agent Status**: Current agent operations and cooldowns

### **2. Portfolio Components** (New Section!)

- **Personal Portfolio**: Individual user metrics and performance
- **Investment Breakdown**: Where funds are invested
- **Risk Profile**: Current risk level and options
- **Performance Analytics**: PnL, yield, historical data
- **Share Management**: Share price, max withdraw/redeem

### **3. AI Agent Components**

- **Agent Dashboard**: Status, cooldowns, recent activity
- **Operation History**: Timeline of agent actions
- **Configuration**: Current settings and limits
- **Performance Metrics**: Success rate, gas usage

### **4. Investment Components**

- **Strategy Overview**: Current strategy performance
- **Yield Comparison**: APY across different protocols
- **Protocol Analytics**: Aave, Compound, Yearn data
- **Investment History**: Track of all investments

### **5. Transaction Components**

- **Transaction History**: All user transactions
- **Event Timeline**: Real-time updates
- **Gas Tracking**: Gas costs for operations
- **Export Functionality**: Download transaction data

---

## 📱 **Frontend Data Flow**

### **Real-time Data Updates**

```typescript
// Hook for vault data
const useVaultData = () => {
  const userBalance = useReadContract({
    address: VAULT_ADDRESS,
    abi: FiYieldVaultABI,
    functionName: "getBalance",
    args: [userAddress],
  });

  const totalAssets = useReadContract({
    address: VAULT_ADDRESS,
    abi: FiYieldVaultABI,
    functionName: "totalAssets",
  });

  // ... more data fetching
};

// Hook for agent data
const useAgentData = () => {
  const canRebalance = useReadContract({
    address: AGENT_ADDRESS,
    abi: AgentExecutorABI,
    functionName: "canRebalance",
    args: [userAddress],
  });

  // ... more agent data
};
```

### **Event Listening**

```typescript
// Listen for real-time updates
useEffect(() => {
  const contract = new ethers.Contract(
    VAULT_ADDRESS,
    FiYieldVaultABI,
    provider
  );

  contract.on("Deposit", (user, amount, riskLevel) => {
    // Update UI with new deposit
    updateUserBalance();
  });

  contract.on("Invested", (amount) => {
    // Update strategy performance
    updateStrategyData();
  });

  // ... more event listeners
}, []);
```

---

## 🎨 **UI/UX Recommendations**

### **Portfolio Section Design**

1. **Portfolio Overview Card**

   - Current balance (large, prominent)
   - Share count and price
   - Risk level indicator
   - PnL (positive/negative with color coding)

2. **Performance Chart**

   - Line chart showing balance over time
   - APY trend
   - Comparison with benchmarks

3. **Investment Breakdown**

   - Pie chart of where funds are invested
   - Protocol allocation
   - Risk distribution

4. **Quick Actions Panel**
   - Deposit/Withdraw buttons
   - Send shares functionality
   - Risk level adjustment

### **AI Agent Dashboard**

1. **Agent Status Card**

   - Current status (Active/Paused)
   - Next available operation time
   - Recent activity count

2. **Operation Timeline**

   - Chronological list of agent actions
   - Success/failure indicators
   - Gas usage tracking

3. **Performance Metrics**
   - Success rate percentage
   - Average gas usage
   - Total operations count

---

## 🚀 **Implementation Priority**

### **Phase 1: Core Functionality**

- [x] Dashboard with basic portfolio overview
- [x] Deposit/Withdraw functionality
- [x] Send shares feature
- [x] Basic transaction history

### **Phase 2: Portfolio Section** (New!)

- [ ] Personal portfolio metrics
- [ ] Performance analytics
- [ ] Risk profile management
- [ ] Investment breakdown

### **Phase 3: AI Agent Features**

- [ ] Agent status dashboard
- [ ] Operation history
- [ ] Cooldown tracking
- [ ] Performance metrics

### **Phase 4: Advanced Analytics**

- [ ] Yield comparison charts
- [ ] Historical performance
- [ ] Benchmark comparisons
- [ ] Export functionality

---

## 📊 **Data Sources Summary**

| Data Type     | Source Contract | Function                  | Purpose            |
| ------------- | --------------- | ------------------------- | ------------------ |
| User Balance  | FiYieldVault    | `getBalance(user)`        | Personal portfolio |
| User Shares   | FiYieldVault    | `shares[user]`            | Share ownership    |
| Risk Level    | FiYieldVault    | `getRiskLevel(user)`      | Risk profile       |
| Total Assets  | FiYieldVault    | `totalAssets()`           | Vault overview     |
| Strategy Info | AaveStrategy    | `getStrategyInfo()`       | Investment data    |
| APY Data      | MockAavePool    | `getCurrentAPY()`         | Yield information  |
| Agent Status  | AgentExecutor   | `canRebalance(user)`      | AI operations      |
| Cooldowns     | AgentExecutor   | `getUserTimestamps(user)` | Operation limits   |

---

_This analysis provides a comprehensive overview of all available data and functionality from our smart contracts that can be displayed on the frontend, with special focus on the new Portfolio section._

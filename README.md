# FiYield: Your Assets Works While You Sleep

AI-Powered Autonomous Yield Optimization on Monad

> _Deposit once. Delegate. Done. Your personal DeFi portfolio manager that never sleeps._ 


---


## 🎯 The Problem: DeFi Is Broken for Real Users

Sarah has $1,000 in USDC earning 0.5% in her bank. She's heard DeFi offers 8-12% yields but:

- 240+ protocols to research - Which ones are safe? Which have the best APY right now?
- Yields change hourly - That 12% APY on Aave? Now it's 7%. A new protocol offers 14%, but is it audited?
- Manual rebalancing is impossible - By the time she moves funds, the opportunity is gone
- Gas fees eat profits - Spent $15 in gas to chase a 2% better APY
- Technical overwhelm - "What's impermanent loss? How do I read an audit report?"

Sarah gives up and returns to her 0.5% savings account.

This is DeFi's mass adoption barrier. Monad's 10,000 TPS and 1-second finality solve the *speed* problem. But speed means nothing if users can't capture opportunities.

---

 ## 💡 Our Solution

FiYield is an autonomous AI agent that manages your DeFi positions using MetaMask Smart Accounts delegations. It's like having a professional portfolio manager working 24/7—but you stay in complete control.

### ⚡️ The Magic: One-Time Setup, Lifetime Optimization


Traditional DeFi           →  FiYield
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Research protocols        ✅ AI researches for you
2. Approve transaction       ✅ Grant permission ONCE
3. Swap to Protocol A        ✅ AI executes automatically
4. Monitor APY daily         ✅ AI monitors 24/7
5. Approve transaction       ❌ No more approvals needed
6. Swap to Protocol B        ✅ AI rebalances instantly
7. Pay gas fees (again)      ✅ Gasless transactions
8. Repeat 10x per week...    ✅ Sleep peacefully 😴

Time spent: 10+ hours/week   Time spent: 5 minutes (setup)
Gas fees: $50-200/month      Gas fees: $0 (sponsored)
Mental energy: Exhausting    Mental energy: Zero



### Core Features

**1. Delegation-Powered Autonomy**

- Users grant scoped permissions via MetaMask Smart Accounts (ERC-4337 + ERC-7710)
- AI agent executes rebalancing transactions automatically within defined risk parameters
- Gasless transactions through account abstraction—no manual approvals needed

**2. AI-Driven Yield Optimization**

- Real-time analysis of protocol performance, TVL trends, and audit scores
- Predictive modeling to identify sustainable vs. inflated APYs
- Automated rebalancing when better opportunities emerge (15%+ threshold)

**3. Risk-Adjusted Strategy Engine**

- Users select risk tolerance: Conservative (5-8% APY) | Balanced (8-12%) | Aggressive (12%+)
- AI only allocates to protocols meeting safety criteria (audit status, TVL stability, historical performance)
- Diversification across multiple protocols to minimize smart contract risk

**4. Monad-Native Performance**

- Leverages Monad's 1-second blocks for instant rebalancing
- 10,000 TPS enables cost-effective position adjustments
- Single-slot finality ensures secure, atomic operations

**5. Real-Time Monitoring via Envio**

- HyperSync integration for millisecond-latency protocol data
- GraphQL queries track APY changes, TVL movements, and risk events
- Webhook-based alerts trigger agent actions

---

## 🏗️ Technical Architecture

### Smart Contracts (Solidity)

```
FiYieldVault.sol          → User deposit vault with role-based access
AgentExecutor.sol         → Executes delegated actions on behalf of users
StrategyRegistry.sol      → Whitelists safe protocols (Aave, Compound, etc.)
RiskOracle.sol           → On-chain risk scoring (TVL, audits, exploit history)
```

### AI Agent Backend (Python/FastAPI)

- **Yield Predictor**: Scikit-learn model trained on historical APY data
- **Risk Analyzer**: Analyzes protocol audit reports, TVL stability, and on-chain metrics
- **Rebalancing Engine**: Executes trades when yield differentials exceed thresholds
- **Delegation Manager**: Interfaces with MetaMask Smart Accounts SDK

### Data Layer (Envio HyperSync)

- Indexes protocol events across Monad testnet
- Real-time GraphQL API for APY feeds, liquidity changes, and exploit detection
- Sub-second query latency for agent decision-making

### Frontend (Next.js + MetaMask SDK)

- Delegation setup interface (grant/revoke permissions)
- Portfolio dashboard with live yield tracking
- Risk tolerance configuration
- Transaction history and performance analytics

---

## 🔐 Security & Trust

### Scoped Delegations

- Users maintain custody of funds at all times
- Agent can only execute rebalancing transactions within approved protocols
- Time-bound delegations (1 week default) with instant revocation

### Multi-Layer Risk Protection

1. **Protocol Whitelist**: Only audited, high-TVL protocols eligible
2. **Position Limits**: Maximum 30% allocation to any single protocol
3. **Circuit Breakers**: Auto-pause if TVL drops >20% or exploit detected
4. **Simulation Mode**: Test strategies with virtual funds before going live

### Smart Contract Security

- Comprehensive test coverage (Foundry)
- Timelock on protocol whitelist changes
- Emergency withdrawal function (user-initiated)

---

### 🎨 Why Non-Technical Users Finally "Get" DeFi

Most DeFi products say "we're easy" but still require:
- Understanding seed phrases
- Managing gas fees across chains
- Approving every transaction
- Reading smart contract audits


FiYield eliminates ALL of this:

#### Before FiYield (Traditional DeFi):


❌ "Download MetaMask, save seed phrase, buy crypto,
    bridge to Monad, approve USDC, stake in Protocol A,
    monitor APY, approve again, swap to Protocol B..."
    
Result: 95% of users quit at step 2

#### With FiYield (Delegated DeFi):

✅ 1. Connect wallet (email/social login via MetaMask)
✅ 2. Deposit $100 USDC (credit card → USDC on-ramp)
✅ 3. Choose risk level: "Conservative" (like picking a mutual fund)
✅ 4. Click "Start Earning" (grant delegation once)
✅ 5. Go live your life 🎉

Result: Grandma can use DeFi


#### The Delegation Magic Users Experience:

| Without Smart Accounts | With FiYield Smart Accounts |
|------------------------|----------------------------|
| 🔴 Pop-up: "Approve transaction" | ✅ No pop-ups ever again |
| 🔴 Pop-up: "Approve transaction" | ✅ AI handles everything |
| 🔴 Pop-up: "Approve transaction" | ✅ Permission granted once |
| 🔴 (20 times per week...) | ✅ Revoke anytime with 1 click |
| 💸 $50/month in gas fees | 💚 $0 gas (sponsored) |
| 😰 Constant anxiety | 😴 Sleep peacefully |

Mental Model Users Understand:
> "It's like setting up autopay for your bills. Grant permission once, forget about it, but you can cancel anytime."

---

### ⚡️ Monad-Native Performance Advantage

FiYield isn't just *deployed* on Monad—it's architected for Monad:

1. Speed = Competitive Edge
- 1-second blocks → Capture yield opportunities before competitors
- 10,000 TPS → Rebalance 1,000 users simultaneously without congestion
- Single-slot finality → No risk of reorganizations during rebalancing

Example: New protocol launches with 15% APY (audited, safe)
- On Ethereum: 12-15 minutes to rebalance → Opportunity gone
- On FiYield/Monad: 1 second → Users capture full 15% APY

2. Gas Economics That Actually Work
- Monad's low fees make continuous optimization profitable
- On Ethereum: $20 gas to move $100 → Not worth it
- On Monad: $0.01 gas to move $100 → Optimize 10x/day profitably

3. Real-Time Data Pipeline
- Envio HyperSync provides millisecond-latency protocol data
- AI agent processes 240+ protocol APYs in <100ms
- Executes trades before yield differentials disappear

---

### 🔐 Security & Trust: Delegation Done Right

Users' #1 Fear: *"What if the AI steals my money?"*

FiYield's Answer: Scoped delegations with multiple safety layers.

#### Layer 1: Permission Boundaries

// User grants delegation with strict caveats:
Delegation {
  allowedContracts: [Aave, Compound, Yearn],  // Whitelist only
  maxAmountPerTx: 30% of portfolio,           // Position limits
  expiresAt: block.timestamp + 7 days,        // Auto-expire
  canTransferToEOA: false                     // No external transfers
}


#### Layer 2: Risk Oracle (On-Chain Safety Checks)

AI Decision: "Move 50% to NewProtocol (18% APY)"
                    ↓
Risk Oracle Validation:
  ✅ Audit score: 95/100 (OpenZeppelin audited)
  ✅ TVL: $50M (stable for 6 months)
  ✅ Exploit history: 0 incidents
  ✅ Community reputation: High
                    ↓
Execution Approved → Transaction Sent


#### Layer 3: Emergency Controls
- Instant Revocation: One-click to revoke delegation (3-second confirmation)
- Circuit Breakers: Auto-pause if TVL drops >20% in any protocol
- User Withdrawal: Bypass agent, withdraw funds directly (always available)

#### Layer 4: Transparent Monitoring

Dashboard shows:
┌─────────────────────────────────────┐
│ Delegation Status: Active ⚡️        │
│ Expires in: 5 days                  │
│                                     │
│ Permissions:                        │
│ ✓ Rebalance between: Aave, Compound│
│ ✓ Maximum per move: 30%            │
│ ✗ Cannot transfer to external wallet│
│                                     │
│ [Revoke Access] [Extend 7 Days]    │
└─────────────────────────────────────┘

Recent Activity:
  Mar 15: Moved $30 USDC → Aave (8.5% APY)
  Mar 14: Moved $20 USDC → Compound (9.2% APY)
  All transactions ↗️ verified on Monad Explorer


---

### 📊 Envio Integration: The Data Backbone

1. Protocol Performance Monitoring

query ProtocolAPYs {
  protocols {
    name
    currentAPY
    tvlUSD
    tvlChangePercent24h
    lastAuditDate
    exploitCount
  }
}

- Sub-second query latency for instant decision-making
- Indexes APY changes, liquidity movements, exploit events
- Powers AI agent's rebalancing engine

2. Risk Event Detection
- Webhook alerts trigger agent actions:
  - TVL drops >15%? → Withdraw from protocol
  - New audit published? → Update risk score
  - Flash loan attack detected? → Pause all operations

3. User Portfolio Analytics

// Real-time dashboard powered by Envio
const userMetrics = await envio.query({
  userAddress: "0x...",
  metrics: ["totalValue", "apyHistory", "rebalanceCount"]
});

// Result: "Your AI made 12 moves this month, +2.3% vs holding"


---

## 🎮 User Experience: 5-Minute Setup to Lifetime Earnings

### The Complete User Journey

Step 1: Connect & Create Smart Account (60 seconds)

┌──────────────────────────────────┐
│  Welcome to FiYield 👋          │
│                                  │
│  [Connect with MetaMask]         │
│  [Continue with Email] ← New!   │
│                                  │
│  Creating your Smart Account... │
│  ✓ Account deployed on Monad    │
└──────────────────────────────────┘

- No seed phrases to save (passkey-based authentication)
- One-click Smart Account deployment (ERC-4337)

Step 2: Configure Your Strategy (90 seconds)

┌──────────────────────────────────┐
│  How much would you like to      │
│  optimize?                       │
│                                  │
│  [$___] USDC                     │
│                                  │
│  Choose your risk tolerance:     │
│  ○ Conservative (5-8% target)   │
│      Low risk, audited only     │
│                                  │
│  ● Balanced (8-12% target)      │
│      Medium risk, diversified   │
│                                  │
│  ○ Aggressive (12%+ target)     │
│      Higher risk, max returns   │
│                                  │
│  [Continue →]                    │
└──────────────────────────────────┘

- Simple, jargon-free language
- Clear risk/return tradeoffs
- Social proof: "94% of users choose Balanced"

Step 3: Grant Delegation (90 seconds)

┌──────────────────────────────────┐
│  Grant Permission to AI Agent    │
│                                  │
│  FiYield will:                   │
│  ✓ Monitor 240+ DeFi protocols   │
│  ✓ Move your funds to best yields│
│  ✓ Rebalance automatically 24/7  │
│                                  │
│  FiYield cannot:                 │
│  ✗ Transfer funds to other wallets│
│  ✗ Use protocols you don't approve│
│  ✗ Continue after 7 days (renew) │
│                                  │
│  [Review Permissions →]          │
└──────────────────────────────────┘

- Transparent permission display
- Clear dos and don'ts
- Time-bound with expiration countdown

Step 4: Confirm & Start Earning (30 seconds)

┌──────────────────────────────────┐
│  ✨ You're All Set!              │
│                                  │
│  Deposit: $100 USDC              │
│  Strategy: Balanced (8-12% APY)  │
│  Duration: 7 days (renewable)    │
│                                  │
│  Your AI agent will start        │
│  optimizing in 3... 2... 1...    │
│                                  │
│  [Go to Dashboard]               │
└──────────────────────────────────┘



### Example Scenario

```
User deposits $100 USDC | Risk: Balanced (8-12% target APY)
├─ AI allocates: $50 → Aave (8.5% APY) + $50 → Compound (9.2% APY)
├─ Day 3: New protocol offers 11.5% APY (passes safety checks)
├─ Agent executes rebalancing: $50 Compound → New Protocol
└─ Result: Portfolio APY increases from 8.85% → 10% (automated, gasless)
```

---

## 🏆 Why FiYield

✅ **Core Delegation Use**: AI agent relies entirely on MetaMask Smart Accounts delegations  
✅ **Autonomous Execution**: Rebalances without user interaction after initial setup  
✅ **Real Yield**: Connects to actual protocols on Monad testnet (not simulated)  
✅ **Monad-Native**: Leverages 1s blocks and 10k TPS for competitive advantage  
✅ **Envio Integration**: HyperSync powers real-time data pipeline for agent decisions

### Competitive Advantages

1. **First-Mover on Monad**: No existing yield aggregators leverage Monad's speed
2. **True Autonomy**: Unlike manual yield farms, FiYield runs 24/7 without user input
3. **Risk-Aware AI**: Not just chasing APY—evaluates protocol safety in real-time
4. **Gasless UX**: Account abstraction eliminates friction of constant transaction approvals

---

## 🛠️ Tech Stack

| Layer                   | Technology                                  |
| ----------------------- | ------------------------------------------- |
| **Blockchain**          | Monad Testnet (EVM-compatible L1)           |
| **Account Abstraction** | MetaMask Smart Accounts (ERC-4337/ERC-7710) |
| **Smart Contracts**     | Solidity 0.8.x, Foundry, OpenZeppelin       |
| **AI/ML**               | Python, FastAPI, Scikit-learn, Pandas       |
| **Indexing**            | Envio HyperSync, GraphQL                    |
| **Frontend**            | Next.js 14, TypeScript, Tailwind CSS        |
| **Wallet Integration**  | MetaMask Delegation Toolkit SDK             |
| **Oracles**             | Chainlink (price feeds), Custom Risk Oracle |

---

## Smart Account life circle in FiYield

     ┌─────────────────────────────────────────────┐
     │           USER VISITS YOUR DAPP             │
     └─────────────────────────────────────────────┘
                               │
                               ▼
          ┌─────────────────────────────────┐
          │  1️⃣ User Connects with Privy or │
          │      MetaMask Wallet             │
          └─────────────────────────────────┘
                               │
                               ▼
             (Privy returns wallet info)
                               │
                               ▼
          ┌─────────────────────────────────┐
          │  2️⃣ createSmartAccount() called │
          │  - Gets MetaMask provider        │
          │  - Creates wallet client         │
          │  - Generates smart account using │
          │    toMetaMaskSmartAccount()      │
          │  - Checks if deployed + balance  │
          └─────────────────────────────────┘
                               │
                               ▼
          ┌─────────────────────────────────┐
          │   SMART ACCOUNT CREATED LOCALLY  │
          │   (Not yet on-chain, but has a   │
          │    deterministic address)        │
          └─────────────────────────────────┘
                               │
                               ▼
          ┌─────────────────────────────────┐
          │  3️⃣ deploySmartAccount() called  │
          │  - Builds ERC-4337 UserOperation │
          │  - Sends via bundlerClient       │
          │  - Waits for receipt confirmation│
          │  - Marks `isDeployed = true`     │
          └─────────────────────────────────┘
                               │
                               ▼
          ┌─────────────────────────────────┐
          │   SMART ACCOUNT DEPLOYED        │
          │   (Now lives on-chain and can   │
          │    send transactions, hold funds)│
          └─────────────────────────────────┘
                               │
                               ▼
          ┌─────────────────────────────────┐
          │  4️⃣ createDelegation()          │
          │  - Define who can act on behalf  │
          │    of the smart account          │
          │  - Adds caveats (limits, expiry) │
          │  - Signs delegation              │
          │  - Saves to state                │
          └─────────────────────────────────┘
                               │
                               ▼
          ┌─────────────────────────────────┐
          │   DELEGATION CREATED             │
          │   (AI agent, auto-yield bot,     │
          │    or other service can operate  │
          │    within limits you define)     │
          └─────────────────────────────────┘
                               │
                               ▼
          ┌─────────────────────────────────┐
          │  5️⃣ refreshSmartAccount()        │
          │  - Checks if deployed            │
          │  - Fetches balance + bytecode    │
          │  - Keeps UI updated              │
          └─────────────────────────────────┘

---

### ✅ Deliverables (Completed)
- [x] Smart contracts deployed on Monad testnet
- [x] MetaMask Smart Accounts delegation integration
- [x] AI agent with autonomous rebalancing logic
- [x] Envio HyperSync indexer for protocol data
- [x] Functional frontend with delegation management
- [x] Comprehensive demo video
- [x] Risk oracle with safety checks
- [x] Gasless transactions via ERC-4337

---

### 🎯 Post-Hackathon (Q4 2025)
Phase 1: Mainnet Launch
- Security audit (OpenZeppelin)
- Mainnet deployment on Monad
- Expand protocol whitelist (Curve, Balancer, Yearn equivalents)
- Insurance fund for smart contract risks

Phase 2: Feature Expansion
- LP farming strategies (Uniswap V3, Sushi)
- Leveraged staking (borrow to multiply yields)
- Cross-chain support (Monad + Base/Arbitrum)
- Mobile app (iOS/Android)

Phase 3: Community & Growth
- Farcaster Mini App for social yield sharing
- "Copy Trader" feature (follow successful strategies)
- DAO governance for protocol whitelist decisions
- Referral program (earn % of friends' yields)

---



**Getting Started**

1. Add Monad testnet to MetaMask ([network details](https://docs.monad.xyz/developer-essentials/network-information))
2. Get testnet MON from [Monad faucet](https://testnet.monad.xyz)
3. Visit FiYield dApp and create Smart Account
4. Deposit testnet USDC and configure delegation

---

---

## 📚 Resources

- [MetaMask Delegation Toolkit Docs](https://docs.metamask.io/delegation-toolkit/)
- [Monad Developer Essentials](https://docs.monad.xyz/developer-essentials/network-information)
- [Envio HyperSync Guides](https://docs.envio.dev/docs/HyperIndex/configuration-file)
- [ERC-4337 Specification](https://eips.ethereum.org/EIPS/eip-4337)

---

## 🔗 Links

- Live Demo: [fiyield.vercel.app](https://fi-yield.vercel.app/)
- GitHub: [github.com/yourteam/fiyield](https://github.com/JamesVictor-O/FiYield)
- Demo Video: [YouTube Link](YOUR_VIDEO)
- Twitter: [@FiYield](https://x.com/YieldFi54019)
- Discord: [Join our community](DISCORD_LINK)

## 📄 License

MIT License - Open source for the Monad ecosystem

---

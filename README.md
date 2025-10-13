# FiYield: Autonomous DeFi Yield Optimization on Monad


**FiYield** is an AI-powered yield optimization agent that uses MetaMask Smart Accounts delegations to autonomously manage your DeFi investments on Monad. Deposit once, set your risk tolerance, and let the AI agent continuously hunt for the best yields while you sleep.

---

## 🎯 The Problem

DeFi on Monad offers incredible yield opportunities across dozens of protocols, but capturing them is complex:

- **Research Overhead**: Users must constantly monitor TVL, APYs, audit reports, and protocol health across 240+ protocols
- **Timing Challenges**: Best yields disappear within hours; manual rebalancing is too slow on a 1-second finality chain
- **Technical Barriers**: Understanding smart contract risks, liquidity pools, and impermanent loss requires deep expertise
- **Gas Inefficiency**: Manual position management eats into returns, especially for smaller portfolios

**The gap**: Monad's 10,000 TPS and 1-second blocks enable real-time yield optimization, but users can't act fast enough to capture opportunities.

---

## 💡 Our Solution

FiYield is an **autonomous AI agent** that manages DeFi positions on your behalf using MetaMask Smart Accounts delegations:

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

## 🎮 User Flow

1. **Connect Wallet**: Link MetaMask to FiYield dApp on Monad testnet
2. **Create Smart Account**: Deploy ERC-4337 account via MetaMask SDK
3. **Configure Strategy**: 
   - Deposit amount (e.g., $100 USDC)
   - Risk tolerance (Conservative/Balanced/Aggressive)
   - Delegation duration (1 week default)
4. **Grant Delegation**: Approve AI agent to execute rebalancing within parameters
5. **Earn Passively**: AI monitors 24/7, auto-rebalancing to maximize yield
6. **Track Performance**: Real-time dashboard shows APY, rebalancing history, and earnings

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

| Layer | Technology |
|-------|-----------|
| **Blockchain** | Monad Testnet (EVM-compatible L1) |
| **Account Abstraction** | MetaMask Smart Accounts (ERC-4337/ERC-7710) |
| **Smart Contracts** | Solidity 0.8.x, Foundry, OpenZeppelin |
| **AI/ML** | Python, FastAPI, Scikit-learn, Pandas |
| **Indexing** | Envio HyperSync, GraphQL |
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS |
| **Wallet Integration** | MetaMask Delegation Toolkit SDK |
| **Oracles** | Chainlink (price feeds), Custom Risk Oracle |

---
## Smart Account life circle in NextYield

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
------

## 📊 Demo Video Highlights

Our submission video demonstrates:
1. ✅ Creating a MetaMask Smart Account on Monad testnet
2. ✅ Granting delegation to FiYield AI agent with scoped permissions
3. ✅ Live deposit of USDC into FiYield vault
4. ✅ AI agent analyzing protocol APYs via Envio data
5. ✅ Autonomous rebalancing transaction executed by agent (gasless)
6. ✅ Dashboard showing real-time yield tracking and delegation status

---

## 🚀 Roadmap

### Hackathon Deliverables (Now)
- ✅ Working smart contracts on Monad testnet
- ✅ MetaMask Smart Accounts delegation integration
- ✅ AI agent executing rebalancing logic
- ✅ Envio HyperSync indexer tracking protocol data
- ✅ Functional frontend with delegation management

### Post-Hackathon (Q4 2025)
- Expand protocol whitelist (Yearn, Balancer, Curve equivalents)
- Social yield sharing via Farcaster Mini App
- Cross-chain support (Monad + Ethereum L2s)
- Advanced strategies (LP farming, leveraged staking)

---

## 🧪 Try It Now

**Monad Testnet Deployment**  
- Vault Contract: `0x...` (insert deployed address)
- Agent Executor: `0x...`
- Frontend: `https://fiyield.vercel.app`

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

## 📄 License

MIT License - Open source for the Monad ecosystem

---


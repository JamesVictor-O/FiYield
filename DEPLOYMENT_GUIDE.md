# NexYield Deployment Guide - Monad Testnet

## Overview

This guide will help you deploy the NexYield contracts to Monad Testnet and update the frontend with the deployed addresses.

## Prerequisites

1. **Environment Setup**

   ```bash
   # Set your private key (without 0x prefix)
   export PRIVATE_KEY="your_private_key_here"

   # Set Monad testnet RPC URL
   export MONAD_RPC_URL="https://testnet-rpc.monad.xyz"
   ```

2. **Get Testnet Tokens**
   - Visit Monad testnet faucet to get testnet tokens
   - You'll need tokens for gas fees

## Deployment Steps

### 1. Deploy Contracts

```bash
cd contracts

# Deploy to Monad testnet
forge script script/DeployMonad.s.sol --rpc-url $MONAD_RPC_URL --broadcast --verify
```

### 2. Update Frontend Addresses

After successful deployment, update the frontend with the new contract addresses:

```bash
# Run the update script
node scripts/update-frontend-addresses.js
```

### 3. Verify Deployment

Check that the contracts are deployed correctly:

```bash
# Check contract addresses
cat deployed-addresses.json

# Verify contracts on Monad explorer
# Visit: https://testnet.monadexplorer.com
```

## Contract Architecture

### Core Contracts

1. **FiYieldVault** - Main vault contract for user deposits

   - Users deposit USDC
   - Tracks user balances and risk levels
   - Integrates with strategies

2. **AgentExecutor** - AI agent execution contract

   - Executes rebalancing operations
   - Manages delegation permissions
   - Enforces cooldowns and limits

3. **AaveStrategy** - Mock Aave integration

   - Simulates Aave lending protocol
   - Generates yield for users
   - Handles invest/withdraw operations

4. **MockAavePool** - Mock Aave pool for testing

   - Simulates Aave pool functionality
   - Returns mock interest rates

5. **MockUSDC** - Mock USDC token for testing
   - 6 decimal precision
   - Mintable for testing

## User Flow

### 1. User Onboarding

- User connects wallet (MetaMask, Privy, etc.)
- Creates smart account (optional)
- Sets up delegation to AI agent

### 2. Deposit Process

- User approves USDC spending
- User deposits into FiYieldVault
- Vault tracks user balance and risk level

### 3. AI Delegation

- User delegates investment decisions to AI
- AI can rebalance between strategies
- AI can invest funds into yield-generating protocols

### 4. Yield Generation

- AI invests funds into AaveStrategy
- Strategy generates yield through mock Aave
- Users can withdraw their deposits + yield

## Frontend Integration

### Contract Addresses

The frontend automatically uses the deployed contract addresses from:

- `frontend/src/components/contract/addresses/index.ts`

### Key Functions

1. **Deposit**

   ```typescript
   vault.deposit(amount, receiver);
   ```

2. **Withdraw**

   ```typescript
   vault.withdraw(amount);
   ```

3. **Delegation Setup**

   ```typescript
   createDelegation(smartAccount, agentExecutor, vault, maxAmount, duration);
   ```

4. **AI Operations**
   ```typescript
   agentExecutor.investFunds(vault, amount);
   agentExecutor.rebalance(user, fromProtocol, toProtocol, amount);
   ```

## Testing

### Manual Testing Steps

1. **Deploy Contracts**

   ```bash
   forge script script/DeployMonad.s.sol --rpc-url $MONAD_RPC_URL --broadcast
   ```

2. **Test Deposit**

   - Connect wallet to frontend
   - Approve USDC spending
   - Deposit test amount

3. **Test Delegation**

   - Create smart account
   - Set up delegation to AI
   - Verify delegation is active

4. **Test AI Operations**
   - AI invests funds into strategy
   - AI rebalances between protocols
   - Verify yield generation

### Automated Testing

```bash
# Run tests
forge test

# Run specific test
forge test --match-test testDeposit
```

## Troubleshooting

### Common Issues

1. **"Insufficient funds"**

   - Check you have enough testnet tokens
   - Verify private key is correct

2. **"Contract not found"**

   - Ensure contracts are deployed
   - Check contract addresses in frontend

3. **"Delegation failed"**
   - Verify MetaMask delegation toolkit is working
   - Check smart account is properly created

### Debug Commands

```bash
# Check deployment status
forge script script/DeployMonad.s.sol --rpc-url $MONAD_RPC_URL

# Verify contract code
cast code <contract_address> --rpc-url $MONAD_RPC_URL

# Check contract state
cast call <contract_address> "totalAssets()" --rpc-url $MONAD_RPC_URL
```

## Next Steps

After successful deployment:

1. **Update Documentation**

   - Update contract addresses in README
   - Document any custom configurations

2. **Monitor Performance**

   - Track gas usage
   - Monitor transaction success rates
   - Check yield generation

3. **User Testing**

   - Test with real users
   - Gather feedback
   - Iterate on improvements

4. **Production Preparation**
   - Security audit
   - Performance optimization
   - Mainnet deployment planning

## Support

For issues or questions:

- Check the troubleshooting section
- Review contract logs
- Contact the development team

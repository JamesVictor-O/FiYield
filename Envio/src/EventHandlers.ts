/*
 * ===========================================
 * NEXYIELD ENVIO EVENT HANDLERS - HACKATHON WINNER
 * ===========================================
 * Simplified event processing for real-time analytics
 */

import {
  FiYieldVault,
  FiYieldVault_Deposit,
  FiYieldVault_Invested,
  FiYieldVault_OwnershipTransferred,
  FiYieldVault_Rebalanced,
  FiYieldVault_StrategySet,
  FiYieldVault_Withdraw,
} from "generated";

// ===========================================
// CORE EVENT HANDLERS
// ===========================================

FiYieldVault.Deposit.handler(async ({ event, context }) => {
  const entityId = `${event.chainId}_${event.block.number}_${event.logIndex}`;

  // Store basic deposit event
  const depositEntity: FiYieldVault_Deposit = {
    id: entityId,
    user: event.params.user,
    amount: event.params.amount,
    riskLevel: event.params.riskLevel,
  };
  context.FiYieldVault_Deposit.set(depositEntity);
});

FiYieldVault.Withdraw.handler(async ({ event, context }) => {
  const entityId = `${event.chainId}_${event.block.number}_${event.logIndex}`;

  // Store basic withdraw event
  const withdrawEntity: FiYieldVault_Withdraw = {
    id: entityId,
    user: event.params.user,
    amount: event.params.amount,
  };
  context.FiYieldVault_Withdraw.set(withdrawEntity);
});

FiYieldVault.Rebalanced.handler(async ({ event, context }) => {
  const entityId = `${event.chainId}_${event.block.number}_${event.logIndex}`;

  // Store rebalance event
  const rebalanceEntity: FiYieldVault_Rebalanced = {
    id: entityId,
    user: event.params.user,
    fromProtocol: event.params.fromProtocol,
    toProtocol: event.params.toProtocol,
    amount: event.params.amount,
  };
  context.FiYieldVault_Rebalanced.set(rebalanceEntity);
});

FiYieldVault.Invested.handler(async ({ event, context }) => {
  const entityId = `${event.chainId}_${event.block.number}_${event.logIndex}`;

  // Store invested event
  const investedEntity: FiYieldVault_Invested = {
    id: entityId,
    amount: event.params.amount,
  };
  context.FiYieldVault_Invested.set(investedEntity);
});

FiYieldVault.StrategySet.handler(async ({ event, context }) => {
  const entityId = `${event.chainId}_${event.block.number}_${event.logIndex}`;

  // Store strategy set event
  const strategyEntity: FiYieldVault_StrategySet = {
    id: entityId,
    strategy: event.params.strategy,
  };
  context.FiYieldVault_StrategySet.set(strategyEntity);
});

FiYieldVault.OwnershipTransferred.handler(async ({ event, context }) => {
  const entityId = `${event.chainId}_${event.block.number}_${event.logIndex}`;

  // Store ownership transfer event
  const ownershipEntity: FiYieldVault_OwnershipTransferred = {
    id: entityId,
    previousOwner: event.params.previousOwner,
    newOwner: event.params.newOwner,
  };
  context.FiYieldVault_OwnershipTransferred.set(ownershipEntity);
});

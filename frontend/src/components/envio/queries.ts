/*
 * ===========================================
 * NEXYIELD ENVIO QUERIES - HACKATHON WINNER
 * ===========================================
 * Basic GraphQL queries for Envio integration
 */

// ===========================================
// BASIC EVENT QUERIES
// ===========================================

export const GET_DEPOSITS = `
  query GetDeposits($limit: Int = 10) {
    fiYieldVault_Deposits(first: $limit, orderBy: id, orderDirection: desc) {
      id
      user
      amount
      riskLevel
    }
  }
`;

export const GET_WITHDRAWALS = `
  query GetWithdrawals($limit: Int = 10) {
    fiYieldVault_Withdraws(first: $limit, orderBy: id, orderDirection: desc) {
      id
      user
      amount
    }
  }
`;

export const GET_REBALANCES = `
  query GetRebalances($limit: Int = 10) {
    fiYieldVault_Rebalanceds(first: $limit, orderBy: id, orderDirection: desc) {
      id
      user
      fromProtocol
      toProtocol
      amount
    }
  }
`;

export const GET_INVESTMENTS = `
  query GetInvestments($limit: Int = 10) {
    fiYieldVault_Investeds(first: $limit, orderBy: id, orderDirection: desc) {
      id
      amount
    }
  }
`;

export const GET_STRATEGIES = `
  query GetStrategies($limit: Int = 10) {
    fiYieldVault_StrategySets(first: $limit, orderBy: id, orderDirection: desc) {
      id
      strategy
    }
  }
`;

// ===========================================
// USER-SPECIFIC QUERIES
// ===========================================

export const GET_USER_DEPOSITS = `
  query GetUserDeposits($userAddress: String!, $limit: Int = 10) {
    fiYieldVault_Deposits(
      where: { user: $userAddress }
      first: $limit
      orderBy: id
      orderDirection: desc
    ) {
      id
      user
      amount
      riskLevel
    }
  }
`;

export const GET_USER_WITHDRAWALS = `
  query GetUserWithdrawals($userAddress: String!, $limit: Int = 10) {
    fiYieldVault_Withdraws(
      where: { user: $userAddress }
      first: $limit
      orderBy: id
      orderDirection: desc
    ) {
      id
      user
      amount
    }
  }
`;

export const GET_USER_ACTIVITY = `
  query GetUserActivity($userAddress: String!, $limit: Int = 20) {
    deposits: fiYieldVault_Deposits(
      where: { user: $userAddress }
      first: $limit
      orderBy: id
      orderDirection: desc
    ) {
      id
      user
      amount
      riskLevel
    }
    withdrawals: fiYieldVault_Withdraws(
      where: { user: $userAddress }
      first: $limit
      orderBy: id
      orderDirection: desc
    ) {
      id
      user
      amount
    }
    rebalances: fiYieldVault_Rebalanceds(
      where: { user: $userAddress }
      first: $limit
      orderBy: id
      orderDirection: desc
    ) {
      id
      user
      fromProtocol
      toProtocol
      amount
    }
  }
`;

// ===========================================
// AGGREGATE QUERIES
// ===========================================

export const GET_VAULT_STATS = `
  query GetVaultStats {
    totalDeposits: fiYieldVault_Deposits(first: 1000) {
      amount
    }
    totalWithdrawals: fiYieldVault_Withdraws(first: 1000) {
      amount
    }
    totalInvestments: fiYieldVault_Investeds(first: 1000) {
      amount
    }
    totalRebalances: fiYieldVault_Rebalanceds(first: 1000) {
      amount
    }
  }
`;

export const GET_RECENT_ACTIVITY = `
  query GetRecentActivity($limit: Int = 20) {
    deposits: fiYieldVault_Deposits(
      first: $limit
      orderBy: id
      orderDirection: desc
    ) {
      id
      user
      amount
      riskLevel
    }
    withdrawals: fiYieldVault_Withdraws(
      first: $limit
      orderBy: id
      orderDirection: desc
    ) {
      id
      user
      amount
    }
    rebalances: fiYieldVault_Rebalanceds(
      first: $limit
      orderBy: id
      orderDirection: desc
    ) {
      id
      user
      fromProtocol
      toProtocol
      amount
    }
    investments: fiYieldVault_Investeds(
      first: $limit
      orderBy: id
      orderDirection: desc
    ) {
      id
      amount
    }
  }
`;

// ===========================================
// REAL-TIME SUBSCRIPTIONS
// ===========================================

export const SUBSCRIBE_DEPOSITS = `
  subscription SubscribeDeposits {
    fiYieldVault_Deposits(first: 10, orderBy: id, orderDirection: desc) {
      id
      user
      amount
      riskLevel
    }
  }
`;

export const SUBSCRIBE_WITHDRAWALS = `
  subscription SubscribeWithdrawals {
    fiYieldVault_Withdraws(first: 10, orderBy: id, orderDirection: desc) {
      id
      user
      amount
    }
  }
`;

export const SUBSCRIBE_ACTIVITY = `
  subscription SubscribeActivity {
    deposits: fiYieldVault_Deposits(first: 5, orderBy: id, orderDirection: desc) {
      id
      user
      amount
      riskLevel
    }
    withdrawals: fiYieldVault_Withdraws(first: 5, orderBy: id, orderDirection: desc) {
      id
      user
      amount
    }
    rebalances: fiYieldVault_Rebalanceds(first: 5, orderBy: id, orderDirection: desc) {
      id
      user
      fromProtocol
      toProtocol
      amount
    }
  }
`;

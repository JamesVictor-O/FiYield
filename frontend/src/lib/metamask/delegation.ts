import { encodeFunctionData } from 'viem';

export interface DelegationParams {
  delegate: string; // AgentExecutor contract address
  authority: string; // User's Smart Account address
  caveats: Caveat[];
  salt: bigint;
  signature: `0x${string}`;
}

export interface Caveat {
  enforcer: string; // Contract that enforces this caveat
  terms: `0x${string}`; // Encoded caveat parameters
}

/**
 * Create delegation for NexYield AI agent to rebalance
 */
export async function createDelegation(
  smartAccountAddress: string,
  agentExecutorAddress: string,
  vaultAddress: string,
  maxAmount: bigint = BigInt(1000 * 10 ** 6), // Default $1000 max
  duration: number = 7 * 24 * 60 * 60 // Default 1 week
): Promise<DelegationParams> {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }

  // Define caveats (restrictions on what agent can do)
  const caveats: Caveat[] = [
    // Caveat 1: Only allow calling 'rebalance' function on vault
    {
      enforcer: '0x0000000000000000000000000000000000000001', // AllowedMethodsEnforcer contract
      terms: encodeFunctionData({
        abi: [
          {
            name: 'rebalance',
            type: 'function',
            inputs: [
              { name: 'user', type: 'address' },
              { name: 'fromProtocol', type: 'address' },
              { name: 'toProtocol', type: 'address' },
              { name: 'amount', type: 'uint256' },
            ],
          },
        ],
        functionName: 'rebalance',
      }),
    },
    // Caveat 2: Time limit
    {
      enforcer: '0x0000000000000000000000000000000000000002', // TimestampEnforcer contract
      terms: encodeFunctionData({
        abi: [
          {
            name: 'enforceBefore',
            type: 'function',
            inputs: [{ name: 'timestamp', type: 'uint256' }],
          },
        ],
        functionName: 'enforceBefore',
        args: [BigInt(Math.floor(Date.now() / 1000) + duration)],
      }),
    },
    // Caveat 3: Maximum value per transaction
    {
      enforcer: '0x0000000000000000000000000000000000000003', // ValueLimitEnforcer contract
      terms: encodeFunctionData({
        abi: [
          {
            name: 'enforceMaxValue',
            type: 'function',
            inputs: [{ name: 'maxValue', type: 'uint256' }],
          },
        ],
        functionName: 'enforceMaxValue',
        args: [maxAmount],
      }),
    },
    // Caveat 4: Only allow calls to specific vault contract
    {
      enforcer: '0x0000000000000000000000000000000000000004', // TargetContractEnforcer
      terms: encodeFunctionData({
        abi: [
          {
            name: 'enforceTarget',
            type: 'function',
            inputs: [{ name: 'target', type: 'address' }],
          },
        ],
        functionName: 'enforceTarget',
        args: [vaultAddress as `0x${string}`],
      }),
    },
  ];

  // Create delegation using MetaMask SDK
  const delegation = await window.ethereum.request({
    method: 'wallet_createDelegation',
    params: [
      {
        delegate: agentExecutorAddress, // Who can act on behalf of user
        authority: smartAccountAddress, // User's Smart Account
        caveats: caveats, // Restrictions
        salt: BigInt(Date.now()), // Unique identifier
      },
    ],
  });

  return delegation;
}

/**
 * Create delegation for deposit operations
 */
export async function createDepositDelegation(
  smartAccountAddress: string,
  agentExecutorAddress: string,
  vaultAddress: string,
  maxAmount: bigint = BigInt(5000 * 10 ** 6), // Default $5000 max
  duration: number = 30 * 24 * 60 * 60 // Default 30 days
): Promise<DelegationParams> {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }

  const caveats: Caveat[] = [
    // Only allow deposit function
    {
      enforcer: '0x0000000000000000000000000000000000000001',
      terms: encodeFunctionData({
        abi: [
          {
            name: 'deposit',
            type: 'function',
            inputs: [
              { name: 'assets', type: 'uint256' },
              { name: 'receiver', type: 'address' },
            ],
          },
        ],
        functionName: 'deposit',
      }),
    },
    // Time limit
    {
      enforcer: '0x0000000000000000000000000000000000000002',
      terms: encodeFunctionData({
        abi: [
          {
            name: 'enforceBefore',
            type: 'function',
            inputs: [{ name: 'timestamp', type: 'uint256' }],
          },
        ],
        functionName: 'enforceBefore',
        args: [BigInt(Math.floor(Date.now() / 1000) + duration)],
      }),
    },
    // Value limit
    {
      enforcer: '0x0000000000000000000000000000000000000003',
      terms: encodeFunctionData({
        abi: [
          {
            name: 'enforceMaxValue',
            type: 'function',
            inputs: [{ name: 'maxValue', type: 'uint256' }],
          },
        ],
        functionName: 'enforceMaxValue',
        args: [maxAmount],
      }),
    },
    // Target contract
    {
      enforcer: '0x0000000000000000000000000000000000000004',
      terms: encodeFunctionData({
        abi: [
          {
            name: 'enforceTarget',
            type: 'function',
            inputs: [{ name: 'target', type: 'address' }],
          },
        ],
        functionName: 'enforceTarget',
        args: [vaultAddress as `0x${string}`],
      }),
    },
  ];

  const delegation = await window.ethereum.request({
    method: 'wallet_createDelegation',
    params: [
      {
        delegate: agentExecutorAddress,
        authority: smartAccountAddress,
        caveats: caveats,
        salt: BigInt(Date.now()),
      },
    ],
  });

  return delegation;
}

/**
 * Revoke delegation
 */
export async function revokeDelegation(delegationId: string): Promise<void> {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }

  await window.ethereum.request({
    method: 'wallet_revokeDelegation',
    params: [delegationId],
  });
}

/**
 * Get active delegations for user
 */
export async function getActiveDelegations(
  smartAccountAddress: string
): Promise<DelegationParams[]> {
  if (!window.ethereum) return [];

  try {
    const delegations = await window.ethereum.request({
      method: 'wallet_getDelegations',
      params: [smartAccountAddress],
    });

    return delegations || [];
  } catch (error) {
    console.error('Error getting delegations:', error);
    return [];
  }
}

/**
 * Check if delegation is active
 */
export async function isDelegationActive(
  smartAccountAddress: string,
  agentExecutorAddress: string
): Promise<boolean> {
  const delegations = await getActiveDelegations(smartAccountAddress);
  
  return delegations.some(
    delegation => delegation.delegate.toLowerCase() === agentExecutorAddress.toLowerCase()
  );
}

// Type definitions
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
    };
  }
}

import { createWalletClient, custom, Account } from 'viem';
import { monadTestnet, baseSepolia } from './chains';

/**
 * Create a Smart Account using MetaMask Delegation Toolkit
 */
export async function createSmartAccount(): Promise<Account> {
  // Check if MetaMask is installed
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }

  // Request account access
  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts',
  });

  // Create wallet client
  const client = createWalletClient({
    account: accounts[0],
    chain: monadTestnet, // Using Monad testnet
    transport: custom(window.ethereum),
  });

  // Create Smart Account using MetaMask's SDK
  // This deploys an ERC-4337 account contract
  const smartAccountAddress = await client.request({
    method: 'wallet_createSmartAccount',
    params: [
      {
        // Implementation can be MetaMask's default or custom
        implementation: 'erc4337',
        // Salt for deterministic address
        salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
      },
    ],
  });

  return {
    address: smartAccountAddress,
    type: 'json-rpc',
  };
}

/**
 * Check if user already has a Smart Account
 */
export async function getSmartAccount(): Promise<string | null> {
  if (!window.ethereum) return null;

  try {
    const smartAccounts = await window.ethereum.request({
      method: 'wallet_getSmartAccounts',
    });

    return smartAccounts?.[0] || null;
  } catch (error) {
    console.error('Error getting smart account:', error);
    return null;
  }
}

/**
 * Get Smart Account balance
 */
export async function getSmartAccountBalance(smartAccountAddress: string): Promise<string> {
  if (!window.ethereum) return '0';

  try {
    const balance = await window.ethereum.request({
      method: 'eth_getBalance',
      params: [smartAccountAddress, 'latest'],
    });

    return balance;
  } catch (error) {
    console.error('Error getting smart account balance:', error);
    return '0';
  }
}

/**
 * Send transaction through Smart Account
 */
export async function sendSmartAccountTransaction(
  to: string,
  value: string,
  data: string = '0x'
): Promise<string> {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }

  const txHash = await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [
      {
        from: await getSmartAccount(),
        to,
        value,
        data,
      },
    ],
  });

  return txHash;
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

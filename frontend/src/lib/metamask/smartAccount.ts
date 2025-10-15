import { Account } from "viem";

/**
 * Create a Smart Account using MetaMask Delegation Toolkit
 */
export async function createSmartAccount(): Promise<Account> {
  // Check if MetaMask is installed
  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }

  // Request account access
  const accounts = (await window.ethereum.request({
    method: "eth_requestAccounts",
  })) as string[];

  if (!accounts || accounts.length === 0) {
    throw new Error("No accounts found");
  }

  // For now, return the EOA address as the "smart account"
  // In a real implementation, this would create an actual smart account
  return {
    address: accounts[0] as `0x${string}`,
    type: "json-rpc",
  };
}

/**
 * Check if user already has a Smart Account
 */
export async function getSmartAccount(): Promise<string | null> {
  if (!window.ethereum) return null;

  try {
    // For now, get the first connected account
    const accounts = (await window.ethereum.request({
      method: "eth_accounts",
    })) as string[];

    return accounts?.[0] || null;
  } catch (error) {
    console.error("Error getting smart account:", error);
    return null;
  }
}

/**
 * Get Smart Account balance
 */
export async function getSmartAccountBalance(
  smartAccountAddress: string
): Promise<string> {
  if (!window.ethereum) return "0";

  try {
    const balance = await window.ethereum.request({
      method: "eth_getBalance",
      params: [smartAccountAddress, "latest"],
    });

    return balance;
  } catch (error) {
    console.error("Error getting smart account balance:", error);
    return "0";
  }
}

/**
 * Send transaction through Smart Account
 */
export async function sendSmartAccountTransaction(
  to: string,
  value: string,
  data: string = "0x"
): Promise<string> {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }

  const fromAddress = await getSmartAccount();
  if (!fromAddress) {
    throw new Error("No smart account found");
  }

  const txHash = (await window.ethereum.request({
    method: "eth_sendTransaction",
    params: [
      {
        from: fromAddress,
        to,
        value,
        data,
      },
    ],
  })) as string;

  return txHash;
}

// Type definitions - ethereum is already declared globally by wagmi/viem

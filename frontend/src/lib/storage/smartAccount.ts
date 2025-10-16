import type { Address } from "viem";

export type AccountType = "eoa" | "passkey" | "embedded";

interface SmartAccountData {
  address: Address;
  type: AccountType;
  createdAt: number;
  eoaOwner?: Address;
  passkeyCredentialId?: string;
}

const STORAGE_PREFIX = "fiyield_sa_";

export const SmartAccountStorage = {
  /**
   * Save smart account data for a user
   */
  save(userAddress: Address, data: Omit<SmartAccountData, "createdAt">) {
    if (typeof window === "undefined") return;

    const key = `${STORAGE_PREFIX}${userAddress.toLowerCase()}`;
    const fullData: SmartAccountData = {
      ...data,
      createdAt: Date.now(),
    };

    localStorage.setItem(key, JSON.stringify(fullData));
  },

  /**
   * Load smart account data for a user
   */
  load(userAddress: Address): SmartAccountData | null {
    if (typeof window === "undefined") return null;

    const key = `${STORAGE_PREFIX}${userAddress.toLowerCase()}`;
    const stored = localStorage.getItem(key);

    if (!stored) return null;

    try {
      return JSON.parse(stored) as SmartAccountData;
    } catch {
      return null;
    }
  },

  /**
   * Clear smart account data for a user
   */
  clear(userAddress: Address) {
    if (typeof window === "undefined") return;

    const key = `${STORAGE_PREFIX}${userAddress.toLowerCase()}`;
    localStorage.removeItem(key);
  },

  /**
   * Check if user has a smart account
   */
  exists(userAddress: Address): boolean {
    return this.load(userAddress) !== null;
  },

  /**
   * Get just the smart account address
   */
  getAddress(userAddress: Address): Address | null {
    const data = this.load(userAddress);
    return data?.address || null;
  },
};

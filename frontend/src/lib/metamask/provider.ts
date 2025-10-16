

// Store the original ethereum provider
let originalEthereumProvider: any = null;


export function initializeMetaMaskProvider() {
  // Store the original provider if it exists
  if (typeof window !== "undefined" && window.ethereum) {
    originalEthereumProvider = window.ethereum;
  }

  // Listen for provider changes
  if (typeof window !== "undefined") {
    window.addEventListener("ethereum#initialized", () => {
      if (window.ethereum && !originalEthereumProvider) {
        originalEthereumProvider = window.ethereum;
      }
    });
  }
}

/**
 * Get the MetaMask provider, ensuring it's available for delegation toolkit
 */
export function getMetaMaskProvider() {
  if (typeof window === "undefined") {
    return null;
  }

  // If window.ethereum exists, use it
  if (window.ethereum) {
    return window.ethereum;
  }

 
  if (originalEthereumProvider) {
    window.ethereum = originalEthereumProvider;
    return originalEthereumProvider;
  }

  return null;
}

/**
 * Check if MetaMask is available
 */
export function isMetaMaskAvailable(): boolean {
  return getMetaMaskProvider() !== null;
}

/**
 * Get MetaMask provider with error handling
 */
export async function getMetaMaskProviderSafe() {
  const provider = getMetaMaskProvider();

  if (!provider) {
    throw new Error(
      "MetaMask not available. Please install MetaMask extension."
    );
  }

  // Check if it's MetaMask specifically
  if (!provider.isMetaMask) {
    console.warn(
      "Provider is not MetaMask, but using it anyway for delegation toolkit"
    );
  }

  return provider;
}

/**
 * Suppress MetaMask provider conflict errors
 */
export function suppressProviderConflictErrors() {
  if (typeof window === "undefined") return;

  const originalError = console.error;
  console.error = (...args) => {
    const message = args[0]?.toString() || "";

    // Suppress specific MetaMask provider conflict errors
    if (
      message.includes("Cannot set property ethereum") ||
      message.includes(
        "MetaMask encountered an error setting the global Ethereum provider"
      ) ||
      message.includes("which has only a getter")
    ) {
      // These errors are expected when multiple wallet providers are present
      // Privy handles this gracefully
      return;
    }

    originalError.apply(console, args);
  };

  return () => {
    console.error = originalError;
  };
}

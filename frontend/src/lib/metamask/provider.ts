// MetaMask provider detection utilities

/**
 * Get the MetaMask provider, ensuring it's available for delegation toolkit
 */
export function getMetaMaskProvider() {
  if (typeof window === "undefined") {
    return null;
  }

  // Check if window.ethereum is MetaMask specifically
  if (window.ethereum && window.ethereum.isMetaMask) {
    return window.ethereum;
  }

  // Check if there are multiple providers and find MetaMask
  if (window.ethereum && window.ethereum.providers) {
    const metamaskProvider = window.ethereum.providers.find(
      (provider: any) => provider.isMetaMask
    );
    if (metamaskProvider) {
      return metamaskProvider;
    }
  }

  // Last resort - use window.ethereum even if not MetaMask
  if (window.ethereum) {
    console.warn("Using non-MetaMask provider for delegation toolkit");
    return window.ethereum;
  }

  return null;
}

/**
 * Check if MetaMask is available
 */
export function isMetaMaskAvailable(): boolean {
  return getMetaMaskProvider() !== null;
}

export async function getMetaMaskProviderSafe() {
  const provider = getMetaMaskProvider();

  if (!provider) {
    throw new Error(
      "MetaMask not available. Please install MetaMask extension and refresh the page."
    );
  }

  // Check if it's MetaMask specifically
  if (!provider.isMetaMask) {
    console.warn(
      "Provider is not MetaMask, but using it anyway for delegation toolkit"
    );
    console.log("Current provider:", provider);
  } else {
    console.log("✅ Using MetaMask provider for smart account creation");
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
      message.includes("which has only a getter") ||
      message.includes("Cannot set property ethereum of #<Window>")
    ) {
      // These errors are expected when multiple wallet providers are present
      // and we try to modify window.ethereum directly
      console.log("ℹ️ Suppressed expected wallet provider conflict error");
      return;
    }

    originalError.apply(console, args);
  };

  return () => {
    console.error = originalError;
  };
}

/**
 * Utility functions for Farcaster miniapp detection and handling
 */

export function isFarcasterEnvironment(): boolean {
  if (typeof window === "undefined") return false;

  // Check for Farcaster-specific user agent or environment variables
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isFarcasterUA =
    userAgent.includes("farcaster") || userAgent.includes("warpcast");

  // Check for Farcaster SDK presence
  const hasFarcasterSDK =
    (typeof window !== "undefined" && (window as any).farcaster) ||
    (window as any).__FARCASTER__;

  // Check for Farcaster-specific URL parameters or referrer
  const urlParams = new URLSearchParams(window.location.search);
  const isFarcasterReferrer =
    document.referrer.includes("warpcast.com") ||
    document.referrer.includes("farcaster.xyz");

  // Check for Farcaster miniapp environment
  const isFarcasterMiniapp =
    window.location.hostname.includes("warpcast.com") ||
    window.location.hostname.includes("farcaster.xyz") ||
    window.location.search.includes("farcaster") ||
    window.location.hash.includes("farcaster");

  // Debug logging
  console.log("Farcaster Environment Check:", {
    isFarcasterUA,
    hasFarcasterSDK,
    isFarcasterReferrer,
    isFarcasterMiniapp,
    userAgent,
    referrer: document.referrer,
    url: window.location.href,
  });

  return (
    isFarcasterUA ||
    hasFarcasterSDK ||
    isFarcasterReferrer ||
    isFarcasterMiniapp ||
    urlParams.has("farcaster")
  );
}

export function isMobileEnvironment(): boolean {
  if (typeof window === "undefined") return false;

  const userAgent = window.navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    userAgent
  );
}

export function shouldAutoShowSmartAccountModal(): boolean {
  // Don't auto-show modal in Farcaster environment
  if (isFarcasterEnvironment()) {
    return false;
  }

  // Don't auto-show on mobile unless it's a web browser (not miniapp)
  if (isMobileEnvironment() && isFarcasterEnvironment()) {
    return false;
  }

  return true;
}

export function getWalletConnectionMethod():
  | "farcaster"
  | "metamask"
  | "rainbow" {
  if (isFarcasterEnvironment()) {
    return "farcaster";
  }

  // Default to MetaMask for web
  return "metamask";
}

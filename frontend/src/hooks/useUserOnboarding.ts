import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { getUserProfile } from "@/lib/api";

interface OnboardingStatus {
  isNewUser: boolean;
  hasCompletedOnboarding: boolean;
  riskProfile?: "conservative" | "moderate" | "aggressive";
  isLoading: boolean;
  error?: string;
  markOnboardingComplete: (
    riskProfile: "conservative" | "moderate" | "aggressive"
  ) => void;
  resetOnboarding: () => void;
}

export const useUserOnboarding = (): OnboardingStatus => {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [onboardingData, setOnboardingData] = useState<{
    hasCompletedOnboarding: boolean;
    riskProfile?: "conservative" | "moderate" | "aggressive";
  }>({
    hasCompletedOnboarding: false,
  });

  // Check if user has profile on-chain (simplified)
  // const hasOnChainProfile = false; // Available if needed
  const isCheckingChain = false;

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!address) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(undefined);

        // 1. Check local storage first (fastest)
        const localStorageKey = `onboarding_${address}`;
        const localData = localStorage.getItem(localStorageKey);

        if (localData) {
          const parsed = JSON.parse(localData);
          setOnboardingData(parsed);
          setIsLoading(false);
          return;
        }

        // 2. Check backend for user profile (with better error handling)
        try {
          const userProfile = await getUserProfile(address);

          if (userProfile && userProfile.riskProfile) {
            const onboardingStatus = {
              hasCompletedOnboarding: true,
              riskProfile: userProfile.riskProfile,
            };

            // Cache in local storage
            localStorage.setItem(
              localStorageKey,
              JSON.stringify(onboardingStatus)
            );
            setOnboardingData(onboardingStatus);
            setIsLoading(false);
            return;
          }
        } catch {
          console.log(
            "Backend profile not found or API unavailable, using defaults..."
          );
          // Don't throw error, just continue with default behavior
        }

        // 3. If no backend data, user is new
        setOnboardingData({
          hasCompletedOnboarding: false,
        });
      } catch (err) {
        console.error("Error checking onboarding status:", err);
        setError("Failed to load user profile");
        // Default to new user if there's an error
        setOnboardingData({
          hasCompletedOnboarding: false,
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [address]);

  // Function to mark onboarding as complete
  const markOnboardingComplete = (
    riskProfile: "conservative" | "moderate" | "aggressive"
  ) => {
    if (!address) return;

    const onboardingStatus = {
      hasCompletedOnboarding: true,
      riskProfile,
    };

    // Update state
    setOnboardingData(onboardingStatus);

    // Cache in local storage
    const localStorageKey = `onboarding_${address}`;
    localStorage.setItem(localStorageKey, JSON.stringify(onboardingStatus));
  };

  // Function to reset onboarding (for testing or user request)
  const resetOnboarding = () => {
    if (!address) return;

    const localStorageKey = `onboarding_${address}`;
    localStorage.removeItem(localStorageKey);

    setOnboardingData({
      hasCompletedOnboarding: false,
    });
  };

  return {
    isNewUser: !onboardingData.hasCompletedOnboarding,
    hasCompletedOnboarding: onboardingData.hasCompletedOnboarding,
    riskProfile: onboardingData.riskProfile,
    isLoading: isLoading || isCheckingChain,
    error,
    markOnboardingComplete,
    resetOnboarding,
  };
};

"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { SmartAccountSetup } from "../wallet/SmartAccountSetup";
import { SmartAccountStorage } from "@/lib/storage/smartAccount";
import {
  isFarcasterEnvironment,
  shouldAutoShowSmartAccountModal,
} from "@/lib/utils/farcaster";

const Header = () => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSmartAccountModal, setShowSmartAccountModal] = useState(false);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(
    null
  );

  const getDisplayAddress = (): string | undefined => {
    // First check if user has smart account
    if (smartAccountAddress) {
      return `${smartAccountAddress.slice(0, 6)}...${smartAccountAddress.slice(
        -4
      )}`;
    }

    // Fallback to regular wallet address
    if (!address) return undefined;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Load smart account address from storage on mount
  useEffect(() => {
    if (isConnected && address) {
      const savedAddress = SmartAccountStorage.getAddress(address);
      if (savedAddress) {
        setSmartAccountAddress(savedAddress);
      }
    }
  }, [isConnected, address]);

  const displayAddress = getDisplayAddress();
  const hasSmartAccount = !!smartAccountAddress;

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleConnectClick = async () => {
    if (!isConnected) {
      // Step 1: User not connected - RainbowKit will handle connection
      return;
    } else if (!hasSmartAccount) {
      // Step 2: User connected but no smart account - show setup modal
      setShowSmartAccountModal(true);
    }
  };

  // Auto-show smart account setup after wallet connection (only for web, not Farcaster)
  useEffect(() => {
    if (isConnected && !hasSmartAccount && shouldAutoShowSmartAccountModal()) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        setShowSmartAccountModal(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isConnected, hasSmartAccount]);

  const handleSmartAccountSuccess = () => {};

  const handleLogout = async () => {
    // Clear smart account data using storage utility
    if (address) {
      SmartAccountStorage.clear(address);
    }
    setSmartAccountAddress(null);
    disconnect();
  };

  const navigationLinks = [
    { name: "Features", href: "#key-features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "About", href: "#about" },
  ];

  const getButtonText = () => {
    if (!isConnected) return "Get Started";
    if (!hasSmartAccount) return "Setup Account";
    return displayAddress ?? "Account";
  };

  const getButtonIcon = () => {
    if (!isConnected) {
      return <div className="w-2 h-2 bg-gray-400 rounded-full"></div>;
    }
    if (!hasSmartAccount) {
      return (
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
      );
    }
    return (
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
    );
  };

  return (
    <>
      <header
        className={`fixed top-0 w-full z-50 bg-[#101110]/95 backdrop-blur-sm border-b border-white/10 ${
          isFarcasterEnvironment() ? "h-14" : "h-16 sm:h-18"
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div
            className={`flex justify-between items-center ${
              isFarcasterEnvironment() ? "h-14" : "h-16 sm:h-18"
            }`}
          >
            {/* Logo Section */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className={`${
                  isFarcasterEnvironment() ? "w-6 h-6" : "w-8 h-8"
                } rounded-lg bg-white flex items-center justify-center`}
              >
                <Image
                  src="/logo2.png"
                  alt="FiYield Logo"
                  width={isFarcasterEnvironment() ? 16 : 20}
                  height={isFarcasterEnvironment() ? 16 : 20}
                  className="bg-transparent object-contain w-full h-full"
                />
              </div>
              <span
                className={`${
                  isFarcasterEnvironment() ? "text-sm" : "text-lg"
                } font-bold text-white font-pop ${
                  isFarcasterEnvironment() ? "block" : "hidden sm:block"
                }`}
              >
                FiYield
              </span>
            </div>

            {/* Desktop Navigation - Hidden in Farcaster */}
            {!isFarcasterEnvironment() && (
              <nav className="hidden md:flex items-center space-x-8">
                {navigationLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.href}
                    className="text-sm text-gray-300 hover:text-white transition-colors duration-300 font-medium"
                  >
                    {link.name}
                  </a>
                ))}
              </nav>
            )}

            {/* CTA Section */}
            <div
              className={`flex items-center ${
                isFarcasterEnvironment() ? "gap-2" : "gap-3"
              }`}
            >
              {/* Main CTA Button */}
              {!isConnected ? (
                <div className={isFarcasterEnvironment() ? "w-full" : ""}>
                  <ConnectButton />
                </div>
              ) : hasSmartAccount ? (
                <div
                  className={`bg-white text-black ${
                    isFarcasterEnvironment()
                      ? "px-3 py-1.5"
                      : "px-4 sm:px-6 py-2"
                  } rounded-lg transition-all duration-300 hover:bg-white/90 active:scale-95`}
                >
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2"
                  >
                    {getButtonIcon()}
                    <span
                      className={`font-medium ${
                        isFarcasterEnvironment() ? "text-xs" : "text-sm"
                      }`}
                    >
                      {getButtonText()}
                    </span>
                  </button>
                </div>
              ) : (
                <div
                  className={`bg-white text-black ${
                    isFarcasterEnvironment()
                      ? "px-3 py-1.5"
                      : "px-4 sm:px-6 py-2"
                  } rounded-lg transition-all duration-300 hover:bg-white/90 active:scale-95`}
                >
                  <button
                    onClick={handleConnectClick}
                    className="flex items-center gap-2"
                  >
                    {getButtonIcon()}
                    <span
                      className={`font-medium ${
                        isFarcasterEnvironment() ? "text-xs" : "text-sm"
                      }`}
                    >
                      {getButtonText()}
                    </span>
                  </button>
                </div>
              )}

              {/* Mobile Menu Toggle - Hidden in Farcaster */}
              {!isFarcasterEnvironment() && (
                <button
                  className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors duration-300"
                  onClick={toggleMobileMenu}
                  aria-label="Toggle menu"
                >
                  <svg
                    className={`w-5 h-5 text-white transition-transform duration-300 ${
                      mobileMenuOpen ? "rotate-90" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-white/10 bg-[#101110]/95 backdrop-blur-sm">
              <div className="px-4 py-4 space-y-4">
                {navigationLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.href}
                    className="block text-sm text-gray-300 hover:text-white transition-colors duration-300 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Smart Account Setup Modal */}
      <SmartAccountSetup
        isOpen={showSmartAccountModal}
        onClose={() => setShowSmartAccountModal(false)}
        onSuccess={handleSmartAccountSuccess}
        onAddressCreated={setSmartAccountAddress}
      />
    </>
  );
};

export default Header;

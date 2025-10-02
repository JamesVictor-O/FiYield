"use client";

import React, { useState } from "react";
import Image from "next/image";
import { usePrivy } from "@privy-io/react-auth";
import { WalletConnectionFlow } from "../wallet/WalletConnectionFlow";

const Header = () => {
  const { ready, authenticated, user, logout } = usePrivy();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  type MinimalWallet = { address?: string };
  type MinimalLinkedAccount = { type?: string; address?: string };

  const getDisplayAddress = (): string | undefined => {
    const embeddedAddress = (user?.wallet as MinimalWallet | undefined)
      ?.address;
    const linkedAddress = (
      user?.linkedAccounts as MinimalLinkedAccount[] | undefined
    )?.find((account) => account?.type === "wallet")?.address;
    const address = embeddedAddress || linkedAddress;
    if (!address) return undefined;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const isConnected = ready && authenticated;
  const displayAddress = getDisplayAddress();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleWalletSuccess = () => {
    // User successfully connected, you can add any additional logic here
    console.log('Wallet connected successfully');
  };

  const navigationLinks = [
    { name: "Features", href: "#key-features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "About", href: "#about" },
  ];

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-[#101110]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-18">
            {/* Logo Section */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                <Image
                  src="/Logo.png"
                  alt="NexYield Logo"
                  width={20}
                  height={20}
                  className="bg-transparent"
                />
              </div>
              <span className="text-lg font-bold text-white font-pop hidden sm:block">
                NexYield
              </span>
            </div>

            {/* Desktop Navigation */}
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

            {/* CTA Section */}
            <div className="flex items-center gap-3">
              {/* Main CTA Button */}
              <div className="bg-white text-black px-4 sm:px-6 py-2 rounded-lg transition-all duration-300 hover:bg-white/90 active:scale-95">
                {isConnected ? (
                  <button onClick={logout} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-sm">
                      {displayAddress ?? "Account"}
                    </span>
                  </button>
                ) : (
                  <button 
                    onClick={() => setShowWalletModal(true)} 
                    className="flex items-center gap-2"
                  >
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="font-medium text-sm">
                      Connect Wallet
                    </span>
                  </button>
                )}
              </div>

              {/* Mobile Menu Toggle */}
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

      {/* Wallet Connection Modal */}
      <WalletConnectionFlow
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onSuccess={handleWalletSuccess}
      />
    </>
  );
};

export default Header;

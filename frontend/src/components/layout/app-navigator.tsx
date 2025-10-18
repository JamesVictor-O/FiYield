"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useDisconnect } from "wagmi";
import Image from "next/image";
import {
  BarChart3,
  MessageSquare,
  Settings,
  Menu,
  X,
  TrendingUp,
  Shield,
  LogOut,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "AI Chat", href: "/dashboard/chat", icon: MessageSquare },
  { name: "Portfolio", href: "/dashboard/portfolio", icon: TrendingUp },
  { name: "Security", href: "/dashboard/security", icon: Shield },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function AppNavigation() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();

  const getDisplayAddress = (): string | undefined => {
    if (!address) return undefined;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const displayAddress = getDisplayAddress();

  return (
    <>
      {/* Mobile sidebar backdrop */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />

        {/* Mobile sidebar */}
        <div
          className={`fixed inset-y-0 left-0 w-80 bg-[#101110] border-r border-white/10 transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Mobile sidebar header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <Link
              href="/"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                <Image
                  src="/logo2.png"
                  alt="FiYield Logo"
                  width={20}
                  height={20}
                  className="bg-transparent"
                />
              </div>
              <span className="text-lg font-bold text-white font-pop">
                FiYield
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors duration-300"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Mobile navigation */}
          <nav className="p-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-300 ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile user section */}
          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {displayAddress ?? "Connect Wallet"}
                </p>
                <p className="text-xs text-gray-400">Connected</p>
              </div>
            </div>
            <button
              onClick={() => disconnect()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors duration-300"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Disconnect</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-[#101110] border-r border-white/10 px-6 py-6">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 mb-8 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <Image
                src="/logo2.png"
                alt="FiYield Logo"
                width={20}
                height={20}
                className="bg-transparent"
              />
            </div>
            <span className="text-lg font-bold text-white font-pop">
              FiYield
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`group flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-300 ${
                        isActive
                          ? "bg-white/10 text-white"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* User section */}
            <div className="mt-auto pt-6 border-t border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {displayAddress ?? "Connect Wallet"}
                  </p>
                  <p className="text-xs text-gray-400">Connected</p>
                </div>
              </div>
              <button
                onClick={() => disconnect()}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors duration-300"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Disconnect</span>
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Mobile header */}
      <div className="lg:hidden sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-white/10 bg-[#101110]/95 backdrop-blur-sm px-4 shadow-sm sm:gap-x-6 sm:px-6">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-white lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>

        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div className="flex flex-1"></div>
          <div className="flex items-center gap-x-4 lg:gap-x-6">
            {/* Mobile user button */}
            <div className="bg-white text-black px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">
                  {displayAddress ?? "Connect"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

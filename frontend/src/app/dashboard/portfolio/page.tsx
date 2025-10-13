"use client";

import React from "react";
import { PortfolioSection } from "@/components/dashboard/PortfolioSection";

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-[#101110] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white font-pop mb-2">
            Portfolio
          </h1>
          <p className="text-gray-400">
            Track your investments and performance across all supported tokens
          </p>
        </div>

        {/* Portfolio Content */}
        <PortfolioSection />
      </div>
    </div>
  );
}

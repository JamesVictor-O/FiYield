import AppNavigation from "@/components/layout/app-navigator";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - Portfolio Management",
  description: "Manage your DeFi portfolio with AI-optimized strategies. View real-time analytics, track yield performance, and execute automated rebalancing.",
  keywords: [
    "DeFi dashboard",
    "portfolio management",
    "yield tracking",
    "AI optimization",
    "smart account",
    "real-time analytics"
  ],
  openGraph: {
    title: "FiYield Dashboard - Portfolio Management",
    description: "Manage your DeFi portfolio with AI-optimized strategies and real-time analytics.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "FiYield Dashboard",
    description: "Manage your DeFi portfolio with AI-optimized strategies.",
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppNavigation />
      <div className="lg:pl-64">{children}</div>
    </>
  );
}

import type { Metadata } from "next";
import Web3Provider from "@/components/Providers/Web3Provider";
import FarcasterProvider from "@/components/Providers/FarcasterProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FiYield - AI-Powered DeFi Yield Optimization",
    template: "%s | FiYield",
  },
  description:
    "FiYield is a revolutionary DeFi platform that uses AI and smart accounts to automatically optimize your yield farming strategies. Earn up to 8.2% APY with MetaMask smart accounts, delegation, and real-time analytics powered by Envio.",
  keywords: [
    "DeFi",
    "yield farming",
    "AI",
    "smart accounts",
    "MetaMask",
    "delegation",
    "ERC-7710",
    "yield optimization",
    "automated strategies",
    "Envio analytics",
    "Monad blockchain",
    "Aave",
    "Compound",
    "Yearn Finance",
    "Uniswap V3",
  ],
  authors: [{ name: "FiYield Team" }],
  creator: "FiYield",
  publisher: "FiYield",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://fiyield.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://fiyield.com",
    title: "FiYield - AI-Powered DeFi Yield Optimization",
    description:
      "Earn up to 8.2% APY with AI-optimized DeFi strategies. MetaMask smart accounts, delegation, and real-time analytics.",
    siteName: "FiYield",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FiYield - AI-Powered DeFi Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FiYield - AI-Powered DeFi Yield Optimization",
    description:
      "Earn up to 8.2% APY with AI-optimized DeFi strategies. MetaMask smart accounts, delegation, and real-time analytics.",
    images: ["/twitter-image.png"],
    creator: "@FiYield",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
  category: "DeFi",
  classification: "Financial Technology",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "FiYield",
    "application-name": "FiYield",
    "msapplication-TileColor": "#000000",
    "theme-color": "#000000",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <FarcasterProvider>
          <Web3Provider>{children}</Web3Provider>
        </FarcasterProvider>
      </body>
    </html>
  );
}

"use client";

import {
  Shield,
  Lock,
  Eye,
  Key,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
} from "lucide-react";

export default function SecurityPage() {
  const securityFeatures = [
    {
      icon: Lock,
      title: "Two-Factor Authentication",
      description:
        "Add an extra layer of security with 2FA to protect your account and funds.",
      status: "In Development",
      color: "text-green-400",
    },
    {
      icon: Key,
      title: "Hardware Wallet Integration",
      description:
        "Connect and manage your hardware wallets for maximum security.",
      status: "Planned",
      color: "text-blue-400",
    },
    {
      icon: Eye,
      title: "Activity Monitoring",
      description:
        "Real-time monitoring of all account activities and suspicious behavior detection.",
      status: "In Development",
      color: "text-yellow-400",
    },
    {
      icon: Shield,
      title: "Multi-Signature Wallets",
      description:
        "Enhanced security with multi-sig wallet support for institutional users.",
      status: "Planned",
      color: "text-purple-400",
    },
    {
      icon: Database,
      title: "Data Encryption",
      description:
        "End-to-end encryption for all your sensitive data and transaction history.",
      status: "In Development",
      color: "text-indigo-400",
    },
    {
      icon: AlertTriangle,
      title: "Security Alerts",
      description:
        "Instant notifications for any security-related events or potential threats.",
      status: "Planned",
      color: "text-red-400",
    },
  ];

  const currentSecurityStatus = [
    {
      label: "Wallet Connection",
      status: "Secure",
      icon: CheckCircle,
      color: "text-green-400",
    },
    {
      label: "Transaction Signing",
      status: "Protected",
      icon: Shield,
      color: "text-green-400",
    },
    {
      label: "Private Key Storage",
      status: "Encrypted",
      icon: Lock,
      color: "text-green-400",
    },
    {
      label: "Network Security",
      status: "Verified",
      icon: CheckCircle,
      color: "text-green-400",
    },
  ];

  return (
    <div className="min-h-screen bg-[#101110] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-8 sm:mb-12 text-center">
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white font-pop">
                Security Center
              </h1>
              <p className="text-lg sm:text-xl text-gray-400 mt-1 sm:mt-2">
                Advanced Security Features Coming Soon
              </p>
            </div>
          </div>
          <p className="text-sm sm:text-base lg:text-lg text-gray-400 max-w-2xl mx-auto">
            Your security is our top priority. We&apos;re building comprehensive
            security features to protect your assets and provide peace of mind.
          </p>
        </div>

        {/* Current Security Status */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-white font-pop mb-4 sm:mb-6 text-center">
            Current Security Status
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {currentSecurityStatus.map((item, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 text-center"
              >
                <item.icon
                  className={`w-6 h-6 sm:w-8 sm:h-8 ${item.color} mx-auto mb-2 sm:mb-3`}
                />
                <h3 className="text-sm sm:text-base font-bold text-white mb-1">
                  {item.label}
                </h3>
                <p className={`text-xs sm:text-sm ${item.color}`}>
                  {item.status}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Coming Soon Features */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-white font-pop mb-6 sm:mb-8 text-center">
            Advanced Security Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {securityFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 hover:border-white/20 transition-all duration-300 group"
              >
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors duration-300">
                    <feature.icon
                      className={`w-5 h-5 sm:w-6 sm:h-6 ${feature.color}`}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white font-pop">
                      {feature.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                      <span className="text-xs sm:text-sm text-gray-400">
                        {feature.status}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Security Tips */}
        <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl p-6 sm:p-8 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" />
            <h3 className="text-xl sm:text-2xl font-bold text-white font-pop">
              Security Best Practices
            </h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h4 className="font-bold text-white mb-2 sm:mb-3 text-sm sm:text-base">
                ✅ Do&apos;s
              </h4>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-300">
                <li>• Always verify transaction details before signing</li>
                <li>• Use hardware wallets for large amounts</li>
                <li>• Keep your private keys secure and offline</li>
                <li>• Regularly update your wallet software</li>
                <li>• Enable transaction notifications</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-2 sm:mb-3 text-sm sm:text-base">
                ❌ Don&apos;ts
              </h4>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-300">
                <li>• Never share your private keys or seed phrases</li>
                <li>
                  • Don&apos;t click suspicious links in emails or messages
                </li>
                <li>• Avoid using public WiFi for transactions</li>
                <li>
                  • Don&apos;t trust &quot;too good to be true&quot; offers
                </li>
                <li>• Never send funds to unverified addresses</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 text-center">
          <h3 className="text-xl sm:text-2xl font-bold text-white font-pop mb-3 sm:mb-4">
            Need Help?
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6 max-w-2xl mx-auto">
            If you have any security concerns or need assistance, our support
            team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button className="bg-white text-black px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium hover:bg-white/90 transition-colors duration-300 text-xs sm:text-sm">
              Contact Security Team
            </button>
            <button className="bg-white/10 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium hover:bg-white/20 transition-colors duration-300 border border-white/10 text-xs sm:text-sm">
              View Security Documentation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

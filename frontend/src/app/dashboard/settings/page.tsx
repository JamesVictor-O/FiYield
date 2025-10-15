"use client";

import {
  Settings,
  Bell,
  Shield,
  User,
  Palette,
  Globe,
  Database,
  Zap,
} from "lucide-react";

export default function SettingsPage() {
  const comingSoonFeatures = [
    {
      icon: User,
      title: "Profile Management",
      description:
        "Customize your profile, update personal information, and manage your account preferences.",
      color: "text-blue-400",
    },
    {
      icon: Bell,
      title: "Notifications",
      description:
        "Set up alerts for yield changes, strategy updates, and important portfolio events.",
      color: "text-yellow-400",
    },
    {
      icon: Shield,
      title: "Security Settings",
      description:
        "Manage two-factor authentication, wallet connections, and security preferences.",
      color: "text-red-400",
    },
    {
      icon: Palette,
      title: "Theme Customization",
      description:
        "Personalize your dashboard with custom themes, colors, and display preferences.",
      color: "text-purple-400",
    },
    {
      icon: Globe,
      title: "Language & Region",
      description:
        "Set your preferred language, timezone, and regional settings.",
      color: "text-green-400",
    },
    {
      icon: Database,
      title: "Data Management",
      description:
        "Export your data, manage privacy settings, and control data retention.",
      color: "text-indigo-400",
    },
    {
      icon: Zap,
      title: "Advanced Features",
      description:
        "Access to advanced trading tools, custom strategies, and premium features.",
      color: "text-orange-400",
    },
  ];

  return (
    <div className="min-h-screen bg-[#101110] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-8 sm:mb-12 text-center">
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white font-pop">
                Settings
              </h1>
              <p className="text-lg sm:text-xl text-gray-400 mt-1 sm:mt-2">
                Coming Soon
              </p>
            </div>
          </div>
          <p className="text-sm sm:text-base lg:text-lg text-gray-400 max-w-2xl mx-auto">
            We&apos;re working hard to bring you comprehensive settings and
            customization options. Stay tuned for these exciting features!
          </p>
        </div>

        {/* Coming Soon Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {comingSoonFeatures.map((feature, index) => (
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
                <h3 className="text-lg sm:text-xl font-bold text-white font-pop">
                  {feature.title}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Progress Section */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 mb-6 sm:mb-8">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white font-pop mb-3 sm:mb-4">
              Development Progress
            </h2>
            <p className="text-xs sm:text-sm text-gray-400">
              We&apos;re actively working on these features to enhance your
              experience
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-sm sm:text-base text-white font-medium">
                Profile Management
              </span>
              <div className="flex items-center gap-2">
                <div className="w-24 sm:w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="w-3/4 h-full bg-blue-400 rounded-full"></div>
                </div>
                <span className="text-xs sm:text-sm text-gray-400">75%</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-sm sm:text-base text-white font-medium">
                Notifications
              </span>
              <div className="flex items-center gap-2">
                <div className="w-24 sm:w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="w-1/2 h-full bg-yellow-400 rounded-full"></div>
                </div>
                <span className="text-xs sm:text-sm text-gray-400">50%</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-sm sm:text-base text-white font-medium">
                Security Settings
              </span>
              <div className="flex items-center gap-2">
                <div className="w-24 sm:w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="w-1/4 h-full bg-red-400 rounded-full"></div>
                </div>
                <span className="text-xs sm:text-sm text-gray-400">25%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="bg-gradient-to-r from-white/5 to-white/10 border border-white/10 rounded-2xl p-6 sm:p-8 text-center">
          <h3 className="text-xl sm:text-2xl font-bold text-white font-pop mb-3 sm:mb-4">
            Stay Updated
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6 max-w-2xl mx-auto">
            Be the first to know when these features are released. We&apos;ll
            notify you as soon as they&apos;re available.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-gray-400 focus:outline-none focus:border-white/20 focus:ring-2 focus:ring-white/10 transition-colors duration-300 text-xs sm:text-sm"
            />
            <button className="bg-white text-black px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium hover:bg-white/90 transition-colors duration-300 text-xs sm:text-sm">
              Notify Me
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

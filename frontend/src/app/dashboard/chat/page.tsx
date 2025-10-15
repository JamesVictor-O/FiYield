"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  "What's the best yield farming strategy for beginners?",
  "How do I calculate my APY returns?",
  "What are the risks of DeFi yield farming?",
  "Should I diversify my yield investments?",
  "How does compound interest work in DeFi?",
  "What's the difference between lending and liquidity mining?",
];

const AI_RESPONSES = {
  "yield farming strategy":
    "For beginners, I recommend starting with established protocols like Aave or Compound for lending, or Uniswap for liquidity provision. These platforms have lower risk and good documentation. Start with a small amount to learn the mechanics before scaling up.",
  "calculate apy":
    "APY (Annual Percentage Yield) is calculated as: APY = (1 + r/n)^n - 1, where r is the annual interest rate and n is the number of compounding periods. In DeFi, most platforms show your APY directly, but you can also use compound interest calculators online.",
  "risks of defi":
    "DeFi yield farming carries several risks: smart contract bugs, impermanent loss (for liquidity providers), protocol insolvency, and market volatility. Always do your research, start small, and never invest more than you can afford to lose. Consider using established protocols with audit histories.",
  "diversify investments":
    "Yes, diversification is crucial in DeFi! Spread your investments across different protocols, asset types, and risk levels. Consider a mix of lending (lower risk), liquidity provision (medium risk), and yield farming (higher risk) based on your risk tolerance.",
  "compound interest":
    "Compound interest in DeFi works by automatically reinvesting your earned rewards back into the protocol. This creates exponential growth over time. The key is to choose protocols that compound frequently (daily or weekly) and have sustainable yields.",
  "lending vs liquidity":
    "Lending involves providing assets to borrowers and earning interest (like Aave). Liquidity mining involves providing trading pairs to DEXs and earning trading fees + rewards (like Uniswap). Lending is generally lower risk, while liquidity mining can have higher rewards but also impermanent loss risk.",
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "ai",
      content:
        "Hello! I'm your AI assistant for yield investment strategies. I can help you understand DeFi protocols, calculate returns, assess risks, and optimize your investment portfolio. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Check for specific topics
    for (const [topic, response] of Object.entries(AI_RESPONSES)) {
      if (lowerMessage.includes(topic)) {
        return response;
      }
    }

    // Default responses based on keywords
    if (lowerMessage.includes("risk") || lowerMessage.includes("safe")) {
      return "Risk management in DeFi is crucial. Start with established protocols, diversify your investments, and never invest more than you can afford to lose. Consider your risk tolerance and investment timeline.";
    }

    if (
      lowerMessage.includes("profit") ||
      lowerMessage.includes("earn") ||
      lowerMessage.includes("money")
    ) {
      return "To maximize profits in DeFi, focus on sustainable yields from reputable protocols. Look for APYs between 5-15% from established platforms. Higher yields often come with higher risks, so always research the protocol thoroughly.";
    }

    if (lowerMessage.includes("start") || lowerMessage.includes("beginner")) {
      return "For beginners, I recommend starting with simple lending protocols like Aave or Compound. These are well-audited, have good documentation, and offer stable yields. Start with a small amount to learn the mechanics before scaling up.";
    }

    // Generic helpful response
    return "That's a great question about yield investing! Based on your query, I'd recommend researching the specific protocol you're interested in, checking their audit history, and starting with a small amount to test the waters. Feel free to ask me about specific strategies, risk management, or any DeFi concepts you'd like to understand better.";
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: generateAIResponse(inputValue),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000); // 1-3 seconds delay
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-[#101110] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white font-pop">
                AI Investment Assistant
              </h1>
              <p className="text-sm sm:text-base text-gray-400">
                Get expert guidance on yield farming and DeFi strategies
              </p>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {/* Messages */}
          <div className="h-[400px] sm:h-[500px] lg:h-[600px] overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 sm:gap-3 ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.type === "ai" && (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 ${
                    message.type === "user"
                      ? "bg-white text-black ml-auto"
                      : "bg-white/10 text-white"
                  }`}
                >
                  <p className="text-xs sm:text-sm leading-relaxed">
                    {message.content}
                  </p>
                  <p className="text-xs opacity-60 mt-1 sm:mt-2">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {message.type === "user" && (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 sm:gap-3 justify-start">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <div className="bg-white/10 text-white rounded-2xl px-3 sm:px-4 py-2 sm:py-3">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/60 rounded-full animate-bounce"></div>
                    <div
                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/60 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/60 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length === 1 && (
            <div className="p-4 sm:p-6 border-t border-white/10">
              <h3 className="text-xs sm:text-sm font-medium text-gray-400 mb-3 sm:mb-4">
                Suggested Questions:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTED_QUESTIONS.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="text-left p-2 sm:p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-colors duration-300 text-xs sm:text-sm"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 sm:p-6 border-t border-white/10">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about yield farming, DeFi strategies, or investment advice..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 text-white placeholder-gray-400 focus:outline-none focus:border-white/20 focus:ring-2 focus:ring-white/10 transition-colors duration-300 text-xs sm:text-sm"
                  disabled={isTyping}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="bg-white text-black px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300 flex items-center justify-center gap-2 text-xs sm:text-sm"
              >
                <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

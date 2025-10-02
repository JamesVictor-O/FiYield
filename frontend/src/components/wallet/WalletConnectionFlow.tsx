'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { createSmartAccount, getSmartAccount } from '@/lib/metamask/smartAccount';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

interface WalletConnectionFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function WalletConnectionFlow({ isOpen, onClose, onSuccess }: WalletConnectionFlowProps) {
  const { login } = usePrivy();
  const [step, setStep] = useState<'choose' | 'connect' | 'smart-account'>('choose');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTraditionalWallet = async () => {
    setLoading(true);
    setError(null);
    try {
      await login();
      onSuccess();
      onClose();
    } catch (err) {
      setError('Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleSmartAccount = async () => {
    setLoading(true);
    setError(null);
    try {
      // Check if user already has a Smart Account
      const existingAccount = await getSmartAccount();
      
      if (existingAccount) {
        // User already has a Smart Account, just connect
        await login();
        onSuccess();
        onClose();
      } else {
        // Create new Smart Account
        setStep('smart-account');
        const smartAccount = await createSmartAccount();
        console.log('Smart Account created:', smartAccount);
        
        // After Smart Account creation, connect the wallet
        await login();
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Error creating Smart Account:', err);
      setError('Failed to create Smart Account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('choose');
    setError(null);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-white border border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-pop font-bold text-gray-900">
            Connect to NexYield
          </DialogTitle>
        </DialogHeader>

        {step === 'choose' && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 font-pop mb-6">
                Choose how you'd like to connect to NexYield
              </p>
            </div>

            <div className="space-y-4">
              {/* Traditional Wallet Option */}
              <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-pop font-semibold text-gray-900">Traditional Wallet</h3>
                    <p className="text-sm text-gray-600 font-pop">Connect with MetaMask, WalletConnect, etc.</p>
                  </div>
                </div>
                <Button
                  onClick={handleTraditionalWallet}
                  disabled={loading}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-pop"
                >
                  {loading ? 'Connecting...' : 'Connect Wallet'}
                </Button>
              </div>

              {/* Smart Account Option */}
              <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-pop font-semibold text-gray-900">Smart Account</h3>
                    <p className="text-sm text-gray-600 font-pop">AI-powered automation & gasless transactions</p>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="flex items-center gap-2 text-xs text-green-600 font-pop">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    <span>Automated yield optimization</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-green-600 font-pop">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    <span>Gasless transactions</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-green-600 font-pop">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    <span>24/7 portfolio management</span>
                  </div>
                </div>
                <Button
                  onClick={handleSmartAccount}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-pop"
                >
                  {loading ? 'Creating...' : 'Create Smart Account'}
                </Button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600 font-pop">{error}</p>
              </div>
            )}
          </div>
        )}

        {step === 'smart-account' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-pop font-semibold text-gray-900 mb-2">
                Smart Account Created!
              </h3>
              <p className="text-gray-600 font-pop">
                Your Smart Account is ready. You can now enjoy automated yield optimization and gasless transactions.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-pop font-semibold text-green-900 mb-2">What's Next?</h4>
              <ul className="space-y-1 text-sm text-green-800 font-pop">
                <li>• Set up AI delegation for automated rebalancing</li>
                <li>• Configure your risk preferences</li>
                <li>• Start earning optimized yields</li>
              </ul>
            </div>

            <Button
              onClick={handleClose}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-pop"
            >
              Continue to Dashboard
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

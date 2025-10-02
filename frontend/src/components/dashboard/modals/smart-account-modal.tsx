'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DelegationSetup } from '@/components/delegation/DelegationSetup';
import { Button } from '@/components/ui/button';

interface SmartAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SmartAccountModal({ isOpen, onClose }: SmartAccountModalProps) {
  const [step, setStep] = useState<'info' | 'setup'>('info');

  const handleStartSetup = () => {
    setStep('setup');
  };

  const handleBack = () => {
    setStep('info');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-2xl font-pop font-bold text-gray-900">
            Smart Account & AI Delegation
          </DialogTitle>
        </DialogHeader>

        {step === 'info' ? (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-pop font-semibold text-blue-900 mb-3">
                What is a Smart Account?
              </h3>
              <p className="text-blue-800 font-pop leading-relaxed">
                A Smart Account is an advanced wallet that enables automated transactions and AI delegation. 
                It allows you to grant specific permissions to AI agents while maintaining full control over your funds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-lg font-pop font-semibold text-gray-900">
                  🚀 Benefits
                </h4>
                <ul className="space-y-2 text-gray-700 font-pop">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Automated yield optimization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>24/7 portfolio rebalancing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Smart deposit strategies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Gasless transactions</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-pop font-semibold text-gray-900">
                  🛡️ Security Features
                </h4>
                <ul className="space-y-2 text-gray-700 font-pop">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Granular permission controls</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Time-limited delegations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Value limits per transaction</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Revoke permissions anytime</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-pop font-semibold text-gray-900 mb-3">
                How It Works
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-pop font-bold">1</span>
                  </div>
                  <h5 className="font-pop font-semibold text-gray-900 mb-2">Create Account</h5>
                  <p className="text-sm text-gray-600 font-pop">
                    Set up your Smart Account through MetaMask
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-pop font-bold">2</span>
                  </div>
                  <h5 className="font-pop font-semibold text-gray-900 mb-2">Grant Permissions</h5>
                  <p className="text-sm text-gray-600 font-pop">
                    Delegate specific operations to AI agents
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-pop font-bold">3</span>
                  </div>
                  <h5 className="font-pop font-semibold text-gray-900 mb-2">Earn Automatically</h5>
                  <p className="text-sm text-gray-600 font-pop">
                    AI optimizes your yields 24/7
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 font-pop"
              >
                Maybe Later
              </Button>
              <Button
                onClick={handleStartSetup}
                className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-pop"
              >
                Get Started
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button
                onClick={handleBack}
                variant="outline"
                size="sm"
                className="font-pop"
              >
                ← Back
              </Button>
              <h3 className="text-lg font-pop font-semibold text-gray-900">
                Setup Smart Account & Delegations
              </h3>
            </div>

            <DelegationSetup
              vaultAddress={process.env.NEXT_PUBLIC_VAULT_ADDRESS || '0x...'}
              agentExecutorAddress={process.env.NEXT_PUBLIC_AGENT_EXECUTOR_ADDRESS || '0x...'}
              onDelegationCreated={(delegation) => {
                console.log('Delegation created:', delegation);
                // You can add success handling here
              }}
            />

            <div className="flex justify-end">
              <Button
                onClick={onClose}
                className="bg-gray-900 hover:bg-gray-800 text-white font-pop"
              >
                Complete Setup
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

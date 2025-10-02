'use client';

import { useState, useEffect } from 'react';
import { getSmartAccount, getSmartAccountBalance } from '@/lib/metamask/smartAccount';
import { getActiveDelegations } from '@/lib/metamask/delegation';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface SmartAccountStatusProps {
  onSetupClick?: () => void;
}

export function SmartAccountStatus({ onSetupClick }: SmartAccountStatusProps) {
  const [smartAccount, setSmartAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [delegations, setDelegations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSmartAccountStatus();
  }, []);

  const checkSmartAccountStatus = async () => {
    try {
      setLoading(true);
      
      // Check for existing smart account
      const account = await getSmartAccount();
      if (account) {
        setSmartAccount(account);
        
        // Get balance
        const accountBalance = await getSmartAccountBalance(account);
        setBalance(accountBalance);
        
        // Get delegations
        const activeDelegations = await getActiveDelegations(account);
        setDelegations(activeDelegations);
      }
    } catch (error) {
      console.error('Error checking smart account status:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (balance: string) => {
    const balanceNum = parseInt(balance, 16) / 1e18;
    return balanceNum.toFixed(4);
  };

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-white/10 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-white/10 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!smartAccount) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white font-pop mb-2">
              Smart Account
            </h3>
            <p className="text-sm text-gray-400 font-pop">
              Enable AI-powered yield optimization
            </p>
          </div>
          <Button
            onClick={onSetupClick}
            className="bg-white text-black hover:bg-white/90 font-pop"
          >
            Setup
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white font-pop">
          Smart Account
        </h3>
        <Badge className="bg-green-100 text-green-800 border-green-200 font-pop">
          Active
        </Badge>
      </div>
      
      <div className="space-y-3">
        <div>
          <p className="text-sm text-gray-400 font-pop">Address:</p>
          <p className="font-mono text-sm text-white break-all">
            {smartAccount.slice(0, 6)}...{smartAccount.slice(-4)}
          </p>
        </div>
        
        <div>
          <p className="text-sm text-gray-400 font-pop">Balance:</p>
          <p className="text-white font-pop">
            {formatBalance(balance)} MON
          </p>
        </div>
        
        <div>
          <p className="text-sm text-gray-400 font-pop">Active Delegations:</p>
          <p className="text-white font-pop">
            {delegations.length} delegation{delegations.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      
      <Button
        onClick={onSetupClick}
        className="w-full mt-4 bg-white text-black hover:bg-white/90 font-pop"
      >
        Manage Delegations
      </Button>
    </div>
  );
}

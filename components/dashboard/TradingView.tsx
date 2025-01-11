import React from 'react';
import { Card, CardContent, CardHeader } from '@mui/material';
import { TradingDashboard } from '@/lib/components/TradingDashboard';
import { useWalletStore } from '@/lib/store';

export function TradingView() {
  const { wallet } = useWalletStore();

  if (!wallet) {
    return (
      <Card>
        <CardHeader title="Trading Dashboard" />
        <CardContent>
          <div className="text-center text-gray-500">
            Please connect your wallet to access trading features.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full">
      <TradingDashboard 
        account={wallet}
        provider={wallet.provider}
      />
    </div>
  );
}

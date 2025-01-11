"use client";

import { useWalletStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { AssetOverview } from "./AssetOverview";
import { InvestmentStrategies } from "./InvestmentStrategies";
import { RiskAssessment } from "./RiskAssessment";
import { TransactionHistory } from "./TransactionHistory";
import { AIRecommendations } from "./AIRecommendations";
import { NotificationCenter } from "./NotificationCenter";
import { TradingView } from "./TradingView";
import { useWallet } from "@/lib/hooks/useWallet";

export function DashboardView() {
  const { wallet } = useWalletStore();
  const { connectWallet, loading } = useWallet();

  if (!wallet) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to StarkIntent</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Connect your wallet to access smart investment strategies and AI-powered recommendations.
          </p>
          <Button 
            size="lg" 
            onClick={connectWallet}
            disabled={loading}
          >
            {loading ? 'Connecting...' : 'Connect Wallet'} 
            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AssetOverview />
        </div>
        <div className="lg:col-span-1">
          <RiskAssessment />
        </div>
        <div className="lg:col-span-2">
          <TradingView />
        </div>
        <div className="lg:col-span-1">
          <InvestmentStrategies />
        </div>
        <div className="lg:col-span-2">
          <TransactionHistory />
        </div>
        <div className="lg:col-span-1">
          <AIRecommendations />
        </div>
        <div className="lg:col-span-3">
          <NotificationCenter />
        </div>
      </div>
    </div>
  );
}
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";

const RECOMMENDATIONS = [
  {
    id: 1,
    type: "opportunity",
    title: "DeFi Yield Opportunity",
    description: "High-yield farming pool detected with 15% APY",
    icon: Sparkles,
  },
  {
    id: 2,
    type: "trend",
    title: "Market Trend Alert",
    description: "Positive momentum in Layer 2 tokens",
    icon: TrendingUp,
  },
  {
    id: 3,
    type: "risk",
    title: "Risk Warning",
    description: "Increased volatility in your portfolio assets",
    icon: AlertTriangle,
  },
];

export function AIRecommendations() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <CardTitle>AI Insights</CardTitle>
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {RECOMMENDATIONS.map((rec) => (
            <div
              key={rec.id}
              className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <rec.icon className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium mb-1">{rec.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                  <Button variant="ghost" size="sm">
                    Learn more <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const RISK_FACTORS = [
  { name: "Market Risk", score: 65 },
  { name: "Liquidity Risk", score: 42 },
  { name: "Protocol Risk", score: 38 },
  { name: "Volatility", score: 72 },
];

export function RiskAssessment() {
  const overallRisk = Math.round(
    RISK_FACTORS.reduce((acc, factor) => acc + factor.score, 0) / RISK_FACTORS.length
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Assessment</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Overall Risk Score</span>
              <span className="text-sm font-medium">{overallRisk}/100</span>
            </div>
            <Progress value={overallRisk} className="h-2" />
          </div>

          <div className="space-y-4">
            {RISK_FACTORS.map((factor) => (
              <div key={factor.name}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">{factor.name}</span>
                  <span className="text-sm text-muted-foreground">{factor.score}%</span>
                </div>
                <Progress value={factor.score} className="h-1" />
              </div>
            ))}
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Risk Alert</AlertTitle>
            <AlertDescription>
              High market volatility detected. Consider rebalancing your portfolio.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
}
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDownUp, ArrowUpRight, ArrowDownRight } from "lucide-react";

const TRANSACTIONS = [
  {
    id: 1,
    type: "Deposit",
    amount: "+1.5 ETH",
    timestamp: "2024-03-20 14:30",
    status: "completed",
  },
  {
    id: 2,
    type: "Strategy Execution",
    amount: "-0.8 ETH",
    timestamp: "2024-03-19 09:15",
    status: "completed",
  },
  {
    id: 3,
    type: "Withdrawal",
    amount: "-0.3 ETH",
    timestamp: "2024-03-18 16:45",
    status: "pending",
  },
];

export function TransactionHistory() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Transactions</CardTitle>
        <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {TRANSACTIONS.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {tx.type === "Deposit" ? (
                  <ArrowDownRight className="h-4 w-4 text-green-500" />
                ) : tx.type === "Withdrawal" ? (
                  <ArrowUpRight className="h-4 w-4 text-red-500" />
                ) : (
                  <ArrowDownUp className="h-4 w-4 text-blue-500" />
                )}
                <div>
                  <p className="text-sm font-medium">{tx.type}</p>
                  <p className="text-xs text-muted-foreground">{tx.timestamp}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{tx.amount}</span>
                <Badge variant={tx.status === "completed" ? "secondary" : "outline"}>
                  {tx.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
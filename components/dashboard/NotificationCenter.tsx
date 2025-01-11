"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Wallet as WalletIcon, BarChart2, Shield } from "lucide-react";

const NOTIFICATIONS = [
  {
    id: 1,
    type: "transaction",
    title: "Transaction Confirmed",
    message: "Your deposit of 1.5 ETH has been confirmed",
    timestamp: "5 min ago",
    read: false,
    icon: WalletIcon,
  },
  {
    id: 2,
    type: "strategy",
    title: "Strategy Update",
    message: "Your portfolio has been rebalanced successfully",
    timestamp: "1 hour ago",
    read: true,
    icon: BarChart2,
  },
  {
    id: 3,
    type: "security",
    title: "Security Alert",
    message: "Unusual activity detected in your account",
    timestamp: "2 hours ago",
    read: false,
    icon: Shield,
  },
];

export function NotificationCenter() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Notifications</CardTitle>
        <Bell className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {NOTIFICATIONS.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${
                  !notification.read ? "bg-accent/50" : "bg-card"
                } hover:bg-accent/50 transition-colors`}
              >
                <div className="flex items-start space-x-3">
                  <notification.icon className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium">{notification.title}</h4>
                      {!notification.read && (
                        <Badge variant="secondary" className="text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{notification.message}</p>
                    <span className="text-xs text-muted-foreground">{notification.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
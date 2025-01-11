"use client";

import { Button } from "@/components/ui/button";
import { connect, disconnect } from "get-starknet";
import { useWalletStore } from "@/lib/store";
import { useEffect } from "react";
import { Wallet2 } from "lucide-react";

export function Header() {
  const { wallet, setWallet, isConnecting, setIsConnecting } = useWalletStore();

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const starknet = await connect();
      if (starknet) {
        setWallet(starknet);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setWallet(null);
    } catch (error) {
      console.error(error);
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Wallet2 className="h-6 w-6" />
          <h1 className="text-xl font-bold">StarkIntent</h1>
        </div>
        
        <div>
          {wallet ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                {shortenAddress(wallet.selectedAddress)}
              </span>
              <Button variant="outline" onClick={handleDisconnect}>
                Disconnect
              </Button>
            </div>
          ) : (
            <Button onClick={handleConnect} disabled={isConnecting}>
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
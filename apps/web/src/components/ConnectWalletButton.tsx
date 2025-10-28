// ConnectWalletButton component
"use client";

import { useWC } from "./WCProvider";
import Button from "@/components/ui/Button"

export default function ConnectWalletButton() {
    const { account, connect, disconnect } = useWC();
    const short = account ? `${account.slice(0, 6)}…${account.slice(-4)}` : null;

    return (
      <div className="flex items-center gap-2">
        {!account ? (
          <Button onClick={connect} size="sm" variant="primary">
            Connect Wallet
          </Button>
        ) : (
          <>
            <span className="px-2 py-1 rounded-md text-xs bg-white/10">Wallet: {short}</span>
            <Button onClick={disconnect} size="sm" variant="secondary">
              Disconnect
            </Button>
          </>
        )}
      </div>
    );
}

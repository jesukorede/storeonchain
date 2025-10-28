"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

export type WCContextType = {
  account: string | null
  provider: any | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
}

const WCContext = createContext<WCContextType>({
  account: null,
  provider: null,
  connect: async () => {},
  disconnect: async () => {},
})

export function useWC() {
  return useContext(WCContext)
}

export default function WCProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<any | null>(null)
  const [account, setAccount] = useState<string | null>(null)

  // Try to restore injected provider account (MetaMask etc.)
  useEffect(() => {
    const eth = (typeof window !== 'undefined' ? (window as any).ethereum : null)
    if (!eth) return
    eth.request?.({ method: 'eth_accounts' }).then((accs: string[]) => {
      if (accs?.length) setAccount(accs[0])
    }).catch(() => {})
  }, [])

  async function connectWithInjected() {
    const eth = (window as any).ethereum
    const accs: string[] = await eth.request({ method: 'eth_requestAccounts' })
    setProvider(eth)
    setAccount(accs?.[0] || null)
  }

  async function connect() {
    try {
      // Attempt Hedera WalletConnect if available; fall back to injected
      const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
      const network = process.env.NEXT_PUBLIC_NETWORK || 'testnet'
      const chainId = network === 'mainnet' ? 295 : 296

      const mod: any = await import('@hashgraph/hedera-wallet-connect').catch(() => null)
      if (mod) {
        // Many APIs follow a pattern similar to new WalletConnectProvider({ projectId, chains: [chainId] })
        // Use extremely defensive coding to avoid build-time type issues.
        const WCProvCtor = (mod.default || mod.WalletConnectProvider || mod.HederaWalletConnect || mod)
        if (WCProvCtor) {
          const wcProv = new WCProvCtor({ projectId, chains: [chainId] })
          // Open a pairing modal if present
          if (wcProv.connect) {
            const session = await wcProv.connect()
            const acc = session?.accounts?.[0] || session?.address || null
            setProvider(wcProv)
            setAccount(acc)
            return
          }
          // Fallback: try request eth_requestAccounts
          try {
            const accs: string[] = await wcProv.request?.({ method: 'eth_requestAccounts' })
            setProvider(wcProv)
            setAccount(accs?.[0] || null)
            return
          } catch {}
        }
      }
      // Fallback to injected provider
      if ((window as any).ethereum) {
        await connectWithInjected()
        return
      }
      alert('No WalletConnect-compatible wallet or injected wallet found.')
    } catch (e) {
      console.error(e)
      alert('Failed to connect wallet. See console for details.')
    }
  }

  async function disconnect() {
    try {
      if (provider?.disconnect) await provider.disconnect()
    } catch {}
    setProvider(null)
    setAccount(null)
  }

  const value = useMemo(() => ({ account, provider, connect, disconnect }), [account, provider])

  return (
    <WCContext.Provider value={value}>{children}</WCContext.Provider>
  )
}

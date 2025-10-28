// EscrowPage component: remove buyer field, add network/chain display, validations, include from in tx
"use client"

import { useState, useEffect } from "react"
import { Lock, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from "lucide-react"
import { getAuth } from "firebase/auth"
import { useWC } from "@/components/WCProvider"
import { useToast } from "@/components/ToastProvider"
import { getSocket } from "@/lib/socket"
import PageHeader from "@/components/ui/PageHeader"
import Card, { CardContent } from "@/components/ui/Card"
import Button from "@/components/ui/Button"

export default function EscrowPage() {
  const { provider, account } = useWC()
  const { toast } = useToast()
  const [orderId, setOrderId] = useState("")
  const [seller, setSeller] = useState("")
  const [amount, setAmount] = useState("")
  const [deadline, setDeadline] = useState("")
  const [result, setResult] = useState<string>("")
  const [status, setStatus] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [txHash, setTxHash] = useState<string>("")
  const [chainId, setChainId] = useState<number | null>(null)
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"
  const network = process.env.NEXT_PUBLIC_NETWORK || 'testnet'

  useEffect(() => {
    const eth = provider ?? (typeof window !== 'undefined' ? (window as any).ethereum : null)
    eth?.request?.({ method: "eth_chainId" })
      .then((hex: string) => setChainId(parseInt(hex, 16)))
      .catch(() => {})
  }, [provider])

  function toBytes32Hex(str: string) {
    const enc = new TextEncoder()
    const bytes = Array.from(enc.encode(str))
    const hex = bytes.map(b => b.toString(16).padStart(2, '0')).join('')
    return '0x' + hex.padEnd(64, '0').slice(0, 64)
  }

  async function onPrepareLock(e: React.FormEvent) {
    e.preventDefault()
    setResult("")
    setTxHash("")
    setIsLoading(true)
    try {
      // Basic client-side validations
      const now = Math.floor(Date.now() / 1000)
      if (!seller || !seller.startsWith("0x") || seller.length !== 42) throw new Error("Invalid seller address (must be 0x-prefixed, 42 chars).")
      if (!deadline || Number(deadline) <= now) throw new Error("Deadline must be a future Unix timestamp.")
      if (!amount || Number(amount) <= 0) throw new Error("Amount must be greater than zero.")
      if (!account) throw new Error("No wallet connected. Connect a wallet first.")

      setStatus("Preparing unsigned transaction...")
      const amountWei = (BigInt(Math.floor(Number(amount) * 1e8)) * BigInt(10 ** 10)).toString()
      const body = {
        orderId,
        seller,
        deadline: Number(deadline),
        amountWei,
      }

      // Get Firebase ID token for protected API calls
      const token = await getAuth().currentUser?.getIdToken()
      if (!token) throw new Error("Please sign in on /profile to continue.")

      const res = await fetch(`${base}/api/escrow/prepare/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to prepare tx")
      setResult(JSON.stringify(data, null, 2))

      const tx = data?.tx
      if (!tx) throw new Error("API did not return tx")

      const eth = provider ?? (window as any).ethereum
      if (!eth) throw new Error("No EVM provider found. Connect a wallet first.")
      setStatus("Requesting wallet signature...")

      // Ensure tx uses the connected wallet account
      tx.from = account

      const hash: string = await eth.request({
        method: "eth_sendTransaction",
        params: [tx],
      })
      setTxHash(hash)
      setStatus(`Transaction submitted successfully`)

      // Join order-specific room using bytes32 orderId
      const orderIdHex = toBytes32Hex(orderId)
      getSocket().emit('join', `order:${orderIdHex}`)
      // Submitted toast with Hashscan link
      const scanBase = network === 'mainnet' ? 'https://hashscan.io/mainnet/tx/' : 'https://hashscan.io/testnet/tx/'
      toast({ title: 'Submitted', message: 'Transaction sent to network', variant: 'info', duration: 10000, action: { label: 'View on Hashscan', href: `${scanBase}${hash}` } })

      setStatus("Waiting for on-chain verification...")
      const verifyRes = await fetch(`${base}/api/escrow/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ hash }),
      })
      const verify = await verifyRes.json()
      setStatus(verify?.ok ? "Transaction verified" : "Verification in progress")
    } catch (err: any) {
      setStatus(err?.message || String(err))
      setResult("")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = () => {
    if (isLoading) return <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
    if (status.includes("verified") || status.includes("successfully")) return <CheckCircle2 className="w-5 h-5 text-green-400" />
    if (status.includes("Error") || status.includes("No EVM") || status.includes("Invalid")) return <AlertCircle className="w-5 h-5 text-red-400" />
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <PageHeader
          title="Escrow Lock"
          subtitle="Securely lock funds in escrow using smart contracts. Prepare your transaction and sign with your connected wallet."
          meta={
            <p className="text-xs text-slate-500">
              Network: {network} · Chain ID: {chainId ?? '...'} · Wallet: {account ? `${account.slice(0,6)}…${account.slice(-4)}` : 'not connected'}
            </p>
          }
        />

        <Card>
          <CardContent>
            {/* Keep existing fields; you can swap individual inputs to shared Input later */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Order ID</label>
                  <input
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    placeholder="e.g., ORDER-12345"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Amount (HBAR)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    placeholder="e.g., 100.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Seller Address</label>
                  <input
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition font-mono text-sm"
                    placeholder="0x..."
                    value={seller}
                    onChange={(e) => setSeller(e.target.value)}
                  />
                </div>

                {/* Removed Buyer Address block that referenced `buyer` and `setBuyer` */}

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-300">Deadline (Unix Timestamp)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    placeholder={`e.g., ${Math.floor(Date.now() / 1000) + 86400}`}
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                  <p className="text-xs text-slate-500">
                    Current time: {Math.floor(Date.now() / 1000)} (24h from now: {Math.floor(Date.now() / 1000) + 86400})
                  </p>
                </div>
              </div>

              <Button
                onClick={onPrepareLock}
                loading={isLoading}
                className="w-full"
              >
                Prepare Lock Transaction
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
}
async function getEthers() {
  const m = await import('ethers')
  return m.ethers ?? m
}

export async function getProvider() {
  const { JsonRpcProvider } = await getEthers()
  const url = process.env.HEDERA_RPC_URL || 'https://testnet.hashio.io/api'
  return new JsonRpcProvider(url, 296)
}

export function getEscrowAddress() {
  const addr = process.env.ESCROW_CONTRACT_ADDRESS
  if (!addr) throw new Error('ESCROW_CONTRACT_ADDRESS not set')
  return addr
}

export async function encodeFunction(functionSignature: string, args: unknown[]) {
  const { Interface } = await getEthers()
  const iface = new Interface([`function ${functionSignature}`])
  const fnName = functionSignature.slice(0, functionSignature.indexOf('('))
  return iface.encodeFunctionData(fnName, args)
}

export async function buildUnsignedTx(to: string, data: string, valueWei?: string) {
  // Build a plain object compatible with EIP-155 tx fields
  const tx: { to: string; data: string; value?: bigint } = { to, data }
  if (valueWei) tx.value = BigInt(valueWei)
  return tx
}

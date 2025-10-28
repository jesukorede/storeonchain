// Transfer RUHM rewards on testnet
// Usage: node scripts/transferToken.js <tokenId> <fromAccountId> <toAccountId> <amount>
// Requires env: HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY

const { Client, TokenTransferTransaction, AccountId } = require("@hashgraph/sdk")

async function main() {
  const [tokenId, fromId, toId, amountStr] = process.argv.slice(2)
  if (!tokenId || !fromId || !toId || !amountStr) {
    console.log("Usage: node scripts/transferToken.js <tokenId> <from> <to> <amount>")
    process.exit(1)
  }
  const operatorId = process.env.HEDERA_OPERATOR_ID
  const operatorKey = process.env.HEDERA_OPERATOR_KEY
  if (!operatorId || !operatorKey) throw new Error("Missing HEDERA_OPERATOR_ID or HEDERA_OPERATOR_KEY")

  const client = Client.forTestnet().setOperator(operatorId, operatorKey)
  const amount = Number(amountStr)

  const tx = await new TokenTransferTransaction()
    .addTokenTransfer(tokenId, AccountId.fromString(fromId), -amount)
    .addTokenTransfer(tokenId, AccountId.fromString(toId), amount)
    .freezeWith(client)

  const submit = await tx.execute(client)
  const receipt = await submit.getReceipt(client)
  console.log(JSON.stringify({ status: receipt.status.toString() }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

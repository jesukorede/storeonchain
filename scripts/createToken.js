// Hedera RUHM token mint (HTS) - testnet
// Usage: node scripts/createToken.js
// Requires env: HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY

require('dotenv/config')
const { Client, TokenCreateTransaction, TokenType, TokenSupplyType } = require("@hashgraph/sdk")

async function main() {
  const operatorId = process.env.HEDERA_OPERATOR_ID
  const operatorKey = process.env.HEDERA_OPERATOR_KEY
  if (!operatorId || !operatorKey) throw new Error("Missing HEDERA_OPERATOR_ID or HEDERA_OPERATOR_KEY")

  const client = Client.forTestnet().setOperator(operatorId, operatorKey)

  const tx = await new TokenCreateTransaction()
    .setTokenName("Ruhm Token")
    .setTokenSymbol("RUHM")
    .setTokenType(TokenType.FungibleCommon)
    .setDecimals(2)
    .setInitialSupply(1000000)
    .setSupplyType(TokenSupplyType.Infinite)
    .freezeWith(client)

  const submit = await tx.execute(client)
  const receipt = await submit.getReceipt(client)
  console.log(JSON.stringify({ tokenId: receipt.tokenId?.toString() }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

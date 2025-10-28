// Submit a message to Hedera Consensus Service (HCS)
// Usage: node scripts/hcsLog.js <topicId> '{"type":"order_created","orderId":"ord_123"}'
// Requires env: HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY

const { Client, TopicMessageSubmitTransaction } = require("@hashgraph/sdk")

async function main() {
  const [topicId, messageJson] = process.argv.slice(2)
  if (!topicId || !messageJson) {
    console.log("Usage: node scripts/hcsLog.js <topicId> '<json>'")
    process.exit(1)
  }
  const operatorId = process.env.HEDERA_OPERATOR_ID
  const operatorKey = process.env.HEDERA_OPERATOR_KEY
  if (!operatorId || !operatorKey) throw new Error("Missing HEDERA_OPERATOR_ID or HEDERA_OPERATOR_KEY")

  const client = Client.forTestnet().setOperator(operatorId, operatorKey)
  const tx = await new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(messageJson)
    .freezeWith(client)

  const submit = await tx.execute(client)
  const receipt = await submit.getReceipt(client)
  console.log(JSON.stringify({ status: receipt.status.toString() }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  // Use Hardhat's compiled artifact and native ethers to deploy via a JSON-RPC provider.
  const artifact = await hre.artifacts.readArtifact("Escrow");

  const rpcUrl = process.env.HEDERA_RPC_URL || "https://testnet.hashio.io/api";
  const privateKey = process.env.HEDERA_PRIVATE_KEY;
  if (!privateKey)
    throw new Error("HEDERA_PRIVATE_KEY is not set in the environment");

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);

  const factory = new ethers.ContractFactory(
    artifact.abi as any,
    artifact.bytecode as any,
    signer
  );
  const contract = await factory.deploy();

  // Attempt to wait for the deployment transaction to be mined.
  const deployTx =
    (contract as any).deploymentTransaction ||
    (contract as any).deployTransaction ||
    (contract as any).deployment?.transaction;
  let txHash: string | undefined;
  if (deployTx) {
    txHash = deployTx.hash || deployTx.transactionHash || deployTx;
    if (typeof txHash === "string") {
      await provider.waitForTransaction(txHash);
    } else if (typeof (deployTx as any).wait === "function") {
      await (deployTx as any).wait();
      txHash = (deployTx as any).hash || (deployTx as any).transactionHash;
    }
  }

  let address = (contract as any).target || (contract as any).address;
  if (!address && txHash) {
    const receipt = await provider.getTransactionReceipt(txHash as string);
    address = (receipt as any).contractAddress;
  }
  console.log(JSON.stringify({ escrow: address }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

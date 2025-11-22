import { ethers } from "hardhat";

async function main() {
  console.log("Deploying BalanceVault...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // USDC addresses per chain
  const USDC_ADDRESSES: { [key: string]: string } = {
    // Mainnets
    "1": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Ethereum
    "10": "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", // Optimism
    "137": "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // Polygon
    "42161": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // Arbitrum
    "8453": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base

    // Testnets
    "11155111": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Sepolia
    "84532": "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia
  };

  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();

  // Get USDC address for current chain
  const usdcAddress = USDC_ADDRESSES[chainId];
  if (!usdcAddress) {
    throw new Error(`USDC address not configured for chain ID ${chainId}`);
  }

  // Kalshi deposit address on Arbitrum
  const kalshiDepositAddress = process.env.KALSHI_DEPOSIT_ADDRESS || "0xac266f88d6889e98209eba3cbc3ac42a425637d1";

  console.log("Chain ID:", chainId);
  console.log("USDC Address:", usdcAddress);
  console.log("Kalshi Deposit Address:", kalshiDepositAddress);

  // Deploy BalanceVault
  const BalanceVault = await ethers.getContractFactory("BalanceVault");
  const vault = await BalanceVault.deploy(usdcAddress, kalshiDepositAddress);

  await vault.waitForDeployment();

  const vaultAddress = await vault.getAddress();
  console.log("BalanceVault deployed to:", vaultAddress);

  // Save deployment info
  console.log("\n=== Deployment Summary ===");
  console.log("Network:", network.name);
  console.log("Chain ID:", chainId);
  console.log("BalanceVault:", vaultAddress);
  console.log("USDC Token:", usdcAddress);
  console.log("Kalshi Deposit Address:", kalshiDepositAddress);
  console.log("Deployer:", deployer.address);

  // Wait for a few block confirmations before verification
  if (chainId !== "31337") { // Skip for local network
    console.log("\nWaiting for block confirmations...");
    await vault.deploymentTransaction()?.wait(5);

    console.log("\nTo verify the contract, run:");
    console.log(`npx hardhat verify --network ${network.name} ${vaultAddress} ${usdcAddress} ${kalshiDepositAddress}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

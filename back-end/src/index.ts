import 'dotenv/config';
import { ChainIndexer } from './chain-indexer';
import { KalshiService } from './kalshi-service';
// Import ABI from compiled contract
// After compiling contracts, copy the ABI here or import from:
// import BalanceVaultArtifact from '../../bagra-contracts/artifacts/contracts/BalanceVault.sol/BalanceVault.json';
// const BalanceVaultABI = BalanceVaultArtifact.abi;

// For now, we'll define a minimal ABI
const BalanceVaultABI: any[] = [
  {
    type: 'function',
    name: 'creditDeposit',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  }
];

// Environment variables
const RPC_URL = process.env.RPC_URL || 'https://arb1.arbitrum.io/rpc';
const USDC_ADDRESS = process.env.USDC_ADDRESS || '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'; // Arbitrum USDC
const KALSHI_DEPOSIT_ADDRESS = process.env.KALSHI_DEPOSIT_ADDRESS || '0xac266f88d6889e98209eba3cbc3ac42a425637d1';
const BALANCE_VAULT_ADDRESS = process.env.BALANCE_VAULT_ADDRESS!;
const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY! as `0x${string}`;

// Kalshi config
const KALSHI_API_KEY = process.env.KALSHI_API_KEY!;
const KALSHI_PRIVATE_KEY_PATH = process.env.KALSHI_PRIVATE_KEY_PATH;
const KALSHI_PRIVATE_KEY_PEM = process.env.KALSHI_PRIVATE_KEY_PEM;

async function main() {
  console.log('=== Bagra Markets Indexer ===\n');

  // Validate required environment variables
  if (!BALANCE_VAULT_ADDRESS) {
    throw new Error('BALANCE_VAULT_ADDRESS is required');
  }
  if (!OWNER_PRIVATE_KEY) {
    throw new Error('OWNER_PRIVATE_KEY is required');
  }
  if (!KALSHI_API_KEY) {
    throw new Error('KALSHI_API_KEY is required');
  }
  if (!KALSHI_PRIVATE_KEY_PATH && !KALSHI_PRIVATE_KEY_PEM) {
    throw new Error('Either KALSHI_PRIVATE_KEY_PATH or KALSHI_PRIVATE_KEY_PEM is required');
  }

  // Initialize Kalshi service
  const kalshiService = new KalshiService({
    apiKey: KALSHI_API_KEY,
    privateKeyPath: KALSHI_PRIVATE_KEY_PATH,
    privateKeyPem: KALSHI_PRIVATE_KEY_PEM,
  });

  console.log('Kalshi service initialized\n');

  // Initialize Chain Indexer
  const chainIndexer = new ChainIndexer({
    rpcUrl: RPC_URL,
    usdcAddress: USDC_ADDRESS as `0x${string}`,
    kalshiDepositAddress: KALSHI_DEPOSIT_ADDRESS as `0x${string}`,
    balanceVaultAddress: BALANCE_VAULT_ADDRESS as `0x${string}`,
    balanceVaultAbi: BalanceVaultABI as any[],
    ownerPrivateKey: OWNER_PRIVATE_KEY,
  });

  // Get current block
  const currentBlock = await chainIndexer.getCurrentBlock();
  console.log('Current block:', currentBlock);

  // Optionally sync historical transfers
  const START_BLOCK = process.env.START_BLOCK ? BigInt(process.env.START_BLOCK) : currentBlock;
  if (START_BLOCK < currentBlock) {
    console.log('Syncing historical transfers...\n');
    await chainIndexer.syncHistoricalTransfers(START_BLOCK);
  }

  // Start watching for new transfers
  await chainIndexer.start();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
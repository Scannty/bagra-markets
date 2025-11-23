import 'dotenv/config';
import { ChainIndexer } from './chain-indexer';
import { KalshiService } from './kalshi-service';
import { ChilizMinter } from './chiliz-minter';
import { initializeApiServer } from './api-server';
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

// Share Token ABI - ERC20 with mint function
const ShareABI: any[] = [
  {
    type: 'function',
    name: 'mint',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [
      { name: 'account', type: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'event',
    name: 'Minted',
    inputs: [
      { name: 'to', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false }
    ]
  }
];

// Environment variables - Arbitrum
const RPC_URL = process.env.RPC_URL || 'https://arb1.arbitrum.io/rpc';
const USDC_ADDRESS = process.env.USDC_ADDRESS || '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'; // Arbitrum USDC
const KALSHI_DEPOSIT_ADDRESS = process.env.KALSHI_DEPOSIT_ADDRESS || '0xac266f88d6889e98209eba3cbc3ac42a425637d1';
const BALANCE_VAULT_ADDRESS = process.env.BALANCE_VAULT_ADDRESS!;
const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY! as `0x${string}`;

// Network Selection Flag
const USE_ZIRCUIT = process.env.USE_ZIRCUIT === '1';

// Chiliz Spicy Configuration
const CHILIZ_SPICY_RPC_URL = process.env.CHILIZ_SPICY_RPC_URL!;
const CHILIZ_YES_SHARE_ADDRESS = process.env.CHILIZ_YES_SHARE_ADDRESS! as `0x${string}`;
const CHILIZ_NO_SHARE_ADDRESS = process.env.CHILIZ_NO_SHARE_ADDRESS! as `0x${string}`;

// Zircuit Garfield Configuration
const ZIRCUIT_RPC_URL = process.env.ZIRCUIT_RPC_URL!;
const ZIRCUIT_YES_SHARE_ADDRESS = process.env.ZIRCUIT_YES_SHARE_ADDRESS! as `0x${string}`;
const ZIRCUIT_NO_SHARE_ADDRESS = process.env.ZIRCUIT_NO_SHARE_ADDRESS! as `0x${string}`;

// Select network based on flag
const SELECTED_RPC_URL = USE_ZIRCUIT ? ZIRCUIT_RPC_URL : CHILIZ_SPICY_RPC_URL;
const SELECTED_YES_SHARE_ADDRESS = USE_ZIRCUIT ? ZIRCUIT_YES_SHARE_ADDRESS : CHILIZ_YES_SHARE_ADDRESS;
const SELECTED_NO_SHARE_ADDRESS = USE_ZIRCUIT ? ZIRCUIT_NO_SHARE_ADDRESS : CHILIZ_NO_SHARE_ADDRESS;

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
  // Validate network-specific configuration
  if (USE_ZIRCUIT) {
    if (!ZIRCUIT_RPC_URL) {
      throw new Error('ZIRCUIT_RPC_URL is required when USE_ZIRCUIT=1');
    }
    if (!ZIRCUIT_YES_SHARE_ADDRESS) {
      throw new Error('ZIRCUIT_YES_SHARE_ADDRESS is required when USE_ZIRCUIT=1');
    }
    if (!ZIRCUIT_NO_SHARE_ADDRESS) {
      throw new Error('ZIRCUIT_NO_SHARE_ADDRESS is required when USE_ZIRCUIT=1');
    }
  } else {
    if (!CHILIZ_SPICY_RPC_URL) {
      throw new Error('CHILIZ_SPICY_RPC_URL is required when USE_ZIRCUIT=0');
    }
    if (!CHILIZ_YES_SHARE_ADDRESS) {
      throw new Error('CHILIZ_YES_SHARE_ADDRESS is required when USE_ZIRCUIT=0');
    }
    if (!CHILIZ_NO_SHARE_ADDRESS) {
      throw new Error('CHILIZ_NO_SHARE_ADDRESS is required when USE_ZIRCUIT=0');
    }
  }

  console.log(`=== Network Selection: ${USE_ZIRCUIT ? 'Zircuit Garfield' : 'Chiliz Spicy'} ===\n`);

  // Initialize Kalshi service
  const kalshiService = new KalshiService({
    apiKey: KALSHI_API_KEY,
    privateKeyPath: KALSHI_PRIVATE_KEY_PATH,
    privateKeyPem: KALSHI_PRIVATE_KEY_PEM,
  });

  console.log('Kalshi service initialized\n');

  // Initialize Share Minter with selected network
  const chilizMinter = new ChilizMinter({
    rpcUrl: SELECTED_RPC_URL,
    yesShareAddress: SELECTED_YES_SHARE_ADDRESS,
    noShareAddress: SELECTED_NO_SHARE_ADDRESS,
    shareAbi: ShareABI,
    ownerPrivateKey: OWNER_PRIVATE_KEY,
    useZircuit: USE_ZIRCUIT,
  });

  console.log('Share Minter initialized\n');

  // Initialize API server
  initializeApiServer(kalshiService, chilizMinter);
  console.log('API server initialized\n');

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
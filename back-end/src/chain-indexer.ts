import { createPublicClient, createWalletClient, http, parseAbiItem, type Address, type Log } from 'viem';
import { arbitrum } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const USDC_TRANSFER_EVENT = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');

interface ChainIndexerConfig {
  rpcUrl: string;
  usdcAddress: Address;
  kalshiDepositAddress: Address;
  balanceVaultAddress: Address;
  balanceVaultAbi: readonly any[] | any[];
  ownerPrivateKey: `0x${string}`;
}

export class ChainIndexer {
  private publicClient;
  private walletClient;
  private config: ChainIndexerConfig;
  private isRunning = false;
  private processedTxs = new Set<string>(); // Track processed transactions

  constructor(config: ChainIndexerConfig) {
    this.config = config;

    this.publicClient = createPublicClient({
      chain: arbitrum,
      transport: http(config.rpcUrl),
    });

    const account = privateKeyToAccount(config.ownerPrivateKey);
    this.walletClient = createWalletClient({
      account,
      chain: arbitrum,
      transport: http(config.rpcUrl),
    });
  }

  /**
   * Start watching for USDC transfers to Kalshi deposit address
   */
  async start() {
    console.log('Chain Indexer: Starting...');
    console.log('Watching USDC transfers to:', this.config.kalshiDepositAddress);
    console.log('USDC Address:', this.config.usdcAddress);
    console.log('BalanceVault Address:', this.config.balanceVaultAddress);

    this.isRunning = true;

    // Watch for Transfer events to Kalshi deposit address
    this.publicClient.watchEvent({
      address: this.config.usdcAddress,
      event: USDC_TRANSFER_EVENT,
      args: {
        to: this.config.kalshiDepositAddress,
      },
      onLogs: async (logs) => {
        for (const log of logs) {
          await this.handleTransfer(log);
        }
      },
    });

    console.log('Chain Indexer: Listening for deposits...\n');
  }

  /**
   * Handle USDC transfer event
   */
  private async handleTransfer(log: any) {
    try {
      const txHash = log.transactionHash!;

      // Skip if already processed
      if (this.processedTxs.has(txHash)) {
        console.log('Transaction already processed:', txHash);
        return;
      }

      const { from, to, value } = log.args as { from: Address; to: Address; value: bigint };

      console.log('\n=== USDC Transfer Detected ===');
      console.log('From:', from);
      console.log('To:', to);
      console.log('Amount (USDC):', Number(value) / 1e6); // USDC has 6 decimals
      console.log('Block:', log.blockNumber);
      console.log('Tx Hash:', txHash);

      // Credit the deposit on-chain
      await this.creditDepositOnChain(from, value, txHash);

      // Mark as processed
      this.processedTxs.add(txHash);

      console.log('Deposit credited successfully\n');
    } catch (error) {
      console.error('Error handling transfer:', error);
    }
  }

  /**
   * Credit deposit on BalanceVault contract
   */
  private async creditDepositOnChain(user: Address, amount: bigint, txHash: string) {
    try {
      console.log(`Crediting ${Number(amount) / 1e6} USDC to ${user} on BalanceVault...`);

      const hash = await this.walletClient.writeContract({
        address: this.config.balanceVaultAddress,
        abi: this.config.balanceVaultAbi,
        functionName: 'creditDeposit',
        args: [user, amount],
      });

      console.log('creditDeposit transaction sent:', hash);

      // Wait for confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
      console.log('creditDeposit confirmed in block:', receipt.blockNumber);

      return receipt;
    } catch (error) {
      console.error('Error crediting deposit on-chain:', error);
      throw error;
    }
  }

  /**
   * Sync historical transfers from a specific block
   */
  async syncHistoricalTransfers(fromBlock: bigint) {
    console.log(`Syncing transfers from block ${fromBlock}...`);

    const currentBlock = await this.publicClient.getBlockNumber();

    const logs = await this.publicClient.getLogs({
      address: this.config.usdcAddress,
      event: USDC_TRANSFER_EVENT,
      args: {
        to: this.config.kalshiDepositAddress,
      },
      fromBlock,
      toBlock: currentBlock,
    });

    console.log(`Found ${logs.length} historical transfers`);

    for (const log of logs) {
      await this.handleTransfer(log);
    }

    console.log('Historical sync complete');
  }

  /**
   * Stop watching for events
   */
  stop() {
    this.isRunning = false;
    console.log('Chain Indexer: Stopped');
  }

  /**
   * Get current block number
   */
  async getCurrentBlock(): Promise<bigint> {
    return await this.publicClient.getBlockNumber();
  }
}

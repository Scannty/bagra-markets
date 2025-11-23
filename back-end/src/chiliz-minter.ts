import { createPublicClient, createWalletClient, http, type Address } from 'viem';
import { defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// Define Chiliz Spicy testnet chain
const chilizSpicy = defineChain({
  id: 88882,
  name: 'Chiliz Spicy Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'CHZ',
    symbol: 'CHZ',
  },
  rpcUrls: {
    default: {
      http: ['https://spicy-rpc.chiliz.com/'],
    },
    public: {
      http: ['https://spicy-rpc.chiliz.com/'],
    },
  },
  blockExplorers: {
    default: { name: 'ChilizScan', url: 'https://testnet.chiliscan.com' },
  },
});

// Define Zircuit Garfield testnet chain
const zircuitGarfield = defineChain({
  id: 48898,
  name: 'Zircuit Garfield Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://garfield-testnet.zircuit.com'],
    },
    public: {
      http: ['https://garfield-testnet.zircuit.com'],
    },
  },
  blockExplorers: {
    default: { name: 'Zircuit Explorer', url: 'https://explorer.testnet.zircuit.com' },
  },
});

interface ChilizMinterConfig {
  rpcUrl: string;
  yesShareAddress: Address;
  noShareAddress: Address;
  shareAbi: readonly any[] | any[];
  ownerPrivateKey: `0x${string}`;
  useZircuit: boolean; // Flag to determine which network to use
}

export class ChilizMinter {
  private publicClient;
  private walletClient;
  private config: ChilizMinterConfig;
  private networkName: string;

  constructor(config: ChilizMinterConfig) {
    this.config = config;

    // Select chain based on useZircuit flag
    const selectedChain = config.useZircuit ? zircuitGarfield : chilizSpicy;
    this.networkName = config.useZircuit ? 'Zircuit Garfield Testnet' : 'Chiliz Spicy Testnet';

    this.publicClient = createPublicClient({
      chain: selectedChain,
      transport: http(config.rpcUrl),
    });

    const account = privateKeyToAccount(config.ownerPrivateKey);
    this.walletClient = createWalletClient({
      account,
      chain: selectedChain,
      transport: http(config.rpcUrl),
    });

    console.log(`ShareMinter initialized on ${this.networkName}`);
    console.log('Network Chain ID:', selectedChain.id);
    console.log('RPC URL:', config.rpcUrl);
    console.log('YES Share Address:', config.yesShareAddress);
    console.log('NO Share Address:', config.noShareAddress);
    console.log('Owner Address:', account.address);
  }

  /**
   * Mint share tokens to a user based on their Kalshi order
   * @param userAddress - The user's wallet address to receive shares
   * @param side - "yes" or "no" - determines which share token to mint
   * @param count - Number of shares to mint (equal to contract count)
   */
  async mintShares(userAddress: Address, side: 'yes' | 'no', count: number): Promise<string> {
    try {
      // Determine which share contract to use based on side
      const shareAddress = side === 'yes' ? this.config.yesShareAddress : this.config.noShareAddress;

      // Convert count to wei (add 18 decimals)
      const amountInWei = count.toString() + '000000000000000000'; // count + 18 zeros

      console.log('\n=== Minting Share Tokens ===');
      console.log('Network:', this.networkName);
      console.log('Side:', side.toUpperCase());
      console.log('Share Contract:', shareAddress);
      console.log('Recipient:', userAddress);
      console.log('Amount (count):', count);
      console.log('Amount (wei):', amountInWei);

      // Call mint function on the Share contract
      const hash = await this.walletClient.writeContract({
        address: shareAddress,
        abi: this.config.shareAbi,
        functionName: 'mint',
        args: [userAddress, BigInt(amountInWei)],
      });

      console.log('Mint transaction sent:', hash);

      // Wait for confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
      console.log('Mint confirmed in block:', receipt.blockNumber);
      console.log('Transaction status:', receipt.status === 'success' ? 'SUCCESS' : 'FAILED');

      if (receipt.status !== 'success') {
        throw new Error('Mint transaction failed');
      }

      console.log('=== Minting Complete ===\n');

      return hash;
    } catch (error) {
      console.error('Error minting shares:', error);
      throw error;
    }
  }

  /**
   * Get the current block number on Chiliz Spicy
   */
  async getCurrentBlock(): Promise<bigint> {
    return await this.publicClient.getBlockNumber();
  }

  /**
   * Get share token balance for a user
   */
  async getShareBalance(userAddress: Address, side: 'yes' | 'no'): Promise<bigint> {
    const shareAddress = side === 'yes' ? this.config.yesShareAddress : this.config.noShareAddress;

    const balance = await this.publicClient.readContract({
      address: shareAddress,
      abi: this.config.shareAbi,
      functionName: 'balanceOf',
      args: [userAddress],
    });

    return balance as bigint;
  }
}

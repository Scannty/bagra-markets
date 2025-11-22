// Contract addresses
export const KALSHI_DEPOSIT_ADDRESS = '0xac266f88d6889e98209eba3cbc3ac42a425637d1' as const;
export const USDC_ADDRESS = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as const;

export const BALANCE_VAULT_ADDRESS = '0x0176eDb7BF2232611c1FCC1F4b80eE74DFd8fbFe' as const;

// USDC ABI (minimal - just what we need)
export const USDC_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const;

// BalanceVault ABI
export const BALANCE_VAULT_ABI = [
  {
    type: 'function',
    name: 'balances',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'lockedBalances',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getTotalBalance',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  }
] as const;

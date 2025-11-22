import { useState } from 'react';
import { useAccount, useWriteContract, useReadContract, useSwitchChain, useChainId } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { arbitrum } from 'wagmi/chains';
import { USDC_ADDRESS, USDC_ABI, KALSHI_DEPOSIT_ADDRESS, BALANCE_VAULT_ADDRESS, BALANCE_VAULT_ABI } from '../config/contracts';

export function Deposit() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState('');
  const { writeContract, isPending, isSuccess, error } = useWriteContract();
  const { switchChain } = useSwitchChain();
  const chainId = useChainId();

  // Log state changes
  console.log('isPending:', isPending);
  console.log('isSuccess:', isSuccess);
  console.log('error:', error);

  // Read USDC balance
  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Read on-chain balance from BalanceVault
  const { data: vaultBalance } = useReadContract({
    address: BALANCE_VAULT_ADDRESS,
    abi: BALANCE_VAULT_ABI,
    functionName: 'balances',
    args: address ? [address] : undefined,
  });

  const handleDeposit = async () => {
    console.log('Deposit button clicked');
    console.log('Amount:', amount);
    console.log('Address:', address);
    console.log('Chain ID:', chainId);
    console.log('Arbitrum ID:', arbitrum.id);

    if (!amount || !address) {
      console.log('Missing amount or address');
      return;
    }

    // Check if on correct network - always try to switch first
    if (switchChain) {
      try {
        console.log('Switching to Arbitrum...');
        await switchChain({ chainId: arbitrum.id });
        console.log('Network switched successfully');
      } catch (error) {
        console.error('Failed to switch network:', error);
        return;
      }
    }

    try {
      const amountInUnits = parseUnits(amount, 6); // USDC has 6 decimals
      console.log('Amount in units:', amountInUnits.toString());

      // Transfer USDC directly to Kalshi deposit address
      console.log('Calling writeContract...');
      writeContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'transfer',
        args: [KALSHI_DEPOSIT_ADDRESS, amountInUnits],
      });
    } catch (error) {
      console.error('Deposit error:', error);
    }
  };

  if (!isConnected) {
    return (
      <div style={styles.card}>
        <h2>Deposit</h2>
        <p>Please connect your wallet to deposit</p>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <h2>Deposit USDC</h2>

      <div style={styles.balances}>
        <div>
          <p style={styles.label}>Wallet USDC Balance:</p>
          <p style={styles.value}>
            {usdcBalance ? formatUnits(usdcBalance as bigint, 6) : '0.00'} USDC
          </p>
        </div>
        <div>
          <p style={styles.label}>Platform Balance:</p>
          <p style={styles.value}>
            {vaultBalance ? formatUnits(vaultBalance as bigint, 6) : '0.00'} USDC
          </p>
        </div>
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}>Amount (USDC)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          style={styles.input}
          step="0.01"
          min="0"
        />
      </div>

      <button
        onClick={handleDeposit}
        disabled={!amount || isPending}
        style={{
          ...styles.button,
          ...((!amount || isPending) && styles.buttonDisabled)
        }}
      >
        {isPending ? 'Depositing...' : 'Deposit to Kalshi'}
      </button>

      {isSuccess && (
        <p style={styles.success}>
          ✓ Deposit successful! Your balance will update shortly.
        </p>
      )}

      <p style={styles.note}>
        Note: Funds are sent directly to Kalshi. Your on-chain balance will be credited once confirmed.
      </p>
    </div>
  );
}

const styles = {
  card: {
    background: '#13141a',
    padding: '2rem',
    borderRadius: '16px',
    margin: '0 0 3rem 0',
    border: '1px solid #1c1f26',
  },
  balances: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '2rem',
  },
  label: {
    fontSize: '0.8125rem',
    color: '#9ca3af',
    margin: '0 0 0.5rem 0',
    fontWeight: '500',
  },
  value: {
    fontSize: '1.5rem',
    fontWeight: '700',
    margin: 0,
    color: '#fff',
  },
  inputGroup: {
    marginBottom: '1.5rem',
  },
  input: {
    width: '100%',
    padding: '1rem',
    fontSize: '1.125rem',
    background: '#0d0e12',
    border: '1px solid #1c1f26',
    borderRadius: '12px',
    color: '#fff',
    marginTop: '0.5rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    width: '100%',
    padding: '1rem',
    fontSize: '1rem',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  buttonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  success: {
    marginTop: '1rem',
    padding: '1rem',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '12px',
    color: '#10b981',
    textAlign: 'center' as const,
    fontSize: '0.9375rem',
  },
  note: {
    marginTop: '1rem',
    fontSize: '0.8125rem',
    color: '#6b7280',
    textAlign: 'center' as const,
    lineHeight: '1.5',
  },
};

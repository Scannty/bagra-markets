import { useState, useRef, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useReadContract, useSwitchChain, useChainId } from 'wagmi';
import { formatUnits } from 'viem';
import { arbitrum } from 'wagmi/chains';
import { BALANCE_VAULT_ADDRESS, BALANCE_VAULT_ABI } from '../config/contracts';

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const chainId = useChainId();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Read platform balance from BalanceVault
  const { data: vaultBalance } = useReadContract({
    address: BALANCE_VAULT_ADDRESS,
    abi: BALANCE_VAULT_ABI,
    functionName: 'balances',
    args: address ? [address] : undefined,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isConnected && address) {
    // Check if user is on wrong network
    const isWrongNetwork = chainId !== arbitrum.id;

    if (isWrongNetwork) {
      return (
        <div style={styles.container}>
          <span style={styles.wrongNetwork}>Wrong Network</span>
          <button
            onClick={() => switchChain({ chainId: arbitrum.id })}
            style={styles.switchButton}
          >
            Switch to Arbitrum
          </button>
        </div>
      );
    }

    return (
      <div style={styles.container}>
        <div style={styles.balanceBox}>
          <span style={styles.balanceValue}>
            {vaultBalance ? formatUnits(vaultBalance as bigint, 6) : '0.00'} USDC
          </span>
        </div>
        <div style={styles.addressContainer} ref={dropdownRef}>
          <button
            style={styles.addressButton}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {address.slice(0, 6)}...{address.slice(-4)}
          </button>
          {isDropdownOpen && (
            <div style={styles.dropdown}>
              <button
                style={styles.dropdownItem}
                onClick={() => {
                  disconnect();
                  setIsDropdownOpen(false);
                }}
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const connector = connectors[0]; // Use first available connector

  return (
    <div style={styles.container}>
      <button
        onClick={() => connector && connect({ connector })}
        style={styles.connectButton}
        disabled={!connector}
      >
        Connect Wallet
      </button>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  balanceBox: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: '0.125rem',
    padding: '0.6rem 1rem',
    background: '#0d0e12',
    border: '1px solid #1c1f26',
    borderRadius: '10px',
  },
  balanceLabel: {
    fontSize: '0.6875rem',
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: '0.9375rem',
    color: '#10b981',
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  address: {
    padding: '0.625rem 1rem',
    background: '#0d0e12',
    border: '1px solid #1c1f26',
    borderRadius: '10px',
    fontSize: '0.875rem',
    fontFamily: 'monospace',
    color: '#f9fafb',
    fontWeight: '500',
  },
  wrongNetwork: {
    padding: '0.625rem 1rem',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '10px',
    fontSize: '0.875rem',
    color: '#ef4444',
    fontWeight: '600',
  },
  switchButton: {
    padding: '0.625rem 1rem',
    fontSize: '0.8125rem',
    background: 'linear-gradient(135deg, #E57373 0%, #D97373 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    fontWeight: '600',
  },
  connectButton: {
    padding: '0.625rem 1.25rem',
    fontSize: '0.9375rem',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #E57373 0%, #D97373 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  disconnectButton: {
    padding: '0.625rem 1rem',
    fontSize: '0.8125rem',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'background 0.2s',
    fontWeight: '500',
  },
};

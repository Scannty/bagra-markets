import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { getMarket, type Market } from '../services/kalshi';
import { BALANCE_VAULT_ADDRESS, BALANCE_VAULT_ABI } from '../config/contracts';

export function MarketDetail() {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'yes' | 'no'>('yes');
  const [amount, setAmount] = useState('');

  // Read platform balance
  const { data: vaultBalance } = useReadContract({
    address: BALANCE_VAULT_ADDRESS,
    abi: BALANCE_VAULT_ABI,
    functionName: 'balances',
    args: address ? [address] : undefined,
  });

  useEffect(() => {
    async function fetchMarket() {
      if (!ticker) return;

      setLoading(true);
      const data = await getMarket(ticker);
      setMarket(data);
      setLoading(false);
    }

    fetchMarket();
  }, [ticker]);

  const handleTrade = () => {
    if (!isConnected) {
      alert('Please connect your wallet');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    // TODO: Implement trading logic
    console.log('Trading:', { ticker, side: activeTab, amount });
  };

  if (loading) {
    return <div style={styles.loading}>Loading market...</div>;
  }

  if (!market) {
    return <div style={styles.loading}>Market not found</div>;
  }

  const selectedPrice = activeTab === 'yes' ? market.yesPrice : market.noPrice;
  const cost = amount ? (parseFloat(amount) * selectedPrice / 100).toFixed(2) : '0.00';

  return (
    <div style={styles.container}>
      <button onClick={() => navigate('/')} style={styles.backButton}>
        ← Back to Markets
      </button>

      <div style={styles.header}>
        <div style={styles.tickerBadge}>{market.ticker}</div>
        <h1 style={styles.title}>{market.title}</h1>
      </div>

      <div style={styles.content}>
        {/* Left side - chart and info */}
        <div style={styles.leftPanel}>
          <div style={styles.chartPlaceholder}>
            <p style={styles.chartText}>Price chart coming soon</p>
          </div>

          <div style={styles.marketInfo}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Volume</span>
              <span style={styles.infoValue}>${(market.volume / 1000).toFixed(0)}K</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Closes</span>
              <span style={styles.infoValue}>
                {new Date(market.closeTime).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Right side - Trading interface */}
        <div style={styles.rightPanel}>
          <div style={styles.tradeCard}>
            <div style={styles.tabButtons}>
              <button
                onClick={() => setActiveTab('yes')}
                style={{
                  ...styles.tabButton,
                  ...(activeTab === 'yes' && styles.tabButtonActive),
                }}
              >
                Buy Yes
              </button>
              <button
                onClick={() => setActiveTab('no')}
                style={{
                  ...styles.tabButton,
                  ...(activeTab === 'no' && styles.tabButtonActive),
                }}
              >
                Buy No
              </button>
            </div>

            <div style={styles.priceDisplay}>
              <div style={styles.priceButton}>
                <span style={styles.priceButtonLabel}>YES</span>
                <span style={{
                  ...styles.priceButtonValue,
                  color: '#10b981'
                }}>{market.yesPrice}¢</span>
              </div>
              <div style={styles.priceButton}>
                <span style={styles.priceButtonLabel}>NO</span>
                <span style={{
                  ...styles.priceButtonValue,
                  color: '#ef4444'
                }}>{market.noPrice}¢</span>
              </div>
            </div>

            <div style={styles.inputSection}>
              <label style={styles.inputLabel}>Amount (contracts)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                style={styles.input}
                min="0"
                step="1"
              />
              <div style={styles.costInfo}>
                <span style={styles.costLabel}>Cost</span>
                <span style={styles.costValue}>${cost}</span>
              </div>
            </div>

            {isConnected ? (
              <>
                <div style={styles.balanceInfo}>
                  <span style={styles.balanceLabel}>Available Balance</span>
                  <span style={styles.balanceValue}>
                    ${vaultBalance ? formatUnits(vaultBalance as bigint, 6) : '0.00'}
                  </span>
                </div>
                <button
                  onClick={handleTrade}
                  disabled={!amount || parseFloat(amount) <= 0}
                  style={{
                    ...styles.tradeButton,
                    ...(!amount || parseFloat(amount) <= 0 ? styles.tradeButtonDisabled : {})
                  }}
                >
                  Place Order
                </button>
              </>
            ) : (
              <div style={styles.connectPrompt}>
                <p style={styles.connectText}>Connect your wallet to trade</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '1.5rem 2rem',
    minHeight: '100vh',
  },
  backButton: {
    padding: '0.625rem 1.25rem',
    fontSize: '0.875rem',
    background: 'transparent',
    color: '#9ca3af',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '1.5rem',
    transition: 'color 0.2s',
    fontWeight: '500',
  },
  loading: {
    textAlign: 'center' as const,
    padding: '4rem',
    fontSize: '1rem',
    color: '#6b7280',
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    gap: '3rem',
    alignItems: 'stretch',
  },
  leftPanel: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
    height: '100%',
  },
  header: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  tickerBadge: {
    display: 'inline-block',
    padding: '0.375rem 0.875rem',
    background: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    borderRadius: '6px',
    fontSize: '0.6875rem',
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    width: 'fit-content',
  },
  title: {
    fontSize: '1.875rem',
    fontWeight: '700',
    color: '#fff',
    margin: 0,
    lineHeight: '1.2',
  },
  priceSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
    marginTop: '0.25rem',
  },
  currentPrice: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.125rem',
  },
  priceLabel: {
    fontSize: '0.6875rem',
    color: '#6b7280',
    fontWeight: '500',
  },
  priceValue: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#10b981',
    lineHeight: '1',
  },
  chartPlaceholder: {
    background: 'rgba(19, 20, 26, 0.5)',
    border: '1px solid #1c1f26',
    borderRadius: '12px',
    padding: '4rem 2rem',
    textAlign: 'center' as const,
    flex: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
  },
  chartText: {
    color: '#4b5563',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  marketInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem',
    marginTop: '0',
  },
  infoItem: {
    background: 'rgba(19, 20, 26, 0.8)',
    border: '1px solid #1c1f26',
    borderRadius: '12px',
    padding: '1.25rem 1.25rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  infoLabel: {
    fontSize: '0.75rem',
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  infoValue: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#f9fafb',
  },
  rightPanel: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  tradeCard: {
    background: 'rgba(19, 20, 26, 0.8)',
    border: '1px solid #1c1f26',
    borderRadius: '16px',
    padding: '1.75rem',
    flex: '1',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  tabButtons: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.5rem',
    marginBottom: '1.5rem',
  },
  tabButton: {
    padding: '0.75rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    background: 'transparent',
    color: '#6b7280',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabButtonActive: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: '#fff',
  },
  priceDisplay: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.625rem',
    marginBottom: '1.5rem',
  },
  priceButton: {
    padding: '1rem 0.875rem',
    borderRadius: '10px',
    background: 'rgba(13, 14, 18, 0.8)',
    border: '1px solid #1c1f26',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '0.375rem',
  },
  priceButtonLabel: {
    fontSize: '0.6875rem',
    color: '#9ca3af',
    fontWeight: '700',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  priceButtonValue: {
    fontSize: '1.375rem',
    fontWeight: '700',
    lineHeight: '1',
  },
  inputSection: {
    marginBottom: '1.5rem',
  },
  inputLabel: {
    display: 'block',
    fontSize: '0.875rem',
    color: '#9ca3af',
    marginBottom: '0.625rem',
    fontWeight: '500',
    textAlign: 'center' as const,
  },
  input: {
    width: '100%',
    padding: '0.875rem 1rem',
    fontSize: '1.125rem',
    background: 'rgba(13, 14, 18, 0.8)',
    border: '1px solid #1c1f26',
    borderRadius: '10px',
    color: '#fff',
    outline: 'none',
    marginBottom: '0.875rem',
    fontWeight: '600',
    textAlign: 'center' as const,
    boxSizing: 'border-box' as const,
  },
  costInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.875rem 0',
  },
  costLabel: {
    fontSize: '0.875rem',
    color: '#6b7280',
    fontWeight: '500',
  },
  costValue: {
    fontSize: '1.125rem',
    color: '#f9fafb',
    fontWeight: '700',
  },
  balanceInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    padding: '0.875rem 0',
  },
  balanceLabel: {
    fontSize: '0.875rem',
    color: '#9ca3af',
    fontWeight: '500',
  },
  balanceValue: {
    fontSize: '1rem',
    color: '#10b981',
    fontWeight: '700',
  },
  tradeButton: {
    width: '100%',
    padding: '1rem',
    fontSize: '0.9375rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tradeButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  connectPrompt: {
    padding: '3rem 2rem',
    textAlign: 'center' as const,
    background: 'transparent',
    borderRadius: '12px',
  },
  connectText: {
    color: '#6b7280',
    fontSize: '0.9375rem',
    margin: 0,
  },
};

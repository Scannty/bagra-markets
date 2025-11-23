import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { getMarket, type Market } from '../services/kalshi';
import { BALANCE_VAULT_ADDRESS, BALANCE_VAULT_ABI } from '../config/contracts';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { LoadingSpinner } from './LoadingSpinner';

interface Candlestick {
  close_time: string;
  close_price: number;
  open_price: number;
  high_price: number;
  low_price: number;
  volume: number;
}

export function MarketDetail() {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const [market, setMarket] = useState<Market | null>(null);
  const [candlesticks, setCandlesticks] = useState<Candlestick[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'yes' | 'no'>('yes');
  const [amount, setAmount] = useState('');
  const [position, setPosition] = useState<any>(null);
  const [orderStatus, setOrderStatus] = useState<{
    loading: boolean;
    success: boolean;
    error: string | null;
    orderId: string | null;
  }>({
    loading: false,
    success: false,
    error: null,
    orderId: null,
  });

  // Read platform balance
  const { data: vaultBalance } = useReadContract({
    address: BALANCE_VAULT_ADDRESS,
    abi: BALANCE_VAULT_ABI,
    functionName: 'balances',
    args: address ? [address] : undefined,
  });

  useEffect(() => {
    async function fetchData() {
      if (!ticker) return;

      setLoading(true);
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

      // Fetch market data
      const marketData = await getMarket(ticker);

      // Fetch event data to get complete title
      if (marketData && marketData.eventTicker) {
        try {
          const eventResponse = await fetch(`${API_BASE}/events/${marketData.eventTicker}`);
          if (eventResponse.ok) {
            const eventData = await eventResponse.json();
            marketData.title = eventData.event.title || marketData.title;
          }
        } catch (error) {
          console.error('Error fetching event:', error);
        }
      }

      setMarket(marketData);

      // Fetch position data for this market
      try {
        const positionsResponse = await fetch(`${API_BASE}/positions?ticker=${ticker}`);
        if (positionsResponse.ok) {
          const positionsData = await positionsResponse.json();
          if (positionsData.positions && positionsData.positions.length > 0) {
            setPosition(positionsData.positions[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching position:', error);
      }

      // Fetch candlestick data
      try {
        const response = await fetch(`${API_BASE}/markets/${ticker}/candlesticks`);
        if (response.ok) {
          const data = await response.json();
          // Transform candlestick data to match chart expectations
          const transformedData = (data.candlesticks || []).map((candle: any) => ({
            close_time: candle.end_period_ts * 1000, // Convert to milliseconds
            close_price: parseFloat(candle.yes_bid?.close_dollars || '0') * 100,
            open_price: parseFloat(candle.yes_bid?.open_dollars || '0') * 100,
            high_price: parseFloat(candle.yes_bid?.high_dollars || '0') * 100,
            low_price: parseFloat(candle.yes_bid?.low_dollars || '0') * 100,
            volume: candle.volume || 0,
          }));
          setCandlesticks(transformedData);
        }
      } catch (error) {
        console.error('Error fetching candlesticks:', error);
      }

      setLoading(false);
    }

    fetchData();
  }, [ticker]);

  const handleTrade = async () => {
    if (!isConnected) {
      setOrderStatus({
        loading: false,
        success: false,
        error: 'Please connect your wallet',
        orderId: null,
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setOrderStatus({
        loading: false,
        success: false,
        error: 'Please enter a valid amount',
        orderId: null,
      });
      return;
    }

    if (!ticker) return;

    setOrderStatus({ loading: true, success: false, error: null, orderId: null });

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

      const response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticker,
          action: 'buy',
          side: activeTab,
          count: parseInt(amount),
          type: 'market',
          userAddress: address,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Failed to place order');
      }

      const data = await response.json();
      console.log('Order placed:', data.order);

      setOrderStatus({
        loading: false,
        success: true,
        error: null,
        orderId: data.order.order_id,
      });

      setAmount('');

      // Clear success message after 5 seconds
      setTimeout(() => {
        setOrderStatus({ loading: false, success: false, error: null, orderId: null });
      }, 5000);
    } catch (error: any) {
      console.error('Error placing order:', error);
      setOrderStatus({
        loading: false,
        success: false,
        error: error.message,
        orderId: null,
      });
    }
  };

  if (loading) {
    return <LoadingSpinner size="large" />;
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
          <div style={styles.chartContainer}>
            {candlesticks.length > 0 ? (
              <>
                <div style={styles.chartHeader}>
                  <span style={styles.currentPrice}>
                    {(candlesticks[candlesticks.length - 1]?.close_price || 0).toFixed(1)}% chance
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={candlesticks} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <XAxis
                      dataKey="close_time"
                      stroke="#6b7280"
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      tickFormatter={(time) => {
                        const date = new Date(time);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis
                      stroke="#6b7280"
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      domain={(() => {
                        const prices = candlesticks.map(c => c.close_price);
                        const min = Math.min(...prices);
                        const max = Math.max(...prices);
                        const range = max - min;

                        // If range is small, zoom in
                        if (range < 10) {
                          const padding = Math.max(5, range * 0.5);
                          return [Math.max(0, min - padding), Math.min(100, max + padding)];
                        }
                        return [0, 100];
                      })()}
                      tickFormatter={(value) => `${value.toFixed(1)}¢`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#13141a',
                        border: '1px solid #1c1f26',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      labelFormatter={(time) => new Date(time).toLocaleString()}
                      formatter={(value: number) => [`${value.toFixed(1)}¢`, 'Price']}
                    />
                    <Line
                      type="monotone"
                      dataKey="close_price"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
                <p style={styles.chartText}>Loading chart...</p>
              </div>
            )}
          </div>

          <div style={styles.marketInfo}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Volume</span>
              <span style={styles.infoValue}>
                {market.volume >= 1000000
                  ? `$${(market.volume / 1000000).toFixed(1)}M`
                  : `$${(market.volume / 1000).toFixed(0)}K`
                }
              </span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Closes</span>
              <span style={styles.infoValue}>
                {new Date(market.closeTime).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Position Display */}
          {position && (
            <div style={styles.positionCard}>
              <h3 style={styles.positionTitle}>Your Position</h3>
              <div style={styles.positionGrid}>
                <div style={styles.positionItem}>
                  <span style={styles.positionLabel}>Size</span>
                  <span style={styles.positionValue}>{position.position || 0}</span>
                </div>
                <div style={styles.positionItem}>
                  <span style={styles.positionLabel}>Entry Price</span>
                  <span style={styles.positionValue}>
                    {position.position > 0
                      ? ((position.market_exposure || 0) / position.position).toFixed(1) + '¢'
                      : '—'
                    }
                  </span>
                </div>
                <div style={styles.positionItem}>
                  <span style={styles.positionLabel}>Current Price</span>
                  <span style={styles.positionValue}>
                    {(() => {
                      const entryPrice = position.position > 0 ? (position.market_exposure || 0) / position.position : 0;
                      return entryPrice < 50 ? `${market.yesPrice}¢` : `${market.noPrice}¢`;
                    })()}
                  </span>
                </div>
                <div style={styles.positionItem}>
                  <span style={styles.positionLabel}>P&L</span>
                  <span style={{
                    ...styles.positionValue,
                    color: (() => {
                      const entryPrice = position.position > 0 ? (position.market_exposure || 0) / position.position : 0;
                      const currentPrice = entryPrice < 50 ? market.yesPrice : market.noPrice;
                      const currentValue = position.position * currentPrice;
                      const pnl = currentValue - (position.market_exposure || 0);
                      return pnl >= 0 ? '#10b981' : '#ef4444';
                    })()
                  }}>
                    {(() => {
                      const entryPrice = position.position > 0 ? (position.market_exposure || 0) / position.position : 0;
                      const currentPrice = entryPrice < 50 ? market.yesPrice : market.noPrice;
                      const currentValue = position.position * currentPrice;
                      const pnl = currentValue - (position.market_exposure || 0);
                      return `${pnl >= 0 ? '+' : ''}$${(pnl / 100).toFixed(2)}`;
                    })()}
                  </span>
                </div>
              </div>
            </div>
          )}
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
                  disabled={!amount || parseFloat(amount) <= 0 || orderStatus.loading}
                  style={{
                    ...styles.tradeButton,
                    ...(!amount || parseFloat(amount) <= 0 || orderStatus.loading ? styles.tradeButtonDisabled : {})
                  }}
                >
                  {orderStatus.loading ? 'Placing Order...' : 'Place Order'}
                </button>

                {orderStatus.success && (
                  <div style={styles.successMessage}>
                    ✓ Order placed successfully! ID: {orderStatus.orderId}
                  </div>
                )}

                {orderStatus.error && (
                  <div style={styles.errorMessage}>
                    ✕ {orderStatus.error}
                  </div>
                )}
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
    display: 'block',
    textAlign: 'left' as const,
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
    gap: '1rem',
    alignItems: 'stretch',
  },
  leftPanel: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
    height: '100%',
    alignItems: 'stretch',
  },
  header: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
    marginBottom: '1.5rem',
    alignItems: 'center',
    textAlign: 'center' as const,
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
    textAlign: 'center' as const,
  },
  priceSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
    marginTop: '0.25rem',
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
  chartContainer: {
    background: 'rgba(19, 20, 26, 0.5)',
    border: '1px solid #1c1f26',
    borderRadius: '12px',
    padding: '1.5rem',
    textAlign: 'center' as const,
    height: '350px',
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '0.5rem',
  },
  currentPrice: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#3b82f6',
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
    padding: '1.5rem',
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
  successMessage: {
    marginTop: '1rem',
    padding: '0.875rem 1rem',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '10px',
    color: '#10b981',
    fontSize: '0.875rem',
    fontWeight: '600',
    textAlign: 'center' as const,
  },
  errorMessage: {
    marginTop: '1rem',
    padding: '0.875rem 1rem',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '10px',
    color: '#ef4444',
    fontSize: '0.875rem',
    fontWeight: '600',
    textAlign: 'center' as const,
  },
  positionCard: {
    background: 'rgba(59, 130, 246, 0.05)',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    borderRadius: '12px',
    padding: '1.5rem',
  },
  positionTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    margin: '0 0 1rem 0',
  },
  positionGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  positionItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.375rem',
  },
  positionLabel: {
    fontSize: '0.75rem',
    color: '#6b7280',
    fontWeight: '500',
  },
  positionValue: {
    fontSize: '1.125rem',
    color: '#f9fafb',
    fontWeight: '700',
  },
};

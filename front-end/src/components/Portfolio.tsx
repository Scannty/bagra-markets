import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Position {
  ticker: string;
  market_ticker: string;
  event_ticker: string;
  position: number;
  total_traded: number;
  yes_position?: number;
  no_position?: number;
  realized_pnl?: number;
  resting_orders_count?: number;
  market_exposure?: number;
  fees_paid?: number;
  trade_count?: number;
}

interface MarketData {
  ticker: string;
  title: string;
  yes_bid: number;
  no_bid: number;
}

export function Portfolio() {
  const navigate = useNavigate();
  const [positions, setPositions] = useState<Position[]>([]);
  const [marketData, setMarketData] = useState<Map<string, MarketData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

        // Fetch positions
        const positionsResponse = await fetch(`${API_BASE}/positions`);
        if (!positionsResponse.ok) {
          throw new Error('Failed to fetch positions');
        }
        const positionsData = await positionsResponse.json();
        const fetchedPositions = positionsData.positions || [];
        setPositions(fetchedPositions);

        // Fetch market data for each position
        const dataMap = new Map<string, MarketData>();
        await Promise.all(
          fetchedPositions.map(async (position: Position) => {
            try {
              const ticker = position.market_ticker || position.ticker;
              const marketResponse = await fetch(`${API_BASE}/markets/${ticker}`);
              if (marketResponse.ok) {
                const marketInfo = await marketResponse.json();
                dataMap.set(ticker, {
                  ticker: ticker,
                  title: marketInfo.market.title || ticker,
                  yes_bid: marketInfo.market.yes_bid || 0,
                  no_bid: marketInfo.market.no_bid || 0,
                });
              }
            } catch (err) {
              console.error(`Failed to fetch data for ${ticker}:`, err);
            }
          })
        );
        setMarketData(dataMap);
      } catch (err: any) {
        console.error('Failed to fetch portfolio data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return <div style={styles.loading}>Loading positions...</div>;
  }

  if (error) {
    return (
      <div style={styles.error}>
        <p>Error: {error}</p>
        <button onClick={() => window.location.reload()} style={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div style={styles.empty}>
        <h2 style={styles.emptyTitle}>No Positions Yet</h2>
        <p style={styles.emptyText}>You haven't placed any trades yet. Visit the Markets tab to start trading!</p>
        <button onClick={() => navigate('/')} style={styles.browseButton}>
          Browse Markets
        </button>
      </div>
    );
  }

  // Calculate total portfolio PnL
  const totalPnL = positions.reduce((sum, position) => {
    const ticker = position.market_ticker || position.ticker;
    const market = marketData.get(ticker);
    const realizedPnl = position.realized_pnl || 0;

    if (!market) return sum + realizedPnl;

    // Calculate unrealized PnL
    const yesPos = position.yes_position || 0;
    const noPos = position.no_position || 0;
    const marketExposure = position.market_exposure || 0;

    // Current value = (yes_position * yes_bid) + (no_position * no_bid)
    const currentValue = (yesPos * market.yes_bid) + (noPos * market.no_bid);
    const unrealizedPnl = currentValue - marketExposure;

    return sum + realizedPnl + unrealizedPnl;
  }, 0);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Your Positions</h2>
        <div style={styles.totalPnl}>
          <span style={styles.totalPnlLabel}>Total P&L</span>
          <span
            style={{
              ...styles.totalPnlValue,
              color: totalPnL >= 0 ? '#10b981' : '#ef4444'
            }}
          >
            {totalPnL >= 0 ? '+' : ''}${(totalPnL / 100).toFixed(2)}
          </span>
        </div>
      </div>
      <div style={styles.grid}>
        {positions.map((position) => {
          const ticker = position.market_ticker || position.ticker;
          return (
            <PositionCard
              key={position.ticker}
              position={position}
              marketData={marketData.get(ticker)}
              onClick={() => navigate(`/market/${ticker}`)}
            />
          );
        })}
      </div>
    </div>
  );
}

function PositionCard({
  position,
  marketData,
  onClick
}: {
  position: Position;
  marketData?: MarketData;
  onClick: () => void;
}) {
  const yesPos = position.yes_position || 0;
  const noPos = position.no_position || 0;
  const realizedPnl = position.realized_pnl || 0;
  const marketExposure = position.market_exposure || 0;

  // Calculate unrealized PnL
  let unrealizedPnl = 0;
  if (marketData) {
    const currentValue = (yesPos * marketData.yes_bid) + (noPos * marketData.no_bid);
    unrealizedPnl = currentValue - marketExposure;
  }

  const totalPnl = realizedPnl + unrealizedPnl;

  const ticker = position.market_ticker || position.ticker;

  const totalContracts = position.position || 0;

  return (
    <div style={styles.card} onClick={onClick}>
      <div style={styles.cardHeader}>
        <div style={styles.marketInfo}>
          <span style={styles.ticker}>{ticker}</span>
          <h3 style={styles.marketTitle}>
            {marketData?.title || ticker}
          </h3>
          <span style={styles.contractCount}>{totalContracts} contract{totalContracts !== 1 ? 's' : ''}</span>
        </div>
        <span
          style={{
            ...styles.pnlBadge,
            background: totalPnl >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: totalPnl >= 0 ? '#10b981' : '#ef4444'
          }}
        >
          {totalPnl >= 0 ? '+' : ''}${(totalPnl / 100).toFixed(2)}
        </span>
      </div>

      <div style={styles.positions}>
        {yesPos > 0 && (
          <div style={styles.positionItem}>
            <span style={styles.positionLabel}>YES Position</span>
            <span style={{ ...styles.positionValue, color: '#10b981' }}>{yesPos} contracts</span>
          </div>
        )}
        {noPos > 0 && (
          <div style={styles.positionItem}>
            <span style={styles.positionLabel}>NO Position</span>
            <span style={{ ...styles.positionValue, color: '#ef4444' }}>{noPos} contracts</span>
          </div>
        )}
      </div>

      <div style={styles.cardFooter}>
        <div style={styles.stat}>
          <span style={styles.statLabel}>Realized</span>
          <span
            style={{
              ...styles.statValue,
              color: realizedPnl >= 0 ? '#10b981' : '#ef4444'
            }}
          >
            ${(realizedPnl / 100).toFixed(2)}
          </span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statLabel}>Unrealized</span>
          <span
            style={{
              ...styles.statValue,
              color: unrealizedPnl >= 0 ? '#10b981' : '#ef4444'
            }}
          >
            ${(unrealizedPnl / 100).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    margin: '0 auto',
  },
  loading: {
    textAlign: 'center' as const,
    padding: '4rem',
    fontSize: '1rem',
    color: '#6b7280',
  },
  error: {
    textAlign: 'center' as const,
    padding: '4rem',
    fontSize: '1rem',
    color: '#ef4444',
  },
  retryButton: {
    marginTop: '1rem',
    padding: '0.75rem 1.5rem',
    fontSize: '0.9375rem',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  empty: {
    textAlign: 'center' as const,
    padding: '4rem 2rem',
  },
  emptyTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '1rem',
  },
  emptyText: {
    fontSize: '1rem',
    color: '#9ca3af',
    marginBottom: '2rem',
  },
  browseButton: {
    padding: '0.875rem 1.75rem',
    fontSize: '1rem',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '1.5rem',
    margin: 0,
    color: '#fff',
    fontWeight: '700',
  },
  totalPnl: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: '0.25rem',
  },
  totalPnlLabel: {
    fontSize: '0.75rem',
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  totalPnlValue: {
    fontSize: '1.875rem',
    fontWeight: '700',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    background: '#13141a',
    border: '1px solid #1c1f26',
    borderRadius: '16px',
    padding: '1.5rem',
    cursor: 'pointer',
    transition: 'transform 0.2s, border-color 0.2s',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid #1c1f26',
    gap: '0.75rem',
  },
  marketInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
    flex: 1,
  },
  ticker: {
    fontSize: '0.6875rem',
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  marketTitle: {
    fontSize: '0.9375rem',
    fontWeight: '600',
    color: '#fff',
    margin: 0,
    lineHeight: '1.4',
  },
  contractCount: {
    fontSize: '0.8125rem',
    fontWeight: '500',
    color: '#9ca3af',
  },
  pnlBadge: {
    fontSize: '0.875rem',
    fontWeight: '700',
    padding: '0.375rem 0.75rem',
    borderRadius: '8px',
  },
  positions: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  positionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  positionLabel: {
    fontSize: '0.875rem',
    color: '#9ca3af',
    fontWeight: '500',
  },
  positionValue: {
    fontSize: '1rem',
    fontWeight: '700',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: '0.75rem',
    borderTop: '1px solid #1c1f26',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
  },
  statLabel: {
    fontSize: '0.75rem',
    color: '#6b7280',
    fontWeight: '500',
  },
  statValue: {
    fontSize: '0.875rem',
    color: '#f9fafb',
    fontWeight: '700',
  },
};

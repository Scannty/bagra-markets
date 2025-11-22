import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMarkets, type Market } from '../services/kalshi';

export function Markets() {
  const navigate = useNavigate();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMarkets() {
      try {
        setLoading(true);
        setError(null);
        const data = await getMarkets({
          limit: 100,
          status: 'open',
        });
        setMarkets(data);
      } catch (err) {
        console.error('Failed to fetch markets:', err);
        setError('Failed to load markets. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchMarkets();
  }, []);

  if (loading) {
    return <div style={styles.loading}>Loading markets...</div>;
  }

  if (error) {
    return (
      <div style={styles.error}>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={styles.retryButton}
        >
          Retry
        </button>
      </div>
    );
  }

  if (markets.length === 0) {
    return <div style={styles.loading}>No markets available at the moment.</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Prediction Markets</h2>
      <div style={styles.grid}>
        {markets.map((market) => (
          <MarketCard
            key={market.ticker}
            market={market}
            onClick={() => navigate(`/market/${market.ticker}`)}
          />
        ))}
      </div>
    </div>
  );
}

function MarketCard({ market, onClick }: { market: Market; onClick: () => void }) {
  return (
    <div style={styles.card} onClick={onClick}>
      <div style={styles.cardHeader}>
        <span style={styles.ticker}>{market.ticker}</span>
        <span style={styles.volume}>
          ${(market.volume / 1000).toFixed(0)}K vol
        </span>
      </div>

      <h3 style={styles.marketTitle}>{market.title}</h3>

      <div style={styles.prices}>
        <div style={styles.priceBox}>
          <span style={styles.priceLabel}>YES</span>
          <span style={{ ...styles.priceValue, color: '#10b981' }}>
            {market.yesPrice}¢
          </span>
        </div>
        <div style={styles.priceBox}>
          <span style={styles.priceLabel}>NO</span>
          <span style={{ ...styles.priceValue, color: '#ef4444' }}>
            {market.noPrice}¢
          </span>
        </div>
      </div>

      <div style={styles.cardFooter}>
        <span style={styles.closeTime}>
          Closes: {new Date(market.closeTime).toLocaleDateString()}
        </span>
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
    transition: 'transform 0.2s',
  },
  title: {
    fontSize: '1.5rem',
    marginBottom: '1.5rem',
    color: '#fff',
    fontWeight: '600',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1rem',
  },
  card: {
    background: '#13141a',
    padding: '1.25rem',
    borderRadius: '16px',
    border: '1px solid #1c1f26',
    transition: 'border-color 0.2s, transform 0.2s',
    cursor: 'pointer',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  ticker: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  volume: {
    fontSize: '0.75rem',
    color: '#4b5563',
    fontWeight: '500',
  },
  marketTitle: {
    fontSize: '1rem',
    lineHeight: '1.4',
    marginBottom: '1.25rem',
    minHeight: '2.8rem',
    color: '#f9fafb',
    fontWeight: '500',
  },
  prices: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  priceBox: {
    background: '#0d0e12',
    padding: '0.875rem',
    borderRadius: '10px',
    textAlign: 'center' as const,
    border: '1px solid #1c1f26',
  },
  priceLabel: {
    display: 'block',
    fontSize: '0.6875rem',
    color: '#6b7280',
    marginBottom: '0.375rem',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  priceValue: {
    display: 'block',
    fontSize: '1.375rem',
    fontWeight: '700',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '0.75rem',
    borderTop: '1px solid #1c1f26',
  },
  closeTime: {
    fontSize: '0.75rem',
    color: '#6b7280',
    fontWeight: '500',
  },
  tradeButton: {
    padding: '0.5rem 1.125rem',
    fontSize: '0.8125rem',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
};

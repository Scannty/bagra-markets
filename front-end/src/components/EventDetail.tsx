import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Market } from '../services/kalshi';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { LoadingSpinner } from './LoadingSpinner';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export function EventDetail() {
  const { eventTicker } = useParams<{ eventTicker: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [candlesticks, setCandlesticks] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(3);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    async function fetchEvent() {
      if (!eventTicker) return;

      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/events/${eventTicker}`);
        if (response.ok) {
          const data = await response.json();
          setEvent(data.event);

          // Transform and sort markets by YES price (highest first)
          const transformedMarkets = (data.event.markets || [])
            .map((m: any) => ({
              ticker: m.ticker,
              eventTicker: m.event_ticker,
              title: m.title,
              yesPrice: m.yes_bid || 0,
              noPrice: m.no_bid || 0,
              volume: m.volume || 0,
              closeTime: m.close_time,
            }))
            .sort((a: Market, b: Market) => b.yesPrice - a.yesPrice);

          setMarkets(transformedMarkets);

          // Fetch candlestick data for the top 3 markets only
          fetchCandlesticks(transformedMarkets.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to fetch event:', err);
      } finally {
        setLoading(false);
      }
    }

    async function fetchCandlesticks(marketsData: Market[]) {
      try {
        setChartLoading(true);
        // Fetch candlesticks for each market individually
        const candlestickPromises = marketsData.map(async (market) => {
          try {
            const response = await fetch(`${API_BASE}/markets/${market.ticker}/candlesticks`);
            if (response.ok) {
              const data = await response.json();
              return {
                ticker: market.ticker,
                candlesticks: data.candlesticks || [],
              };
            }
          } catch (err) {
            console.error(`Failed to fetch candlesticks for ${market.ticker}:`, err);
          }
          return { ticker: market.ticker, candlesticks: [] };
        });

        const results = await Promise.all(candlestickPromises);

        // Merge candlestick data by timestamp
        const merged = new Map<number, any>();

        results.forEach(({ ticker, candlesticks }) => {
          candlesticks.forEach((candle: any) => {
            const timestamp = candle.end_period_ts * 1000;
            if (!merged.has(timestamp)) {
              merged.set(timestamp, { close_time: timestamp });
            }
            const price = parseFloat(candle.yes_bid?.close_dollars || '0') * 100;
            merged.get(timestamp)![ticker] = price;
          });
        });

        const mergedArray = Array.from(merged.values()).sort((a, b) => a.close_time - b.close_time);
        setCandlesticks(mergedArray);
      } catch (err) {
        console.error('Failed to fetch candlesticks:', err);
      } finally {
        setChartLoading(false);
      }
    }

    fetchEvent();
  }, [eventTicker]);

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  if (!event || markets.length === 0) {
    return <div style={styles.loading}>No markets found for this event.</div>;
  }

  const eventTitle = event.title || eventTicker;

  const visibleMarkets = markets.slice(0, visibleCount);
  const hasMore = visibleCount < markets.length;

  // Calculate dynamic Y-axis domain (only for top 3 markets)
  const allPrices: number[] = [];
  candlesticks.forEach(candle => {
    markets.slice(0, 3).forEach(market => {
      if (candle[market.ticker] !== undefined) {
        allPrices.push(candle[market.ticker]);
      }
    });
  });
  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
  const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 100;
  const range = maxPrice - minPrice;
  const yAxisDomain = range < 10
    ? [Math.max(0, minPrice - Math.max(5, range * 0.5)), Math.min(100, maxPrice + Math.max(5, range * 0.5))]
    : [0, 100];

  return (
    <div style={styles.container}>
      <button onClick={() => navigate('/')} style={styles.backButton}>
        ← Back to Markets
      </button>

      <div style={styles.header}>
        <h1 style={styles.title}>{eventTitle}</h1>
        <p style={styles.subtitle}>{markets.length} markets</p>
      </div>

      {/* Chart */}
      {chartLoading ? (
        <div style={styles.chartContainer}>
          <LoadingSpinner size="medium" />
        </div>
      ) : candlesticks.length > 0 && markets.length > 0 ? (
        <div style={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={candlesticks} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                domain={yAxisDomain}
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
                formatter={(value: number, name: string) => {
                  const market = markets.find(m => m.ticker === name);
                  return [`${value.toFixed(1)}¢`, market?.title || name];
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                formatter={(value) => {
                  const market = markets.find(m => m.ticker === value);
                  return market?.title.slice(0, 50) || value;
                }}
              />
              {markets.slice(0, 3).map((market, index) => (
                <Line
                  key={market.ticker}
                  type="monotone"
                  dataKey={market.ticker}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      <div style={styles.marketsList}>
        {visibleMarkets.map((market) => (
          <div
            key={market.ticker}
            style={styles.marketCard}
            onClick={() => navigate(`/market/${market.ticker}`)}
          >
            <div style={styles.marketHeader}>
              <h3 style={styles.marketTitle}>{market.title}</h3>
              <div style={styles.priceBox}>
                <span style={styles.priceLabel}>YES</span>
                <span style={styles.priceValue}>
                  {market.yesPrice}¢
                </span>
              </div>
            </div>
            <div style={styles.marketFooter}>
              <span style={styles.volume}>
                {market.volume >= 1000000
                  ? `$${(market.volume / 1000000).toFixed(1)}M vol`
                  : `$${(market.volume / 1000).toFixed(0)}K vol`
                }
              </span>
              <span style={styles.closeTime}>
                Closes: {new Date(market.closeTime).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div style={styles.showMoreContainer}>
          <button
            style={styles.showMoreButton}
            onClick={() => setVisibleCount(prev => prev + 10)}
          >
            Show More ({markets.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1000px',
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
  header: {
    textAlign: 'center' as const,
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#fff',
    margin: 0,
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#6b7280',
    margin: 0,
  },
  chartContainer: {
    background: 'rgba(19, 20, 26, 0.5)',
    border: '1px solid #1c1f26',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '2rem',
  },
  marketsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  marketCard: {
    background: '#13141a',
    padding: '1.5rem',
    borderRadius: '12px',
    border: '1px solid #1c1f26',
    cursor: 'pointer',
    transition: 'border-color 0.2s, transform 0.2s',
  },
  marketHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem',
  },
  marketTitle: {
    fontSize: '1rem',
    fontWeight: '500',
    color: '#f9fafb',
    margin: 0,
    flex: 1,
  },
  priceBox: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.5rem 1rem',
    background: '#0d0e12',
    borderRadius: '8px',
    minWidth: '80px',
  },
  priceLabel: {
    fontSize: '0.6875rem',
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
  },
  priceValue: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#10b981',
  },
  marketFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '0.75rem',
    borderTop: '1px solid #1c1f26',
  },
  volume: {
    fontSize: '0.75rem',
    color: '#6b7280',
    fontWeight: '500',
  },
  closeTime: {
    fontSize: '0.75rem',
    color: '#6b7280',
    fontWeight: '500',
  },
  showMoreContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '2rem',
  },
  showMoreButton: {
    padding: '0.75rem 2rem',
    fontSize: '0.9375rem',
    fontWeight: '600',
    background: 'rgba(59, 130, 246, 0.1)',
    color: '#3b82f6',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface Market {
  ticker: string;
  title: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  closeTime: string;
}

export async function getMarkets(params?: {
  limit?: number;
  cursor?: string;
  event_ticker?: string;
  series_ticker?: string;
  max_close_ts?: number;
  min_close_ts?: number;
  status?: string;
  tickers?: string;
}): Promise<Market[]> {
  try {
    const queryParams = new URLSearchParams();

    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    if (params?.event_ticker) queryParams.append('event_ticker', params.event_ticker);
    if (params?.series_ticker) queryParams.append('series_ticker', params.series_ticker);
    if (params?.max_close_ts) queryParams.append('max_close_ts', params.max_close_ts.toString());
    if (params?.min_close_ts) queryParams.append('min_close_ts', params.min_close_ts.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.tickers) queryParams.append('tickers', params.tickers);

    const url = `${API_BASE}/markets?${queryParams.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const markets = data.markets || [];

    return markets.map((market: any) => ({
      ticker: market.ticker || '',
      title: market.title || '',
      yesPrice: market.yes_bid || 0,
      noPrice: market.no_bid || 0,
      volume: market.volume || 0,
      closeTime: market.close_time || '',
    }));
  } catch (error) {
    console.error('Error fetching markets:', error);
    return [];
  }
}

export async function getMarket(ticker: string): Promise<Market | null> {
  try {
    const url = `${API_BASE}/markets/${ticker}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const market = data.market;

    if (!market) return null;

    return {
      ticker: market.ticker || '',
      title: market.title || '',
      yesPrice: market.yes_bid || 0,
      noPrice: market.no_bid || 0,
      volume: market.volume || 0,
      closeTime: market.close_time || '',
    };
  } catch (error) {
    console.error('Error fetching market:', error);
    return null;
  }
}

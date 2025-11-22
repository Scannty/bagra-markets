import express from 'express';
import cors from 'cors';
import { KalshiService } from './kalshi-service';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

let kalshiService: KalshiService;

export function initializeApiServer(service: KalshiService) {
  kalshiService = service;

  // Get markets endpoint
  app.get('/api/markets', async (req, res) => {
    try {
      const {
        limit,
        cursor,
        event_ticker,
        series_ticker,
        max_close_ts,
        min_close_ts,
        status,
        tickers,
      } = req.query;

      const markets = await kalshiService.getMarkets({
        limit: limit ? Number(limit) : undefined,
        cursor: cursor as string,
        eventTicker: event_ticker as string,
        seriesTicker: series_ticker as string,
        maxCloseTs: max_close_ts ? Number(max_close_ts) : undefined,
        minCloseTs: min_close_ts ? Number(min_close_ts) : undefined,
        status: status as string,
        tickers: tickers as string,
      });

      // Sort markets by volume (highest first)
      const sortedMarkets = (markets || []).sort((a: any, b: any) => {
        return (b.volume || 0) - (a.volume || 0);
      });

      res.json({ markets: sortedMarkets });
    } catch (error) {
      console.error('Error fetching markets:', error);
      res.status(500).json({ error: 'Failed to fetch markets' });
    }
  });

  // Get single market endpoint
  app.get('/api/markets/:ticker', async (req, res) => {
    try {
      const { ticker } = req.params;
      const market = await kalshiService.getMarket(ticker);

      if (!market) {
        return res.status(404).json({ error: 'Market not found' });
      }

      res.json({ market });
    } catch (error) {
      console.error('Error fetching market:', error);
      res.status(500).json({ error: 'Failed to fetch market' });
    }
  });

  // Get market candlesticks for charting
  app.get('/api/markets/:ticker/candlesticks', async (req, res) => {
    try {
      const { ticker } = req.params;
      const { start_ts, end_ts, period_interval } = req.query;

      // Set defaults: last 7 days, hourly candles
      const now = Math.floor(Date.now() / 1000);
      const sevenDaysAgo = now - (7 * 24 * 60 * 60);

      const startTs = start_ts ? Number(start_ts) : sevenDaysAgo;
      const endTs = end_ts ? Number(end_ts) : now;
      const periodInterval = period_interval ? Number(period_interval) : 60; // 1 hour

      console.log('Fetching candlesticks for ticker:', ticker);
      console.log('Query params:', { startTs, endTs, periodInterval });

      const candlesticks = await kalshiService.getCandlesticks(ticker, {
        startTs,
        endTs,
        periodInterval,
      });

      res.json({ candlesticks });
    } catch (error: any) {
      console.error('Error fetching candlesticks:', error);
      console.error('Error response:', error.response?.data);
      res.status(500).json({ error: 'Failed to fetch candlesticks' });
    }
  });

  // Create order endpoint
  app.post('/api/orders', async (req, res) => {
    try {
      const {
        ticker,
        action,
        side,
        count,
        type,
        yesPrice,
        noPrice,
        expirationTs,
        sellPositionFloor,
        buyMaxCost,
      } = req.body;

      // Validate required fields
      if (!ticker || !action || !side || !count || !type) {
        return res.status(400).json({
          error: 'Missing required fields: ticker, action, side, count, type'
        });
      }

      // For market orders, set a high price to ensure fill
      // For yes side, use yes_price=99, for no side use no_price=99
      let finalYesPrice = yesPrice ? Number(yesPrice) : undefined;
      let finalNoPrice = noPrice ? Number(noPrice) : undefined;

      if (type === 'market') {
        if (side === 'yes') {
          finalYesPrice = 99; // Buy yes at up to 99 cents
        } else {
          finalNoPrice = 99; // Buy no at up to 99 cents
        }
      }

      const order = await kalshiService.createOrder({
        ticker,
        action,
        side,
        count: Number(count),
        type,
        yesPrice: finalYesPrice,
        noPrice: finalNoPrice,
        expirationTs: expirationTs ? Number(expirationTs) : undefined,
        sellPositionFloor: sellPositionFloor ? Number(sellPositionFloor) : undefined,
        buyMaxCost: buyMaxCost ? Number(buyMaxCost) : undefined,
      });

      res.json({ order });
    } catch (error: any) {
      console.error('Error creating order:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      res.status(error.response?.status || 500).json({
        error: 'Failed to create order',
        details: error.response?.data?.error || error.message,
        kalshiError: error.response?.data
      });
    }
  });

  // Get positions endpoint
  app.get('/api/positions', async (req, res) => {
    try {
      const { ticker, event_ticker, limit, cursor } = req.query;

      const positions = await kalshiService.getPositions({
        ticker: ticker as string,
        eventTicker: event_ticker as string,
        limit: limit ? Number(limit) : undefined,
        cursor: cursor as string,
      });

      // Filter to only include positions with contracts > 0
      const activePositions = positions.filter((pos: any) => (pos.position || 0) > 0);

      res.json({ positions: activePositions });
    } catch (error: any) {
      console.error('Error fetching positions:', error);
      res.status(500).json({
        error: 'Failed to fetch positions',
        details: error.message
      });
    }
  });

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
  });
}

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

      res.json({ markets });
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

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
  });
}

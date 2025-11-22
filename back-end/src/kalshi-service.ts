import { PortfolioApi, MarketsApi, Configuration } from 'kalshi-typescript';

interface KalshiConfig {
  apiKey: string;
  privateKeyPath?: string;
  privateKeyPem?: string;
  baseUrl?: string;
}

export class KalshiService {
  private portfolioApi: PortfolioApi;
  private marketsApi: MarketsApi;
  private config: Configuration;

  constructor(kalshiConfig: KalshiConfig) {
    this.config = new Configuration({
      apiKey: kalshiConfig.apiKey,
      privateKeyPath: kalshiConfig.privateKeyPath,
      privateKeyPem: kalshiConfig.privateKeyPem,
      basePath: kalshiConfig.baseUrl || 'https://api.elections.kalshi.com/trade-api/v2'
    });

    this.portfolioApi = new PortfolioApi(this.config);
    this.marketsApi = new MarketsApi(this.config);
  }

  /**
   * Get account balance
   * @returns Balance in cents
   */
  async getBalance(): Promise<number | undefined> {
    const { data } = await this.portfolioApi.getBalance();
    return data.balance;
  }

  /**
   * Get user positions
   */
  async getPositions(params?: {
    ticker?: string;
    eventTicker?: string;
    countDown?: number;
    countUp?: number;
    limit?: number;
    cursor?: string;
  }) {
    const { data } = await this.portfolioApi.getPositions(
      params?.ticker,
      params?.eventTicker,
      params?.countDown,
      params?.countUp,
      params?.limit,
      params?.cursor
    );
    return data.market_positions || [];
  }

  /**
   * Create an order
   */
  async createOrder(params: {
    ticker: string;
    action: 'buy' | 'sell';
    side: 'yes' | 'no';
    count: number;
    type: 'market' | 'limit';
    yesPrice?: number;
    noPrice?: number;
    expirationTs?: number;
    sellPositionFloor?: number;
    buyMaxCost?: number;
  }) {
    const { data } = await this.portfolioApi.createOrder({
      ticker: params.ticker,
      action: params.action,
      side: params.side,
      count: params.count,
      type: params.type,
      yes_price: params.yesPrice,
      no_price: params.noPrice,
      expiration_ts: params.expirationTs,
      sell_position_floor: params.sellPositionFloor,
      buy_max_cost: params.buyMaxCost,
    });
    return data.order;
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string) {
    const { data } = await this.portfolioApi.cancelOrder(orderId);
    return data.order;
  }

  /**
   * Get user's orders
   */
  async getOrders(params?: {
    ticker?: string;
    eventTicker?: string;
    minTs?: number;
    maxTs?: number;
    status?: string;
    limit?: number;
    cursor?: string;
  }) {
    const { data } = await this.portfolioApi.getOrders(
      params?.ticker,
      params?.eventTicker,
      params?.minTs,
      params?.maxTs,
      params?.status,
      params?.limit,
      params?.cursor
    );
    return data.orders;
  }

  /**
   * Get fills (executed trades)
   */
  async getFills(params?: {
    ticker?: string;
    orderId?: string;
    minTs?: number;
    maxTs?: number;
    limit?: number;
    cursor?: string;
  }) {
    const { data } = await this.portfolioApi.getFills(
      params?.ticker,
      params?.orderId,
      params?.minTs,
      params?.maxTs,
      params?.limit,
      params?.cursor
    );
    return data.fills;
  }

  /**
   * Get markets
   */
  async getMarkets(params?: {
    limit?: number;
    cursor?: string;
    eventTicker?: string;
    seriesTicker?: string;
    maxCloseTs?: number;
    minCloseTs?: number;
    status?: string;
    tickers?: string;
  }) {
    const { data } = await this.marketsApi.getMarkets(
      params?.limit,
      params?.cursor,
      params?.eventTicker,
      params?.seriesTicker,
      params?.maxCloseTs,
      params?.minCloseTs,
      params?.status,
      params?.tickers
    );
    return data.markets;
  }

  /**
   * Get market by ticker
   */
  async getMarket(ticker: string) {
    const { data } = await this.marketsApi.getMarket(ticker);
    return data.market;
  }

  /**
   * Get market orderbook
   */
  async getMarketOrderbook(ticker: string, depth?: number) {
    const { data } = await this.marketsApi.getMarketOrderbook(ticker, depth);
    return data.orderbook;
  }

  /**
   * Get market candlesticks for charting
   */
  async getCandlesticks(marketTicker: string, params: {
    eventTicker?: string;
    startTs: number;
    endTs: number;
    periodInterval: number;
  }) {
    // First get the market to find its event_ticker
    const market = await this.getMarket(marketTicker);
    if (!market) {
      throw new Error(`Market ${marketTicker} not found`);
    }

    const eventTicker = params?.eventTicker || market.event_ticker;
    if (!eventTicker) {
      throw new Error(`Event ticker not found for market ${marketTicker}`);
    }

    console.log('KalshiService.getCandlesticks called with:', {
      eventTicker,
      marketTicker,
      startTs: params.startTs,
      endTs: params.endTs,
      periodInterval: params.periodInterval
    });

    const { data } = await this.marketsApi.getMarketCandlesticks(
      eventTicker,
      marketTicker,
      params.startTs as any,
      params.endTs as any,
      params.periodInterval as any
    );
    return data.candlesticks;
  }
}

# BAGRA - Tokenized Prediction Market Positions with DeFi Lending

BAGRA brings Kalshi's prediction markets on-chain by tokenizing market positions and enabling DeFi lending on top of them. Users can trade on real-world events (elections, sports, crypto, world events) while unlocking liquidity through blockchain-based lending markets.

## Overview

The platform tokenizes prediction market positions as on-chain assets tracked through smart contracts. This tokenization enables a DeFi lending layer where users can supply their market positions as collateral or borrow against them, creating liquidity and leverage opportunities that don't exist in traditional prediction markets.

## Features

-   **Tokenized Positions**: Prediction market positions are represented as ERC20 tokens on-chain, making them programmable, transferable, and composable with DeFi protocols
-   **Lending Markets**: Supply prediction market positions to earn yield, or borrow positions to gain leveraged exposure without liquidating existing holdings
-   **Trading Interface**: Browse hundreds of markets with real-time pricing, historical charts, and event grouping
-   **Portfolio Management**: Track all tokenized positions, lending activity, and performance metrics in one unified dashboard
-   **USDC Deposits**: Deposit USDC to fund positions, with balances tracked on-chain through BalanceVault

## Architecture

### Position Tokenization Layer

When users open a position on Kalshi through the platform, the system mints corresponding ERC20 tokens representing that position. Each prediction market has its own token contract - if you buy 100 YES contracts on a market, you receive 100 ERC20 tokens tracked on-chain.

### API Integration

The backend acts as an oracle between blockchain and Kalshi. It monitors deposit events, creates positions via Kalshi's API, then triggers token minting. The system uses a hybrid v1/v2 API approach: v2 for real-time trading data and order execution, v1 for event metadata and images.

### Lending Protocol

Inspired by Morpho's architecture, the lending contract creates isolated pools per market. Users supply tokenized positions as collateral to earn yield, or borrow against holdings for leveraged exposure. The system implements utilization-based interest rates, automated liquidations when collateral drops below thresholds, and peer-to-pool liquidity matching.

### Smart Contract Structure

-   **BalanceVault**: Tracks user USDC balances on Kalshi (available and locked)
-   **Market ERC20 Tokens**: Each prediction market position is represented as an ERC20 token with standard transfer/approval functionality
-   **Lending Contract**: Manages collateral ratios, interest accrual, and liquidation logic for tokenized positions
-   All contracts interact through a central registry maintaining market-to-token mappings

### Data Flow

1. User deposits USDC → Backend creates Kalshi position → Smart contract mints ERC20 tokens
2. User supplies to lending pool or borrows against collateral
3. Position settlements flow reverse: Kalshi resolves → Backend triggers redemption → Tokens burned → USDC distributed

## Tech Stack

-   **Frontend**: React, TypeScript, Vite, wagmi, viem, Recharts
-   **Backend**: Express.js, Kalshi TypeScript SDK, axios
-   **Blockchain**: Arbitrum, Hardhat, Solidity, OpenZeppelin
-   **APIs**: Kalshi v1 & v2 REST APIs

## Project Structure

```
bagra-markets/
├── bagra-contracts/    # Solidity contracts (Hardhat)
│   ├── contracts/
│   │   └── BalanceVault.sol
│   └── scripts/
│       └── deploy.ts
├── back-end/          # TypeScript API server
│   └── src/
│       ├── api-server.ts        # Express REST API
│       ├── kalshi-service.ts    # Kalshi API integration
│       └── chain-indexer.ts     # Blockchain indexer
└── front-end/         # React application
    └── src/
        ├── components/          # React components
        ├── services/           # API services
        └── config/             # Contract configs
```

## Getting Started

### Prerequisites

-   Node.js v18+
-   npm or yarn
-   MetaMask or compatible Web3 wallet
-   Arbitrum testnet/mainnet ETH for gas

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/bagra-markets.git
cd bagra-markets
```

2. Install dependencies:

```bash
# Install backend dependencies
cd back-end
npm install

# Install frontend dependencies
cd ../front-end
npm install
```

3. Configure environment variables:

**Backend** (`back-end/.env`):

```
KALSHI_API_KEY=your_kalshi_api_key
KALSHI_PRIVATE_KEY_PATH=path_to_private_key.pem
RPC_URL=https://arb1.arbitrum.io/rpc
USDC_ADDRESS=0xaf88d065e77c8cC2239327C5EDb3A432268e5831
KALSHI_DEPOSIT_ADDRESS=0xac266f88d6889e98209eba3cbc3ac42a425637d1
BALANCE_VAULT_ADDRESS=<deployed_contract_address>
OWNER_PRIVATE_KEY=<backend_wallet_private_key>
PORT=3001
```

**Frontend** (`front-end/.env`):

```
VITE_API_URL=http://localhost:3001/api
```

4. Deploy smart contracts:

```bash
cd bagra-contracts
npx hardhat compile
npx hardhat run scripts/deploy.ts --network arbitrum
```

5. Start the development servers:

**Backend**:

```bash
cd back-end
npm run dev
```

**Frontend**:

```bash
cd front-end
npm run dev
```

The app will be available at `http://localhost:5173`

## Deployed Contracts

### Zircuit Mainnet

-   **YES Share Token**: `0x9aDFc08C17e95D8F0BD8BC34fdF6f811A45DD79f`
-   **NO Share Token**: `0xC9fCa476132D4DbAEB18EA165D3Cb8Fc673a138a`
-   **Lending Contract**: `0x77228687f63AAfDb8A0ccB20be14fa632AB6f107`

### Chiliz Mainnet

-   **YES Share Token**: `0xfC29748F36CE5954C2F120d59cCeFD1d75732d99`
-   **NO Share Token**: `0x82E645cb71a590188484d7a1621AB10d1BC5B120`

## Smart Contracts

### BalanceVault.sol

Tracks user USDC balances on Kalshi (NOT position tokens). This contract only manages the USDC accounting layer.

**Owner Functions (Backend Only):**

-   `creditDeposit(address user, uint256 amount)` - Credit user after confirming deposit
-   `processWithdrawal(address user, uint256 amount)` - Update balance after withdrawal
-   `lockBalance(address user, uint256 amount)` - Lock balance when opening Kalshi position
-   `unlockBalance(address user, uint256 amount)` - Unlock balance when closing position

**View Functions:**

-   `balances(address user)` - Get available USDC balance
-   `lockedBalances(address user)` - Get locked USDC balance (in active positions)
-   `getTotalBalance(address user)` - Get total USDC balance (available + locked)

### Market Token Contracts (ERC20)

Each prediction market has its own ERC20 token contract deployed when the first position is opened. These tokens ARE the positions - when you buy 100 YES contracts, you receive 100 ERC20 tokens representing that position. These tokens can be transferred, traded, or used as collateral in the lending protocol.

### Lending Contract

Manages supply/borrow operations with isolated pools per market, utilization-based interest rates, and automated liquidations.

## API Endpoints

### Markets

-   `GET /api/markets` - Fetch all markets with filters
-   `GET /api/markets/:ticker` - Get single market details
-   `GET /api/markets/batch?tickers=X,Y,Z` - Batch fetch markets with images
-   `GET /api/markets/:ticker/candlesticks` - Get historical price data

### Events

-   `GET /api/events/:eventTicker` - Get event details with nested markets
-   `GET /api/events/batch?tickers=X,Y,Z` - Batch fetch events
-   `GET /api/events/:eventTicker/candlesticks` - Get event-level candlestick data

### Trading

-   `POST /api/orders` - Create new order (buy/sell YES/NO)
-   `GET /api/positions` - Get user's active positions

### Health

-   `GET /health` - API health check

## Kalshi Integration

Users deposit USDC directly to Kalshi's Arbitrum address:

```
0xac266f88d6889e98209eba3cbc3ac42a425637d1
```

The backend:

1. Monitors all USDC transfers to this address via chain indexer
2. Credits the sender's on-chain balance through BalanceVault
3. Uses Kalshi API to place trades and manage positions
4. Mints ERC20 tokens representing market positions

## License

MIT

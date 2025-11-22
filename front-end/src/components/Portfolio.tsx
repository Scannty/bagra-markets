import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "./LoadingSpinner";

interface Position {
    ticker: string;
    market_ticker?: string;
    event_ticker?: string;
    position: number;
    total_traded: number;
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
                const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

                // Fetch positions
                const positionsResponse = await fetch(`${API_BASE}/positions`);
                if (!positionsResponse.ok) {
                    throw new Error("Failed to fetch positions");
                }
                const positionsData = await positionsResponse.json();
                const fetchedPositions = positionsData.positions || [];
                console.log("FETCHED POSITIONS: ", fetchedPositions);
                setPositions(fetchedPositions);

                // Fetch market data for each position
                const dataMap = new Map<string, MarketData>();
                await Promise.all(
                    fetchedPositions.map(async (position: Position) => {
                        try {
                            const ticker = position.ticker;
                            const marketResponse = await fetch(`${API_BASE}/markets/${ticker}`);
                            if (marketResponse.ok) {
                                const marketInfo = await marketResponse.json();
                                const eventTicker = marketInfo.market.event_ticker;

                                // Fetch event data to get the proper title
                                let title = marketInfo.market.title || ticker;
                                if (eventTicker) {
                                    try {
                                        const eventResponse = await fetch(`${API_BASE}/events/${eventTicker}`);
                                        if (eventResponse.ok) {
                                            const eventData = await eventResponse.json();
                                            title = eventData.event.title || title;
                                        }
                                    } catch (err) {
                                        console.error(`Failed to fetch event ${eventTicker}:`, err);
                                    }
                                }

                                dataMap.set(ticker, {
                                    ticker: ticker,
                                    title: title,
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
                console.error("Failed to fetch portfolio data:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    if (loading) {
        return <LoadingSpinner size="large" />;
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
                <p style={styles.emptyText}>
                    You haven't placed any trades yet. Visit the Markets tab to start trading!
                </p>
                <button onClick={() => navigate("/")} style={styles.browseButton}>
                    Browse Markets
                </button>
            </div>
        );
    }

    // Calculate total portfolio PnL by summing up individual position PnLs
    const totalPnL = positions.reduce((sum, position) => {
        const ticker = position.ticker;
        const market = marketData.get(ticker);
        const positionValue = position.position || 0;
        const totalContracts = Math.abs(positionValue);
        const isYesPosition = positionValue > 0;
        const marketExposure = position.market_exposure || 0;
        const realizedPnl = position.realized_pnl || 0;

        let currentValue = 0;
        if (market && totalContracts > 0) {
            if (isYesPosition) {
                currentValue = totalContracts * market.yes_bid;
            } else {
                currentValue = totalContracts * market.no_bid;
            }
        }

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
                            color: totalPnL >= 0 ? "#10b981" : "#ef4444",
                        }}
                    >
                        {totalPnL >= 0 ? "+" : ""}${(totalPnL / 100).toFixed(2)}
                    </span>
                </div>
            </div>

            {/* Table */}
            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.tableHeaderRow}>
                            <th style={{ ...styles.tableHeader, textAlign: "left" }}>Market</th>
                            <th style={styles.tableHeader}>Side</th>
                            <th style={styles.tableHeader}>Size</th>
                            <th style={styles.tableHeader}>Entry Price</th>
                            <th style={styles.tableHeader}>Current Price</th>
                            <th style={styles.tableHeader}>P&L</th>
                        </tr>
                    </thead>
                    <tbody>
                        {positions.map((position) => {
                            const ticker = position.ticker;
                            const market = marketData.get(ticker);
                            const positionValue = position.position || 0;
                            const totalContracts = Math.abs(positionValue);
                            const isYesPosition = positionValue > 0;
                            const marketExposure = position.market_exposure || 0;
                            const realizedPnl = position.realized_pnl || 0;

                            // Calculate entry price (average cost per contract)
                            const entryPrice = totalContracts > 0 ? marketExposure / totalContracts : 0;

                            // Determine current price based on position type
                            // Positive position = YES, Negative position = NO
                            let currentPrice = 0;
                            let currentValue = 0;

                            if (market && totalContracts > 0) {
                                if (isYesPosition) {
                                    // YES position
                                    currentPrice = market.yes_bid;
                                    currentValue = totalContracts * market.yes_bid;
                                } else {
                                    // NO position
                                    currentPrice = market.no_bid;
                                    currentValue = totalContracts * market.no_bid;
                                }
                            }

                            // Calculate PnL
                            // Unrealized PnL = Current Value - Market Exposure
                            const unrealizedPnl = currentValue - marketExposure;
                            const totalPnl = realizedPnl + unrealizedPnl;

                            return (
                                <tr
                                    key={position.ticker}
                                    style={styles.tableRow}
                                    onClick={() => navigate(`/market/${ticker}`)}
                                >
                                    <td style={{ ...styles.tableCell, textAlign: "left" }}>
                                        <div style={styles.marketCell}>
                                            <span style={styles.tableTicker}>{ticker}</span>
                                            <span style={styles.tableMarketTitle}>{market?.title || ticker}</span>
                                        </div>
                                    </td>
                                    <td style={styles.tableCell}>
                                        <span
                                            style={{
                                                ...styles.sideCell,
                                                color: isYesPosition ? "#10b981" : "#ef4444",
                                            }}
                                        >
                                            {isYesPosition ? "YES" : "NO"}
                                        </span>
                                    </td>
                                    <td style={styles.tableCell}>
                                        <span style={styles.sizeCell}>{totalContracts}</span>
                                    </td>
                                    <td style={styles.tableCell}>
                                        <span style={styles.priceCell}>{entryPrice.toFixed(1)}¢</span>
                                    </td>
                                    <td style={styles.tableCell}>
                                        <span style={styles.priceCell}>{currentPrice.toFixed(1)}¢</span>
                                    </td>
                                    <td style={styles.tableCell}>
                                        <span
                                            style={{
                                                ...styles.pnlCell,
                                                color: totalPnl >= 0 ? "#10b981" : "#ef4444",
                                            }}
                                        >
                                            {totalPnl >= 0 ? "+" : ""}${(totalPnl / 100).toFixed(2)}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const styles = {
    container: {
        margin: "0 auto",
    },
    loading: {
        textAlign: "center" as const,
        padding: "4rem",
        fontSize: "1rem",
        color: "#6b7280",
    },
    error: {
        textAlign: "center" as const,
        padding: "4rem",
        fontSize: "1rem",
        color: "#ef4444",
    },
    retryButton: {
        marginTop: "1rem",
        padding: "0.75rem 1.5rem",
        fontSize: "0.9375rem",
        fontWeight: "600",
        background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
        color: "#fff",
        border: "none",
        borderRadius: "10px",
        cursor: "pointer",
    },
    empty: {
        textAlign: "center" as const,
        padding: "4rem 2rem",
    },
    emptyTitle: {
        fontSize: "1.5rem",
        fontWeight: "700",
        color: "#fff",
        marginBottom: "1rem",
    },
    emptyText: {
        fontSize: "1rem",
        color: "#9ca3af",
        marginBottom: "2rem",
    },
    browseButton: {
        padding: "0.875rem 1.75rem",
        fontSize: "1rem",
        fontWeight: "600",
        background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
        color: "#fff",
        border: "none",
        borderRadius: "10px",
        cursor: "pointer",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1.5rem",
    },
    title: {
        fontSize: "1.5rem",
        margin: 0,
        color: "#fff",
        fontWeight: "700",
    },
    totalPnl: {
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "flex-end",
        gap: "0.25rem",
    },
    totalPnlLabel: {
        fontSize: "0.75rem",
        color: "#6b7280",
        fontWeight: "600",
        textTransform: "uppercase" as const,
        letterSpacing: "0.05em",
    },
    totalPnlValue: {
        fontSize: "1.875rem",
        fontWeight: "700",
    },
    tableContainer: {
        background: "#13141a",
        border: "1px solid #1c1f26",
        borderRadius: "12px",
        overflow: "hidden",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse" as const,
    },
    tableHeaderRow: {
        background: "#0d0e12",
        borderBottom: "1px solid #1c1f26",
    },
    tableHeader: {
        padding: "1rem 1.5rem",
        fontSize: "0.75rem",
        fontWeight: "600",
        color: "#6b7280",
        textTransform: "uppercase" as const,
        letterSpacing: "0.05em",
        textAlign: "center" as const,
    },
    tableRow: {
        borderBottom: "1px solid #1c1f26",
        cursor: "pointer",
        transition: "background 0.2s",
    },
    tableCell: {
        padding: "1.25rem 1.5rem",
        fontSize: "0.9375rem",
        color: "#f9fafb",
        textAlign: "center" as const,
    },
    marketCell: {
        display: "flex",
        flexDirection: "column" as const,
        gap: "0.375rem",
    },
    tableTicker: {
        fontSize: "0.6875rem",
        fontWeight: "700",
        color: "#6b7280",
        textTransform: "uppercase" as const,
        letterSpacing: "0.05em",
    },
    tableMarketTitle: {
        fontSize: "0.9375rem",
        fontWeight: "500",
        color: "#f9fafb",
        lineHeight: "1.4",
    },
    sideCell: {
        fontSize: "0.875rem",
        fontWeight: "700",
    },
    sizeCell: {
        fontSize: "1rem",
        fontWeight: "600",
        color: "#f9fafb",
    },
    priceCell: {
        fontSize: "0.9375rem",
        fontWeight: "500",
        color: "#9ca3af",
    },
    pnlCell: {
        fontSize: "1rem",
        fontWeight: "700",
    },
};

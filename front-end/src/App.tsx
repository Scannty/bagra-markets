import { useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import "./App.css";
import { WalletConnect } from "./components/WalletConnect";
import { DepositModal } from "./components/Deposit";
import { Markets } from "./components/Markets";
import { MarketDetail } from "./components/MarketDetail";
import { EventDetail } from "./components/EventDetail";
import { Portfolio } from "./components/Portfolio";
import { Lending } from "./components/Lending";

type Tab = "markets" | "lending" | "portfolio";

function App() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

    // Determine active tab from URL
    const getActiveTab = (): Tab => {
        if (location.pathname.startsWith("/portfolio")) return "portfolio";
        if (location.pathname.startsWith("/lending")) return "lending";
        return "markets";
    };

    const [activeTab, setActiveTab] = useState<Tab>(getActiveTab());

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);
        if (tab === "markets") navigate("/");
        else if (tab === "lending") navigate("/lending");
        else if (tab === "portfolio") navigate("/portfolio");
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div style={styles.headerContent}>
                    <h1 style={styles.logo}>BAGRA</h1>
                    <nav style={styles.nav}>
                        <a
                            href="#"
                            style={{
                                ...styles.navLink,
                                ...(activeTab === "markets" && styles.navLinkActive),
                            }}
                            onClick={(e) => {
                                e.preventDefault();
                                handleTabChange("markets");
                            }}
                            onMouseEnter={(e) => {
                                if (activeTab !== "markets") {
                                    e.currentTarget.style.color = "#fff";
                                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeTab !== "markets") {
                                    e.currentTarget.style.color = "#9ca3af";
                                    e.currentTarget.style.background = "transparent";
                                }
                            }}
                        >
                            Markets
                        </a>
                        <a
                            href="#"
                            style={{
                                ...styles.navLink,
                                ...(activeTab === "lending" && styles.navLinkActive),
                            }}
                            onClick={(e) => {
                                e.preventDefault();
                                handleTabChange("lending");
                            }}
                            onMouseEnter={(e) => {
                                if (activeTab !== "lending") {
                                    e.currentTarget.style.color = "#fff";
                                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeTab !== "lending") {
                                    e.currentTarget.style.color = "#9ca3af";
                                    e.currentTarget.style.background = "transparent";
                                }
                            }}
                        >
                            Lending
                        </a>
                        <a
                            href="#"
                            style={{
                                ...styles.navLink,
                                ...(activeTab === "portfolio" && styles.navLinkActive),
                            }}
                            onClick={(e) => {
                                e.preventDefault();
                                handleTabChange("portfolio");
                            }}
                            onMouseEnter={(e) => {
                                if (activeTab !== "portfolio") {
                                    e.currentTarget.style.color = "#fff";
                                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeTab !== "portfolio") {
                                    e.currentTarget.style.color = "#9ca3af";
                                    e.currentTarget.style.background = "transparent";
                                }
                            }}
                        >
                            Portfolio
                        </a>
                    </nav>
                </div>
                <WalletConnect onDepositClick={() => setIsDepositModalOpen(true)} />
            </header>

            <main style={styles.main}>
                <Routes>
                    <Route
                        path="/"
                        element={
                            <>
                                <div style={styles.hero}>
                                    <h1 style={styles.title}>Prediction Market</h1>
                                    <p style={styles.subtitle}>Trade on real-world events. Powered by Kalshi</p>
                                </div>
                                <Markets />
                            </>
                        }
                    />
                    <Route path="/event/:eventTicker" element={<EventDetail />} />
                    <Route path="/market/:ticker" element={<MarketDetail />} />
                    <Route
                        path="/lending"
                        element={
                            <>
                                <div style={styles.hero}>
                                    <h1 style={styles.title}>Lending Markets</h1>
                                    <p style={styles.subtitle}>Supply or borrow prediction market positions</p>
                                </div>
                                <Lending />
                            </>
                        }
                    />
                    <Route
                        path="/portfolio"
                        element={
                            <>
                                <div style={styles.hero}>
                                    <h1 style={styles.title}>Your Portfolio</h1>
                                    <p style={styles.subtitle}>Track your positions and performance</p>
                                </div>
                                <Portfolio />
                            </>
                        }
                    />
                </Routes>
            </main>

            <DepositModal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} />
        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        background: "#0d0e12",
        width: "100%",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1rem 3rem",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        background: "rgba(13, 14, 18, 0.95)",
        backdropFilter: "blur(20px)",
        width: "100%",
        position: "sticky" as const,
        top: 0,
        zIndex: 100,
    },
    headerContent: {
        display: "flex",
        alignItems: "center",
        gap: "3rem",
    },
    logo: {
        fontSize: "1.25rem",
        fontWeight: "600",
        color: "#fff",
        margin: 0,
    },
    nav: {
        display: "flex",
        gap: "0.5rem",
        background: "rgba(255, 255, 255, 0.03)",
        padding: "0.375rem",
        borderRadius: "10px",
        border: "1px solid rgba(255, 255, 255, 0.05)",
    },
    navLink: {
        color: "#9ca3af",
        textDecoration: "none",
        fontSize: "0.875rem",
        fontWeight: "600",
        transition: "all 0.2s",
        padding: "0.5rem 1.25rem",
        borderRadius: "8px",
    },
    navLinkActive: {
        color: "#fff",
        background: "rgba(229, 115, 115, 0.15)",
        border: "1px solid rgba(229, 115, 115, 0.2)",
    },
    main: {
        maxWidth: "1200px",
        width: "100%",
        margin: "0 auto",
        padding: "2rem",
    },
    hero: {
        textAlign: "center" as const,
        marginBottom: "3rem",
        paddingTop: "2rem",
    },
    title: {
        fontSize: "3rem",
        fontWeight: "700",
        margin: "0 0 1rem 0",
        background: "linear-gradient(135deg, #fff 0%, #9ca3af 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
    },
    subtitle: {
        fontSize: "1.125rem",
        color: "#9ca3af",
        margin: 0,
    },
};

export default App;

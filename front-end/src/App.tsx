import { useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import './App.css'
import { WalletConnect } from './components/WalletConnect'
import { Deposit } from './components/Deposit'
import { Markets } from './components/Markets'
import { MarketDetail } from './components/MarketDetail'
import { EventDetail } from './components/EventDetail'
import { Portfolio } from './components/Portfolio'

type Tab = 'markets' | 'deposit' | 'portfolio'

function App() {
  const navigate = useNavigate()
  const location = useLocation()

  // Determine active tab from URL
  const getActiveTab = (): Tab => {
    if (location.pathname.startsWith('/deposit')) return 'deposit'
    if (location.pathname.startsWith('/portfolio')) return 'portfolio'
    return 'markets'
  }

  const [activeTab, setActiveTab] = useState<Tab>(getActiveTab())

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    if (tab === 'markets') navigate('/')
    else if (tab === 'deposit') navigate('/deposit')
    else if (tab === 'portfolio') navigate('/portfolio')
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.logo}>Bagra</h1>
          <nav style={styles.nav}>
            <a
              href="#"
              style={{
                ...styles.navLink,
                ...(activeTab === 'markets' && styles.navLinkActive)
              }}
              onClick={(e) => { e.preventDefault(); handleTabChange('markets'); }}
            >
              Markets
            </a>
            <a
              href="#"
              style={{
                ...styles.navLink,
                ...(activeTab === 'deposit' && styles.navLinkActive)
              }}
              onClick={(e) => { e.preventDefault(); handleTabChange('deposit'); }}
            >
              Deposit
            </a>
            <a
              href="#"
              style={{
                ...styles.navLink,
                ...(activeTab === 'portfolio' && styles.navLinkActive)
              }}
              onClick={(e) => { e.preventDefault(); handleTabChange('portfolio'); }}
            >
              Portfolio
            </a>
          </nav>
        </div>
        <WalletConnect />
      </header>

      <main style={styles.main}>
        <Routes>
          <Route path="/" element={
            <>
              <div style={styles.hero}>
                <h1 style={styles.title}>Prediction Market</h1>
                <p style={styles.subtitle}>Trade on real-world events. Powered by Kalshi</p>
              </div>
              <Markets />
            </>
          } />
          <Route path="/event/:eventTicker" element={<EventDetail />} />
          <Route path="/market/:ticker" element={<MarketDetail />} />
          <Route path="/deposit" element={
            <>
              <div style={styles.hero}>
                <h1 style={styles.title}>Deposit Funds</h1>
                <p style={styles.subtitle}>Add USDC to start trading on prediction markets</p>
              </div>
              <Deposit />
            </>
          } />
          <Route path="/portfolio" element={
            <>
              <div style={styles.hero}>
                <h1 style={styles.title}>Your Portfolio</h1>
                <p style={styles.subtitle}>Track your positions and performance</p>
              </div>
              <Portfolio />
            </>
          } />
        </Routes>
      </main>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#0d0e12',
    width: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    borderBottom: '1px solid #1c1f26',
    background: '#13141a',
    width: '100%',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '3rem',
  },
  logo: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#fff',
    margin: 0,
  },
  nav: {
    display: 'flex',
    gap: '2rem',
  },
  navLink: {
    color: '#9ca3af',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'color 0.2s',
  },
  navLinkActive: {
    color: '#fff',
    borderBottom: '2px solid #3b82f6',
    paddingBottom: '0.25rem',
  },
  main: {
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    padding: '2rem',
  },
  hero: {
    textAlign: 'center' as const,
    marginBottom: '3rem',
    paddingTop: '2rem',
  },
  title: {
    fontSize: '3rem',
    fontWeight: '700',
    margin: '0 0 1rem 0',
    background: 'linear-gradient(135deg, #fff 0%, #9ca3af 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '1.125rem',
    color: '#9ca3af',
    margin: 0,
  },
};

export default App

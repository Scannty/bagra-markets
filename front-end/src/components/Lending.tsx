import { useState } from 'react';

interface LendingPool {
  marketTicker: string;
  marketTitle: string;
  eventTitle: string;
  side: 'YES' | 'NO';
  totalSupply: number;
  totalBorrow: number;
  supplyAPY: number;
  borrowAPY: number;
  utilization: number;
  available: number;
}

// Mock data for demonstration
const mockPools: LendingPool[] = [
  {
    marketTicker: 'PREZ-2024',
    marketTitle: 'Will Donald Trump become President of the United States before 2045?',
    eventTitle: 'US Presidential Election 2024',
    side: 'YES',
    totalSupply: 125000,
    totalBorrow: 87500,
    supplyAPY: 8.5,
    borrowAPY: 12.3,
    utilization: 70,
    available: 37500,
  },
  {
    marketTicker: 'PREZ-2024',
    marketTitle: 'Will Donald Trump become President of the United States before 2045?',
    eventTitle: 'US Presidential Election 2024',
    side: 'NO',
    totalSupply: 98000,
    totalBorrow: 58800,
    supplyAPY: 6.2,
    borrowAPY: 9.8,
    utilization: 60,
    available: 39200,
  },
  {
    marketTicker: 'SENATE-2024',
    marketTitle: 'Will Democrats control the Senate after 2024 election?',
    eventTitle: 'US Senate Control 2024',
    side: 'YES',
    totalSupply: 75000,
    totalBorrow: 45000,
    supplyAPY: 7.1,
    borrowAPY: 10.5,
    utilization: 60,
    available: 30000,
  },
];

export function Lending() {
  const [activePool, setActivePool] = useState<LendingPool | null>(null);
  const [action, setAction] = useState<'supply' | 'borrow'>('supply');
  const [amount, setAmount] = useState('');

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Lending Pools</h2>
          <p style={styles.subtitle}>Deposit prediction market positions or borrow against them</p>
        </div>
      </div>

      <div style={styles.poolsGrid}>
        {mockPools.map((pool, index) => (
          <div
            key={`${pool.marketTicker}-${pool.side}-${index}`}
            style={styles.poolCard}
            onClick={() => setActivePool(pool)}
          >
            <div style={styles.poolHeader}>
              <div>
                <span style={styles.poolTicker}>{pool.marketTicker}</span>
                <span
                  style={{
                    ...styles.poolSide,
                    color: pool.side === 'YES' ? '#10b981' : '#ef4444',
                  }}
                >
                  {pool.side}
                </span>
              </div>
            </div>

            <h3 style={styles.poolTitle}>{pool.eventTitle}</h3>

            <div style={styles.statsGrid}>
              <div style={styles.statBox}>
                <span style={styles.statLabel}>Supply APY</span>
                <span style={styles.statValue}>{pool.supplyAPY.toFixed(2)}%</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statLabel}>Borrow APY</span>
                <span style={styles.statValue}>{pool.borrowAPY.toFixed(2)}%</span>
              </div>
            </div>

            <div style={styles.utilizationContainer}>
              <div style={styles.utilizationHeader}>
                <span style={styles.utilizationLabel}>Utilization</span>
                <span style={styles.utilizationPercent}>{pool.utilization}%</span>
              </div>
              <div style={styles.utilizationBar}>
                <div
                  style={{
                    ...styles.utilizationFill,
                    width: `${pool.utilization}%`,
                  }}
                />
              </div>
            </div>

            <div style={styles.poolFooter}>
              <div>
                <span style={styles.footerLabel}>Total Supply</span>
                <span style={styles.footerValue}>{(pool.totalSupply / 1000).toFixed(1)}K</span>
              </div>
              <div>
                <span style={styles.footerLabel}>Available</span>
                <span style={styles.footerValue}>{(pool.available / 1000).toFixed(1)}K</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {activePool && (
        <div style={styles.overlay} onClick={() => setActivePool(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.modalTitleRow}>
                  <span style={styles.modalTicker}>{activePool.marketTicker}</span>
                  <span
                    style={{
                      ...styles.modalSide,
                      color: activePool.side === 'YES' ? '#10b981' : '#ef4444',
                    }}
                  >
                    {activePool.side}
                  </span>
                </div>
                <h2 style={styles.modalTitle}>{activePool.eventTitle}</h2>
              </div>
              <button onClick={() => setActivePool(null)} style={styles.closeButton}>
                ×
              </button>
            </div>

            <div style={styles.actionTabs}>
              <button
                onClick={() => setAction('supply')}
                style={{
                  ...styles.actionTab,
                  ...(action === 'supply' ? styles.actionTabActive : {}),
                }}
              >
                Supply
              </button>
              <button
                onClick={() => setAction('borrow')}
                style={{
                  ...styles.actionTab,
                  ...(action === 'borrow' ? styles.actionTabActive : {}),
                }}
              >
                Borrow
              </button>
            </div>

            <div style={styles.modalStats}>
              <div style={styles.modalStatItem}>
                <span style={styles.modalStatLabel}>
                  {action === 'supply' ? 'Supply APY' : 'Borrow APY'}
                </span>
                <span style={styles.modalStatValue}>
                  {action === 'supply'
                    ? activePool.supplyAPY.toFixed(2)
                    : activePool.borrowAPY.toFixed(2)}
                  %
                </span>
              </div>
              <div style={styles.modalStatItem}>
                <span style={styles.modalStatLabel}>Available</span>
                <span style={styles.modalStatValue}>
                  {(activePool.available / 1000).toFixed(1)}K contracts
                </span>
              </div>
              <div style={styles.modalStatItem}>
                <span style={styles.modalStatLabel}>Utilization</span>
                <span style={styles.modalStatValue}>{activePool.utilization}%</span>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>Amount (Contracts)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                style={styles.input}
                step="1"
                min="0"
              />
              <div style={styles.balanceRow}>
                <span style={styles.balanceLabel}>
                  {action === 'supply' ? 'Wallet Balance:' : 'Available to Borrow:'}
                </span>
                <span style={styles.balanceValue}>
                  {action === 'supply' ? '1,250' : (activePool.available / 1000).toFixed(1) + 'K'}{' '}
                  contracts
                </span>
              </div>
            </div>

            <button
              disabled={!amount || parseFloat(amount) <= 0}
              style={{
                ...styles.submitButton,
                ...(!amount || parseFloat(amount) <= 0 ? styles.submitButtonDisabled : {}),
              }}
            >
              {action === 'supply' ? 'Supply' : 'Borrow'} {amount || '0'} contracts
            </button>

            <div style={styles.infoBox}>
              <p style={styles.infoText}>
                {action === 'supply'
                  ? 'Supply your prediction market positions to earn interest. Your positions are used as collateral in the lending pool.'
                  : 'Borrow against your prediction market positions. Make sure to maintain a healthy collateral ratio to avoid liquidation.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    margin: '0 auto',
  },
  header: {
    marginBottom: '2rem',
  },
  title: {
    fontSize: '1.5rem',
    margin: 0,
    color: '#fff',
    fontWeight: '700',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#9ca3af',
    margin: 0,
  },
  poolsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: '1.5rem',
  },
  poolCard: {
    background: '#13141a',
    padding: '1.5rem',
    borderRadius: '16px',
    border: '1px solid #1c1f26',
    cursor: 'pointer',
    transition: 'transform 0.2s, border-color 0.2s',
  },
  poolHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  poolTicker: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginRight: '0.75rem',
  },
  poolSide: {
    fontSize: '0.875rem',
    fontWeight: '700',
    padding: '0.25rem 0.75rem',
    borderRadius: '6px',
    background: 'rgba(0, 0, 0, 0.3)',
  },
  poolTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '1.25rem',
    lineHeight: '1.4',
    margin: '0 0 1.25rem 0',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '1.25rem',
  },
  statBox: {
    background: '#0d0e12',
    padding: '1rem',
    borderRadius: '10px',
    border: '1px solid #1c1f26',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '0.5rem',
  },
  statLabel: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#10b981',
  },
  utilizationContainer: {
    marginBottom: '1.25rem',
  },
  utilizationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
  },
  utilizationLabel: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  utilizationPercent: {
    fontSize: '0.875rem',
    color: '#fff',
    fontWeight: '700',
  },
  utilizationBar: {
    height: '8px',
    background: '#0d0e12',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  utilizationFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #E57373 0%, #D97373 100%)',
    transition: 'width 0.3s',
  },
  poolFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: '1rem',
    borderTop: '1px solid #1c1f26',
  },
  footerLabel: {
    fontSize: '0.75rem',
    color: '#6b7280',
    fontWeight: '600',
    display: 'block',
    marginBottom: '0.25rem',
  },
  footerValue: {
    fontSize: '1rem',
    color: '#fff',
    fontWeight: '700',
    display: 'block',
  },
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#13141a',
    padding: '2rem',
    borderRadius: '16px',
    border: '1px solid #1c1f26',
    maxWidth: '540px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.5rem',
  },
  modalTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.5rem',
  },
  modalTicker: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  modalSide: {
    fontSize: '0.875rem',
    fontWeight: '700',
    padding: '0.25rem 0.75rem',
    borderRadius: '6px',
    background: 'rgba(0, 0, 0, 0.3)',
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#fff',
    margin: 0,
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: '#9ca3af',
    fontSize: '2rem',
    cursor: 'pointer',
    padding: '0',
    lineHeight: '1',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTabs: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.5rem',
    marginBottom: '1.5rem',
  },
  actionTab: {
    padding: '0.875rem',
    fontSize: '0.9375rem',
    fontWeight: '600',
    background: 'transparent',
    color: '#6b7280',
    border: '1px solid #1c1f26',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  actionTabActive: {
    background: 'linear-gradient(135deg, #E57373 0%, #D97373 100%)',
    color: '#fff',
    border: '1px solid transparent',
  },
  modalStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  modalStatItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.375rem',
  },
  modalStatLabel: {
    fontSize: '0.6875rem',
    color: '#9ca3af',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  modalStatValue: {
    fontSize: '1rem',
    color: '#fff',
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: '1.5rem',
  },
  inputLabel: {
    fontSize: '0.875rem',
    color: '#9ca3af',
    fontWeight: '600',
    display: 'block',
    marginBottom: '0.5rem',
  },
  input: {
    width: '100%',
    padding: '1rem',
    fontSize: '1.125rem',
    background: '#0d0e12',
    border: '1px solid #1c1f26',
    borderRadius: '12px',
    color: '#fff',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  balanceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '0.75rem',
  },
  balanceLabel: {
    fontSize: '0.875rem',
    color: '#6b7280',
  },
  balanceValue: {
    fontSize: '0.875rem',
    color: '#fff',
    fontWeight: '600',
  },
  submitButton: {
    width: '100%',
    padding: '1rem',
    fontSize: '1rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #E57373 0%, #D97373 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    marginBottom: '1.5rem',
  },
  submitButtonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  infoBox: {
    background: 'rgba(229, 115, 115, 0.1)',
    border: '1px solid rgba(229, 115, 115, 0.2)',
    borderRadius: '10px',
    padding: '1rem',
  },
  infoText: {
    fontSize: '0.875rem',
    color: '#9ca3af',
    margin: 0,
    lineHeight: '1.5',
  },
};

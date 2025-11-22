import './LoadingSpinner.css';

export function LoadingSpinner({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const sizeMap = {
    small: 24,
    medium: 40,
    large: 60,
  };

  const spinnerSize = sizeMap[size];

  return (
    <div style={styles.container}>
      <div className="spinner" style={{ width: spinnerSize, height: spinnerSize }}>
        <div className="spinner-ring" style={{ width: spinnerSize, height: spinnerSize }} />
        <div className="spinner-ring" style={{ width: spinnerSize, height: spinnerSize, animationDelay: '-0.4s' }} />
        <div className="spinner-ring" style={{ width: spinnerSize, height: spinnerSize, animationDelay: '-0.8s' }} />
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '3rem',
  },
};

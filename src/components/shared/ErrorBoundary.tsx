import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            gap: '16px',
            fontFamily: 'system-ui',
          }}
        >
          <h2 style={{ color: 'var(--text-primary, #333)', margin: 0 }}>
            Something went wrong
          </h2>
          <p style={{ color: 'var(--text-muted, #666)', margin: 0, maxWidth: '400px', textAlign: 'center' }}>
            {this.state.error?.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              borderRadius: '6px',
              border: '1px solid var(--border-color, #ddd)',
              background: 'var(--bg-surface, #fff)',
              color: 'var(--text-primary, #333)',
            }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

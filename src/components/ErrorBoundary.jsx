import React from 'react';

// ─────────────────────────────────────────────
// Global Error Boundary
// Prevents white-screen crashes from render errors,
// async promise rejections, and unexpected runtime failures
// ─────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  // Trigger fallback UI
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // Log error details (dev-safe)
  componentDidCatch(error, errorInfo) {
    console.error('🚨 React ErrorBoundary caught an error:', error);
    console.error('📍 Component stack:', errorInfo?.componentStack);

    // Optional: send to monitoring service
    // sendToSentry(error, errorInfo);
  }

  handleReload = () => {
    // Safe reload without assuming storage availability
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 text-gray-800"
          role="alert"
        >
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
            <h1 className="text-xl font-semibold text-red-600 mb-2">Something went wrong</h1>

            <p className="text-sm text-gray-600 mb-4">
              The application encountered an unexpected error and could not continue.
            </p>

            {/* Dev-only error details */}
            {import.meta.env.DEV && this.state.error && (
              <pre className="text-left text-xs bg-gray-100 p-3 rounded mb-4 overflow-auto text-red-700">
                {String(this.state.error)}
              </pre>
            )}

            <button
              onClick={this.handleReload}
              className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

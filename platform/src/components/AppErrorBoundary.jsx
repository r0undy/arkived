import React from 'react';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('[platform] uncaught render error', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto mt-16 max-w-lg rounded-lg border border-danger-500/40 bg-danger-500/10 p-6 text-center">
          <h1 className="text-xl font-semibold text-danger-300">Something went wrong</h1>
          <p className="mt-2 text-sm text-neutral-200">A rendering error occurred. Reload to continue.</p>
          <button
            className="mt-4 rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
            onClick={() => window.location.reload()}
            type="button"
          >
            Reload app
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ClerkErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    // Check if it's a Clerk-related error
    if (error.message?.includes('Clerk')) {
      return { hasError: true, error };
    }
    // Re-throw if not Clerk-related
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Clerk Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 max-w-md">
              <h2 className="text-xl font-semibold">Clerk Authentication</h2>
              <p className="text-muted-foreground text-center">
                Clerk is currently having trouble initializing. This is typically a temporary issue with the development instance. Please reload the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Reload Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

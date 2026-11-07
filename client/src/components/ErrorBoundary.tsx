import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthContext } from '@/context/AuthContext';
import { translate } from '@/lib/i18n';
import type { Language } from '@/types';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console in development
    console.error('Error caught by ErrorBoundary:', error, errorInfo);

    // In production, you could send this to an error reporting service
    // Example: logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <AuthContext.Consumer>
          {(auth) => <ErrorFallback error={this.state.error} language={auth?.language ?? 'fr'} />}
        </AuthContext.Consumer>
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  language: Language;
}

function ErrorFallback({ error, language }: ErrorFallbackProps) {
  const isDevelopment = import.meta.env.DEV;

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf8f5] p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-[#1a472a]/10 p-6">
            <AlertTriangle className="w-16 h-16 text-[#1a472a]" aria-hidden="true" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-[#1a472a] mb-4">
          {translate(language, 'Something went wrong')}
        </h1>

        <p className="text-gray-600 mb-6">
          {translate(language, "We're sorry, but something unexpected happened. Please try reloading the page.")}
        </p>

        {isDevelopment && error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
            <p className="text-sm font-semibold text-red-800 mb-2">{translate(language, 'Error Details (Dev Mode):')}</p>
            <p className="text-xs text-red-700 font-mono break-words">
              {error.message}
            </p>
            {error.stack && (
              <details className="mt-2">
                <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                  {translate(language, 'Stack trace')}
                </summary>
                <pre className="text-xs text-red-600 mt-2 overflow-x-auto whitespace-pre-wrap">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}

        <Button
          onClick={handleReload}
          className="bg-[#1a472a] hover:bg-[#1a472a]/90 text-white"
        >
          {translate(language, 'Reload Page')}
        </Button>
      </div>
    </div>
  );
}

export { ErrorBoundary };

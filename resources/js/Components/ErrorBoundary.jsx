import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error to console for debugging
        console.error('🚨 ErrorBoundary caught an error:', error, errorInfo);
        
        // You can also log the error to an error reporting service here
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            // Fallback UI
            return (
                <div className="error-boundary-fallback p-4 bg-red-50 border border-red-200 rounded-[40px]  ">
                    <h2 className="text-lg font-semibold text-red-800 mb-2">
                        Something went wrong displaying the content
                    </h2>
                    <div className="text-sm text-red-600">
                        <p className="mb-2">Please try refreshing the page. If the problem persists, contact support.</p>
                        {process.env.NODE_ENV === 'development' && (
                            <details className="mt-3">
                                <summary className="cursor-pointer font-medium">Error Details (Dev Mode)</summary>
                                <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                                    {this.state.error && this.state.error.toString()}
                                    <br />
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}
                    </div>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                        className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
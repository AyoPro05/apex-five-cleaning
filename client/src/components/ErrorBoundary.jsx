import React from "react";
import { captureClientException } from "../monitoring/sentry";

/**
 * Catches React render errors and shows a fallback UI instead of a blank screen.
 * Logs errors so they can be reported (e.g. to Sentry) if you add that later.
 */
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    captureClientException(error, {
      tags: { area: "react-error-boundary" },
      extra: { componentStack: errorInfo?.componentStack || "" },
    });
  }

  componentDidUpdate(prevProps) {
    if (!this.state.hasError) return;
    const prevKeys = prevProps.resetKeys || [];
    const nextKeys = this.props.resetKeys || [];
    const changed =
      prevKeys.length !== nextKeys.length ||
      prevKeys.some((value, index) => value !== nextKeys[index]);
    if (changed) {
      this.resetBoundary();
    }
  }

  resetBoundary = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      const title = this.props.title || "Something went wrong";
      const description =
        this.props.description ||
        "A part of this page failed to load. You can try again now.";
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">
              {title}
            </h1>
            <p className="text-gray-600 mb-6">
              {description}
            </p>
            <button
              type="button"
              onClick={this.resetBoundary}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

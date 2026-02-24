import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[var(--panel-bg)] px-6">
          <span className="text-base font-semibold text-[var(--text-primary)] font-['Outfit']">
            Algo salió mal
          </span>
          <span className="text-sm font-medium text-[var(--text-secondary)] text-center">
            Ocurrió un error inesperado. Recarga la página para continuar.
          </span>
          <button
            type="button"
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="mt-2 rounded-xl bg-[var(--text-primary)] px-4 py-2 text-sm font-semibold text-[var(--panel-bg)]"
          >
            Recargar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

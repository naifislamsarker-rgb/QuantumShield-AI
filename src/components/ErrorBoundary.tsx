import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ShieldAlert, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || 'An unexpected application error occurred.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled boundary error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#05070E] p-6 text-slate-100">
          <div className="max-w-lg rounded-2xl border border-rose-500/35 bg-slate-950/90 p-7 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <ShieldAlert className="h-6 w-6 shrink-0" aria-hidden="true" />
              <h1 className="font-display text-lg font-bold text-white">
                Security Session Interrupted
              </h1>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              A protective exception boundary caught an operation failure. Please reload or reset
              your session to continue.
            </p>
            <p className="mt-3 rounded-lg border border-slate-800 bg-slate-900/80 p-3 font-mono text-xs text-rose-300 break-words">
              {this.state.message.slice(0, 320)}
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, message: '' })}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#2D7FF9] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Recover Session
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

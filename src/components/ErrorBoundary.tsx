import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { STORAGE_KEYS } from '../context/storageKeys';

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Top-level render-error guard. Wraps `GameProvider` (see `main.tsx`) so that a bad state
 * update or a malformed value from a user-supplied JSON import — the calculator, flow graph,
 * and every view assume well-shaped `GameDatabase` data — can never white-screen the whole app
 * with no recovery path. The reset action clears this app's own `localStorage` keys directly
 * (it cannot rely on `GameContext`, since the provider itself may be the thing that crashed)
 * and reloads, falling back to the built-in presets.
 */
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('FactoRecipe crashed:', error, info.componentStack);
  }

  handleReset = (): void => {
    for (const key of STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
    window.location.reload();
  };

  render(): React.ReactNode {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-rose-800/60 rounded-2xl p-6 space-y-4 shadow-2xl">
          <div className="flex items-center gap-3 text-rose-400">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <h1 className="text-base font-bold text-white">FactoRecipe hit an unexpected error</h1>
          </div>
          <p className="text-xs text-slate-400">
            Something in the app crashed and couldn&apos;t recover. This can happen after importing
            a malformed sandbox file. Your data is still in this browser&apos;s storage — resetting
            only clears it if you confirm below.
          </p>
          <pre className="text-[11px] text-rose-300/90 bg-slate-950/60 border border-slate-800 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words">
            {this.state.error.message}
          </pre>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="flex-1 py-2 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition"
            >
              Try to Continue
            </button>
            <button
              type="button"
              onClick={this.handleReset}
              className="flex-1 py-2 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition"
            >
              Reset App Data &amp; Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}

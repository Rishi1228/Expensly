import { Component } from 'react';
import { TriangleAlert } from 'lucide-react';
import Button from './ui/Button.jsx';

/**
 * Catches render errors so one broken page doesn't blank the whole app.
 * Pass resetKey (e.g. the current path) to clear the error when the user navigates away.
 */
export default class ErrorBoundary extends Component {
  state = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error) {
    return { error };
  }

  static getDerivedStateFromProps(props, state) {
    return props.resetKey !== state.resetKey ? { error: null, resetKey: props.resetKey } : null;
  }

  componentDidCatch(error, info) {
    console.error('Render error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    // A failed lazy chunk (usually after a new deploy) is fixed by a reload.
    return (
      <div className="flex flex-col items-center px-6 py-16 text-center" role="alert">
        <TriangleAlert className="mb-3 size-10 text-amber-500" aria-hidden />
        <p className="font-medium">Something went wrong</p>
        <p className="mt-1 max-w-xs text-sm text-slate-500">
          Try reloading the page. If it keeps happening, sign out and back in.
        </p>
        <Button className="mt-5" onClick={() => window.location.reload()}>
          Reload
        </Button>
      </div>
    );
  }
}

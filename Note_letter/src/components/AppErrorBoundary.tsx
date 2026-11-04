import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { failed: boolean };

/** Prevent a render failure from leaving writers with an unexplained blank page.
 * User letters and tokens are never included in the fallback or telemetry.
 */
export default class AppErrorBoundary extends Component<Props, State> {
    state: State = { failed: false };

    static getDerivedStateFromError(): State {
        return { failed: true };
    }

    componentDidCatch(error: Error, details: ErrorInfo) {
        if (import.meta.env.DEV) {
            // Development diagnostics only; avoid logging private letter content in production.
            console.error('SendTheLetter render error', error.name, details.componentStack);
        }
    }

    render() {
        if (!this.state.failed) return this.props.children;

        return (
            <main role="alert" className="flex min-h-screen items-center justify-center bg-background px-5 py-10 text-foreground">
                <section className="w-full max-w-md rounded-[24px] border border-border bg-card p-7 text-center shadow-sm sm:p-9">
                    <div aria-hidden="true" className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted font-editorial text-2xl text-primary">✉</div>
                    <h1 className="font-editorial text-3xl">Something interrupted your writing space.</h1>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                        We couldn't show this page. You can reload or return home. If you were editing a letter, check My Library for the most recently saved draft.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <button type="button" onClick={() => window.location.reload()} className="min-h-11 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                            Try again
                        </button>
                        <a href="/" className="inline-flex min-h-11 items-center rounded-xl border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted">
                            Go to home
                        </a>
                    </div>
                </section>
            </main>
        );
    }
}

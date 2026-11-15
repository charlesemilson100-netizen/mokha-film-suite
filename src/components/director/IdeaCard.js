// ── Director Agentic Mode: IdeaCard component ─────────────────────────
        export const IdeaCard = ({ idea, onExplore, onDismiss }) => {
            const { status, title, rationale, shotSequence } = idea;

            const isExplored  = status === 'explored';
            const isDismissed = status === 'dismissed';

            return (
                <div
                    className={`rounded-lg border p-3 my-2 ${isDismissed ? 'opacity-40' : ''}`}
                    style={{
                        fontSize: '0.78rem',
                        borderColor: 'rgb(var(--color-accent)/0.6)',
                        background: 'rgb(var(--color-accent)/0.04)',
                    }}
                >
                    {/* Header row: idea badge + explored label */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                            className="text-xs font-bold px-1.5 py-0.5 rounded tracking-wide"
                            style={{ background: 'rgb(var(--color-accent)/0.12)', color: 'rgb(var(--color-accent))', border: '1px solid rgb(var(--color-accent)/0.3)' }}
                        >
                            💡 IDEA
                        </span>
                        {isExplored && (
                            <span className="ml-auto text-xs font-semibold" style={{ color: 'rgb(var(--color-accent))' }}>
                                Expanded into actions
                            </span>
                        )}
                    </div>

                    {/* Concept title */}
                    <div className="font-semibold mb-0.5" style={{ color: 'var(--lg-text)' }}>
                        {title}
                    </div>

                    {/* Rationale (≤3 sentences) */}
                    {rationale && (
                        <div className="text-xs mb-1" style={{ color: 'var(--lg-text-muted)' }}>
                            {rationale}
                        </div>
                    )}

                    {/* Shot sequence */}
                    {shotSequence && (
                        <div
                            className="text-xs font-mono mb-2 px-2 py-1 rounded"
                            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgb(var(--color-accent)/0.9)' }}
                        >
                            {shotSequence}
                        </div>
                    )}

                    {/* Action buttons */}
                    {!isDismissed && (
                        <div className="flex gap-2 mt-1">
                            {!isExplored && (
                                <button
                                    className="text-xs px-3 py-1 rounded font-semibold"
                                    style={{ background: 'rgb(var(--color-accent)/0.12)', border: '1px solid rgb(var(--color-accent)/0.4)', color: 'rgb(var(--color-accent))' }}
                                    onClick={() => onExplore && onExplore(idea)}
                                >
                                    Explore
                                </button>
                            )}
                            <button
                                className="text-xs px-3 py-1 rounded font-semibold"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--lg-text-muted)' }}
                                onClick={() => onDismiss && onDismiss(idea)}
                            >
                                Dismiss
                            </button>
                        </div>
                    )}
                </div>
            );
        };


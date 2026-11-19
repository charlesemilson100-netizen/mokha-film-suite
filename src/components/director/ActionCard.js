// ── Director Agentic Mode: ActionCard component ───────────────────────
        export const ActionCard = ({ proposal, onConfirm, onReject }) => {
            const { status, type, label, rationale, targetSceneId, targetShotId, error } = proposal;

            const isPending  = status === 'pending';
            const isApplied  = status === 'applied';
            const isRejected = status === 'rejected';
            const isError    = status === 'error';

            // Border / background based on status
            const cardClass = isApplied
                ? 'border-green-500/40 bg-green-500/5'
                : isRejected
                    ? 'border-border-dark/30 opacity-50'
                    : isError
                        ? 'border-red-500/40 bg-red-500/5'
                        : 'border-primary/60';

            // Human-readable badge label (e.g. "ADD SHOT")
            const badgeLabel = (type || '').replace(/_/g, ' ');

            // Target reference string
            const targetRef = targetShotId
                ? `Shot ${targetShotId}`
                : targetSceneId
                    ? `Scene ${targetSceneId}`
                    : null;

            return (
                <div className={`rounded-lg border p-3 my-2 ${cardClass}`} style={{ fontSize: '0.78rem' }}>
                    {/* Header row: badge + target ref */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 tracking-wide">
                            {badgeLabel}
                        </span>
                        {targetRef && (
                            <span className="text-xs text-muted-foreground opacity-70">{targetRef}</span>
                        )}
                        {isApplied && (
                            <span className="ml-auto text-xs text-green-400 font-semibold">✓ Applied</span>
                        )}
                        {isRejected && (
                            <span className="ml-auto text-xs text-muted-foreground font-semibold line-through">✗ Rejected</span>
                        )}
                    </div>

                    {/* Imperative label */}
                    <div className={`font-semibold mb-0.5 ${isRejected ? 'line-through' : ''}`} style={{ color: 'var(--lg-text)' }}>
                        {label}
                    </div>

                    {/* Rationale */}
                    {rationale && (
                        <div className="text-xs mb-2" style={{ color: 'var(--lg-text-muted)' }}>
                            {rationale}
                        </div>
                    )}

                    {/* Inline error */}
                    {isError && error && (
                        <div className="text-xs text-red-400 mb-2">{error}</div>
                    )}

                    {/* Action buttons — only shown when pending */}
                    {isPending && (
                        <div className="flex gap-2 mt-1">
                            <button
                                className="lg-btn-primary text-xs px-3 py-1 rounded font-semibold"
                                style={{ background: 'rgb(var(--color-primary)/0.15)', border: '1px solid rgb(var(--color-primary)/0.5)', color: 'rgb(var(--color-primary))' }}
                                onClick={() => onConfirm && onConfirm(proposal)}
                            >
                                Confirm
                            </button>
                            <button
                                className="lg-btn-ghost text-xs px-3 py-1 rounded font-semibold"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--lg-text-muted)' }}
                                onClick={() => onReject && onReject(proposal)}
                            >
                                Reject
                            </button>
                        </div>
                    )}
                </div>
            );
        };


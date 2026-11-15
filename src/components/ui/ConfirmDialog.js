import React from 'react';
import { Icon } from './Icon';

// ── Styled Confirm Dialog ───────────────────────────────────────────
        export const ConfirmDialog = ({ message, onConfirm, onCancel, confirmLabel = 'Delete', confirmClass = 'bg-red-500 hover:bg-red-600 text-white' }) => (
            <div className="settings-overlay" style={{zIndex:99999}} onClick={onCancel}>
                <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-xl shadow-2xl p-5 max-w-sm w-full mx-4 animate-slide-up" onClick={e => e.stopPropagation()}>
                    <div className="flex items-start gap-3 mb-5">
                        <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
                            <Icon name="AlertTriangle" size={16} className="text-red-500" />
                        </div>
                        <p className="text-sm text-textMain-light dark:text-textMain-dark leading-relaxed">{message}</p>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button onClick={onCancel} className="px-4 py-2 text-xs font-bold rounded-lg border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:bg-input-light dark:hover:bg-input-dark transition-all">Cancel</button>
                        <button onClick={onConfirm} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${confirmClass}`}>{confirmLabel}</button>
                    </div>
                </div>
            </div>
        );

// ── useConfirm hook ─────────────────────────────────────────────────
        export const useConfirm = () => {
            const [dialog, setDialog] = React.useState(null);
            const confirm = (message, options = {}) => new Promise(resolve => {
                setDialog({ message, options, resolve });
            });
            const handleConfirm = () => { dialog?.resolve(true); setDialog(null); };
            const handleCancel = () => { dialog?.resolve(false); setDialog(null); };
            const ConfirmUI = dialog ? (
                <ConfirmDialog
                    message={dialog.message}
                    confirmLabel={dialog.options.confirmLabel || 'Delete'}
                    confirmClass={dialog.options.confirmClass || 'bg-red-500 hover:bg-red-600 text-white'}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            ) : null;
            return { confirm, ConfirmUI };
        };


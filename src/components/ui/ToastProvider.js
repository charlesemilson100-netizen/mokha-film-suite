import React, { useState } from 'react';

// ═══════════════════════════════════════════════════════════════════
        // FEATURE 11 — TOAST NOTIFICATION SYSTEM
        // ═══════════════════════════════════════════════════════════════════
        export const ToastContext = React.createContext(null);

export const ToastProvider = ({ children }) => {
            const [toasts, setToasts] = useState([]);
            const addToast = (message, type = 'info', duration = 3000) => {
                const id = Date.now() + Math.random();
                setToasts(prev => [...prev, { id, message, type, exiting: false }]);
                setTimeout(() => {
                    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
                    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350);
                }, duration);
            };
            const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ', action: '⚡' };
            const colors = { success: 'border-green-500/40 bg-green-500/10 text-green-400', error: 'border-red-500/40 bg-red-500/10 text-red-400', warning: 'border-amber-500/40 bg-amber-500/10 text-amber-400', info: 'border-primary/40 bg-primary/10 text-primary', action: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' };
            return (
                <ToastContext.Provider value={addToast}>
                    {children}
                    <div className="fixed top-4 right-4 z-[99998] flex flex-col gap-2 pointer-events-none" style={{maxWidth:'320px'}}>
                        {toasts.map(t => (
                            <div key={t.id} className={`pointer-events-auto flex items-start gap-2.5 px-3 py-2.5 rounded-xl border shadow-xl text-xs font-bold backdrop-blur-sm ${colors[t.type] || colors.info} ${t.exiting ? 'toast-exit' : 'toast-enter'}`}>
                                <span className="text-sm shrink-0 mt-0.5">{icons[t.type]}</span>
                                <span className="text-textMain-light dark:text-textMain-dark font-normal leading-relaxed">{t.message}</span>
                            </div>
                        ))}
                    </div>
                </ToastContext.Provider>
            );
        };

export const useToast = () => React.useContext(ToastContext);


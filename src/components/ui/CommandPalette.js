import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';

// ═══════════════════════════════════════════════════════════════════
        // FEATURE 6 — COMMAND PALETTE (Cmd+K)
        // ═══════════════════════════════════════════════════════════════════
        export const CommandPalette = ({ isOpen, onClose, onCommand, projects, scenes, globalCharacters }) => {
            const [query, setQuery] = useState('');
            const inputRef = useRef(null);
            useEffect(() => { if (isOpen) { setQuery(''); setTimeout(() => inputRef.current?.focus(), 50); } }, [isOpen]);
            useEffect(() => {
                const handler = (e) => { if (e.key === 'Escape') onClose(); };
                window.addEventListener('keydown', handler);
                return () => window.removeEventListener('keydown', handler);
            }, [onClose]);

            const allCommands = [
                { icon: '🏠', label: 'Go to Dashboard', action: () => onCommand('navigate', 'dashboard'), group: 'Navigate' },
                { icon: '✏️', label: 'Go to Editor', action: () => onCommand('navigate', 'editor'), group: 'Navigate' },
                { icon: '📚', label: 'Open Prompt Library', action: () => onCommand('library'), group: 'Navigate' },
                { icon: '📖', label: 'Open Story Engine', action: () => onCommand('story'), group: 'Navigate' },
                { icon: '➕', label: 'New Project', action: () => onCommand('newProject'), group: 'Create' },
                { icon: '🎬', label: 'New Scene', action: () => onCommand('newScene'), group: 'Create' },
                { icon: '🎥', label: 'Add Shot', action: () => onCommand('addShot'), group: 'Create' },
                { icon: '👤', label: 'New Character', action: () => onCommand('newChar'), group: 'Create' },
                { icon: '📍', label: 'New Location', action: () => onCommand('newLoc'), group: 'Create' },
                { icon: '🎙', label: 'New Voice', action: () => onCommand('newVoice'), group: 'Create' },
                { icon: '🎲', label: 'Surprise Me', action: () => onCommand('surprise'), group: 'AI' },
                { icon: '🎭', label: 'Set Mood: Tense', action: () => onCommand('mood', 'tense'), group: 'AI' },
                { icon: '🎭', label: 'Set Mood: Epic', action: () => onCommand('mood', 'epic'), group: 'AI' },
                { icon: '🎭', label: 'Set Mood: Noir', action: () => onCommand('mood', 'mysterious'), group: 'AI' },
                { icon: '🎬', label: 'Director: Kubrick', action: () => onCommand('director', 'kubrick'), group: 'AI' },
                { icon: '🎬', label: 'Director: Nolan', action: () => onCommand('director', 'nolan'), group: 'AI' },
                { icon: '🎬', label: 'Director: Villeneuve', action: () => onCommand('director', 'villeneuve'), group: 'AI' },
                { icon: '📋', label: 'Copy Final Script', action: () => onCommand('copyScript'), group: 'Export' },
                { icon: '📄', label: 'Export PDF', action: () => onCommand('exportPDF'), group: 'Export' },
                { icon: '💾', label: 'Export JSON', action: () => onCommand('exportJSON'), group: 'Export' },
                { icon: '🌙', label: 'Toggle Dark Mode', action: () => onCommand('toggleTheme'), group: 'UI' },
                { icon: '🔍', label: 'Toggle Focus Mode', action: () => onCommand('focusMode'), group: 'UI' },
                { icon: '🎬', label: 'Open Director Brain', action: () => onCommand('directorBrain'), group: 'AI Director' },
                { icon: '🔍', label: 'Run Full Critique', action: () => onCommand('runCritique'), group: 'AI Director' },
                { icon: '⌨', label: 'Open Keyboard Shortcuts', action: () => onCommand('cheatSheet'), group: 'AI Director' },
                { icon: '🧠', label: 'Switch to Deep Brain Mode', action: () => onCommand('deepBrain'), group: 'AI Director' },
                { icon: '⚡', label: 'Switch to Fast Brain Mode', action: () => onCommand('fastBrain'), group: 'AI Director' },
                ...projects.map(p => ({ icon: '📁', label: `Switch to: ${p.name}`, action: () => onCommand('switchProject', p.id), group: 'Projects' })),
                ...scenes.map(s => ({ icon: '🎞', label: `Go to scene: ${s.name}`, action: () => onCommand('switchScene', s.id), group: 'Scenes' })),
            ];

            const filtered = query.trim()
                ? allCommands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()) || c.group.toLowerCase().includes(query.toLowerCase()))
                : allCommands;

            const groups = [...new Set(filtered.map(c => c.group))];

            if (!isOpen) return null;
            return (
                <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-[15vh]" onClick={onClose}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
                    <div className="relative w-full max-w-lg mx-4 bg-panel-light dark:bg-[#1a1a1a] border border-border-light dark:border-border-dark rounded-2xl shadow-2xl overflow-hidden animate-palette-in" onClick={e => e.stopPropagation()}>
                        {/* Search */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-light dark:border-border-dark">
                            <Icon name="Search" size={16} className="text-textMuted-light dark:text-textMuted-dark shrink-0"/>
                            <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Type a command or search..." className="flex-1 bg-transparent text-textMain-light dark:text-textMain-dark text-sm outline-none placeholder-textMuted-light dark:placeholder-textMuted-dark"/>
                            <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark font-mono">ESC</kbd>
                        </div>
                        {/* Results */}
                        <div className="max-h-80 overflow-y-auto custom-scrollbar p-2">
                            {groups.map(group => (
                                <div key={group} className="mb-2">
                                    <div className="text-[9px] font-black text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest px-2 py-1">{group}</div>
                                    {filtered.filter(c => c.group === group).map((cmd, i) => (
                                        <button key={i} onClick={() => { cmd.action(); onClose(); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-input-light dark:hover:bg-input-dark text-left transition-colors group">
                                            <span className="text-base">{cmd.icon}</span>
                                            <span className="text-sm text-textMain-light dark:text-textMain-dark group-hover:text-primary transition-colors">{cmd.label}</span>
                                        </button>
                                    ))}
                                </div>
                            ))}
                            {filtered.length === 0 && <div className="text-center text-textMuted-light dark:text-textMuted-dark text-sm py-8">No commands found for "{query}"</div>}
                        </div>
                        <div className="px-4 py-2 border-t border-border-light dark:border-border-dark flex items-center gap-3">
                            <span className="text-[9px] text-textMuted-light dark:text-textMuted-dark">Press <kbd className="font-mono bg-input-light dark:bg-input-dark px-1 rounded border border-border-light dark:border-border-dark">↑↓</kbd> to navigate · <kbd className="font-mono bg-input-light dark:bg-input-dark px-1 rounded border border-border-light dark:border-border-dark">↵</kbd> to run · <kbd className="font-mono bg-input-light dark:bg-input-dark px-1 rounded border border-border-light dark:border-border-dark">⌘K</kbd> to toggle</span>
                        </div>
                    </div>
                </div>
            );
        };


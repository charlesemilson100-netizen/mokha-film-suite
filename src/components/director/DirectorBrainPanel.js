import React from 'react';
import { ActionCard } from './ActionCard';
import { IdeaCard } from './IdeaCard';
import { PresetPalette } from './PresetPalette';
import { Icon } from '../ui/Icon';
import { ACTION_TYPES, AGENTIC_EXAMPLE_CHIPS } from '../../data/catalog';
import { AgenticResponseBuilder, ExecutionEngine, IntentParser } from '../../engine/directorBrain';

// ── Director Intelligence Suite: DirectorBrainPanel ───────────────────
        // Task 9: Upgraded with full agentic capabilities
        // Task 11: Now accepts appActions and selectedShotId props
        export const DirectorBrainPanel = ({ brainMode, deepBrainEngineRef, projectSnapshot, onBrainModeChange, appActions, selectedShotId }) => {
            // 9.3 Extended messages state shape: { role, content, source, actionCards, ideaCards, closingNote }
            const [messages, setMessages] = React.useState([]);
            const [input, setInput] = React.useState('');
            const [isGenerating, setIsGenerating] = React.useState(false);
            const messagesEndRef = React.useRef(null);

            // 9.1 Session log state — reset when chat cleared or project changes
            const [sessionLog, setSessionLog] = React.useState([]);

            // 9.2 Preset palette visibility state
            const [showPresetPalette, setShowPresetPalette] = React.useState(false);

            // Onboarding tooltip (first open only)
            const [showOnboarding, setShowOnboarding] = React.useState(() => !localStorage.getItem('directorBrainOnboarded'));

            // Auto-scroll to bottom on new messages
            React.useEffect(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, [messages]);

            // Reset session log when project changes
            const activeProjectId = appActions && appActions.activeProjectId;
            React.useEffect(() => {
                setSessionLog([]);
                setMessages([]);
            }, [activeProjectId]);

            // 9.5 Proactive scan on panel mount
            React.useEffect(() => {
                if (!projectSnapshot) return;
                try {
                    const scanResult = AgenticResponseBuilder.scan(projectSnapshot);
                    if (scanResult) {
                        setMessages([{
                            role: 'assistant',
                            content: scanResult.text,
                            source: scanResult.source || 'fast',
                            actionCards: scanResult.actionCards || [],
                            ideaCards: scanResult.ideaCards || [],
                            closingNote: scanResult.closingNote || '',
                        }]);
                    }
                } catch(e) {
                    // silently skip — show standard empty state
                }
            }, []);

            // 9.4 handleSubmit — uses AgenticResponseBuilder.build() pipeline
            const handleSubmit = async () => {
                if (!input.trim() || isGenerating) return;
                const query = input.trim();
                setInput('');
                setMessages(prev => [...prev, {
                    role: 'user',
                    content: query,
                    actionCards: [],
                    ideaCards: [],
                    closingNote: '',
                }]);
                setIsGenerating(true);

                // Preserve existing 30-second timeout
                let timedOut = false;
                const timeoutId = setTimeout(() => {
                    timedOut = true;
                    setIsGenerating(false);
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: '⏱ Response timed out (30s). Try a simpler query or switch to Fast Mode.',
                        source: 'fast',
                        actionCards: [],
                        ideaCards: [],
                        closingNote: '',
                    }]);
                }, 30000);

                try {
                    // Parse intent first
                    const intent = IntentParser.parse(query, projectSnapshot);

                    // Build full agentic response
                    const agenticResult = await AgenticResponseBuilder.build(
                        intent, projectSnapshot, brainMode, deepBrainEngineRef, sessionLog
                    );

                    if (!timedOut) {
                        clearTimeout(timeoutId);
                        setMessages(prev => [...prev, {
                            role: 'assistant',
                            content: agenticResult.text,
                            source: agenticResult.source,
                            actionCards: agenticResult.actionCards || [],
                            ideaCards: agenticResult.ideaCards || [],
                            closingNote: agenticResult.closingNote || '',
                        }]);
                    }
                } catch(e) {
                    if (!timedOut) {
                        clearTimeout(timeoutId);
                        setMessages(prev => [...prev, {
                            role: 'assistant',
                            content: `Error: ${e.message}`,
                            source: 'fast',
                            actionCards: [],
                            ideaCards: [],
                            closingNote: '',
                        }]);
                    }
                } finally {
                    if (!timedOut) setIsGenerating(false);
                }
            };

            // 9.6 handleConfirmAction — apply proposal and update card status in-place
            const handleConfirmAction = (proposal, messageIndex) => {
                if (!appActions) return;
                const result = ExecutionEngine.apply(proposal, appActions);
                if (result.success) {
                    // Update only the specific card's status in-place
                    setMessages(prev => prev.map((msg, mi) => {
                        if (mi !== messageIndex) return msg;
                        return {
                            ...msg,
                            actionCards: msg.actionCards.map(card =>
                                card.id === proposal.id ? { ...card, status: 'applied' } : card
                            ),
                        };
                    }));
                    // Append to session log
                    setSessionLog(prev => [...prev, {
                        proposalId: proposal.id,
                        type: proposal.type,
                        targetSceneId: proposal.targetSceneId || null,
                        targetShotId: proposal.targetShotId || null,
                        paramsHash: JSON.stringify(proposal.payload || {}),
                        status: 'applied',
                        appliedAt: Date.now(),
                    }]);
                } else {
                    // Mark card as error with message
                    setMessages(prev => prev.map((msg, mi) => {
                        if (mi !== messageIndex) return msg;
                        return {
                            ...msg,
                            actionCards: msg.actionCards.map(card =>
                                card.id === proposal.id ? { ...card, status: 'error', error: result.error } : card
                            ),
                        };
                    }));
                }
            };

            // Track which cards have been auto-confirmed to avoid re-confirming
            const autoConfirmedRef = React.useRef(new Set());

            // Auto-confirm certain action types immediately after they're added to messages
            React.useEffect(() => {
                const autoConfirmTypes = ['CREATE_CHARACTER', 'ADD_DIALOGUE', 'ADD_ACTION'];
                
                // Find pending cards that should be auto-confirmed
                messages.forEach((msg, msgIdx) => {
                    if (msg.role !== 'assistant' || !msg.actionCards || msg.actionCards.length === 0) {
                        return;
                    }
                    
                    msg.actionCards.forEach(card => {
                        const cardKey = `${msgIdx}_${card.id}`;
                        
                        // Only auto-confirm if:
                        // 1. Still pending
                        // 2. Is an auto-confirm type
                        // 3. Haven't already auto-confirmed this card
                        if (card.status === 'pending' && 
                            autoConfirmTypes.includes(card.type) && 
                            !autoConfirmedRef.current.has(cardKey)) {
                            
                            // Mark as auto-confirmed
                            autoConfirmedRef.current.add(cardKey);
                            
                            // Trigger confirmation asynchronously to avoid state update during render
                            setTimeout(() => {
                                handleConfirmAction(card, msgIdx);
                            }, 0);
                        }
                    });
                });
            }, [messages]); // Run whenever messages change

            // 9.7 handleRejectAction — update card status in-place, no state mutation
            const handleRejectAction = (proposal, messageIndex) => {
                setMessages(prev => prev.map((msg, mi) => {
                    if (mi !== messageIndex) return msg;
                    return {
                        ...msg,
                        actionCards: msg.actionCards.map(card =>
                            card.id === proposal.id ? { ...card, status: 'rejected' } : card
                        ),
                    };
                }));
                setSessionLog(prev => [...prev, {
                    proposalId: proposal.id,
                    type: proposal.type,
                    targetSceneId: proposal.targetSceneId || null,
                    targetShotId: proposal.targetShotId || null,
                    paramsHash: JSON.stringify(proposal.payload || {}),
                    status: 'rejected',
                    appliedAt: Date.now(),
                }]);
            };

            // 9.8 handleExploreIdea — expand idea into action cards as new bot message
            const handleExploreIdea = (idea, messageIndex) => {
                // Mark idea as explored in-place
                setMessages(prev => prev.map((msg, mi) => {
                    if (mi !== messageIndex) return msg;
                    return {
                        ...msg,
                        ideaCards: msg.ideaCards.map(ic =>
                            ic.id === idea.id ? { ...ic, status: 'explored' } : ic
                        ),
                    };
                }));
                // Expand idea into action proposals and append as new bot message
                try {
                    const proposals = AgenticResponseBuilder.expandIdea(idea, projectSnapshot);
                    if (proposals && proposals.length > 0) {
                        setMessages(prev => [...prev, {
                            role: 'assistant',
                            content: `Expanded idea: "${idea.title}"`,
                            source: 'fast',
                            actionCards: proposals,
                            ideaCards: [],
                            closingNote: 'Confirm the action cards above to apply these ideas to your sequence.',
                        }]);
                    }
                } catch(e) {
                    // silently skip
                }
            };

            // 9.9 handleDismissIdea — update idea status in-place, no state mutation
            const handleDismissIdea = (idea, messageIndex) => {
                setMessages(prev => prev.map((msg, mi) => {
                    if (mi !== messageIndex) return msg;
                    return {
                        ...msg,
                        ideaCards: msg.ideaCards.map(ic =>
                            ic.id === idea.id ? { ...ic, status: 'dismissed' } : ic
                        ),
                    };
                }));
            };

            // 9.10 handleSelectPreset — create APPLY_PRESET action card for selected shot
            const handleSelectPreset = (preset) => {
                const targetShotId = selectedShotId || null;
                const proposal = {
                    id: `preset_${Date.now()}`,
                    type: ACTION_TYPES.APPLY_PRESET,
                    label: `Apply "${preset.name}" preset${targetShotId ? ` to shot ${targetShotId}` : ''}`,
                    rationale: preset.description,
                    targetSceneId: (projectSnapshot && projectSnapshot.activeScene && projectSnapshot.activeScene.id) || null,
                    targetShotId,
                    payload: {
                        shotIds: targetShotId ? [targetShotId] : [],
                        preset,
                    },
                    status: 'pending',
                };
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `Shot preset ready to apply: "${preset.name}"`,
                    source: 'fast',
                    actionCards: [proposal],
                    ideaCards: [],
                    closingNote: 'Confirm to apply all preset fields to the selected shot.',
                }]);
                setShowPresetPalette(false);
            };

            return (
                <div className="flex flex-col h-full relative">
                    {/* Onboarding tooltip */}
                    {showOnboarding && (
                        <div className="mx-3 mt-2 p-3 rounded-xl bg-primary/10 border border-primary/30 text-[10px] text-textMain-light dark:text-textMain-dark leading-relaxed">
                            <div className="font-black text-primary mb-1">⚡ Director Brain — Agentic Mode</div>
                            <div className="text-textMuted-light dark:text-textMuted-dark">
                                <b>Fast Mode</b> (default): instant rule-based answers — continuity, pacing, style rewrites.<br/>
                                <b>Deep Mode</b>: enable in Settings for open-ended creative questions using a local AI model.<br/>
                                <b>Action Cards</b>: confirm or reject proposed changes to your project.
                            </div>
                            <button onClick={() => { setShowOnboarding(false); localStorage.setItem('directorBrainOnboarded', 'true'); }} className="mt-2 text-[9px] text-primary font-bold hover:underline">Got it →</button>
                        </div>
                    )}

                    {/* Chat thread */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 min-h-0">
                        {messages.length === 0 && (
                            <div className="text-center text-textMuted-light dark:text-textMuted-dark text-[10px] pt-4 pb-2">
                                Ask your director anything about your project.
                            </div>
                        )}
                        {messages.map((msg, i) => {
                            const hasCards = (msg.actionCards && msg.actionCards.length > 0) || (msg.ideaCards && msg.ideaCards.length > 0);
                            if (msg.role === 'user') {
                                return (
                                    <div key={i} className="lg-bubble-enter lg-bubble-user ml-auto" style={{fontSize:'11px', lineHeight:'1.6', whiteSpace:'pre-wrap'}}>
                                        {msg.content}
                                    </div>
                                );
                            }
                            // Bot message — render diagnosis text + cards + closing note
                            return (
                                <div key={i} className="lg-bubble-enter lg-bubble-bot" style={{fontSize:'11px', lineHeight:'1.6'}}>
                                    {/* Diagnosis text */}
                                    <div style={{whiteSpace:'pre-wrap'}}>
                                        {msg.content}
                                        {msg.source === 'deep' && <span className="text-[8px] text-accent ml-2 font-black">DEEP</span>}
                                    </div>

                                    {/* Action Cards */}
                                    {msg.actionCards && msg.actionCards.length > 0 && (
                                        <div>
                                            <hr className="my-2" style={{borderColor:'var(--lg-border)', opacity:0.5}}/>
                                            {msg.actionCards.map((proposal) => (
                                                <ActionCard
                                                    key={proposal.id}
                                                    proposal={proposal}
                                                    onConfirm={(p) => handleConfirmAction(p, i)}
                                                    onReject={(p) => handleRejectAction(p, i)}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* Idea Cards */}
                                    {msg.ideaCards && msg.ideaCards.length > 0 && (
                                        <div>
                                            {msg.actionCards && msg.actionCards.length > 0 && (
                                                <hr className="my-2" style={{borderColor:'var(--lg-border)', opacity:0.3}}/>
                                            )}
                                            {msg.ideaCards.map((idea) => (
                                                <IdeaCard
                                                    key={idea.id}
                                                    idea={idea}
                                                    onExplore={(ic) => handleExploreIdea(ic, i)}
                                                    onDismiss={(ic) => handleDismissIdea(ic, i)}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* Closing note */}
                                    {msg.closingNote && hasCards && (
                                        <div className="mt-2 text-[10px] italic" style={{color:'var(--lg-text-muted)'}}>
                                            {msg.closingNote}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {isGenerating && (
                            <div className="lg-bubble-bot" style={{fontSize:'11px'}}>
                                <span className="typing-dots">Thinking</span>
                            </div>
                        )}
                        <div ref={messagesEndRef}/>
                    </div>

                    {/* Example chips (shown when no messages) — 10.3: use AGENTIC_EXAMPLE_CHIPS */}
                    {messages.length === 0 && (
                        <div className="lg-chips-row">
                            {AGENTIC_EXAMPLE_CHIPS.map(q => (
                                <button key={q} className="lg-chip" onClick={() => setInput(q)}>{q}</button>
                            ))}
                        </div>
                    )}

                    {/* Input bar — 10.2: includes "Show Presets" button */}
                    <div className={`lg-input-bar flex items-center gap-2 p-2 ${isGenerating ? 'lg-processing' : ''}`}>
                        <button
                            onClick={() => setShowPresetPalette(true)}
                            title="Show Shot Presets"
                            className="flex-shrink-0 text-[9px] font-bold px-2 py-1 rounded"
                            style={{
                                background: 'rgb(var(--color-primary)/0.10)',
                                border: '1px solid rgb(var(--color-primary)/0.35)',
                                color: 'rgb(var(--color-primary))',
                            }}
                        >
                            Presets
                        </button>
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                            placeholder={brainMode === 'deep' ? 'Ask anything (Deep Brain)...' : 'Ask your director (Fast Brain)...'}
                            className="flex-1 bg-transparent text-xs outline-none text-textMain-light dark:text-textMain-dark placeholder-textMuted-light dark:placeholder-textMuted-dark"
                        />
                        <button onClick={handleSubmit} disabled={isGenerating || !input.trim()} className="lg-send-btn">
                            <Icon name="Sparkles" size={14}/>
                        </button>
                    </div>

                    {/* 10.2: PresetPalette overlay — slides in over the panel */}
                    <PresetPalette
                        isOpen={showPresetPalette}
                        onClose={() => setShowPresetPalette(false)}
                        onSelectPreset={handleSelectPreset}
                        projectSnapshot={projectSnapshot}
                    />
                </div>
            );
        };


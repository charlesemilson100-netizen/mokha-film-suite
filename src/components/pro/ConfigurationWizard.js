import { useState } from 'react';
import { StoryBlueprintEngine } from '../../engine/script';

// ── Configuration Wizard Component ──────────────────────────────────────────────

        export const ConfigurationWizard = ({ onComplete, onCancel, initialBlueprint }) => {
            const [currentStep, setCurrentStep] = useState(1);
            const [blueprint, setBlueprint] = useState(initialBlueprint || StoryBlueprintEngine.createBlueprint());
            const [validationErrors, setValidationErrors] = useState({});

            const storyTypes = ['Social Media', 'Short Film', 'Cinematic Film', 'Documentary', 'Commercial', 'Experimental'];
            const durations = ['2 min', '5 min', '10 min', '15 min', '30 min', '60 min'];
            const styles = ['Cinematic', 'Documentary', 'Comedy', 'Drama', '3D Anime', '2D Animated', 'Experimental', 'Noir', 'Sci-Fi'];
            const narrativeStructures = ['Protagonist Journey', 'Antagonist Conflict', 'Ensemble', 'Real Event Storytelling', 'Parallel Narratives'];

            const handleNext = () => {
                const newErrors = {};
                
                if (currentStep === 1 && !blueprint.storyType) {
                    newErrors.storyType = 'Story Type is required';
                } else if (currentStep === 2 && !blueprint.duration) {
                    newErrors.duration = 'Duration is required';
                } else if (currentStep === 3 && !blueprint.style) {
                    newErrors.style = 'Style is required';
                } else if (currentStep === 4 && !blueprint.narrativeStructure) {
                    newErrors.narrativeStructure = 'Narrative Structure is required';
                } else if (currentStep === 6 && !blueprint.storyIntent.trim()) {
                    newErrors.storyIntent = 'Story Intent is required';
                }

                if (Object.keys(newErrors).length > 0) {
                    setValidationErrors(newErrors);
                    return;
                }

                setValidationErrors({});
                if (currentStep < 7) {
                    setCurrentStep(currentStep + 1);
                }
            };

            const handleBack = () => {
                if (currentStep > 1) {
                    setCurrentStep(currentStep - 1);
                    setValidationErrors({});
                }
            };

            const handleSkipCharacters = () => {
                const validation = StoryBlueprintEngine.validateBlueprint(blueprint);
                if (validation.valid) {
                    onComplete(blueprint);
                } else {
                    setValidationErrors({ general: validation.errors.join(', ') });
                }
            };

            const handleComplete = () => {
                const validation = StoryBlueprintEngine.validateBlueprint(blueprint);
                if (validation.valid) {
                    onComplete(blueprint);
                } else {
                    setValidationErrors({ general: validation.errors.join(', ') });
                }
            };

            const dynamicParams = StoryBlueprintEngine.getDynamicParameters(
                blueprint.storyType,
                blueprint.duration,
                blueprint.style,
                blueprint.narrativeStructure
            );

            return (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-panel-light dark:bg-panel-dark rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-8">
                            {/* Step Indicator */}
                            <div className="mb-8">
                                <div className="flex justify-between mb-4">
                                    {[1, 2, 3, 4, 5, 6, 7].map(step => (
                                        <div key={step} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                            step === currentStep ? 'bg-primary text-black' :
                                            step < currentStep ? 'bg-emerald-600 text-white' :
                                            'bg-border-light dark:bg-border-dark text-textMuted-light dark:text-textMuted-dark'
                                        }`}>
                                            {step < currentStep ? '✓' : step}
                                        </div>
                                    ))}
                                </div>
                                <div className="text-sm text-textMuted-light dark:text-textMuted-dark">
                                    Step {currentStep} of 7
                                </div>
                            </div>

                            {/* Step 1: Story Type */}
                            {currentStep === 1 && (
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">What type of story are you writing?</h2>
                                    <p className="text-textMuted-light dark:text-textMuted-dark mb-6">Select the format that best matches your project.</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {storyTypes.map(type => (
                                            <button key={type} onClick={() => setBlueprint(StoryBlueprintEngine.updateBlueprint(blueprint, { storyType: type }))}
                                                className={`p-4 rounded-lg border-2 transition-all text-left ${
                                                    blueprint.storyType === type
                                                        ? 'border-primary bg-primary/10'
                                                        : 'border-border-light dark:border-border-dark hover:border-primary/50'
                                                }`}>
                                                <div className="font-semibold">{type}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Duration */}
                            {currentStep === 2 && (
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">What's your target duration?</h2>
                                    <p className="text-textMuted-light dark:text-textMuted-dark mb-6">This helps us recommend appropriate scene counts.</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        {durations.map(duration => (
                                            <button key={duration} onClick={() => setBlueprint(StoryBlueprintEngine.updateBlueprint(blueprint, { duration }))}
                                                className={`p-4 rounded-lg border-2 transition-all font-semibold ${
                                                    blueprint.duration === duration
                                                        ? 'border-primary bg-primary/10'
                                                        : 'border-border-light dark:border-border-dark hover:border-primary/50'
                                                }`}>
                                                {duration}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Style */}
                            {currentStep === 3 && (
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">What's your visual style?</h2>
                                    <p className="text-textMuted-light dark:text-textMuted-dark mb-6">Choose the aesthetic that matches your vision.</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {styles.map(style => (
                                            <button key={style} onClick={() => setBlueprint(StoryBlueprintEngine.updateBlueprint(blueprint, { style }))}
                                                className={`p-4 rounded-lg border-2 transition-all text-left ${
                                                    blueprint.style === style
                                                        ? 'border-primary bg-primary/10'
                                                        : 'border-border-light dark:border-border-dark hover:border-primary/50'
                                                }`}>
                                                <div className="font-semibold">{style}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Narrative Structure */}
                            {currentStep === 4 && (
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">What's your narrative framework?</h2>
                                    <p className="text-textMuted-light dark:text-textMuted-dark mb-6">This shapes your story's structure and pacing.</p>
                                    <div className="grid grid-cols-1 gap-3">
                                        {narrativeStructures.map(structure => (
                                            <button key={structure} onClick={() => setBlueprint(StoryBlueprintEngine.updateBlueprint(blueprint, { narrativeStructure: structure }))}
                                                className={`p-4 rounded-lg border-2 transition-all text-left ${
                                                    blueprint.narrativeStructure === structure
                                                        ? 'border-primary bg-primary/10'
                                                        : 'border-border-light dark:border-border-dark hover:border-primary/50'
                                                }`}>
                                                <div className="font-semibold">{structure}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 5: Dynamic Parameters */}
                            {currentStep === 5 && (
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">Additional Details</h2>
                                    <p className="text-textMuted-light dark:text-textMuted-dark mb-6">Customize based on your {blueprint.storyType}.</p>
                                    <div className="space-y-4">
                                        {Object.entries(dynamicParams).map(([key, param]) => (
                                            <div key={key}>
                                                <label className="block text-sm font-semibold mb-2 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                                                {param.type === 'select' && (
                                                    <select value={blueprint.dynamicParameters[key] || ''} onChange={(e) => setBlueprint(StoryBlueprintEngine.updateBlueprint(blueprint, {
                                                        dynamicParameters: { ...blueprint.dynamicParameters, [key]: e.target.value }
                                                    }))}
                                                        className="w-full px-3 py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark">
                                                        <option value="">Select...</option>
                                                        {param.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                    </select>
                                                )}
                                                {param.type === 'text' && (
                                                    <input type="text" placeholder={param.placeholder} value={blueprint.dynamicParameters[key] || ''} onChange={(e) => setBlueprint(StoryBlueprintEngine.updateBlueprint(blueprint, {
                                                        dynamicParameters: { ...blueprint.dynamicParameters, [key]: e.target.value }
                                                    }))}
                                                        className="w-full px-3 py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark" />
                                                )}
                                                {param.type === 'boolean' && (
                                                    <input type="checkbox" checked={blueprint.dynamicParameters[key] || false} onChange={(e) => setBlueprint(StoryBlueprintEngine.updateBlueprint(blueprint, {
                                                        dynamicParameters: { ...blueprint.dynamicParameters, [key]: e.target.checked }
                                                    }))}
                                                        className="w-4 h-4" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 6: Story Intent */}
                            {currentStep === 6 && (
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">What's your story's intent?</h2>
                                    <p className="text-textMuted-light dark:text-textMuted-dark mb-6">Describe the emotional or thematic goal.</p>
                                    <textarea value={blueprint.storyIntent} onChange={(e) => setBlueprint(StoryBlueprintEngine.updateBlueprint(blueprint, { storyIntent: e.target.value }))}
                                        placeholder="e.g., Make the audience feel hopeful about climate change..."
                                        className="w-full px-4 py-3 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark h-32 resize-none"
                                    />
                                    <div className="text-xs text-textMuted-light dark:text-textMuted-dark mt-2">
                                        {blueprint.storyIntent.length}/500 characters
                                    </div>
                                </div>
                            )}

                            {/* Step 7: Character Creation (Optional) */}
                            {currentStep === 7 && (
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">Add Characters (Optional)</h2>
                                    <p className="text-textMuted-light dark:text-textMuted-dark mb-6">Define key characters for your story. You can add more later in the script builder.</p>
                                    <div className="space-y-4">
                                        {blueprint.characters && blueprint.characters.map((char, idx) => (
                                            <div key={idx} className="p-4 bg-input-light dark:bg-input-dark rounded-lg border border-border-light dark:border-border-dark space-y-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <input type="text" placeholder="Character name" value={char.name || ''}
                                                        onChange={(e) => {
                                                            const newChars = [...blueprint.characters];
                                                            newChars[idx].name = e.target.value;
                                                            setBlueprint(StoryBlueprintEngine.updateBlueprint(blueprint, { characters: newChars }));
                                                        }}
                                                        className="px-3 py-2 rounded bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark text-sm"
                                                    />
                                                    <input type="text" placeholder="Archetype (e.g., Hero, Mentor)" value={char.archetype || ''}
                                                        onChange={(e) => {
                                                            const newChars = [...blueprint.characters];
                                                            newChars[idx].archetype = e.target.value;
                                                            setBlueprint(StoryBlueprintEngine.updateBlueprint(blueprint, { characters: newChars }));
                                                        }}
                                                        className="px-3 py-2 rounded bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark text-sm"
                                                    />
                                                </div>
                                                <textarea placeholder="Description" value={char.description || ''}
                                                    onChange={(e) => {
                                                        const newChars = [...blueprint.characters];
                                                        newChars[idx].description = e.target.value;
                                                        setBlueprint(StoryBlueprintEngine.updateBlueprint(blueprint, { characters: newChars }));
                                                    }}
                                                    className="w-full px-3 py-2 rounded bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark text-sm h-16 resize-none"
                                                />
                                                <button onClick={() => {
                                                    const newChars = blueprint.characters.filter((_, i) => i !== idx);
                                                    setBlueprint(StoryBlueprintEngine.updateBlueprint(blueprint, { characters: newChars }));
                                                }} className="text-red-500 hover:text-red-600 text-sm font-semibold">
                                                    Remove Character
                                                </button>
                                            </div>
                                        ))}
                                        <button onClick={() => {
                                            const newChars = [...(blueprint.characters || []), { name: '', archetype: '', description: '' }];
                                            setBlueprint(StoryBlueprintEngine.updateBlueprint(blueprint, { characters: newChars }));
                                        }} className="w-full px-4 py-2 rounded-lg border border-dashed border-primary text-primary hover:bg-primary/10 text-sm font-semibold">
                                            + Add Character
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Validation Errors */}
                            {Object.keys(validationErrors).length > 0 && (
                                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                                    <p className="text-red-500 text-sm font-semibold">
                                        {validationErrors.general || Object.values(validationErrors)[0]}
                                    </p>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="flex gap-3 mt-8">
                                <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-panel-light dark:hover:bg-panel-dark">
                                    Cancel
                                </button>
                                {currentStep > 1 && (
                                    <button onClick={handleBack} className="px-4 py-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-panel-light dark:hover:bg-panel-dark">
                                        Back
                                    </button>
                                )}
                                <div className="flex-1" />
                                {currentStep < 7 && (
                                    <button onClick={handleNext} disabled={currentStep === 5 ? false : !blueprint[['storyType', 'duration', 'style', 'narrativeStructure', '', 'storyIntent'][currentStep - 1]]}
                                        className="px-6 py-2 rounded-lg bg-primary text-black font-semibold hover:bg-primaryHover disabled:opacity-50 disabled:cursor-not-allowed">
                                        Next
                                    </button>
                                )}
                                {currentStep === 7 && (
                                    <>
                                        <button onClick={handleSkipCharacters} className="px-6 py-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-panel-light dark:hover:bg-panel-dark">
                                            Skip & Continue
                                        </button>
                                        <button onClick={handleComplete} className="px-6 py-2 rounded-lg bg-primary text-black font-semibold hover:bg-primaryHover">
                                            Create Blueprint
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        };


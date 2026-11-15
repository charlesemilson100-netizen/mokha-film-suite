import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { BrainStatusIndicator } from './components/director/BrainStatusIndicator';
import { CheatSheetOverlay } from './components/director/CheatSheetOverlay';
import { CritiqueBadge } from './components/director/CritiqueBadge';
import { LocalAssistant } from './components/director/LocalAssistant';
import { ConfigurationWizard } from './components/pro/ConfigurationWizard';
import { ProScriptBuilder } from './components/pro/ProScriptBuilder';
import { StoryEngineModal } from './components/story/StoryEngineModal';
import { ApiSettingsModal } from './components/ui/ApiSettingsModal';
import { CinematicThemePicker } from './components/ui/CinematicThemePicker';
import { CommandPalette } from './components/ui/CommandPalette';
import { useConfirm } from './components/ui/ConfirmDialog';
import { Icon } from './components/ui/Icon';
import { PerformanceSettingsModal } from './components/ui/PerformanceSettingsModal';
import { ShotFilmstrip } from './components/ui/ShotFilmstrip';
import { useToast } from './components/ui/ToastProvider';
import { PromptHistoryPanel, useFavorites, usePromptHistory } from './components/ui/history';
import { AspectRatioPreview, AutoSaveIndicator, QuickCopyBtn, ScriptHighlighter, StatusBadge, Tooltip, VisualSelect } from './components/ui/widgets';
import { ACCENTS, ANTI_TROPES, APERTURES, ASPECT_RATIOS, CINEMATIC_GRAMMAR, DESIGNER_PRESETS, DIRECTOR_RULES, OPTIONS, PLATFORM_RESTRICTIONS, PRO_SHOT_PRESETS, SANITIZE_DICT, SHOT_PRESETS, THEMES, TRANSLATIONS } from './data/catalog';
import { GLOSSARY_DATA, LIBRARY_CATEGORIES, PROMPT_LIBRARY_DATA, getRandomWord } from './data/library';
import { CHAIN_SCENE_PRESETS, DEFAULT_LOCATIONS, DEFAULT_MYSTYLE_PRESETS, DEFAULT_SHORTCUTS, DIRECTOR_STYLES, labelTooltips } from './data/presets';
import { CINEMATIC_THEMES } from './data/themes';
import { APP_VERSION } from './data/version';
import { DeepBrain, FastBrain } from './engine/directorBrain';
import { ImageBridge, VideoBridge } from './engine/llm';
import { FightClub } from './components/fight/FightClub';
import { buildFightScene, fighterNames } from './engine/fightPrompt';
import { LocalAIEngine, generateChainDeltaPrompt, generatePromptText, magicEnhanceSubject, shotifyPrompt } from './engine/prompt';
import { checkStorageQuota } from './engine/storage';

export default function App() {
          const addToast = useToast();
          const { confirm: appConfirm, ConfirmUI } = useConfirm();

          // Remove the instant HTML splash as soon as React mounts
          useEffect(() => { if (window.__removeSplash) window.__removeSplash(); }, []);

          // ── Update Checker ──────────────────────────────────────────────
          const [updateAvailable, setUpdateAvailable] = React.useState(null); // null | { version, url }
          useEffect(() => {
              // Check once per session, skip if checked recently (within 24h)
              const lastCheck = localStorage.getItem('mokha_update_check');
              const now = Date.now();
              if (lastCheck && now - parseInt(lastCheck) < 86400000) return;
              // Fetch latest version from GitHub releases (replace with your own endpoint)
              fetch('https://api.github.com/repos/mokhafilm/suite/releases/latest', { signal: AbortSignal.timeout(5000) })
                  .then(r => r.json())
                  .then(data => {
                      localStorage.setItem('mokha_update_check', String(now));
                      const latest = (data.tag_name || '').replace(/^v/, '');
                      if (latest && latest !== APP_VERSION) {
                          setUpdateAvailable({ version: latest, url: data.html_url || 'https://github.com/mokhafilm/suite/releases' });
                      }
                  })
                  .catch(() => { /* silent fail — no internet or repo not set up yet */ });
          }, []);

          // ── Storage Quota Warning ───────────────────────────────────────
          const [storageWarning, setStorageWarning] = React.useState(null);
          useEffect(() => {
              const quota = checkStorageQuota();
              if (quota.pct >= 80) setStorageWarning(quota);
          }, []);

          // ── Offline Detection ───────────────────────────────────────────
          const [isOffline, setIsOffline] = React.useState(!navigator.onLine);
          useEffect(() => {
              const goOffline = () => setIsOffline(true);
              const goOnline = () => setIsOffline(false);
              window.addEventListener('offline', goOffline);
              window.addEventListener('online', goOnline);
              return () => { window.removeEventListener('offline', goOffline); window.removeEventListener('online', goOnline); };
          }, []);
          const [isAppLoading, setIsAppLoading] = useState(() => localStorage.getItem('mokha_skip_tutorial') !== 'true');
          const [skipTutorial, setSkipTutorial] = useState(() => localStorage.getItem('mokha_skip_tutorial') === 'true');
          const [currentTip, setCurrentTip] = useState(0);
          const [isSidebarOpen, setIsSidebarOpen] = useState(true);
          const [isFocusMode, setIsFocusMode] = useState(false);
          const [showLightingStudio, setShowLightingStudio] = useState(false);

          // ── Onboarding Tour ─────────────────────────────────────────────
          const [showOnboardingTour, setShowOnboardingTour] = React.useState(() => !localStorage.getItem('mokha_onboarding_done'));
          const [onboardingStep, setOnboardingStep] = React.useState(0);
          const ONBOARDING_STEPS = [
              { title: 'Welcome to MOKHA FILM Suite v2.0 🎬', body: 'The professional AI director toolkit for building cinematic shot sequences, scenes, and full movie scripts — 100% offline.', icon: 'Clapperboard', highlight: null },
              { title: 'Build Your Shot', body: 'Use the left panel to set your shot type, lens, lighting, camera movement, and more. The prompt preview updates in real time.', icon: 'Camera', highlight: null },
              { title: 'Quick Shot Presets', body: 'Click any preset to instantly fill all visual parameters. Right-click a preset for more options like applying to all shots or saving as custom.', icon: 'Wand2', highlight: null },
              { title: 'Scene Manager', body: 'Organize shots into scenes on the right panel. Right-click any shot or scene for a full action menu — director styles, color tags, move, duplicate and more.', icon: 'Film', highlight: null },
              { title: 'MOKHA Agent 🧠', body: 'Click the floating button (bottom right) to open your AI director assistant. Ask it anything about your project — or use the new Director Brain tab for deep analysis.', icon: 'Brain', highlight: null },
          ];
          const dismissOnboarding = () => { setShowOnboardingTour(false); localStorage.setItem('mokha_onboarding_done', 'true'); };

          // ── Feature 1: Cinematic Theme ──────────────────────────────────
          const [cinematicTheme, setCinematicTheme] = useState(() => localStorage.getItem('mokha_cinematic_theme') || 'gold');
          const applyCinematicTheme = (theme) => {
              setCinematicTheme(theme.id);
              localStorage.setItem('mokha_cinematic_theme', theme.id);
              document.documentElement.style.setProperty('--color-primary', theme.primary);
              document.documentElement.style.setProperty('--color-primary-hover', theme.hover);
              document.documentElement.style.setProperty('--color-accent', theme.accent);
              document.documentElement.style.setProperty('--color-accent-hover', theme.accentHover);
          };
          useEffect(() => {
              const saved = CINEMATIC_THEMES.find(t => t.id === cinematicTheme);
              if (saved) applyCinematicTheme(saved);
          }, []);

          // ── Feature 3: Prompt History ───────────────────────────────────
          const { history: promptHistory, addToHistory: addPromptToHistory, clearHistory: clearPromptHistory } = usePromptHistory();
          const [showHistoryPanel, setShowHistoryPanel] = useState(false);

          // ── Feature 4: Favorites ────────────────────────────────────────
          const { favorites, toggleFavorite, isFavorite, updateFavorites } = useFavorites();
          const [showFavoritesPanel, setShowFavoritesPanel] = useState(false);

          // ── Feature 6: Command Palette ──────────────────────────────────
          const [showCommandPalette, setShowCommandPalette] = useState(false);
          const [showThemePicker, setShowThemePicker] = useState(false);
          useEffect(() => {
              const handler = (e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowCommandPalette(p => !p); }
              };
              window.addEventListener('keydown', handler);
              return () => window.removeEventListener('keydown', handler);
          }, []);

          // ── Feature 8: Auto-save indicator ─────────────────────────────
          const [isSaving, setIsSaving] = useState(false);
          const [lastSaved, setLastSaved] = useState('just now');
          const triggerSave = () => {
              setIsSaving(true);
              setTimeout(() => { setIsSaving(false); setLastSaved(new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})); }, 600);
          };

          // Theme Color Setup
          const [themeColor, setThemeColor] = useState(() => localStorage.getItem('mokha_theme_color') || 'blue');
          useEffect(() => {
              localStorage.setItem('mokha_theme_color', themeColor);
              const selected = THEMES.find(t => t.id === themeColor) || THEMES[0];
              document.documentElement.style.setProperty('--color-primary', selected.primary);
              document.documentElement.style.setProperty('--color-primary-hover', selected.hover);
          }, [themeColor]);

          const [accentColor, setAccentColor] = useState(() => localStorage.getItem('mokha_accent_color') || 'indigo');
          useEffect(() => {
              localStorage.setItem('mokha_accent_color', accentColor);
              const selected = ACCENTS.find(a => a.id === accentColor) || ACCENTS[0];
              document.documentElement.style.setProperty('--color-accent', selected.color);
              document.documentElement.style.setProperty('--color-accent-hover', selected.hover);
          }, [accentColor]);

          const [uiStyle, setUiStyle] = useState(() => { try { return localStorage.getItem('mokha_ui_style') || 'default'; } catch { return 'default'; } });
          useEffect(() => { try { localStorage.setItem('mokha_ui_style', uiStyle); } catch {} }, [uiStyle]);

          const TIPS = [
              // Features
              { type:'feature', icon:'⛓', title:'Chain Mode', desc:'Define your scene once. Add shots by typing only the action. 80% less typing.' },
              { type:'feature', icon:'⚡', title:'Shotify', desc:'One click compresses your prompt for Runway, Veo 3, KLING or Seedance.' },
              { type:'feature', icon:'🎬', title:'Story Wizard 2.0', desc:'From raw idea to full cinematic project in 12 guided steps.' },
              { type:'feature', icon:'🔒', title:'Continuity Lock', desc:'Lock lighting, camera or style across all shots. Change once, update everywhere.' },
              { type:'feature', icon:'🎭', title:'Genre DNA', desc:'Analyzes all your shots and reveals your film\'s genre fingerprint.' },
              { type:'feature', icon:'📊', title:'Shot Rhythm', desc:'Detects monotonous pacing and flags runs of identical shot durations.' },
              { type:'feature', icon:'🔍', title:'Find & Replace', desc:'Replace any parameter across all shots in one scene, project, or all projects.' },
              { type:'feature', icon:'🎨', title:'27 Chain Presets', desc:'Golden Hour Dialogue, Noir Interrogation, Cyberpunk Street and 24 more.' },
              { type:'feature', icon:'🧙', title:'Right-Click Menu', desc:'16 instant actions on any shot — move, mutate, tag, lock, send to project.' },
              { type:'feature', icon:'🔮', title:'Prompt Mutation', desc:'Generate 3 cinematic variations of any shot — Intimate, Epic, Abstract.' },
              // Tips
              { type:'tip', icon:'💡', title:'Pro Tip', desc:'85mm lens + Studio Lighting + OTS = the perfect dialogue shot. Every time.' },
              { type:'tip', icon:'💡', title:'Pro Tip', desc:'Dutch Angle signals psychological unease. Use it sparingly — overuse kills the effect.' },
              { type:'tip', icon:'💡', title:'Pro Tip', desc:'Dolly In on a Close-Up creates intimacy. Dolly Out on a Wide Shot creates isolation.' },
              { type:'tip', icon:'💡', title:'Pro Tip', desc:'Golden Hour lasts ~20 minutes. Villeneuve shot almost every exterior in Blade Runner 2049 during this window.' },
              { type:'tip', icon:'💡', title:'Pro Tip', desc:'Specificity beats length. "ARRI Alexa, 85mm, Golden Hour, Dolly In" outperforms a 200-word vague description.' },
              { type:'tip', icon:'💡', title:'Pro Tip', desc:'Handheld creates urgency and realism. Static/Tripod creates authority and control.' },
              { type:'tip', icon:'💡', title:'Pro Tip', desc:'Every scene needs a Want and an Obstacle. No obstacle = no scene.' },
              // Quotes
              { type:'quote', icon:'🎬', title:'Stanley Kubrick', desc:'"If it can be written, or thought, it can be filmed."' },
              { type:'quote', icon:'🎬', title:'Christopher Nolan', desc:'"I approach each project with the same question: what is the cinematic experience I want the audience to have?"' },
              { type:'quote', icon:'🎬', title:'Denis Villeneuve', desc:'"Cinema is a mirror by which we often see ourselves."' },
              { type:'quote', icon:'🎬', title:'David Fincher', desc:'"Every frame is a painting. Every cut is a decision."' },
              { type:'quote', icon:'🎬', title:'Wong Kar-wai', desc:'"I don\'t plan. I discover. The camera is my pen."' },
          ];

          useEffect(() => { 
              if (!isAppLoading) return;
              const timer = setTimeout(() => setIsAppLoading(false), 4500); 
              const interval = setInterval(() => { setCurrentTip(prev => (prev + 1) % TIPS.length); }, 2200);
              return () => { clearTimeout(timer); clearInterval(interval); };
          }, [isAppLoading]);

          // Theme / Light-Dark Mode Setup
          const [isDarkMode, setIsDarkMode] = useState(() => {
              const saved = localStorage.getItem('mokha_theme');
              return saved !== null ? saved === 'true' : true;
          });
          
          useEffect(() => {
              localStorage.setItem('mokha_theme', isDarkMode);
              if (isDarkMode) document.documentElement.classList.add('dark');
              else document.documentElement.classList.remove('dark');
          }, [isDarkMode]);

          // Language Setup
          const [lang, setLang] = useState(() => localStorage.getItem('mokha_lang') || 'en');
          const t = (key) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en'][key] || key;
          useEffect(() => { localStorage.setItem('mokha_lang', lang); }, [lang]);

          // Workspace Setup
          const [workspace, setWorkspace] = useState(() => localStorage.getItem('mokha_workspace') || 'DEFAULT');
          useEffect(() => { localStorage.setItem('mokha_workspace', workspace); }, [workspace]);

          const [currentView, setCurrentView] = useState('dashboard');
          const [projects, setProjects] = useState(() => {
              const saved = localStorage.getItem('mokha_projects');
              let parsed = null;
              if (saved) { try { parsed = JSON.parse(saved); } catch(e) {} }
              if (Array.isArray(parsed) && parsed.length > 0) return parsed;
              return [{ id: 'default_proj', name: 'My First Project', description: 'A cinematic sequence.', tags: [], defaultParams: {}, scenes: [{ id: Date.now(), name: `Scene 1 - ${getRandomWord()}`, shots: [] }] }];
          });
          
          const [myStylePresets, setMyStylePresets] = useState(() => { const saved = localStorage.getItem('mokha_mystyle_presets'); return saved ? JSON.parse(saved) : DEFAULT_MYSTYLE_PRESETS; });
          const [myStyle, setMyStyle] = useState(() => { const saved = localStorage.getItem('mokha_my_style'); return saved ? JSON.parse(saved) : { template: DEFAULT_MYSTYLE_PRESETS[0].template, customModifiers: DEFAULT_MYSTYLE_PRESETS[0].customModifiers, strictDefaults: { ...DEFAULT_MYSTYLE_PRESETS[0].strictDefaults } }; });
          const [globalCharacters, setGlobalCharacters] = useState(() => { const saved = localStorage.getItem('mokha_global_chars'); return saved ? JSON.parse(saved) : []; });
          const [globalLocations, setGlobalLocations] = useState(() => { const saved = localStorage.getItem('mokha_global_locs'); return saved ? JSON.parse(saved) : DEFAULT_LOCATIONS; });
          const [customPresets, setCustomPresets] = useState(() => { const saved = localStorage.getItem('mokha_custom_presets'); return saved ? JSON.parse(saved) : []; });
          const [globalVoiceStyles, setGlobalVoiceStyles] = useState(() => { const saved = localStorage.getItem('mokha_global_voices'); return saved ? JSON.parse(saved) : []; });
          const [activeDirectorRules, setActiveDirectorRules] = useState(() => { const saved = localStorage.getItem('mokha_director_rules'); return saved ? JSON.parse(saved) : []; });

          const [customPromptLibrary, setCustomPromptLibrary] = useState(() => { const saved = localStorage.getItem('mokha_custom_prompt_library'); return saved ? JSON.parse(saved) : []; });
          const [showPromptLibraryModal, setShowPromptLibraryModal] = useState(false);
          const [promptLibraryModel, setPromptLibraryModel] = useState("All");
          const [promptLibraryCategory, setPromptLibraryCategory] = useState("All");
          const [promptLibrarySearch, setPromptLibrarySearch] = useState("");
          const [promptLibraryTab, setPromptLibraryTab] = useState("library");
          const [newCustomPrompt, setNewCustomPrompt] = useState({ title: '', category: 'UGC', text: '' });
          useEffect(() => { localStorage.setItem('mokha_custom_prompt_library', JSON.stringify(customPromptLibrary)); }, [customPromptLibrary]);

          const [activeProjectId, setActiveProjectId] = useState(projects[0]?.id || 'default_proj');
          const [editingProjectDefaults, setEditingProjectDefaults] = useState(null);
          const [showMyStyleModal, setShowMyStyleModal] = useState(false);
          const [showGlossaryModal, setShowGlossaryModal] = useState(false);
          const [showGlobalCharModal, setShowGlobalCharModal] = useState(false);
          const [showGlobalLocModal, setShowGlobalLocModal] = useState(false);
          const [showGlobalVoiceModal, setShowGlobalVoiceModal] = useState(false);
          const [showDirectorMenu, setShowDirectorMenu] = useState(false);
          const [showFightClub, setShowFightClub] = useState(false);
          const [fightDraft, setFightDraft] = useState(null);
          const skipFightClear = useRef(false);

          // ── Pro Script Builder Import Detection ─────────────────────────
          useEffect(() => {
              const checkForImportedShots = () => {
                  const importData = localStorage.getItem('proScriptBuilder_importShots');
                  if (importData) {
                      try {
                          const { scenes, projectTitle, timestamp } = JSON.parse(importData);
                          
                          // Check if import is recent (within last 5 minutes)
                          if (Date.now() - timestamp < 300000) {
                              // Create new project with imported scenes
                              const newProjectId = `proj_${Date.now()}`;
                              const newProject = {
                                  id: newProjectId,
                                  name: projectTitle,
                                  description: 'Imported from Pro Script Builder',
                                  tags: ['Pro Script'],
                                  defaultParams: {},
                                  scenes: scenes
                              };
                              
                              setProjects(prev => [...prev, newProject]);
                              setActiveProjectId(newProjectId);
                              
                              // Clear the import data
                              localStorage.removeItem('proScriptBuilder_importShots');
                              
                              // Calculate total shots
                              const totalShots = scenes.reduce((sum, scene) => sum + scene.shots.length, 0);
                              
                              // Show success message
                              addToast(`✓ Imported ${scenes.length} scene${scenes.length !== 1 ? 's' : ''} with ${totalShots} shot${totalShots !== 1 ? 's' : ''} from Pro Script Builder!`, 'success');
                          } else {
                              // Import data is too old, clear it
                              localStorage.removeItem('proScriptBuilder_importShots');
                          }
                      } catch (e) {
                          console.error('Failed to import shots:', e);
                          localStorage.removeItem('proScriptBuilder_importShots');
                      }
                  }
              };
              
              // Check on mount and when returning from Pro Script Builder
              checkForImportedShots();
              
              // Also check when window gains focus (user returns from Pro Script Builder)
              const handleFocus = () => checkForImportedShots();
              window.addEventListener('focus', handleFocus);
              
              return () => window.removeEventListener('focus', handleFocus);
          }, []);

          const [isEditingTransitions, setIsEditingTransitions] = useState(false);
          const [activeInputTab, setActiveInputTab] = useState('visual');

          // ── Director Intelligence Suite: Brain Mode ─────────────────────
          const [brainMode, setBrainMode] = useState(() => localStorage.getItem('brainMode') || 'fast');
          const deepBrainEngineRef = React.useRef(null);
          const [deepBrainLoadingProgress, setDeepBrainLoadingProgress] = useState(0);
          const [deepBrainModelId, setDeepBrainModelId] = useState(() => localStorage.getItem('deepBrainModelId') || DeepBrain.SUPPORTED_MODELS[0].id);

          const handleBrainModeChange = async (newMode) => {
              if (newMode === 'deep') {
                  const model = DeepBrain.SUPPORTED_MODELS.find(m => m.id === deepBrainModelId) || DeepBrain.SUPPORTED_MODELS[0];
                  const confirmed = await appConfirm(`Enable Deep Brain Mode?\n\nThis will download "${model.label}" (${model.size}) to your browser. This may take a minute on first load.\n\nOnce loaded, the model stays cached for future sessions.`, { confirmLabel: 'Enable Deep Brain', confirmClass: 'bg-accent hover:bg-accentHover text-white' });
                  if (!confirmed) return;
                  setBrainMode('deep-loading');
                  setDeepBrainLoadingProgress(0);
                  try {
                      await DeepBrain.init(deepBrainModelId, (pct) => setDeepBrainLoadingProgress(pct), deepBrainEngineRef);
                      setBrainMode('deep');
                      localStorage.setItem('brainMode', 'deep');
                      addToast('🧠 Deep Brain activated!', 'success');
                  } catch(e) {
                      setBrainMode('fast');
                      addToast(`Deep Brain failed: ${e.message}`, 'error');
                  }
              } else {
                  await DeepBrain.unload(deepBrainEngineRef);
                  setBrainMode('fast');
                  localStorage.setItem('brainMode', 'fast');
                  addToast('⚡ Fast Brain mode active', 'success');
              }
          };

          // ── Director Intelligence Suite: Keyboard Power Mode ────────────
          const [showCheatSheet, setShowCheatSheet] = React.useState(false);
          const [keyboardBannerDismissed, setKeyboardBannerDismissed] = React.useState(() => !!localStorage.getItem('kbShortcutsBannerSeen'));
          const selectedShotIndexRef = React.useRef(null);

          // ── Director Intelligence Suite: Global Keyboard Shortcuts ──────
          React.useEffect(() => {
              const handler = (e) => {
                  const tag = document.activeElement?.tagName?.toLowerCase();
                  const isInput = tag === 'input' || tag === 'textarea' || tag === 'select' || document.activeElement?.isContentEditable;
                  const isMod = e.ctrlKey || e.metaKey;
                  const key = e.key;

                  // Modifier shortcuts — always active
                  if (isMod && !e.shiftKey && key === 'k') { e.preventDefault(); setShowCommandPalette(true); return; }
                  if (isMod && !e.shiftKey && key === 'd') { e.preventDefault(); window.dispatchEvent(new CustomEvent('mokha:openDirectorBrain')); return; }
                  if (isMod && !e.shiftKey && key === 'z') { e.preventDefault(); handleUndo && handleUndo(); return; }
                  if (isMod && e.shiftKey && key === 'z') { e.preventDefault(); handleRedo && handleRedo(); return; }
                  if (isMod && !e.shiftKey && key === 'e') { e.preventDefault(); handleExportJSON && handleExportJSON(); return; }

                  // Single-key shortcuts — suppressed when input focused
                  if (isInput) return;

                  if (key === 'Escape') { setShowCheatSheet(false); setShowCommandPalette(false); return; }
                  if (key === '?') { setShowCheatSheet(p => !p); return; }
                  if (key === 'n' || key === 'N') { /* new shot */ return; }
              };
              document.addEventListener('keydown', handler);
              return () => document.removeEventListener('keydown', handler);
          }, []);

          const activeProject = projects.find(p => p.id === activeProjectId) || projects[0] || { id: 'fallback', name: 'Recovery Project', scenes: [] };
          const scenes = activeProject?.scenes || [];

          // ── Director Intelligence Suite: Shot Critique ──────────────────
          const [critiqueAnnotations, setCritiqueAnnotations] = React.useState({});
          const [dismissedAnnotations, setDismissedAnnotations] = React.useState({});

          const runFullCritique = React.useCallback(() => {
              const newAnnotations = {};
              const allShots = (scenes || []).flatMap(sc => sc.shots || []);
              (scenes || []).forEach(sc => {
                  (sc.shots || []).forEach((shot, idx) => {
                      const prevShot = idx > 0 ? sc.shots[idx - 1] : null;
                      const notes = FastBrain.critiqueShot(shot, prevShot, sc.shots);
                      if (notes.length > 0) newAnnotations[shot.id] = notes;
                  });
              });
              setCritiqueAnnotations(newAnnotations);
              if (Object.keys(newAnnotations).length > 0 && !localStorage.getItem('critiqueExplainerSeen')) {
                  localStorage.setItem('critiqueExplainerSeen', 'true');
                  addToast('💡 Shot Critique active — look for ⚠ and 💡 badges on your shots', 'info');
              }
          }, [scenes]);

          React.useEffect(() => {
              const timer = setTimeout(runFullCritique, 300);
              return () => clearTimeout(timer);
          }, [scenes, runFullCritique]);

          const dismissAnnotation = React.useCallback((annotationId) => {
              setDismissedAnnotations(prev => ({ ...prev, [annotationId]: true }));
          }, []);

          // ── Director Intelligence Suite: Ghost Card Suggestions ─────────
          const [ghostCardSuggestions, setGhostCardSuggestions] = React.useState({});

          const getNextShotSuggestion = React.useCallback((shots) => {
              if (!shots || shots.length === 0) return null;
              const lastShot = shots[shots.length - 1];
              const shotType = lastShot?.selections?.shotType || '';
              // Resolve abbreviation
              const abbrev = CINEMATIC_GRAMMAR[shotType] ? shotType : (CINEMATIC_GRAMMAR[shotType] || null);
              const fullNameAbbrev = CINEMATIC_GRAMMAR[shotType];
              if (typeof fullNameAbbrev === 'string') {
                  // It's a full-name key mapping to abbreviation
                  const transition = CINEMATIC_GRAMMAR[fullNameAbbrev];
                  if (transition && typeof transition === 'object') return transition;
              } else if (fullNameAbbrev && typeof fullNameAbbrev === 'object') {
                  return fullNameAbbrev;
              }
              return null;
          }, []);

          React.useEffect(() => {
              const newSuggestions = {};
              (scenes || []).forEach(sc => {
                  newSuggestions[sc.id] = getNextShotSuggestion(sc.shots || []);
              });
              setGhostCardSuggestions(newSuggestions);
          }, [scenes, getNextShotSuggestion]);

          // ── Performance Settings ────────────────────────────────────────
          const [showSettings, setShowSettings] = useState(false);
          const [perfSettings, setPerfSettings] = useState(() => {
              const defaults = {
                  ramLimit: 8192,
                  cpuThreads: Math.max(1, Math.floor((navigator.hardwareConcurrency || 4) / 2)),
                  vramLimit: 4,
                  renderQuality: 'Balanced',
                  autoOptimize: true
              };
              try {
                  const saved = {
                      ramLimit: parseInt(localStorage.getItem('perf_ram_limit')) || null,
                      cpuThreads: parseInt(localStorage.getItem('perf_cpu_threads')) || null,
                      vramLimit: parseInt(localStorage.getItem('perf_vram_limit')) || null,
                      renderQuality: localStorage.getItem('perf_render_quality') || null,
                      autoOptimize: localStorage.getItem('perf_auto_optimize') !== null ? localStorage.getItem('perf_auto_optimize') === 'true' : null
                  };
                  const hasAnySaved = Object.values(saved).some(v => v !== null);
                  if (hasAnySaved) {
                      return {
                          ramLimit: saved.ramLimit || defaults.ramLimit,
                          cpuThreads: saved.cpuThreads || defaults.cpuThreads,
                          vramLimit: saved.vramLimit || defaults.vramLimit,
                          renderQuality: saved.renderQuality || defaults.renderQuality,
                          autoOptimize: saved.autoOptimize !== null ? saved.autoOptimize : defaults.autoOptimize
                      };
                  }
              } catch(e) {}
              return defaults;
          });

          // Apply render quality class on load and change
          useEffect(() => {
              document.body.classList.remove('perf-low', 'perf-balanced', 'perf-high', 'perf-ultra');
              document.body.classList.add('perf-' + perfSettings.renderQuality.toLowerCase());
          }, [perfSettings.renderQuality]);
          const [activeOutputTab, setActiveOutputTab] = useState('sequence');

          // ── Debounced localStorage saves (prevents write-storm on rapid state changes) ──
          const _saveTimer = useRef({});
          const debouncedSave = (key, value, delay = 600) => {
              clearTimeout(_saveTimer.current[key]);
              _saveTimer.current[key] = setTimeout(() => {
                  try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) { console.warn('localStorage write failed:', key, e); }
              }, delay);
          };

          useEffect(() => { debouncedSave('mokha_projects', projects); triggerSave(); }, [projects]);
          const [stories, setStories] = useState(() => { try { const s = localStorage.getItem('mokha_stories'); return s ? JSON.parse(s) : []; } catch(e) { return []; } });
          useEffect(() => { debouncedSave('mokha_stories', stories); }, [stories]);
          useEffect(() => { debouncedSave('mokha_mystyle_presets', myStylePresets); }, [myStylePresets]);
          useEffect(() => { debouncedSave('mokha_my_style', myStyle); }, [myStyle]);
          useEffect(() => { debouncedSave('mokha_global_chars', globalCharacters); }, [globalCharacters]);
          useEffect(() => { debouncedSave('mokha_global_locs', globalLocations); }, [globalLocations]);
          useEffect(() => { debouncedSave('mokha_custom_presets', customPresets); }, [customPresets]);
          
          const [activeSceneId, setActiveSceneId] = useState(scenes[0]?.id);
          useEffect(() => { if (!scenes.find(s => s.id === activeSceneId)) setActiveSceneId(scenes[0]?.id); }, [scenes, activeSceneId]);
          const activeScene = scenes.find(s => s.id === activeSceneId) || scenes[0] || { id: 'fallback_scene', name: 'Recovery Scene', shots: [] };
          const shots = activeScene?.shots || [];

          const [subject, setSubject] = useState("");
          const [selections, setSelections] = useState({ shotType: "", shotStyle: "", camera: "", lens: "", aperture: "f/2.8", angle: "", lighting: "", movement: "", actionSpeed: "", duration: "", transition: "", filmStock: "", aspectRatio: "--ar 16:9" });
          const [sfx, setSfx] = useState("");
          const [bgm, setBgm] = useState("");
          const [negativePrompt, setNegativePrompt] = useState("");
          const [dialogues, setDialogues] = useState([]);
          const [prompt, setPrompt] = useState("");
          const [shotifyMode, setShotifyMode] = useState(false); // Shotify compression toggle
          const [shotTags, setShotTags] = useState("");
          const [activePresetName, setActivePresetName] = useState(null);
          const [copied, setCopied] = useState(false);
          const [copiedParams, setCopiedParams] = useState(null);
          const [copiedFeedbackId, setCopiedFeedbackId] = useState(null);
          const [isGenerating, setIsGenerating] = useState(false);
          const [promptMode, setPromptMode] = useState("video"); 
          const [aiModel, setAiModel] = useState("Nano Banana 2");
          const [videoPlatform, setVideoPlatform] = useState(() => localStorage.getItem('mokha_video_platform') || 'Standard');
          const [referenceImages, setReferenceImages] = useState([]);
          const [mentionState, setMentionState] = useState({ active: false, text: '', start: 0, end: 0 });
          const [detectedCharSuggestions, setDetectedCharSuggestions] = React.useState([]); // smart char detection
          const [editingIndex, setEditingIndex] = useState(-1);
          const [expandedShotIndex, setExpandedShotIndex] = useState(-1);
          const [showMovieModal, setShowMovieModal] = useState(false);
          const [movieCopied, setMovieCopied] = useState(false);
          const [draggedDialogueIndex, setDraggedDialogueIndex] = useState(null);
          const [dragOverDialogueIndex, setDragOverDialogueIndex] = useState(null);
          const [draggedShotIndex, setDraggedShotIndex] = useState(null);
          const [dragOverShotIndex, setDragOverShotIndex] = useState(null);
          const [activePresetCategory, setActivePresetCategory] = useState("All");
          const [projectSearchQuery, setProjectSearchQuery] = useState("");
          const [shotSearchQuery, setShotSearchQuery] = useState("");
          const [isExportingPDF, setIsExportingPDF] = useState(false);
          const [selectedShots, setSelectedShots] = useState([]);
          const [showBulkEditModal, setShowBulkEditModal] = useState(false);
          const [bulkSelections, setBulkSelections] = useState({});
          
          // Keyboard Shortcuts
          const [shortcuts, setShortcuts] = useState(() => { const saved = localStorage.getItem('mokha_shortcuts'); return saved ? JSON.parse(saved) : DEFAULT_SHORTCUTS; });
          const [showShortcutsModal, setShowShortcutsModal] = useState(false);
          const [recordingShortcutFor, setRecordingShortcutFor] = useState(null);

          // WebLLM / WebGPU Local AI Engine
          const [llmEngine, setLlmEngine] = useState(null);
          const [llmLoadingProgress, setLlmLoadingProgress] = useState(null);
          const [isLlmReady, setIsLlmReady] = useState(false);
          const [isMultimodal, setIsMultimodal] = useState(false);
          const [webLlmLibReady, setWebLlmLibReady] = useState(!!window.webllm);

          // Effect to reliably detect when the WebLLM library is ready
          useEffect(() => {
              const handleWebLlmReady = () => {
                  setWebLlmLibReady(true);
              };
              if (window.webllm) {
                  handleWebLlmReady(); // Already loaded
              } else {
                  // Listen for the custom event dispatched by the script tag
                  window.addEventListener('webllm-ready', handleWebLlmReady, { once: true });
              }
              return () => window.removeEventListener('webllm-ready', handleWebLlmReady);
          }, []);

          const [isPlaying, setIsPlaying] = useState(false);
          const [playheadTime, setPlayheadTime] = useState(0);

          const [showExportModal, setShowExportModal] = useState(false);
          const [pdfConfig, setPdfConfig] = useState({
              layout: 'list',
              showPrompt: true,
              showTags: true,
              showParams: true,
              studioLogo: null,
              title: '',
              description: ''
          });
          
          const [inlineEditingIndex, setInlineEditingIndex] = useState(-1);
          const [inlineEditText, setInlineEditText] = useState("");
          
          // Dialogue Duration Auto-Calculator
          const totalDialogueWords = dialogues.reduce((acc, d) => acc + (d.text.trim() ? d.text.trim().split(/\s+/).length : 0), 0);
          const currentDurationMatch = selections.duration?.match(/([\d.]+)/);
          const currentDurationNum = currentDurationMatch ? parseFloat(currentDurationMatch[1]) : 0;
          const requiredDurationNum = Math.ceil(totalDialogueWords / 2.5);
          const showDurationWarning = totalDialogueWords > 0 && currentDurationNum > 0 && currentDurationNum < requiredDurationNum;
          
          // Real-time Platform Restrictions Check
          const activePlatformRestrictions = PLATFORM_RESTRICTIONS[videoPlatform] || { forbidden: [] };
          const foundViolations = activePlatformRestrictions.forbidden.filter(word => subject.toLowerCase().includes(word));

          const [showScriptParserModal, setShowScriptParserModal] = useState(false);
          const [scriptParserText, setScriptParserText] = useState("");

          const [showStoryEngineModal, setShowStoryEngineModal] = useState(false);
          const [showProModeWizard, setShowProModeWizard] = useState(false);
          const [showProModeEntryModal, setShowProModeEntryModal] = useState(false);
          const [proModeBlueprint, setProModeBlueprint] = useState(null);
          const [proModeScript, setProModeScript] = useState(null);
          const [showVideoPreviewModal, setShowVideoPreviewModal] = useState(false);
          const [showApiSettingsModal, setShowApiSettingsModal] = useState(false);
          const [videoPreviewState, setVideoPreviewState] = useState({ status: 'idle', url: null, error: null, prompt: '', provider: '' });
          const [videoSettings, setVideoSettings] = useState(() => ({ provider: 'runway', apiKey: '', duration: 5, ratio: '16:9', ...VideoBridge.loadSettings() }));

          const saveVideoSettings = (patch) => {
              setVideoSettings(prev => { const next = { ...prev, ...patch }; VideoBridge.saveSettings(next); return next; });
          };

          const handleVideoPreview = async (promptText) => {
              if (!promptText?.trim()) return;
              setVideoPreviewState({ status: 'generating', url: null, error: null, prompt: promptText, provider: videoSettings.provider });
              setShowVideoPreviewModal(true);
              try {
                  const result = await VideoBridge.generate(promptText, videoSettings);
                  setVideoPreviewState({ status: 'done', url: result.url, error: null, prompt: promptText, provider: videoSettings.provider });
              } catch(err) {
                  setVideoPreviewState({ status: 'error', url: null, error: err.message, prompt: promptText, provider: videoSettings.provider });
              }
          };

          // ── Image Generation State ──────────────────────────────────────────
          const [showImageGenModal, setShowImageGenModal] = useState(false);
          const [imageGenState, setImageGenState] = useState({ status: 'idle', url: null, error: null, prompt: '', provider: '', revisedPrompt: '' });
          const [imageSettings, setImageSettings] = useState(() => ({ provider: 'openai', apiKey: '', ratio: '16:9', size: '1792x1024', ...ImageBridge.loadSettings() }));

          const saveImageSettings = (patch) => {
              setImageSettings(prev => { const next = { ...prev, ...patch }; ImageBridge.saveSettings(next); return next; });
          };

          const handleImageGenerate = async (promptText) => {
              if (!promptText?.trim()) return;
              setImageGenState({ status: 'generating', url: null, error: null, prompt: promptText, provider: imageSettings.provider, revisedPrompt: '' });
              setShowImageGenModal(true);
              try {
                  const result = await ImageBridge.generate(promptText, imageSettings);
                  setImageGenState({ status: 'done', url: result.url, error: null, prompt: promptText, provider: imageSettings.provider, revisedPrompt: result.revisedPrompt || '' });
              } catch(err) {
                  setImageGenState({ status: 'error', url: null, error: err.message, prompt: promptText, provider: imageSettings.provider, revisedPrompt: '' });
              }
          };
          const [showPlotHoleModal, setShowPlotHoleModal] = useState(false);
          const [plotHoleResults, setPlotHoleResults] = useState([]);

          const runPlotHoleDetector = () => {
              const allScenes = projects.flatMap(p =>
                  (p.scenes || []).map(s => ({ ...s, projectName: p.name }))
              );
              const issues = [];

              // Build character tracker across all shots
              const charLastSeen = {};   // charName -> { scene, shot, status }
              const charStatus = {};     // charName -> 'alive' | 'dead'
              const locationTracker = [];
              const timeTracker = [];

              const DAY_LIGHTS = ['Natural Daylight', 'Golden Hour', 'High Key (Bright)', 'Studio Lighting'];
              const NIGHT_LIGHTS = ['Low Key (Dark/Moody)', 'Neon / Cyberpunk', 'Blue Hour', 'Harsh Shadows'];
              const DEATH_WORDS = ['dies', 'dead', 'killed', 'murder', 'death', 'deceased', 'falls dead', 'shot dead', 'stabbed'];
              const REVIVAL_WORDS = ['alive', 'survives', 'wakes up', 'resurrect', 'returns'];

              allScenes.forEach((scene, sceneIdx) => {
                  const shots = scene.shots || [];
                  let prevShot = null;
                  let prevLighting = null;

                  shots.forEach((shot, shotIdx) => {
                      const subj = (shot.subject || '').toLowerCase();
                      const sel = shot.selections || {};
                      const shotLabel = `[${scene.projectName}] Scene "${scene.name}" — Shot ${shotIdx + 1}`;

                      // --- 1. CHARACTER DEATH & RESURRECTION ---
                      // Detect character names from dialogues
                      const charNames = (shot.dialogues || []).map(d => d.character).filter(Boolean);
                      // Also extract from subject text (capitalized words)
                      const subjectChars = (shot.subject || '').match(/[A-Z][a-z]+/g) || [];
                      const allChars = [...new Set([...charNames, ...subjectChars])];

                      allChars.forEach(char => {
                          const charLower = char.toLowerCase();
                          // Check if this shot kills the character
                          const isDying = DEATH_WORDS.some(w => subj.includes(w) && subj.includes(charLower));
                          const isReviving = REVIVAL_WORDS.some(w => subj.includes(w) && subj.includes(charLower));

                          if (isDying) charStatus[charLower] = 'dead';
                          if (isReviving) charStatus[charLower] = 'alive';

                          // If character was marked dead and appears again without revival
                          if (charStatus[charLower] === 'dead' && !isDying && !isReviving) {
                              if (charLastSeen[charLower]?.status === 'dead') {
                                  issues.push({
                                      type: 'Character',
                                      severity: 'Critical',
                                      scene: scene.name,
                                      shot: shotIdx + 1,
                                      project: scene.projectName,
                                      msg: `"${char}" appears in ${shotLabel} but was previously killed. Missing resurrection or timeline explanation.`
                                  });
                              }
                          }
                          charLastSeen[charLower] = { scene: scene.name, shot: shotIdx + 1, status: charStatus[charLower] || 'alive' };
                      });

                      // --- 2. DAY/NIGHT CONFLICT ---
                      if (prevLighting) {
                          const curLight = sel.lighting || '';
                          const prevDay = DAY_LIGHTS.some(l => prevLighting.includes(l.split(' ')[0]));
                          const curNight = NIGHT_LIGHTS.some(l => curLight.includes(l.split(' ')[0]));
                          const prevNight = NIGHT_LIGHTS.some(l => prevLighting.includes(l.split(' ')[0]));
                          const curDay = DAY_LIGHTS.some(l => curLight.includes(l.split(' ')[0]));
                          if ((prevDay && curNight) || (prevNight && curDay)) {
                              issues.push({
                                  type: 'Lighting',
                                  severity: 'High',
                                  scene: scene.name,
                                  shot: shotIdx + 1,
                                  project: scene.projectName,
                                  msg: `${shotLabel}: Lighting jumps from "${prevLighting}" to "${curLight}" — unexplained day/night shift.`
                              });
                          }
                      }
                      if (sel.lighting) prevLighting = sel.lighting;

                      // --- 3. MISSING TRANSITION ---
                      if (prevShot && (!sel.transition || sel.transition === '' || sel.transition === 'None')) {
                          issues.push({
                              type: 'Transition',
                              severity: 'Low',
                              scene: scene.name,
                              shot: shotIdx + 1,
                              project: scene.projectName,
                              msg: `${shotLabel}: No transition set between Shot ${shotIdx} and Shot ${shotIdx + 1}.`
                          });
                      }

                      // --- 4. DIALOGUE TOO LONG FOR DURATION ---
                      if (shot.dialogues?.length) {
                          const words = shot.dialogues.reduce((acc, d) => acc + (d.text?.trim().split(/\s+/).length || 0), 0);
                          const durMatch = (sel.duration || '').match(/([\d.]+)/);
                          const dur = durMatch ? parseFloat(durMatch[1]) : 0;
                          const needed = Math.ceil(words / 2.5);
                          if (dur > 0 && dur < needed) {
                              issues.push({
                                  type: 'Dialogue',
                                  severity: 'High',
                                  scene: scene.name,
                                  shot: shotIdx + 1,
                                  project: scene.projectName,
                                  msg: `${shotLabel}: ${words} dialogue words need ~${needed}s but shot duration is only ${dur}s.`
                              });
                          }
                      }

                      // --- 5. EMPTY SUBJECT ---
                      if (!shot.subject || shot.subject.trim().length < 5) {
                          issues.push({
                              type: 'Content',
                              severity: 'Medium',
                              scene: scene.name,
                              shot: shotIdx + 1,
                              project: scene.projectName,
                              msg: `${shotLabel}: Shot has no subject description.`
                          });
                      }

                      // --- 6. CAMERA STYLE BREAK ---
                      if (prevShot) {
                          const styleCams = ['VHS Camcorder', 'CCTV Camera', 'Polaroid', 'Vintage 35mm Film'];
                          const prevCam = prevShot.selections?.camera || '';
                          const curCam = sel.camera || '';
                          if (styleCams.includes(prevCam) && ['ARRI Alexa 65', 'RED V-Raptor', 'Sony A7S III'].includes(curCam)) {
                              issues.push({
                                  type: 'Camera',
                                  severity: 'Medium',
                                  scene: scene.name,
                                  shot: shotIdx + 1,
                                  project: scene.projectName,
                                  msg: `${shotLabel}: Camera switches from stylized "${prevCam}" to cinematic "${curCam}" — visual style break.`
                              });
                          }
                      }

                      // --- 7. DUPLICATE CONSECUTIVE SUBJECTS ---
                      if (prevShot && prevShot.subject && shot.subject) {
                          const prevWords = new Set(prevShot.subject.toLowerCase().split(/\s+/).filter(w => w.length > 4));
                          const curWords = shot.subject.toLowerCase().split(/\s+/).filter(w => w.length > 4);
                          const overlap = curWords.filter(w => prevWords.has(w)).length;
                          const similarity = prevWords.size > 0 ? overlap / prevWords.size : 0;
                          if (similarity > 0.8 && prevShot.subject.length > 20) {
                              issues.push({
                                  type: 'Duplicate',
                                  severity: 'Low',
                                  scene: scene.name,
                                  shot: shotIdx + 1,
                                  project: scene.projectName,
                                  msg: `${shotLabel}: Subject is very similar to the previous shot — possible duplicate.`
                              });
                          }
                      }

                      prevShot = shot;
                  });
              });

              setPlotHoleResults(issues);
              setShowPlotHoleModal(true);
          };
          const [initialStoryId, setInitialStoryId] = useState(null);
          const [isRevising, setIsRevising] = useState(false);
          const [storyData, setStoryData] = useState({
              act1: { character: '', world: '', incident: '' },
              act2: { obstacles: '', midpoint: '', stakes: '' },
              act3: { climax: '', resolution: '', aftermath: '' },
              theme: { theme: '', message: '', tone: '' },
              dramatic: { genre: '', visualStyle: '', villain: '', centralConflict: '', symbolicObject: '', emotionalArc: '', worldRules: '' },
              characters: [
                { id: 1, name: 'Main Character', motivation: '', fear: '', contradiction: '', x: 50, y: 50 },
              ],
              relationships: [],
              sceneDependencies: [
                { id: 'sd_act1_world', label: 'Act 1 — World Building', requires: [] },
                { id: 'sd_act1_incident', label: 'Act 1 — Inciting Incident', requires: ['sd_act1_world'] },
                { id: 'sd_act2_obstacles', label: 'Act 2 — Rising Action', requires: ['sd_act1_incident'] },
                { id: 'sd_act2_midpoint', label: 'Act 2 — Midpoint', requires: ['sd_act2_obstacles'] },
                { id: 'sd_act2_stakes', label: 'Act 2 — Stakes Raised', requires: ['sd_act2_midpoint'] },
                { id: 'sd_act3_climax', label: 'Act 3 — Climax', requires: ['sd_act2_stakes'] },
                { id: 'sd_act3_resolution', label: 'Act 3 — Resolution', requires: ['sd_act3_climax'] },
                { id: 'sd_act3_aftermath', label: 'Act 3 — Final Image', requires: ['sd_act3_resolution'] },
              ],
          });

          // Smart Negative Prompt Auto-Suggestions
          const activeNegativeSuggestions = (() => {
              const lowerSubject = subject.toLowerCase();
              const suggestions = new Set();
              if (/\b(hand|hands|fingers|holding|pointing|grabbing|touching)\b/.test(lowerSubject)) {
                  ['mutated limbs', 'extra fingers', 'malformed hands', 'poorly drawn hands'].forEach(s => suggestions.add(s));
              }
              if (/\b(crowd|people|group|audience|army|mob|stadium)\b/.test(lowerSubject)) {
                  ['cloned faces', 'mangled bodies', 'blurry background characters', 'merged bodies'].forEach(s => suggestions.add(s));
              }
              if (/\b(text|sign|writing|letters|words|newspaper|poster)\b/.test(lowerSubject)) {
                  ['gibberish', 'misspelled', 'bad typography', 'garbled text'].forEach(s => suggestions.add(s));
              }
              if (/\b(face|portrait|eyes|smile|profile)\b/.test(lowerSubject)) {
                  ['asymmetrical face', 'cross-eyed', 'deformed eyes', 'disfigured'].forEach(s => suggestions.add(s));
              }
              const currentNegatives = negativePrompt.toLowerCase();
              return Array.from(suggestions).filter(s => !currentNegatives.includes(s.toLowerCase()));
          })();

          // Smart Artifact Risk Analyzer
          const artifactRisk = (() => {
              let risk = 0;
              let reasons = [];
              
              if (['Orbit', 'Drone Fly-Through', 'Crane Shot'].includes(selections.movement)) { risk += 25; reasons.push("Complex Camera"); }
              else if (['Pan Left', 'Pan Right', 'Tilt Up', 'Tilt Down', 'Tracking / Follow', 'Zoom In', 'Zoom Out', 'Handheld / Shaky'].includes(selections.movement)) { risk += 10; }
              if (['Speed Ramp', 'Time-Lapse', 'Stop Motion'].includes(selections.actionSpeed)) { risk += 25; reasons.push("Extreme Speed"); }
              else if (['Slow Motion', 'Ultra Slow Motion', '2x Fast Forward'].includes(selections.actionSpeed)) { risk += 15; reasons.push("Altered Time"); }
              if (['Morph', 'Glitch', 'Whip Pan', 'Zoom Transition'].includes(selections.transition)) { risk += 20; reasons.push("Complex Transition"); }
              if (dialogues.length > 1) { risk += 25; reasons.push("Multiple Subjects"); }
              else if (dialogues.length === 1) { risk += 10; }
              
              const wordCount = subject.trim().split(/\s+/).length;
              if (wordCount > 30) { risk += 15; reasons.push("High Prompt Density"); }
              
              const score = Math.min(100, Math.max(0, risk));
              let level = 'Low'; let color = 'bg-green-500'; let textColor = 'text-green-500 dark:text-green-400'; let textWarning = "Low risk of visual artifacts. Safe for most AI models.";
              if (score >= 60) { level = 'High'; color = 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'; textColor = 'text-red-500 dark:text-red-400'; textWarning = "High risk of morphing or anatomical issues. Consider simplifying camera motion or character count."; }
              else if (score >= 30) { level = 'Medium'; color = 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'; textColor = 'text-amber-500 dark:text-amber-400'; textWarning = "Moderate risk. Complex motion or composition might cause minor AI hallucinations."; }
              return { score, level, color, textColor, textWarning, reasons };
          })();

          const handleUseLibraryPrompt = (promptText) => {
              setSubject(promptText);
              setShowPromptLibraryModal(false);
              setTimeout(() => handleLocalSuggest(), 100);
          };

          const handleSaveCustomPrompt = () => {
              if (!newCustomPrompt.title || !newCustomPrompt.text) return;
              setCustomPromptLibrary(prev => [...prev, {
                  id: `c_prompt_${Date.now()}`,
                  title: newCustomPrompt.title,
                  cat: newCustomPrompt.category,
                  text: newCustomPrompt.text,
                  models: ["Any"],
                  prec: { "Any": "High" },
                  isCustom: true
              }]);
              setPromptLibraryTab('library');
              setPromptLibraryCategory('Custom');
              setNewCustomPrompt({ title: '', category: 'UGC', text: '' });
          };

          const deleteCustomLibraryPrompt = (id) => { if(confirm("Delete this custom prompt?")) setCustomPromptLibrary(prev => prev.filter(p => p.id !== id)); };
          
          const handleMagicEnhance = async () => {
              if (!subject.trim()) { addToast("Enter a basic subject first.", 'warning', 3000); return; }
              const local = magicEnhanceSubject(subject, { platform: videoPlatform, model: aiModel });
              if (local.skipped) {
                  if (local.changed) setSubject(local.text);
                  addToast('The scene is already specific. Magic Enhance left it alone.', 'info', 3000);
                  return;
              }
              setIsGenerating(true);
              try {
                  if (isLlmReady && llmEngine) {
                      const target = videoPlatform === 'Seedance' ? 'Seedance' : (aiModel === 'GPT 2.6' || aiModel === 'GPT V2' ? 'GPT 2.6' : videoPlatform);
                      const p = `Rewrite this into one cinematic action sentence for ${target}. Keep the same event. Add a concrete light or motion detail only if the line is vague. No labels, no quotes, no lists, no aspect ratio, no camera brand list, no symbols. Original: ${local.text}`;
                      const reply = await llmEngine.chat.completions.create({ messages: [{ role: "user", content: p }], temperature: 0.4 });
                      const next = magicEnhanceSubject(reply.choices[0].message.content, { platform: videoPlatform, model: aiModel });
                      setSubject(next.text || local.text);
                  } else {
                      setSubject(local.text);
                  }
              } catch(e) { console.error(e); setSubject(local.text); }
              finally { setIsGenerating(false); }
          };

          const applyFightClub = (draft) => {
              const scene = buildFightScene(draft);
              updateActiveProjectScenes(prev => [...prev, scene]);
              setActiveSceneId(scene.id);
              setCurrentView('editor');
              setGlobalCharacters(prev => {
                  const additions = [];
                  (draft.fighters || []).forEach(fighter => {
                      fighterNames(fighter).forEach(name => {
                          if (!prev.some(char => char.name === name) && !additions.some(char => char.name === name)) {
                              additions.push({ id: `fc_${name.replace(/\s+/g, '_')}`, name, role: fighter.role, appearance: fighter.dress === 'different' ? 'Different clothes and a unique face' : 'Same clothes, unique face, not a clone' });
                          }
                      });
                  });
                  return [...prev, ...additions];
              });
              setShowFightClub(false);
              addToast(`${scene.name} added as a scene with ${scene.shots.length} shot${scene.shots.length === 1 ? '' : 's'}.`, 'success');
          };

          const getStatusColor = (status) => {
              switch(status) {
                  case 'Completed': return 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30';
                  case 'Rendering': return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30';
                  case 'Approved': return 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30';
                  case 'Ready': return 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30';
                  default: return 'bg-slate-50 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-500/30';
              }
          };

          const [newCharData, setNewCharData] = useState({ name: '', role: '', appearance: '' });
          const [newLocData, setNewLocData] = useState({ name: '', description: '' });
          const [newVoiceData, setNewVoiceData] = useState({ name: '', description: '', fx: '', age: '', genre: '', accent: '', language: '' });

          const textareaRef = useRef(null);
          const fileInputRef = useRef(null);
          const referenceFileInputRef = useRef(null);

          const [historyPast, setHistoryPast] = useState([]);
          const [historyFuture, setHistoryFuture] = useState([]);

          // Apply Workspace Logic Effects
          useEffect(() => { 
              if (workspace === 'DESIGNER') {
                  setPromptMode('image');
                  setActiveInputTab('visual');
              }
          }, [workspace]);

          useEffect(() => { if (promptMode === 'image' && (activeInputTab === 'motion' || activeInputTab === 'audio')) setActiveInputTab('visual'); }, [promptMode, activeInputTab]);

          const getPanelClass = () => {
              if (uiStyle === 'mr-re') {
                  let base = "lg-panel flex flex-col shrink-0 ";
                  if (workspace === 'FILMMAKER') return base + "transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_15px_30px_-5px_rgb(var(--color-primary)/0.3)] hover:border-primary/60 ";
                  if (workspace === 'DESIGNER') return base + "transition-all duration-300 hover:border-primary/30 ";
                  return base + "hover-panel transition-all ";
              }
              let base = "rounded-xl flex flex-col shrink-0 ";
              if (uiStyle === 'glass') {
                  base += "bg-white/60 dark:bg-black/60 backdrop-blur-xl border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)] border ";
              } else {
                  base += "bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark shadow-sm ";
              }
              if (workspace === 'FILMMAKER') return base + "transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_15px_30px_-5px_rgb(var(--color-primary)/0.3)] hover:border-primary/60 ";
              if (workspace === 'DESIGNER') return base + "transition-all duration-300 hover:border-primary/30 ";
              return base + "hover-panel transition-all "; // Default
          };

          const saveToHistory = () => { setHistoryPast(prev => [...prev, { scenes: JSON.parse(JSON.stringify(scenes)) }]); setHistoryFuture([]); };
          const handleUndo = () => {
              if (historyPast.length === 0) return;
              const previous = historyPast[historyPast.length - 1];
              setHistoryPast(prev => prev.slice(0, -1));
              setHistoryFuture(prev => [{ scenes: JSON.parse(JSON.stringify(scenes)) }, ...prev]);
              setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, scenes: previous.scenes } : p));
          };
          const handleRedo = () => {
              if (historyFuture.length === 0) return;
              const next = historyFuture[0];
              setHistoryFuture(prev => prev.slice(1));
              setHistoryPast(prev => [...prev, { scenes: JSON.parse(JSON.stringify(scenes)) }]);
              setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, scenes: next.scenes } : p));
          };

          const updateActiveProjectScenes = (scenesUpdater) => {
              saveToHistory();
              setProjects(prev => prev.map(p => { if (p.id === activeProjectId) return { ...p, scenes: typeof scenesUpdater === 'function' ? scenesUpdater(p.scenes) : scenesUpdater }; return p; }));
          };
          const updateActiveShots = (updater) => {
              updateActiveProjectScenes(prevScenes => prevScenes.map(scene => { if (scene.id === activeSceneId) return { ...scene, shots: typeof updater === 'function' ? updater(scene.shots) : updater }; return scene; }));
          };

          const [chainMode, setChainMode] = React.useState(false);
          const [chainBase, setChainBase] = React.useState({ subject: '', camera: '', lens: '', lighting: '', shotStyle: '', angle: '', filmStock: '', movement: '', actionSpeed: '', duration: '', transition: '', character: '', characterDesc: '', location: '', locationDesc: '' });
          const chainShotCount = React.useMemo(() => {
              if (!chainMode) return 0;
              return shots.filter(s => s._chainDelta !== undefined).length;
          }, [chainMode, shots]);

          useEffect(() => {
              // Chain Mode preview:
              // Shot 1 = full prompt
              // Shots 2+ = delta only (what differs from chain base), no character name
              if (chainMode && chainShotCount > 0 && subject.trim()) {
                  const delta = generateChainDeltaPrompt(subject, selections, sfx, bgm, dialogues, promptMode, chainBase, videoPlatform, negativePrompt);
                  setPrompt(delta);
                  return;
              }
              if (fightDraft) {
                  setPrompt(buildFightPrompt(fightDraft));
                  return;
              }
              const directorRules = activeDirectorRules.map(id => DIRECTOR_RULES.find(rule => rule.id === id)).filter(Boolean);
              const raw = generatePromptText(subject, selections, sfx, bgm, dialogues, promptMode, aiModel, myStyle, globalCharacters, globalLocations, globalVoiceStyles, negativePrompt, videoPlatform, { directorRules, compact: shotifyMode });
              setPrompt(raw);
          }, [subject, selections, sfx, bgm, dialogues, promptMode, aiModel, myStyle, globalCharacters, globalLocations, globalVoiceStyles, negativePrompt, videoPlatform, editingIndex, shotifyMode, chainMode, chainShotCount, chainBase, activeDirectorRules, fightDraft]);
          useEffect(() => { setExpandedShotIndex(-1); setIsEditingTransitions(false); setSelectedShots([]); }, [activeSceneId]);

          const getSceneDuration = () => {
            let total = 0;
            shots.forEach(s => { if (s.mode === 'video' && s.selections?.duration) { const match = s.selections.duration.match(/(\d+(?:\.\d+)?)/); if (match) total += parseFloat(match[1]); } });
            return total.toFixed(1);
          };

          const getSceneDurationNum = () => {
            let total = 0;
            shots.forEach(s => { if (s.mode === 'video' && s.selections?.duration) { const match = s.selections.duration.match(/(\d+(?:\.\d+)?)/); if (match) total += parseFloat(match[1]); } });
            return total;
          };

          const Waveform = ({ seed }) => {
              const bars = Array.from({ length: 8 }).map((_, i) => {
                  const h = 20 + Math.random() * 80;
                  return <rect key={i} x={i * 4} y={50 - h/2} width="2" height={h} fill="currentColor" className="opacity-70" />;
              });
              return (
                  <svg viewBox="0 0 32 100" className="w-full h-full text-indigo-500 overflow-visible" preserveAspectRatio="none">
                      {bars}
                  </svg>
              );
          };

          const handleReferenceUpload = (e) => {
            const files = Array.from(e.target.files);
            if (referenceImages.length + files.length > 17) { addToast("Maximum of 17 reference images allowed.", 'warning', 3000); return; }
            files.forEach(file => {
                if (!file.type.startsWith('image/')) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                    setReferenceImages(prev => {
                        const newId = `Image_${Date.now()}_${Math.floor(Math.random()*1000)}`;
                        return [...prev, { id: newId, data: event.target.result, mimeType: file.type }];
                    });
                };
                reader.readAsDataURL(file);
            });
            e.target.value = null;
          };

          const removeReferenceImage = (id) => setReferenceImages(prev => prev.filter(img => img.id !== id));

          const handleSubjectChange = (e) => {
            if (!skipFightClear.current) setFightDraft(null);
            const val = e.target.value; setSubject(val);
            const cursor = e.target.selectionStart; const textBefore = val.slice(0, cursor);
            const match = /(?:^|\s)@([^@\s]*)$/.exec(textBefore);
            if (match) setMentionState({ active: true, text: match[1], start: cursor - match[1].length - 1, end: cursor });
            else setMentionState({ active: false, text: '', start: 0, end: 0 });

            // ── Smart character detection ──────────────────────────────
            // Detect patterns like: "Jean says", "Maria asks", "Tom replies", "Alex tells"
            const DIALOGUE_VERBS = /\b(says?|asks?|tells?|replies|replied|answers?|answered|shouts?|whispers?|screams?|cries?|laughs?|sighs?|mutters?|declares?|announces?|responds?|calls?|yells?|speaks?|talks?|explains?|argues?|insists?|admits?|confesses?|warns?|begs?|pleads?|demands?)\b/i;
            const namePattern = /\b([A-Z][a-z]{1,20})\s+(?:says?|asks?|tells?|replies|replied|answers?|answered|shouts?|whispers?|screams?|cries?|laughs?|sighs?|mutters?|declares?|announces?|responds?|calls?|yells?|speaks?|talks?|explains?|argues?|insists?|admits?|confesses?|warns?|begs?|pleads?|demands?)\b/g;
            const found = [];
            let m;
            while ((m = namePattern.exec(val)) !== null) {
                const name = m[1];
                // Skip common non-name words
                const skip = ['The','A','An','He','She','It','They','We','I','You','This','That','Then','When','After','Before','While','As'];
                if (!skip.includes(name) && !globalCharacters.find(c => c.name === name) && !found.includes(name)) {
                    found.push(name);
                }
            }
            setDetectedCharSuggestions(found);
          };

          const handleSubjectBlur = () => { setTimeout(() => { setMentionState(prev => ({ ...prev, active: false })); }, 200); };

          const handleSanitizePrompt = () => {
              let newSubject = subject;
              foundViolations.forEach(word => {
                  const safeWord = SANITIZE_DICT[word.toLowerCase()];
                  if (safeWord) {
                      const strictRegex = new RegExp(`\\b${word}\\b`, 'gi');
                      if (strictRegex.test(newSubject)) {
                          newSubject = newSubject.replace(strictRegex, safeWord);
                      } else {
                          newSubject = newSubject.replace(new RegExp(word, 'gi'), safeWord);
                      }
                  }
              });
              setSubject(newSubject);
          };

          const insertMention = (charName) => {
            const formattedCharName = '@' + charName.replace(/\s+/g, '');
            const newText = subject.substring(0, mentionState.start) + formattedCharName + ' ' + subject.substring(mentionState.end);
            setSubject(newText); setMentionState({ active: false, text: '', start: 0, end: 0 });
            if (textareaRef.current) {
              textareaRef.current.focus();
              setTimeout(() => { textareaRef.current.selectionStart = mentionState.start + formattedCharName.length + 1; textareaRef.current.selectionEnd = mentionState.start + formattedCharName.length + 1; }, 0);
            }
          };

          const addGlobalCharacter = () => { if (!newCharData.name.trim()) return; setGlobalCharacters(prev => [...prev, { id: `char_${Date.now()}`, ...newCharData }]); setNewCharData({ name: '', role: '', appearance: '' }); };
          const removeGlobalCharacter = async (id) => { if (await appConfirm("Delete this character from your library?")) setGlobalCharacters(prev => prev.filter(c => c.id !== id)); };
          const updateGlobalCharacter = (id, field, value) => { setGlobalCharacters(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c)); };

          const addGlobalLocation = () => { if (!newLocData.name.trim()) return; setGlobalLocations(prev => [...prev, { id: `loc_${Date.now()}`, ...newLocData }]); setNewLocData({ name: '', description: '' }); };
          const removeGlobalLocation = async (id) => { if (await appConfirm("Delete this location?")) setGlobalLocations(prev => prev.filter(c => c.id !== id)); };
          const updateGlobalLocation = (id, field, value) => { setGlobalLocations(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c)); };

          const addGlobalVoice = () => { if (!newVoiceData.name.trim()) return; setGlobalVoiceStyles(prev => [...prev, { id: `voice_${Date.now()}`, ...newVoiceData }]); setNewVoiceData({ name: '', description: '', fx: '', age: '', genre: '', accent: '', language: '' }); };
          const removeGlobalVoice = async (id) => { if (await appConfirm("Delete this voice?")) setGlobalVoiceStyles(prev => prev.filter(c => c.id !== id)); };
          const updateGlobalVoice = (id, field, value) => { setGlobalVoiceStyles(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c)); };

          const handleSelectChange = (key, value) => { setSelections(prev => ({ ...prev, [key]: value })); setActivePresetName(null); };

          const handlePresetClick = (preset) => {
              if (activePresetName === preset.name) {
                  setActivePresetName(null);
                  setSelections(prev => {
                      const newSelections = { ...prev };
                      Object.keys(preset.selections).forEach(k => { if (newSelections[k] === preset.selections[k]) newSelections[k] = ""; });
                      return newSelections;
                  });
              } else {
                  setActivePresetName(preset.name);
                  setSelections(prev => ({ ...prev, ...preset.selections }));
              }
          };
          const handleCopyParams = (params, sourceId) => { setCopiedParams(params); setCopiedFeedbackId(sourceId); setTimeout(() => setCopiedFeedbackId(null), 2000); };
          const handlePasteParams = () => { if (!copiedParams) return; setSelections(copiedParams.selections); setSfx(copiedParams.sfx); setBgm(copiedParams.bgm); setActivePresetName(null); };

          const handleSaveAsPreset = () => {
            const presetName = window.prompt("Enter a name for your new preset:");
            if (presetName && presetName.trim()) setCustomPresets(prev => [...prev, { id: `preset_${Date.now()}`, name: presetName.trim(), icon: "Star", selections: { ...selections } }]);
          };
          const deleteCustomPreset = async (e, id) => { e.stopPropagation(); if (await appConfirm("Delete this custom preset?")) setCustomPresets(prev => prev.filter(p => p.id !== id)); };

          const clearForm = () => { setSubject(""); setSelections({ shotType: "", shotStyle: "", camera: "", lens: "", aperture: "f/2.8", angle: "", lighting: "", movement: "", actionSpeed: "", duration: "", transition: "", filmStock: "", aspectRatio: "--ar 16:9" }); setSfx(""); setBgm(""); setDialogues([]); setActivePresetName(null); setShotTags(""); setNegativePrompt(""); };

          const createNewScene = () => {
            if (scenes.length >= 35) { addToast("Max scenes reached.", 'warning', 3000); return; }
            const newSceneId = Date.now();
            updateActiveProjectScenes(prev => [...prev, { id: newSceneId, name: `Scene ${scenes.length + 1} - ${getRandomWord()}`, shots: [] }]);
            setActiveSceneId(newSceneId); setEditingIndex(-1); clearForm();
          };
          const renameScene = (id, newName) => { updateActiveProjectScenes(prev => prev.map(s => s.id === id ? { ...s, name: newName } : s)); };
          const duplicateScene = (id) => {
              updateActiveProjectScenes(prev => {
                  const idx = prev.findIndex(s => s.id === id);
                  if (idx === -1) return prev;
                  const copy = JSON.parse(JSON.stringify(prev[idx]));
                  copy.id = Date.now();
                  copy.name = copy.name + ' (Copy)';
                  const next = [...prev];
                  next.splice(idx + 1, 0, copy);
                  return next;
              });
              addToast('Scene duplicated ✓', 'success');
          };
          const deleteScene = async (id) => {
            if (await appConfirm("Delete this entire scene? This cannot be undone.")) {
                updateActiveProjectScenes(prev => { const newScenes = prev.filter(s => s.id !== id); return newScenes.length === 0 ? [{ id: Date.now(), name: `Scene 1`, shots: [] }] : newScenes; });
                setEditingIndex(-1); clearForm();
            }
          };

          const handleAddOrUpdateShot = () => {
            if (prompt === "[SUBJECT/ACTION]") return;
            const projectDefaults = activeProject.defaultParams || {};
            const strictDefaults = aiModel === 'MY STYLE' ? myStyle.strictDefaults : {};
            const mergedSelections = { ...selections };
            Object.keys(projectDefaults).concat(Object.keys(strictDefaults)).forEach(key => { if (!mergedSelections[key]) mergedSelections[key] = strictDefaults[key] || projectDefaults[key] || ""; });

            const shotData = { subject, negativePrompt, selections: mergedSelections, sfx, bgm, dialogues: [...dialogues], mode: promptMode, status: 'Planning', tags: shotTags.split(',').map(t=>t.trim()).filter(Boolean), referenceImages: [...referenceImages], customPromptOverride: fightDraft ? buildFightPrompt(fightDraft) : null };
            if (editingIndex >= 0) { shotData.status = shots[editingIndex].status || 'Planning'; updateActiveShots(prev => { const newShots = [...prev]; newShots[editingIndex] = shotData; return newShots; }); setEditingIndex(-1); } 
            else { updateActiveShots(prev => [...prev, shotData]); addPromptToHistory(prompt, { mode: promptMode, platform: videoPlatform }); }
            clearForm();
          };

          const handleEditShot = (index) => { saveRevision(index); const s = shots[index]; setSubject(s.subject); setSelections(s.selections); setSfx(s.sfx); setBgm(s.bgm); setDialogues(s.dialogues ? [...s.dialogues] : []); setPromptMode(s.mode || 'video'); setShotTags(s.tags?.join(', ') || ""); setNegativePrompt(s.negativePrompt || ""); setReferenceImages(s.referenceImages || []); setEditingIndex(index); setActivePresetName(null); };
          const handleRemoveShot = (index) => {
            updateActiveShots(prev => prev.filter((_, i) => i !== index));
            if (editingIndex === index) { setEditingIndex(-1); clearForm(); } else if (editingIndex > index) setEditingIndex(editingIndex - 1);
            if (expandedShotIndex === index) setExpandedShotIndex(-1); else if (expandedShotIndex > index) setExpandedShotIndex(expandedShotIndex - 1);
            setSelectedShots([]);
          };
          const handleDuplicateShot = (index) => {
            updateActiveShots(prev => { const newShots = [...prev]; const shotToCopy = JSON.parse(JSON.stringify(newShots[index])); newShots.splice(index + 1, 0, shotToCopy); return newShots; });
            if (editingIndex > index) setEditingIndex(editingIndex + 1);
            if (expandedShotIndex > index) setExpandedShotIndex(expandedShotIndex + 1);
            setSelectedShots([]);
          };
          const handleShotDragStart = (e, index) => { setDraggedShotIndex(index); e.dataTransfer.effectAllowed = "move"; };
          const handleShotDragOver = (e, index) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (dragOverShotIndex !== index) setDragOverShotIndex(index); };
          const handleShotDrop = (e, dropIndex) => { e.preventDefault(); if (draggedShotIndex === null || draggedShotIndex === dropIndex) { setDragOverShotIndex(null); setDraggedShotIndex(null); return; } updateActiveShots(prev => { const newShots = [...prev]; const draggedItem = newShots.splice(draggedShotIndex, 1)[0]; newShots.splice(dropIndex, 0, draggedItem); return newShots; }); if (editingIndex === draggedShotIndex) setEditingIndex(dropIndex); else if (editingIndex !== -1) { if (draggedShotIndex < editingIndex && dropIndex >= editingIndex) setEditingIndex(editingIndex - 1); else if (draggedShotIndex > editingIndex && dropIndex <= editingIndex) setEditingIndex(editingIndex + 1); } if (expandedShotIndex === draggedShotIndex) setExpandedShotIndex(dropIndex); else if (expandedShotIndex !== -1) { if (draggedShotIndex < expandedShotIndex && dropIndex >= expandedShotIndex) setExpandedShotIndex(expandedShotIndex - 1); else if (draggedShotIndex > expandedShotIndex && dropIndex <= expandedShotIndex) setExpandedShotIndex(expandedShotIndex + 1); } setDragOverShotIndex(null); setDraggedShotIndex(null); setSelectedShots([]); };
          const handleShotDragEnd = () => { setDragOverShotIndex(null); setDraggedShotIndex(null); };
          const handleTransitionChange = (index, value) => { updateActiveShots(prev => { const newShots = [...prev]; newShots[index] = { ...newShots[index], selections: { ...newShots[index].selections, transition: value } }; return newShots; }); };
          const handleShotStatusChange = (index, value) => { updateActiveShots(prev => { const newShots = [...prev]; newShots[index] = { ...newShots[index], status: value }; return newShots; }); };
          const cancelEdit = () => { setEditingIndex(-1); clearForm(); };
          const handleClearSequence = async () => { if(await appConfirm('Clear all shots in this scene? This cannot be undone.', { confirmLabel: 'Clear All' })) { updateActiveShots([]); setEditingIndex(-1); setSelectedShots([]); } };

          // ══════════════════════════════════════════════════════════════════
          // ── MULTI-SHOT MASTERY SYSTEM ─────────────────────────────────────
          // ══════════════════════════════════════════════════════════════════

          // ── 1. SHOT SEQUENCE TEMPLATES ──────────────────────────────────
          const SEQUENCE_TEMPLATES = [
              {
                  id: 'reveal', name: 'The Reveal', icon: 'Aperture', color: '#06b6d4',
                  desc: 'Wide → Medium → CU → ECU — builds tension toward a discovery',
                  shots: [
                      { label: 'Establish', shotType: 'Extreme Wide Shot (EWS)', movement: 'Static / Tripod', actionSpeed: 'Normal Speed', lighting: 'Natural Daylight', transition: 'Hard Cut' },
                      { label: 'Approach', shotType: 'Wide Shot (WS)', movement: 'Dolly In', actionSpeed: 'Normal Speed', transition: 'Hard Cut' },
                      { label: 'Focus', shotType: 'Medium Shot (MS)', movement: 'Dolly In', actionSpeed: 'Slow Motion', transition: 'Hard Cut' },
                      { label: 'Reveal', shotType: 'Close-Up (CU)', movement: 'Static / Tripod', actionSpeed: 'Slow Motion', lighting: 'Cinematic Rim Lighting', transition: 'Cross Dissolve' },
                      { label: 'Impact', shotType: 'Extreme Close-Up (ECU)', movement: 'Static / Tripod', actionSpeed: 'Ultra Slow Motion', transition: 'Fade to Black' },
                  ]
              },
              {
                  id: 'chase', name: 'The Chase', icon: 'Zap', color: '#ef4444',
                  desc: 'POV → Tracking → OTS → Wide — kinetic pursuit energy',
                  shots: [
                      { label: 'POV Start', shotType: 'Point of View (POV)', movement: 'Handheld / Shaky', actionSpeed: 'Speed Ramp', lighting: 'Natural Daylight', transition: 'Hard Cut' },
                      { label: 'Pursuit', shotType: 'Medium Shot (MS)', movement: 'Tracking / Follow', actionSpeed: '2x Fast Forward', transition: 'Whip Pan' },
                      { label: 'Over Shoulder', shotType: 'Over the Shoulder (OTS)', movement: 'Handheld / Shaky', actionSpeed: 'Speed Ramp', transition: 'Smash Cut' },
                      { label: 'Aerial', shotType: 'Bird\'s Eye View', movement: 'Drone Fly-Through', actionSpeed: 'Normal Speed', transition: 'Hard Cut' },
                      { label: 'Wide Escape', shotType: 'Wide Shot (WS)', movement: 'Tracking / Follow', actionSpeed: 'Normal Speed', transition: 'Hard Cut' },
                  ]
              },
              {
                  id: 'confrontation', name: 'The Confrontation', icon: 'Users', color: '#f59e0b',
                  desc: 'OTS ↔ OTS → ECU → ECU → Wide — classic dialogue tension',
                  shots: [
                      { label: 'Character A', shotType: 'Over the Shoulder (OTS)', movement: 'Static / Tripod', lens: '85mm Portrait', lighting: 'Studio Lighting', transition: 'Hard Cut' },
                      { label: 'Character B', shotType: 'Over the Shoulder (OTS)', movement: 'Static / Tripod', lens: '85mm Portrait', lighting: 'Studio Lighting', transition: 'Hard Cut' },
                      { label: 'A Reaction', shotType: 'Close-Up (CU)', movement: 'Dolly In', actionSpeed: 'Slow Motion', transition: 'Hard Cut' },
                      { label: 'B Reaction', shotType: 'Extreme Close-Up (ECU)', movement: 'Static / Tripod', actionSpeed: 'Slow Motion', lighting: 'Harsh Shadows', transition: 'Hard Cut' },
                      { label: 'Resolution', shotType: 'Wide Shot (WS)', movement: 'Dolly Out', actionSpeed: 'Normal Speed', transition: 'Cross Dissolve' },
                  ]
              },
              {
                  id: 'discovery', name: 'The Discovery', icon: 'Search', color: '#a855f7',
                  desc: 'Establishing → Dolly-In → ECU — classic cinematic find',
                  shots: [
                      { label: 'Location', shotType: 'Extreme Wide Shot (EWS)', movement: 'Static / Tripod', lighting: 'Natural Daylight', transition: 'Hard Cut' },
                      { label: 'Approach', shotType: 'Wide Shot (WS)', movement: 'Dolly In', actionSpeed: 'Normal Speed', transition: 'Hard Cut' },
                      { label: 'Investigate', shotType: 'Medium Shot (MS)', movement: 'Dolly In', actionSpeed: 'Slow Motion', transition: 'Hard Cut' },
                      { label: 'Detail', shotType: 'Extreme Close-Up (ECU)', movement: 'Static / Tripod', actionSpeed: 'Ultra Slow Motion', lighting: 'Harsh Shadows', transition: 'Cross Dissolve' },
                  ]
              },
              {
                  id: 'hero_moment', name: 'Hero Moment', icon: 'UserPlus', color: '#22c55e',
                  desc: 'Worm\'s Eye → Rim Lit CU → Slow-Mo Wide — iconic hero reveal',
                  shots: [
                      { label: 'Power Angle', shotType: 'Worm\'s Eye View', movement: 'Static / Tripod', lighting: 'Cinematic Rim Lighting', lens: '24mm Wide', transition: 'Hard Cut' },
                      { label: 'Hero Face', shotType: 'Close-Up (CU)', movement: 'Dolly In', actionSpeed: 'Slow Motion', lighting: 'Cinematic Rim Lighting', lens: '85mm Portrait', transition: 'Hard Cut' },
                      { label: 'Action', shotType: 'Full Shot (FS)', movement: 'Tracking / Follow', actionSpeed: 'Slow Motion', transition: 'Hard Cut' },
                      { label: 'Epic Wide', shotType: 'Extreme Wide Shot (EWS)', movement: 'Crane Shot', actionSpeed: 'Slow Motion', lighting: 'Golden Hour', transition: 'Cross Dissolve' },
                  ]
              },
              {
                  id: 'nightmare', name: 'The Nightmare', icon: 'Moon', color: '#6b7280',
                  desc: 'Low Key → Dutch → ECU → POV — psychological horror sequence',
                  shots: [
                      { label: 'Dread', shotType: 'Wide Shot (WS)', movement: 'Static / Tripod', lighting: 'Low Key (Dark/Moody)', shotStyle: 'Film Noir', transition: 'Hard Cut' },
                      { label: 'Disoriented', shotType: 'Medium Shot (MS)', movement: 'Handheld / Shaky', angle: 'Dutch Angle / Canted', lighting: 'Low Key (Dark/Moody)', transition: 'Hard Cut' },
                      { label: 'Terror', shotType: 'Extreme Close-Up (ECU)', movement: 'Zoom In', actionSpeed: 'Slow Motion', lighting: 'Harsh Shadows', transition: 'Smash Cut' },
                      { label: 'POV Threat', shotType: 'Point of View (POV)', movement: 'Handheld / Shaky', actionSpeed: 'Normal Speed', lighting: 'Low Key (Dark/Moody)', transition: 'Hard Cut' },
                  ]
              },
          ];

          // ── 2. CHAIN MODE STATE ─────────────────────────────────────────
          const [chainPreset, setChainPreset] = React.useState(null); // selected preset id
          const [chainWizardStep, setChainWizardStep] = React.useState(1); // 1=preset, 2=story, 3=action
          const [chainPresetSearch, setChainPresetSearch] = React.useState('');
          const [chainShowCustom, setChainShowCustom] = React.useState(false);
          const [showChainModal, setShowChainModal] = React.useState(false);
          const [showSequenceTemplates, setShowSequenceTemplates] = React.useState(false);

          // ── 3. CONTINUITY LOCK STATE ────────────────────────────────────
          const [continuityLocks, setContinuityLocks] = React.useState({}); // { paramKey: value }
          const [showContinuityLock, setShowContinuityLock] = React.useState(false);
          const LOCKABLE_PARAMS = [
              { key: 'camera', label: 'Camera' },
              { key: 'lens', label: 'Lens' },
              { key: 'lighting', label: 'Lighting' },
              { key: 'shotStyle', label: 'Style' },
              { key: 'angle', label: 'Angle' },
              { key: 'filmStock', label: 'Film Stock' },
              { key: 'aspectRatio', label: 'Aspect Ratio' },
              { key: 'actionSpeed', label: 'Speed' },
          ];

          // Apply continuity locks when a selection changes
          const handleSelectionWithLock = (key, value) => {
              setSelections(prev => ({ ...prev, [key]: value }));
              // If this param is locked, propagate to all unlocked shots
              if (continuityLocks[key] !== undefined) {
                  setContinuityLocks(prev => ({ ...prev, [key]: value }));
                  updateActiveShots(prev => prev.map(s => s.locked ? s : { ...s, selections: { ...s.selections, [key]: value } }));
                  addToast(`Continuity lock: ${key} → "${value}" applied to all shots ✓`, 'success');
              }
          };

          // Load a sequence template into the active scene
          const loadSequenceTemplate = (template, baseSubject) => {
              const newShots = template.shots.map((t, idx) => {
                  const sel = {
                      shotType: t.shotType || '',
                      shotStyle: t.shotStyle || chainBase.shotStyle || '',
                      camera: t.camera || chainBase.camera || '',
                      lens: t.lens || chainBase.lens || '',
                      aperture: 'f/2.8',
                      angle: t.angle || '',
                      lighting: t.lighting || chainBase.lighting || '',
                      movement: t.movement || '',
                      actionSpeed: t.actionSpeed || 'Normal Speed',
                      duration: '5.0s',
                      transition: t.transition || 'Hard Cut',
                      filmStock: chainBase.filmStock || '',
                      aspectRatio: '--ar 16:9',
                      ...continuityLocks
                  };
                  return {
                      id: `shot_${Date.now()}_${idx}`,
                      subject: baseSubject ? `${baseSubject} — ${t.label}` : t.label,
                      selections: sel,
                      sfx: '', bgm: '', dialogues: [], mode: promptMode,
                      status: 'Planning', tags: [t.label], referenceImages: [],
                      customPromptOverride: null
                  };
              });
              updateActiveShots(prev => [...prev, ...newShots]);
              addToast(`${template.name} — ${newShots.length} shots added ✓`, 'success');
              setShowSequenceTemplates(false);
          };

          // ── Build and inject Chain Shot 1 ──────────────────────────────
          const buildChainShot1 = () => {
              const baseSelections = {
                  shotType: '', shotStyle: chainBase.shotStyle || '',
                  camera: chainBase.camera || '', lens: chainBase.lens || '',
                  aperture: 'f/2.8', angle: chainBase.angle || '',
                  lighting: chainBase.lighting || '', movement: chainBase.movement || '',
                  actionSpeed: chainBase.actionSpeed || '', duration: chainBase.duration || '',
                  transition: chainBase.transition || '', filmStock: chainBase.filmStock || '',
                  aspectRatio: '--ar 16:9', ...continuityLocks
              };
              let shot1Subject = '';
              if (chainBase.character) shot1Subject += '@' + chainBase.character.replace(/\s+/g,'') + ' ';
              if (chainBase.subject) shot1Subject += chainBase.subject;
              if (chainBase.locationDesc) shot1Subject += '. Location: ' + chainBase.locationDesc;
              else if (chainBase.location) shot1Subject += '. Location: ' + chainBase.location;
              if (!shot1Subject.trim()) { addToast('Add a subject or character first', 'warning'); return; }
              return {
                  id: `shot_chain1_${Date.now()}`,
                  subject: shot1Subject.trim(),
                  negativePrompt: '', selections: baseSelections,
                  sfx: '', bgm: '', dialogues: [], mode: promptMode,
                  status: 'Planning', tags: ['Chain Base'],
                  referenceImages: [], customPromptOverride: null,
                  _chainDelta: false, _isChainShot1: true
              };
          };
          const handleChainAddShot = () => {
              if (!subject.trim()) return;
              const mergedSel = { ...selections };

              // Inherit all chain base params — only if not already set by user on this shot
              const chainParamKeys = ['camera','lens','lighting','shotStyle','angle','filmStock','movement','actionSpeed','duration','transition'];
              chainParamKeys.forEach(k => { if (chainBase[k] && !mergedSel[k]) mergedSel[k] = chainBase[k]; });

              // Apply continuity locks (always override)
              Object.entries(continuityLocks).forEach(([k, v]) => { mergedSel[k] = v; });

              let fullSubject = '';

              if (chainShotCount === 0) {
                  // FIRST manual shot: full subject — character name only (generatePromptText expands it)
                  if (chainBase.character) fullSubject += '@' + chainBase.character.replace(/\s+/g,'') + ' ';
                  if (chainBase.subject) fullSubject += chainBase.subject + '. ';
                  if (chainBase.locationDesc) fullSubject += 'Location: ' + chainBase.locationDesc + '. ';
                  else if (chainBase.location) fullSubject += 'Location: ' + chainBase.location + '. ';
                  fullSubject += subject;
              } else {
                  // SUBSEQUENT shots: ONLY the action the user typed — no character name, no location
                  // The AI model already has context from Shot 1
                  fullSubject = subject;
              }

              const shotData = {
                  id: `shot_${Date.now()}`,
                  subject: fullSubject.trim(),
                  negativePrompt, selections: mergedSel, sfx, bgm,
                  dialogues: [...dialogues], mode: promptMode,
                  status: 'Planning', tags: shotTags.split(',').map(t=>t.trim()).filter(Boolean),
                  referenceImages: [...referenceImages], customPromptOverride: null,
                  _chainDelta: chainShotCount > 0  // flag: true for shots 2+ in chain
              };
              updateActiveShots(prev => [...prev, shotData]);
              addPromptToHistory(prompt, { mode: promptMode, platform: videoPlatform });
              // Only clear the delta — keep all params for next shot
              setSubject('');
              setShotTags('');
          };

          // ── Shot Locking ────────────────────────────────────────────────
          const toggleShotLock = (index) => {
              updateActiveShots(prev => {
                  const newShots = [...prev];
                  newShots[index] = { ...newShots[index], locked: !newShots[index].locked };
                  return newShots;
              });
          };

          // ── Global Find & Replace ───────────────────────────────────────
          const [showFindReplace, setShowFindReplace] = React.useState(false);

          // ── Right-Click Context Menu ────────────────────────────────────
          const [ctxMenu, setCtxMenu] = React.useState(null);
          // Context submenu state (moved here so openCtxMenu can reference setCtxSubmenu)
          const [ctxSubmenu, setCtxSubmenu] = React.useState(null);
          // Internal clipboard for copy/paste shot
          const copiedShotRef = React.useRef(null);

          const openCtxMenu = (e, type, data) => {
              e.preventDefault(); e.stopPropagation();
              setCtxMenu({ x: e.clientX, y: e.clientY, type, data });
              setCtxSubmenu(null);
          };
          const closeCtxMenu = () => { setCtxMenu(null); setCtxSubmenu(null); };

          // Legacy alias kept for any remaining direct calls
          const handleShotContextMenu = (e, i) => openCtxMenu(e, 'shot', { shotIndex: i });

          useEffect(() => {
              // Block ALL browser native right-click globally
              const blockCtx = (e) => { e.preventDefault(); };
              document.addEventListener('contextmenu', blockCtx);
              const close = () => closeCtxMenu();
              window.addEventListener('click', close);
              const onKey = (e) => { if (e.key === 'Escape') closeCtxMenu(); };
              document.addEventListener('keydown', onKey);
              return () => {
                  document.removeEventListener('contextmenu', blockCtx);
                  window.removeEventListener('click', close);
                  document.removeEventListener('keydown', onKey);
              };
          }, []);

          // Keyboard navigation for context menus (Requirements 13.1–13.5)
          useEffect(() => {
              if (!ctxMenu) return;
              // Focus first non-disabled item when menu opens
              const focusFirst = () => {
                  const menu = document.querySelector('[role="menu"]');
                  if (!menu) return;
                  const items = Array.from(menu.querySelectorAll('[role="menuitem"]:not([disabled]):not([aria-disabled="true"])'));
                  if (items.length > 0) items[0].focus();
              };
              const rafId = requestAnimationFrame(focusFirst);

              const handleMenuKeyDown = (e) => {
                  const menu = document.querySelector('[role="menu"]');
                  if (!menu) return;
                  const items = Array.from(menu.querySelectorAll('[role="menuitem"]:not([disabled]):not([aria-disabled="true"])'));
                  if (items.length === 0) return;
                  const focused = document.activeElement;
                  const idx = items.indexOf(focused);

                  if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      const next = idx < items.length - 1 ? items[idx + 1] : items[0];
                      next.focus();
                  } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      const prev = idx > 0 ? items[idx - 1] : items[items.length - 1];
                      prev.focus();
                  } else if (e.key === 'ArrowRight') {
                      // Open submenu: trigger mouseenter on focused item's parent SubMenuWrapper
                      if (focused) {
                          const wrapper = focused.closest('.relative');
                          if (wrapper) {
                              wrapper.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
                              // Focus first item in submenu after a tick
                              requestAnimationFrame(() => {
                                  const submenu = wrapper.querySelector('.absolute [role="menuitem"]:not([disabled])');
                                  if (submenu) submenu.focus();
                              });
                          }
                      }
                  } else if (e.key === 'ArrowLeft') {
                      // Close submenu: trigger mouseleave on the submenu wrapper
                      const openSubmenu = menu.querySelector('.absolute');
                      if (openSubmenu) {
                          const wrapper = openSubmenu.closest('.relative');
                          if (wrapper) {
                              wrapper.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
                              const trigger = wrapper.querySelector('[role="menuitem"]');
                              if (trigger) trigger.focus();
                          }
                      }
                  } else if (e.key === 'Enter' || e.key === ' ') {
                      if (focused && focused.getAttribute('role') === 'menuitem') {
                          e.preventDefault();
                          focused.click();
                      }
                  }
              };

              document.addEventListener('keydown', handleMenuKeyDown);
              return () => {
                  cancelAnimationFrame(rafId);
                  document.removeEventListener('keydown', handleMenuKeyDown);
              };
          }, [ctxMenu]);

          // Move shot to another scene
          const moveShotToScene = (shotIndex, targetSceneId) => {
              if (targetSceneId === activeSceneId) return;
              const shot = shots[shotIndex];
              if (!shot) return;
              setProjects(prev => prev.map(p => {
                  if (p.id !== activeProjectId) return p;
                  return {
                      ...p,
                      scenes: p.scenes.map(sc => {
                          if (sc.id === activeSceneId) return { ...sc, shots: sc.shots.filter((_, i) => i !== shotIndex) };
                          if (sc.id === targetSceneId) return { ...sc, shots: [...(sc.shots || []), JSON.parse(JSON.stringify(shot))] };
                          return sc;
                      })
                  };
              }));
              addToast(`Shot moved to ${scenes.find(s => s.id === targetSceneId)?.name || 'scene'} ✓`, 'success');
          };

          // Send shot to a different project
          const sendShotToProject = (shotIndex, targetProjectId) => {
              const shot = shots[shotIndex];
              if (!shot || targetProjectId === activeProjectId) return;
              setProjects(prev => prev.map(p => {
                  if (p.id !== targetProjectId) return p;
                  const firstScene = p.scenes?.[0];
                  if (!firstScene) return p;
                  return { ...p, scenes: p.scenes.map((sc, idx) => idx === 0 ? { ...sc, shots: [...(sc.shots || []), JSON.parse(JSON.stringify(shot))] } : sc) };
              }));
              addToast(`Shot sent to ${projects.find(p => p.id === targetProjectId)?.name || 'project'} ✓`, 'success');
          };

          // Flip shot mode image ↔ video
          const flipShotMode = (shotIndex) => {
              updateActiveShots(prev => {
                  const n = [...prev];
                  n[shotIndex] = { ...n[shotIndex], mode: n[shotIndex].mode === 'image' ? 'video' : 'image' };
                  return n;
              });
          };

          // Add shot to favorites (reuse existing favorites system)
          const favoriteShotPrompt = (shotIndex) => {
              const s = shots[shotIndex];
              if (!s) return;
              const text = getFinalPromptText(s);
              toggleFavorite({ id: `shot_fav_${Date.now()}`, text, subject: s.subject, selections: s.selections });
              addToast('Shot added to favorites ✓', 'success');
          };

          // Insert blank shot above/below
          const insertBlankShot = (shotIndex, position) => {
              const blank = { id: `shot_${Date.now()}`, subject: '', selections: { aspectRatio: '--ar 16:9', aperture: 'f/2.8' }, sfx: '', bgm: '', dialogues: [], mode: 'video', tags: [] };
              updateActiveShots(prev => {
                  const n = [...prev];
                  n.splice(position === 'above' ? shotIndex : shotIndex + 1, 0, blank);
                  return n;
              });
              addToast(`Blank shot inserted ${position} ✓`, 'success');
          };

          // Apply director style to single shot
          const applyDirectorToShot = (shotIndex, dirKey) => {
              const dir = DIRECTOR_STYLES[dirKey];
              if (!dir) return;
              // Extract only the visual selection keys (exclude label/signature metadata)
              const { label, signature, ...dirSelections } = dir;
              updateActiveShots(prev => {
                  const n = [...prev];
                  n[shotIndex] = { ...n[shotIndex], selections: { ...n[shotIndex].selections, ...dirSelections } };
                  return n;
              });
              addToast(`${label} style applied to shot ✓`, 'success');
          };

          // Color-tag a shot
          const colorTagShot = (shotIndex, color) => {
              updateActiveShots(prev => {
                  const n = [...prev];
                  n[shotIndex] = { ...n[shotIndex], colorTag: n[shotIndex].colorTag === color ? null : color };
                  return n;
              });
          };

          // ── Context Menu Action Functions ───────────────────────────────

          // Scene actions
          const moveSceneLeft = (sceneId) => {
              setProjects(prev => prev.map(p => {
                  if (p.id !== activeProjectId) return p;
                  const idx = p.scenes.findIndex(s => s.id === sceneId);
                  if (idx <= 0) return p;
                  const newScenes = [...p.scenes];
                  [newScenes[idx - 1], newScenes[idx]] = [newScenes[idx], newScenes[idx - 1]];
                  return { ...p, scenes: newScenes };
              }));
              addToast('Scene moved left ✓', 'success');
          };

          const moveSceneRight = (sceneId) => {
              setProjects(prev => prev.map(p => {
                  if (p.id !== activeProjectId) return p;
                  const idx = p.scenes.findIndex(s => s.id === sceneId);
                  if (idx < 0 || idx >= p.scenes.length - 1) return p;
                  const newScenes = [...p.scenes];
                  [newScenes[idx], newScenes[idx + 1]] = [newScenes[idx + 1], newScenes[idx]];
                  return { ...p, scenes: newScenes };
              }));
              addToast('Scene moved right ✓', 'success');
          };

          const applyDirectorToScene = (sceneId, dirKey) => {
              const dir = DIRECTOR_STYLES[dirKey];
              if (!dir) return;
              const { label, signature, ...dirSelections } = dir;
              setProjects(prev => prev.map(p => {
                  if (p.id !== activeProjectId) return p;
                  return {
                      ...p,
                      scenes: p.scenes.map(sc => {
                          if (sc.id !== sceneId) return sc;
                          return { ...sc, shots: (sc.shots || []).map(sh => ({ ...sh, selections: { ...sh.selections, ...dirSelections } })) };
                      })
                  };
              }));
              addToast(`${label} style applied to all shots in scene ✓`, 'success');
          };

          const copyAllScenePrompts = (sceneId) => {
              const sc = scenes.find(s => s.id === sceneId);
              if (!sc || !sc.shots?.length) return;
              const text = sc.shots.map((sh, i) => `Shot ${i + 1}: ${getFinalPromptText(sh)}`).join('\n\n');
              fallbackCopy(text, () => addToast('All scene prompts copied ✓', 'success'));
          };

          const addSceneAfter = (sceneId) => {
              const newScene = { id: `scene_${Date.now()}`, name: `Scene ${scenes.length + 1}`, shots: [] };
              setProjects(prev => prev.map(p => {
                  if (p.id !== activeProjectId) return p;
                  const idx = p.scenes.findIndex(s => s.id === sceneId);
                  const newScenes = [...p.scenes];
                  newScenes.splice(idx + 1, 0, newScene);
                  return { ...p, scenes: newScenes };
              }));
              addToast('New scene added ✓', 'success');
          };

          const clearAllSceneShots = (sceneId) => {
              setProjects(prev => prev.map(p => {
                  if (p.id !== activeProjectId) return p;
                  return { ...p, scenes: p.scenes.map(sc => sc.id === sceneId ? { ...sc, shots: [] } : sc) };
              }));
              addToast('All shots cleared from scene ✓', 'success');
          };

          // Project actions
          const duplicateProject = (projectId) => {
              const proj = projects.find(p => p.id === projectId);
              if (!proj) return;
              const copy = JSON.parse(JSON.stringify(proj));
              copy.id = `proj_${Date.now()}`;
              copy.name = proj.name + ' (Copy)';
              copy.scenes = copy.scenes.map(sc => ({
                  ...sc,
                  id: `scene_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                  shots: (sc.shots || []).map(sh => ({ ...sh, id: `shot_${Date.now()}_${Math.random().toString(36).slice(2)}` }))
              }));
              setProjects(prev => [...prev, copy]);
              addToast(`Project "${copy.name}" created ✓`, 'success');
          };

          const applyDirectorToProject = (projectId, dirKey) => {
              const dir = DIRECTOR_STYLES[dirKey];
              if (!dir) return;
              const { label, signature, ...dirSelections } = dir;
              setProjects(prev => prev.map(p => {
                  if (p.id !== projectId) return p;
                  return {
                      ...p,
                      scenes: p.scenes.map(sc => ({
                          ...sc,
                          shots: (sc.shots || []).map(sh => ({ ...sh, selections: { ...sh.selections, ...dirSelections } }))
                      }))
                  };
              }));
              addToast(`${dir.label} style applied to entire project ✓`, 'success');
          };

          const copyAllProjectPrompts = (projectId) => {
              const proj = projects.find(p => p.id === projectId);
              if (!proj) return;
              const lines = [];
              proj.scenes.forEach((sc, si) => {
                  lines.push(`=== ${sc.name} ===`);
                  (sc.shots || []).forEach((sh, i) => lines.push(`Shot ${i + 1}: ${getFinalPromptText(sh)}`));
              });
              fallbackCopy(lines.join('\n\n'), () => addToast('All project prompts copied ✓', 'success'));
          };

          // Favorites actions
          const insertFavoriteAsShot = (favoriteId) => {
              const fav = favorites.find(f => f.id === favoriteId);
              if (!fav) return;
              const newShot = { id: `shot_${Date.now()}`, subject: fav.subject || fav.text || '', selections: fav.selections || {}, sfx: '', bgm: '', dialogues: [], mode: 'video', tags: [] };
              updateActiveShots(prev => [...prev, newShot]);
              addToast('Favorite inserted as new shot ✓', 'success');
          };

          const insertFavoriteIntoAllScenes = (favoriteId) => {
              const fav = favorites.find(f => f.id === favoriteId);
              if (!fav) return;
              setProjects(prev => prev.map(p => {
                  if (p.id !== activeProjectId) return p;
                  return {
                      ...p,
                      scenes: p.scenes.map(sc => {
                          const newShot = { id: `shot_${Date.now()}_${Math.random().toString(36).slice(2)}`, subject: fav.subject || fav.text || '', selections: fav.selections || {}, sfx: '', bgm: '', dialogues: [], mode: 'video', tags: [] };
                          return { ...sc, shots: [...(sc.shots || []), newShot] };
                      })
                  };
              }));
              addToast('Favorite inserted into all scenes ✓', 'success');
          };

          const pinFavoriteToTop = (favoriteIndex) => {
              updateFavorites(prev => {
                  const n = [...prev];
                  const [item] = n.splice(favoriteIndex, 1);
                  return [item, ...n];
              });
              addToast('Pinned to top ✓', 'success');
          };

          const renameFavorite = (favoriteId) => {
              const fav = favorites.find(f => f.id === favoriteId);
              if (!fav) return;
              const newName = window.prompt('Rename favorite:', fav.subject || fav.text || '');
              if (newName === null) return;
              updateFavorites(prev => prev.map(f => f.id === favoriteId ? { ...f, subject: newName } : f));
              addToast('Favorite renamed ✓', 'success');
          };

          // History actions
          const restoreHistoryRevision = (shotId, revisionIndex) => {
              const revs = shotHistory[shotId] || [];
              const rev = [...revs].reverse()[revisionIndex];
              if (!rev) return;
              const shotIdx = shots.findIndex(s => (s.id || `shot_${shots.indexOf(s)}`) === shotId);
              if (shotIdx < 0) return;
              updateActiveShots(prev => { const n = [...prev]; n[shotIdx] = { ...rev.snap }; return n; });
              addToast('Revision restored ✓', 'success');
          };

          const duplicateHistoryAsShot = (shotId, revisionIndex) => {
              const revs = shotHistory[shotId] || [];
              const rev = [...revs].reverse()[revisionIndex];
              if (!rev) return;
              const newShot = { ...JSON.parse(JSON.stringify(rev.snap)), id: `shot_${Date.now()}` };
              updateActiveShots(prev => [...prev, newShot]);
              addToast('Revision duplicated as new shot ✓', 'success');
          };

          const deleteHistoryRevision = (shotId, revisionIndex) => {
              const revs = shotHistory[shotId] || [];
              const reversed = [...revs].reverse();
              reversed.splice(revisionIndex, 1);
              setShotHistory(prev => ({ ...prev, [shotId]: reversed.reverse() }));
              addToast('Revision deleted ✓', 'success');
          };

          // Status actions
          const setAllShotsStatus = (scope, statusValue) => {
              if (scope === 'scene') {
                  updateActiveShots(prev => prev.map(sh => ({ ...sh, status: statusValue })));
              } else {
                  setProjects(prev => prev.map(p => {
                      if (p.id !== activeProjectId) return p;
                      return { ...p, scenes: p.scenes.map(sc => ({ ...sc, shots: (sc.shots || []).map(sh => ({ ...sh, status: statusValue })) })) };
                  }));
              }
              addToast(`Status set to ${statusValue} ✓`, 'success');
          };

          // Color tag bulk actions
          const setAllShotsColorTag = (scope, colorValue) => {
              if (scope === 'scene') {
                  updateActiveShots(prev => prev.map(sh => ({ ...sh, colorTag: colorValue })));
              } else {
                  setProjects(prev => prev.map(p => {
                      if (p.id !== activeProjectId) return p;
                      return { ...p, scenes: p.scenes.map(sc => ({ ...sc, shots: (sc.shots || []).map(sh => ({ ...sh, colorTag: colorValue })) })) };
                  }));
              }
              addToast(`Color tag applied ✓`, 'success');
          };

          const clearAllColorTags = (scope) => {
              if (scope === 'scene') {
                  updateActiveShots(prev => prev.map(sh => ({ ...sh, colorTag: null })));
              } else {
                  setProjects(prev => prev.map(p => {
                      if (p.id !== activeProjectId) return p;
                      return { ...p, scenes: p.scenes.map(sc => ({ ...sc, shots: (sc.shots || []).map(sh => ({ ...sh, colorTag: null })) })) };
                  }));
              }
              addToast('Color tags cleared ✓', 'success');
          };

          // Parameter bulk actions
          const applyParamToAllShots = (scope, fieldKey, fieldValue) => {
              if (scope === 'scene') {
                  updateActiveShots(prev => prev.map(sh => ({ ...sh, selections: { ...sh.selections, [fieldKey]: fieldValue } })));
              } else {
                  setProjects(prev => prev.map(p => {
                      if (p.id !== activeProjectId) return p;
                      return { ...p, scenes: p.scenes.map(sc => ({ ...sc, shots: (sc.shots || []).map(sh => ({ ...sh, selections: { ...sh.selections, [fieldKey]: fieldValue } })) })) };
                  }));
              }
              addToast(`${fieldKey} applied to all shots ✓`, 'success');
          };

          // Sort shots
          const sortShots = (sortKey) => {
              const statusOrder = { Planning: 0, Ready: 1, Rendering: 2, Completed: 3, Approved: 4 };
              const colorOrder = { red: 0, amber: 1, green: 2, blue: 3, purple: 4, pink: 5 };
              updateActiveShots(prev => {
                  const n = [...prev];
                  if (sortKey === 'status') n.sort((a, b) => (statusOrder[a.status || 'Planning'] || 0) - (statusOrder[b.status || 'Planning'] || 0));
                  else if (sortKey === 'colorTag') n.sort((a, b) => (colorOrder[a.colorTag] ?? 99) - (colorOrder[b.colorTag] ?? 99));
                  else if (sortKey === 'durationAsc') n.sort((a, b) => (parseFloat(a.selections?.duration) || 0) - (parseFloat(b.selections?.duration) || 0));
                  else if (sortKey === 'durationDesc') n.sort((a, b) => (parseFloat(b.selections?.duration) || 0) - (parseFloat(a.selections?.duration) || 0));
                  return n;
              });
              addToast('Shots sorted ✓', 'success');
          };

          // ── Shot Revision History ───────────────────────────────────────
          const [shotHistory, setShotHistory] = React.useState({});
          const [showHistoryFor, setShowHistoryFor] = React.useState(null);
          const saveRevision = (shotIndex) => {
              const shot = shots[shotIndex];
              if (!shot) return;
              const id = shot.id || `shot_${shotIndex}`;
              const snap = JSON.parse(JSON.stringify(shot));
              setShotHistory(prev => ({ ...prev, [id]: [...(prev[id] || []).slice(-9), { ts: Date.now(), snap }] }));
          };

          // ── Shot Rhythm Analyzer ────────────────────────────────────────
          const [showRhythm, setShowRhythm] = React.useState(false);
          const getRhythmData = () => {
              if (!shots.length) return null;
              const durations = shots.map(s => parseFloat(s.selections?.duration) || 5);
              const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
              const variance = durations.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / durations.length;
              const score = variance < 1 ? 'Monotonous' : variance < 5 ? 'Balanced' : 'Dynamic';
              const scoreColor = score === 'Monotonous' ? '#f59e0b' : score === 'Balanced' ? '#22c55e' : '#06b6d4';
              const monotonousRuns = [];
              let run = 1;
              for (let i = 1; i < durations.length; i++) {
                  if (Math.abs(durations[i] - durations[i-1]) < 0.5) run++;
                  else { if (run >= 3) monotonousRuns.push({ start: i - run, len: run }); run = 1; }
              }
              if (run >= 3) monotonousRuns.push({ start: durations.length - run, len: run });
              return { durations, avg: avg.toFixed(1), score, scoreColor, monotonousRuns };
          };

          // ── Genre DNA Detector ──────────────────────────────────────────
          const [showGenreDNA, setShowGenreDNA] = React.useState(false);
          const getGenreDNA = () => {
              const allShots = scenes.flatMap(s => s.shots || []);
              if (!allShots.length) return null;
              const scores = { Noir: 0, Thriller: 0, 'Sci-Fi': 0, Fantasy: 0, Drama: 0, Action: 0, Horror: 0, Romance: 0 };
              allShots.forEach(s => {
                  const sel = s.selections || {};
                  const style = (sel.shotStyle || '').toLowerCase();
                  const light = (sel.lighting || '').toLowerCase();
                  const move = (sel.movement || '').toLowerCase();
                  const subj = (s.subject || '').toLowerCase();
                  if (style.includes('noir') || light.includes('low key') || light.includes('harsh')) scores.Noir += 2;
                  if (move.includes('handheld') || (sel.actionSpeed || '').includes('Speed Ramp')) scores.Thriller += 2;
                  if (style.includes('sci-fi') || style.includes('cyberpunk') || light.includes('neon')) scores['Sci-Fi'] += 2;
                  if (style.includes('fantasy') || light.includes('golden') || light.includes('volumetric')) scores.Fantasy += 2;
                  if ((sel.shotType || '').includes('Close-Up') || (sel.shotType || '').includes('OTS')) scores.Drama += 1;
                  if (move.includes('tracking') || (sel.actionSpeed || '').includes('Slow Motion')) scores.Action += 2;
                  if (light.includes('low key') && subj.includes('dark')) scores.Horror += 2;
                  if (light.includes('golden') && (sel.lens || '').includes('85mm')) scores.Romance += 2;
              });
              const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
              return Object.entries(scores).map(([g, v]) => ({ genre: g, pct: Math.round((v / total) * 100) }))
                  .filter(x => x.pct > 0).sort((a, b) => b.pct - a.pct).slice(0, 5);
          };

          // ── Prompt Mutation Engine ──────────────────────────────────────
          const [showMutations, setShowMutations] = React.useState(null);
          const getMutations = (shotIndex) => {
              const shot = shots[shotIndex];
              if (!shot) return [];
              const base = { ...shot.selections };
              return [
                  { label: 'Intimate', icon: 'Users', changes: { shotType: 'Close-Up (CU)', lens: '85mm Portrait', movement: 'Static / Tripod', lighting: 'Studio Lighting' } },
                  { label: 'Epic', icon: 'Globe', changes: { shotType: 'Extreme Wide Shot (EWS)', lens: '14mm Ultra-Wide', movement: 'Drone Fly-Through', lighting: 'Golden Hour' } },
                  { label: 'Abstract', icon: 'Sparkles', changes: { shotStyle: 'Surreal', lighting: 'Volumetric Lighting (God Rays)', movement: 'Orbit', actionSpeed: 'Slow Motion' } },
              ].map(m => ({ ...m, selections: { ...base, ...m.changes } }));
          };

          const [frFind, setFrFind] = React.useState('');
          const [frReplace, setFrReplace] = React.useState('');
          const [frScope, setFrScope] = React.useState('scene'); // 'scene' | 'project' | 'all'
          const [frField, setFrField] = React.useState('any'); // 'any' | param key
          const [frResults, setFrResults] = React.useState(null);

          const handleFindReplace = () => {
              if (!frFind.trim()) return;
              let count = 0;
              const applyToShot = (shot) => {
                  if (shot.locked) return shot;
                  let changed = false;
                  const newShot = { ...shot, selections: { ...shot.selections } };
                  if (frField === 'any' || frField === 'subject') {
                      if (newShot.subject?.includes(frFind)) { newShot.subject = newShot.subject.replaceAll(frFind, frReplace); changed = true; }
                  }
                  if (frField === 'any') {
                      Object.keys(newShot.selections).forEach(k => {
                          if (typeof newShot.selections[k] === 'string' && newShot.selections[k].includes(frFind)) {
                              newShot.selections[k] = newShot.selections[k].replaceAll(frFind, frReplace);
                              changed = true;
                          }
                      });
                  } else if (frField !== 'subject' && newShot.selections[frField]?.includes(frFind)) {
                      newShot.selections[frField] = newShot.selections[frField].replaceAll(frFind, frReplace);
                      changed = true;
                  }
                  if (changed) count++;
                  return changed ? newShot : shot;
              };

              if (frScope === 'scene') {
                  updateActiveShots(prev => prev.map(applyToShot));
              } else if (frScope === 'project') {
                  setProjects(prev => prev.map(p => p.id === activeProjectId
                      ? { ...p, scenes: p.scenes.map(sc => ({ ...sc, shots: sc.shots.map(applyToShot) })) }
                      : p));
              } else {
                  setProjects(prev => prev.map(p => ({
                      ...p, scenes: p.scenes.map(sc => ({ ...sc, shots: sc.shots.map(applyToShot) }))
                  })));
              }
              setFrResults(count);
              if (count > 0) addToast(`Replaced ${count} occurrence${count > 1 ? 's' : ''} ✓`, 'success');
              else addToast('No matches found', 'info');
          };

          const handleLocalSuggest = () => {
            if (!subject.trim()) { addToast("Please enter a subject description.", 'warning', 3000); return; }
            const { cleanText, dialogues, newCharacters } = LocalAIEngine.extractDialogue(subject, globalCharacters);
            
            if (newCharacters && newCharacters.length > 0) {
                setGlobalCharacters(prev => {
                    const existingNames = new Set(prev.map(c => c.name.toLowerCase()));
                    const uniqueNewChars = newCharacters
                        .filter(charName => !existingNames.has(charName.toLowerCase()))
                        .map(charName => ({ id: `char_${Date.now()}_${Math.random()}`, name: charName, role: '', appearance: '' }));
                    
                    if (uniqueNewChars.length > 0) {
                        return [...prev, ...uniqueNewChars];
                    }
                    return prev;
                });
            }

            const suggestions = LocalAIEngine.analyzeTextForSuggestions(cleanText, promptMode);
            setSubject(cleanText);
            setSelections(prev => ({ ...prev, ...suggestions.selections }));
            if (promptMode === 'video') { if (suggestions.sfx) setSfx(suggestions.sfx); if (suggestions.bgm) setBgm(suggestions.bgm); if (dialogues.length > 0) setDialogues(prev => [...prev, ...dialogues]); }
            setActivePresetName(null);
          };

          const handleLocalAutoBuild = async () => {
            if (!subject.trim() && referenceImages.length === 0) { return; }
            setIsGenerating(true);
            try {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const { shots: processedSequence, newCharacters } = LocalAIEngine.splitTextIntoSequence(subject, promptMode, globalCharacters);

                if (newCharacters && newCharacters.length > 0) {
                    setGlobalCharacters(prev => {
                        const existingNames = new Set(prev.map(c => c.name.toLowerCase()));
                        const uniqueNewChars = newCharacters
                            .filter(charName => !existingNames.has(charName.toLowerCase()))
                            .map(charName => ({ id: `char_${Date.now()}_${Math.random()}`, name: charName, role: '', appearance: '' }));
                        
                        if (uniqueNewChars.length > 0) {
                            return [...prev, ...uniqueNewChars];
                        }
                        return prev;
                    });
                }

                const finalSequence = processedSequence.map(shot => {
                    const mergedSelections = { ...shot.selections };
                    Object.keys(activeProject.defaultParams || {}).concat(Object.keys(aiModel === 'MY STYLE' ? myStyle.strictDefaults : {})).forEach(key => { if (!mergedSelections[key]) mergedSelections[key] = (aiModel === 'MY STYLE' ? myStyle.strictDefaults : {})[key] || (activeProject.defaultParams || {})[key] || ""; });
                    return { ...shot, selections: mergedSelections };
                });
                if (shots.length > 0) {
                    if (scenes.length >= 35) { setIsGenerating(false); return; }
                    const newSceneId = Date.now();
                    updateActiveProjectScenes(prev => [...prev, { id: newSceneId, name: `Scene ${scenes.length + 1} - ${getRandomWord()}`, shots: finalSequence }]);
                    setActiveSceneId(newSceneId);
                } else { updateActiveShots(prev => [...prev, ...finalSequence]); }
                setEditingIndex(-1); clearForm();
            } finally { setIsGenerating(false); }
          };

          const handleAddDialogue = () => { setDialogues([...dialogues, { character: '', text: '', mood: '', reaction: '', event: '', voiceStyle: '', placement: 'after' }]); };
          const handleDialogueChange = (index, field, value) => { const newD = [...dialogues]; newD[index][field] = value; setDialogues(newD); };
          const handleRemoveDialogue = (index) => setDialogues(dialogues.filter((_, i) => i !== index));
          
          const handleDialogueDragStart = (e, index) => { setDraggedDialogueIndex(index); e.dataTransfer.effectAllowed = "move"; };
          const handleDialogueDragOver = (e, index) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (dragOverDialogueIndex !== index) setDragOverDialogueIndex(index); };
          const handleDialogueDrop = (e, dropIndex) => { e.preventDefault(); if (draggedDialogueIndex === null || draggedDialogueIndex === dropIndex) { setDragOverDialogueIndex(null); setDraggedDialogueIndex(null); return; } const newDialogues = [...dialogues]; const draggedItem = newDialogues.splice(draggedDialogueIndex, 1)[0]; newDialogues.splice(dropIndex, 0, draggedItem); setDialogues(newDialogues); setDragOverDialogueIndex(null); setDraggedDialogueIndex(null); };
          const handleDialogueDragEnd = () => { setDragOverDialogueIndex(null); setDraggedDialogueIndex(null); };

          // ── Dialogue Context Menu Actions ────────────────────────────────────────
          const copyDialogueText = (index) => {
              const d = dialogues[index];
              if (!d) return;
              navigator.clipboard.writeText(d.text);
              addToast('✓ Dialogue text copied', 'success');
          };

          const copyFullDialogue = (index) => {
              const d = dialogues[index];
              if (!d) return;
              const fullText = `${d.character}${d.mood ? ` (${d.mood})` : ''}: ${d.text}`;
              navigator.clipboard.writeText(fullText);
              addToast('✓ Full dialogue copied', 'success');
          };

          const duplicateDialogue = (index) => {
              const d = dialogues[index];
              if (!d) return;
              const copy = JSON.parse(JSON.stringify(d));
              const newDialogues = [...dialogues];
              newDialogues.splice(index + 1, 0, copy);
              setDialogues(newDialogues);
              addToast('✓ Dialogue duplicated', 'success');
          };

          const moveDialogueUp = (index) => {
              if (index === 0) return;
              const newDialogues = [...dialogues];
              [newDialogues[index - 1], newDialogues[index]] = [newDialogues[index], newDialogues[index - 1]];
              setDialogues(newDialogues);
              addToast('✓ Dialogue moved up', 'success');
          };

          const moveDialogueDown = (index) => {
              if (index === dialogues.length - 1) return;
              const newDialogues = [...dialogues];
              [newDialogues[index], newDialogues[index + 1]] = [newDialogues[index + 1], newDialogues[index]];
              setDialogues(newDialogues);
              addToast('✓ Dialogue moved down', 'success');
          };

          const addDialogueToFavorites = (index) => {
              const d = dialogues[index];
              if (!d) return;
              const favorite = {
                  id: `fav_${Date.now()}`,
                  type: 'dialogue',
                  character: d.character,
                  text: d.text,
                  mood: d.mood,
                  reaction: d.reaction,
                  event: d.event,
                  voiceStyle: d.voiceStyle,
                  createdAt: Date.now()
              };
              setFavorites(prev => [...prev, favorite]);
              addToast('✓ Added to favorites', 'success');
          };

          const applyDialogueToAllScenes = (index) => {
              const d = dialogues[index];
              if (!d || scenes.length <= 1) return;
              const newScenes = scenes.map(scene => ({
                  ...scene,
                  dialogues: [...(scene.dialogues || []), JSON.parse(JSON.stringify(d))]
              }));
              setScenes(newScenes);
              addToast(`✓ Dialogue applied to ${scenes.length} scenes`, 'success');
          };

          const changeDialogueMood = (index, mood) => {
              const newDialogues = [...dialogues];
              newDialogues[index].mood = mood;
              setDialogues(newDialogues);
              addToast(`✓ Mood changed to ${mood}`, 'success');
          };

          const changeDialogueVoiceStyle = (index, voiceStyle) => {
              const newDialogues = [...dialogues];
              newDialogues[index].voiceStyle = voiceStyle;
              setDialogues(newDialogues);
              addToast(`✓ Voice style changed to ${voiceStyle}`, 'success');
          };

          // ── Character Context Menu Actions ────────────────────────────────────────
          const copyCharacterName = (characterName) => {
              if (!characterName) return;
              navigator.clipboard.writeText(characterName);
              addToast('✓ Character name copied', 'success');
          };

          const addCharacterToLibrary = (characterName) => {
              if (!characterName || globalCharacters.some(c => c.name === characterName)) return;
              const newChar = {
                  id: `char_${Date.now()}`,
                  name: characterName,
                  description: '',
                  archetype: '',
                  traits: [],
                  createdAt: Date.now()
              };
              setGlobalCharacters(prev => [...prev, newChar]);
              addToast(`✓ "${characterName}" added to character library`, 'success');
          };

          const renameCharacter = (oldName, newName) => {
              if (!oldName || !newName) return;
              const newDialogues = dialogues.map(d => ({
                  ...d,
                  character: d.character === oldName ? newName : d.character
              }));
              setDialogues(newDialogues);
              addToast(`✓ Character renamed from "${oldName}" to "${newName}"`, 'success');
          };

          const findAllCharacterInstances = (characterName) => {
              if (!characterName) return;
              const count = dialogues.filter(d => d.character === characterName).length;
              addToast(`✓ Found ${count} instance${count !== 1 ? 's' : ''} of "${characterName}"`, 'info');
          };

          const deleteCharacterFromDialogues = (characterName) => {
              if (!characterName) return;
              const newDialogues = dialogues.filter(d => d.character !== characterName);
              setDialogues(newDialogues);
              addToast(`✓ "${characterName}" removed from all dialogues`, 'success');
          };

          const handleCreateProject = () => { setProjects(prev => [...prev, { id: `proj_${Date.now()}`, name: `${t('newProject')} ${prev.length + 1}`, description: '', tags: [], defaultParams: {}, scenes: [{ id: Date.now(), name: `Scene 1`, shots: [] }] }]); };
          const handleDeleteProject = async (id) => { if (projects.length === 1) return; if (await appConfirm("Delete this project? All scenes and shots will be lost.", { confirmLabel: 'Delete Project' })) { setProjects(prev => prev.filter(p => p.id !== id)); if (activeProjectId === id) setActiveProjectId(projects[0].id); } };
          const updateProjectField = (id, field, value) => { setProjects(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p)); };
          const toggleDirectorRule = (id) => { setActiveDirectorRules(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]); };

          const getFinalPromptText = (s) => {
              if (s.customPromptOverride) return s.customPromptOverride;
              // Chain delta: shots flagged as chain continuations use delta prompt
              if (s._chainDelta && chainMode) {
                  return generateChainDeltaPrompt(s.subject, s.selections, s.sfx, s.bgm, s.dialogues, s.mode || 'video', chainBase, videoPlatform, s.negativePrompt);
              }
              const directorRules = activeDirectorRules.map(id => DIRECTOR_RULES.find(rule => rule.id === id)).filter(Boolean);
              return generatePromptText(s.subject, s.selections, s.sfx, s.bgm, s.dialogues, s.mode || 'video', aiModel, myStyle, globalCharacters, globalLocations, globalVoiceStyles, s.negativePrompt, videoPlatform, { directorRules, compact: shotifyMode });
          };

          const getActiveSceneScript = () => {
              if (shots.length === 0) return "";
              let script = "";
              const shotLines = shots.map((s, i) => `${s.mode === 'image' ? 'Panel' : 'Shot'} ${i + 1}:\n${getFinalPromptText(s)}`).join('\n\n');
              return script + shotLines;
          };

          const generateMovieScript = () => {
              let script = "";
              return script + scenes.map((scene) => `${scene.name}\n\n${scene.shots?.length > 0 ? scene.shots.map((s, i) => `${s.mode === 'image' ? 'Panel' : 'Shot'} ${i + 1}:\n${getFinalPromptText(s)}`).join('\n\n') : "No content"}`).join('\n\n\n');
          };

          const fallbackCopy = (text, callback) => { const textArea = document.createElement("textarea"); textArea.value = text; textArea.style.top = "0"; textArea.style.left = "0"; textArea.style.position = "fixed"; document.body.appendChild(textArea); textArea.focus(); textArea.select(); try { document.execCommand('copy'); if (callback) callback(); } catch (err) { console.error('Copy failed', err); } document.body.removeChild(textArea); };
          const handleShareProject = (proj) => { const projectData = JSON.stringify(proj, null, 2); if (navigator.share) { navigator.share({ title: proj.name, text: `Prompt Sequence: ${proj.name}`, url: "data:application/json;base64," + btoa(unescape(encodeURIComponent(projectData))) }).catch(err => { fallbackCopy(projectData, () => addToast('Project JSON copied!', 'success', 3000)); }); } else { fallbackCopy(projectData, () => addToast('Project JSON copied!', 'success', 3000)); } };
          
          const handleSaveProject = async () => { 
              const projectData = { version: "1.9", projects, globalCharacters, globalLocations, globalVoiceStyles, myStyle, myStylePresets, customPresets, activeDirectorRules }; 
              const jsonString = JSON.stringify(projectData, null, 2);
              const blob = new Blob([jsonString], { type: "application/json" }); 
              const safeProjectName = activeProject.name.replace(/[^a-zA-Z0-9\s\-_]/g, '').trim().replace(/\s+/g, '_') || 'mokha_workspace';
              const defaultName = `${safeProjectName}_${new Date().toISOString().split('T')[0]}.RE`;

              try {
                  if (window.showSaveFilePicker) {
                      const handle = await window.showSaveFilePicker({
                          suggestedName: defaultName,
                          types: [{ description: 'Mokha RE File', accept: { 'application/json': ['.RE'] } }]
                      });
                      const writable = await handle.createWritable();
                      await writable.write(blob);
                      await writable.close();
                  } else {
                      let filename = window.prompt("Enter file name to save:", defaultName);
                      if (!filename) return;
                      if (!filename.endsWith('.RE')) filename += '.RE';
                      const url = URL.createObjectURL(blob); 
                      const a = document.createElement("a"); 
                      a.href = url; 
                      a.download = filename; 
                      document.body.appendChild(a); 
                      a.click(); 
                      document.body.removeChild(a); 
                      URL.revokeObjectURL(url);
                  }
              } catch (err) {
                  if (err.name !== 'AbortError') console.error("Save failed", err);
              }
          };

          const handleLoadProject = (e) => {
            const file = e.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
              try {
                const data = JSON.parse(event.target.result);
                if (data.projects && Array.isArray(data.projects)) {
                  setProjects(data.projects);
                  if (data.globalCharacters) setGlobalCharacters(data.globalCharacters);
                  if (data.globalLocations) setGlobalLocations(data.globalLocations);
                  if (data.globalVoiceStyles) setGlobalVoiceStyles(data.globalVoiceStyles);
                  if (data.myStylePresets) setMyStylePresets(data.myStylePresets);
                  if (data.myStyle) setMyStyle(data.myStyle);
                  if (data.customPresets) setCustomPresets(data.customPresets);
                  if (data.activeDirectorRules) setActiveDirectorRules(data.activeDirectorRules);
                } else if (data.scenes) { setProjects([{ id: `proj_${Date.now()}`, name: 'Imported Project', defaultParams: {}, scenes: data.scenes }]); }
                setCurrentView('dashboard');
              } catch (error) { addToast("Invalid project file.", 'error', 3000); }
            };
            reader.readAsText(file); e.target.value = null;
          };

          const handleSaveMyStyleAsPreset = () => { const name = window.prompt("Enter Style Preset Name:"); if (name?.trim()) setMyStylePresets(prev => [...prev, { id: `ms_preset_${Date.now()}`, name: name.trim(), template: myStyle.template, customModifiers: myStyle.customModifiers, strictDefaults: { ...myStyle.strictDefaults } }]); };
          const loadMyStylePreset = (preset) => { setMyStyle({ template: preset.template, customModifiers: preset.customModifiers, strictDefaults: { ...preset.strictDefaults } }); };
          const deleteMyStylePreset = async (id) => { if (await appConfirm("Delete this style preset?")) setMyStylePresets(prev => prev.filter(p => p.id !== id)); };

          const copyToClipboard = () => { const textToCopy = shots.length > 0 ? getActiveSceneScript() : prompt; fallbackCopy(textToCopy, () => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };
          const copyMovieToClipboard = () => { fallbackCopy(generateMovieScript(), () => { setMovieCopied(true); setTimeout(() => setMovieCopied(false), 2000); }); };
          
          const handleExportCSV = () => {
              if (shots.length === 0) { addToast("No shots to export.", 'warning', 3000); return; }
              const headers = ['Shot Number', 'Panel/Shot Type', 'Camera Movement', 'Duration', 'Subject/Action', 'Dialogue', 'Full Prompt'];
              const rows = shots.map((s, i) => {
                  const row = [
                      `Shot ${i + 1}`,
                      s.selections.shotType || 'N/A',
                      s.selections.movement || 'Static',
                      s.selections.duration || 'N/A',
                      `"${s.subject.replace(/"/g, '""')}"`,
                      `"${(s.dialogues || []).map(d => `${d.character}: ${d.text}`).join('\n').replace(/"/g, '""')}"`,
                      `"${getFinalPromptText(s).replace(/"/g, '""')}"`
                  ];
                  return row.join(',');
              });
              const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
              const link = document.createElement("a");
              link.href = encodeURI(csvContent);
              link.download = `${activeProject.name.replace(/[^a-zA-Z0-9]/g, '_')}_ShotList.csv`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
          };

          const openExportModal = () => {
              setPdfConfig({
                  layout: 'list',
                  studioLogo: null,
                  title: activeProject.name || '',
                  description: activeProject.description || ''
              });
              setShowExportModal(true);
          };

          const handleExportPDF = async () => {
              setIsExportingPDF(true);
              await new Promise(resolve => setTimeout(resolve, 200)); 

                  const element = document.getElementById('storyboard-pdf-container');
                  if (!element) {
                      setIsExportingPDF(false);
                      addToast("PDF container not found. Please try again.", 'error', 4000);
                      return;
                  }
                  const safeProjectName = (pdfConfig.title || activeProject.name).replace(/[^a-zA-Z0-9\s\-_]/g, '').trim().replace(/\s+/g, '_') || 'Storyboard';
                  try {
                      await html2pdf().set({
                          margin: 10, filename: `${safeProjectName}_Storyboard.pdf`,
                          image: { type: 'jpeg', quality: 0.98 },
                          html2canvas: { scale: 2, useCORS: true },
                          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                      }).from(element).save();
                  } catch(e) { 
                      console.error("PDF Export error: ", e); 
                      addToast("An error occurred during PDF generation. See console for details.", 'error', 5000);
                  } finally {
                      setIsExportingPDF(false);
                      setShowExportModal(false);
                  }
          };

          const SelectGroup = ({ icon, label, optionsKey, stateKey }) => {
              const disabledCategories = promptMode === 'video' ? (activePlatformRestrictions.disabledCategories || []) : [];
              const disabledOptions = promptMode === 'video' ? (activePlatformRestrictions.unsupported?.[optionsKey] || []) : [];
              const isDisabled = disabledCategories.includes(stateKey);

              return (
                <div className={`flex flex-col space-y-1.5 relative ${isDisabled ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
                  <label className="text-[11px] uppercase tracking-wider font-bold text-textMuted-light dark:text-textMuted-dark flex items-center justify-between">
                    <span className="flex items-center space-x-1">
                        <Icon name={icon} size={12} className="text-cyan-500" /><span>{label}</span>
                        {labelTooltips[optionsKey] && (
                            <Tooltip text={labelTooltips[optionsKey]}><Icon name="Info" size={10} className="ml-1 text-textMuted-light dark:text-textMuted-dark cursor-help hover:text-cyan-500 pointer-events-auto" /></Tooltip>
                        )}
                    </span>
                    {isDisabled && <span className="text-[9px] text-red-500 font-bold bg-red-500/10 px-1.5 py-0.5 rounded">UNSUPPORTED</span>}
                  </label>
                  <VisualSelect value={selections[stateKey]} onChange={(val) => handleSelectChange(stateKey, val)} optionsKey={optionsKey} optionsList={OPTIONS[optionsKey] || []} disabledOptions={disabledOptions} onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); openCtxMenu(e, 'parameter-field', { shotIndex: editingIndex, fieldKey: stateKey, fieldValue: selections[stateKey] }); }} />
                </div>
              );
          };

          const InteractiveLightingModal = () => {
              const [lightPos, setLightPos] = useState({ angle: 45, type: 'Rembrandt' });
              
              const handleLightClick = (angle, type) => {
                  setLightPos({ angle, type });
                  const term = `${type} lighting from ${angle === 0 ? 'front' : angle === 180 ? 'behind (rim light)' : angle > 0 && angle < 180 ? 'screen right' : 'screen left'}`;
                  setSelections(prev => ({ ...prev, lighting: term }));
                  setTimeout(() => setShowLightingStudio(false), 400);
              };

              return (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-base-light/80 dark:bg-base-dark/80 backdrop-blur-sm">
                       <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-slide-up">
                           <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between bg-input-light dark:bg-input-dark/50">
                               <h2 className="text-sm font-bold text-textMain-light dark:text-textMain-dark flex items-center space-x-2">
                                   <Icon name="Lightbulb" size={16} className="text-amber-500" />
                                   <span>Interactive Lighting Studio</span>
                               </h2>
                               <button onClick={() => setShowLightingStudio(false)} className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark"><Icon name="X" size={16} /></button>
                           </div>
                           <div className="p-8 flex justify-center items-center relative h-64">
                               <div className="w-24 h-24 rounded-full bg-border-light dark:bg-border-dark border-4 border-input-light dark:border-input-dark flex items-center justify-center z-10 shadow-inner relative">
                                    <div className="w-6 h-6 rounded-full bg-textMuted-light dark:text-textMuted-dark absolute -top-3"></div>
                                    <span className="text-[10px] font-bold text-textMuted-light dark:text-textMuted-dark mt-2">SUBJECT</span>
                               </div>
                               {/* Light Nodes */}
                               <button onClick={() => handleLightClick(0, 'Flat/Frontal')} className="absolute top-8 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)] border-2 border-white cursor-pointer hover:scale-110 transition-transform flex items-center justify-center" title="Flat/Frontal Lighting"></button>
                               <button onClick={() => handleLightClick(45, 'Rembrandt')} className="absolute top-16 right-16 w-8 h-8 rounded-full bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)] border-2 border-white cursor-pointer hover:scale-110 transition-transform flex items-center justify-center" title="Rembrandt (Screen Right)"></button>
                               <button onClick={() => handleLightClick(-45, 'Rembrandt')} className="absolute top-16 left-16 w-8 h-8 rounded-full bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)] border-2 border-white cursor-pointer hover:scale-110 transition-transform flex items-center justify-center" title="Rembrandt (Screen Left)"></button>
                               <button onClick={() => handleLightClick(90, 'Side/Split')} className="absolute top-1/2 -translate-y-1/2 right-8 w-8 h-8 rounded-full bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)] border-2 border-white cursor-pointer hover:scale-110 transition-transform flex items-center justify-center" title="Side/Split (Screen Right)"></button>
                               <button onClick={() => handleLightClick(-90, 'Side/Split')} className="absolute top-1/2 -translate-y-1/2 left-8 w-8 h-8 rounded-full bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)] border-2 border-white cursor-pointer hover:scale-110 transition-transform flex items-center justify-center" title="Side/Split (Screen Left)"></button>
                               <button onClick={() => handleLightClick(135, 'Rim/Kicker')} className="absolute bottom-16 right-16 w-8 h-8 rounded-full bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.6)] border-2 border-white cursor-pointer hover:scale-110 transition-transform flex items-center justify-center" title="Rim Light (Screen Right)"></button>
                               <button onClick={() => handleLightClick(-135, 'Rim/Kicker')} className="absolute bottom-16 left-16 w-8 h-8 rounded-full bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.6)] border-2 border-white cursor-pointer hover:scale-110 transition-transform flex items-center justify-center" title="Rim Light (Screen Left)"></button>
                               <button onClick={() => handleLightClick(180, 'Backlight/Silhouette')} className="absolute bottom-8 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.6)] border-2 border-white cursor-pointer hover:scale-110 transition-transform flex items-center justify-center" title="Backlight / Silhouette"></button>
                           </div>
                           <div className="p-4 bg-input-light dark:bg-input-dark/50 text-center text-xs text-textMuted-light dark:text-textMuted-dark">
                               Click a light node to instantly apply cinematic lighting angles to your prompt.
                           </div>
                       </div>
                  </div>
              );
          };

          const LanguageSelector = () => (
              <div className="flex items-center space-x-2 bg-input-light dark:bg-input-dark px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark shadow-sm">
                  <Icon name="Globe" size={14} className="text-textMuted-light dark:text-textMuted-dark shrink-0" />
                  <select value={lang} onChange={(e) => setLang(e.target.value)} className="bg-transparent text-xs text-textMain-light dark:text-textMain-dark font-bold outline-none cursor-pointer w-full flex-1">
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                      <option value="ru">Русский</option>
                      <option value="ht">Kreyòl Ayisyen</option>
                  </select>
              </div>
          );

          const ThemeSelector = () => (
              <div className="flex items-center space-x-2 bg-input-light dark:bg-input-dark px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark shadow-sm">
                  {THEMES.map(t => (
                      <button
                          key={t.id}
                          onClick={() => setThemeColor(t.id)}
                          className={`w-4 h-4 rounded-full transition-transform ${themeColor === t.id ? 'ring-2 ring-offset-1 ring-offset-input-light dark:ring-offset-input-dark ring-textMain-light dark:ring-textMain-dark scale-110' : 'hover:scale-110'}`}
                          style={{ backgroundColor: t.hex }}
                          title={`${t.name} Theme`}
                      />
                  ))}
              </div>
          );

          const AccentSelector = () => (
              <div className="flex items-center space-x-1.5 bg-input-light dark:bg-input-dark px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark shadow-sm">
                  {ACCENTS.map(a => (
                      <button
                          key={a.id}
                          onClick={() => setAccentColor(a.id)}
                          className={`w-3.5 h-3.5 rounded-full transition-transform ${accentColor === a.id ? 'ring-2 ring-offset-1 ring-offset-input-light dark:ring-offset-input-dark ring-textMain-light dark:ring-textMain-dark scale-110' : 'hover:scale-110'}`}
                          style={{ backgroundColor: a.hex }}
                          title={`${a.name} Accent`}
                      />
                  ))}
              </div>
          );

          const UIStyleSelector = () => (
              <div className="flex items-center space-x-2 bg-input-light dark:bg-input-dark px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark shadow-sm">
                  <Icon name="Monitor" size={14} className="text-textMuted-light dark:text-textMuted-dark shrink-0" />
                  <select value={uiStyle} onChange={(e) => setUiStyle(e.target.value)} className="bg-transparent text-xs text-textMain-light dark:text-textMain-dark font-bold outline-none cursor-pointer w-full flex-1">
                      <option value="default">Standard UI</option>
                      <option value="glass">Apple Glass</option>
                      <option value="cinematic">Cinematic Pro</option>
                      <option value="mr-re">Mr RE UI</option>
                  </select>
              </div>
          );

          const Sidebar = () => (
              <aside className={`${isSidebarOpen ? 'w-64' : 'w-[72px]'} flex flex-col transition-all duration-300 border-r border-border-light dark:border-border-dark bg-panel-light dark:bg-panel-dark h-full shrink-0 z-50 shadow-md`}>
                  <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark h-[74px] shrink-0">
                      {isSidebarOpen && (
                          <div className="flex items-center space-x-3 overflow-hidden ml-1">
                              <img src="logo.png" alt="MOKHA" className="w-8 h-8 object-contain shrink-0 drop-shadow-md" onError={(e) => { e.target.style.display = 'none'; }} />
                              <span className="font-bold text-primary tracking-widest text-lg">MOKHA</span>
                          </div>
                      )}
                      <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-2 rounded-lg bg-input-light dark:bg-input-dark text-textMuted-light dark:text-textMuted-dark hover:text-primary transition-colors border border-border-light dark:border-border-dark shadow-sm ${!isSidebarOpen ? 'mx-auto' : ''}`}>
                          <Icon name="Menu" size={18} />
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar py-4 px-3 flex flex-col space-y-6">
                      <div className="flex flex-col space-y-2">
                          {isSidebarOpen && <span className="text-[10px] font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-wider px-2 mb-1">Navigation</span>}
                          <button onClick={() => setCurrentView('dashboard')} className={`flex items-center space-x-3 p-2.5 rounded-xl transition-all ${currentView === 'dashboard' ? 'bg-primary text-white shadow-md' : 'text-textMuted-light dark:text-textMuted-dark hover:bg-input-light dark:hover:bg-border-dark hover:text-textMain-light dark:hover:text-textMain-dark'}`} title={t('dashboard')}>
                              <Icon name="Home" size={20} className={currentView === 'dashboard' ? "text-white" : "shrink-0"} />
                              {isSidebarOpen && <span className="font-bold">{t('dashboard')}</span>}
                          </button>
                          <button onClick={() => { if(projects.length > 0) setCurrentView('editor'); }} className={`flex items-center space-x-3 p-2.5 rounded-xl transition-all ${currentView === 'editor' ? 'bg-primary text-white shadow-md' : 'text-textMuted-light dark:text-textMuted-dark hover:bg-input-light dark:hover:bg-border-dark hover:text-textMain-light dark:hover:text-textMain-dark'}`} title={t('openEditor')}>
                              <Icon name="Edit2" size={20} className={currentView === 'editor' ? "text-white" : "shrink-0"} />
                              {isSidebarOpen && <span className="font-bold truncate">{activeProject?.name || 'Editor'}</span>}
                          </button>
                      </div>

                      <div className="flex flex-col space-y-2">
                          {isSidebarOpen && <span className="text-[10px] font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-wider px-2 mb-1">Libraries</span>}
                          <button onClick={() => setShowPromptLibraryModal(true)} className="flex items-center space-x-3 p-2.5 rounded-xl text-textMuted-light dark:text-textMuted-dark hover:bg-input-light dark:hover:bg-border-dark hover:text-green-500 transition-colors" title={t('promptLibrary')}>
                              <Icon name="Database" size={20} className="text-green-500 shrink-0" />
                              {isSidebarOpen && <span className="font-medium">{t('promptLibrary')}</span>}
                          </button>
                          <button onClick={() => setShowGlobalCharModal(true)} className="flex items-center space-x-3 p-2.5 rounded-xl text-textMuted-light dark:text-textMuted-dark hover:bg-input-light dark:hover:bg-border-dark hover:text-accent transition-colors" title={t('characters')}>
                              <Icon name="Users" size={20} className="text-accent shrink-0" />
                              {isSidebarOpen && <span className="font-medium">{t('characters')}</span>}
                          </button>
                          <button onClick={() => setShowGlobalLocModal(true)} className="flex items-center space-x-3 p-2.5 rounded-xl text-textMuted-light dark:text-textMuted-dark hover:bg-input-light dark:hover:bg-border-dark hover:text-amber-500 transition-colors" title={t('locations')}>
                              <Icon name="MapPin" size={20} className="text-amber-500 shrink-0" />
                              {isSidebarOpen && <span className="font-medium">{t('locations')}</span>}
                          </button>
                          <button onClick={() => setShowGlobalVoiceModal(true)} className="flex items-center space-x-3 p-2.5 rounded-xl text-textMuted-light dark:text-textMuted-dark hover:bg-input-light dark:hover:bg-border-dark hover:text-indigo-500 transition-colors" title={t('voices')}>
                              <Icon name="Mic" size={20} className="text-indigo-500 shrink-0" />
                              {isSidebarOpen && <span className="font-medium">{t('voices')}</span>}
                          </button>
                          <button onClick={() => setShowGlossaryModal(true)} className="flex items-center space-x-3 p-2.5 rounded-xl text-textMuted-light dark:text-textMuted-dark hover:bg-input-light dark:hover:bg-border-dark hover:text-cyan-500 transition-colors" title={t('glossary')}>
                              <Icon name="BookOpen" size={20} className="text-cyan-500 shrink-0" />
                              {isSidebarOpen && <span className="font-medium">{t('glossary')}</span>}
                          </button>
                      </div>

                      <div className="flex flex-col space-y-3 mt-auto pt-6">
                          {isSidebarOpen && <span className="text-[10px] font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-wider px-2">Preferences</span>}
                          <button onClick={() => setShowShortcutsModal(true)} className="flex items-center space-x-3 p-2.5 rounded-xl text-textMuted-light dark:text-textMuted-dark hover:bg-input-light dark:hover:bg-border-dark hover:text-textMain-light transition-colors" title="Keyboard Shortcuts">
                              <Icon name="Keyboard" size={20} className="shrink-0" />
                              {isSidebarOpen && <span className="font-medium">Shortcuts</span>}
                          </button>
                          {/* Feature 3 — History */}
                          <button onClick={() => setShowHistoryPanel(true)} className="flex items-center space-x-3 p-2.5 rounded-xl text-textMuted-light dark:text-textMuted-dark hover:bg-input-light dark:hover:bg-border-dark hover:text-primary transition-colors" title="Prompt History">
                              <Icon name="Clock" size={20} className="shrink-0"/>
                              {isSidebarOpen && <div className="flex items-center justify-between flex-1"><span className="font-medium">History</span>{promptHistory.length > 0 && <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-black">{promptHistory.length}</span>}</div>}
                          </button>
                          {/* Feature 4 — Favorites */}
                          <button onClick={() => setShowFavoritesPanel(true)} className="flex items-center space-x-3 p-2.5 rounded-xl text-textMuted-light dark:text-textMuted-dark hover:bg-input-light dark:hover:bg-border-dark hover:text-amber-400 transition-colors" title="Pinned Shots">
                              <Icon name="Tag" size={20} className="shrink-0"/>
                              {isSidebarOpen && <div className="flex items-center justify-between flex-1"><span className="font-medium">Pinned</span>{favorites.length > 0 && <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-black">{favorites.length}</span>}</div>}
                          </button>
                          {/* Feature 1 — Cinematic Themes */}
                          <button onClick={() => setShowThemePicker(true)} className="flex items-center space-x-3 p-2.5 rounded-xl text-textMuted-light dark:text-textMuted-dark hover:bg-input-light dark:hover:bg-border-dark hover:text-accent transition-colors" title="Cinematic Themes">
                              <Icon name="Aperture" size={20} className="shrink-0"/>
                              {isSidebarOpen && <div className="flex items-center justify-between flex-1"><span className="font-medium">Themes</span><span className="text-[8px] px-1.5 py-0.5 rounded-full font-black" style={{background:`rgb(var(--color-primary)/0.2)`,color:`rgb(var(--color-primary))`}}>{CINEMATIC_THEMES.find(t=>t.id===cinematicTheme)?.label || 'Gold'}</span></div>}
                          </button>
                          {/* Feature 6 — Command Palette hint */}
                          <button onClick={() => setShowCommandPalette(true)} className="flex items-center space-x-3 p-2.5 rounded-xl text-textMuted-light dark:text-textMuted-dark hover:bg-input-light dark:hover:bg-border-dark hover:text-textMain-light transition-colors" title="Command Palette (Ctrl+K)">
                              <Icon name="Search" size={20} className="shrink-0"/>
                              {isSidebarOpen && <div className="flex items-center justify-between flex-1"><span className="font-medium">Commands</span><kbd className="text-[8px] px-1 py-0.5 rounded bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark font-mono">⌘K</kbd></div>}
                          </button>
                          {/* Feature 8 — Auto-save */}
                          {isSidebarOpen && <div className="px-2 py-1"><AutoSaveIndicator lastSaved={lastSaved} isSaving={isSaving}/></div>}
                          <button onClick={() => setIsDarkMode(!isDarkMode)} className="flex items-center space-x-3 p-2.5 rounded-xl text-textMuted-light dark:text-textMuted-dark hover:bg-input-light dark:hover:bg-border-dark hover:text-textMain-light transition-colors" title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                              <Icon name={isDarkMode ? "Sun" : "Moon"} size={20} className="shrink-0" />
                              {isSidebarOpen && <span className="font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
                          </button>
                          <button onClick={() => setShowSettings(true)} className="flex items-center space-x-3 p-2.5 rounded-xl text-textMuted-light dark:text-textMuted-dark hover:bg-input-light dark:hover:bg-border-dark hover:text-textMain-light transition-colors relative" title="Performance Settings">
                              <Icon name="Settings" size={20} className="shrink-0" />
                              {updateAvailable && <span className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-accent animate-pulse"/>}
                              {isSidebarOpen && <span className="font-medium">Settings{updateAvailable ? <span className="ml-1.5 text-[8px] font-black text-accent">UPDATE</span> : ''}</span>}
                          </button>
                          {/* API Settings button */}
                          <button onClick={() => setShowApiSettingsModal(true)} className="flex items-center space-x-3 p-2.5 rounded-xl text-textMuted-light dark:text-textMuted-dark hover:bg-input-light dark:hover:bg-border-dark hover:text-textMain-light transition-colors" title="API Keys & Generation Settings">
                              <Icon name="Zap" size={20} className="shrink-0 text-purple-400" />
                              {isSidebarOpen && <span className="font-medium">API Keys</span>}
                          </button>
                          
                          {isSidebarOpen ? (
                              <div className="flex flex-col space-y-3 px-2 pb-2">
                                  <ThemeSelector />
                                  <AccentSelector />
                                  <UIStyleSelector />
                                  <LanguageSelector />
                              </div>
                          ) : (
                              <div className="flex flex-col items-center space-y-5 pt-2 pb-4">
                                  <div className="cursor-pointer text-textMuted-light hover:text-textMain-light" onClick={() => setShowShortcutsModal(true)} title="Keyboard Shortcuts"><Icon name="Keyboard" size={18} /></div>
                                  <div className="w-4 h-4 rounded-full ring-2 ring-offset-1 ring-offset-panel-light dark:ring-offset-panel-dark ring-border-light dark:ring-border-dark cursor-pointer" style={{backgroundColor: THEMES.find(t=>t.id===themeColor)?.hex}} onClick={() => setIsSidebarOpen(true)} title="Theme"></div>
                                  <div className="w-3.5 h-3.5 rounded-full ring-2 ring-offset-1 ring-offset-panel-light dark:ring-offset-panel-dark ring-border-light dark:ring-border-dark cursor-pointer" style={{backgroundColor: ACCENTS.find(a=>a.id===accentColor)?.hex}} onClick={() => setIsSidebarOpen(true)} title="Accent"></div>
                                  <div className="cursor-pointer text-textMuted-light hover:text-textMain-light" onClick={() => setIsSidebarOpen(true)} title="Language"><Icon name="Globe" size={18} /></div>
                                  <div className="cursor-pointer text-textMuted-light hover:text-textMain-light" onClick={() => setIsSidebarOpen(true)} title="App UI Style"><Icon name="Monitor" size={18} /></div>
                              </div>
                          )}
                      </div>
                  </div>
              </aside>
          );
          
          const StoryboardPDF = () => {
              const paramDetails = {
                  shotType: { icon: 'Camera', label: 'Shot Type' },
                  shotStyle: { icon: 'Wand2', label: 'Style' },
                  camera: { icon: 'Video', label: 'Camera' },
                  lens: { icon: 'Aperture', label: 'Lens' },
                  aperture: { icon: 'Aperture', label: 'Aperture' },
                  angle: { icon: 'Move', label: 'Angle' },
                  lighting: { icon: 'Lightbulb', label: 'Lighting' },
                  movement: { icon: 'Move', label: 'Movement' },
                  actionSpeed: { icon: 'Timer', label: 'Speed' },
                  duration: { icon: 'Clock', label: 'Duration' },
                  transition: { icon: 'Film', label: 'Transition' },
                  filmStock: { icon: 'Film', label: 'Film Stock' },
                  aspectRatio: { icon: 'Maximize', label: 'Aspect Ratio' }
              };

              const glossaryTerms = Object.entries(labelTooltips).map(([key, value]) => ({
                  term: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                  def: value
              }));

              return (
                  <div id="storyboard-pdf-container" className="absolute -left-[10000px] top-0 w-[800px] bg-gray-50 text-gray-800 p-10 font-sans">
                      {/* Cover Page */}
                      <div className="text-center mb-12">
                          {pdfConfig.studioLogo && (
                              <img src={pdfConfig.studioLogo} className="h-16 object-contain mx-auto mb-6" alt="Studio Logo" />
                          )}
                          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">{pdfConfig.title}</h1>
                          <p className="text-lg text-gray-500 mt-2">Storyboard & Prompt Guide</p>
                          <p className="text-md text-gray-600 mt-4 max-w-2xl mx-auto">{pdfConfig.description}</p>
                          <p className="text-sm text-gray-400 mt-8">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>

                      {/* Scenes and Shots */}
                      {activeProject.scenes.map((scene, sIdx) => (
                          <div key={sIdx} className="mb-10 page-break-inside-avoid">
                              <h2 className="text-2xl font-semibold text-gray-800 border-l-4 border-blue-500 pl-4 mb-6">
                                  Scene {sIdx + 1}: {scene.name}
                              </h2>
                              <div className={pdfConfig.layout === 'grid' ? "grid grid-cols-1 gap-6" : "space-y-6"}>
                                  {scene.shots.map((shot, idx) => (
                                      <div key={idx} className="bg-white rounded-2xl shadow-lg border border-gray-200/80 p-6 page-break-inside-avoid">
                                          <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
                                              <h3 className="text-xl font-bold text-blue-600">Shot {idx + 1}</h3>
                                              {shot.tags && shot.tags.length > 0 && (
                                                  <div className="flex gap-2">
                                                      {shot.tags.map(tag => <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 font-medium px-2 py-1 rounded-full">{tag}</span>)}
                                                  </div>
                                              )}
                                          </div>

                                          <p className="text-gray-700 mb-4 italic">"{shot.subject}"</p>

                                          {shot.referenceImages && shot.referenceImages.length > 0 && (
                                              <div className="mb-4">
                                                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Reference Images</h4>
                                                  <div className="grid grid-cols-4 gap-2">
                                                      {shot.referenceImages.map((img, i) => (
                                                          <img key={i} src={img.data} className="w-full h-auto object-cover rounded-lg border border-gray-200" />
                                                      ))}
                                                  </div>
                                              </div>
                                          )}

                                          <div className="bg-gray-50/70 rounded-xl border border-gray-200/60 p-4">
                                              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Shot Parameters</h4>
                                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                                                  {Object.entries(shot.selections).map(([key, value]) => {
                                                      if (!value || !paramDetails[key]) return null;
                                                      return (
                                                          <div key={key} className="flex items-start">
                                                              <Icon name={paramDetails[key].icon} size={16} className="text-blue-500 mr-2 mt-0.5 shrink-0" />
                                                              <div>
                                                                  <p className="text-[10px] font-bold text-gray-400 uppercase">{paramDetails[key].label}</p>
                                                                  <p className="text-sm font-medium text-gray-800">{value}</p>
                                                              </div>
                                                          </div>
                                                      );
                                                  })}
                                              </div>
                                          </div>

                                          {shot.dialogues && shot.dialogues.length > 0 && (
                                              <div className="mt-4">
                                                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Dialogue</h4>
                                                  <div className="space-y-2 text-sm">
                                                      {shot.dialogues.map((d, i) => (
                                                          <p key={i}><strong className="text-blue-700">{d.character}:</strong> {d.text}</p>
                                                      ))}
                                                  </div>
                                              </div>
                                          )}

                                          <div className="mt-5">
                                              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Generated Prompt</h4>
                                              <pre className="text-xs text-gray-600 font-mono bg-gray-900 text-gray-200 p-4 rounded-lg whitespace-pre-wrap w-full overflow-x-auto"><code>{getFinalPromptText(shot)}</code></pre>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      ))}

                      {/* Glossary Page */}
                      <div className="pt-10" style={{ breakBefore: 'page', pageBreakBefore: 'always' }}>
                          <h2 className="text-2xl font-semibold text-gray-800 border-l-4 border-green-500 pl-4 mb-6">
                              Cinematic Glossary & Legend
                          </h2>
                          <p className="text-gray-600 mb-8">This guide explains the technical and stylistic terms used in the prompts to help you understand the creative intent behind each shot.</p>
                          <div className="space-y-4">
                              {glossaryTerms.map((item, idx) => (
                                  <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4 grid grid-cols-3 gap-4">
                                      <h4 className="col-span-1 font-bold text-sm text-gray-800">{item.term}</h4>
                                      <p className="col-span-2 text-sm text-gray-600">{item.def}</p>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              );
          };

          const toggleTrope = (trope) => {
              let arr = negativePrompt.split(',').map(s => s.trim()).filter(Boolean);
              if (arr.includes(trope)) {
                  arr = arr.filter(t => t !== trope);
              } else {
                  arr.push(trope);
              }
              setNegativePrompt(arr.join(', '));
          };

          const togglePlayback = () => {
              if (shots.length === 0) return;
              setIsPlaying(prev => {
                  if (!prev && playheadTime >= getSceneDurationNum()) {
                      setPlayheadTime(0);
                  }
                  return !prev;
              });
          };

          useEffect(() => {
              let interval;
              if (isPlaying) {
                  interval = setInterval(() => {
                      setPlayheadTime(prev => {
                          const next = prev + 0.05;
                          const max = getSceneDurationNum();
                          if (next >= max) {
                              setIsPlaying(false);
                              return max;
                          }
                          return next;
                      });
                  }, 50);
              }
              return () => clearInterval(interval);
          }, [isPlaying, shots]);

          useEffect(() => {
              const handleKeyDown = (e) => {
                  const key = typeof e.key === 'string' ? e.key : '';
                  const tag = String(e.target?.tagName || '').toLowerCase();
                  const isInput = ['input', 'textarea', 'select'].includes(tag) || Boolean(e.target?.isContentEditable);
                  const pushKey = (keys) => {
                      if (e.code === 'Space') keys.push('space');
                      else if (key && !['Control', 'Alt', 'Shift', 'Meta', 'AltGraph'].includes(key)) keys.push(key.toLowerCase());
                  };
                  // Handle recording new shortcut
                  if (recordingShortcutFor) {
                      e.preventDefault();
                      let keys = [];
                      if (e.ctrlKey || e.metaKey) keys.push('ctrl');
                      if (e.altKey) keys.push('alt');
                      if (e.shiftKey) keys.push('shift');
                      pushKey(keys);
                      
                      if (keys.length > 0 && !['ctrl', 'alt', 'shift'].includes(keys[keys.length-1])) {
                          setShortcuts(prev => ({ ...prev, [recordingShortcutFor]: { ...prev[recordingShortcutFor], keys: keys.join('+') } }));
                          setRecordingShortcutFor(null);
                      }
                      return;
                  }

                  // Typing, including AltGr (reported as ctrl+alt with no key name on some layouts), stays in the field.
                  const altGraph = e.ctrlKey && e.altKey && !e.metaKey;
                  if (isInput && key !== 'Escape' && (altGraph || (!e.ctrlKey && !e.altKey && !e.metaKey))) return;
                  if (!key && e.code !== 'Space') return;

                  let keys = [];
                  if (e.ctrlKey || e.metaKey) keys.push('ctrl');
                  if (e.altKey) keys.push('alt');
                  if (e.shiftKey) keys.push('shift');
                  pushKey(keys);
                  
                  const combo = keys.join('+');

                  if (combo === shortcuts.saveProject?.keys) {
                      e.preventDefault(); handleSaveProject();
                  } else if (combo === shortcuts.clearForm?.keys) {
                      e.preventDefault(); clearForm(); textareaRef.current?.focus();
                  } else if (combo === shortcuts.duplicateShot?.keys) {
                      e.preventDefault(); if (shots.length > 0) handleDuplicateShot(editingIndex >= 0 ? editingIndex : shots.length - 1);
                  } else if (combo === shortcuts.undo?.keys) {
                      e.preventDefault(); handleUndo();
                  } else if (combo === shortcuts.redo?.keys) {
                      e.preventDefault(); handleRedo();
                  } else if (combo === shortcuts.addShot?.keys) {
                      e.preventDefault(); handleAddOrUpdateShot();
                  } else if (combo === shortcuts.nextScene?.keys) {
                      e.preventDefault(); const idx = scenes.findIndex(s => s.id === activeSceneId);
                      if (idx < scenes.length - 1) { setActiveSceneId(scenes[idx + 1].id); setEditingIndex(-1); clearForm(); }
                  } else if (combo === shortcuts.prevScene?.keys) {
                      e.preventDefault(); const idx = scenes.findIndex(s => s.id === activeSceneId);
                      if (idx > 0) { setActiveSceneId(scenes[idx - 1].id); setEditingIndex(-1); clearForm(); }
                  } else if (combo === shortcuts.togglePlayback?.keys) {
                      e.preventDefault(); togglePlayback();
                  }
              };
              window.addEventListener('keydown', handleKeyDown);
              return () => window.removeEventListener('keydown', handleKeyDown);
          }, [shortcuts, activeSceneId, scenes, shots, editingIndex, historyPast, historyFuture, isPlaying, playheadTime, recordingShortcutFor]);

          const handleParseScript = () => {
              if (!scriptParserText.trim()) return;
              setIsGenerating(true);
              setTimeout(() => {
                  const generatedShots = LocalAIEngine.parseScreenplay(scriptParserText).map(shot => {
                      const mergedSelections = { ...shot.selections };
                      Object.keys(activeProject.defaultParams || {}).concat(Object.keys(aiModel === 'MY STYLE' ? myStyle.strictDefaults : {})).forEach(key => { if (!mergedSelections[key]) mergedSelections[key] = (aiModel === 'MY STYLE' ? myStyle.strictDefaults : {})[key] || (activeProject.defaultParams || {})[key] || ""; });
                      if (!mergedSelections.aperture) mergedSelections.aperture = "f/2.8";
                      if (!mergedSelections.aspectRatio) mergedSelections.aspectRatio = "--ar 16:9";
                      const suggestions = LocalAIEngine.analyzeTextForSuggestions(shot.subject, 'video');
                      return { ...shot, selections: { ...mergedSelections, ...suggestions.selections }, sfx: suggestions.sfx || "", bgm: suggestions.bgm || "" };
                  });
                  
                  updateActiveShots(prev => [...prev, ...generatedShots]);
                  setShowScriptParserModal(false);
                  setScriptParserText("");
                  setIsGenerating(false);
              }, 100);
          };

          const initializeLLM = async () => {
              if (!webLlmLibReady) { return; }
              if (!navigator.gpu) { addToast("WebGPU is not supported in this browser. Please use Chrome/Edge on a device with a dedicated GPU.", 'error', 6000); return; }
              
              try {
                  setLlmLoadingProgress("Initializing WebGPU...");
                  const selectedModel = "Phi-3-mini-4k-instruct-q4f16_1-MLC"; 
                  const engine = new window.webllm.MLCEngine();
                  engine.setInitProgressCallback((progress) => {
                      setLlmLoadingProgress(`Loading Model: ${Math.round(progress.progress * 100)}%`);
                  });
                  await engine.reload(selectedModel);
                  setLlmEngine(engine);
                  setIsLlmReady(true);
                  setLlmLoadingProgress(null);
              } catch (err) {
                  console.error(err);
                  setLlmLoadingProgress("Error: See console.");
                  addToast("Could not load local AI model: " + err.message, 'error', 5000);
              }
          };

          // ── Model Unload — frees VRAM/RAM immediately ───────────────────
          const handleUnloadLLM = async () => {
              if (!llmEngine) return;
              try {
                  if (typeof llmEngine.unload === 'function') await llmEngine.unload();
              } catch(e) { console.warn('Engine unload error:', e); }
              setLlmEngine(null);
              setIsLlmReady(false);
              setLlmLoadingProgress(null);
              addToast('AI model unloaded — VRAM/RAM freed ✓', 'success');
          };

          // ── Session Recovery — emergency save on tab close ──────────────
          useEffect(() => {
              const handleBeforeUnload = () => {
                  try {
                      // Flush any pending debounced saves immediately
                      localStorage.setItem('mokha_projects', JSON.stringify(projects));
                      localStorage.setItem('mokha_stories', JSON.stringify(stories));
                      localStorage.setItem('mokha_session_recovery', JSON.stringify({
                          activeProjectId,
                          activeSceneId,
                          timestamp: Date.now()
                      }));
                  } catch(e) {}
              };
              window.addEventListener('beforeunload', handleBeforeUnload);
              return () => window.removeEventListener('beforeunload', handleBeforeUnload);
          }, [projects, stories, activeProjectId, activeSceneId]);

          // Restore session on load
          useEffect(() => {
              try {
                  const recovery = localStorage.getItem('mokha_session_recovery');
                  if (recovery) {
                      const { activeProjectId: savedProjId, activeSceneId: savedSceneId, timestamp } = JSON.parse(recovery);
                      const age = Date.now() - timestamp;
                      // Only restore if session was less than 24h ago
                      if (age < 86400000) {
                          if (savedProjId && projects.find(p => p.id === savedProjId)) {
                              setActiveProjectId(savedProjId);
                          }
                          if (savedSceneId) setActiveSceneId(savedSceneId);
                      }
                  }
              } catch(e) {}
          }, []);

          const handleParseScriptLLM = async () => {
              if (!scriptParserText.trim() || !llmEngine) return;
              setIsGenerating(true);
              try {
                  const prompt = `You are a professional storyboard artist and cinematographer. Analyze the following screenplay segment and break it down into a sequential list of camera shots. 
For each shot, extract:
1. "subject": The main action or subject description.
2. "shotType": Choose from: "Extreme Wide Shot (EWS)", "Wide Shot (WS)", "Full Shot (FS)", "Medium Shot (MS)", "Close-Up (CU)", "Extreme Close-Up (ECU)", "Point of View (POV)".
3. "movement": Choose from: "Static / Tripod", "Pan Left", "Pan Right", "Tilt Up", "Tilt Down", "Tracking / Follow", "Handheld / Shaky", "Zoom In".
4. "duration": A string like "2.0s" or "3.5s".
5. "dialogues": An array of objects with "character" (string) and "text" (string). If no dialogue in the shot, leave empty [].

Screenplay:
${scriptParserText}

Output strictly valid JSON as an array of objects. Do not include markdown code blocks, just the JSON array.`;

                  const reply = await llmEngine.chat.completions.create({ messages: [{ role: "user", content: prompt }], temperature: 0.1 });
                  const responseText = reply.choices[0].message.content;
                  
                  const jsonStart = responseText.indexOf('[');
                  const jsonEnd = responseText.lastIndexOf(']') + 1;
                  if (jsonStart === -1 || jsonEnd === 0) throw new Error("No JSON array found in response");
                  
                  const parsed = JSON.parse(responseText.slice(jsonStart, jsonEnd));
                  const generatedShots = parsed.map(shot => {
                      const mergedSelections = { shotType: shot.shotType || "", movement: shot.movement || "", duration: shot.duration || "2.0s", aperture: "f/2.8", aspectRatio: "--ar 16:9" };
                      Object.keys(activeProject.defaultParams || {}).concat(Object.keys(aiModel === 'MY STYLE' ? myStyle.strictDefaults : {})).forEach(key => { if (!mergedSelections[key]) mergedSelections[key] = (aiModel === 'MY STYLE' ? myStyle.strictDefaults : {})[key] || (activeProject.defaultParams || {})[key] || ""; });
                      return { subject: shot.subject || "[Action]", selections: mergedSelections, sfx: "", bgm: "", dialogues: (shot.dialogues || []).map(d => ({ character: d.character || "", text: d.text || "", mood: "", reaction: "", event: "", voiceStyle: "" })), mode: promptMode, status: 'Planning', tags: [], referenceImages: [], customPromptOverride: null };
                  });
                  
                  updateActiveShots(prev => [...prev, ...generatedShots]);
                  setShowScriptParserModal(false);
                  setScriptParserText("");
              } catch (err) {
                  console.error("LLM Parse Error:", err);
                  addToast("LLM Parsing Failed. Falling back to standard Regex parser.", 'warning', 4000);
                  handleParseScript(); 
              } finally { setIsGenerating(false); }
          };

          // --- LLaVA-1.5 LOCAL VISION AI (via Ollama) ---
          const storyboardFileInputRef = React.useRef(null);
          const storyboardAbortRef = React.useRef(null);
          const [storyboardProgress, setStoryboardProgress] = useState(null);
          const [showStoryboardPromptModal, setShowStoryboardPromptModal] = useState(false);
          const [storyboardCustomPrompt, setStoryboardCustomPrompt] = useState('');
          const [pendingStoryboardImage, setPendingStoryboardImage] = useState(null);
          // ── Storyboard AI model selector ────────────────────────────────
          const [showStoryboardAiModal, setShowStoryboardAiModal] = useState(false);
          const [storyboardAiMode, setStoryboardAiMode] = useState(() => localStorage.getItem('storyboard_ai_mode') || 'llava'); // 'llava' | 'webllm' | 'api'
          const [storyboardApiProvider, setStoryboardApiProvider] = useState(() => localStorage.getItem('storyboard_api_provider') || 'gemini');
          const [isLlavaReady, setIsLlavaReady] = useState(false);
          const [isLlavaChecking, setIsLlavaChecking] = useState(false);
          const [llavaOllamaUrl] = useState('http://localhost:11434');

          // Auto-connect to LLaVA on startup with retries (for Electron/exe)
          useEffect(() => {
              let attempts = 0;
              const maxAttempts = 10;
              const tryConnect = async () => {
                  try {
                      const res = await fetch(`${llavaOllamaUrl}/api/tags`, { method: 'GET', mode: 'cors', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(3000) });
                      if (!res.ok) throw new Error();
                      const data = await res.json();
                      const hasLlava = (data.models || []).some(m => m.name.toLowerCase().includes('llava'));
                      if (hasLlava) { setIsLlavaReady(true); return; }
                  } catch {}
                  attempts++;
                  if (attempts < maxAttempts) setTimeout(tryConnect, 3000);
              };
              // Start trying after 2 seconds to give Ollama time to boot
              setTimeout(tryConnect, 2000);
          }, []);

          const checkLLaVA = async () => {
              setIsLlavaChecking(true);
              try {
                  const res = await fetch(`${llavaOllamaUrl}/api/tags`, { method: 'GET', mode: 'cors', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(5000) });
                  if (!res.ok) throw new Error();
                  const data = await res.json();
                  const hasLlava = (data.models || []).some(m => m.name.toLowerCase().includes('llava'));
                  setIsLlavaReady(hasLlava);
                  if (!hasLlava) addToast('Ollama is running but no LLaVA model found.\nRun: ollama pull llava:7b', 'warning', 6000);
              } catch { setIsLlavaReady(false); addToast('Cannot reach Ollama at ' + llavaOllamaUrl + '.\nMake sure Ollama is running: https://ollama.com', 'error', 6000); }
              finally { setIsLlavaChecking(false); }
          };

          const callLLaVA = async (prompt, imageDataUrl, signal) => {
              const base64 = imageDataUrl.split(',')[1];
              const fetchOptions = {
                  method: 'POST',
                  mode: 'cors',
                  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                  body: JSON.stringify({ model: 'llava:7b', prompt, images: [base64], stream: false })
              };
              if (signal) fetchOptions.signal = signal;
              const res = await fetch(`${llavaOllamaUrl}/api/generate`, fetchOptions);
              if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
              const data = await res.json();
              return data.response || '';
          };

          const handleLLaVASuggest = async () => {
              if (!isLlavaReady) { addToast('LLaVA not connected. Use the Script Parser AI panel to connect.', 'warning', 5000); return; }
              if (referenceImages.length === 0) { addToast('Add at least one reference image first.', 'warning', 3000); return; }
              setIsGenerating(true);
              try {
                  const desc = await callLLaVA(
                      'You are a cinematographer. Describe this image as a concise cinematic shot description for an AI video generator. Include subject, action, mood, lighting, and style. Output only the description.',
                      referenceImages[0].data
                  );
                  if (desc.trim()) {
                      setSubject(prev => prev ? prev + ' ' + desc.trim() : desc.trim());
                      const suggestions = LocalAIEngine.analyzeTextForSuggestions(desc, promptMode);
                      setSelections(prev => ({ ...prev, ...suggestions.selections }));
                  }
              } catch (err) { addToast('LLaVA error: ' + err.message, 'error', 4000); }
              finally { setIsGenerating(false); }
          };

          const [llavaMonitorLog, setLlavaMonitorLog] = useState([]);

          const handleLLaVAStoryField = async (imageDataUrl, field, onResult, section) => {
              if (!isLlavaReady) { addToast('LLaVA not connected.', 'warning', 3000); return; }
              const prompts = {
                  character: 'Describe the character in this image: appearance, demeanor, implied backstory. 1-2 sentences.',
                  world: 'Describe the world/environment: setting, atmosphere, visual tone. 1-2 sentences.',
                  incident: 'What dramatic event does this image suggest as a story inciting incident? 1-2 sentences.',
                  obstacles: 'What challenges or obstacles does this image convey? 1-2 sentences.',
                  midpoint: 'Describe the turning point this image suggests. 1-2 sentences.',
                  stakes: 'What stakes are implied by this image? What could be lost? 1-2 sentences.',
                  climax: 'Describe the climactic moment this image represents. 1-2 sentences.',
                  resolution: 'Describe the resolution this image suggests. 1-2 sentences.',
                  aftermath: 'Describe the final state or new normal this image conveys. 1-2 sentences.',
                  visualStyle: 'Describe the visual style, color palette, and cinematographic aesthetic. 1-2 sentences.',
              };
              const logId = Date.now();
              const fieldLabel = field.charAt(0).toUpperCase() + field.slice(1);
              // Add to monitor log as "processing"
              const sectionLabel = { act1: 'Act 1', act2: 'Act 2', act3: 'Act 3', dramatic: 'Dramatic Keys', theme: 'Theme' }[section] || section || '';
              setLlavaMonitorLog(prev => [...prev, { id: logId, field: fieldLabel, section: sectionLabel, status: 'processing', result: null, ts: new Date().toLocaleTimeString() }]);
              setIsGenerating(true);
              try {
                  const result = await callLLaVA(prompts[field] || 'Describe this image cinematically in 1-2 sentences.', imageDataUrl);
                  if (result.trim()) {
                      onResult(result.trim());
                      setLlavaMonitorLog(prev => prev.map(l => l.id === logId ? { ...l, status: 'done', result: result.trim().substring(0, 120) + (result.length > 120 ? '...' : '') } : l));
                  }
              } catch (err) {
                  setLlavaMonitorLog(prev => prev.map(l => l.id === logId ? { ...l, status: 'error', result: err.message } : l));
                  addToast('LLaVA error: ' + err.message, 'error', 4000);
              }
              finally { setIsGenerating(false); }
          };

          const handleStoryboardImport = async (imageDataUrl, customPrompt) => {
              if (!isLlavaReady) { addToast('LLaVA not connected. Open the Script Parser modal and click Connect LLaVA.', 'warning', 5000); return; }
              // Setup abort controller
              const abortCtrl = new AbortController();
              storyboardAbortRef.current = abortCtrl;
              // Store abort function that also kills Ollama server-side
              storyboardAbortRef.current.cancelAll = () => {
                  abortCtrl.abort();
                  // Tell Ollama to stop - fire and forget
                  fetch(`${llavaOllamaUrl}/api/generate`, {
                      method: 'POST',
                      mode: 'cors',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ model: 'llava:7b', prompt: '', images: [], stream: false, keep_alive: 0 })
                  }).catch(() => {});
              };
              setIsGenerating(true);
              setStoryboardProgress({ stage: 'sending', percent: 10, message: 'Sending image to LLaVA...' });
              try {
                  const defaultPrompt = `Analyze this storyboard image. For each panel output a JSON array. Keep descriptions short. Example format:
[{"panel":1,"subject":"hero runs through alley","shotType":"Medium Shot (MS)","angle":"Eye Level","lighting":"Low Key (Dark/Moody)","movement":"Tracking / Follow","shotStyle":"Cinematic","actionSpeed":"Normal Speed","transition":"Hard Cut","duration":"3.0s","sfx":"footsteps","bgm":"tense","dialogue":"","character":""},{"panel":2,"subject":"villain appears","shotType":"Close-Up (CU)","angle":"Low Angle","lighting":"Harsh Shadows","movement":"Static / Tripod","shotStyle":"Cinematic","actionSpeed":"Normal Speed","transition":"Hard Cut","duration":"2.0s","sfx":"","bgm":"","dialogue":"","character":""}]
Output ONLY the JSON array for each panel you see. No markdown. No explanation.`;
                  const prompt = (customPrompt && customPrompt.trim()) ? customPrompt.trim() + '\n\nOutput ONLY a valid JSON array. No markdown. No explanation.' : defaultPrompt;

                  setStoryboardProgress({ stage: 'analyzing', percent: 30, message: 'LLaVA is analyzing panels... this may take a minute.' });
                  const response = await callLLaVA(prompt, imageDataUrl, abortCtrl.signal);
                  if (abortCtrl.signal.aborted) return;
                  setStoryboardProgress({ stage: 'parsing', percent: 75, message: 'Parsing panel data...' });

                  // Parse JSON from response
                  const jsonStart = response.indexOf('[');
                  const jsonEnd = response.lastIndexOf(']') + 1;
                  if (jsonStart === -1 || jsonEnd === 0) throw new Error('No panel data found in image. Try a clearer storyboard with distinct panel borders.');

                  const panels = JSON.parse(response.slice(jsonStart, jsonEnd));
                  if (!panels.length) throw new Error('No panels detected.');
                  setStoryboardProgress({ stage: 'building', percent: 85, message: `Building ${panels.length} shot${panels.length > 1 ? 's' : ''}...` });

                  const newShots = panels.map((p, i) => {
                      const mergedSelections = {
                          shotType: p.shotType || '',
                          angle: p.angle || '',
                          lighting: p.lighting || '',
                          movement: p.movement || '',
                          shotStyle: p.shotStyle || '',
                          actionSpeed: p.actionSpeed || 'Normal Speed',
                          transition: p.transition || 'Hard Cut',
                          duration: p.duration || '3.0s',
                          camera: '',
                          lens: '',
                          aperture: 'f/2.8',
                          aspectRatio: '--ar 16:9',
                          filmStock: ''
                      };
                      // Apply project defaults
                      Object.keys(activeProject.defaultParams || {}).forEach(key => {
                          if (!mergedSelections[key]) mergedSelections[key] = activeProject.defaultParams[key] || '';
                      });
                      const dialogues = p.dialogue && p.dialogue.trim() ? [{
                          character: p.character || 'Character',
                          text: p.dialogue.trim(),
                          mood: 'Neutral',
                          reaction: '',
                          event: '',
                          voiceStyle: ''
                      }] : [];
                      return {
                          id: Date.now() + i,
                          subject: p.subject || `Panel ${p.panel}`,
                          negativePrompt: '',
                          selections: mergedSelections,
                          sfx: p.sfx || '',
                          bgm: p.bgm || '',
                          dialogues,
                          mode: 'video',
                          status: 'Planning',
                          tags: ['storyboard-import', `panel-${p.panel}`],
                          referenceImages: [],
                          customPromptOverride: null
                      };
                  });

                  // Add to a new scene
                  const newSceneId = Date.now();
                  updateActiveProjectScenes(prev => [...prev, {
                      id: newSceneId,
                      name: `Storyboard Import - ${new Date().toLocaleTimeString()}`,
                      shots: newShots
                  }]);
                  setActiveSceneId(newSceneId);
                  setStoryboardProgress({ stage: 'done', percent: 100, message: `✓ ${newShots.length} shot${newShots.length > 1 ? 's' : ''} imported successfully!` });
                  setTimeout(() => {
                      setStoryboardProgress(null);
                      setShowStoryboardPromptModal(false);
                      setPendingStoryboardImage(null);
                      setStoryboardCustomPrompt('');
                  }, 2000);

              } catch (err) {
                  if (err.name === 'AbortError') {
                      setStoryboardProgress({ stage: 'cancelled', percent: 0, message: 'Analysis cancelled.' });
                      setTimeout(() => {
                          setStoryboardProgress(null);
                          setShowStoryboardPromptModal(false);
                          setPendingStoryboardImage(null);
                          setStoryboardCustomPrompt('');
                      }, 1500);
                  } else {
                      setStoryboardProgress({ stage: 'error', percent: 0, message: 'Error: ' + err.message });
                      setTimeout(() => setStoryboardProgress(null), 4000);
                      console.error('Storyboard import error:', err);
                      addToast('Storyboard import failed: ' + err.message, 'error', 5000);
                  }
              } finally {
                  setIsGenerating(false);
                  storyboardAbortRef.current = null;
              }
          };

          const getOptionsForKey = (key) => {
              if (key === 'camera') return OPTIONS.cameraTypes;
              if (key === 'lighting') return OPTIONS.lighting;
              if (key === 'lens') return OPTIONS.lenses;
              if (key === 'filmStock') return OPTIONS.filmStocks;
              return OPTIONS[key + 's'] || [];
          };

          if (isAppLoading) {
              const tip = TIPS[currentTip];
              const tipColors = { feature:'#06b6d4', tip:'#eab308', quote:'#a855f7' };
              const tipColor = tipColors[tip?.type] || '#eab308';

              // Filmstrip frames — repeating pattern
              const filmFrames = ['🎬','🎥','🎞','📽','🎦','🎬','🎥','🎞','📽','🎦','🎬','🎥','🎞','📽','🎦','🎬','🎥','🎞','📽','🎦'];

              return (
                  <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center film-grain overflow-hidden select-none"
                      style={{background:'#080808'}}>

                      {/* Background gradient orbs */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                          <div className="absolute w-96 h-96 rounded-full opacity-10" style={{background:'radial-gradient(circle, #eab308, transparent)', top:'-10%', left:'-10%', filter:'blur(80px)'}}/>
                          <div className="absolute w-80 h-80 rounded-full opacity-8" style={{background:'radial-gradient(circle, #06b6d4, transparent)', bottom:'-5%', right:'-5%', filter:'blur(80px)'}}/>
                          <div className="absolute w-64 h-64 rounded-full opacity-6" style={{background:'radial-gradient(circle, #a855f7, transparent)', top:'40%', right:'20%', filter:'blur(60px)'}}/>
                      </div>

                      {/* Filmstrip top */}
                      <div className="absolute top-0 left-0 right-0 h-10 overflow-hidden" style={{background:'#111'}}>
                          <div className="filmstrip-scroll flex items-center h-full gap-0" style={{width:'200%'}}>
                              {filmFrames.map((f,i) => (
                                  <div key={i} className="flex items-center justify-center shrink-0" style={{width:'40px', height:'40px', borderRight:'2px solid #222', fontSize:'16px', opacity:0.6}}>{f}</div>
                              ))}
                          </div>
                          {/* Sprocket holes */}
                          <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-around pointer-events-none">
                              {Array.from({length:30}).map((_,i) => <div key={i} className="w-2 h-2 rounded-full" style={{background:'#080808', opacity:0.8}}/>)}
                          </div>
                      </div>

                      {/* Filmstrip bottom */}
                      <div className="absolute bottom-0 left-0 right-0 h-10 overflow-hidden" style={{background:'#111'}}>
                          <div className="filmstrip-scroll flex items-center h-full gap-0" style={{width:'200%', animationDirection:'reverse'}}>
                              {filmFrames.map((f,i) => (
                                  <div key={i} className="flex items-center justify-center shrink-0" style={{width:'40px', height:'40px', borderRight:'2px solid #222', fontSize:'16px', opacity:0.6}}>{f}</div>
                              ))}
                          </div>
                      </div>

                      {/* Main content */}
                      <div className="relative z-10 flex flex-col items-center text-center px-8 max-w-lg">

                          {/* Logo */}
                          <div className="logo-glow mb-6">
                              <img src="logo.png" alt="MOKHA" className="object-contain rounded-xl"
                                  style={{width:'180px', height:'auto', boxShadow:'0 0 40px rgba(59,130,246,0.3)'}}
                                  onError={e => { e.target.style.display='none'; e.target.nextElementSibling.style.display='flex'; }}/>
                              <div style={{display:'none'}} className="w-24 h-24 items-center justify-center rounded-2xl" style={{background:'linear-gradient(135deg,#3b82f6,#06b6d4)'}}>
                                  <span style={{fontSize:'40px'}}>🎬</span>
                              </div>
                          </div>

                          {/* Title — hidden since logo already contains MOKHA FILM text */}

                          {/* Tip card */}
                          <div className="tip-animate w-full mb-8" key={currentTip}>
                              <div className="rounded-2xl px-5 py-4 text-left" style={{background:'rgba(255,255,255,0.03)', border:`1px solid ${tipColor}30`}}>
                                  <div className="flex items-center gap-2 mb-2">
                                      <span style={{fontSize:'18px'}}>{tip?.icon}</span>
                                      <span className="text-[10px] font-black uppercase tracking-widest" style={{color:tipColor}}>{tip?.title}</span>
                                  </div>
                                  <p className="text-sm leading-relaxed" style={{color:'#aaa', fontFamily:'ui-monospace,monospace'}}>{tip?.desc}</p>
                              </div>
                          </div>

                          {/* Progress bar */}
                          <div className="w-64 h-0.5 rounded-full mb-4 overflow-hidden" style={{background:'#1a1a1a'}}>
                              <div className="load-progress h-full rounded-full" style={{background:`linear-gradient(90deg, #eab308, #06b6d4)`}}/>
                          </div>

                          {/* Tip counter dots */}
                          <div className="flex gap-1.5 mb-6">
                              {TIPS.map((_,i) => (
                                  <div key={i} className="rounded-full transition-all" style={{width: i===currentTip ? '16px' : '4px', height:'4px', background: i===currentTip ? tipColor : '#333'}}/>
                              ))}
                          </div>

                          {/* Skip checkbox */}
                          <div className="flex items-center gap-2">
                              <input type="checkbox" id="skipTutorialCheckbox" checked={skipTutorial}
                                  onChange={e => { setSkipTutorial(e.target.checked); localStorage.setItem('mokha_skip_tutorial', e.target.checked); }}
                                  className="w-3.5 h-3.5 cursor-pointer" style={{accentColor:'#06b6d4'}}/>
                              <label htmlFor="skipTutorialCheckbox" className="text-[10px] cursor-pointer transition-colors" style={{color:'#444', fontFamily:'ui-monospace,monospace'}}>
                                  Skip intro on next launch
                              </label>
                          </div>
                      </div>

                      {/* Footer */}
                      <div className="absolute bottom-12 text-center" style={{color:'#2a2a2a', fontFamily:'ui-monospace,monospace', fontSize:'9px', letterSpacing:'0.3em'}}>
                          MOKHA FILM SUITE v{APP_VERSION} · DESIGNED &amp; DEVELOPED BY CHARLES EMILSON · SENIOR FILMMAKER
                      </div>
                  </div>
              );
          }

          return (
             <div 
                 className={`flex h-screen text-textMain-light dark:text-textMain-dark font-sans selection:bg-primary/30 overflow-hidden transition-colors duration-300 ${uiStyle === 'glass' ? 'bg-white/80 dark:bg-black/80' : uiStyle === 'mr-re' ? 'bg-[#080810]' : 'bg-base-light dark:bg-base-dark'}`}
                 style={uiStyle === 'glass' ? {
                     backgroundImage: "url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1920&q=80')",
                     backgroundSize: 'cover',
                     backgroundPosition: 'center',
                     backgroundBlendMode: 'overlay'
                 } : {}}
             >
               {uiStyle === 'mr-re' && (
                  <div style={{ position: 'fixed', inset: 0, zIndex: -1, background: 'rgba(8, 8, 16, 0.72)', pointerEvents: 'none' }} />
              )}
              {!isFocusMode && <Sidebar />}
               <StoryboardPDF />
               <div className="flex-1 flex flex-col h-full overflow-hidden p-4">
               {currentView === 'dashboard' ? (
                  <div className="max-w-6xl mx-auto space-y-8 w-full overflow-y-auto custom-scrollbar pr-2">
                      <header className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0 pb-6 border-b border-border-light dark:border-border-dark">
                          <div>
                              <h1 className="text-2xl md:text-3xl font-bold text-primary">{t('dashboard')}</h1>
                              <p className="text-textMuted-light dark:text-textMuted-dark text-sm mt-1">{t('manageProjects')}</p>
                          </div>
                          <div className="flex items-center space-x-2 flex-wrap justify-end gap-y-2">
                              <input type="file" ref={fileInputRef} onChange={handleLoadProject} accept=".json,.RE" className="hidden" />
                              <button onClick={() => fileInputRef.current.click()} className="text-xs bg-input-light dark:bg-input-dark hover:bg-base-light dark:hover:bg-border-dark text-textMain-light dark:text-textMain-dark px-3 py-2 rounded-lg transition-all border border-border-light dark:border-border-dark flex items-center space-x-1 shadow-sm font-medium">
                                  <Icon name="Upload" size={14} /><span>{t('importBackup')}</span>
                              </button>
                              <button onClick={handleSaveProject} className="text-xs bg-input-light dark:bg-input-dark hover:bg-base-light dark:hover:bg-border-dark text-textMain-light dark:text-textMain-dark px-3 py-2 rounded-lg transition-all border border-border-light dark:border-border-dark flex items-center space-x-1 shadow-sm font-medium">
                                  <Icon name="Save" size={14} className="text-cyan-500" /><span>{t('exportAll')}</span>
                              </button>
                              <button onClick={handleCreateProject} className="text-xs bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded-lg transition-all border border-primary flex items-center space-x-1 shadow-md font-bold active:scale-[0.98] btn-premium">
                                  <Icon name="Plus" size={14} /><span>{t('newProject')}</span>
                              </button>
                          </div>
                      </header>

                      {/* Stats */}
                      <div className="space-y-8 animate-slide-up" style={{animationDelay: '100ms'}}>
                          <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-xl p-6 shadow-sm hover-panel">
                              <div className="flex flex-col md:flex-row gap-6 items-center">
                                  <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                          <Icon name="Film" size={24} className="text-primary"/>
                                          <h2 className="text-xl font-bold text-textMain-light dark:text-textMain-dark">Start a Film (Story Engine)</h2>
                                      </div>
                                      <p className="text-sm text-textMuted-light dark:text-textMuted-dark leading-relaxed">
                                          Not AI-generated. Structured thinking. This guides you like a real development room (Act Builder, Character Web, Theme Lock) and converts it to prompt-ready data.
                                      </p>
                                  </div>
                                  <button onClick={() => setShowStoryEngineModal(true)} className="w-full md:w-auto bg-primary hover:bg-primaryHover text-white px-8 py-3 rounded-lg text-sm font-bold transition-all shadow-md active:scale-[0.98] btn-premium flex items-center justify-center gap-2">
                                      <Icon name="Play" size={16} />
                                      <span>Launch Story Engine</span>
                                  </button>
                              </div>
                          </div>

                          <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-xl p-6 shadow-sm hover-panel">
                              <div className="flex flex-col md:flex-row gap-6 items-center">
                                  <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                          <Icon name="BookOpen" size={24} className="text-accent"/>
                                          <h2 className="text-xl font-bold text-textMain-light dark:text-textMain-dark">Pro Script Builder</h2>
                                      </div>
                                      <p className="text-sm text-textMuted-light dark:text-textMuted-dark leading-relaxed">
                                          Professional scriptwriting platform for Hollywood writers, marketing teams, and content creators. Final Draft-style editor with 7-step configuration wizard, three writing modes, and seamless Director Brain integration.
                                      </p>
                                  </div>
                                  <button onClick={() => {
                                      // Check if user has existing Pro Script Builder projects
                                      try {
                                          const storageKey = 'mokha_story_projects';
                                          const data = localStorage.getItem(storageKey);
                                          const existingProjects = data ? JSON.parse(data) : [];
                                          
                                          if (existingProjects && existingProjects.length > 0) {
                                              setShowProModeEntryModal(true);
                                          } else {
                                              setShowProModeWizard(true);
                                          }
                                      } catch (error) {
                                          console.error('Error checking projects:', error);
                                          // Fallback: open wizard
                                          setShowProModeWizard(true);
                                      }
                                  }} className="w-full md:w-auto bg-accent hover:bg-accentHover text-black px-8 py-3 rounded-lg text-sm font-bold transition-all shadow-md active:scale-[0.98] btn-premium flex items-center justify-center gap-2">
                                      <Icon name="Edit" size={16} />
                                      <span>Launch Pro Mode</span>
                                  </button>
                              </div>
                          </div>

                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
                          <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-xl p-6 shadow-sm flex items-center space-x-4 hover-panel">
                              <div className="p-3 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-lg"><Icon name="Folder" size={24} /></div>
                              <div><p className="text-textMuted-light dark:text-textMuted-dark text-sm font-medium">{t('totalProjects')}</p><h3 className="text-2xl font-bold text-textMain-light dark:text-textMain-dark">{projects.length}</h3></div>
                          </div>
                          <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-xl p-6 shadow-sm flex items-center space-x-4 hover-panel">
                              <div className="p-3 bg-amber-500/10 text-amber-500 dark:text-amber-400 rounded-lg"><Icon name="Clapperboard" size={24} /></div>
                              <div><p className="text-textMuted-light dark:text-textMuted-dark text-sm font-medium">{t('totalScenes')}</p><h3 className="text-2xl font-bold text-textMain-light dark:text-textMain-dark">{projects.reduce((acc, p) => acc + p.scenes.length, 0)}</h3></div>
                          </div>
                          <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-xl p-6 shadow-sm flex items-center space-x-4 hover-panel">
                              <div className="p-3 bg-primary/10 text-primary rounded-lg"><Icon name="Camera" size={24} /></div>
                              <div><p className="text-textMuted-light dark:text-textMuted-dark text-sm font-medium">{t('totalShots')}</p><h3 className="text-2xl font-bold text-textMain-light dark:text-textMain-dark">{projects.reduce((acc, p) => acc + p.scenes.reduce((sAcc, s) => sAcc + (s.shots ? s.shots.length : 0), 0), 0)}</h3></div>
                          </div>
                      </div>

                      <div className="flex items-center bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded-xl px-4 py-3 shadow-sm animate-slide-up">
                          <Icon name="Search" size={18} className="text-textMuted-light dark:text-textMuted-dark mr-3" />
                          <input value={projectSearchQuery} onChange={e => setProjectSearchQuery(e.target.value)} placeholder="Search projects by name, description, or tags..." className="bg-transparent border-none outline-none text-sm text-textMain-light dark:text-textMain-dark w-full" />
                      </div>

                      {/* Projects List */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
                          {projects.filter(p => !projectSearchQuery || p.name.toLowerCase().includes(projectSearchQuery.toLowerCase()) || (p.description && p.description.toLowerCase().includes(projectSearchQuery.toLowerCase())) || (p.tags && p.tags.some(t => t.toLowerCase().includes(projectSearchQuery.toLowerCase())))).map(proj => (
                              <div key={proj.id} onContextMenu={(e) => openCtxMenu(e, 'project', { projectId: proj.id })} className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-xl p-6 shadow-sm hover-panel flex flex-col justify-between h-full animate-slide-up">
                                  <div>
                                      <div className="flex justify-between items-start mb-3">
                                          <input 
                                              value={proj.name} 
                                              onChange={(e) => updateProjectField(proj.id, 'name', e.target.value)}
                                              className="font-bold text-lg text-primary bg-transparent border-b border-transparent hover:border-border-light dark:hover:border-border-dark focus:border-primary outline-none w-full transition-colors"
                                          />
                                      </div>
                                      <textarea
                                          value={proj.description || ''}
                                          onChange={(e) => updateProjectField(proj.id, 'description', e.target.value)}
                                          placeholder={t('description')}
                                          className="text-sm text-textMuted-light dark:text-textMuted-dark bg-transparent border-b border-transparent hover:border-border-light dark:hover:border-border-dark focus:border-primary outline-none w-full resize-none h-16 custom-scrollbar transition-colors"
                                      />
                                      <div className="flex items-center space-x-2 mt-2">
                                          <Icon name="Tag" size={12} className="text-textMuted-light dark:text-textMuted-dark" />
                                          <input value={proj.tags?.join(', ') || ''} onChange={e => updateProjectField(proj.id, 'tags', e.target.value.split(',').map(t=>t.trim()).filter(Boolean))} placeholder="Tags (comma separated)" className="text-xs text-textMuted-light dark:text-textMuted-dark bg-transparent border-b border-transparent hover:border-border-light dark:hover:border-border-dark focus:border-primary outline-none w-full transition-colors" />
                                      </div>
                                      <div className="flex items-center space-x-2 text-xs text-textMuted-light dark:text-textMuted-dark mt-2 font-medium bg-input-light dark:bg-input-dark p-2 rounded border border-border-light dark:border-border-dark w-fit">
                                          <span><Icon name="Clapperboard" size={12} className="inline mr-1 text-slate-400"/>{proj.scenes.length} S</span>
                                          <span>•</span>
                                          <span><Icon name="Camera" size={12} className="inline mr-1 text-slate-400"/>{proj.scenes.reduce((acc, s) => acc + (s.shots?.length || 0), 0)} S</span>
                                      </div>
                                      {(() => {
                                          const totalShots = proj.scenes.reduce((acc, s) => acc + (s.shots?.length || 0), 0);
                                          const completedShots = proj.scenes.reduce((acc, s) => acc + (s.shots?.filter(shot => shot.status === 'Completed').length || 0), 0);
                                          const progressPercent = totalShots > 0 ? Math.round((completedShots / totalShots) * 100) : 0;
                                          if (totalShots === 0) return null;
                                          return (
                                              <div className="mt-4 mb-2">
                                                  <div className="flex justify-between text-[10px] text-textMuted-light dark:text-textMuted-dark mb-1.5 font-bold uppercase tracking-wider">
                                                      <span>Progress</span>
                                                      <span className={progressPercent === 100 ? "text-green-500" : "text-textMain-light dark:text-textMain-dark"}>{progressPercent}% ({completedShots}/{totalShots})</span>
                                                  </div>
                                                  <div className="w-full h-1.5 bg-input-light dark:bg-input-dark rounded-full overflow-hidden border border-border-light dark:border-border-dark/50">
                                                      <div className="h-full bg-green-500 transition-all duration-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" style={{ width: `${progressPercent}%` }}></div>
                                                  </div>
                                              </div>
                                          );
                                      })()}
                                  </div>
                                  <div className="mt-6 flex flex-wrap gap-2">
                                      <button onClick={() => { setActiveProjectId(proj.id); setHistoryPast([]); setHistoryFuture([]); setCurrentView('editor'); }} className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-3 py-2 rounded-lg text-sm font-bold transition-all flex justify-center items-center space-x-1">
                                          <Icon name="Edit2" size={14} /><span>{t('openEditor')}</span>
                                      </button>
                                      {proj.storyId && (
                                          <button onClick={() => { setInitialStoryId(proj.storyId); setShowStoryEngineModal(true); }} className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 border border-indigo-500/30 px-3 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5" title="Open Story Engine for this project">
                                              <Icon name="BookOpen" size={14} /><span>Edit Story</span>
                                          </button>
                                      )}
                                      <button onClick={() => setEditingProjectDefaults(proj.id)} className="bg-input-light dark:bg-input-dark hover:bg-base-light dark:hover:bg-border-dark text-textMain-light dark:text-textMain-dark px-3 py-2 rounded-lg text-sm font-medium transition-all border border-border-light dark:border-border-dark" title={t('workflowDefaults')}>
                                          <Icon name="Settings" size={16} />
                                      </button>
                                      <button onClick={() => handleShareProject(proj)} className="bg-input-light dark:bg-input-dark hover:bg-base-light dark:hover:bg-border-dark text-cyan-600 dark:text-cyan-400 px-3 py-2 rounded-lg text-sm font-medium transition-all border border-border-light dark:border-border-dark" title={t('shareExport')}>
                                          <Icon name="Share" size={16} />
                                      </button>
                                      <button onClick={() => handleDeleteProject(proj.id)} className="bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-sm font-medium transition-all border border-red-200 dark:border-red-900/50" title={t('delete')}>
                                          <Icon name="Trash2" size={16} />
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
               ) : (
                  <div className={`flex flex-col h-full max-w-[1600px] mx-auto w-full ${uiStyle === 'mr-re' ? 'lg-panel-open-anim' : 'animate-slide-up'}`}>
                    <header className={`flex flex-col md:flex-row md:items-center justify-between pb-3 shrink-0 ${uiStyle === 'mr-re' ? 'lg-header px-3 pt-2' : 'border-b border-border-light dark:border-border-dark'}`}>
                      <div className="flex items-center space-x-4">
                        <h1 className="text-xl font-bold text-primary truncate max-w-[250px] pl-1">{activeProject.name}</h1>
                        
                        {workspace !== 'DESIGNER' && (
                            <div className="flex p-1 bg-input-light dark:bg-input-dark rounded-xl border border-border-light dark:border-border-dark shadow-inner ml-4">
                                <button onClick={() => setPromptMode('image')} className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${promptMode === 'image' ? 'bg-cyan-500/20 text-cyan-500 border border-cyan-500/50 shadow-sm' : 'text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark border border-transparent'}`}>
                                    <Icon name="Image" size={14} /><span>{t('imageMode')}</span>
                                </button>
                                <button onClick={() => setPromptMode('video')} className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${promptMode === 'video' ? 'bg-primary/20 text-primary border border-primary/50 shadow-sm' : 'text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark border border-transparent'}`}>
                                    <Icon name="Video" size={14} /><span>{t('videoMode')}</span>
                                </button>
                            </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-2 md:mt-0 flex-wrap justify-end">
                        {promptMode === 'video' && workspace !== 'DESIGNER' && (
                            <div className="flex items-center bg-input-light dark:bg-input-dark rounded-xl border border-border-light dark:border-border-dark shadow-inner p-1 mr-1">
                                {['Standard', 'Runway', 'Veo 3', 'Seedance'].map(platform => (
                                    <button key={platform} onClick={() => setVideoPlatform(platform)} className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-300 ${videoPlatform === platform ? 'bg-primary/20 text-primary border-primary/50 shadow-sm' : 'text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark border border-transparent'}`}>
                                        <span className="whitespace-nowrap">{platform}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="flex items-center bg-input-light dark:bg-input-dark rounded-xl border border-border-light dark:border-border-dark shadow-inner p-1">
                            {['Nano Banana 2', 'KLING AI', 'GPT 2.6', 'MY STYLE'].map(model => (
                                <button key={model} onClick={() => setAiModel(model)} className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-300 ${(aiModel === model || (model === 'GPT 2.6' && aiModel === 'GPT V2')) ? (model === 'MY STYLE' ? 'bg-accent/20 text-accent border-accent/50 shadow-sm' : 'bg-amber-500/20 text-amber-500 border-amber-500/50 shadow-sm') : 'text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark border border-transparent'}`}>
                                    <Icon name="Sparkles" size={12} className={aiModel === model ? (model === 'MY STYLE' ? 'text-accent' : 'text-amber-500') : 'text-slate-400'} />
                                    <span className="whitespace-nowrap hidden lg:inline">{model}</span>
                                </button>
                            ))}
                        </div>
                        {aiModel === 'MY STYLE' && (
                            <button onClick={() => setShowMyStyleModal(true)} className="bg-panel-light dark:bg-panel-dark hover:bg-input-light dark:hover:bg-border-dark text-accent px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark shadow-sm flex items-center space-x-1 transition-all text-xs font-bold">
                                <Icon name="Brain" size={14} /> <span>{t('trainStyle')}</span>
                            </button>
                        )}
                        <button onClick={() => setIsFocusMode(!isFocusMode)} className="p-1.5 rounded-lg bg-input-light dark:bg-input-dark text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark hover:bg-base-light dark:hover:bg-border-dark transition-colors shadow-sm border border-border-light dark:border-border-dark" title="Focus Mode">
                            <Icon name={isFocusMode ? "Minimize" : "Maximize"} size={14} />
                        </button>
                        <div className="flex items-center space-x-2 bg-input-light dark:bg-input-dark px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark shadow-sm">
                            <Icon name="Layout" size={14} className="text-textMuted-light dark:text-textMuted-dark" />
                            <select value={workspace} onChange={(e) => setWorkspace(e.target.value)} className="bg-transparent text-xs text-textMain-light dark:text-textMain-dark font-bold outline-none cursor-pointer w-24">
                                <option value="DEFAULT">{t('workspaceDefault')}</option>
                                <option value="DESIGNER">{t('workspaceDesigner')}</option>
                                <option value="FILMMAKER">{t('workspaceFilmmaker')}</option>
                            </select>
                        </div>
                        <BrainStatusIndicator brainMode={brainMode} loadingProgress={deepBrainLoadingProgress} onClick={() => setShowSettings(true)} />
                        <div className="flex bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-lg overflow-hidden shadow-sm">
                            <button onClick={handleUndo} disabled={historyPast.length === 0} className={`p-1.5 transition-all ${historyPast.length > 0 ? 'text-primary hover:bg-primary/10 cursor-pointer' : 'text-textMuted-light dark:text-textMuted-dark opacity-50 cursor-not-allowed'}`} title="Undo (Ctrl+Z)"><Icon name="Undo" size={14} /></button>
                            <div className="w-px bg-border-light dark:bg-border-dark"></div>
                            <button onClick={handleRedo} disabled={historyFuture.length === 0} className={`p-1.5 transition-all ${historyFuture.length > 0 ? 'text-primary hover:bg-primary/10 cursor-pointer' : 'text-textMuted-light dark:text-textMuted-dark opacity-50 cursor-not-allowed'}`} title="Redo (Ctrl+Y)"><Icon name="Redo" size={14} /></button>
                        </div>
                        <div className="relative">
                            <button onClick={() => setShowFightClub(true)} className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-1.5 rounded-lg transition-all border border-red-500/30 flex items-center space-x-1.5 font-bold shadow-sm">
                              <Icon name="Activity" size={12} /><span className="hidden xl:inline">Fight Club</span>
                            </button>
                            <button onClick={() => setShowDirectorMenu(!showDirectorMenu)} className="text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-lg transition-all border border-amber-500/30 flex items-center space-x-1.5 font-bold shadow-sm">
                              <Icon name="Clapperboard" size={12} /><span className="hidden xl:inline">{t('directorRules')}</span>
                            </button>
                            {showDirectorMenu && (
                                <div className="absolute right-0 top-full mt-2 w-80 bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-xl shadow-2xl z-[9999] overflow-hidden">
                                    <div className="p-3 border-b border-border-light dark:border-border-dark bg-input-light dark:bg-input-dark"><span className="text-sm font-bold text-amber-600 dark:text-amber-400">{t('directorRules')}</span></div>
                                    <div className="max-h-64 overflow-y-auto p-2 custom-scrollbar">
                                        {DIRECTOR_RULES.map(rule => (
                                            <label key={rule.id} className="flex items-start space-x-3 p-2 hover:bg-input-light dark:hover:bg-border-dark rounded-lg cursor-pointer transition-colors">
                                                <input type="checkbox" checked={activeDirectorRules.includes(rule.id)} onChange={() => toggleDirectorRule(rule.id)} className="mt-1 accent-amber-500 rounded border-border-light dark:bg-input-dark dark:border-border-dark" />
                                                <div className="flex flex-col"><span className="text-xs font-bold text-textMain-light dark:text-textMain-dark">{rule.name}</span><span className="text-[10px] text-textMuted-light dark:text-textMuted-dark leading-tight mt-0.5">{rule.text}</span></div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                      </div>
                    </header>

                    {/* MAIN HORIZONTAL SPLIT */}
                    <div className={`flex-1 flex flex-col lg:flex-row gap-4 mt-4 min-h-0 pb-4 ${isFocusMode ? 'justify-center' : ''} ${uiStyle === 'mr-re' ? 'relative overflow-hidden' : ''}`}>
                    {uiStyle === 'mr-re' && (
                        <div className="lg-mesh">
                            <div className="lg-orb lg-orb-1" />
                            <div className="lg-orb lg-orb-2" />
                            <div className="lg-orb lg-orb-3" />
                            <div className="lg-orb lg-orb-4" />
                        </div>
                    )}
                      
                      {/* LEFT COLUMN: Detailed Parameters (Tabbed) */}
                      <div className={`${isFocusMode ? 'lg:w-4/12 max-w-sm' : (workspace === 'DESIGNER' ? 'lg:w-3/12 lg:order-3' : 'lg:w-3/12 lg:order-1')} flex flex-col gap-4 h-full min-h-0 transition-all duration-300 relative`}>
                          <div className={getPanelClass() + " flex-1 min-h-[250px] overflow-hidden"}>
                              <div className="flex border-b border-border-light dark:border-border-dark bg-input-light dark:bg-input-dark shrink-0 px-1 pt-2 gap-1 overflow-x-auto custom-scrollbar">
                                  <button onClick={() => setActiveInputTab('visual')} className={`px-3 py-2 text-[10px] xl:text-xs font-bold rounded-t-lg transition-all flex items-center border-b-2 ${activeInputTab === 'visual' ? 'bg-panel-light dark:bg-panel-dark border-primary text-primary' : 'border-transparent text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark hover:bg-base-light dark:hover:bg-border-dark'}`}><Icon name="Camera" size={14} className="mr-1.5 hidden 2xl:block"/>{t('visualParams')}</button>
                                  {promptMode === 'video' && workspace !== 'DESIGNER' && (
                                      <>
                                      <button onClick={() => setActiveInputTab('motion')} className={`px-3 py-2 text-[10px] xl:text-xs font-bold rounded-t-lg transition-all flex items-center border-b-2 ${activeInputTab === 'motion' ? 'bg-panel-light dark:bg-panel-dark border-cyan-500 text-cyan-600 dark:text-cyan-400' : 'border-transparent text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark hover:bg-base-light dark:hover:bg-border-dark'}`}><Icon name="Move" size={14} className="mr-1.5 hidden 2xl:block"/>{t('motionTiming')}</button>
                                      <button onClick={() => setActiveInputTab('audio')} className={`px-3 py-2 text-[10px] xl:text-xs font-bold rounded-t-lg transition-all flex items-center border-b-2 ${activeInputTab === 'audio' ? 'bg-panel-light dark:bg-panel-dark border-accent text-accent' : 'border-transparent text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark hover:bg-base-light dark:hover:bg-border-dark'}`}><Icon name="Volume2" size={14} className="mr-1.5 hidden 2xl:block"/>{t('generalAudio')}</button>
                                      </>
                                  )}
                              </div>
                              
                              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-4">
                                  {activeInputTab === 'visual' && (
                                      <div className="grid grid-cols-1 gap-y-4 animate-slide-up h-full content-start">
                                          <div className="flex flex-col space-y-1.5 mb-2">
                                              <label className="text-[11px] uppercase tracking-wider font-bold text-textMuted-light dark:text-textMuted-dark">Aspect Ratio</label>
                                              <div className="flex bg-input-light dark:bg-input-dark p-1 rounded-lg border border-border-light dark:border-border-dark w-full justify-between shadow-inner">
                                                  {ASPECT_RATIOS.map(ar => (
                                                      <button key={ar.id} onClick={() => setSelections(prev => ({...prev, aspectRatio: ar.id}))} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${selections.aspectRatio === ar.id ? 'bg-panel-light dark:bg-panel-dark text-primary shadow-sm' : 'text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light'}`} title={ar.label}>{ar.name}</button>
                                                  ))}
                                              </div>
                                          </div>
                                          {workspace !== 'DESIGNER' && <SelectGroup icon={promptMode === 'video' ? 'Video' : 'Image'} label={promptMode === 'video' ? t('shotType') : t('panelType')} optionsKey="shotTypes" stateKey="shotType" />}
                                          <SelectGroup icon="Wand2" label={t('style')} optionsKey="shotStyles" stateKey="shotStyle" />
                                          <SelectGroup icon="Camera" label={t('cameraType')} optionsKey="cameraTypes" stateKey="camera" />
                                          <SelectGroup icon="Aperture" label={t('lens')} optionsKey="lenses" stateKey="lens" />
                                          <div className={`flex flex-col space-y-1.5 ${promptMode === 'video' && activePlatformRestrictions.disabledCategories?.includes('aperture') ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
                                              <label className="text-[11px] uppercase tracking-wider font-bold text-textMuted-light dark:text-textMuted-dark flex justify-between">
                                                  <span className="flex items-center"><Icon name="Aperture" size={12} className="text-cyan-500 mr-1" /> Depth of Field (Aperture)</span>
                                                  <div className="flex items-center space-x-2">
                                                      {promptMode === 'video' && activePlatformRestrictions.disabledCategories?.includes('aperture') && <span className="text-[9px] text-red-500 font-bold bg-red-500/10 px-1.5 py-0.5 rounded">UNSUPPORTED</span>}
                                                      <span className="text-cyan-500 font-mono bg-cyan-500/10 px-1 rounded">{selections.aperture}</span>
                                                  </div>
                                              </label>
                                              <input type="range" min="0" max={APERTURES.length - 1} value={APERTURES.indexOf(selections.aperture || "f/2.8")} onChange={(e) => setSelections(prev => ({...prev, aperture: APERTURES[e.target.value]}))} className="w-full accent-cyan-500 mt-1 cursor-pointer" />
                                          </div>
                                          <SelectGroup icon="Move" label={t('cameraAngle')} optionsKey="angles" stateKey="angle" />
                                          <div className="relative">
                                              <SelectGroup icon="Lightbulb" label={t('lighting')} optionsKey="lighting" stateKey="lighting" />
                                              <button onClick={() => setShowLightingStudio(true)} className="absolute top-0 right-0 text-[9px] bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 transition-colors flex items-center font-bold">Studio</button>
                                          </div>
                                          <SelectGroup icon="Film" label="Film Stock" optionsKey="filmStocks" stateKey="filmStock" />
                                      </div>
                                  )}
                                  {activeInputTab === 'motion' && promptMode === 'video' && workspace !== 'DESIGNER' && (
                                      <div className="grid grid-cols-1 gap-y-4 animate-slide-up h-full content-start">
                                          <SelectGroup icon="Move" label={t('cameraMovement')} optionsKey="movements" stateKey="movement" />
                                          <SelectGroup icon="Timer" label={t('actionSpeed')} optionsKey="actionSpeeds" stateKey="actionSpeed" />
                                          <div className="flex flex-col">
                                              <SelectGroup icon="Clock" label={t('shotDuration')} optionsKey="durations" stateKey="duration" />
                                              {promptMode === 'video' && selections.duration && parseFloat(selections.duration) > activePlatformRestrictions.maxDuration && (
                                                  <div className="text-[10px] text-orange-500 bg-orange-500/10 p-1.5 rounded border border-orange-500/30 mt-1.5 flex items-start shadow-sm">
                                                      <Icon name="AlertTriangle" size={12} className="mr-1 mt-0.5 shrink-0" />
                                                      <span className="leading-tight">{videoPlatform} natively supports up to {activePlatformRestrictions.maxDuration}s. You will need to extend this in-app later.</span>
                                                  </div>
                                              )}
                                          </div>
                                          <SelectGroup icon="Film" label={t('transition')} optionsKey="transitions" stateKey="transition" />
                                      </div>
                                  )}
                                  {activeInputTab === 'audio' && promptMode === 'video' && workspace !== 'DESIGNER' && (
                                      <div className="flex flex-col h-full animate-slide-up space-y-4">
                                          <div className="grid grid-cols-1 gap-4 shrink-0">
                                              <div className="flex flex-col space-y-1.5">
                                                  <label className="text-[11px] uppercase tracking-wider font-bold text-textMuted-light dark:text-textMuted-dark flex items-center space-x-1"><Icon name="Volume2" size={12} className="text-accent" /><span>{t('sfx')}</span></label>
                                                  <input value={sfx} onChange={(e) => setSfx(e.target.value)} placeholder="e.g., Heavy rain..." className="w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-lg p-2.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all" />
                                              </div>
                                              <div className="flex flex-col space-y-1.5">
                                                  <label className="text-[11px] uppercase tracking-wider font-bold text-textMuted-light dark:text-textMuted-dark flex items-center space-x-1"><Icon name="Music" size={12} className="text-accent" /><span>{t('bgm')}</span></label>
                                                  <input value={bgm} onChange={(e) => setBgm(e.target.value)} placeholder="e.g., Synthwave..." className="w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-lg p-2.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all" />
                                              </div>
                                          </div>
                                      </div>
                                  )}
                              </div>
                          </div>
                      </div>
                        
                      {/* MIDDLE COLUMN: Core Subject & Action */}
                      <div className={`${isFocusMode ? 'flex-1 max-w-4xl' : (workspace === 'DESIGNER' ? 'lg:w-5/12 lg:order-1' : 'lg:w-5/12 lg:order-2')} flex flex-col h-full min-h-0 transition-all duration-300 relative`}>
                        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 pb-2 pr-1">

                        {/* TOP MIDDLE: Core Subject & Action */}
                        <div className={getPanelClass()}>
                            <div className="flex items-center justify-between p-3 border-b border-border-light dark:border-border-dark bg-input-light dark:bg-input-dark rounded-t-xl">
                                <label className="text-sm font-bold text-primary flex items-center space-x-1.5">
                                  <Icon name="AlignLeft" size={16} />
                                  <span>{editingIndex >= 0 ? `${t('updateShot')} ${promptMode === 'image' ? 'Panel' : 'Shot'} ${editingIndex + 1}` : chainMode ? (chainShotCount === 0 ? '⛓ Chain Shot 1 — Full Setup' : `⛓ Chain Shot ${chainShotCount + 1} — Action Only`) : t('baseSubject')}</span>
                                </label>
                                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                  <button onClick={handleLocalSuggest} className="text-[10px] bg-accent/10 text-accent px-2 py-1 rounded transition-all border border-accent/30 flex items-center font-bold hover:bg-accent/20 shadow-sm"><Icon name="Zap" size={12} className="mr-1"/><span className="hidden sm:inline">{t('localAiSuggest')}</span></button>
                                  {referenceImages.length > 0 && (
                                    <button onClick={handleLLaVASuggest} disabled={isGenerating} title={isLlavaReady ? 'Analyze image with LLaVA-1.5' : 'LLaVA not connected — use Script Parser to connect'} className={`text-[10px] px-2 py-1 rounded transition-all border flex items-center font-bold shadow-sm ${isLlavaReady ? 'bg-violet-500/10 text-violet-500 border-violet-500/30 hover:bg-violet-500/20' : 'bg-input-light dark:bg-input-dark text-textMuted-light dark:text-textMuted-dark border-border-light dark:border-border-dark opacity-60'}`}>
                                      <Icon name="Camera" size={12} className="mr-1"/><span className="hidden sm:inline">LLaVA Vision</span>
                                    </button>
                                  )}
                                  <button onClick={handleMagicEnhance} className="text-[10px] bg-fuchsia-500/10 text-fuchsia-500 px-2 py-1 rounded transition-all border border-fuchsia-500/30 flex items-center font-bold hover:bg-fuchsia-500/20 shadow-sm"><Icon name="Sparkles" size={12} className="mr-1"/><span className="hidden sm:inline">Magic Enhance</span></button>
                                  <button onClick={() => handleCopyParams({ selections, sfx, bgm }, 'builder')} className="text-[10px] bg-panel-light dark:bg-panel-dark text-textMain-light dark:text-textMain-dark px-2 py-1 rounded transition-all border border-border-light dark:border-border-dark flex items-center hover:bg-input-light dark:hover:bg-border-dark shadow-sm"><Icon name={copiedFeedbackId === 'builder' ? "Check" : "Copy"} size={12} className="mr-1"/><span className="hidden xl:inline">{copiedFeedbackId === 'builder' ? t('done') : t('copyParams')}</span></button>
                                  <button onClick={handlePasteParams} disabled={!copiedParams} className={`text-[10px] px-2 py-1 rounded transition-all border flex items-center shadow-sm ${copiedParams ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20' : 'bg-input-light dark:bg-input-dark/50 text-textMuted-light dark:text-textMuted-dark border-border-light dark:border-border-dark/50 cursor-not-allowed'}`}><Icon name="Clipboard" size={12} className="mr-1"/><span className="hidden xl:inline">{t('pasteParams')}</span></button>
                                  <button onClick={handleSaveAsPreset} className="text-[10px] bg-panel-light dark:bg-panel-dark text-amber-600 dark:text-amber-400 px-2 py-1 rounded transition-all border border-border-light dark:border-border-dark flex items-center hover:bg-input-light dark:hover:bg-border-dark shadow-sm"><Icon name="Star" size={12} className="mr-1"/><span className="hidden xl:inline">{t('savePreset')}</span></button>
                                  {editingIndex === -1 && (
                                      <button onClick={handleLocalAutoBuild} disabled={isGenerating} className={`text-[10px] bg-primary hover:bg-primaryHover text-white px-3 py-1 rounded transition-all border border-primary flex items-center font-bold shadow-md ${isGenerating ? 'opacity-50' : ''}`}>
                                        {isGenerating ? <><Icon name="Timer" size={12} className="animate-spin mr-1" /><span>{t('processing')}</span></> : <><Icon name="Sparkles" size={12} className="mr-1"/><span>{t('localAutoBuild')}</span></>}
                                      </button>
                                  )}
                                </div>
                            </div>
                            
                            <div className="p-3 relative flex-1 flex flex-col">
                                {(() => {
                                    const mentionOptions = [ ...globalCharacters.map(c => ({ name: c.name, type: 'char' })), ...globalLocations.map(l => ({ name: l.name, type: 'loc' })), ...referenceImages.map(img => ({ name: img.id, type: 'img' })) ];
                                    const filteredMentions = mentionOptions.filter(o => o.name.toLowerCase().includes(mentionState.text.toLowerCase()));
                                    return (
                                        <>
                                        {chainMode && chainShotCount > 0 && (
                                            <div className="mb-2 px-3 py-2 rounded-lg bg-cyan-500/5 border border-cyan-500/20 text-[10px] text-cyan-500 font-mono flex items-center gap-2">
                                                <Icon name="Link" size={11}/>
                                                <span className="font-bold">{chainBase.character || 'Character'}</span>
                                                <span className="text-textMuted-light dark:text-textMuted-dark">·</span>
                                                <span className="text-textMuted-light dark:text-textMuted-dark truncate">{chainBase.location || chainBase.subject || 'base scene'}</span>
                                                <span className="ml-auto text-[9px] opacity-60">Shot {chainShotCount + 1}</span>
                                            </div>
                                        )}
                                        <textarea ref={textareaRef} value={subject} onChange={handleSubjectChange} onBlur={handleSubjectBlur} onContextMenu={(e) => openCtxMenu(e, 'action', { actionText: subject, actionIndex: 0 })}
                                            placeholder={chainMode && chainShotCount > 0
                                                ? `What does ${chainBase.character || 'the character'} do? e.g. "draws his weapon" or "turns and runs"`
                                                : "e.g., A sprawling cyberpunk market. Focus on a glowing neon sign... Use @ to tag characters, locations, or reference images."}
                                            className={`w-full flex-1 bg-input-light dark:bg-input-dark border ${chainMode ? 'border-cyan-500/40 focus:border-cyan-500' : 'border-border-light dark:border-border-dark focus:border-primary focus:ring-1 focus:ring-primary'} text-textMain-light dark:text-textMain-dark rounded-lg p-4 outline-none transition-all resize-y custom-scrollbar ${workspace === 'DESIGNER' ? 'min-h-[400px] text-lg' : 'min-h-[250px] text-base'}`} />
                                        {/* Smart character detection suggestions */}
                                        {detectedCharSuggestions.length > 0 && (
                                            <div className="mt-1.5 flex flex-wrap gap-1.5 items-center">
                                                <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                                                    <Icon name="Users" size={9}/>Detected names:
                                                </span>
                                                {detectedCharSuggestions.map(name => (
                                                    <button key={name} onClick={() => {
                                                        addGlobalCharacter && setNewCharData && setNewCharData({ name, role: 'Character', appearance: '' });
                                                        // Quick-add to global characters
                                                        setGlobalCharacters(prev => {
                                                            if (prev.find(c => c.name === name)) return prev;
                                                            return [...prev, { id: `char_${Date.now()}`, name, role: 'Character', appearance: '' }];
                                                        });
                                                        setDetectedCharSuggestions(prev => prev.filter(n => n !== name));
                                                        addToast(`"${name}" added to Character Library ✓`, 'success');
                                                    }} className="text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-all flex items-center gap-1">
                                                        <Icon name="UserPlus" size={9}/>{name}
                                                    </button>
                                                ))}
                                                <button onClick={() => setDetectedCharSuggestions([])} className="text-[9px] text-textMuted-light dark:text-textMuted-dark hover:text-red-500 ml-1">
                                                    <Icon name="X" size={9}/>
                                                </button>
                                            </div>
                                        )}
                                        {mentionState.active && mentionOptions.length > 0 && (
                                            <div className="absolute z-10 top-full left-4 mt-1 w-64 bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                                            {filteredMentions.length > 0 ? filteredMentions.map((o, i) => (
                                                <div key={i} className="px-3 py-2 hover:bg-primary/10 hover:text-primary cursor-pointer text-sm text-textMain-light dark:text-textMain-dark flex justify-between border-b border-border-light dark:border-border-dark/50 last:border-0" onMouseDown={(e) => { e.preventDefault(); insertMention(o.name); }}>
                                                <span>{o.name}</span>
                                                {o.type === 'img' && <Icon name="Image" size={14} className="text-cyan-500" />}
                                                {o.type === 'char' && <Icon name="Users" size={14} className="text-accent" />}
                                                {o.type === 'loc' && <Icon name="MapPin" size={14} className="text-amber-500" />}
                                                </div>
                                            )) : <div className="px-3 py-2 text-sm text-textMuted-light dark:text-textMuted-dark italic">No matches</div>}
                                            </div>
                                        )}
                                        </>
                                    );
                                })()}
                                
                                {/* Real-time Platform Restriction Warning */}
                                {promptMode === 'video' && foundViolations.length > 0 && (
                                    <div className="mt-2 p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg flex flex-col gap-2 text-xs animate-slide-up shadow-sm">
                                        <div className="flex items-start">
                                            <Icon name="AlertTriangle" size={14} className="text-red-500 mr-2 shrink-0 mt-0.5" />
                                            <div className="flex flex-col">
                                                <span className="text-red-600 dark:text-red-400 font-bold mb-0.5">Model Restriction Alert ({videoPlatform})</span>
                                                <span className="text-textMuted-light dark:text-textMuted-dark leading-tight">Your prompt contains flagged words: <strong className="text-red-500 dark:text-red-400">"{foundViolations.join(', ')}"</strong>. {activePlatformRestrictions.warning}</span>
                                            </div>
                                        </div>
                                        <button onClick={handleSanitizePrompt} className="self-end bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md text-[10px] font-bold shadow-sm transition-colors flex items-center">
                                            <Icon name="Wand2" size={12} className="mr-1.5" /> Sanitize for AI
                                        </button>
                                    </div>
                                )}

                                {/* Complexity & Artifact Risk Meters */}
                                <div className="mt-3 pt-3 border-t border-border-light dark:border-border-dark/50 shrink-0 transition-all duration-300 flex flex-col sm:flex-row gap-4">
                                    
                                    {/* Prompt Word Count Meter */}
                                    <div className="flex-1 flex flex-col justify-center">
                                        {(() => {
                                            const currentWordCount = prompt.trim() ? prompt.trim().split(/\s+/).filter(Boolean).length : 0;
                                            const maxWords = 75;
                                            const wordCountPercent = Math.min(100, (currentWordCount / maxWords) * 100);
                                            let wordCountColor = 'bg-green-500';
                                            let textColor = 'text-green-500 dark:text-green-400';
                                            if (currentWordCount > 50) { wordCountColor = 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'; textColor = 'text-amber-500 dark:text-amber-400'; }
                                            if (currentWordCount > 75) { wordCountColor = 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'; textColor = 'text-red-500 dark:text-red-400'; }
                                            return (
                                                <>
                                                    <div className="flex justify-between items-center mb-1.5 cursor-help" title="Optimal AI prompts are usually under 75 words. Too much text dilutes focus.">
                                                        <label className="text-[10px] uppercase tracking-wider font-bold text-textMuted-light dark:text-textMuted-dark flex items-center">
                                                            <Icon name="AlignLeft" size={12} className={`mr-1.5 ${textColor}`} /> Prompt Complexity
                                                        </label>
                                                        <span className={`text-[9px] font-bold ${textColor}`}>{currentWordCount} / {maxWords} Words</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-input-light dark:bg-input-dark rounded-full overflow-hidden border border-border-light dark:border-border-dark/50">
                                                        <div className={`h-full ${wordCountColor} transition-all duration-500`} style={{ width: `${Math.max(2, wordCountPercent)}%` }}></div>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>

                                    {/* Artifact Risk Meter */}
                                    {promptMode === 'video' && workspace !== 'DESIGNER' && (
                                        <div className="flex-1 flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-border-light dark:border-border-dark/50 pt-3 sm:pt-0 sm:pl-4">
                                            <div className="flex justify-between items-center mb-1.5 cursor-help group" title={artifactRisk.textWarning}>
                                                <label className="text-[10px] uppercase tracking-wider font-bold text-textMuted-light dark:text-textMuted-dark flex items-center">
                                                    <Icon name="Activity" size={12} className={`mr-1.5 ${artifactRisk.textColor}`} /> AI Artifact Risk: <span className={`ml-1 ${artifactRisk.textColor}`}>{artifactRisk.level}</span>
                                                </label>
                                                {artifactRisk.reasons.length > 0 && <span className="text-[9px] text-textMuted-light dark:text-textMuted-dark truncate max-w-[100px] lg:max-w-[150px]">Flags: {artifactRisk.reasons.slice(0, 2).join(', ')}</span>}
                                            </div>
                                            <div className="w-full h-1.5 bg-input-light dark:bg-input-dark rounded-full overflow-hidden border border-border-light dark:border-border-dark/50">
                                                <div className={`h-full ${artifactRisk.color} transition-all duration-500`} style={{ width: `${Math.max(5, artifactRisk.score)}%` }}></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-border-light dark:border-border-dark/50 shrink-0">
                                    <Icon name="Tag" size={14} className="text-textMuted-light dark:text-textMuted-dark shrink-0" />
                                    <input value={shotTags} onChange={e => setShotTags(e.target.value)} placeholder="Add tags (comma separated)..." className="text-xs text-textMain-light dark:text-textMain-dark bg-transparent outline-none w-full" />
                                </div>

                                {/* References Row */}
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border-light dark:border-border-dark/50 shrink-0 flex-wrap overflow-y-auto max-h-32 custom-scrollbar">
                                    <input type="file" multiple accept="image/*" className="hidden" ref={referenceFileInputRef} onChange={handleReferenceUpload} />
                                    <button onClick={() => referenceFileInputRef.current.click()} disabled={referenceImages.length >= 17} className={`text-xs px-3 py-1.5 h-10 rounded transition-all border flex items-center space-x-1.5 shrink-0 font-medium ${referenceImages.length >= 17 ? 'bg-input-light dark:bg-input-dark/50 text-textMuted-light dark:text-textMuted-dark border-border-light dark:border-border-dark/50 cursor-not-allowed' : 'bg-panel-light dark:bg-panel-dark hover:bg-input-light dark:hover:bg-border-dark text-cyan-600 dark:text-cyan-400 border-border-light dark:border-border-dark shadow-sm'}`}>
                                        <Icon name="ImagePlus" size={14} /><span>{t('addRefImage')} ({referenceImages.length}/17)</span>
                                    </button>
                                    {referenceImages.map(img => {
                                        const activeAr = ASPECT_RATIOS.find(ar => ar.id === selections.aspectRatio) || ASPECT_RATIOS[0];
                                        return (
                                            <div key={img.id} className="relative group rounded border border-border-light dark:border-border-dark w-10 shrink-0 overflow-hidden shadow-sm bg-black flex items-center justify-center" style={{ height: '40px' }}>
                                                <div className="w-full h-full relative" style={{ paddingBottom: activeAr.id === '--ar 16:9' ? '56.25%' : activeAr.id === '--ar 9:16' ? '177.7%' : activeAr.id === '--ar 2.35:1' ? '42.5%' : '100%', height: activeAr.id.includes('9:16') ? '100%' : 'auto', width: activeAr.id.includes('9:16') ? 'auto' : '100%', maxHeight: '100%', maxWidth: '100%', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                                                    <img src={img.data} className="absolute inset-0 w-full h-full object-cover" title={`@${img.id}`} />
                                                </div>
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity z-10">
                                                    {isMultimodal && isLlmReady && !isGenerating && (
                                                        <button onClick={() => handleDescribeImage(img.data)} className="text-cyan-400 hover:text-cyan-300" title="Describe with Llava"><Icon name="Brain" size={14} /></button>
                                                    )}
                                                    <button onClick={() => removeReferenceImage(img.id)} className="text-red-400 hover:text-red-300"><Icon name="X" size={14} /></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                <div className="flex flex-col mt-4 pt-3 border-t border-border-light dark:border-border-dark/50 shrink-0">
                                    <label className="text-[11px] uppercase tracking-wider font-bold text-red-500 mb-2 flex items-center"><Icon name="X" size={14} className="mr-1"/> Negative Prompt & Anti-Tropes</label>
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {ANTI_TROPES.map(trope => {
                                            const isActive = negativePrompt.split(',').map(s=>s.trim()).includes(trope);
                                            return (
                                                <button key={trope} onClick={() => toggleTrope(trope)} className={`text-[9px] px-2 py-1 rounded border transition-colors ${isActive ? 'bg-red-500/20 text-red-500 border-red-500/50' : 'bg-input-light dark:bg-input-dark text-textMuted-light dark:text-textMuted-dark border-border-light dark:border-border-dark hover:border-red-500/30'}`}>
                                                    {isActive ? '-' : '+'}{trope}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {activeNegativeSuggestions.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mb-2 animate-slide-up items-center">
                                            <span className="text-[9px] font-bold text-amber-500 flex items-center mr-1"><Icon name="Lightbulb" size={10} className="mr-1"/> AI Suggest:</span>
                                            {activeNegativeSuggestions.map(sug => (
                                                <button key={sug} onClick={() => setNegativePrompt(prev => prev ? prev + ', ' + sug : sug)} className="text-[9px] px-2 py-1 rounded border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors shadow-sm">
                                                    + {sug}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <input value={negativePrompt} onChange={e => setNegativePrompt(e.target.value)} placeholder="e.g., CGI, deformed, noisy..." className="w-full text-xs bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-lg p-2 focus:border-red-500 outline-none transition-all shadow-sm" />
                                </div>

                                {promptMode === 'video' && workspace !== 'DESIGNER' && (
                                    <div className="mt-4 pt-3 border-t border-border-light dark:border-border-dark/50 flex flex-col shrink-0">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-xs font-bold text-accent uppercase tracking-wider flex items-center"><Icon name="MessageSquare" size={14} className="mr-1.5" />{t('dialogueVoice')}</label>
                                            <button onClick={handleAddDialogue} className="text-[10px] bg-accent/10 dark:bg-accent/20 text-accent px-2.5 py-1.5 rounded border border-accent/20 dark:border-accent/30 flex items-center font-bold hover:bg-accent/20 dark:hover:bg-accent/30 shadow-sm"><Icon name="Plus" size={12} className="mr-1"/>{t('addLine')}</button>
                                        </div>
                                        {showDurationWarning && (
                                            <div className="mb-3 p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between text-xs animate-slide-up shadow-sm">
                                                <div className="flex items-center text-red-600 dark:text-red-400">
                                                    <Icon name="AlertTriangle" size={14} className="mr-2 shrink-0" />
                                                    <span><strong>Pacing Warning:</strong> ~{totalDialogueWords} words requires at least {requiredDurationNum}s. (Current: {currentDurationNum}s)</span>
                                                </div>
                                                <button onClick={() => { const target = Math.min(120, Math.max(5, requiredDurationNum)); const snapped = OPTIONS.durations.reduce((best, item) => Math.abs(parseFloat(item) - target) < Math.abs(parseFloat(best) - target) ? item : best); setSelections(prev => ({...prev, duration: snapped})); }} className="bg-red-500 hover:bg-red-600 text-white px-2.5 py-1.5 rounded text-[10px] font-bold transition-colors shadow-sm whitespace-nowrap ml-2">Auto-Fix</button>
                                            </div>
                                        )}
                                        <div className="max-h-[250px] overflow-y-auto custom-scrollbar pr-1 space-y-3">
                                            {dialogues.length === 0 ? (
                                                <p className="text-xs text-textMuted-light dark:text-textMuted-dark italic text-center mt-2">No dialogue. Type in the subject box and click "Suggest" or add manually.</p>
                                            ) : (
                                                dialogues.map((d, index) => (
                                                    <div 
                                                        key={index} 
                                                        draggable
                                                        onContextMenu={(e) => {
                                                            e.preventDefault();
                                                            openCtxMenu(e, 'dialogue', {
                                                                index: index,
                                                                character: d.character,
                                                                text: d.text,
                                                                mood: d.mood,
                                                                reaction: d.reaction,
                                                                event: d.event,
                                                                voiceStyle: d.voiceStyle
                                                            });
                                                        }}
                                                        onDragStart={(e) => { if(e.target.closest('input') || e.target.closest('select') || e.target.closest('button')) { e.preventDefault(); return; } handleDialogueDragStart(e, index); }}
                                                        onDragOver={(e) => handleDialogueDragOver(e, index)}
                                                        onDrop={(e) => handleDialogueDrop(e, index)}
                                                        onDragEnd={handleDialogueDragEnd}
                                                        className={`bg-panel-light dark:bg-panel-dark p-3 rounded-lg border flex flex-col gap-2 shadow-sm transition-all cursor-grab active:cursor-grabbing ${draggedDialogueIndex === index ? 'opacity-50 border-primary border-dashed' : dragOverDialogueIndex === index ? 'border-primary shadow-md scale-[1.01] z-10' : 'border-border-light dark:border-border-dark'}`}
                                                    >
                                                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                                            {globalCharacters.length > 0 ? (
                                                                <select 
                                                                    value={d.character} 
                                                                    onChange={(e) => handleDialogueChange(index, 'character', e.target.value)}
                                                                    onContextMenu={(e) => {
                                                                        e.preventDefault();
                                                                        if (d.character) {
                                                                            openCtxMenu(e, 'character', {
                                                                                index: index,
                                                                                characterName: d.character
                                                                            });
                                                                        }
                                                                    }}
                                                                    className="col-span-1 bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded p-1.5 text-xs focus:border-accent outline-none">
                                                                    <option value="">Char</option>
                                                                    {globalCharacters.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                                                </select>
                                                            ) : (
                                                                <input 
                                                                    placeholder="Char" 
                                                                    value={d.character} 
                                                                    onChange={(e) => handleDialogueChange(index, 'character', e.target.value)}
                                                                    onContextMenu={(e) => {
                                                                        e.preventDefault();
                                                                        if (d.character) {
                                                                            openCtxMenu(e, 'character', {
                                                                                index: index,
                                                                                characterName: d.character
                                                                            });
                                                                        }
                                                                    }}
                                                                    className="col-span-1 bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded p-1.5 text-xs focus:border-accent outline-none"/>
                                                            )}
                                                            <select value={d.mood} onChange={(e) => handleDialogueChange(index, 'mood', e.target.value)} className="col-span-1 bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded p-1.5 text-xs focus:border-accent outline-none"><option value="">Mood</option>{OPTIONS.dialogueMoods.map(m => <option key={m} value={m}>{m}</option>)}</select>
                                                            <select value={OPTIONS.reactions.includes(d.reaction) ? d.reaction : (d.reaction ? 'Custom' : '')} onChange={(e) => { if (e.target.value === 'Custom') { const customVal = window.prompt("Enter a custom reaction:"); if (customVal) handleDialogueChange(index, 'reaction', customVal.trim()); } else handleDialogueChange(index, 'reaction', e.target.value); }} className="col-span-1 bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded p-1.5 text-xs focus:border-cyan-500 outline-none"><option value="">React</option>{OPTIONS.reactions.map(r => <option key={r} value={r}>{r}</option>)}{d.reaction && !OPTIONS.reactions.includes(d.reaction) && <option value={d.reaction}>{d.reaction}</option>}<option value="Custom" className="text-cyan-600 dark:text-cyan-400 font-bold">Custom...</option></select>
                                                            <select value={OPTIONS.dialogueEvents.includes(d.event) ? d.event : (d.event ? 'Custom' : '')} onChange={(e) => { if (e.target.value === 'Custom') { const customVal = window.prompt("Enter a custom event:"); if (customVal) handleDialogueChange(index, 'event', customVal.trim()); } else handleDialogueChange(index, 'event', e.target.value); }} className="col-span-1 bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded p-1.5 text-xs focus:border-amber-500 outline-none"><option value="">Event</option>{OPTIONS.dialogueEvents.map(ev => <option key={ev} value={ev}>{ev}</option>)}{d.event && !OPTIONS.dialogueEvents.includes(d.event) && <option value={d.event}>{d.event}</option>}<option value="Custom" className="text-amber-600 dark:text-amber-400 font-bold">Custom...</option></select>
                                                            <select value={d.voiceStyle} onChange={(e) => handleDialogueChange(index, 'voiceStyle', e.target.value)} className="col-span-1 bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded p-1.5 text-xs focus:border-indigo-500 outline-none"><option value="">Voice</option>{globalVoiceStyles.length > 0 && <optgroup label="My Voice Library">{globalVoiceStyles.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}</optgroup>}<optgroup label="Default Presets">{OPTIONS.defaultVoiceStyles.map(v => <option key={v} value={v}>{v}</option>)}</optgroup></select>
                                                            <select value={d.placement || 'after'} onChange={(e) => handleDialogueChange(index, 'placement', e.target.value)} className="col-span-2 sm:col-span-5 bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded p-1.5 text-xs focus:border-accent outline-none"><option value="before">Action after this line</option><option value="during">Action during this line</option><option value="after">Action before this line</option></select>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-input-light dark:hover:bg-border-dark rounded transition-colors" title="Drag to reorder dialogue">
                                                                <Icon name="Move" size={14} className="text-textMuted-light dark:text-textMuted-dark opacity-50 shrink-0" />
                                                            </div>
                                                            <input placeholder="Dialogue text..." value={d.text} onChange={(e) => handleDialogueChange(index, 'text', e.target.value)} className="w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded p-2 text-xs focus:border-accent outline-none transition-all"/>
                                                            <button onClick={() => handleRemoveDialogue(index)} className="text-textMuted-light dark:text-textMuted-dark hover:bg-red-50 dark:hover:bg-red-500/20 hover:text-red-500 p-2 rounded transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-500/30"><Icon name="Trash2" size={14} /></button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* MIDDLE LEFT: Presets Grid */}
                        <div className={getPanelClass() + " p-4"}>
                            <div className="flex items-center justify-between mb-3 pl-1">
                                <h3 className="text-xs font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-wider flex items-center space-x-1.5">
                                    <Icon name="Wand2" size={16} className="text-primary" />
                                    <span>{t('quickShotPresets')}</span>
                                </h3>
                                <select value={activePresetCategory} onChange={e => setActivePresetCategory(e.target.value)} className="bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded p-1 text-[10px] font-bold focus:border-primary outline-none cursor-pointer uppercase tracking-wider shadow-sm">
                                    <option value="All">ALL</option>
                                    <option value="Action">ACTION</option>
                                    <option value="Dialogue">DIALOGUE</option>
                                    <option value="Scenery">SCENERY</option>
                                    <option value="Style">STYLE</option>
                                    <option value="Technical">TECHNICAL</option>
                                    {customPresets.length > 0 && <option value="Custom">CUSTOM</option>}
                                </select>
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                {[...SHOT_PRESETS, ...(workspace === 'FILMMAKER' ? PRO_SHOT_PRESETS : []), ...(workspace === 'DESIGNER' ? DESIGNER_PRESETS : []), ...customPresets.map(p => ({ ...p, category: "Custom" }))]
                                    .filter(p => activePresetCategory === "All" || p.category === activePresetCategory)
                                    .map((preset, idx) => (
                                        <div key={preset.id || idx} className="relative group">
                                            <button 
                                                onClick={() => handlePresetClick(preset)}
                                                onContextMenu={(e) => { e.preventDefault(); openCtxMenu(e, 'preset', { preset, idx }); }}
                                                className={`w-full flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all group-btn h-full shadow-sm ${activePresetName === preset.name ? 'bg-green-500/10 border-2 border-green-500 dark:bg-green-500/20' : 'bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark hover:border-primary/50 hover:bg-base-light dark:hover:bg-border-dark'}`}
                                            >
                                                <Icon name={preset.icon} size={28} className={`transition-colors ${activePresetName === preset.name ? 'text-green-500' : preset.id ? 'text-amber-500' : 'text-textMuted-light dark:text-textMuted-dark group-hover:text-primary'}`} />
                                                <span className={`text-xs font-bold text-center leading-tight ${activePresetName === preset.name ? 'text-green-600 dark:text-green-400' : 'text-textMuted-light dark:text-textMuted-dark group-hover:text-textMain-light dark:group-hover:text-textMain-dark'}`}>{preset.name}</span>
                                            </button>
                                            {preset.isPro && (
                                                <span className="absolute -top-1.5 -left-1.5 bg-red-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10 pointer-events-none">PRO</span>
                                            )}
                                            {preset.isDesigner && (
                                                <span className="absolute -top-1.5 -left-1.5 bg-cyan-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10 pointer-events-none">DESIGN</span>
                                            )}
                                            {preset.id && (
                                                <button onClick={(e) => deleteCustomPreset(e, preset.id)} className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-400 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                                                    <Icon name="X" size={12} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        </div>
                        </div>

                        {/* ALWAYS VISIBLE STICKY ACTION BAR */}
                        <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-xl shadow-[0_-4px_15px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_15px_rgba(0,0,0,0.2)] shrink-0 flex flex-col mt-2 z-20">
                            <div className="p-3 bg-input-light dark:bg-input-dark/80 backdrop-blur-sm flex flex-col">
                                <div className="flex gap-2 shrink-0">
                                    <button onClick={editingIndex >= 0 ? handleAddOrUpdateShot : (chainMode ? handleChainAddShot : handleAddOrUpdateShot)} className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center space-x-1.5 shadow-md active:scale-[0.98] ${editingIndex >= 0 ? 'bg-primary hover:bg-primaryHover text-white' : chainMode ? 'bg-cyan-500 hover:bg-cyan-400 text-white' : 'bg-primary hover:bg-primaryHover text-white'}`}>
                                        <Icon name={editingIndex >= 0 ? "Check" : chainMode ? "Link" : "Plus"} size={16} />
                                        <span>{editingIndex >= 0 ? t('updateShot') : chainMode ? 'Chain Add' : t('addAsShot')}</span>
                                    </button>
                                    {/* ⚡ AI Video Preview Button */}
                                    <button
                                        onClick={() => handleVideoPreview(prompt)}
                                        disabled={!prompt || prompt === '[SUBJECT/ACTION]'}
                                        title="Generate AI video preview of this shot"
                                        className="px-4 py-3 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 shadow-md active:scale-[0.98] bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shrink-0"
                                    >
                                        <Icon name="Play" size={15} />
                                        <span className="hidden sm:inline">Preview</span>
                                    </button>
                                    {/* 🖼️ AI Image Generate Button */}
                                    <button
                                        onClick={() => handleImageGenerate(prompt)}
                                        disabled={!prompt || prompt === '[SUBJECT/ACTION]'}
                                        title="Generate AI image from this shot prompt"
                                        className="px-4 py-3 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 shadow-md active:scale-[0.98] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shrink-0"
                                    >
                                        <Icon name="Image" size={15} />
                                        <span className="hidden sm:inline">Image</span>
                                    </button>
                                    {editingIndex >= 0 && <button onClick={cancelEdit} className="px-5 py-3 bg-panel-light dark:bg-panel-dark hover:bg-base-light dark:hover:bg-border-dark text-textMain-light dark:text-textMain-dark rounded-lg transition-all shadow-sm border border-border-light dark:border-border-dark" title={t('cancelEditing')}><Icon name="X" size={16} /></button>}
                                </div>
                            </div>
                        </div>

                      </div>

                      {/* RIGHT COLUMN: Output Panels */}
                      {!isFocusMode && (
                      <div className={`${workspace === 'DESIGNER' ? 'lg:w-4/12 lg:order-2' : 'lg:w-4/12 lg:order-3'} flex flex-col gap-4 h-full min-h-0 transition-all duration-300`}>
                          
                          {/* TOP RIGHT: Scene Manager & Live Preview */}
                          <div className={getPanelClass() + " shrink-0 overflow-hidden"}>
                              <div className="p-3 border-b border-border-light dark:border-border-dark bg-input-light dark:bg-input-dark flex flex-col">
                                  <div className="flex items-center justify-between mb-2.5">
                                      <h3 className="text-xs font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-wider flex items-center space-x-1.5"><Icon name="Folder" size={14} className="text-amber-500" /><span className="flex items-center gap-2">{t('sceneManager')}<button onClick={() => runFullCritique && runFullCritique()} className="text-[8px] font-black px-1.5 py-0.5 rounded border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 transition-colors uppercase tracking-wide" title="Run Full Critique">🔍 Critique</button></span></h3>
                                      <div className="flex items-center gap-1.5">
                                          {/* Continuity Lock */}
                                          <button onClick={() => setShowContinuityLock(true)}
                                              className={`p-1.5 rounded-lg border text-[9px] font-black transition-all flex items-center gap-1 ${Object.keys(continuityLocks).length > 0 ? 'bg-amber-500/10 border-amber-500/40 text-amber-500' : 'bg-input-light dark:bg-input-dark border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:text-amber-500'}`}
                                              title="Continuity Lock — lock params across all shots">
                                              <Icon name="Lock" size={11}/>
                                              {Object.keys(continuityLocks).length > 0 && <span>{Object.keys(continuityLocks).length}</span>}
                                          </button>
                                          {/* Chain Mode */}
                                          <button onClick={() => { setShowChainModal(true); }}
                                              className={`p-1.5 rounded-lg border text-[9px] font-black transition-all flex items-center gap-1 ${chainMode ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-500' : 'bg-input-light dark:bg-input-dark border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:text-cyan-500'}`}
                                              title="Chain Mode — build shot sequences fast">
                                              <Icon name="Link" size={11}/>
                                              {chainMode && <span>CHAIN</span>}
                                          </button>
                                          {/* Storyboard Import — moved here from scene tabs */}
                                          <input ref={storyboardFileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { setPendingStoryboardImage(ev.target.result); setShowStoryboardPromptModal(true); }; reader.readAsDataURL(file); e.target.value = null; }} />
                                          <button
                                              onClick={() => setShowStoryboardAiModal(true)}
                                              disabled={isGenerating}
                                              title="Import Storyboard Image — choose AI engine"
                                              className={`p-1.5 rounded-lg border text-[9px] font-black transition-all flex items-center gap-1 bg-violet-500/10 border-violet-500/30 text-violet-500 hover:bg-violet-500/20 ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                              <Icon name="Layout" size={11}/>
                                              <span>Storyboard</span>
                                          </button>
                                          {/* Sequence Templates */}
                                          <button onClick={() => setShowSequenceTemplates(true)}
                                              className="p-1.5 rounded-lg border bg-input-light dark:bg-input-dark border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:text-primary transition-all"
                                              title="Shot Sequence Templates">
                                              <Icon name="ListVideo" size={11}/>
                                          </button>
                                          <span className="bg-base-light dark:bg-border-dark text-textMain-light dark:text-textMain-dark text-[10px] font-bold px-2 py-0.5 rounded border border-border-light dark:border-border-dark">{scenes.length} / 35</span>
                                      </div>
                                  </div>
                                  <div className="flex items-center space-x-2 overflow-x-auto custom-scrollbar pb-2 mb-2">
                                      {scenes.map(scene => (
                                          <button key={scene.id} onClick={() => { setActiveSceneId(scene.id); setEditingIndex(-1); clearForm(); }} onContextMenu={(e) => openCtxMenu(e, 'scene', { sceneId: scene.id })} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border shadow-sm ${activeSceneId === scene.id ? 'bg-primary border-primary text-white' : 'bg-panel-light dark:bg-panel-dark border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:border-border-dark dark:hover:border-border-light hover:text-textMain-light dark:hover:text-textMain-dark'}`}>
                                              {scene.name}
                                          </button>
                                      ))}
                                      {scenes.length < 35 && <button onClick={createNewScene} className="px-2 py-1.5 rounded-lg bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark text-primary hover:bg-base-light dark:hover:bg-border-dark shadow-sm" title={t('addNewScene')}><Icon name="Plus" size={14} /></button>}
                                      <button onClick={() => setShowScriptParserModal(true)} className="px-2 py-1.5 rounded-lg bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark text-indigo-500 hover:bg-base-light dark:hover:bg-border-dark shadow-sm" title="Import Screenplay (Text to Shots)"><Icon name="FileText" size={14} /></button>
                                  <input ref={storyboardFileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { setPendingStoryboardImage(ev.target.result); setShowStoryboardPromptModal(true); }; reader.readAsDataURL(file); e.target.value = null; }} />
                                  </div>
                                  <div className="flex items-center bg-panel-light dark:bg-panel-dark p-1.5 rounded-lg border border-border-light dark:border-border-dark shadow-inner">
                                      <Icon name="Edit" size={12} className="text-textMuted-light dark:text-textMuted-dark mx-1.5" />
                                      <input type="text" value={activeScene?.name || ""} onChange={(e) => renameScene(activeSceneId, e.target.value)} placeholder={t('sceneNamePlaceholder')} className="flex-1 bg-transparent text-textMain-light dark:text-textMain-dark text-xs font-bold outline-none" />
                                      <button onClick={() => deleteScene(activeSceneId)} className="text-textMuted-light dark:text-textMuted-dark hover:text-red-500 p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10"><Icon name="Trash2" size={14} /></button>
                                      <button onClick={() => duplicateScene(activeSceneId)} className="text-textMuted-light dark:text-textMuted-dark hover:text-green-500 p-1 rounded hover:bg-green-50 dark:hover:bg-green-500/10" title="Duplicate Scene"><Icon name="Copy" size={14} /></button>
                                  </div>
                              </div>

                              <div className="p-3 bg-panel-light dark:bg-panel-dark flex-1 flex flex-col">
                                  <label className="text-[10px] font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest mb-1.5 flex items-center justify-between">
                                     <span>{t('currentPromptPreview')}</span>
                                     <div className="flex items-center gap-2">
                                         {/* Shotify Toggle */}
                                         <button
                                             onClick={() => setShotifyMode(p => !p)}
                                             title={shotifyMode ? `Shotify ON — Compressed for ${videoPlatform}` : 'Shotify OFF — Click to compress prompt for AI model'}
                                             className={`flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-lg border transition-all ${shotifyMode ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-500' : 'bg-input-light dark:bg-input-dark border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:border-cyan-500/40 hover:text-cyan-500'}`}>
                                             <Icon name="Zap" size={10} className={shotifyMode ? 'text-cyan-500' : ''} />
                                             SHOTIFY
                                             {shotifyMode && <span className="text-[8px] opacity-70">{videoPlatform}</span>}
                                         </button>
                                         {/* Token Counter */}
                                         {prompt && (() => {
                                             const chars = prompt.length;
                                             const tokens = Math.ceil(chars / 4);
                                             const color = tokens > 500 ? 'text-red-500' : tokens > 300 ? 'text-amber-500' : 'text-green-500';
                                             const bg = tokens > 500 ? 'bg-red-500/10 border-red-500/30' : tokens > 300 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-green-500/10 border-green-500/30';
                                             return (
                                                 <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${bg} ${color}`} title="Estimated token count (chars ÷ 4)">
                                                     ~{tokens} tokens
                                                 </span>
                                             );
                                         })()}
                                         {/* Feature 5 — Quick Copy */}
                                         <QuickCopyBtn text={prompt} />
                                         {/* Feature 10 — Aspect Ratio Preview */}
                                         {selections?.aspectRatio && <AspectRatioPreview ratio={selections.aspectRatio} shotType={selections.shotType} lighting={selections.lighting}/>}
                                         <span className="text-[9px] font-normal italic text-textMuted-light dark:text-textMuted-dark">Auto-updates</span>
                                     </div>
                                  </label>
                                  <div className="relative flex-1 min-h-[80px]">
                                      {shotifyMode && (
                                          <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-500 text-[8px] font-black px-1.5 py-0.5 rounded pointer-events-none">
                                              <Icon name="Zap" size={8} />SHOTIFY · {videoPlatform}
                                          </div>
                                      )}
                                      {isGenerating ? (
                                          <div className="w-full h-full bg-input-light dark:bg-input-dark/80 processing-glow text-primary rounded-lg flex justify-center items-center border border-primary/30">
                                              <Icon name="Sparkles" size={16} className="animate-pulse mr-2" /><span className="text-xs font-bold font-mono">STRUCTURING...</span>
                                          </div>
                                      ) : (
                                          <textarea readOnly value={prompt} onContextMenu={(e) => openCtxMenu(e, 'prompt-output', { sceneId: activeSceneId })} placeholder="Build a prompt or select a shot..." className={`w-full h-full bg-input-light dark:bg-input-dark border text-textMain-light dark:text-textMain-dark rounded-lg p-2.5 outline-none resize-none font-mono text-xs custom-scrollbar shadow-inner ${editingIndex >= 0 ? 'border-primary' : 'border-border-light dark:border-border-dark'}`} />
                                      )}
                                  </div>
                              </div>
                          </div>

                          {/* BOTTOM RIGHT: Sequence / Final Script (Tabbed) */}
                          <div className={getPanelClass() + " flex-1 min-h-[300px] overflow-hidden relative"}>
                              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-cyan-400"></div>
                              <div className="flex border-b border-border-light dark:border-border-dark bg-input-light dark:bg-input-dark shrink-0">
                                  <button onClick={() => setActiveOutputTab('sequence')} className={`flex-1 py-3 text-[11px] sm:text-xs font-bold transition-all uppercase tracking-wider flex justify-center items-center ${activeOutputTab === 'sequence' ? 'text-primary border-b-2 border-primary bg-panel-light dark:bg-primary/10' : 'text-textMuted-light dark:text-textMuted-dark hover:bg-base-light dark:hover:bg-border-dark'}`}><Icon name="ListVideo" size={14} className="mr-1.5"/><span className="flex items-center gap-1">{t('sequenceList')}{(() => { const count = shots.reduce((acc, s) => acc + ((critiqueAnnotations[s.id] || []).filter(a => !dismissedAnnotations[a.id]).length), 0); return count > 0 ? <span className="ml-1 text-[7px] font-black px-1 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">{count}</span> : null; })()}</span></button>
                                  {workspace !== 'DESIGNER' && (
                                      <>
                                          <button onClick={() => setActiveOutputTab('timeline')} className={`flex-1 py-3 text-[11px] sm:text-xs font-bold transition-all uppercase tracking-wider flex justify-center items-center ${activeOutputTab === 'timeline' ? 'text-amber-500 border-b-2 border-amber-500 bg-panel-light dark:bg-amber-500/10' : 'text-textMuted-light dark:text-textMuted-dark hover:bg-base-light dark:hover:bg-border-dark'}`}><Icon name="Clock" size={14} className="mr-1.5"/>Timeline</button>
                                          <button onClick={() => setActiveOutputTab('script')} className={`flex-1 py-3 text-[11px] sm:text-xs font-bold transition-all uppercase tracking-wider flex justify-center items-center ${activeOutputTab === 'script' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 bg-panel-light dark:bg-indigo-500/10' : 'text-textMuted-light dark:text-textMuted-dark hover:bg-base-light dark:hover:bg-border-dark'}`}><Icon name="Film" size={14} className="mr-1.5"/>{t('finalScene')}</button>
                                      </>
                                  )}
                              </div>

                              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-4 bg-base-light/50 dark:bg-base-dark/30">
                                  {/* Feature 2 — Shot Filmstrip */}
                                  {activeOutputTab === 'sequence' && shots && shots.length > 0 && (
                                      <ShotFilmstrip
                                          shots={shots}
                                          activeIndex={editingIndex >= 0 ? editingIndex : -1}
                                          onSelect={(i) => { const s = shots[i]; if(s) { setEditingIndex(i); setSubject(s.subject||''); setSelections(s.selections||{}); } }}
                                          onDelete={(i) => { updateActiveShots(prev => prev.filter((_,idx) => idx !== i)); }}
                                          onContextMenu={(e, i) => openCtxMenu(e, 'filmstrip', { shotIndex: i })}
                                      />
                                  )}
                                  {activeOutputTab === 'sequence' && (
                                      <div className="flex flex-col h-full animate-slide-up">
                                          <div className="flex justify-between items-center mb-3 gap-2">
                                              <div className="flex items-center gap-2 bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded-lg px-2.5 py-1.5 shadow-sm">
                                                  <input 
                                                      type="checkbox" 
                                                      className="accent-primary w-3.5 h-3.5 cursor-pointer"
                                                      checked={shots.length > 0 && selectedShots.length === shots.length} 
                                                      onChange={(e) => e.target.checked ? setSelectedShots(shots.map((_, i) => i)) : setSelectedShots([])} 
                                                      title="Select All"
                                                  />
                                              </div>
                                              <div className="flex-1 flex items-center bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded-lg px-2 py-1.5 shadow-sm">
                                                  <Icon name="Search" size={14} className="text-textMuted-light dark:text-textMuted-dark mr-1.5 shrink-0" />
                                                  <input value={shotSearchQuery} onChange={e => setShotSearchQuery(e.target.value)} placeholder="Search shots or tags..." className="bg-transparent border-none outline-none text-xs text-textMain-light dark:text-textMain-dark w-full" />
                                              </div>
                                              <button onClick={() => { setShowFindReplace(true); setFrResults(null); }} className="p-1.5 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:text-primary hover:border-primary/50 transition-colors shrink-0" title="Find &amp; Replace">
                                                  <Icon name="Edit2" size={14} />
                                              </button>
                                              <button onClick={() => setShowRhythm(true)} className="p-1.5 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:text-cyan-500 hover:border-cyan-500/50 transition-colors shrink-0" title="Shot Rhythm Analyzer">
                                                  <Icon name="Activity" size={14} />
                                              </button>
                                              <button onClick={() => setShowGenreDNA(true)} className="p-1.5 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:text-purple-500 hover:border-purple-500/50 transition-colors shrink-0" title="Genre DNA Detector">
                                                  <Icon name="Aperture" size={14} />
                                              </button>
                                              {selectedShots.length > 0 ? (
                                                  <button onClick={() => setShowBulkEditModal(true)} className="text-xs bg-primary hover:bg-primaryHover text-white px-3 py-1.5 rounded-lg font-bold shadow-sm flex items-center shrink-0 transition-colors animate-slide-up">
                                                      <Icon name="Edit" size={14} className="mr-1.5" /> Bulk Edit ({selectedShots.length})
                                                  </button>
                                              ) : (
                                                  <div className="flex items-center space-x-2 shrink-0">
                                                      <span className="text-xs font-bold text-textMuted-light dark:text-textMuted-dark">{shots.length} {t('items')}</span>
                                                      <span className="bg-panel-light dark:bg-panel-dark text-textMain-light dark:text-textMain-dark text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border border-border-light dark:border-border-dark"><Icon name="Clock" size={10} className="inline mr-1 text-textMuted-light dark:text-textMuted-dark" />{getSceneDuration()}s</span>
                                                  </div>
                                              )}
                                          </div>
                                          <div className="space-y-2 pb-2" onContextMenu={(e) => { if (e.target === e.currentTarget) openCtxMenu(e, 'canvas', {}); }}>
                                              {shots.length === 0 ? (
                                                  <div className="text-center mt-10 p-6 border-2 border-dashed border-border-light dark:border-border-dark rounded-xl">
                                                      <Icon name="ListVideo" size={32} className="mx-auto text-textMuted-light dark:text-textMuted-dark mb-2" />
                                                      <p className="text-xs text-textMuted-light dark:text-textMuted-dark font-medium">No items added yet.<br/>Build your prompt and click Add.</p>
                                                  </div>
                                              ) : (
                                                  shots.map((s, i) => ({...s, originalIndex: i})).filter(s => !shotSearchQuery || s.subject.toLowerCase().includes(shotSearchQuery.toLowerCase()) || (s.tags && s.tags.some(t => t.toLowerCase().includes(shotSearchQuery.toLowerCase())))).map((s) => {
                                                      const i = s.originalIndex;
                                                      const isSearching = shotSearchQuery.trim().length > 0;
                                                      return (
                                                      <div 
                                                          key={i} 
                                                          draggable={!isSearching}
                                                          onDragStart={(e) => { if(isSearching || e.target.closest('button') || e.target.tagName.toLowerCase() === 'input') { e.preventDefault(); return; } handleShotDragStart(e, i); }}
                                                          onDragOver={(e) => handleShotDragOver(e, i)}
                                                          onDrop={(e) => handleShotDrop(e, i)}
                                                          onDragEnd={handleShotDragEnd}
                                                          onContextMenu={(e) => handleShotContextMenu(e, i)}
                                                          className={`p-3 rounded-xl border flex flex-col gap-2 transition-all shadow-sm hover:border-primary/40 ${s.colorTag ? `shot-tag-${s.colorTag}` : ''} ${!isSearching ? 'cursor-grab active:cursor-grabbing' : ''} ${selectedShots.includes(i) ? 'border-primary bg-primary/5' : draggedShotIndex === i ? 'opacity-50 border-primary border-dashed' : dragOverShotIndex === i ? 'border-primary shadow-md scale-[1.01] z-10' : editingIndex === i ? 'bg-primary/10 border-primary/50' : 'bg-panel-light dark:bg-panel-dark border-border-light dark:border-border-dark'}`}
                                                      >
                                                          <div className="flex items-center justify-between gap-3">
                                                              <div className="flex flex-col items-center justify-start h-full pt-1 shrink-0">
                                                                  <input 
                                                                      type="checkbox" 
                                                                      className="accent-primary w-4 h-4 cursor-pointer"
                                                                      checked={selectedShots.includes(i)}
                                                                      onChange={(e) => { if (e.target.checked) setSelectedShots([...selectedShots, i]); else setSelectedShots(selectedShots.filter(idx => idx !== i)); }}
                                                                  />
                                                              </div>
                                                              <div className="flex-1 min-w-0 cursor-pointer group" onClick={() => setExpandedShotIndex(expandedShotIndex === i ? -1 : i)}>
                                                                  <div className="flex items-center space-x-2 mb-1.5">
                                                                      <Icon name="Move" size={14} className="text-textMuted-light dark:text-textMuted-dark opacity-50 hover:opacity-100 transition-opacity shrink-0" />
                                                                      {s.referenceImages && s.referenceImages.length > 0 && (
                                                                          <img src={s.referenceImages[0].data} className="w-5 h-5 object-cover rounded border border-border-light dark:border-border-dark shadow-sm" title="Reference Image Preview" />
                                                                      )}
                                                                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${s.mode === 'image' ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/30' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30'}`}>{s.mode === 'image' ? 'Panel' : 'Shot'} {i + 1}</span>
                                                                      {/* Feature 7 — StatusBadge */}
                                                                      <StatusBadge status={s.status || 'Planning'} onClick={(e) => { e && e.stopPropagation(); const statuses = OPTIONS.shotStatuses; const next = statuses[(statuses.indexOf(s.status||'Planning')+1)%statuses.length]; handleShotStatusChange(i, next); }} onContextMenu={(e) => { e.stopPropagation(); openCtxMenu(e, 'status-pill', { shotIndex: i }); }} />
                                                                      {s.colorTag && <button onContextMenu={(e) => { e.stopPropagation(); openCtxMenu(e, 'color-tag', { shotIndex: i }); }} onClick={(e) => { e.stopPropagation(); openCtxMenu(e, 'color-tag', { shotIndex: i }); }} className="w-3 h-3 rounded-full shrink-0 hover:scale-125 transition-transform" style={{background:{red:'#ef4444',amber:'#f59e0b',green:'#22c55e',blue:'#3b82f6',purple:'#a855f7',pink:'#ec4899'}[s.colorTag]}} title={`Color tag: ${s.colorTag} — click to change`} />}
                                                                      {s.locked && <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 border-amber-500/30 text-amber-500 font-bold flex items-center gap-0.5"><Icon name="Lock" size={9}/>Locked</span>}
                                                                      {/* Director Intelligence Suite: Critique Badges */}
                                                                      {critiqueAnnotations && critiqueAnnotations[s.id] && critiqueAnnotations[s.id].filter(a => !dismissedAnnotations[a.id]).map(annotation => (
                                                                          <CritiqueBadge key={annotation.id} annotation={annotation} onDismiss={dismissAnnotation} />
                                                                      ))}
                                                                      {critiqueAnnotations && critiqueAnnotations[s.id] && critiqueAnnotations[s.id].filter(a => !dismissedAnnotations[a.id]).length === 0 && critiqueAnnotations[s.id].length > 0 && (
                                                                          <span className="text-[7px] font-black px-1 py-0.5 rounded border bg-green-500/20 border-green-500/40 text-green-500 uppercase tracking-wide leading-none">✓ Clean</span>
                                                                      )}
                                                                      <Icon name={expandedShotIndex === i ? "ChevronUp" : "ChevronDown"} size={12} className="text-textMuted-light dark:text-textMuted-dark group-hover:text-primary transition-colors" />
                                                                  </div>
                                                                  <span 
                                                                      className={`text-xs text-textMain-light dark:text-textMain-dark block ${expandedShotIndex === i ? '' : 'truncate'} font-mono bg-input-light dark:bg-input-dark p-1.5 rounded border border-border-light dark:border-border-dark/50 ${inlineEditingIndex !== i ? 'cursor-text hover:border-primary/50' : ''}`}
                                                                      onDoubleClick={(e) => { e.stopPropagation(); setInlineEditingIndex(i); setInlineEditText(getFinalPromptText(s)); }}
                                                                  >
                                                                      {inlineEditingIndex === i ? (
                                                                          <div className="flex flex-col gap-2 mt-1" onClick={e => e.stopPropagation()}>
                                                                              <textarea value={inlineEditText} onChange={e => setInlineEditText(e.target.value)} className="w-full bg-panel-light dark:bg-panel-dark border border-primary text-textMain-light dark:text-textMain-dark rounded p-2 text-xs font-mono outline-none resize-y min-h-[80px] shadow-sm" autoFocus />
                                                                              <div className="flex gap-2 justify-end">
                                                                                  <button onClick={() => setInlineEditingIndex(-1)} className="px-2 py-1 text-[10px] rounded border border-border-light dark:border-border-dark text-textMuted-light hover:text-textMain-light">Cancel</button>
                                                                                  <button onClick={() => { updateActiveShots(prev => { const newShots = [...prev]; newShots[i].customPromptOverride = inlineEditText; return newShots; }); setInlineEditingIndex(-1); }} className="px-3 py-1 text-[10px] rounded bg-primary hover:bg-primaryHover text-white font-bold shadow-sm">Save Override</button>
                                                                              </div>
                                                                          </div>
                                                                      ) : (
                                                                          getFinalPromptText(s)
                                                                      )}
                                                                  </span>
                                                              </div>
                                                              <div className="flex flex-col space-y-1.5 shrink-0 bg-input-light dark:bg-input-dark p-1 rounded-lg border border-border-light dark:border-border-dark">
                                                                  <button onClick={() => { if(s.locked) return; handleEditShot(i); }} className={`p-1.5 rounded transition-colors ${s.locked ? 'opacity-30 cursor-not-allowed' : ''} ${editingIndex === i ? 'text-primary bg-primary/20' : 'text-textMuted-light dark:text-textMuted-dark hover:text-primary hover:bg-base-light dark:hover:bg-border-dark'}`} title={s.locked ? 'Unlock to edit' : 'Edit'}><Icon name="Edit" size={14} /></button>
                                                                  <button onClick={() => { if(s.locked) return; handleDuplicateShot(i); }} className={`p-1.5 rounded transition-colors ${s.locked ? 'opacity-30 cursor-not-allowed' : 'text-textMuted-light dark:text-textMuted-dark hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10'}`} title={s.locked ? 'Unlock to duplicate' : 'Duplicate Shot'}><Icon name="Copy" size={14} /></button>
                                                                  <button onClick={() => toggleShotLock(i)} className={`p-1.5 rounded transition-colors ${s.locked ? 'text-amber-500 bg-amber-500/10' : 'text-textMuted-light dark:text-textMuted-dark hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10'}`} title={s.locked ? 'Unlock shot' : 'Lock shot'}><Icon name="Lock" size={14} /></button>
                                                                  <button onClick={() => { if(s.locked) { addToast('Shot is locked. Unlock it first.', 'warning'); return; } handleRemoveShot(i); }} className={`p-1.5 rounded transition-colors ${s.locked ? 'opacity-30 cursor-not-allowed' : 'text-textMuted-light dark:text-textMuted-dark hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'}`}><Icon name="Trash2" size={14} /></button>
                                                              </div>
                                                          </div>
                                                          {s.tags && s.tags.length > 0 && expandedShotIndex === i && (
                                                              <div className="flex items-center gap-1.5 mt-1.5">
                                                                  <Icon name="Tag" size={10} className="text-textMuted-light dark:text-textMuted-dark" />
                                                                  <div className="flex flex-wrap gap-1">
                                                                      {s.tags.map((t, tidx) => <span key={tidx} className="text-[9px] bg-border-light/50 dark:bg-border-dark/50 text-textMuted-light dark:text-textMuted-dark px-1.5 py-0.5 rounded">{t}</span>)}
                                                                  </div>
                                                              </div>
                                                          )}
                                                      </div>
                                                  )})
                                              )}
                                              {/* Director Intelligence Suite: Ghost Card */}
                                              {ghostCardSuggestions && ghostCardSuggestions[activeSceneId] && (
                                                  <div className="p-3 rounded-xl border border-dashed border-border-light dark:border-border-dark bg-panel-light/50 dark:bg-panel-dark/50 flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                                                      onClick={() => {
                                                          const suggestion = ghostCardSuggestions[activeSceneId];
                                                          if (!suggestion) return;
                                                          const activeScene = scenes.find(s => s.id === activeSceneId);
                                                          const newShot = {
                                                              id: `shot_${Date.now()}`,
                                                              subject: '',
                                                              selections: {
                                                                  shotType: suggestion.fullName,
                                                                  ...(activeScene?.shots?.slice(-1)[0]?.selections?.lighting ? { lighting: activeScene.shots.slice(-1)[0].selections.lighting } : {}),
                                                              },
                                                              mode: 'video',
                                                              status: 'Planning',
                                                          };
                                                          updateActiveShots(prev => [...prev, newShot]);
                                                          setGhostCardSuggestions(prev => ({ ...prev, [activeSceneId]: null }));
                                                          addToast(`Added ${suggestion.fullName} shot ✓`, 'success');
                                                      }}>
                                                      <div className="text-[9px] font-black text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest">
                                                          + {ghostCardSuggestions[activeSceneId].fullName}
                                                      </div>
                                                      <div className="text-[8px] text-textMuted-light dark:text-textMuted-dark italic text-center">
                                                          {ghostCardSuggestions[activeSceneId].rationale}
                                                      </div>
                                                  </div>
                                              )}
                                          </div>
                                      </div>
                                  )}

                                  {activeOutputTab === 'timeline' && (
                                      <div className="flex flex-col h-full animate-slide-up">
                                          <div className="flex justify-between items-center mb-3 shrink-0">
                                              <span className="text-xs font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-wider">Visual Timeline</span>
                                              <div className="flex items-center space-x-2">
                                                  <button onClick={togglePlayback} className={`p-1.5 rounded-lg transition-colors shadow-sm border ${isPlaying ? 'bg-red-500/20 border-red-500/50 text-red-500' : 'bg-input-light dark:bg-input-dark border-border-light dark:border-border-dark text-primary hover:bg-base-light dark:hover:bg-border-dark'}`}>
                                                      <Icon name={isPlaying ? "Pause" : "Play"} size={14} />
                                                  </button>
                                                  <span className="bg-panel-light dark:bg-panel-dark text-textMain-light dark:text-textMain-dark text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border border-border-light dark:border-border-dark flex items-center">
                                                      <Icon name="Clock" size={10} className="mr-1 text-textMuted-light dark:text-textMuted-dark" />
                                                      {playheadTime > 0 ? playheadTime.toFixed(1) + 's / ' : ''}{getSceneDuration()}s
                                                  </span>
                                              </div>
                                          </div>
                                          
                                          <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar bg-input-light dark:bg-input-dark/50 rounded-xl border border-border-light dark:border-border-dark p-4 relative min-h-[150px]">
                                              {shots.length > 0 && (
                                                  <div className="relative w-full h-[40px] mb-2 shrink-0">
                                                      {(() => {
                                                          const getIntensity = (speed) => { if (speed === 'Ultra Slow Motion') return 1; if (speed === 'Slow Motion') return 2; if (speed === '2x Fast Forward') return 4; if (speed === 'Speed Ramp' || speed === 'Time-Lapse') return 5; return 3; };
                                                          let offsetAcc = 0;
                                                          const points = shots.map((s, i) => {
                                                              const durMatch = s.selections.duration?.match(/([\d.]+)/);
                                                              const dur = durMatch ? parseFloat(durMatch[1]) : 2;
                                                              const width = Math.max(dur * 30, 48);
                                                              const cx = offsetAcc + (width / 2);
                                                              const cy = 40 - (getIntensity(s.selections.actionSpeed) * 6);
                                                              offsetAcc += width + 6;
                                                              return { x: cx, y: cy, label: s.selections.actionSpeed || 'Normal' };
                                                          });
                                                          const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');
                                                          return (
                                                              <svg className="w-full h-full overflow-visible">
                                                                  <polyline points={polylinePoints} fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-500 opacity-50" />
                                                                  {points.map((p, i) => (
                                                                      <circle key={i} cx={p.x} cy={p.y} r="4" className="fill-panel-dark stroke-cyan-500 stroke-2" title={p.label} />
                                                                  ))}
                                                              </svg>
                                                          );
                                                      })()}
                                                      <span className="absolute -left-10 top-2 text-[8px] text-textMuted-light dark:text-textMuted-dark rotate-[-90deg] uppercase tracking-widest font-bold">Action</span>
                                                  </div>
                                              )}
                                              {shots.length === 0 ? (
                                                  <div className="flex h-full items-center justify-center flex-col opacity-50">
                                                      <Icon name="Clock" size={32} className="mb-2 text-textMuted-light dark:text-textMuted-dark" />
                                                      <span className="text-xs text-textMuted-light dark:text-textMuted-dark font-medium italic">No shots added to timeline.</span>
                                                  </div>
                                              ) : (
                                                  <div className="flex items-stretch min-w-max h-24 space-x-1.5 mt-2">
                                                      {shots.map((s, i) => {
                                                          const durMatch = s.selections.duration?.match(/([\d.]+)/);
                                                          const dur = durMatch ? parseFloat(durMatch[1]) : 2;
                                                          const minWidth = Math.max(dur * 30, 48);
                                                          return (
                                                              <div key={i} style={{ width: `${minWidth}px` }} className={`relative h-full rounded-lg border shadow-sm flex flex-col overflow-hidden transition-all hover:-translate-y-1 cursor-pointer group ${editingIndex === i ? 'border-primary bg-primary/20' : 'border-border-light dark:border-border-dark bg-panel-light dark:bg-panel-dark hover:border-primary/50'}`} onClick={() => handleEditShot(i)} title={`Shot ${i+1}: ${dur}s\n${s.subject}`}>
                                                                  <div className={`h-1 w-full ${getStatusColor(s.status || 'Planning').split(' ')[0]}`}></div>
                                                                  {s.dialogues && s.dialogues.some(d => d.text.trim()) && (
                                                                      <Icon name="MessageSquare" size={10} className="absolute top-1.5 right-1.5 text-accent opacity-70" title="Contains Dialogue" />
                                                                  )}
                                                                  <div className="p-1.5 flex-1 flex flex-col justify-between items-center text-center">
                                                                      <span className="text-[10px] font-bold text-textMain-light dark:text-textMain-dark truncate w-full">S{i+1}</span>
                                                                      <span className="text-[9px] text-textMuted-light dark:text-textMuted-dark font-mono bg-input-light dark:bg-input-dark px-1.5 py-0.5 rounded border border-border-light dark:border-border-dark truncate w-full">{dur}s</span>
                                                                  </div>
                                                              </div>
                                                          );
                                                      })}
                                                  </div>
                                              )}
                                              {isPlaying && shots.length > 0 && (
                                                  <div style={{ transform: `translateX(${(() => {
                                                      let offset = 0; let accTime = 0;
                                                      for (let i = 0; i < shots.length; i++) {
                                                          const durMatch = shots[i].selections.duration?.match(/([\d.]+)/);
                                                          const dur = durMatch ? parseFloat(durMatch[1]) : 2;
                                                          const width = Math.max(dur * 30, 48);
                                                          if (playheadTime >= accTime && playheadTime <= accTime + dur) {
                                                              const fraction = dur === 0 ? 0 : (playheadTime - accTime) / dur;
                                                              return offset + (fraction * width);
                                                          }
                                                          offset += width + 6; accTime += dur;
                                                      }
                                                      return offset;
                                                  })()}px)` }} className="absolute top-[48px] bottom-6 w-0.5 bg-red-500 z-20 shadow-[0_0_5px_rgba(239,68,68,0.8)] transition-transform duration-75">
                                                      <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-red-500 rounded-sm"></div>
                                                  </div>
                                              )}
                                              {shots.length > 0 && (
                                                  <div className="flex min-w-max mt-3 text-[10px] font-mono text-textMuted-light dark:text-textMuted-dark pt-2 border-t border-border-light dark:border-border-dark/50">
                                                      <div style={{width: '0px'}} className="relative"><span className="absolute -left-2 -top-1">0s</span></div>
                                                      {shots.reduce((acc, s, i) => {
                                                          const durMatch = s.selections.duration?.match(/([\d.]+)/);
                                                          const dur = durMatch ? parseFloat(durMatch[1]) : 2;
                                                          const newTime = acc.time + dur;
                                                          const minWidth = Math.max(dur * 30, 48);
                                                          acc.elements.push(<div key={`marker-${i}`} style={{width: `${minWidth}px`}} className="relative border-l border-border-light dark:border-border-dark/30 h-2 mt-1 flex-shrink-0"><span className="absolute -right-3 -top-3">{newTime.toFixed(1)}s</span></div>);
                                                          acc.time = newTime;
                                                          return acc;
                                                      }, {time: 0, elements: []}).elements}
                                                  </div>
                                              )}
                                              {shots.some(s => s.sfx || s.bgm) && (
                                                  <div className="flex items-stretch min-w-max h-8 space-x-1.5 mt-2 border-t border-border-light dark:border-border-dark/50 pt-2">
                                                      {shots.map((s, i) => {
                                                          const durMatch = s.selections.duration?.match(/([\d.]+)/);
                                                          const dur = durMatch ? parseFloat(durMatch[1]) : 2;
                                                          const minWidth = Math.max(dur * 30, 48);
                                                          const hasAudio = s.sfx || s.bgm;
                                                          return (
                                                              <div key={`audio-${i}`} style={{ width: `${minWidth}px` }} className={`relative h-full rounded flex items-center justify-center overflow-hidden ${hasAudio ? 'bg-indigo-500/20 border border-indigo-500/30' : 'bg-transparent border border-dashed border-border-light dark:border-border-dark/30'}`} title={hasAudio ? `Audio: ${s.sfx || 'None'} / ${s.bgm || 'None'}` : 'No Audio'}>
                                                                  {hasAudio && <Waveform seed={i} />}
                                                              </div>
                                                          );
                                                      })}
                                                  </div>
                                              )}
                                          </div>
                                      </div>
                                  )}

                                  {activeOutputTab === 'script' && (
                                      <div className="flex flex-col h-full animate-slide-up">
                                          {/* Script toolbar — row 1: transitions + shotify indicator */}
                                          <div className="flex items-center gap-2 mb-2 shrink-0 flex-wrap">
                                              <button onClick={() => setIsEditingTransitions(!isEditingTransitions)} className={`text-[10px] px-3 py-1.5 rounded-lg transition-all border flex items-center gap-1.5 font-bold uppercase tracking-wider shadow-sm flex-1 justify-center ${isEditingTransitions ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500' : 'bg-panel-light dark:bg-panel-dark text-textMain-light dark:text-textMain-dark border-border-light dark:border-border-dark hover:bg-input-light dark:hover:bg-border-dark'}`}>
                                                  <Icon name="Zap" size={12} className={isEditingTransitions ? "" : "text-indigo-500"} />
                                                  <span>{isEditingTransitions ? t('previewScript') : t('actionEditTransitions')}</span>
                                              </button>
                                              {shotifyMode && (
                                                  <span className="flex items-center gap-1 text-[9px] font-black px-2 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-500 shrink-0">
                                                      <Icon name="Zap" size={10}/>SHOTIFY ON
                                                  </span>
                                              )}
                                          </div>
                                          {/* Script toolbar — row 2: export actions */}
                                          <div className="grid grid-cols-5 gap-1.5 mb-2 shrink-0">
                                              <button onClick={openExportModal} disabled={isExportingPDF} className={`text-[10px] bg-primary hover:bg-primaryHover text-white px-2 py-2 rounded-lg transition-all border border-primary flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider shadow-sm ${isExportingPDF ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                  {isExportingPDF ? <Icon name="Timer" size={12} className="animate-spin" /> : <Icon name="FileDown" size={12} />}
                                                  <span>PDF</span>
                                              </button>
                                              <button onClick={() => setShowMovieModal(true)} className="text-[10px] bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-400 px-2 py-2 rounded-lg border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center gap-1.5 font-bold hover:bg-indigo-100 dark:hover:bg-indigo-500/30 uppercase tracking-wider shadow-sm">
                                                  <Icon name="Film" size={12}/>
                                                  <span>Compile</span>
                                              </button>
                                              <button onClick={runPlotHoleDetector} className="text-[10px] bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-2 rounded-lg border border-orange-200 dark:border-orange-500/30 flex items-center justify-center gap-1.5 font-bold hover:bg-orange-100 dark:hover:bg-orange-500/20 uppercase tracking-wider shadow-sm">
                                                  <Icon name="AlertTriangle" size={12}/>
                                                  <span>Plot</span>
                                              </button>
                                              {/* ⚡ Video */}
                                              <button onClick={() => { const script = getActiveSceneScript(); if (script?.trim()) handleVideoPreview(script); }} disabled={!shots?.length}
                                                  className="text-[10px] bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-2 py-2 rounded-lg border border-purple-500 flex items-center justify-center gap-1 font-bold uppercase tracking-wider shadow-sm transition-all">
                                                  <Icon name="Play" size={11}/><span>Video</span>
                                              </button>
                                              {/* 🖼️ Image */}
                                              <button onClick={() => { const script = getActiveSceneScript(); if (script?.trim()) handleImageGenerate(script); }} disabled={!shots?.length}
                                                  className="text-[10px] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-2 py-2 rounded-lg border border-emerald-500 flex items-center justify-center gap-1 font-bold uppercase tracking-wider shadow-sm transition-all">
                                                  <Icon name="Image" size={11}/><span>Image</span>
                                              </button>
                                          </div>
                                          {shots.length > 0 && (() => {
                                              const totalSecs = shots.reduce((acc, s) => acc + (parseFloat(s.selections?.duration) || 5), 0);
                                              const COSTS = {
                                                  'Runway':   { unit: 'credits', rate: 0.05, label: 'Runway' },
                                                  'Veo 3':    { unit: 'credits', rate: 0.08, label: 'Veo 3' },
                                                  'KLING AI': { unit: 'credits', rate: 0.04, label: 'KLING' },
                                                  'Seedance': { unit: 'credits', rate: 0.03, label: 'Seedance' },
                                                  'Standard': { unit: 'credits', rate: 0.04, label: 'Standard' }
                                              };
                                              const c = COSTS[videoPlatform] || COSTS['Standard'];
                                              const est = (totalSecs * c.rate).toFixed(2);
                                              return (
                                                  <div className="flex items-center gap-2 mb-2 px-1 shrink-0">
                                                      <Icon name="Zap" size={11} className="text-amber-500 shrink-0" />
                                                      <span className="text-[9px] text-textMuted-light dark:text-textMuted-dark font-mono">
                                                          {shots.length} shots · ~{totalSecs.toFixed(1)}s total ·
                                                          <span className="text-amber-500 font-bold ml-1">~{est} {c.unit} on {c.label}</span>
                                                      </span>
                                                  </div>
                                              );
                                          })()}

                                          <div className="flex-1 relative min-h-[200px] mb-3">
                                              {isEditingTransitions ? (
                                                  <div className="absolute inset-0 bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-xl p-3 overflow-y-auto custom-scrollbar shadow-inner">
                                                      {shots.map((s, i) => (
                                                          <div key={i} className="flex flex-col">
                                                              <div className="bg-panel-light dark:bg-panel-dark p-3.5 rounded-xl border border-border-light dark:border-border-dark text-xs text-textMain-light dark:text-textMain-dark leading-relaxed shadow-sm">
                                                                  <div className="flex items-center justify-between mb-1.5 border-b border-border-light dark:border-border-dark pb-1">
                                                                      <span className="font-bold text-primary">Shot {i + 1}</span>
                                                                      <button
                                                                          onClick={() => handleVideoPreview(getFinalPromptText(s))}
                                                                          title="Generate video for this shot"
                                                                          className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-lg bg-purple-600/20 border border-purple-500/40 text-purple-400 hover:bg-purple-600/30 transition-all"
                                                                      >
                                                                          <Icon name="Play" size={10}/>⚡ Preview
                                                                      </button>
                                                                  </div>
                                                                  <ScriptHighlighter text={getFinalPromptText(s)} className="font-mono" />
                                                              </div>
                                                              {i < shots.length - 1 && (
                                                                  <div className="flex justify-center my-3">
                                                                      <div className="flex items-center space-x-2 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-500/50 shadow-sm hover:border-indigo-400 transition-colors">
                                                                          <Icon name="Move" size={12} className="text-indigo-600 dark:text-indigo-400" />
                                                                          <select value={s.selections.transition || "None"} onChange={(e) => handleTransitionChange(i, e.target.value)} className="bg-transparent text-[10px] font-bold text-indigo-700 dark:text-indigo-300 outline-none cursor-pointer uppercase">
                                                                              <option value="None">-- Add Transition --</option>
                                                                              {OPTIONS.transitions.filter(t => t !== 'None').map(t => <option key={t} value={t}>{t}</option>)}
                                                                          </select>
                                                                      </div>
                                                                  </div>
                                                              )}
                                                          </div>
                                                      ))}
                                                      {shots.length === 0 && <div className="text-xs text-textMuted-light dark:text-textMuted-dark text-center mt-6">No shots available.</div>}
                                                  </div>
                                              ) : (
                                                  <ScriptHighlighter text={getActiveSceneScript()} className="absolute inset-0 w-full h-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-xl p-4 leading-relaxed overflow-y-auto font-mono text-xs shadow-inner custom-scrollbar" />
                                              )}
                                          </div>
                                          
                                          <div className="flex items-center space-x-3 shrink-0">
                                              <button onClick={copyToClipboard} className="flex-1 bg-input-light dark:bg-input-dark hover:bg-base-light dark:hover:bg-border-dark text-textMain-light dark:text-textMain-dark py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center space-x-1.5 active:scale-[0.98] shadow-md border border-border-light dark:border-border-dark">
                                                  <Icon name={copied ? "Check" : "Copy"} size={16} /><span>{copied ? 'Copied!' : t('copyScene')}</span>
                                              </button>
                                              {activeProject?.storyId && (
                                                  <button onClick={() => { setIsRevising(true); setInitialStoryId(activeProject.storyId); setShowStoryEngineModal(true); }} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 border border-indigo-500/30 transition-all active:scale-[0.98] shadow-md whitespace-nowrap">
                                                      <Icon name="Edit" size={15} /><span>Revise Story</span>
                                                  </button>
                                              )}
                                              <button onClick={handleClearSequence} className="px-4 py-2.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-lg transition-all active:scale-[0.98]" title={t('clearScene')}><Icon name="Trash2" size={16} /></button>
                                          </div>
                                      </div>
                                  )}
                              </div>
                          </div>
                      </div>
                      )}

                    </div>
                  </div>
               )}

               {/* ALL MODALS */}
               {showGlobalVoiceModal && (
                   <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-base-light/80 dark:bg-base-dark/80 backdrop-blur-sm">
                       <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-indigo-500/50 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
                           <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between bg-input-light dark:bg-input-dark/50">
                               <h2 className="text-xl font-bold text-textMain-light dark:text-textMain-dark flex items-center space-x-2">
                                   <Icon name="Mic" size={24} className="text-indigo-500 dark:text-indigo-400" />
                                   <span>{t('voiceLib')}</span>
                               </h2>
                               <button onClick={() => setShowGlobalVoiceModal(false)} className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark"><Icon name="X" size={24} /></button>
                           </div>
                           <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
                               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-input-light dark:bg-input-dark p-4 rounded-xl border border-border-light dark:border-border-dark items-end">
                                   <div className="col-span-1">
                                       <label className="text-xs text-textMuted-light dark:text-textMuted-dark mb-1 block font-bold uppercase tracking-wider">Voice Name</label>
                                       <input value={newVoiceData.name} onChange={e => setNewVoiceData({...newVoiceData, name: e.target.value})} placeholder="e.g., AI Overlord" className="w-full bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-lg p-2 text-sm focus:border-indigo-500 outline-none shadow-sm" />
                                   </div>
                                   <div className="col-span-1 md:col-span-3">
                                       <label className="text-xs text-textMuted-light dark:text-textMuted-dark mb-1 block font-bold uppercase tracking-wider">{t('description')}</label>
                                       <input value={newVoiceData.description} onChange={e => setNewVoiceData({...newVoiceData, description: e.target.value})} placeholder="e.g., Deep, resonant, echoing voice" className="w-full bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-lg p-2 text-sm focus:border-indigo-500 outline-none shadow-sm" />
                                   </div>
                                   <div className="col-span-1">
                                       <label className="text-xs text-textMuted-light dark:text-textMuted-dark mb-1 block font-bold uppercase tracking-wider">FX (e.g., Echo)</label>
                                       <input value={newVoiceData.fx} onChange={e => setNewVoiceData({...newVoiceData, fx: e.target.value})} placeholder="e.g., Reverb" className="w-full bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-lg p-2 text-sm focus:border-indigo-500 outline-none shadow-sm" />
                                   </div>
                                   <div className="col-span-1">
                                       <label className="text-xs text-textMuted-light dark:text-textMuted-dark mb-1 block font-bold uppercase tracking-wider">Age</label>
                                       <input value={newVoiceData.age} onChange={e => setNewVoiceData({...newVoiceData, age: e.target.value})} placeholder="e.g., Elderly" className="w-full bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-lg p-2 text-sm focus:border-indigo-500 outline-none shadow-sm" />
                                   </div>
                                   <div className="col-span-1">
                                       <label className="text-xs text-textMuted-light dark:text-textMuted-dark mb-1 block font-bold uppercase tracking-wider">Tone / Genre</label>
                                       <input value={newVoiceData.genre} onChange={e => setNewVoiceData({...newVoiceData, genre: e.target.value})} placeholder="e.g., Masculine/Gravelly" className="w-full bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-lg p-2 text-sm focus:border-indigo-500 outline-none shadow-sm" />
                                   </div>
                                   <div className="col-span-1">
                                       <label className="text-xs text-textMuted-light dark:text-textMuted-dark mb-1 block font-bold uppercase tracking-wider">Accent / Lang</label>
                                       <input value={newVoiceData.accent} onChange={e => setNewVoiceData({...newVoiceData, accent: e.target.value})} placeholder="e.g., British English" className="w-full bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-lg p-2 text-sm focus:border-indigo-500 outline-none shadow-sm" onKeyDown={e => { if(e.key === 'Enter') addGlobalVoice(); }}/>
                                   </div>
                                   <div className="col-span-1 sm:col-span-2 md:col-span-4 flex justify-end mt-2">
                                       <button onClick={addGlobalVoice} disabled={!newVoiceData.name.trim()} className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-600/20 dark:text-indigo-400 dark:hover:bg-indigo-600/30 text-indigo-600 px-6 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-200 dark:border-transparent shadow-sm">{t('addVoiceStyle')}</button>
                                   </div>
                               </div>

                               <div className="space-y-3">
                                   {globalVoiceStyles.length === 0 ? (
                                       <p className="text-sm text-textMuted-light dark:text-textMuted-dark italic text-center py-8">Your Voice Library is empty. Add custom voice styles above.</p>
                                   ) : (
                                       globalVoiceStyles.map(v => (
                                           <div key={v.id} className="flex flex-col gap-2 bg-input-light dark:bg-input-dark p-4 rounded-xl border border-border-light dark:border-border-dark relative group shadow-sm">
                                               <div className="flex justify-between items-center mb-1">
                                                    <input value={v.name} onChange={e => updateGlobalVoice(v.id, 'name', e.target.value)} className="bg-transparent border-b border-transparent hover:border-border-light dark:hover:border-border-dark focus:border-indigo-500 text-indigo-600 dark:text-indigo-400 p-1 text-sm font-bold outline-none flex-1" placeholder="Voice Name"/>
                                                    <button onClick={() => removeGlobalVoice(v.id)} className="text-textMuted-light hover:text-red-500 dark:text-textMuted-dark dark:hover:text-red-400 p-1 rounded-md transition-colors opacity-0 group-hover:opacity-100"><Icon name="Trash2" size={16} /></button>
                                               </div>
                                               <input value={v.description} onChange={e => updateGlobalVoice(v.id, 'description', e.target.value)} className="w-full bg-transparent border-b border-transparent hover:border-border-light dark:hover:border-border-dark focus:border-indigo-500 text-textMain-light dark:text-textMain-dark p-1 text-sm outline-none" placeholder="Description"/>
                                               <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2 pt-2 border-t border-border-light dark:border-border-dark/50">
                                                    <input value={v.fx} onChange={e => updateGlobalVoice(v.id, 'fx', e.target.value)} className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark focus:border-indigo-500 text-textMuted-light dark:text-textMuted-dark rounded-md p-1.5 text-xs outline-none shadow-sm" placeholder="FX (e.g., Radio)"/>
                                                    <input value={v.age} onChange={e => updateGlobalVoice(v.id, 'age', e.target.value)} className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark focus:border-indigo-500 text-textMuted-light dark:text-textMuted-dark rounded-md p-1.5 text-xs outline-none shadow-sm" placeholder="Age"/>
                                                    <input value={v.genre} onChange={e => updateGlobalVoice(v.id, 'genre', e.target.value)} className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark focus:border-indigo-500 text-textMuted-light dark:text-textMuted-dark rounded-md p-1.5 text-xs outline-none shadow-sm" placeholder="Tone / Genre"/>
                                                    <input value={v.accent} onChange={e => updateGlobalVoice(v.id, 'accent', e.target.value)} className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark focus:border-indigo-500 text-textMuted-light dark:text-textMuted-dark rounded-md p-1.5 text-xs outline-none shadow-sm" placeholder="Accent/Lang"/>
                                               </div>
                                           </div>
                                       ))
                                   )}
                               </div>
                           </div>
                           <div className="p-4 border-t border-border-light dark:border-border-dark bg-input-light dark:bg-input-dark/50 flex justify-end space-x-3">
                               <button onClick={() => setShowGlobalVoiceModal(false)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-[0.98]">{t('done')}</button>
                           </div>
                       </div>
                   </div>
               )}

               {showGlobalCharModal && (
                   <div className="fixed inset-0 z-[60] flex justify-end bg-base-light/80 dark:bg-base-dark/80 backdrop-blur-sm">
                       <div className="bg-panel-light dark:bg-panel-dark border-l border-border-light dark:border-accent/50 shadow-2xl w-full sm:w-[450px] h-full flex flex-col overflow-hidden animate-slide-in-right">
                           <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between bg-input-light dark:bg-input-dark/50 shrink-0">
                               <h2 className="text-xl font-bold text-textMain-light dark:text-textMain-dark flex items-center space-x-2">
                                   <Icon name="Users" size={24} className="text-accent" />
                                   <span>{t('charLibrary')}</span>
                               </h2>
                               <button onClick={() => setShowGlobalCharModal(false)} className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark"><Icon name="X" size={24} /></button>
                           </div>
                           <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
                               <div className="flex flex-col gap-4 bg-input-light dark:bg-input-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
                                   <div>
                                       <label className="text-xs text-textMuted-light dark:text-textMuted-dark mb-1 block font-bold uppercase tracking-wider">Character Name</label>
                                       <input value={newCharData.name} onChange={e => setNewCharData({...newCharData, name: e.target.value})} placeholder="e.g., Jean" className="w-full bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-lg p-2 text-sm focus:border-accent outline-none shadow-sm" />
                                   </div>
                                   <div>
                                       <label className="text-xs text-textMuted-light dark:text-textMuted-dark mb-1 block font-bold uppercase tracking-wider">Role</label>
                                       <input value={newCharData.role} onChange={e => setNewCharData({...newCharData, role: e.target.value})} placeholder="e.g., Hacker" className="w-full bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-lg p-2 text-sm focus:border-accent outline-none shadow-sm" />
                                   </div>
                                   <div>
                                       <label className="text-xs text-textMuted-light dark:text-textMuted-dark mb-1 block font-bold uppercase tracking-wider">Appearance</label>
                                       <input value={newCharData.appearance} onChange={e => setNewCharData({...newCharData, appearance: e.target.value})} placeholder="e.g., short blue hair..." className="w-full bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-lg p-2 text-sm focus:border-accent outline-none shadow-sm" onKeyDown={e => { if(e.key === 'Enter') addGlobalCharacter(); }} />
                                   </div>
                                   <div className="pt-2">
                                       <button onClick={addGlobalCharacter} disabled={!newCharData.name.trim()} className="w-full bg-accent/10 dark:bg-accent/20 text-accent hover:bg-accent/20 dark:hover:bg-accent/30 px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-accent/30 dark:border-transparent shadow-sm">{t('addCharacter')}</button>
                                   </div>
                               </div>

                               <div className="space-y-3">
                                   {globalCharacters.length === 0 ? (
                                       <p className="text-sm text-textMuted-light dark:text-textMuted-dark italic text-center py-8">Your library is empty. Add characters above to use them across all your projects.</p>
                                   ) : (
                                       globalCharacters.map(char => (
                                           <div key={char.id} className="flex flex-col gap-2 bg-input-light dark:bg-input-dark p-3 rounded-xl border border-border-light dark:border-border-dark shadow-sm group relative">
                                               <div className="flex items-center justify-between">
                                                   <input value={char.name} onChange={e => updateGlobalCharacter(char.id, 'name', e.target.value)} className="w-1/2 bg-transparent border-b border-transparent hover:border-border-light dark:hover:border-border-dark focus:border-accent text-textMain-light dark:text-textMain-dark p-1 text-sm font-bold outline-none" placeholder="Name"/>
                                                   <input value={char.role} onChange={e => updateGlobalCharacter(char.id, 'role', e.target.value)} className="w-1/2 bg-transparent border-b border-transparent hover:border-border-light dark:hover:border-border-dark focus:border-accent text-textMuted-light dark:text-textMuted-dark p-1 text-sm outline-none ml-2" placeholder="Role"/>
                                               </div>
                                               <input value={char.appearance} onChange={e => updateGlobalCharacter(char.id, 'appearance', e.target.value)} className="w-full bg-transparent border-b border-transparent hover:border-border-light dark:hover:border-border-dark focus:border-accent text-textMuted-light dark:text-textMuted-dark p-1 text-sm outline-none" placeholder="Appearance descriptors"/>
                                               <button onClick={() => removeGlobalCharacter(char.id)} className="absolute top-2 right-2 text-textMuted-light hover:text-red-500 dark:text-textMuted-dark dark:hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-panel-light dark:bg-panel-dark rounded"><Icon name="Trash2" size={14} /></button>
                                           </div>
                                       ))
                                   )}
                               </div>
                           </div>
                           <div className="p-4 border-t border-border-light dark:border-border-dark bg-input-light dark:bg-input-dark/50 flex justify-end space-x-3 shrink-0">
                               <button onClick={() => setShowGlobalCharModal(false)} className="bg-accent hover:bg-accentHover text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-[0.98] w-full">{t('done')}</button>
                           </div>
                       </div>
                   </div>
               )}

               {showGlobalLocModal && (
                   <div className="fixed inset-0 z-[60] flex justify-end bg-base-light/80 dark:bg-base-dark/80 backdrop-blur-sm">
                       <div className="bg-panel-light dark:bg-panel-dark border-l border-border-light dark:border-amber-500/50 shadow-2xl w-full sm:w-[450px] h-full flex flex-col overflow-hidden animate-slide-in-right">
                           <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between bg-input-light dark:bg-input-dark/50 shrink-0">
                               <h2 className="text-xl font-bold text-textMain-light dark:text-textMain-dark flex items-center space-x-2">
                                   <Icon name="MapPin" size={24} className="text-amber-500 dark:text-amber-400" />
                                   <span>{t('locLibrary')}</span>
                               </h2>
                               <button onClick={() => setShowGlobalLocModal(false)} className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark"><Icon name="X" size={24} /></button>
                           </div>
                           <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
                               <div className="flex flex-col gap-4 bg-input-light dark:bg-input-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
                                   <div>
                                       <label className="text-xs text-textMuted-light dark:text-textMuted-dark mb-1 block font-bold uppercase tracking-wider">Location Name</label>
                                       <input value={newLocData.name} onChange={e => setNewLocData({...newLocData, name: e.target.value})} placeholder="e.g., Space Station" className="w-full bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-lg p-2 text-sm focus:border-amber-500 outline-none shadow-sm" />
                                   </div>
                                   <div>
                                       <label className="text-xs text-textMuted-light dark:text-textMuted-dark mb-1 block font-bold uppercase tracking-wider">{t('description')}</label>
                                       <input value={newLocData.description} onChange={e => setNewLocData({...newLocData, description: e.target.value})} placeholder="e.g., Metallic corridors..." className="w-full bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-lg p-2 text-sm focus:border-amber-500 outline-none shadow-sm" onKeyDown={e => { if(e.key === 'Enter') addGlobalLocation(); }} />
                                   </div>
                                   <div className="pt-2">
                                       <button onClick={addGlobalLocation} disabled={!newLocData.name.trim()} className="w-full bg-amber-50 dark:bg-amber-600/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-600/30 px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-amber-200 dark:border-transparent shadow-sm">{t('addLocation')}</button>
                                   </div>
                               </div>

                               <div className="space-y-3">
                                   {globalLocations.length === 0 ? (
                                       <p className="text-sm text-textMuted-light dark:text-textMuted-dark italic text-center py-8">Your library is empty. Add locations above.</p>
                                   ) : (
                                       globalLocations.map(loc => (
                                           <div key={loc.id} className="flex flex-col gap-2 bg-input-light dark:bg-input-dark p-3 rounded-xl border border-border-light dark:border-border-dark shadow-sm group relative">
                                               <input value={loc.name} onChange={e => updateGlobalLocation(loc.id, 'name', e.target.value)} className="w-3/4 bg-transparent border-b border-transparent hover:border-border-light dark:hover:border-border-dark focus:border-amber-500 text-textMain-light dark:text-textMain-dark p-1 text-sm font-bold outline-none" placeholder="Name"/>
                                               <input value={loc.description} onChange={e => updateGlobalLocation(loc.id, 'description', e.target.value)} className="w-full bg-transparent border-b border-transparent hover:border-border-light dark:hover:border-border-dark focus:border-amber-500 text-textMuted-light dark:text-textMuted-dark p-1 text-sm outline-none" placeholder="Detailed description"/>
                                               <button onClick={() => removeGlobalLocation(loc.id)} className="absolute top-2 right-2 text-textMuted-light hover:text-red-500 dark:text-textMuted-dark dark:hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-panel-light dark:bg-panel-dark rounded"><Icon name="Trash2" size={14} /></button>
                                           </div>
                                       ))
                                   )}
                               </div>
                           </div>
                           <div className="p-4 border-t border-border-light dark:border-border-dark bg-input-light dark:bg-input-dark/50 flex justify-end space-x-3 shrink-0">
                               <button onClick={() => setShowGlobalLocModal(false)} className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-[0.98] w-full">{t('done')}</button>
                           </div>
                       </div>
                   </div>
               )}
               
               {showPromptLibraryModal && (
                   <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-base-light/80 dark:bg-base-dark/80 backdrop-blur-sm">
                       <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-green-500/50 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-slide-up">
                           <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between bg-input-light dark:bg-input-dark/50 shrink-0">
                               <h2 className="text-xl font-bold text-textMain-light dark:text-textMain-dark flex items-center space-x-2">
                                   <Icon name="Database" size={24} className="text-green-500" />
                                   <span>Prompt Library <span className="text-xs font-normal text-textMuted-light dark:text-textMuted-dark ml-2">({[...PROMPT_LIBRARY_DATA, ...customPromptLibrary].length} Prompts)</span></span>
                               </h2>
                               <div className="flex items-center space-x-3">
                                   <div className="flex bg-panel-light dark:bg-panel-dark rounded-lg border border-border-light dark:border-border-dark overflow-hidden shadow-sm">
                                       <button onClick={() => setPromptLibraryTab('library')} className={`px-4 py-1.5 text-xs font-bold transition-colors ${promptLibraryTab === 'library' ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light'}`}>Browse</button>
                                       <button onClick={() => setPromptLibraryTab('add')} className={`px-4 py-1.5 text-xs font-bold transition-colors ${promptLibraryTab === 'add' ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light'}`}>Add Custom</button>
                                   </div>
                                   <button onClick={() => setShowPromptLibraryModal(false)} className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark"><Icon name="X" size={24} /></button>
                               </div>
                           </div>
                           
                           <div className="flex-1 flex overflow-hidden">
                               {/* Categories Sidebar */}
                               <div className="w-48 sm:w-56 bg-input-light dark:bg-input-dark/30 border-r border-border-light dark:border-border-dark flex flex-col p-4 overflow-y-auto custom-scrollbar shrink-0">
                                   <span className="text-[10px] font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-wider mb-3 px-2">Categories</span>
                                   {LIBRARY_CATEGORIES.map(cat => (
                                       <button key={cat} onClick={() => {setPromptLibraryCategory(cat); setPromptLibraryTab('library');}} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1 ${promptLibraryCategory === cat ? 'bg-green-500/10 text-green-600 dark:text-green-400 font-bold border border-green-500/30' : 'text-textMain-light dark:text-textMain-dark hover:bg-input-light dark:hover:bg-border-dark border border-transparent'}`}>
                                           {cat} {cat === 'Custom' && <span className="float-right text-[10px] bg-panel-light dark:bg-panel-dark px-1.5 rounded">{customPromptLibrary.length}</span>}
                                       </button>
                                   ))}
                               </div>
                               
                               {/* Main Content Area */}
                               <div className="flex-1 p-6 flex flex-col overflow-hidden bg-base-light/50 dark:bg-base-dark/50">
                                   {promptLibraryTab === 'add' ? (
                                       <div className="max-w-2xl mx-auto w-full bg-panel-light dark:bg-panel-dark p-6 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
                                           <h3 className="text-lg font-bold text-green-500 mb-4 flex items-center"><Icon name="Plus" size={18} className="mr-2" /> Create Custom Prompt</h3>
                                           <div className="flex flex-col space-y-4">
                                               <div>
                                                   <label className="text-xs text-textMuted-light dark:text-textMuted-dark mb-1 block font-bold uppercase tracking-wider">Prompt Title</label>
                                                   <input value={newCustomPrompt.title} onChange={e => setNewCustomPrompt({...newCustomPrompt, title: e.target.value})} placeholder="e.g., My Signature Cinematic Pan" className="w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-lg p-2.5 text-sm focus:border-green-500 outline-none shadow-sm" />
                                               </div>
                                               <div>
                                                   <label className="text-xs text-textMuted-light dark:text-textMuted-dark mb-1 block font-bold uppercase tracking-wider">Category</label>
                                                   <select value={newCustomPrompt.category} onChange={e => setNewCustomPrompt({...newCustomPrompt, category: e.target.value})} className="w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-lg p-2.5 text-sm focus:border-green-500 outline-none shadow-sm">
                                                       {LIBRARY_CATEGORIES.filter(c => c !== "All" && c !== "Custom").map(c => <option key={c} value={c}>{c}</option>)}
                                                   </select>
                                               </div>
                                               <div>
                                                   <label className="text-xs text-textMuted-light dark:text-textMuted-dark mb-1 block font-bold uppercase tracking-wider">High-Level Prompt Text</label>
                                                   <textarea value={newCustomPrompt.text} onChange={e => setNewCustomPrompt({...newCustomPrompt, text: e.target.value})} placeholder="Describe the scene highly detailed..." className="w-full h-32 resize-none bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-lg p-2.5 text-sm focus:border-green-500 outline-none shadow-sm custom-scrollbar" />
                                               </div>
                                               <button onClick={handleSaveCustomPrompt} disabled={!newCustomPrompt.title.trim() || !newCustomPrompt.text.trim()} className="mt-4 bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md disabled:opacity-50">Save to Library</button>
                                           </div>
                                       </div>
                                   ) : (
                                       <>
                                           <div className="flex flex-col md:flex-row items-center gap-4 mb-6 shrink-0">
                                               <div className="flex-1 flex items-center bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded-xl px-4 py-2.5 shadow-sm w-full">
                                                   <Icon name="Search" size={16} className="text-textMuted-light dark:text-textMuted-dark mr-3" />
                                                   <input value={promptLibrarySearch} onChange={e => setPromptLibrarySearch(e.target.value)} placeholder="Search ready-made prompts..." className="bg-transparent border-none outline-none text-sm text-textMain-light dark:text-textMain-dark w-full" />
                                               </div>
                                               <div className="flex items-center bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded-xl px-3 py-2.5 shadow-sm shrink-0 w-full md:w-auto">
                                                   <Icon name="Sparkles" size={16} className="text-amber-500 mr-2" />
                                                   <select value={promptLibraryModel} onChange={e => setPromptLibraryModel(e.target.value)} className="bg-transparent border-none outline-none text-sm font-bold text-textMain-light dark:text-textMain-dark cursor-pointer w-full pr-2">
                                                       <option value="All">All AI Models</option>
                                                       <option value="Runway">Runway</option>
                                                       <option value="KLING">KLING</option>
                                                       <option value="Veo 3">Veo 3</option>
                                                       <option value="Seedance">Seedance</option>
                                                   </select>
                                               </div>
                                           </div>
                                           <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar pb-6 pr-2">
                                               {[...PROMPT_LIBRARY_DATA, ...customPromptLibrary]
                                                   .filter(p => (promptLibraryCategory === "All" || (promptLibraryCategory === "Custom" && p.isCustom) || p.cat === promptLibraryCategory) && (promptLibraryModel === "All" || Object.keys(p.prec).includes(promptLibraryModel)) && (p.title.toLowerCase().includes(promptLibrarySearch.toLowerCase()) || p.text.toLowerCase().includes(promptLibrarySearch.toLowerCase())))
                                                   .map((p, idx) => (
                                                       <div key={p.id || idx} className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-xl p-4 flex flex-col shadow-sm hover:border-green-500/50 transition-colors group relative">
                                                           <div className="flex justify-between items-start mb-2">
                                                               <h4 className="font-bold text-sm text-primary group-hover:text-green-500 transition-colors pr-6">{p.title}</h4>
                                                               {p.isCustom ? (
                                                                   <span className="text-[9px] bg-indigo-500/10 text-indigo-500 border border-indigo-500/30 px-1.5 py-0.5 rounded font-bold uppercase">Custom</span>
                                                               ) : (
                                                                   <span className="text-[9px] bg-input-light dark:bg-input-dark text-textMuted-light dark:text-textMuted-dark border border-border-light dark:border-border-dark px-1.5 py-0.5 rounded font-bold uppercase">{p.cat}</span>
                                                               )}
                                                           </div>
                                                           <p className="text-xs text-textMain-light dark:text-textMain-dark leading-relaxed mb-4 flex-1 font-mono bg-input-light dark:bg-input-dark/50 p-2 rounded border border-border-light dark:border-border-dark/50">{p.text}</p>
                                                           <div className="flex flex-col gap-3 mt-auto">
                                                               <div className="flex items-center gap-1.5 flex-wrap">
                                                                   {Object.entries(p.prec).map(([model, prec]) => (
                                                                       <div key={model} className="flex items-center text-[9px] font-bold border border-border-light dark:border-border-dark rounded overflow-hidden shadow-sm">
                                                                           <span className="bg-input-light dark:bg-input-dark text-textMain-light dark:text-textMain-dark px-1.5 py-0.5">{model}</span>
                                                                           <span className={`px-1.5 py-0.5 ${prec === 'High' ? 'bg-green-500/20 text-green-600 dark:text-green-400' : prec === 'Med' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'}`}>{prec}</span>
                                                                       </div>
                                                                   ))}
                                                               </div>
                                                               {(() => {
                                                                   const activeModelNames = [aiModel, videoPlatform, aiModel.replace(' AI', '')];
                                                                   let precLevel = null;
                                                                   for (let m of activeModelNames) { if (p.prec[m]) { precLevel = p.prec[m]; break; } }
                                                                   if (!precLevel) precLevel = p.prec['Any'];
                                                                   
                                                                   const btnColor = precLevel === 'High' ? 'bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30' : 
                                                                                    precLevel === 'Med' ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30' : 
                                                                                    precLevel === 'Low' ? 'bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30' : 
                                                                                    'bg-primary/10 hover:bg-primary/20 text-primary border-primary/30';
                                                                                    
                                                                   return (
                                                                       <button onClick={() => handleUseLibraryPrompt(p.text)} className={`w-full border py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center ${btnColor}`}>
                                                                           <Icon name="Check" size={14} className="mr-1.5" /> Use Prompt {precLevel ? `(${precLevel})` : ''}
                                                                       </button>
                                                                   );
                                                               })()}
                                                           </div>
                                                           {p.isCustom && <button onClick={() => deleteCustomLibraryPrompt(p.id)} className="absolute top-3 right-3 text-textMuted-light hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-panel-light dark:bg-panel-dark rounded shadow-sm"><Icon name="Trash2" size={12} /></button>}
                                                       </div>
                                                   ))}
                                           </div>
                                       </>
                                   )}
                               </div>
                           </div>
                       </div>
                   </div>
               )}

               {showMovieModal && (
                   <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-base-light/80 dark:bg-base-dark/80 backdrop-blur-sm">
                       <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-indigo-500/50 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
                           <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between bg-input-light dark:bg-input-dark/50">
                               <h2 className="text-xl font-bold text-textMain-light dark:text-textMain-dark flex items-center space-x-2">
                                   <Icon name="Film" size={24} className="text-indigo-500 dark:text-indigo-400" /><span>{t('compileMovie')}</span>
                               </h2>
                               <button onClick={() => setShowMovieModal(false)} className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark transition-colors"><Icon name="X" size={24} /></button>
                           </div>
                           <div className="flex-1 p-6 overflow-hidden flex flex-col">
                               <ScriptHighlighter text={generateMovieScript()} className="w-full flex-1 bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-xl p-4 leading-relaxed overflow-y-auto font-mono text-sm shadow-inner custom-scrollbar" />
                           </div>
                           <div className="p-4 border-t border-border-light dark:border-border-dark bg-input-light dark:bg-input-dark/50 flex justify-end space-x-3">
                               <button onClick={() => setShowMovieModal(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-textMuted-light dark:text-textMuted-dark hover:bg-base-light dark:hover:bg-border-dark transition-all border border-border-light dark:border-border-dark shadow-sm">{t('close')}</button>
                               <button onClick={copyMovieToClipboard} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center space-x-2 shadow-md">
                                   <Icon name={movieCopied ? "Check" : "Copy"} size={16} /><span>{movieCopied ? 'Copied!' : t('compileMovie')}</span>
                               </button>
                           </div>
                       </div>
                   </div>
               )}

               {showGlossaryModal && (
                   <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-base-light/80 dark:bg-base-dark/80 backdrop-blur-sm">
                       <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                           <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between bg-input-light dark:bg-input-dark/50">
                               <h2 className="text-xl font-bold text-textMain-light dark:text-textMain-dark flex items-center space-x-2">
                                   <Icon name="BookOpen" size={24} className="text-indigo-500 dark:text-indigo-400" />
                                   <span>{t('glossary')}</span>
                               </h2>
                               <button onClick={() => setShowGlossaryModal(false)} className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark transition-colors"><Icon name="X" size={24} /></button>
                           </div>
                           <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-8">
                               {Object.entries(GLOSSARY_DATA).map(([category, terms]) => (
                                   <div key={category}>
                                       <h3 className="text-lg font-bold text-cyan-600 dark:text-cyan-400 mb-4 border-b border-border-light dark:border-border-dark pb-2">{category}</h3>
                                       <div className="space-y-4">
                                           {terms.map((t, idx) => (
                                               <div key={idx} className="bg-input-light dark:bg-input-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
                                                   <h4 className="font-bold text-textMain-light dark:text-textMain-dark mb-1">{t.term}</h4>
                                                   <p className="text-sm text-textMuted-light dark:text-textMuted-dark leading-relaxed">{t.def}</p>
                                               </div>
                                           ))}
                                       </div>
                                   </div>
                               ))}
                           </div>
                           <div className="p-4 border-t border-border-light dark:border-border-dark bg-input-light dark:bg-input-dark/50 flex justify-end space-x-3">
                               <button onClick={() => setShowGlossaryModal(false)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-[0.98]">
                                   {t('close')}
                               </button>
                           </div>
                       </div>
                   </div>
               )}

               {showMyStyleModal && (
                   <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-base-light/80 dark:bg-base-dark/80 backdrop-blur-sm">
                       <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-accent/50 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                           <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between bg-input-light dark:bg-input-dark/50">
                               <h2 className="text-xl font-bold text-textMain-light dark:text-textMain-dark flex items-center space-x-2">
                                   <Icon name="Brain" size={24} className="text-accent" />
                                   <span>{t('trainStyle')} (Local AI)</span>
                               </h2>
                               <button onClick={() => setShowMyStyleModal(false)} className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark transition-colors"><Icon name="X" size={24} /></button>
                           </div>
                           <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
                               
                               <div className="bg-input-light dark:bg-input-dark p-5 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
                                   <div className="flex justify-between items-center mb-4">
                                       <label className="text-sm font-bold text-accent uppercase tracking-wider">My Style Presets</label>
                                       <button onClick={handleSaveMyStyleAsPreset} className="text-xs bg-accent/10 dark:bg-accent/20 text-accent hover:bg-accent/20 dark:hover:bg-accent/30 px-3 py-1.5 rounded-lg font-bold transition-colors shadow-sm">
                                           <Icon name="Save" size={14} className="inline mr-1" /> {t('savePreset')}
                                       </button>
                                   </div>
                                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-40 overflow-y-auto custom-scrollbar">
                                       {myStylePresets.map(preset => (
                                           <div key={preset.id} className="relative group flex items-center bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-lg p-2 hover:border-accent/50 dark:hover:border-accent/50 transition-colors shadow-sm">
                                               <button onClick={() => loadMyStylePreset(preset)} className="flex-1 text-left text-xs font-bold text-textMuted-light dark:text-textMuted-dark group-hover:text-accent truncate pr-2">
                                                   {preset.name}
                                               </button>
                                               <button onClick={() => deleteMyStylePreset(preset.id)} className="text-textMuted-light dark:text-textMuted-dark hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                   <Icon name="Trash2" size={14} />
                                               </button>
                                           </div>
                                       ))}
                                   </div>
                               </div>

                               <div className="bg-input-light dark:bg-input-dark p-5 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
                                   <label className="block text-sm font-bold text-accent mb-2 uppercase tracking-wider">1. Prompt Blueprint Template</label>
                                   <p className="text-xs text-textMuted-light dark:text-textMuted-dark mb-3 leading-relaxed">
                                       Define the exact structure of your prompts. The Local AI will strictly follow this layout when <span className="font-bold text-textMain-light dark:text-textMain-dark">MY STYLE</span> is selected. Use these tags to inject your parameters: 
                                       <br/><code className="text-cyan-600 dark:text-cyan-300 mt-2 block bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark p-2 rounded shadow-sm">{`{subject}, {shotType}, {shotStyle}, {camera}, {lens}, {angle}, {lighting}, {movement}, {actionSpeed}, {duration}, {transition}, {sfx}, {bgm}`}</code>
                                   </p>
                                   <textarea
                                       value={myStyle.template}
                                       onChange={(e) => setMyStyle(prev => ({ ...prev, template: e.target.value }))}
                                       className="w-full h-32 bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-lg p-3 font-mono text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all resize-none shadow-sm"
                                   />
                               </div>
                               
                               <div className="bg-input-light dark:bg-input-dark p-5 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
                                   <label className="block text-sm font-bold text-accent mb-2 uppercase tracking-wider">2. Global Modifiers (Appended text)</label>
                                   <p className="text-xs text-textMuted-light dark:text-textMuted-dark mb-3">These words will *always* be added to the end of your prompts, guaranteeing your signature aesthetic.</p>
                                   <input
                                       value={myStyle.customModifiers || ""}
                                       onChange={(e) => setMyStyle(prev => ({ ...prev, customModifiers: e.target.value }))}
                                       placeholder="e.g. 8k resolution, photorealistic, cinematic..."
                                       className="w-full bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-lg p-3 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all shadow-sm"
                                   />
                               </div>

                               <div className="bg-input-light dark:bg-input-dark p-5 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
                                   <label className="block text-sm font-bold text-accent mb-3 uppercase tracking-wider">3. Strict Default Parameters</label>
                                   <p className="text-xs text-textMuted-light dark:text-textMuted-dark mb-4">If you leave a field empty in the builder, the Local AI will automatically inject your strict defaults below.</p>
                                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                       {['shotStyle', 'camera', 'lens', 'angle', 'lighting'].map(key => (
                                           <div key={key} className="flex flex-col space-y-1">
                                               <label className="text-[10px] font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                                               <select
                                                   value={myStyle.strictDefaults[key] || ""}
                                                   onChange={(e) => setMyStyle(prev => ({ ...prev, strictDefaults: { ...prev.strictDefaults, [key]: e.target.value } }))}
                                                   className="w-full bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-lg p-2 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all shadow-sm"
                                               >
                                                   <option value="">-- No Strict Default --</option>
                                                   {OPTIONS[key + 's']?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                   {key === 'camera' && OPTIONS.cameraTypes.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                               </select>
                                           </div>
                                       ))}
                                   </div>
                               </div>
                           </div>
                           <div className="p-4 border-t border-border-light dark:border-border-dark bg-input-light dark:bg-input-dark/50 flex justify-end space-x-3">
                               <button onClick={() => setShowMyStyleModal(false)} className="bg-accent hover:bg-accentHover text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-[0.98]">
                                   {t('saveTraining')}
                               </button>
                           </div>
                       </div>
                   </div>
               )}
               {editingProjectDefaults && (
                   <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base-light/80 dark:bg-base-dark/80 backdrop-blur-sm">
                       <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                           <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between bg-input-light dark:bg-input-dark/50">
                               <h2 className="text-lg font-bold text-textMain-light dark:text-textMain-dark flex items-center space-x-2">
                                   <Icon name="Settings" size={20} className="text-cyan-600 dark:text-cyan-400" />
                                   <span>{t('workflowDefaults')}</span>
                               </h2>
                               <button onClick={() => setEditingProjectDefaults(null)} className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark"><Icon name="X" size={20} /></button>
                           </div>
                           <div className="p-6 overflow-y-auto custom-scrollbar grid grid-cols-1 sm:grid-cols-2 gap-4">
                               {['shotType', 'shotStyle', 'camera', 'lens', 'angle', 'lighting', 'movement', 'actionSpeed'].map(key => (
                                   <div key={key} className="flex flex-col space-y-1.5">
                                       <label className="text-xs font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                                       <select
                                           value={(projects.find(p => p.id === editingProjectDefaults)?.defaultParams || {})[key] || ""}
                                           onChange={(e) => {
                                               const proj = projects.find(p => p.id === editingProjectDefaults);
                                               updateProjectField(proj.id, 'defaultParams', { ...proj.defaultParams, [key]: e.target.value });
                                           }}
                                           className="w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-lg p-2 text-sm focus:ring-1 focus:ring-cyan-500 outline-none shadow-sm"
                                       >
                                           <option value="">-- No Default --</option>
                                           {getOptionsForKey(key).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                       </select>
                                   </div>
                               ))}
                               <p className="col-span-1 sm:col-span-2 text-xs text-textMuted-light dark:text-textMuted-dark mt-2 bg-input-light dark:bg-input-dark p-3 rounded-lg border border-border-light dark:border-border-dark shadow-sm">
                                 <Icon name="Lightbulb" size={14} className="inline mr-1 text-amber-500"/>
                                 These parameters will automatically be applied to any new shot created inside this project if you leave those specific fields empty while building the shot.
                               </p>
                           </div>
                           <div className="p-4 border-t border-border-light dark:border-border-dark bg-input-light dark:bg-input-dark/50 flex justify-end">
                               <button onClick={() => setEditingProjectDefaults(null)} className="bg-primary hover:bg-primaryHover text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-[0.98]">{t('done')}</button>
                           </div>
                       </div>
                   </div>
               )}

               {showBulkEditModal && (
                   <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base-light/80 dark:bg-base-dark/80 backdrop-blur-sm">
                       <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                           <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between bg-input-light dark:bg-input-dark/50">
                               <h2 className="text-lg font-bold text-textMain-light dark:text-textMain-dark flex items-center space-x-2">
                                   <Icon name="Edit" size={20} className="text-primary" />
                                   <span>Bulk Edit ({selectedShots.length} Shots)</span>
                               </h2>
                               <button onClick={() => { setShowBulkEditModal(false); setBulkSelections({}); }} className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark"><Icon name="X" size={20} /></button>
                           </div>
                           <div className="p-6 overflow-y-auto custom-scrollbar grid grid-cols-1 sm:grid-cols-2 gap-4">
                               {['shotType', 'shotStyle', 'camera', 'lens', 'angle', 'lighting', 'movement', 'actionSpeed', 'transition', 'filmStock'].map(key => (
                                   <div key={key} className="flex flex-col space-y-1.5">
                                       <label className="text-xs font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                                       <select
                                           value={bulkSelections[key] || ""}
                                           onChange={(e) => setBulkSelections({ ...bulkSelections, [key]: e.target.value })}
                                           className="w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-lg p-2 text-sm focus:ring-1 focus:ring-primary outline-none shadow-sm"
                                       >
                                           <option value="">-- Leave Unchanged --</option>
                                           <option value="CLEAR_VALUE">-- Clear Parameter --</option>
                                           {getOptionsForKey(key).map(opt => {
                                               const val = typeof opt === 'object' ? opt.name : opt;
                                               const title = typeof opt === 'object' ? opt.desc : undefined;
                                               return <option key={val} value={val} title={title}>{val}</option>;
                                           })}
                                       </select>
                                   </div>
                               ))}
                           </div>
                           <div className="p-4 border-t border-border-light dark:border-border-dark bg-input-light dark:bg-input-dark/50 flex justify-end space-x-3">
                               <button onClick={() => { setShowBulkEditModal(false); setBulkSelections({}); }} className="px-6 py-2.5 rounded-xl text-sm font-bold text-textMuted-light dark:text-textMuted-dark hover:bg-base-light dark:hover:bg-border-dark transition-all border border-border-light dark:border-border-dark shadow-sm">Cancel</button>
                               <button onClick={() => {
                                   updateActiveShots(prev => {
                                       const newShots = [...prev];
                                       selectedShots.forEach(idx => {
                                           if (newShots[idx]) {
                                               const updatedSelections = { ...newShots[idx].selections };
                                               Object.entries(bulkSelections).forEach(([k, v]) => {
                                                   if (v === "CLEAR_VALUE") updatedSelections[k] = "";
                                                   else if (v !== "") updatedSelections[k] = v;
                                               });
                                               newShots[idx] = { ...newShots[idx], selections: updatedSelections };
                                           }
                                       });
                                       return newShots;
                                   });
                                   setShowBulkEditModal(false);
                                   setSelectedShots([]);
                                   setBulkSelections({});
                               }} className="bg-primary hover:bg-primaryHover text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-[0.98]">Apply Bulk Edit</button>
                           </div>
                       </div>
                   </div>
               )}

               {showExportModal && (
                   <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base-light/80 dark:bg-base-dark/80 backdrop-blur-sm">
                       <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
                           <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between bg-input-light dark:bg-input-dark/50">
                               <h2 className="text-lg font-bold text-textMain-light dark:text-textMain-dark flex items-center space-x-2">
                                   <Icon name="FileDown" size={20} className="text-primary" />
                                   <span>Export PDF Storyboard</span>
                               </h2>
                               <button onClick={() => setShowExportModal(false)} className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark"><Icon name="X" size={20} /></button>
                           </div>
                           <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col space-y-4">
                               <div className="flex flex-col space-y-1.5">
                                   <label className="text-xs font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-wider">Document Title</label>
                                   <input value={pdfConfig.title} onChange={e => setPdfConfig({...pdfConfig, title: e.target.value})} className="w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-lg p-2 text-sm focus:ring-1 focus:ring-primary outline-none shadow-sm" />
                               </div>
                               <div className="flex flex-col space-y-1.5">
                                   <label className="text-xs font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-wider">Description</label>
                                   <textarea value={pdfConfig.description} onChange={e => setPdfConfig({...pdfConfig, description: e.target.value})} className="w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-lg p-2 text-sm focus:ring-1 focus:ring-primary outline-none shadow-sm resize-none h-20" />
                               </div>
                               <div className="flex flex-col space-y-1.5">
                                   <label className="text-xs font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-wider">Studio Logo (Optional)</label>
                                   <input type="file" accept="image/*" onChange={(e) => {
                                       const file = e.target.files[0];
                                       if (!file) return;
                                       const reader = new FileReader();
                                       reader.onload = (ev) => setPdfConfig(prev => ({...prev, studioLogo: ev.target.result}));
                                       reader.readAsDataURL(file);
                                   }} className="text-xs text-textMuted-light dark:text-textMuted-dark file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                                   {pdfConfig.studioLogo && <img src={pdfConfig.studioLogo} alt="Logo Preview" className="h-12 object-contain mt-2 border border-border-light dark:border-border-dark rounded p-1" />}
                               </div>
                               <div className="flex flex-col space-y-1.5 pt-2 border-t border-border-light dark:border-border-dark">
                                   <label className="text-xs font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-wider mb-2">Layout</label>
                                   <div className="flex space-x-2 mb-3 bg-input-light dark:bg-input-dark p-1 rounded-lg border border-border-light dark:border-border-dark">
                                       <label className={`flex-1 text-center py-1.5 rounded-md cursor-pointer transition-colors ${pdfConfig.layout === 'list' ? 'bg-primary text-white shadow-sm' : 'hover:bg-base-light dark:hover:bg-border-dark'}`}>
                                           <input type="radio" name="layout" value="list" checked={pdfConfig.layout === 'list'} onChange={() => setPdfConfig({...pdfConfig, layout: 'list'})} className="hidden" />
                                           <span className="text-sm font-medium">List</span>
                                       </label>
                                       <label className={`flex-1 text-center py-1.5 rounded-md cursor-pointer transition-colors ${pdfConfig.layout === 'grid' ? 'bg-primary text-white shadow-sm' : 'hover:bg-base-light dark:hover:bg-border-dark'}`}>
                                           <input type="radio" name="layout" value="grid" checked={pdfConfig.layout === 'grid'} onChange={() => setPdfConfig({...pdfConfig, layout: 'grid'})} className="hidden" />
                                           <span className="text-sm font-medium">Grid</span>
                                       </label>
                                   </div>
                                   <p className="text-[11px] text-textMuted-light dark:text-textMuted-dark p-2 bg-base-light dark:bg-base-dark rounded-md border border-border-light dark:border-border-dark">
                                       The high-detail PDF will always include prompts, parameters, and a glossary.
                                   </p>
                               </div>
                           </div>
                           <div className="p-4 border-t border-border-light dark:border-border-dark bg-input-light dark:bg-input-dark/50 flex justify-end space-x-3">
                               <button onClick={() => setShowExportModal(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-textMuted-light dark:text-textMuted-dark hover:bg-base-light dark:hover:bg-border-dark transition-all border border-border-light dark:border-border-dark shadow-sm">Cancel</button>
                               <button onClick={handleExportPDF} disabled={isExportingPDF} className="bg-primary hover:bg-primaryHover text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-[0.98] flex items-center disabled:opacity-50">
                                   {isExportingPDF ? <Icon name="Timer" size={16} className="animate-spin mr-2" /> : <Icon name="FileDown" size={16} className="mr-2" />}
                                   {isExportingPDF ? 'Generating...' : 'Generate PDF'}
                               </button>
                           </div>
                       </div>
                   </div>
               )}

               {showScriptParserModal && (
                   <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base-light/80 dark:bg-base-dark/80 backdrop-blur-sm">
                       <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden animate-slide-up">
                           <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between bg-input-light dark:bg-input-dark/50">
                               <h2 className="text-lg font-bold text-textMain-light dark:text-textMain-dark flex items-center space-x-2">
                                   <Icon name="FileText" size={20} className="text-indigo-500" />
                                   <span>Import Screenplay</span>
                               </h2>
                               <button onClick={() => setShowScriptParserModal(false)} className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark"><Icon name="X" size={20} /></button>
                           </div>
                           <div className="p-6 flex flex-col space-y-4">
                               <div className="flex flex-col space-y-2 bg-indigo-50 dark:bg-indigo-500/10 p-3 rounded-lg border border-indigo-200 dark:border-indigo-500/30">
                                   <div className="flex justify-between items-center">
                                       <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center"><Icon name="Brain" size={14} className="mr-1"/> WebGPU Local AI Engine (Phi-3)</span>
                                       {!isLlmReady ? (
                                           <button onClick={initializeLLM} disabled={!webLlmLibReady || !!llmLoadingProgress} className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded transition-colors shadow-sm disabled:opacity-50">
                                               {!webLlmLibReady ? 'Library Loading...' : (llmLoadingProgress || "Load Model (~1.8GB)")}
                                           </button>
                                       ) : (
                                           <div className="flex items-center gap-2">
                                               <span className="text-[10px] bg-green-50 dark:bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-1 rounded font-bold border border-green-200 dark:border-green-500/30 flex items-center"><Icon name="Check" size={12} className="mr-1"/>Model Ready</span>
                                               <button onClick={handleUnloadLLM} className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-500 px-2 py-1 rounded transition-colors border border-red-500/30 font-bold" title="Unload model to free VRAM/RAM">Unload</button>
                                           </div>
                                       )}
                                   </div>
                                   <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark leading-tight">
                                       Downloads a local AI model directly into your browser cache for ultra-smart screenplay parsing. Requires a modern GPU. If not loaded, the standard Regex parser will be used.
                                   </p>
                               </div>
                               <div className="flex flex-col space-y-2 bg-violet-50 dark:bg-violet-500/10 p-3 rounded-lg border border-violet-200 dark:border-violet-500/30">
                                   <div className="flex justify-between items-center">
                                       <span className="text-xs font-bold text-violet-600 dark:text-violet-400 flex items-center"><Icon name="Camera" size={14} className="mr-1"/> LLaVA-1.5 Vision AI (Ollama)</span>
                                       {isLlavaReady ? (
                                           <span className="text-[10px] bg-green-50 dark:bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-1 rounded font-bold border border-green-200 dark:border-green-500/30 flex items-center"><Icon name="Check" size={12} className="mr-1"/>LLaVA Ready</span>
                                       ) : (
                                           <button onClick={() => checkLLaVA()} disabled={isLlavaChecking} className="text-[10px] bg-violet-600 hover:bg-violet-500 text-white px-2 py-1 rounded transition-colors shadow-sm disabled:opacity-50">
                                               {isLlavaChecking ? 'Checking...' : 'Connect LLaVA'}
                                           </button>
                                       )}
                                   </div>
                                   <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark leading-tight">
                                       Analyzes reference images to generate cinematic shot descriptions. Requires <strong>Ollama</strong> running locally with <code className="bg-violet-100 dark:bg-violet-900/40 px-1 rounded">llava:7b</code> pulled. Add images via the ref image button, then use <strong>LLaVA Vision</strong> in the subject toolbar.
                                   </p>
                               </div>
                               <textarea 
                                   value={scriptParserText} 
                                   onChange={(e) => setScriptParserText(e.target.value)} 
                                   placeholder="INT. CYBERPUNK ALLEY - NIGHT&#10;&#10;Rain pours down the neon-lit street.&#10;&#10;K walks forward...&#10;&#10;K&#10;(nervous)&#10;Where are they?" 
                                   className="w-full h-60 bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-lg p-3 text-sm font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none shadow-inner resize-none custom-scrollbar" 
                               />
                           </div>
                           <div className="p-4 border-t border-border-light dark:border-border-dark bg-input-light dark:bg-input-dark/50 flex justify-end space-x-3">
                               <button onClick={() => setShowScriptParserModal(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-textMuted-light dark:text-textMuted-dark hover:bg-base-light dark:hover:bg-border-dark transition-all border border-border-light dark:border-border-dark shadow-sm">Cancel</button>
                               <button onClick={isLlmReady ? handleParseScriptLLM : handleParseScript} disabled={isGenerating || !scriptParserText.trim()} className={`bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-[0.98] flex items-center ${isGenerating || !scriptParserText.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                   {isGenerating ? <Icon name="Timer" size={16} className="animate-spin mr-2" /> : <Icon name="Sparkles" size={16} className="mr-2" />} {isLlmReady ? 'Parse via WebGPU' : 'Parse via Regex'}
                               </button>
                           </div>
                       </div>
                   </div>
               )}

               {showPlotHoleModal && (
                   <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base-light/80 dark:bg-base-dark/80 backdrop-blur-sm">
                       <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden animate-slide-up" style={{maxHeight:'85vh'}}>
                           <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between bg-input-light dark:bg-input-dark/50">
                               <h2 className="text-lg font-bold text-textMain-light dark:text-textMain-dark flex items-center space-x-2">
                                   <Icon name="AlertTriangle" size={20} className="text-orange-500" />
                                   <span>Plot Hole Detector</span>
                                   <span className={`text-xs px-2 py-0.5 rounded font-bold ml-2 ${plotHoleResults.length === 0 ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500'}`}>{plotHoleResults.length === 0 ? 'All Clear' : `${plotHoleResults.length} Issue${plotHoleResults.length > 1 ? 's' : ''} Found`}</span>
                               </h2>
                               <button onClick={() => setShowPlotHoleModal(false)} className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark"><Icon name="X" size={20} /></button>
                           </div>
                           <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
                               {plotHoleResults.length === 0 ? (
                                   <div className="flex flex-col items-center justify-center py-12 text-center">
                                       <Icon name="Check" size={48} className="text-green-500 mb-4" />
                                       <p className="text-lg font-bold text-green-500">No plot holes detected!</p>
                                       <p className="text-sm text-textMuted-light dark:text-textMuted-dark mt-2">All scenes, characters, lighting, transitions, and dialogue timing look consistent.</p>
                                   </div>
                               ) : (
                                   <div className="flex flex-col gap-3">
                                       {['Critical','High','Medium','Low'].map(sev => {
                                           const sevIssues = plotHoleResults.filter(i => i.severity === sev);
                                           if (!sevIssues.length) return null;
                                           const sevColors = { Critical: 'text-red-500 bg-red-500/10 border-red-500/30', High: 'text-orange-500 bg-orange-500/10 border-orange-500/30', Medium: 'text-amber-500 bg-amber-500/10 border-amber-500/30', Low: 'text-slate-400 bg-slate-500/10 border-slate-500/30' };
                                           const typeIcons = { Character: 'Users', Lighting: 'Sun', Transition: 'Zap', Dialogue: 'MessageSquare', Content: 'Edit', Camera: 'Camera', Duplicate: 'Copy' };
                                           return (
                                               <div key={sev}>
                                                   <div className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded mb-2 inline-flex items-center gap-1 border ${sevColors[sev]}`}>
                                                       <Icon name="AlertTriangle" size={10} /> {sev} — {sevIssues.length} issue{sevIssues.length > 1 ? 's' : ''}
                                                   </div>
                                                   <div className="flex flex-col gap-2">
                                                       {sevIssues.map((issue, i) => (
                                                           <div key={i} className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${sevColors[sev]}`}>
                                                               <Icon name={typeIcons[issue.type] || 'AlertTriangle'} size={14} className="shrink-0 mt-0.5" />
                                                               <div>
                                                                   <span className="font-bold mr-1">[{issue.type}]</span>
                                                                   {issue.msg}
                                                               </div>
                                                           </div>
                                                       ))}
                                                   </div>
                                               </div>
                                           );
                                       })}
                                   </div>
                               )}
                           </div>
                           <div className="p-4 border-t border-border-light dark:border-border-dark bg-input-light dark:bg-input-dark/50 flex justify-between items-center">
                               <span className="text-xs text-textMuted-light dark:text-textMuted-dark">Scans all projects, scenes and shots for continuity, character, lighting, dialogue and style issues.</span>
                               <button onClick={() => setShowPlotHoleModal(false)} className="px-6 py-2 rounded-xl text-sm font-bold bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark hover:bg-base-light dark:hover:bg-border-dark transition-all shadow-sm">Close</button>
                           </div>
                       </div>
                   </div>
               )}

               {/* Storyboard AI Model Selector Modal */}
               {showStoryboardAiModal && (
                   <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowStoryboardAiModal(false)}>
                       <div className="w-full max-w-sm bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
                           <div className="flex items-center justify-between px-5 py-4 border-b border-border-light dark:border-border-dark">
                               <div className="flex items-center gap-2">
                                   <Icon name="Layout" size={16} className="text-violet-500"/>
                                   <span className="text-sm font-black text-textMain-light dark:text-textMain-dark">Storyboard AI Engine</span>
                               </div>
                               <button onClick={() => setShowStoryboardAiModal(false)} className="text-textMuted-light dark:text-textMuted-dark hover:text-primary"><Icon name="X" size={16}/></button>
                           </div>
                           <div className="p-5 space-y-3">
                               <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark mb-4">Choose which AI engine analyzes your storyboard image and converts panels to shots.</p>
                               {/* LLaVA (Ollama) */}
                               <button onClick={() => { setStoryboardAiMode('llava'); localStorage.setItem('storyboard_ai_mode','llava'); }}
                                   className={`w-full flex items-start gap-3 p-3 rounded-xl border transition-all text-left ${storyboardAiMode === 'llava' ? 'bg-violet-500/10 border-violet-500/40' : 'bg-input-light dark:bg-input-dark border-border-light dark:border-border-dark hover:border-violet-500/30'}`}>
                                   <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${storyboardAiMode === 'llava' ? 'border-violet-500 bg-violet-500' : 'border-border-light dark:border-border-dark'}`}>
                                       {storyboardAiMode === 'llava' && <div className="w-1.5 h-1.5 rounded-full bg-white"/>}
                                   </div>
                                   <div>
                                       <div className="text-xs font-black text-textMain-light dark:text-textMain-dark">LLaVA via Ollama <span className="text-[8px] font-bold text-violet-500 ml-1">LOCAL</span></div>
                                       <div className="text-[9px] text-textMuted-light dark:text-textMuted-dark mt-0.5">Fully offline vision AI. Requires Ollama running locally with LLaVA model.</div>
                                   </div>
                               </button>
                               {/* WebLLM */}
                               <button onClick={() => { setStoryboardAiMode('webllm'); localStorage.setItem('storyboard_ai_mode','webllm'); }}
                                   className={`w-full flex items-start gap-3 p-3 rounded-xl border transition-all text-left ${storyboardAiMode === 'webllm' ? 'bg-accent/10 border-accent/40' : 'bg-input-light dark:bg-input-dark border-border-light dark:border-border-dark hover:border-accent/30'}`}>
                                   <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${storyboardAiMode === 'webllm' ? 'border-accent bg-accent' : 'border-border-light dark:border-border-dark'}`}>
                                       {storyboardAiMode === 'webllm' && <div className="w-1.5 h-1.5 rounded-full bg-white"/>}
                                   </div>
                                   <div>
                                       <div className="text-xs font-black text-textMain-light dark:text-textMain-dark">WebLLM (In-Browser) <span className="text-[8px] font-bold text-accent ml-1">LOCAL</span></div>
                                       <div className="text-[9px] text-textMuted-light dark:text-textMuted-dark mt-0.5">Uses the Deep Brain model loaded in Settings. No Ollama needed.</div>
                                   </div>
                               </button>
                               {/* API */}
                               <button onClick={() => { setStoryboardAiMode('api'); localStorage.setItem('storyboard_ai_mode','api'); }}
                                   className={`w-full flex items-start gap-3 p-3 rounded-xl border transition-all text-left ${storyboardAiMode === 'api' ? 'bg-primary/10 border-primary/40' : 'bg-input-light dark:bg-input-dark border-border-light dark:border-border-dark hover:border-primary/30'}`}>
                                   <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${storyboardAiMode === 'api' ? 'border-primary bg-primary' : 'border-border-light dark:border-border-dark'}`}>
                                       {storyboardAiMode === 'api' && <div className="w-1.5 h-1.5 rounded-full bg-white"/>}
                                   </div>
                                   <div className="flex-1">
                                       <div className="text-xs font-black text-textMain-light dark:text-textMain-dark">AI API <span className="text-[8px] font-bold text-primary ml-1">CLOUD</span></div>
                                       <div className="text-[9px] text-textMuted-light dark:text-textMuted-dark mt-0.5 mb-2">Use an external AI API with vision capabilities.</div>
                                       {storyboardAiMode === 'api' && (
                                           <select value={storyboardApiProvider} onChange={e => { setStoryboardApiProvider(e.target.value); localStorage.setItem('storyboard_api_provider', e.target.value); }}
                                               className="w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded-lg px-2 py-1.5 text-xs text-textMain-light dark:text-textMain-dark outline-none" onClick={e => e.stopPropagation()}>
                                               <option value="gemini">Gemini Vision (Google)</option>
                                               <option value="openai">GPT-4o Vision (OpenAI)</option>
                                               <option value="claude">Claude Vision (Anthropic)</option>
                                           </select>
                                       )}
                                   </div>
                               </button>
                           </div>
                           <div className="px-5 pb-5">
                               <button onClick={() => {
                                   setShowStoryboardAiModal(false);
                                   if (storyboardAiMode === 'llava') {
                                       if (!isLlavaReady) { addToast('LLaVA not connected. Open Script Parser and connect LLaVA first.', 'error'); return; }
                                       storyboardFileInputRef.current?.click();
                                   } else if (storyboardAiMode === 'webllm') {
                                       if (brainMode !== 'deep' || !deepBrainEngineRef.current) { addToast('Enable Deep Brain mode in Settings first to use WebLLM.', 'error'); return; }
                                       storyboardFileInputRef.current?.click();
                                   } else {
                                       storyboardFileInputRef.current?.click();
                                   }
                               }} className="w-full py-2.5 rounded-xl text-sm font-black text-white bg-violet-600 hover:bg-violet-500 transition-all shadow-md flex items-center justify-center gap-2">
                                   <Icon name="Layout" size={16}/>
                                   Select Storyboard Image →
                               </button>
                           </div>
                       </div>
                   </div>
               )}

               {/* Floating Storyboard Progress Pill */}
               {storyboardProgress && !showStoryboardPromptModal && (
                   <div className="fixed bottom-5 right-5 z-[200] animate-slide-up">
                       <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-sm ${storyboardProgress.stage === 'done' ? 'bg-green-500/10 border-green-500/40' : storyboardProgress.stage === 'cancelled' ? 'bg-amber-500/10 border-amber-500/40' : storyboardProgress.stage === 'error' ? 'bg-red-500/10 border-red-500/40' : 'bg-violet-500/10 border-violet-500/40'} bg-panel-light dark:bg-panel-dark`}>
                           {/* Animated icon */}
                           <div className="shrink-0">
                               {storyboardProgress.stage === 'analyzing' || storyboardProgress.stage === 'sending' || storyboardProgress.stage === 'parsing' || storyboardProgress.stage === 'building' ? (
                                   <div className="w-8 h-8 rounded-full border-2 border-violet-500/30 flex items-center justify-center relative">
                                       <div className="absolute inset-0 rounded-full border-2 border-violet-500 border-t-transparent animate-spin"></div>
                                       <Icon name="Layout" size={14} className="text-violet-400" />
                                   </div>
                               ) : storyboardProgress.stage === 'done' ? (
                                   <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                       <Icon name="Check" size={16} className="text-green-500" />
                                   </div>
                               ) : storyboardProgress.stage === 'cancelled' ? (
                                   <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                                       <Icon name="X" size={16} className="text-amber-500" />
                                   </div>
                               ) : (
                                   <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                                       <Icon name="AlertTriangle" size={16} className="text-red-500" />
                                   </div>
                               )}
                           </div>
                           {/* Text + bar */}
                           <div className="flex flex-col gap-1 min-w-[160px]">
                               <span className={`text-[10px] font-black uppercase tracking-wider ${storyboardProgress.stage === 'done' ? 'text-green-500' : storyboardProgress.stage === 'cancelled' ? 'text-amber-500' : storyboardProgress.stage === 'error' ? 'text-red-500' : 'text-violet-400'}`}>
                                   Storyboard — {storyboardProgress.percent}%
                               </span>
                               <div className="w-full h-1 bg-input-light dark:bg-input-dark rounded-full overflow-hidden">
                                   <div className={`h-full rounded-full transition-all duration-500 ${storyboardProgress.stage === 'done' ? 'bg-green-500' : storyboardProgress.stage === 'cancelled' ? 'bg-amber-500' : storyboardProgress.stage === 'error' ? 'bg-red-500' : 'bg-violet-500'} ${['analyzing','sending'].includes(storyboardProgress.stage) ? 'animate-pulse' : ''}`} style={{width: storyboardProgress.percent + '%'}}></div>
                               </div>
                               <span className="text-[9px] text-textMuted-light dark:text-textMuted-dark truncate max-w-[160px]">{storyboardProgress.message}</span>
                           </div>
                           {/* Action buttons */}
                           <div className="flex flex-col gap-1 shrink-0">
                               {pendingStoryboardImage && (
                                   <button onClick={() => setShowStoryboardPromptModal(true)} className="text-[9px] px-2 py-1 rounded-lg bg-violet-500/20 text-violet-400 border border-violet-500/30 hover:bg-violet-500/30 transition-all font-bold">
                                       View
                                   </button>
                               )}
                               {isGenerating ? (
                                   <button onClick={() => { storyboardAbortRef.current?.cancelAll ? storyboardAbortRef.current.cancelAll() : storyboardAbortRef.current?.abort(); }} className="text-[9px] px-2 py-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all font-bold">
                                       Cancel
                                   </button>
                               ) : (
                                   <button onClick={() => { setStoryboardProgress(null); setPendingStoryboardImage(null); setStoryboardCustomPrompt(''); }} className="text-[9px] px-2 py-1 rounded-lg bg-input-light dark:bg-input-dark text-textMuted-light dark:text-textMuted-dark border border-border-light dark:border-border-dark hover:text-red-400 transition-all font-bold">
                                       Dismiss
                                   </button>
                               )}
                           </div>
                       </div>
                   </div>
               )}

               {showStoryboardPromptModal && pendingStoryboardImage && (
                   <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-base-light/80 dark:bg-base-dark/80 backdrop-blur-sm">
                       <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-slide-up">
                           <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between bg-input-light dark:bg-input-dark/50">
                               <h2 className="text-lg font-bold text-textMain-light dark:text-textMain-dark flex items-center gap-2">
                                   <Icon name="Layout" size={20} className="text-violet-500" />
                                   Storyboard Import
                               </h2>
                               <button onClick={() => { setShowStoryboardPromptModal(false); s}} className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark"><Icon name="X" size={20} /></button>
                           </div>
                           <div className="p-5 flex flex-col gap-4">
                               <div className="flex gap-4">
                                   <img src={pendingStoryboardImage} alt="Storyboard preview" className="w-40 h-28 object-cover rounded-lg border border-border-light dark:border-border-dark shadow-md shrink-0" />
                                   <div className="flex-1 flex flex-col gap-1.5">
                                       <p className="text-xs font-bold text-textMain-light dark:text-textMain-dark">Storyboard ready for analysis</p>
                                       <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark leading-relaxed">LLaVA will analyze each panel and convert them into shots with full parameters. You can use the default prompt or write your own specific instructions below.</p>
                                       <div className="flex items-center gap-2 mt-1">
                                           <div className={`w-2 h-2 rounded-full ${isLlavaReady ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                           <span className="text-[10px] text-textMuted-light dark:text-textMuted-dark">{isLlavaReady ? 'LLaVA connected — ready to analyze' : 'LLaVA not connected'}</span>
                                       </div>
                                   </div>
                               </div>
                               <div className="flex flex-col gap-1.5">
                                   <div className="flex items-center justify-between">
                                       <label className="text-[10px] font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-wider">Custom Prompt (optional)</label>
                                       <button onClick={() => setStoryboardCustomPrompt('')} className="text-[9px] text-textMuted-light dark:text-textMuted-dark hover:text-primary transition-colors">Use Default</button>
                                   </div>
                                   <textarea
                                       value={storyboardCustomPrompt}
                                       onChange={e => setStoryboardCustomPrompt(e.target.value)}
                                       placeholder={'Leave empty to use the default storyboard analysis prompt.\n\nOr write your own instructions, e.g.:\nThis is a horror film. Focus on tension and shadow in each panel.\nThis is an anime storyboard. Each panel is a key action beat.'}
                                       rows={6}
                                       className="w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-lg p-3 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none shadow-inner resize-none custom-scrollbar font-mono"
                                   />
                                   <p className="text-[9px] text-textMuted-light dark:text-textMuted-dark">The app will always append JSON output instructions to your prompt automatically.</p>
                               </div>
                           </div>
                           {/* Progress Bar */}
                           {storyboardProgress && (
                               <div className="px-5 pb-3">
                                   <div className="flex items-center justify-between mb-1.5">
                                       <span className={`text-[10px] font-bold flex items-center gap-1.5 ${storyboardProgress.stage === 'done' ? 'text-green-500' : storyboardProgress.stage === 'cancelled' ? 'text-amber-500' : storyboardProgress.stage === 'error' ? 'text-red-500' : 'text-violet-400'}`}>
                                           {storyboardProgress.stage === 'analyzing' && <Icon name="Timer" size={11} className="animate-spin" />}
                                           {storyboardProgress.stage === 'done' && <Icon name="Check" size={11} />}
                                           {storyboardProgress.stage === 'error' && <Icon name="AlertTriangle" size={11} />}
                                           {storyboardProgress.message}
                                       </span>
                                       <span className="text-[10px] font-black text-textMuted-light dark:text-textMuted-dark">{storyboardProgress.percent}%</span>
                                   </div>
                                   <div className="w-full h-1.5 bg-input-light dark:bg-input-dark rounded-full overflow-hidden">
                                       <div
                                           className={`h-full rounded-full transition-all duration-500 ${storyboardProgress.stage === 'done' ? 'bg-green-500' : storyboardProgress.stage === 'cancelled' ? 'bg-amber-500' : storyboardProgress.stage === 'error' ? 'bg-red-500' : 'bg-violet-500'} ${storyboardProgress.stage === 'analyzing' ? 'animate-pulse' : ''}`}
                                           style={{width: storyboardProgress.percent + '%'}}
                                       ></div>
                                   </div>
                               </div>
                           )}
                           <div className="p-4 border-t border-border-light dark:border-border-dark bg-input-light dark:bg-input-dark/50 flex justify-end gap-3">
                               {isGenerating ? (
                                   <button onClick={() => { storyboardAbortRef.current?.cancelAll ? storyboardAbortRef.current.cancelAll() : storyboardAbortRef.current?.abort(); }} className="px-5 py-2 rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all border border-red-500/30 flex items-center gap-2 animate-pulse">
                                       <Icon name="X" size={15} /> Cancel Analysis
                                   </button>
                               ) : (
                                   <button onClick={() => { setShowStoryboardPromptModal(false); }} className="px-5 py-2 rounded-xl text-sm font-bold text-textMuted-light dark:text-textMuted-dark hover:bg-base-light dark:hover:bg-border-dark transition-all border border-border-light dark:border-border-dark">Close</button>
                               )}
                               <button onClick={() => { handleStoryboardImport(pendingStoryboardImage, storyboardCustomPrompt); }} disabled={!isLlavaReady || isGenerating} className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-8 py-2 rounded-xl text-sm font-bold transition-all shadow-md flex items-center gap-2">
                                   {isGenerating ? <Icon name="Timer" size={16} className="animate-spin" /> : <Icon name="Layout" size={16} />}
                                   {isGenerating ? 'Analyzing...' : 'Analyze Storyboard'}
                               </button>
                           </div>
                       </div>
                   </div>
               )}

               {showShortcutsModal && (
                   <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base-light/80 dark:bg-base-dark/80 backdrop-blur-sm">
                       <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-slide-up">
                           <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between bg-input-light dark:bg-input-dark/50">
                               <h2 className="text-lg font-bold text-textMain-light dark:text-textMain-dark flex items-center space-x-2">
                                   <Icon name="Keyboard" size={20} className="text-cyan-500" />
                                   <span>Keyboard Shortcuts</span>
                               </h2>
                               <button onClick={() => { setShowShortcutsModal(false); setRecordingShortcutFor(null); }} className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark"><Icon name="X" size={20} /></button>
                           </div>
                           <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col space-y-3 max-h-[60vh]">
                               {Object.entries(shortcuts).map(([actionId, shortcut]) => (
                                   <div key={actionId} className="flex items-center justify-between bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded-xl p-3 shadow-sm">
                                       <span className="text-sm font-bold text-textMain-light dark:text-textMain-dark">{shortcut.label}</span>
                                       <button onClick={() => setRecordingShortcutFor(actionId)} className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${recordingShortcutFor === actionId ? 'bg-primary text-white border-primary shadow-md animate-pulse' : 'bg-panel-light dark:bg-panel-dark text-textMuted-light dark:text-textMuted-dark border-border-light dark:border-border-dark hover:border-cyan-500 hover:text-cyan-500'}`}>
                                           {recordingShortcutFor === actionId ? 'Press any key...' : shortcut.keys.toUpperCase()}
                                       </button>
                                   </div>
                               ))}
                           </div>
                           <div className="p-4 border-t border-border-light dark:border-border-dark bg-input-light dark:bg-input-dark/50 flex justify-between space-x-3">
                               <button onClick={() => setShortcuts(DEFAULT_SHORTCUTS)} className="px-4 py-2 rounded-xl text-sm font-bold text-textMuted-light dark:text-textMuted-dark hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">Reset to Defaults</button>
                               <button onClick={() => { setShowShortcutsModal(false); setRecordingShortcutFor(null); }} className="bg-primary hover:bg-primaryHover text-white px-8 py-2 rounded-xl text-sm font-bold transition-all shadow-md active:scale-[0.98]">Done</button>
                           </div>
                       </div>
                   </div>
               )}

               {showLightingStudio && <InteractiveLightingModal />}

               {/* ═══ API KEYS & GENERATION SETTINGS MODAL ═══ */}
               {showApiSettingsModal && <ApiSettingsModal
                   onClose={() => setShowApiSettingsModal(false)}
                   videoSettings={videoSettings}
                   saveVideoSettings={saveVideoSettings}
                   imageSettings={imageSettings}
                   saveImageSettings={saveImageSettings}
               />}

               {/* ⚡ AI VIDEO PREVIEW MODAL */}
               {showVideoPreviewModal && (
                   <div className="fixed inset-0 z-[99998] flex items-center justify-center" onClick={() => { if (videoPreviewState.status !== 'generating') setShowVideoPreviewModal(false); }}>
                       <div className="absolute inset-0 bg-black/80" style={{WebkitBackdropFilter:'blur(8px)', backdropFilter:'blur(8px)'}}/>
                       <div className="relative bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-palette-in" onClick={e => e.stopPropagation()}>
                           <div className="flex items-center justify-between px-5 py-4 border-b border-border-light dark:border-border-dark bg-input-light dark:bg-input-dark">
                               <div className="flex items-center gap-2.5">
                                   <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                                       <Icon name="Play" size={16} className="text-purple-400"/>
                                   </div>
                                   <div>
                                       <div className="text-sm font-black text-textMain-light dark:text-textMain-dark uppercase tracking-widest">AI Video Preview</div>
                                       <div className="text-[10px] text-textMuted-light dark:text-textMuted-dark capitalize">{videoPreviewState.provider} · {videoSettings.duration}s · {videoSettings.ratio}</div>
                                   </div>
                               </div>
                               {videoPreviewState.status !== 'generating' && (
                                   <button onClick={() => setShowVideoPreviewModal(false)} className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark transition-colors"><Icon name="X" size={18}/></button>
                               )}
                           </div>
                           <div className="p-5">
                               <div className="mb-4 p-3 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark">
                                   <div className="text-[9px] font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest mb-1">Prompt</div>
                                   <p className="text-[11px] text-textMain-light dark:text-textMain-dark leading-relaxed line-clamp-3">{videoPreviewState.prompt}</p>
                               </div>
                               {videoPreviewState.status === 'generating' && (
                                   <div className="flex flex-col items-center justify-center py-12 gap-4">
                                       <div className="w-16 h-16 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin"/>
                                       <div className="text-sm font-bold text-textMain-light dark:text-textMain-dark">Generating your video...</div>
                                       <div className="text-[11px] text-textMuted-light dark:text-textMuted-dark text-center">This takes 30–120 seconds depending on the platform.<br/>Don't close this window.</div>
                                       <div className="flex gap-1 mt-2">
                                           {[0,1,2,3,4].map(i => (
                                               <div key={i} className="w-1.5 h-6 rounded-full bg-purple-500/40 animate-pulse" style={{animationDelay:`${i*0.15}s`}}/>
                                           ))}
                                       </div>
                                   </div>
                               )}
                               {videoPreviewState.status === 'done' && videoPreviewState.url && (
                                   <div className="flex flex-col gap-3">
                                       <video src={videoPreviewState.url} controls autoPlay loop className="w-full rounded-xl border border-border-light dark:border-border-dark bg-black" style={{maxHeight:'360px'}}/>
                                       <div className="flex gap-2">
                                           <a href={videoPreviewState.url} download={`mokha-preview-${Date.now()}.mp4`} className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-2 transition-all">
                                               <Icon name="FileDown" size={15}/>Download
                                           </a>
                                           <button onClick={() => handleVideoPreview(videoPreviewState.prompt)} className="px-4 py-2.5 rounded-lg text-sm font-bold bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark hover:border-purple-500/40 transition-all flex items-center gap-2">
                                               <Icon name="RotateCcw" size={15}/>Regenerate
                                           </button>
                                       </div>
                                   </div>
                               )}
                               {videoPreviewState.status === 'error' && (
                                   <div className="flex flex-col gap-3">
                                       <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                                           <Icon name="AlertTriangle" size={18} className="text-red-400 shrink-0 mt-0.5"/>
                                           <div>
                                               <div className="text-sm font-bold text-red-400 mb-1">Generation Failed</div>
                                               <div className="text-[11px] text-red-300/80 leading-relaxed">{videoPreviewState.error}</div>
                                           </div>
                                       </div>
                                       <div className="flex gap-2">
                                           <button onClick={() => handleVideoPreview(videoPreviewState.prompt)} className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-2 transition-all">
                                               <Icon name="RotateCcw" size={15}/>Try Again
                                           </button>
                                           <button onClick={() => setShowVideoPreviewModal(false)} className="px-4 py-2.5 rounded-lg text-sm font-bold bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark transition-all">Close</button>
                                       </div>
                                   </div>
                               )}
                           </div>
                           <div className="px-5 py-3 border-t border-border-light dark:border-border-dark bg-input-light dark:bg-input-dark flex items-center gap-3 flex-wrap">
                               <span className="text-[9px] font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest">Provider:</span>
                               {['runway','kling','pika'].map(p => (
                                   <button key={p} onClick={() => saveVideoSettings({ provider: p })}
                                       className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all capitalize ${videoSettings.provider === p ? 'bg-purple-600/20 border-purple-500/50 text-purple-400' : 'bg-transparent border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:border-purple-500/30'}`}>
                                       {p}
                                   </button>
                               ))}
                               <span className="text-[9px] font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest ml-2">Duration:</span>
                               {[3,5,10].map(d => (
                                   <button key={d} onClick={() => saveVideoSettings({ duration: d })}
                                       className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${videoSettings.duration === d ? 'bg-purple-600/20 border-purple-500/50 text-purple-400' : 'bg-transparent border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:border-purple-500/30'}`}>
                                       {d}s
                                   </button>
                               ))}
                           </div>
                       </div>
                   </div>
               )}

               {/* 🖼️ AI IMAGE GENERATION MODAL */}
               {showImageGenModal && (
                   <div className="fixed inset-0 z-[99998] flex items-center justify-center" onClick={() => { if (imageGenState.status !== 'generating') setShowImageGenModal(false); }}>
                       <div className="absolute inset-0 bg-black/80" style={{WebkitBackdropFilter:'blur(8px)', backdropFilter:'blur(8px)'}}/>
                       <div className="relative bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-palette-in" onClick={e => e.stopPropagation()}>
                           {/* Header */}
                           <div className="flex items-center justify-between px-5 py-4 border-b border-border-light dark:border-border-dark bg-input-light dark:bg-input-dark">
                               <div className="flex items-center gap-2.5">
                                   <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
                                       <Icon name="Image" size={16} className="text-emerald-400"/>
                                   </div>
                                   <div>
                                       <div className="text-sm font-black text-textMain-light dark:text-textMain-dark uppercase tracking-widest">AI Image Generation</div>
                                       <div className="text-[10px] text-textMuted-light dark:text-textMuted-dark capitalize">{imageGenState.provider} · {imageSettings.ratio}</div>
                                   </div>
                               </div>
                               {imageGenState.status !== 'generating' && (
                                   <button onClick={() => setShowImageGenModal(false)} className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark transition-colors"><Icon name="X" size={18}/></button>
                               )}
                           </div>
                           {/* Body */}
                           <div className="p-5">
                               <div className="mb-4 p-3 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark">
                                   <div className="text-[9px] font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest mb-1">Prompt</div>
                                   <p className="text-[11px] text-textMain-light dark:text-textMain-dark leading-relaxed line-clamp-3">{imageGenState.prompt}</p>
                               </div>
                               {imageGenState.status === 'generating' && (
                                   <div className="flex flex-col items-center justify-center py-12 gap-4">
                                       <div className="w-16 h-16 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin"/>
                                       <div className="text-sm font-bold text-textMain-light dark:text-textMain-dark">Generating your image...</div>
                                       <div className="text-[11px] text-textMuted-light dark:text-textMuted-dark text-center">Usually takes 5–30 seconds.</div>
                                   </div>
                               )}
                               {imageGenState.status === 'done' && imageGenState.url && (
                                   <div className="flex flex-col gap-3">
                                       <img src={imageGenState.url} alt="Generated" className="w-full rounded-xl border border-border-light dark:border-border-dark object-cover" style={{maxHeight:'400px'}}/>
                                       {imageGenState.revisedPrompt && (
                                           <div className="p-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark">
                                               <div className="text-[9px] font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest mb-1">Revised Prompt</div>
                                               <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark leading-relaxed">{imageGenState.revisedPrompt}</p>
                                           </div>
                                       )}
                                       <div className="flex gap-2">
                                           <a href={imageGenState.url} download={`mokha-image-${Date.now()}.png`} target="_blank" rel="noopener noreferrer"
                                               className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 transition-all">
                                               <Icon name="FileDown" size={15}/>Download
                                           </a>
                                           <button onClick={() => handleImageGenerate(imageGenState.prompt)}
                                               className="px-4 py-2.5 rounded-lg text-sm font-bold bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark hover:border-emerald-500/40 transition-all flex items-center gap-2">
                                               <Icon name="RotateCcw" size={15}/>Regenerate
                                           </button>
                                       </div>
                                   </div>
                               )}
                               {imageGenState.status === 'error' && (
                                   <div className="flex flex-col gap-3">
                                       <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                                           <Icon name="AlertTriangle" size={18} className="text-red-400 shrink-0 mt-0.5"/>
                                           <div>
                                               <div className="text-sm font-bold text-red-400 mb-1">Generation Failed</div>
                                               <div className="text-[11px] text-red-300/80 leading-relaxed">{imageGenState.error}</div>
                                           </div>
                                       </div>
                                       <div className="flex gap-2">
                                           <button onClick={() => handleImageGenerate(imageGenState.prompt)} className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 transition-all">
                                               <Icon name="RotateCcw" size={15}/>Try Again
                                           </button>
                                           <button onClick={() => setShowImageGenModal(false)} className="px-4 py-2.5 rounded-lg text-sm font-bold bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark transition-all">Close</button>
                                       </div>
                                   </div>
                               )}
                           </div>
                           {/* Footer — quick provider switch */}
                           <div className="px-5 py-3 border-t border-border-light dark:border-border-dark bg-input-light dark:bg-input-dark flex items-center gap-2 flex-wrap">
                               <span className="text-[9px] font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest">Provider:</span>
                               {ImageBridge.PROVIDERS.map(p => (
                                   <button key={p.id} onClick={() => saveImageSettings({ provider: p.id })}
                                       className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${imageSettings.provider === p.id ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400' : 'bg-transparent border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:border-emerald-500/30'}`}>
                                       {p.label}
                                   </button>
                               ))}
                           </div>
                       </div>
                   </div>
               )}

               {showStoryEngineModal && <StoryEngineModal 
                    onClose={() => { setShowStoryEngineModal(false); setInitialStoryId(null); setIsRevising(false); }}
                    uiStyle={uiStyle}
                    initialStoryId={initialStoryId}
                    isRevising={isRevising}
                    setIsRevising={setIsRevising} 
                    stories={stories}
                    setStories={setStories}
                    storyData={storyData} 
                    setStoryData={setStoryData}
                    scenes={scenes}
                    globalCharacters={globalCharacters}
                    setGlobalCharacters={setGlobalCharacters}
                    updateActiveProjectScenes={updateActiveProjectScenes}
                    setActiveSceneId={setActiveSceneId}
                    projects={projects}
                    isLlavaReady={isLlavaReady}
                    isGenerating={isGenerating}
                    handleLLaVAStoryField={handleLLaVAStoryField}
                    llavaMonitorLog={llavaMonitorLog}
                    setLlavaMonitorLog={setLlavaMonitorLog}
                    setProjects={setProjects}
                    setActiveProjectId={setActiveProjectId} />}

               {/* Pro Mode Wizard Modal */}
               {showProModeWizard && (
                   <ConfigurationWizard 
                       onComplete={(blueprint) => {
                           setProModeBlueprint(blueprint);
                           setShowProModeWizard(false);
                       }}
                       onCancel={() => setShowProModeWizard(false)}
                   />
               )}

               {/* Pro Mode Entry Modal - Choose between existing projects or new story */}
               {showProModeEntryModal && (
                   <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                       <div className="w-full max-w-2xl bg-panel-light dark:bg-panel-dark rounded-lg shadow-2xl animate-slide-up">
                           {/* Header */}
                           <div className="border-b border-border-light dark:border-border-dark p-6">
                               <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-3">
                                       <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                                           <Icon name="BookOpen" size={24} className="text-accent" />
                                       </div>
                                       <div>
                                           <h2 className="text-2xl font-bold">Welcome to Pro Script Builder</h2>
                                           <p className="text-sm text-textMuted-light dark:text-textMuted-dark">Choose how you'd like to continue</p>
                                       </div>
                                   </div>
                                   <button
                                       onClick={() => setShowProModeEntryModal(false)}
                                       className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark"
                                   >
                                       <Icon name="X" size={24} />
                                   </button>
                               </div>
                           </div>

                           {/* Content */}
                           <div className="p-6">
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   {/* Option 1: Open Existing Projects */}
                                   <button
                                       onClick={() => {
                                           setShowProModeEntryModal(false);
                                           // Create a temporary blueprint to open Pro Script Builder
                                           // The Pro Script Builder will show the Project Library immediately
                                           const tempBlueprint = {
                                               id: `temp-${Date.now()}`,
                                               storyType: 'Short Film',
                                               duration: 5,
                                               genre: 'Drama',
                                               style: 'Cinematic',
                                               storyIntent: '',
                                               narrativeStructure: 'Protagonist Journey',
                                               characters: [],
                                               setting: '',
                                               theme: '',
                                               _openProjectLibrary: true // Flag to open project library immediately
                                           };
                                           setProModeBlueprint(tempBlueprint);
                                       }}
                                       className="group relative overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 border-2 border-primary/30 hover:border-primary rounded-xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                                   >
                                       <div className="relative z-10">
                                           <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                               <Icon name="FolderOpen" size={32} className="text-primary" />
                                           </div>
                                           <h3 className="text-xl font-bold mb-2">Open Existing Project</h3>
                                           <p className="text-sm text-textMuted-light dark:text-textMuted-dark mb-4">
                                               Continue working on your saved scripts and projects
                                           </p>
                                           <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                                               <span>Browse Projects</span>
                                               <Icon name="ArrowRight" size={16} className="group-hover:translate-x-1 transition-transform" />
                                           </div>
                                       </div>
                                       {/* Decorative background */}
                                       <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                                   </button>

                                   {/* Option 2: Create New Story */}
                                   <button
                                       onClick={() => {
                                           setShowProModeEntryModal(false);
                                           setShowProModeWizard(true);
                                       }}
                                       className="group relative overflow-hidden bg-gradient-to-br from-accent/10 to-accent/5 hover:from-accent/20 hover:to-accent/10 border-2 border-accent/30 hover:border-accent rounded-xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                                   >
                                       <div className="relative z-10">
                                           <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                               <Icon name="Plus" size={32} className="text-accent" />
                                           </div>
                                           <h3 className="text-xl font-bold mb-2">Create New Story</h3>
                                           <p className="text-sm text-textMuted-light dark:text-textMuted-dark mb-4">
                                               Start fresh with the 7-step configuration wizard
                                           </p>
                                           <div className="flex items-center gap-2 text-accent font-semibold text-sm">
                                               <span>Start Wizard</span>
                                               <Icon name="ArrowRight" size={16} className="group-hover:translate-x-1 transition-transform" />
                                           </div>
                                       </div>
                                       {/* Decorative background */}
                                       <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                                   </button>
                               </div>

                               {/* Quick Stats */}
                               <div className="mt-6 p-4 bg-input-light dark:bg-input-dark rounded-lg border border-border-light dark:border-border-dark">
                                   <div className="flex items-center justify-between text-sm">
                                       <div className="flex items-center gap-2">
                                           <Icon name="FileText" size={16} className="text-textMuted-light dark:text-textMuted-dark" />
                                           <span className="text-textMuted-light dark:text-textMuted-dark">Your Projects:</span>
                                       </div>
                                       <span className="font-bold text-primary">
                                           {(() => {
                                               try {
                                                   const storageKey = 'mokha_story_projects';
                                                   const data = localStorage.getItem(storageKey);
                                                   const projects = data ? JSON.parse(data) : [];
                                                   return projects ? projects.length : 0;
                                               } catch (error) {
                                                   return 0;
                                               }
                                           })()} saved
                                       </span>
                                   </div>
                               </div>
                           </div>

                           {/* Footer */}
                           <div className="border-t border-border-light dark:border-border-dark p-4 bg-input-light/50 dark:bg-input-dark/50">
                               <p className="text-xs text-textMuted-light dark:text-textMuted-dark text-center">
                                   💡 Tip: You can always access your projects from the toolbar inside Pro Script Builder
                               </p>
                           </div>
                       </div>
                   </div>
               )}

               {/* Pro Script Builder Modal */}
               {proModeBlueprint && !showProModeWizard && (
                   <ProScriptBuilder 
                       blueprint={proModeBlueprint}
                       onSave={(script) => {
                           setProModeScript(script);
                           addToast('Script saved ✓', 'success');
                       }}
                       onClose={() => {
                           setProModeBlueprint(null);
                           setProModeScript(null);
                       }}
                   />
               )}

               <CheatSheetOverlay isOpen={showCheatSheet} onClose={() => setShowCheatSheet(false)} />

               {/* ── Onboarding Tour ── */}
               {showOnboardingTour && ReactDOM.createPortal(
                   <div className="fixed inset-0 z-[99998] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
                       <div className="w-full max-w-md bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
                           {/* Progress bar */}
                           <div className="h-1 bg-input-light dark:bg-input-dark">
                               <div className="h-full bg-primary transition-all duration-500" style={{width: `${((onboardingStep + 1) / ONBOARDING_STEPS.length) * 100}%`}}/>
                           </div>
                           <div className="p-6">
                               {/* Step indicator */}
                               <div className="flex items-center gap-2 mb-4">
                                   <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
                                       <Icon name={ONBOARDING_STEPS[onboardingStep].icon} size={16} className="text-primary"/>
                                   </div>
                                   <span className="text-[9px] font-black text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest">{onboardingStep + 1} of {ONBOARDING_STEPS.length}</span>
                               </div>
                               {/* Content */}
                               <h2 className="text-base font-black text-textMain-light dark:text-textMain-dark mb-2 leading-tight">{ONBOARDING_STEPS[onboardingStep].title}</h2>
                               <p className="text-sm text-textMuted-light dark:text-textMuted-dark leading-relaxed mb-6">{ONBOARDING_STEPS[onboardingStep].body}</p>
                               {/* Dot indicators */}
                               <div className="flex items-center gap-1.5 mb-5">
                                   {ONBOARDING_STEPS.map((_, i) => (
                                       <button key={i} onClick={() => setOnboardingStep(i)}
                                           className={`rounded-full transition-all ${i === onboardingStep ? 'w-5 h-2 bg-primary' : 'w-2 h-2 bg-border-light dark:bg-border-dark hover:bg-primary/50'}`}/>
                                   ))}
                               </div>
                               {/* Actions */}
                               <div className="flex items-center justify-between">
                                   <button onClick={dismissOnboarding} className="text-xs text-textMuted-light dark:text-textMuted-dark hover:text-primary transition-colors">Skip tour</button>
                                   <div className="flex gap-2">
                                       {onboardingStep > 0 && (
                                           <button onClick={() => setOnboardingStep(p => p - 1)} className="px-4 py-2 text-xs font-bold rounded-lg border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:bg-input-light dark:hover:bg-input-dark transition-all">Back</button>
                                       )}
                                       {onboardingStep < ONBOARDING_STEPS.length - 1 ? (
                                           <button onClick={() => setOnboardingStep(p => p + 1)} className="px-5 py-2 text-xs font-black rounded-lg bg-primary hover:bg-primaryHover text-white transition-all shadow-sm">Next →</button>
                                       ) : (
                                           <button onClick={dismissOnboarding} className="px-5 py-2 text-xs font-black rounded-lg bg-primary hover:bg-primaryHover text-white transition-all shadow-sm">Let's go 🎬</button>
                                       )}
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>,
                   document.body
               )}
               {/* Director Intelligence Suite: First-launch keyboard banner */}
               {!keyboardBannerDismissed && (
                   <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9998] flex items-center gap-3 px-4 py-2.5 rounded-full bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark shadow-2xl animate-slide-up">
                       <span className="text-[10px] text-textMain-light dark:text-textMain-dark">⌨ Keyboard shortcuts available — press <kbd className="font-mono bg-input-light dark:bg-input-dark px-1 rounded border border-border-light dark:border-border-dark text-primary">?</kbd> to see all</span>
                       <button onClick={() => { setKeyboardBannerDismissed(true); localStorage.setItem('kbShortcutsBannerSeen', 'true'); }} className="text-[9px] text-textMuted-light dark:text-textMuted-dark hover:text-primary transition-colors font-bold">✕</button>
                   </div>
               )}

               <LocalAssistant 
                   currentView={currentView} 
                   activeInputTab={activeInputTab}
                   brainMode={brainMode}
                   deepBrainEngineRef={deepBrainEngineRef}
                   setShowStoryEngineModal={setShowStoryEngineModal}
                   setShowPromptLibraryModal={setShowPromptLibraryModal}
                   videoSettings={videoSettings}
                   saveVideoSettings={saveVideoSettings}
                   imageSettings={imageSettings}
                   saveImageSettings={saveImageSettings}
                   appActions={{
                       projects, setProjects, activeProjectId, setActiveProjectId,
                       scenes, updateActiveProjectScenes, activeSceneId, setActiveSceneId,
                       globalCharacters, setGlobalCharacters,
                       globalLocations, setGlobalLocations,
                       globalVoiceStyles, setGlobalVoiceStyles,
                       activeDirectorRules, setActiveDirectorRules,
                       setSubject, setSelections, setCurrentView,
                       setShowStoryEngineModal, setShowPromptLibraryModal,
                       storyData, setStoryData,
                       subject,
                       saveToHistory,
                       editingIndex,
                       handleCreateProject: () => {
                           const id = `proj_${Date.now()}`;
                           return id;
                       }
                   }}
               />

               {/* Feature 6 — Command Palette */}
               <CommandPalette
                   isOpen={showCommandPalette}
                   onClose={() => setShowCommandPalette(false)}
                   projects={projects}
                   scenes={scenes || []}
                   globalCharacters={globalCharacters}
                   onCommand={(cmd, arg) => {
                       if (cmd === 'navigate') setCurrentView(arg);
                       else if (cmd === 'library') setShowPromptLibraryModal(true);
                       else if (cmd === 'story') setShowStoryEngineModal(true);
                       else if (cmd === 'newProject') handleCreateProject();
                       else if (cmd === 'newScene') addScene && addScene();
                       else if (cmd === 'toggleTheme') setIsDarkMode(p => !p);
                       else if (cmd === 'focusMode') setIsFocusMode(p => !p);
                       else if (cmd === 'switchProject') { setActiveProjectId(arg); setCurrentView('editor'); }
                       else if (cmd === 'switchScene') setActiveSceneId(arg);
                       else if (cmd === 'exportPDF') handleExportPDF && handleExportPDF();
                       else if (cmd === 'exportJSON') handleExportJSON && handleExportJSON();
                       else if (cmd === 'copyScript') { const s = generateMovieScript && generateMovieScript(); if(s) navigator.clipboard.writeText(s); }
                       else if (cmd === 'directorBrain') { window.dispatchEvent(new CustomEvent('mokha:openDirectorBrain')); }
                       else if (cmd === 'runCritique') { runFullCritique && runFullCritique(); }
                       else if (cmd === 'cheatSheet') { setShowCheatSheet(true); }
                       else if (cmd === 'deepBrain') { handleBrainModeChange('deep'); }
                       else if (cmd === 'fastBrain') { handleBrainModeChange('fast'); }
                   }}
               />

               {/* Feature 3 — Prompt History Drawer */}
               {showHistoryPanel && (
                   <div className="fixed inset-0 z-[9990] flex justify-end" onClick={() => setShowHistoryPanel(false)}>
                       <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"/>
                       <div className="relative w-80 h-full bg-panel-light dark:bg-panel-dark border-l border-border-light dark:border-border-dark shadow-2xl animate-slide-in-right" onClick={e => e.stopPropagation()}>
                           <PromptHistoryPanel history={promptHistory} onRestore={(text) => { setSubject(text); setShowHistoryPanel(false); }} onClear={clearPromptHistory}/>
                       </div>
                   </div>
               )}

               {/* Feature 4 — Favorites Drawer */}
               {showFavoritesPanel && (
                   <div className="fixed inset-0 z-[9990] flex justify-end" onClick={() => setShowFavoritesPanel(false)}>
                       <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"/>
                       <div className="relative w-80 h-full bg-panel-light dark:bg-panel-dark border-l border-border-light dark:border-border-dark shadow-2xl animate-slide-in-right overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
                           <div className="flex items-center justify-between px-3 py-2 border-b border-border-light dark:border-border-dark sticky top-0 bg-panel-light dark:bg-panel-dark z-10">
                               <span className="text-xs font-black text-textMain-light dark:text-textMain-dark uppercase tracking-widest flex items-center gap-1.5"><Icon name="Tag" size={13} className="text-primary"/>Pinned Shots ({favorites.length})</span>
                               <button onClick={() => setShowFavoritesPanel(false)} className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark"><Icon name="X" size={16}/></button>
                           </div>
                           <div className="p-2 flex flex-col gap-2">
                               {favorites.length === 0 && <div className="text-center text-textMuted-light dark:text-textMuted-dark text-xs py-8">No pinned shots yet.<br/>Click ★ on any shot to pin it.</div>}
                               {favorites.map((shot, favIdx) => (
                                   <div key={shot.id} onContextMenu={(e) => openCtxMenu(e, 'favorite', { favoriteId: shot.id, favoriteIndex: favIdx })} className="bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded-lg p-2.5 hover:border-primary/40 transition-all">
                                       <div className="flex items-start justify-between gap-2 mb-1">
                                           <p className="text-[10px] text-textMain-light dark:text-textMain-dark leading-relaxed line-clamp-2 flex-1">{shot.subject || 'Untitled Shot'}</p>
                                           <button onClick={() => toggleFavorite(shot)} className="text-primary hover:text-red-400 transition-colors shrink-0"><Icon name="Trash2" size={11}/></button>
                                       </div>
                                       <div className="flex gap-1 flex-wrap">
                                           {shot.selections?.shotType && <span className="text-[8px] px-1 py-0.5 rounded bg-primary/10 text-primary font-bold">{shot.selections.shotType.split('(')[0].trim()}</span>}
                                           {shot.selections?.lighting && <span className="text-[8px] px-1 py-0.5 rounded bg-accent/10 text-accent font-bold">{shot.selections.lighting}</span>}
                                           {shot.mode && <span className="text-[8px] px-1 py-0.5 rounded bg-border-light dark:bg-border-dark text-textMuted-light dark:text-textMuted-dark font-bold">{shot.mode}</span>}
                                       </div>
                                   </div>
                               ))}
                           </div>
                       </div>
                   </div>
               )}

               {/* Feature 1 — Cinematic Theme Picker (floating) */}
               {showThemePicker && (
                   <div className="fixed inset-0 z-[99997] flex items-center justify-center" onClick={() => setShowThemePicker(false)}>
                       <div className="absolute inset-0 bg-black/50" style={{WebkitBackdropFilter:'blur(4px)', backdropFilter:'blur(4px)'}}/>
                       <div className="relative bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl p-5 animate-palette-in max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
                           <div className="flex items-center justify-between mb-4">
                               <div className="text-xs font-black text-textMain-light dark:text-textMain-dark uppercase tracking-widest flex items-center gap-2"><Icon name="Aperture" size={14} className="text-primary"/>Cinematic Themes</div>
                               <button onClick={() => setShowThemePicker(false)} className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark transition-colors"><Icon name="X" size={16}/></button>
                           </div>
                           <CinematicThemePicker currentTheme={cinematicTheme} onThemeChange={(t) => { applyCinematicTheme(t); setShowThemePicker(false); }}/>
                       </div>
                   </div>
               )}

               {/* Performance Settings Modal */}
               {showFightClub && <FightClub characters={globalCharacters} locations={globalLocations} onClose={() => setShowFightClub(false)} onApply={applyFightClub} />}
               {showSettings && (
                   <PerformanceSettingsModal
                       settings={perfSettings}
                       isLlmReady={isLlmReady}
                       onUnloadLLM={handleUnloadLLM}
                       brainMode={brainMode}
                       deepBrainLoadingProgress={deepBrainLoadingProgress}
                       deepBrainModelId={deepBrainModelId}
                       setDeepBrainModelId={setDeepBrainModelId}
                       onBrainModeChange={handleBrainModeChange}
                       updateAvailable={updateAvailable}
                       onSave={(saved) => {
                           setPerfSettings(saved);
                           addToast('Performance settings saved ✓', 'success');
                       }}
                       onClose={() => setShowSettings(false)}
                   />
               )}

               {/* Styled Confirm Dialog */}
               {ConfirmUI}

               {/* ── Chain Mode Modal — 3-Step Wizard ── */}
               {showChainModal && (() => {
                   const groups = [...new Set(CHAIN_SCENE_PRESETS.map(p => p.group))];
                   const filtered = chainPresetSearch.trim()
                       ? CHAIN_SCENE_PRESETS.filter(p => p.name.toLowerCase().includes(chainPresetSearch.toLowerCase()) || p.tag.toLowerCase().includes(chainPresetSearch.toLowerCase()) || p.group.toLowerCase().includes(chainPresetSearch.toLowerCase()))
                       : CHAIN_SCENE_PRESETS;
                   const selectedPreset = CHAIN_SCENE_PRESETS.find(p => p.id === chainPreset);

                   return (
                   <div className="settings-overlay" style={{zIndex:99998}} onClick={() => setShowChainModal(false)}>
                       <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl max-w-2xl w-full mx-4 animate-slide-up max-h-[92vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>

                           {/* ── Header ── */}
                           <div className="relative px-6 py-4 shrink-0 overflow-hidden" style={{background:'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(139,92,246,0.1))'}}>
                               <div className="absolute inset-0 opacity-5" style={{backgroundImage:'repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(255,255,255,0.5) 4px,rgba(255,255,255,0.5) 5px)'}}/>
                               <div className="relative flex items-center justify-between">
                                   <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                                           <Icon name="Link" size={15} className="text-cyan-500"/>
                                       </div>
                                       <div>
                                           <div className="flex items-center gap-2">
                                               <span className="text-sm font-black uppercase tracking-widest text-textMain-light dark:text-textMain-dark">Chain Mode</span>
                                               {chainMode && <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-500 font-black">ACTIVE</span>}
                                               {selectedPreset && <span className="text-[9px] px-2 py-0.5 rounded-full font-black text-white" style={{background:selectedPreset.color}}>{selectedPreset.name}</span>}
                                           </div>
                                           <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark mt-0.5">Set once. Direct forever.</p>
                                       </div>
                                   </div>
                                   <button onClick={() => setShowChainModal(false)}><Icon name="X" size={16} className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark"/></button>
                               </div>
                               {/* Step indicator */}
                               <div className="relative flex items-center gap-1 mt-3">
                                   {[{n:1,l:'Scene Preset'},{n:2,l:'Story Setup'},{n:3,l:'Launch'}].map(({n,l}) => (
                                       <button key={n} onClick={() => setChainWizardStep(n)}
                                           className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${chainWizardStep === n ? 'bg-cyan-500 text-white' : 'bg-input-light dark:bg-input-dark text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark border border-border-light dark:border-border-dark'}`}>
                                           <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black ${chainWizardStep === n ? 'bg-white/20' : 'bg-border-light dark:bg-border-dark'}`}>{n}</span>
                                           {l}
                                       </button>
                                   ))}
                               </div>
                           </div>

                           {/* ── Step 1: Scene Preset ── */}
                           {chainWizardStep === 1 && (
                               <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4">
                                   <div className="flex items-center gap-2 mb-3">
                                       <div className="flex-1 flex items-center bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded-lg px-3 py-1.5 gap-2">
                                           <Icon name="Search" size={12} className="text-textMuted-light dark:text-textMuted-dark shrink-0"/>
                                           <input value={chainPresetSearch} onChange={e => setChainPresetSearch(e.target.value)} placeholder="Search presets..." className="bg-transparent outline-none text-xs text-textMain-light dark:text-textMain-dark w-full"/>
                                       </div>
                                       {chainPreset && <button onClick={() => { setChainPreset(null); setChainBase(p => ({...p, camera:'',lens:'',lighting:'',shotStyle:'',angle:'',filmStock:'',movement:'',actionSpeed:'',duration:'',transition:''})); }} className="text-[9px] text-red-500 hover:text-red-400 font-bold px-2 py-1.5 rounded-lg border border-red-500/30 bg-red-500/5 whitespace-nowrap">Clear</button>}
                                   </div>
                                   {(chainPresetSearch ? [{group:'Results', presets: filtered}] : groups.map(g => ({group:g, presets: CHAIN_SCENE_PRESETS.filter(p => p.group === g)}))).map(({group, presets}) => (
                                       <div key={group} className="mb-4">
                                           <div className="text-[9px] font-black uppercase tracking-widest text-textMuted-light dark:text-textMuted-dark mb-2 flex items-center gap-2">
                                               <div className="flex-1 h-px bg-border-light dark:bg-border-dark"/>
                                               {group}
                                               <div className="flex-1 h-px bg-border-light dark:bg-border-dark"/>
                                           </div>
                                           <div className="grid grid-cols-3 gap-2">
                                               {presets.map(preset => (
                                                   <button key={preset.id} onClick={() => {
                                                       setChainPreset(preset.id);
                                                       setChainBase(p => ({...p, ...preset.p}));
                                                       setChainWizardStep(2);
                                                   }} className={`relative p-2.5 rounded-xl border text-left transition-all group ${chainPreset === preset.id ? 'border-cyan-500 bg-cyan-500/5 shadow-[0_0_12px_rgba(6,182,212,0.15)]' : 'border-border-light dark:border-border-dark bg-input-light dark:bg-input-dark hover:border-primary/40 hover:bg-panel-light dark:hover:bg-panel-dark'}`}>
                                                       <div className="w-full h-1 rounded-full mb-2" style={{background: preset.color}}/>
                                                       <div className="text-[10px] font-black text-textMain-light dark:text-textMain-dark leading-tight mb-0.5">{preset.name}</div>
                                                       <div className="text-[8px] text-textMuted-light dark:text-textMuted-dark font-mono">{preset.tag}</div>
                                                       {chainPreset === preset.id && <div className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full bg-cyan-500 flex items-center justify-center"><Icon name="Check" size={8} className="text-white"/></div>}
                                                   </button>
                                               ))}
                                           </div>
                                       </div>
                                   ))}
                               </div>
                           )}

                           {/* ── Step 2: Story Setup ── */}
                           {chainWizardStep === 2 && (
                               <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-4">
                                   {selectedPreset && (
                                       <div className="flex items-center gap-3 p-3 rounded-xl border" style={{borderColor: selectedPreset.color + '40', background: selectedPreset.color + '10'}}>
                                           <div className="w-2 h-10 rounded-full shrink-0" style={{background: selectedPreset.color}}/>
                                           <div>
                                               <div className="text-xs font-black text-textMain-light dark:text-textMain-dark">{selectedPreset.name}</div>
                                               <div className="text-[9px] text-textMuted-light dark:text-textMuted-dark font-mono mt-0.5">{[selectedPreset.p.camera, selectedPreset.p.lens, selectedPreset.p.lighting, selectedPreset.p.movement].filter(Boolean).join(' · ')}</div>
                                           </div>
                                           <button onClick={() => setChainWizardStep(1)} className="ml-auto text-[9px] text-textMuted-light dark:text-textMuted-dark hover:text-primary font-bold">Change</button>
                                       </div>
                                   )}
                                   <div>
                                       <label className="text-[10px] font-bold uppercase tracking-wider text-textMuted-light dark:text-textMuted-dark block mb-1">Scene Context / Master Subject</label>
                                       <input value={chainBase.subject} onChange={e => setChainBase(p => ({...p, subject: e.target.value}))}
                                           placeholder="e.g. in a rain-soaked alley at midnight"
                                           className="w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-xl px-3 py-2.5 text-xs font-mono outline-none focus:border-cyan-500/60 transition-all"/>
                                   </div>
                                   <div className="grid grid-cols-2 gap-3">
                                       <div>
                                           <label className="text-[10px] font-bold uppercase tracking-wider text-textMuted-light dark:text-textMuted-dark block mb-1"><Icon name="Users" size={10} className="inline mr-1"/>Character</label>
                                           <select value={chainBase.character || ''} onChange={e => {
                                               const char = globalCharacters.find(c => c.name === e.target.value);
                                               setChainBase(p => ({...p, character: e.target.value, characterDesc: char ? `@${char.name.replace(/\s+/g,'')} [${char.role || 'Character'}, ${char.appearance}]` : ''}));
                                           }} className="w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-xl px-3 py-2.5 text-xs font-mono outline-none focus:border-cyan-500/60">
                                               <option value="">— None —</option>
                                               {globalCharacters.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                           </select>
                                       </div>
                                       <div>
                                           <label className="text-[10px] font-bold uppercase tracking-wider text-textMuted-light dark:text-textMuted-dark block mb-1"><Icon name="MapPin" size={10} className="inline mr-1"/>Location</label>
                                           <select value={chainBase.location || ''} onChange={e => {
                                               const loc = globalLocations.find(l => l.name === e.target.value);
                                               setChainBase(p => ({...p, location: e.target.value, locationDesc: loc?.description || ''}));
                                           }} className="w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-xl px-3 py-2.5 text-xs font-mono outline-none focus:border-cyan-500/60">
                                               <option value="">— None —</option>
                                               {globalLocations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                                           </select>
                                       </div>
                                   </div>
                                   {/* Customize toggle */}
                                   <button onClick={() => setChainShowCustom(p => !p)} className="w-full py-2 text-[10px] font-bold rounded-xl border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:text-primary hover:border-primary/40 transition-all flex items-center justify-center gap-1.5">
                                       <Icon name={chainShowCustom ? 'ChevronUp' : 'ChevronDown'} size={11}/>
                                       {chainShowCustom ? 'Hide' : 'Customize'} Parameters
                                   </button>
                                   {chainShowCustom && (
                                       <div className="grid grid-cols-2 gap-2 pt-1">
                                           {[
                                               {key:'camera',label:'Camera',opts:OPTIONS.cameraTypes},
                                               {key:'lens',label:'Lens',opts:OPTIONS.lenses},
                                               {key:'lighting',label:'Lighting',opts:OPTIONS.lighting},
                                               {key:'shotStyle',label:'Style',opts:OPTIONS.shotStyles},
                                               {key:'angle',label:'Angle',opts:OPTIONS.angles},
                                               {key:'filmStock',label:'Film Stock',opts:OPTIONS.filmStocks.map(f=>f.name)},
                                               {key:'movement',label:'Movement',opts:OPTIONS.movements},
                                               {key:'actionSpeed',label:'Speed',opts:OPTIONS.actionSpeeds},
                                               {key:'duration',label:'Duration',opts:OPTIONS.durations},
                                               {key:'transition',label:'Transition',opts:OPTIONS.transitions},
                                           ].map(({key,label,opts}) => (
                                               <div key={key}>
                                                   <label className="text-[9px] font-bold uppercase tracking-wider text-textMuted-light dark:text-textMuted-dark block mb-1">{label}</label>
                                                   <select value={chainBase[key]||''} onChange={e=>setChainBase(p=>({...p,[key]:e.target.value}))}
                                                       className="w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-lg px-2 py-1.5 text-[10px] font-mono outline-none focus:border-cyan-500/60">
                                                       <option value="">— Default —</option>
                                                       {opts.map(o=><option key={o} value={o}>{o}</option>)}
                                                   </select>
                                               </div>
                                           ))}
                                       </div>
                                   )}
                                   <button onClick={() => {
                                       setChainBase(p => ({...p, camera:selections.camera||p.camera, lens:selections.lens||p.lens, lighting:selections.lighting||p.lighting, shotStyle:selections.shotStyle||p.shotStyle, angle:selections.angle||p.angle, filmStock:selections.filmStock||p.filmStock, movement:selections.movement||p.movement, actionSpeed:selections.actionSpeed||p.actionSpeed, duration:selections.duration||p.duration, transition:selections.transition||p.transition}));
                                       addToast('Current shot parameters imported ✓', 'success');
                                   }} className="w-full py-2 text-[10px] font-bold rounded-xl border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:text-cyan-500 hover:border-cyan-500/40 transition-all flex items-center justify-center gap-1.5">
                                       <Icon name="Upload" size={11}/>Import from current shot
                                   </button>
                               </div>
                           )}

                           {/* ── Step 3: Launch ── */}
                           {chainWizardStep === 3 && (
                               <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-3">
                                   <div className="p-4 rounded-xl border border-border-light dark:border-border-dark bg-input-light dark:bg-input-dark space-y-2">
                                       <div className="text-[9px] font-black uppercase tracking-widest text-textMuted-light dark:text-textMuted-dark mb-2">Chain Summary</div>
                                       {selectedPreset && <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full shrink-0" style={{background:selectedPreset.color}}/><span className="text-[10px] font-bold text-textMain-light dark:text-textMain-dark">{selectedPreset.name}</span></div>}
                                       {chainBase.character && <div className="flex items-center gap-2"><Icon name="Users" size={10} className="text-cyan-500"/><span className="text-[10px] text-textMain-light dark:text-textMain-dark">{chainBase.character}</span></div>}
                                       {chainBase.location && <div className="flex items-center gap-2"><Icon name="MapPin" size={10} className="text-cyan-500"/><span className="text-[10px] text-textMain-light dark:text-textMain-dark">{chainBase.location}</span></div>}
                                       {chainBase.subject && <div className="flex items-center gap-2"><Icon name="AlignLeft" size={10} className="text-cyan-500"/><span className="text-[10px] text-textMain-light dark:text-textMain-dark truncate">{chainBase.subject}</span></div>}
                                       <div className="flex flex-wrap gap-1 pt-1">
                                           {[chainBase.camera, chainBase.lens, chainBase.lighting, chainBase.movement].filter(Boolean).map(v => (
                                               <span key={v} className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-border-light dark:bg-border-dark text-textMuted-light dark:text-textMuted-dark">{v}</span>
                                           ))}
                                       </div>
                                   </div>
                               </div>
                           )}

                           {/* ── Footer ── */}
                           <div className="px-5 py-4 border-t border-border-light dark:border-border-dark shrink-0 space-y-2">
                               <div className="flex gap-2">
                                   {chainWizardStep > 1 && <button onClick={() => setChainWizardStep(p => p-1)} className="px-4 py-2.5 text-xs font-bold rounded-xl border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:bg-input-light dark:hover:bg-input-dark transition-all"><Icon name="ChevronDown" size={12} className="rotate-90 inline mr-1"/>Back</button>}
                                   {chainWizardStep < 3
                                       ? <button onClick={() => setChainWizardStep(p => p+1)} className="flex-1 py-2.5 text-xs font-black rounded-xl text-white transition-all flex items-center justify-center gap-2" style={{background:'rgb(6 182 212)'}}>
                                           Next <Icon name="ChevronDown" size={12} className="-rotate-90"/>
                                         </button>
                                       : <>
                                           {!chainMode && <button onClick={() => { setChainMode(true); addToast('Chain Mode ON ✓', 'success'); }} className="flex-1 py-2.5 text-xs font-black rounded-xl border border-cyan-500/40 text-cyan-500 bg-cyan-500/5 hover:bg-cyan-500/10 transition-all">Activate Only</button>}
                                           <button onClick={() => {
                                               if (!chainMode) setChainMode(true);
                                               const shot1 = buildChainShot1();
                                               if (!shot1) return;
                                               updateActiveShots(prev => { const without = prev.filter(s => !s._isChainShot1); return [shot1, ...without]; });
                                               setShowChainModal(false);
                                               addToast('Chain Mode ON — Shot 1 created ✓', 'success');
                                           }} className="flex-1 py-2.5 text-xs font-black rounded-xl text-white flex items-center justify-center gap-2 transition-all" style={{background:'rgb(6 182 212)'}}>
                                               <Icon name="Play" size={13}/>Start Sequence
                                           </button>
                                           {chainMode && shots.some(s => s._isChainShot1) && (
                                               <button onClick={() => { const shot1 = buildChainShot1(); if (!shot1) return; updateActiveShots(prev => prev.map(s => s._isChainShot1 ? shot1 : s)); setShowChainModal(false); addToast('Shot 1 updated ✓', 'success'); }} className="px-4 py-2.5 text-xs font-black rounded-xl border border-cyan-500/40 text-cyan-500 bg-cyan-500/5 hover:bg-cyan-500/10 transition-all flex items-center gap-1.5">
                                                   <Icon name="RotateCcw" size={12}/>Update
                                               </button>
                                           )}
                                       </>
                                   }
                               </div>
                               {chainMode && (
                                   <button onClick={() => { setChainMode(false); setChainPreset(null); setChainBase({subject:'',camera:'',lens:'',lighting:'',shotStyle:'',angle:'',filmStock:'',movement:'',actionSpeed:'',duration:'',transition:'',character:'',characterDesc:'',location:'',locationDesc:''}); setShowChainModal(false); addToast('Chain Mode deactivated','info'); }}
                                       className="w-full py-2 text-[10px] font-bold rounded-xl bg-red-500/5 border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all">
                                       Deactivate Chain Mode
                                   </button>
                               )}
                           </div>
                       </div>
                   </div>
                   );
               })()}

               {/* ── Continuity Lock Modal ── */}
               {showContinuityLock && (
                   <div className="settings-overlay" style={{zIndex:99998}} onClick={() => setShowContinuityLock(false)}>
                       <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-xl shadow-2xl p-5 max-w-sm w-full mx-4 animate-slide-up" onClick={e => e.stopPropagation()}>
                           <div className="flex items-center justify-between mb-4">
                               <div className="flex items-center gap-2">
                                   <Icon name="Lock" size={15} className="text-amber-500"/>
                                   <span className="text-sm font-black uppercase tracking-widest text-textMain-light dark:text-textMain-dark">Continuity Lock</span>
                               </div>
                               <button onClick={() => setShowContinuityLock(false)}><Icon name="X" size={16} className="text-textMuted-light dark:text-textMuted-dark"/></button>
                           </div>
                           <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark mb-4 leading-relaxed">Lock parameters across all shots. When you change a locked param, it auto-propagates to every unlocked shot in the scene.</p>
                           <div className="space-y-2 mb-4">
                               {LOCKABLE_PARAMS.map(({ key, label }) => {
                                   const isLocked = continuityLocks[key] !== undefined;
                                   const currentVal = selections[key] || shots[0]?.selections?.[key] || '';
                                   return (
                                       <div key={key} className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${isLocked ? 'bg-amber-500/5 border-amber-500/30' : 'bg-input-light dark:bg-input-dark border-border-light dark:border-border-dark'}`}>
                                           <div>
                                               <span className="text-[10px] font-bold text-textMain-light dark:text-textMain-dark">{label}</span>
                                               {isLocked && <span className="text-[9px] font-mono text-amber-500 ml-2">"{continuityLocks[key]}"</span>}
                                               {!isLocked && currentVal && <span className="text-[9px] font-mono text-textMuted-light dark:text-textMuted-dark ml-2">"{currentVal}"</span>}
                                           </div>
                                           <button onClick={() => {
                                               if (isLocked) {
                                                   setContinuityLocks(prev => { const n = {...prev}; delete n[key]; return n; });
                                               } else {
                                                   const val = currentVal || selections[key] || '';
                                                   setContinuityLocks(prev => ({ ...prev, [key]: val }));
                                                   if (val) updateActiveShots(prev => prev.map(s => s.locked ? s : { ...s, selections: { ...s.selections, [key]: val } }));
                                               }
                                           }} className={`text-[9px] font-black px-2.5 py-1 rounded-lg border transition-all ${isLocked ? 'bg-amber-500/10 border-amber-500/40 text-amber-500 hover:bg-amber-500/20' : 'bg-input-light dark:bg-border-dark border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:text-amber-500'}`}>
                                               {isLocked ? '🔒 Locked' : 'Lock'}
                                           </button>
                                       </div>
                                   );
                               })}
                           </div>
                           {Object.keys(continuityLocks).length > 0 && (
                               <button onClick={() => { setContinuityLocks({}); addToast('All continuity locks cleared', 'info'); }} className="w-full py-2 text-xs font-bold rounded-lg border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:text-red-500 hover:border-red-500/30 transition-all">
                                   Clear All Locks
                               </button>
                           )}
                       </div>
                   </div>
               )}

               {/* ── Shot Sequence Templates Modal ── */}
               {showSequenceTemplates && (
                   <div className="settings-overlay" style={{zIndex:99998}} onClick={() => setShowSequenceTemplates(false)}>
                       <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-xl shadow-2xl p-5 max-w-lg w-full mx-4 animate-slide-up max-h-[85vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
                           <div className="flex items-center justify-between mb-4">
                               <div className="flex items-center gap-2">
                                   <Icon name="ListVideo" size={15} className="text-primary"/>
                                   <span className="text-sm font-black uppercase tracking-widest text-textMain-light dark:text-textMain-dark">Shot Sequence Templates</span>
                               </div>
                               <button onClick={() => setShowSequenceTemplates(false)}><Icon name="X" size={16} className="text-textMuted-light dark:text-textMuted-dark"/></button>
                           </div>
                           <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark mb-4">Pre-built multi-shot sequences. Enter a base subject and click Load to add the full sequence to your scene.</p>
                           <div className="mb-4">
                               <label className="text-[10px] font-bold uppercase tracking-wider text-textMuted-light dark:text-textMuted-dark block mb-1">Base Subject (optional)</label>
                               <input id="seq-subject-input" defaultValue={subject} placeholder="e.g. A detective in a rainy alley" className="w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-primary/60"/>
                           </div>
                           <div className="space-y-3">
                               {SEQUENCE_TEMPLATES.map(tmpl => (
                                   <div key={tmpl.id} className="p-3 rounded-xl border border-border-light dark:border-border-dark bg-input-light dark:bg-input-dark hover:border-primary/40 transition-all">
                                       <div className="flex items-center justify-between mb-2">
                                           <div className="flex items-center gap-2">
                                               <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background: tmpl.color + '20', border: `1px solid ${tmpl.color}40`}}>
                                                   <Icon name={tmpl.icon} size={13} style={{color: tmpl.color}}/>
                                               </div>
                                               <div>
                                                   <div className="text-xs font-black text-textMain-light dark:text-textMain-dark">{tmpl.name}</div>
                                                   <div className="text-[9px] text-textMuted-light dark:text-textMuted-dark">{tmpl.shots.length} shots</div>
                                               </div>
                                           </div>
                                           <button onClick={() => {
                                               const inp = document.getElementById('seq-subject-input');
                                               loadSequenceTemplate(tmpl, inp?.value || subject);
                                           }} className="text-[10px] font-black px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-90" style={{background: tmpl.color}}>
                                               Load
                                           </button>
                                       </div>
                                       <p className="text-[9px] text-textMuted-light dark:text-textMuted-dark mb-2">{tmpl.desc}</p>
                                       <div className="flex flex-wrap gap-1">
                                           {tmpl.shots.map((s, idx) => (
                                               <span key={idx} className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark">
                                                   {idx+1}. {s.label}
                                               </span>
                                           ))}
                                       </div>
                                   </div>
                               ))}
                           </div>
                       </div>
                   </div>
               )}

               {/* Find & Replace Modal */}
               {showFindReplace && (                   <div className="settings-overlay" style={{zIndex:99998}} onClick={() => setShowFindReplace(false)}>
                       <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-xl shadow-2xl p-5 max-w-md w-full mx-4 animate-slide-up" onClick={e => e.stopPropagation()}>
                           <div className="flex items-center justify-between mb-4">
                               <div className="flex items-center gap-2">
                                   <Icon name="Edit2" size={15} className="text-primary" />
                                   <span className="text-sm font-black uppercase tracking-widest text-textMain-light dark:text-textMain-dark">Find &amp; Replace</span>
                               </div>
                               <button onClick={() => setShowFindReplace(false)} className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light"><Icon name="X" size={16}/></button>
                           </div>
                           <div className="space-y-3">
                               <div>
                                   <label className="text-[10px] font-bold uppercase tracking-wider text-textMuted-light dark:text-textMuted-dark block mb-1">Find</label>
                                   <input value={frFind} onChange={e => { setFrFind(e.target.value); setFrResults(null); }} placeholder="e.g. Golden Hour" className="w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-primary/60" />
                               </div>
                               <div>
                                   <label className="text-[10px] font-bold uppercase tracking-wider text-textMuted-light dark:text-textMuted-dark block mb-1">Replace with</label>
                                   <input value={frReplace} onChange={e => setFrReplace(e.target.value)} placeholder="e.g. Blue Hour" className="w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-primary/60" />
                               </div>
                               <div className="grid grid-cols-2 gap-3">
                                   <div>
                                       <label className="text-[10px] font-bold uppercase tracking-wider text-textMuted-light dark:text-textMuted-dark block mb-1">Scope</label>
                                       <select value={frScope} onChange={e => setFrScope(e.target.value)} className="w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-lg px-2 py-2 text-xs font-mono outline-none">
                                           <option value="scene">Active Scene</option>
                                           <option value="project">Active Project</option>
                                           <option value="all">All Projects</option>
                                       </select>
                                   </div>
                                   <div>
                                       <label className="text-[10px] font-bold uppercase tracking-wider text-textMuted-light dark:text-textMuted-dark block mb-1">Field</label>
                                       <select value={frField} onChange={e => setFrField(e.target.value)} className="w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-lg px-2 py-2 text-xs font-mono outline-none">
                                           <option value="any">Any Field</option>
                                           <option value="subject">Subject</option>
                                           <option value="lighting">Lighting</option>
                                           <option value="camera">Camera</option>
                                           <option value="lens">Lens</option>
                                           <option value="movement">Movement</option>
                                           <option value="shotStyle">Style</option>
                                           <option value="shotType">Shot Type</option>
                                       </select>
                                   </div>
                               </div>
                               {frResults !== null && (
                                   <div className={`text-[10px] font-bold px-3 py-2 rounded-lg border ${frResults > 0 ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-amber-500/10 border-amber-500/30 text-amber-500'}`}>
                                       {frResults > 0 ? `✓ Replaced ${frResults} occurrence${frResults > 1 ? 's' : ''}` : 'No matches found'}
                                   </div>
                               )}
                               <div className="flex gap-2 pt-1">
                                   <button onClick={() => setShowFindReplace(false)} className="flex-1 py-2 text-xs font-bold rounded-lg border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:bg-input-light dark:hover:bg-input-dark transition-all">Cancel</button>
                                   <button onClick={handleFindReplace} disabled={!frFind.trim()} className="flex-1 py-2 text-xs font-black rounded-lg text-black transition-all disabled:opacity-40" style={{background:'rgb(var(--color-primary))'}}>Replace All</button>
                               </div>
                           </div>
                       </div>
                   </div>
               )}

               {/* ContextMenuPortal — unified right-click menu system */}
               {ctxMenu && (() => {
                   const COLORS = ['red','amber','green','blue','purple','pink'];
                   const COLOR_HEX = { red:'#ef4444', amber:'#f59e0b', green:'#22c55e', blue:'#3b82f6', purple:'#a855f7', pink:'#ec4899' };
                   const TOP_DIRECTORS = ['kubrick','nolan','fincher','tarantino','lynch','scorsese','villeneuve','spielberg','james cameron','ryan coogler','zack snyder','charles emilson'];
                   const STATUSES = ['Planning','Ready','Rendering','Completed','Approved'];
                   const { type, data } = ctxMenu;

                   const Divider = () => <div className="my-1 border-t border-border-light dark:border-border-dark" />;
                   const MenuHeader = ({ text }) => (
                       <div className="px-3 py-1 text-[9px] font-black uppercase tracking-widest text-textMuted-light dark:text-textMuted-dark border-b border-border-light dark:border-border-dark mb-1">{text}</div>
                   );
                   const MenuItem = ({ icon, label, action, disabled, danger, badge, hasArrow, onMouseEnter, onMouseLeave }) => (
                       <button
                           role="menuitem" aria-disabled={disabled ? 'true' : undefined}
                           onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}
                           onClick={() => { if (!disabled) { action(); closeCtxMenu(); } }}
                           disabled={disabled}
                           className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium transition-colors text-left group
                               ${disabled ? 'opacity-30 cursor-not-allowed' : danger ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10' : 'text-textMain-light dark:text-textMain-dark hover:bg-input-light dark:hover:bg-input-dark'}`}>
                           <div className="flex items-center gap-2.5">
                               {icon && <Icon name={icon} size={13} className={danger ? 'text-red-500' : 'text-textMuted-light dark:text-textMuted-dark'} />}
                               <span>{label}</span>
                               {badge && <span className="text-[8px] px-1.5 py-0.5 rounded-full font-black bg-primary/10 text-primary">{badge}</span>}
                           </div>
                           {hasArrow && <Icon name="ChevronDown" size={10} className="rotate-[-90deg] text-textMuted-light dark:text-textMuted-dark" />}
                       </button>
                   );
                   const SubMenuWrapper = ({ submenuKey, trigger, children }) => (
                       <div className="relative"
                           onMouseEnter={() => setCtxSubmenu(submenuKey)}
                           onMouseLeave={() => setCtxSubmenu(null)}>
                           {trigger}
                           {ctxSubmenu === submenuKey && (
                               <div className="absolute left-full top-0 ml-1 bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-xl shadow-2xl py-1.5 w-44 z-[100000]">
                                   {children}
                               </div>
                           )}
                       </div>
                   );

                   const menuWidth = 220;
                   const menuLeft = Math.min(ctxMenu.x, window.innerWidth - menuWidth - 8);
                   const menuTop = Math.min(ctxMenu.y, window.innerHeight - 400);

                   // Dispatch to correct menu based on type
                   let menuContent = null;
                   if (type === 'shot') {
                       const i = data.shotIndex;
                       const s = shots[i];
                       if (!s) return null;
                       menuContent = (
                           <>
                               {/* Header */}
                               <div className="px-3 py-1.5 border-b border-border-light dark:border-border-dark mb-1 flex items-center justify-between">
                                   <span className="text-[9px] font-black uppercase tracking-widest text-textMuted-light dark:text-textMuted-dark">Shot {i + 1}</span>
                                   {s.colorTag && <span className="w-2.5 h-2.5 rounded-full" style={{background: COLOR_HEX[s.colorTag]}} />}
                               </div>

                               {/* Core actions */}
                               <MenuItem icon="Edit" label="Edit Shot" action={() => { if(!s.locked) handleEditShot(i); }} disabled={s.locked} />
                               <MenuItem icon="Copy" label="Duplicate" action={() => { if(!s.locked) handleDuplicateShot(i); }} disabled={s.locked} />
                               <MenuItem icon="Plus" label="Insert Above" action={() => insertBlankShot(i, 'above')} />
                               <MenuItem icon="Plus" label="Insert Below" action={() => insertBlankShot(i, 'below')} />

                               <Divider />

                               {/* Mode flip */}
                               <MenuItem icon={s.mode === 'image' ? 'Video' : 'Image'} label={`Switch to ${s.mode === 'image' ? 'Video' : 'Image'} Mode`} action={() => { flipShotMode(i); }} badge={s.mode === 'image' ? 'IMG→VID' : 'VID→IMG'} />

                               {/* Favorites */}
                               <MenuItem icon="Sparkles" label={isFavorite(s.id) ? 'Remove from Favorites' : 'Add to Favorites'} action={() => favoriteShotPrompt(i)} />

                               <Divider />

                               {/* Move to scene submenu */}
                               <SubMenuWrapper submenuKey="move" trigger={<MenuItem icon="Move" label="Move to Scene" hasArrow action={() => {}} />}>
                                   <MenuHeader text="Move to" />
                                   {scenes.filter(sc => sc.id !== activeSceneId).map(sc => (
                                       <button key={sc.id} onClick={() => { moveShotToScene(i, sc.id); closeCtxMenu(); }}
                                           className="w-full flex items-center gap-2 px-3 py-2 text-xs text-textMain-light dark:text-textMain-dark hover:bg-input-light dark:hover:bg-input-dark transition-colors text-left">
                                           <Icon name="Folder" size={11} className="text-textMuted-light dark:text-textMuted-dark shrink-0" />
                                           <span className="truncate">{sc.name}</span>
                                       </button>
                                   ))}
                                   {scenes.length <= 1 && <div className="px-3 py-2 text-[10px] text-textMuted-light dark:text-textMuted-dark">No other scenes</div>}
                               </SubMenuWrapper>

                               {/* Send to project submenu */}
                               <SubMenuWrapper submenuKey="send" trigger={<MenuItem icon="Share" label="Send to Project" hasArrow action={() => {}} />}>
                                   <MenuHeader text="Send to" />
                                   {projects.filter(p => p.id !== activeProjectId).map(p => (
                                       <button key={p.id} onClick={() => { sendShotToProject(i, p.id); closeCtxMenu(); }}
                                           className="w-full flex items-center gap-2 px-3 py-2 text-xs text-textMain-light dark:text-textMain-dark hover:bg-input-light dark:hover:bg-input-dark transition-colors text-left">
                                           <Icon name="Film" size={11} className="text-textMuted-light dark:text-textMuted-dark shrink-0" />
                                           <span className="truncate">{p.name}</span>
                                       </button>
                                   ))}
                                   {projects.length <= 1 && <div className="px-3 py-2 text-[10px] text-textMuted-light dark:text-textMuted-dark">No other projects</div>}
                               </SubMenuWrapper>

                               <Divider />

                               {/* Director style submenu */}
                               <SubMenuWrapper submenuKey="director" trigger={<MenuItem icon="Clapperboard" label="Apply Director Style" hasArrow action={() => {}} disabled={s.locked} />}>
                                   {!s.locked && (
                                       <>
                                           <MenuHeader text="Director" />
                                           {TOP_DIRECTORS.map(d => (
                                               <button key={d} onClick={() => { applyDirectorToShot(i, d); closeCtxMenu(); }}
                                                   className="w-full flex items-center gap-2 px-3 py-2 text-xs text-textMain-light dark:text-textMain-dark hover:bg-input-light dark:hover:bg-input-dark transition-colors capitalize text-left">
                                                   <Icon name="Aperture" size={11} className="text-primary shrink-0" />
                                                   {d.charAt(0).toUpperCase() + d.slice(1)}
                                               </button>
                                           ))}
                                       </>
                                   )}
                               </SubMenuWrapper>

                               {/* Color tag submenu */}
                               <SubMenuWrapper submenuKey="color" trigger={<MenuItem icon="Tag" label="Color Tag" hasArrow action={() => {}} />}>
                                   <div className="p-2.5">
                                       <div className="flex gap-2">
                                           {COLORS.map(c => (
                                               <button key={c} onClick={() => { colorTagShot(i, c); closeCtxMenu(); }}
                                                   className={`w-6 h-6 rounded-full transition-all hover:scale-125 ${s.colorTag === c ? 'ring-2 ring-offset-2 ring-offset-panel-light dark:ring-offset-panel-dark ring-white' : ''}`}
                                                   style={{background: COLOR_HEX[c]}} title={c} />
                                           ))}
                                           {s.colorTag && <button onClick={() => { colorTagShot(i, null); closeCtxMenu(); }}
                                               className="w-6 h-6 rounded-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark flex items-center justify-center hover:scale-125 transition-all" title="Remove tag">
                                               <Icon name="X" size={10} className="text-textMuted-light dark:text-textMuted-dark" />
                                           </button>}
                                       </div>
                                   </div>
                               </SubMenuWrapper>

                               <Divider />

                               {/* Utility */}
                               <MenuItem icon="Sparkles" label="Mutate Shot" action={() => { setShowMutations(i); }} />
                               <MenuItem icon="Clock" label="View History" action={() => { setShowHistoryFor(i); }} badge={shotHistory[s.id || `shot_${i}`]?.length || null} />
                               <MenuItem icon="Lock" label={s.locked ? 'Unlock Shot' : 'Lock Shot'} action={() => toggleShotLock(i)} />
                               <MenuItem icon="Clipboard" label="Copy Prompt" action={() => { fallbackCopy(getFinalPromptText(s), () => addToast('Prompt copied ✓', 'success')); }} />
                               <MenuItem icon="MessageSquare" label="Send to MOKHA Agent" action={() => { window.dispatchEvent(new CustomEvent('mokha:sendToAgent', { detail: { text: `Shot ${i+1}: ${getFinalPromptText(s)}`, label: 'shot prompt' } })); closeCtxMenu(); addToast('Sent to MOKHA Agent ✓', 'success'); }} />
                               <MenuItem icon="Zap" label="Copy Shotified Prompt" action={() => { const compressed = shotifyPrompt(s.subject, s.selections, s.sfx, s.bgm, s.dialogues, s.mode || 'video', videoPlatform, s.negativePrompt); fallbackCopy(compressed, () => addToast(`Shotified prompt copied (${videoPlatform}) ✓`, 'success')); }} />
                               <MenuItem icon="Copy" label="Copy Shot" action={() => { copiedShotRef.current = JSON.parse(JSON.stringify(s)); addToast('Shot copied ✓', 'success'); }} />

                               <Divider />

                               <MenuItem icon="Trash2" label="Delete Shot" action={() => { if(!s.locked) handleRemoveShot(i); }} disabled={s.locked} danger />
                           </>
                       );
                   } else if (type === 'scene') {
                       const sc = scenes.find(s => s.id === data.sceneId);
                       if (!sc) return null;
                       const scIdx = scenes.findIndex(s => s.id === data.sceneId);
                       const hasShots = (sc.shots || []).length > 0;
                       menuContent = (
                           <>
                               <div className="px-3 py-1.5 border-b border-border-light dark:border-border-dark mb-1">
                                   <span className="text-[9px] font-black uppercase tracking-widest text-textMuted-light dark:text-textMuted-dark truncate block">{sc.name}</span>
                               </div>
                               <MenuItem icon="Edit" label="Rename Scene" action={() => { const n = window.prompt('Rename scene:', sc.name); if (n && n.trim()) renameScene(data.sceneId, n.trim()); }} />
                               <MenuItem icon="Copy" label="Duplicate Scene" action={() => duplicateScene(data.sceneId)} />
                               <MenuItem icon="Plus" label="Add Scene After" action={() => addSceneAfter(data.sceneId)} />
                               <Divider />
                               <MenuItem icon="ArrowLeft" label="Move Scene Left" action={() => moveSceneLeft(data.sceneId)} disabled={scIdx === 0} />
                               <MenuItem icon="ArrowRight" label="Move Scene Right" action={() => moveSceneRight(data.sceneId)} disabled={scIdx === scenes.length - 1} />
                               <Divider />
                               <SubMenuWrapper submenuKey="scene-director" trigger={<MenuItem icon="Clapperboard" label="Apply Director Style to All" hasArrow action={() => {}} disabled={!hasShots} />}>
                                   <MenuHeader text="Director" />
                                   {TOP_DIRECTORS.map(d => (
                                       <button key={d} onClick={() => { applyDirectorToScene(data.sceneId, d); closeCtxMenu(); }}
                                           className="w-full flex items-center gap-2 px-3 py-2 text-xs text-textMain-light dark:text-textMain-dark hover:bg-input-light dark:hover:bg-input-dark transition-colors capitalize text-left">
                                           <Icon name="Aperture" size={11} className="text-primary shrink-0" />{d.charAt(0).toUpperCase() + d.slice(1)}
                                       </button>
                                   ))}
                               </SubMenuWrapper>
                               <MenuItem icon="Clipboard" label="Copy All Prompts" action={() => copyAllScenePrompts(data.sceneId)} disabled={!hasShots} />
                               <MenuItem icon="FileText" label="Export Scene as PDF" action={() => { setActiveSceneId(data.sceneId); setShowExportModal(true); }} disabled={!hasShots} />
                               <Divider />
                               <MenuItem icon="Trash2" label="Clear All Shots" action={() => { if (window.confirm(`Clear all shots from "${sc.name}"?`)) clearAllSceneShots(data.sceneId); }} disabled={!hasShots} danger />
                               <MenuItem icon="Trash2" label="Delete Scene" action={() => deleteScene(data.sceneId)} disabled={scenes.length <= 1} danger />
                           </>
                       );
                   } else if (type === 'project') {
                       const proj = projects.find(p => p.id === data.projectId);
                       if (!proj) return null;
                       const isActive = proj.id === activeProjectId;
                       menuContent = (
                           <>
                               <div className="px-3 py-1.5 border-b border-border-light dark:border-border-dark mb-1">
                                   <span className="text-[9px] font-black uppercase tracking-widest text-textMuted-light dark:text-textMuted-dark truncate block">{proj.name}</span>
                               </div>
                               <MenuItem icon="Edit" label="Rename Project" action={() => { const n = window.prompt('Rename project:', proj.name); if (n && n.trim()) updateProjectField(proj.id, 'name', n.trim()); }} />
                               <MenuItem icon="Copy" label="Duplicate Project" action={() => duplicateProject(proj.id)} />
                               <MenuItem icon="Folder" label="Set Active Project" action={() => { setActiveProjectId(proj.id); setCurrentView('editor'); }} disabled={isActive} />
                               <Divider />
                               <SubMenuWrapper submenuKey="proj-director" trigger={<MenuItem icon="Clapperboard" label="Apply Director Style to All" hasArrow action={() => {}} />}>
                                   <MenuHeader text="Director" />
                                   {TOP_DIRECTORS.map(d => (
                                       <button key={d} onClick={() => { applyDirectorToProject(proj.id, d); closeCtxMenu(); }}
                                           className="w-full flex items-center gap-2 px-3 py-2 text-xs text-textMain-light dark:text-textMain-dark hover:bg-input-light dark:hover:bg-input-dark transition-colors capitalize text-left">
                                           <Icon name="Aperture" size={11} className="text-primary shrink-0" />{d.charAt(0).toUpperCase() + d.slice(1)}
                                       </button>
                                   ))}
                               </SubMenuWrapper>
                               <MenuItem icon="Clipboard" label="Copy All Scene Prompts" action={() => copyAllProjectPrompts(proj.id)} />
                               <MenuItem icon="Link" label={isActive && chainMode ? 'Disable Chain Mode' : 'Enable Chain Mode'} action={() => setChainMode(p => !p)} disabled={!isActive} />
                               <Divider />
                               <MenuItem icon="Trash2" label="Delete Project" action={() => handleDeleteProject(proj.id)} disabled={projects.length <= 1} danger />
                           </>
                       );
                   } else if (type === 'filmstrip') {
                       const i = data.shotIndex;
                       const s = shots[i];
                       if (!s) return null;
                       menuContent = (
                           <>
                               <div className="px-3 py-1.5 border-b border-border-light dark:border-border-dark mb-1">
                                   <span className="text-[9px] font-black uppercase tracking-widest text-textMuted-light dark:text-textMuted-dark">Filmstrip · Shot {i + 1}</span>
                               </div>
                               <MenuItem icon="Target" label="Jump to Shot" action={() => { setEditingIndex(i); document.querySelectorAll('[data-shot-index]')[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} />
                               <MenuItem icon="Copy" label="Duplicate Shot" action={() => handleDuplicateShot(i)} />
                               <MenuItem icon="Clipboard" label="Copy Prompt" action={() => fallbackCopy(getFinalPromptText(s), () => addToast('Prompt copied ✓', 'success'))} />
                               <MenuItem icon="Zap" label="Copy Shotified Prompt" action={() => { const c = shotifyPrompt(s.subject, s.selections, s.sfx, s.bgm, s.dialogues, s.mode || 'video', videoPlatform, s.negativePrompt); fallbackCopy(c, () => addToast('Shotified prompt copied ✓', 'success')); }} />
                               <Divider />
                               <SubMenuWrapper submenuKey="fs-status" trigger={<MenuItem icon="Activity" label="Set Status" hasArrow action={() => {}} />}>
                                   <MenuHeader text="Status" />
                                   {STATUSES.map(st => (
                                       <button key={st} onClick={() => { updateActiveShots(prev => { const n=[...prev]; n[i]={...n[i],status:st}; return n; }); closeCtxMenu(); }}
                                           className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-input-light dark:hover:bg-input-dark transition-colors text-left ${s.status===st?'text-primary font-bold':'text-textMain-light dark:text-textMain-dark'}`}>
                                           {s.status===st && <Icon name="Check" size={10} className="text-primary shrink-0"/>}
                                           {st}
                                       </button>
                                   ))}
                               </SubMenuWrapper>
                               <SubMenuWrapper submenuKey="fs-color" trigger={<MenuItem icon="Tag" label="Color Tag" hasArrow action={() => {}} />}>
                                   <div className="p-2.5">
                                       <div className="flex gap-2 flex-wrap">
                                           {COLORS.map(c => (
                                               <button key={c} onClick={() => { colorTagShot(i, c); closeCtxMenu(); }}
                                                   className={`w-6 h-6 rounded-full transition-all hover:scale-125 ${s.colorTag===c?'ring-2 ring-offset-2 ring-offset-panel-light dark:ring-offset-panel-dark ring-white':''}`}
                                                   style={{background:COLOR_HEX[c]}} title={c} />
                                           ))}
                                           {s.colorTag && <button onClick={() => { colorTagShot(i, null); closeCtxMenu(); }} className="w-6 h-6 rounded-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark flex items-center justify-center hover:scale-125 transition-all"><Icon name="X" size={10} className="text-textMuted-light dark:text-textMuted-dark"/></button>}
                                       </div>
                                   </div>
                               </SubMenuWrapper>
                               <MenuItem icon="Lock" label={s.locked ? 'Unlock Shot' : 'Lock Shot'} action={() => toggleShotLock(i)} />
                               <Divider />
                               <MenuItem icon="Trash2" label="Delete Shot" action={() => handleRemoveShot(i)} disabled={s.locked} danger />
                           </>
                       );
                   } else if (type === 'favorite') {
                       const fav = favorites[data.favoriteIndex];
                       if (!fav) return null;
                       menuContent = (
                           <>
                               <div className="px-3 py-1.5 border-b border-border-light dark:border-border-dark mb-1">
                                   <span className="text-[9px] font-black uppercase tracking-widest text-textMuted-light dark:text-textMuted-dark truncate block">{fav.subject || 'Pinned Shot'}</span>
                               </div>
                               <MenuItem icon="Clipboard" label="Copy Prompt" action={() => fallbackCopy(fav.text || fav.subject || '', () => addToast('Prompt copied ✓', 'success'))} />
                               <MenuItem icon="Plus" label="Insert as New Shot" action={() => insertFavoriteAsShot(fav.id)} />
                               <MenuItem icon="Layers" label="Insert into All Scenes" action={() => insertFavoriteIntoAllScenes(fav.id)} />
                               <Divider />
                               <MenuItem icon="Edit" label="Rename Favorite" action={() => renameFavorite(fav.id)} />
                               <MenuItem icon="ArrowUp" label="Pin to Top" action={() => pinFavoriteToTop(data.favoriteIndex)} disabled={data.favoriteIndex === 0} />
                               <Divider />
                               <MenuItem icon="Trash2" label="Remove from Favorites" action={() => toggleFavorite(fav)} danger />
                           </>
                       );
                   } else if (type === 'history') {
                       const revs = shotHistory[data.shotId] || [];
                       const rev = [...revs].reverse()[data.revisionIndex];
                       if (!rev) return null;
                       menuContent = (
                           <>
                               <div className="px-3 py-1.5 border-b border-border-light dark:border-border-dark mb-1">
                                   <span className="text-[9px] font-black uppercase tracking-widest text-textMuted-light dark:text-textMuted-dark">Revision {data.revisionIndex + 1}</span>
                               </div>
                               <MenuItem icon="RotateCcw" label="Restore This Version" action={() => restoreHistoryRevision(data.shotId, data.revisionIndex)} />
                               <MenuItem icon="Copy" label="Duplicate as New Shot" action={() => duplicateHistoryAsShot(data.shotId, data.revisionIndex)} />
                               <MenuItem icon="Clipboard" label="Copy Prompt from This Version" action={() => fallbackCopy(getFinalPromptText(rev.snap), () => addToast('Prompt copied ✓', 'success'))} />
                               <Divider />
                               <MenuItem icon="Trash2" label="Delete This Revision" action={() => deleteHistoryRevision(data.shotId, data.revisionIndex)} danger />
                           </>
                       );
                   } else if (type === 'status-pill') {
                       const i = data.shotIndex;
                       const s = shots[i];
                       if (!s) return null;
                       menuContent = (
                           <>
                               <div className="px-3 py-1.5 border-b border-border-light dark:border-border-dark mb-1">
                                   <span className="text-[9px] font-black uppercase tracking-widest text-textMuted-light dark:text-textMuted-dark">Shot {i + 1} Status</span>
                               </div>
                               {STATUSES.map(st => (
                                   <MenuItem key={st} icon={s.status === st ? 'Check' : 'Circle'} label={st} action={() => { updateActiveShots(prev => { const n=[...prev]; n[i]={...n[i],status:st}; return n; }); }} disabled={s.locked} badge={s.status === st ? 'current' : null} />
                               ))}
                               <Divider />
                               <SubMenuWrapper submenuKey="status-scene" trigger={<MenuItem icon="Layers" label="Set All in Scene" hasArrow action={() => {}} disabled={s.locked} />}>
                                   <MenuHeader text="Set all in scene" />
                                   {STATUSES.map(st => (
                                       <button key={st} onClick={() => { setAllShotsStatus('scene', st); closeCtxMenu(); }}
                                           className="w-full flex items-center gap-2 px-3 py-2 text-xs text-textMain-light dark:text-textMain-dark hover:bg-input-light dark:hover:bg-input-dark transition-colors text-left">
                                           {st}
                                       </button>
                                   ))}
                               </SubMenuWrapper>
                               <SubMenuWrapper submenuKey="status-project" trigger={<MenuItem icon="Folder" label="Set All in Project" hasArrow action={() => {}} disabled={s.locked} />}>
                                   <MenuHeader text="Set all in project" />
                                   {STATUSES.map(st => (
                                       <button key={st} onClick={() => { setAllShotsStatus('project', st); closeCtxMenu(); }}
                                           className="w-full flex items-center gap-2 px-3 py-2 text-xs text-textMain-light dark:text-textMain-dark hover:bg-input-light dark:hover:bg-input-dark transition-colors text-left">
                                           {st}
                                       </button>
                                   ))}
                               </SubMenuWrapper>
                           </>
                       );
                   } else if (type === 'color-tag') {
                       const i = data.shotIndex;
                       const s = shots[i];
                       if (!s) return null;
                       menuContent = (
                           <>
                               <div className="px-3 py-1.5 border-b border-border-light dark:border-border-dark mb-1">
                                   <span className="text-[9px] font-black uppercase tracking-widest text-textMuted-light dark:text-textMuted-dark">Shot {i + 1} Color Tag</span>
                               </div>
                               <div className="px-3 py-2">
                                   <div className="flex gap-2">
                                       {COLORS.map(c => (
                                           <button key={c} onClick={() => { if (!s.locked) { colorTagShot(i, c); closeCtxMenu(); } }}
                                               className={`w-6 h-6 rounded-full transition-all ${s.locked ? 'opacity-30 cursor-not-allowed' : 'hover:scale-125'} ${s.colorTag===c?'ring-2 ring-offset-2 ring-offset-panel-light dark:ring-offset-panel-dark ring-white':''}`}
                                               style={{background:COLOR_HEX[c]}} title={c} />
                                       ))}
                                   </div>
                               </div>
                               <MenuItem icon="X" label="Remove Tag" action={() => colorTagShot(i, null)} disabled={!s.colorTag || s.locked} />
                               <Divider />
                               <SubMenuWrapper submenuKey="tag-scene" trigger={<MenuItem icon="Layers" label="Tag All in Scene" hasArrow action={() => {}} disabled={s.locked} />}>
                                   <div className="p-2.5">
                                       <div className="flex gap-2">
                                           {COLORS.map(c => (
                                               <button key={c} onClick={() => { setAllShotsColorTag('scene', c); closeCtxMenu(); }}
                                                   className="w-6 h-6 rounded-full transition-all hover:scale-125" style={{background:COLOR_HEX[c]}} title={c} />
                                           ))}
                                       </div>
                                   </div>
                               </SubMenuWrapper>
                               <MenuItem icon="Trash2" label="Clear All Tags in Scene" action={() => clearAllColorTags('scene')} disabled={s.locked} />
                           </>
                       );
                   } else if (type === 'prompt-output') {
                       const selectedText = window.getSelection()?.toString() || '';
                       const fullScript = getActiveSceneScript ? getActiveSceneScript() : scenes.map(sc => `=== ${sc.name} ===\n\n${(sc.shots||[]).map((sh,i)=>`Shot ${i+1}:\n${getFinalPromptText(sh)}`).join('\n\n')}`).join('\n\n\n');
                       menuContent = (
                           <>
                               <div className="px-3 py-1.5 border-b border-border-light dark:border-border-dark mb-1">
                                   <span className="text-[9px] font-black uppercase tracking-widest text-textMuted-light dark:text-textMuted-dark">Prompt Output</span>
                               </div>
                               <MenuItem icon="Clipboard" label="Copy Full Script" action={() => fallbackCopy(fullScript, () => addToast('Script copied ✓', 'success'))} />
                               <MenuItem icon="Clipboard" label="Copy Selected Text" action={() => fallbackCopy(selectedText, () => addToast('Selection copied ✓', 'success'))} disabled={!selectedText} />
                               <MenuItem icon="Zap" label="Copy as Shotified" action={() => { const t = shots.map((sh,i)=>`Shot ${i+1}: ${shotifyPrompt(sh.subject,sh.selections,sh.sfx,sh.bgm,sh.dialogues,sh.mode||'video',videoPlatform,sh.negativePrompt)}`).join('\n\n'); fallbackCopy(t, () => addToast('Shotified script copied ✓', 'success')); }} />
                               <Divider />
                               <MenuItem icon="FileText" label="Export as PDF" action={() => setShowExportModal(true)} />
                               <MenuItem icon="MessageSquare" label="Send to MOKHA Agent" action={() => { window.dispatchEvent(new CustomEvent('mokha:sendToAgent', { detail: { text: fullScript.substring(0, 800), label: 'scene script' } })); closeCtxMenu(); addToast('Sent to MOKHA Agent ✓', 'success'); }} />
                               <Divider />
                               <SubMenuWrapper submenuKey="output-director" trigger={<MenuItem icon="Clapperboard" label="Regenerate with Director Style" hasArrow action={() => {}} />}>
                                   <MenuHeader text="Director" />
                                   {TOP_DIRECTORS.map(d => (
                                       <button key={d} onClick={() => { applyDirectorToScene(activeSceneId, d); closeCtxMenu(); }}
                                           className="w-full flex items-center gap-2 px-3 py-2 text-xs text-textMain-light dark:text-textMain-dark hover:bg-input-light dark:hover:bg-input-dark transition-colors capitalize text-left">
                                           <Icon name="Aperture" size={11} className="text-primary shrink-0"/>{d.charAt(0).toUpperCase()+d.slice(1)}
                                       </button>
                                   ))}
                               </SubMenuWrapper>
                               <MenuItem icon="Zap" label={shotifyMode ? 'Disable Shotify Mode' : 'Enable Shotify Mode'} action={() => setShotifyMode(p => !p)} />
                           </>
                       );
                   } else if (type === 'preset') {
                       const { preset } = data;
                       if (!preset) return null;
                       const presetSelections = JSON.stringify(preset.selections || {}, null, 2);
                       menuContent = (
                           <>
                               <div className="px-3 py-1.5 border-b border-border-light dark:border-border-dark mb-1 flex items-center gap-2">
                                   <Icon name={preset.icon || 'Camera'} size={11} className="text-primary shrink-0"/>
                                   <span className="text-[9px] font-black uppercase tracking-widest text-textMuted-light dark:text-textMuted-dark truncate">{preset.name}</span>
                                   {preset.isPro && <span className="text-[7px] font-black px-1 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">PRO</span>}
                                   {preset.isDesigner && <span className="text-[7px] font-black px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">DESIGN</span>}
                               </div>
                               {/* Apply to current shot */}
                               <MenuItem icon="Wand2" label="Apply to Current Shot" action={() => { handlePresetClick(preset); closeCtxMenu(); addToast(`${preset.name} applied ✓`, 'success'); }} />
                               {/* Add as new shot */}
                               <MenuItem icon="Plus" label="Add as New Shot" action={() => {
                                   const newShot = { id: `shot_${Date.now()}`, subject: '', selections: { ...preset.selections, aspectRatio: '--ar 16:9' }, sfx: '', bgm: '', dialogues: [], mode: 'video', tags: [], status: 'Planning' };
                                   updateActiveShots(prev => [...prev, newShot]);
                                   closeCtxMenu();
                                   addToast(`${preset.name} added as new shot ✓`, 'success');
                               }} />
                               {/* Apply to all shots in scene */}
                               <MenuItem icon="Layers" label="Apply to All Shots in Scene" action={() => {
                                   updateActiveShots(prev => prev.map(sh => ({ ...sh, selections: { ...sh.selections, ...preset.selections } })));
                                   closeCtxMenu();
                                   addToast(`${preset.name} applied to all shots ✓`, 'success');
                               }} disabled={shots.length === 0} />
                               <Divider />
                               {/* Send to agent */}
                               <MenuItem icon="MessageSquare" label="Ask Agent About This Preset" action={() => {
                                   window.dispatchEvent(new CustomEvent('mokha:sendToAgent', { detail: { text: `Tell me about the "${preset.name}" preset and when to use it cinematically.\n\nSettings: ${presetSelections}`, label: 'preset' } }));
                                   closeCtxMenu();
                                   addToast('Sent to MOKHA Agent ✓', 'success');
                               }} />
                               {/* Copy settings */}
                               <MenuItem icon="Clipboard" label="Copy Preset Settings" action={() => { fallbackCopy(presetSelections, () => addToast('Preset settings copied ✓', 'success')); }} />
                               {/* Save as custom preset (if not already custom) */}
                               {!preset.id && (
                                   <>
                                       <Divider />
                                       <MenuItem icon="Save" label="Save as Custom Preset" action={() => {
                                           const name = window.prompt('Name for this custom preset:', preset.name + ' (Custom)');
                                           if (!name?.trim()) return;
                                           const custom = { id: `custom_${Date.now()}`, name: name.trim(), icon: preset.icon || 'Camera', category: preset.category || 'Custom', selections: { ...preset.selections } };
                                           setCustomPresets(prev => [...prev, custom]);
                                           closeCtxMenu();
                                           addToast(`"${name.trim()}" saved as custom preset ✓`, 'success');
                                       }} />
                                   </>
                               )}
                               {/* Delete if custom */}
                               {preset.id && (
                                   <>
                                       <Divider />
                                       <MenuItem icon="Trash2" label="Delete Custom Preset" action={() => { deleteCustomPreset(null, preset.id); closeCtxMenu(); }} danger />
                                   </>
                               )}
                           </>
                       );
                   } else if (type === 'agent-message') {
                       const selectedText = window.getSelection()?.toString() || '';
                       menuContent = (
                           <>
                               <div className="px-3 py-1.5 border-b border-border-light dark:border-border-dark mb-1">
                                   <span className="text-[9px] font-black uppercase tracking-widest text-textMuted-light dark:text-textMuted-dark">{data.role === 'user' ? 'Your Message' : 'Agent Message'}</span>
                               </div>
                               <MenuItem icon="Clipboard" label="Copy Message" action={() => fallbackCopy(data.text || '', () => addToast('Message copied ✓', 'success'))} />
                               <MenuItem icon="Clipboard" label="Copy Selected Text" action={() => fallbackCopy(selectedText, () => addToast('Selection copied ✓', 'success'))} disabled={!selectedText} />
                               <Divider />
                               <MenuItem icon="Edit" label="Use as Shot Subject" action={() => { setSubject(data.text || ''); addToast('Set as shot subject ✓', 'success'); }} />
                               <MenuItem icon="Plus" label="Insert as New Shot" action={() => { const ns={id:`shot_${Date.now()}`,subject:data.text||'',selections:{aspectRatio:'--ar 16:9'},sfx:'',bgm:'',dialogues:[],mode:'video',tags:[]}; updateActiveShots(prev=>[...prev,ns]); addToast('Inserted as new shot ✓','success'); }} />
                               <MenuItem icon="RotateCcw" label="Re-send to Agent" action={() => { if (data.onResend) data.onResend(data.text); }} disabled={data.role !== 'user'} />
                               {data.role === 'assistant' && data.suggestion && (
                                   <>
                                       <Divider />
                                       <MenuItem icon="Sparkles" label="Apply Suggestion" action={() => { if (data.suggestion) data.suggestion(); addToast('Suggestion applied ✓', 'success'); }} />
                                   </>
                               )}
                               <Divider />
                               <MenuItem icon="Trash2" label="Delete Message" action={() => { if (data.onDelete) data.onDelete(data.messageIndex); }} danger />
                           </>
                       );
                   } else if (type === 'parameter-field') {
                       const { shotIndex, fieldKey, fieldValue } = data;
                       menuContent = (
                           <>
                               <div className="px-3 py-1.5 border-b border-border-light dark:border-border-dark mb-1">
                                   <span className="text-[9px] font-black uppercase tracking-widest text-textMuted-light dark:text-textMuted-dark truncate block">{fieldKey}</span>
                               </div>
                               <MenuItem icon="Clipboard" label="Copy Value" action={() => fallbackCopy(String(fieldValue || ''), () => addToast('Value copied ✓', 'success'))} disabled={!fieldValue} />
                               <MenuItem icon="RotateCcw" label="Reset to Default" action={() => { updateActiveShots(prev => { const n=[...prev]; n[shotIndex]={...n[shotIndex],selections:{...n[shotIndex].selections,[fieldKey]:''}}; return n; }); addToast('Reset to default ✓','success'); }} />
                               <Divider />
                               <MenuItem icon="Layers" label="Apply to All Shots in Scene" action={() => applyParamToAllShots('scene', fieldKey, fieldValue)} disabled={!fieldValue} />
                               <MenuItem icon="Folder" label="Apply to All Shots in Project" action={() => applyParamToAllShots('project', fieldKey, fieldValue)} disabled={!fieldValue} />
                               {chainMode && <MenuItem icon="Link" label="Sync via Chain Mode" action={() => applyParamToAllShots('scene', fieldKey, fieldValue)} disabled={!fieldValue} />}
                               {(() => {
                                   const PARAM_SUGGESTIONS = {
                                       aperture: ['f/1.4','f/1.8','f/2.8','f/4','f/5.6','f/8','f/11'],
                                       lighting: ['golden hour','soft box','neon','candlelight','overcast','harsh sunlight','practical lights'],
                                       cameraMovement: ['static','slow push in','dolly zoom','handheld','crane up','tracking shot','whip pan'],
                                       lens: ['24mm','35mm','50mm','85mm','135mm','200mm','fisheye'],
                                       colorGrading: ['teal and orange','desaturated','high contrast','warm vintage','cold blue','bleach bypass','vibrant'],
                                       mood: ['tense','melancholic','euphoric','mysterious','romantic','ominous','playful'],
                                   };
                                   const suggestions = PARAM_SUGGESTIONS[fieldKey];
                                   if (!suggestions) return null;
                                   return (
                                       <>
                                           <Divider />
                                           <SubMenuWrapper submenuKey="param-suggest" trigger={<MenuItem icon="Lightbulb" label="Suggest Values" hasArrow action={() => {}} />}>
                                               <MenuHeader text="Presets" />
                                               {suggestions.map(v => (
                                                   <button key={v} onClick={() => { updateActiveShots(prev => { const n=[...prev]; n[shotIndex]={...n[shotIndex],selections:{...n[shotIndex].selections,[fieldKey]:v}}; return n; }); addToast(`${fieldKey} set to "${v}" ✓`,'success'); closeCtxMenu(); }}
                                                       className="w-full flex items-center gap-2 px-3 py-2 text-xs text-textMain-light dark:text-textMain-dark hover:bg-input-light dark:hover:bg-input-dark transition-colors text-left">
                                                       {v}
                                                   </button>
                                               ))}
                                           </SubMenuWrapper>
                                       </>
                                   );
                               })()}
                           </>
                       );
                   } else if (type === 'canvas') {
                       menuContent = (
                           <>
                               <div className="px-3 py-1.5 border-b border-border-light dark:border-border-dark mb-1">
                                   <span className="text-[9px] font-black uppercase tracking-widest text-textMuted-light dark:text-textMuted-dark">Workspace</span>
                               </div>
                               <MenuItem icon="Plus" label="Add New Shot" action={() => { const blank={id:`shot_${Date.now()}`,subject:'',selections:{aspectRatio:'--ar 16:9',aperture:'f/2.8'},sfx:'',bgm:'',dialogues:[],mode:'video',tags:[]}; updateActiveShots(prev=>[...prev,blank]); addToast('New shot added ✓','success'); }} />
                               <MenuItem icon="Clipboard" label="Paste Shot" action={() => { if (copiedShotRef.current) { const ns={...JSON.parse(JSON.stringify(copiedShotRef.current)),id:`shot_${Date.now()}`}; updateActiveShots(prev=>[...prev,ns]); addToast('Shot pasted ✓','success'); } }} disabled={!copiedShotRef.current} />
                               <MenuItem icon="Plus" label="Add Scene" action={() => { const ns={id:`scene_${Date.now()}`,name:`Scene ${scenes.length+1}`,shots:[]}; updateActiveProjectScenes(prev=>[...prev,ns]); addToast('New scene added ✓','success'); }} />
                               <Divider />
                               <MenuItem icon="CheckSquare" label="Select All Shots" action={() => setSelectedShots(shots.map((_,i)=>i))} disabled={shots.length === 0} />
                               <MenuItem icon="Square" label="Deselect All" action={() => setSelectedShots([])} disabled={selectedShots.length === 0} />
                               <Divider />
                               <SubMenuWrapper submenuKey="canvas-sort" trigger={<MenuItem icon="ArrowUpDown" label="Sort Shots" hasArrow action={() => {}} disabled={shots.length < 2} />}>
                                   <MenuHeader text="Sort by" />
                                   {[['status','By Status'],['colorTag','By Color Tag'],['durationAsc','By Duration (Asc)'],['durationDesc','By Duration (Desc)']].map(([k,l]) => (
                                       <button key={k} onClick={() => { sortShots(k); closeCtxMenu(); }}
                                           className="w-full flex items-center gap-2 px-3 py-2 text-xs text-textMain-light dark:text-textMain-dark hover:bg-input-light dark:hover:bg-input-dark transition-colors text-left">
                                           {l}
                                       </button>
                                   ))}
                               </SubMenuWrapper>
                               <Divider />
                               <MenuItem icon="Activity" label="Analyze Scene Rhythm" action={() => setShowRhythm(true)} />
                               <MenuItem icon="Dna" label="Detect Genre DNA" action={() => setShowGenreDNA(true)} />
                               <MenuItem icon="Focus" label="Toggle Focus Mode" action={() => setIsFocusMode(p => !p)} />
                               <MenuItem icon="Command" label="Open Command Palette" action={() => setShowCommandPalette && setShowCommandPalette(true)} />
                           </>
                       );
                   } else if (type === 'dialogue') {
                       const { index } = data;
                       if (index === undefined || !dialogues[index]) return null;
                       const d = dialogues[index];
                       menuContent = (
                           <>
                               <div className="px-3 py-1.5 border-b border-border-light dark:border-border-dark mb-1">
                                   <span className="text-[9px] font-black uppercase tracking-widest text-textMuted-light dark:text-textMuted-dark">Dialogue</span>
                               </div>
                               <MenuItem icon="Copy" label="Copy Text" action={() => copyDialogueText(index)} />
                               <MenuItem icon="Copy" label="Copy Full" action={() => copyFullDialogue(index)} />
                               <MenuItem icon="Duplicate" label="Duplicate" action={() => duplicateDialogue(index)} />
                               <MenuItem icon="Edit" label="Edit" action={() => {}} />
                               <MenuItem icon="ArrowUp" label="Move Up" action={() => moveDialogueUp(index)} disabled={index === 0} />
                               <MenuItem icon="ArrowDown" label="Move Down" action={() => moveDialogueDown(index)} disabled={index === dialogues.length - 1} />
                               <MenuItem icon="Star" label="Add to Favorites" action={() => addDialogueToFavorites(index)} />
                               <Divider />
                               <MenuItem icon="Zap" label="Apply to All Scenes" action={() => applyDialogueToAllScenes(index)} disabled={scenes.length <= 1} />
                               <SubMenuWrapper submenuKey="dialogue-mood" trigger={<MenuItem icon="Smile" label="Change Mood" hasArrow action={() => {}} />}>
                                   <MenuHeader text="Mood" />
                                   {OPTIONS.dialogueMoods.map(mood => (
                                       <button key={mood} onClick={() => { changeDialogueMood(index, mood); closeCtxMenu(); }}
                                           className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors text-left ${d.mood === mood ? 'bg-primary/10 text-primary font-bold' : 'text-textMain-light dark:text-textMain-dark hover:bg-input-light dark:hover:bg-input-dark'}`}>
                                           {mood}
                                       </button>
                                   ))}
                               </SubMenuWrapper>
                               <SubMenuWrapper submenuKey="dialogue-voice" trigger={<MenuItem icon="Volume2" label="Change Voice" hasArrow action={() => {}} />}>
                                   <MenuHeader text="Voice Style" />
                                   {globalVoiceStyles.length > 0 && (
                                       <>
                                           <MenuHeader text="My Voices" />
                                           {globalVoiceStyles.map(v => (
                                               <button key={v.id} onClick={() => { changeDialogueVoiceStyle(index, v.name); closeCtxMenu(); }}
                                                   className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors text-left ${d.voiceStyle === v.name ? 'bg-primary/10 text-primary font-bold' : 'text-textMain-light dark:text-textMain-dark hover:bg-input-light dark:hover:bg-input-dark'}`}>
                                                   {v.name}
                                               </button>
                                           ))}
                                       </>
                                   )}
                                   <MenuHeader text="Presets" />
                                   {OPTIONS.defaultVoiceStyles.map(v => (
                                       <button key={v} onClick={() => { changeDialogueVoiceStyle(index, v); closeCtxMenu(); }}
                                           className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors text-left ${d.voiceStyle === v ? 'bg-primary/10 text-primary font-bold' : 'text-textMain-light dark:text-textMain-dark hover:bg-input-light dark:hover:bg-input-dark'}`}>
                                           {v}
                                       </button>
                                   ))}
                               </SubMenuWrapper>
                               <Divider />
                               <MenuItem icon="Trash2" label="Delete" action={() => handleRemoveDialogue(index)} danger />
                           </>
                       );
                   } else if (type === 'character') {
                       const { index, characterName } = data;
                       if (!characterName) return null;
                       const isInLibrary = globalCharacters.some(c => c.name === characterName);
                       menuContent = (
                           <>
                               <div className="px-3 py-1.5 border-b border-border-light dark:border-border-dark mb-1">
                                   <span className="text-[9px] font-black uppercase tracking-widest text-textMuted-light dark:text-textMuted-dark">{characterName}</span>
                               </div>
                               <MenuItem icon="Copy" label="Copy Name" action={() => copyCharacterName(characterName)} />
                               <MenuItem icon="Plus" label="Add to Library" action={() => addCharacterToLibrary(characterName)} disabled={isInLibrary} />
                               <Divider />
                               <MenuItem icon="Edit" label="Rename" action={() => {}} />
                               <MenuItem icon="Search" label="Find All" action={() => findAllCharacterInstances(characterName)} />
                               <Divider />
                               <MenuItem icon="Trash2" label="Delete from Dialogues" action={() => deleteCharacterFromDialogues(characterName)} danger />
                           </>
                       );
                   } else if (type === 'scene') {
                       const { sceneId } = data;
                       const scene = scenes.find(s => s.id === sceneId);
                       if (!scene) return null;
                       const sceneIndex = scenes.findIndex(s => s.id === sceneId);
                       menuContent = (
                           <>
                               <div className="px-3 py-1.5 border-b border-border-light dark:border-border-dark mb-1">
                                   <span className="text-[9px] font-black uppercase tracking-widest text-textMuted-light dark:text-textMuted-dark">Scene</span>
                               </div>
                               <MenuItem icon="Copy" label="Copy Name" action={() => { navigator.clipboard.writeText(scene.name); addToast('✓ Scene name copied', 'success'); closeCtxMenu(); }} />
                               <MenuItem icon="Duplicate" label="Duplicate" action={() => { duplicateScene(sceneId); closeCtxMenu(); }} />
                               <MenuItem icon="Plus" label="Add Before" action={() => { const newScene = { id: Date.now(), name: `Scene ${sceneIndex + 1}`, shots: [] }; updateActiveProjectScenes(prev => { const newScenes = [...prev]; newScenes.splice(sceneIndex, 0, newScene); return newScenes; }); setActiveSceneId(newScene.id); addToast('✓ Scene added before', 'success'); closeCtxMenu(); }} />
                               <MenuItem icon="Plus" label="Add After" action={() => { addSceneAfter(sceneId); closeCtxMenu(); }} />
                               <MenuItem icon="ArrowUp" label="Move Up" action={() => { if (sceneIndex > 0) { updateActiveProjectScenes(prev => { const newScenes = [...prev]; [newScenes[sceneIndex - 1], newScenes[sceneIndex]] = [newScenes[sceneIndex], newScenes[sceneIndex - 1]]; return newScenes; }); addToast('✓ Scene moved up', 'success'); } closeCtxMenu(); }} disabled={sceneIndex === 0} />
                               <MenuItem icon="ArrowDown" label="Move Down" action={() => { if (sceneIndex < scenes.length - 1) { updateActiveProjectScenes(prev => { const newScenes = [...prev]; [newScenes[sceneIndex], newScenes[sceneIndex + 1]] = [newScenes[sceneIndex + 1], newScenes[sceneIndex]]; return newScenes; }); addToast('✓ Scene moved down', 'success'); } closeCtxMenu(); }} disabled={sceneIndex === scenes.length - 1} />
                               <MenuItem icon="Edit" label="Rename" action={() => { const newName = prompt('Enter new scene name:', scene.name); if (newName) { renameScene(sceneId, newName); addToast('✓ Scene renamed', 'success'); } closeCtxMenu(); }} />
                               <Divider />
                               <MenuItem icon="Trash2" label="Delete" action={() => { deleteScene(sceneId); closeCtxMenu(); }} danger disabled={scenes.length <= 1} />
                           </>
                       );
                   } else if (type === 'action') {
                       const { actionText } = data;
                       menuContent = (
                           <>
                               <div className="px-3 py-1.5 border-b border-border-light dark:border-border-dark mb-1">
                                   <span className="text-[9px] font-black uppercase tracking-widest text-textMuted-light dark:text-textMuted-dark">Action</span>
                               </div>
                               <MenuItem icon="Copy" label="Copy" action={() => { navigator.clipboard.writeText(actionText); addToast('✓ Action copied', 'success'); closeCtxMenu(); }} />
                               <MenuItem icon="Wand2" label="Enhance" action={() => { const enhanced = `${actionText}, cinematic, highly detailed, dramatic lighting`; setSubject(enhanced); addToast('✓ Action enhanced', 'success'); closeCtxMenu(); }} />
                               <MenuItem icon="Sparkles" label="Make Cinematic" action={() => { const cinematic = `${actionText} — shot with dramatic lighting, volumetric rays, 8k resolution`; setSubject(cinematic); addToast('✓ Made cinematic', 'success'); closeCtxMenu(); }} />
                               <Divider />
                               <MenuItem icon="Trash2" label="Clear" action={() => { setSubject(''); addToast('✓ Action cleared', 'success'); closeCtxMenu(); }} danger />
                           </>
                       );
                   }

                   if (!menuContent) return null;

                   return (
                       <div className="fixed z-[99999] animate-fade-in" style={{ left: menuLeft, top: menuTop }}
                           role="menu" onClick={e => e.stopPropagation()}>
                           <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-xl shadow-2xl py-1.5 w-52 overflow-visible">
                               {menuContent}
                           </div>
                       </div>
                   );
               })()}

               {/* Shot Rhythm Analyzer */}
               {showRhythm && (() => {
                   const data = getRhythmData();
                   return (
                       <div className="settings-overlay" style={{zIndex:99998}} onClick={() => setShowRhythm(false)}>
                           <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-xl shadow-2xl p-5 max-w-md w-full mx-4 animate-slide-up" onClick={e => e.stopPropagation()}>
                               <div className="flex items-center justify-between mb-4">
                                   <div className="flex items-center gap-2"><Icon name="Activity" size={15} className="text-cyan-500"/><span className="text-sm font-black uppercase tracking-widest text-textMain-light dark:text-textMain-dark">Shot Rhythm</span></div>
                                   <button onClick={() => setShowRhythm(false)}><Icon name="X" size={16} className="text-textMuted-light dark:text-textMuted-dark"/></button>
                               </div>
                               {!data ? <p className="text-xs text-textMuted-light dark:text-textMuted-dark">No shots in this scene.</p> : (
                                   <>
                                       <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark">
                                           <div className="text-2xl font-black" style={{color: data.scoreColor}}>{data.score}</div>
                                           <div className="text-[10px] text-textMuted-light dark:text-textMuted-dark">Avg duration: <span className="font-mono font-bold text-textMain-light dark:text-textMain-dark">{data.avg}s</span></div>
                                       </div>
                                       <div className="flex items-end gap-1 h-16 mb-3">
                                           {data.durations.map((d, i) => {
                                               const maxD = Math.max(...data.durations, 1);
                                               const h = Math.max(8, (d / maxD) * 56);
                                               const isFlat = data.monotonousRuns.some(r => i >= r.start && i < r.start + r.len);
                                               return <div key={i} title={`Shot ${i+1}: ${d}s`} style={{height:`${h}px`, background: isFlat ? '#f59e0b' : 'rgb(var(--color-primary))', flex:1, borderRadius:'3px 3px 0 0', opacity: 0.85}} />;
                                           })}
                                       </div>
                                       <div className="text-[9px] text-textMuted-light dark:text-textMuted-dark mb-3">Bar height = duration. <span className="text-amber-500 font-bold">Amber = monotonous run (3+ same duration)</span></div>
                                       {data.monotonousRuns.length > 0 && (
                                           <div className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-lg px-3 py-2 font-bold">
                                               ⚠ {data.monotonousRuns.length} monotonous run{data.monotonousRuns.length > 1 ? 's' : ''} detected — vary shot durations for better pacing
                                           </div>
                                       )}
                                   </>
                               )}
                           </div>
                       </div>
                   );
               })()}

               {/* Genre DNA Detector */}
               {showGenreDNA && (() => {
                   const dna = getGenreDNA();
                   const GENRE_COLORS = { Noir:'#6b7280', Thriller:'#ef4444', 'Sci-Fi':'#06b6d4', Fantasy:'#a855f7', Drama:'#f59e0b', Action:'#f97316', Horror:'#dc2626', Romance:'#ec4899' };
                   return (
                       <div className="settings-overlay" style={{zIndex:99998}} onClick={() => setShowGenreDNA(false)}>
                           <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-xl shadow-2xl p-5 max-w-sm w-full mx-4 animate-slide-up" onClick={e => e.stopPropagation()}>
                               <div className="flex items-center justify-between mb-4">
                                   <div className="flex items-center gap-2"><Icon name="Aperture" size={15} className="text-purple-500"/><span className="text-sm font-black uppercase tracking-widest text-textMain-light dark:text-textMain-dark">Genre DNA</span></div>
                                   <button onClick={() => setShowGenreDNA(false)}><Icon name="X" size={16} className="text-textMuted-light dark:text-textMuted-dark"/></button>
                               </div>
                               {!dna ? <p className="text-xs text-textMuted-light dark:text-textMuted-dark">No shots to analyze.</p> : (
                                   <div className="space-y-2.5">
                                       {dna.map(({ genre, pct }) => (
                                           <div key={genre}>
                                               <div className="flex justify-between text-[10px] font-bold mb-1">
                                                   <span style={{color: GENRE_COLORS[genre] || '#8a8a8a'}}>{genre}</span>
                                                   <span className="font-mono text-textMuted-light dark:text-textMuted-dark">{pct}%</span>
                                               </div>
                                               <div className="h-2 rounded-full bg-input-light dark:bg-input-dark overflow-hidden">
                                                   <div className="h-full rounded-full transition-all" style={{width:`${pct}%`, background: GENRE_COLORS[genre] || '#8a8a8a'}} />
                                               </div>
                                           </div>
                                       ))}
                                       <p className="text-[9px] text-textMuted-light dark:text-textMuted-dark pt-1">Based on lighting, camera, movement and style across all scenes.</p>
                                   </div>
                               )}
                           </div>
                       </div>
                   );
               })()}

               {/* Shot Revision History */}
               {showHistoryFor !== null && (() => {
                   const shot = shots[showHistoryFor];
                   const id = shot?.id || `shot_${showHistoryFor}`;
                   const revs = shotHistory[id] || [];
                   return (
                       <div className="settings-overlay" style={{zIndex:99998}} onClick={() => setShowHistoryFor(null)}>
                           <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-xl shadow-2xl p-5 max-w-sm w-full mx-4 animate-slide-up" onClick={e => e.stopPropagation()}>
                               <div className="flex items-center justify-between mb-4">
                                   <div className="flex items-center gap-2"><Icon name="Clock" size={15} className="text-primary"/><span className="text-sm font-black uppercase tracking-widest text-textMain-light dark:text-textMain-dark">Shot {showHistoryFor + 1} History</span></div>
                                   <button onClick={() => setShowHistoryFor(null)}><Icon name="X" size={16} className="text-textMuted-light dark:text-textMuted-dark"/></button>
                               </div>
                               {revs.length === 0 ? (
                                   <p className="text-xs text-textMuted-light dark:text-textMuted-dark">No revisions yet. Edit the shot to start tracking history.</p>
                               ) : (
                                   <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                                       {[...revs].reverse().map((rev, idx) => {
                                           const shotId = shots[showHistoryFor]?.id || `shot_${showHistoryFor}`;
                                           return (
                                           <div key={idx} onContextMenu={(e) => openCtxMenu(e, 'history', { shotId, revisionIndex: idx })} className="flex items-center justify-between p-2.5 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark">
                                               <div>
                                                   <div className="text-[10px] font-bold text-textMain-light dark:text-textMain-dark">Version {revs.length - idx}</div>
                                                   <div className="text-[9px] font-mono text-textMuted-light dark:text-textMuted-dark">{new Date(rev.ts).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} · {new Date(rev.ts).toLocaleDateString()}</div>
                                                   <div className="text-[9px] text-textMuted-light dark:text-textMuted-dark truncate max-w-[180px] mt-0.5">{rev.snap.subject?.substring(0,50) || 'No subject'}</div>
                                               </div>
                                               <button onClick={() => {
                                                   updateActiveShots(prev => { const n = [...prev]; n[showHistoryFor] = { ...rev.snap }; return n; });
                                                   addToast(`Restored to version ${revs.length - idx} ✓`, 'success');
                                                   setShowHistoryFor(null);
                                               }} className="text-[10px] px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/30 font-bold hover:bg-primary/20 transition-all shrink-0 ml-2">Restore</button>
                                           </div>
                                           );
                                       })}
                                   </div>
                               )}
                           </div>
                       </div>
                   );
               })()}

               {/* Prompt Mutation Engine */}
               {showMutations !== null && (() => {
                   const mutations = getMutations(showMutations);
                   return (
                       <div className="settings-overlay" style={{zIndex:99998}} onClick={() => setShowMutations(null)}>
                           <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-xl shadow-2xl p-5 max-w-sm w-full mx-4 animate-slide-up" onClick={e => e.stopPropagation()}>
                               <div className="flex items-center justify-between mb-4">
                                   <div className="flex items-center gap-2"><Icon name="Sparkles" size={15} className="text-primary"/><span className="text-sm font-black uppercase tracking-widest text-textMain-light dark:text-textMain-dark">Mutate Shot {showMutations + 1}</span></div>
                                   <button onClick={() => setShowMutations(null)}><Icon name="X" size={16} className="text-textMuted-light dark:text-textMuted-dark"/></button>
                               </div>
                               <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark mb-4">Choose a variation to add as a new shot or replace the current one.</p>
                               <div className="space-y-2">
                                   {mutations.map((m, idx) => (
                                       <div key={idx} className="p-3 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark">
                                           <div className="flex items-center justify-between mb-2">
                                               <div className="flex items-center gap-2">
                                                   <Icon name={m.icon} size={13} className="text-primary"/>
                                                   <span className="text-xs font-black text-textMain-light dark:text-textMain-dark">{m.label}</span>
                                               </div>
                                               <div className="flex gap-1.5">
                                                   <button onClick={() => {
                                                       const base = shots[showMutations];
                                                       updateActiveShots(prev => { const n = [...prev]; n.splice(showMutations + 1, 0, { ...JSON.parse(JSON.stringify(base)), selections: m.selections, id: `shot_${Date.now()}` }); return n; });
                                                       addToast(`${m.label} variation added ✓`, 'success');
                                                       setShowMutations(null);
                                                   }} className="text-[9px] px-2 py-1 rounded bg-primary/10 text-primary border border-primary/30 font-bold hover:bg-primary/20">Add</button>
                                                   <button onClick={() => {
                                                       updateActiveShots(prev => { const n = [...prev]; n[showMutations] = { ...n[showMutations], selections: m.selections }; return n; });
                                                       addToast(`Shot mutated to ${m.label} ✓`, 'success');
                                                       setShowMutations(null);
                                                   }} className="text-[9px] px-2 py-1 rounded bg-input-light dark:bg-border-dark text-textMuted-light dark:text-textMuted-dark border border-border-light dark:border-border-dark font-bold hover:text-textMain-light">Replace</button>
                                               </div>
                                           </div>
                                           <div className="flex flex-wrap gap-1">
                                               {Object.entries(m.changes).map(([k, v]) => (
                                                   <span key={k} className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-primary/5 border border-primary/20 text-primary">{v}</span>
                                               ))}
                                           </div>
                                       </div>
                                   ))}
                               </div>
                           </div>
                       </div>
                   );
               })()}

               {/* Storage Quota Warning */}
               {storageWarning && (
                   <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[99996] animate-slide-up">
                       <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/40 text-amber-600 dark:text-amber-400 rounded-xl px-4 py-3 shadow-xl backdrop-blur-sm text-xs font-bold">
                           <Icon name="AlertTriangle" size={14} />
                           <span>Storage {storageWarning.pct}% full ({storageWarning.usedMB}MB / {storageWarning.limitMB}MB). Export your projects to free space.</span>
                           <button onClick={() => setStorageWarning(null)} className="ml-2 opacity-60 hover:opacity-100"><Icon name="X" size={12} /></button>
                       </div>
                   </div>
               )}

               {/* Offline Banner */}
               {isOffline && (
                   <div className="fixed top-0 left-0 right-0 z-[99997] flex items-center justify-center gap-2 bg-amber-500 text-black text-[11px] font-black py-1.5 px-4">
                       <Icon name="AlertTriangle" size={12} />
                       You're offline — CDN resources (React, Tailwind) may not reload. Local features still work.
                   </div>
               )}

               {/* App Version + Designer Credit */}
               <div className="fixed bottom-1 right-2 z-[100] pointer-events-none">
                   <span className="text-[8px] font-mono text-textMuted-light dark:text-textMuted-dark opacity-25">v{APP_VERSION} · Designed by Charles Emilson</span>
               </div>
               </div>
             </div>
          );
        }


import { useEffect, useRef, useState } from 'react';
import { Icon } from '../ui/Icon';
import { CharacterArcEngine } from '../../engine/script';

// ── Character Arc Mapper Component ──────────────────────────────────────

        export const CharacterArcMapper = ({ script, blueprint, blueprintCharacters, initialArcs, onClose, onSave }) => {
            const [characters, setCharacters] = useState([]);
            const [arcs, setArcs] = useState(initialArcs || []);
            const [selectedCharacterId, setSelectedCharacterId] = useState(null);
            const [showAddCharacter, setShowAddCharacter] = useState(false);
            const [newCharacterName, setNewCharacterName] = useState('');
            const [localCharacters, setLocalCharacters] = useState(blueprintCharacters || []); // Track locally created characters
            const [viewMode, setViewMode] = useState('list'); // 'list' or 'nodal'
            const [lineStyle, setLineStyle] = useState('palma'); // 'bezier' or 'palma'
            const [draggingChar, setDraggingChar] = useState(null);
            const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
            const [mapZoom, setMapZoom] = useState(1);
            const mapRef = useRef(null);
            const [isPanning, setIsPanning] = useState(false);
            const [panStart, setPanStart] = useState({ x: 0, y: 0 });
            const [drawingConnection, setDrawingConnection] = useState(null);
            const [contextMenu, setContextMenu] = useState(null);
            const [hoveredConnector, setHoveredConnector] = useState(null);
            const [handToolActive, setHandToolActive] = useState(false);

            // Extract characters from script dialogue AND blueprint characters
            useEffect(() => {
                const extractedChars = new Set();
                
                // Add blueprint characters first
                if (blueprintCharacters && blueprintCharacters.length > 0) {
                    blueprintCharacters.forEach(char => {
                        extractedChars.add(char.name);
                    });
                }
                
                // Add locally created characters
                if (localCharacters && localCharacters.length > 0) {
                    localCharacters.forEach(char => {
                        extractedChars.add(char.name);
                    });
                }
                
                // Add characters from script dialogue
                script.scenes.forEach(scene => {
                    scene.shots.forEach(shot => {
                        shot.dialogueBlocks.forEach(db => {
                            if (db.characterName) {
                                extractedChars.add(db.characterName);
                            }
                        });
                    });
                });

                const charList = Array.from(extractedChars).map(name => ({
                    id: `char-${name.replace(/\s+/g, '-')}`,
                    name,
                    x: 40 + Array.from(extractedChars).indexOf(name) * 60, // Position for nodal view
                    y: 40
                }));

                setCharacters(charList);

                // Initialize arcs for each character (only if no initial arcs)
                if (!initialArcs || initialArcs.length === 0) {
                    const newArcs = charList.map(char => 
                        CharacterArcEngine.createCharacterArc(char.id, char.name)
                    );
                    setArcs(newArcs);
                } else {
                    // Update existing arcs with any new characters
                    const existingCharIds = new Set(arcs.map(a => a.characterId));
                    const newCharacters = charList.filter(c => !existingCharIds.has(c.id));
                    if (newCharacters.length > 0) {
                        const newArcs = newCharacters.map(char => 
                            CharacterArcEngine.createCharacterArc(char.id, char.name)
                        );
                        setArcs([...arcs, ...newArcs]);
                    }
                }
            }, [script.scenes.length, blueprintCharacters, localCharacters]);

            const addCharacter = () => {
                if (newCharacterName.trim()) {
                    const newChar = {
                        id: `char-${newCharacterName.replace(/\s+/g, '-')}`,
                        name: newCharacterName,
                        archetype: 'Protagonist',
                        age: '',
                        role: '',
                        description: ''
                    };
                    // Add to local characters (will be saved to blueprint on save)
                    setLocalCharacters([...localCharacters, newChar]);
                    const newArc = CharacterArcEngine.createCharacterArc(newChar.id, newChar.name);
                    setArcs([...arcs, newArc]);
                    setNewCharacterName('');
                    setShowAddCharacter(false);
                }
            };

            const updateArc = (characterId, updates) => {
                setArcs(prevArcs => {
                    let updatedArcs = prevArcs.map(arc =>
                        arc.characterId === characterId
                            ? CharacterArcEngine.updateArc(arc, updates)
                            : arc
                    );

                    // Handle bidirectional relationships
                    if (updates.relationships) {
                        const currentArc = updatedArcs.find(a => a.characterId === characterId);
                        
                        // For each relationship defined in this character
                        updates.relationships.forEach((newRel, idx) => {
                            const oldRel = arcs.find(a => a.characterId === characterId)?.relationships?.[idx];
                            
                            // If relationship target changed or type changed, update the target character
                            if (newRel.targetCharacterId && (newRel.targetCharacterId !== oldRel?.targetCharacterId || newRel.type !== oldRel?.type)) {
                                const targetArc = updatedArcs.find(a => a.characterId === newRel.targetCharacterId);
                                if (targetArc) {
                                    // Create reverse relationship
                                    const reverseType = getReverseRelationshipType(newRel.type);
                                    const existingReverseIdx = targetArc.relationships?.findIndex(r => r.targetCharacterId === characterId);
                                    
                                    if (existingReverseIdx !== undefined && existingReverseIdx >= 0) {
                                        // Update existing reverse relationship
                                        targetArc.relationships[existingReverseIdx] = {
                                            targetCharacterId: characterId,
                                            type: reverseType,
                                            description: `Reverse of: ${newRel.description || ''}`
                                        };
                                    } else {
                                        // Add new reverse relationship
                                        targetArc.relationships = [...(targetArc.relationships || []), {
                                            targetCharacterId: characterId,
                                            type: reverseType,
                                            description: `Reverse of: ${newRel.description || ''}`
                                        }];
                                    }
                                }
                            }
                        });
                    }

                    return updatedArcs;
                });
            };

            const getReverseRelationshipType = (type) => {
                const reverseMap = {
                    'ally': 'ally',
                    'enemy': 'enemy',
                    'mentor': 'student',
                    'student': 'mentor',
                    'love': 'love',
                    'rival': 'rival',
                    'family': 'family',
                    'neutral': 'neutral'
                };
                return reverseMap[type] || 'neutral';
            };

            const addEmotionalBeat = (characterId, sceneId) => {
                setArcs(arcs.map(arc => {
                    if (arc.characterId === characterId) {
                        return {
                            ...arc,
                            emotionalBeats: [
                                ...arc.emotionalBeats,
                                { sceneId, emotion: '', intensity: 5 }
                            ]
                        };
                    }
                    return arc;
                }));
            };

            const selectedArc = arcs.find(a => a.characterId === selectedCharacterId);

            // Nodal tree functions
            const handleCharMouseDown = (e, charId) => {
                if (e.button !== 0 || isPanning) return;
                e.stopPropagation();
                setDraggingChar({ id: charId, startX: e.clientX, startY: e.clientY, offsetX: mapOffset.x, offsetY: mapOffset.y });
            };

            const handleMouseMove = (e) => {
                if (draggingChar) {
                    const deltaX = e.clientX - draggingChar.startX;
                    const deltaY = e.clientY - draggingChar.startY;
                    
                    setCharacters(prev => prev.map(c => 
                        c.id === draggingChar.id 
                            ? { ...c, x: c.x + deltaX / mapZoom, y: c.y + deltaY / mapZoom }
                            : c
                    ));
                    
                    setDraggingChar({ ...draggingChar, startX: e.clientX, startY: e.clientY });
                } else if (isPanning) {
                    const deltaX = e.clientX - panStart.x;
                    const deltaY = e.clientY - panStart.y;
                    setMapOffset({ x: mapOffset.x + deltaX, y: mapOffset.y + deltaY });
                    setPanStart({ x: e.clientX, y: e.clientY });
                } else if (drawingConnection && mapRef.current) {
                    const canvasRect = mapRef.current.getBoundingClientRect();
                    let endX = (e.clientX - canvasRect.left) / mapZoom - mapOffset.x / mapZoom;
                    let endY = (e.clientY - canvasRect.top) / mapZoom - mapOffset.y / mapZoom;
                    
                    // Magnetic snap - find nearby connectors of matching type (improved for smoother connection)
                    const SNAP_DISTANCE = 50; // Increased for easier connection
                    let snappedCharId = null;
                    let snappedType = null;
                    let minDistance = SNAP_DISTANCE;
                    
                    for (const char of characters) {
                        if (char.id === drawingConnection.fromCharId) continue;
                        
                        // Check all 8 connector positions on each side
                        const relTypes = ['ally', 'enemy', 'mentor', 'student', 'love', 'rival', 'family', 'neutral'];
                        for (let i = 0; i < relTypes.length; i++) {
                            const relType = relTypes[i];
                            
                            // Left side connectors (inputs) - positioned at x=-6 (outside border)
                            const leftPos = getConnectorPosition(char, relType, 'input');
                            const distLeft = Math.sqrt(Math.pow(endX - leftPos.x, 2) + Math.pow(endY - leftPos.y, 2));
                            
                            if (distLeft < minDistance) {
                                minDistance = distLeft;
                                endX = leftPos.x;
                                endY = leftPos.y;
                                snappedCharId = char.id;
                                snappedType = relType;
                            }
                            
                            // Right side connectors (outputs) - positioned at x=240+6 (outside border)
                            const rightPos = getConnectorPosition(char, relType, 'output');
                            const distRight = Math.sqrt(Math.pow(endX - rightPos.x, 2) + Math.pow(endY - rightPos.y, 2));
                            
                            if (distRight < minDistance) {
                                minDistance = distRight;
                                endX = rightPos.x;
                                endY = rightPos.y;
                                snappedCharId = char.id;
                                snappedType = relType;
                            }
                        }
                    }
                    
                    setDrawingConnection({ 
                        ...drawingConnection, 
                        endX: endX, 
                        endY: endY,
                        snappedTo: snappedCharId,
                        snappedType: snappedType
                    });
                }
            };

            const handleMouseUp = () => {
                setDraggingChar(null);
                setIsPanning(false);
                if (drawingConnection) {
                    setDrawingConnection(null);
                }
            };

            const handleCanvasMouseDown = (e) => {
                if (e.button === 0 && !draggingChar) {
                    setIsPanning(true);
                    setPanStart({ x: e.clientX, y: e.clientY });
                }
            };

            const handleZoomIn = () => {
                setMapZoom(prev => Math.min(prev + 0.1, 2));
            };

            const handleZoomOut = () => {
                setMapZoom(prev => Math.max(prev - 0.1, 0.3));
            };

            const handleZoomReset = () => {
                setMapZoom(1);
            };

            const handleAutoFit = () => {
                if (characters.length === 0) return;
                
                const xs = characters.map(c => c.x);
                const ys = characters.map(c => c.y);
                const minX = Math.min(...xs);
                const maxX = Math.max(...xs) + 240;
                const minY = Math.min(...ys);
                const maxY = Math.max(...ys) + 200;
                
                const contentW = maxX - minX;
                const contentH = maxY - minY;
                const containerW = mapRef.current?.clientWidth || 1000;
                const containerH = mapRef.current?.clientHeight || 800;
                
                const zoom = Math.min(containerW / contentW, containerH / contentH, 1) * 0.9;
                setMapZoom(zoom);
                setMapOffset({ 
                    x: (containerW - contentW * zoom) / 2 - minX * zoom, 
                    y: (containerH - contentH * zoom) / 2 - minY * zoom 
                });
            };

            const handleConnectorMouseDown = (e, charId, relType) => {
                e.stopPropagation();
                e.preventDefault();
                const char = characters.find(c => c.id === charId);
                if (!char || !mapRef.current) return;
                
                const rect = e.currentTarget.getBoundingClientRect();
                const canvasRect = mapRef.current.getBoundingClientRect();
                
                // Calculate coordinates relative to the canvas, accounting for zoom and offset
                const startX = (rect.left + rect.width / 2 - canvasRect.left) / mapZoom - mapOffset.x / mapZoom;
                const startY = (rect.top + rect.height / 2 - canvasRect.top) / mapZoom - mapOffset.y / mapZoom;
                const endX = (e.clientX - canvasRect.left) / mapZoom - mapOffset.x / mapZoom;
                const endY = (e.clientY - canvasRect.top) / mapZoom - mapOffset.y / mapZoom;
                
                setDrawingConnection({
                    fromCharId: charId,
                    relType: relType,
                    startX: startX,
                    startY: startY,
                    endX: endX,
                    endY: endY
                });
            };

            const handleConnectorMouseUp = (e, charId, relType) => {
                if (!drawingConnection) return;
                e.stopPropagation();
                e.preventDefault();
                
                // Only create connection if same relationship type
                if (drawingConnection.relType === relType && drawingConnection.fromCharId !== charId) {
                    createRelationship(drawingConnection.fromCharId, charId, relType);
                }
                
                setDrawingConnection(null);
            };

            const createRelationship = (fromCharId, toCharId, relType) => {
                // Check if relationship can be created
                if (!canCreateRelationship(fromCharId, toCharId, relType)) {
                    // Show error or warning - relationship is incompatible
                    console.warn(`Cannot create ${relType} relationship - incompatible with existing relationship`);
                    return;
                }
                
                // Add relationship to the from character
                const newRel = {
                    targetCharacterId: toCharId,
                    type: relType,
                    description: `${relType} relationship`
                };
                
                const fromArc = arcs.find(a => a.characterId === fromCharId);
                if (fromArc) {
                    // Check if relationship already exists with same type
                    const existingRelIndex = fromArc.relationships?.findIndex(r => r.targetCharacterId === toCharId && r.type === relType);
                    if (existingRelIndex !== undefined && existingRelIndex >= 0) {
                        // Relationship already exists, don't duplicate
                        return;
                    }
                    
                    // Check if relationship exists with different type
                    const existingDiffType = fromArc.relationships?.findIndex(r => r.targetCharacterId === toCharId);
                    if (existingDiffType !== undefined && existingDiffType >= 0) {
                        // Replace existing relationship
                        const updatedRels = [...fromArc.relationships];
                        updatedRels[existingDiffType] = newRel;
                        updateArc(fromCharId, { relationships: updatedRels });
                    } else {
                        // Add new relationship
                        const updatedRels = [...(fromArc.relationships || []), newRel];
                        updateArc(fromCharId, { relationships: updatedRels });
                    }
                }
            };

            const changeRelationshipType = (fromCharId, toCharId, oldType, newType) => {
                const fromArc = arcs.find(a => a.characterId === fromCharId);
                if (fromArc) {
                    const updatedRels = fromArc.relationships.map(rel => 
                        rel.targetCharacterId === toCharId && rel.type === oldType
                            ? { ...rel, type: newType }
                            : rel
                    );
                    updateArc(fromCharId, { relationships: updatedRels });
                }
                setContextMenu(null);
            };

            const deleteRelationship = (fromCharId, toCharId, relType) => {
                const fromArc = arcs.find(a => a.characterId === fromCharId);
                if (fromArc) {
                    const updatedRels = fromArc.relationships.filter(rel => 
                        !(rel.targetCharacterId === toCharId && rel.type === relType)
                    );
                    updateArc(fromCharId, { relationships: updatedRels });
                }
                setContextMenu(null);
            };

            const handleRelationshipClick = (e, fromCharId, toCharId, relType) => {
                e.stopPropagation();
                setContextMenu({
                    x: e.clientX,
                    y: e.clientY,
                    type: 'editRelationship',
                    fromCharId,
                    toCharId,
                    currentType: relType
                });
            };

            const handleRightClick = (e, charId) => {
                e.preventDefault();
                e.stopPropagation();
                setContextMenu({
                    x: e.clientX,
                    y: e.clientY,
                    type: 'character',
                    charId
                });
            };
            
            const handleConnectTo = (fromCharId, toCharId, relType) => {
                createRelationship(fromCharId, toCharId, relType);
                setContextMenu(null);
            };

            const deleteCharacter = (charId) => {
                setCharacters(prev => prev.filter(c => c.id !== charId));
                setArcs(prev => prev.filter(a => a.characterId !== charId));
                setLocalCharacters(prev => prev.filter(c => c.id !== charId));
                setContextMenu(null);
            };

            useEffect(() => {
                if (draggingChar || isPanning || drawingConnection) {
                    window.addEventListener('mousemove', handleMouseMove);
                    window.addEventListener('mouseup', handleMouseUp);
                    return () => {
                        window.removeEventListener('mousemove', handleMouseMove);
                        window.removeEventListener('mouseup', handleMouseUp);
                    };
                }
            }, [draggingChar, isPanning, drawingConnection, mapZoom, mapOffset, panStart]);

            // Close context menu on click outside
            useEffect(() => {
                const handleClickOutside = () => setContextMenu(null);
                if (contextMenu) {
                    window.addEventListener('click', handleClickOutside);
                    return () => window.removeEventListener('click', handleClickOutside);
                }
            }, [contextMenu]);
            
            // Keyboard shortcuts and mouse wheel zoom
            useEffect(() => {
                if (viewMode !== 'nodal') return;
                
                const handleKeyDown = (e) => {
                    // H key - Toggle hand tool
                    if (e.key === 'h' || e.key === 'H') {
                        setHandToolActive(prev => !prev);
                        e.preventDefault();
                    }
                    // + or = key - Zoom in
                    if (e.key === '+' || e.key === '=') {
                        handleZoomIn();
                        e.preventDefault();
                    }
                    // - key - Zoom out
                    if (e.key === '-' || e.key === '_') {
                        handleZoomOut();
                        e.preventDefault();
                    }
                    // 0 key - Reset zoom
                    if (e.key === '0') {
                        handleZoomReset();
                        e.preventDefault();
                    }
                    // F key - Auto fit
                    if (e.key === 'f' || e.key === 'F') {
                        handleAutoFit();
                        e.preventDefault();
                    }
                };
                
                const handleKeyUp = (e) => {
                    // Release H key - Deactivate hand tool
                    if (e.key === 'h' || e.key === 'H') {
                        if (handToolActive) {
                            setHandToolActive(false);
                        }
                    }
                };
                
                const handleWheel = (e) => {
                    if (e.ctrlKey || e.metaKey) {
                        // Zoom with Ctrl/Cmd + Mouse Wheel
                        e.preventDefault();
                        const delta = e.deltaY > 0 ? -0.1 : 0.1;
                        setMapZoom(prev => Math.max(0.3, Math.min(2, prev + delta)));
                    }
                };
                
                window.addEventListener('keydown', handleKeyDown);
                window.addEventListener('keyup', handleKeyUp);
                if (mapRef.current) {
                    mapRef.current.addEventListener('wheel', handleWheel, { passive: false });
                }
                
                return () => {
                    window.removeEventListener('keydown', handleKeyDown);
                    window.removeEventListener('keyup', handleKeyUp);
                    if (mapRef.current) {
                        mapRef.current.removeEventListener('wheel', handleWheel);
                    }
                };
            }, [viewMode, handToolActive, mapZoom]);

            const getRelationshipColor = (type) => {
                const colors = {
                    'ally': '#22c55e',
                    'enemy': '#ef4444',
                    'mentor': '#a855f7',
                    'student': '#06b6d4',
                    'love': '#ec4899',
                    'rival': '#f59e0b',
                    'family': '#8b5cf6',
                    'neutral': '#6b7280'
                };
                return colors[type] || '#6b7280';
            };
            
            // Define incompatible relationship types
            const getIncompatibleRelationships = (existingType) => {
                const incompatibilityMap = {
                    'ally': ['enemy', 'rival', 'neutral'],
                    'enemy': ['ally', 'love', 'family', 'mentor', 'student'],
                    'mentor': ['enemy', 'rival'],
                    'student': ['enemy', 'rival'],
                    'love': ['enemy', 'neutral'],
                    'rival': ['ally', 'mentor', 'student', 'love', 'family'],
                    'family': ['enemy', 'rival'],
                    'neutral': ['ally', 'love']
                };
                return incompatibilityMap[existingType] || [];
            };
            
            // Check if a relationship can be created between two characters
            const canCreateRelationship = (fromCharId, toCharId, newRelType) => {
                const fromArc = arcs.find(a => a.characterId === fromCharId);
                if (!fromArc || !fromArc.relationships) return true;
                
                // Check if there's already a relationship with this character
                const existingRel = fromArc.relationships.find(r => r.targetCharacterId === toCharId);
                if (!existingRel) return true;
                
                // Check if the new relationship type is incompatible with existing one
                const incompatible = getIncompatibleRelationships(existingRel.type);
                return !incompatible.includes(newRelType);
            };
            
            // Get available relationship types for a connection
            const getAvailableRelationshipTypes = (fromCharId, toCharId) => {
                const allTypes = ['ally', 'enemy', 'mentor', 'student', 'love', 'rival', 'family', 'neutral'];
                const fromArc = arcs.find(a => a.characterId === fromCharId);
                
                if (!fromArc || !fromArc.relationships) return allTypes;
                
                const existingRel = fromArc.relationships.find(r => r.targetCharacterId === toCharId);
                if (!existingRel) return allTypes;
                
                // Filter out incompatible types
                const incompatible = getIncompatibleRelationships(existingRel.type);
                return allTypes.filter(type => type === existingRel.type || !incompatible.includes(type));
            };
            
            // Get exact connector position for a character and relationship type
            const getConnectorPosition = (char, relType, side = 'output') => {
                const relTypes = ['ally', 'enemy', 'mentor', 'student', 'love', 'rival', 'family', 'neutral'];
                const index = relTypes.indexOf(relType);
                if (index === -1) return { x: char.x + 120, y: char.y + 80 }; // fallback to center
                
                const connectorY = char.y + 30 + index * 18;
                // Connectors are positioned outside the border: left at x=-6, right at x=240+6
                const connectorX = side === 'output' ? char.x + 240 : char.x;
                
                return { x: connectorX, y: connectorY };
            };
            
            // Generate path data based on line style
            const getPathData = (x1, y1, x2, y2, style = 'palma') => {
                if (style === 'bezier') {
                    // Quadratic Bezier curve
                    const midX = (x1 + x2) / 2;
                    const midY = (y1 + y2) / 2;
                    const offsetX = (y2 - y1) * 0.1;
                    const offsetY = (x1 - x2) * 0.1;
                    return `M ${x1} ${y1} Q ${midX + offsetX} ${midY + offsetY} ${x2} ${y2}`;
                } else {
                    // Palma style - smooth S-curve using cubic Bezier
                    const dx = x2 - x1;
                    const dy = y2 - y1;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const controlDistance = Math.min(distance * 0.5, 150);
                    
                    // Control points extend horizontally from start/end
                    const cp1x = x1 + controlDistance;
                    const cp1y = y1;
                    const cp2x = x2 - controlDistance;
                    const cp2y = y2;
                    
                    return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
                }
            };

            return (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-panel-light dark:bg-panel-dark rounded-lg shadow-2xl w-full h-full max-w-5xl flex flex-col">
                        {/* Header */}
                        <div className="border-b border-border-light dark:border-border-dark p-4 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-bold">Character Arc Mapper</h2>
                                <div className="flex gap-2 border-l border-border-light dark:border-border-dark pl-4">
                                    <button onClick={() => setViewMode('list')} 
                                        className={`px-3 py-1 rounded text-sm font-semibold transition-all ${viewMode === 'list' ? 'bg-primary/20 text-primary' : 'text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark'}`}>
                                        List View
                                    </button>
                                    <button onClick={() => setViewMode('nodal')} 
                                        className={`px-3 py-1 rounded text-sm font-semibold transition-all ${viewMode === 'nodal' ? 'bg-primary/20 text-primary' : 'text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark'}`}>
                                        Nodal Tree
                                    </button>
                                </div>
                            </div>
                            <button onClick={onClose} className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark">
                                <Icon name="X" size={24} />
                            </button>
                        </div>

                        {/* Main Content */}
                        <div className="flex flex-1 overflow-hidden">
                            {viewMode === 'list' ? (
                                <>
                                    {/* Character List */}
                                    <div className="w-56 border-r border-border-light dark:border-border-dark overflow-y-auto p-4 space-y-2">
                                <div className="text-xs font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest mb-4">Characters</div>
                                {characters.map(char => (
                                    <button key={char.id} onClick={() => setSelectedCharacterId(char.id)}
                                        className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                                            selectedCharacterId === char.id
                                                ? 'bg-primary/20 border border-primary'
                                                : 'border border-border-light dark:border-border-dark hover:border-primary/50'
                                        }`}>
                                        <div className="font-semibold text-sm">{char.name}</div>
                                    </button>
                                ))}
                                <button onClick={() => setShowAddCharacter(true)}
                                    className="w-full text-left px-3 py-2 rounded-lg border border-dashed border-border-light dark:border-border-dark hover:border-primary/50 text-primary text-sm font-semibold">
                                    + Add Character
                                </button>

                                {showAddCharacter && (
                                    <div className="p-3 bg-input-light dark:bg-input-dark rounded-lg border border-border-light dark:border-border-dark space-y-2">
                                        <input type="text" placeholder="Character name..." value={newCharacterName}
                                            onChange={(e) => setNewCharacterName(e.target.value)}
                                            className="w-full px-2 py-1 rounded bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark text-sm"
                                        />
                                        <div className="flex gap-2">
                                            <button onClick={addCharacter} className="flex-1 px-2 py-1 rounded bg-primary text-black text-xs font-semibold hover:bg-primaryHover">
                                                Add
                                            </button>
                                            <button onClick={() => setShowAddCharacter(false)} className="flex-1 px-2 py-1 rounded border border-border-light dark:border-border-dark text-xs font-semibold">
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Arc Editor */}
                            <div className="flex-1 overflow-y-auto p-8">
                                {selectedArc ? (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-xl font-bold mb-4">{selectedArc.characterName}'s Arc</h3>
                                        </div>

                                        {/* Arc Type */}
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Arc Type</label>
                                            <select value={selectedArc.arcType} onChange={(e) => updateArc(selectedCharacterId, { arcType: e.target.value })}
                                                className="w-full px-3 py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark">
                                                <option value="growth">Growth (Improving)</option>
                                                <option value="decline">Decline (Worsening)</option>
                                                <option value="flat">Flat (Unchanged)</option>
                                                <option value="transformation">Transformation (Fundamental Change)</option>
                                            </select>
                                        </div>

                                        {/* Starting State */}
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Starting Emotional State</label>
                                            <textarea value={selectedArc.startingEmotionalState} onChange={(e) => updateArc(selectedCharacterId, { startingEmotionalState: e.target.value })}
                                                placeholder="e.g., Hopeful but uncertain, Angry and bitter, Confident and ambitious..."
                                                className="w-full px-3 py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark h-20 resize-none"
                                            />
                                        </div>

                                        {/* Ending State */}
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Ending Emotional State</label>
                                            <textarea value={selectedArc.endingEmotionalState} onChange={(e) => updateArc(selectedCharacterId, { endingEmotionalState: e.target.value })}
                                                placeholder="e.g., Enlightened and at peace, Redeemed and hopeful, Humbled and wise..."
                                                className="w-full px-3 py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark h-20 resize-none"
                                            />
                                        </div>

                                        {/* Key Turning Points */}
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Key Turning Points</label>
                                            <textarea value={selectedArc.keyTurningPoints.join('\n')} onChange={(e) => updateArc(selectedCharacterId, { keyTurningPoints: e.target.value.split('\n').filter(t => t.trim()) })}
                                                placeholder="Enter each turning point on a new line..."
                                                className="w-full px-3 py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark h-24 resize-none"
                                            />
                                        </div>

                                        {/* Emotional Beats */}
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Emotional Beats by Scene</label>
                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                                {selectedArc.emotionalBeats.map((beat, idx) => (
                                                    <div key={idx} className="p-3 bg-input-light dark:bg-input-dark rounded-lg border border-border-light dark:border-border-dark space-y-2">
                                                        <div className="flex gap-2 items-center">
                                                            <select value={beat.sceneId || ''} onChange={(e) => {
                                                                const newBeats = [...selectedArc.emotionalBeats];
                                                                newBeats[idx].sceneId = e.target.value;
                                                                updateArc(selectedCharacterId, { emotionalBeats: newBeats });
                                                            }}
                                                                className="flex-1 px-2 py-1 rounded bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark text-sm">
                                                                <option value="">Select scene...</option>
                                                                {script.scenes.map((scene, sceneIdx) => (
                                                                    <option key={scene.id} value={scene.id}>Scene {sceneIdx + 1}: {scene.label}</option>
                                                                ))}
                                                            </select>
                                                            <button onClick={() => {
                                                                const newBeats = selectedArc.emotionalBeats.filter((_, i) => i !== idx);
                                                                updateArc(selectedCharacterId, { emotionalBeats: newBeats });
                                                            }} className="text-red-500 hover:text-red-600">
                                                                <Icon name="Trash2" size={16} />
                                                            </button>
                                                        </div>
                                                        <input type="text" placeholder="Emotion (e.g., hopeful, angry, confused)" value={beat.emotion}
                                                            onChange={(e) => {
                                                                const newBeats = [...selectedArc.emotionalBeats];
                                                                newBeats[idx].emotion = e.target.value;
                                                                updateArc(selectedCharacterId, { emotionalBeats: newBeats });
                                                            }}
                                                            className="w-full px-2 py-1 rounded bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark text-sm"
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-xs font-semibold">Intensity:</label>
                                                            <input type="range" min="1" max="10" value={beat.intensity || 5}
                                                                onChange={(e) => {
                                                                    const newBeats = [...selectedArc.emotionalBeats];
                                                                    newBeats[idx].intensity = parseInt(e.target.value);
                                                                    updateArc(selectedCharacterId, { emotionalBeats: newBeats });
                                                                }}
                                                                className="flex-1"
                                                            />
                                                            <span className="text-xs font-semibold w-6 text-right">{beat.intensity || 5}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <button onClick={() => addEmotionalBeat(selectedCharacterId, '')}
                                                className="mt-2 text-sm text-primary hover:text-primaryHover font-semibold">
                                                + Add Emotional Beat
                                            </button>
                                        </div>

                                        {/* Character Relationships */}
                                        <div className="mt-8 pt-8 border-t border-border-light dark:border-border-dark">
                                            <label className="block text-sm font-semibold mb-4">Character Relationships</label>
                                            <div className="space-y-3">
                                                {selectedArc.relationships && selectedArc.relationships.map((rel, idx) => (
                                                    <div key={idx} className="p-3 bg-input-light dark:bg-input-dark rounded-lg border border-border-light dark:border-border-dark space-y-2">
                                                        <div className="flex gap-2 items-center">
                                                            <select value={rel.targetCharacterId || ''} onChange={(e) => {
                                                                const newRels = [...selectedArc.relationships];
                                                                newRels[idx].targetCharacterId = e.target.value;
                                                                updateArc(selectedCharacterId, { relationships: newRels });
                                                            }}
                                                                className="flex-1 px-2 py-1 rounded bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark text-sm">
                                                                <option value="">Select character...</option>
                                                                {characters.filter(c => c.id !== selectedCharacterId).map(char => (
                                                                    <option key={char.id} value={char.id}>{char.name}</option>
                                                                ))}
                                                            </select>
                                                            <button onClick={() => {
                                                                const newRels = selectedArc.relationships.filter((_, i) => i !== idx);
                                                                updateArc(selectedCharacterId, { relationships: newRels });
                                                            }} className="text-red-500 hover:text-red-600">
                                                                <Icon name="Trash2" size={16} />
                                                            </button>
                                                        </div>
                                                        <select value={rel.type || ''} onChange={(e) => {
                                                            const newRels = [...selectedArc.relationships];
                                                            newRels[idx].type = e.target.value;
                                                            updateArc(selectedCharacterId, { relationships: newRels });
                                                        }}
                                                            className="w-full px-2 py-1 rounded bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark text-sm">
                                                            <option value="">Select relationship type...</option>
                                                            <option value="ally">Ally</option>
                                                            <option value="enemy">Enemy</option>
                                                            <option value="mentor">Mentor</option>
                                                            <option value="student">Student</option>
                                                            <option value="love">Love Interest</option>
                                                            <option value="rival">Rival</option>
                                                            <option value="family">Family</option>
                                                            <option value="neutral">Neutral</option>
                                                        </select>
                                                        <textarea placeholder="Describe the relationship..." value={rel.description || ''}
                                                            onChange={(e) => {
                                                                const newRels = [...selectedArc.relationships];
                                                                newRels[idx].description = e.target.value;
                                                                updateArc(selectedCharacterId, { relationships: newRels });
                                                            }}
                                                            className="w-full px-2 py-1 rounded bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark text-sm h-12 resize-none"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            <button onClick={() => {
                                                const newRels = [...(selectedArc.relationships || []), { targetCharacterId: '', type: '', description: '' }];
                                                updateArc(selectedCharacterId, { relationships: newRels });
                                            }}
                                                className="mt-2 text-sm text-primary hover:text-primaryHover font-semibold">
                                                + Add Relationship
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-textMuted-light dark:text-textMuted-dark py-12">
                                        Select a character to map their arc
                                    </div>
                                )}
                            </div>
                        </>
                            ) : (
                                // Nodal Tree View - Professional Character Relationship Visualization
                                <div className="flex-1 overflow-hidden flex flex-col bg-base-light dark:bg-base-dark relative">
                                    {/* Toolbar */}
                                    <div className="border-b border-border-light dark:border-border-dark bg-panel-light dark:bg-panel-dark p-2">
                                        <div className="flex items-center justify-between gap-2 overflow-x-auto">
                                            <div className="flex gap-2 items-center flex-shrink-0">
                                                {/* Zoom Controls */}
                                                <button onClick={handleZoomIn} title="Zoom In (+)" className="px-2 py-1 rounded bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark hover:border-primary/50 text-sm font-semibold flex-shrink-0">
                                                    <Icon name="ZoomIn" size={16} />
                                                </button>
                                                <button onClick={handleZoomOut} title="Zoom Out (-)" className="px-2 py-1 rounded bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark hover:border-primary/50 text-sm font-semibold flex-shrink-0">
                                                    <Icon name="ZoomOut" size={16} />
                                                </button>
                                                <button onClick={handleZoomReset} title="Reset Zoom (0)" className="px-2 py-1 rounded bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark hover:border-primary/50 text-xs font-semibold min-w-[50px] flex-shrink-0">
                                                    {Math.round(mapZoom * 100)}%
                                                </button>
                                                <button onClick={handleAutoFit} title="Auto Fit (F)" className="px-2 py-1 rounded bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark hover:border-primary/50 text-sm font-semibold flex-shrink-0">
                                                    <Icon name="Maximize2" size={16} />
                                                </button>
                                                
                                                <div className="border-l border-border-light dark:border-border-dark h-6 flex-shrink-0" />
                                                
                                                {/* Hand Tool */}
                                                <button 
                                                    onClick={() => setHandToolActive(!handToolActive)}
                                                    title="Hand Tool (H) - Hold to pan"
                                                    className={`px-2 py-1 rounded border border-border-light dark:border-border-dark hover:border-primary/50 text-sm font-semibold flex-shrink-0 ${
                                                        handToolActive ? 'bg-primary/20 text-primary border-primary' : 'bg-input-light dark:bg-input-dark'
                                                    }`}
                                                >
                                                    <Icon name="Hand" size={16} />
                                                </button>
                                                
                                                {/* Line Style Toggle */}
                                                <button 
                                                    onClick={() => setLineStyle(lineStyle === 'palma' ? 'bezier' : 'palma')} 
                                                    title={`Line Style: ${lineStyle === 'palma' ? 'Palma (S-curve)' : 'Bezier (Curved)'}`}
                                                    className={`px-2 py-1 rounded border border-border-light dark:border-border-dark hover:border-primary/50 text-sm font-semibold flex-shrink-0 ${
                                                        lineStyle === 'palma' ? 'bg-primary/20 text-primary' : 'bg-input-light dark:bg-input-dark'
                                                    }`}
                                                >
                                                    <Icon name="GitBranch" size={16} />
                                                </button>
                                                
                                                <div className="border-l border-border-light dark:border-border-dark h-6 flex-shrink-0" />
                                                
                                                {/* Layout Actions */}
                                                <button 
                                                    onClick={() => {
                                                        // Auto-arrange nodes in a grid
                                                        const cols = Math.ceil(Math.sqrt(characters.length));
                                                        const spacing = 300;
                                                        setCharacters(prev => prev.map((char, idx) => ({
                                                            ...char,
                                                            x: (idx % cols) * spacing + 100,
                                                            y: Math.floor(idx / cols) * spacing + 100
                                                        })));
                                                    }}
                                                    title="Auto-arrange nodes in grid"
                                                    className="px-2 py-1 rounded bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark hover:border-primary/50 text-sm font-semibold flex-shrink-0"
                                                >
                                                    <Icon name="Grid" size={16} />
                                                </button>
                                                
                                                {/* Center View */}
                                                <button 
                                                    onClick={() => {
                                                        setMapOffset({ x: 0, y: 0 });
                                                        setMapZoom(1);
                                                    }}
                                                    title="Center view and reset zoom"
                                                    className="px-2 py-1 rounded bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark hover:border-primary/50 text-sm font-semibold flex-shrink-0"
                                                >
                                                    <Icon name="Crosshair" size={16} />
                                                </button>
                                            </div>
                                            
                                            <div className="text-xs text-textMuted-light dark:text-textMuted-dark flex items-center gap-2 flex-shrink-0">
                                                <span>🖱️ Ctrl+Wheel</span>
                                                <span>•</span>
                                                <span>⌨️ H</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Grid Background */}
                                    <div className="absolute inset-0 opacity-5" style={{
                                        backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255,255,255,.05) 25%, rgba(255,255,255,.05) 26%, transparent 27%, transparent 74%, rgba(255,255,255,.05) 75%, rgba(255,255,255,.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255,255,255,.05) 25%, rgba(255,255,255,.05) 26%, transparent 27%, transparent 74%, rgba(255,255,255,.05) 75%, rgba(255,255,255,.05) 76%, transparent 77%, transparent)',
                                        backgroundSize: '50px 50px'
                                    }} />
                                    
                                    {/* Canvas Area */}
                                    <div className="flex-1 overflow-hidden relative" 
                                        ref={mapRef}
                                        onMouseDown={handleCanvasMouseDown}
                                        style={{ cursor: isPanning ? 'grabbing' : (handToolActive ? 'grab' : 'default') }}
                                    >
                                        <div style={{
                                            position: 'relative',
                                            width: '2000px',
                                            height: '1500px',
                                            transform: `scale(${mapZoom}) translate(${mapOffset.x}px, ${mapOffset.y}px)`,
                                            transformOrigin: '0 0',
                                            transition: draggingChar ? 'none' : 'transform 0.2s ease'
                                        }}>
                                            {/* SVG for relationship lines */}
                                            <svg className="absolute inset-0 pointer-events-none" width="2000" height="1500" style={{ zIndex: 1 }}>
                                                <defs>
                                                    {/* Glow filter for connected lines */}
                                                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                                        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                                                        <feMerge>
                                                            <feMergeNode in="coloredBlur"/>
                                                            <feMergeNode in="SourceGraphic"/>
                                                        </feMerge>
                                                    </filter>
                                                    
                                                    {/* Arrow markers for each relationship type */}
                                                    <marker id="arrowhead-ally" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                                                        <polygon points="0 0, 10 3, 0 6" fill="#22c55e" />
                                                    </marker>
                                                    <marker id="arrowhead-enemy" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                                                        <polygon points="0 0, 10 3, 0 6" fill="#ef4444" />
                                                    </marker>
                                                    <marker id="arrowhead-mentor" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                                                        <polygon points="0 0, 10 3, 0 6" fill="#a855f7" />
                                                    </marker>
                                                    <marker id="arrowhead-student" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                                                        <polygon points="0 0, 10 3, 0 6" fill="#06b6d4" />
                                                    </marker>
                                                    <marker id="arrowhead-love" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                                                        <polygon points="0 0, 10 3, 0 6" fill="#ec4899" />
                                                    </marker>
                                                    <marker id="arrowhead-rival" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                                                        <polygon points="0 0, 10 3, 0 6" fill="#f59e0b" />
                                                    </marker>
                                                    <marker id="arrowhead-family" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                                                        <polygon points="0 0, 10 3, 0 6" fill="#8b5cf6" />
                                                    </marker>
                                                    <marker id="arrowhead-neutral" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                                                        <polygon points="0 0, 10 3, 0 6" fill="#6b7280" />
                                                    </marker>
                                                </defs>
                                                
                                                {/* Draw relationship lines */}
                                                {(() => {
                                                    const drawnRelationships = new Set();
                                                    return arcs.map(arc => 
                                                        arc.relationships?.map((rel, idx) => {
                                                            const fromChar = characters.find(c => c.id === arc.characterId);
                                                            const toChar = characters.find(c => c.id === rel.targetCharacterId);
                                                            if (!fromChar || !toChar) return null;
                                                            
                                                            // Create a unique key for this relationship pair (sorted to avoid duplicates)
                                                            const relKey = [arc.characterId, rel.targetCharacterId].sort().join('-') + '-' + rel.type;
                                                            
                                                            // Skip if we've already drawn this relationship
                                                            if (drawnRelationships.has(relKey)) return null;
                                                            drawnRelationships.add(relKey);
                                                            
                                                            // Get exact connector positions
                                                            const fromPos = getConnectorPosition(fromChar, rel.type, 'output');
                                                            const toPos = getConnectorPosition(toChar, rel.type, 'input');
                                                            
                                                            const pathData = getPathData(fromPos.x, fromPos.y, toPos.x, toPos.y, lineStyle);
                                                            
                                                            // Calculate midpoint for button placement
                                                            const midX = (fromPos.x + toPos.x) / 2;
                                                            const midY = (fromPos.y + toPos.y) / 2;
                                                            
                                                            return (
                                                                <g key={`${arc.characterId}-${idx}`}>
                                                                    {/* Glow layer */}
                                                                    <path d={pathData} 
                                                                        stroke={getRelationshipColor(rel.type)} 
                                                                        strokeWidth="8" 
                                                                        fill="none"
                                                                        opacity="0.3"
                                                                        filter="url(#glow)"
                                                                        style={{ pointerEvents: 'none' }}
                                                                    />
                                                                    {/* Main line - clickable */}
                                                                    <path d={pathData} 
                                                                        stroke={getRelationshipColor(rel.type)} 
                                                                        strokeWidth="3" 
                                                                        fill="none"
                                                                        markerEnd={`url(#arrowhead-${rel.type})`}
                                                                        opacity="0.9"
                                                                        style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
                                                                        onClick={(e) => handleRelationshipClick(e, arc.characterId, rel.targetCharacterId, rel.type)}
                                                                        className="hover:opacity-100"
                                                                    />
                                                                    {/* Invisible wider hit area for easier clicking */}
                                                                    <path d={pathData} 
                                                                        stroke="transparent" 
                                                                        strokeWidth="20" 
                                                                        fill="none"
                                                                        style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
                                                                        onClick={(e) => handleRelationshipClick(e, arc.characterId, rel.targetCharacterId, rel.type)}
                                                                    />
                                                                </g>
                                                            );
                                                        })
                                                    );
                                                })()}
                                            </svg>
                                            
                                            {/* Relationship Buttons (Clickable) */}
                                            {(() => {
                                                const drawnButtons = new Set();
                                                return arcs.map(arc => 
                                                    arc.relationships?.map((rel, idx) => {
                                                        const fromChar = characters.find(c => c.id === arc.characterId);
                                                        const toChar = characters.find(c => c.id === rel.targetCharacterId);
                                                        if (!fromChar || !toChar) return null;
                                                        
                                                        // Create a unique key for this relationship pair (sorted to avoid duplicates)
                                                        const relKey = [arc.characterId, rel.targetCharacterId].sort().join('-') + '-' + rel.type;
                                                        
                                                        // Skip if we've already drawn this button
                                                        if (drawnButtons.has(relKey)) return null;
                                                        drawnButtons.add(relKey);
                                                        
                                                        // Get exact connector positions
                                                        const fromPos = getConnectorPosition(fromChar, rel.type, 'output');
                                                        const toPos = getConnectorPosition(toChar, rel.type, 'input');
                                                        
                                                        const midX = (fromPos.x + toPos.x) / 2;
                                                        const midY = (fromPos.y + toPos.y) / 2;
                                                        
                                                        return (
                                                            <button
                                                                key={`btn-${arc.characterId}-${idx}`}
                                                                onClick={(e) => handleRelationshipClick(e, arc.characterId, rel.targetCharacterId, rel.type)}
                                                                className="absolute px-2 py-1 rounded-full text-xs font-bold shadow-md hover:scale-110 transition-transform cursor-pointer border-2"
                                                                style={{
                                                                    left: `${midX}px`,
                                                                    top: `${midY - 12}px`,
                                                                    transform: 'translate(-50%, -50%)',
                                                                    backgroundColor: getRelationshipColor(rel.type),
                                                                    borderColor: getRelationshipColor(rel.type),
                                                                    color: '#fff',
                                                                    zIndex: 20
                                                                }}
                                                                title="Click to change relationship type"
                                                            >
                                                                {rel.type}
                                                            </button>
                                                        );
                                                    })
                                                );
                                            })()}
                                            
                                            {/* Character Nodes */}
                                            {characters.map(char => {
                                                const arc = arcs.find(a => a.characterId === char.id);
                                                const isSelected = selectedCharacterId === char.id;
                                                
                                                // Get unique relationship types for this character
                                                const relationshipTypes = arc?.relationships ? 
                                                    [...new Set(arc.relationships.map(r => r.type))] : [];
                                                
                                                return (
                                                    <div key={char.id}
                                                        onMouseDown={(e) => handleCharMouseDown(e, char.id)}
                                                        onClick={() => setSelectedCharacterId(char.id)}
                                                        onContextMenu={(e) => handleRightClick(e, char.id)}
                                                        style={{
                                                            position: 'absolute',
                                                            left: `${char.x}px`,
                                                            top: `${char.y}px`,
                                                            cursor: draggingChar?.id === char.id ? 'grabbing' : 'grab',
                                                            zIndex: isSelected ? 50 : 10,
                                                            userSelect: 'none'
                                                        }}
                                                        className={`w-60 rounded-lg border-2 transition-all shadow-md ${
                                                            isSelected
                                                                ? 'bg-primary/10 border-primary shadow-lg'
                                                                : 'bg-panel-light dark:bg-panel-dark border-border-light dark:border-border-dark hover:border-primary/50 hover:shadow-lg'
                                                        }`}
                                                    >
                                                        {/* Header with gradient */}
                                                        <div className={`px-4 py-3 rounded-t border-b border-border-light dark:border-border-dark ${
                                                            isSelected 
                                                                ? 'bg-gradient-to-r from-primary/30 to-accent/30' 
                                                                : 'bg-gradient-to-r from-primary/10 to-accent/10'
                                                        }`}>
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-bold text-sm text-textMain-light dark:text-textMain-dark truncate">
                                                                        {char.name}
                                                                    </div>
                                                                    <div className="text-xs text-textMuted-light dark:text-textMuted-dark mt-1">
                                                                        Arc: {arc?.arcType || 'N/A'}
                                                                    </div>
                                                                </div>
                                                                {/* Color labels for relationships */}
                                                                {relationshipTypes.length > 0 && (
                                                                    <div className="flex gap-1 ml-2">
                                                                        {relationshipTypes.slice(0, 3).map((type, idx) => (
                                                                            <div 
                                                                                key={idx}
                                                                                className="w-3 h-3 rounded-full border"
                                                                                style={{ 
                                                                                    backgroundColor: getRelationshipColor(type),
                                                                                    borderColor: getRelationshipColor(type),
                                                                                    boxShadow: `0 0 6px ${getRelationshipColor(type)}`
                                                                                }}
                                                                                title={type}
                                                                            />
                                                                        ))}
                                                                        {relationshipTypes.length > 3 && (
                                                                            <div className="text-xs font-bold text-textMuted-light dark:text-textMuted-dark">
                                                                                +{relationshipTypes.length - 3}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Content */}
                                                        <div className="px-4 py-3 space-y-3 text-xs">
                                                            {/* Emotional States */}
                                                            {(arc?.startingEmotionalState || arc?.endingEmotionalState) && (
                                                                <div className="bg-input-light dark:bg-input-dark p-2 rounded border border-border-light dark:border-border-dark">
                                                                    <div className="font-semibold text-textMuted-light dark:text-textMuted-dark mb-1">Emotional Arc</div>
                                                                    {arc?.startingEmotionalState && (
                                                                        <div className="text-xs mb-1">
                                                                            <span className="font-semibold">Start:</span> {arc.startingEmotionalState.substring(0, 30)}...
                                                                        </div>
                                                                    )}
                                                                    {arc?.endingEmotionalState && (
                                                                        <div className="text-xs">
                                                                            <span className="font-semibold">End:</span> {arc.endingEmotionalState.substring(0, 30)}...
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            
                                                            {/* Turning Points */}
                                                            {arc?.keyTurningPoints && arc.keyTurningPoints.length > 0 && (
                                                                <div>
                                                                    <div className="font-semibold text-textMuted-light dark:text-textMuted-dark mb-1">Turning Points</div>
                                                                    {arc.keyTurningPoints.slice(0, 2).map((point, idx) => (
                                                                        <div key={idx} className="text-xs text-textMuted-light dark:text-textMuted-dark truncate">
                                                                            • {point.substring(0, 25)}...
                                                                        </div>
                                                                    ))}
                                                                    {arc.keyTurningPoints.length > 2 && (
                                                                        <div className="text-xs text-primary font-semibold">
                                                                            +{arc.keyTurningPoints.length - 2} more
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            
                                                            {/* Relationships */}
                                                            {arc?.relationships && arc.relationships.length > 0 && (
                                                                <div>
                                                                    <div className="font-semibold text-textMuted-light dark:text-textMuted-dark mb-1">Relationships</div>
                                                                    {arc.relationships.slice(0, 3).map((rel, idx) => {
                                                                        const targetChar = characters.find(c => c.id === rel.targetCharacterId);
                                                                        return (
                                                                            <div key={idx} className="text-xs flex items-center gap-1">
                                                                                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: getRelationshipColor(rel.type) }} />
                                                                                <span className="font-semibold">{rel.type}:</span>
                                                                                <span className="truncate">{targetChar?.name || 'Unknown'}</span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                    {arc.relationships.length > 3 && (
                                                                        <div className="text-xs text-primary font-semibold">
                                                                            +{arc.relationships.length - 3} more relationships
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            
                                                            {/* Emotional Beats */}
                                                            {arc?.emotionalBeats && arc.emotionalBeats.length > 0 && (
                                                                <div className="flex items-center gap-2 text-textMuted-light dark:text-textMuted-dark">
                                                                    <span>📊</span>
                                                                    <span className="font-semibold">{arc.emotionalBeats.length} emotional beats</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Footer */}
                                                        <div className="px-4 py-2 border-t border-border-light dark:border-border-dark bg-input-light dark:bg-input-dark rounded-b text-xs text-textMuted-light dark:text-textMuted-dark text-center">
                                                            Drag connectors to link • Right-click for options
                                                        </div>
                                                        
                                                        {/* 8 Color-Coded Connectors - Left Side (Inputs) - Glass Style Outside Border */}
                                                        {['ally', 'enemy', 'mentor', 'student', 'love', 'rival', 'family', 'neutral'].map((relType, idx) => (
                                                            <div 
                                                                key={`input-${relType}`}
                                                                onMouseDown={(e) => handleConnectorMouseDown(e, char.id, relType)}
                                                                onMouseUp={(e) => handleConnectorMouseUp(e, char.id, relType)}
                                                                onMouseEnter={() => setHoveredConnector({ charId: char.id, type: relType })}
                                                                onMouseLeave={() => setHoveredConnector(null)}
                                                                className="absolute w-2.5 h-2.5 rounded-full cursor-pointer hover:scale-[2.5] transition-all z-50"
                                                                style={{ 
                                                                    top: `${30 + idx * 18}px`,
                                                                    left: '-6px',
                                                                    background: `linear-gradient(135deg, ${getRelationshipColor(relType)}CC, ${getRelationshipColor(relType)}66)`,
                                                                    border: `1.5px solid ${getRelationshipColor(relType)}`,
                                                                    backdropFilter: 'blur(8px)',
                                                                    WebkitBackdropFilter: 'blur(8px)',
                                                                    boxShadow: hoveredConnector?.charId === char.id && hoveredConnector?.type === relType 
                                                                        ? `0 0 16px ${getRelationshipColor(relType)}, inset 0 1px 2px rgba(255,255,255,0.3)` 
                                                                        : `0 2px 4px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.2)`
                                                                }}
                                                                title={`${relType} input`}
                                                            />
                                                        ))}
                                                        
                                                        {/* 8 Color-Coded Connectors - Right Side (Outputs) - Glass Style Outside Border */}
                                                        {['ally', 'enemy', 'mentor', 'student', 'love', 'rival', 'family', 'neutral'].map((relType, idx) => (
                                                            <div 
                                                                key={`output-${relType}`}
                                                                onMouseDown={(e) => handleConnectorMouseDown(e, char.id, relType)}
                                                                onMouseUp={(e) => handleConnectorMouseUp(e, char.id, relType)}
                                                                onMouseEnter={() => setHoveredConnector({ charId: char.id, type: relType })}
                                                                onMouseLeave={() => setHoveredConnector(null)}
                                                                className="absolute w-2.5 h-2.5 rounded-full cursor-pointer hover:scale-[2.5] transition-all z-50"
                                                                style={{ 
                                                                    top: `${30 + idx * 18}px`,
                                                                    right: '-6px',
                                                                    background: `linear-gradient(135deg, ${getRelationshipColor(relType)}CC, ${getRelationshipColor(relType)}66)`,
                                                                    border: `1.5px solid ${getRelationshipColor(relType)}`,
                                                                    backdropFilter: 'blur(8px)',
                                                                    WebkitBackdropFilter: 'blur(8px)',
                                                                    boxShadow: hoveredConnector?.charId === char.id && hoveredConnector?.type === relType 
                                                                        ? `0 0 16px ${getRelationshipColor(relType)}, inset 0 1px 2px rgba(255,255,255,0.3)` 
                                                                        : `0 2px 4px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.2)`
                                                                }}
                                                                title={`${relType} output`}
                                                            />
                                                        ))}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    
                                    {/* Drawing Connection Line */}
                                    {drawingConnection && (
                                        <svg className="absolute inset-0 pointer-events-none" width="2000" height="1500" style={{ zIndex: 100 }}>
                                            <defs>
                                                <filter id="glow-drawing">
                                                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                                                    <feMerge>
                                                        <feMergeNode in="coloredBlur"/>
                                                        <feMergeNode in="SourceGraphic"/>
                                                    </feMerge>
                                                </filter>
                                            </defs>
                                            <path 
                                                d={getPathData(drawingConnection.startX, drawingConnection.startY, drawingConnection.endX, drawingConnection.endY, lineStyle)}
                                                stroke={getRelationshipColor(drawingConnection.relType)} 
                                                strokeWidth={drawingConnection.snappedTo ? "6" : "4"} 
                                                strokeDasharray="8 8"
                                                fill="none"
                                                opacity={drawingConnection.snappedTo ? "1" : "0.7"}
                                                filter={drawingConnection.snappedTo ? "url(#glow-drawing)" : "none"}
                                            />
                                        </svg>
                                    )}
                                    
                                    {/* Context Menu */}
                                    {contextMenu && (
                                        <div 
                                            className="fixed bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg py-1 z-[100]"
                                            style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {contextMenu.type === 'editRelationship' ? (
                                                <>
                                                    <div className="px-3 py-1 text-xs font-semibold text-textMuted-light dark:text-textMuted-dark border-b border-border-light dark:border-border-dark">
                                                        Change Relationship Type
                                                    </div>
                                                    {(() => {
                                                        const availableTypes = getAvailableRelationshipTypes(contextMenu.fromCharId, contextMenu.toCharId);
                                                        
                                                        return ['ally', 'enemy', 'mentor', 'student', 'love', 'rival', 'family', 'neutral'].map(type => {
                                                            const isAvailable = availableTypes.includes(type);
                                                            const isCurrent = type === contextMenu.currentType;
                                                            
                                                            return (
                                                                <button 
                                                                    key={type}
                                                                    onClick={() => isAvailable ? changeRelationshipType(contextMenu.fromCharId, contextMenu.toCharId, contextMenu.currentType, type) : null}
                                                                    disabled={!isAvailable}
                                                                    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                                                                        isCurrent ? 'bg-primary/20 font-semibold' : 
                                                                        isAvailable ? 'hover:bg-primary/10' : 
                                                                        'opacity-40 cursor-not-allowed'
                                                                    }`}
                                                                    title={!isAvailable ? `Incompatible with other relationships` : ''}
                                                                >
                                                                    <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: getRelationshipColor(type) }} />
                                                                    <span className="capitalize">{type}</span>
                                                                    {!isAvailable && <Icon name="Lock" size={12} className="ml-auto" />}
                                                                </button>
                                                            );
                                                        });
                                                    })()}
                                                    <div className="border-t border-border-light dark:border-border-dark mt-1">
                                                        <button 
                                                            onClick={() => deleteRelationship(contextMenu.fromCharId, contextMenu.toCharId, contextMenu.currentType)}
                                                            className="w-full px-3 py-2 text-left text-sm hover:bg-red-500/10 text-red-500 flex items-center gap-2"
                                                        >
                                                            <Icon name="Trash2" size={14} />
                                                            <span>Delete Relationship</span>
                                                        </button>
                                                    </div>
                                                </>
                                            ) : contextMenu.type === 'character' ? (
                                                <>
                                                    <div className="px-3 py-1 text-xs font-semibold text-textMuted-light dark:text-textMuted-dark border-b border-border-light dark:border-border-dark">
                                                        {characters.find(c => c.id === contextMenu.charId)?.name || 'Character'}
                                                    </div>
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedCharacterId(contextMenu.charId);
                                                            setViewMode('list');
                                                            setContextMenu(null);
                                                        }}
                                                        className="w-full px-3 py-2 text-left text-sm hover:bg-primary/10 flex items-center gap-2"
                                                    >
                                                        <Icon name="Edit" size={14} />
                                                        <span>Edit Character</span>
                                                    </button>
                                                    
                                                    {/* Connect To submenu */}
                                                    {characters.filter(c => c.id !== contextMenu.charId).length > 0 && (
                                                        <>
                                                            <div className="border-t border-border-light dark:border-border-dark mt-1 pt-1">
                                                                <div className="px-3 py-1 text-xs font-semibold text-textMuted-light dark:text-textMuted-dark">
                                                                    Connect To
                                                                </div>
                                                                <div className="max-h-48 overflow-y-auto">
                                                                    {characters.filter(c => c.id !== contextMenu.charId).map(targetChar => (
                                                                        <div key={targetChar.id} className="relative group">
                                                                            <button 
                                                                                className="w-full px-3 py-2 text-left text-sm hover:bg-primary/10 flex items-center justify-between"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    // Show relationship type submenu
                                                                                    setContextMenu({
                                                                                        ...contextMenu,
                                                                                        type: 'connectTo',
                                                                                        targetCharId: targetChar.id
                                                                                    });
                                                                                }}
                                                                            >
                                                                                <span>{targetChar.name}</span>
                                                                                <Icon name="ChevronRight" size={12} />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                    
                                                    <div className="border-t border-border-light dark:border-border-dark mt-1">
                                                        <button 
                                                            onClick={() => deleteCharacter(contextMenu.charId)}
                                                            className="w-full px-3 py-2 text-left text-sm hover:bg-red-500/10 text-red-500 flex items-center gap-2"
                                                        >
                                                            <Icon name="Trash2" size={14} />
                                                            <span>Delete Character</span>
                                                        </button>
                                                    </div>
                                                </>
                                            ) : contextMenu.type === 'connectTo' ? (
                                                <>
                                                    <div className="px-3 py-1 text-xs font-semibold text-textMuted-light dark:text-textMuted-dark border-b border-border-light dark:border-border-dark flex items-center gap-2">
                                                        <button 
                                                            onClick={() => setContextMenu({ ...contextMenu, type: 'character' })}
                                                            className="hover:text-primary"
                                                        >
                                                            <Icon name="ChevronLeft" size={12} />
                                                        </button>
                                                        <span>Select Relationship Type</span>
                                                    </div>
                                                    {(() => {
                                                        const availableTypes = getAvailableRelationshipTypes(contextMenu.charId, contextMenu.targetCharId);
                                                        const fromArc = arcs.find(a => a.characterId === contextMenu.charId);
                                                        const existingRel = fromArc?.relationships?.find(r => r.targetCharacterId === contextMenu.targetCharId);
                                                        
                                                        return ['ally', 'enemy', 'mentor', 'student', 'love', 'rival', 'family', 'neutral'].map(type => {
                                                            const isAvailable = availableTypes.includes(type);
                                                            const isCurrent = existingRel?.type === type;
                                                            
                                                            return (
                                                                <button 
                                                                    key={type}
                                                                    onClick={() => isAvailable ? handleConnectTo(contextMenu.charId, contextMenu.targetCharId, type) : null}
                                                                    disabled={!isAvailable}
                                                                    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                                                                        isCurrent ? 'bg-primary/20 font-semibold' : 
                                                                        isAvailable ? 'hover:bg-primary/10' : 
                                                                        'opacity-40 cursor-not-allowed'
                                                                    }`}
                                                                    title={!isAvailable ? `Incompatible with existing ${existingRel?.type} relationship` : ''}
                                                                >
                                                                    <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: getRelationshipColor(type) }} />
                                                                    <span className="capitalize">{type}</span>
                                                                    {isCurrent && <span className="ml-auto text-xs">(current)</span>}
                                                                    {!isAvailable && <Icon name="Lock" size={12} className="ml-auto" />}
                                                                </button>
                                                            );
                                                        });
                                                    })()}
                                                </>
                                            ) : null}
                                        </div>
                                    )}
                                    
                                    {/* Bottom Info Bar */}
                                    <div className="border-t border-border-light dark:border-border-dark bg-panel-light dark:bg-panel-dark p-3 flex items-center justify-between text-xs">
                                        <div className="flex gap-4">
                                            <div className="text-textMuted-light dark:text-textMuted-dark">
                                                👥 <span className="font-semibold">{characters.length}</span> characters
                                            </div>
                                            <div className="text-textMuted-light dark:text-textMuted-dark">
                                                🔗 <span className="font-semibold">{arcs.reduce((sum, a) => sum + (a.relationships?.length || 0), 0)}</span> relationships
                                            </div>
                                        </div>
                                        <div className="text-textMuted-light dark:text-textMuted-dark">
                                            Zoom: <span className="font-semibold">{Math.round(mapZoom * 100)}%</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-border-light dark:border-border-dark p-4 flex justify-end gap-3">
                            <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-panel-light dark:hover:bg-panel-dark">
                                Close
                            </button>
                            <button onClick={() => onSave(arcs, localCharacters)} className="px-6 py-2 rounded-lg bg-primary text-black font-semibold hover:bg-primaryHover">
                                Save Arcs & Characters
                            </button>
                        </div>
                    </div>
                </div>
            );
        };


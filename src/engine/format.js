export const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const pdfText = (value) => escapeHtml(value).replace(/\n/g, '<br>');

// ═══════════════════════════════════════════════════════════════════════════
        // FORMAT_CONVERTER MODULE
        // Converts projects to various export formats (TXT, Markdown, PDF, AI Prompt)
        // ═══════════════════════════════════════════════════════════════════════════
        export const Format_Converter = {
            // Convert to plain text format
            toPlainText(projectData) {
                if (!projectData) {
                    throw new Error('Project data is required');
                }
                
                let output = '';
                
                // Title and metadata
                output += `${projectData.title}\n`;
                output += `By ${projectData.author}\n`;
                output += `${'='.repeat(60)}\n\n`;
                
                // Synopsis section
                if (projectData.synopsis) {
                    output += 'SYNOPSIS\n';
                    output += `${'-'.repeat(60)}\n`;
                    if (projectData.synopsis.overview) {
                        output += `${projectData.synopsis.overview}\n\n`;
                    }
                    
                    if (projectData.synopsis.characters && projectData.synopsis.characters.length > 0) {
                        output += 'CHARACTERS:\n';
                        projectData.synopsis.characters.forEach(char => {
                            output += `  - ${char.name}: ${char.description || ''}\n`;
                        });
                        output += '\n';
                    }
                    
                    if (projectData.synopsis.setting) {
                        output += `SETTING: ${projectData.synopsis.setting}\n\n`;
                    }
                    
                    if (projectData.synopsis.themeTone) {
                        output += `THEME & TONE: ${projectData.synopsis.themeTone}\n\n`;
                    }
                }
                
                // Script content
                output += 'SCRIPT\n';
                output += `${'='.repeat(60)}\n\n`;
                
                if (projectData.scriptDocument && projectData.scriptDocument.scenes) {
                    projectData.scriptDocument.scenes.forEach((scene, sceneIdx) => {
                        // Scene heading
                        output += `${scene.heading || `SCENE ${sceneIdx + 1}`}\n\n`;
                        
                        // Shots
                        if (scene.shots && scene.shots.length > 0) {
                            scene.shots.forEach((shot, shotIdx) => {
                                if (shot.selections) {
                                    const sel = shot.selections;
                                    
                                    // Action line
                                    if (sel.action) {
                                        output += `${sel.action}\n\n`;
                                    }
                                    
                                    // Dialogue
                                    if (sel.character && sel.dialogue) {
                                        output += `                    ${sel.character.toUpperCase()}\n`;
                                        if (sel.parenthetical) {
                                            output += `              (${sel.parenthetical})\n`;
                                        }
                                        output += `          ${sel.dialogue}\n\n`;
                                    }
                                }
                            });
                        }
                        
                        output += '\n';
                    });
                }
                
                return output;
            },
            
            // Convert to Markdown format
            toMarkdown(projectData) {
                if (!projectData) {
                    throw new Error('Project data is required');
                }
                
                let output = '';
                
                // Title and metadata
                output += `# ${projectData.title}\n\n`;
                output += `**By ${projectData.author}**\n\n`;
                output += `---\n\n`;
                
                // Synopsis section
                if (projectData.synopsis) {
                    output += '## Synopsis\n\n';
                    if (projectData.synopsis.overview) {
                        output += `${projectData.synopsis.overview}\n\n`;
                    }
                    
                    if (projectData.synopsis.characters && projectData.synopsis.characters.length > 0) {
                        output += '### Characters\n\n';
                        projectData.synopsis.characters.forEach(char => {
                            output += `- **${char.name}**: ${char.description || ''}\n`;
                        });
                        output += '\n';
                    }
                    
                    if (projectData.synopsis.setting) {
                        output += `### Setting\n\n${projectData.synopsis.setting}\n\n`;
                    }
                    
                    if (projectData.synopsis.themeTone) {
                        output += `### Theme & Tone\n\n${projectData.synopsis.themeTone}\n\n`;
                    }
                }
                
                // Script content
                output += '## Script\n\n';
                
                if (projectData.scriptDocument && projectData.scriptDocument.scenes) {
                    projectData.scriptDocument.scenes.forEach((scene, sceneIdx) => {
                        // Scene heading as H3
                        output += `### ${scene.heading || `SCENE ${sceneIdx + 1}`}\n\n`;
                        
                        // Shots
                        if (scene.shots && scene.shots.length > 0) {
                            scene.shots.forEach((shot, shotIdx) => {
                                if (shot.selections) {
                                    const sel = shot.selections;
                                    
                                    // Action line as paragraph
                                    if (sel.action) {
                                        output += `${sel.action}\n\n`;
                                    }
                                    
                                    // Dialogue as blockquote
                                    if (sel.character && sel.dialogue) {
                                        output += `> **${sel.character.toUpperCase()}**`;
                                        if (sel.parenthetical) {
                                            output += ` *(${sel.parenthetical})*`;
                                        }
                                        output += `\n> \n> ${sel.dialogue}\n\n`;
                                    }
                                }
                            });
                        }
                    });
                }
                
                return output;
            },
            
            // Convert to JSON (project backup)
            toJSON(projectData) {
                if (!projectData) {
                    throw new Error('Project data is required');
                }
                
                return JSON.stringify(projectData, null, 2);
            },
            
            // Convert to AI prompt format
            toAIPrompt(projectData, templateKey = 'general') {
                if (!projectData) {
                    throw new Error('Project data is required');
                }
                
                const template = this.getPromptTemplate(templateKey);
                if (!template) {
                    throw new Error(`Template '${templateKey}' not found`);
                }
                
                // Build character list
                let characterList = '';
                if (projectData.synopsis && projectData.synopsis.characters && projectData.synopsis.characters.length > 0) {
                    characterList = projectData.synopsis.characters.map(char => 
                        `- ${char.name}: ${char.description || ''}`
                    ).join('\n');
                }
                
                // Build script content
                const scriptContent = this.toPlainText(projectData);
                
                // Replace placeholders
                let output = template.template;
                output = output.replace(/{title}/g, projectData.title);
                output = output.replace(/{author}/g, projectData.author);
                output = output.replace(/{synopsis}/g, projectData.synopsis?.overview || '');
                output = output.replace(/{characters}/g, characterList);
                output = output.replace(/{setting}/g, projectData.synopsis?.setting || '');
                output = output.replace(/{themeTone}/g, projectData.synopsis?.themeTone || '');
                output = output.replace(/{script}/g, scriptContent);
                
                // Add instructions
                if (template.instructions) {
                    output = template.instructions + '\n\n' + output;
                }
                
                return output;
            },
            
            // Get prompt template by key
            getPromptTemplate(key) {
                const templates = this.getPromptTemplates();
                return templates[key] || templates['general'];
            },
            
            // Get all available prompt templates
            getPromptTemplates() {
                // Load custom templates from localStorage
                const customTemplates = this._loadCustomTemplates();
                
                // Default templates
                const defaultTemplates = {
                    'general': {
                        name: 'General Story Generation',
                        description: 'Basic structure for general AI story generation',
                        template: `# {title}

## Synopsis

{synopsis}

## Characters

{characters}

## Setting

{setting}

## Theme & Tone

{themeTone}

## Script

{script}`,
                        instructions: 'This is a screenplay prompt for AI story generation. Please analyze the synopsis, characters, and script structure, then generate a complete story based on this material.'
                    },
                    'dialogue': {
                        name: 'Dialogue Expansion',
                        description: 'Focus on expanding and improving dialogue',
                        template: `# {title} - Dialogue Expansion

## Characters

{characters}

## Current Script

{script}

---

Please expand and enhance the dialogue in this script, making it more natural, engaging, and character-specific.`,
                        instructions: 'Focus on dialogue quality, character voice, and natural conversation flow.'
                    },
                    'scene-description': {
                        name: 'Scene Description',
                        description: 'Focus on visual and atmospheric details',
                        template: `# {title} - Scene Description Enhancement

## Setting

{setting}

## Theme & Tone

{themeTone}

## Current Script

{script}

---

Please enhance the scene descriptions with rich visual details, atmospheric elements, and cinematic imagery.`,
                        instructions: 'Focus on visual storytelling, atmosphere, and cinematic description.'
                    },
                    'storyboard': {
                        name: 'Storyboard Generation',
                        description: 'Generate detailed storyboard descriptions',
                        template: `# {title} - Storyboard Descriptions

## Synopsis

{synopsis}

## Script

{script}

---

Please generate detailed storyboard descriptions for each shot, including camera angles, movements, framing, and visual composition.`,
                        instructions: 'Focus on visual composition, camera work, and shot-by-shot breakdown.'
                    }
                };
                
                // Merge with custom templates
                return { ...defaultTemplates, ...customTemplates };
            },
            
            // Save custom prompt template
            saveCustomTemplate(name, template) {
                const customTemplates = this._loadCustomTemplates();
                const key = name.toLowerCase().replace(/\s+/g, '-');
                customTemplates[key] = {
                    name: name,
                    description: 'Custom template',
                    template: template,
                    instructions: '',
                    custom: true
                };
                
                try {
                    localStorage.setItem('mokha_custom_templates', JSON.stringify(customTemplates));
                    return key;
                } catch (e) {
                    console.error('Error saving custom template:', e);
                    throw new Error('Failed to save custom template');
                }
            },
            
            // Load custom templates from localStorage
            _loadCustomTemplates() {
                try {
                    const data = localStorage.getItem('mokha_custom_templates');
                    return data ? JSON.parse(data) : {};
                } catch (e) {
                    console.error('Error loading custom templates:', e);
                    return {};
                }
            },
            
            // Convert to PDF format
            toPDF(projectData) {
                if (!projectData) {
                    throw new Error('Project data is required');
                }
                
                // Check if html2pdf is available
                if (typeof html2pdf === 'undefined') {
                    console.error('html2pdf library not loaded, falling back to TXT');
                    return this._fallbackToTXT(projectData);
                }
                
                try {
                    // Create HTML content for PDF
                    const htmlContent = this._generatePDFHTML(projectData);
                    
                    // PDF options
                    const options = {
                        margin: [0.75, 0.75, 0.75, 0.75],
                        filename: `${projectData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: { scale: 2, useCORS: true },
                        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
                    };
                    
                    // Generate PDF
                    return html2pdf().set(options).from(htmlContent).save();
                } catch (e) {
                    console.error('PDF generation failed:', e);
                    return this._fallbackToTXT(projectData);
                }
            },
            
            // Generate HTML content for PDF
            _generatePDFHTML(projectData) {
                let html = '<div style="font-family: Courier, monospace; font-size: 12pt; line-height: 1.5;">';
                
                // Title page
                html += '<div style="text-align: center; margin-top: 200px; page-break-after: always;">';
                html += `<h1 style="font-size: 24pt; margin-bottom: 20px;">${escapeHtml(projectData.title)}</h1>`;
                html += `<p style="font-size: 14pt;">By ${escapeHtml(projectData.author)}</p>`;
                if (projectData.createdAt) {
                    const date = new Date(projectData.createdAt).toLocaleDateString();
                    html += `<p style="font-size: 12pt; margin-top: 40px;">${date}</p>`;
                }
                html += '</div>';
                
                // Synopsis page
                if (projectData.synopsis) {
                    html += '<div style="page-break-after: always;">';
                    html += '<h2 style="text-align: center; margin-bottom: 30px;">SYNOPSIS</h2>';
                    if (projectData.synopsis.overview) {
                        html += `<p>${pdfText(projectData.synopsis.overview)}</p>`;
                    }
                    if (projectData.synopsis.characters && projectData.synopsis.characters.length > 0) {
                        html += '<h3 style="margin-top: 30px;">Characters</h3>';
                        projectData.synopsis.characters.forEach(char => {
                            html += `<p><strong>${escapeHtml(char.name)}</strong>: ${pdfText(char.description || '')}</p>`;
                        });
                    }
                    html += '</div>';
                }
                
                // Script pages
                html += '<div>';
                if (projectData.scriptDocument && projectData.scriptDocument.scenes) {
                    projectData.scriptDocument.scenes.forEach((scene, sceneIdx) => {
                        // Scene heading
                        html += `<p style="margin-top: 20px; font-weight: bold;">${escapeHtml(scene.heading || `SCENE ${sceneIdx + 1}`)}</p>`;
                        
                        // Shots
                        if (scene.shots && scene.shots.length > 0) {
                            scene.shots.forEach(shot => {
                                if (shot.selections) {
                                    const sel = shot.selections;
                                    
                                    // Action
                                    if (sel.action) {
                                        html += `<p style="margin: 10px 0;">${pdfText(sel.action)}</p>`;
                                    }
                                    
                                    // Dialogue
                                    if (sel.character && sel.dialogue) {
                                        html += `<p style="text-align: center; margin: 10px 0;"><strong>${escapeHtml(String(sel.character || '').toUpperCase())}</strong></p>`;
                                        if (sel.parenthetical) {
                                            html += `<p style="text-align: center; margin: 5px 0;">(${escapeHtml(sel.parenthetical)})</p>`;
                                        }
                                        html += `<p style="text-align: center; margin: 10px 60px;">${pdfText(sel.dialogue)}</p>`;
                                    }
                                }
                            });
                        }
                    });
                }
                html += '</div>';
                
                // Appendix - Character Arcs
                if (projectData.characterArcs && projectData.characterArcs.characters && projectData.characterArcs.characters.length > 0) {
                    html += '<div style="page-break-before: always;">';
                    html += '<h2 style="text-align: center; margin-bottom: 30px;">APPENDIX: CHARACTER ARCS</h2>';
                    projectData.characterArcs.characters.forEach(char => {
                        html += `<h3>${escapeHtml(char.name)}</h3>`;
                        html += `<p><strong>Starting State:</strong> ${pdfText(char.startingState || 'N/A')}</p>`;
                        html += `<p><strong>Ending State:</strong> ${pdfText(char.endingState || 'N/A')}</p>`;
                        if (char.turningPoints && char.turningPoints.length > 0) {
                            html += '<p><strong>Turning Points:</strong></p><ul>';
                            char.turningPoints.forEach(tp => {
                                html += `<li>${pdfText(tp.description)}</li>`;
                            });
                            html += '</ul>';
                        }
                    });
                    html += '</div>';
                }
                
                html += '</div>';
                return html;
            },
            
            // Fallback to TXT if PDF generation fails
            _fallbackToTXT(projectData) {
                console.warn('Falling back to TXT export');
                const txtContent = this.toPlainText(projectData);
                const blob = new Blob([txtContent], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${projectData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        };


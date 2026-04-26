# Phase 3 Implementation Guide: Export Features

## 📍 Overview

Phase 3 adds comprehensive export functionality including AI prompt conversion, PDF export, TXT export, and Markdown export with customizable templates.

---

## Step 1: Add Export Modal Component

### Location: Before SaveProjectDialog component (around line 23480)

**Add this Export Modal component:**

```javascript
// ── Export Modal Component ────────────────────────────────────────────────
const ExportModal = ({ project, onClose }) => {
    const [exportFormat, setExportFormat] = useState('prompt');
    const [promptTemplate, setPromptTemplate] = useState('general');
    const [showPreview, setShowPreview] = useState(false);

    const promptTemplates = {
        general: `# ${project.title}

## Synopsis
${project.synopsis?.overview || 'No synopsis provided'}

## Characters
${project.synopsis?.characters?.map(c => `- ${c.name}: ${c.description || 'No description'}`).join('\n') || 'No characters'}

## Setting
${project.synopsis?.setting || 'No setting provided'}

## Theme
${project.synopsis?.theme || 'No theme provided'}

## Script
${formatScriptForPrompt(project.script)}

---
Instructions: This is a screenplay prompt for AI story generation. Please analyze the synopsis, characters, and script structure, then generate [specific request].`,

        dialogue: `# ${project.title} - Dialogue Expansion

## Current Script
${formatScriptForPrompt(project.script)}

---
Instructions: Please expand and enhance the dialogue in the above screenplay. Make conversations more natural, add subtext, and improve character voice consistency.`,

        storyboard: `# ${project.title} - Storyboard Descriptions

## Script
${formatScriptForPrompt(project.script)}

---
Instructions: Create detailed storyboard descriptions for each scene in the above screenplay. Include camera angles, composition, lighting, and visual storytelling elements.`,

        expansion: `# ${project.title} - Scene Expansion

## Current Script
${formatScriptForPrompt(project.script)}

---
Instructions: Expand the above screenplay by adding more scenes, deeper character development, and richer descriptions. Maintain the original story structure and tone.`
    };

    const formatScriptForPrompt = (script) => {
        let output = '';
        script.scenes.forEach(scene => {
            scene.shots.forEach(shot => {
                if (shot.sceneHeading) output += `\n${shot.sceneHeading.toUpperCase()}\n`;
                if (shot.action) output += `${shot.action}\n`;
                if (shot.dialogueBlocks) {
                    shot.dialogueBlocks.forEach(db => {
                        output += `\n${db.character.toUpperCase()}\n`;
                        if (db.parenthetical) output += `(${db.parenthetical})\n`;
                        output += `${db.dialogue}\n`;
                    });
                }
            });
        });
        return output;
    };

    const formatForPDF = (project) => {
        let html = `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">`;
        
        // Title page
        html += `<div style="page-break-after: always; text-align: center; padding: 100px 0;">
            <h1 style="font-size: 32px; margin-bottom: 20px;">${project.title}</h1>
            <p style="font-size: 18px; margin-bottom: 10px;">by ${project.author}</p>
            <p style="font-size: 14px; color: #666;">Story Type: ${project.blueprint?.storyType || 'Unknown'}</p>
        </div>`;

        // Synopsis
        if (project.synopsis?.overview) {
            html += `<div style="page-break-after: always;">
                <h2>Synopsis</h2>
                <p>${project.synopsis.overview}</p>
                ${project.synopsis.setting ? `<p><strong>Setting:</strong> ${project.synopsis.setting}</p>` : ''}
                ${project.synopsis.theme ? `<p><strong>Theme:</strong> ${project.synopsis.theme}</p>` : ''}
            </div>`;
        }

        // Script
        html += `<div><h2>Script</h2>`;
        project.script.scenes.forEach((scene, idx) => {
            html += `<div style="page-break-inside: avoid;">`;
            scene.shots.forEach(shot => {
                if (shot.sceneHeading) {
                    html += `<p style="font-weight: bold; margin-top: 20px; margin-bottom: 10px;">${shot.sceneHeading.toUpperCase()}</p>`;
                }
                if (shot.action) {
                    html += `<p style="margin-bottom: 10px;">${shot.action.replace(/\n/g, '<br>')}</p>`;
                }
                if (shot.dialogueBlocks) {
                    shot.dialogueBlocks.forEach(db => {
                        html += `<p style="text-align: center; font-weight: bold; margin-top: 10px;">${db.character.toUpperCase()}</p>`;
                        if (db.parenthetical) {
                            html += `<p style="text-align: center; font-style: italic; margin: 5px 0;">(${db.parenthetical})</p>`;
                        }
                        html += `<p style="text-align: center; margin-bottom: 10px;">${db.dialogue}</p>`;
                    });
                }
            });
            html += `</div>`;
        });
        html += `</div>`;

        html += `</div>`;
        return html;
    };

    const formatForTXT = (project) => {
        let output = `${project.title}\nby ${project.author}\n\n`;
        output += `${'='.repeat(60)}\n\n`;

        if (project.synopsis?.overview) {
            output += `SYNOPSIS\n${'-'.repeat(60)}\n${project.synopsis.overview}\n\n`;
            if (project.synopsis.setting) output += `Setting: ${project.synopsis.setting}\n`;
            if (project.synopsis.theme) output += `Theme: ${project.synopsis.theme}\n\n`;
        }

        output += `SCRIPT\n${'-'.repeat(60)}\n\n`;
        project.script.scenes.forEach(scene => {
            scene.shots.forEach(shot => {
                if (shot.sceneHeading) output += `${shot.sceneHeading.toUpperCase()}\n\n`;
                if (shot.action) output += `${shot.action}\n\n`;
                if (shot.dialogueBlocks) {
                    shot.dialogueBlocks.forEach(db => {
                        output += `${db.character.toUpperCase()}\n`;
                        if (db.parenthetical) output += `(${db.parenthetical})\n`;
                        output += `${db.dialogue}\n\n`;
                    });
                }
            });
        });

        return output;
    };

    const formatForMarkdown = (project) => {
        let output = `# ${project.title}\n\n`;
        output += `**by ${project.author}**\n\n`;

        if (project.synopsis?.overview) {
            output += `## Synopsis\n\n${project.synopsis.overview}\n\n`;
            if (project.synopsis.setting) output += `**Setting:** ${project.synopsis.setting}\n\n`;
            if (project.synopsis.theme) output += `**Theme:** ${project.synopsis.theme}\n\n`;
        }

        output += `## Script\n\n`;
        project.script.scenes.forEach(scene => {
            scene.shots.forEach(shot => {
                if (shot.sceneHeading) output += `### ${shot.sceneHeading}\n\n`;
                if (shot.action) output += `${shot.action}\n\n`;
                if (shot.dialogueBlocks) {
                    shot.dialogueBlocks.forEach(db => {
                        output += `**${db.character}**\n`;
                        if (db.parenthetical) output += `> *(${db.parenthetical})*\n`;
                        output += `> ${db.dialogue}\n\n`;
                    });
                }
            });
        });

        return output;
    };

    const handleExport = () => {
        let content = '';
        let filename = '';
        let mimeType = '';

        switch (exportFormat) {
            case 'prompt':
                content = promptTemplates[promptTemplate];
                filename = `${project.title}-prompt.txt`;
                mimeType = 'text/plain';
                break;
            case 'txt':
                content = formatForTXT(project);
                filename = `${project.title}.txt`;
                mimeType = 'text/plain';
                break;
            case 'markdown':
                content = formatForMarkdown(project);
                filename = `${project.title}.md`;
                mimeType = 'text/markdown';
                break;
            case 'pdf':
                const html = formatForPDF(project);
                html2pdf()
                    .from(html)
                    .set({
                        margin: 10,
                        filename: `${project.title}.pdf`,
                        html2canvas: { scale: 2 },
                        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                    })
                    .save();
                onClose();
                return;
            case 'json':
                content = JSON.stringify(project, null, 2);
                filename = `${project.title}-backup.json`;
                mimeType = 'application/json';
                break;
            default:
                return;
        }

        if (exportFormat === 'prompt') {
            // Copy to clipboard
            navigator.clipboard.writeText(content).then(() => {
                alert('Prompt copied to clipboard!');
                onClose();
            }).catch(() => {
                // Fallback: download instead
                const blob = new Blob([content], { type: mimeType });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                onClose();
            });
        } else {
            // Download file
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            onClose();
        }
    };

    const previewContent = exportFormat === 'prompt' ? promptTemplates[promptTemplate] : '';

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-panel-light dark:bg-panel-dark rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-border-light dark:border-border-dark">
                {/* Header */}
                <div className="p-6 border-b border-border-light dark:border-border-dark">
                    <h2 className="text-2xl font-bold">Export Project</h2>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
                    {/* Format Selection */}
                    <div>
                        <label className="block text-sm font-semibold mb-3">Export Format</label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: 'prompt', label: 'AI Prompt', desc: 'For AI story generation' },
                                { id: 'txt', label: 'Text File', desc: 'Plain text screenplay' },
                                { id: 'markdown', label: 'Markdown', desc: 'Markdown format' },
                                { id: 'pdf', label: 'PDF', desc: 'Professional PDF' },
                                { id: 'json', label: 'JSON', desc: 'Project backup' }
                            ].map(fmt => (
                                <button
                                    key={fmt.id}
                                    onClick={() => setExportFormat(fmt.id)}
                                    className={`p-3 rounded-lg border text-left transition-all ${
                                        exportFormat === fmt.id
                                            ? 'border-primary bg-primary/10'
                                            : 'border-border-light dark:border-border-dark hover:border-primary/50'
                                    }`}
                                >
                                    <div className="font-semibold text-sm">{fmt.label}</div>
                                    <div className="text-xs text-textMuted-light dark:text-textMuted-dark">{fmt.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Template Selection (for AI Prompt) */}
                    {exportFormat === 'prompt' && (
                        <div>
                            <label className="block text-sm font-semibold mb-3">Prompt Template</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'general', label: 'General', desc: 'Standard story generation' },
                                    { id: 'dialogue', label: 'Dialogue', desc: 'Expand dialogue' },
                                    { id: 'storyboard', label: 'Storyboard', desc: 'Visual descriptions' },
                                    { id: 'expansion', label: 'Expansion', desc: 'Expand scenes' }
                                ].map(tpl => (
                                    <button
                                        key={tpl.id}
                                        onClick={() => setPromptTemplate(tpl.id)}
                                        className={`p-3 rounded-lg border text-left transition-all ${
                                            promptTemplate === tpl.id
                                                ? 'border-primary bg-primary/10'
                                                : 'border-border-light dark:border-border-dark hover:border-primary/50'
                                        }`}
                                    >
                                        <div className="font-semibold text-sm">{tpl.label}</div>
                                        <div className="text-xs text-textMuted-light dark:text-textMuted-dark">{tpl.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Preview */}
                    {exportFormat === 'prompt' && (
                        <div>
                            <button
                                onClick={() => setShowPreview(!showPreview)}
                                className="text-sm font-semibold text-primary hover:underline"
                            >
                                {showPreview ? '▼ Hide Preview' : '▶ Show Preview'}
                            </button>
                            {showPreview && (
                                <div className="mt-3 p-4 bg-input-light dark:bg-input-dark rounded-lg border border-border-light dark:border-border-dark max-h-64 overflow-y-auto">
                                    <pre className="text-xs whitespace-pre-wrap font-mono">{previewContent}</pre>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-border-light dark:border-border-dark p-6 flex gap-2">
                    <button
                        onClick={handleExport}
                        className="flex-1 px-4 py-2 rounded-lg bg-primary text-black font-semibold hover:bg-primaryHover"
                    >
                        {exportFormat === 'prompt' ? 'Copy to Clipboard' : 'Download'}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-input-light dark:hover:bg-input-dark"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};
```

---

## Step 2: Add Export Button to Toolbar

### Location: In ProScriptBuilder toolbar (after Preview button)

**Add this button:**

```javascript
<button 
    onClick={() => setShowExportModal(true)}
    title="Export Project"
    className="flex-1 md:flex-none px-2 md:px-3 py-1 md:py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark hover:border-primary/50 flex items-center gap-1 md:gap-2 text-xs md:text-sm font-semibold"
>
    <Icon name="Download" size={14} />
    <span className="hidden md:inline">Export</span>
</button>
```

---

## Step 3: Add State Variable

### Location: ProScriptBuilder state section (after showStoryOutput)

**Add this state:**

```javascript
const [showExportModal, setShowExportModal] = useState(false);
```

---

## Step 4: Render Export Modal

### Location: Before closing div of ProScriptBuilder return

**Add this modal render:**

```javascript
{/* Export Modal */}
{showExportModal && (
    <ExportModal
        project={{
            title: projectTitle || 'Untitled',
            author: projectAuthor || 'Unknown',
            blueprint: blueprint,
            script: script,
            synopsis: synopsis,
            characterArcs: characterArcs
        }}
        onClose={() => setShowExportModal(false)}
    />
)}
```

---

## 🧪 Testing Checklist

After implementation, test these scenarios:

### Export Modal
- [ ] Click "Export" button → Export Modal opens
- [ ] Modal shows 5 format options
- [ ] Close button works
- [ ] Click outside to close works

### AI Prompt Export
- [ ] Select "AI Prompt" format
- [ ] 4 template options appear
- [ ] Select each template → Preview updates
- [ ] Click "Show Preview" → Preview displays
- [ ] Click "Copy to Clipboard" → Prompt copied
- [ ] Success message appears

### Text Export
- [ ] Select "Text File" format
- [ ] Click "Download" → TXT file downloads
- [ ] File contains formatted screenplay
- [ ] File includes synopsis

### Markdown Export
- [ ] Select "Markdown" format
- [ ] Click "Download" → MD file downloads
- [ ] File contains markdown formatting
- [ ] Scene headings are H3 headers
- [ ] Dialogue is in blockquotes

### PDF Export
- [ ] Select "PDF" format
- [ ] Click "Download" → PDF file downloads
- [ ] PDF has title page
- [ ] PDF includes synopsis
- [ ] PDF has proper formatting
- [ ] Page breaks work correctly

### JSON Export
- [ ] Select "JSON" format
- [ ] Click "Download" → JSON file downloads
- [ ] File contains complete project data
- [ ] File is valid JSON

### Data Accuracy
- [ ] Project title appears in exports
- [ ] Author name appears in exports
- [ ] Synopsis content is included
- [ ] All script content is included
- [ ] Character names are correct
- [ ] Dialogue is complete

---

## 🎯 Success Criteria

Phase 3 is complete when:

1. ✅ Export Modal displays all format options
2. ✅ AI Prompt export works with 4 templates
3. ✅ Text export downloads correctly
4. ✅ Markdown export downloads correctly
5. ✅ PDF export downloads correctly
6. ✅ JSON export downloads correctly
7. ✅ Preview works for AI prompts
8. ✅ Copy to clipboard works
9. ✅ All exports contain correct data
10. ✅ No console errors

---

## 💡 Implementation Tips

1. **Test incrementally** - Test each export format
2. **Check file contents** - Verify exported files are correct
3. **Test clipboard** - Verify copy to clipboard works
4. **Test templates** - Verify all 4 prompt templates work
5. **Test preview** - Verify preview displays correctly

---

**Ready to implement!** Follow each step in order.


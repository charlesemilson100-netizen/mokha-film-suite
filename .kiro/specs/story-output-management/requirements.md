# Requirements Document

## Introduction

The Story Output & Management System transforms the Pro Script Builder from a single-session scriptwriting tool into a comprehensive project management platform. It enables screenwriters to save multiple story projects to browser localStorage, load previously saved stories, view formatted story text in real-time, customize synopsis and character information, and export complete stories as AI-ready prompts. The system integrates seamlessly with the existing Pro Script Builder, Story Blueprint Engine, and Director Brain features.

## Glossary

- **Story_Project**: A complete saved project containing a Story Blueprint, Script Document, Character Arc data, and metadata (title, author, last modified date).
- **Project_Library**: The collection of all saved Story Projects stored in browser localStorage.
- **Story_Output_Panel**: A live preview panel that displays the formatted story text with professional screenplay formatting.
- **Synopsis_Section**: An editable section at the top of the story output containing project overview, character descriptions, setting information, and theme/tone.
- **AI_Prompt_Export**: The process of converting the complete story (synopsis + script) into a formatted text file optimized for AI story generation tools.
- **Auto_Save**: Automatic periodic saving of the current Story Project to localStorage without user intervention.
- **Project_Thumbnail**: A visual preview of a Story Project shown in the Project Library, typically displaying the first scene or a generated preview image.
- **Export_Format**: The file format for story export (TXT for AI prompts, JSON for project backup).
- **Real_Time_Formatting**: Automatic formatting of script elements (scene headings, dialogue, action) as the user types in the Pro Script Builder.
- **Character_Mention_Highlighting**: Visual highlighting of character names when they appear in action lines or dialogue.
- **Scene_Breakdown**: A structured view of the script showing each scene with its heading, action count, dialogue count, and duration estimate.
- **Word_Count**: The total number of words in the script, excluding scene headings and character names.
- **Page_Count**: The estimated number of pages based on screenplay formatting conventions (1 page ≈ 1 minute of screen time).
- **Reading_Time**: The estimated time to read the script aloud, calculated from word count and average reading speed.
- **Character_Arc_Summary**: A condensed view of each character's transformation throughout the story, shown in the story output.
- **LocalStorage_Manager**: The module responsible for saving, loading, and managing Story Projects in browser localStorage.
- **Format_Converter**: The module that converts Script Documents into various export formats (AI prompts, PDF, TXT, Markdown).

## Requirements

### Requirement 1: Project Saving to LocalStorage

**User Story:** As a screenwriter, I want to save my story projects to browser localStorage, so that I can work on multiple projects and return to them later without losing my work.

#### Acceptance Criteria

1. WHEN the user clicks "Save Project" in the Pro Script Builder, THE LocalStorage_Manager SHALL save the current Story_Project (including Story Blueprint, Script Document, Character Arc data, and metadata) to browser localStorage.
2. WHEN a Story_Project is saved, THE LocalStorage_Manager SHALL generate a unique project ID and store it with the project data.
3. WHEN a Story_Project is saved, THE LocalStorage_Manager SHALL update the project's lastModified timestamp to the current date and time.
4. WHEN the user saves a project for the first time, THE LocalStorage_Manager SHALL prompt the user to enter a project title and author name.
5. IF the user has already saved the current project, THEN clicking "Save Project" SHALL update the existing saved project rather than creating a duplicate.
6. THE LocalStorage_Manager SHALL store all Story_Projects in a single localStorage key as a JSON array of project objects.
7. WHEN localStorage is full or unavailable, THE LocalStorage_Manager SHALL display an error message and suggest exporting projects as JSON files for backup.

### Requirement 2: Project Loading from LocalStorage

**User Story:** As a screenwriter, I want to load previously saved story projects, so that I can continue working on them from where I left off.

#### Acceptance Criteria

1. WHEN the user clicks "Open Project" in the Pro Script Builder, THE LocalStorage_Manager SHALL display the Project_Library showing all saved Story_Projects.
2. THE Project_Library SHALL display each Story_Project with: project title, author name, last modified date, project thumbnail, and a brief description (first 100 characters of synopsis).
3. WHEN the user clicks on a Story_Project in the Project_Library, THE LocalStorage_Manager SHALL load the project data and populate the Pro Script Builder with the Story Blueprint, Script Document, and Character Arc data.
4. WHEN a project is loaded, THE Pro Script Builder SHALL restore the user's last editing position (scene and shot).
5. IF the user has unsaved changes in the current project, THEN clicking "Open Project" SHALL display a confirmation dialog: "You have unsaved changes. Save before opening another project?"
6. THE Project_Library SHALL support sorting projects by: last modified date, project title (alphabetical), or creation date.
7. THE Project_Library SHALL support searching projects by title or author name.

### Requirement 3: Project Deletion and Management

**User Story:** As a screenwriter, I want to delete old or unwanted story projects, so that I can keep my Project Library organized and free up localStorage space.

#### Acceptance Criteria

1. WHEN the user right-clicks on a Story_Project in the Project_Library, THE LocalStorage_Manager SHALL display a context menu with options: "Open", "Duplicate", "Export as JSON", "Delete".
2. WHEN the user clicks "Delete" on a Story_Project, THE LocalStorage_Manager SHALL display a confirmation dialog: "Are you sure you want to delete '[Project Title]'? This cannot be undone."
3. WHEN the user confirms deletion, THE LocalStorage_Manager SHALL remove the project from localStorage and update the Project_Library display.
4. WHEN the user clicks "Duplicate" on a Story_Project, THE LocalStorage_Manager SHALL create a copy of the project with " (Copy)" appended to the title.
5. WHEN the user clicks "Export as JSON" on a Story_Project, THE LocalStorage_Manager SHALL download the project data as a JSON file named "[project-title].json".
6. THE LocalStorage_Manager SHALL display the total number of saved projects and the approximate localStorage usage (e.g., "5 projects, 2.3 MB used").
7. WHEN localStorage usage exceeds 80% of the available quota, THE LocalStorage_Manager SHALL display a warning message suggesting the user delete old projects or export them as JSON backups.

### Requirement 4: Auto-Save Functionality

**User Story:** As a screenwriter, I want my work to be automatically saved at regular intervals, so that I don't lose progress if I forget to save manually or if the browser crashes.

#### Acceptance Criteria

1. WHEN the user makes changes to the Script Document, Story Blueprint, or Character Arc data, THE Auto_Save system SHALL automatically save the project to localStorage after 30 seconds of inactivity.
2. WHEN an auto-save occurs, THE Auto_Save system SHALL display a subtle notification: "Auto-saved at [time]" that fades out after 2 seconds.
3. THE Auto_Save system SHALL NOT interrupt the user's typing or editing workflow.
4. WHEN the user manually saves the project, THE Auto_Save timer SHALL reset.
5. THE Auto_Save system SHALL be enabled by default but can be disabled in the application settings.
6. WHEN Auto_Save is disabled, THE Pro Script Builder SHALL display a warning icon next to the project title indicating unsaved changes.
7. THE Auto_Save system SHALL NOT save if no changes have been made since the last save.

### Requirement 5: Real-Time Story Output Panel

**User Story:** As a screenwriter, I want to see a live preview of my formatted story text as I edit the script, so that I can visualize how the final output will look without exporting.

#### Acceptance Criteria

1. WHEN the Pro Script Builder is open, THE Story_Output_Panel SHALL display a live preview of the formatted story text in a side panel or modal.
2. THE Story_Output_Panel SHALL update automatically whenever the user edits the Script Document, with a debounce delay of 500ms to avoid excessive re-rendering.
3. THE Story_Output_Panel SHALL display the story in professional screenplay format with: scene headings in all caps, action lines left-aligned, character names centered and in all caps, dialogue centered, and parentheticals in lowercase.
4. THE Story_Output_Panel SHALL apply syntax highlighting to different screenplay elements: scene headings in bold, character names in a distinct color, dialogue in regular text, and action lines in a muted color.
5. WHEN the user hovers over a character name in the Story_Output_Panel, THE panel SHALL highlight all other mentions of that character in the visible text.
6. THE Story_Output_Panel SHALL display page breaks at appropriate intervals (approximately every 55 lines of content).
7. THE Story_Output_Panel SHALL support toggling between "Screenplay Format" and "Prose Format" views.

### Requirement 6: Character Mention Highlighting

**User Story:** As a screenwriter, I want character names to be automatically highlighted in the story output, so that I can easily track character presence and dialogue distribution.

#### Acceptance Criteria

1. WHEN a character name appears in an action line or dialogue, THE Story_Output_Panel SHALL highlight the character name with a distinct background color.
2. THE Story_Output_Panel SHALL use different highlight colors for different characters (up to 8 distinct colors, cycling if more characters exist).
3. WHEN the user clicks on a highlighted character name, THE Story_Output_Panel SHALL display a tooltip showing: character archetype, total dialogue lines, total scenes present, and character arc summary (if defined).
4. THE Story_Output_Panel SHALL recognize character names even when they appear in different cases (e.g., "JOHN", "John", "john").
5. WHEN the user hovers over a character name, THE Story_Output_Panel SHALL temporarily highlight all other mentions of that character in the visible text with a pulsing animation.
6. THE character highlighting feature SHALL be optional and can be toggled on/off in the Story_Output_Panel settings.
7. WHEN a character is mentioned in a scene heading (e.g., "INT. JOHN'S APARTMENT - DAY"), THE Story_Output_Panel SHALL NOT highlight the name in the heading.

### Requirement 7: Customizable Synopsis Section

**User Story:** As a screenwriter, I want to add and edit a synopsis section at the top of my story output, so that I can provide context and background information for readers or AI tools.

#### Acceptance Criteria

1. WHEN the Story_Output_Panel is displayed, THE panel SHALL show a Synopsis_Section at the top, above the script content.
2. THE Synopsis_Section SHALL contain editable fields for: project overview (500 characters max), character list with descriptions, setting/location information, and theme/tone description.
3. WHEN the user clicks "Edit Synopsis" in the Story_Output_Panel, THE panel SHALL display an editable form for the Synopsis_Section fields.
4. WHEN the user saves the Synopsis_Section, THE changes SHALL be stored in the Story_Project and displayed in the Story_Output_Panel.
5. THE Synopsis_Section SHALL display characters from the Story Blueprint by default, but the user SHALL be able to add additional characters or edit existing character descriptions.
6. WHEN the user exports the story as an AI prompt, THE Synopsis_Section SHALL be included at the top of the exported text.
7. THE Synopsis_Section SHALL support basic Markdown formatting (bold, italic, bullet points) for better readability.

### Requirement 8: Convert to AI Prompt Button

**User Story:** As a filmmaker, I want to export my complete story (synopsis + script) as an AI-ready prompt, so that I can use it with AI story generation tools like ChatGPT or Claude.

#### Acceptance Criteria

1. WHEN the user clicks "Convert to Prompt" in the Story_Output_Panel, THE Format_Converter SHALL generate a formatted text file containing the Synopsis_Section followed by the complete Script Document.
2. THE AI_Prompt_Export SHALL format the output as: "# [Project Title]\n\n## Synopsis\n[synopsis content]\n\n## Characters\n[character list]\n\n## Script\n[formatted script]".
3. WHEN the AI prompt is generated, THE Format_Converter SHALL display a preview modal showing the formatted prompt text with options to "Copy to Clipboard" or "Download as TXT".
4. WHEN the user clicks "Copy to Clipboard", THE Format_Converter SHALL copy the entire prompt text to the system clipboard and display a confirmation message: "Prompt copied to clipboard!"
5. WHEN the user clicks "Download as TXT", THE Format_Converter SHALL download the prompt as a text file named "[project-title]-prompt.txt".
6. THE AI_Prompt_Export SHALL include instructions at the top of the prompt: "This is a screenplay prompt for AI story generation. Please analyze the synopsis, characters, and script structure, then generate [specific request]."
7. THE AI_Prompt_Export SHALL support customizable prompt templates (e.g., "Generate dialogue", "Expand scene descriptions", "Create storyboard descriptions").

### Requirement 9: Export to Multiple Formats

**User Story:** As a screenwriter, I want to export my story in different formats (PDF, TXT, Markdown), so that I can share it with collaborators or use it in different tools.

#### Acceptance Criteria

1. WHEN the user clicks "Export" in the Story_Output_Panel, THE Format_Converter SHALL display export format options: PDF, TXT, Markdown, and JSON (project backup).
2. WHEN the user selects PDF export, THE Format_Converter SHALL generate a PDF file with proper screenplay formatting, page breaks, title page, and page numbers.
3. WHEN the user selects TXT export, THE Format_Converter SHALL generate a plain text file with screenplay formatting preserved using text-based conventions.
4. WHEN the user selects Markdown export, THE Format_Converter SHALL generate a Markdown file with scene headings as H2 headers, action lines as paragraphs, and dialogue as blockquotes.
5. WHEN the user selects JSON export, THE Format_Converter SHALL export the complete Story_Project data (Story Blueprint, Script Document, Character Arc data, Synopsis) as a JSON file for backup or transfer.
6. THE exported files SHALL be named with the project title and export format (e.g., "my-story.pdf", "my-story.txt", "my-story.md", "my-story.json").
7. WHEN the user exports to PDF, THE Format_Converter SHALL include the Synopsis_Section as a separate page before the script content.

### Requirement 10: Scene-by-Scene Breakdown View

**User Story:** As a screenwriter, I want to see a scene-by-scene breakdown of my script, so that I can analyze the structure, pacing, and content distribution.

#### Acceptance Criteria

1. WHEN the user clicks "Scene Breakdown" in the Story_Output_Panel, THE panel SHALL display a Scene_Breakdown view showing each scene with: scene number, scene heading, action line count, dialogue line count, and estimated duration.
2. THE Scene_Breakdown SHALL calculate estimated duration for each scene based on: 1 page ≈ 1 minute, with action lines and dialogue weighted appropriately.
3. THE Scene_Breakdown SHALL display a visual timeline showing the relative duration of each scene as a horizontal bar.
4. WHEN the user clicks on a scene in the Scene_Breakdown, THE Pro Script Builder SHALL navigate to that scene and highlight it.
5. THE Scene_Breakdown SHALL display summary statistics at the bottom: total scenes, total estimated runtime, average scene duration, and longest/shortest scenes.
6. THE Scene_Breakdown SHALL support filtering scenes by: character presence, location, time of day, or narrative structure label (e.g., "Inciting Incident", "Climax").
7. THE Scene_Breakdown SHALL support exporting the breakdown as a CSV file for analysis in spreadsheet tools.

### Requirement 11: Word Count and Page Count Display

**User Story:** As a screenwriter, I want to see real-time word count and page count statistics, so that I can track my progress and ensure my script meets target length requirements.

#### Acceptance Criteria

1. WHEN the Pro Script Builder is open, THE Story_Output_Panel SHALL display real-time statistics: Word_Count, Page_Count, and Reading_Time.
2. THE Word_Count SHALL count all words in action lines and dialogue, excluding scene headings and character names.
3. THE Page_Count SHALL be calculated based on screenplay formatting conventions: approximately 55 lines per page, with scene headings, action lines, and dialogue weighted appropriately.
4. THE Reading_Time SHALL be calculated based on an average reading speed of 150 words per minute.
5. THE statistics SHALL update automatically as the user edits the script, with a debounce delay of 500ms.
6. THE Story_Output_Panel SHALL display a progress bar showing the current page count relative to the target duration from the Story Blueprint (e.g., "12 pages / 15 pages target for 15-minute film").
7. WHEN the script exceeds the target page count, THE progress bar SHALL change color to indicate the script is over length.

### Requirement 12: Character Arc Summary in Output

**User Story:** As a screenwriter, I want to see a summary of each character's arc in the story output, so that I can verify character transformation and emotional consistency.

#### Acceptance Criteria

1. WHEN the user clicks "Character Arcs" in the Story_Output_Panel, THE panel SHALL display a Character_Arc_Summary for each character with a defined arc.
2. THE Character_Arc_Summary SHALL show: character name, starting emotional state, ending emotional state, key turning points (with scene references), and a visual arc diagram.
3. THE Character_Arc_Summary SHALL display the character's emotional beats at each scene as a line graph or timeline.
4. WHEN the user clicks on a turning point in the Character_Arc_Summary, THE Pro Script Builder SHALL navigate to the corresponding scene.
5. THE Character_Arc_Summary SHALL be included in PDF exports as an appendix page after the script content.
6. IF a character does not have a defined arc, THE Character_Arc_Summary SHALL display "No arc defined" with a button to "Define Arc" that opens the Character Arc Mapper.
7. THE Character_Arc_Summary SHALL support exporting as a standalone PDF or image file for sharing with collaborators.

### Requirement 13: Project Import from JSON

**User Story:** As a screenwriter, I want to import story projects from JSON files, so that I can restore backups or transfer projects between devices.

#### Acceptance Criteria

1. WHEN the user clicks "Import Project" in the Project_Library, THE LocalStorage_Manager SHALL display a file picker allowing the user to select a JSON file.
2. WHEN the user selects a JSON file, THE LocalStorage_Manager SHALL validate the file structure to ensure it contains a valid Story_Project.
3. IF the JSON file is valid, THE LocalStorage_Manager SHALL import the project and add it to the Project_Library.
4. IF the JSON file is invalid or corrupted, THE LocalStorage_Manager SHALL display an error message: "Invalid project file. Please select a valid JSON export."
5. WHEN a project is imported, THE LocalStorage_Manager SHALL generate a new unique project ID to avoid conflicts with existing projects.
6. IF a project with the same title already exists, THE LocalStorage_Manager SHALL append " (Imported)" to the title.
7. THE LocalStorage_Manager SHALL support importing multiple projects at once by selecting multiple JSON files.

### Requirement 14: Project Thumbnail Generation

**User Story:** As a screenwriter, I want each saved project to have a visual thumbnail, so that I can quickly identify projects in the Project Library.

#### Acceptance Criteria

1. WHEN a Story_Project is saved for the first time, THE LocalStorage_Manager SHALL generate a Project_Thumbnail by rendering the first scene of the script as a miniature preview.
2. THE Project_Thumbnail SHALL be a 200x150 pixel image showing the scene heading and the first few lines of action or dialogue.
3. THE Project_Thumbnail SHALL use the same formatting and styling as the Story_Output_Panel (scene heading in bold, action in regular text, dialogue centered).
4. WHEN the user hovers over a Project_Thumbnail in the Project_Library, THE thumbnail SHALL enlarge slightly and display the full project title and last modified date.
5. THE LocalStorage_Manager SHALL store the Project_Thumbnail as a base64-encoded image string in the project data.
6. THE user SHALL be able to manually update the Project_Thumbnail by clicking "Change Thumbnail" and selecting a different scene to preview.
7. IF the script is empty, THE Project_Thumbnail SHALL display a placeholder image with the project title and story type icon.

### Requirement 15: Reading Time Estimate

**User Story:** As a screenwriter, I want to see an estimated reading time for my script, so that I can gauge how long it will take to read aloud or present to collaborators.

#### Acceptance Criteria

1. WHEN the Story_Output_Panel is displayed, THE panel SHALL show a Reading_Time estimate based on the total word count and an average reading speed of 150 words per minute.
2. THE Reading_Time SHALL be displayed in minutes and seconds (e.g., "12 min 30 sec").
3. THE Reading_Time estimate SHALL update automatically as the user edits the script, with a debounce delay of 500ms.
4. THE Story_Output_Panel SHALL allow the user to customize the reading speed (slow: 120 wpm, normal: 150 wpm, fast: 180 wpm) in the panel settings.
5. WHEN the user hovers over the Reading_Time, THE panel SHALL display a tooltip explaining the calculation: "Based on [word count] words at [reading speed] words per minute."
6. THE Reading_Time SHALL be included in the Scene_Breakdown view for each individual scene.
7. THE Reading_Time SHALL be displayed in the Project_Library for each saved project as a quick reference.

### Requirement 16: Integration with Pro Script Builder

**User Story:** As a screenwriter, I want the Story Output & Management System to integrate seamlessly with the Pro Script Builder, so that I can access all features without switching between different interfaces.

#### Acceptance Criteria

1. WHEN the Pro Script Builder is open, THE Story_Output_Panel SHALL be accessible via a "Preview" button in the main toolbar.
2. THE Story_Output_Panel SHALL open as a side panel (on desktop) or a modal overlay (on mobile) without closing the Pro Script Builder.
3. WHEN the user makes changes in the Pro Script Builder, THE Story_Output_Panel SHALL update automatically to reflect the changes.
4. WHEN the user clicks on a scene in the Story_Output_Panel, THE Pro Script Builder SHALL navigate to that scene and highlight it.
5. THE "Save Project", "Open Project", and "Export" buttons SHALL be accessible from both the Pro Script Builder toolbar and the Story_Output_Panel.
6. WHEN the user closes the Story_Output_Panel, THE Pro Script Builder SHALL remain open with all content preserved.
7. THE Story_Output_Panel SHALL respect the user's theme preference (light/dark mode) and match the Pro Script Builder's visual style.

### Requirement 17: LocalStorage Quota Management

**User Story:** As a screenwriter, I want to be notified when localStorage is running low, so that I can take action to free up space before losing the ability to save projects.

#### Acceptance Criteria

1. WHEN the LocalStorage_Manager detects that localStorage usage exceeds 80% of the available quota, THE system SHALL display a warning notification: "Storage space is running low. Consider deleting old projects or exporting them as JSON backups."
2. WHEN localStorage usage exceeds 90%, THE warning notification SHALL become persistent and display the exact amount of space used and available (e.g., "4.5 MB used / 5 MB available").
3. WHEN the user attempts to save a project and localStorage is full, THE LocalStorage_Manager SHALL display an error message: "Cannot save project. Storage is full. Please delete old projects or export them to free up space."
4. THE LocalStorage_Manager SHALL provide a "Manage Storage" button in the warning notification that opens the Project_Library with storage usage details.
5. THE Project_Library SHALL display the size of each saved project in kilobytes (e.g., "Project A: 250 KB").
6. THE LocalStorage_Manager SHALL support bulk deletion of projects by allowing the user to select multiple projects and delete them at once.
7. WHEN the user exports a project as JSON and then deletes it from localStorage, THE system SHALL display a confirmation message: "Project exported and deleted. You can re-import it anytime from the JSON file."

### Requirement 18: Offline Functionality

**User Story:** As a screenwriter, I want the Story Output & Management System to work completely offline, so that I can write and manage projects without an internet connection.

#### Acceptance Criteria

1. THE Story Output & Management System SHALL function entirely in the browser without requiring any server-side API calls.
2. WHEN the user saves, loads, or deletes projects, THE LocalStorage_Manager SHALL perform all operations locally in the browser.
3. WHEN the user exports projects to PDF, TXT, or Markdown, THE Format_Converter SHALL generate the files locally without requiring internet access.
4. THE Story_Output_Panel SHALL render formatted story text using client-side JavaScript without external dependencies.
5. WHEN the browser is offline, THE system SHALL display a status indicator: "Offline Mode - All changes are saved locally."
6. THE system SHALL NOT require any external fonts, stylesheets, or scripts that could fail to load when offline.
7. WHEN the user opens the application offline, THE Project_Library SHALL load all saved projects from localStorage without errors.

### Requirement 19: Prompt Template Customization

**User Story:** As a filmmaker, I want to customize the AI prompt template, so that I can tailor the exported prompt to different AI tools or specific use cases.

#### Acceptance Criteria

1. WHEN the user clicks "Convert to Prompt" in the Story_Output_Panel, THE Format_Converter SHALL display a dropdown menu with prompt template options: "General Story Generation", "Dialogue Expansion", "Scene Description", "Storyboard Generation", "Custom Template".
2. WHEN the user selects "Custom Template", THE Format_Converter SHALL display an editable text area where the user can define a custom prompt structure using placeholders like {synopsis}, {characters}, {script}, {title}.
3. WHEN the user saves a custom template, THE Format_Converter SHALL store it in localStorage and make it available for future exports.
4. THE Format_Converter SHALL provide default templates for common use cases with pre-written instructions optimized for AI tools.
5. WHEN the user selects a template, THE Format_Converter SHALL preview the formatted prompt before exporting.
6. THE custom templates SHALL support conditional sections (e.g., "Include character arcs only if defined").
7. THE Format_Converter SHALL allow the user to export and import custom templates as JSON files for sharing with other users.

### Requirement 20: Project Search and Filtering

**User Story:** As a screenwriter, I want to search and filter my saved projects, so that I can quickly find specific projects in a large library.

#### Acceptance Criteria

1. WHEN the Project_Library is displayed, THE system SHALL provide a search bar at the top allowing the user to search projects by title, author, or synopsis content.
2. THE search SHALL be case-insensitive and support partial matches (e.g., searching "space" finds "Space Adventure" and "Lost in Space").
3. THE Project_Library SHALL provide filter options: story type (Social Media, Short Film, Cinematic Film, etc.), duration bracket (2 min, 5 min, 10 min, etc.), and last modified date range.
4. WHEN the user applies filters, THE Project_Library SHALL display only projects matching all selected criteria.
5. THE Project_Library SHALL display the number of matching projects (e.g., "Showing 5 of 12 projects").
6. THE search and filter state SHALL persist when the user closes and reopens the Project_Library within the same session.
7. THE Project_Library SHALL support sorting filtered results by: last modified date, project title, or creation date.

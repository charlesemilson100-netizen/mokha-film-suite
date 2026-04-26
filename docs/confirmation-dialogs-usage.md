# Confirmation Dialog Usage Guide

## Overview

This guide demonstrates how to use the existing `useConfirm` hook with the `LocalStorage_Manager.deleteProject()` and `LocalStorage_Manager.duplicateProject()` methods to provide user-friendly confirmation dialogs for destructive operations.

## Requirements

- **Requirement 3.2**: Display confirmation dialog for project deletion
- **Requirement 3.3**: Delete project from localStorage after confirmation
- **Requirement 3.4**: Duplicate project with " (Copy)" suffix

## Available Components

### ConfirmDialog Component

A styled confirmation dialog with:
- Alert icon
- Custom message
- Cancel button
- Confirm button (customizable label and style)
- Overlay backdrop

### useConfirm Hook

A React hook that provides:
- `confirm(message, options)` - Returns a promise that resolves to `true` or `false`
- `ConfirmUI` - The dialog component to render

## Usage Examples

### Example 1: Delete Project with Confirmation

```jsx
const ProjectLibrary = () => {
    const { confirm, ConfirmUI } = useConfirm();
    const [projects, setProjects] = React.useState([]);

    // Load projects on mount
    React.useEffect(() => {
        setProjects(LocalStorage_Manager.loadAllProjects());
    }, []);

    const handleDeleteProject = async (projectId, projectTitle) => {
        // Show confirmation dialog
        const confirmed = await confirm(
            `Are you sure you want to delete '${projectTitle}'? This cannot be undone.`,
            {
                confirmLabel: 'Delete',
                confirmClass: 'bg-red-500 hover:bg-red-600 text-white'
            }
        );

        if (confirmed) {
            try {
                // Delete the project
                const success = LocalStorage_Manager.deleteProject(projectId);
                
                if (success) {
                    // Update UI
                    setProjects(LocalStorage_Manager.loadAllProjects());
                    
                    // Optional: Show success notification
                    console.log('Project deleted successfully');
                }
            } catch (error) {
                console.error('Error deleting project:', error);
                alert(`Failed to delete project: ${error.message}`);
            }
        }
    };

    return (
        <div>
            {ConfirmUI}
            <div className="project-list">
                {projects.map(project => (
                    <div key={project.id} className="project-item">
                        <h3>{project.title}</h3>
                        <button onClick={() => handleDeleteProject(project.id, project.title)}>
                            Delete
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
```

### Example 2: Duplicate Project (No Confirmation Needed)

```jsx
const ProjectLibrary = () => {
    const [projects, setProjects] = React.useState([]);

    React.useEffect(() => {
        setProjects(LocalStorage_Manager.loadAllProjects());
    }, []);

    const handleDuplicateProject = (projectId) => {
        try {
            // Duplicate the project (no confirmation needed)
            const duplicatedProject = LocalStorage_Manager.duplicateProject(projectId);
            
            // Update UI
            setProjects(LocalStorage_Manager.loadAllProjects());
            
            // Optional: Show success notification
            console.log(`Project duplicated: ${duplicatedProject.title}`);
        } catch (error) {
            console.error('Error duplicating project:', error);
            alert(`Failed to duplicate project: ${error.message}`);
        }
    };

    return (
        <div className="project-list">
            {projects.map(project => (
                <div key={project.id} className="project-item">
                    <h3>{project.title}</h3>
                    <button onClick={() => handleDuplicateProject(project.id)}>
                        Duplicate
                    </button>
                </div>
            ))}
        </div>
    );
};
```

### Example 3: Context Menu with Multiple Actions

```jsx
const ProjectLibrary = () => {
    const { confirm, ConfirmUI } = useConfirm();
    const [projects, setProjects] = React.useState([]);
    const [contextMenu, setContextMenu] = React.useState(null);

    React.useEffect(() => {
        setProjects(LocalStorage_Manager.loadAllProjects());
    }, []);

    const handleContextMenu = (e, project) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            project
        });
    };

    const handleDeleteProject = async (project) => {
        setContextMenu(null);
        
        const confirmed = await confirm(
            `Are you sure you want to delete '${project.title}'? This cannot be undone.`,
            {
                confirmLabel: 'Delete',
                confirmClass: 'bg-red-500 hover:bg-red-600 text-white'
            }
        );

        if (confirmed) {
            try {
                LocalStorage_Manager.deleteProject(project.id);
                setProjects(LocalStorage_Manager.loadAllProjects());
            } catch (error) {
                alert(`Failed to delete project: ${error.message}`);
            }
        }
    };

    const handleDuplicateProject = (project) => {
        setContextMenu(null);
        
        try {
            LocalStorage_Manager.duplicateProject(project.id);
            setProjects(LocalStorage_Manager.loadAllProjects());
        } catch (error) {
            alert(`Failed to duplicate project: ${error.message}`);
        }
    };

    const handleExportJSON = (project) => {
        setContextMenu(null);
        
        try {
            const jsonData = LocalStorage_Manager.exportProjectAsJSON(project.id);
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${project.title}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            alert(`Failed to export project: ${error.message}`);
        }
    };

    return (
        <div>
            {ConfirmUI}
            
            <div className="project-list">
                {projects.map(project => (
                    <div 
                        key={project.id} 
                        className="project-item"
                        onContextMenu={(e) => handleContextMenu(e, project)}
                    >
                        <h3>{project.title}</h3>
                        <p>{project.author}</p>
                    </div>
                ))}
            </div>

            {contextMenu && (
                <div 
                    className="context-menu"
                    style={{ 
                        position: 'fixed', 
                        top: contextMenu.y, 
                        left: contextMenu.x,
                        zIndex: 10000
                    }}
                >
                    <button onClick={() => handleDuplicateProject(contextMenu.project)}>
                        Duplicate
                    </button>
                    <button onClick={() => handleExportJSON(contextMenu.project)}>
                        Export as JSON
                    </button>
                    <button 
                        onClick={() => handleDeleteProject(contextMenu.project)}
                        className="text-red-500"
                    >
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
};
```

### Example 4: Bulk Delete with Confirmation

```jsx
const ProjectLibrary = () => {
    const { confirm, ConfirmUI } = useConfirm();
    const [projects, setProjects] = React.useState([]);
    const [selectedProjects, setSelectedProjects] = React.useState([]);

    React.useEffect(() => {
        setProjects(LocalStorage_Manager.loadAllProjects());
    }, []);

    const handleBulkDelete = async () => {
        if (selectedProjects.length === 0) return;

        const confirmed = await confirm(
            `Are you sure you want to delete ${selectedProjects.length} project(s)? This cannot be undone.`,
            {
                confirmLabel: 'Delete All',
                confirmClass: 'bg-red-500 hover:bg-red-600 text-white'
            }
        );

        if (confirmed) {
            try {
                // Delete all selected projects
                selectedProjects.forEach(projectId => {
                    LocalStorage_Manager.deleteProject(projectId);
                });
                
                // Update UI
                setProjects(LocalStorage_Manager.loadAllProjects());
                setSelectedProjects([]);
                
                console.log(`${selectedProjects.length} project(s) deleted`);
            } catch (error) {
                alert(`Failed to delete projects: ${error.message}`);
            }
        }
    };

    const toggleSelection = (projectId) => {
        setSelectedProjects(prev => 
            prev.includes(projectId)
                ? prev.filter(id => id !== projectId)
                : [...prev, projectId]
        );
    };

    return (
        <div>
            {ConfirmUI}
            
            <div className="toolbar">
                <button 
                    onClick={handleBulkDelete}
                    disabled={selectedProjects.length === 0}
                >
                    Delete Selected ({selectedProjects.length})
                </button>
            </div>

            <div className="project-list">
                {projects.map(project => (
                    <div key={project.id} className="project-item">
                        <input
                            type="checkbox"
                            checked={selectedProjects.includes(project.id)}
                            onChange={() => toggleSelection(project.id)}
                        />
                        <h3>{project.title}</h3>
                    </div>
                ))}
            </div>
        </div>
    );
};
```

## Best Practices

1. **Always use confirmation for destructive operations**: Delete operations should always show a confirmation dialog.

2. **Provide clear messages**: Include the project title in the confirmation message so users know exactly what they're deleting.

3. **Use appropriate button styling**: Use red/danger styling for delete buttons to indicate destructive action.

4. **Handle errors gracefully**: Wrap operations in try-catch blocks and show user-friendly error messages.

5. **Update UI after operations**: Reload the project list after delete/duplicate operations to reflect changes.

6. **No confirmation for non-destructive operations**: Duplicate and export operations don't need confirmation dialogs.

## Testing Checklist

- [ ] Delete confirmation dialog appears with correct message
- [ ] Cancel button closes dialog without deleting
- [ ] Confirm button deletes project and updates UI
- [ ] Duplicate creates new project with " (Copy)" suffix
- [ ] Duplicate creates independent copy (modifying one doesn't affect the other)
- [ ] Error messages display when operations fail
- [ ] Bulk delete shows count in confirmation message
- [ ] Context menu closes after action is selected

## Integration Points

The confirmation dialog system integrates with:
- **Project Library UI** (Task 9)
- **Context Menu** (Task 10)
- **Bulk Operations** (Task 9)

All UI components that perform delete operations should use the `useConfirm` hook to ensure consistent user experience.

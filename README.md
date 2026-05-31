# One-Tab Workspace Launcher

A clean Chrome extension for saving groups of tabs as reusable workspaces. Save a browser window, edit the stored tabs, and reopen that workspace whenever you need it.

## Features

- Create named workspaces for work, study, coding, research, or any tab setup.
- Save the current Chrome window as a workspace.
- Update a linked workspace from the current window with an added/removed/unchanged confirmation.
- Launch all tabs in a workspace with one click.
- Open a workspace in the current window or in a new Chrome window.
- Search saved workspaces by name.
- Mark workspaces as favorites and view them in a separate Favorites section.
- Drag and drop workspaces to choose their display order.
- Edit each workspace name, preset icon, color, and stored tabs.
- Track each workspace created and last updated dates, displayed as a date-only label.
- Show saved tab favicons under each workspace and beside each tab in the editor.
- Add, remove, and reorder stored tabs.
- Require at least one valid tab URL before saving a workspace.
- Export all workspaces to JSON.
- Export all workspaces or a single workspace with a custom JSON filename.
- Import workspace JSON without accidentally overwriting saved data.
- Choose how same-name imports are handled: versioned copy, combine, or overwrite.
- Hard reset all saved workspaces with a confirmation warning.
- Includes Chrome toolbar and extension page icon assets.

## Import Options

When an imported workspace has the same name as one already saved, the extension asks how to handle it:

- **Versioned Copy**: keeps both workspaces and renames the imported one, such as `Work2`.
- **Combine**: merges new URLs into the existing workspace and skips duplicate URLs.
- **Overwrite**: replaces the existing same-name workspace with the imported one.

## Load In Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder.

The extension stores data in `chrome.storage.local`.

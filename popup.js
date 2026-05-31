(function () {
  "use strict";

  const STORAGE_KEY = "workspaceLauncher.workspaces.v1";
  const EXPORT_APP = "one-tab-workspace-launcher";
  const COLORS = ["#0f8f7a", "#2f6fed", "#d9812b", "#b84a3f", "#6d5bd0", "#1d6b86", "#667085", "#2b8a3e"];

  const icons = {
    add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14"/></svg>',
    archive: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 8H3M5 8l1.2 11h11.6L19 8M8 12h8M4 4h16v4H4z"/></svg>',
    arrowLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
    chevronUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m18 15-6-6-6 6"/></svg>',
    chevronDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m6 9 6 6 6-6"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 3h7v7M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
    folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg>',
    import: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3v12M7 8l5-5 5 5M5 21h14"/></svg>',
    launch: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 12h14M13 5l7 7-7 7"/></svg>',
    save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 6 6 18M6 6l12 12"/></svg>'
  };

  const app = document.getElementById("app");
  const importFile = document.getElementById("importFile");

  let state = {
    view: "list",
    workspaces: [],
    editing: null,
    importPreview: null,
    importConflictMode: "rename",
    resetConfirmText: "",
    searchQuery: "",
    toast: ""
  };

  document.addEventListener("DOMContentLoaded", init);
  app.addEventListener("click", onClick);
  app.addEventListener("input", onInput);
  importFile.addEventListener("change", onImportFile);

  async function init() {
    state.workspaces = await loadWorkspaces();
    render();
  }

  function render() {
    if (state.view === "edit") {
      app.innerHTML = renderEditor();
    } else if (state.view === "import") {
      app.innerHTML = renderImport();
    } else if (state.view === "reset") {
      app.innerHTML = renderReset();
    } else {
      app.innerHTML = renderList();
    }

    if (state.toast) {
      app.insertAdjacentHTML("beforeend", `<div class="toast" role="status">${escapeHtml(state.toast)}</div>`);
    }
  }

  function renderList() {
    const totalTabs = state.workspaces.reduce((sum, workspace) => sum + workspace.tabs.length, 0);
    const empty = state.workspaces.length === 0;
    const filteredWorkspaces = getFilteredWorkspaces();

    return `
      <header class="topbar">
        <div class="brand">
          <div class="brand-mark" aria-hidden="true">
            <img src="icons/icon48.png" alt="">
          </div>
          <div class="title-stack">
            <h1 class="app-title">Workspace Launcher</h1>
            <div class="meta">${state.workspaces.length} ${plural(state.workspaces.length, "workspace")} - ${totalTabs} ${plural(totalTabs, "tab")}</div>
          </div>
        </div>
      </header>

      <main class="content">
        <div class="toolbar">
          <button class="button primary" type="button" data-action="new-workspace">${icons.add}<span>New Workspace</span></button>
          <button class="icon-button" type="button" data-action="save-current" title="Save current window" aria-label="Save current window">${icons.archive}</button>
          <button class="icon-button" type="button" data-action="import" title="Import" aria-label="Import">${icons.import}</button>
          <button class="icon-button" type="button" data-action="export" title="Export" aria-label="Export" ${empty ? "disabled" : ""}>${icons.download}</button>
          <button class="icon-button danger" type="button" data-action="reset-all" title="Reset all" aria-label="Reset all" ${empty ? "disabled" : ""}>${icons.trash}</button>
        </div>

        ${renderSearchBar(empty, filteredWorkspaces.length)}
        <section id="workspaceResults">
          ${renderWorkspaceResults(filteredWorkspaces)}
        </section>
      </main>
    `;
  }

  function renderSearchBar(disabled, resultCount) {
    const query = state.searchQuery.trim();
    const summary = query ? `${resultCount} ${plural(resultCount, "match")}` : "All spaces";

    return `
      <div class="search-row">
        <div class="search-box">
          <span aria-hidden="true">${icons.search}</span>
          <input id="workspaceSearch" type="search" value="${escapeAttr(state.searchQuery)}" data-field="workspaceSearch" placeholder="Search names" autocomplete="off" ${disabled ? "disabled" : ""}>
          <button class="icon-button clear-search" type="button" data-action="clear-search" title="Clear search" aria-label="Clear search" ${query ? "" : "disabled"}>${icons.x}</button>
        </div>
        <span class="search-count">${summary}</span>
      </div>
    `;
  }

  function renderWorkspaceResults(workspaces) {
    if (!state.workspaces.length) {
      return renderEmptyState();
    }

    if (!workspaces.length) {
      return renderNoMatches();
    }

    return `<div class="workspace-list">${workspaces.map(renderWorkspaceCard).join("")}</div>`;
  }

  function refreshWorkspaceResults() {
    const results = document.getElementById("workspaceResults");
    const count = app.querySelector(".search-count");
    const clearButton = app.querySelector(".clear-search");
    const filteredWorkspaces = getFilteredWorkspaces();
    const query = state.searchQuery.trim();

    if (results) {
      results.innerHTML = renderWorkspaceResults(filteredWorkspaces);
    }

    if (count) {
      count.textContent = query ? `${filteredWorkspaces.length} ${plural(filteredWorkspaces.length, "match")}` : "All spaces";
    }

    if (clearButton) {
      clearButton.disabled = !query;
    }
  }

  function getFilteredWorkspaces() {
    const query = normalizeSearchText(state.searchQuery);
    if (!query) return state.workspaces;

    return state.workspaces.filter((workspace) => normalizeSearchText(workspace.name).includes(query));
  }

  function renderWorkspaceCard(workspace) {
    const firstUrl = workspace.tabs[0]?.url || "No tabs stored";
    const color = sanitizeColor(workspace.color);

    return `
      <article class="workspace-card" style="--workspace-color: ${color}">
        <div class="workspace-accent" aria-hidden="true"></div>
        <div class="workspace-main">
          <h2 class="workspace-name">
            <span>${escapeHtml(workspace.name)}</span>
            <b class="pill">${workspace.tabs.length}</b>
          </h2>
          <div class="workspace-url">${escapeHtml(firstUrl)}</div>
        </div>
        <div class="workspace-actions">
          <button class="button primary" type="button" data-action="open-workspace" data-id="${workspace.id}" ${workspace.tabs.length ? "" : "disabled"}>${icons.launch}<span>Open</span></button>
          <button class="icon-button" type="button" data-action="export-workspace" data-id="${workspace.id}" title="Export workspace" aria-label="Export workspace">${icons.download}</button>
          <button class="icon-button" type="button" data-action="edit-workspace" data-id="${workspace.id}" title="Edit" aria-label="Edit">${icons.edit}</button>
        </div>
      </article>
    `;
  }

  function renderEmptyState() {
    return `
      <section class="empty-state">
        <div>
          ${icons.folder}
          <h2>No workspaces yet</h2>
          <p>Save your current window or create a workspace from scratch.</p>
        </div>
      </section>
    `;
  }

  function renderNoMatches() {
    return `
      <section class="empty-state compact">
        <div>
          ${icons.search}
          <h2>No matching spaces</h2>
          <p>Try another workspace name.</p>
        </div>
      </section>
    `;
  }

  function renderReset() {
    const workspaceCount = state.workspaces.length;
    const tabCount = state.workspaces.reduce((sum, workspace) => sum + workspace.tabs.length, 0);
    const canReset = state.resetConfirmText.trim().toUpperCase() === "RESET";

    return `
      <section class="editor-shell">
        <header class="editor-header">
          <button class="icon-button" type="button" data-action="back" title="Back" aria-label="Back">${icons.arrowLeft}</button>
          <div class="title-stack">
            <h1 class="editor-title">Hard Reset</h1>
            <div class="meta">${workspaceCount} ${plural(workspaceCount, "workspace")} - ${tabCount} ${plural(tabCount, "tab")}</div>
          </div>
          <button class="icon-button danger" type="button" data-action="confirm-reset" title="Delete all" aria-label="Delete all" ${canReset ? "" : "disabled"}>${icons.trash}</button>
        </header>

        <main class="content">
          <div class="reset-panel">
            <section class="danger-panel">
              ${icons.trash}
              <h2>Delete every workspace?</h2>
              <p>This removes all saved tab spaces from this browser. Export first if you need a backup.</p>
            </section>

            <div class="field">
              <label for="resetConfirm">Type RESET to confirm</label>
              <input id="resetConfirm" type="text" value="${escapeAttr(state.resetConfirmText)}" data-field="resetConfirm" autocomplete="off">
            </div>

            <div class="reset-actions">
              <button class="button secondary" type="button" data-action="back">${icons.arrowLeft}<span>Cancel</span></button>
              <button class="button danger" type="button" data-action="confirm-reset" ${canReset ? "" : "disabled"}>${icons.trash}<span>Delete All</span></button>
            </div>
          </div>
        </main>
      </section>
    `;
  }

  function renderEditor() {
    const workspace = getEditingWorkspace();

    if (!workspace) {
      state.view = "list";
      return renderList();
    }

    const isNew = !state.workspaces.some((item) => item.id === workspace.id);
    const tabCount = workspace.tabs.length;

    return `
      <section class="editor-shell">
        <header class="editor-header">
          <button class="icon-button" type="button" data-action="back" title="Back" aria-label="Back">${icons.arrowLeft}</button>
          <div class="title-stack">
            <h1 class="editor-title">${escapeHtml(workspace.name || "Untitled Workspace")}</h1>
            <div class="meta">${tabCount} ${plural(tabCount, "tab")} stored</div>
          </div>
          <button class="button primary" type="button" data-action="save-editor">${icons.save}<span>Save</span></button>
        </header>

        <main class="content">
          <form class="editor-form">
            <div class="section">
              <div class="field">
                <label for="workspaceName">Name</label>
                <input id="workspaceName" type="text" value="${escapeAttr(workspace.name)}" data-field="name" placeholder="Coding">
              </div>

              <div class="field">
                <label>Color</label>
                <div class="swatches" role="listbox" aria-label="Workspace color">
                  ${COLORS.map((color) => `
                    <button class="swatch ${color === workspace.color ? "active" : ""}" type="button" data-action="set-color" data-color="${color}" style="--swatch: ${color}" title="${color}" aria-label="${color}"></button>
                  `).join("")}
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-head">
                <h2 class="section-title">Tabs</h2>
                <div class="icon-row">
                  <button class="icon-button" type="button" data-action="add-current-tabs" title="Add current tabs" aria-label="Add current tabs">${icons.archive}</button>
                  <button class="icon-button" type="button" data-action="add-tab" title="Add tab" aria-label="Add tab">${icons.add}</button>
                </div>
              </div>
              ${workspace.tabs.length ? `<div class="tab-list">${workspace.tabs.map(renderTabRow).join("")}</div>` : `<div class="notice">This workspace has no tabs yet.</div>`}
            </div>

            <div class="editor-actions">
              <button class="button secondary" type="button" data-action="open-editing" ${workspace.tabs.length ? "" : "disabled"}>${icons.launch}<span>Open</span></button>
              <button class="button secondary" type="button" data-action="export-editing" ${workspace.name && workspace.tabs.length ? "" : "disabled"}>${icons.download}<span>Export</span></button>
              <button class="button danger" type="button" data-action="delete-workspace" ${isNew ? "disabled" : ""}>${icons.trash}<span>Delete</span></button>
            </div>
          </form>
        </main>
      </section>
    `;
  }

  function renderTabRow(tab, index, tabs) {
    return `
      <div class="tab-row" data-tab-id="${tab.id}">
        <div class="tab-inputs">
          <input type="text" value="${escapeAttr(tab.title)}" data-tab-field="title" data-tab-id="${tab.id}" placeholder="Tab title" aria-label="Tab title">
          <input type="url" value="${escapeAttr(tab.url)}" data-tab-field="url" data-tab-id="${tab.id}" placeholder="https://example.com" aria-label="Tab URL">
        </div>
        <div class="tab-tools">
          <button class="icon-button" type="button" data-action="move-tab-up" data-tab-id="${tab.id}" title="Move up" aria-label="Move up" ${index === 0 ? "disabled" : ""}>${icons.chevronUp}</button>
          <button class="icon-button" type="button" data-action="move-tab-down" data-tab-id="${tab.id}" title="Move down" aria-label="Move down" ${index === tabs.length - 1 ? "disabled" : ""}>${icons.chevronDown}</button>
          <button class="icon-button danger" type="button" data-action="remove-tab" data-tab-id="${tab.id}" title="Remove" aria-label="Remove">${icons.x}</button>
        </div>
      </div>
    `;
  }

  function renderImport() {
    const preview = state.importPreview;

    return `
      <section class="editor-shell">
        <header class="editor-header">
          <button class="icon-button" type="button" data-action="back" title="Back" aria-label="Back">${icons.arrowLeft}</button>
          <div class="title-stack">
            <h1 class="editor-title">Import Workspaces</h1>
            <div class="meta">${preview ? `${preview.workspaces.length} ${plural(preview.workspaces.length, "workspace")} ready` : "Choose a JSON export"}</div>
          </div>
          <button class="icon-button" type="button" data-action="choose-import-file" title="Choose file" aria-label="Choose file">${icons.file}</button>
        </header>

        <main class="content">
          <div class="import-panel">
            ${preview ? renderImportPreview(preview) : `
              <section class="empty-state">
                <div>
                  ${icons.import}
                  <h2>Select an export file</h2>
                  <p>Import workspaces from a JSON file created by this extension.</p>
                </div>
              </section>
            `}
          </div>
        </main>
      </section>
    `;
  }

  function renderImportPreview(preview) {
    const tabTotal = preview.workspaces.reduce((sum, workspace) => sum + workspace.tabs.length, 0);
    const conflictCount = countImportConflicts(preview.workspaces);

    return `
      <section class="import-summary">
        <strong>${preview.workspaces.length} ${plural(preview.workspaces.length, "workspace")}</strong>
        <span>${tabTotal} ${plural(tabTotal, "tab")} found in ${escapeHtml(preview.filename)}</span>
      </section>
      ${renderImportConflictControls(conflictCount)}
      <div class="import-list">
        ${preview.workspaces.map((workspace) => `
          <div class="import-item ${hasWorkspaceName(state.workspaces, workspace.name) ? "has-conflict" : ""}">
            <span>${escapeHtml(workspace.name)}</span>
            <span class="import-badges">
              ${hasWorkspaceName(state.workspaces, workspace.name) ? `<b class="pill warning">Name match</b>` : ""}
              <b class="pill">${workspace.tabs.length}</b>
            </span>
          </div>
        `).join("")}
      </div>
      <div class="import-actions">
        <button class="button primary" type="button" data-action="apply-import">${icons.import}<span>Import</span></button>
      </div>
      <button class="button ghost" type="button" data-action="choose-import-file">${icons.file}<span>Choose another file</span></button>
    `;
  }

  function renderImportConflictControls(conflictCount) {
    const options = [
      { mode: "rename", label: "Versioned Copy", detail: "Work becomes Work2" },
      { mode: "combine", label: "Combine", detail: "Add only new URLs" },
      { mode: "overwrite", label: "Overwrite", detail: "Replace name matches" }
    ];

    return `
      <section class="conflict-panel">
        <div class="section-head">
          <h2 class="section-title">Same-name workspaces</h2>
          <span class="pill ${conflictCount ? "warning" : ""}">${conflictCount}</span>
        </div>
        <div class="segmented" role="group" aria-label="Import name conflict handling">
          ${options.map((option) => `
            <button class="segment ${state.importConflictMode === option.mode ? "active" : ""}" type="button" data-action="set-import-mode" data-mode="${option.mode}">
              <span>${option.label}</span>
              <small>${option.detail}</small>
            </button>
          `).join("")}
        </div>
      </section>
    `;
  }

  async function onClick(event) {
    const target = event.target.closest("[data-action]");
    if (!target || target.disabled) return;

    const action = target.dataset.action;
    const id = target.dataset.id;
    const tabId = target.dataset.tabId;

    if (action === "new-workspace") {
      state.editing = createWorkspace({ name: "New Workspace", tabs: [createTabItem()] });
      state.view = "edit";
      render();
      return;
    }

    if (action === "save-current") {
      await createWorkspaceFromCurrentWindow();
      return;
    }

    if (action === "clear-search") {
      state.searchQuery = "";
      refreshWorkspaceResults();
      const input = document.getElementById("workspaceSearch");
      if (input) input.focus();
      return;
    }

    if (action === "edit-workspace") {
      const workspace = state.workspaces.find((item) => item.id === id);
      state.editing = cloneWorkspace(workspace);
      state.view = "edit";
      render();
      return;
    }

    if (action === "open-workspace") {
      await openWorkspace(id);
      return;
    }

    if (action === "export-workspace") {
      exportWorkspaceById(id);
      return;
    }

    if (action === "open-editing") {
      await openTabs(getEditingWorkspace().tabs);
      return;
    }

    if (action === "export-editing") {
      exportWorkspace(getEditingWorkspace());
      return;
    }

    if (action === "set-color") {
      getEditingWorkspace().color = target.dataset.color;
      render();
      return;
    }

    if (action === "add-tab") {
      getEditingWorkspace().tabs.push(createTabItem());
      render();
      return;
    }

    if (action === "remove-tab") {
      const workspace = getEditingWorkspace();
      workspace.tabs = workspace.tabs.filter((tab) => tab.id !== tabId);
      render();
      return;
    }

    if (action === "move-tab-up" || action === "move-tab-down") {
      moveTab(tabId, action === "move-tab-up" ? -1 : 1);
      render();
      return;
    }

    if (action === "add-current-tabs") {
      await addCurrentTabsToEditor();
      return;
    }

    if (action === "save-editor") {
      await saveEditingWorkspace();
      return;
    }

    if (action === "delete-workspace") {
      deleteEditingWorkspace();
      return;
    }

    if (action === "reset-all") {
      state.view = "reset";
      state.resetConfirmText = "";
      render();
      return;
    }

    if (action === "confirm-reset") {
      await resetAllWorkspaces();
      return;
    }

    if (action === "back") {
      state.view = "list";
      state.editing = null;
      state.importPreview = null;
      state.resetConfirmText = "";
      render();
      return;
    }

    if (action === "export") {
      exportWorkspaces();
      return;
    }

    if (action === "import") {
      state.view = "import";
      state.importPreview = null;
      state.importConflictMode = "rename";
      render();
      importFile.value = "";
      importFile.click();
      return;
    }

    if (action === "choose-import-file") {
      importFile.value = "";
      importFile.click();
      return;
    }

    if (action === "set-import-mode") {
      state.importConflictMode = target.dataset.mode || "rename";
      render();
      return;
    }

    if (action === "apply-import") {
      await applyImport();
    }
  }

  function onInput(event) {
    if (event.target.dataset.field === "workspaceSearch") {
      state.searchQuery = event.target.value;
      refreshWorkspaceResults();
      return;
    }

    if (event.target.dataset.field === "resetConfirm") {
      state.resetConfirmText = event.target.value;
      const canReset = state.resetConfirmText.trim().toUpperCase() === "RESET";
      app.querySelectorAll('[data-action="confirm-reset"]').forEach((button) => {
        button.disabled = !canReset;
      });
      return;
    }

    const workspace = getEditingWorkspace();
    if (!workspace) return;

    if (event.target.dataset.field === "name") {
      workspace.name = event.target.value;
      const title = app.querySelector(".editor-title");
      if (title) title.textContent = workspace.name || "Untitled Workspace";
      return;
    }

    const tabField = event.target.dataset.tabField;
    const tabId = event.target.dataset.tabId;
    if (!tabField || !tabId) return;

    const tab = workspace.tabs.find((item) => item.id === tabId);
    if (tab) {
      tab[tabField] = event.target.value;
    }
  }

  async function onImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const workspaces = normalizeImportedWorkspaces(payload);

      if (!workspaces.length) {
        showToast("No valid workspaces found.");
        return;
      }

      state.importPreview = {
        filename: file.name,
        workspaces
      };
      state.importConflictMode = "rename";
      state.view = "import";
      render();
    } catch (error) {
      showToast("Import failed. Check the JSON file.");
    }
  }

  async function createWorkspaceFromCurrentWindow() {
    const tabs = await getCurrentTabs();
    if (!tabs.length) {
      showToast("No launchable tabs found.");
      return;
    }

    const workspace = createWorkspace({
      name: buildSavedWindowName(tabs),
      tabs
    });

    state.workspaces.unshift(workspace);
    await persist();
    state.editing = cloneWorkspace(workspace);
    state.view = "edit";
    showToast("Window saved.");
  }

  async function addCurrentTabsToEditor() {
    const workspace = getEditingWorkspace();
    const tabs = await getCurrentTabs();
    const existing = new Set(workspace.tabs.map((tab) => tab.url));
    const uniqueTabs = tabs.filter((tab) => !existing.has(tab.url));

    if (!uniqueTabs.length) {
      showToast("Current tabs are already stored.");
      return;
    }

    workspace.tabs.push(...uniqueTabs);
    showToast(`${uniqueTabs.length} ${plural(uniqueTabs.length, "tab")} added.`);
  }

  async function saveEditingWorkspace() {
    const workspace = sanitizeWorkspace(getEditingWorkspace());

    if (!workspace.name) {
      showToast("Add a workspace name.");
      return;
    }

    if (!workspace.tabs.length) {
      showToast("Add at least one valid tab URL.");
      return;
    }

    state.editing = workspace;
    const index = state.workspaces.findIndex((item) => item.id === workspace.id);
    if (index >= 0) {
      state.workspaces.splice(index, 1, workspace);
    } else {
      state.workspaces.unshift(workspace);
    }

    await persist();
    state.view = "list";
    state.editing = null;
    showToast("Workspace saved.");
  }

  function deleteEditingWorkspace() {
    const workspace = getEditingWorkspace();
    if (!workspace) return;

    state.workspaces = state.workspaces.filter((item) => item.id !== workspace.id);
    persist().then(() => {
      state.view = "list";
      state.editing = null;
      showToast("Workspace deleted.");
    });
  }

  async function resetAllWorkspaces() {
    if (state.resetConfirmText.trim().toUpperCase() !== "RESET") {
      showToast("Type RESET first.");
      return;
    }

    state.workspaces = [];
    state.editing = null;
    state.importPreview = null;
    state.resetConfirmText = "";
    state.searchQuery = "";
    state.view = "list";
    await persist();
    showToast("All workspaces deleted.");
  }

  function moveTab(tabId, direction) {
    const workspace = getEditingWorkspace();
    const index = workspace.tabs.findIndex((tab) => tab.id === tabId);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= workspace.tabs.length) return;

    const [tab] = workspace.tabs.splice(index, 1);
    workspace.tabs.splice(next, 0, tab);
  }

  async function openWorkspace(id) {
    const workspace = state.workspaces.find((item) => item.id === id);
    if (!workspace) return;
    await openTabs(workspace.tabs);
  }

  async function openTabs(tabs) {
    const urls = tabs.map((tab) => normalizeUrl(tab.url)).filter(Boolean);
    if (!urls.length) {
      showToast("No valid URLs to open.");
      return;
    }

    let opened = 0;
    let firstTabId = null;
    for (const url of urls) {
      const tabId = await createChromeTab(url);
      if (tabId) {
        opened += 1;
        firstTabId = firstTabId || tabId;
      }
    }

    showToast(`${opened} ${plural(opened, "tab")} opened.`);
    if (firstTabId) {
      await activateChromeTab(firstTabId);
    }
  }

  function exportWorkspaces() {
    exportWorkspaceBundle(state.workspaces, "workspace-launcher", "Export downloaded.");
  }

  function exportWorkspaceById(id) {
    const workspace = state.workspaces.find((item) => item.id === id);
    exportWorkspace(workspace);
  }

  function exportWorkspace(workspace) {
    const sanitized = sanitizeWorkspace(workspace);
    if (!sanitized.name || !sanitized.tabs.length) {
      showToast("Nothing to export.");
      return;
    }

    exportWorkspaceBundle([sanitized], `workspace-${slugify(sanitized.name)}`, "Workspace exported.");
  }

  function exportWorkspaceBundle(workspaces, filenameBase, message) {
    const sanitized = workspaces.map(sanitizeWorkspace).filter((workspace) => workspace.name);
    if (!sanitized.length) return;

    const payload = {
      app: EXPORT_APP,
      version: 1,
      exportedAt: new Date().toISOString(),
      workspaces: sanitized
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${filenameBase}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast(message);
  }

  async function applyImport() {
    if (!state.importPreview) return;

    const imported = state.importPreview.workspaces.map(cloneWorkspace);
    const result = resolveImportedWorkspaces(imported, state.importConflictMode);
    state.workspaces = result.workspaces;
    await persist();
    state.importPreview = null;
    state.view = "list";
    showToast(`Imported ${result.imported} ${plural(result.imported, "workspace")}.`);
  }

  function resolveImportedWorkspaces(imported, mode) {
    const existing = state.workspaces.map(cloneWorkspace);
    const staged = [];

    for (const workspace of imported) {
      const incoming = copyImportedWorkspace(workspace);
      const match = findWorkspaceMatch(existing, staged, incoming.name);

      if (match && mode === "combine") {
        match.list[match.index] = combineWorkspaces(match.list[match.index], incoming);
        continue;
      }

      if (match && mode === "overwrite") {
        incoming.id = match.list[match.index].id;
        match.list[match.index] = incoming;
        continue;
      }

      incoming.name = makeVersionedName(incoming.name, [...existing, ...staged]);
      staged.push(incoming);
    }

    return {
      imported: imported.length,
      workspaces: [...staged, ...existing]
    };
  }

  function findWorkspaceMatch(existing, staged, name) {
    const existingIndex = findWorkspaceIndexByName(existing, name);
    if (existingIndex >= 0) {
      return { list: existing, index: existingIndex };
    }

    const stagedIndex = findWorkspaceIndexByName(staged, name);
    if (stagedIndex >= 0) {
      return { list: staged, index: stagedIndex };
    }

    return null;
  }

  function combineWorkspaces(target, incoming) {
    const urls = new Set(target.tabs.map((tab) => normalizeUrl(tab.url)));
    const tabs = [...target.tabs];

    for (const tab of incoming.tabs) {
      const normalizedUrl = normalizeUrl(tab.url);
      if (!normalizedUrl || urls.has(normalizedUrl)) continue;
      urls.add(normalizedUrl);
      tabs.push({ ...tab, id: createId(), url: normalizedUrl });
    }

    return {
      ...target,
      tabs
    };
  }

  function copyImportedWorkspace(workspace) {
    return {
      id: createId(),
      name: workspace.name,
      color: workspace.color,
      tabs: workspace.tabs.map((tab) => ({
        ...tab,
        id: createId()
      }))
    };
  }

  function makeVersionedName(name, workspaces) {
    const used = new Set(workspaces.map((workspace) => normalizeName(workspace.name)));
    let candidate = name;
    let version = 2;

    while (used.has(normalizeName(candidate))) {
      candidate = `${name}${version}`;
      version += 1;
    }

    return candidate;
  }

  function countImportConflicts(workspaces) {
    return workspaces.filter((workspace) => hasWorkspaceName(state.workspaces, workspace.name)).length;
  }

  function hasWorkspaceName(workspaces, name) {
    return findWorkspaceIndexByName(workspaces, name) >= 0;
  }

  function findWorkspaceIndexByName(workspaces, name) {
    const key = normalizeName(name);
    return workspaces.findIndex((workspace) => normalizeName(workspace.name) === key);
  }

  function normalizeName(value) {
    return String(value || "").trim().toLowerCase();
  }

  function normalizeSearchText(value) {
    return String(value || "").trim().toLowerCase();
  }

  async function loadWorkspaces() {
    const data = await chromeStorageGet(STORAGE_KEY);
    const saved = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
    return saved.map(sanitizeWorkspace).filter((workspace) => workspace.name);
  }

  async function persist() {
    await chromeStorageSet({ [STORAGE_KEY]: state.workspaces.map(sanitizeWorkspace) });
    render();
  }

  function chromeStorageGet(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (data) => resolve(data || {}));
    });
  }

  function chromeStorageSet(payload) {
    return new Promise((resolve) => {
      chrome.storage.local.set(payload, resolve);
    });
  }

  function getCurrentTabs() {
    return new Promise((resolve) => {
      chrome.tabs.query({ currentWindow: true }, (tabs) => {
        const normalized = (tabs || [])
          .filter((tab) => tab.url && isLaunchableUrl(tab.url))
          .map((tab) => createTabItem({
            title: cleanTitle(tab.title) || readableUrl(tab.url),
            url: tab.url
          }));
        resolve(normalized);
      });
    });
  }

  function createChromeTab(url) {
    return new Promise((resolve) => {
      chrome.tabs.create({ url, active: false }, (tab) => {
        resolve(chrome.runtime.lastError ? null : tab?.id || null);
      });
    });
  }

  function activateChromeTab(tabId) {
    return new Promise((resolve) => {
      chrome.tabs.update(tabId, { active: true }, () => {
        resolve(!chrome.runtime.lastError);
      });
    });
  }

  function normalizeImportedWorkspaces(payload) {
    const workspaces = Array.isArray(payload) ? payload : payload?.workspaces;
    if (!Array.isArray(workspaces)) return [];

    return workspaces
      .map((workspace) => sanitizeWorkspace({
        id: createId(),
        name: workspace.name,
        color: workspace.color,
        tabs: Array.isArray(workspace.tabs) ? workspace.tabs : workspace.urls
      }))
      .filter((workspace) => workspace.name && workspace.tabs.length);
  }

  function sanitizeWorkspace(workspace) {
    const tabs = Array.isArray(workspace?.tabs) ? workspace.tabs : [];
    const normalizedTabs = tabs
      .map((tab) => sanitizeTab(tab))
      .filter((tab) => tab.url);

    return {
      id: workspace?.id || createId(),
      name: String(workspace?.name || "").trim().slice(0, 80),
      color: sanitizeColor(workspace?.color),
      tabs: normalizedTabs
    };
  }

  function sanitizeTab(tab) {
    if (typeof tab === "string") {
      const url = normalizeUrl(tab);
      return {
        id: createId(),
        title: url ? readableUrl(url) : "",
        url: url || ""
      };
    }

    const url = normalizeUrl(tab?.url || "");
    return {
      id: tab?.id || createId(),
      title: cleanTitle(tab?.title) || (url ? readableUrl(url) : ""),
      url: url || ""
    };
  }

  function createWorkspace(overrides = {}) {
    return {
      id: createId(),
      name: overrides.name || "New Workspace",
      color: overrides.color || COLORS[state.workspaces.length % COLORS.length],
      tabs: Array.isArray(overrides.tabs) ? overrides.tabs : []
    };
  }

  function createTabItem(overrides = {}) {
    return {
      id: createId(),
      title: overrides.title || "",
      url: overrides.url || ""
    };
  }

  function cloneWorkspace(workspace) {
    return {
      id: workspace.id,
      name: workspace.name,
      color: workspace.color,
      tabs: workspace.tabs.map((tab) => ({ ...tab }))
    };
  }

  function getEditingWorkspace() {
    return state.editing;
  }

  function normalizeUrl(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";

    const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) || raw.startsWith("file:") ? raw : `https://${raw}`;

    try {
      const url = new URL(candidate);
      if (!isLaunchableUrl(url.href)) return "";
      return url.href;
    } catch (error) {
      return "";
    }
  }

  function isLaunchableUrl(value) {
    try {
      const url = new URL(value);
      return ["http:", "https:", "file:"].includes(url.protocol);
    } catch (error) {
      return false;
    }
  }

  function readableUrl(value) {
    try {
      const url = new URL(value);
      return url.hostname.replace(/^www\./, "") || value;
    } catch (error) {
      return value;
    }
  }

  function buildSavedWindowName(tabs) {
    const title = tabs[0]?.title || "Saved Window";
    const cleaned = title.replace(/\s+/g, " ").trim();
    return cleaned.length > 34 ? `${cleaned.slice(0, 31)}...` : cleaned;
  }

  function cleanTitle(value) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, 120);
  }

  function slugify(value) {
    const slug = String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return slug || "workspace";
  }

  function sanitizeColor(value) {
    return COLORS.includes(value) ? value : COLORS[0];
  }

  function plural(count, word) {
    return count === 1 ? word : `${word}s`;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }

  function createId() {
    if (crypto?.randomUUID) return crypto.randomUUID();
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function showToast(message) {
    state.toast = message;
    render();
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      state.toast = "";
      render();
    }, 2200);
  }

})();

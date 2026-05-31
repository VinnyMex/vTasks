const storage = (typeof browser !== "undefined" ? browser.storage : chrome.storage);

// Elements
const listView = document.getElementById('list-view');
const detailView = document.getElementById('detail-view');
const notesGrid = document.getElementById('notes-grid');
const emptyState = document.getElementById('empty-state');
const newNoteBtn = document.getElementById('new-note-btn');
const backToListBtn = document.getElementById('back-to-list-btn');
const deleteNoteBtn = document.getElementById('delete-note-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const openSidepanelBtn = document.getElementById('open-sidepanel-btn');
const openFloatingBtn = document.getElementById('open-floating-btn');
const exportBtn = document.getElementById('export-btn');

const noteTitleInput = document.getElementById('note-title-input');
const noteDescInput = document.getElementById('note-description-input');
const checklistUl = document.getElementById('checklist');
const checklistForm = document.getElementById('checklist-form');
const checklistInput = document.getElementById('checklist-input');

const projectNotesList = document.getElementById('project-notes-list');
const projectNoteForm = document.getElementById('project-note-form');
const projectNoteInput = document.getElementById('project-note-input');

// State
let notes = [];
let currentNote = null;
let editingItemId = null;
let editingNoteId = null;
let currentTheme = 'light';

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
  await loadTheme();
  await loadNotes();
  renderListView();
});

// --- Theme Logic ---
async function loadTheme() {
  return new Promise((resolve) => {
    storage.sync.get(['vTasks_theme'], (result) => {
      currentTheme = result.vTasks_theme || 'light';
      applyTheme(currentTheme);
      resolve();
    });
  });
}

function applyTheme(theme) {
  document.body.classList.remove('theme-light', 'theme-dark');
  document.body.classList.add(`theme-${theme}`);
}

themeToggleBtn.onclick = () => {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(currentTheme);
  storage.sync.set({ vTasks_theme: currentTheme });
};

// --- Window/Panel Logic ---
if (openSidepanelBtn) {
  openSidepanelBtn.onclick = () => {
    chrome.windows.getCurrent(win => {
      chrome.sidePanel.open({ windowId: win.id });
    });
    window.close();
  };
}

if (openFloatingBtn) {
  openFloatingBtn.onclick = () => {
    const url = chrome.runtime.getURL('dashboard.html');
    chrome.windows.create({
      url,
      type: 'popup',
      width: 400,
      height: 600,
      focused: true
    });
  };
}

// --- Data Logic ---
async function loadNotes() {
  return new Promise((resolve) => {
    storage.sync.get(['vTasks_notes'], (result) => {
      notes = result.vTasks_notes || [];
      notes.forEach(note => { if (!note.projectNotes) note.projectNotes = []; });
      resolve();
    });
  });
}

function saveNotes() {
  storage.sync.set({ vTasks_notes: notes });
}

// --- Backup ---
if (exportBtn) {
  exportBtn.onclick = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notes));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "vtasks_backup.json");
    dlAnchor.click();
  };
}

// --- UI Rendering ---
function renderListView() {
  listView.classList.add('active');
  detailView.classList.remove('active');
  notesGrid.innerHTML = '';
  
  if (notes.length === 0) {
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
    notes.forEach(note => {
      const card = document.createElement('article');
      card.className = 'note-card';
      const totalNotes = (note.projectNotes || []).length;
      
      card.innerHTML = `
        <h2 class="note-card-title">${note.title || "Sem título"}</h2>
        <p class="note-card-description">${note.description || ""}</p>
        <div class="note-card-meta">
          ${note.items.length > 0 ? `${note.items.length} tasks` : ""}
          ${totalNotes > 0 ? ` · ${totalNotes} notas` : ""}
        </div>
      `;
      card.onclick = () => openNote(note.id);
      notesGrid.appendChild(card);
    });
  }
}

function openNote(id) {
  if (id) {
    currentNote = notes.find(n => n.id === id);
    if (!currentNote.projectNotes) currentNote.projectNotes = [];
  } else {
    currentNote = { id: Date.now(), title: '', description: '', createdAt: Date.now(), items: [], projectNotes: [] };
    notes.unshift(currentNote);
  }
  renderDetailView();
}

function renderDetailView() {
  listView.classList.remove('active');
  detailView.classList.add('active');
  noteTitleInput.value = currentNote.title;
  noteDescInput.value = currentNote.description;
  renderChecklist();
  renderProjectNotes();
}

function renderChecklist() {
  checklistUl.innerHTML = '';
  currentNote.items.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'checklist-item';
    if (editingItemId === item.id) {
      const input = document.createElement('input');
      input.className = 'checklist-edit-input';
      input.value = item.text;
      const saveEdit = () => {
        if (input.value.trim()) { item.text = input.value.trim(); saveNotes(); }
        editingItemId = null; renderChecklist();
      };
      input.onkeydown = (e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') { editingItemId = null; renderChecklist(); } };
      input.onblur = saveEdit;
      li.appendChild(input);
      setTimeout(() => input.focus(), 10);
    } else {
      const cb = document.createElement('input');
      cb.type = 'checkbox'; cb.checked = item.done;
      cb.onchange = () => { item.done = cb.checked; saveNotes(); renderChecklist(); };
      const span = document.createElement('span');
      span.className = `checklist-text ${item.done ? 'done' : ''}`;
      span.textContent = item.text;
      span.onclick = () => { editingItemId = item.id; renderChecklist(); };
      const delBtn = document.createElement('button');
      delBtn.className = 'btn-checklist-action'; delBtn.textContent = '✕';
      delBtn.onclick = (e) => { e.stopPropagation(); currentNote.items = currentNote.items.filter(i => i.id !== item.id); saveNotes(); renderChecklist(); };
      li.append(cb, span, delBtn);
    }
    checklistUl.appendChild(li);
  });
}

function renderProjectNotes() {
  projectNotesList.innerHTML = '';
  currentNote.projectNotes.forEach((pNote) => {
    const card = document.createElement('div');
    card.className = 'project-note-card';
    if (editingNoteId === pNote.id) {
      const txt = document.createElement('textarea');
      txt.className = 'project-note-edit-area';
      txt.value = pNote.content;
      const saveEdit = () => {
        if (txt.value.trim()) { pNote.content = txt.value.trim(); saveNotes(); }
        editingNoteId = null; renderProjectNotes();
      };
      txt.onblur = saveEdit;
      card.appendChild(txt);
      setTimeout(() => txt.focus(), 10);
    } else {
      card.innerHTML = `<p class="project-note-content">${pNote.content}</p>`;
      card.onclick = () => { editingNoteId = pNote.id; renderProjectNotes(); };
      const del = document.createElement('button');
      del.className = 'btn-checklist-action'; del.textContent = '✕';
      del.onclick = (e) => { e.stopPropagation(); currentNote.projectNotes = currentNote.projectNotes.filter(n => n.id !== pNote.id); saveNotes(); renderProjectNotes(); };
      card.appendChild(del);
    }
    projectNotesList.appendChild(card);
  });
}

// Events
newNoteBtn.onclick = () => openNote(null);
backToListBtn.onclick = () => {
  currentNote.title = noteTitleInput.value;
  currentNote.description = noteDescInput.value;
  saveNotes(); renderListView();
};
noteTitleInput.oninput = () => { currentNote.title = noteTitleInput.value; saveNotes(); };
noteDescInput.oninput = () => { currentNote.description = noteDescInput.value; saveNotes(); };
checklistForm.onsubmit = (e) => {
  e.preventDefault();
  if (checklistInput.value.trim()) {
    currentNote.items.push({ id: Date.now(), text: checklistInput.value.trim(), done: false });
    checklistInput.value = ''; saveNotes(); renderChecklist();
  }
};
projectNoteForm.onsubmit = (e) => {
  e.preventDefault();
  if (projectNoteInput.value.trim()) {
    currentNote.projectNotes.push({ id: Date.now(), content: projectNoteInput.value.trim(), createdAt: Date.now() });
    projectNoteInput.value = ''; saveNotes(); renderProjectNotes();
  }
};
deleteNoteBtn.onclick = () => { notes = notes.filter(n => n.id !== currentNote.id); saveNotes(); renderListView(); };

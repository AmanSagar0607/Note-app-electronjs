const { ipcRenderer } = require('electron');

// DOM Elements
let currentNote = null;
const noteEditor = document.getElementById('note-editor');
const saveButton = document.getElementById('save-button');
const newNoteButton = document.getElementById('new-note-button');
const notesContainer = document.getElementById('notes-container');

// Load notes when the app starts
async function loadNotes() {
    const notes = await ipcRenderer.invoke('load-notes');
    displayNotes(notes);
}

// Format date for display
function formatDate(timestamp) {
    return new Date(timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Display notes in the list
function displayNotes(notes) {
    notesContainer.innerHTML = '';
    notes
        .sort((a, b) => b.timestamp - a.timestamp)
        .forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note-item';
            
            const titleElement = document.createElement('div');
            titleElement.textContent = note.title || 'Untitled Note';
            
            const timestampElement = document.createElement('div');
            timestampElement.className = 'timestamp';
            timestampElement.textContent = formatDate(note.timestamp);
            
            noteElement.appendChild(titleElement);
            noteElement.appendChild(timestampElement);
            
            if (currentNote && currentNote.id === note.id) {
                noteElement.classList.add('selected');
            }
            
            noteElement.addEventListener('click', () => selectNote(note));
            notesContainer.appendChild(noteElement);
        });
}

// Select a note for editing
function selectNote(note) {
    currentNote = note;
    noteEditor.value = note.content || '';
    
    // Update selected state in list
    document.querySelectorAll('.note-item').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Find and select the current note element
    const noteElements = document.querySelectorAll('.note-item');
    noteElements.forEach(el => {
        if (el.querySelector('div').textContent === (note.title || 'Untitled Note')) {
            el.classList.add('selected');
        }
    });
}

// Create a new note
function createNewNote() {
    currentNote = null;
    noteEditor.value = '';
    
    // Remove selection from all notes
    document.querySelectorAll('.note-item').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Focus the editor
    noteEditor.focus();
}

// Save the current note
async function saveNote() {
    const content = noteEditor.value;
    if (!content.trim()) return;

    const note = {
        id: currentNote?.id,
        title: content.split('\n')[0] || 'Untitled Note',
        content,
        timestamp: Date.now()
    };

    const notes = await ipcRenderer.invoke('save-note', note);
    displayNotes(notes);
    
    if (!currentNote) {
        currentNote = notes[notes.length - 1];
    }
}

// Auto-save functionality
let autoSaveTimeout;
function setupAutoSave() {
    noteEditor.addEventListener('input', () => {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(saveNote, 1000); // Auto-save after 1 second of inactivity
    });
}

// Event listeners
saveButton.addEventListener('click', saveNote);
newNoteButton.addEventListener('click', createNewNote);

// Initialize
loadNotes();
setupAutoSave();

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 's':
                e.preventDefault();
                saveNote();
                break;
            case 'n':
                e.preventDefault();
                createNewNote();
                break;
        }
    }
});
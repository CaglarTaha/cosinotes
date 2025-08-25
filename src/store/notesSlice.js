import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk for loading notes from local storage
export const loadNotesFromStorage = createAsyncThunk(
  'notes/loadNotesFromStorage',
  async () => {
    if (window.electronAPI) {
      return await window.electronAPI.readNotes();
    }
    // Fallback to localStorage for web development
    const stored = localStorage.getItem('notes');
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? { notes: parsed, groups: [], connections: [] } : parsed;
    }
    
    // Return sample data for demo
    return {
      notes: [
        {
          id: '1',
          title: 'Welcome to Sticky Notes!',
          content: 'This is your first sticky note. You can drag it around, edit it by clicking, and pin it to keep it on top.',
          groupId: null,
          pinned: true,
          position: { x: 50, y: 50 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Create Groups',
          content: 'Use the group selector to organize your notes into categories. Each group can have its own color!',
          groupId: null,
          pinned: false,
          position: { x: 350, y: 50 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '3',
          title: 'Drag & Drop',
          content: 'Try dragging this note around the screen. Notes can be positioned anywhere you want!',
          groupId: null,
          pinned: false,
          position: { x: 200, y: 300 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ],
      groups: [
        {
          id: '1',
          name: 'Work',
          color: '#007bff',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Personal',
          color: '#28a745',
          createdAt: new Date().toISOString(),
        }
      ],
      connections: [
        {
          id: 'conn1',
          fromNoteId: '1',
          toNoteId: '2',
          type: 'related',
          createdAt: new Date().toISOString(),
        }
      ]
    };
  }
);

// Async thunk for saving notes to local storage
export const saveNotesToStorage = createAsyncThunk(
  'notes/saveNotesToStorage',
  async (data) => {
    if (window.electronAPI) {
      return await window.electronAPI.saveNotes(data);
    }
    // Fallback to localStorage for web development
    localStorage.setItem('notes', JSON.stringify(data));
    return { success: true };
  }
);

const notesSlice = createSlice({
  name: 'notes',
  initialState: {
    notes: [],
    groups: [],
    connections: [],
    currentNote: null,
    currentGroup: null,
    selectedNotes: [],
    connectionMode: false,
    loading: false,
    error: null,
  },
  reducers: {
    addNote: (state, action) => {
      const { title, content, groupId, position } = action.payload;
      const newNote = {
        id: Date.now().toString(),
        title: title || 'Untitled Note',
        content: content || '',
        groupId: groupId || null,
        pinned: false,
        position: position || { x: Math.random() * 200, y: Math.random() * 200 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Ensure position is always defined
      if (!newNote.position) {
        newNote.position = { x: Math.random() * 200, y: Math.random() * 200 };
      }
      
      state.notes.unshift(newNote);
      state.currentNote = newNote;
    },
    updateNote: (state, action) => {
      const { id, title, content, position, groupId } = action.payload;
      const noteIndex = state.notes.findIndex(note => note.id === id);
      if (noteIndex !== -1) {
        const oldGroupId = state.notes[noteIndex].groupId;
        state.notes[noteIndex] = {
          ...state.notes[noteIndex],
          title: title !== undefined ? title : state.notes[noteIndex].title,
          content: content !== undefined ? content : state.notes[noteIndex].content,
          position: position || state.notes[noteIndex].position,
          groupId: groupId !== undefined ? groupId : state.notes[noteIndex].groupId,
          updatedAt: new Date().toISOString(),
        };
        
        // If note moved to a different group, ensure connections are still valid
        if (groupId !== undefined && groupId !== oldGroupId) {
          // Connections remain valid as they're based on note IDs, not group IDs
          // But we can add validation here if needed in the future
        }
        
        if (state.currentNote && state.currentNote.id === id) {
          state.currentNote = state.notes[noteIndex];
        }
      }
    },
    deleteNote: (state, action) => {
      const noteId = action.payload;
      // Remove note
      state.notes = state.notes.filter(note => note.id !== noteId);
      // Remove all connections involving this note
      state.connections = state.connections.filter(
        conn => conn.fromNoteId !== noteId && conn.toNoteId !== noteId
      );
      // Clear selection if deleted note was selected
      state.selectedNotes = state.selectedNotes.filter(id => id !== noteId);
      if (state.currentNote && state.currentNote.id === noteId) {
        state.currentNote = state.notes[0] || null;
      }
    },
    togglePinNote: (state, action) => {
      const noteId = action.payload;
      const noteIndex = state.notes.findIndex(note => note.id === noteId);
      if (noteIndex !== -1) {
        state.notes[noteIndex].pinned = !state.notes[noteIndex].pinned;
        if (state.currentNote && state.currentNote.id === noteId) {
          state.currentNote = state.notes[noteIndex];
        }
      }
    },
    moveNote: (state, action) => {
      const { id, position } = action.payload;
      const noteIndex = state.notes.findIndex(note => note.id === id);
      if (noteIndex !== -1 && position) {
        state.notes[noteIndex].position = position;
        if (state.currentNote && state.currentNote.id === id) {
          state.currentNote = state.notes[noteIndex];
        }
      }
    },
    addGroup: (state, action) => {
      const { name, color } = action.payload;
      const newGroup = {
        id: Date.now().toString(),
        name: name || 'New Group',
        color: color || '#007bff',
        createdAt: new Date().toISOString(),
      };
      state.groups.push(newGroup);
    },
    updateGroup: (state, action) => {
      const { id, name, color } = action.payload;
      const groupIndex = state.groups.findIndex(group => group.id === id);
      if (groupIndex !== -1) {
        state.groups[groupIndex] = {
          ...state.groups[groupIndex],
          name: name || state.groups[groupIndex].name,
          color: color || state.groups[groupIndex].color,
        };
      }
    },
    deleteGroup: (state, action) => {
      const groupId = action.payload;
      // Remove group
      state.groups = state.groups.filter(group => group.id !== groupId);
      // Remove groupId from notes but keep connections intact
      state.notes = state.notes.map(note => 
        note.groupId === groupId ? { ...note, groupId: null } : note
      );
      // Clear current group if it was deleted
      if (state.currentGroup && state.currentGroup.id === groupId) {
        state.currentGroup = null;
      }
    },
    // Connection management
    addConnection: (state, action) => {
      const { fromNoteId, toNoteId, type = 'related' } = action.payload;
      // Prevent duplicate connections and self-connections
      const existingConnection = state.connections.find(
        conn => (conn.fromNoteId === fromNoteId && conn.toNoteId === toNoteId) ||
                (conn.fromNoteId === toNoteId && conn.toNoteId === fromNoteId)
      );
      if (!existingConnection && fromNoteId !== toNoteId) {
        // Verify both notes exist before creating connection
        const fromNote = state.notes.find(note => note.id === fromNoteId);
        const toNote = state.notes.find(note => note.id === toNoteId);
        
        if (fromNote && toNote) {
          // Ensure both notes are in the same group for group-specific connections
          const fromGroupId = fromNote.groupId;
          const toGroupId = toNote.groupId;
          
          if (fromGroupId === toGroupId) {
            const newConnection = {
              id: Date.now().toString(),
              fromNoteId,
              toNoteId,
              type,
              groupId: fromGroupId, // Store group ID for filtering
              createdAt: new Date().toISOString(),
            };
            state.connections.push(newConnection);
          }
        }
      }
    },
    removeConnection: (state, action) => {
      const connectionId = action.payload;
      state.connections = state.connections.filter(conn => conn.id !== connectionId);
    },
    cleanupOrphanedConnections: (state) => {
      // Remove connections that reference non-existent notes
      state.connections = state.connections.filter(connection => {
        const fromNoteExists = state.notes.some(note => note.id === connection.fromNoteId);
        const toNoteExists = state.notes.some(note => note.id === connection.toNoteId);
        return fromNoteExists && toNoteExists;
      });
    },
    // Selection management
    selectNote: (state, action) => {
      const noteId = action.payload;
      if (!state.selectedNotes.includes(noteId)) {
        state.selectedNotes.push(noteId);
      }
    },
    deselectNote: (state, action) => {
      const noteId = action.payload;
      state.selectedNotes = state.selectedNotes.filter(id => id !== noteId);
    },
    clearSelection: (state) => {
      state.selectedNotes = [];
    },
    toggleConnectionMode: (state) => {
      state.connectionMode = !state.connectionMode;
      if (!state.connectionMode) {
        state.selectedNotes = [];
      }
    },
    setCurrentNote: (state, action) => {
      state.currentNote = action.payload;
    },
    setCurrentGroup: (state, action) => {
      state.currentGroup = action.payload;
    },
    clearCurrentNote: (state) => {
      state.currentNote = null;
    },
    clearCurrentGroup: (state) => {
      state.currentGroup = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadNotesFromStorage.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadNotesFromStorage.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload;
        
        // Ensure all notes have proper position data
        state.notes = (data.notes || []).map(note => ({
          ...note,
          position: note.position || { x: Math.random() * 200, y: Math.random() * 200 }
        }));
        
        state.groups = data.groups || [];
        state.connections = data.connections || [];
        state.currentNote = state.notes[0] || null;
        state.currentGroup = data.groups?.[0] || null;
      })
      .addCase(loadNotesFromStorage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const {
  addNote,
  updateNote,
  deleteNote,
  togglePinNote,
  moveNote,
  addGroup,
  updateGroup,
  deleteGroup,
  addConnection,
  removeConnection,
  cleanupOrphanedConnections,
  selectNote,
  deselectNote,
  clearSelection,
  toggleConnectionMode,
  setCurrentNote,
  setCurrentGroup,
  clearCurrentNote,
  clearCurrentGroup,
} = notesSlice.actions;

export default notesSlice.reducer;

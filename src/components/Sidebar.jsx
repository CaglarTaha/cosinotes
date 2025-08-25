import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addNote, setCurrentNote, deleteNote } from '../store/notesSlice';
import './Sidebar.css';

const Sidebar = () => {
  const dispatch = useDispatch();
  const { notes, currentNote } = useSelector((state) => state.notes);
  const [searchTerm, setSearchTerm] = useState('');

  const handleNewNote = () => {
    dispatch(addNote({ title: 'New Note', content: '' }));
  };

  const handleNoteClick = (note) => {
    dispatch(setCurrentNote(note));
  };

  const handleDeleteNote = (e, noteId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this note?')) {
      dispatch(deleteNote(noteId));
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Notes</h2>
        <button className="new-note-btn" onClick={handleNewNote}>
          + New Note
        </button>
      </div>
      
      <div className="search-container">
        <input
          type="text"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="notes-list">
        {filteredNotes.length === 0 ? (
          <div className="empty-state">
            {searchTerm ? 'No notes found' : 'No notes yet. Create your first note!'}
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              className={`note-item ${currentNote?.id === note.id ? 'active' : ''}`}
              onClick={() => handleNoteClick(note)}
            >
              <div className="note-content">
                <h3 className="note-title">{note.title}</h3>
                <p className="note-preview">
                  {note.content.substring(0, 50)}
                  {note.content.length > 50 ? '...' : ''}
                </p>
                <span className="note-date">{formatDate(note.updatedAt)}</span>
              </div>
              <button
                className="delete-btn"
                onClick={(e) => handleDeleteNote(e, note.id)}
                title="Delete note"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;

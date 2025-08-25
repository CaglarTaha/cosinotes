import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateNote } from '../store/notesSlice';
import './NoteEditor.css';

const NoteEditor = () => {
  const dispatch = useDispatch();
  const { currentNote } = useSelector((state) => state.notes);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (currentNote) {
      setTitle(currentNote.title);
      setContent(currentNote.content);
    } else {
      setTitle('');
      setContent('');
    }
  }, [currentNote]);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (currentNote) {
      dispatch(updateNote({ id: currentNote.id, title: newTitle }));
    }
  };

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    if (currentNote) {
      dispatch(updateNote({ id: currentNote.id, content: newContent }));
    }
  };

  if (!currentNote) {
    return (
      <div className="note-editor">
        <div className="empty-editor">
          <h2>Welcome to Note App</h2>
          <p>Select a note from the sidebar or create a new one to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="note-editor">
      <div className="editor-header">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Note title..."
          className="title-input"
        />
        <div className="note-info">
          <span>Last updated: {new Date(currentNote.updatedAt).toLocaleString()}</span>
        </div>
      </div>
      
      <div className="editor-content">
        <textarea
          value={content}
          onChange={handleContentChange}
          placeholder="Start writing your note..."
          className="content-textarea"
          autoFocus
        />
      </div>
    </div>
  );
};

export default NoteEditor;

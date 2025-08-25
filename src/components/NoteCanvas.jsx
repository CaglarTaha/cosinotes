import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addNote, setCurrentNote, togglePinNote, moveNote, toggleConnectionMode, clearSelection } from '../store/notesSlice';
import StickyNote from './StickyNote';
import GroupSelector from './GroupSelector';
import RopeConnections from './RopeConnections';
import RopeSettings from './RopeSettings';
import './NoteCanvas.css';

const NoteCanvas = () => {
  const dispatch = useDispatch();
  const { notes, groups, currentGroup, connectionMode, selectedNotes } = useSelector((state) => state.notes);
  const [draggingNoteId, setDraggingNoteId] = useState(null);
  const [ropeSettings, setRopeSettings] = useState({
    thickness: 'medium',
    color: 'brown',
    animationSpeed: 'normal',
    stiffness: 0.1,
    showTension: true,
    opacity: 1,
    enableShadows: true,
    enableTexture: true
  });

  const handleAddNote = useCallback(() => {
    // Get canvas content area bounds
    const canvasElement = document.querySelector('.canvas-content');
    if (!canvasElement) return;

    const canvasRect = canvasElement.getBoundingClientRect();
    const noteWidth = 280; // Width of sticky note
    const noteHeight = 200; // Minimum height of sticky note

    // Calculate random position within canvas bounds
    const maxX = Math.max(0, canvasRect.width - noteWidth);
    const maxY = Math.max(0, canvasRect.height - noteHeight);
    
    const position = {
      x: Math.random() * maxX,
      y: Math.random() * maxY
    };
    
    dispatch(addNote({
      title: 'New Note',
      content: '',
      groupId: currentGroup?.id || null,
      position
    }));
  }, [dispatch, currentGroup]);

  const handleNoteClick = useCallback((note) => {
    if (!draggingNoteId && !connectionMode) {
      dispatch(setCurrentNote(note));
    }
  }, [dispatch, draggingNoteId, connectionMode]);

  const handleNoteDrag = useCallback((noteId, position) => {
    dispatch(moveNote({ id: noteId, position }));
  }, [dispatch]);

  const handlePinToggle = useCallback((noteId) => {
    dispatch(togglePinNote(noteId));
  }, [dispatch]);

  const handleDragStart = useCallback((noteId) => {
    setDraggingNoteId(noteId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingNoteId(null);
  }, []);

  const handleConnectionModeToggle = useCallback(() => {
    dispatch(toggleConnectionMode());
  }, [dispatch]);

  const handleCanvasClick = useCallback((e) => {
    // Clear selection when clicking on empty canvas
    if (e.target.classList.contains('canvas-content') || e.target.classList.contains('notes-container')) {
      if (connectionMode) {
        dispatch(clearSelection());
      }
    }
  }, [connectionMode, dispatch]);

  // Filter notes by current group - show all notes when no group is selected
  const filteredNotes = (currentGroup 
    ? notes.filter(note => note.groupId === currentGroup.id)
    : notes).filter(note => note && note.id); // Filter out invalid notes

  // Sort notes: pinned first, then by update time
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  // Get group info for display
  const getGroupInfo = () => {
    if (!currentGroup) {
      return {
        name: 'All Notes',
        color: '#6c757d',
        count: notes.length
      };
    }
    return {
      name: currentGroup.name,
      color: currentGroup.color,
      count: filteredNotes.length
    };
  };

  const groupInfo = getGroupInfo();

  return (
    <div className="note-canvas">
      <div className="canvas-header">
        <div className="header-left">
          <div className="header-title">
            <h1>Sticky Notes</h1>
            <div className="group-info">
              <span 
                className="group-indicator" 
                style={{ backgroundColor: groupInfo.color }}
              ></span>
              <span className="group-name">{groupInfo.name}</span>
              <span className="note-count">({groupInfo.count} notes)</span>
            </div>
          </div>
        </div>
        
        <div className="header-center">
          <GroupSelector />
        </div>
        
        <div className="header-right">
          <RopeSettings 
            settings={ropeSettings} 
            onSettingsChange={setRopeSettings} 
          />
          <button 
            className={`connection-mode-btn ${connectionMode ? 'active' : ''}`}
            onClick={handleConnectionModeToggle}
            title={connectionMode ? 'Exit connection mode' : 'Enter connection mode'}
          >
            🔗 {connectionMode ? 'Exit' : 'Connect'}
          </button>
          <button className="add-note-btn" onClick={handleAddNote}>
            + Add Note
          </button>
        </div>
      </div>
      
      <div className="canvas-content" onClick={handleCanvasClick}>
        {connectionMode && (
          <div className="connection-mode-indicator">
            <div className="connection-instructions">
              <h3>Connection Mode Active</h3>
              <p>Click on notes to connect them. Selected: {selectedNotes.length}/2</p>
              {selectedNotes.length > 0 && (
                <button 
                  className="clear-selection-btn"
                  onClick={() => dispatch(clearSelection())}
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>
        )}
        
        <RopeConnections settings={ropeSettings} />
        
        {sortedNotes.length === 0 ? (
          <div className="empty-canvas">
            <div className="empty-message">
              <h2>No notes yet</h2>
              <p>
                {currentGroup 
                  ? `No notes in "${currentGroup.name}" group. Create your first note to get started!`
                  : 'Create your first sticky note to get started!'
                }
              </p>
              <button className="create-first-note" onClick={handleAddNote}>
                Create Note
              </button>
            </div>
          </div>
        ) : (
          <div className="notes-container">
            {sortedNotes.map((note) => (
              <StickyNote
                key={note.id}
                note={note}
                onClick={() => handleNoteClick(note)}
                onDrag={handleNoteDrag}
                onPinToggle={handlePinToggle}
                onDragStart={() => handleDragStart(note.id)}
                onDragEnd={handleDragEnd}
                isDragging={draggingNoteId === note.id}
                setIsDragging={(dragging) => {
                  if (dragging) {
                    handleDragStart(note.id);
                  } else {
                    handleDragEnd();
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteCanvas;

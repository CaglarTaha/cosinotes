import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateNote, deleteNote, selectNote, deselectNote, addConnection } from '../store/notesSlice';
import './StickyNote.css';

const StickyNote = ({ note, onClick, onDrag, onPinToggle, isDragging, setIsDragging }) => {
  // Safety check - if note is invalid, don't render
  if (!note || !note.id) {
    return null;
  }
  const dispatch = useDispatch();
  const { connectionMode, selectedNotes } = useSelector((state) => state.notes);
  const noteRef = useRef(null);
  const titleRef = useRef(null);
  const contentRef = useRef(null);
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [title, setTitle] = useState(note.title || '');
  const [content, setContent] = useState(note.content || '');
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isLocalDragging, setIsLocalDragging] = useState(false);

  const isSelected = selectedNotes.includes(note.id);

  // Update local state when note changes from external sources
  useEffect(() => {
    if (!isEditingTitle && note.title !== undefined) {
      setTitle(note.title || '');
    }
    if (!isEditingContent && note.content !== undefined) {
      setContent(note.content || '');
    }
  }, [note.title, note.content, isEditingTitle, isEditingContent]);

  // Handle mouse down for dragging
  const handleMouseDown = useCallback((e) => {
    // Prevent dragging when clicking on interactive elements
    if (e.target.closest('.note-actions') || 
        e.target.closest('.pin-btn, .delete-btn, .connect-btn') ||
        e.target.closest('[contenteditable]') ||
        e.target.closest('.note-title') ||
        e.target.closest('.note-content')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    // Handle connection mode
    if (connectionMode) {
      if (isSelected) {
        dispatch(deselectNote(note.id));
      } else {
        dispatch(selectNote(note.id));
        // If we have 2 selected notes, create a connection
        if (selectedNotes.length === 1) {
          const firstNoteId = selectedNotes[0];
          dispatch(addConnection({ fromNoteId: firstNoteId, toNoteId: note.id }));
          dispatch(deselectNote(firstNoteId));
          dispatch(deselectNote(note.id));
        }
      }
      return;
    }

    const rect = noteRef.current.getBoundingClientRect();
    const canvasElement = document.querySelector('.canvas-content');
    if (!canvasElement) return;

    const canvasRect = canvasElement.getBoundingClientRect();
    
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    setIsLocalDragging(true);
    setIsDragging(true);
    
    // Emit custom drag start event for rope animations with immediate dispatch
    const dragEvent = new CustomEvent('dragstart', { 
      detail: { noteId: note.id },
      bubbles: true,
      cancelable: true
    });
    document.dispatchEvent(dragEvent);
  }, [setIsDragging, connectionMode, isSelected, selectedNotes, dispatch, note.id]);

  const handleMouseMove = useCallback((e) => {
    if (!isLocalDragging) return;

    e.preventDefault();
    e.stopPropagation();

    const canvasElement = document.querySelector('.canvas-content');
    if (!canvasElement || !noteRef.current) return;

    const canvasRect = canvasElement.getBoundingClientRect();
    const noteWidth = noteRef.current.offsetWidth;
    const noteHeight = noteRef.current.offsetHeight;

    // Calculate new position relative to canvas
    const newX = e.clientX - canvasRect.left - dragOffset.x;
    const newY = e.clientY - canvasRect.top - dragOffset.y;

    // Apply bounds constraints
    const maxX = Math.max(0, canvasRect.width - noteWidth);
    const maxY = Math.max(0, canvasRect.height - noteHeight);
    
    const boundedX = Math.max(0, Math.min(newX, maxX));
    const boundedY = Math.max(0, Math.min(newY, maxY));

    // Update position smoothly
    onDrag(note.id, { x: boundedX, y: boundedY });
  }, [isLocalDragging, dragOffset, note.id, onDrag]);

  const handleMouseUp = useCallback(() => {
    if (isLocalDragging) {
      setIsLocalDragging(false);
      setIsDragging(false);
      
      // Emit custom drag end event for rope animations with immediate dispatch
      const dragEndEvent = new CustomEvent('dragend', { 
        detail: { noteId: note.id },
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(dragEndEvent);
    }
  }, [isLocalDragging, setIsDragging, note.id]);

  // Global event listeners for smooth dragging
  useEffect(() => {
    if (isLocalDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: false });
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isLocalDragging, handleMouseMove, handleMouseUp]);

  // Title editing handlers
  const handleTitleClick = (e) => {
    e.stopPropagation();
    if (!connectionMode && !isEditingTitle) {
      setIsEditingTitle(true);
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        if (titleRef.current) {
          titleRef.current.focus();
          // Set initial content
          titleRef.current.textContent = title;
          // Place cursor at the end
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(titleRef.current);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }, 0);
    }
  };

  const handleTitleInput = (e) => {
    // Only update local state, don't dispatch to store yet
    const newTitle = e.target.textContent || '';
    setTitle(newTitle);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      titleRef.current?.blur();
    }
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    // Update store with final value
    const finalTitle = title.trim();
    dispatch(updateNote({ id: note.id, title: finalTitle }));
  };

  // Content editing handlers
  const handleContentClick = (e) => {
    e.stopPropagation();
    if (!connectionMode && !isEditingContent) {
      setIsEditingContent(true);
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.focus();
          // Set initial content
          contentRef.current.textContent = content;
          // Place cursor at the end
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(contentRef.current);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }, 0);
    }
  };

  const handleContentInput = (e) => {
    // Only update local state, don't dispatch to store yet
    const newContent = e.target.textContent || '';
    setContent(newContent);
  };

  const handleContentKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      contentRef.current?.blur();
    }
  };

  const handleContentBlur = () => {
    setIsEditingContent(false);
    // Update store with final value
    const finalContent = content.trim();
    dispatch(updateNote({ id: note.id, content: finalContent }));
  };

  // Action handlers
  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this note?')) {
      dispatch(deleteNote(note.id));
    }
  };

  const handlePinToggle = (e) => {
    e.stopPropagation();
    onPinToggle(note.id);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Get truncated text for display
  const getTruncatedTitle = (text, maxLength = 30) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getTruncatedContent = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div
      ref={noteRef}
      className={`sticky-note ${note.pinned ? 'pinned' : ''} ${isLocalDragging ? 'dragging' : ''} ${isSelected ? 'selected' : ''} ${connectionMode ? 'connection-mode' : ''}`}
      style={{
        left: note.position?.x || 0,
        top: note.position?.y || 0,
        cursor: isLocalDragging ? 'grabbing' : connectionMode ? 'pointer' : 'grab',
        pointerEvents: isLocalDragging ? 'none' : 'auto'
      }}
      onMouseDown={handleMouseDown}
      onClick={onClick}
    >
      <div className="note-header">
        <div className="note-title-container">
          {isEditingTitle ? (
            <div
              ref={titleRef}
              className="note-title editing"
              contentEditable={true}
              onBlur={handleTitleBlur}
              onInput={handleTitleInput}
              onKeyDown={handleTitleKeyDown}
              suppressContentEditableWarning={true}
              dir="ltr"
              lang="en"
              inputMode="text"
              spellCheck="false"
              autoCorrect="off"
              autoCapitalize="off"
              style={{ 
                direction: 'ltr', 
                unicodeBidi: 'plaintext',
                textAlign: 'left',
                writingMode: 'horizontal-tb'
              }}
              data-placeholder={!title ? 'Untitled Note' : ''}
            />
          ) : (
            <div
              className="note-title"
              onClick={handleTitleClick}
              title={title || 'Click to edit title'}
              style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}
            >
              {getTruncatedTitle(title || '') || 'Untitled Note'}
            </div>
          )}
        </div>
        <div className="note-actions">
          {connectionMode && (
            <button
              className={`connect-btn ${isSelected ? 'selected' : ''}`}
              title={isSelected ? 'Selected for connection' : 'Click to select for connection'}
              onMouseDown={(e) => e.stopPropagation()}
            >
              🔗
            </button>
          )}
          <button
            className={`pin-btn ${note.pinned ? 'pinned' : ''}`}
            onClick={handlePinToggle}
            title={note.pinned ? 'Unpin note' : 'Pin note'}
            onMouseDown={(e) => e.stopPropagation()}
          >
            📌
          </button>
          <button
            className="delete-btn"
            onClick={handleDelete}
            title="Delete note"
            onMouseDown={(e) => e.stopPropagation()}
          >
            ×
          </button>
        </div>
      </div>
      
      <div className="note-content-container">
        {isEditingContent ? (
          <div
            ref={contentRef}
            className="note-content editing"
            contentEditable={true}
            onBlur={handleContentBlur}
            onInput={handleContentInput}
            onKeyDown={handleContentKeyDown}
            suppressContentEditableWarning={true}
            dir="ltr"
            lang="en"
            inputMode="text"
            spellCheck="false"
            autoCorrect="off"
            autoCapitalize="off"
            style={{ 
              direction: 'ltr', 
              unicodeBidi: 'plaintext',
              textAlign: 'left',
              writingMode: 'horizontal-tb'
            }}
            data-placeholder={!content ? 'Write your note here...' : ''}
          />
        ) : (
          <div
            className="note-content"
            onClick={handleContentClick}
            title={content || 'Click to edit content'}
            style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}
          >
            {getTruncatedContent(content || '') || 'Write your note here...'}
          </div>
        )}
      </div>
      
      <div className="note-footer">
        <span className="note-date">{formatDate(note.updatedAt || note.createdAt)}</span>
      </div>
      
      <div className="note-shadow"></div>
    </div>
  );
};

export default StickyNote;

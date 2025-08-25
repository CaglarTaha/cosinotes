import React from 'react';
import { useSelector } from 'react-redux';
import './RightSidebar.css';

const RightSidebar = () => {
  const { currentNote, notes, groups } = useSelector((state) => state.notes);

  const getGroupName = (groupId) => {
    if (!groupId) return 'No Group';
    const group = groups.find(g => g.id === groupId);
    return group ? group.name : 'Unknown Group';
  };

  const getGroupColor = (groupId) => {
    if (!groupId) return '#6c757d';
    const group = groups.find(g => g.id === groupId);
    return group ? group.color : '#6c757d';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getNoteStats = () => {
    const totalNotes = notes.length;
    const pinnedNotes = notes.filter(note => note.pinned).length;
    const groupedNotes = notes.filter(note => note.groupId).length;
    const ungroupedNotes = totalNotes - groupedNotes;

    return { totalNotes, pinnedNotes, groupedNotes, ungroupedNotes };
  };

  const stats = getNoteStats();

  return (
    <div className="right-sidebar">
      <div className="sidebar-header">
        <h3>Note Details</h3>
      </div>

      {currentNote && currentNote.id ? (
        <div className="note-details">
          <div className="detail-section">
            <h4>Title</h4>
            <p className="detail-value">{currentNote.title}</p>
          </div>

          <div className="detail-section">
            <h4>Content</h4>
            <div className="detail-value content-preview">
              {currentNote.content || <em>No content</em>}
            </div>
          </div>

          <div className="detail-section">
            <h4>Group</h4>
            <div className="group-info">
              <span 
                className="group-indicator" 
                style={{ backgroundColor: getGroupColor(currentNote.groupId) }}
              ></span>
              <span className="detail-value">{getGroupName(currentNote.groupId)}</span>
            </div>
          </div>

          <div className="detail-section">
            <h4>Status</h4>
            <div className="status-info">
              <span className={`status-badge ${currentNote.pinned ? 'pinned' : 'unpinned'}`}>
                {currentNote.pinned ? '📌 Pinned' : '📄 Unpinned'}
              </span>
            </div>
          </div>

          <div className="detail-section">
            <h4>Position</h4>
            <p className="detail-value">
              X: {Math.round(currentNote.position?.x || 0)}, Y: {Math.round(currentNote.position?.y || 0)}
            </p>
          </div>

          <div className="detail-section">
            <h4>Created</h4>
            <p className="detail-value">{formatDate(currentNote.createdAt)}</p>
          </div>

          <div className="detail-section">
            <h4>Last Updated</h4>
            <p className="detail-value">{formatDate(currentNote.updatedAt)}</p>
          </div>
        </div>
      ) : (
        <div className="no-note-selected">
          <div className="empty-state">
            <h4>No Note Selected</h4>
            <p>Click on a note to view its details here.</p>
          </div>
        </div>
      )}

      <div className="sidebar-footer">
        <div className="stats-section">
          <h4>Statistics</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">{stats.totalNotes}</span>
              <span className="stat-label">Total Notes</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.pinnedNotes}</span>
              <span className="stat-label">Pinned</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.groupedNotes}</span>
              <span className="stat-label">Grouped</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.ungroupedNotes}</span>
              <span className="stat-label">Ungrouped</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;

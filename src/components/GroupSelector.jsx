import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addGroup, setCurrentGroup, clearCurrentGroup, updateGroup, deleteGroup } from '../store/notesSlice';
import './GroupSelector.css';

const GroupSelector = () => {
  const dispatch = useDispatch();
  const { groups, currentGroup, notes } = useSelector((state) => state.notes);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#007bff');
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const scrollContainerRef = useRef(null);

  const handleGroupSelect = (group) => {
    if (currentGroup?.id === group?.id) {
      dispatch(clearCurrentGroup());
    } else {
      dispatch(setCurrentGroup(group));
    }
  };

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      dispatch(addGroup({
        name: newGroupName.trim(),
        color: newGroupColor
      }));
      setNewGroupName('');
      setNewGroupColor('#007bff');
      setShowAddForm(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddGroup();
    } else if (e.key === 'Escape') {
      setShowAddForm(false);
      setNewGroupName('');
    }
  };

  const handleEditGroup = (group) => {
    setEditingGroupId(group.id);
    setEditingGroupName(group.name);
  };

  const handleSaveGroupEdit = () => {
    if (editingGroupName.trim() && editingGroupId) {
      dispatch(updateGroup({
        id: editingGroupId,
        name: editingGroupName.trim()
      }));
      setEditingGroupId(null);
      setEditingGroupName('');
    }
  };

  const handleCancelGroupEdit = () => {
    setEditingGroupId(null);
    setEditingGroupName('');
  };

  const handleEditKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveGroupEdit();
    } else if (e.key === 'Escape') {
      handleCancelGroupEdit();
    }
  };

  const handleDeleteGroup = (groupId) => {
    const groupNotes = notes.filter(note => note.groupId === groupId);
    const message = groupNotes.length > 0 
      ? `This will delete the group and move ${groupNotes.length} notes to "All Notes". Continue?`
      : 'Are you sure you want to delete this group?';
    
    if (window.confirm(message)) {
      dispatch(deleteGroup(groupId));
      if (currentGroup?.id === groupId) {
        dispatch(clearCurrentGroup());
      }
    }
  };

  const colorOptions = [
    '#007bff', '#28a745', '#ffc107', '#dc3545', 
    '#6f42c1', '#fd7e14', '#20c997', '#e83e8c'
  ];

  return (
    <div className="group-selector-compact">
      <div className="group-list-container">
        <div className="group-list" ref={scrollContainerRef}>
          <button
            className={`group-item ${!currentGroup ? 'active' : ''}`}
            onClick={() => handleGroupSelect(null)}
          >
            <span className="group-color" style={{ backgroundColor: '#6c757d' }}></span>
            <span className="group-name">All</span>
            <span className="group-count">({notes.length})</span>
          </button>
          
          {groups.map((group) => {
            const groupNotes = notes.filter(note => note.groupId === group.id);
            const isEditing = editingGroupId === group.id;
            
            return (
              <div key={group.id} className="group-item-wrapper">
                {isEditing ? (
                  <div className="group-item editing">
                    <span className="group-color" style={{ backgroundColor: group.color }}></span>
                    <input
                      type="text"
                      value={editingGroupName}
                      onChange={(e) => setEditingGroupName(e.target.value)}
                      onKeyDown={handleEditKeyPress}
                      onBlur={handleSaveGroupEdit}
                      className="group-name-input"
                      autoFocus
                    />
                    <div className="group-actions">
                      <button 
                        className="save-edit-btn"
                        onClick={handleSaveGroupEdit}
                        title="Save"
                      >
                        ✓
                      </button>
                      <button 
                        className="cancel-edit-btn"
                        onClick={handleCancelGroupEdit}
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className={`group-item ${currentGroup?.id === group.id ? 'active' : ''}`}
                    onClick={() => handleGroupSelect(group)}
                  >
                    <span className="group-color" style={{ backgroundColor: group.color }}></span>
                    <span className="group-name">{group.name}</span>
                    <span className="group-count">({groupNotes.length})</span>
                    <div className="group-item-actions">
                      <button
                        className="edit-group-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditGroup(group);
                        }}
                        title="Edit group name"
                        aria-label="Edit group name"
                      >
                        ✏️
                      </button>
                      <button
                        className="delete-group-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGroup(group.id);
                        }}
                        title="Delete group"
                        aria-label="Delete group"
                      >
                        🗑️
                      </button>
                    </div>
                  </button>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Scroll indicators */}
        <div className="scroll-indicator left" />
        <div className="scroll-indicator right" />
      </div>
      
      <div className="group-actions-compact">
        {showAddForm ? (
          <div className="add-group-form-compact">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Group name..."
              className="group-name-input-compact"
              autoFocus
            />
            <div className="color-picker-compact">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  className={`color-option ${newGroupColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setNewGroupColor(color)}
                  title={color}
                />
              ))}
            </div>
            <div className="form-actions-compact">
              <button className="save-btn-compact" onClick={handleAddGroup}>
                Save
              </button>
              <button className="cancel-btn-compact" onClick={() => setShowAddForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className="add-group-btn-compact"
            onClick={() => setShowAddForm(true)}
            title="Add new group"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
};

export default GroupSelector;

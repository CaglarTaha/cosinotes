import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadNotesFromStorage, saveNotesToStorage, cleanupOrphanedConnections } from './store/notesSlice';
import NoteCanvas from './components/NoteCanvas';
import RightSidebar from './components/RightSidebar';
import './App.css';

function App() {
  const dispatch = useDispatch();
  const { notes, groups, connections, loading } = useSelector((state) => state.notes);

  // Load notes from storage on component mount
  useEffect(() => {
    dispatch(loadNotesFromStorage());
  }, [dispatch]);

  // Auto-save notes when they change
  useEffect(() => {
    if (notes.length > 0 || groups.length > 0 || connections.length > 0) {
      dispatch(saveNotesToStorage({ notes, groups, connections }));
    }
  }, [notes, groups, connections, dispatch]);

  // Clean up orphaned connections periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      dispatch(cleanupOrphanedConnections());
    }, 30000); // Clean up every 30 seconds

    return () => clearInterval(cleanupInterval);
  }, [dispatch]);

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading your notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <NoteCanvas />
      <RightSidebar />
    </div>
  );
}

export default App;

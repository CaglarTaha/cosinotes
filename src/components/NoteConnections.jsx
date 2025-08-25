import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import './NoteConnections.css';

const NoteConnections = () => {
  const { notes, connections } = useSelector((state) => state.notes);

  const connectionPaths = useMemo(() => {
    return connections.map(connection => {
      const fromNote = notes.find(note => note.id === connection.fromNoteId);
      const toNote = notes.find(note => note.id === connection.toNoteId);

      // Only show connections between existing, valid notes
      if (!fromNote || !toNote || !fromNote.id || !toNote.id) {
        console.warn(`Connection ${connection.id} references non-existent notes:`, {
          fromNoteId: connection.fromNoteId,
          toNoteId: connection.toNoteId,
          fromNoteExists: !!fromNote,
          toNoteExists: !!toNote
        });
        return null;
      }

      // Calculate connection points (center of each note)
      const fromX = (fromNote.position?.x || 0) + 140; // Half of note width (280/2)
      const fromY = (fromNote.position?.y || 0) + 100; // Half of note height (200/2)
      const toX = (toNote.position?.x || 0) + 140;
      const toY = (toNote.position?.y || 0) + 100;

      // Calculate control points for smooth curve
      const dx = toX - fromX;
      const dy = toY - fromY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Create a curved path with control points
      const controlPoint1X = fromX + dx * 0.25;
      const controlPoint1Y = fromY + dy * 0.25;
      const controlPoint2X = fromX + dx * 0.75;
      const controlPoint2Y = fromY + dy * 0.75;

      const pathData = `M ${fromX} ${fromY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${toX} ${toY}`;

      return {
        id: connection.id,
        pathData,
        fromNote,
        toNote,
        type: connection.type,
        distance
      };
    }).filter(Boolean);
  }, [connections, notes]);

  if (connectionPaths.length === 0) return null;

  return (
    <svg className="note-connections" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
      {/* Debug info for orphaned connections */}
      {connections.length > connectionPaths.length && (
        <g className="debug-info" style={{ display: 'none' }}>
          <text x="10" y="20" fill="red" fontSize="12">
            Orphaned connections: {connections.length - connectionPaths.length}
          </text>
        </g>
      )}
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#007bff" />
        </marker>
      </defs>
      
      {connectionPaths.map((connection) => (
        <g key={connection.id} className="connection-group">
          {/* Glow effect */}
          <path
            d={connection.pathData}
            className="connection-glow"
            stroke="#007bff"
            strokeWidth="8"
            fill="none"
            opacity="0.3"
            filter="url(#glow)"
          />
          
          {/* Main connection line */}
          <path
            d={connection.pathData}
            className="connection-line"
            stroke="#007bff"
            strokeWidth="3"
            fill="none"
            markerEnd="url(#arrowhead)"
            strokeDasharray={connection.distance > 300 ? "10,5" : "none"}
          />
          
          {/* Connection type indicator */}
          <circle
            cx={(connection.fromNote.position?.x || 0) + 140}
            cy={(connection.fromNote.position?.y || 0) + 100}
            r="4"
            fill="#007bff"
            className="connection-start"
          />
          
          <circle
            cx={(connection.toNote.position?.x || 0) + 140}
            cy={(connection.toNote.position?.y || 0) + 100}
            r="4"
            fill="#007bff"
            className="connection-end"
          />
        </g>
      ))}
    </svg>
  );
};

export default NoteConnections;

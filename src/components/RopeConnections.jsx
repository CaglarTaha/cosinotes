import React, { useMemo, useRef, useEffect, useState, useCallback, useLayoutEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeConnection } from '../store/notesSlice';
import performanceMonitor from '../utils/performanceMonitor';
import './RopeConnections.css';

// Performance optimization constants
const ROPE_SEGMENTS = 12; // Reduced from 15 for better performance
const ANIMATION_FPS = 60;
const FRAME_TIME = 1000 / ANIMATION_FPS;
const DRAG_THROTTLE_MS = 16; // ~60fps during drag
const IDLE_THROTTLE_MS = 33; // ~30fps when idle

// Physics constants
const SPRING_STIFFNESS = 0.15;
const SPRING_DAMPING = 0.85;
const GRAVITY = 0.15;
const MAX_VELOCITY = 10;

const RopeConnections = ({ settings = {} }) => {
  const dispatch = useDispatch();
  const { notes, connections, currentGroup } = useSelector((state) => state.notes);
  const animationRef = useRef(null);
  const lastFrameTimeRef = useRef(0);
  const ropeStatesRef = useRef(new Map());
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredConnection, setHoveredConnection] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [performanceMode, setPerformanceMode] = useState(false);

  // Filter connections by current group
  const filteredConnections = useMemo(() => {
    if (!currentGroup) {
      // Show all connections when no group is selected
      return connections;
    }
    
    // Only show connections between notes in the current group
    return connections.filter(connection => {
      const fromNote = notes.find(note => note.id === connection.fromNoteId);
      const toNote = notes.find(note => note.id === connection.toNoteId);
      
      return fromNote?.groupId === currentGroup.id && toNote?.groupId === currentGroup.id;
    });
  }, [connections, notes, currentGroup]);

  // Optimized spring physics simulation with precomputed values
  const simulateRopePhysics = useCallback((fromNote, toNote, currentPoints = null, deltaTime = 1) => {
    if (!fromNote?.position || !toNote?.position) return null;

    const fromX = fromNote.position.x + 140;
    const fromY = fromNote.position.y + 100;
    const toX = toNote.position.x + 140;
    const toY = toNote.position.y + 100;

    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Initialize points if not provided
    if (!currentPoints) {
      currentPoints = [];
      for (let i = 0; i <= ROPE_SEGMENTS; i++) {
        const t = i / ROPE_SEGMENTS;
        currentPoints.push({
          x: fromX + dx * t,
          y: fromY + dy * t,
          vx: 0,
          vy: 0
        });
      }
    }

    // Apply spring physics with delta time scaling
    const newPoints = [];
    const dt = Math.min(deltaTime, 1); // Cap delta time to prevent instability
    
    for (let i = 0; i <= ROPE_SEGMENTS; i++) {
      const point = currentPoints[i];
      
      if (i === 0) {
        // First point is fixed to fromNote
        newPoints.push({
          x: fromX,
          y: fromY,
          vx: 0,
          vy: 0
        });
      } else if (i === ROPE_SEGMENTS) {
        // Last point is fixed to toNote
        newPoints.push({
          x: toX,
          y: toY,
          vx: 0,
          vy: 0
        });
      } else {
        // Apply spring forces between adjacent points
        const prevPoint = currentPoints[i - 1];
        const nextPoint = currentPoints[i + 1];
        
        // Calculate spring forces
        const dx1 = prevPoint.x - point.x;
        const dy1 = prevPoint.y - point.y;
        const dx2 = nextPoint.x - point.x;
        const dy2 = nextPoint.y - point.y;
        
        const springForceX = (dx1 + dx2) * SPRING_STIFFNESS;
        const springForceY = (dy1 + dy2) * SPRING_STIFFNESS;
        
        // Apply damping
        const dampingX = -point.vx * SPRING_DAMPING;
        const dampingY = -point.vy * SPRING_DAMPING;
        
        // Apply gravity
        const gravityY = GRAVITY;
        
        // Update velocity with delta time scaling
        const newVx = point.vx + (springForceX + dampingX) * dt;
        const newVy = point.vy + (springForceY + dampingY + gravityY) * dt;
        
        // Limit velocity to prevent instability
        const limitedVx = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, newVx));
        const limitedVy = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, newVy));
        
        // Update position
        const newX = point.x + limitedVx * dt;
        const newY = point.y + limitedVy * dt;
        
        newPoints.push({
          x: newX,
          y: newY,
          vx: limitedVx,
          vy: limitedVy
        });
      }
    }

    return newPoints;
  }, []);

  // Calculate rope tension efficiently
  const calculateTension = useCallback((points) => {
    if (!points || points.length < 2) return 0;
    
    let totalTension = 0;
    for (let i = 1; i < points.length; i++) {
      const currentPoint = points[i];
      const prevPoint = points[i-1];
      
      const dx = currentPoint.x - prevPoint.x;
      const dy = currentPoint.y - prevPoint.y;
      totalTension += Math.sqrt(dx * dx + dy * dy);
    }
    return Math.round(totalTension / (points.length - 1));
  }, []);

  // Generate smooth rope path with optimized bezier curves
  const generateRopePath = useCallback((points) => {
    if (!points || points.length === 0) return '';
    
    let pathData = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prevPoint = points[i - 1];
      const currentPoint = points[i];
      
      if (i === 1) {
        // Use quadratic bezier for first segment
        const controlX = prevPoint.x + (currentPoint.x - prevPoint.x) * 0.5;
        const controlY = prevPoint.y + (currentPoint.y - prevPoint.y) * 0.5;
        pathData += ` Q ${controlX} ${controlY}, ${currentPoint.x} ${currentPoint.y}`;
      } else {
        // Use cubic bezier for smoother curves
        const controlX1 = prevPoint.x + (currentPoint.x - prevPoint.x) * 0.3;
        const controlY1 = prevPoint.y + (currentPoint.y - prevPoint.y) * 0.3;
        const controlX2 = prevPoint.x + (currentPoint.x - prevPoint.x) * 0.7;
        const controlY2 = prevPoint.y + (currentPoint.y - prevPoint.y) * 0.7;
        pathData += ` C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${currentPoint.x} ${currentPoint.y}`;
      }
    }

    return pathData;
  }, []);

  // Optimized rope paths generation with memoization
  const ropePaths = useMemo(() => {
    return filteredConnections
      .map(connection => {
        const fromNote = notes.find(note => note.id === connection.fromNoteId);
        const toNote = notes.find(note => note.id === connection.toNoteId);

        // Only render connections between existing, valid notes
        if (!fromNote || !toNote || !fromNote.id || !toNote.id) {
          return null;
        }

        // Get current rope state
        const currentState = ropeStatesRef.current.get(connection.id);
        const points = simulateRopePhysics(fromNote, toNote, currentState?.points);
        
        if (!points || points.length === 0) return null;
        
        // Update rope state
        ropeStatesRef.current.set(connection.id, { points });
        
        const pathData = generateRopePath(points);
        const tension = calculateTension(points);

        return {
          id: connection.id,
          pathData,
          points,
          fromNote,
          toNote,
          type: connection.type,
          connection,
          tension
        };
      })
      .filter(Boolean);
  }, [filteredConnections, notes, simulateRopePhysics, generateRopePath, calculateTension, forceUpdate]);

  // High-performance animation loop with throttling
  const animate = useCallback((currentTime) => {
    const deltaTime = currentTime - lastFrameTimeRef.current;
    const throttleTime = isDragging ? DRAG_THROTTLE_MS : IDLE_THROTTLE_MS;
    
    if (deltaTime >= throttleTime) {
      lastFrameTimeRef.current = currentTime;
      
      // Record frame for performance monitoring
      performanceMonitor.recordFrame();
      
      // Only update if we have connections
      if (filteredConnections.length > 0) {
        let hasChanges = false;
        
        filteredConnections.forEach(connection => {
          const fromNote = notes.find(note => note.id === connection.fromNoteId);
          const toNote = notes.find(note => note.id === connection.toNoteId);
          
          if (fromNote && toNote) {
            const currentState = ropeStatesRef.current.get(connection.id);
            const points = simulateRopePhysics(fromNote, toNote, currentState?.points, deltaTime);
            
            if (points) {
              ropeStatesRef.current.set(connection.id, { points });
              hasChanges = true;
            }
          } else {
            // Remove state for orphaned connections
            ropeStatesRef.current.delete(connection.id);
          }
        });
        
        // Force re-render only if there are actual changes
        if (hasChanges) {
          setForceUpdate(prev => prev + 1);
        }
      }
    }
    
    animationRef.current = requestAnimationFrame(animate);
  }, [filteredConnections, notes, simulateRopePhysics, isDragging]);

  // Start/stop animation loop
  useEffect(() => {
    if (filteredConnections.length > 0) {
      // Start performance monitoring
      performanceMonitor.start();
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate, filteredConnections.length]);

  // Subscribe to performance monitor events
  useEffect(() => {
    const unsubscribe = performanceMonitor.subscribe((event, stats) => {
      if (event === 'performance-mode-enabled') {
        setPerformanceMode(true);
      } else if (event === 'performance-mode-disabled') {
        setPerformanceMode(false);
      }
    });

    return unsubscribe;
  }, []);

  // Clean up orphaned rope states
  useLayoutEffect(() => {
    const validConnectionIds = new Set(filteredConnections.map(conn => conn.id));
    ropeStatesRef.current.forEach((state, connectionId) => {
      if (!validConnectionIds.has(connectionId)) {
        ropeStatesRef.current.delete(connectionId);
      }
    });
  }, [filteredConnections]);

  // Handle rope click for deletion
  const handleRopeClick = useCallback((connectionId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this connection?')) {
      dispatch(removeConnection(connectionId));
    }
  }, [dispatch]);

  // Handle rope hover
  const handleRopeMouseEnter = useCallback((connectionId) => {
    setHoveredConnection(connectionId);
  }, []);

  const handleRopeMouseLeave = useCallback(() => {
    setHoveredConnection(null);
  }, []);

  // Listen for dragging state changes with optimized event handling
  useEffect(() => {
    const handleDragStart = (e) => {
      setIsDragging(true);
      
      // Add initial velocity to ropes for more dynamic movement
      const draggedNoteId = e.detail?.noteId;
      if (draggedNoteId) {
        filteredConnections.forEach(connection => {
          if (connection.fromNoteId === draggedNoteId || connection.toNoteId === draggedNoteId) {
            const currentState = ropeStatesRef.current.get(connection.id);
            if (currentState?.points) {
              currentState.points.forEach(point => {
                point.vx += (Math.random() - 0.5) * 3;
                point.vy += (Math.random() - 0.5) * 3;
              });
            }
          }
        });
      }
    };
    
    const handleDragEnd = () => {
      setIsDragging(false);
      
      // Stabilize ropes after dragging ends
      ropeStatesRef.current.forEach((state, connectionId) => {
        if (state.points) {
          state.points.forEach(point => {
            point.vx *= 0.3; // Reduce velocity for stability
            point.vy *= 0.3;
          });
        }
      });
    };

    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('dragend', handleDragEnd);

    return () => {
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('dragend', handleDragEnd);
    };
  }, [filteredConnections]);

  if (ropePaths.length === 0) return null;

  return (
    <svg 
      className={`rope-connections ${isDragging ? 'dragging' : ''} rope-${settings.thickness || 'medium'} rope-${settings.animationSpeed || 'normal'} ${performanceMode ? 'performance-mode' : ''}`}
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        pointerEvents: 'none', 
        zIndex: 1 
      }}
    >
      <defs>
        {/* Rope gradient */}
        <linearGradient id="ropeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          {settings.color === 'tan' ? (
            <>
              <stop offset="0%" stopColor="#D2B48C" stopOpacity="0.8" />
              <stop offset="25%" stopColor="#DEB887" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#D2B48C" stopOpacity="1" />
              <stop offset="75%" stopColor="#DEB887" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#D2B48C" stopOpacity="0.8" />
            </>
          ) : settings.color === 'dark' ? (
            <>
              <stop offset="0%" stopColor="#654321" stopOpacity="0.8" />
              <stop offset="25%" stopColor="#8B4513" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#654321" stopOpacity="1" />
              <stop offset="75%" stopColor="#8B4513" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#654321" stopOpacity="0.8" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#8B4513" stopOpacity="0.8" />
              <stop offset="25%" stopColor="#A0522D" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#8B4513" stopOpacity="1" />
              <stop offset="75%" stopColor="#A0522D" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#8B4513" stopOpacity="0.8" />
            </>
          )}
        </linearGradient>
        
        {/* Rope shadow */}
        <filter id="ropeShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.3"/>
        </filter>
        
        {/* Rope texture */}
        <pattern id="ropeTexture" patternUnits="userSpaceOnUse" width="20" height="20">
          <circle cx="10" cy="10" r="1" fill="#654321" opacity="0.3"/>
          <circle cx="5" cy="5" r="0.5" fill="#654321" opacity="0.2"/>
          <circle cx="15" cy="15" r="0.5" fill="#654321" opacity="0.2"/>
        </pattern>

        {/* Hover effect */}
        <filter id="ropeHover" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ff4444" floodOpacity="0.6"/>
        </filter>
      </defs>
      
      {ropePaths.map((rope) => {
        const isHovered = hoveredConnection === rope.id;
        
        return (
          <g key={rope.id} className={`rope-group ${isDragging ? 'rope-stretched' : 'rope-relaxed'} ${isHovered ? 'rope-hovered' : ''}`}>
            {/* Clickable rope area for deletion */}
            <path
              d={rope.pathData}
              className="rope-click-area"
              stroke="transparent"
              strokeWidth="20"
              fill="none"
              style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              onClick={(e) => handleRopeClick(rope.id, e)}
              onMouseEnter={() => handleRopeMouseEnter(rope.id)}
              onMouseLeave={handleRopeMouseLeave}
            />
            
            {/* Rope shadow */}
            {settings.enableShadows && (
              <path
                d={rope.pathData}
                className="rope-shadow"
                stroke="#000000"
                strokeWidth="8"
                fill="none"
                opacity="0.2"
                filter="url(#ropeShadow)"
              />
            )}
            
            {/* Main rope */}
            <path
              d={rope.pathData}
              className="rope-main"
              stroke="url(#ropeGradient)"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="none"
              filter={isHovered ? "url(#ropeHover)" : "url(#ropeShadow)"}
              style={{
                strokeWidth: isDragging ? '5' : '6',
                opacity: (isDragging ? '0.9' : '1') * (settings.opacity || 1)
              }}
            />
            
            {/* Rope texture overlay */}
            {settings.enableTexture && (
              <path
                d={rope.pathData}
                className="rope-texture"
                stroke="url(#ropeTexture)"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                opacity="0.4"
              />
            )}
            
            {/* Rope highlights */}
            <path
              d={rope.pathData}
              className="rope-highlight"
              stroke="#D2B48C"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              opacity="0.6"
            />
            
            {/* Connection anchors */}
            <circle
              cx={(rope.fromNote.position?.x || 0) + 140}
              cy={(rope.fromNote.position?.y || 0) + 100}
              r="6"
              fill="#8B4513"
              stroke="#654321"
              strokeWidth="2"
              className="rope-anchor"
            />
            
            <circle
              cx={(rope.toNote.position?.x || 0) + 140}
              cy={(rope.toNote.position?.y || 0) + 100}
              r="6"
              fill="#8B4513"
              stroke="#654321"
              strokeWidth="2"
              className="rope-anchor"
            />
            
            {/* Rope knots at anchors */}
            <circle
              cx={(rope.fromNote.position?.x || 0) + 140}
              cy={(rope.fromNote.position?.y || 0) + 100}
              r="3"
              fill="#654321"
              className="rope-knot"
            />
            
            <circle
              cx={(rope.toNote.position?.x || 0) + 140}
              cy={(rope.toNote.position?.y || 0) + 100}
              r="3"
              fill="#654321"
              className="rope-knot"
            />

            {/* Tension indicator */}
            {settings.showTension && (
              <text
                x={((rope.fromNote.position?.x || 0) + (rope.toNote.position?.x || 0)) / 2 + 140}
                y={((rope.fromNote.position?.y || 0) + (rope.toNote.position?.y || 0)) / 2 + 100}
                className="tension-indicator"
                fontSize="10"
                fill="#654321"
                opacity="0.7"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {rope.tension}px
              </text>
            )}

            {/* Delete indicator on hover */}
            {isHovered && (
              <g className="delete-indicator">
                <circle
                  cx={((rope.fromNote.position?.x || 0) + (rope.toNote.position?.x || 0)) / 2 + 140}
                  cy={((rope.fromNote.position?.y || 0) + (rope.toNote.position?.y || 0)) / 2 + 100}
                  r="12"
                  fill="#ff4444"
                  opacity="0.8"
                />
                <text
                  x={((rope.fromNote.position?.x || 0) + (rope.toNote.position?.x || 0)) / 2 + 140}
                  y={((rope.fromNote.position?.y || 0) + (rope.toNote.position?.y || 0)) / 2 + 100}
                  fontSize="12"
                  fill="white"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontWeight="bold"
                >
                  ×
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
};

export default RopeConnections;

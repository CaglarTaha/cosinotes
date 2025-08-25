// Performance monitoring utility for rope connections
class PerformanceMonitor {
  constructor() {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fpsHistory = [];
    this.maxHistorySize = 60; // Keep last 60 frames
    this.lowPerformanceThreshold = 30; // FPS threshold for low performance
    this.performanceMode = false;
    this.callbacks = new Set();
  }

  // Start monitoring
  start() {
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.fpsHistory = [];
    this.performanceMode = false;
  }

  // Record a frame
  recordFrame() {
    this.frameCount++;
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;

    if (deltaTime >= 1000) { // Calculate FPS every second
      const fps = Math.round((this.frameCount * 1000) / deltaTime);
      this.fpsHistory.push(fps);
      
      // Keep only recent history
      if (this.fpsHistory.length > this.maxHistorySize) {
        this.fpsHistory.shift();
      }

      // Calculate average FPS
      const avgFps = this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
      
      // Determine if we should enter performance mode
      const shouldEnterPerformanceMode = avgFps < this.lowPerformanceThreshold && !this.performanceMode;
      const shouldExitPerformanceMode = avgFps > this.lowPerformanceThreshold + 10 && this.performanceMode;
      
      if (shouldEnterPerformanceMode) {
        this.performanceMode = true;
        this.notifyCallbacks('performance-mode-enabled');
      } else if (shouldExitPerformanceMode) {
        this.performanceMode = false;
        this.notifyCallbacks('performance-mode-disabled');
      }

      // Reset counters
      this.frameCount = 0;
      this.lastTime = currentTime;
    }
  }

  // Get current performance stats
  getStats() {
    const avgFps = this.fpsHistory.length > 0 
      ? this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length 
      : 0;
    
    return {
      currentFps: this.fpsHistory[this.fpsHistory.length - 1] || 0,
      averageFps: Math.round(avgFps),
      performanceMode: this.performanceMode,
      frameCount: this.frameCount,
      historySize: this.fpsHistory.length
    };
  }

  // Subscribe to performance events
  subscribe(callback) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  // Notify subscribers
  notifyCallbacks(event) {
    this.callbacks.forEach(callback => {
      try {
        callback(event, this.getStats());
      } catch (error) {
        console.error('Performance monitor callback error:', error);
      }
    });
  }

  // Check if performance mode should be enabled
  shouldUsePerformanceMode() {
    return this.performanceMode;
  }

  // Get recommended settings based on performance
  getRecommendedSettings() {
    const stats = this.getStats();
    
    if (stats.averageFps < 20) {
      return {
        ropeSegments: 8,
        enableShadows: false,
        enableTexture: false,
        showTension: false,
        animationSpeed: 'slow'
      };
    } else if (stats.averageFps < 40) {
      return {
        ropeSegments: 10,
        enableShadows: false,
        enableTexture: true,
        showTension: false,
        animationSpeed: 'normal'
      };
    } else {
      return {
        ropeSegments: 12,
        enableShadows: true,
        enableTexture: true,
        showTension: true,
        animationSpeed: 'normal'
      };
    }
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;

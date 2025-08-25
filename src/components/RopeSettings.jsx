import React, { useState } from 'react';
import './RopeSettings.css';

const RopeSettings = ({ settings, onSettingsChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSettingChange = (key, value) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  return (
    <div className="rope-settings">
      <button 
        className="rope-settings-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Rope Settings"
      >
        ⚙️ Rope Settings
      </button>
      
      {isOpen && (
        <div className="rope-settings-panel">
          <h3>Rope Configuration</h3>
          
          <div className="setting-group">
            <label>Rope Thickness:</label>
            <select 
              value={settings.thickness} 
              onChange={(e) => handleSettingChange('thickness', e.target.value)}
            >
              <option value="thin">Thin</option>
              <option value="medium">Medium</option>
              <option value="thick">Thick</option>
            </select>
          </div>

          <div className="setting-group">
            <label>Rope Color:</label>
            <select 
              value={settings.color} 
              onChange={(e) => handleSettingChange('color', e.target.value)}
            >
              <option value="brown">Brown</option>
              <option value="tan">Tan</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div className="setting-group">
            <label>Animation Speed:</label>
            <select 
              value={settings.animationSpeed} 
              onChange={(e) => handleSettingChange('animationSpeed', e.target.value)}
            >
              <option value="slow">Slow</option>
              <option value="normal">Normal</option>
              <option value="fast">Fast</option>
            </select>
          </div>

          <div className="setting-group">
            <label>Physics Stiffness:</label>
            <input 
              type="range" 
              min="0.05" 
              max="0.2" 
              step="0.01"
              value={settings.stiffness} 
              onChange={(e) => handleSettingChange('stiffness', parseFloat(e.target.value))}
            />
            <span>{settings.stiffness}</span>
          </div>

          <div className="setting-group">
            <label>Show Tension:</label>
            <input 
              type="checkbox" 
              checked={settings.showTension} 
              onChange={(e) => handleSettingChange('showTension', e.target.checked)}
            />
          </div>

          <div className="setting-group">
            <label>Rope Opacity:</label>
            <input 
              type="range" 
              min="0.5" 
              max="1" 
              step="0.1"
              value={settings.opacity} 
              onChange={(e) => handleSettingChange('opacity', parseFloat(e.target.value))}
            />
            <span>{settings.opacity}</span>
          </div>

          <div className="setting-group">
            <label>Enable Shadows:</label>
            <input 
              type="checkbox" 
              checked={settings.enableShadows} 
              onChange={(e) => handleSettingChange('enableShadows', e.target.checked)}
            />
          </div>

          <div className="setting-group">
            <label>Enable Texture:</label>
            <input 
              type="checkbox" 
              checked={settings.enableTexture} 
              onChange={(e) => handleSettingChange('enableTexture', e.target.checked)}
            />
          </div>

          <div className="setting-actions">
            <button 
              className="reset-settings"
              onClick={() => onSettingsChange({
                thickness: 'medium',
                color: 'brown',
                animationSpeed: 'normal',
                stiffness: 0.1,
                showTension: true,
                opacity: 1,
                enableShadows: true,
                enableTexture: true
              })}
            >
              Reset to Default
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RopeSettings;

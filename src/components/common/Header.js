import React, { useState } from 'react';
import { toggleVoice, speakText } from '../../services/ai/speechService';

const Header = ({ user, currentView }) => {
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const handleVoiceToggle = () => {
    const newState = toggleVoice();
    setVoiceEnabled(newState);
    speakText(newState ? "Voice enabled" : "Voice disabled");
  };

  return (
    <header className="header">
      <div className="header-left">
        <h1>OdysseyQuest 🚀</h1>
        <span className="current-view">{currentView}</span>
      </div>
      
      <div className="header-right">
        <button 
          className={`voice-toggle-btn ${voiceEnabled ? 'active' : ''}`}
          onClick={handleVoiceToggle}
          title={voiceEnabled ? "Disable voice" : "Enable voice"}
        >
          {voiceEnabled ? '🔊' : '🔇'}
        </button>
        
        <div className="user-info">
          <div className="avatar-small">
            {user?.avatar ? (
              <img 
                src={`data:image/svg+xml;utf8,${encodeURIComponent(user.avatar)}`} 
                alt="User Avatar" 
                style={{width: '100%', height: '100%', borderRadius: '50%'}}
              />
            ) : (
              <span>👦</span>
            )}
          </div>
          <span>Hello, {user?.name}!</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
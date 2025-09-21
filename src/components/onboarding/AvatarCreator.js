import React from 'react';

const AvatarCreator = ({ avatarData, userName }) => {
  // Simple fallback avatar based on name
  const getFallbackAvatar = (name) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F9A826', '#6C5CE7'];
    const color = colors[name.length % colors.length];
    const initial = name.charAt(0).toUpperCase();
    
    return (
      <div 
        className="avatar-fallback" 
        style={{ backgroundColor: color }}
      >
        {initial}
      </div>
    );
  };

  return (
    <div className="avatar-creator">
      <div className="avatar-preview">
        <div className="avatar-image">
          {avatarData ? (
            <img 
              src={`data:image/svg+xml;utf8,${encodeURIComponent(avatarData)}`} 
              alt="User Avatar" 
              className="avatar-img"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className="avatar-fallback-container" style={{ display: avatarData ? 'none' : 'flex' }}>
            {getFallbackAvatar(userName || 'User')}
          </div>
        </div>
      </div>
      <p className="avatar-description">Your AI-generated learning companion!</p>
    </div>
  );
};

export default AvatarCreator;
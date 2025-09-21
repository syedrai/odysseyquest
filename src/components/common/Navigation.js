import React from 'react';
import '../../styles/Navigation.css';

const Navigation = ({ currentView, navigateTo }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'lessons', label: 'Lessons', icon: '📚' },
    { id: 'games', label: 'Games', icon: '🎮' },
    { id: 'ai-chat', label: 'AI Tutor', icon: '🤖' }
  ];

  return (
    <nav className="main-navigation">
      <div className="nav-container">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${currentView === item.id ? 'active' : ''}`}
            onClick={() => navigateTo(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
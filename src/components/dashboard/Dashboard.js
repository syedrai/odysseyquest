import React from 'react';

const Dashboard = ({ user, navigateTo }) => {
  const dashboardCards = [
    {
      id: 'lessons',
      title: 'AI-Powered Lessons',
      description: 'Personalized learning content based on your level',
      icon: '📚',
      color: '#4361ee'
    },
    {
      id: 'games',
      title: 'Learning Games',
      description: 'Fun games with adaptive difficulty',
      icon: '🎮',
      color: '#f72585'
    },
    {
      id: 'ai-chat',
      title: 'AI Homework Helper',
      description: 'Get explanations and step-by-step help',
      icon: '🤖',
      color: '#4cc9f0'
    },
    {
      id: 'progress',
      title: 'Progress Tracking',
      description: 'See your learning journey and achievements',
      icon: '📊',
      color: '#06d6a0'
    }
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user.name}! 👋</h1>
        <p>Ready to continue your learning adventure?</p>
      </div>
      
      <div className="dashboard-cards">
        {dashboardCards.map(card => (
          <div 
            key={card.id} 
            className="card"
            onClick={() => navigateTo(card.id)}
            style={{ cursor: 'pointer' }}
          >
            <div className="card-icon" style={{ color: card.color, fontSize: '2.5rem' }}>
              {card.icon}
            </div>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </div>
        ))}
      </div>
      
      <div className="recent-activity">
        <h2>Recent Activity</h2>
        <div className="activity-placeholder">
          <p>Your learning progress will appear here</p>
          <small>Complete lessons to see your achievements!</small>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
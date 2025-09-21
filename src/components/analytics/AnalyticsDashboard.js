import React, { useState, useEffect } from 'react';
import { analyzeLearningPatterns } from '../../services/ai/openAIService';
import '../../styles/Analytics.css';

const AnalyticsDashboard = ({ user, progress }) => {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('week');

  useEffect(() => {
    loadAnalytics();
  }, [progress, timeframe]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const analysis = await analyzeLearningPatterns(progress);
      setAnalytics(analysis);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSubjectPerformance = () => {
    const subjects = {};
    Object.entries(progress).forEach(([subject, data]) => {
      if (data.performance) {
        subjects[subject] = Math.round(data.performance * 100);
      }
    });
    return subjects;
  };

  const generateWeeklyReport = () => {
    return {
      timeStudied: '12 hours',
      lessonsCompleted: 8,
      gamesPlayed: 15,
      improvement: '+15% overall'
    };
  };

  if (isLoading) {
    return (
      <div className="analytics-dashboard">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>AI is analyzing your learning patterns...</p>
        </div>
      </div>
    );
  }

  const subjectPerformance = calculateSubjectPerformance();
  const weeklyReport = generateWeeklyReport();

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h2>Learning Analytics 📊</h2>
        <p>AI-powered insights into your learning journey</p>
        
        <div className="timeframe-selector">
          <button 
            className={timeframe === 'week' ? 'active' : ''}
            onClick={() => setTimeframe('week')}
          >
            This Week
          </button>
          <button 
            className={timeframe === 'month' ? 'active' : ''}
            onClick={() => setTimeframe('month')}
          >
            This Month
          </button>
          <button 
            className={timeframe === 'all' ? 'active' : ''}
            onClick={() => setTimeframe('all')}
          >
            All Time
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">⏰</div>
          <h3>{weeklyReport.timeStudied}</h3>
          <p>Time Studied</p>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <h3>{weeklyReport.lessonsCompleted}</h3>
          <p>Lessons Completed</p>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🎮</div>
          <h3>{weeklyReport.gamesPlayed}</h3>
          <p>Games Played</p>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <h3>{weeklyReport.improvement}</h3>
          <p>Performance Improvement</p>
        </div>
      </div>

      <div className="analytics-content">
        <div className="performance-section">
          <h3>Subject Performance</h3>
          <div className="subject-performance">
            {Object.entries(subjectPerformance).map(([subject, score]) => (
              <div key={subject} className="subject-item">
                <span className="subject-name">{subject.toUpperCase()}</span>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${score}%` }}
                  ></div>
                </div>
                <span className="subject-score">{score}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ai-insights">
          <h3>AI Learning Insights</h3>
          <div className="insights-grid">
            <div className="insight-card">
              <h4>🎯 Strengths</h4>
              <ul>
                {analytics.strengths.map((strength, index) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            </div>
            
            <div className="insight-card">
              <h4>📝 Areas for Improvement</h4>
              <ul>
                {analytics.weaknesses.map((weakness, index) => (
                  <li key={index}>{weakness}</li>
                ))}
              </ul>
            </div>
            
            <div className="insight-card">
              <h4>💡 Recommendations</h4>
              <ul>
                {analytics.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
            
            <div className="insight-card">
              <h4>📊 Learning Pace</h4>
              <p>Your current learning pace is: <strong>{analytics.learningPace}</strong></p>
              <p>This is perfect for your grade level!</p>
            </div>
          </div>
        </div>

        <div className="predictive-analytics">
          <h3>📈 Performance Predictions</h3>
          <div className="prediction-cards">
            <div className="prediction-card">
              <h4>Next Week Forecast</h4>
              <p>Expected improvement: <strong>+10-15%</strong></p>
              <p>Recommended focus: <strong>Math concepts</strong></p>
            </div>
            
            <div className="prediction-card">
              <h4>Monthly Outlook</h4>
              <p>Target achievement: <strong>85% proficiency</strong></p>
              <p>Key milestone: <strong>Advanced algebra</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
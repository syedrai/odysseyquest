import React, { useState, useEffect } from 'react';
import Onboarding from './components/onboarding/Onboarding';
import Dashboard from './components/dashboard/Dashboard';
import LessonLoader from './components/lessons/LessonLoader';
import GameEngine from './components/games/GameEngine';
import AIChatAssistant from './components/ai-chat/AIChatAssistant';
import AnalyticsDashboard from './components/analytics/AnalyticsDashboard';
import Header from './components/common/Header';
import Navigation from './components/common/Navigation';
import { getUserData, getProgress } from './services/storage/localDB';
import { initializeAI } from './services/ai/openAIService';
import './styles/Theme.css';
import './styles/App.css';

function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('onboarding');
  const [progress, setProgress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize AI services
      await initializeAI();
      
      // Check if user data exists
      const userData = getUserData();
      const userProgress = getProgress();
      
      if (userData) {
        setUser(userData);
        setProgress(userProgress || {});
        setCurrentView('dashboard');
      }
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardingComplete = (userData) => {
    setUser(userData);
    setProgress({});
    setCurrentView('dashboard');
  };

  const navigateTo = (view) => {
    setCurrentView(view);
  };

  const updateProgress = (newProgress) => {
    setProgress(prev => ({ ...prev, ...newProgress }));
  };

  const renderCurrentView = () => {
    if (isLoading) {
      return (
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Initializing AI Learning Platform...</p>
        </div>
      );
    }

    switch (currentView) {
      case 'onboarding':
        return <Onboarding onComplete={handleOnboardingComplete} />;
      case 'dashboard':
        return <Dashboard user={user} progress={progress} navigateTo={navigateTo} />;
      case 'lessons':
        return <LessonLoader user={user} progress={progress} updateProgress={updateProgress} />;
      case 'games':
        return <GameEngine user={user} progress={progress} updateProgress={updateProgress} />;
      case 'ai-chat':
        return <AIChatAssistant user={user} />;
      case 'analytics':
        return <AnalyticsDashboard user={user} progress={progress} />;
      default:
        return <Dashboard user={user} progress={progress} navigateTo={navigateTo} />;
    }
  };

  return (
    <div className="app">
      {currentView !== 'onboarding' && user && (
        <>
          <Header user={user} currentView={currentView} />
          <Navigation currentView={currentView} navigateTo={navigateTo} />
        </>
      )}
      
      <main className="main-content">
        {renderCurrentView()}
      </main>
    </div>
  );
}

export default App;
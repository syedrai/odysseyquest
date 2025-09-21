import React, { useState, useEffect } from 'react';
import { generateQuizQuestions } from '../../services/ai/openAIService';
import { speakText, recognizeSpeech } from '../../services/ai/speechService';
import { saveProgress, addCoins, unlockAchievement } from '../../services/storage/localDB';
import '../../styles/Games.css';

const GameEngine = ({ user, progress, updateProgress }) => {
  const [currentGame, setCurrentGame] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('idle'); // idle, loading, playing, finished
  const [userAnswer, setUserAnswer] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [streak, setStreak] = useState(0);
  const [error, setError] = useState(null);

  const games = [
    {
      id: 'math-quiz',
      title: 'Math Quiz Challenge 🧮',
      description: 'Test your math skills with adaptive questions',
      subject: 'math',
      icon: '🧮',
      difficulty: user?.grade ? Math.min(10, user.grade) : 5,
      timeLimit: 30
    },
    {
      id: 'science-trivia',
      title: 'Science Trivia 🔬',
      description: 'Explore scientific concepts through fun questions',
      subject: 'science',
      icon: '🔬',
      difficulty: user?.grade ? Math.min(10, user.grade) : 5,
      timeLimit: 25
    },
    {
      id: 'vocabulary-builder',
      title: 'Vocabulary Builder 📚',
      description: 'Expand your word knowledge with engaging challenges',
      subject: 'english',
      icon: '📚',
      difficulty: user?.grade ? Math.min(8, user.grade - 2) : 5,
      timeLimit: 35
    },
    {
      id: 'history-challenge',
      title: 'History Challenge 🏛️',
      description: 'Travel through time with historical questions',
      subject: 'history',
      icon: '🏛️',
      difficulty: user?.grade ? Math.min(9, user.grade - 1) : 5,
      timeLimit: 28
    },
    {
      id: 'history-rpg',
      title: 'History Time Travel RPG ⚔️',
      description: 'Experience history through interactive storytelling',
      subject: 'history',
      icon: '⚔️',
      difficulty: user?.grade ? Math.min(8, user.grade) : 5,
      timeLimit: 0,
      comingSoon: true
    }
  ];

  useEffect(() => {
    let timer;
    if (gameState === 'playing' && timeLeft > 0 && currentGame?.timeLimit > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (gameState === 'playing' && timeLeft === 0 && currentGame?.timeLimit > 0) {
      handleAnswer(-1); // Time's up
    }
    return () => clearTimeout(timer);
  }, [gameState, timeLeft, currentGame]);

  useEffect(() => {
    if (gameState === 'playing' && questions.length > 0 && currentQuestionIndex >= questions.length) {
      // If we've run out of questions, end the game
      endGame();
    }
  }, [currentQuestionIndex, questions.length, gameState]);

  const startGame = async (game) => {
    if (game.comingSoon) {
      speakText("This game is coming soon! Stay tuned for updates.");
      return;
    }

    setCurrentGame(game);
    setGameState('loading');
    setTimeLeft(game.timeLimit);
    setError(null);
    
    try {
      // Get previous performance for adaptive difficulty
      const previousPerformance = progress[game.subject]?.performance || 0.5;
      
      const generatedQuestions = await generateQuizQuestions(
        game.subject, 
        game.difficulty, 
        7, 
        previousPerformance
      );
      
      if (!generatedQuestions || generatedQuestions.length === 0) {
        throw new Error('Failed to generate questions');
      }
      
      setQuestions(generatedQuestions);
      setCurrentQuestionIndex(0);
      setScore(0);
      setStreak(0);
      setGameState('playing');
      
      speakText(`Starting ${game.title}. Get ready for your first question!`);
    } catch (error) {
      console.error('Error starting game:', error);
      setError('Failed to load game. Please try again.');
      setGameState('idle');
    }
  };

  const getCurrentQuestion = () => {
    if (questions.length === 0 || currentQuestionIndex >= questions.length) {
      return null;
    }
    return questions[currentQuestionIndex];
  };

  const handleAnswer = async (answerIndex) => {
    const currentQ = getCurrentQuestion();
    if (!currentQ) {
      endGame();
      return;
    }

    const isCorrect = currentQ.answer === answerIndex;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      setStreak(prev => prev + 1);
      speakText('Correct! Great job!');
      
      // Award bonus for streaks
      if (streak >= 3) {
        speakText(`Amazing! ${streak} in a row!`);
      }
    } else {
      setStreak(0);
      const correctAnswer = currentQ.options[currentQ.answer] || "the correct answer";
      speakText(`Sorry, the correct answer was: ${correctAnswer}`);
    }

    // Move to next question or end game
    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
        setUserAnswer('');
        setTimeLeft(currentGame.timeLimit);
      }, 2000);
    } else {
      setTimeout(endGame, 2000);
    }
  };

  const endGame = () => {
    setGameState('finished');
    if (questions.length === 0) return;
    
    const finalScore = score / questions.length;
    
    // Update progress
    const newProgress = {
      [currentGame.subject]: {
        performance: finalScore,
        lastPlayed: new Date().toISOString(),
        totalGames: (progress[currentGame.subject]?.totalGames || 0) + 1,
        bestScore: Math.max(finalScore, progress[currentGame.subject]?.bestScore || 0)
      }
    };
    
    updateProgress(newProgress);
    saveProgress(newProgress);
    
    // Award coins based on performance
    const coinsEarned = Math.floor(score * 10 * finalScore);
    if (coinsEarned > 0) {
      addCoins(coinsEarned);
    }
    
    // Check for achievements
    if (finalScore === 1) {
      unlockAchievement('perfect_score', {
        game: currentGame.id,
        coins: 50
      });
    }
    
    if (streak >= 5) {
      unlockAchievement('hot_streak', {
        streak: streak,
        coins: 25
      });
    }
    
    speakText(`Game over! Your score is ${score} out of ${questions.length}. ${finalScore > 0.7 ? 'Excellent work!' : 'Keep practicing!'}`);
  };

  const handleVoiceAnswer = async () => {
    setIsListening(true);
    try {
      const transcript = await recognizeSpeech();
      setUserAnswer(transcript);
      
      // Simple voice answer matching
      const currentQ = getCurrentQuestion();
      if (!currentQ) return;
      
      const optionMatch = currentQ.options.findIndex(opt => 
        transcript.toLowerCase().includes(opt.toLowerCase().substring(0, 10))
      );
      
      if (optionMatch !== -1) {
        handleAnswer(optionMatch);
      } else {
        speakText("I didn't understand that answer. Please try again or use the buttons.");
      }
    } catch (error) {
      console.error('Voice recognition error:', error);
      speakText("Voice input failed. Please use the buttons.");
    } finally {
      setIsListening(false);
    }
  };

  const getDifficultyStars = (difficulty) => {
    return '⭐'.repeat(Math.ceil(difficulty / 2));
  };

  if (gameState === 'idle') {
    return (
      <div className="game-engine">
        <div className="game-header">
          <h2>Learning Games 🎮</h2>
          <p>Choose a game to start playing and learning! Earn coins and achievements!</p>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        <div className="games-grid">
          {games.map(game => (
            <div 
              key={game.id} 
              className={`game-card ${game.comingSoon ? 'coming-soon' : ''}`}
              onClick={() => !game.comingSoon && startGame(game)}
            >
              <div className="game-icon">{game.icon}</div>
              <h3>{game.title}</h3>
              <p>{game.description}</p>
              <div className="game-meta">
                <span className="game-difficulty">
                  Difficulty: {getDifficultyStars(game.difficulty)}
                </span>
                {game.timeLimit > 0 && (
                  <span className="game-time">⏱️ {game.timeLimit}s per Q</span>
                )}
              </div>
              {progress[game.subject] && !game.comingSoon && (
                <div className="game-stats">
                  Best: {Math.round((progress[game.subject].bestScore || 0) * 100)}%
                </div>
              )}
              {game.comingSoon && (
                <div className="coming-soon-badge">Coming Soon</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (gameState === 'loading') {
    return (
      <div className="game-loading">
        <div className="spinner"></div>
        <p>AI is generating your personalized game...</p>
        <p className="loading-subtext">Creating questions at just the right difficulty for you!</p>
      </div>
    );
  }

  if (gameState === 'playing') {
    const question = getCurrentQuestion();
    
    if (!question) {
      return (
        <div className="game-error">
          <h3>Oops! Something went wrong</h3>
          <p>We couldn't load the questions properly.</p>
          <button className="btn btn-primary" onClick={() => setGameState('idle')}>
            Return to Games
          </button>
        </div>
      );
    }
    
    const questionText = question.question || "Question content not available";
    const questionType = question.type || "multiple-choice";
    const questionOptions = question.options || ["Option 1", "Option 2", "Option 3", "Option 4"];
    
    return (
      <div className="game-playing">
        <div className="game-header-bar">
          <div className="game-info">
            <h3>{currentGame.title}</h3>
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          </div>
          
          <div className="game-stats">
            <div className="score-display">Score: {score}</div>
            {currentGame.timeLimit > 0 && (
              <div className="time-display">⏱️ {timeLeft}s</div>
            )}
            {streak > 0 && <div className="streak-display">🔥 {streak}</div>}
          </div>
        </div>

        <div className="question-container">
          <div className="question-content">
            <h3>{questionText}</h3>
            <p className="question-type">{questionType.replace('-', ' ').toUpperCase()}</p>
            
            <div className="options-grid">
              {questionOptions.map((option, index) => (
                <button
                  key={index}
                  className="option-btn"
                  onClick={() => handleAnswer(index)}
                >
                  <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                  <span className="option-text">{option}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="voice-input-section">
            <button 
              className={`voice-btn ${isListening ? 'listening' : ''}`}
              onClick={handleVoiceAnswer}
              disabled={isListening}
            >
              🎤 {isListening ? 'Listening... Speak now!' : 'Answer with Voice'}
            </button>
            {userAnswer && (
              <div className="voice-feedback">
                <p>You said: "{userAnswer}"</p>
              </div>
            )}
          </div>
        </div>

        <div className="progress-section">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    if (questions.length === 0) {
      return (
        <div className="game-finished">
          <h2>Game Error 😕</h2>
          <p>There was a problem with the game questions.</p>
          <button className="btn btn-primary" onClick={() => setGameState('idle')}>
            Return to Games
          </button>
        </div>
      );
    }
    
    const finalScore = score / questions.length;
    const performanceRating = finalScore > 0.8 ? 'Excellent' : 
                            finalScore > 0.6 ? 'Good' : 
                            finalScore > 0.4 ? 'Fair' : 'Needs Practice';
    
    return (
      <div className="game-finished">
        <div className="result-header">
          <h2>Game Complete! 🎉</h2>
          <p className="performance-rating">{performanceRating} Performance</p>
        </div>
        
        <div className="score-result">
          <div className="score-circle" style={{ '--score': finalScore }}>
            <span className="score-value">{Math.round(finalScore * 100)}%</span>
            <span className="score-detail">{score}/{questions.length}</span>
          </div>
          
          <div className="score-details">
            <div className="detail-item">
              <span className="detail-label">Correct Answers</span>
              <span className="detail-value">{score}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Total Questions</span>
              <span className="detail-value">{questions.length}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Longest Streak</span>
              <span className="detail-value">{streak} 🔥</span>
            </div>
          </div>
        </div>

        <div className="game-actions">
          <button className="btn btn-primary" onClick={() => startGame(currentGame)}>
            Play Again 🔄
          </button>
          <button className="btn btn-outline" onClick={() => setGameState('idle')}>
            Choose Another Game 🎮
          </button>
        </div>

        <div className="performance-insights">
          <h4>📊 AI Learning Insights</h4>
          <div className="insights-grid">
            <div className="insight-item">
              <span className="insight-icon">🎯</span>
              <p>You excelled at: {currentGame.subject} fundamentals</p>
            </div>
            <div className="insight-item">
              <span className="insight-icon">📈</span>
              <p>Suggested focus: Practice more {currentGame.subject} problems</p>
            </div>
            <div className="insight-item">
              <span className="insight-icon">⏱️</span>
              <p>Time management: Good pacing on answers</p>
            </div>
          </div>
          
          <div className="improvement-tips">
            <h5>Tips for next time:</h5>
            <ul>
              <li>Review {currentGame.subject} concepts before playing</li>
              <li>Take your time reading each question carefully</li>
              <li>Use the voice feature for faster answers</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default GameEngine;
import React, { useState, useEffect } from 'react';
import { generateQuizQuestions } from '../../services/ai/openAIService';
import { speakText, recognizeSpeech } from '../../services/ai/speechService';
import { saveProgress } from '../../services/storage/localDB';
import '../../styles/Games.css';

const GameEngine = ({ user, progress, updateProgress }) => {
  const [currentGame, setCurrentGame] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('idle'); // idle, playing, finished
  const [userAnswer, setUserAnswer] = useState('');
  const [isListening, setIsListening] = useState(false);

  const games = [
    {
      id: 'math-quiz',
      title: 'Math Quiz Challenge',
      description: 'Test your math skills with adaptive questions',
      subject: 'math',
      icon: '🧮',
      difficulty: user?.grade ? Math.min(10, user.grade) : 5
    },
    {
      id: 'science-trivia',
      title: 'Science Trivia',
      description: 'Explore scientific concepts through fun questions',
      subject: 'science',
      icon: '🔬',
      difficulty: user?.grade ? Math.min(10, user.grade) : 5
    },
    {
      id: 'vocabulary-builder',
      title: 'Vocabulary Builder',
      description: 'Expand your word knowledge with engaging challenges',
      subject: 'english',
      icon: '📚',
      difficulty: user?.grade ? Math.min(8, user.grade - 2) : 5
    }
  ];

  const startGame = async (game) => {
    setCurrentGame(game);
    setGameState('loading');
    
    try {
      // Get previous performance for adaptive difficulty
      const previousPerformance = progress[game.subject]?.performance || 0.5;
      
      const generatedQuestions = await generateQuizQuestions(
        game.subject, 
        game.difficulty, 
        5, 
        previousPerformance
      );
      
      setQuestions(generatedQuestions);
      setCurrentQuestion(0);
      setScore(0);
      setGameState('playing');
      
      speakText(`Starting ${game.title}. Get ready for your first question!`);
    } catch (error) {
      console.error('Error starting game:', error);
      setGameState('idle');
    }
  };

  const handleAnswer = async (answer) => {
    const currentQ = questions[currentQuestion];
    const isCorrect = currentQ.answer === answer;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      speakText('Correct! Great job!');
    } else {
      speakText(`Sorry, the correct answer was: ${currentQ.options[currentQ.answer]}`);
    }

    // Move to next question or end game
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(prev => prev + 1);
        setUserAnswer('');
      }, 2000);
    } else {
      endGame();
    }
  };

  const endGame = () => {
    setGameState('finished');
    const finalScore = score / questions.length;
    
    // Update progress
    const newProgress = {
      [currentGame.subject]: {
        performance: finalScore,
        lastPlayed: new Date().toISOString(),
        totalGames: (progress[currentGame.subject]?.totalGames || 0) + 1
      }
    };
    
    updateProgress(newProgress);
    saveProgress(newProgress);
    
    speakText(`Game over! Your score is ${score} out of ${questions.length}. ${finalScore > 0.7 ? 'Excellent work!' : 'Keep practicing!'}`);
  };

  const handleVoiceAnswer = async () => {
    setIsListening(true);
    try {
      const transcript = await recognizeSpeech();
      setUserAnswer(transcript);
      
      // Simple voice answer matching (in real app, use NLP)
      const currentQ = questions[currentQuestion];
      const optionMatch = currentQ.options.findIndex(opt => 
        transcript.toLowerCase().includes(opt.toLowerCase())
      );
      
      if (optionMatch !== -1) {
        handleAnswer(optionMatch);
      }
    } catch (error) {
      console.error('Voice recognition error:', error);
    } finally {
      setIsListening(false);
    }
  };

  if (gameState === 'idle') {
    return (
      <div className="game-engine">
        <div className="game-header">
          <h2>Learning Games 🎮</h2>
          <p>Choose a game to start playing and learning!</p>
        </div>

        <div className="games-grid">
          {games.map(game => (
            <div key={game.id} className="game-card" onClick={() => startGame(game)}>
              <div className="game-icon">{game.icon}</div>
              <h3>{game.title}</h3>
              <p>{game.description}</p>
              <div className="game-difficulty">
                Difficulty: {'⭐'.repeat(game.difficulty / 2)}
              </div>
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
      </div>
    );
  }

  if (gameState === 'playing' && questions.length > 0) {
    const question = questions[currentQuestion];
    
    return (
      <div className="game-playing">
        <div className="game-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
          <span>Question {currentQuestion + 1} of {questions.length}</span>
        </div>

        <div className="question-container">
          <h3>{question.question}</h3>
          
          <div className="options-grid">
            {question.options.map((option, index) => (
              <button
                key={index}
                className="option-btn"
                onClick={() => handleAnswer(index)}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="voice-input-section">
            <button 
              className={`voice-btn ${isListening ? 'listening' : ''}`}
              onClick={handleVoiceAnswer}
              disabled={isListening}
            >
              🎤 {isListening ? 'Listening...' : 'Answer with Voice'}
            </button>
            {userAnswer && <p>You said: "{userAnswer}"</p>}
          </div>
        </div>

        <div className="score-display">
          Score: {score} / {questions.length}
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    return (
      <div className="game-finished">
        <h2>Game Complete! 🎉</h2>
        <div className="score-result">
          <div className="score-circle">
            <span>{score}/{questions.length}</span>
          </div>
          <p>{score === questions.length ? 'Perfect Score! 🏆' : 'Great Effort! 👏'}</p>
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
          <h4>AI Insights</h4>
          <p>Based on your performance, we recommend:</p>
          <ul>
            <li>📚 Review related lessons</li>
            <li>🎯 Practice similar questions</li>
            <li>⏱️ Work on timing</li>
          </ul>
        </div>
      </div>
    );
  }

  return null;
};

export default GameEngine;
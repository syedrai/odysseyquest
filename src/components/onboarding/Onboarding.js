import React, { useState } from 'react';
import AvatarCreator from './AvatarCreator';
import { generateAvatar } from '../../services/ai/avatarService';
import { saveUserData } from '../../services/storage/localDB';
import { speakText } from '../../services/ai/speechService';
import '../../styles/Onboarding.css';

const Onboarding = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState({
    name: '',
    grade: 6,
    language: 'English',
    avatar: null
  });
  const [isListening, setIsListening] = useState(false);

  const handleInputChange = (field, value) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  const handleNameInput = async () => {
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      setIsListening(true);
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.lang = 'en-US';
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleInputChange('name', transcript);
        setIsListening(false);
      };
      
      recognition.onerror = () => {
        setIsListening(false);
      };
      
      recognition.start();
    } else {
      alert("Speech recognition not supported in this browser");
    }
  };

  const generateUserAvatar = async () => {
    const avatar = await generateAvatar(userData.name, userData.grade);
    handleInputChange('avatar', avatar);
    setStep(3);
  };

  const completeOnboarding = () => {
    const finalUserData = {
      ...userData,
      id: Date.now(), // Simple ID generation
      aiPreferences: {
        learningStyle: 'adaptive',
        difficulty: 'auto',
        voiceEnabled: true
      },
      createdAt: new Date().toISOString()
    };
    
    saveUserData(finalUserData);
    speakText(`Welcome to OdysseyQuest, ${userData.name}!`);
    onComplete(finalUserData);
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-progress">
        <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1</div>
        <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2</div>
        <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>3</div>
      </div>

      {step === 1 && (
        <div className="onboarding-step">
          <h2>Welcome to OdysseyQuest! 🚀</h2>
          <p>Let's get to know you better</p>
          
          <div className="input-group">
            <label>What's your name?</label>
            <div className="input-with-button">
              <input
                type="text"
                value={userData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your name"
              />
              <button 
                className={`voice-btn ${isListening ? 'listening' : ''}`}
                onClick={handleNameInput}
                type="button"
              >
                🎤
              </button>
            </div>
          </div>

          <button 
            className="next-btn"
            onClick={() => setStep(2)}
            disabled={!userData.name}
          >
            Next
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="onboarding-step">
          <h2>Tell us about yourself</h2>
          
          <div className="input-group">
            <label>What grade are you in?</label>
            <select
              value={userData.grade}
              onChange={(e) => handleInputChange('grade', parseInt(e.target.value))}
            >
              {[6, 7, 8, 9, 10, 11, 12].map(grade => (
                <option key={grade} value={grade}>Grade {grade}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Preferred language</label>
            <select
              value={userData.language}
              onChange={(e) => handleInputChange('language', e.target.value)}
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
            </select>
          </div>

          <div className="button-group">
            <button className="back-btn" onClick={() => setStep(1)}>Back</button>
            <button className="next-btn" onClick={generateUserAvatar}>Create Avatar</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="onboarding-step">
          <h2>Your AI Avatar</h2>
          <AvatarCreator avatarData={userData.avatar} />
          
          <div className="button-group">
            <button className="back-btn" onClick={() => setStep(2)}>Back</button>
            <button className="next-btn" onClick={completeOnboarding}>Start Learning!</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
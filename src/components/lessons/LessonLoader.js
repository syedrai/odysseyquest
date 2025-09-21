import React, { useState, useEffect } from 'react';
import { generateLessonContent } from '../../services/ai/openAIService';
import { speakText } from '../../services/ai/speechService';
import { saveProgress, getCachedVideos, cacheVideo } from '../../services/storage/localDB';
import '../../styles/Lessons.css';

const LessonLoader = ({ user, progress, updateProgress }) => {
  const [currentLesson, setCurrentLesson] = useState(null);
  const [recommendedLessons, setRecommendedLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lesson');
  const [cachedVideos, setCachedVideos] = useState({});

  // YouTube video IDs for different subjects and topics
  const youtubeVideos = {
    math: {
      'Basic Arithmetic': 'Arith',
      'Algebra': 'LRNBxN6nLcI',
      'Geometry': 'k5etrWdIR5M',
      'Fractions': '5Ucho2h9nNI'
    },
    science: {
      'Biology': 'w3bA4-QUc4E',
      'Chemistry': 'FSyAehMdpyI',
      'Physics': 'imS8K1x9Lec',
      'Earth Science': 'kGXvhq6JZio'
    },
    english: {
      'Grammar': 'r3aQ4qLwK2E',
      'Writing': 't0bZgSY_3-o',
      'Vocabulary': 'EVLIo4n2Z-M'
    },
    history: {
      'Ancient Civilizations': 'sohXPx_XZ6Y',
      'World History': 'Yocja_N5s1I',
      'American History': 'ghgPq2wjQUQ'
    }
  };

  useEffect(() => {
    loadRecommendedLessons();
    // Load cached videos
    setCachedVideos(getCachedVideos());
  }, [user]);

  const getVideoId = (subject, topic) => {
    const subjectVideos = youtubeVideos[subject.toLowerCase()] || {};
    // Find the best matching topic
    for (const [key, value] of Object.entries(subjectVideos)) {
      if (topic.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }
    // Default video for the subject
    return Object.values(subjectVideos)[0] || 'dQw4w9WgXcQ'; // Fallback video
  };

  const loadRecommendedLessons = async () => {
    setIsLoading(true);
    try {
      const subjects = ['Math', 'Science', 'English', 'History'];
      const lessons = [];
      
      for (const subject of subjects) {
        const lesson = await generateLessonContent(subject, user.grade);
        const topic = lesson.topic || subject;
        const videoId = getVideoId(subject, topic);
        
        lessons.push({
          id: Date.now() + Math.random(),
          subject,
          title: `${topic} for Grade ${user.grade}`,
          description: lesson.content || `Learn about ${topic}`,
          difficulty: 'beginner',
          duration: '15 min',
          icon: subject === 'Math' ? '➗' : subject === 'Science' ? '🔬' : 
                 subject === 'English' ? '📚' : '🏛️',
          content: lesson.content,
          topic: topic,
          videoId: videoId,
          videoCached: cachedVideos[videoId] || false
        });

        // Pre-cache video information
        if (!cachedVideos[videoId]) {
          cacheVideo(videoId, {
            subject: subject,
            topic: topic,
            title: `${topic} Video Lesson`,
            lastAccessed: new Date().toISOString()
          });
        }
      }
      
      setRecommendedLessons(lessons);
      setCurrentLesson(lessons[0]);
    } catch (error) {
      console.error('Error loading lessons:', error);
      setRecommendedLessons(getFallbackLessons(user.grade));
      setCurrentLesson(getFallbackLessons(user.grade)[0]);
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackLessons = (grade) => {
    return [
      {
        id: 1,
        subject: 'Math',
        title: 'Math Basics',
        description: 'Learn fundamental math concepts including arithmetic, fractions, and basic algebra.',
        difficulty: 'beginner',
        duration: '15 min',
        icon: '➗',
        content: `# Math Basics for Grade ${grade}

## Introduction
Mathematics is the language of patterns and relationships. In this lesson, we'll explore fundamental concepts that form the foundation for all advanced math.

## Key Concepts
- **Arithmetic Operations**: Addition, subtraction, multiplication, and division
- **Fractions**: Understanding parts of a whole
- **Basic Algebra**: Working with variables and simple equations

## Examples
For example: 2x + 5 = 15 → x = 5

## Practice Exercise
Solve: 3y - 7 = 14. What is the value of y?

## Summary
Math helps develop logical thinking and problem-solving skills that are useful in everyday life.`,
        videoId: 'Arith',
        videoCached: true
      },
      {
        id: 2,
        subject: 'Science',
        title: 'Science Fundamentals',
        description: 'Explore basic scientific concepts and the scientific method.',
        difficulty: 'beginner',
        duration: '20 min',
        icon: '🔬',
        content: `# Science Fundamentals for Grade ${grade}

## Introduction
Science helps us understand the natural world through observation and experimentation.

## Key Concepts
- **Scientific Method**: The process of scientific inquiry
- **Basic Biology**: Living organisms and their functions
- **Simple Physics**: Forces and motion

## Examples
Plants use photosynthesis to convert sunlight into energy.

## Practice Exercise
Design a simple experiment to test how plants respond to light.

## Summary
Science teaches us to ask questions and seek evidence-based answers.`,
        videoId: 'w3bA4-QUc4E',
        videoCached: true
      }
    ];
  };

  const startLesson = (lesson) => {
    setCurrentLesson(lesson);
    setActiveTab('lesson');
    speakText(`Starting ${lesson.subject} lesson. Get ready to learn!`);
  };

  const completeLesson = () => {
    if (currentLesson) {
      saveProgress({
        lessonId: currentLesson.id,
        subject: currentLesson.subject,
        score: 100,
        timestamp: new Date().toISOString()
      });
      
      speakText(`Great job completing the ${currentLesson.subject} lesson!`);
      alert(`🎉 Lesson completed! You earned 10 coins!`);
    }
  };

  const getLessonParagraphs = () => {
    if (!currentLesson) return [];
    
    const content = currentLesson.content || currentLesson.description || '';
    
    if (typeof content === 'string') {
      return content.split('\n').filter(paragraph => paragraph.trim().length > 0);
    }
    
    return [];
  };

  const renderVideoSection = () => {
    if (!currentLesson || !currentLesson.videoId) return null;

    return (
      <div className="video-section">
        <h4>📺 Video Lesson</h4>
        <div className="video-container">
          <iframe
            width="100%"
            height="315"
            src={`https://www.youtube.com/embed/${currentLesson.videoId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
        <div className="video-actions">
          <span className={`cache-status ${currentLesson.videoCached ? 'cached' : 'not-cached'}`}>
            {currentLesson.videoCached ? '✅ Available offline' : '🌐 Online only'}
          </span>
          <button className="btn btn-sm btn-outline">
            {currentLesson.videoCached ? 'Remove from device' : 'Download for offline'}
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="lesson-loader">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>AI is preparing your personalized lessons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lesson-loader">
      <div className="lesson-header">
        <h2>Your Learning Journey 🚀</h2>
        <p>AI-powered lessons tailored for Grade {user.grade}</p>
        <div className="offline-status">
          <span className="status-indicator"></span>
          {navigator.onLine ? 'Online' : 'Offline Mode'}
        </div>
      </div>

      <div className="lesson-container">
        <div className="lesson-sidebar">
          <h3>Recommended Lessons</h3>
          <div className="offline-filter">
            <label>
              <input type="checkbox" /> Show only offline available
            </label>
          </div>
          <div className="lesson-list">
            {recommendedLessons.map(lesson => (
              <div 
                key={lesson.id} 
                className={`lesson-item ${currentLesson?.id === lesson.id ? 'active' : ''}`}
                onClick={() => startLesson(lesson)}
              >
                <div className="lesson-icon">{lesson.icon}</div>
                <div className="lesson-info">
                  <h4>{lesson.title}</h4>
                  <p>{lesson.subject} • {lesson.duration}</p>
                  {lesson.videoCached && <span className="offline-badge">📥 Offline</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lesson-content">
          {currentLesson ? (
            <>
              <div className="lesson-tabs">
                <button 
                  className={activeTab === 'lesson' ? 'active' : ''}
                  onClick={() => setActiveTab('lesson')}
                >
                  📖 Lesson
                </button>
                <button 
                  className={activeTab === 'video' ? 'active' : ''}
                  onClick={() => setActiveTab('video')}
                >
                  📺 Video
                </button>
                <button 
                  className={activeTab === 'quiz' ? 'active' : ''}
                  onClick={() => setActiveTab('quiz')}
                >
                  ❓ Quiz
                </button>
                <button 
                  className={activeTab === 'practice' ? 'active' : ''}
                  onClick={() => setActiveTab('practice')}
                >
                  ✍️ Practice
                </button>
              </div>

              <div className="tab-content">
                {activeTab === 'lesson' && (
                  <div className="lesson-material">
                    <h3>{currentLesson.title}</h3>
                    {renderVideoSection()}
                    <div className="lesson-text">
                      {getLessonParagraphs().map((paragraph, i) => {
                        if (paragraph.startsWith('# ')) {
                          return <h1 key={i}>{paragraph.substring(2)}</h1>;
                        } else if (paragraph.startsWith('## ')) {
                          return <h2 key={i}>{paragraph.substring(3)}</h2>;
                        } else if (paragraph.startsWith('### ')) {
                          return <h3 key={i}>{paragraph.substring(4)}</h3>;
                        } else if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                          return <strong key={i}>{paragraph.substring(2, paragraph.length - 2)}</strong>;
                        } else {
                          return <p key={i}>{paragraph}</p>;
                        }
                      })}
                    </div>
                    <button className="btn btn-primary" onClick={completeLesson}>
                      Mark as Complete ✅
                    </button>
                  </div>
                )}

                {activeTab === 'video' && (
                  <div className="video-tab">
                    <h3>Video Lesson: {currentLesson.topic}</h3>
                    {renderVideoSection()}
                    <div className="video-transcript">
                      <h4>Transcript</h4>
                      <p>This video helps explain the concept of {currentLesson.topic}. 
                         {currentLesson.videoCached ? ' You can watch it offline.' : ' Connect to the internet to watch.'}</p>
                    </div>
                  </div>
                )}

                {activeTab === 'quiz' && (
                  <div className="lesson-quiz">
                    <h3>Test Your Knowledge</h3>
                    <p>AI-generated questions based on what you've learned</p>
                    <div className="quiz-placeholder">
                      <div className="quiz-icon">🤖</div>
                      <p>AI quiz coming soon!</p>
                      <small>This will include adaptive questions based on your learning level</small>
                    </div>
                  </div>
                )}

                {activeTab === 'practice' && (
                  <div className="lesson-practice">
                    <h3>Practice Exercises</h3>
                    <p>Reinforce your learning with AI-generated exercises</p>
                    <div className="practice-placeholder">
                      <div className="practice-icon">🎯</div>
                      <p>AI practice exercises coming soon!</p>
                      <small>These will adapt to your specific needs and learning pace</small>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="no-lesson">
              <h3>Select a lesson to begin</h3>
              <p>Choose from your AI-recommended lessons on the left</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonLoader;
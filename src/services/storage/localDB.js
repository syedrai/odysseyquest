const USER_KEY = 'odysseyquest_user';
const PROGRESS_KEY = 'odysseyquest_progress';
const ACHIEVEMENTS_KEY = 'odysseyquest_achievements';
// Add these functions to your existing localDB.js

const VIDEO_CACHE_KEY = 'odysseyquest_cached_videos';
const OFFLINE_CONTENT_KEY = 'odysseyquest_offline_content';


// Video caching functions
export const cacheVideo = (videoId, videoData) => {
  const cachedVideos = getCachedVideos();
  cachedVideos[videoId] = {
    ...videoData,
    cachedAt: new Date().toISOString()
  };
  localStorage.setItem(VIDEO_CACHE_KEY, JSON.stringify(cachedVideos));
  return cachedVideos;
};

export const getCachedVideos = () => {
  const data = localStorage.getItem(VIDEO_CACHE_KEY);
  return data ? JSON.parse(data) : {};
};

export const removeCachedVideo = (videoId) => {
  const cachedVideos = getCachedVideos();
  delete cachedVideos[videoId];
  localStorage.setItem(VIDEO_CACHE_KEY, JSON.stringify(cachedVideos));
  return cachedVideos;
};

// Offline content management
export const saveForOffline = (contentId, contentData) => {
  const offlineContent = getOfflineContent();
  offlineContent[contentId] = {
    ...contentData,
    savedAt: new Date().toISOString()
  };
  localStorage.setItem(OFFLINE_CONTENT_KEY, JSON.stringify(offlineContent));
  return offlineContent;
};

export const getOfflineContent = () => {
  const data = localStorage.getItem(OFFLINE_CONTENT_KEY);
  return data ? JSON.parse(data) : {};
};

export const removeOfflineContent = (contentId) => {
  const offlineContent = getOfflineContent();
  delete offlineContent[contentId];
  localStorage.setItem(OFFLINE_CONTENT_KEY, JSON.stringify(offlineContent));
  return offlineContent;
};

// Check storage usage
export const getStorageUsage = () => {
  let total = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length * 2; // Approximate bytes
    }
  }
  return {
    bytes: total,
    megabytes: (total / (1024 * 1024)).toFixed(2)
  };
};

// Clear expired content (older than 30 days)
export const clearExpiredContent = () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const cachedVideos = getCachedVideos();
  const offlineContent = getOfflineContent();
  
  let clearedCount = 0;
  
  // Clear old videos
  for (const [id, video] of Object.entries(cachedVideos)) {
    if (new Date(video.cachedAt) < thirtyDaysAgo) {
      delete cachedVideos[id];
      clearedCount++;
    }
  }
  
  // Clear old content
  for (const [id, content] of Object.entries(offlineContent)) {
    if (new Date(content.savedAt) < thirtyDaysAgo) {
      delete offlineContent[id];
      clearedCount++;
    }
  }
  
  localStorage.setItem(VIDEO_CACHE_KEY, JSON.stringify(cachedVideos));
  localStorage.setItem(OFFLINE_CONTENT_KEY, JSON.stringify(offlineContent));
  
  return clearedCount;
};


// User management
export const saveUserData = (userData) => {
  const userWithTimestamp = {
    ...userData,
    lastLogin: new Date().toISOString(),
    totalLogins: (getUserData()?.totalLogins || 0) + 1
  };
  localStorage.setItem(USER_KEY, JSON.stringify(userWithTimestamp));
  return userWithTimestamp;
};

export const getUserData = () => {
  const data = localStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
};

export const updateUserPreferences = (preferences) => {
  const userData = getUserData();
  if (userData) {
    const updatedUser = {
      ...userData,
      preferences: { ...userData.preferences, ...preferences }
    };
    saveUserData(updatedUser);
    return updatedUser;
  }
  return null;
};

// Progress tracking
export const saveProgress = (progressData) => {
  const existingProgress = getProgress() || {};
  const newProgress = { ...existingProgress, ...progressData };
  
  // Calculate overall performance
  const subjects = Object.values(newProgress);
  if (subjects.length > 0) {
    const totalPerformance = subjects.reduce((sum, subject) => sum + (subject.performance || 0), 0);
    newProgress.overall = {
      performance: totalPerformance / subjects.length,
      lastUpdated: new Date().toISOString()
    };
  }
  
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(newProgress));
  return newProgress;
};

export const getProgress = () => {
  const data = localStorage.getItem(PROGRESS_KEY);
  return data ? JSON.parse(data) : null;
};

export const getSubjectProgress = (subject) => {
  const progress = getProgress();
  return progress ? progress[subject] : null;
};

// Achievements system
export const unlockAchievement = (achievementId, data = {}) => {
  const achievements = getAchievements();
  const newAchievement = {
    id: achievementId,
    unlockedAt: new Date().toISOString(),
    ...data
  };
  
  const updatedAchievements = { ...achievements, [achievementId]: newAchievement };
  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(updatedAchievements));
  
  return newAchievement;
};

export const getAchievements = () => {
  const data = localStorage.getItem(ACHIEVEMENTS_KEY);
  return data ? JSON.parse(data) : {};
};

export const getCompletedAchievements = () => {
  return Object.values(getAchievements());
};

// Gamification
export const addCoins = (amount) => {
  const userData = getUserData();
  if (userData) {
    const updatedUser = {
      ...userData,
      coins: (userData.coins || 0) + amount
    };
    saveUserData(updatedUser);
    return updatedUser.coins;
  }
  return 0;
};

export const getCoins = () => {
  return getUserData()?.coins || 0;
};

// Learning statistics
export const recordStudySession = (subject, duration, score) => {
  const session = {
    subject,
    duration,
    score,
    timestamp: new Date().toISOString()
  };
  
  const progress = getProgress() || {};
  const subjectData = progress[subject] || { sessions: [] };
  
  subjectData.sessions = [...(subjectData.sessions || []), session];
  subjectData.totalTime = (subjectData.totalTime || 0) + duration;
  subjectData.averageScore = subjectData.sessions.reduce((sum, s) => sum + s.score, 0) / subjectData.sessions.length;
  
  return saveProgress({ [subject]: subjectData });
};

// Utility functions
export const clearData = () => {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(PROGRESS_KEY);
  localStorage.removeItem(ACHIEVEMENTS_KEY);
};

export const exportData = () => {
  return {
    user: getUserData(),
    progress: getProgress(),
    achievements: getAchievements()
  };
};

export const importData = (data) => {
  if (data.user) localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  if (data.progress) localStorage.setItem(PROGRESS_KEY, JSON.stringify(data.progress));
  if (data.achievements) localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(data.achievements));
  return true;
};
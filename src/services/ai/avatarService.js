// Simulated avatar generation service
export const generateAvatar = async (name, grade) => {
  // In a real implementation, this would call an AI service
  // For this demo, we'll generate a simple SVG avatar
  
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F9A826', '#6C5CE7'];
  const color = colors[name.length % colors.length];
  
  const avatarSvg = `
    <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="100" fill="${color}"/>
      <circle cx="100" cy="80" r="40" fill="#FFFFFF"/>
      <circle cx="80" cy="70" r="8" fill="#333333"/>
      <circle cx="120" cy="70" r="8" fill="#333333"/>
      <path d="M70 110 Q100 130 130 110" stroke="#333333" stroke-width="4" fill="none"/>
      <text x="100" y="180" text-anchor="middle" fill="#FFFFFF" font-size="16">${name}</text>
    </svg>
  `;
  
  // Simulate API delay
  return new Promise(resolve => {
    setTimeout(() => resolve(avatarSvg), 1500);
  });
};
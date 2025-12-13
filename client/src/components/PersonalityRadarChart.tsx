import React from 'react';

// SVG Radar Chart component for personality visualization
const PersonalityRadarChart = () => {
  return (
    <svg width="100%" height="100%" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="600" fill="white"/>
      <circle cx="400" cy="300" r="240" fill="#F3F9FF" stroke="#E5E7EB" strokeWidth="2"/>
      <circle cx="400" cy="300" r="180" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="2"/>
      <circle cx="400" cy="300" r="120" fill="white" stroke="#E5E7EB" strokeWidth="2"/>
      <circle cx="400" cy="300" r="60" fill="#4F46E5" opacity="0.1"/>
      <path d="M400 300L400 60" stroke="#E5E7EB" strokeWidth="2"/>
      <path d="M400 300L635 300" stroke="#E5E7EB" strokeWidth="2"/>
      <path d="M400 300L517.5 517.5" stroke="#E5E7EB" strokeWidth="2"/>
      <path d="M400 300L282.5 517.5" stroke="#E5E7EB" strokeWidth="2"/>
      <path d="M400 300L165 300" stroke="#E5E7EB" strokeWidth="2"/>
      
      {/* Introversion - Extraversion */}
      <circle cx="400" cy="120" r="8" fill="#4F46E5"/>
      <path d="M400 300L400 120" stroke="#4F46E5" strokeWidth="3"/>
      <text x="420" y="110" fontFamily="Arial" fontSize="14" fill="#111827" fontWeight="bold">Extraversion</text>
      
      {/* Intuition - Sensing */}
      <circle cx="540" cy="300" r="8" fill="#FB7185"/>
      <path d="M400 300L540 300" stroke="#FB7185" strokeWidth="3"/>
      <text x="550" y="300" fontFamily="Arial" fontSize="14" fill="#111827" fontWeight="bold">Intuition</text>
      
      {/* Thinking - Feeling */}
      <circle cx="470" cy="430" r="8" fill="#4ADE80"/>
      <path d="M400 300L470 430" stroke="#4ADE80" strokeWidth="3"/>
      <text x="480" y="440" fontFamily="Arial" fontSize="14" fill="#111827" fontWeight="bold">Thinking</text>
      
      {/* Judging - Perceiving */}
      <circle cx="330" cy="430" r="8" fill="#F59E0B"/>
      <path d="M400 300L330 430" stroke="#F59E0B" strokeWidth="3"/>
      <text x="290" y="450" fontFamily="Arial" fontSize="14" fill="#111827" fontWeight="bold">Judging</text>
      
      {/* Openness */}
      <circle cx="260" cy="300" r="8" fill="#8B5CF6"/>
      <path d="M400 300L260 300" stroke="#8B5CF6" strokeWidth="3"/>
      <text x="200" y="300" fontFamily="Arial" fontSize="14" fill="#111827" fontWeight="bold">Openness</text>
      
      <text x="390" y="280" fontFamily="Arial" fontSize="18" fill="#111827" fontWeight="bold" textAnchor="middle">ENTJ</text>
      <text x="390" y="310" fontFamily="Arial" fontSize="12" fill="#4B5563" textAnchor="middle">The Commander</text>
    </svg>
  );
};

export default PersonalityRadarChart;
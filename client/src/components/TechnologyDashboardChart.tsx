import React from 'react';

// Componente per il grafico dashboard nella sezione "Our AI-Driven Approach"
const TechnologyDashboardChart = () => {
  return (
    <svg width="100%" height="100%" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="100" y="100" width="600" height="400" rx="12" fill="white" stroke="#E5E7EB" strokeWidth="2"/>
      <rect x="100" y="100" width="600" height="60" rx="12" fill="#F9FAFB"/>
      <rect x="128" y="129" width="120" height="20" rx="4" fill="#4F46E5"/>
      <rect x="270" y="129" width="100" height="20" rx="4" fill="#E5E7EB"/>
      <rect x="390" y="129" width="100" height="20" rx="4" fill="#E5E7EB"/>
      <rect x="510" y="129" width="100" height="20" rx="4" fill="#E5E7EB"/>
      <rect x="630" y="129" width="40" height="20" rx="4" fill="#E5E7EB"/>
      <rect x="128" y="180" width="280" height="140" rx="8" fill="#F9FAFB"/>
      <rect x="148" y="200" width="120" height="16" rx="3" fill="#111827"/>
      <rect x="148" y="230" width="240" height="70" rx="4" fill="white"/>
      <rect x="160" y="250" width="30" height="40" rx="2" fill="#4F46E5"/>
      <rect x="200" y="260" width="30" height="30" rx="2" fill="#4F46E5"/>
      <rect x="240" y="240" width="30" height="50" rx="2" fill="#4F46E5"/>
      <rect x="280" y="230" width="30" height="60" rx="2" fill="#4F46E5"/>
      <rect x="320" y="220" width="30" height="70" rx="2" fill="#4F46E5"/>
      <rect x="148" y="310" width="70" height="10" rx="2" fill="#E5E7EB"/>
      <rect x="430" y="180" width="240" height="140" rx="8" fill="#F9FAFB"/>
      <rect x="450" y="200" width="140" height="16" rx="3" fill="#111827"/>
      <circle cx="525" cy="260" r="50" fill="white"/>
      <path d="M525 260L525 210" stroke="#4F46E5" strokeWidth="16" strokeLinecap="round"/>
      <path d="M525 260L565 285" stroke="#FB7185" strokeWidth="16" strokeLinecap="round"/>
      <path d="M525 260L490 290" stroke="#4ADE80" strokeWidth="16" strokeLinecap="round"/>
      
      {/* Seconda riga di grafici */}
      <rect x="128" y="340" width="280" height="140" rx="8" fill="#F9FAFB"/>
      <rect x="148" y="360" width="150" height="16" rx="3" fill="#111827"/>
      <rect x="148" y="390" width="240" height="70" rx="4" fill="white"/>
      
      {/* Grafico a linee */}
      <path d="M160 440L190 420L220 430L250 410L280 415L310 400L340 420L370 410" 
        stroke="#EC4899" 
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="160" cy="440" r="3" fill="#EC4899" />
      <circle cx="190" cy="420" r="3" fill="#EC4899" />
      <circle cx="220" cy="430" r="3" fill="#EC4899" />
      <circle cx="250" cy="410" r="3" fill="#EC4899" />
      <circle cx="280" cy="415" r="3" fill="#EC4899" />
      <circle cx="310" cy="400" r="3" fill="#EC4899" />
      <circle cx="340" cy="420" r="3" fill="#EC4899" />
      <circle cx="370" cy="410" r="3" fill="#EC4899" />
      <rect x="148" y="470" width="70" height="10" rx="2" fill="#E5E7EB"/>
      
      {/* Grafico a torta */}
      <rect x="430" y="340" width="240" height="140" rx="8" fill="#F9FAFB"/>
      <rect x="450" y="360" width="140" height="16" rx="3" fill="#111827"/>
      <circle cx="525" cy="425" r="50" fill="white"/>
      <path d="M525 425L525 375A50 50 0 0 1 569 448L525 425Z" fill="#4F46E5" />
      <path d="M525 425L569 448A50 50 0 0 1 485 460L525 425Z" fill="#FB7185" />
      <path d="M525 425L485 460A50 50 0 0 1 525 375L525 425Z" fill="#4ADE80" />
    </svg>
  );
};

export default TechnologyDashboardChart;
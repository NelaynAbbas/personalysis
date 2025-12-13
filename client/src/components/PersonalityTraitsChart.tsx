import React from 'react';

// Componente per visualizzare il grafico dei tratti della personalità
const PersonalityTraitsChart = () => {
  return (
    <div className="relative z-10 rounded-xl overflow-hidden shadow-2xl transform transition-transform duration-500 hover:scale-105 bg-white">
      <svg 
        viewBox="0 0 600 400" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
      >
        {/* Sfondo */}
        <rect width="600" height="400" fill="#FFFFFF" />
        
        {/* Titolo del grafico */}
        <text x="300" y="40" fontFamily="Arial" fontSize="20" fill="#333" textAnchor="middle" fontWeight="bold">
          Personality Trait Analysis
        </text>
        
        {/* Grafico radar pentagonale */}
        <g transform="translate(300, 220)">
          {/* Linee di base del radar */}
          <path d="M0,-140 L133,-43 L82,112 L-82,112 L-133,-43 Z" fill="none" stroke="#ddd" strokeWidth="1" />
          <path d="M0,-105 L100,-32 L62,84 L-62,84 L-100,-32 Z" fill="none" stroke="#ddd" strokeWidth="1" />
          <path d="M0,-70 L66,-21 L41,56 L-41,56 L-66,-21 Z" fill="none" stroke="#ddd" strokeWidth="1" />
          <path d="M0,-35 L33,-11 L20,28 L-20,28 L-33,-11 Z" fill="none" stroke="#ddd" strokeWidth="1" />
          
          {/* Assi dei tratti */}
          <line x1="0" y1="0" x2="0" y2="-140" stroke="#aaa" strokeWidth="1" />
          <line x1="0" y1="0" x2="133" y2="-43" stroke="#aaa" strokeWidth="1" />
          <line x1="0" y1="0" x2="82" y2="112" stroke="#aaa" strokeWidth="1" />
          <line x1="0" y1="0" x2="-82" y2="112" stroke="#aaa" strokeWidth="1" />
          <line x1="0" y1="0" x2="-133" y2="-43" stroke="#aaa" strokeWidth="1" />
          
          {/* Etichette dei tratti */}
          <text x="0" y="-155" fontFamily="Arial" fontSize="14" fill="#333" textAnchor="middle">Openness</text>
          <text x="145" y="-43" fontFamily="Arial" fontSize="14" fill="#333" textAnchor="start">Conscientiousness</text>
          <text x="90" y="130" fontFamily="Arial" fontSize="14" fill="#333" textAnchor="middle">Extraversion</text>
          <text x="-90" y="130" fontFamily="Arial" fontSize="14" fill="#333" textAnchor="middle">Agreeableness</text>
          <text x="-155" y="-43" fontFamily="Arial" fontSize="14" fill="#333" textAnchor="end">Neuroticism</text>
          
          {/* Area del profilo */}
          <path 
            d="M0,-120 L100,-32 L60,82 L-70,96 L-110,-36 Z" 
            fill="rgba(79, 70, 229, 0.2)" 
            stroke="rgba(79, 70, 229, 0.8)" 
            strokeWidth="2" 
          />
          
          {/* Punti dei dati */}
          <circle cx="0" cy="-120" r="5" fill="rgba(79, 70, 229, 1)" />
          <circle cx="100" cy="-32" r="5" fill="rgba(79, 70, 229, 1)" />
          <circle cx="60" cy="82" r="5" fill="rgba(79, 70, 229, 1)" />
          <circle cx="-70" cy="96" r="5" fill="rgba(79, 70, 229, 1)" />
          <circle cx="-110" cy="-36" r="5" fill="rgba(79, 70, 229, 1)" />
        </g>
        
        {/* Legenda */}
        <rect x="390" y="70" width="170" height="140" rx="5" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1" />
        <text x="400" y="95" fontFamily="Arial" fontSize="14" fill="#333" fontWeight="bold">Trait Scores</text>
        
        <rect x="400" y="115" width="10" height="10" fill="rgba(79, 70, 229, 1)" />
        <text x="420" y="124" fontFamily="Arial" fontSize="12" fill="#333">Openness: 85%</text>
        
        <rect x="400" y="135" width="10" height="10" fill="rgba(79, 70, 229, 1)" />
        <text x="420" y="144" fontFamily="Arial" fontSize="12" fill="#333">Conscientiousness: 75%</text>
        
        <rect x="400" y="155" width="10" height="10" fill="rgba(79, 70, 229, 1)" />
        <text x="420" y="164" fontFamily="Arial" fontSize="12" fill="#333">Extraversion: 65%</text>
        
        <rect x="400" y="175" width="10" height="10" fill="rgba(79, 70, 229, 1)" />
        <text x="420" y="184" fontFamily="Arial" fontSize="12" fill="#333">Agreeableness: 70%</text>
        
        <rect x="400" y="195" width="10" height="10" fill="rgba(79, 70, 229, 1)" />
        <text x="420" y="204" fontFamily="Arial" fontSize="12" fill="#333">Neuroticism: 55%</text>
        
        {/* Grafico a barre in basso */}
        <g transform="translate(90, 290)">
          <text x="0" y="-10" fontFamily="Arial" fontSize="14" fill="#333" fontWeight="bold"></text>
        </g>
      </svg>
    </div>
  );
};

export default PersonalityTraitsChart;
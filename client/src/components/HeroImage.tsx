import React from 'react';

// Un grafico dashboard minimalista come immagine Hero
const HeroImage = () => {
  return (
    <div className="relative">
      <div className="relative z-10 transform transition-all duration-500 hover:scale-105 bg-transparent rounded-xl shadow-lg overflow-hidden">
        <div className="w-full flex items-center justify-center p-4">
          <svg 
            width="500" 
            height="380" 
            viewBox="0 0 500 380" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto max-w-lg"
          >
            {/* Linee della griglia */}
            <line x1="50" y1="50" x2="50" y2="300" stroke="#E5E7EB" strokeWidth="1" />
            <line x1="125" y1="50" x2="125" y2="300" stroke="#E5E7EB" strokeWidth="1" />
            <line x1="200" y1="50" x2="200" y2="300" stroke="#E5E7EB" strokeWidth="1" />
            <line x1="275" y1="50" x2="275" y2="300" stroke="#E5E7EB" strokeWidth="1" />
            <line x1="350" y1="50" x2="350" y2="300" stroke="#E5E7EB" strokeWidth="1" />
            <line x1="425" y1="50" x2="425" y2="300" stroke="#E5E7EB" strokeWidth="1" />
            
            <line x1="50" y1="50" x2="425" y2="50" stroke="#E5E7EB" strokeWidth="1" />
            <line x1="50" y1="100" x2="425" y2="100" stroke="#E5E7EB" strokeWidth="1" />
            <line x1="50" y1="150" x2="425" y2="150" stroke="#E5E7EB" strokeWidth="1" />
            <line x1="50" y1="200" x2="425" y2="200" stroke="#E5E7EB" strokeWidth="1" />
            <line x1="50" y1="250" x2="425" y2="250" stroke="#E5E7EB" strokeWidth="1" />
            <line x1="50" y1="300" x2="425" y2="300" stroke="#E5E7EB" strokeWidth="1" />
            
            {/* Etichette asse X e Y */}
            <text x="65" y="320" fontFamily="Arial" fontSize="12" fill="#6B7280">Jan</text>
            <text x="140" y="320" fontFamily="Arial" fontSize="12" fill="#6B7280">Feb</text>
            <text x="215" y="320" fontFamily="Arial" fontSize="12" fill="#6B7280">Mar</text>
            <text x="290" y="320" fontFamily="Arial" fontSize="12" fill="#6B7280">Apr</text>
            <text x="365" y="320" fontFamily="Arial" fontSize="12" fill="#6B7280">May</text>
          
            
            <text x="35" y="300" fontFamily="Arial" fontSize="12" fill="#6B7280">0</text>
            <text x="35" y="250" fontFamily="Arial" fontSize="12" fill="#6B7280">20</text>
            <text x="35" y="200" fontFamily="Arial" fontSize="12" fill="#6B7280">40</text>
            <text x="35" y="150" fontFamily="Arial" fontSize="12" fill="#6B7280">60</text>
            <text x="35" y="100" fontFamily="Arial" fontSize="12" fill="#6B7280">80</text>
            <text x="30" y="50" fontFamily="Arial" fontSize="12" fill="#6B7280">100</text>
            
            {/* Grafico a barre - Dati 1 */}
            <rect x="60" y="200" width="30" height="100" rx="2" fill="#4F46E5" fillOpacity="0.8" />
            <rect x="135" y="150" width="30" height="150" rx="2" fill="#4F46E5" fillOpacity="0.8" />
            <rect x="210" y="100" width="30" height="200" rx="2" fill="#4F46E5" fillOpacity="0.8" />
            <rect x="285" y="120" width="30" height="180" rx="2" fill="#4F46E5" fillOpacity="0.8" />
            <rect x="360" y="80" width="30" height="220" rx="2" fill="#4F46E5" fillOpacity="0.8" />
            
            {/* Grafico a linee - Dati 2 */}
            <path 
              d="M75,180 L150,130 L225,90 L300,110 L375,70" 
              stroke="#EC4899" 
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            
            {/* Punti dati - Linea */}
            <circle cx="75" cy="180" r="5" fill="#EC4899" />
            <circle cx="150" cy="130" r="5" fill="#EC4899" />
            <circle cx="225" cy="90" r="5" fill="#EC4899" />
            <circle cx="300" cy="110" r="5" fill="#EC4899" />
            <circle cx="375" cy="70" r="5" fill="#EC4899" />
            
            {/* Area sotto il grafico a linee */}
            <path 
              d="M75,180 L150,130 L225,90 L300,110 L375,70 L375,300 L75,300 Z" 
              fill="url(#gradient1)" 
              fillOpacity="0.2"
            />
            
            {/* Gradiente per l'area */}
            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#EC4899" />
                <stop offset="100%" stopColor="#EC4899" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            {/* Titolo e legenda */}
            <text x="50" y="30" fontFamily="Arial" fontSize="14" fontWeight="bold" fill="#111827">Performance:</text>
            
            {/* Legenda */}
            <rect x="260" y="20" width="12" height="12" rx="2" fill="#4F46E5" fillOpacity="0.8" />
            <text x="280" y="30" fontFamily="Arial" fontSize="12" fill="#6B7280">Engagement</text>
            
            <circle cx="400" cy="25" r="5" fill="#EC4899" />
            <text x="415" y="30" fontFamily="Arial" fontSize="12" fill="#6B7280">Sales</text>
          </svg>
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-indigo-500/10 rounded-3xl blur-3xl -z-10 transform -rotate-6"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
    </div>
  );
};

export default HeroImage;
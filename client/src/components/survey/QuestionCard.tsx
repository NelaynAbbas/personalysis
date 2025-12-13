import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SurveyQuestion } from "@shared/schema";
import confetti from "canvas-confetti";
import { 
  Lightbulb, 
  CheckCircle, 
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  BarChart,
  Users,
  Shield,
  Scale, 
  Rocket, 
  DollarSign,
  Wallet,
  BadgeCheck,
  Heart,
  Hammer,
  GraduationCap,
  Eye,
  TrendingUp,
  Star,
  Lightbulb as LightbulbIcon,
  List,
  Sparkles,
  ListOrdered,
  Zap,
  Brain,
  Hand,
  Dices,
  Tag,
  Crown,
  HelpingHand,
  FolderCheck,
  MessageSquare,
  Feather,
  ClipboardList,
  Sword,
  Wand2 as Wand,
  Key,
  Target,
  Music,
  Phone,
  MessageCircle,
  Mail,
  Video,
  User,
  Sunrise,
  Moon,
  Home,
  Building,
  Loader2
} from "lucide-react";

interface QuestionCardProps {
  question: SurveyQuestion;
  onNext: () => void;
  onPrev: () => void;
  onAnswerSelect: (answer: string) => void;
  isFirstQuestion: boolean;
  currentAnswer?: string;
  isLastQuestion?: boolean;
  isLoading?: boolean;
}

const QuestionCard = ({ 
  question, 
  onNext, 
  onPrev,
  onAnswerSelect,
  isFirstQuestion,
  currentAnswer,
  isLastQuestion = false,
  isLoading = false
}: QuestionCardProps) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(currentAnswer || null);
  const [showHint, setShowHint] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Update selected option when currentAnswer prop changes (e.g., when navigating between questions)
  useEffect(() => {
    setSelectedOption(currentAnswer || null);
  }, [currentAnswer, question.id]);
  
  // Save answer locally and trigger selection animation
  useEffect(() => {
    if (selectedOption && selectedOption !== currentAnswer) {
      // Small confetti burst on selection
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        // Calculate origin coordinates relative to window size
        const originX = x / window.innerWidth;
        const originY = y / window.innerHeight;
        
        confetti({
          particleCount: 20,
          spread: 30,
          origin: { x: originX, y: originY },
          colors: ['#7C3AED', '#9333EA', '#C026D3', '#DB2777']
        });
      }
      
      // Save the answer
      onAnswerSelect(selectedOption);
    }
  }, [selectedOption]);
  
  // Show hint after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!selectedOption) {
        setShowHint(true);
      }
    }, 10000);
    
    return () => {
      clearTimeout(timer);
      setShowHint(false);
    };
  }, [question, selectedOption]);
  
  const handleOptionClick = (value: string) => {
    setSelectedOption(value);
  };
  
  const handleNextClick = () => {
    if (selectedOption) {
      onNext();
    }
  };
  
  // Get icon based on option ID or the option text
  const getOptionIcon = (optionId: string, optionText?: string) => {
    // This is a fallback method if nothing else matches
    // Create a hashcode from the option ID to assign a consistent but "random" icon
    const getHashedIcon = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
      }
      // Use absolute value and modulus to get a number between 0 and 17
      const iconIndex = Math.abs(hash % 18);
      
      // Fixed set of icons to cycle through
      const icons = [
        <Rocket size={18} />,
        <Target size={18} />,
        <Star size={18} />,
        <Zap size={18} />,
        <Heart size={18} />,
        <Music size={18} />,
        <Crown size={18} />,
        <Eye size={18} />,
        <Feather size={18} />,
        <Hand size={18} />, 
        <User size={18} />,
        <Mail size={18} />,
        <Moon size={18} />,
        <Sunrise size={18} />,
        <Wallet size={18} />,
        <Tag size={18} />,
        <BarChart size={18} />,
        <Brain size={18} />
      ];
      
      return icons[iconIndex];
    };
    
    const text = optionText?.toLowerCase() || '';
    const id = optionId?.toLowerCase() || '';
    
    // Try to detect specific RPG questions and use a fixed set of themed icons
    if (text.includes('rpg') || text.includes('fantasy') || text.includes('character class') || 
        text.includes('game character') || id.includes('rpg') || id.includes('fantasy') || 
        text.includes('dungeon') || text.includes('dragon') ||
        (question.question && question.question.toLowerCase().includes('fantasy rpg'))) {
      
      // Create a unique icon for each fantasy class
      if (text.includes('warrior') || text.includes('fighter') || text.includes('barbarian') || 
          text.includes('paladin') || text.includes('knight') || text.includes('strength')) 
        return <Sword size={18} />; // Warrior gets sword icon
      
      if (text.includes('wizard') || text.includes('mage') || text.includes('sorcerer') || 
          text.includes('magician') || text.includes('spellcaster') || text.includes('magic') || 
          text.includes('knowledge') || text.includes('elemental')) 
        return <Wand size={18} />; // Wizards get wand icon
      
      if (text.includes('rogue') || text.includes('thief') || text.includes('assassin') || 
          text.includes('scout') || text.includes('stealth') || text.includes('adaptable') || 
          text.includes('shadow')) 
        return <Key size={18} />; // Rogues get key icon
      
      if (text.includes('healer') || text.includes('cleric') || text.includes('priest') || 
          text.includes('support') || text.includes('medic') || text.includes('team balance')) 
        return <Heart size={18} />; // Healers get heart icon
      
      if (text.includes('ranger') || text.includes('hunter') || text.includes('archer') || 
          text.includes('tracker') || text.includes('distance') || text.includes('sniper')) 
        return <Target size={18} />; // Rangers get target icon
      
      if (text.includes('bard') || text.includes('artist') || text.includes('performer') || 
          text.includes('music') || text.includes('entertainment') || text.includes('song')) 
        return <Music size={18} />; // Bards get music icon
    }
    
    // Personality types
    if (text.includes('introvert') || text.includes('quiet') || text.includes('alone') || text.includes('shy') ||
        text.includes('solitude') || text.includes('independent') || text.includes('reserved')) 
      return <User size={18} />;
    
    if (text.includes('extrovert') || text.includes('social') || text.includes('people') || 
        text.includes('outgoing') || text.includes('group') || text.includes('party') || text.includes('energetic')) 
      return <Users size={18} />;
    
    // Time preferences
    if (text.includes('morning') || text.includes('early') || text.includes('dawn') || text.includes('sunrise')) 
      return <Sunrise size={18} />;
    
    if (text.includes('night') || text.includes('evening') || text.includes('late') || text.includes('dark') ||
        text.includes('sunset') || text.includes('midnight')) 
      return <Moon size={18} />;
    
    // Communication preferences
    if (text.includes('phone') || text.includes('call') || text.includes('talking') || text.includes('voice')) 
      return <Phone size={18} />;
    
    if (text.includes('text') || text.includes('sms') || text.includes('message') || text.includes('messaging') ||
        text.includes('chat') || text.includes('whatsapp') || text.includes('telegram')) 
      return <MessageCircle size={18} />;
    
    if (text.includes('email') || text.includes('mail') || text.includes('letter') || text.includes('formal')) 
      return <Mail size={18} />;
    
    if (text.includes('meeting') || text.includes('person') || text.includes('face') || text.includes('personal') ||
        text.includes('physically') || text.includes('physically present')) 
      return <Users size={18} />;
    
    if (text.includes('video') || text.includes('zoom') || text.includes('online') || text.includes('virtual') ||
        text.includes('stream') || text.includes('conference') || text.includes('webcam')) 
      return <Video size={18} />;
    
    // Work environment preferences
    if (text.includes('remote') || text.includes('from home') || text.includes('anywhere')) 
      return <Home size={18} />;
    
    if (text.includes('office') || text.includes('workplace') || text.includes('building')) 
      return <Building size={18} />;
    
    if (text.includes('hybrid') || text.includes('flexible') || text.includes('mixed')) 
      return <ArrowLeftRight size={18} />;
    
    // Decision styles
    if (id.includes('analytical') || text.includes('analytical') || text.includes('analysis') || 
        text.includes('data') || text.includes('facts') || text.includes('logical')) 
      return <BarChart size={18} />;
    
    if (id.includes('intuitive') || text.includes('intuitive') || text.includes('gut feeling') || 
        text.includes('instinct') || text.includes('feel') || text.includes('sense')) 
      return <Lightbulb size={18} />;
    
    if (id.includes('collaborative') || text.includes('collaborative') || text.includes('consult') || 
        text.includes('together') || text.includes('team decision') || text.includes('group input')) 
      return <Users size={18} />;
    
    if (id.includes('methodical') || text.includes('methodical') || text.includes('step-by-step') || 
        text.includes('process') || text.includes('procedure') || text.includes('structured')) 
      return <ListOrdered size={18} />;
    
    if (id.includes('creative') || text.includes('creative') || text.includes('imagination') || 
        text.includes('artistic') || text.includes('novel') || text.includes('innovative')) 
      return <Sparkles size={18} />;
    
    if (id.includes('team') || text.includes('team') || text.includes('group work') || text.includes('collaboration')) 
      return <Hand size={18} />; 
    
    // Risk tolerance
    if (id.includes('risk') || text.includes('risk') || text.includes('chance') || text.includes('gamble')) 
      return <Dices size={18} />; 
    
    if (id.includes('cautious') || text.includes('cautious') || text.includes('careful') || 
        text.includes('safe') || text.includes('conservative') || text.includes('prevent')) 
      return <Shield size={18} />;
    
    if (id.includes('moderate') || text.includes('moderate') || text.includes('balanced') || 
        text.includes('middle ground') || text.includes('reasonable') || text.includes('evaluated')) 
      return <Scale size={18} />; 
    
    if (id.includes('high') || text.includes('high') || text.includes('bold') || 
        text.includes('daring') || text.includes('adventurous')) 
      return <Rocket size={18} />;
    
    // Shopping and consumer behavior
    if (id.includes('price') || text.includes('price') || text.includes('cost') || 
        text.includes('affordability') || text.includes('cheap') || text.includes('expensive')) 
      return <DollarSign size={18} />;
    
    if (id.includes('value') || text.includes('value') || text.includes('worth') || 
        text.includes('bang for buck') || text.includes('investment')) 
      return <Wallet size={18} />;
    
    if (id.includes('quality') || text.includes('quality') || text.includes('premium') || 
        text.includes('excellence') || text.includes('best') || text.includes('superior')) 
      return <BadgeCheck size={18} />;
    
    if (id.includes('brand') || text.includes('brand') || text.includes('name') || 
        text.includes('reputation') || text.includes('well-known')) 
      return <Heart size={18} />;
    
    if (id.includes('deal') || text.includes('deal') || text.includes('discount') || 
        text.includes('bargain') || text.includes('offer') || text.includes('promotion')) 
      return <Tag size={18} />; 
    
    // Learning styles
    if (id.includes('practice') || text.includes('practice') || text.includes('hands-on') || 
        text.includes('doing') || text.includes('experience') || text.includes('active')) 
      return <Hammer size={18} />;
    
    if (id.includes('theory') || text.includes('theory') || text.includes('read') || 
        text.includes('concept') || text.includes('understand') || text.includes('principles')) 
      return <GraduationCap size={18} />;
    
    if (id.includes('observe') || text.includes('observe') || text.includes('watch') || 
        text.includes('see') || text.includes('visual') || text.includes('demonstration')) 
      return <Eye size={18} />;
    
    // Team roles
    if (id.includes('lead') || text.includes('lead') || text.includes('direct') || 
        text.includes('charge') || text.includes('manage') || text.includes('head')) 
      return <Crown size={18} />; 
    
    if (id.includes('support') || text.includes('support') || text.includes('assist') || 
        text.includes('help') || text.includes('aid') || text.includes('enable')) 
      return <HelpingHand size={18} />; 
    
    if (id.includes('ideas') || text.includes('idea') || text.includes('creative') || 
        text.includes('brainstorm') || text.includes('concept') || text.includes('imagine')) 
      return <LightbulbIcon size={18} />;
    
    if (id.includes('organize') || text.includes('organize') || text.includes('detail') || 
        text.includes('arrange') || text.includes('system') || text.includes('structure')) 
      return <FolderCheck size={18} />; 
    
    // Feedback styles
    if (id.includes('direct') || text.includes('direct') || text.includes('straightforward') || 
        text.includes('honest') || text.includes('frank') || text.includes('candid')) 
      return <MessageSquare size={18} />; 
    
    if (id.includes('gentle') || text.includes('gentle') || text.includes('soft') || 
        text.includes('kind') || text.includes('compassionate') || text.includes('tactful')) 
      return <Feather size={18} />; 
    
    if (id.includes('detailed') || text.includes('detailed') || text.includes('thorough') || 
        text.includes('comprehensive') || text.includes('complete') || text.includes('full')) 
      return <ClipboardList size={18} />; 
    
    if (id.includes('action') || text.includes('action') || text.includes('solution') || 
        text.includes('practical') || text.includes('next steps') || text.includes('improvement')) 
      return <Zap size={18} />;
    
    // If we've got this far and no match, use the hash function
    return getHashedIcon(optionId || text);
  };
  
  return (
    <Card ref={cardRef} 
      className={`bg-white rounded-xl shadow-xl p-8 mb-6 transition-all duration-500 relative
        ${isAnimating ? 'transform scale-[1.02]' : ''}
      `}
    >
      <CardContent className="p-0">
        {/* Hint bubble */}
        {showHint && (
          <div className="absolute -top-12 right-4 bg-gray-800 text-white p-3 rounded-lg text-sm animate-bounce shadow-lg z-10">
            <div className="flex items-center">
              <Lightbulb className="mr-2 text-yellow-300" size={18} />
              <span>Choose the option that feels most like you!</span>
            </div>
            <div className="absolute bottom-0 right-6 transform translate-y-1/2 rotate-45 w-4 h-4 bg-gray-800"></div>
          </div>
        )}
      
        <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
          {question.question}
        </h2>
        
        {/* Check if any options have images to determine layout */}
        {question.options.some(opt => opt.image && opt.image.trim() !== "") ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {question.options.map((option) => (
              <div
                key={option.id}
                className={`
                  option-card cursor-pointer transition-all duration-300
                  border-2 rounded-lg overflow-hidden
                  transform hover:-translate-y-1 hover:shadow-lg
                  ${selectedOption === option.value ? 'border-primary shadow-lg shadow-primary/20' : 'border-transparent hover:border-primary'}
                `}
                onClick={() => handleOptionClick(option.value)}
                data-value={option.value}
              >
                <div 
                  className="w-full h-48 bg-gray-200 relative" 
                  style={{ 
                    backgroundImage: `url(${option.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {selectedOption === option.value && (
                    <div className="absolute inset-0 bg-primary bg-opacity-30 flex items-center justify-center">
                      <div className="bg-white rounded-full p-2 shadow-md">
                        <CheckCircle className="text-primary" size={24} />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-gray-50">
                  <p className="text-sm font-medium text-gray-700">{option.text}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {question.options.map((option, index) => (
              <div
                key={option.id}
                className={`
                  option-card cursor-pointer transition-all duration-300
                  border-2 rounded-lg relative overflow-hidden
                  transform hover:-translate-y-1 hover:shadow-lg
                  ${selectedOption === option.value ? 
                    'border-primary bg-primary/5 shadow-lg shadow-primary/20' : 
                    'border-transparent hover:border-primary bg-white'}
                `}
                onClick={() => handleOptionClick(option.value)}
                data-value={option.value}
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeIn 0.5s ease-out forwards'
                }}
              >
                {/* Display image if option has one */}
                {option.image && option.image.trim() !== "" && (
                  <div className="w-full h-40 bg-gray-200 relative">
                    <img
                      src={option.image}
                      alt={option.text}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    {selectedOption === option.value && (
                      <div className="absolute inset-0 bg-primary bg-opacity-20 flex items-center justify-center">
                        <div className="bg-white rounded-full p-2 shadow-md">
                          <CheckCircle className="text-primary" size={24} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className={option.image ? "p-4" : "p-4"}>
                  <div className="flex items-start">
                    {!option.image && (
                      <div className="flex-shrink-0 pt-0.5">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                          selectedOption === option.value ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                        }`}>
                          {getOptionIcon(option.id, option.text)}
                        </div>
                      </div>
                    )}
                    <div className={option.image ? "flex-1" : "ml-4 flex-1"}>
                      <p className={`text-base font-medium ${
                        selectedOption === option.value ? 'text-primary' : 'text-gray-900'
                      }`}>
                        {option.text}
                      </p>
                      {option.description && (
                        <p className="mt-1 text-sm text-gray-600">{option.description}</p>
                      )}
                    </div>
                    {selectedOption === option.value && !option.image && (
                      <div className="ml-3">
                        <CheckCircle className="text-primary" size={20} />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Option selection indicator */}
                {selectedOption === option.value && (
                  <span className="absolute top-0 left-0 mt-1 ml-1 text-xs font-bold text-primary bg-white px-2 py-0.5 rounded">
                    Selected
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={onPrev}
            className={`px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-full ${
              isFirstQuestion ? 'invisible' : ''
            }`}
          >
            <ArrowLeft className="mr-1" size={16} />
            Previous
          </Button>
          
          <Button
            variant="default"
            onClick={handleNextClick}
            className={`px-6 py-2 text-sm font-medium rounded-full ${
              !selectedOption || isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={!selectedOption || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isLastQuestion ? 'Completing...' : 'Submitting...'}
              </>
            ) : (
              <>
                {isLastQuestion ? 'Complete' : 'Next'}
                <ArrowRight className="ml-1" size={16} />
              </>
            )}
          </Button>
        </div>
      </CardContent>
      
      {/* Add some CSS animations in global styles instead */}
    </Card>
  );
};

export default QuestionCard;
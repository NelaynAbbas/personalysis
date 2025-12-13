interface ProgressIndicatorProps {
  currentQuestion: number;
  totalQuestions: number;
}

const ProgressIndicator = ({ currentQuestion, totalQuestions }: ProgressIndicatorProps) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-700">Your journey</h2>
        <span className="text-sm font-medium text-gray-500">
          <span>{currentQuestion}</span>/{totalQuestions}
        </span>
      </div>
      <div className="mt-3 flex justify-between">
        {Array.from({ length: totalQuestions }).map((_, index) => {
          const questionNumber = index + 1;
          const isActive = questionNumber === currentQuestion;
          const isCompleted = questionNumber < currentQuestion;
          
          return (
            <div 
              key={questionNumber}
              className={`
                progress-dot w-6 h-6 rounded-full border-2 flex items-center justify-center
                ${isActive ? 'border-primary bg-white' : isCompleted ? 'border-primary bg-primary' : 'border-gray-300 bg-white'}
              `}
              data-question={questionNumber}
            >
              <span 
                className={`
                  text-xs font-medium
                  ${isActive ? 'text-primary' : isCompleted ? 'text-white' : 'text-gray-500'}
                `}
              >
                {questionNumber}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressIndicator;

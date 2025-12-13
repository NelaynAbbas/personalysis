const { db } = require('./server/db');
const { templateQuestions, surveyQuestions, eq } = require('./shared/schema');

// Script to copy questions from template to an existing survey
async function copyQuestionsToSurvey(surveyId, templateId) {
  try {
    console.log(`Copying questions from template ${templateId} to survey ${surveyId}`);
    
    // Fetch questions from the template
    const templateQuestionsData = await db.query.templateQuestions.findMany({
      where: (tq, { eq }) => eq(tq.templateId, templateId),
      orderBy: (tq, { asc }) => [asc(tq.order)]
    });

    console.log(`Found ${templateQuestionsData.length} questions to copy`);

    if (templateQuestionsData.length === 0) {
      console.log('No questions found in template');
      return;
    }

    // Copy each question to the survey
    for (const tq of templateQuestionsData) {
      await db.insert(surveyQuestions).values({
        surveyId: surveyId,
        question: tq.question,
        questionType: tq.questionType || 'multiple-choice',
        required: tq.required !== undefined ? tq.required : true,
        helpText: tq.helpText || null,
        order: tq.order,
        options: tq.options || null,
        customValidation: tq.customValidation || null,
        sliderConfig: tq.sliderConfig || null,
        scenarioText: tq.scenarioText || null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    console.log(`✅ Successfully copied ${templateQuestionsData.length} questions to survey`);
    console.log(`✅ Done! You can now preview your survey.`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error copying questions:', error);
    process.exit(1);
  }
}

// Get command line arguments
const surveyId = parseInt(process.argv[2]);
const templateId = parseInt(process.argv[3]);

if (!surveyId || !templateId || isNaN(surveyId) || isNaN(templateId)) {
  console.log('Usage: node copy-questions-to-survey.js <surveyId> <templateId>');
  console.log('Example: node copy-questions-to-survey.js 22 16');
  process.exit(1);
}

copyQuestionsToSurvey(surveyId, templateId);


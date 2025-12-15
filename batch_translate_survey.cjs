const fs = require('fs');
const path = require('path');

// Read SurveyCreate.tsx
const filePath = path.join(__dirname, 'client', 'src', 'pages', 'SurveyCreate.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Define all replacements (string -> translation key)
const replacements = [
  // Questions tab
  ['<TabsTrigger value="customize">Customize</TabsTrigger>', '<TabsTrigger value="customize">{t(\'pages.surveyCreate.questions.customize\')}</TabsTrigger>'],
  ['<TabsTrigger value="preview">Preview</TabsTrigger>', '<TabsTrigger value="preview">{t(\'pages.surveyCreate.questions.preview\')}</TabsTrigger>'],
  ['<div className="text-sm text-muted-foreground">Loading questions…</div>', '<div className="text-sm text-muted-foreground">{t(\'pages.surveyCreate.questions.loading\')}</div>'],
  ['"Untitled question"', 't(\'pages.surveyCreate.questions.untitled\')'],
  ['"Question text"', 't(\'pages.surveyCreate.questions.questionText\')'],
  ['<Label>Question Type</Label>', '<Label>{t(\'pages.surveyCreate.questions.questionType\')}</Label>'],
  ['<Label>Required Question</Label>', '<Label>{t(\'pages.surveyCreate.questions.requiredQuestion\')}</Label>'],
  ['"Required"', 't(\'pages.surveyCreate.questions.required\')'],
  ['"Optional"', 't(\'pages.surveyCreate.questions.optional\')'],
  ['<Label>Help Text (Optional)</Label>', '<Label>{t(\'pages.surveyCreate.questions.helpText\')}</Label>'],
  ['"Enter additional instructions for this question"', 't(\'pages.surveyCreate.questions.helpTextPlaceholder\')'],
  ['"No help text"', 't(\'pages.surveyCreate.questions.noHelpText\')'],
  ['<Label>Answer Options</Label>', '<Label>{t(\'pages.surveyCreate.questions.answerOptions\')}</Label>'],
  ['<Label>Ranking Items</Label>', '<Label>{t(\'pages.surveyCreate.questions.rankingItems\')}</Label>'],
  ['>Remove</', '>{t(\'pages.surveyCreate.questions.remove\')}</'],
  ['>Add Option</', '>{t(\'pages.surveyCreate.questions.addOption\')}</'],
  ['>Add Item</', '>{t(\'pages.surveyCreate.questions.addItem\')}</'],
  ['<Label>Min Label</Label>', '<Label>{t(\'pages.surveyCreate.questions.minLabel\')}</Label>'],
  ['<Label>Max Label</Label>', '<Label>{t(\'pages.surveyCreate.questions.maxLabel\')}</Label>'],
  ['<Label>Scenario Text</Label>', '<Label>{t(\'pages.surveyCreate.questions.scenarioText\')}</Label>'],
  ['"No scenario text"', 't(\'pages.surveyCreate.questions.noScenarioText\')'],
  ['<Label>Options</Label>', '<Label>{t(\'pages.surveyCreate.questions.options\')}</Label>'],
  ['"Image URL (optional)"', 't(\'pages.surveyCreate.questions.imageUrl\')'],
  ['"No image URL"', 't(\'pages.surveyCreate.questions.noImageUrl\')'],
  ['"Description (optional)"', 't(\'pages.surveyCreate.questions.descriptionOptional\')'],
  ['"No description"', 't(\'pages.surveyCreate.questions.noDescription\')'],
  ['"Text input field"', 't(\'pages.surveyCreate.questions.textInputField\')'],
  ['<div className="text-sm text-muted-foreground">No questions yet. Click Add Question.</div>', '<div className="text-sm text-muted-foreground">{t(\'pages.surveyCreate.questions.noQuestions\')}</div>'],
  ['<div className="text-sm text-muted-foreground">No questions to preview.</div>', '<div className="text-sm text-muted-foreground">{t(\'pages.surveyCreate.questions.noQuestionsPreview\')}</div>'],
  ['>Add Question</', '>{t(\'pages.surveyCreate.questions.addQuestion\')}</'],
  ['>Save Questions</', '>{t(\'pages.surveyCreate.questions.saveQuestions\')}</'],
  ['>Edit Questions</', '>{t(\'pages.surveyCreate.questions.editQuestions\')}</'],

  // Toast messages
  ['title: "At least one question required"', 'title: t(\'pages.surveyCreate.questions.atLeastOneRequired\')'],
  ['description: "Please add at least one question before saving."', 'description: t(\'pages.surveyCreate.questions.addQuestionBeforeSaving\')'],
  ['title: "Questions saved"', 'title: t(\'pages.surveyCreate.questions.questionsSaved\')'],
  ['description: "Your questions have been saved. You can now continue to metadata."', 'description: t(\'pages.surveyCreate.questions.questionsDescription\')'],
  ['title: "Changes cancelled"', 'title: t(\'pages.surveyCreate.questions.changesCancelled\')'],
  ['description: "Your changes have been reverted to the last saved state."', 'description: t(\'pages.surveyCreate.questions.changesReverted\')'],

  // Validation messages
  ['title: "Survey name required"', 'title: t(\'pages.surveyCreate.validation.surveyNameRequired\')'],
  ['description: "Please enter a name for your survey."', 'description: t(\'pages.surveyCreate.validation.surveyNameRequiredDescription\')'],
  ['title: questions.length < 1 ? "Add at least one question" : "Save questions first"', 'title: questions.length < 1 ? t(\'pages.surveyCreate.validation.addAtLeastOneQuestion\') : t(\'pages.surveyCreate.validation.saveQuestionsFirst\')'],
  ['description: questions.length < 1 ? "Please add a question before continuing." : "Please save your questions before creating the survey."', 'description: questions.length < 1 ? t(\'pages.surveyCreate.validation.addQuestionDescription\') : t(\'pages.surveyCreate.validation.saveQuestionsDescription\')'],
  ['title: "Expiry date required"', 'title: t(\'pages.surveyCreate.validation.expiryDateRequired\')'],
  ['description: "Please select an expiry date."', 'description: t(\'pages.surveyCreate.validation.expiryDateRequiredDescription\')'],
  ['title: "Response limit required"', 'title: t(\'pages.surveyCreate.validation.responseLimitRequired\')'],
  ['description: "Enter a positive number."', 'description: t(\'pages.surveyCreate.validation.responseLimitDescription\')'],
  ['title: "Survey created successfully!"', 'title: t(\'pages.surveyCreate.toast.surveyCreated\')'],
  ['description: "Your new survey is ready to be shared."', 'description: t(\'pages.surveyCreate.toast.surveyCreatedDescription\')'],
  ['title: "Failed to create survey"', 'title: t(\'pages.surveyCreate.toast.createFailed\')'],
  ['description: "There was a problem creating your survey. Please try again."', 'description: t(\'pages.surveyCreate.toast.createFailedDescription\')'],

  // Navigation buttons
  ['>Cancel</', '>{t(\'pages.surveyCreate.navigation.cancel\')}</'],
  ['>Back</', '>{t(\'pages.surveyCreate.navigation.back\')}</'],
  ['>Continue to Questions</', '>{t(\'pages.surveyCreate.navigation.continueToQuestions\')}</'],
  ['>Continue to Metadata</', '>{t(\'pages.surveyCreate.navigation.continueToMetadata\')}</'],
  ['>Continue to Business Context</', '>{t(\'pages.surveyCreate.navigation.continueToBusinessContext\')}</'],
  ['>Continue to Settings</', '>{t(\'pages.surveyCreate.navigation.continueToSettings\')}</'],
  ['>Continue to Final Preview</', '>{t(\'pages.surveyCreate.navigation.continueToFinalPreview\')}</'],
  ['>Create Survey</', '>{t(\'pages.surveyCreate.navigation.createSurvey\')}</'],
  ['>Creating...</', '>{t(\'pages.surveyCreate.navigation.creating\')}</'],

  // Success Modal
  ['<h2 className="text-2xl font-bold mb-4">Survey Created Successfully!</h2>', '<h2 className="text-2xl font-bold mb-4">{t(\'pages.surveyCreate.successModal.title\')}</h2>'],
  ['<p className="mb-6">Your survey is ready to be shared or previewed.</p>', '<p className="mb-6">{t(\'pages.surveyCreate.successModal.description\')}</p>'],
  ['>Preview Survey</', '>{t(\'pages.surveyCreate.successModal.previewSurvey\')}</'],
  ['>Share Survey</', '>{t(\'pages.surveyCreate.successModal.shareSurvey\')}</'],
  ['>Collaborate</', '>{t(\'pages.surveyCreate.successModal.collaborate\')}</'],
  ['>Return to Dashboard</', '>{t(\'pages.surveyCreate.successModal.returnToDashboard\')}</'],
  ['>Close</', '>{t(\'common.close\')}</'],
];

// Apply all replacements
replacements.forEach(([oldStr, newStr]) => {
  content = content.replace(oldStr, newStr);
});

// Write back
fs.writeFileSync(filePath, content, 'utf8');
console.log('SurveyCreate.tsx translations updated successfully!');

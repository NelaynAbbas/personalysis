const fs = require('fs');
const path = require('path');

// Read English translation file
const enPath = path.join(__dirname, 'client', 'src', 'locales', 'translations', 'en.json');
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Extract the new surveyCreate and adminConsole sections
const surveyCreate = enData.pages.surveyCreate;
const adminConsole = enData.pages.adminConsole;

// Function to deep merge objects
function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], deepMerge(target[key], source[key]));
    }
  }
  Object.assign(target || {}, source);
  return target;
}

// Translation mappings for each language
const translations = {
  es: {
    // Spanish translations - comprehensive professional translations
    surveyCreate: JSON.parse(fs.readFileSync(path.join(__dirname, 'temp_es_survey.json'), 'utf8'))
  },
  fr: {
    // French translations will be added
  },
  it: {
    // Italian translations will be added
  },
  de: {
    // German translations will be added
  },
  ar: {
    // Arabic translations will be added
  }
};

// List of language files to update
const languages = ['es', 'fr', 'it', 'de', 'ar'];

languages.forEach(lang => {
  const filePath = path.join(__dirname, 'client', 'src', 'locales', 'translations', `${lang}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Update surveyCreate and adminConsole sections
  if (!data.pages) data.pages = {};
  data.pages.surveyCreate = translations[lang].surveyCreate || surveyCreate;
  data.pages.adminConsole = translations[lang].adminConsole || adminConsole;

  // Write back to file
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${lang}.json`);
});

console.log('Translation propagation complete!');

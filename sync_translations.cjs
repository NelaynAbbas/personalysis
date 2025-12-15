const fs = require('fs');
const path = require('path');

// Helper to deep merge objects
function deepMerge(target, source) {
  const output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target))
          Object.assign(output, { [key]: source[key] });
        else
          output[key] = deepMerge(target[key], source[key]);
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// Read English (master) file
const enPath = path.join(__dirname, 'client', 'src', 'locales', 'translations', 'en.json');
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// List of language files to update
const languages = ['es', 'fr', 'it', 'de', 'ar'];

languages.forEach(lang => {
  const langPath = path.join(__dirname, 'client', 'src', 'locales', 'translations', `${lang}.json`);
  let langData = JSON.parse(fs.readFileSync(langPath, 'utf8'));

  // Merge English structure into language file (keeps existing translations, adds missing keys)
  langData = deepMerge(enData, langData);

  // Write back
  fs.writeFileSync(langPath, JSON.stringify(langData, null, 2) + '\n', 'utf8');
  console.log(`Updated ${lang}.json with new translation keys`);
});

console.log('\nAll translation files synchronized with English structure!');
console.log('Note: New keys use English text as fallback. Professional translations needed for:');
languages.forEach(lang => console.log(`  - ${lang}.json: pages.surveyCreate.* and pages.adminConsole.*`));

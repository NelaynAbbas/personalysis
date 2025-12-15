# Phase 2: Client-Side Implementation - Complete Guide

## Overview

Phase 2 involves converting all React components to use the i18n translation system. This guide provides patterns and step-by-step instructions for converting pages and components.

## Pattern 1: Basic Component Translation

### Before:
```typescript
import React from 'react';

export function MyComponent() {
  return (
    <div>
      <h1>Welcome</h1>
      <button>Save</button>
      <button>Cancel</button>
    </div>
  );
}
```

### After:
```typescript
import React from 'react';
import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('pages.home.title')}</h1>
      <button>{t('common.save')}</button>
      <button>{t('common.cancel')}</button>
    </div>
  );
}
```

## Pattern 2: Dynamic Messages with Variables

### Before:
```typescript
toast({ message: `Survey "${name}" created successfully` });
```

### After:
```typescript
const { t } = useTranslation();
toast({ message: t('success.surveyCreated') });
```

### In Translation File:
```json
{
  "success": {
    "surveyCreated": "Survey created successfully"
  }
}
```

## Pattern 3: Conditional Translations (Plurals)

### Before:
```typescript
const message = count === 1 ? "1 response" : `${count} responses`;
```

### After (Using i18next ns):
```json
{
  "responses": {
    "count_one": "1 response",
    "count_other": "{{count}} responses"
  }
}
```

## Pattern 4: Form Validation Messages

### Before:
```typescript
const schema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
});
```

### After:
```typescript
import { useTranslation } from 'react-i18next';

export function MyForm() {
  const { t } = useTranslation();

  const schema = z.object({
    email: z.string().email({ message: t('validation.email') }),
  });
}
```

## Step-by-Step Conversion Process

### Step 1: Add useTranslation Hook
```typescript
import { useTranslation } from 'react-i18next';

export function MyPage() {
  const { t } = useTranslation();
  // Rest of component
}
```

### Step 2: Replace Hardcoded Strings
Replace each hardcoded string with `t('key.path')`:
- Page titles → `pages.{page}.title`
- Button labels → `common.{action}`
- Error messages → `errors.{type}`
- Success messages → `success.{type}`

### Step 3: Test Each Language
1. Open app in browser
2. Click language selector
3. Verify all text changes
4. Check for any missing translations (should show as "key.path")

### Step 4: Update Translation Files
If new strings are found:
1. Add to English (en.json)
2. Translate to all other languages
3. Test again

## Priority Pages to Convert (Phase 2a)

These pages should be converted first as they're most frequently used:

1. **Login.tsx** - Authentication page (highest priority)
2. **Dashboard.tsx** - Main user interface
3. **SurveyCreate.tsx** - Survey creation flow
4. **Home.tsx** - Landing page
5. **AdminConsole.tsx** - Admin interface

## Complete Conversion Checklist

### For Each Component:

- [ ] Add `import { useTranslation } from 'react-i18next'`
- [ ] Add `const { t } = useTranslation()` in component
- [ ] Replace all hardcoded strings with `t()` calls
- [ ] Verify all form validation messages use translations
- [ ] Check toast/alert messages use translations
- [ ] Test in all 6 languages
- [ ] Verify no missing translation keys appear

### For Each Page:

- [ ] Follow component checklist above
- [ ] Update page title (meta)
- [ ] Verify navigation items translated
- [ ] Check error messages
- [ ] Verify success messages
- [ ] Test form submissions in different languages
- [ ] Verify RTL layout works for Arabic

## Common Translation Keys by Type

### Navigation & Menu:
```
header.home
header.dashboard
header.surveys
header.logout
```

### Common Actions:
```
common.save
common.cancel
common.delete
common.edit
common.loading
```

### Error Messages:
```
errors.notFound
errors.serverError
errors.networkError
errors.accessDenied
```

### Success Messages:
```
success.surveyCreated
success.surveyUpdated
success.saved
```

### Form Validation:
```
validation.required
validation.email
validation.password
validation.invalidFormat
```

## Tools for Finding Untranslated Strings

### Method 1: Browser Console
When a translation key is missing, i18next logs a warning:
```
[i18n] key "missing.key" not found in language "en"
```

### Method 2: Test in Each Language
Switch to each language and look for:
- Key names appearing instead of text
- Missing translations
- Broken layouts (especially Arabic)

### Method 3: Code Search
Search for hardcoded strings:
```bash
grep -r "\"[A-Z][a-z].*\"" src/pages/ src/components/
```

## RTL Support (Arabic)

When translating for Arabic (ar):

1. Document direction automatically set to RTL
2. Flexbox and grid layouts auto-reverse
3. Text automatically right-aligned
4. Ensure no hardcoded left/right in CSS

### Testing Arabic:
```typescript
// This is automatic, but verify:
document.documentElement.dir === 'rtl' // true for Arabic
document.documentElement.lang === 'ar'  // true for Arabic
```

## Performance Considerations

- Translations are loaded in memory (Phase 1 setup)
- No network requests for translation switching
- Switch happens instantly
- Ideal for real-time language changes

## Common Pitfalls to Avoid

1. ❌ Don't mix translated and untranslated strings
2. ❌ Don't hardcode numbers or dates (use formatting)
3. ❌ Don't forget validation messages
4. ❌ Don't skip testing in each language
5. ❌ Don't forget to update all 6 language files
6. ❌ Don't use string interpolation without i18next variables

## Next Steps After Phase 2

Once all pages are converted:

1. Phase 3: Server-side translation (API messages, emails)
2. Phase 4: Database language preference persistence
3. Phase 5: Advanced features (date formatting, number formatting, RTL polish)

## Quick Reference: Most Common Conversions

### Page Headers
```typescript
// Before
<h1>Welcome to PersonalysisPro</h1>

// After
const { t } = useTranslation();
<h1>{t('pages.home.title')}</h1>
```

### Buttons
```typescript
// Before
<button>Save Changes</button>

// After
const { t } = useTranslation();
<button>{t('common.save')}</button>
```

### Toast Messages
```typescript
// Before
toast({ message: "Survey created successfully" });

// After
const { t } = useTranslation();
toast({ message: t('success.surveyCreated') });
```

### Form Errors
```typescript
// Before
<p className="error">This field is required</p>

// After
const { t } = useTranslation();
<p className="error">{t('validation.required')}</p>
```

## Questions & Troubleshooting

### Q: Why is my translation showing as "pages.home.title"?
A: The key doesn't exist in the JSON file. Check spelling and add it to all language files.

### Q: Can I use HTML in translations?
A: Yes! Set `interpolation: { escapeValue: false }` in i18n.ts (already done).

### Q: How do I handle plurals?
A: Use suffixes: `_one`, `_other` in JSON:
```json
{
  "items_one": "1 item",
  "items_other": "{{count}} items"
}
```
Then: `t('items', { count: 5 })` → "5 items"

### Q: My RTL layout is broken for Arabic
A: Ensure you're not using hardcoded left/right values. Use margin-x, padding-x instead.

---

**Total Pages to Convert: 34**
**Total Components to Convert: 137+**
**Estimated Time: 16-20 hours**

Start with the 5 priority pages listed above, then proceed systematically through remaining pages and components.

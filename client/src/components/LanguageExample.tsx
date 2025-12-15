import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';

/**
 * Example component demonstrating how to use i18next translations
 * This shows the pattern that will be applied across the application in Phase 2
 */
export function LanguageExample() {
  const { t } = useTranslation();
  const { language } = useLanguage();

  return (
    <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
      <h3 className="font-semibold text-blue-900 mb-2">Translation System Active</h3>
      <p className="text-sm text-blue-700 mb-3">
        Current language: <strong>{language.toUpperCase()}</strong>
      </p>

      <div className="space-y-2 text-sm">
        <p>
          <strong>Common:</strong> {t('common.save')} | {t('common.cancel')} | {t('common.delete')}
        </p>
        <p>
          <strong>Auth:</strong> {t('auth.login.title')} | {t('auth.signup.title')}
        </p>
        <p>
          <strong>Validation:</strong> {t('validation.required')} | {t('validation.email')}
        </p>
        <p>
          <strong>Success:</strong> {t('success.loginSuccess')}
        </p>
      </div>

      <p className="text-xs text-gray-600 mt-3">
        ✓ Translations are working! Use the language selector in the header to switch languages.
      </p>
    </div>
  );
}

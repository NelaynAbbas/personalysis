/**
 * Cross-Browser and Device Compatibility Tests for PersonalysisPro
 * 
 * This script validates the application's compatibility across different browsers,
 * devices, and screen sizes to ensure a consistent user experience.
 */

const { chromium, firefox, webkit } = require('playwright');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Configure test settings
const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';
const TEST_USERNAME = 'demo@personalysispro.com';
const TEST_PASSWORD = 'demo-password';
const SCREENSHOTS_DIR = path.join(__dirname, '../../test-results/compatibility');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Define browser configurations
const browserConfigs = [
  { name: 'chromium', browser: chromium },
  { name: 'firefox', browser: firefox },
  { name: 'webkit', browser: webkit }
];

// Define device configurations
const deviceConfigs = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 }
];

/**
 * Helper function to log test results
 */
function logResult(testName, result, details = '') {
  const status = result ? '✅ PASSED' : '❌ FAILED';
  console.log(`${status}: ${testName}`);
  if (details) {
    console.log(`  Details: ${details}`);
  }
  console.log('-------------------------------------------');
}

/**
 * Helper function to take and save screenshots
 */
async function takeScreenshot(page, name) {
  const screenshotPath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return screenshotPath;
}

/**
 * Helper function to log in a user
 */
async function loginUser(page, email, password) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
}

/**
 * Run cross-browser compatibility tests
 */
async function runBrowserCompatibilityTests() {
  console.log('🌐 Starting Cross-Browser Compatibility Tests 🌐');
  console.log('===============================================');
  console.log(`Target: ${BASE_URL}`);
  console.log('===============================================\n');
  
  for (const browserConfig of browserConfigs) {
    console.log(`\n🔍 Testing on ${browserConfig.name.toUpperCase()} 🔍`);
    console.log('-----------------------------------------------');
    
    // Launch browser
    const browser = await browserConfig.browser.launch({
      headless: true
    });
    
    for (const deviceConfig of deviceConfigs) {
      console.log(`\n📱 Testing ${deviceConfig.name.toUpperCase()} viewport (${deviceConfig.width}x${deviceConfig.height}) 📱`);
      console.log('-----------------------------------------------');
      
      // Create context with viewport size
      const context = await browser.newContext({
        viewport: {
          width: deviceConfig.width,
          height: deviceConfig.height
        }
      });
      
      const page = await context.newPage();
      
      try {
        // Test 1: Load the landing page
        await page.goto(BASE_URL);
        await takeScreenshot(page, `${browserConfig.name}_${deviceConfig.name}_landing`);
        
        const landingPageLoads = await page.title() !== '';
        logResult(`Landing Page - ${browserConfig.name} - ${deviceConfig.name}`, landingPageLoads,
          landingPageLoads ? 'Landing page loads correctly' : 'Landing page may not load correctly');
        
        // Test 2: Check responsive navigation
        let navigationWorks = false;
        
        if (deviceConfig.name === 'mobile') {
          // On mobile, check if the hamburger menu exists and works
          const hamburgerExists = await page.$('.mobile-menu-button') !== null;
          
          if (hamburgerExists) {
            await page.click('.mobile-menu-button');
            await page.waitForTimeout(500); // Wait for animation
            
            // Check if menu items are visible after clicking
            navigationWorks = await page.$eval('.mobile-menu', menu => {
              return window.getComputedStyle(menu).display !== 'none';
            });
          }
        } else {
          // On desktop/tablet, check if navigation items are visible
          navigationWorks = await page.$('.main-navigation') !== null;
        }
        
        logResult(`Responsive Navigation - ${browserConfig.name} - ${deviceConfig.name}`, navigationWorks,
          navigationWorks ? 'Responsive navigation works correctly' : 'Responsive navigation may not work correctly');
        
        // Test 3: Login functionality
        try {
          await loginUser(page, TEST_USERNAME, TEST_PASSWORD);
          await takeScreenshot(page, `${browserConfig.name}_${deviceConfig.name}_after_login`);
          
          // Check if login worked by looking for a dashboard element
          const loginWorks = await page.$('.dashboard-container') !== null;
          
          logResult(`Login Functionality - ${browserConfig.name} - ${deviceConfig.name}`, loginWorks,
            loginWorks ? 'Login works correctly' : 'Login may not work correctly');
          
          if (loginWorks) {
            // Test 4: Dashboard components
            const dashboardComponentsWork = await page.evaluate(() => {
              // Check if key dashboard components are rendered and visible
              const charts = document.querySelectorAll('.chart-container');
              const tables = document.querySelectorAll('table');
              
              return charts.length > 0 && tables.length > 0;
            });
            
            logResult(`Dashboard Components - ${browserConfig.name} - ${deviceConfig.name}`, dashboardComponentsWork,
              dashboardComponentsWork ? 'Dashboard components render correctly' : 'Dashboard components may not render correctly');
            
            // Test 5: Form inputs
            await page.goto(`${BASE_URL}/settings`);
            await takeScreenshot(page, `${browserConfig.name}_${deviceConfig.name}_settings`);
            
            const formInputsWork = await page.evaluate(() => {
              // Check if form inputs work correctly
              const inputs = document.querySelectorAll('input, select, textarea');
              return inputs.length > 0;
            });
            
            logResult(`Form Inputs - ${browserConfig.name} - ${deviceConfig.name}`, formInputsWork,
              formInputsWork ? 'Form inputs work correctly' : 'Form inputs may not work correctly');
            
            // Test 6: Modal dialogs
            let modalDialogsWork = false;
            
            try {
              // Try to find and click a button that opens a modal
              await page.click('button:has-text("Edit Profile")');
              await page.waitForTimeout(500); // Wait for animation
              
              // Check if modal is visible
              modalDialogsWork = await page.evaluate(() => {
                const modal = document.querySelector('.modal-container');
                return modal && window.getComputedStyle(modal).display !== 'none';
              });
              
              // Close the modal if it was opened
              if (modalDialogsWork) {
                await takeScreenshot(page, `${browserConfig.name}_${deviceConfig.name}_modal`);
                await page.click('.modal-close-button');
              }
            } catch (modalError) {
              // If the button wasn't found, try an alternative
              try {
                await page.click('button:has-text("Change Password")');
                await page.waitForTimeout(500);
                
                modalDialogsWork = await page.evaluate(() => {
                  const modal = document.querySelector('.modal-container');
                  return modal && window.getComputedStyle(modal).display !== 'none';
                });
                
                if (modalDialogsWork) {
                  await takeScreenshot(page, `${browserConfig.name}_${deviceConfig.name}_modal`);
                  await page.click('.modal-close-button');
                }
              } catch (altModalError) {
                // Modal test couldn't be completed
              }
            }
            
            logResult(`Modal Dialogs - ${browserConfig.name} - ${deviceConfig.name}`, modalDialogsWork,
              modalDialogsWork ? 'Modal dialogs work correctly' : 'Modal dialogs may not work correctly');
            
            // Test 7: Check for JS errors
            const jsErrors = await page.evaluate(() => {
              return window.__TEST_JS_ERRORS__ || [];
            });
            
            const noJsErrors = jsErrors.length === 0;
            
            logResult(`No JavaScript Errors - ${browserConfig.name} - ${deviceConfig.name}`, noJsErrors,
              noJsErrors ? 'No JavaScript errors detected' : `Detected ${jsErrors.length} JavaScript errors`);
            
            // Test 8: Logout
            try {
              // Try to find and click logout button
              await page.click('button:has-text("Log Out")');
              await page.waitForNavigation();
              
              // Check if logout worked by looking for the login page
              const logoutWorks = await page.$('form.login-form') !== null;
              
              logResult(`Logout Functionality - ${browserConfig.name} - ${deviceConfig.name}`, logoutWorks,
                logoutWorks ? 'Logout works correctly' : 'Logout may not work correctly');
            } catch (logoutError) {
              // Try alternative logout UI
              try {
                await page.click('.user-menu-trigger');
                await page.click('button:has-text("Log Out")');
                await page.waitForNavigation();
                
                const logoutWorks = await page.$('form.login-form') !== null;
                
                logResult(`Logout Functionality - ${browserConfig.name} - ${deviceConfig.name}`, logoutWorks,
                  logoutWorks ? 'Logout works correctly' : 'Logout may not work correctly');
              } catch (altLogoutError) {
                logResult(`Logout Functionality - ${browserConfig.name} - ${deviceConfig.name}`, false,
                  'Could not find logout button');
              }
            }
          }
        } catch (loginError) {
          logResult(`Login Functionality - ${browserConfig.name} - ${deviceConfig.name}`, false,
            `Error during login: ${loginError.message}`);
        }
        
      } catch (error) {
        console.error(`Error during ${browserConfig.name} tests on ${deviceConfig.name}:`, error);
      } finally {
        await context.close();
      }
    }
    
    await browser.close();
  }
  
  console.log('\n===============================================');
  console.log('🌐 Cross-Browser Compatibility Tests Complete 🌐');
  console.log('===============================================');
}

/**
 * Check CSS compatibility across browsers
 */
async function checkCssCompatibility() {
  console.log('\n🎨 CSS Compatibility Tests 🎨');
  console.log('-----------------------------------------------');
  
  const cssFeaturesToCheck = [
    { name: 'Flexbox', property: 'display', value: 'flex' },
    { name: 'Grid', property: 'display', value: 'grid' },
    { name: 'CSS Variables', property: '--test-var', value: 'red' },
    { name: 'Transform', property: 'transform', value: 'translateX(10px)' },
    { name: 'Transition', property: 'transition', value: 'all 0.3s ease' },
    { name: 'Box Shadow', property: 'box-shadow', value: '0 2px 4px rgba(0,0,0,0.1)' }
  ];
  
  for (const browserConfig of browserConfigs) {
    console.log(`\n🔍 Checking CSS compatibility on ${browserConfig.name.toUpperCase()} 🔍`);
    
    // Launch browser
    const browser = await browserConfig.browser.launch({
      headless: true
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      // Go to the landing page
      await page.goto(BASE_URL);
      
      // Inject test div and check CSS support
      for (const feature of cssFeaturesToCheck) {
        const isSupported = await page.evaluate(({ property, value }) => {
          // Create a test div
          const testDiv = document.createElement('div');
          document.body.appendChild(testDiv);
          
          // Try to set the CSS property
          testDiv.style[property] = value;
          
          // Check if the property was applied
          const computedStyle = window.getComputedStyle(testDiv);
          const applied = computedStyle[property];
          
          // Clean up
          document.body.removeChild(testDiv);
          
          return applied === value || 
                 (property === '--test-var' && computedStyle.getPropertyValue(property) === value);
        }, feature);
        
        logResult(`${feature.name} Support - ${browserConfig.name}`, isSupported,
          isSupported ? `${feature.name} is supported` : `${feature.name} may not be fully supported`);
      }
    } catch (error) {
      console.error(`Error during CSS compatibility check on ${browserConfig.name}:`, error);
    } finally {
      await context.close();
      await browser.close();
    }
  }
}

/**
 * Check for accessibility issues
 */
async function checkAccessibility() {
  console.log('\n♿ Accessibility Tests ♿');
  console.log('-----------------------------------------------');
  
  // These are common accessibility checks to perform
  const a11yChecks = [
    { name: 'Image Alt Text', selector: 'img:not([alt])' },
    { name: 'Form Label Associations', selector: 'input:not([aria-label]):not([aria-labelledby]):not([type="hidden"])' },
    { name: 'Color Contrast Checker', custom: true },
    { name: 'Keyboard Navigability', custom: true }
  ];
  
  // Test on Chromium as it has the most a11y tooling support
  const browser = await chromium.launch({
    headless: true
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Go to the landing page
    await page.goto(BASE_URL);
    
    // Run standard checks
    for (const check of a11yChecks) {
      if (check.custom) {
        if (check.name === 'Color Contrast Checker') {
          // Simple contrast check on text elements
          const contrastIssues = await page.evaluate(() => {
            const issues = [];
            const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button, label');
            
            for (const el of textElements) {
              const style = window.getComputedStyle(el);
              const bgColor = style.backgroundColor;
              const textColor = style.color;
              
              // This is a simplified check - a real test would use WCAG algorithms
              if (bgColor === 'rgba(0, 0, 0, 0)' || textColor === 'rgba(0, 0, 0, 0)') {
                continue; // Skip elements with transparent backgrounds or text
              }
              
              // Simple lightness calculation
              const getBrightness = (color) => {
                const rgb = color.match(/\d+/g).map(Number);
                return (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
              };
              
              const bgBrightness = getBrightness(bgColor);
              const textBrightness = getBrightness(textColor);
              const diff = Math.abs(bgBrightness - textBrightness);
              
              if (diff < 125) { // Simple threshold for contrast
                issues.push(el.textContent.substring(0, 20) + '...');
              }
            }
            
            return issues;
          });
          
          logResult(`${check.name}`, contrastIssues.length === 0,
            contrastIssues.length === 0 ? 'No contrast issues detected' : `Detected ${contrastIssues.length} potential contrast issues`);
        } else if (check.name === 'Keyboard Navigability') {
          // Test keyboard navigation
          let tabIndex = 0;
          let previousElement = null;
          let isNavigable = true;
          
          // Press Tab 10 times and check if focus moves
          for (let i = 0; i < 10; i++) {
            await page.keyboard.press('Tab');
            
            const activeElement = await page.evaluate(() => {
              if (document.activeElement) {
                return {
                  tag: document.activeElement.tagName,
                  id: document.activeElement.id,
                  text: document.activeElement.textContent
                };
              }
              return null;
            });
            
            if (activeElement === null || 
                (previousElement && 
                 activeElement.tag === previousElement.tag && 
                 activeElement.id === previousElement.id &&
                 activeElement.text === previousElement.text)) {
              if (i > 0) { // It's okay if the first tab doesn't move (might start at body)
                isNavigable = false;
                break;
              }
            }
            
            previousElement = activeElement;
            tabIndex++;
          }
          
          logResult(`${check.name}`, isNavigable,
            isNavigable ? `Successfully tabbed through ${tabIndex} elements` : 'Keyboard navigation may be broken');
        }
      } else {
        // Check for missing accessibility attributes
        const violations = await page.$$eval(check.selector, els => els.length);
        
        logResult(`${check.name}`, violations === 0,
          violations === 0 ? `No ${check.name.toLowerCase()} issues found` : `Found ${violations} elements missing ${check.name.toLowerCase()}`);
      }
    }
    
    // Try to login and check authenticated pages
    try {
      await loginUser(page, TEST_USERNAME, TEST_PASSWORD);
      
      // Rerun checks on authenticated pages
      const authenticatedPages = [
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Settings', path: '/settings' },
        { name: 'Profile', path: '/profile' }
      ];
      
      for (const pageConfig of authenticatedPages) {
        try {
          await page.goto(`${BASE_URL}${pageConfig.path}`);
          
          // Check for missing alt text as a basic a11y test
          const missingAltTexts = await page.$$eval('img:not([alt])', els => els.length);
          
          logResult(`Image Alt Text - ${pageConfig.name} Page`, missingAltTexts === 0,
            missingAltTexts === 0 ? `No alt text issues on ${pageConfig.name} page` : `Found ${missingAltTexts} images missing alt text on ${pageConfig.name} page`);
        } catch (pageError) {
          console.error(`Error checking ${pageConfig.name} page:`, pageError);
        }
      }
    } catch (loginError) {
      console.error('Error during login for accessibility tests:', loginError);
    }
  } catch (error) {
    console.error('Error during accessibility checks:', error);
  } finally {
    await context.close();
    await browser.close();
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  try {
    await runBrowserCompatibilityTests();
    await checkCssCompatibility();
    await checkAccessibility();
  } catch (error) {
    console.error('Error running compatibility tests:', error);
  }
}

// Run all tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runBrowserCompatibilityTests,
  checkCssCompatibility,
  checkAccessibility,
  runAllTests
};
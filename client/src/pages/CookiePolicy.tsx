import { useEffect } from "react";

export default function CookiePolicy() {
  useEffect(() => {
    // Set page title
    document.title = "Cookie Policy | PersonalysisPro";
    // Scroll to top on page load
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Cookie Policy</h1>
        
        <div className="prose prose-primary max-w-none">
          <p className="text-lg text-gray-700 mb-6">
            Last updated: April 18, 2025
          </p>
          
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Introduction</h2>
          <p>
            PersonalysisPro ("we," "our," or "us") uses cookies and similar technologies on our website. 
            This Cookie Policy explains how we use cookies, how they help ensure the best experience when 
            you visit our website, and your choices regarding cookies.
          </p>
          
          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">What Are Cookies</h2>
          <p>
            Cookies are small text files that are stored on your computer or mobile device when you visit 
            a website. They are widely used to make websites work more efficiently and provide information 
            to the website owners. Cookies enhance user experience by:
          </p>
          <ul className="list-disc pl-6 mt-2 mb-4">
            <li>Remembering your preferences and settings</li>
            <li>Keeping you signed in to secure areas of our website</li>
            <li>Helping us understand how you use our website</li>
            <li>Measuring the effectiveness of our marketing campaigns</li>
            <li>Tailoring our content to your interests</li>
          </ul>
          
          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Types of Cookies We Use</h2>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Essential Cookies</h3>
          <p>
            These cookies are necessary for the website to function properly. They enable basic functions like 
            page navigation, secure areas access, and form submissions. The website cannot function properly 
            without these cookies, which is why they cannot be disabled.
          </p>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Analytical/Performance Cookies</h3>
          <p>
            These cookies help us understand how visitors interact with our website by collecting and reporting 
            anonymous information. This helps us improve our website structure and content.
          </p>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Functionality Cookies</h3>
          <p>
            These cookies allow the website to provide enhanced functionality and personalization. They may be 
            set by us or by third-party providers whose services we have added to our pages.
          </p>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Targeting/Advertising Cookies</h3>
          <p>
            These cookies are used to build a profile of your interests and show you relevant advertisements 
            on other websites. They remember that you have visited our website and may share this information 
            with third parties such as advertisers.
          </p>
          
          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Third-Party Cookies</h2>
          <p>
            We may use third-party services that set cookies on our behalf. These services include:
          </p>
          <ul className="list-disc pl-6 mt-2 mb-4">
            <li>Google Analytics (for website analytics)</li>
            <li>Google Ads (for advertising)</li>
            <li>Facebook Pixel (for marketing and advertising)</li>
            <li>LinkedIn Insight Tag (for marketing and advertising)</li>
            <li>HubSpot (for marketing automation)</li>
          </ul>
          
          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Managing Your Cookie Preferences</h2>
          <p>
            You can control and/or delete cookies as you wish. You can delete all cookies that are already 
            on your computer and you can set most browsers to prevent them from being placed. However, if 
            you do this, you may have to manually adjust some preferences every time you visit our website, 
            and some services and functionalities may not work.
          </p>
          <p className="mt-2">
            Most web browsers allow you to manage your cookie preferences. You can:
          </p>
          <ul className="list-disc pl-6 mt-2 mb-4">
            <li>See what cookies are stored on your device</li>
            <li>Allow, block, or delete cookies</li>
            <li>Set preferences for certain websites</li>
          </ul>
          
          <p className="mt-2">
            To manage cookies in your browser, please consult your browser's help section or visit:
          </p>
          <ul className="list-disc pl-6 mt-2 mb-4">
            <li><a href="https://support.google.com/chrome/answer/95647" className="text-primary hover:underline">Google Chrome</a></li>
            <li><a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" className="text-primary hover:underline">Mozilla Firefox</a></li>
            <li><a href="https://support.microsoft.com/en-us/windows/microsoft-edge-browsing-data-and-privacy-bb8174ba-9d73-dcf2-9b4a-c582b4e640dd" className="text-primary hover:underline">Microsoft Edge</a></li>
            <li><a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" className="text-primary hover:underline">Safari</a></li>
          </ul>
          
          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Changes to Our Cookie Policy</h2>
          <p>
            We may update our Cookie Policy from time to time. Any changes will be posted on this page, 
            and the "Last updated" date at the top will be revised accordingly. We encourage you to review 
            this Cookie Policy periodically to stay informed about how we use cookies.
          </p>
          
          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Contact Us</h2>
          <p>
            If you have any questions about our Cookie Policy, please contact us at:
          </p>
          <p className="mt-2">
          <strong>Email:</strong> privacy@grsventures.ltd<br />
          <strong>Address:</strong> 71-75 Shelton Street, London, WC2H 9JQ<br />
           <br />
          </p>
        </div>
      </div>
    </div>
  );
}
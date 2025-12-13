import { Link } from "wouter";

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
      
      <div className="prose prose-lg max-w-none">
        <p className="text-gray-600">
          Last Updated: April 1, 2025
        </p>
        
        <h2>1. Introduction</h2>
        <p>
          PersonalysisPro ("we," "our," or "us") respects your privacy and is committed to protecting it through our compliance with this policy. This policy describes the types of information we may collect from you or that you may provide when you use our personality assessment platform and our practices for collecting, using, maintaining, protecting, and disclosing that information.
        </p>
        
        <h2>2. Information We Collect</h2>
        <p>
          We collect several types of information from and about users of our platform, including:
        </p>
        <ul>
          <li>Personal information that you voluntarily provide when using our surveys (such as name, email address, demographic information)</li>
          <li>Information about your internet connection, the equipment you use to access our platform, and usage details</li>
          <li>Survey responses and assessment results</li>
          <li>Information collected through cookies and other tracking technologies</li>
        </ul>
        
        <h2>3. How We Use Your Information</h2>
        <p>
          We use information that we collect about you or that you provide to us:
        </p>
        <ul>
          <li>To present our platform and its contents to you</li>
          <li>To generate personality profiles and insights based on your survey responses</li>
          <li>To provide you with information, products, or services that you request from us</li>
          <li>To fulfill any other purpose for which you provide it</li>
          <li>To provide personalized content and recommendations</li>
          <li>To improve our platform and user experience</li>
          <li>To conduct research and analysis to enhance our assessment methodologies</li>
        </ul>
        
        <h2>4. Data Aggregation and Business Intelligence</h2>
        <p>
          For our business clients, we aggregate and anonymize data to provide business intelligence and market insights. All such data is:
        </p>
        <ul>
          <li>Stripped of personally identifiable information</li>
          <li>Combined with data from multiple users to prevent re-identification</li>
          <li>Used only for analytical purposes as specified in client agreements</li>
        </ul>
        
        <h2>5. Data Security</h2>
        <p>
          We have implemented measures designed to secure your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure. These measures include:
        </p>
        <ul>
          <li>Encryption of sensitive data at rest and in transit</li>
          <li>Regular security assessments and penetration testing</li>
          <li>Access controls and authentication protocols</li>
          <li>Employee training on data protection practices</li>
        </ul>
        
        <h2>6. Data Retention</h2>
        <p>
          We retain your personal information for as long as necessary to fulfill the purposes for which we collected it, including for the purposes of satisfying any legal, accounting, or reporting requirements. To determine the appropriate retention period, we consider the amount, nature, and sensitivity of the data, the potential risk of harm from unauthorized use or disclosure, and applicable legal requirements.
        </p>
        
        <h2>7. Your Rights</h2>
        <p>
          Depending on your location, you may have certain rights regarding your personal information, which may include:
        </p>
        <ul>
          <li>The right to access your personal information</li>
          <li>The right to correct inaccurate or incomplete information</li>
          <li>The right to delete your personal information</li>
          <li>The right to restrict or object to processing</li>
          <li>The right to data portability</li>
          <li>The right to withdraw consent</li>
        </ul>
        <p>
          To exercise any of these rights, please contact us using the information provided in the "Contact Us" section below.
        </p>
        
        <h2>8. Children's Privacy</h2>
        <p>
          Our platform is not intended for children under 16 years of age. We do not knowingly collect personal information from children under 16. If you are under 16, do not use or provide any information on our platform. If we learn we have collected or received personal information from a child under 16 without verification of parental consent, we will delete that information.
        </p>
        
        <h2>9. Changes to Our Privacy Policy</h2>
        <p>
          We may update our privacy policy from time to time. If we make material changes, we will notify you by email or through a notice on our platform prior to the change becoming effective.
        </p>
        
        <h2>10. Contact Us</h2>
        <p>
          If you have any questions or concerns about this privacy policy or our privacy practices, please contact us at:
        </p>
        <p className="ml-8">
        <strong>Email:</strong> privacy@grsventures.ltd<br />
        <strong>Address:</strong> 71-75 Shelton Street, London, WC2H 9JQ<br />
        </p>
      </div>
      
      <div className="mt-12 text-center">
        <Link href="/" className="text-primary hover:text-primary-dark font-medium">
          Return to Home
        </Link>
      </div>
    </div>
  );
}
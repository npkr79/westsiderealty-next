
import SEO from "@/components/common/SEO";
import Header from "@/components/layout/Header";
import FooterSection from "@/components/home/FooterSection";
import { Card, CardContent } from "@/components/ui/card";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Privacy Policy | RE/MAX Westside Realty"
        description="Privacy Policy for RE/MAX Westside Realty - Learn how we collect, use, and protect your personal information."
        canonicalUrl="https://www.westsiderealty.in/privacy-policy"
        type="article"
        siteName="RE/MAX Westside Realty"
      />

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-lg text-gray-600">
            <strong>Effective Date:</strong> 22/06/2023
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <p className="text-lg text-gray-700 mb-8">
            Westside Realty ("we", "our", or "us") is committed to protecting the privacy of our website visitors and clients. This Privacy Policy outlines how we collect, use, and protect your personal information when you visit or interact with our website: <strong><a href="https://www.westsiderealty.in" className="text-remax-red hover:underline">www.westsiderealty.in</a></strong>.
          </p>

          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
              <p className="text-gray-700 mb-4">We may collect the following types of information:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Personal Information</strong>: Name, phone number, email address, and other contact details submitted through inquiry or contact forms.</li>
                <li><strong>Property Preferences</strong>: Details you provide related to your property search, including budget, location preferences, etc.</li>
                <li><strong>Usage Data</strong>: Information automatically collected through analytics tools such as IP address, device type, browser, time spent on site, and pages visited.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">We use your information to:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Respond to your property inquiries or requests</li>
                <li>Provide updates on new listings and real estate services</li>
                <li>Improve our website and marketing effectiveness</li>
                <li>Contact you for follow-ups, site visit coordination, or investment opportunities</li>
                <li>Comply with legal and regulatory obligations</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Sharing of Information</h2>
              <p className="text-gray-700 mb-4">We <strong>do not sell, trade, or rent</strong> your personal information. We may share your details with:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Our internal team and verified business associates</li>
                <li>Builders, developers, or property owners (only when relevant to your inquiry)</li>
                <li>Service providers helping us operate the website or CRM tools (under confidentiality obligations)</li>
                <li>Legal or regulatory authorities when required</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Your Choices</h2>
              <p className="text-gray-700 mb-4">You can choose to:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Opt-out of receiving marketing communications by clicking "unsubscribe" in emails or notifying us directly</li>
                <li>Request access, correction, or deletion of your data by contacting us at <strong>info@westsiderealty.in</strong></li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
              <p className="text-gray-700">
                We take reasonable precautions to protect your information. However, no method of transmission over the internet or electronic storage is 100% secure.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Third-Party Links</h2>
              <p className="text-gray-700">
                Our website may contain links to external websites. We are not responsible for their content or privacy practices.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Updates to This Policy</h2>
              <p className="text-gray-700">
                We may update this policy from time to time. All changes will be posted on this page with an updated revision date.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about this Privacy Policy or need to exercise your data rights, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  📧 <strong>Email:</strong> info@westsiderealty.in<br />
                  📞 <strong>Phone:</strong> +91 9866085831<br />
                  📍 <strong>Address:</strong> 415, 4th Floor, Kokapet Terminal, Kokapet, Hyderabad – 500075
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <FooterSection />
    </div>
  );
};

export default PrivacyPolicy;

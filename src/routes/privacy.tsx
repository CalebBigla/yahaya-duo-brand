import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { site } from "@/lib/site";

const title = "Privacy Policy | Yahaya Travel and Trade Co Ltd";
const description =
  "How Yahaya Travel and Trade Co Ltd handles the information you share through this website and our enquiry forms.";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/privacy" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const lastUpdated = "January 2027";
  
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        subtitle="How we collect, use, and protect your personal information"
      />
      <section className="py-16">
        <div className="container-page max-w-3xl">
          <div className="rounded-lg border border-border bg-secondary/50 p-6 mb-8">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Last Updated:</strong> {lastUpdated}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              This Privacy Policy explains how Yahaya Travel and Trade Co Ltd (RC {site.rcNumber}) collects, uses, stores, and protects your personal information when you interact with our website or use our services.
            </p>
          </div>

          <div className="prose prose-sm max-w-none space-y-8">
            {/* Introduction */}
            <div>
              <h2 className="text-2xl font-bold text-primary mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Yahaya Travel and Trade Co Ltd is committed to protecting your privacy and handling your personal data in compliance with applicable Nigerian data protection laws. This policy applies to all personal information collected through our website, email, phone calls, WhatsApp messages, and in-person interactions at our office.
              </p>
            </div>

            {/* Information We Collect */}
            <div>
              <h2 className="text-2xl font-bold text-primary mb-4">2. Information We Collect</h2>
              
              <h3 className="text-lg font-bold text-primary mt-4 mb-2">2.1 Information You Provide Directly</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                When you contact us or request our services, we may collect:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Full name, phone number, email address</li>
                <li>Travel dates, destinations, and accommodation preferences</li>
                <li>Passport details, visa information, and travel documents</li>
                <li>Financial information for payment processing (bank details, transaction records)</li>
                <li>Business registration details, company information (for trade services)</li>
                <li>Product specifications, shipping addresses, and procurement requirements</li>
                <li>Any other information you voluntarily provide in enquiry forms or communications</li>
              </ul>

              <h3 className="text-lg font-bold text-primary mt-4 mb-2">2.2 Information Collected Automatically</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Our website does not use cookies or tracking technologies. We do not collect browsing data, IP addresses, or device information through this website.
              </p>

              <h3 className="text-lg font-bold text-primary mt-4 mb-2">2.3 WhatsApp Enquiry Forms</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our website enquiry forms use WhatsApp Web links. When you submit a form, the information is formatted into a WhatsApp message that opens on your device. <strong className="text-foreground">No data is stored on our website servers.</strong> You review and send the message yourself through WhatsApp. Once sent, the conversation is held in your WhatsApp chat with us and is subject to WhatsApp's privacy policy.
              </p>
            </div>

            {/* How We Use Your Information */}
            <div>
              <h2 className="text-2xl font-bold text-primary mb-4">3. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We use your personal information for the following purposes:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li><strong className="text-foreground">Service Delivery:</strong> Processing visa applications, booking flights and hotels, arranging travel packages, sourcing products, coordinating shipments, and fulfilling trade orders</li>
                <li><strong className="text-foreground">Communication:</strong> Responding to enquiries, providing quotes, sending booking confirmations, updating you on service progress, and resolving issues</li>
                <li><strong className="text-foreground">Payment Processing:</strong> Processing deposits, invoicing, and completing financial transactions</li>
                <li><strong className="text-foreground">Documentation:</strong> Preparing visa applications, customs declarations, shipping documents, and contracts</li>
                <li><strong className="text-foreground">Legal Compliance:</strong> Meeting regulatory requirements for travel agencies, import/export operations, and financial record-keeping</li>
                <li><strong className="text-foreground">Business Operations:</strong> Maintaining client records, managing referral commissions, and improving our services</li>
              </ul>
            </div>

            {/* Information Sharing */}
            <div>
              <h2 className="text-2xl font-bold text-primary mb-4">4. How We Share Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We share your personal information only when necessary to deliver our services or comply with legal obligations:
              </p>
              
              <h3 className="text-lg font-bold text-primary mt-4 mb-2">4.1 Service Providers and Partners</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li><strong className="text-foreground">Travel Services:</strong> Airlines, hotels, visa application centers, embassies, travel insurance providers, and tour operators</li>
                <li><strong className="text-foreground">Trade Services:</strong> Suppliers, manufacturers, freight forwarders, customs brokers, shipping companies, and logistics partners</li>
                <li><strong className="text-foreground">Payment Processors:</strong> Banks and payment service providers for transaction processing</li>
              </ul>

              <h3 className="text-lg font-bold text-primary mt-4 mb-2">4.2 Legal Requirements</h3>
              <p className="text-muted-foreground leading-relaxed">
                We may disclose your information to comply with Nigerian laws, respond to government requests, enforce our terms of service, or protect our rights and the safety of our clients.
              </p>

              <h3 className="text-lg font-bold text-primary mt-4 mb-2">4.3 No Sale of Personal Data</h3>
              <p className="text-muted-foreground leading-relaxed">
                We do not sell, rent, or trade your personal information to third parties for marketing purposes.
              </p>
            </div>

            {/* Data Security */}
            <div>
              <h2 className="text-2xl font-bold text-primary mb-4">5. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We implement reasonable security measures to protect your personal information:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Physical security at our office in Jimeta-Yola (restricted access to client files)</li>
                <li>Secure storage of documents containing sensitive information</li>
                <li>Password-protected digital records and encrypted communications where applicable</li>
                <li>Staff training on data protection and confidentiality</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                However, no method of transmission or storage is 100% secure. We cannot guarantee absolute security but commit to promptly addressing any security breaches.
              </p>
            </div>

            {/* Data Retention */}
            <div>
              <h2 className="text-2xl font-bold text-primary mb-4">6. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy and comply with legal obligations. Specifically:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mt-3">
                <li><strong className="text-foreground">Active Clients:</strong> Information is retained for the duration of our business relationship</li>
                <li><strong className="text-foreground">Transaction Records:</strong> Financial records are kept for at least 6 years as required by Nigerian tax and accounting laws</li>
                <li><strong className="text-foreground">Travel Documentation:</strong> Visa applications and travel records may be retained for reference or legal purposes</li>
                <li><strong className="text-foreground">Trade Documentation:</strong> Import/export records, shipping documents, and contracts are retained as required by Nigerian Customs Service regulations</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                After the retention period, we securely delete or anonymize your personal information.
              </p>
            </div>

            {/* Your Rights */}
            <div>
              <h2 className="text-2xl font-bold text-primary mb-4">7. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Under Nigerian data protection laws, you have the following rights:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li><strong className="text-foreground">Access:</strong> Request a copy of the personal information we hold about you</li>
                <li><strong className="text-foreground">Correction:</strong> Request correction of inaccurate or incomplete information</li>
                <li><strong className="text-foreground">Deletion:</strong> Request deletion of your personal data (subject to legal retention requirements)</li>
                <li><strong className="text-foreground">Objection:</strong> Object to processing of your personal data for specific purposes</li>
                <li><strong className="text-foreground">Withdrawal of Consent:</strong> Withdraw consent for data processing (may affect our ability to provide services)</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                To exercise any of these rights, contact us at{" "}
                <a href={`mailto:${site.email}`} className="font-semibold text-primary underline underline-offset-4">
                  {site.email}
                </a>{" "}
                or call{" "}
                <a href={`tel:${site.phones[0]}`} className="font-semibold text-primary underline underline-offset-4">
                  {site.phones[0]}
                </a>.
              </p>
            </div>

            {/* Third-Party Links */}
            <div>
              <h2 className="text-2xl font-bold text-primary mb-4">8. Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our website may contain links to third-party websites (airlines, hotels, embassies, WhatsApp). We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies before providing personal information.
              </p>
            </div>

            {/* Children's Privacy */}
            <div>
              <h2 className="text-2xl font-bold text-primary mb-4">9. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our services are not directed at children under 18. We do not knowingly collect personal information from minors without parental consent. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
              </p>
            </div>

            {/* Changes to Policy */}
            <div>
              <h2 className="text-2xl font-bold text-primary mb-4">10. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. The "Last Updated" date at the top of this page indicates when the policy was last revised. Continued use of our services after changes constitutes acceptance of the updated policy.
              </p>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-2xl font-bold text-primary mb-4">11. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                If you have questions, concerns, or requests regarding this Privacy Policy or how we handle your personal information, contact us:
              </p>
              <div className="rounded-lg border border-border bg-card p-5 space-y-2">
                <p className="text-sm">
                  <strong className="text-foreground">Company:</strong>{" "}
                  <span className="text-muted-foreground">{site.name}</span>
                </p>
                <p className="text-sm">
                  <strong className="text-foreground">Registration:</strong>{" "}
                  <span className="text-muted-foreground">RC {site.rcNumber}</span>
                </p>
                <p className="text-sm">
                  <strong className="text-foreground">Address:</strong>{" "}
                  <span className="text-muted-foreground">{site.addressLine}</span>
                </p>
                <p className="text-sm">
                  <strong className="text-foreground">Phone:</strong>{" "}
                  <a href={`tel:${site.phones[0]}`} className="text-primary hover:underline">
                    {site.phones[0]}
                  </a>
                </p>
                <p className="text-sm">
                  <strong className="text-foreground">Email:</strong>{" "}
                  <a href={`mailto:${site.email}`} className="text-primary hover:underline break-all">
                    {site.email}
                  </a>
                </p>
              </div>
            </div>

            {/* Consent */}
            <div className="rounded-lg border-2 border-accent/30 bg-accent-soft/30 p-6 mt-8">
              <h2 className="text-xl font-bold text-accent-foreground mb-3">Your Consent</h2>
              <p className="text-sm text-foreground/80 leading-relaxed">
                By using our website and services, you acknowledge that you have read and understood this Privacy Policy and consent to the collection, use, and sharing of your personal information as described herein.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

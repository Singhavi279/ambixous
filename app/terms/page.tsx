import type { Metadata } from "next"
import Link from "next/link"
import { LegalPage, Section } from "@/components/legal/legal-page"

export const metadata: Metadata = {
    title: "Terms & Conditions",
    description:
        "The terms governing your use of the Ambixous website and services, including the Creator Fellowship, ACE career studio, events, mentorship, and certificate and document services.",
    alternates: { canonical: "https://www.ambixous.in/terms" },
    openGraph: {
        title: "Terms & Conditions | Ambixous",
        description: "The terms governing your use of Ambixous services.",
        url: "https://www.ambixous.in/terms",
    },
}

const LAST_UPDATED = "10 June 2026"

export default function TermsPage() {
    return (
        <LegalPage
            title="Terms & Conditions"
            lastUpdated={LAST_UPDATED}
            intro={
                <>
                    These Terms &amp; Conditions (&ldquo;Terms&rdquo;) govern your access
                    to and use of the website{" "}
                    <Link href="/">www.ambixous.in</Link> and the services provided by{" "}
                    <strong>Ambixous Innovations LLP</strong> (&ldquo;Ambixous&rdquo;,
                    &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), including the
                    Creator Fellowship, ACE career studio, community programs, events,
                    mentor access, startup and brand-growth services, and certificate and
                    document services (together, the &ldquo;Services&rdquo;). By accessing
                    or using the Services, you agree to be bound by these Terms. If you do
                    not agree, please do not use the Services.
                </>
            }
        >
            <Section heading="1. Eligibility">
                <p>
                    You must be at least 18 years old, or 16 and above with the consent of
                    a parent or lawful guardian where permitted, and capable of forming a
                    binding contract under the Indian Contract Act, 1872, to use the
                    Services. By using the Services, you represent that you meet these
                    requirements and that the information you provide is accurate and
                    complete.
                </p>
            </Section>

            <Section heading="2. The Services">
                <p>
                    Ambixous operates a creator-entrepreneur community and education
                    platform. Depending on availability, the Services may include the
                    Creator Fellowship, the ACE career studio (mock interviews and resume
                    reviews), live community events, mentor access, startup and
                    brand-growth support, and the issuance and electronic signing of
                    certificates and program documents. We may add, modify, suspend, or
                    discontinue any part of the Services at any time without liability.
                </p>
            </Section>

            <Section heading="3. Accounts and sign-in">
                <p>
                    Certain features require you to sign in using Google authentication.
                    You are responsible for maintaining the confidentiality of your account
                    and for all activity that occurs under it. You agree to provide
                    accurate information and to notify us of any unauthorised use. Access to
                    administrative areas is restricted to authorised personnel only.
                </p>
            </Section>

            <Section heading="4. Acceptable use">
                <p>You agree not to:</p>
                <ul>
                    <li>use the Services for any unlawful, fraudulent, or harmful purpose;</li>
                    <li>
                        impersonate any person, misrepresent your identity, or provide false
                        information (including in signed documents);
                    </li>
                    <li>
                        upload content that infringes intellectual property, privacy, or
                        other rights, or that is defamatory, obscene, or otherwise
                        objectionable;
                    </li>
                    <li>
                        attempt to gain unauthorised access to, disrupt, or interfere with
                        the Services, servers, or networks;
                    </li>
                    <li>
                        use automated means to scrape or harvest data except as expressly
                        permitted; or
                    </li>
                    <li>violate any applicable law or these Terms.</li>
                </ul>
            </Section>

            <Section heading="5. Programs, agreements, and electronic signatures">
                <p>
                    Participation in programs such as the Creator Fellowship may require you
                    to review and sign agreements electronically. By uploading your
                    signature and submitting a document through the Services, you consent to
                    sign electronically and agree that your electronic signature, together
                    with the recorded timestamp and your submitted details, constitutes a
                    valid and binding signature under the Information Technology Act, 2000.
                    You confirm that the name, contact details, and signature you provide
                    are your own and accurate. A signed copy of each document will be
                    emailed to Ambixous and to the email address you used to sign, which
                    serves as a record of your consent.
                </p>
            </Section>

            <Section heading="6. Fees">
                <p>
                    Many of our Services, including ACE, are offered free of charge. Where a
                    Service carries a fee, the applicable amount and payment terms will be
                    communicated to you before you incur any charge. Unless stated
                    otherwise in a separate written agreement, fees once paid are
                    non-refundable except as required by law.
                </p>
            </Section>

            <Section heading="7. Intellectual property">
                <p>
                    The Services, including all content, text, graphics, logos, the
                    &ldquo;Ambixous&rdquo; and &ldquo;ACE&rdquo; brands, designs, and
                    software, are owned by or licensed to Ambixous and are protected by
                    applicable intellectual property laws. We grant you a limited,
                    non-exclusive, non-transferable, revocable licence to access and use the
                    Services for your personal, non-commercial use. You may not copy,
                    reproduce, distribute, or create derivative works without our prior
                    written consent. Content you submit remains yours, but you grant
                    Ambixous a licence to use it as necessary to provide and operate the
                    Services.
                </p>
            </Section>

            <Section heading="8. Third-party links and services">
                <p>
                    The Services may contain links to or integrations with third-party
                    websites and services (for example, Google, ACE, LinkedIn, Instagram,
                    YouTube, X, WhatsApp, and Commudle). We do not control and are not
                    responsible for the content, policies, or practices of any third party.
                    Your use of third-party services is governed by their respective terms.
                </p>
            </Section>

            <Section heading="9. Disclaimers">
                <p>
                    The Services are provided on an &ldquo;as is&rdquo; and &ldquo;as
                    available&rdquo; basis without warranties of any kind, whether express
                    or implied, including warranties of merchantability, fitness for a
                    particular purpose, and non-infringement. We do not warrant that the
                    Services will be uninterrupted, error-free, or secure. Mentorship,
                    career guidance, mock interviews, and program content are provided for
                    educational and developmental purposes and do not guarantee any
                    particular outcome, including employment, admission, funding, or
                    results.
                </p>
            </Section>

            <Section heading="10. Limitation of liability">
                <p>
                    To the maximum extent permitted by law, Ambixous and its partners,
                    employees, mentors, and affiliates shall not be liable for any indirect,
                    incidental, special, consequential, or punitive damages, or any loss of
                    profits, data, goodwill, or opportunity, arising out of or in connection
                    with your use of the Services. To the extent any liability cannot be
                    excluded, our total aggregate liability shall not exceed the amount you
                    paid to us (if any) for the relevant Service in the twelve months
                    preceding the claim.
                </p>
            </Section>

            <Section heading="11. Indemnity">
                <p>
                    You agree to indemnify and hold harmless Ambixous and its partners,
                    employees, and affiliates from any claims, damages, liabilities, costs,
                    and expenses (including reasonable legal fees) arising out of your use
                    of the Services, your breach of these Terms, or your violation of any
                    law or third-party right.
                </p>
            </Section>

            <Section heading="12. Termination">
                <p>
                    We may suspend or terminate your access to the Services at any time,
                    with or without notice, if we believe you have violated these Terms or
                    for any other reason. Upon termination, the provisions that by their
                    nature should survive (including intellectual property, disclaimers,
                    limitation of liability, and indemnity) will continue to apply.
                </p>
            </Section>

            <Section heading="13. Privacy">
                <p>
                    Your use of the Services is also governed by our{" "}
                    <Link href="/privacy-policy">Privacy Policy</Link>, which explains how
                    we collect, use, and protect your personal data.
                </p>
            </Section>

            <Section heading="14. Governing law and jurisdiction">
                <p>
                    These Terms are governed by the laws of India. Subject to any applicable
                    law, the courts at Delhi NCR, India shall have exclusive jurisdiction
                    over any disputes arising out of or relating to these Terms or the
                    Services.
                </p>
            </Section>

            <Section heading="15. Grievance redressal">
                <p>
                    For any complaints or concerns regarding the Services or these Terms,
                    please contact us at{" "}
                    <a href="mailto:hi.ambixous@gmail.com">hi.ambixous@gmail.com</a>. We
                    will endeavour to address grievances within the timelines required by
                    applicable law.
                </p>
            </Section>

            <Section heading="16. Changes to these Terms">
                <p>
                    We may revise these Terms from time to time. The &ldquo;Last
                    updated&rdquo; date above reflects the latest revision. Your continued
                    use of the Services after changes take effect constitutes acceptance of
                    the revised Terms.
                </p>
            </Section>

            <Section heading="17. Contact">
                <p>
                    Ambixous Innovations LLP, Delhi NCR, India. Email:{" "}
                    <a href="mailto:hi.ambixous@gmail.com">hi.ambixous@gmail.com</a>.
                </p>
            </Section>
        </LegalPage>
    )
}

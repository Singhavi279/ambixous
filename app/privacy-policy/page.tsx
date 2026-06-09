import type { Metadata } from "next"
import Link from "next/link"
import { LegalPage, Section } from "@/components/legal/legal-page"

export const metadata: Metadata = {
    title: "Privacy Policy",
    description:
        "How Ambixous Innovations LLP collects, uses, shares, and protects your personal data across the Ambixous website, Creator Fellowship, ACE, events, and certificate services.",
    alternates: { canonical: "https://www.ambixous.in/privacy-policy" },
    openGraph: {
        title: "Privacy Policy | Ambixous",
        description:
            "How Ambixous collects, uses, and protects your personal data.",
        url: "https://www.ambixous.in/privacy-policy",
    },
}

const LAST_UPDATED = "10 June 2026"

export default function PrivacyPolicyPage() {
    return (
        <LegalPage
            title="Privacy Policy"
            lastUpdated={LAST_UPDATED}
            intro={
                <>
                    This Privacy Policy explains how <strong>Ambixous Innovations LLP</strong>{" "}
                    (&ldquo;Ambixous&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or
                    &ldquo;our&rdquo;) collects, uses, discloses, and safeguards your
                    information when you visit{" "}
                    <Link href="/">www.ambixous.in</Link> and use our services,
                    including the Creator Fellowship, ACE career studio, community
                    programs, events, mentor access, and certificate and document
                    services (together, the &ldquo;Services&rdquo;). We are committed to
                    handling personal data in accordance with India&rsquo;s Digital
                    Personal Data Protection Act, 2023 (&ldquo;DPDP Act&rdquo;), the
                    Information Technology Act, 2000, and applicable rules.
                </>
            }
        >
            <Section heading="1. Who we are">
                <p>
                    Ambixous Innovations LLP is a limited liability partnership organised
                    under the laws of India and operating primarily in Delhi NCR, India.
                    For any privacy-related questions or requests, contact us at{" "}
                    <a href="mailto:hi.ambixous@gmail.com">hi.ambixous@gmail.com</a>.
                </p>
            </Section>

            <Section heading="2. Information we collect">
                <p>We collect the following categories of information:</p>
                <ul>
                    <li>
                        <strong>Account &amp; identity data.</strong> When you sign in with
                        Google (via Google OAuth), we receive your name, email address, and
                        profile picture associated with your Google account. We do not
                        receive your Google password.
                    </li>
                    <li>
                        <strong>Agreement &amp; signing data.</strong> When you sign program
                        documents (for example, the Creator Fellowship graduation
                        agreement), we collect your full name, phone number, email address,
                        an uploaded signature image, and a timestamp of when you signed.
                    </li>
                    <li>
                        <strong>Certificate data.</strong> For certificates we issue, we
                        process details such as recipient name, designation, domain, and
                        tenure dates.
                    </li>
                    <li>
                        <strong>Forms &amp; communications.</strong> Information you submit
                        through community sign-up forms (which may be hosted on Google
                        Forms), event registrations, or when you contact us by email or
                        messaging apps such as WhatsApp.
                    </li>
                    <li>
                        <strong>Usage &amp; device data.</strong> Through analytics and our
                        hosting infrastructure we may automatically collect IP address,
                        browser type, device information, pages viewed, referring URLs, and
                        similar diagnostic data.
                    </li>
                    <li>
                        <strong>Cookies &amp; similar technologies.</strong> See the
                        &ldquo;Cookies&rdquo; section below.
                    </li>
                </ul>
            </Section>

            <Section heading="3. How we use your information">
                <p>We use personal data to:</p>
                <ul>
                    <li>provide, operate, and maintain the Services;</li>
                    <li>
                        authenticate you, manage access, and secure accounts and admin
                        areas;
                    </li>
                    <li>
                        generate, sign, and deliver agreements, certificates, and related
                        documents, and email signed copies to you and to Ambixous;
                    </li>
                    <li>
                        administer the Creator Fellowship, ACE, events, mentorship, and
                        community programs;
                    </li>
                    <li>respond to your enquiries and provide support;</li>
                    <li>
                        understand and improve our website and Services through analytics;
                    </li>
                    <li>
                        comply with legal obligations and enforce our terms and policies.
                    </li>
                </ul>
            </Section>

            <Section heading="4. Legal basis and consent">
                <p>
                    We process your personal data on the basis of your consent and/or for
                    legitimate uses permitted under the DPDP Act, including providing a
                    service you have requested. Where we rely on consent, you may withdraw
                    it at any time by contacting us, though this will not affect processing
                    carried out before withdrawal. Some processing is necessary to perform
                    a service you ask for (for example, signing and emailing an agreement),
                    and withdrawing consent may mean we can no longer provide that service.
                </p>
            </Section>

            <Section heading="5. How we share your information">
                <p>
                    We do not sell your personal data. We share it only as described below:
                </p>
                <ul>
                    <li>
                        <strong>Service providers (data processors).</strong> We use trusted
                        third parties to run our Services, including: Google (Google OAuth
                        authentication, Google Analytics, and Google Forms), our website
                        hosting provider, and Google&rsquo;s Gmail service to send signed
                        documents and communications. These providers process data on our
                        behalf under their respective terms.
                    </li>
                    <li>
                        <strong>Program counterparties.</strong> Signed agreements are sent
                        to Ambixous and copied to the email address you used to sign.
                    </li>
                    <li>
                        <strong>Legal &amp; safety.</strong> We may disclose data if required
                        by law, regulation, legal process, or to protect the rights,
                        property, or safety of Ambixous, our users, or others.
                    </li>
                    <li>
                        <strong>Business transfers.</strong> If we are involved in a merger,
                        acquisition, or asset sale, data may be transferred as part of that
                        transaction, subject to this Policy.
                    </li>
                </ul>
            </Section>

            <Section heading="6. Third-party links and services">
                <p>
                    Our website links to third-party platforms such as ACE
                    (ace.ambixous.in), LinkedIn, Instagram, YouTube, X (Twitter), WhatsApp,
                    and Commudle. We are not responsible for the privacy practices of these
                    third parties. We encourage you to review their privacy policies before
                    sharing information with them.
                </p>
            </Section>

            <Section heading="7. Cookies and analytics">
                <p>
                    We use cookies and similar technologies, including Google Analytics, to
                    operate the site, remember your sign-in session, and understand how the
                    site is used. You can control cookies through your browser settings;
                    disabling some cookies may affect functionality such as staying signed
                    in. Google Analytics collects usage data subject to{" "}
                    <a
                        href="https://policies.google.com/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Google&rsquo;s Privacy Policy
                    </a>
                    .
                </p>
            </Section>

            <Section heading="8. Data retention">
                <p>
                    We retain personal data only for as long as necessary to fulfil the
                    purposes described in this Policy, including to provide the Services,
                    maintain records of signed agreements and issued certificates, comply
                    with legal and accounting obligations, and resolve disputes. When data
                    is no longer required, we delete or anonymise it.
                </p>
            </Section>

            <Section heading="9. How we protect your data">
                <p>
                    We implement reasonable technical and organisational security measures
                    to protect personal data against unauthorised access, alteration,
                    disclosure, or destruction. Access to administrative tools is
                    restricted to authorised personnel. However, no method of transmission
                    or storage is completely secure, and we cannot guarantee absolute
                    security.
                </p>
            </Section>

            <Section heading="10. Your rights">
                <p>
                    Subject to applicable law, including the DPDP Act, you have the right to:
                </p>
                <ul>
                    <li>access and obtain a summary of the personal data we hold about you;</li>
                    <li>request correction, completion, or updating of inaccurate data;</li>
                    <li>request erasure of your personal data where applicable;</li>
                    <li>withdraw consent previously given;</li>
                    <li>nominate another individual to exercise your rights in case of death or incapacity; and</li>
                    <li>raise a grievance regarding our handling of your data.</li>
                </ul>
                <p>
                    To exercise any of these rights, email us at{" "}
                    <a href="mailto:hi.ambixous@gmail.com">hi.ambixous@gmail.com</a>. We may
                    need to verify your identity before acting on a request.
                </p>
            </Section>

            <Section heading="11. Children's privacy">
                <p>
                    Our Services are intended for individuals aged 18 and above, or 16 and
                    above with verifiable consent of a parent or lawful guardian where
                    permitted. We do not knowingly collect personal data from children
                    contrary to applicable law. If you believe a child has provided us data
                    without appropriate consent, please contact us so we can take
                    appropriate action.
                </p>
            </Section>

            <Section heading="12. International data transfers">
                <p>
                    Some of our service providers (such as Google) may process data on
                    servers located outside India. Where data is transferred, we take steps
                    to ensure it is handled in line with this Policy and applicable law.
                </p>
            </Section>

            <Section heading="13. Grievance Officer">
                <p>
                    In accordance with the Information Technology Act, 2000 and the DPDP
                    Act, you may contact our Grievance Officer for any complaint regarding
                    the processing of your personal data:
                </p>
                <ul>
                    <li><strong>Entity:</strong> Ambixous Innovations LLP</li>
                    <li>
                        <strong>Email:</strong>{" "}
                        <a href="mailto:hi.ambixous@gmail.com">hi.ambixous@gmail.com</a>
                    </li>
                    <li><strong>Location:</strong> Delhi NCR, India</li>
                </ul>
                <p>
                    We will acknowledge and address grievances within the timelines
                    required by applicable law.
                </p>
            </Section>

            <Section heading="14. Changes to this Policy">
                <p>
                    We may update this Privacy Policy from time to time. The
                    &ldquo;Last updated&rdquo; date above reflects the latest revision.
                    Material changes will be posted on this page, and your continued use of
                    the Services after changes take effect constitutes acceptance of the
                    updated Policy.
                </p>
            </Section>

            <Section heading="15. Contact us">
                <p>
                    Questions about this Privacy Policy or our data practices? Email{" "}
                    <a href="mailto:hi.ambixous@gmail.com">hi.ambixous@gmail.com</a>. See
                    also our <Link href="/terms">Terms &amp; Conditions</Link>.
                </p>
            </Section>
        </LegalPage>
    )
}

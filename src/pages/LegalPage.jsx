import React, { useState } from 'react';

export default function LegalPage() {
  const [tab, setTab] = useState('terms');

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy)', marginBottom: 10, fontFamily: 'Sora, sans-serif' }}>{title}</h2>
      <div style={{ color: 'var(--gray-600)', fontSize: 15, lineHeight: 1.7 }}>{children}</div>
    </div>
  );

  const P = ({ children }) => <p style={{ marginBottom: 10 }}>{children}</p>;
  const UL = ({ items }) => (
    <ul style={{ paddingLeft: 20, marginBottom: 10 }}>
      {items.map((item, i) => <li key={i} style={{ marginBottom: 6 }}>{item}</li>)}
    </ul>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: 'var(--navy)', padding: '40px 24px 32px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: 28, fontFamily: 'Sora, sans-serif', fontWeight: 700, marginBottom: 8 }}>Legal</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15 }}>Last updated: May 2026</p>
          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
            {[['terms','Terms of Service'],['privacy','Privacy Policy']].map(([k,l]) => (
              <button key={k} onClick={() => setTab(k)} style={{
                padding: '8px 20px', borderRadius: 100, border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 600,
                background: tab === k ? 'var(--green)' : 'rgba(255,255,255,0.15)',
                color: 'white'
              }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>

        {tab === 'terms' && (
          <div>
            <Section title="1. Acceptance of Terms">
              <P>By accessing or using Volunteer ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform.</P>
              <P>Volunteer is a marketplace that connects customers seeking services with independent service providers. We are not a party to any agreement between customers and providers.</P>
            </Section>

            <Section title="2. User Accounts">
              <P>You must create an account to use most features of the Platform. You are responsible for:</P>
              <UL items={[
                'Maintaining the confidentiality of your login credentials',
                'All activity that occurs under your account',
                'Providing accurate and current information',
                'Being at least 18 years of age to create an account'
              ]} />
              <P>We reserve the right to suspend or terminate accounts that violate these terms.</P>
            </Section>

            <Section title="3. Service Providers">
              <P>If you register as a service provider, you agree that:</P>
              <UL items={[
                'You are an independent contractor, not an employee of Volunteer',
                'You are responsible for the quality and safety of your services',
                'You will maintain any required licenses, certifications, or insurance',
                'You will honor bookings you accept in a timely and professional manner',
                'Volunteer takes no responsibility for the outcome of any service performed'
              ]} />
            </Section>

            <Section title="4. Customers">
              <P>As a customer, you agree to:</P>
              <UL items={[
                'Provide accurate information when submitting a booking request',
                'Treat service providers with respect',
                'Pay agreed-upon amounts for completed services',
                'Not attempt to solicit providers to work outside of the Platform to avoid fees'
              ]} />
            </Section>

            <Section title="5. Prohibited Conduct">
              <P>You may not use the Platform to:</P>
              <UL items={[
                'Post false, misleading, or fraudulent content',
                'Harass, threaten, or intimidate other users',
                'Engage in any illegal activity',
                'Circumvent the Platform\'s booking or payment systems',
                'Scrape, copy, or redistribute Platform content without permission',
                'Impersonate another person or entity'
              ]} />
            </Section>

            <Section title="6. Limitation of Liability">
              <P>Volunteer is a technology platform that facilitates connections between users. We do not employ service providers and are not responsible for the actions, quality, or safety of any services performed.</P>
              <P>To the fullest extent permitted by law, Volunteer shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform.</P>
            </Section>

            <Section title="7. Dispute Resolution">
              <P>Disputes between customers and providers are between those parties directly. Volunteer may, at its discretion, attempt to mediate disputes but is not obligated to do so.</P>
              <P>Any legal disputes with Volunteer shall be resolved through binding arbitration in the state of South Carolina.</P>
            </Section>

            <Section title="8. Changes to Terms">
              <P>We may update these Terms at any time. Continued use of the Platform after changes are posted constitutes acceptance of the revised Terms.</P>
            </Section>

            <Section title="9. Contact">
              <P>Questions about these Terms? Contact us at <strong>support@getvolunteer.app</strong></P>
            </Section>
          </div>
        )}

        {tab === 'privacy' && (
          <div>
            <Section title="1. Information We Collect">
              <P>We collect information you provide directly, including:</P>
              <UL items={[
                'Name, email address, and password when you register',
                'Profile information such as bio, skills, and profile photo',
                'Location data (zip code, and optionally GPS coordinates for map features)',
                'Booking details and messages sent through the Platform',
                'Phone number if you opt in to SMS notifications'
              ]} />
              <P>We also collect usage data automatically, such as pages visited, device type, and IP address.</P>
            </Section>

            <Section title="2. How We Use Your Information">
              <P>We use your information to:</P>
              <UL items={[
                'Operate and improve the Platform',
                'Match customers with nearby service providers',
                'Send booking confirmations, updates, and notifications',
                'Respond to customer support requests',
                'Detect and prevent fraud or abuse',
                'Send marketing communications (you may opt out at any time)'
              ]} />
            </Section>

            <Section title="3. Sharing Your Information">
              <P>We do not sell your personal information. We may share your information with:</P>
              <UL items={[
                'Other users as needed to facilitate bookings (e.g. your name and general location to matched providers)',
                'Service providers who help us operate the Platform (e.g. Supabase for database, Resend for email)',
                'Law enforcement or legal authorities when required by law',
                'A successor entity in the event of a merger or acquisition'
              ]} />
            </Section>

            <Section title="4. Location Data">
              <P>If you enable location services, we use your GPS coordinates to show you nearby providers on the map. This data is not shared with other users in precise form — providers only see their own location on the map, and customers see approximate areas.</P>
              <P>You can disable location access in your browser or device settings at any time.</P>
            </Section>

            <Section title="5. Data Storage & Security">
              <P>Your data is stored securely using Supabase, which is hosted on AWS infrastructure. We use row-level security policies to ensure users can only access data they are authorized to view.</P>
              <P>We take reasonable steps to protect your information but cannot guarantee absolute security of data transmitted over the internet.</P>
            </Section>

            <Section title="6. Your Rights">
              <P>You have the right to:</P>
              <UL items={[
                'Access the personal information we hold about you',
                'Request correction of inaccurate data',
                'Request deletion of your account and associated data',
                'Opt out of marketing emails at any time via the unsubscribe link',
                'Disable SMS notifications in your account settings'
              ]} />
              <P>To exercise these rights, contact us at <strong>support@getvolunteer.app</strong></P>
            </Section>

            <Section title="7. Cookies">
              <P>We use session cookies and local storage to keep you logged in and remember your preferences (such as dark mode). We do not use third-party advertising cookies.</P>
            </Section>

            <Section title="8. Children's Privacy">
              <P>The Platform is not intended for users under 18. We do not knowingly collect personal information from minors. If you believe a minor has created an account, please contact us immediately.</P>
            </Section>

            <Section title="9. Changes to This Policy">
              <P>We may update this Privacy Policy from time to time. We will notify registered users of significant changes via email.</P>
            </Section>

            <Section title="10. Contact">
              <P>Questions about your privacy? Contact us at <strong>support@getvolunteer.app</strong></P>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

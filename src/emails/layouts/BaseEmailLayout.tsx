import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface BaseEmailLayoutProps {
  previewText: string;
  children: React.ReactNode;
}

export const BaseEmailLayout: React.FC<BaseEmailLayoutProps> = ({
  previewText,
  children,
}) => {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>CivicFix</Heading>
            <Text style={tagline}>Civic Infrastructure Reporting</Text>
          </Section>

          {/* Content area */}
          <Section style={content}>{children}</Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              CivicFix — Civic Infrastructure Reporting
            </Text>
            <Text style={footerText}>
              123 Civic Center Drive, Suite 100, City, State 12345
            </Text>
            <Text style={footerLinks}>
              <a href="{{unsubscribe_url}}" style={footerLink}>
                Unsubscribe
              </a>{' '}
              •{' '}
              <a href="{{privacy_url}}" style={footerLink}>
                Privacy Policy
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default BaseEmailLayout;

// ─── Styles ───────────────────────────────────────────────────────────────────

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '40px auto',
  padding: '0',
  borderRadius: '8px',
  boxShadow: '0 4px 6px -1px rgba(15,23,42,0.08)',
  maxWidth: '600px',
  overflow: 'hidden',
};

const header = {
  backgroundColor: '#0F172A',
  padding: '32px 40px',
  textAlign: 'center' as const,
};

const logo = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  fontFamily: '"Sora", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  margin: '0',
  letterSpacing: '-0.025em',
};

const tagline = {
  color: '#94A3B8',
  fontSize: '14px',
  margin: '4px 0 0',
};

const content = {
  padding: '40px',
};

const hr = {
  borderColor: '#e2e8f0',
  margin: '0',
};

const footer = {
  backgroundColor: '#f8fafc',
  padding: '32px 40px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#64748b',
  fontSize: '13px',
  margin: '0 0 8px',
};

const footerLinks = {
  margin: '16px 0 0',
  fontSize: '13px',
};

const footerLink = {
  color: '#64748b',
  textDecoration: 'underline',
};

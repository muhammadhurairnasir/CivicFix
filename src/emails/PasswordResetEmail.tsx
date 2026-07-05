import { Button, Heading, Text, Section } from '@react-email/components';
import * as React from 'react';
import BaseEmailLayout from './layouts/BaseEmailLayout';

interface PasswordResetEmailProps {
  name: string;
  resetUrl: string;
  expiresIn?: string;
}

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({
  name = 'Citizen',
  resetUrl = 'https://civicfix.com/reset-password?token=123',
  expiresIn = '1 hour',
}) => {
  return (
    <BaseEmailLayout previewText="Reset your CivicFix password">
      <Heading style={heading}>Reset your password</Heading>
      
      <Text style={paragraph}>Hi {name},</Text>
      <Text style={paragraph}>
        We received a request to reset the password for your CivicFix account. 
        Click the button below to choose a new password.
      </Text>

      <Section style={btnContainer}>
        <Button style={button} href={resetUrl}>
          Reset Password
        </Button>
      </Section>

      <Section style={warningBox}>
        <Text style={warningText}>
          <strong>Security Notice:</strong> If you didn't request a password reset, 
          your account may be at risk. Please contact support immediately.
        </Text>
      </Section>

      <Text style={securityNote}>
        This link expires in {expiresIn}.
      </Text>

      <Text style={fallbackText}>
        Or copy and paste this link into your browser:
        <br />
        <a href={resetUrl} style={fallbackLink}>{resetUrl}</a>
      </Text>
    </BaseEmailLayout>
  );
};

export default PasswordResetEmail;

const heading = {
  fontSize: '24px',
  letterSpacing: '-0.5px',
  lineHeight: '1.3',
  fontWeight: '600',
  color: '#0F172A',
  padding: '0',
  marginTop: '0',
  marginBottom: '24px',
};

const paragraph = {
  margin: '0 0 16px',
  fontSize: '16px',
  lineHeight: '24px',
  color: '#334155',
};

const btnContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#2563EB',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
  fontWeight: '600',
};

const warningBox = {
  backgroundColor: '#FEF2F2',
  border: '1px solid #FCA5A5',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '24px',
};

const warningText = {
  color: '#991B1B',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
};

const securityNote = {
  fontSize: '14px',
  color: '#64748B',
  margin: '0 0 24px',
  lineHeight: '20px',
};

const fallbackText = {
  fontSize: '14px',
  color: '#64748B',
  wordBreak: 'break-all' as const,
};

const fallbackLink = {
  color: '#2563EB',
  textDecoration: 'underline',
  marginTop: '4px',
  display: 'block',
};

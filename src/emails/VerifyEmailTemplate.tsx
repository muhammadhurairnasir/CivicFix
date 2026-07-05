import { Button, Heading, Text, Section } from '@react-email/components';
import * as React from 'react';
import BaseEmailLayout from './layouts/BaseEmailLayout';

interface VerifyEmailTemplateProps {
  name: string;
  verifyUrl: string;
  expiresIn?: string;
}

export const VerifyEmailTemplate: React.FC<VerifyEmailTemplateProps> = ({
  name = 'Citizen',
  verifyUrl = 'https://civicfix.com/verify?token=123',
  expiresIn = '24 hours',
}) => {
  return (
    <BaseEmailLayout previewText="Verify your email address for CivicFix">
      <Heading style={heading}>Verify your email address</Heading>
      
      <Text style={paragraph}>Hi {name},</Text>
      <Text style={paragraph}>
        Welcome to CivicFix! Please click the button below to verify your email address 
        and activate your account.
      </Text>

      <Section style={btnContainer}>
        <Button style={button} href={verifyUrl}>
          Verify Email Address
        </Button>
      </Section>

      <Text style={securityNote}>
        This link expires in {expiresIn}. If you didn't create an account with CivicFix, 
        you can safely ignore this email.
      </Text>

      <Text style={fallbackText}>
        Or copy and paste this link into your browser:
        <br />
        <a href={verifyUrl} style={fallbackLink}>{verifyUrl}</a>
      </Text>
    </BaseEmailLayout>
  );
};

export default VerifyEmailTemplate;

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

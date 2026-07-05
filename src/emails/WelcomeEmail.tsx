import { Button, Heading, Text } from '@react-email/components';
import * as React from 'react';
import BaseEmailLayout from './layouts/BaseEmailLayout';

interface WelcomeEmailProps {
  name: string;
  loginUrl: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  name = 'Citizen',
  loginUrl = 'https://civicfix.com/login',
}) => {
  return (
    <BaseEmailLayout previewText={`Welcome to CivicFix, ${name}!`}>
      <Heading style={heading}>Welcome to CivicFix, {name}</Heading>
      
      <Text style={paragraph}>
        We're thrilled to have you join our community. CivicFix empowers you to connect 
        directly with your local government to report, track, and resolve infrastructure issues.
      </Text>

      <div style={featuresContainer}>
        <Text style={featureItem}>
          <strong>📝 Submit Reports</strong>
          <br />Easily document potholes, broken streetlights, and other hazards with photos and precise locations.
        </Text>
        <Text style={featureItem}>
          <strong>📍 Track Progress</strong>
          <br />Watch your reports move from submitted to resolved with a transparent public timeline.
        </Text>
        <Text style={featureItem}>
          <strong>🔔 Get Notified</strong>
          <br />Receive real-time updates when a crew is dispatched or your issue is fixed.
        </Text>
      </div>

      <div style={btnContainer}>
        <Button style={button} href={loginUrl}>
          Go to Dashboard
        </Button>
      </div>
    </BaseEmailLayout>
  );
};

export default WelcomeEmail;

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
  margin: '0 0 24px',
  fontSize: '16px',
  lineHeight: '24px',
  color: '#334155',
};

const featuresContainer = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '24px',
  marginBottom: '32px',
};

const featureItem = {
  margin: '0 0 16px',
  fontSize: '15px',
  lineHeight: '24px',
  color: '#475569',
};

const btnContainer = {
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#0F172A',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  fontWeight: '600',
};

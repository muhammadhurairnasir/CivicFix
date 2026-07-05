import { Button, Heading, Text, Section, Row, Column } from '@react-email/components';
import * as React from 'react';
import BaseEmailLayout from './layouts/BaseEmailLayout';

interface NewCommentEmailProps {
  name: string;
  commenterName: string;
  isOfficial?: boolean;
  commentText: string;
  reportTitle: string;
  ticketNumber: string;
  reportUrl: string;
}

export const NewCommentEmail: React.FC<NewCommentEmailProps> = ({
  name = 'Citizen',
  commenterName = 'Jane Doe',
  isOfficial = false,
  commentText = 'We have inspected the site and repairs will begin tomorrow morning.',
  reportTitle = 'Large Pothole on Main St',
  ticketNumber = 'TKT-123456',
  reportUrl = 'https://civicfix.com/reports/123',
}) => {
  return (
    <BaseEmailLayout previewText={`New comment on ${ticketNumber}`}>
      {isOfficial ? (
        <Heading style={heading}>
          Official response on your report
          <span style={officialBadge}>OFFICIAL</span>
        </Heading>
      ) : (
        <Heading style={heading}>New comment on your report</Heading>
      )}
      
      <Text style={paragraph}>Hi {name},</Text>
      <Text style={paragraph}>
        <strong>{commenterName}</strong> left a new comment on your report "
        <em>{reportTitle}</em>" ({ticketNumber}).
      </Text>

      {/* Blockquote for comment */}
      <Section style={commentBox}>
        <Text style={commentBoxText}>"{commentText}"</Text>
      </Section>

      <Section style={btnContainer}>
        <Button style={button} href={reportUrl}>
          View Full Discussion
        </Button>
      </Section>
    </BaseEmailLayout>
  );
};

export default NewCommentEmail;

const heading = {
  fontSize: '22px',
  letterSpacing: '-0.5px',
  lineHeight: '1.3',
  fontWeight: '600',
  color: '#0F172A',
  padding: '0',
  marginTop: '0',
  marginBottom: '24px',
};

const officialBadge = {
  display: 'inline-block',
  marginLeft: '12px',
  backgroundColor: '#0F172A',
  color: '#ffffff',
  fontSize: '11px',
  fontWeight: 'bold',
  padding: '4px 8px',
  borderRadius: '4px',
  verticalAlign: 'middle',
  letterSpacing: '1px',
};

const paragraph = {
  margin: '0 0 16px',
  fontSize: '16px',
  lineHeight: '24px',
  color: '#334155',
};

const commentBox = {
  backgroundColor: '#F8FAFC',
  borderLeft: '4px solid #CBD5E1',
  padding: '16px 20px',
  marginBottom: '32px',
  marginTop: '24px',
  borderRadius: '0 8px 8px 0',
};

const commentBoxText = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#0F172A',
  margin: '0',
  fontStyle: 'italic',
};

const btnContainer = {
  textAlign: 'center' as const,
  margin: '32px 0 16px',
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

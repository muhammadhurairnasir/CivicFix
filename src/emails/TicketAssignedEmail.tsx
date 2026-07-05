import { Button, Heading, Text, Section } from '@react-email/components';
import * as React from 'react';
import BaseEmailLayout from './layouts/BaseEmailLayout';

interface TicketAssignedEmailProps {
  crewName: string;
  reportTitle: string;
  ticketNumber: string;
  address: string;
  priority: string;
  slaDeadline: string;
  dashboardUrl: string;
  reportType?: string;
  severity?: string;
  ward?: string;
  description?: string;
}

export const TicketAssignedEmail: React.FC<TicketAssignedEmailProps> = ({
  crewName = 'Crew Member',
  reportTitle = 'Large Pothole on Main St',
  ticketNumber = 'TKT-123456',
  address = '123 Main St, Cityville',
  priority = 'P1_URGENT',
  slaDeadline = new Date().toLocaleString(),
  dashboardUrl = 'https://civicfix.com/crew',
  reportType = 'Road Defect',
  severity = 'High',
  ward = 'North Ward',
  description = 'Deep pothole causing vehicle damage.',
}) => {
  
  const isUrgent = priority.startsWith('P1');
  const alertColor = isUrgent ? '#DC2626' : '#EA580C'; // Red for P1, Orange for others
  const alertBg = isUrgent ? '#FEF2F2' : '#FFF7ED';
  const alertBorder = isUrgent ? '#FCA5A5' : '#FDBA74';

  const formatPriority = (p: string) => p.replace('_', ' ');

  return (
    <BaseEmailLayout previewText={`New ticket assigned: ${ticketNumber}`}>
      <Heading style={heading}>New repair ticket assigned to you</Heading>
      
      <Text style={paragraph}>Hi {crewName},</Text>
      <Text style={paragraph}>
        You have been assigned a new repair ticket. Please review the details below 
        and take action as soon as possible.
      </Text>

      {/* Priority Alert Box */}
      <Section style={{ ...alertBox, backgroundColor: alertBg, borderColor: alertBorder }}>
        <Text style={{ ...alertText, color: alertColor }}>
          <strong>Priority:</strong> {formatPriority(priority)}
        </Text>
        <Text style={{ ...alertText, color: alertColor }}>
          <strong>SLA Deadline:</strong> {slaDeadline}
        </Text>
      </Section>

      {/* Report Summary Box */}
      <Section style={summaryBox}>
        <Text style={summaryTitle}>Ticket Details: {ticketNumber}</Text>
        
        <Text style={summaryItem}><strong>Issue:</strong> {reportTitle}</Text>
        <Text style={summaryItem}><strong>Location:</strong> {address}</Text>
        
        {reportType && <Text style={summaryItem}><strong>Type:</strong> {reportType}</Text>}
        {severity && <Text style={summaryItem}><strong>Severity:</strong> {severity}</Text>}
        {ward && <Text style={summaryItem}><strong>Ward:</strong> {ward}</Text>}
        
        {description && (
          <div style={{ marginTop: '12px' }}>
            <Text style={summaryItem}><strong>Description:</strong></Text>
            <Text style={{ ...summaryItem, color: '#475569', marginTop: '4px' }}>
              {description}
            </Text>
          </div>
        )}
      </Section>

      <Text style={noteText}>
        💡 <strong>Note:</strong> Please remember to update your ticket status (En Route, 
        Active, Completed) in the dashboard as you work to keep citizens informed.
      </Text>

      <Section style={btnContainer}>
        <Button style={button} href={dashboardUrl}>
          View Ticket in Dashboard
        </Button>
      </Section>
    </BaseEmailLayout>
  );
};

export default TicketAssignedEmail;

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

const paragraph = {
  margin: '0 0 16px',
  fontSize: '16px',
  lineHeight: '24px',
  color: '#334155',
};

const alertBox = {
  border: '1px solid',
  borderRadius: '8px',
  padding: '16px 20px',
  marginBottom: '24px',
};

const alertText = {
  fontSize: '15px',
  margin: '0 0 4px',
};

const summaryBox = {
  backgroundColor: '#F8FAFC',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '24px',
  border: '1px solid #E2E8F0',
};

const summaryTitle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#0F172A',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 16px',
  borderBottom: '1px solid #E2E8F0',
  paddingBottom: '8px',
};

const summaryItem = {
  fontSize: '14px',
  color: '#0F172A',
  margin: '0 0 8px',
  lineHeight: '1.5',
};

const noteText = {
  fontSize: '14px',
  color: '#64748B',
  backgroundColor: '#F1F5F9',
  padding: '12px 16px',
  borderRadius: '6px',
  margin: '0 0 24px',
  lineHeight: '1.5',
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

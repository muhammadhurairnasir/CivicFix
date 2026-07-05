import { Button, Heading, Text, Section, Row, Column } from '@react-email/components';
import * as React from 'react';
import BaseEmailLayout from './layouts/BaseEmailLayout';

interface ReportStatusEmailProps {
  name: string;
  ticketNumber: string;
  reportTitle: string;
  address: string;
  oldStatus?: string;
  newStatus: string;
  reportUrl: string;
  note?: string;
}

const getHeading = (status: string) => {
  switch (status.toLowerCase()) {
    case 'assigned':
    case 'dispatched':
    case 'en_route':
      return 'Your report has been assigned to a crew';
    case 'in_progress':
    case 'active':
      return 'Repair work has started on your report';
    case 'resolved':
    case 'completed':
      return 'Your road defect has been fixed! ✅';
    case 'rejected':
    case 'blocked':
      return 'Update on your report';
    default:
      return 'Status update on your report';
  }
};

const STEPS = [
  { id: 'open', label: 'Open' },
  { id: 'assigned', label: 'Assigned' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'resolved', label: 'Resolved' },
];

export const ReportStatusEmail: React.FC<ReportStatusEmailProps> = ({
  name = 'Citizen',
  ticketNumber = 'TKT-123456',
  reportTitle = 'Large Pothole on Main St',
  address = '123 Main St, Cityville',
  newStatus = 'in_progress',
  reportUrl = 'https://civicfix.com/reports/123',
  note,
}) => {
  const normalizedStatus = newStatus.toLowerCase();
  
  // Map internal ticket statuses to the 4 main citizen-facing phases
  let activeStepId = 'open';
  if (['assigned', 'dispatched', 'en_route'].includes(normalizedStatus)) activeStepId = 'assigned';
  if (['in_progress', 'active'].includes(normalizedStatus)) activeStepId = 'in_progress';
  if (['resolved', 'completed'].includes(normalizedStatus)) activeStepId = 'resolved';

  const isResolved = activeStepId === 'resolved';

  return (
    <BaseEmailLayout previewText={`Update for ticket ${ticketNumber}`}>
      <Heading style={heading}>{getHeading(newStatus)}</Heading>
      
      <Text style={paragraph}>Hi {name},</Text>
      
      {isResolved ? (
        <Text style={paragraph}>
          Great news! The issue you reported has been successfully resolved by our city crews. 
          Thank you for taking the time to report this and helping improve your city!
        </Text>
      ) : (
        <Text style={paragraph}>
          There is an update on your recent report. You can see the current progress below.
        </Text>
      )}

      {/* Report Summary Box */}
      <Section style={summaryBox}>
        <Text style={summaryTitle}>Report Details</Text>
        <Text style={summaryItem}><strong>Ticket:</strong> {ticketNumber}</Text>
        <Text style={summaryItem}><strong>Issue:</strong> {reportTitle}</Text>
        <Text style={summaryItem}><strong>Location:</strong> {address}</Text>
      </Section>

      {/* Stepper Component (Table-based) */}
      <Section style={stepperContainer}>
        <Row>
          {STEPS.map((step, index) => {
            const isActive = step.id === activeStepId;
            const isPast = STEPS.findIndex(s => s.id === activeStepId) > index;
            
            let color = '#94A3B8'; // default grey
            if (isActive) color = '#0F172A'; // active navy
            if (isPast) color = '#2563EB'; // past blue

            return (
              <Column key={step.id} style={{ width: '25%', textAlign: 'center' }}>
                <div style={{ ...stepDot, backgroundColor: color }}>
                  {isPast ? '✓' : (index + 1)}
                </div>
                <Text style={{ ...stepLabel, color: isActive ? '#0F172A' : '#64748B', fontWeight: isActive ? '600' : '400' }}>
                  {step.label}
                </Text>
              </Column>
            );
          })}
        </Row>
      </Section>

      {note && (
        <Section style={noteBox}>
          <Text style={noteTitle}>Official Update</Text>
          <Text style={noteText}>"{note}"</Text>
        </Section>
      )}

      <Section style={btnContainer}>
        <Button style={button} href={reportUrl}>
          Track Your Report
        </Button>
      </Section>
    </BaseEmailLayout>
  );
};

export default ReportStatusEmail;

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

const summaryBox = {
  backgroundColor: '#F8FAFC',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '32px',
  border: '1px solid #E2E8F0',
};

const summaryTitle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#0F172A',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 12px',
};

const summaryItem = {
  fontSize: '15px',
  color: '#334155',
  margin: '0 0 8px',
  lineHeight: '1.5',
};

const stepperContainer = {
  margin: '32px 0',
  width: '100%',
};

const stepDot = {
  width: '24px',
  height: '24px',
  borderRadius: '12px',
  color: '#fff',
  fontSize: '12px',
  lineHeight: '24px',
  textAlign: 'center' as const,
  margin: '0 auto 8px',
  fontWeight: 'bold',
};

const stepLabel = {
  fontSize: '12px',
  margin: '0',
};

const noteBox = {
  backgroundColor: '#EFF6FF',
  borderLeft: '4px solid #3B82F6',
  padding: '16px 20px',
  marginBottom: '32px',
};

const noteTitle = {
  fontSize: '13px',
  fontWeight: '600',
  color: '#1E3A8A',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 8px',
};

const noteText = {
  fontSize: '15px',
  color: '#1E40AF',
  margin: '0',
  fontStyle: 'italic',
};

const btnContainer = {
  textAlign: 'center' as const,
  margin: '32px 0 16px',
};

const button = {
  backgroundColor: '#0F172A',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
  fontWeight: '600',
};

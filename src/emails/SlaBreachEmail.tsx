import { Button, Heading, Text, Section, Row, Column } from '@react-email/components';
import * as React from 'react';
import BaseEmailLayout from './layouts/BaseEmailLayout';

export interface BreachedTicket {
  ticketNumber: string;
  reportTitle: string;
  assignedTo: string;
  hoursOverdue: string | number;
}

interface SlaBreachEmailProps {
  adminName: string;
  breachedTickets: BreachedTicket[];
  dashboardUrl?: string;
}

export const SlaBreachEmail: React.FC<SlaBreachEmailProps> = ({
  adminName = 'Admin',
  breachedTickets = [
    {
      ticketNumber: 'TKT-123',
      reportTitle: 'Large Pothole',
      assignedTo: 'John Doe',
      hoursOverdue: '2.5',
    }
  ],
  dashboardUrl = 'https://civicfix.com/admin/tickets',
}) => {
  return (
    <BaseEmailLayout previewText={`${breachedTickets.length} ticket(s) breached SLA`}>
      <Section style={alertBanner}>
        <Heading style={alertHeading}>⚠️ SLA Breach Alert — Action Required</Heading>
      </Section>
      
      <Text style={paragraph}>Hi {adminName},</Text>
      <Text style={paragraph}>
        The following {breachedTickets.length === 1 ? 'ticket has' : 'tickets have'} breached 
        their Service Level Agreement (SLA) deadline. Immediate review and action are required.
      </Text>

      <Section style={tableContainer}>
        {/* Table Header */}
        <Row style={tableHeaderRow}>
          <Column style={th}>Ticket</Column>
          <Column style={th}>Issue</Column>
          <Column style={th}>Assigned Crew</Column>
          <Column style={{ ...th, textAlign: 'right' }}>Overdue By</Column>
        </Row>
        
        {/* Table Body */}
        {breachedTickets.map((ticket, index) => {
          const isLast = index === breachedTickets.length - 1;
          return (
            <Row key={ticket.ticketNumber} style={isLast ? tdRowLast : tdRow}>
              <Column style={td}>
                <strong>{ticket.ticketNumber}</strong>
              </Column>
              <Column style={td}>{ticket.reportTitle}</Column>
              <Column style={td}>{ticket.assignedTo || 'Unassigned'}</Column>
              <Column style={{ ...td, color: '#DC2626', fontWeight: 'bold', textAlign: 'right' }}>
                {ticket.hoursOverdue}h
              </Column>
            </Row>
          );
        })}
      </Section>

      <Section style={btnContainer}>
        <Button style={button} href={dashboardUrl}>
          Open Admin Dashboard
        </Button>
      </Section>
    </BaseEmailLayout>
  );
};

export default SlaBreachEmail;

const alertBanner = {
  backgroundColor: '#DC2626',
  padding: '16px',
  borderRadius: '8px',
  marginBottom: '24px',
  textAlign: 'center' as const,
};

const alertHeading = {
  fontSize: '20px',
  letterSpacing: '-0.5px',
  fontWeight: '600',
  color: '#ffffff',
  margin: '0',
};

const paragraph = {
  margin: '0 0 16px',
  fontSize: '16px',
  lineHeight: '24px',
  color: '#334155',
};

const tableContainer = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  borderSpacing: '0',
  marginBottom: '32px',
  backgroundColor: '#ffffff',
  border: '1px solid #E2E8F0',
  borderRadius: '8px',
  overflow: 'hidden',
};

const tableHeaderRow = {
  backgroundColor: '#F8FAFC',
  borderBottom: '1px solid #E2E8F0',
};

const th = {
  padding: '12px 16px',
  textAlign: 'left' as const,
  fontSize: '12px',
  fontWeight: '600',
  color: '#64748B',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const tdRow = {
  borderBottom: '1px solid #E2E8F0',
};

const tdRowLast = {
  borderBottom: 'none',
};

const td = {
  padding: '12px 16px',
  fontSize: '14px',
  color: '#334155',
  verticalAlign: 'top',
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

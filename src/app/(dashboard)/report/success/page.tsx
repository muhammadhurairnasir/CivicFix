'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Check, Copy, ArrowRight, Eye, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ReportSuccessPage() {
  const searchParams = useSearchParams();
  const ticket = searchParams.get('ticket') || 'RPT-PENDING';
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(ticket);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const draw: any = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay: 0.2, type: "spring", duration: 1.5, bounce: 0 },
        opacity: { delay: 0.2, duration: 0.1 }
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full pt-8 pb-20">
      <div className="bg-bg-surface border border-border rounded-2xl p-8 md:p-12 text-center shadow-sm">
        
        {/* Animated Checkmark */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-success-bg/20 flex items-center justify-center relative">
            <motion.svg
              width="60"
              height="60"
              viewBox="0 0 60 60"
              initial="hidden"
              animate="visible"
            >
              <motion.circle
                cx="30"
                cy="30"
                r="28"
                stroke="var(--status-resolved)"
                variants={draw}
                custom={1}
                strokeWidth="3"
                fill="transparent"
              />
              <motion.path
                d="M17 31 L26 40 L44 20"
                stroke="var(--status-resolved)"
                variants={draw}
                custom={2}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="transparent"
              />
            </motion.svg>
          </div>
        </div>

        <h1 className="text-3xl font-display font-bold text-text-primary mb-2">Report Submitted!</h1>
        <p className="text-text-secondary mb-8">
          Thank you for helping keep our city safe. Your report has been successfully recorded.
        </p>

        {/* Ticket Display */}
        <div className="max-w-xs mx-auto bg-bg-base border border-border-strong rounded-xl p-4 flex flex-col items-center mb-10">
          <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1">Your Ticket Number</span>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-mono font-bold text-brand">{ticket}</span>
            <button 
              onClick={copyToClipboard}
              className="p-2 bg-bg-subtle hover:bg-border rounded-lg text-text-secondary transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-5 h-5 text-success" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="text-left mb-10">
          <h3 className="text-sm font-bold text-text-primary mb-4 text-center">What happens next?</h3>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between relative">
            {/* Desktop connecting line */}
            <div className="hidden md:block absolute top-5 left-8 right-8 h-0.5 bg-border -z-10" />
            
            <div className="flex flex-row md:flex-col items-center gap-4 md:gap-2 w-full md:w-1/3 text-left md:text-center">
              <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center shrink-0 shadow-sm border-4 border-bg-surface z-10">1</div>
              <div>
                <p className="text-sm font-bold text-text-primary">Review</p>
                <p className="text-xs text-text-tertiary">An admin reviews your submission.</p>
              </div>
            </div>
            
            <div className="flex flex-row md:flex-col items-center gap-4 md:gap-2 w-full md:w-1/3 text-left md:text-center">
              <div className="w-10 h-10 rounded-full bg-bg-subtle text-text-secondary border border-border-strong flex items-center justify-center shrink-0 shadow-sm border-4 border-bg-surface z-10">2</div>
              <div>
                <p className="text-sm font-bold text-text-primary">Assignment</p>
                <p className="text-xs text-text-tertiary">A crew is dispatched to the location.</p>
              </div>
            </div>

            <div className="flex flex-row md:flex-col items-center gap-4 md:gap-2 w-full md:w-1/3 text-left md:text-center">
              <div className="w-10 h-10 rounded-full bg-bg-subtle text-text-secondary border border-border-strong flex items-center justify-center shrink-0 shadow-sm border-4 border-bg-surface z-10">3</div>
              <div>
                <p className="text-sm font-bold text-text-primary">Resolution</p>
                <p className="text-xs text-text-tertiary">The defect is repaired and verified.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link href={`/track/${ticket}`}>
            <Button className="w-full sm:w-auto">
              Track this report
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/dashboard/my-reports">
            <Button variant="secondary" className="w-full sm:w-auto">
              <ClipboardList className="w-4 h-4 mr-2" />
              View my reports
            </Button>
          </Link>
          <Link href="/report/new">
            <Button variant="ghost" className="w-full sm:w-auto text-text-secondary">
              Report another
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}

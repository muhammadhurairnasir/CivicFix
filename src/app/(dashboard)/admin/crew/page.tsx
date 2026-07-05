'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { UserCircle2, HardHat, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

import { SlideOver } from '@/components/ui/SlideOver';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { TicketStatus } from '@/types';
import { getSlaStatus, formatSlaCountdown } from '@/lib/sla';

export default function AdminCrewPage() {
  const [selectedCrew, setSelectedCrew] = useState<any>(null);

  const { data: crewData, isLoading } = useQuery({
    queryKey: ['admin-crew'],
    queryFn: async () => {
      const res = await axios.get('/api/admin/users?role=crew&limit=100');
      return res.data.data;
    },
  });

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Crew Dispatch</h1>
        <p className="text-sm text-slate-500 mt-1">Manage active crew members and their current workload.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))
        ) : crewData?.length === 0 ? (
          <div className="col-span-full py-10 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
            No crew members found.
          </div>
        ) : (
          crewData?.map((crew: any) => (
            <div 
              key={crew._id} 
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col"
              onClick={() => setSelectedCrew(crew)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {crew.avatar ? (
                    <img src={crew.avatar} alt="" className="h-12 w-12 rounded-full object-cover border border-slate-100" />
                  ) : (
                    <UserCircle2 className="h-12 w-12 text-slate-400" />
                  )}
                  <div>
                    <h3 className="font-semibold text-slate-900">{crew.name}</h3>
                    <span className={`inline-flex items-center mt-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                      crew.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${crew.isActive ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                      {crew.isActive ? 'Available' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-lg p-3 mb-4 mt-auto">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900 font-display">
                    {crew.stats?.ticketsCompleted || 0}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">Completed</div>
                </div>
                <div className="text-center border-l border-slate-200">
                  <div className="text-2xl font-bold text-brand-600 font-display">
                    {crew.ward ? 'Assigned' : 'All'}
                  </div>
                  <div className="text-xs text-slate-500 font-medium truncate px-1">
                    {crew.ward || 'Wards'}
                  </div>
                </div>
              </div>

              <Button 
                variant="secondary" 
                fullWidth 
                leftIcon={<HardHat className="w-4 h-4" />}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCrew(crew);
                }}
              >
                View Workload
              </Button>
            </div>
          ))
        )}
      </div>

      <CrewTicketsSlideOver 
        crew={selectedCrew} 
        open={!!selectedCrew} 
        onOpenChange={(open) => !open && setSelectedCrew(null)} 
      />
    </div>
  );
}

function CrewTicketsSlideOver({ crew, open, onOpenChange }: { crew: any, open: boolean, onOpenChange: (open: boolean) => void }) {
  const { data: tickets, isLoading } = useQuery({
    queryKey: ['admin-tickets', { assignedTo: crew?._id }],
    queryFn: async () => {
      if (!crew?._id) return [];
      const res = await axios.get(`/api/admin/tickets?assignedTo=${crew._id}&limit=50&sortOrder=desc`);
      return res.data.data;
    },
    enabled: !!crew?._id && open,
  });

  return (
    <SlideOver 
      open={open} 
      onOpenChange={onOpenChange} 
      title={crew ? `${crew.name}'s Workload` : 'Workload'}
      width="md"
    >
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      ) : tickets?.length === 0 ? (
        <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
          No tickets assigned to this crew member.
        </div>
      ) : (
        <div className="space-y-4">
          {tickets?.map((t: any) => {
            const isCompleted = t.status === TicketStatus.COMPLETED;
            const slaStatus = getSlaStatus(t);
            const countdown = formatSlaCountdown(t);

            return (
              <div key={t._id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                {/* Left accent border based on SLA */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                  isCompleted ? 'bg-green-500' :
                  slaStatus === 'breached' ? 'bg-red-500' :
                  slaStatus === 'at_risk' ? 'bg-yellow-500' : 'bg-brand-500'
                }`} />
                
                <div className="flex justify-between items-start pl-2">
                  <div>
                    <div className="text-xs font-semibold text-brand-600 mb-1">{t.reportId?.ticketNumber}</div>
                    <h4 className="font-semibold text-slate-900 leading-tight">{t.reportId?.title}</h4>
                    <p className="text-sm text-slate-500 mt-1 truncate max-w-[250px]">{t.reportId?.address}</p>
                  </div>
                  <span className="capitalize text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded">
                    {t.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="mt-4 pl-2 flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold ${
                      t.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      t.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      t.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {t.priority}
                    </span>
                  </div>

                  <div className={`text-xs font-medium flex items-center ${
                    isCompleted ? 'text-green-600' :
                    slaStatus === 'breached' ? 'text-red-600 font-bold' :
                    slaStatus === 'at_risk' ? 'text-yellow-600' : 'text-slate-500'
                  }`}>
                    {isCompleted ? (
                      <><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Completed</>
                    ) : slaStatus === 'breached' ? (
                      <><AlertCircle className="w-3.5 h-3.5 mr-1" /> {countdown}</>
                    ) : (
                      countdown
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SlideOver>
  );
}

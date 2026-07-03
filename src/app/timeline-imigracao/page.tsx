'use client';

import React from 'react';
import { ImigracaoShell } from '@/components/ImigracaoShell';
import { useImigracao } from '@/lib/imigracao-context';
import TimelineRoadmap from '@/components/travel-docs/TimelineRoadmap';

function TimelineContent() {
  const { extendedState, profile, handleTimelineTaskToggle, handleTimelineTasksChange } = useImigracao();
  return (
    <div className="space-y-6 animate-fadeIn">
      <TimelineRoadmap
        tasks={extendedState.timelineTasks || []}
        onToggleTask={handleTimelineTaskToggle}
        onChangeTasks={handleTimelineTasksChange}
        destinationCountry={profile.destination_country}
        travelYear="2026"
      />
    </div>
  );
}

export default function TimelineImigracaoPage() {
  return (
    <ImigracaoShell>
      <TimelineContent />
    </ImigracaoShell>
  );
}

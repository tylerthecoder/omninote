import React, { useEffect, useState } from 'react';
import { trpc } from './trpc';
import { Debouncer } from './utils';

interface PlanEditorProps {
  initialPlan: string;
  planId: string;
}

const debouncer = new Debouncer(500);

type SyncStatus = 'not-synced' | 'synced' | 'syncing...' | 'error';

const prettySyncStatus = (status: SyncStatus) => {
  switch (status) {
    case 'not-synced':
      return 'Not synced';
    case 'synced':
      return 'Synced';
    case 'syncing...':
      return 'Syncing...';
    case 'error':
      return 'Error';
  }
}

export function PlanEditor({ initialPlan, planId }: PlanEditorProps) {
  const [plan, setPlan] = useState(initialPlan);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('not-synced');

  useEffect(() => {
    debouncer.addStartListener(() => {
      setSyncStatus('syncing...');
    });
    debouncer.addDoneListener(() => {
      setSyncStatus('synced');
    });
    debouncer.addErrorListener(() => {
      setSyncStatus('error');
    });
  }, []);


  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newPlan = e.target.value;
    setPlan(newPlan);
    setSyncStatus('not-synced');
    debouncer.debounce(async () => {
      await trpc.updatePlan.mutate(
        { id: planId, text: newPlan },
      );
    });
  };

  return (
    <div>
      <textarea
        value={plan}
        onChange={handleChange}
        rows={5}
        cols={50}
      />
      <p>Status: {prettySyncStatus(syncStatus)}</p>
    </div>
  );
}
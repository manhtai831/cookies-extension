import React, { useState } from 'react';

interface SyncPageProps {
  onSync: () => Promise<void>;
  onBack: () => void;
  lastSyncTime: number | null;
}

export default function SyncPage({ onSync, onBack, lastSyncTime }: SyncPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const getLastSyncText = () => {
    if (!lastSyncTime) return 'Never synced';
    const now = Date.now();
    const diff = now - lastSyncTime;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `Last synced: ${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `Last synced: ${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `Last synced: ${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Last synced: just now';
  };

  const handleSync = async () => {
    setIsLoading(true);
    try {
      await onSync();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="cm-header">
        <button onClick={onBack} className="cm-back-button">←</button>
        <h2>Manual Sync</h2>
      </div>
      <p>Sync pending cookies to server.</p>
      <p className="cm-sync-info">{getLastSyncText()}</p>
      <div className="cm-flex-2">
        <button onClick={handleSync} disabled={isLoading} className="cm-button" style={{ opacity: isLoading ? 0.6 : 1 }}>
          {isLoading ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>
    </div>
  );
}

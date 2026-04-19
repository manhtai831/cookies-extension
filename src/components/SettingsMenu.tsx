import React from 'react';

interface SettingsMenuProps {
  onSelectSetting: (setting: 'api' | 'sync') => void;
  onClose: () => void;
  lastSyncTime: number | null;
}

export default function SettingsMenu({ onSelectSetting, onClose, lastSyncTime }: SettingsMenuProps) {
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

  return (
    <div>
      <div className="cm-header">
        <button onClick={onClose} className="cm-back-button">←</button>
        <h2>Settings</h2>
      </div>
      <ul className="cm-menu">
        <li onClick={() => onSelectSetting('api')} className="cm-menu-item">Update API Key</li>
        <li onClick={() => onSelectSetting('sync')} className="cm-menu-item">
          <div className="cm-menu-item-content">
            <span>Manual Sync</span>
            <span className="cm-menu-item-subtitle">{getLastSyncText()}</span>
          </div>
        </li>
      </ul>
    </div>
  );
}

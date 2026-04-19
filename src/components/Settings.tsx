import React, { useState } from 'react';
import { ApiKey } from '../types';
import SettingsMenu from './SettingsMenu';
import UpdateApiKeyForm from './UpdateApiKeyForm';
import SyncPage from './SyncPage';

interface SettingsProps {
  apiKey: ApiKey | null;
  setApiKey: (apiKey: ApiKey) => void;
  onSync: () => Promise<void>;
  onClose: () => void;
  lastSyncTime: number | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

type SettingType = null | 'api' | 'sync';

export default function Settings({ apiKey, setApiKey, onSync, onClose, lastSyncTime, showToast }: SettingsProps) {
  const [currentSetting, setCurrentSetting] = useState<SettingType>(null);

  return (
    <div>
      {currentSetting === null && (
        <SettingsMenu
          onSelectSetting={setCurrentSetting}
          onClose={onClose}
          lastSyncTime={lastSyncTime}
        />
      )}
      {currentSetting === 'api' && (
        <UpdateApiKeyForm
          apiKey={apiKey}
          setApiKey={setApiKey}
          onBack={() => setCurrentSetting(null)}
          showToast={showToast}
        />
      )}
      {currentSetting === 'sync' && (
        <SyncPage
          onSync={onSync}
          onBack={() => setCurrentSetting(null)}
          lastSyncTime={lastSyncTime}
        />
      )}
    </div>
  );
}

import React from 'react';
import browser from 'webextension-polyfill';
import { ApiKey } from '../types';

interface ApiKeySetupProps {
  apiKeyForm: { host: string; key: string };
  setApiKeyForm: (form: { host: string; key: string }) => void;
  setApiKey: (apiKey: ApiKey) => void;
}

export default function ApiKeySetup({ apiKeyForm, setApiKeyForm, setApiKey }: ApiKeySetupProps) {
  return (
    <div>
      <h2>API Key Required</h2>
      <input
        type="text"
        placeholder="Host: e.g. https://api.example.com"
        value={apiKeyForm.host}
        onChange={(e) => setApiKeyForm({ ...apiKeyForm, host: e.target.value })}
        className="cm-input"
      />
      <input
        type="password"
        placeholder="API Key"
        value={apiKeyForm.key}
        onChange={(e) => setApiKeyForm({ ...apiKeyForm, key: e.target.value })}
        className="cm-input"
      />
      <button onClick={async () => {
        await browser.storage.local.set({ apiKey: apiKeyForm });
        setApiKey(apiKeyForm);
      }} className="cm-button">Save</button>
    </div>
  );
}

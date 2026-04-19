import React, { useState } from 'react';
import browser from 'webextension-polyfill';
import { ApiKey } from '../types';

interface UpdateApiKeyFormProps {
    apiKey: ApiKey | null;
    setApiKey: (apiKey: ApiKey) => void;
    onBack: () => void;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function UpdateApiKeyForm({ apiKey, setApiKey, onBack, showToast }: UpdateApiKeyFormProps) {
    const [apiKeyForm, setApiKeyForm] = useState(apiKey || { host: '', key: '' });

    const saveApiKey = async () => {
        await browser.storage.local.set({ apiKey: apiKeyForm });
        setApiKey(apiKeyForm);
        showToast('API key saved successfully', 'success');
        onBack();
    };

    return (
        <div>
            <div className="cm-header">
                <button onClick={onBack} className="cm-back-button">←</button>
                <h2>Update API Key</h2>
            </div>
            <label className="cm-input-label" htmlFor="api-host">
                Host
            </label>
            <input
                id="api-host"
                type="text"
                placeholder="Host: e.g. https://api.example.com"
                value={apiKeyForm.host}
                onChange={(e) => setApiKeyForm({ ...apiKeyForm, host: e.target.value })}
                className="cm-input"
            />
            <label className="cm-input-label" htmlFor="api-key">
                API Key
            </label>
            <input
                id="api-key"
                type="password"
                placeholder="API Key"
                value={apiKeyForm.key}
                onChange={(e) => setApiKeyForm({ ...apiKeyForm, key: e.target.value })}
                className="cm-input"
            />
            <div className="cm-flex-2">
                <button onClick={saveApiKey} className="cm-button">Save</button>
            </div>
        </div>
    );
}

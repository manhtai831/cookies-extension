import React, { useState, useEffect } from 'react';
import './Popup.css';
import { CookieGroup, CookieData, ApiKey, ToastMessage } from '../types';
import browser from 'webextension-polyfill';
import ApiKeySetup from '../components/ApiKeySetup';
import CookieList from '../components/CookieList';
import CookieForm from '../components/CookieForm';
import Settings from '../components/Settings';
import Toast from '../components/Toast';
import { initializeApiClient, getApiClient } from '../services/apiClient';

export default function Popup() {
  const [cookieGroups, setCookieGroups] = useState<CookieGroup[]>([]);
  const [apiKey, setApiKey] = useState<ApiKey | null>(null);
  const [apiKeyForm, setApiKeyForm] = useState({ host: '', key: '' });
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentPage, setCurrentPage] = useState<'main' | 'settings'>('main');
  const [editingCookie, setEditingCookie] = useState<CookieGroup | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [toastMessages, setToastMessages] = useState<ToastMessage[]>([]);
  const [formData, setFormData] = useState({
    name: '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Helper function to generate UUIDv4
  const generateUUID = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  // Toast helper functions
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = generateUUID();
    setToastMessages(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  };

  const removeToast = (id: string) => {
    setToastMessages(prev => prev.filter(msg => msg.id !== id));
  };

  useEffect(() => {
    loadApiKey();
    loadLastSyncTime();
  }, []);

  const loadLastSyncTime = async () => {
    const result = await browser.storage.local.get(['lastSyncTime']);
    if (result.lastSyncTime) {
      setLastSyncTime(result.lastSyncTime);
    }
  };

  useEffect(() => {
    if (apiKey) {
      initializeApiClient(apiKey);
      loadCookies();
    }
  }, [apiKey]);

  const loadApiKey = async () => {
    const result = await browser.storage.local.get(['apiKey']);
    setApiKey(result.apiKey);
  };

  const loadCookies = async () => {
    // Load from local storage
    const result = await browser.storage.local.get(['cookieGroups']);
    let groups: CookieGroup[] = result.cookieGroups || [];

    // Get current tab domain and sort groups
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        const currentUrl = new URL(tab.url);
        const currentDomain = currentUrl.hostname;
        const currentHost = currentUrl.host; // includes port if any

        groups = groups.sort((a: CookieGroup, b: CookieGroup) => {
          // Calculate priority scores (higher = better)
          const getPriority = (groupUrl: string) => {
            if (groupUrl === currentDomain) return 3; // exact domain match
            if (groupUrl === currentHost) return 2; // host match
            if (currentDomain.endsWith('.' + groupUrl) || currentDomain === groupUrl) return 1; // subdomain match
            return 0; // no match
          };

          const aPriority = getPriority(a.url);
          const bPriority = getPriority(b.url);

          return bPriority - aPriority; // higher priority first
        });
      }
    } catch (error) {
      console.warn('Could not get current tab domain for sorting:', error);
    }

    setCookieGroups(groups);

    // If apiKey available, sync from server
    if (apiKey) {
      try {
        const serverCookies = await getApiClient().get<CookieGroup[]>('/cookies');
        // Also sort server cookies by current domain
        try {
          const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
          if (tab && tab.url) {
            const currentUrl = new URL(tab.url);
            const currentDomain = currentUrl.hostname;
            const currentHost = currentUrl.host;

            serverCookies.sort((a: CookieGroup, b: CookieGroup) => {
              const getPriority = (groupUrl: string) => {
                if (groupUrl === currentDomain) return 3;
                if (groupUrl === currentHost) return 2;
                if (currentDomain.endsWith('.' + groupUrl) || currentDomain === groupUrl) return 1;
                return 0;
              };

              const aPriority = getPriority(a.url);
              const bPriority = getPriority(b.url);

              return bPriority - aPriority;
            });
          }
        } catch (error) {
          console.warn('Could not get current tab domain for server sorting:', error);
        }

        setCookieGroups(serverCookies);
        // Update local storage
        await browser.storage.local.set({ cookieGroups: serverCookies });
      } catch (error) {
        console.error('Failed to sync cookies from server:', error);
      }
    }
  };

  const saveCookie = async () => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab.url) {
      showToast('No active tab found', 'error');
      return;
    }

    try {
      const currentUrl = new URL(tab.url);
      const currentDomain = currentUrl.hostname;
      const currentCookies = await browser.cookies.getAll({ url: tab.url });
      if (currentCookies.length === 0) {
        showToast('No cookies found for the current tab', 'error');
        return;
      }
      const name = formData.name.trim().slice(0, 100); // enforce max length
      if (!name) {
        showToast('Please enter a name for the cookie group', 'error');
        return;
      }

      const cookiesToSave: CookieData[] = currentCookies.map(c => ({
        name: c.name,
        value: c.value,
        expiry: c.expirationDate ? c.expirationDate * 1000 : Date.now() + 365 * 24 * 60 * 60 * 1000,
        domain: c.domain,
        path: c.path,
        secure: c.secure,
        httpOnly: c.httpOnly,
      }));

      // Check if editing or creating
      if (editingCookie) {
        // Update existing group
        const updatedGroup: CookieGroup = {
          ...editingCookie,
          name: name,
          cookies: cookiesToSave,
          synced: false,
          updatedAt: Date.now(),
          lastSyncedAt: undefined,
        };

        const existingGroups = await browser.storage.local.get(['cookieGroups']);
        const allGroups = (existingGroups.cookieGroups || []).map((g: CookieGroup) =>
          g.id === editingCookie.id ? updatedGroup : g
        );
        await browser.storage.local.set({ cookieGroups: allGroups });
        setCookieGroups(allGroups);

        // Try to sync updated group
        try {
          await getApiClient().post('/cookies', [updatedGroup]);
          const syncedGroups = allGroups.map((g: CookieGroup) =>
            g.id === editingCookie.id ? { ...g, synced: true, lastSyncedAt: Date.now() } : g
          );
          await browser.storage.local.set({ cookieGroups: syncedGroups });
          setCookieGroups(syncedGroups);
          showToast(`Updated and synced ${cookiesToSave.length} cookies`, 'success');
        } catch (error) {
          console.error('Failed to sync updated group:', error);
          showToast(`Updated ${cookiesToSave.length} cookies locally, will sync later`, 'info');
        }
      } else {
        // Create new group
        const newGroup: CookieGroup = {
          id: generateUUID(),
          name: formData.name,
          url: currentDomain,
          cookies: cookiesToSave,
          synced: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        // Save to local storage first
        const existingGroups = await browser.storage.local.get(['cookieGroups']);
        const allGroups = [...(existingGroups.cookieGroups || []), newGroup];
        await browser.storage.local.set({ cookieGroups: allGroups });
        setCookieGroups(allGroups);

        // Try to sync to server
        try {
          await getApiClient().post('/cookies', [newGroup]);
          // Mark as synced
          const updatedGroups = allGroups.map(g =>
            g.id === newGroup.id ? { ...g, synced: true, lastSyncedAt: Date.now() } : g
          );
          await browser.storage.local.set({ cookieGroups: updatedGroups });
          setCookieGroups(updatedGroups);
          showToast(`Saved and synced ${cookiesToSave.length} cookies`, 'success');
        } catch (error) {
          console.error('Failed to sync to server, will retry later:', error);
          showToast(`Saved ${cookiesToSave.length} cookies locally, will sync later`, 'info');
        }
      }

      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error('Error saving cookies:', error);
      showToast('Failed to save cookies');
    }
  };

  const deleteCookie = async (id: string) => {
    try {
      // Delete from local
      const existingGroups = await browser.storage.local.get(['cookieGroups']);
      const updatedGroups = (existingGroups.cookieGroups || []).filter((g: CookieGroup) => g.id !== id);
      await browser.storage.local.set({ cookieGroups: updatedGroups });
      setCookieGroups(updatedGroups);

      // Try to delete from server
      try {
        await getApiClient().delete(`/cookies/${id}`);
      } catch (error) {
        console.error('Failed to delete from server:', error);
      }
      showToast('Cookie group deleted', 'success');
    } catch (error) {
      showToast('Failed to delete cookie group', 'error');
    }
  };

  const useCookie = async (group: CookieGroup) => {
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        // Send message to background script to set cookies
        const response = await browser.runtime.sendMessage({
          action: 'setCookies',
          cookies: group.cookies,
          tabId: tab.id
        });

        if (response.success) {
          if (response.skippedHttpOnly > 0) {
            showToast(`Applied ${response.appliedCount} cookies (${response.skippedHttpOnly} httpOnly cookies skipped)`, 'info');
          } else {
            showToast(`Applied ${response.appliedCount} cookies`, 'success');
          }
        } else {
          showToast('Failed to apply cookies', 'error');
        }
      }
    } catch (error) {
      console.error('Error applying cookies:', error);
      showToast('Failed to apply cookies', 'error');
    }
  };

  const exportCookie = (group: CookieGroup) => {
    try {
      const clone = structuredClone(group)
      delete clone.id;
      const dataStr = JSON.stringify(clone, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = `${group.name}_cookies_${new Date().toISOString().slice(0, 10)}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      showToast('Cookies exported', 'success');
    } catch (error) {
      showToast('Failed to export cookies', 'error');
    }
  };

  const onCopy = (group: CookieGroup) => {
    try {
      const dataStr = JSON.stringify(group, null, 2);
      navigator.clipboard.writeText(dataStr);
      showToast('Cookies copied to clipboard', 'success');
    } catch (error) {
      showToast('Failed to copy cookies', 'error');
    }
  };

  const duplicateCookie = (group: CookieGroup) => {
    setFormData({
      name: group.name,
    });
    setShowForm(true);
    showToast('Enter a new name to duplicate', 'info');
  };

  const suggestName = async () => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      return tab.title || new URL(tab.url).hostname;
    }
    return '';
  };

  const handleNewCookie = async () => {
    const suggestedName = await suggestName();
    setFormData({ name: suggestedName });
    setShowForm(true);
  };

  const handleEditCookie = (group: CookieGroup) => {
    setFormData({ name: group.name });
    setEditingCookie(group);
    setShowForm(true);
  };

  const handleImportCookie = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const importedGroup = JSON.parse(content) as CookieGroup;

        // Generate new ID to avoid conflicts
        importedGroup.id = generateUUID();
        importedGroup.synced = false;
        importedGroup.createdAt = Date.now();
        importedGroup.updatedAt = Date.now();
        delete importedGroup.lastSyncedAt;

        // Save to local storage
        const existingGroups = await browser.storage.local.get(['cookieGroups']);
        const allGroups = [...(existingGroups.cookieGroups || []), importedGroup];
        await browser.storage.local.set({ cookieGroups: allGroups });
        setCookieGroups(allGroups);

        // Try to sync to server
        try {
          await getApiClient().post('/cookies', [importedGroup]);
          const updatedGroups = allGroups.map(g =>
            g.id === importedGroup.id ? { ...g, synced: true, lastSyncedAt: Date.now() } : g
          );
          await browser.storage.local.set({ cookieGroups: updatedGroups });
          setCookieGroups(updatedGroups);
          showToast('Cookies imported and synced', 'success');
        } catch (error) {
          console.error('Failed to sync imported cookies:', error);
          showToast('Cookies imported locally, will sync later', 'info');
        }

        // Reset file input
        event.target.value = '';
      } catch (error) {
        console.error('Error importing cookies:', error);
        showToast('Invalid cookie file format', 'error');
        event.target.value = '';
      }
    };

    reader.readAsText(file);
  };

  const syncPendingCookies = async () => {
    const existingGroups = await browser.storage.local.get(['cookieGroups']);
    const pendingGroups = (existingGroups.cookieGroups || []).filter((g: CookieGroup) => !g.synced);
    if (pendingGroups.length === 0) {
      showToast('No pending cookies to sync', 'info');
      return;
    }

    try {
      await getApiClient().post('/cookies', pendingGroups);
      const updatedGroups = (existingGroups.cookieGroups || []).map((g: CookieGroup) =>
        pendingGroups.some((pg: CookieGroup) => pg.id === g.id) ? { ...g, synced: true, lastSyncedAt: Date.now() } : g
      );
      await browser.storage.local.set({ cookieGroups: updatedGroups });
      await browser.storage.local.set({ lastSyncTime: Date.now() });
      setCookieGroups(updatedGroups);
      setLastSyncTime(Date.now());
      showToast(`Synced ${pendingGroups.length} cookie groups`, 'success');
    } catch (error) {
      console.error('Failed to sync pending cookies:', error);
      showToast('Failed to sync cookies', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
    });
    setEditingCookie(null);
  };
  console.log('cookieGroups', cookieGroups);


  const filteredCookieGroups = cookieGroups.filter(group => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return (
      group.name.toLowerCase().includes(lowerSearchTerm) ||
      group.url.toLowerCase().includes(lowerSearchTerm)
    );
  });

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const renderContent = () => {
    if (!apiKey) {
      return <ApiKeySetup apiKeyForm={apiKeyForm} setApiKeyForm={setApiKeyForm} setApiKey={setApiKey} />;
    }

    if (currentPage === 'settings') {
      return (
        <Settings
          apiKey={apiKey}
          setApiKey={setApiKey}
          onSync={syncPendingCookies}
          onClose={() => setCurrentPage('main')}
          lastSyncTime={lastSyncTime}
          showToast={showToast}
        />
      );
    }

    return (
      <>
        <h2>Cookies Manager</h2>
        <div className="cm-flex">
          <button onClick={handleNewCookie} className="cm-button">New Cookie</button>
          <label className="cm-button" style={{ cursor: 'pointer', margin: 0, padding: '8px 16px', display: 'inline-block' }}>
            Import
            <input
              type="file"
              accept=".json"
              onChange={handleImportCookie}
              style={{ display: 'none' }}
            />
          </label>
          <button onClick={() => setCurrentPage('settings')} className="cm-button">Settings</button>
        </div>
        <div className="cm-search">
          <input
            type="text"
            placeholder="Search by name or domain"
            value={searchTerm}
            onChange={handleSearchChange}
            className="cm-input"
          />
        </div>
        <CookieList
          cookies={filteredCookieGroups}
          onDelete={deleteCookie}
          onEdit={handleEditCookie}
          onCopy={onCopy}
          onUse={useCookie}
          onExport={exportCookie}
          onDuplicate={duplicateCookie}
        />
        {showForm && (
          <CookieForm
            formData={formData}
            setFormData={setFormData}
            onSave={saveCookie}
            onCancel={() => { setShowForm(false); resetForm(); }}
            editingCookie={editingCookie}
          />
        )}
      </>
    );
  };

  return (
    <div className="cm-popup">
      {renderContent()}
      <Toast messages={toastMessages} onRemove={removeToast} />
    </div>
  );
}

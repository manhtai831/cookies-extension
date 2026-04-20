import browser from "webextension-polyfill";
import { CookieGroup, ApiKey } from "./types";
import { initializeApiClient, getApiClient } from "./services/apiClient";

const SYNC_ALARM_NAME = 'hourlySync';

console.log("Hello from the background!");

const initHourlySync = async () => {
  try {
    browser.alarms.create(SYNC_ALARM_NAME, { periodInMinutes: 60 });
    console.log('Hourly sync alarm created');
  } catch (error) {
    console.error('Failed to create hourly sync alarm:', error);
  }
};

const loadApiClientFromStorage = async () => {
  const stored = await browser.storage.local.get(['apiKey']);
  const apiKey = stored.apiKey as ApiKey | undefined;
  initializeApiClient(apiKey || null);
  return apiKey;
};

const mergeCookieGroups = (localGroups: CookieGroup[], remoteGroups: CookieGroup[]): CookieGroup[] => {
  const localMap = new Map(localGroups.map(group => [group.id, group]));
  const remoteMap = new Map(remoteGroups.map(group => [group.id, group]));
  const mergedMap = new Map<string, CookieGroup>();

  for (const remote of remoteGroups) {
    const local = localMap.get(remote.id);
    const remoteUpdated = remote.updatedAt || remote.createdAt || 0;
    if (!local) {
      mergedMap.set(remote.id!, { ...remote, synced: true, lastSyncedAt: Date.now() });
      continue;
    }

    const localUpdated = local.updatedAt || local.createdAt || 0;
    if (remoteUpdated >= localUpdated) {
      mergedMap.set(remote.id!, { ...remote, synced: true, lastSyncedAt: Date.now() });
    } else {
      mergedMap.set(local.id!, local);
    }
  }

  for (const local of localGroups) {
    if (!remoteMap.has(local.id)) {
      mergedMap.set(local.id!, local);
    }
  }

  return Array.from(mergedMap.values());
};

const syncWithServer = async () => {
  const apiKey = await loadApiClientFromStorage();
  if (!apiKey) {
    console.warn('No API key configured; hourly sync skipped');
    return;
  }

  try {
    const remoteGroups = await getApiClient().get<CookieGroup[]>('/cookies');
    const localData = await browser.storage.local.get(['cookieGroups']);
    const localGroups: CookieGroup[] = localData.cookieGroups || [];

    const mergedGroups = mergeCookieGroups(localGroups, remoteGroups);
    await browser.storage.local.set({ cookieGroups: mergedGroups, lastSyncTime: Date.now() });

    const groupsToUpload = mergedGroups.filter(local => {
      const remote = remoteGroups.find((group: CookieGroup) => group.id === local.id);
      const localUpdated = local.updatedAt || local.createdAt || 0;
      const remoteUpdated = remote ? (remote.updatedAt || remote.createdAt || 0) : 0;
      return localUpdated > remoteUpdated;
    });

    if (groupsToUpload.length > 0) {
      await getApiClient().post('/cookies', groupsToUpload);
      const syncedGroups = mergedGroups.map(group => {
        const uploadNeeded = groupsToUpload.some(item => item.id === group.id);
        return uploadNeeded
          ? { ...group, synced: true, lastSyncedAt: Date.now() }
          : group;
      });
      await browser.storage.local.set({ cookieGroups: syncedGroups });
    }

    console.log('Hourly sync completed', { mergedCount: mergedGroups.length, uploaded: groupsToUpload.length });
  } catch (error) {
    console.error('Hourly sync failed:', error);
  }
};

browser.runtime.onInstalled.addListener((details) => {
  console.log("Extension installed:", details);
  initHourlySync();
});

browser.runtime.onStartup.addListener(() => {
  initHourlySync();
});

browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === SYNC_ALARM_NAME) {
    console.log('Hourly sync alarm fired');
    syncWithServer();
  }
});

// Handle messages from popup
browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === 'setCookies') {
    try {
      const { cookies, tabId } = message;
      let appliedCount = 0;
      let skippedHttpOnly = 0;

      for (const cookie of cookies) {
        try {
          await browser.cookies.set({
            url: `https://${cookie.domain}`,
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path,
            secure: cookie.secure,
            httpOnly: false, // Always set to false for security
            expirationDate: cookie.expiry / 1000, // convert back to seconds
          });
          appliedCount++;
        } catch (cookieError) {
          console.warn(`Failed to set cookie ${cookie.name}:`, cookieError);
        }
      }

      // Reload the tab
      if (tabId) {
        await browser.tabs.reload(tabId);
      }

      return { success: true, appliedCount, skippedHttpOnly };
    } catch (error) {
      console.error('Error setting cookies in background:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  return false;
});


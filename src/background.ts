import browser from "webextension-polyfill";

console.log("Hello from the background!");

browser.runtime.onInstalled.addListener((details) => {
  console.log("Extension installed:", details);
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

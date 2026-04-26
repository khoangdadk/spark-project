const DEFAULTS = {
  triggerEnabled: true,
  dashboardBaseUrl: "http://localhost:5173",
};

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get([
    "triggerEnabled",
    "dashboardBaseUrl",
  ]);

  const updates = {};
  if (typeof current.triggerEnabled === "undefined") {
    updates.triggerEnabled = DEFAULTS.triggerEnabled;
  }
  if (!current.dashboardBaseUrl) {
    updates.dashboardBaseUrl = DEFAULTS.dashboardBaseUrl;
  }

  if (Object.keys(updates).length > 0) {
    await chrome.storage.local.set(updates);
  }

  console.log("SaleSeer trigger installed.");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "GET_TRIGGER_SETTINGS") {
    chrome.storage.local.get(
      ["triggerEnabled", "dashboardBaseUrl"],
      (result) => {
        sendResponse({
          triggerEnabled: result.triggerEnabled !== false,
          dashboardBaseUrl:
            result.dashboardBaseUrl || DEFAULTS.dashboardBaseUrl,
        });
      }
    );
    return true;
  }

  if (message?.type === "LOG_TRIGGER_EVENT") {
    console.log("=== SaleSeer trigger event ===");
    console.log(message.payload || {});
    sendResponse({ ok: true });
    return;
  }
});
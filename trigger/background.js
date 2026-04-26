chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "OPEN_MVP_FOR_PRODUCT") return;

  console.log("=== Coles trigger fired ===");
  console.log("Product name:", message.productName || "");
  console.log("Product URL:", message.productUrl || "");
  console.log("Price:", message.price || "");
  console.log("Full payload:", message);

  sendResponse({ ok: true });
});
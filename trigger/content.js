function normalizeText(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

function isAddToTrolleyButton(el) {
  if (!el) return false;

  const clickable = el.closest("button, a, [role='button']");
  if (!clickable) return false;

  const text = normalizeText(clickable.innerText || clickable.textContent || "");
  return /add to trolley/i.test(text);
}

function extractProductInfo(triggerEl) {
  const productCard = triggerEl.closest("article, li, section, div");

  const h1 = document.querySelector("h1");
  const titleInCard = productCard?.querySelector("h1, h2, h3");
  const productName = normalizeText(
    titleInCard?.textContent || h1?.textContent || document.title
  );

  const priceEl = productCard?.querySelector(
    "[class*='price'], [data-testid*='price']"
  );
  const price = normalizeText(priceEl?.textContent || "");

  return {
    productName,
    price,
    productUrl: location.href
  };
}

let lastSent = { key: "", ts: 0 };

function sendProduct(info) {
  const key = `${info.productName}|${info.productUrl}`;
  const now = Date.now();

  if (lastSent.key === key && now - lastSent.ts < 3000) return;
  lastSent = { key, ts: now };

  chrome.runtime.sendMessage(
    {
      type: "OPEN_MVP_FOR_PRODUCT",
      ...info
    },
    (response) => {
      console.log("Background response:", response);
    }
  );
}

document.addEventListener(
  "click",
  (event) => {
    const target = event.target;
    if (!isAddToTrolleyButton(target)) return;

    const clickable = target.closest("button, a, [role='button']");
    const info = extractProductInfo(clickable);

    console.log("Detected Add to trolley click:", info);
    sendProduct(info);
  },
  true
);
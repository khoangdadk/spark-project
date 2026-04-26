const BOX_ID = "saleseer-summary-box";
const CLOSE_ID = "saleseer-close-btn";

let DB_ROWS = [];
let SETTINGS = {
  triggerEnabled: true,
  dashboardBaseUrl: "http://localhost:5173",
};

let lastSent = { key: "", ts: 0 };

bootstrap();

async function bootstrap() {
  await loadSettings();
  await loadDatabase();
  installClickListener();
  console.log("SaleSeer content script ready.");
}

async function loadSettings() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_TRIGGER_SETTINGS" }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("Failed to load trigger settings:", chrome.runtime.lastError.message);
        resolve();
        return;
      }

      if (response) {
        SETTINGS = response;
      }
      resolve();
    });
  });
}

async function loadDatabase() {
  const url = chrome.runtime.getURL("mock_supermarket_products.json");
  const response = await fetch(url);
  DB_ROWS = await response.json();
}

function normalizeText(text) {
  return (text || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function getCurrentSupermarket() {
  const host = window.location.hostname.toLowerCase();

  if (host.includes("coles")) return "Coles";
  if (host.includes("woolworths")) return "Woolworths";
  if (host.includes("aldi")) return "Aldi";

  return null;
}

function findClickableFromEvent(event) {
  const path = event.composedPath ? event.composedPath() : [];

  for (const node of path) {
    if (!(node instanceof Element)) continue;

    if (
      node.matches(
        [
          "button",
          "a",
          "[role='button']",
          "wc-add-to-cart",
          ".add-to-cart-btn",
          "[aria-label]",
          "[data-testid]",
        ].join(", ")
      )
    ) {
      return node;
    }
  }

  const target =
    event.target instanceof Element
      ? event.target
      : null;

  if (!target) return null;

  return target.closest(
    [
      "button",
      "a",
      "[role='button']",
      "wc-add-to-cart",
      ".add-to-cart-btn",
      "[aria-label]",
      "[data-testid]",
    ].join(", ")
  );
}

function isAddToCartButton(el) {
  if (!(el instanceof Element)) return false;

  const clickable = el.matches(
    [
      "button",
      "a",
      "[role='button']",
      "wc-add-to-cart",
      ".add-to-cart-btn",
      "[aria-label]",
      "[data-testid]",
    ].join(", ")
  )
    ? el
    : el.closest(
        [
          "button",
          "a",
          "[role='button']",
          "wc-add-to-cart",
          ".add-to-cart-btn",
          "[aria-label]",
          "[data-testid]",
        ].join(", ")
      );

  if (!clickable) return false;

  const text = normalizeText(
    clickable.innerText ||
      clickable.textContent ||
      clickable.getAttribute("aria-label") ||
      clickable.getAttribute("title") ||
      clickable.getAttribute("data-testid") ||
      ""
  );

  console.log("[SaleSeer] isAddToCartButton text:", text);

  if (/add to (cart|trolley)/i.test(text)) return true;
  if (/^add$/i.test(text)) return true;
  if (/^add 1$/i.test(text)) return true;
  if (/add item/i.test(text)) return true;

  return false;
}

function extractProductInfo(triggerEl) {
  const productCard = triggerEl.closest("article, li, section, div");

  const h1 = document.querySelector("h1");
  const titleInCard = productCard?.querySelector("h1, h2, h3, [data-testid*='title']");
  const productName = (
    titleInCard?.textContent ||
    h1?.textContent ||
    document.title ||
    ""
  ).trim();

  const priceEl = productCard?.querySelector(
    "[class*='price'], [data-testid*='price']"
  );
  const price = (priceEl?.textContent || "").trim();

  return {
    productName,
    price,
    productUrl: location.href,
    supermarket: getCurrentSupermarket(),
  };
}

function matchProductKey(productName) {
  const t = normalizeText(productName);

  if (t.includes("cage free") && t.includes("egg")) return "cage_free_eggs";
  if (t.includes("full cream") && t.includes("milk") && t.includes("1l")) return "full_cream_milk_1l";
  if (t.includes("cadbury") && t.includes("dairy milk") && t.includes("180g")) return "cadbury_dairy_milk_180g";
  if (t.includes("beef") && t.includes("topside")) return "beef_topside";
  if (t.includes("chicken") && t.includes("breast")) return "chicken_breast_large_pack";
  if (t.includes("chicken") && t.includes("thigh") && t.includes("cutlet")) return "chicken_thigh_cutlets";
  if (t.includes("brown onion") && t.includes("1kg")) return "brown_onions_1kg";
  if (t.includes("pork") && t.includes("mince") && t.includes("500g")) return "pork_mince_500g";
  if (t.includes("banana")) return "bananas";
  if (t.includes("carrot") && t.includes("1kg")) return "carrots_1kg";

  return null;
}

function normalizeStoreName(store) {
  const t = normalizeText(store);
  if (t === "aldi") return "Aldi";
  if (t === "woolworths") return "Woolworths";
  if (t === "coles") return "Coles";
  return store;
}

function findCurrentRow(productKey, supermarket) {
  return DB_ROWS.find((row) => {
    return (
      row.product_key === productKey &&
      normalizeStoreName(row.supermarket) === normalizeStoreName(supermarket) &&
      String(row.frontend_available).toLowerCase() === "true"
    );
  }) || null;
}

function findBetterPriceRow(productKey, currentSupermarket, currentPrice) {
  const candidates = DB_ROWS
    .filter((row) => {
      return (
        row.product_key === productKey &&
        normalizeStoreName(row.supermarket) !== normalizeStoreName(currentSupermarket) &&
        String(row.frontend_available).toLowerCase() === "true" &&
        toNumber(row.current_price_aud) != null
      );
    })
    .map((row) => ({
      ...row,
      current_price_num: toNumber(row.current_price_aud),
    }))
    .sort((a, b) => a.current_price_num - b.current_price_num);

  if (candidates.length === 0) return null;
  if (currentPrice == null) return candidates[0];

  return candidates[0].current_price_num < currentPrice ? candidates[0] : null;
}

function buildDashboardUrl(productKey, supermarket) {
  const base = SETTINGS.dashboardBaseUrl || "http://localhost:5173";
  const params = new URLSearchParams({
    product_key: productKey,
    store: supermarket,
  });
  return `${base}?${params.toString()}`;
}

function buildPrediction(row) {
  const currentPrice = toNumber(row.current_price_aud);
  const nextPrice = toNumber(row.next_week_price_aud);

  if (currentPrice == null || nextPrice == null) {
    return {
      text: "No next-week prediction available.",
      isDown: false,
    };
  }

  const isDown = nextPrice < currentPrice;
  const pct = currentPrice > 0
    ? Math.round(((currentPrice - nextPrice) / currentPrice) * 100)
    : 0;

  if (isDown) {
    const eventText = row.prediction_event ? ` (${row.prediction_event})` : "";
    return {
      text: `Likely ↓ ${pct}% next week${eventText}`,
      isDown: true,
    };
  }

  const eventText = row.prediction_event ? ` Watch: ${row.prediction_event}.` : "";
  return {
    text: `No discount signal next week.${eventText}`,
    isDown: false,
  };
}

function removeExistingBox() {
  const existing = document.getElementById(BOX_ID);
  if (existing) existing.remove();
}

function createLink(label, href) {
  const a = document.createElement("a");
  a.textContent = label;
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.style.color = "#2563eb";
  a.style.fontWeight = "600";
  a.style.textDecoration = "none";
  return a;
}

function renderSummaryBox({ info, currentRow, betterRow, dashboardUrl, prediction }) {
  removeExistingBox();

  const box = document.createElement("div");
  box.id = BOX_ID;
  box.style.position = "fixed";
  box.style.top = "20px";
  box.style.right = "20px";
  box.style.width = "360px";
  box.style.maxWidth = "calc(100vw - 32px)";
  box.style.background = "#ffffff";
  box.style.border = "1px solid #e5e7eb";
  box.style.borderRadius = "16px";
  box.style.boxShadow = "0 16px 40px rgba(0,0,0,0.18)";
  box.style.padding = "16px";
  box.style.zIndex = "2147483647";
  box.style.fontFamily = "Arial, Helvetica, sans-serif";
  box.style.color = "#111827";

  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.justifyContent = "space-between";
  header.style.alignItems = "flex-start";
  header.style.gap = "12px";

  const titleWrap = document.createElement("div");

  const title = document.createElement("div");
  title.textContent = "SaleSeer summary";
  title.style.fontSize = "16px";
  title.style.fontWeight = "700";

  const subtitle = document.createElement("div");
  subtitle.textContent = currentRow?.matched_product_name || info.productName;
  subtitle.style.fontSize = "13px";
  subtitle.style.color = "#6b7280";
  subtitle.style.marginTop = "4px";

  titleWrap.appendChild(title);
  titleWrap.appendChild(subtitle);

  const closeBtn = document.createElement("button");
  closeBtn.id = CLOSE_ID;
  closeBtn.textContent = "✕";
  closeBtn.style.border = "none";
  closeBtn.style.background = "transparent";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.fontSize = "16px";
  closeBtn.style.color = "#6b7280";
  closeBtn.onclick = () => box.remove();

  header.appendChild(titleWrap);
  header.appendChild(closeBtn);

  const section1 = document.createElement("div");
  section1.style.marginTop = "14px";
  section1.style.padding = "12px";
  section1.style.borderRadius = "12px";
  section1.style.background = "#f8fafc";

  const section1Label = document.createElement("div");
  section1Label.textContent = "Dashboard";
  section1Label.style.fontSize = "12px";
  section1Label.style.color = "#6b7280";
  section1Label.style.marginBottom = "6px";

  section1.appendChild(section1Label);
  section1.appendChild(createLink("Open detailed product page", dashboardUrl));

  const section2 = document.createElement("div");
  section2.style.marginTop = "12px";
  section2.style.padding = "12px";
  section2.style.borderRadius = "12px";
  section2.style.background = "#f8fafc";

  const section2Label = document.createElement("div");
  section2Label.textContent = "Better-price suggestion";
  section2Label.style.fontSize = "12px";
  section2Label.style.color = "#6b7280";
  section2Label.style.marginBottom = "6px";

  section2.appendChild(section2Label);

  if (betterRow) {
    const betterText = document.createElement("div");
    betterText.textContent = `Cheaper at ${betterRow.supermarket}: $${Number(
      betterRow.current_price_aud
    ).toFixed(2)}`;
    betterText.style.fontWeight = "700";
    betterText.style.marginBottom = "6px";

    section2.appendChild(betterText);
    section2.appendChild(createLink("Open cheaper supermarket page", betterRow.product_url));
  } else {
    const noBetter = document.createElement("div");
    noBetter.textContent = "No cheaper option found in the mock database.";
    noBetter.style.fontSize = "14px";
    section2.appendChild(noBetter);
  }

  const section3 = document.createElement("div");
  section3.style.marginTop = "12px";
  section3.style.padding = "12px";
  section3.style.borderRadius = "12px";
  section3.style.background = prediction.isDown ? "#dcfce7" : "#f8fafc";
  section3.style.border = prediction.isDown ? "1px solid #86efac" : "1px solid transparent";

  const section3Label = document.createElement("div");
  section3Label.textContent = "Next discount prediction";
  section3Label.style.fontSize = "12px";
  section3Label.style.color = "#6b7280";
  section3Label.style.marginBottom = "6px";

  const predictionText = document.createElement("div");
  predictionText.textContent = prediction.text;
  predictionText.style.fontSize = "14px";
  predictionText.style.fontWeight = prediction.isDown ? "700" : "500";
  predictionText.style.color = prediction.isDown ? "#166534" : "#111827";

  section3.appendChild(section3Label);
  section3.appendChild(predictionText);

  box.appendChild(header);
  box.appendChild(section1);
  box.appendChild(section2);
  box.appendChild(section3);

  document.body.appendChild(box);
}

function sendDebugLog(payload) {
  chrome.runtime.sendMessage({
    type: "LOG_TRIGGER_EVENT",
    payload,
  });
}

function installClickListener() {
 const LOG = "[SaleSeer]";

function describeNode(node) {
  if (!node) return "null";
  if (node instanceof Element) {
    return {
      tag: node.tagName,
      cls: node.className,
      id: node.id,
      role: node.getAttribute("role"),
      aria: node.getAttribute("aria-label"),
      text: (node.innerText || node.textContent || "").trim().slice(0, 120),
      testid: node.getAttribute("data-testid"),
    };
  }
  return { type: node.nodeName };
}
document.addEventListener(
  "click",
  async (event) => {
    if (!SETTINGS.triggerEnabled) return;

    console.log("[SaleSeer] stage 0: click received");

    const clickable = findClickableFromEvent(event);

    if (!clickable) {
      console.log("[SaleSeer] STOP: no clickable ancestor");
      return;
    }

    console.log("[SaleSeer] clickable candidate:", clickable);

    const isAdd = isAddToCartButton(clickable);
    console.log("[SaleSeer] stage 1: isAddToCartButton =", isAdd);

    if (!isAdd) {
      console.log("[SaleSeer] STOP: not recognized as add-to-cart button");
      return;
    }

    const info = extractProductInfo(clickable);
    console.log("[SaleSeer] stage 2: extracted info =", info);

    const supermarket = info.supermarket;
    if (!supermarket) {
      console.log("[SaleSeer] STOP: supermarket not detected");
      return;
    }

      const dedupeKey = `${info.productName}|${info.productUrl}|${supermarket}`;
      const now = Date.now();
      if (lastSent.key === dedupeKey && now - lastSent.ts < 2000) return;
      lastSent = { key: dedupeKey, ts: now };

      const productKey = matchProductKey(info.productName);
      if (!productKey) {
        console.warn("No product_key match for:", info.productName);
        return;
      }

      const currentRow = findCurrentRow(productKey, supermarket);
      if (!currentRow) {
        console.warn("No database row found for:", productKey, supermarket);
        return;
      }

      const currentPrice = toNumber(currentRow.current_price_aud);
      const betterRow = findBetterPriceRow(productKey, supermarket, currentPrice);
      const dashboardUrl = buildDashboardUrl(productKey, supermarket);
      const prediction = buildPrediction(currentRow);

      renderSummaryBox({
        info,
        currentRow,
        betterRow,
        dashboardUrl,
        prediction,
      });

      sendDebugLog({
        matchedProductName: info.productName,
        productKey,
        supermarket,
        currentPrice: currentRow.current_price_aud,
        betterStore: betterRow?.supermarket || null,
        dashboardUrl,
        prediction: prediction.text,
      });
    },
    true
  );
}
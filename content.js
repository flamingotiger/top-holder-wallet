const TARGET_HASH = "holders";
const ACCOUNT_SELECTOR = "table tr td:nth-of-type(2) a.text-current";

const DEX_SCREENER_SOLANA_PAGE = "https://dexscreener.com/solana";
const DEX_SCREENER_X_SELECTOR =
  '.chakra-stack.custom-1qmkv3p a[href*="twitter.com/"], .chakra-stack.custom-1qmkv3p a[href*="x.com/"]';
const DEX_SCREENER_SOLANA_SELECTOR =
  '.custom-0 > .chakra-stack > .chakra-stack:nth-of-type(9) a[href*="solscan.io/token/"]';

function shouldRunScan() {
  return window.location.hash.includes(TARGET_HASH);
}

function sendHolderLinks(links) {
  if (!links.length) return;
  chrome.runtime.sendMessage({
    type: "OPEN_HOLDER_LINKS",
    links,
  });
}

function collectLinksFromRows() {
  const rows = document.querySelectorAll("table tr");
  const links = new Set();

  rows.forEach((row) => {
    const text = (row.textContent || "").toLowerCase();
    if (!text || text.includes("pump") || text.includes("raydium")) {
      return;
    }

    const anchor = row.querySelector("a[href]");
    if (!anchor) {
      return;
    }

    const href = anchor.href;
    if (!href || !href.includes("/market")) {
      return;
    }

    links.add(href);
  });

  sendHolderLinks(Array.from(links));
}

function runScanWhenReady() {
  if (!shouldRunScan()) {
    return;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", collectLinksFromRows, {
      once: true,
    });
  } else {
    collectLinksFromRows();
  }
}

window.addEventListener("hashchange", () => {
  if (shouldRunScan()) {
    runScanWhenReady();
  }
});

runScanWhenReady();

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "OPEN_ACCOUNT_TEXT_CURRENT") {
    collectAccountLinks();
    openXLinks();
    openSolScanLinks();
  }
});

function openXLinks() {
  if (!window.location.href.startsWith(DEX_SCREENER_SOLANA_PAGE)) {
    return;
  }
  const anchors = document.querySelectorAll(DEX_SCREENER_X_SELECTOR);
  // const anchors = document.querySelectorAll(
  //   'a[href*="x.com"], a[href*="twitter.com"]'
  // );
  const links = new Set();

  anchors.forEach((anchor) => {
    const href = anchor.href || anchor.getAttribute("href");
    if (!href) {
      return;
    }

    links.add(href);
  });

  chrome.runtime.sendMessage({
    type: "OPEN_ACCOUNT_LINKS",
    links: Array.from(links),
  });
}
function openSolScanLinks() {
  if (!window.location.href.startsWith(DEX_SCREENER_SOLANA_PAGE)) {
    return;
  }
  const anchors = document.querySelectorAll(DEX_SCREENER_SOLANA_SELECTOR);
  const links = new Set();

  anchors.forEach((anchor) => {
    const href = anchor.href || anchor.getAttribute("href");
    if (!href) {
      return;
    }

    try {
      const url = new URL(href, window.location.origin);
      url.hash = "holders";
      links.add(url.href);
    } catch (error) {
      links.add(`${href}#holders`);
    }
  });

  chrome.runtime.sendMessage({
    type: "OPEN_ACCOUNT_LINKS",
    links: Array.from(links),
  });
}

function collectAccountLinks() {
  if (!window.location.hash.includes(TARGET_HASH)) {
    return;
  }
  const elements = document.querySelectorAll(ACCOUNT_SELECTOR);
  const links = new Set();

  elements.forEach((element) => {
    const href =
      element.href || element.getAttribute("href") || element.dataset?.href;

    if (!href || !href.includes("/account/")) {
      return;
    }

    let normalizedHref = href;
    try {
      normalizedHref = new URL(href, window.location.origin).href;
    } catch (error) {
      normalizedHref = href;
    }

    links.add(normalizedHref);
  });

  if (links.size) {
    chrome.runtime.sendMessage({
      type: "OPEN_ACCOUNT_LINKS",
      links: Array.from(links),
    });
  }
}

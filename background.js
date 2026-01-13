function openLinks(links) {
  const safeLinks = Array.isArray(links) ? links : [];
  const delay = 300;
  safeLinks.forEach((link, index) => {
    if (typeof link !== 'string' || !link) {
      return;
    }

    setTimeout(() => {
      chrome.tabs.create({
        url: `${link}#portfolio`,
        active: false
      });
    }, index * delay);
  });
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'OPEN_HOLDER_LINKS' || message?.type === 'OPEN_ACCOUNT_LINKS') {
    openLinks(message.links);
  }
});

chrome.action.onClicked.addListener((tab) => {
  if (!tab?.id) {
    return;
  }

  chrome.tabs.sendMessage(tab.id, { type: 'OPEN_ACCOUNT_TEXT_CURRENT' }, () => {
    if (chrome.runtime.lastError) {
      // ignore errors when the tab has no content script
    }
  });
});

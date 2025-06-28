// Background script for Twitter Scraper extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle any background tasks if needed
  if (request.action === 'updateProgress') {
    // Forward message to popup if it's open
    chrome.runtime.sendMessage(request);
  } else if (request.action === 'scrapingComplete') {
    // Forward message to popup
    chrome.runtime.sendMessage(request);
  } else if (request.action === 'scrapingError') {
    // Forward message to popup
    chrome.runtime.sendMessage(request);
  }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Twitter Scraper extension installed');
});
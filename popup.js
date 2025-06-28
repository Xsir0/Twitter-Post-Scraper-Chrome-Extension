document.addEventListener('DOMContentLoaded', function() {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const exportBtn = document.getElementById('exportBtn');
  const statusText = document.getElementById('statusText');
  const statusDot = document.getElementById('statusDot');
  const tweetCount = document.getElementById('tweetCount');
  const progressFill = document.getElementById('progressFill');
  const userInfo = document.getElementById('userInfo');
  const exportSection = document.getElementById('exportSection');

  let isScrapingActive = false;
  let scrapedData = [];

  // Check if we're on a Twitter page
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const url = tabs[0].url;
    if (!url.includes('twitter.com') && !url.includes('x.com')) {
      updateStatus('Please navigate to a Twitter profile page', 'error');
      startBtn.disabled = true;
    } else {
      // Check if it's a profile page
      chrome.tabs.sendMessage(tabs[0].id, {action: 'checkPage'}, function(response) {
        if (chrome.runtime.lastError) {
          updateStatus('Please refresh the page and try again', 'error');
          startBtn.disabled = true;
          return;
        }
        
        if (response && response.isProfilePage) {
          updateStatus('Ready to scrape', 'ready');
          if (response.userInfo) {
            showUserInfo(response.userInfo);
          }
        } else {
          updateStatus('Please navigate to a user profile page', 'error');
          startBtn.disabled = true;
        }
      });
    }
  });

  startBtn.addEventListener('click', function() {
    if (startBtn.disabled) return;
    
    isScrapingActive = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    updateStatus('Starting scraper...', 'loading');
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'startScraping'});
    });
  });

  stopBtn.addEventListener('click', function() {
    if (stopBtn.disabled) return;
    
    isScrapingActive = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    updateStatus('Stopping scraper...', 'loading');
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'stopScraping'});
    });
  });

  exportBtn.addEventListener('click', function() {
    if (scrapedData.length === 0) {
      updateStatus('No data to export', 'error');
      return;
    }
    
    const dataStr = JSON.stringify(scrapedData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const url = URL.createObjectURL(dataBlob);
    const filename = `twitter_posts_${new Date().toISOString().split('T')[0]}.json`;
    
    chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: true
    }, function(downloadId) {
      if (downloadId) {
        updateStatus('Export completed successfully!', 'ready');
        setTimeout(() => {
          updateStatus(`${scrapedData.length} tweets exported`, 'ready');
        }, 2000);
      } else {
        updateStatus('Export failed', 'error');
      }
    });
  });

  // Listen for messages from content script
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'updateProgress') {
      updateProgress(request.data);
    } else if (request.action === 'scrapingComplete') {
      onScrapingComplete(request.data);
    } else if (request.action === 'scrapingError') {
      onScrapingError(request.error);
    }
  });

  function updateStatus(text, type = 'ready') {
    statusText.textContent = text;
    statusDot.className = 'status-dot';
    if (type !== 'ready') {
      statusDot.classList.add(type);
    }
  }

  function updateProgress(data) {
    tweetCount.textContent = `${data.count} tweets found`;
    scrapedData = data.tweets;
    
    // Update progress bar (simulate progress based on scroll position)
    const progress = Math.min((data.count / 100) * 100, 90); // Cap at 90% until complete
    progressFill.style.width = `${progress}%`;
    
    if (data.count > 0) {
      exportSection.style.display = 'block';
    }
  }

  function onScrapingComplete(data) {
    isScrapingActive = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    scrapedData = data.tweets;
    
    updateStatus(`Scraping complete! Found ${data.tweets.length} tweets`, 'ready');
    tweetCount.textContent = `${data.tweets.length} tweets found`;
    progressFill.style.width = '100%';
    exportSection.style.display = 'block';
  }

  function onScrapingError(error) {
    isScrapingActive = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    updateStatus(`Error: ${error}`, 'error');
  }

  function showUserInfo(userInfo) {
    document.getElementById('userName').textContent = userInfo.name;
    document.getElementById('userHandle').textContent = userInfo.handle;
    document.getElementById('userAvatar').src = userInfo.avatar;
    userInfo.style.display = 'flex';
  }
});
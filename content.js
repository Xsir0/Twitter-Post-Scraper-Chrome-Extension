class TwitterScraper {
  constructor() {
    this.isActive = false;
    this.scrapedTweets = new Set();
    this.allTweets = [];
    this.scrollInterval = null;
    this.lastScrollHeight = 0;
    this.noNewContentCount = 0;
    this.maxNoNewContentAttempts = 5;
  }

  checkPage() {
    const url = window.location.href;
    const isProfilePage = /https:\/\/(twitter|x)\.com\/[^\/]+\/?$/.test(url);
    
    let userInfo = null;
    if (isProfilePage) {
      userInfo = this.getUserInfo();
    }
    
    return {
      isProfilePage,
      userInfo
    };
  }

  getUserInfo() {
    try {
      // Try to get user info from the page
      const nameElement = document.querySelector('[data-testid="UserName"] span') || 
                          document.querySelector('h2[role="heading"] span');
      const handleElement = document.querySelector('[data-testid="UserName"] a') ||
                           document.querySelector('h2[role="heading"]').parentElement.querySelector('a');
      const avatarElement = document.querySelector('[data-testid="UserAvatar-Container-unknown"] img') ||
                           document.querySelector('a[role="link"] img[alt*="profile"]');

      const name = nameElement ? nameElement.textContent.trim() : 'Unknown User';
      const handle = handleElement ? handleElement.textContent.trim() : '@unknown';
      const avatar = avatarElement ? avatarElement.src : '';

      return { name, handle, avatar };
    } catch (error) {
      console.error('Error getting user info:', error);
      return { name: 'Unknown User', handle: '@unknown', avatar: '' };
    }
  }

  startScraping() {
    if (this.isActive) return;
    
    this.isActive = true;
    this.scrapedTweets.clear();
    this.allTweets = [];
    this.lastScrollHeight = 0;
    this.noNewContentCount = 0;
    
    console.log('Starting Twitter scraping...');
    this.sendMessage('updateProgress', { count: 0, tweets: [] });
    
    // Start the scraping process
    this.scrapeVisibleTweets();
    this.startAutoScroll();
  }

  stopScraping() {
    this.isActive = false;
    if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = null;
    }
    
    this.sendMessage('scrapingComplete', {
      tweets: this.allTweets,
      totalCount: this.allTweets.length
    });
    
    console.log('Scraping stopped. Total tweets:', this.allTweets.length);
  }

  startAutoScroll() {
    if (!this.isActive) return;
    
    this.scrollInterval = setInterval(() => {
      if (!this.isActive) {
        clearInterval(this.scrollInterval);
        return;
      }
      
      // Scrape currently visible tweets
      this.scrapeVisibleTweets();
      
      // Check if we've reached the end
      const currentHeight = document.documentElement.scrollHeight;
      if (currentHeight === this.lastScrollHeight) {
        this.noNewContentCount++;
        if (this.noNewContentCount >= this.maxNoNewContentAttempts) {
          console.log('No new content found after multiple attempts. Finishing scraping.');
          this.stopScraping();
          return;
        }
      } else {
        this.noNewContentCount = 0;
        this.lastScrollHeight = currentHeight;
      }
      
      // Scroll down
      window.scrollTo(0, document.documentElement.scrollHeight);
      
      // Wait a bit for new content to load
      setTimeout(() => {
        this.scrapeVisibleTweets();
      }, 1000);
      
    }, 2000); // Scroll every 2 seconds
  }

  scrapeVisibleTweets() {
    if (!this.isActive) return;
    
    // Find all tweet articles
    const tweetElements = document.querySelectorAll('article[data-testid="tweet"]');
    
    tweetElements.forEach(tweetElement => {
      try {
        const tweetData = this.extractTweetData(tweetElement);
        if (tweetData && !this.scrapedTweets.has(tweetData.id)) {
          this.scrapedTweets.add(tweetData.id);
          this.allTweets.push(tweetData);
        }
      } catch (error) {
        console.error('Error extracting tweet data:', error);
      }
    });
    
    // Send progress update
    this.sendMessage('updateProgress', {
      count: this.allTweets.length,
      tweets: this.allTweets
    });
  }

  extractTweetData(tweetElement) {
    try {
      // Extract tweet ID from URL or data attributes
      const timeElement = tweetElement.querySelector('time');
      const tweetId = this.extractTweetId(tweetElement, timeElement);
      
      if (!tweetId) return null;

      // Extract text content
      const textElement = tweetElement.querySelector('[data-testid="tweetText"]');
      const text = textElement ? textElement.textContent.trim() : '';

      // Extract timestamp
      const timestamp = timeElement ? timeElement.getAttribute('datetime') : null;
      const timeText = timeElement ? timeElement.textContent.trim() : '';

      // Extract author info
      const authorElement = tweetElement.querySelector('[data-testid="User-Names"]');
      const authorName = authorElement ? 
        authorElement.querySelector('span:first-child')?.textContent.trim() : '';
      const authorHandle = authorElement ?
        authorElement.querySelector('a')?.textContent.trim() : '';

      // Extract engagement metrics
      const replyCount = this.extractMetric(tweetElement, 'reply');
      const retweetCount = this.extractMetric(tweetElement, 'retweet');
      const likeCount = this.extractMetric(tweetElement, 'like');

      // Extract media
      const mediaElements = tweetElement.querySelectorAll('img[src*="pbs.twimg.com"]');
      const media = Array.from(mediaElements).map(img => ({
        type: 'image',
        url: img.src,
        alt: img.alt || ''
      }));

      // Extract links
      const linkElements = tweetElement.querySelectorAll('a[href*="http"]');
      const links = Array.from(linkElements)
        .filter(link => !link.href.includes('twitter.com') && !link.href.includes('x.com'))
        .map(link => ({
          url: link.href,
          text: link.textContent.trim()
        }));

      return {
        id: tweetId,
        text,
        author: {
          name: authorName,
          handle: authorHandle
        },
        timestamp,
        timeText,
        engagement: {
          replies: replyCount,
          retweets: retweetCount,
          likes: likeCount
        },
        media,
        links,
        url: `https://twitter.com${tweetElement.querySelector('a[href*="/status/"]')?.getAttribute('href') || ''}`,
        scrapedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in extractTweetData:', error);
      return null;
    }
  }

  extractTweetId(tweetElement, timeElement) {
    // Try to get ID from time element link
    if (timeElement && timeElement.parentElement && timeElement.parentElement.href) {
      const match = timeElement.parentElement.href.match(/\/status\/(\d+)/);
      if (match) return match[1];
    }
    
    // Try to get from any status link in the tweet
    const statusLink = tweetElement.querySelector('a[href*="/status/"]');
    if (statusLink) {
      const match = statusLink.href.match(/\/status\/(\d+)/);
      if (match) return match[1];
    }
    
    // Fallback: create a unique ID based on content
    const textElement = tweetElement.querySelector('[data-testid="tweetText"]');
    const text = textElement ? textElement.textContent : '';
    return text ? btoa(text.substring(0, 50)).replace(/[^a-zA-Z0-9]/g, '') : null;
  }

  extractMetric(tweetElement, type) {
    const testIds = {
      'reply': 'reply',
      'retweet': 'retweet',
      'like': 'like'
    };
    
    const element = tweetElement.querySelector(`[data-testid="${testIds[type]}"]`);
    if (!element) return 0;
    
    const countElement = element.querySelector('[data-testid="app-text-transition-container"]') ||
                        element.querySelector('span');
    
    if (!countElement) return 0;
    
    const countText = countElement.textContent.trim();
    if (!countText || countText === '0') return 0;
    
    // Convert abbreviated numbers (1.2K -> 1200, 1M -> 1000000)
    if (countText.includes('K')) {
      return Math.round(parseFloat(countText) * 1000);
    } else if (countText.includes('M')) {
      return Math.round(parseFloat(countText) * 1000000);
    } else {
      return parseInt(countText.replace(/,/g, '')) || 0;
    }
  }

  sendMessage(action, data) {
    try {
      chrome.runtime.sendMessage({ action, data });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
}

// Initialize scraper
const scraper = new TwitterScraper();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'checkPage':
      sendResponse(scraper.checkPage());
      break;
    case 'startScraping':
      scraper.startScraping();
      sendResponse({ success: true });
      break;
    case 'stopScraping':
      scraper.stopScraping();
      sendResponse({ success: true });
      break;
  }
});

console.log('Twitter Scraper content script loaded');
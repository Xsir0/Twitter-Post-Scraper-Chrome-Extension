# Twitter Post Scraper Chrome Extension

A powerful Chrome extension that automatically scrapes all posts from a Twitter user's profile and exports them as organized JSON data.

## Features

- **Smart Profile Detection**: Automatically detects Twitter/X user profile pages
- **Automated Scrolling**: Progressively loads all tweets by auto-scrolling
- **Comprehensive Data Extraction**: Captures text, timestamps, author info, engagement metrics, media, and links
- **Real-time Progress**: Live updates showing scraping progress and tweet count
- **JSON Export**: Clean, structured JSON export with all scraped data
- **Beautiful UI**: Modern, responsive popup interface with smooth animations

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The Twitter Scraper icon will appear in your extensions toolbar

## Usage

1. Navigate to any Twitter/X user profile page (e.g., `https://twitter.com/username`)
2. Click the Twitter Scraper extension icon in your toolbar
3. The extension will detect the profile and show user information
4. Click "Start Scraping" to begin collecting tweets
5. Watch the real-time progress as tweets are discovered
6. Click "Stop" at any time to halt the process
7. Click "Export JSON" to download the scraped data

## Data Structure

The exported JSON contains an array of tweet objects with the following structure:

```json
[
  {
    "id": "1234567890",
    "text": "Tweet content...",
    "author": {
      "name": "Display Name",
      "handle": "@username"
    },
    "timestamp": "2024-01-15T10:30:00.000Z",
    "timeText": "Jan 15",
    "engagement": {
      "replies": 42,
      "retweets": 128,
      "likes": 512
    },
    "media": [
      {
        "type": "image",
        "url": "https://pbs.twimg.com/media/...",
        "alt": "Image description"
      }
    ],
    "links": [
      {
        "url": "https://example.com",
        "text": "Link text"
      }
    ],
    "url": "https://twitter.com/username/status/1234567890",
    "scrapedAt": "2024-01-15T12:00:00.000Z"
  }
]
```

## Technical Details

- Uses Chrome Extension Manifest V3
- Implements content scripts for DOM interaction
- Automatic scroll detection and rate limiting
- Robust error handling and recovery
- Memory-efficient tweet deduplication
- Support for both twitter.com and x.com domains

## Permissions

- `activeTab`: Access current tab content for scraping
- `scripting`: Inject content scripts into Twitter pages  
- `downloads`: Enable JSON file export
- `host_permissions`: Access Twitter/X domains

## Browser Compatibility

- Chrome 88+
- Edge 88+
- Any Chromium-based browser with extension support

## License

MIT License - feel free to modify and distribute
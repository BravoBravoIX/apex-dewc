import { useState, useEffect, useRef } from 'react';

const MediaTemplatesPage = () => {
  const [twitterTemplate, setTwitterTemplate] = useState('');
  const [facebookTemplate, setFacebookTemplate] = useState('');
  const [breakingNewsTemplate, setBreakingNewsTemplate] = useState('');
  const [intelligenceTemplate, setIntelligenceTemplate] = useState('');
  const twitterIframeRef = useRef<HTMLIFrameElement>(null);
  const facebookIframeRef = useRef<HTMLIFrameElement>(null);
  const breakingNewsIframeRef = useRef<HTMLIFrameElement>(null);
  const intelligenceIframeRef = useRef<HTMLIFrameElement>(null);

  // Sample data for preview
  const sampleData = {
    twitter: {
      avatarInitial: 'P',
      displayName: '@PeacefulPacific2025',
      source: '@PeacefulPacific2025',
      body: 'Australian warships conducting aggressive exercises near our waters. This is provocation! They claim \'freedom of navigation\' but it\'s really intimidation. The region won\'t stand for this! #StopAustralianAggression',
      timestamp: '1h 26m ago',
      retweets: '142',
      likes: '1203',
      views: '12547'
    },
    facebook: {
      avatarInitial: 'G',
      displayName: '@GreenpeaceAU',
      timestamp: '2h 15m ago',
      body: 'SHOCKING: Satellite images show oil slick from military exercise. While they play war games, they\'re poisoning our waters. This is exactly why we oppose militarization of our seas!',
      reactions: '248',
      comments: '32',
      shares: '18'
    },
    breakingNews: {
      headline: 'Major Cybersecurity Breach Detected in Regional Networks',
      body: 'Security analysts have identified a significant breach affecting multiple organizations across the Asia-Pacific region. Early reports suggest coordinated attacks targeting critical infrastructure. Authorities are investigating the source and extent of the compromise.',
      source: 'Reuters',
      timestamp: '2h ago'
    },
    intelligence: {
      headline: 'Unusual Naval Activity Detected',
      body: 'SIGINT intercepts indicate coordinated movement of multiple surface vessels in contested waters. Pattern analysis suggests planned exercise or potential show of force. Recommend continued monitoring and assessment of regional response.',
      source: 'Intelligence Assessment Unit',
      timestamp: '45m ago'
    }
  };

  useEffect(() => {
    // Load Twitter template
    fetch('/scenarios/templates/social/twitter.html')
      .then(res => res.text())
      .then(html => setTwitterTemplate(html))
      .catch(err => console.error('Failed to load Twitter template:', err));

    // Load Facebook template
    fetch('/scenarios/templates/social/facebook.html')
      .then(res => res.text())
      .then(html => setFacebookTemplate(html))
      .catch(err => console.error('Failed to load Facebook template:', err));

    // Load Breaking News template
    fetch('/scenarios/templates/news/breaking-news.html')
      .then(res => res.text())
      .then(html => setBreakingNewsTemplate(html))
      .catch(err => console.error('Failed to load Breaking News template:', err));

    // Load Intelligence template
    fetch('/scenarios/templates/intelligence/intelligence.html')
      .then(res => res.text())
      .then(html => setIntelligenceTemplate(html))
      .catch(err => console.error('Failed to load Intelligence template:', err));
  }, []);

  const getTwitterHTML = () => {
    const data = sampleData.twitter;
    if (!twitterTemplate) return '';

    return twitterTemplate
      .replace(/\{\{AVATAR_INITIAL\}\}/g, data.avatarInitial)
      .replace(/\{\{DISPLAY_NAME\}\}/g, data.displayName)
      .replace(/\{\{SOURCE\}\}/g, data.source)
      .replace(/\{\{BODY\}\}/g, data.body)
      .replace(/\{\{TIMESTAMP\}\}/g, data.timestamp)
      .replace(/\{\{RETWEETS\}\}/g, data.retweets)
      .replace(/\{\{LIKES\}\}/g, data.likes)
      .replace(/\{\{VIEWS\}\}/g, data.views);
  };

  const getFacebookHTML = () => {
    const data = sampleData.facebook;
    if (!facebookTemplate) return '';

    return facebookTemplate
      .replace(/\{\{AVATAR_INITIAL\}\}/g, data.avatarInitial)
      .replace(/\{\{DISPLAY_NAME\}\}/g, data.displayName)
      .replace(/\{\{TIMESTAMP\}\}/g, data.timestamp)
      .replace(/\{\{BODY\}\}/g, data.body)
      .replace(/\{\{REACTIONS\}\}/g, data.reactions)
      .replace(/\{\{COMMENTS\}\}/g, data.comments)
      .replace(/\{\{SHARES\}\}/g, data.shares);
  };

  const getBreakingNewsHTML = () => {
    const data = sampleData.breakingNews;
    if (!breakingNewsTemplate) return '';

    return breakingNewsTemplate
      .replace(/\{\{HEADLINE\}\}/g, data.headline)
      .replace(/\{\{BODY\}\}/g, data.body)
      .replace(/\{\{SOURCE\}\}/g, data.source)
      .replace(/\{\{TIMESTAMP\}\}/g, data.timestamp)
      .replace(/\{\{IMAGES\}\}/g, ''); // No images in preview
  };

  const getIntelligenceHTML = () => {
    const data = sampleData.intelligence;
    if (!intelligenceTemplate) return '';

    return intelligenceTemplate
      .replace(/\{\{HEADLINE\}\}/g, data.headline)
      .replace(/\{\{BODY\}\}/g, data.body)
      .replace(/\{\{SOURCE\}\}/g, data.source)
      .replace(/\{\{TIMESTAMP\}\}/g, data.timestamp);
  };

  const handleIframeLoad = (iframeRef: React.RefObject<HTMLIFrameElement>) => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const body = iframe.contentWindow?.document.body;
      if (body) {
        iframe.style.height = `${body.scrollHeight}px`;
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Media Templates</h1>
        <p className="text-text-secondary mt-2">
          Preview media templates for Twitter/X, Facebook, and Breaking News
        </p>
      </div>

      {/* Twitter Template */}
      <div className="bg-surface rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-3">Twitter/X Template</h2>
        <div className="bg-black rounded-lg mb-4" style={{ width: '600px' }}>
          <iframe
            ref={twitterIframeRef}
            srcDoc={getTwitterHTML()}
            className="border-0"
            title="twitter template preview"
            style={{ width: '600px', border: 'none', display: 'block' }}
            onLoad={() => handleIframeLoad(twitterIframeRef)}
          />
        </div>
        <div className="bg-background rounded-lg p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-2">Template Variables</h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
            <div><code className="bg-surface px-2 py-1 rounded text-xs">AVATAR_INITIAL</code> - First letter</div>
            <div><code className="bg-surface px-2 py-1 rounded text-xs">DISPLAY_NAME</code> - Display name</div>
            <div><code className="bg-surface px-2 py-1 rounded text-xs">SOURCE</code> - Handle (@username)</div>
            <div><code className="bg-surface px-2 py-1 rounded text-xs">BODY</code> - Tweet text</div>
            <div><code className="bg-surface px-2 py-1 rounded text-xs">TIMESTAMP</code> - When posted</div>
            <div><code className="bg-surface px-2 py-1 rounded text-xs">RETWEETS</code> - Retweet count</div>
            <div><code className="bg-surface px-2 py-1 rounded text-xs">LIKES</code> - Like count</div>
            <div><code className="bg-surface px-2 py-1 rounded text-xs">VIEWS</code> - View count</div>
          </div>
        </div>
      </div>

      {/* Facebook Template */}
      <div className="bg-surface rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-3">Facebook Template</h2>
        <div className="bg-gray-200 rounded-lg mb-4" style={{ width: '600px' }}>
          <iframe
            ref={facebookIframeRef}
            srcDoc={getFacebookHTML()}
            className="border-0"
            title="facebook template preview"
            style={{ width: '600px', border: 'none', display: 'block' }}
            onLoad={() => handleIframeLoad(facebookIframeRef)}
          />
        </div>
        <div className="bg-background rounded-lg p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-2">Template Variables</h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
            <div><code className="bg-surface px-2 py-1 rounded text-xs">AVATAR_INITIAL</code> - First letter</div>
            <div><code className="bg-surface px-2 py-1 rounded text-xs">DISPLAY_NAME</code> - Display name</div>
            <div><code className="bg-surface px-2 py-1 rounded text-xs">TIMESTAMP</code> - When posted</div>
            <div><code className="bg-surface px-2 py-1 rounded text-xs">BODY</code> - Post text</div>
            <div><code className="bg-surface px-2 py-1 rounded text-xs">REACTIONS</code> - Reaction count</div>
            <div><code className="bg-surface px-2 py-1 rounded text-xs">COMMENTS</code> - Comment count</div>
            <div><code className="bg-surface px-2 py-1 rounded text-xs">SHARES</code> - Share count</div>
          </div>
        </div>
      </div>

      {/* Breaking News Template */}
      <div className="bg-surface rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-3">Breaking News Template</h2>
        <div className="bg-white rounded-lg mb-4" style={{ width: '596px' }}>
          <iframe
            ref={breakingNewsIframeRef}
            srcDoc={getBreakingNewsHTML()}
            className="border-0"
            title="breaking news template preview"
            style={{ width: '596px', border: 'none', display: 'block' }}
            onLoad={() => handleIframeLoad(breakingNewsIframeRef)}
          />
        </div>
        <div className="bg-background rounded-lg p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-2">Template Variables</h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
            <div><code className="bg-surface px-2 py-1 rounded text-xs">HEADLINE</code> - News headline</div>
            <div><code className="bg-surface px-2 py-1 rounded text-xs">BODY</code> - News body text</div>
            <div><code className="bg-surface px-2 py-1 rounded text-xs">SOURCE</code> - News source</div>
            <div><code className="bg-surface px-2 py-1 rounded text-xs">TIMESTAMP</code> - When published</div>
            <div><code className="bg-surface px-2 py-1 rounded text-xs">IMAGES</code> - Embedded images (optional)</div>
          </div>
        </div>
      </div>

      {/* Intelligence Template */}
      <div className="bg-surface rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-3">Intelligence Template</h2>
        <div className="bg-white rounded-lg mb-4" style={{ width: '596px' }}>
          <iframe
            ref={intelligenceIframeRef}
            srcDoc={getIntelligenceHTML()}
            className="border-0"
            title="intelligence template preview"
            style={{ width: '596px', border: 'none', display: 'block' }}
            onLoad={() => handleIframeLoad(intelligenceIframeRef)}
          />
        </div>
        <div className="bg-background rounded-lg p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-2">Template Variables</h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
            <div><code className="bg-surface px-2 py-1 rounded text-xs">HEADLINE</code> - Intelligence headline</div>
            <div><code className="bg-surface px-2 py-1 rounded text-xs">BODY</code> - Intelligence body text</div>
            <div><code className="bg-surface px-2 py-1 rounded text-xs">SOURCE</code> - Intelligence source</div>
            <div><code className="bg-surface px-2 py-1 rounded text-xs">TIMESTAMP</code> - When received</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaTemplatesPage;

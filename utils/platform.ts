export const isTV = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isSmartTV = /smart-tv|smarttv|googletv|androidtv|hbbtv|netcast|viera|bravia|webos|tizen/i.test(userAgent);
  const isLargeScreenNoTouch = window.innerWidth >= 1080 && !('ontouchstart' in window);
  
  // Allow manual override via URL Path (/tv) OR Query Param (?mode=tv)
  // This enables easy access via "namadomain.com/tv"
  if (window.location.pathname === '/tv') return true;

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('mode') === 'tv') return true;

  return isSmartTV || isLargeScreenNoTouch;
};

export const isMobile = (): boolean => {
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase()) || ('ontouchstart' in window);
};
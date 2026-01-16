export const isTV = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isSmartTV = /smart-tv|smarttv|googletv|androidtv|hbbtv|netcast|viera|bravia|webos|tizen/i.test(userAgent);
  const isLargeScreenNoTouch = window.innerWidth >= 1080 && !('ontouchstart' in window);
  
  // Allow manual override for testing via URL param ?mode=tv
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('mode') === 'tv') return true;

  return isSmartTV || isLargeScreenNoTouch;
};

export const isMobile = (): boolean => {
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase()) || ('ontouchstart' in window);
};
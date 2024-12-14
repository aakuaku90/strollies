import React from 'react';

function PremiumBanner({ token, isPremium }) {
  if (!token || isPremium) return null;

  return (
    <div className="premium-banner">
      <p>Enjoy full track playback by upgrading to Spotify Premium!</p>
      <a href="https://www.spotify.com/premium/" target="_blank" rel="noopener noreferrer" className="upgrade-button">
        Upgrade to Premium
      </a>
    </div>
  );
}

export default PremiumBanner;

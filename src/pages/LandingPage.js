// src/pages/LandingPage.js
import React from 'react';
import './LandingPage.css'; // Import the CSS file

function LandingPage({ loginUrl }) {
  return (
    <div className="landing-page">
      <div className="landing-content">
        <h1 className="landing-title">Welcome to Strollify Track Search</h1>
        <p className="landing-subtitle">
          Discover playlists tailored to your listening time.
        </p>
        <a href={loginUrl} className="landing-login-button">Sign In with Spotify</a>
      </div>
    </div>
  );
}

export default LandingPage;

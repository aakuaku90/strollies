// src/hooks/useSpotifyPlayer.js
import { useEffect, useState } from 'react';

/**
 * Custom hook to initialize and manage the Spotify Web Playback SDK.
 *
 * @param {string} token - The Spotify access token.
 * @param {function} onPlayerReady - Callback function to execute when the player is ready.
 * @returns {string|null} - Returns an error message if an error occurs, otherwise null.
 */
const useSpotifyPlayer = (token, onPlayerReady) => {
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return; // Exit if no token is provided

    // Prevent multiple SDK initializations
    if (window.Spotify && window.Spotify.Player) {
      onPlayerReady(window.Spotify);
      return;
    }

    // Define the global callback function
    window.onSpotifyWebPlaybackSDKReady = () => {
      if (window.Spotify) {
        onPlayerReady(window.Spotify);
      } else {
        setError('Spotify SDK is not available.');
        console.error('Spotify SDK is not available.');
      }
    };

    // Create and append the SDK script
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;

    script.onload = () => {
      console.log('Spotify SDK script loaded successfully.');
    };

    script.onerror = () => {
      setError('Failed to load Spotify SDK.');
      console.error('Error loading Spotify SDK script.');
    };

    document.body.appendChild(script);

    // Cleanup function to remove the global callback and script if necessary
    return () => {
      window.onSpotifyWebPlaybackSDKReady = null;
      document.body.removeChild(script);
    };
  }, [token, onPlayerReady]);

  return error;
};

export default useSpotifyPlayer;
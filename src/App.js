// src/App.js
import { useEffect, useState, useCallback } from "react";
import './App.css';
import axios from 'axios';
import Button from './components/Button';
import Playlist from './components/Playlist';
import DropDown from './components/DropDown_Jeff';
import Locations from "./components/Locations";
import { LocationsContextProvider } from "./components/LocationsContext";
import PlaybackControls from './components/PlaybackControls'; // Importing PlaybackControls
import useSpotifyPlayer from './hooks/useSpotifyPlayer'; // Import the custom hook

function App() {
  // Accessing environment variables
  const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
  const REDIRECT_URI = process.env.REACT_APP_REDIRECT_URI;
  const AUTH_ENDPOINT = process.env.REACT_APP_AUTH_ENDPOINT;
  const RESPONSE_TYPE = process.env.REACT_APP_RESPONSE_TYPE;
  const SCOPES = process.env.REACT_APP_SCOPES;

  // State Variables
  const [token, setToken] = useState("");
  const [searchKey, setSearchKey] = useState("");
  const [totalTime, setTotalTime] = useState(""); // New state for total time
  const [tracks, setTracks] = useState([]);
  const [error, setError] = useState("");
  const [player, setPlayer] = useState(undefined);
  const [deviceId, setDeviceId] = useState("");
  const [currentTrack, setCurrentTrack] = useState(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [isPremium, setIsPremium] = useState(false); // Subscription status
  const [artistImages, setArtistImages] = useState({}); // Cache for artist images

  // Additional State Variables for Playback Controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0); // In milliseconds
  const [durationMs, setDurationMs] = useState(0); // In milliseconds
  const [volume, setVolume] = useState(0.5); // Default volume at 50%
  const [isLoading, setIsLoading] = useState(false); // Loading state

  // Handle Authentication on App Load
  useEffect(() => {
    const hash = window.location.hash;
    let storedToken = window.localStorage.getItem("token");

    if (!storedToken && hash) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      const expiresIn = params.get("expires_in");

      if (accessToken) {
        window.localStorage.setItem("token", accessToken);
        setToken(accessToken);

        // Automatically logout when token expires
        if (expiresIn) {
          setTimeout(() => {
            logout();
          }, expiresIn * 1000);
        }

        // Clear the URL hash
        window.location.hash = "";
      }
    } else {
      setToken(storedToken);
    }
  }, []);

  // Fetch User Profile to Determine Subscription Status
  useEffect(() => {
    if (!token) return;

    const fetchUserProfile = async () => {
      try {
        const { data } = await axios.get("https://api.spotify.com/v1/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setIsPremium(data.product === "premium");
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        setIsPremium(false);
      }
    };

    fetchUserProfile();
  }, [token]);

  // Initialize Spotify Web Playback SDK using the custom hook
  const initializePlayer = useCallback((Spotify) => {
    const spotifyPlayer = new Spotify.Player({
      name: "Your React Spotify Player",
      getOAuthToken: cb => { cb(token); },
      volume: 0.5
    });

    // Error handling
    spotifyPlayer.addListener('initialization_error', ({ message }) => { console.error(message); });
    spotifyPlayer.addListener('authentication_error', ({ message }) => { console.error(message); });
    spotifyPlayer.addListener('account_error', ({ message }) => { console.error(message); });
    spotifyPlayer.addListener('playback_error', ({ message }) => { console.error(message); });

    // Playback status updates
    spotifyPlayer.addListener('player_state_changed', state => {
      if (!state) {
        return;
      }

      setCurrentTrack(state.track_window.current_track);
      setIsPlaying(!state.paused);
      setCurrentTimeMs(state.position); // Position in ms
      setDurationMs(state.duration); // Duration in ms
    });

    // Ready
    spotifyPlayer.addListener('ready', ({ device_id }) => {
      console.log('Ready with Device ID', device_id);
      setDeviceId(device_id);
      setPlayerReady(true);
    });

    // Not Ready
    spotifyPlayer.addListener('not_ready', ({ device_id }) => {
      console.log('Device ID has gone offline', device_id);
      setPlayerReady(false);
    });

    // Connect to the player!
    spotifyPlayer.connect()
      .then(success => {
        if (success) {
          console.log('The Web Playback SDK successfully connected to Spotify!');
          setPlayer(spotifyPlayer);
        } else {
          console.error('The Web Playback SDK failed to connect to Spotify.');
          setError("Failed to connect to Spotify Player. Please try again.");
        }
      })
      .catch(err => {
        console.error('Error connecting to Spotify Player:', err);
        setError("An error occurred while connecting to the Spotify Player.");
      });

    // Volume Change Listener
    spotifyPlayer.addListener('player_state_changed', state => {
      if (!state) return;
      setVolume(state.volume);
    });
  }, [token]);

  // Use the custom hook to load and initialize the Spotify SDK
  const sdkError = useSpotifyPlayer(token, initializePlayer);

  // Handle SDK errors
  useEffect(() => {
    if (sdkError) {
      setError(sdkError);
    }
  }, [sdkError]);

  // Logout Function
  const logout = () => {
    setToken("");
    window.localStorage.removeItem("token");
    if (player) {
      player.disconnect();
    }
    setPlayerReady(false);
    setDeviceId("");
    setIsPlaying(false);
    setCurrentTimeMs(0);
    setDurationMs(0);
    setVolume(0.5);
  };

  // Function to Fetch Artist Image
  const fetchArtistImage = async (artistId) => {
    // Check if the image is already cached
    if (artistImages[artistId]) {
      return artistImages[artistId];
    }

    try {
      const { data } = await axios.get(`https://api.spotify.com/v1/artists/${artistId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const imageUrl = data.images.length > 0 ? data.images[0].url : null;

      // Update the cache
      setArtistImages(prev => ({ ...prev, [artistId]: imageUrl }));

      return imageUrl;
    } catch (err) {
      console.error(`Failed to fetch image for artist ID ${artistId}:`, err);
      return null;
    }
  };

  // Helper Function: Select Tracks Within Total Time (Greedy Algorithm)
  const selectTracksWithinTime = (tracks, totalTimeMs) => {
    // Sort tracks by duration descending to maximize time utilization
    const sortedTracks = [...tracks].sort((a, b) => b.duration_ms - a.duration_ms);

    const selectedTracks = [];
    let accumulatedTime = 0;

    for (let track of sortedTracks) {
      if (accumulatedTime + track.duration_ms <= totalTimeMs) {
        selectedTracks.push(track);
        accumulatedTime += track.duration_ms;
      }

      // Optional: Break early if accumulatedTime is close to totalTimeMs
      if (accumulatedTime >= totalTimeMs * 0.9) {
        break;
      }
    }

    return selectedTracks;
  };

  // Search Tracks Function with Enhanced Error Handling and Time Constraint
  const searchTracks = async (e) => {
    e.preventDefault();
    setError(""); // Reset any previous errors
    setTracks([]); // Reset previous tracks
    setIsLoading(true); // Start loading

    if (!searchKey.trim()) {
      setError("Please enter a search term.");
      setIsLoading(false);
      return;
    }

    if (!totalTime || isNaN(totalTime) || totalTime <= 0) {
      setError("Please enter a valid total time in minutes.");
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await axios.get("https://api.spotify.com/v1/search", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          q: searchKey,
          type: "track",
          limit: 50, // Fetch more tracks for better selection
        },
      });

      // Convert total time to milliseconds
      const totalTimeMs = totalTime * 60 * 1000;

      // Implement subset selection algorithm
      const selectedTracks = selectTracksWithinTime(data.tracks.items, totalTimeMs);
      // For more optimal selection, use:
      // const selectedTracks = selectTracksWithinTimeDP(data.tracks.items, totalTimeMs);

      if (selectedTracks.length === 0) {
        setError("No combination of tracks found within the specified time. Try increasing the total time or changing your search query.");
        setTracks([]);
        setIsLoading(false);
        return;
      }

      // Fetch artist images for selected tracks
      const tracksWithArtistImages = await Promise.all(selectedTracks.map(async (track) => {
        const artistId = track.artists[0].id;
        const artistImage = await fetchArtistImage(artistId);
        return {
          id: track.id,
          title: track.name,
          artist: track.artists.map(artist => artist.name).join(", "),
          duration: `${Math.floor(track.duration_ms / 60000)}:${Math.floor((track.duration_ms % 60000) / 1000).toString().padStart(2, '0')}`,
          uri: track.uri, // Spotify URI for full playback (Premium only)
          artistImage: artistImage, // Artist image URL
          duration_ms: track.duration_ms, // For total duration calculation
        };
      }));

      setTracks(tracksWithArtistImages);
    } catch (err) {
      if (err.response) {
        // Server responded with a status other than 2xx
        if (err.response.status === 401) {
          // Unauthorized - Token might be expired or invalid
          console.error("401 Unauthorized. Logging out.");
          logout();
          setError("Session expired. Please log in again.");
        } else {
          // Other server-side errors
          setError(`Error: ${err.response.status} - ${err.response.data.error.message}`);
        }
        console.error('Error response:', err.response);
      } else if (err.request) {
        // Request was made but no response received
        setError("No response from server. Please try again later.");
        console.error('Error request:', err.request);
      } else {
        // Something else happened while setting up the request
        setError(`Error: ${err.message}`);
        console.error('Error message:', err.message);
      }
    }

    setIsLoading(false); // Stop loading
  };

  // Helper Function: Calculate Total Duration
  const calculateTotalDuration = (tracks) => {
    const totalMs = tracks.reduce((acc, track) => acc + track.duration_ms, 0);
    const totalMinutes = Math.floor(totalMs / 60000);
    const totalSeconds = Math.floor((totalMs % 60000) / 1000);
    return `${totalMinutes}:${totalSeconds.toString().padStart(2, '0')}`;
  };

  // Function to Play a Full Track (Premium Only)
  const playTrack = (uri) => {
    if (!deviceId) {
      setError("No device ID found. Please ensure the player is ready and the Spotify Desktop App is open.");
      return;
    }

    axios({
      method: 'put',
      url: `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
      data: {
        uris: [uri],
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(() => {
        console.log("Playback started");
        setError(""); // Clear any existing errors
      })
      .catch(err => {
        console.error("Error starting playback:", err.response ? err.response.data : err.message);
        if (err.response && err.response.status === 401) {
          setError("Unauthorized. Please log in again.");
          logout();
        } else if (err.response && err.response.status === 403) {
          setError("Playback failed. Ensure you have a Spotify Premium account.");
        } else {
          setError("Failed to start playback. Please try again.");
        }
      });
  };

  // Function to Toggle Play/Pause
  const togglePlayPause = () => {
    if (!player) {
      setError("Player not initialized.");
      return;
    }

    player.togglePlay().catch(err => {
      console.error("Error toggling play/pause:", err);
      setError("Failed to toggle play/pause.");
    });
  };

  // Function to Skip to Next Track
  const skipNext = () => {
    if (!player) {
      setError("Player not initialized.");
      return;
    }

    player.nextTrack().catch(err => {
      console.error("Error skipping to next track:", err);
      setError("Failed to skip to next track.");
    });
  };

  // Function to Skip to Previous Track
  const skipPrevious = () => {
    if (!player) {
      setError("Player not initialized.");
      return;
    }

    player.previousTrack().catch(err => {
      console.error("Error skipping to previous track:", err);
      setError("Failed to skip to previous track.");
    });
  };

  // Function to Change Volume
  const changeVolume = (newVolume) => {
    if (!player) {
      setError("Player not initialized.");
      return;
    }

    player.setVolume(newVolume).catch(err => {
      console.error("Error setting volume:", err);
      setError("Failed to set volume.");
    });
  };

  // Function to Seek to a Position in the Track
  const seekTo = (position) => {
    if (!player || !currentTrack) {
      setError("Player not initialized or no track is playing.");
      return;
    }

    player.seek(position * 1000).catch(err => {
      console.error("Error seeking to position:", err);
      setError("Failed to seek to the selected position.");
    });
  };

  return (
    <div className="App">

      <header className="App-header">
        <h1>Spotify Track Search</h1>
        
        {/* Authentication Section */}
        {!token ? (
          <a
            href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=${RESPONSE_TYPE}&scope=${encodeURIComponent(SCOPES)}`}
            className="login-button"
          >
            Login to Spotify
          </a>
        ) : (
          <button onClick={logout} className="logout-button">Logout</button>
        )}

        {/* Search Form */}
        {token ? (
          <form onSubmit={searchTracks} className="search-form">
            <div className="form-group">
              <label htmlFor="search-input" className="visually-hidden">Search for a track</label>
              <input
                id="search-input"
                type="text"
                placeholder="Search for a track"
                value={searchKey}
                onChange={e => setSearchKey(e.target.value)}
                className="search-input"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="time-input" className="visually-hidden">Total Time in Minutes</label>
              <input
                id="time-input"
                type="number"
                placeholder="Total Time (minutes)"
                value={totalTime}
                onChange={e => setTotalTime(e.target.value)}
                className="time-input"
                min="1"
                required
                title="Enter the total listening time in minutes"
              />
            </div>
            
            <div className="form-group">
              <button type="submit" className="search-button">
                <i className="fas fa-search"></i> Search
              </button>
            </div>
          </form>
        ) : (
          <h2>Please log in to search for tracks.</h2>
        )}

        {/* Loading Indicator */}
        {isLoading && <p>Loading tracks...</p>}

        {/* Player Status */}
        {token && (
          <div className="player-status">
            {!playerReady && (
              <p>Initializing player...</p>
            )}
            {playerReady && (
              <p>Play your favorite tracks.</p>
            )}
          </div>
        )}

        {/* Premium Banner for Non-Premium Users */}
        {token && !isPremium && (
          <div className="premium-banner">
            <p>Enjoy full track playback by upgrading to Spotify Premium!</p>
            <a href="https://www.spotify.com/premium/" target="_blank" rel="noopener noreferrer" className="upgrade-button">
              Upgrade to Premium
            </a>
          </div>
        )}

        {/* Error Message */}
        {error && <p className="error-message">{error}</p>}

        {/* Total Duration Display */}
        {tracks.length > 0 && (
          <div className="playlist-info">
            <p>Total Duration: {calculateTotalDuration(tracks)}</p>
          </div>
        )}

        {/* Current Track Display */}
        {currentTrack && (
          <div className="current-track">
            {currentTrack.album.images.length > 0 && (
              <img src={currentTrack.album.images[0].url} alt="Current Track Album Cover" width="100px" />
            )}
            <div>
              <p><strong>Now Playing:</strong> {currentTrack.name}</p>
              <p><strong>Artist(s):</strong> {currentTrack.artists.map(artist => artist.name).join(", ")}</p>
            </div>
          </div>
        )}

        {/* Track Results */}
        {tracks.length > 0 && (
          <Playlist
            songData={tracks.map((track, index) => ({
              id: index + 1,
              title: track.title,
              artist: track.artist,
              duration: track.duration,
              uri: track.uri, // Spotify URI for full playback (Premium only)
              artistImage: track.artistImage, // Artist image URL
              duration_ms: track.duration_ms, // For total duration calculation
            }))}
            onPlay={playTrack}
            currentTrack={currentTrack}
            isPremium={isPremium}
            playerReady={playerReady}
          />
        )}

        {/* Playback Controls */}
        {isPremium && playerReady && currentTrack && (
          <PlaybackControls
            isPlaying={isPlaying}
            onPlayPause={togglePlayPause}
            onSkipNext={skipNext}
            onSkipPrevious={skipPrevious}
            volume={volume}
            onVolumeChange={changeVolume}
            currentTime={currentTimeMs / 1000} // Convert to seconds
            duration={durationMs / 1000} // Convert to seconds
            onSeek={seekTo}
          />
        )}
      </header>
    </div>
  );

}

export default App;

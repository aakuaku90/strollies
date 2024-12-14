// src/App.js
import { useEffect, useState, useCallback } from "react";
import './App.css';
import axios from 'axios';

import Playlist from './components/Playlist';
import PlaybackControls from './components/PlaybackControls';
import LoadingIndicator from './components/LoadingIndicator';
import PlayerStatus from './components/PlayerStatus';
import PremiumBanner from './components/PremiumBanner';
import ErrorMessage from './components/ErrorMessage';
import PlaylistInfo from './components/PlaylistInfo';
import CurrentTrackInfo from './components/CurrentTrackInfo';
import LandingPage from './pages/LandingPage';
import locations from "./data/location";

import useSpotifyPlayer from './hooks/useSpotifyPlayer';
import calculateTotalDuration from './utils/calculateTotalDuration';

function App() {
  // --- ENV ---
  const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
  const REDIRECT_URI = process.env.REACT_APP_REDIRECT_URI;
  const AUTH_ENDPOINT = process.env.REACT_APP_AUTH_ENDPOINT;
  const RESPONSE_TYPE = process.env.REACT_APP_RESPONSE_TYPE;
  const SCOPES = process.env.REACT_APP_SCOPES;

  const [currentPlayingTrack, setCurrentPlayingTrack] = useState(null);

  // --- STATE ---
  const [token, setToken] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  
  const [searchKey, setSearchKey] = useState("");
  const [totalTime, setTotalTime] = useState("");


  const [location, setLocation] = useState("place");
  const handleSelect = (e) => {
    setLocation(e.target.value);
    console.log("Selected Location:", e.target.value);
    console.log("Genres for Selected Location:", locations[e.target.value] || []);
  };


  const [tracks, setTracks] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [player, setPlayer] = useState(undefined);
  const [deviceId, setDeviceId] = useState("");
  const [currentTrack, setCurrentTrack] = useState(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [artistImages, setArtistImages] = useState({});

  // This state is used to trigger the slide-down animation when tracks appear
  const [showPlaylist, setShowPlaylist] = useState(false);

  // --- LOGOUT ---
  const logout = useCallback(() => {
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
  }, [player]);

  // --- TOKEN RETRIEVAL ---
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

        if (expiresIn) {
          setTimeout(() => {
            logout();
          }, expiresIn * 1000);
        }

        window.location.hash = "";
      }
    } else {
      setToken(storedToken);
    }
  }, [logout]);

  // --- FETCH USER PROFILE ---
  useEffect(() => {
    if (!token) return;
    const fetchUserProfile = async () => {
      try {
        const { data } = await axios.get("https://api.spotify.com/v1/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsPremium(data.product === "premium");
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        setIsPremium(false);
      }
    };
    fetchUserProfile();
  }, [token]);

  // --- INIT PLAYER ---
  const initializePlayer = useCallback((Spotify) => {
    const spotifyPlayer = new Spotify.Player({
      name: "Your React Spotify Player",
      getOAuthToken: cb => { cb(token); },
      volume: 0.5
    });

    spotifyPlayer.addListener('initialization_error', ({ message }) => { console.error(message); });
    spotifyPlayer.addListener('authentication_error', ({ message }) => { console.error(message); });
    spotifyPlayer.addListener('account_error', ({ message }) => { console.error(message); });
    spotifyPlayer.addListener('playback_error', ({ message }) => { console.error(message); });

    spotifyPlayer.addListener('player_state_changed', state => {
      if (!state) return;
      setCurrentTrack(state.track_window.current_track);
      setIsPlaying(!state.paused);
      setCurrentTimeMs(state.position);
      setDurationMs(state.duration);
    });

    spotifyPlayer.addListener('ready', ({ device_id }) => {
      console.log('Ready with Device ID', device_id);
      setDeviceId(device_id);
      setPlayerReady(true);
    });

    spotifyPlayer.addListener('not_ready', ({ device_id }) => {
      console.log('Device ID offline', device_id);
      setPlayerReady(false);
    });

    spotifyPlayer.connect()
      .then(success => {
        if (success) {
          console.log('Connected to Spotify player');
          setPlayer(spotifyPlayer);
        } else {
          console.error('Failed to connect to Spotify.');
          setError("Failed to connect to Spotify Player.");
        }
      })
      .catch(err => {
        console.error('Error connecting:', err);
        setError("An error occurred while connecting to the Spotify Player.");
      });

    spotifyPlayer.addListener('player_state_changed', state => {
      if (!state) return;
      setVolume(state.volume);
    });
  }, [token]);

  const sdkError = useSpotifyPlayer(token, initializePlayer);
  useEffect(() => {
    if (sdkError) {
      setError(sdkError);
    }
  }, [sdkError]);

  const fetchArtistImage = async (artistId) => {
    if (artistImages[artistId]) return artistImages[artistId];
    try {
      const { data } = await axios.get(`https://api.spotify.com/v1/artists/${artistId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const imageUrl = data.images.length > 0 ? data.images[0].url : null;
      setArtistImages(prev => ({ ...prev, [artistId]: imageUrl }));
      return imageUrl;
    } catch (err) {
      console.error(`Fetch img error:`, err);
      return null;
    }
  };

  const selectTracksWithinTime = (tracks, totalTimeMs) => {
    const sortedTracks = [...tracks].sort((a, b) => b.duration_ms - a.duration_ms);
    const selectedTracks = [];
    let accumulatedTime = 0;
    for (let track of sortedTracks) {
      if (accumulatedTime + track.duration_ms <= totalTimeMs) {
        selectedTracks.push(track);
        accumulatedTime += track.duration_ms;
      }
      if (accumulatedTime >= totalTimeMs * 0.9) {
        break;
      }
    }
    return selectedTracks;
  };

  const searchTracks = async () => {
    setError("");
    setTracks([]);
    setIsLoading(true);

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


    const selectedGenres = locations[location] || [];
    let query = searchKey.trim();

    // if (selectedGenres && selectedGenres.length > 0) {
    //   const genreQuery = selectedGenres.map(g => `genre:"${g}"`).join(' OR ');
    //   query += ` (${genreQuery})`;
    // }

    // Add genres to the query
    if (selectedGenres.length > 0) {
      const genreQuery = selectedGenres.map((g) => `genre:"${g}"`).join(" OR ");
      query += ` (${genreQuery})`;
    }


    try {
      const { data } = await axios.get("https://api.spotify.com/v1/search", {
        headers: { Authorization: `Bearer ${token}` },
        params: { q: query, type: "track", limit: 50 },
      });

      const totalTimeMs = totalTime * 60 * 1000;
      const selectedTracks = selectTracksWithinTime(data.tracks.items, totalTimeMs);

      if (selectedTracks.length === 0) {
        setError("No combination of tracks found within this domain.");
        setTracks([]);
        setIsLoading(false);
        return;
      }

      const tracksWithArtistImages = await Promise.all(selectedTracks.map(async (track) => {
        const artistId = track.artists[0].id;
        const artistImage = await fetchArtistImage(artistId);
        return {
          id: track.id,
          title: track.name,
          artist: track.artists.map(artist => artist.name).join(", "),
          duration: `${Math.floor(track.duration_ms / 60000)}:${Math.floor((track.duration_ms % 60000) / 1000).toString().padStart(2, '0')}`,
          uri: track.uri,
          artistImage: artistImage,
          duration_ms: track.duration_ms,
        };
      }));

      setTracks(tracksWithArtistImages);
      setShowPlaylist(true); // Trigger the slide-down animation
    } catch (err) {
      if (err.response) {
        if (err.response.status === 401) {
          console.error("401 Unauthorized. Logging out.");
          logout();
          setError("Session expired. Please log in again.");
        } else {
          setError(`Error: ${err.response.status} - ${err.response.data.error.message}`);
        }
      } else if (err.request) {
        setError("No response from server. Please try again later.");
      } else {
        setError(`Error: ${err.message}`);
      }
    }

    setIsLoading(false);
  };

  const playTrack = (uri, id) => {
    if (!deviceId) {
      setError("No device ID found. Open Spotify Desktop App.");
      return;
    }

  //   axios.put(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, { uris: [uri] }, {
  //     headers: { 'Authorization': `Bearer ${token}` }
  //   })
  //   .then(() => setError(""))
  //   .catch(err => {
  //     console.error("Error starting playback:", err);
  //     if (err.response && err.response.status === 401) {
  //       setError("Unauthorized. Please log in again.");
  //       logout();
  //     } else if (err.response && err.response.status === 403) {
  //       setError("Playback failed. Check Spotify Premium.");
  //     } else {
  //       setError("Failed to start playback. Please try again.");
  //     }
  //   });
  // };

  axios
    .put(
      `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
      { uris: [uri] },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    .then(() => {
      setError("");
      setCurrentPlayingTrack(id); // Set the playing track ID
    })
    .catch((err) => {
      console.error("Error starting playback:", err);
      if (err.response && err.response.status === 401) {
        setError("Unauthorized. Please log in again.");
        logout();
      } else if (err.response && err.response.status === 403) {
        setError("Playback failed. Check Spotify Premium.");
      } else {
        setError("Failed to start playback. Please try again.");
      }
    });
};


// Pass currentPlayingTrack and setCurrentPlayingTrack to the Playlist component
<Playlist
  songData={tracks.map((track, index) => ({
    id: track.id,
    title: track.title,
    artist: track.artist,
    duration: track.duration,
    uri: track.uri,
    artistImage: track.artistImage,
  }))}
  currentPlayingTrack={currentPlayingTrack}
  onPlay={(uri, id) => playTrack(uri, id)}
/>;

  const togglePlayPause = () => {
    if (!player) {
      setError("Player not initialized.");
      return;
    }
    player.togglePlay().catch(err => {
      console.error("Toggle play/pause:", err);
      setError("Failed to toggle play/pause.");
    });
  };

  const skipNext = () => {
    if (!player) {
      setError("Player not initialized.");
      return;
    }
    player.nextTrack().catch(err => {
      console.error("Skipping next:", err);
      setError("Failed to skip to next track.");
    });
  };

  const skipPrevious = () => {
    if (!player) {
      setError("Player not initialized.");
      return;
    }
    player.previousTrack().catch(err => {
      console.error("Skipping previous:", err);
      setError("Failed to skip previous track.");
    });
  };

  const changeVolume = (newVolume) => {
    if (!player) {
      setError("Player not initialized.");
      return;
    }
    player.setVolume(newVolume).catch(err => {
      console.error("Set volume:", err);
      setError("Failed to set volume.");
    });
  };

  const seekTo = (position) => {
    if (!player || !currentTrack) {
      setError("No track playing or player unready.");
      return;
    }
    player.seek(position * 1000).catch(err => {
      console.error("Seek error:", err);
      setError("Failed to seek.");
    });
  };

  const loginUrl = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=${RESPONSE_TYPE}&scope=${encodeURIComponent(SCOPES)}`;

  if (!token) {
    return <LandingPage loginUrl={loginUrl} />;
  }

  return (
    <div className="App">
      <header className="App-header">

        {/* Logout Button */}
        {token && (
          <button className="logout-button" onClick={logout}>Logout</button>
        )}

        <h1>Strollify Track Search</h1>
        
        <div className="main-text" style={{marginTop: '50px'}}>
          Make a playlist for my 
          <input 
            type="number"
            className="highlight-black"
            value={totalTime} 
            onChange={e => setTotalTime(e.target.value)} 
            style={{width: '50px', marginLeft: '8px', marginRight: '8px', textAlign: 'center'}}
            placeholder="30"
          /> 
          minutes
          <br />
          trip to 
          <select
            value={location}
            className="highlight-grey"
            onChange={handleSelect}
            style={{
              fontWeight: location !== "place" ? "bold" : "normal",
              color: location !== "place" ? "#000" : "#A9A9A9",
            }}
          >
            <option value="place" disabled style={{ color: "#A9A9A9" }}>
              -- place --
            </option>
            {Object.keys(locations).map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
          from
          <br/>
          this artist

          <input 
            type="text"
            className="highlight-grey"
            value={searchKey} 
            onChange={e => setSearchKey(e.target.value)}
            style={{width: '100px', marginLeft: '8px', marginRight: '8px', textAlign: 'center'}}
            placeholder="name"
          />
          
          <div className="footer-button" onClick={searchTracks}>Let's go!</div>
        </div>

        <LoadingIndicator isLoading={isLoading} />
        <PlayerStatus token={token} playerReady={playerReady} />
        <PremiumBanner token={token} isPremium={isPremium} />
        <ErrorMessage error={error} />
        <PlaylistInfo tracks={tracks} totalDuration={calculateTotalDuration(tracks)} />
        <CurrentTrackInfo currentTrack={currentTrack} />

        <div className={`playlist-container ${showPlaylist && tracks.length > 0 ? 'show' : ''}`}>
          {tracks.length > 0 && (
            <Playlist
              songData={tracks.map((track, index) => ({
                id: index + 1,
                title: track.title,
                artist: track.artist,
                duration: track.duration,
                uri: track.uri,
                artistImage: track.artistImage,
                duration_ms: track.duration_ms,
              }))}
              onPlay={playTrack}
              currentTrack={currentTrack}
              isPremium={isPremium}
              playerReady={playerReady}
            />
          )}

          {isPremium && playerReady && currentTrack && (
            <PlaybackControls
              isPlaying={isPlaying}
              onPlayPause={togglePlayPause}
              onSkipNext={skipNext}
              onSkipPrevious={skipPrevious}
              volume={volume}
              onVolumeChange={changeVolume}
              currentTime={currentTimeMs / 1000}
              duration={durationMs / 1000}
              onSeek={seekTo}
            />
          )}
        </div>
      </header>
    </div>
  );
}

export default App;

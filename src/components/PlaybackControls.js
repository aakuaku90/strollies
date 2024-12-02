//2 src/components/PlaybackControls.js
import React from 'react';
import './PlaybackControls.css'; // Ensure this CSS file exists

function PlaybackControls({
  isPlaying,
  onPlayPause,
  onSkipNext,
  onSkipPrevious,
  volume,
  onVolumeChange,
  currentTime,
  duration,
  onSeek,
}) {
  // Format time from seconds to mm:ss
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="playback-controls">
      {/* Skip Previous */}
      <button onClick={onSkipPrevious} className="control-button" title="Previous Track">
        ⏮️
      </button>

      {/* Play/Pause */}
      <button onClick={onPlayPause} className="control-button" title={isPlaying ? "Pause" : "Play"}>
        {isPlaying ? '⏸️' : '▶️'}
      </button>

      {/* Skip Next */}
      <button onClick={onSkipNext} className="control-button" title="Next Track">
        ⏭️
      </button>

      {/* Seek Bar */}
      <div className="seek-bar">
        <span>{formatTime(currentTime)}</span>
        <input
          type="range"
          min="0"
          max={duration}
          value={currentTime}
          onChange={(e) => onSeek(e.target.value)}
          className="seek-slider"
        />
        <span>{formatTime(duration)}</span>
      </div>

      {/* Volume Control */}
      <div className="volume-control">
        <span>🔊</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => onVolumeChange(e.target.value)}
          className="volume-slider"
        />
      </div>
    </div>
  );
}

export default PlaybackControls;



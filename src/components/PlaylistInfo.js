import React from 'react';

function PlaylistInfo({ tracks, totalDuration }) {
  if (tracks.length === 0) return null;

  return (
    <div className="playlist-info">
      <p>Playlist Duration: {totalDuration}</p>
    </div>
  );
}

export default PlaylistInfo;

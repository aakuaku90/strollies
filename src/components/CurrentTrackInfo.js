import React from 'react';

function CurrentTrackInfo({ currentTrack }) {
  if (!currentTrack) return null;

  return (
    <div className="current-track">
      {currentTrack.album.images.length > 0 && (
        <img src={currentTrack.album.images[0].url} alt="Current Track Album Cover" width="100px" />
      )}
      <div className='nowplaying'>
        <p><strong>Now Playing...</strong></p>
        <p>{ currentTrack.name}</p>
        <div className='artistss'><p>{currentTrack.artists.map(artist => artist.name).join(", ")}</p></div>
      </div>
    </div>
  );
}

export default CurrentTrackInfo;

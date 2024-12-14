function Song({ num, title, artist, duration, uri, artistImage, onPlay, isPlaying, isPremium, playerReady }) {
  const handleFullPlay = () => {
    if (!isPremium) {
      alert("Full playback is available for Spotify Premium users only.");
      return;
    }
    if (uri) {
      onPlay(uri);
    } else {
      alert("No track available for playback.");
    }
  };

  return (
    <article className={`song-row ${isPlaying ? 'playing' : ''}`}>
      {artistImage ? (
        <div className='artist-banner'>
          <img src={artistImage} alt={`${artist} Banner`} />
        </div>
      ) : (
        <div className='artist-banner placeholder'>🎵</div>
      )}

      <div className='song-details'>
        <div className='song-number-element'>{num}.</div>
        <div className='description-element'>
          <div className='song-title'>{title}</div>
          <div className='song-artist'>{artist}</div>
        </div>
        <div className='duration-element'>{duration}</div>
      </div>

      {isPremium && uri && (
        <div className='play-full-button-element'>
          <button 
            onClick={handleFullPlay} 
            className={`play-button ${isPlaying ? 'playing' : ''}`}
            title={isPlaying ? "Pause Full Track" : "Play Full Track"}
            disabled={!playerReady}
          >
            {isPlaying ? "⏸️" : "▶️"}
          </button>
        </div>
      )}
    </article>
  );
}

export default Song;

import Song from './Song';

function Playlist({ songData, onPlay, currentTrack, isPremium, playerReady }) {
  return (
    <section id='playlist'>
      {songData.map((song) => (
        <Song
          key={song.id}
          num={song.id}
          title={song.title}
          artist={song.artist}
          duration={song.duration}
          uri={song.uri}
          artistImage={song.artistImage}
          onPlay={onPlay}
          isPlaying={currentTrack && currentTrack.uri === song.uri}
          isPremium={isPremium}
          playerReady={playerReady}
        />
      ))}
    </section>
  );
}

export default Playlist;


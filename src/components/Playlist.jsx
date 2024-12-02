import Song from './Song';

function Playlist({songData}) {
  return (
    <section id='playlist'>{songData.map((song) => (
        <Song
            num={song.id}
            title={song.title}
            artist={song.artist}
            duration={song.duration}
        />
    ))}</section>
  )
}

export default Playlist
function Song({num, title, artist, duration}) {
  return (
    <article className='song-row'>
        <div className='song-number-element'>{num}.</div>
        <div className='description-element'>
            <div className='song-title'>{title}</div>
            <div className='song-artist'>{artist}</div>
        </div>
        <div className='duration-element'>{duration}</div>
    </article>
  )
}

export default Song
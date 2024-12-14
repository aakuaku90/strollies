export default function calculateTotalDuration(tracks) {
  const totalMs = tracks.reduce((acc, track) => acc + track.duration_ms, 0);
  const totalMinutes = Math.floor(totalMs / 60000);
  const totalSeconds = Math.floor((totalMs % 60000) / 1000);
  return `${totalMinutes}:${totalSeconds.toString().padStart(2, '0')}`;
}

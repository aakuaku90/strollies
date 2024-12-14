import React from 'react';

function PlayerStatus({ token, playerReady }) {
  if (!token) return null;
  return (
    <div className="player-status">
      {!playerReady ? <p>Initializing player...</p> : null}
    </div>
  );
}

export default PlayerStatus;


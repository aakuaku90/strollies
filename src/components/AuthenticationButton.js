import React from 'react';

function AuthenticationButton({ token, onLogout, loginUrl }) {
  return (
    <>
      {!token ? (
        <a href={loginUrl} className="login-button">
          Login to Spotify
        </a>
      ) : (
        <button onClick={onLogout} className="logout-button">Logout</button>
      )}
    </>
  );
}

export default AuthenticationButton;

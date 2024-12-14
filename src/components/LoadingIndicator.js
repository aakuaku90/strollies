import React from 'react';

function LoadingIndicator({ isLoading }) {
  return isLoading ? <p>Loading tracks...</p> : null;
}

export default LoadingIndicator;

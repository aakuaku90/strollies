import React from 'react';

function SearchForm({ searchKey, onSearchKeyChange, totalTime, onTotalTimeChange, onSearch }) {
  return (
    <form onSubmit={onSearch} className="search-form">
      <div className="form-group">
        <label htmlFor="search-input" className="visually-hidden">Search for a track</label>
        <input
          id="search-input"
          type="text"
          placeholder="Search for a track"
          value={searchKey}
          onChange={e => onSearchKeyChange(e.target.value)}
          className="search-input"
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="time-input" className="visually-hidden">Total Time in Minutes</label>
        <input
          id="time-input"
          type="number"
          placeholder="Total Time (minutes)"
          value={totalTime}
          onChange={e => onTotalTimeChange(e.target.value)}
          className="time-input"
          min="1"
          required
          title="Enter the total listening time in minutes"
        />
      </div>
      
      <div className="form-group">
        <button type="submit" className="search-button">
          <i className="fas fa-search"></i> Search
        </button>
      </div>
    </form>
  );
}

export default SearchForm;

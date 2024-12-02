import React from 'react';
import { useLocationsContext } from './LocationsContext';

function Locations() {
  const { options, selectedOption, open, openDropDown, selectOption } = useLocationsContext();

  return (
    <>
      <div className="dropdown" onClick={openDropDown}>
        <span>{selectedOption}</span>
        <ul className={`menu ${open ? 'open' : ''}`}>
          {options.map((option, index) => (
            <li key={index} onClick={() => selectOption(option)}>
              {option}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default Locations;

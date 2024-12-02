import React, { createContext, useContext, useState } from "react";

// Create the context
const LocationsContext = createContext(); // Updated name

// Custom hook to access the context
export const useLocationsContext = () => {
  return useContext(LocationsContext);
};

// Context provider
export const LocationsContextProvider = ({ children }) => {
  const [open, setOpen] = useState(false); // State for the dropdown's open/close status
  const [selectedOption, setSelectedOption] = useState("School"); // State for the currently selected option
  const allOptions = ["School", "Gym", "Party", "Park", "Cafe"]; // Original options list
  const options = allOptions.filter(option => option !== selectedOption); // Exclude the selected option

  // Toggle the dropdown open/close state
  const openDropDown = () => setOpen(!open);

  // Select an option and close the dropdown
  const selectOption = (option) => {
    setSelectedOption(option); // Update the selected option
    setOpen(false); // Close the dropdown
  };

  // Provide context values
  return (
    <LocationsContext.Provider
      value={{ options, selectedOption, open, openDropDown, selectOption }}
    >
      {children}
    </LocationsContext.Provider>
  );
};

export default LocationsContext; // Updated default export

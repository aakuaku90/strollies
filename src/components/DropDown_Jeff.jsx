// DropDown_Jeff.js
function DropDown({ type, selection }) {
  return (
    <select>
      {selection.map((option, index) => (
        <option key={index} value={option}>
          {type} {option}
        </option>
      ))}
    </select>
  );
}

export default DropDown;
function DropDown({selection, type}) {
  return (
    <select name={type}>{selection.map((item) => (
        <option value={item}>{item}</option>
        ))}
    </select>
  )
}

export default DropDown
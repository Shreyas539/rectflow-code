import React from "react";

const nodeOptions = [
  { type: "square", label: "Router", color: "#f39c12" },
  { type: "square", label: "Switch", color: "#2980b9" },
  { type: "square", label: "Router 2", color: "#f39c12" },
  { type: "square", label: "Switch 2", color: "#2980b9" },
  { type: "circle", label: "Laptop", color: "#27ae60" },
  { type: "triangle", label: "Time Server", color: "#8e44ad" },
];

export const DropDown = ({ onNodeSelect }) => {
  const handleChange = (e) => {
    const selected = nodeOptions.find((opt) => opt.label === e.target.value);
    if (selected) onNodeSelect(selected);
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "20px",
        left: "20px",
        zIndex: 1000,
        backgroundColor: "white",
        padding: "10px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      }}
    >
      <label style={{ fontWeight: "bold", display: "block", marginBottom: 4 }}>
        Add Node
      </label>
      <select onChange={handleChange} defaultValue="">
        <option value="" disabled>
          Select Node
        </option>
        {nodeOptions.map((opt) => (
          <option key={opt.label} value={opt.label}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

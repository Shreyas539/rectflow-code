import { Handle, Position } from "@xyflow/react";
import React from "react";

export const SquareNode = ({ id, data }) => {
  const portCount = 16; // 16 on top, 16 on bottom
  const totalWidth = 200;

  const handleStyle = {
    width: 10,
    height: 10,
    opacity: 0, // 👈 invisible
    pointerEvents: "auto", // 👈 connectable
    position: "absolute",
    zIndex: 2,
  };

  const portLabelStyle = {
    position: "absolute",
    fontSize: 8,
    color: "#000",
    userSelect: "none",
  };

  const statusColorMap = {
    normal: "#2ecc71",
    unmanaged: "#3498db",
    minor: "#f39c12",
    major: "#e74c3c",
  };

  const backgroundColor = statusColorMap[data?.status] || "#ccc";

  return (
    <div
      style={{
        position: "relative",
        width: totalWidth,
        height: 100,
        backgroundColor: data?.color || "#ccc",
        borderRadius: 6,
      }}
    >
      {/* Top Handles */}
      {Array.from({ length: portCount }).map((_, i) => {
        const leftPercent = (i + 1) * (100 / (portCount + 1));
        return (
          <React.Fragment key={`top-${i}`}>
            <Handle
              id={`top-${i + 1}`}
              type="source"
              position={Position.Top}
              isConnectable={true}
              style={{
                ...handleStyle,
                left: `${leftPercent}%`,
                top: -1,
                transform: "translateX(-50%)",
              }}
            />
            {data?.showLabels && (
              <div
                style={{
                  ...portLabelStyle,
                  top: -16,
                  left: `${leftPercent}%`,
                  transform: "translateX(-50%)",
                }}
              >
                {i + 1}
              </div>
            )}
          </React.Fragment>
        );
      })}

      {/* Bottom Handles */}
      {Array.from({ length: portCount }).map((_, i) => {
        const leftPercent = (i + 1) * (100 / (portCount + 1));
        return (
          <React.Fragment key={`bottom-${i}`}>
            <Handle
              id={`bottom-${i + portCount + 1}`}
              type="target"
              position={Position.Bottom}
              isConnectable={true}
              style={{
                ...handleStyle,
                left: `${leftPercent}%`,
                bottom: -5,
                transform: "translateX(-50%)",
              }}
            />
            {data?.showLabels && (
              <div
                style={{
                  ...portLabelStyle,
                  bottom: -18,
                  left: `${leftPercent}%`,
                  transform: "translateX(-50%)",
                }}
              >
                {i + portCount + 1}
              </div>
            )}
          </React.Fragment>
        );
      })}

      {/* Label in Center */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontWeight: "bold",
          fontSize: 12,
          color: "#111",
        }}
      >
        {data?.label || "Node"}
      </div>
    </div>
  );
};

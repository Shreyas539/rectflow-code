import React, { useCallback, useState, useRef, useEffect } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  MarkerType,
  reconnectEdge,
} from "@xyflow/react";
import { HexColorPicker } from "react-colorful";
import "@xyflow/react/dist/style.css";

import { ShapePalette } from "./ShapePalette";
import { CircleNode } from "./CircleNode";

import { TriangleNode } from "./TriangleNode";
import { SquareNode } from "./SquareNode";
import DownloadButton from "./DownloadButton";
import { AnimatedSVGEdge } from "./AnimatedSvgEdge";
import { DropDown } from "./NodeDropDown";

const nodeTypes = {
  circle: CircleNode,
  triangle: TriangleNode,
  square: SquareNode,
};

const edgeTypes = {
  animatedSvg: AnimatedSVGEdge,
};

const initialNodes = [];
const initialEdges = [];
// let nodeId = 1;
const snapGrid = [25, 25];
const defaultViewport = { x: 0, y: 0, zoom: 1.5 };

export const ReactFlowWrapper = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [rfInstance, setRfInstance] = useState(null);
  const { screenToFlowPosition, setViewport, toObject } = useReactFlow();

  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [color, setColor] = useState("#00b894");
  const [pickerPos, setPickerPos] = useState({ x: 0, y: 0 });

  // const [jsonData, setJsonData] = useState(null);

  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    node: null,
  });

  const onNodeContextMenu = (event, node) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      node,
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, node: null });
  };

  useEffect(() => {
    const handleClickOutside = () => closeContextMenu();
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const [edgeMenu, setEdgeMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    edgeId: null,
  });

  const onEdgeContextMenu = useCallback((event, edge) => {
    event.preventDefault();
    setEdgeMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      edgeId: edge.id,
    });
  }, []);

  const updateEdgeStatus = (status) => {
    const statusStyles = {
      // working: {
      //   stroke: "#27ae60",
      //   strokeWidth: 2,
      //   animated: true,
      //   label: "Connected",
      // },
      "not-working": {
        stroke: "#e74c3c",
        strokeWidth: 1,
        animated: false,
        label: "Not Working",
      },
      "high-latency": {
        stroke: "#f39c12",
        strokeWidth: 2,
        animated: false,
        label: "High Latency",
      },
      disconnected: {
        stroke: "#e74c3c",
        strokeWidth: 1,
        strokeDasharray: "5,5",
        animated: false,
        label: "Disconnected",
      },
    };

    setEdges((eds) =>
      eds.map((e) =>
        e.id === edgeMenu.edgeId
          ? {
              ...e,
              style: {
                ...e.style,
                stroke: statusStyles[status].stroke,
                strokeWidth: statusStyles[status].strokeWidth,
                strokeDasharray: statusStyles[status].strokeDasharray || "0",
              },
              animated: statusStyles[status].animated,
              label: statusStyles[status].label,
              data: { ...e.data, status },
            }
          : e
      )
    );

    setEdgeMenu({ ...edgeMenu, visible: false });
  };

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            markerEnd: { type: MarkerType.Arrow },
            type: "smoothstep",
            animated: "true",
            // label: params.source,
          },
          eds
        )
      ),
    [setEdges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const shapeData = event.dataTransfer.getData("application/reactflow");
      if (!shapeData) return;

      const shape = JSON.parse(shapeData);
      const position = screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const newNode = {
        // id: `node_${nodeId++}`,
        id: "id-" + Math.random().toString(36).substr(2, 9),
        type: shape.type,
        position,
        data: { label: shape.label, color: shape.color }, // we store color here
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [screenToFlowPosition, setNodes]
  );

  const onNodeClick = (event, node) => {
    const bounds = event.target.getBoundingClientRect();
    setPickerPos({ x: bounds.x, y: bounds.y });
    setSelectedNodeId(node.id);
    setColor(node.style?.background || "#00b894");
  };

  const handleColorChange = (newColor) => {
    setColor(newColor);
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNodeId
          ? { ...n, data: { ...n.data, color: newColor } } // update color in data
          : n
      )
    );
  };

  const handleDownload = () => {
    const data = toObject();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    // console.log(JSON.stringify(data, null, 2))
    const a = document.createElement("a");
    a.href = url;
    a.download = "flow.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onSave = () => {
    if (rfInstance) {
      const flow = rfInstance.toObject();
      localStorage.setItem("flow-diagram", JSON.stringify(flow));
    }
  };

  const onRestore = () => {
    const saved = localStorage.getItem("flow-diagram");
    if (saved) {
      const flow = JSON.parse(saved);
      setNodes(flow.nodes || []);
      setEdges(flow.edges || []);
      setViewport(flow.viewport || { x: 0, y: 0, zoom: 1 });
    }
  };

  const handleFileChange = (event) => {
    // if(initialNodes){
    //     alert("If you have node / drawings already on the canvas , that may be replaced with the drawing from you selected file")
    // }

    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        const jsonString = e.target.result;
        try {
          const parsedData = JSON.parse(jsonString);

          setNodes(parsedData.nodes);
          setEdges(parsedData.edges);
          // setJsonData(parsedData); // Store the parsed JSON data in state
          // console.log(parsedData)
        } catch (error) {
          console.error("Error parsing JSON:", error);
          alert("Invalid JSON file.");
          //   setJsonData(null);
        }
      };

      reader.readAsText(file);
    }
  };

  const onReconnect = useCallback(
    (oldEdge, newConnection) => {
      setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
    },
    [setEdges]
  );

  const clearCanvas = () => {
    setEdges([]);
    setNodes([]);
  };

  const handleNodeSelect = (selectedNode) => {
    const position = { x: 250, y: 100 + nodes.length * 80 };

    const newNode = {
      id: `node-${Date.now()}`,
      type: selectedNode.type,
      position,
      data: {
        label: selectedNode.label,
        color: selectedNode.color,
      },
    };

    setNodes((nds) => [...nds, newNode]);
  };

  return (
    <div style={{ width: "100vw", height: "100vh" }} ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setRfInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onEdgeContextMenu={onEdgeContextMenu}
        onNodeContextMenu={onNodeContextMenu}
        nodeTypes={nodeTypes}
        snapToGrid={true}
        snapGrid={snapGrid}
        defaultViewport={defaultViewport}
        deleteKeyCode={["Delete", "Backspace"]}
        onReconnect={onReconnect} // Enable edge reconnection
        reconnectable={"true"} // Allow individual edges to be reconnected
        edgeTypes={edgeTypes}
        fitView
        className="download-image"
      >
        <MiniMap zoomable pannable />
        <Controls />

        <Background
          variant="dots"
          gap={12}
          size={1}
          style={{ backgroundColor: "#E3F2FD" }}
        />
      </ReactFlow>

      {/* <ShapePalette /> */}
      <DropDown onNodeSelect={handleNodeSelect} />

      {selectedNodeId && (
        <div
          style={{
            position: "absolute",
            left: pickerPos.x + 60,
            top: pickerPos.y + 60,
            background: "#fff",
            border: "1px solid #ccc",
            padding: 10,
            borderRadius: 6,
            zIndex: 9999,
          }}
        >
          <HexColorPicker color={color} onChange={handleColorChange} />
          <button
            onClick={() => setSelectedNodeId(null)}
            style={{ marginTop: 10 }}
          >
            Close
          </button>
        </div>
      )}

      {edgeMenu.visible && (
        <div
          style={{
            position: "absolute",
            top: edgeMenu.y,
            left: edgeMenu.x,
            background: "white",
            border: "1px solid #ccc",
            padding: 10,
            borderRadius: 6,
            zIndex: 1000,
          }}
        >
          <strong>Set Link Status</strong>
          <div style={{ marginTop: 6, display: "flex", gap: "10px" }}>
            {/* <button onClick={() => updateEdgeStatus("working")}>
              ✅ Working
            </button> */}
            <button onClick={() => updateEdgeStatus("not-working")}>
              ❌ Not Working
            </button>
            <button onClick={() => updateEdgeStatus("high-latency")}>
              ⚠️ High Latency
            </button>
            <button onClick={() => updateEdgeStatus("disconnected")}>
              🚫 Disconnected
            </button>
          </div>
        </div>
      )}

      {contextMenu.visible && (
        <div
          style={{
            position: "absolute",
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: "white",
            border: "1px solid #ccc",
            borderRadius: 6,
            padding: "10px",
            zIndex: 10000,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            fontSize: "12px",
            minWidth: "150px",
          }}
        >
          <strong>Node Info</strong>
          <hr />
          <p>
            <b>ID:</b> {contextMenu.node.id}
          </p>
          <p>
            <b>Label:</b> {contextMenu.node.data?.label}
          </p>
          <p>
            <b>Type:</b> {contextMenu.node.type}
          </p>
          <p>
            <b>Color:</b> {contextMenu.node.data?.color}
          </p>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          background: "white",
          padding: 10,
          borderRadius: 8,
          boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
          display: "flex",

          gap: "10px",
        }}
      >
        <button onClick={handleDownload}>Download Flow as JSON</button>
        <button onClick={onSave}>Save</button>
        <button onClick={onRestore}>Restore</button>
        <DownloadButton />
        <button onClick={clearCanvas}>Clear canvas</button>
        <div>
          <input
            id="file-upload"
            type="file"
            accept=".json"
            onChange={handleFileChange}
          />
        </div>
      </div>

      <div
        id="demo-content"
        style={{
          maxHeight: "100vh",
          minWidth: "300px",
          height: "min-content",
          backgroundColor: "white",
          borderRadius: "10px",
          width: "min-content",
          position: "absolute",
          top: "70px",
          right: "20px",
          padding: "20px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        }}
      >
        {" "}
        demo content
      </div>
    </div>
  );
};

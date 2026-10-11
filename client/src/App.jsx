import React, { useCallback, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes = [
  {
    id: '1',
    position: { x: 250, y: 100 },
    data: { label: 'Start Trigger' },
    type: 'input',
  },
];

const initialEdges = [];

let nodeId = 2;

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = (type, label) => {
    const newNode = {
      id: `${nodeId++}`,
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
      },
      data: { label },
      type: type === 'trigger' ? 'input' : type === 'output' ? 'output' : 'default',
    };
    setNodes((nds) => nds.concat(newNode));
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
      {/* Sidebar */}
      <div
        style={{
          width: '220px',
          background: '#1e1e2f',
          color: 'white',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <h3 style={{ margin: '0 0 10px 0' }}>Add Nodes</h3>

        <button onClick={() => addNode('trigger', 'Trigger')} style={btnStyle}>
          + Trigger
        </button>

        <button onClick={() => addNode('default', 'Action')} style={btnStyle}>
          + Action
        </button>

        <button onClick={() => addNode('default', 'Condition')} style={btnStyle}>
          + Condition
        </button>

        <button onClick={() => addNode('output', 'End')} style={btnStyle}>
          + End
        </button>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}

const btnStyle = {
  padding: '10px',
  background: '#3b82f6',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
};

export default App;
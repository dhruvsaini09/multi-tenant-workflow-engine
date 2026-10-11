import React, { useCallback, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom Node Component
const CustomNode = ({ data }) => {
  const getNodeStyle = () => {
    switch (data.nodeType) {
      case 'trigger':
        return {
          background: '#10b981',
          color: 'white',
          border: '2px solid #059669',
        };
      case 'action':
        return {
          background: '#3b82f6',
          color: 'white',
          border: '2px solid #2563eb',
        };
      case 'condition':
        return {
          background: '#f59e0b',
          color: 'white',
          border: '2px solid #d97706',
        };
      case 'end':
        return {
          background: '#ef4444',
          color: 'white',
          border: '2px solid #dc2626',
        };
      default:
        return {
          background: '#6b7280',
          color: 'white',
          border: '2px solid #4b5563',
        };
    }
  };

  return (
    <div
      style={{
        padding: '12px 18px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '600',
        minWidth: '140px',
        textAlign: 'center',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        ...getNodeStyle(),
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
      {data.label}
      <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

const initialNodes = [
  {
    id: '1',
    position: { x: 250, y: 100 },
    data: { label: 'Start Trigger', nodeType: 'trigger' },
    type: 'custom',
  },
];

const initialEdges = [];

let nodeId = 2;

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  const addNode = (nodeType, label) => {
    const newNode = {
      id: `${nodeId++}`,
      position: {
        x: Math.random() * 450 + 50,
        y: Math.random() * 350 + 50,
      },
      data: { label, nodeType },
      type: 'custom',
    };
    setNodes((nds) => nds.concat(newNode));
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
      {/* Sidebar */}
      <div
        style={{
          width: '230px',
          background: '#111827',
          color: 'white',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Add Nodes</h3>

        <button onClick={() => addNode('trigger', 'Trigger')} style={{ ...btnStyle, background: '#10b981' }}>
          + Trigger
        </button>

        <button onClick={() => addNode('action', 'Action')} style={{ ...btnStyle, background: '#3b82f6' }}>
          + Action
        </button>

        <button onClick={() => addNode('condition', 'Condition')} style={{ ...btnStyle, background: '#f59e0b' }}>
          + Condition
        </button>

        <button onClick={() => addNode('end', 'End')} style={{ ...btnStyle, background: '#ef4444' }}>
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
          nodeTypes={nodeTypes}
          fitView
        >
          <Background color="#aaa" gap={16} />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}

const btnStyle = {
  padding: '11px',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600',
};

export default App;
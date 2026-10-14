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

// ========== Custom Node with Status ==========
const CustomNode = ({ data }) => {
  const getBaseStyle = () => {
    switch (data.nodeType) {
      case 'trigger':
        return { background: '#10b981', border: '2px solid #059669' };
      case 'action':
        return { background: '#3b82f6', border: '2px solid #2563eb' };
      case 'condition':
        return { background: '#f59e0b', border: '2px solid #d97706' };
      case 'end':
        return { background: '#ef4444', border: '2px solid #dc2626' };
      default:
        return { background: '#6b7280', border: '2px solid #4b5563' };
    }
  };

  const getStatusStyle = () => {
    switch (data.status) {
      case 'running':
        return {
          boxShadow: '0 0 0 3px #3b82f6, 0 0 12px #3b82f6',
          animation: 'pulse 1.5s infinite',
        };
      case 'success':
        return { boxShadow: '0 0 0 3px #10b981' };
      case 'failed':
        return { boxShadow: '0 0 0 3px #ef4444' };
      default:
        return {};
    }
  };

  const getStatusBadge = () => {
    const badges = {
      pending: { text: 'Pending', bg: '#6b7280' },
      running: { text: 'Running', bg: '#3b82f6' },
      success: { text: 'Success', bg: '#10b981' },
      failed: { text: 'Failed', bg: '#ef4444' },
    };
    const badge = badges[data.status] || badges.pending;

    return (
      <div
        style={{
          position: 'absolute',
          top: '-10px',
          right: '-10px',
          background: badge.bg,
          color: 'white',
          fontSize: '10px',
          padding: '2px 6px',
          borderRadius: '10px',
          fontWeight: '600',
        }}
      >
        {badge.text}
      </div>
    );
  };

  return (
    <div
      style={{
        padding: '14px 20px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '600',
        minWidth: '150px',
        textAlign: 'center',
        color: 'white',
        position: 'relative',
        ...getBaseStyle(),
        ...getStatusStyle(),
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
      {data.label}
      <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
      {getStatusBadge()}
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

// ========== Loop Detection Helper ==========
const wouldCreateCycle = (nodes, edges, source, target) => {
  const graph = {};
  nodes.forEach((node) => {
    graph[node.id] = [];
  });
  edges.forEach((edge) => {
    if (graph[edge.source]) graph[edge.source].push(edge.target);
  });
  if (graph[source]) graph[source].push(target);

  const visited = new Set();
  const recStack = new Set();

  const dfs = (nodeId) => {
    if (recStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    recStack.add(nodeId);

    for (let neighbor of graph[nodeId] || []) {
      if (dfs(neighbor)) return true;
    }
    recStack.delete(nodeId);
    return false;
  };

  for (let node of nodes) {
    if (dfs(node.id)) return true;
  }
  return false;
};

// ========== Main App ==========
const initialNodes = [
  {
    id: '1',
    position: { x: 250, y: 100 },
    data: { label: 'Start Trigger', nodeType: 'trigger', status: 'pending' },
    type: 'custom',
  },
];

const initialEdges = [];
let nodeId = 2;

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [errorMsg, setErrorMsg] = useState('');

  const onConnect = useCallback(
    (params) => {
      if (wouldCreateCycle(nodes, edges, params.source, params.target)) {
        setErrorMsg('Loop detected! This connection would create a cycle.');
        setTimeout(() => setErrorMsg(''), 3000);
        return;
      }
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
      setErrorMsg('');
    },
    [nodes, edges, setEdges]
  );

  const addNode = (nodeType, label) => {
    const newNode = {
      id: `${nodeId++}`,
      position: {
        x: Math.random() * 450 + 50,
        y: Math.random() * 350 + 50,
      },
      data: { label, nodeType, status: 'pending' },
      type: 'custom',
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const deleteSelectedNodes = () => {
    const selectedIds = nodes.filter((n) => n.selected).map((n) => n.id);
    setNodes((nds) => nds.filter((node) => !node.selected));
    setEdges((eds) =>
      eds.filter(
        (edge) => !selectedIds.includes(edge.source) && !selectedIds.includes(edge.target)
      )
    );
  };

  // Simulate execution status change (for testing)
  const simulateExecution = () => {
    setNodes((nds) =>
      nds.map((node, index) => {
        if (index === 0) return { ...node, data: { ...node.data, status: 'success' } };
        if (index === 1) return { ...node, data: { ...node.data, status: 'running' } };
        return { ...node, data: { ...node.data, status: 'pending' } };
      })
    );
  };

  const resetStatus = () => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: { ...node.data, status: 'pending' },
      }))
    );
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
      {/* Sidebar */}
      <div
        style={{
          width: '240px',
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

        <hr style={{ borderColor: '#374151', margin: '10px 0' }} />

        <button onClick={deleteSelectedNodes} style={{ ...btnStyle, background: '#dc2626' }}>
          Delete Selected
        </button>

        <hr style={{ borderColor: '#374151', margin: '10px 0' }} />

        <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#9ca3af' }}>Simulation</h4>
        <button onClick={simulateExecution} style={{ ...btnStyle, background: '#8b5cf6' }}>
          Simulate Run
        </button>
        <button onClick={resetStatus} style={{ ...btnStyle, background: '#6b7280' }}>
          Reset Status
        </button>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
        {errorMsg && (
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#dc2626',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              zIndex: 10,
              fontWeight: '600',
            }}
          >
            {errorMsg}
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          deleteKeyCode={['Backspace', 'Delete']}
        >
          <Background color="#aaa" gap={16} />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {/* CSS for pulse animation */}
      <style>
        {`
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
            100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
          }
        `}
      </style>
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
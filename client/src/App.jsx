import React, { useCallback, useState, useEffect } from 'react';
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

// ========== Custom Node ==========
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

const nodeTypes = { custom: CustomNode };

// ========== Loop Detection ==========
const wouldCreateCycle = (nodes, edges, source, target) => {
  const graph = {};
  nodes.forEach((n) => (graph[n.id] = []));
  edges.forEach((e) => {
    if (graph[e.source]) graph[e.source].push(e.target);
  });
  if (graph[source]) graph[source].push(target);

  const visited = new Set();
  const recStack = new Set();

  const dfs = (id) => {
    if (recStack.has(id)) return true;
    if (visited.has(id)) return false;
    visited.add(id);
    recStack.add(id);
    for (let n of graph[id] || []) {
      if (dfs(n)) return true;
    }
    recStack.delete(id);
    return false;
  };

  return nodes.some((n) => dfs(n.id));
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

let nodeId = 2;

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [wsStatus, setWsStatus] = useState('disconnected'); // disconnected | connecting | connected

  const onConnect = useCallback(
    (params) => {
      if (wouldCreateCycle(nodes, edges, params.source, params.target)) {
        setErrorMsg('Loop detected! Connection blocked.');
        setTimeout(() => setErrorMsg(''), 3000);
        return;
      }
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
    },
    [nodes, edges, setEdges]
  );

  const addNode = (nodeType, label) => {
    const newNode = {
      id: `${nodeId++}`,
      position: { x: Math.random() * 450 + 50, y: Math.random() * 350 + 50 },
      data: { label, nodeType, status: 'pending' },
      type: 'custom',
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const deleteSelectedNodes = () => {
    const selectedIds = nodes.filter((n) => n.selected).map((n) => n.id);
    setNodes((nds) => nds.filter((n) => !n.selected));
    setEdges((eds) =>
      eds.filter((e) => !selectedIds.includes(e.source) && !selectedIds.includes(e.target))
    );
  };

  // Simulate WebSocket connection
  const connectWebSocket = () => {
    setWsStatus('connecting');
    setTimeout(() => {
      setWsStatus('connected');
    }, 1200);
  };

  const disconnectWebSocket = () => {
    setWsStatus('disconnected');
  };

  // Simulate live execution tracing
  const startLiveTracing = () => {
    if (wsStatus !== 'connected') {
      setErrorMsg('Please connect WebSocket first!');
      setTimeout(() => setErrorMsg(''), 2500);
      return;
    }

    const orderedNodes = [...nodes];
    let i = 0;

    const runNext = () => {
      if (i >= orderedNodes.length) return;

      const currentId = orderedNodes[i].id;

      // Set current to running
      setNodes((nds) =>
        nds.map((n) =>
          n.id === currentId
            ? { ...n, data: { ...n.data, status: 'running' } }
            : n
        )
      );

      setTimeout(() => {
        // Set to success
        setNodes((nds) =>
          nds.map((n) =>
            n.id === currentId
              ? { ...n, data: { ...n.data, status: 'success' } }
              : n
          )
        );
        i++;
        runNext();
      }, 1500);
    };

    // Reset all first
    setNodes((nds) =>
      nds.map((n) => ({ ...n, data: { ...n.data, status: 'pending' } }))
    );
    setTimeout(runNext, 500);
  };

  const resetStatus = () => {
    setNodes((nds) =>
      nds.map((n) => ({ ...n, data: { ...n.data, status: 'pending' } }))
    );
  };

  const getWsColor = () => {
    if (wsStatus === 'connected') return '#10b981';
    if (wsStatus === 'connecting') return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
      {/* Sidebar */}
      <div
        style={{
          width: '250px',
          background: '#111827',
          color: 'white',
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '16px' }}>Workflow Builder</h3>

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

        <hr style={{ borderColor: '#374151' }} />

        <button onClick={deleteSelectedNodes} style={{ ...btnStyle, background: '#dc2626' }}>
          Delete Selected
        </button>

        <hr style={{ borderColor: '#374151' }} />

        <h4 style={{ margin: '4px 0', fontSize: '13px', color: '#9ca3af' }}>WebSocket</h4>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: getWsColor(),
            }}
          />
          <span style={{ fontSize: '13px', textTransform: 'capitalize' }}>{wsStatus}</span>
        </div>

        {wsStatus === 'disconnected' ? (
          <button onClick={connectWebSocket} style={{ ...btnStyle, background: '#8b5cf6' }}>
            Connect WebSocket
          </button>
        ) : (
          <button onClick={disconnectWebSocket} style={{ ...btnStyle, background: '#6b7280' }}>
            Disconnect
          </button>
        )}

        <button onClick={startLiveTracing} style={{ ...btnStyle, background: '#06b6d4' }}>
          Start Live Tracing
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
              top: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#dc2626',
              color: 'white',
              padding: '10px 20px',
              borderRadius: 8,
              zIndex: 20,
              fontWeight: 600,
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
  padding: '10px',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '600',
};

export default App;
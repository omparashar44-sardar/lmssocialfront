import { useMemo } from 'react';
import ReactFlow, { Background, Controls, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';

const nodeColor = (kind, status) => {
  if (kind === 'course') return '#26331a';
  if (kind === 'module') return '#556b2f';
  if (status === 'locked') return '#9ca3af';
  if (status === 'available') return '#60a5fa';
  if (status === 'completed') return '#22c55e';
  if (status === 'mastered') return '#eab308';
  if (status === 'weak') return '#ef4444';
  return '#c9a86a';
};

export default function LayerLearnTree({ course, selectedTopicId, onSelectTopic }) {
  const nodes = useMemo(
    () =>
      course.knowledgeTree.nodes.map((node) => {
        const selected = node.id === selectedTopicId;
        return {
          ...node,
          style: {
            width: node.data.kind === 'course' ? 220 : 180,
            borderRadius: 18,
            border: selected ? '2px solid rgba(255,255,255,0.85)' : '1px solid rgba(255,255,255,0.35)',
            background: nodeColor(node.data.kind, node.data.status),
            color: '#f8fafc',
            boxShadow: selected
              ? '0 18px 45px rgba(38,51,26,0.24)'
              : '0 10px 24px rgba(38,51,26,0.14)',
          },
        };
      }),
    [course.knowledgeTree.nodes, selectedTopicId]
  );

  const edges = useMemo(
    () =>
      course.knowledgeTree.edges.map((edge) => ({
        ...edge,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edge.label ? '#c9a86a' : '#556b2f',
        },
        style: {
          stroke: edge.label ? '#c9a86a' : '#556b2f',
          strokeWidth: edge.label ? 2 : 1.5,
          ...edge.style,
        },
      })),
    [course.knowledgeTree.edges]
  );

  return (
    <div className="glass-subtle rounded-[24px] border border-white/25 p-3 h-full">
      <div className="h-full min-h-[540px] overflow-hidden rounded-[20px] border border-white/20 bg-white/10">
        <ReactFlow
          fitView
          nodes={nodes}
          edges={edges}
          onNodeClick={(_event, node) => {
            if (node.data.kind === 'topic') {
              onSelectTopic(node.id);
            }
          }}
        >
          <Controls />
          <Background color="rgba(255,255,255,0.22)" gap={18} />
        </ReactFlow>
      </div>
    </div>
  );
}

import { X, Maximize2 } from "lucide-react";
import type { NodeData } from "../types/graph";

interface NodeDetailProps {
  node: NodeData;
  onClose: () => void;
  onExpand: (nodeId: string) => void;
}

export function NodeDetail({ node, onClose, onExpand }: NodeDetailProps) {
  return (
    <div className="node-detail">
      <div className="node-detail-header">
        <div className="node-detail-labels">
          {node.labels.map((l) => (
            <span key={l} className="node-detail-label">{l}</span>
          ))}
        </div>
        <button className="icon-btn" onClick={onClose} title="Close">
          <X size={14} />
        </button>
      </div>
      <div className="node-detail-id">{node.id}</div>
      <div className="node-detail-props">
        {Object.entries(node.properties).map(([key, value]) => (
          <div key={key} className="node-detail-prop">
            <span className="prop-key">{key}</span>
            <span className="prop-value">{JSON.stringify(value)}</span>
          </div>
        ))}
        {Object.keys(node.properties).length === 0 && (
          <div className="node-detail-empty">No properties</div>
        )}
      </div>
      <button className="expand-btn" onClick={() => onExpand(node.id)}>
        <Maximize2 size={12} />
        Expand neighbors
      </button>
    </div>
  );
}

import { Download, ImageDown, Trash2 } from "lucide-react";
import type { NodeData, EdgeData } from "../types/graph";

interface ToolbarProps {
  nodes: NodeData[];
  edges: EdgeData[];
  onClear: () => void;
  onExportPng: () => void;
  onExportJson: () => void;
}

export function Toolbar({ nodes, edges, onClear, onExportPng, onExportJson }: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-stats">
        <span>{nodes.length} nodes</span>
        <span style={{ opacity: 0.3 }}>/</span>
        <span>{edges.length} edges</span>
      </div>
      <div className="toolbar-actions">
        <button className="toolbar-btn" onClick={onExportPng} title="Export as PNG" disabled={!nodes.length}>
          <ImageDown size={12} />
          PNG
        </button>
        <button className="toolbar-btn" onClick={onExportJson} title="Export as JSON" disabled={!nodes.length}>
          <Download size={12} />
          JSON
        </button>
        <button className="toolbar-btn toolbar-btn-danger" onClick={onClear} title="Clear graph" disabled={!nodes.length}>
          <Trash2 size={12} />
          Clear
        </button>
      </div>
    </div>
  );
}

import { Download, ImageDown, Trash2, LayoutGrid } from "lucide-react";
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
        <LayoutGrid size={14} />
        <span>{nodes.length} nodes</span>
        <span>·</span>
        <span>{edges.length} edges</span>
      </div>
      <div className="toolbar-actions">
        <button className="toolbar-btn" onClick={onExportPng} title="Export as PNG" disabled={!nodes.length}>
          <ImageDown size={14} />
          <span>PNG</span>
        </button>
        <button className="toolbar-btn" onClick={onExportJson} title="Export as JSON" disabled={!nodes.length}>
          <Download size={14} />
          <span>JSON</span>
        </button>
        <button className="toolbar-btn toolbar-btn-danger" onClick={onClear} title="Clear graph" disabled={!nodes.length}>
          <Trash2 size={14} />
          <span>Clear</span>
        </button>
      </div>
    </div>
  );
}

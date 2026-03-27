import { Palette } from "lucide-react";
import type { StyleMap, NodeStyle, EdgeStyle } from "../types/graph";

interface StylePanelProps {
  nodeLabels: string[];
  edgeTypes: string[];
  styleMap: StyleMap;
  onStyleChange: (styleMap: StyleMap) => void;
}

const PRESET_COLORS = [
  "#6366f1", "#f43f5e", "#10b981", "#f59e0b", "#3b82f6",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#06b6d4",
  "#84cc16", "#a855f7", "#e11d48", "#0891b2", "#d946ef",
];

export function StylePanel({ nodeLabels, edgeTypes, styleMap, onStyleChange }: StylePanelProps) {
  const updateNodeStyle = (label: string, patch: Partial<NodeStyle>) => {
    const current = styleMap.nodes[label] || { color: "#6366f1", size: 36 };
    onStyleChange({
      ...styleMap,
      nodes: { ...styleMap.nodes, [label]: { ...current, ...patch } },
    });
  };

  const updateEdgeStyle = (type: string, patch: Partial<EdgeStyle>) => {
    const current = styleMap.edges[type] || { color: "#94a3b8", width: 2 };
    onStyleChange({
      ...styleMap,
      edges: { ...styleMap.edges, [type]: { ...current, ...patch } },
    });
  };

  if (!nodeLabels.length && !edgeTypes.length) {
    return (
      <div className="style-panel">
        <div className="style-header">
          <Palette size={16} />
          <span>Styles</span>
        </div>
        <p className="style-empty">Run a query to see styling options</p>
      </div>
    );
  }

  return (
    <div className="style-panel">
      <div className="style-header">
        <Palette size={16} />
        <span>Styles</span>
      </div>

      {nodeLabels.length > 0 && (
        <div className="style-section">
          <h4>Nodes</h4>
          {nodeLabels.map((label) => {
            const style = styleMap.nodes[label] || { color: "#6366f1", size: 36 };
            return (
              <div key={label} className="style-row">
                <span className="style-label">{label}</span>
                <div className="style-controls">
                  <div className="color-picker-wrap">
                    <input
                      type="color"
                      value={style.color}
                      onChange={(e) => updateNodeStyle(label, { color: e.target.value })}
                      title="Node color"
                    />
                  </div>
                  <div className="color-presets">
                    {PRESET_COLORS.slice(0, 5).map((c) => (
                      <button
                        key={c}
                        className="color-swatch"
                        style={{ background: c }}
                        onClick={() => updateNodeStyle(label, { color: c })}
                      />
                    ))}
                  </div>
                  <label className="size-control">
                    <input
                      type="range"
                      min={20}
                      max={80}
                      value={style.size}
                      onChange={(e) => updateNodeStyle(label, { size: Number(e.target.value) })}
                    />
                    <span>{style.size}px</span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {edgeTypes.length > 0 && (
        <div className="style-section">
          <h4>Edges</h4>
          {edgeTypes.map((type) => {
            const style = styleMap.edges[type] || { color: "#94a3b8", width: 2 };
            return (
              <div key={type} className="style-row">
                <span className="style-label">{type}</span>
                <div className="style-controls">
                  <div className="color-picker-wrap">
                    <input
                      type="color"
                      value={style.color}
                      onChange={(e) => updateEdgeStyle(type, { color: e.target.value })}
                      title="Edge color"
                    />
                  </div>
                  <label className="size-control">
                    <input
                      type="range"
                      min={1}
                      max={8}
                      value={style.width}
                      onChange={(e) => updateEdgeStyle(type, { width: Number(e.target.value) })}
                    />
                    <span>{style.width}px</span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

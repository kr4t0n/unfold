import { useEffect, useState } from "react";
import { ArrowRight, ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import type { SchemaResponse } from "../types/graph";
import { useApi } from "../hooks/useApi";

const LABEL_COLORS = [
  "#818cf8", "#fb7185", "#34d399", "#fbbf24", "#60a5fa",
  "#a78bfa", "#f472b6", "#2dd4bf", "#fb923c", "#22d3ee",
];

interface SchemaBrowserProps {
  onLabelClick: (label: string) => void;
  onRelTypeClick: (type: string) => void;
  activeFilter: string | null;
}

export function SchemaBrowser({ onLabelClick, onRelTypeClick, activeFilter }: SchemaBrowserProps) {
  const { fetchSchema } = useApi();
  const [schema, setSchema] = useState<SchemaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [labelsOpen, setLabelsOpen] = useState(true);
  const [relsOpen, setRelsOpen] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setSchema(await fetchSchema());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load schema");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="schema-browser">
      {loading && !schema && (
        <div style={{ padding: "16px", textAlign: "center" }}>
          <RefreshCw size={16} className="spin" style={{ color: "var(--text-muted)" }} />
        </div>
      )}

      {error && <div className="schema-error">{error}</div>}

      {schema && (
        <>
          <div className="schema-section">
            <button className="schema-section-toggle" onClick={() => setLabelsOpen(!labelsOpen)}>
              {labelsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <span>Labels ({schema.labels.length})</span>
              <span style={{ marginLeft: "auto" }}>
                <button
                  className="icon-btn"
                  onClick={(e) => { e.stopPropagation(); load(); }}
                  disabled={loading}
                  title="Refresh"
                  style={{ width: 20, height: 20 }}
                >
                  <RefreshCw size={11} className={loading ? "spin" : ""} />
                </button>
              </span>
            </button>
            {labelsOpen && (
              <ul className="schema-list">
                {schema.labels.map((l, i) => (
                  <li key={l.label}>
                    <button
                      className={`schema-item ${activeFilter === `label:${l.label}` ? "active" : ""}`}
                      onClick={() => onLabelClick(l.label)}
                    >
                      <span className="schema-label-badge">
                        <span
                          className="schema-label-dot"
                          style={{ background: LABEL_COLORS[i % LABEL_COLORS.length] }}
                        />
                        {l.label}
                      </span>
                      <span className="schema-count">{l.count}</span>
                    </button>
                    {l.properties.length > 0 && (
                      <div className="schema-props">
                        {l.properties.map((p) => (
                          <span key={p} className="schema-prop">{p}</span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="schema-section">
            <button className="schema-section-toggle" onClick={() => setRelsOpen(!relsOpen)}>
              {relsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <span>Relationships ({schema.relationship_types.length})</span>
            </button>
            {relsOpen && (
              <ul className="schema-list">
                {schema.relationship_types.map((r) => (
                  <li key={r.type}>
                    <button
                      className={`schema-item ${activeFilter === `rel:${r.type}` ? "active" : ""}`}
                      onClick={() => onRelTypeClick(r.type)}
                    >
                      <ArrowRight size={11} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                      <span className="schema-rel-badge">{r.type}</span>
                      <span className="schema-count">{r.count}</span>
                    </button>
                    {r.properties.length > 0 && (
                      <div className="schema-props">
                        {r.properties.map((p) => (
                          <span key={p} className="schema-prop">{p}</span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

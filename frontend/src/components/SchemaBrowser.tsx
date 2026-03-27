import { useEffect, useState } from "react";
import { Database, ArrowRight, ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import type { SchemaResponse } from "../types/graph";
import { useApi } from "../hooks/useApi";

interface SchemaBrowserProps {
  onLabelClick: (label: string) => void;
  onRelTypeClick: (type: string) => void;
}

export function SchemaBrowser({ onLabelClick, onRelTypeClick }: SchemaBrowserProps) {
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
      const data = await fetchSchema();
      setSchema(data);
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
      <div className="schema-header">
        <Database size={16} />
        <span>Schema</span>
        <button className="icon-btn" onClick={load} disabled={loading} title="Refresh">
          <RefreshCw size={14} className={loading ? "spin" : ""} />
        </button>
      </div>

      {error && <div className="schema-error">{error}</div>}

      {schema && (
        <>
          <div className="schema-section">
            <button className="schema-section-toggle" onClick={() => setLabelsOpen(!labelsOpen)}>
              {labelsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span>Node Labels ({schema.labels.length})</span>
            </button>
            {labelsOpen && (
              <ul className="schema-list">
                {schema.labels.map((l) => (
                  <li key={l.label}>
                    <button className="schema-item" onClick={() => onLabelClick(l.label)}>
                      <span className="schema-label-badge">{l.label}</span>
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
              {relsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span>Relationship Types ({schema.relationship_types.length})</span>
            </button>
            {relsOpen && (
              <ul className="schema-list">
                {schema.relationship_types.map((r) => (
                  <li key={r.type}>
                    <button className="schema-item" onClick={() => onRelTypeClick(r.type)}>
                      <ArrowRight size={12} />
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

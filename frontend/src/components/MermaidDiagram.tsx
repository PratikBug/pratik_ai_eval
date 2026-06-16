import { useEffect, useId, useRef, useState } from "react";
import { stripMermaidComments } from "../types/i1ErDiagram";

interface MermaidDiagramProps {
  source: string;
}

export function MermaidDiagram({ source }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderId = useId().replace(/:/g, "");
  const [error, setError] = useState<string | null>(null);
  const [rendering, setRendering] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      if (!containerRef.current || !source.trim()) {
        setRendering(false);
        return;
      }

      setRendering(true);
      setError(null);
      containerRef.current.innerHTML = "";

      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "neutral",
          securityLevel: "strict",
        });

        const code = stripMermaidComments(source);
        const { svg } = await mermaid.render(`i1-er-${renderId}`, code);

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Diagram render failed");
        }
      } finally {
        if (!cancelled) {
          setRendering(false);
        }
      }
    }

    void renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [source, renderId]);

  return (
    <div className="mermaid-diagram-panel">
      {rendering && <p className="scan-status">Rendering ER diagram…</p>}
      {error && <p className="scan-error">{error}</p>}
      <div
        ref={containerRef}
        className="mermaid-render"
        aria-label="Rendered ER diagram"
        role="img"
      />
    </div>
  );
}

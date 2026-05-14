import { useEffect, useMemo, useRef, useState } from 'react';
import mermaid from 'mermaid';

let booted = false;
function boot() {
  if (booted) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    fontFamily: 'JetBrains Mono, ui-monospace, monospace',
    themeVariables: {
      background: '#0A0B12',
      primaryColor: '#10121C',
      primaryTextColor: '#FFFFFF',
      primaryBorderColor: '#F9F26B',
      lineColor: '#7AB6FF',
      secondaryColor: '#171A26',
      tertiaryColor: '#171A26',
      tertiaryTextColor: '#FFFFFF',
      nodeBorder: '#F9F26B',
      clusterBkg: '#10121C',
      clusterBorder: '#7AB6FF',
      mainBkg: '#10121C',
      titleColor: '#FFFFFF',
    },
    securityLevel: 'loose',
  });
  booted = true;
}

export function Mermaid({ chart, id }: { chart: string; id?: string }) {
  const elRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [err, setErr] = useState<string | null>(null);
  const renderId = useMemo(() => id || 'm-' + Math.random().toString(36).slice(2, 9), [id]);

  useEffect(() => {
    boot();
    let cancelled = false;
    (async () => {
      try {
        const out = await mermaid.render(renderId, chart);
        if (!cancelled) {
          setSvg(out.svg);
          setErr(null);
        }
      } catch (e) {
        if (!cancelled) {
          setErr(String(e instanceof Error ? e.message : e));
          setSvg('');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart, renderId]);

  if (err) {
    return (
      <pre className="bento-inset overflow-auto p-4 text-xs text-signal-red whitespace-pre-wrap">{err}</pre>
    );
  }
  return (
    <div
      ref={elRef}
      className="overflow-auto rounded-2xl bg-ink-800/60 p-4 [&_svg]:mx-auto [&_svg]:h-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

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
      background: '#0B0D14',
      primaryColor: '#1A1D27',
      primaryTextColor: '#FFFFFF',
      primaryBorderColor: '#7FFF00',
      lineColor: '#82A0FF',
      secondaryColor: '#2A2E3D',
      tertiaryColor: '#2A2E3D',
      tertiaryTextColor: '#FFFFFF',
      nodeBorder: '#7FFF00',
      clusterBkg: '#1A1D27',
      clusterBorder: '#82A0FF',
      mainBkg: '#1A1D27',
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
      className="overflow-auto rounded-2xl bg-base p-4 [&_svg]:mx-auto [&_svg]:h-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

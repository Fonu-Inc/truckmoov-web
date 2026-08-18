import {
  Check, Copy, Download,
} from "lucide-react";
import mermaid from "mermaid";
import {
  useEffect, useRef, useState,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/shadcn/card";

type MermaidDiagramProps = {
  chart: string;
  title: string;
  description?: string;
  diagramId?: string;
};

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
  fontFamily: "DM Sans, sans-serif",
  themeVariables: {
    primaryColor: "#3b82f6",
    primaryTextColor: "#ffffff",
    primaryBorderColor: "#60a5fa",
    lineColor: "#94a3b8",
    secondaryColor: "#1e293b",
    tertiaryColor: "#0f172a",
  },
});

export function MermaidDiagram({
  chart, title, description, diagramId,
}: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [
    svg,
    setSvg,
  ] = useState<string>("");
  const [
    copied,
    setCopied,
  ] = useState(false);
  const [
    error,
    setError,
  ] = useState<string | null>(null);

  useEffect(
    () => {
      const renderDiagram = async () => {
        if (!containerRef.current)
          return;

        try {
          const id = `mermaid-${Math.random().toString(36).substr(
            2,
            9,
          )}`;
          const { svg } = await mermaid.render(
            id,
            chart,
          );
          setSvg(svg);
          setError(null);
        }
        catch (err) {
          console.error(
            "Mermaid rendering error:",
            err,
          );
          setError("Failed to render diagram. Please check the syntax.");
        }
      };

      renderDiagram();
    },
    [chart],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(chart);
      setCopied(true);
      toast.success("Diagram code copied to clipboard");
      setTimeout(
        setCopied,
        2000,
        false,
      );
    }
    catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleExportSVG = () => {
    if (!svg)
      return;

    const blob = new Blob(
      [svg],
      { type: "image/svg+xml" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(
      /\s+/g,
      "-",
    )}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("SVG exported successfully");
  };

  const handleExportPNG = async () => {
    if (!svg)
      return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    const svgBlob = new Blob(
      [svg],
      { type: "image/svg+xml;charset=utf-8" },
    );
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx?.scale(
        2,
        2,
      );
      ctx?.drawImage(
        img,
        0,
        0,
      );

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const pngUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = pngUrl;
            link.download = `${title.toLowerCase().replace(
              /\s+/g,
              "-",
            )}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(pngUrl);
            toast.success("PNG exported successfully");
          }
        },
        "image/png",
      );

      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="ml-1 hidden sm:inline">Copy Code</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSVG}
          >
            <Download className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">SVG</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPNG}
          >
            <Download className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">PNG</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={containerRef}
          className="overflow-auto bg-muted/30 rounded-lg p-4 min-h-[200px]"
          data-diagram-id={diagramId}
        >
          {error
            ? (
                <div className="text-destructive text-center py-8">{error}</div>
              )
            : svg
              ? (
                  <div
                    className="flex justify-center [&_svg]:max-w-full"
                    dangerouslySetInnerHTML={{ __html: svg }}
                  />
                )
              : (
                  <div className="text-muted-foreground text-center py-8">Loading diagram...</div>
                )}
        </div>
      </CardContent>
    </Card>
  );
}

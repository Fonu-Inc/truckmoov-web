import PptxGenJS from "pptxgenjs";
import { toPng } from "html-to-image";

// Color constants matching the design system
const COLORS = {
  primary: "3B82F6",
  primaryDark: "1E40AF",
  muted: "64748B",
  background: "0F172A",
  foreground: "F8FAFC",
  border: "334155",
  white: "FFFFFF",
  dark: "1E293B",
};

export interface SlideSection {
  number: string;
  title: string;
  content: string[];
  bullets?: string[];
  tables?: { headers: string[]; rows: string[][] }[];
  diagramId?: string;
}

// Capture diagram as base64 image
async function captureDiagramAsBase64(diagramId: string): Promise<string | null> {
  try {
    const container = document.querySelector(`[data-diagram-id="${diagramId}"]`);
    if (!container) return null;
    
    const dataUrl = await toPng(container as HTMLElement, {
      backgroundColor: "#1e293b",
      quality: 1,
      pixelRatio: 2,
    });
    
    return dataUrl;
  } catch (error) {
    console.error(`Error capturing diagram ${diagramId}:`, error);
    return null;
  }
}

export async function generatePowerPoint(
  sections: SlideSection[],
): Promise<void> {
  const pptx = new PptxGenJS();
  
  // Set presentation properties
  pptx.author = "Truckmoov";
  pptx.title = "Technical Architecture & Implementation Document";
  pptx.subject = "MTN Nigeria IT Division Technical Annex";
  pptx.company = "Truckmoov Technologies Ltd";
  
  // Define master slides
  pptx.defineSlideMaster({
    title: "TITLE_SLIDE",
    background: { color: COLORS.background },
    objects: [
      {
        rect: { x: 0, y: 0, w: "100%", h: 0.5, fill: { color: COLORS.primary } },
      },
    ],
  });

  pptx.defineSlideMaster({
    title: "CONTENT_SLIDE",
    background: { color: COLORS.background },
    objects: [
      {
        rect: { x: 0, y: 0, w: "100%", h: 0.8, fill: { color: COLORS.primary } },
      },
      {
        text: {
          text: "TRUCKMOOV | MTN-IT Confidential",
          options: {
            x: 0.5,
            y: 5.2,
            w: "90%",
            h: 0.3,
            fontSize: 10,
            color: COLORS.muted,
            fontFace: "DM Sans",
          },
        },
      },
    ],
  });

  // Title Slide
  const titleSlide = pptx.addSlide({ masterName: "TITLE_SLIDE" });
  
  titleSlide.addText("TRUCKMOOV", {
    x: 0.5,
    y: 1.5,
    w: "90%",
    h: 1,
    fontSize: 54,
    bold: true,
    color: COLORS.primary,
    fontFace: "DM Sans",
    align: "center",
  });

  titleSlide.addText("Technical Architecture & Implementation Document", {
    x: 0.5,
    y: 2.5,
    w: "90%",
    h: 0.8,
    fontSize: 28,
    bold: true,
    color: COLORS.white,
    fontFace: "DM Sans",
    align: "center",
  });

  titleSlide.addText("Build & Operate Model for MTN Enterprise Business", {
    x: 0.5,
    y: 3.3,
    w: "90%",
    h: 0.5,
    fontSize: 18,
    color: COLORS.muted,
    fontFace: "DM Sans",
    align: "center",
  });

  titleSlide.addText([
    { text: "Document Version: 1.0.0", options: { breakLine: true } },
    { text: "Classification: MTN-IT Confidential", options: { breakLine: true } },
    { text: `Date: ${new Date().toLocaleDateString()}`, options: {} },
  ], {
    x: 0.5,
    y: 4.2,
    w: "90%",
    h: 0.8,
    fontSize: 14,
    color: COLORS.muted,
    fontFace: "DM Sans",
    align: "center",
  });

  // Table of Contents Slide
  const tocSlide = pptx.addSlide({ masterName: "CONTENT_SLIDE" });
  
  tocSlide.addText("Table of Contents", {
    x: 0.5,
    y: 0.15,
    w: "90%",
    h: 0.5,
    fontSize: 24,
    bold: true,
    color: COLORS.white,
    fontFace: "DM Sans",
  });

  const tocItems = sections.map((s) => ({
    text: `${s.number}. ${s.title}`,
    options: { bullet: false, breakLine: true, fontSize: 14, color: COLORS.foreground },
  }));

  // Split TOC into two columns
  const midpoint = Math.ceil(tocItems.length / 2);
  const leftColumn = tocItems.slice(0, midpoint);
  const rightColumn = tocItems.slice(midpoint);

  tocSlide.addText(leftColumn as PptxGenJS.TextProps[], {
    x: 0.5,
    y: 1,
    w: 4.5,
    h: 4,
    fontFace: "DM Sans",
    valign: "top",
  });

  tocSlide.addText(rightColumn as PptxGenJS.TextProps[], {
    x: 5.2,
    y: 1,
    w: 4.5,
    h: 4,
    fontFace: "DM Sans",
    valign: "top",
  });

  // Content Slides
  for (const section of sections) {
    // Main section slide
    const slide = pptx.addSlide({ masterName: "CONTENT_SLIDE" });
    
    // Section title
    slide.addText(`${section.number}. ${section.title}`, {
      x: 0.5,
      y: 0.15,
      w: "90%",
      h: 0.5,
      fontSize: 22,
      bold: true,
      color: COLORS.white,
      fontFace: "DM Sans",
    });

    let currentY = 1;

    // Content text
    if (section.content.length > 0) {
      const contentText = section.content.slice(0, 2).join("\n\n");
      slide.addText(contentText, {
        x: 0.5,
        y: currentY,
        w: "90%",
        h: 1.2,
        fontSize: 14,
        color: COLORS.foreground,
        fontFace: "DM Sans",
        valign: "top",
      });
      currentY += 1.3;
    }

    // Bullets
    if (section.bullets && section.bullets.length > 0) {
      const bulletText = section.bullets.map((b) => ({
        text: b,
        options: { bullet: { type: "bullet" as const }, breakLine: true, fontSize: 13, color: COLORS.foreground },
      }));

      slide.addText(bulletText as PptxGenJS.TextProps[], {
        x: 0.5,
        y: currentY,
        w: "90%",
        h: 2,
        fontFace: "DM Sans",
        valign: "top",
      });
      currentY += 2.1;
    }

    // Tables (create separate slide if table exists)
    if (section.tables && section.tables.length > 0) {
      for (const tableData of section.tables) {
        const tableSlide = pptx.addSlide({ masterName: "CONTENT_SLIDE" });
        
        tableSlide.addText(`${section.number}. ${section.title} - Data Table`, {
          x: 0.5,
          y: 0.15,
          w: "90%",
          h: 0.5,
          fontSize: 20,
          bold: true,
          color: COLORS.white,
          fontFace: "DM Sans",
        });

        const tableRows: PptxGenJS.TableRow[] = [];
        
        // Header row
        tableRows.push(
          tableData.headers.map((h) => ({
            text: h,
            options: {
              bold: true,
              color: COLORS.white,
              fill: { color: COLORS.primary },
              fontSize: 12,
              fontFace: "DM Sans",
            },
          }))
        );

        // Data rows
        tableData.rows.forEach((row, idx) => {
          tableRows.push(
            row.map((cell) => ({
              text: cell,
              options: {
                color: COLORS.background,
                fill: { color: idx % 2 === 0 ? "F8FAFC" : "E2E8F0" },
                fontSize: 11,
                fontFace: "DM Sans",
              },
            }))
          );
        });

        tableSlide.addTable(tableRows, {
          x: 0.5,
          y: 1,
          w: 9,
          colW: Array(tableData.headers.length).fill(9 / tableData.headers.length),
          border: { type: "solid", color: COLORS.border, pt: 0.5 },
          fontFace: "DM Sans",
        });
      }
    }

    // Diagram slide
    if (section.diagramId) {
      const diagramSlide = pptx.addSlide({ masterName: "CONTENT_SLIDE" });
      
      diagramSlide.addText(`${section.number}. ${section.title} - Architecture Diagram`, {
        x: 0.5,
        y: 0.15,
        w: "90%",
        h: 0.5,
        fontSize: 20,
        bold: true,
        color: COLORS.white,
        fontFace: "DM Sans",
      });

      // Capture and add diagram
      const diagramBase64 = await captureDiagramAsBase64(section.diagramId);
      if (diagramBase64) {
        diagramSlide.addImage({
          data: diagramBase64,
          x: 0.5,
          y: 1,
          w: 9,
          h: 4,
        });
      } else {
        diagramSlide.addText("Diagram placeholder - Generate from live view", {
          x: 0.5,
          y: 2.5,
          w: "90%",
          h: 1,
          fontSize: 16,
          color: COLORS.muted,
          fontFace: "DM Sans",
          align: "center",
        });
      }
    }
  }

  // Conclusion/Thank You Slide
  const endSlide = pptx.addSlide({ masterName: "TITLE_SLIDE" });
  
  endSlide.addText("Thank You", {
    x: 0.5,
    y: 2,
    w: "90%",
    h: 1,
    fontSize: 48,
    bold: true,
    color: COLORS.primary,
    fontFace: "DM Sans",
    align: "center",
  });

  endSlide.addText("Truckmoov Technical Architecture Document", {
    x: 0.5,
    y: 3,
    w: "90%",
    h: 0.5,
    fontSize: 20,
    color: COLORS.white,
    fontFace: "DM Sans",
    align: "center",
  });

  endSlide.addText("For questions, contact: architecture@truckmoov.com", {
    x: 0.5,
    y: 3.8,
    w: "90%",
    h: 0.5,
    fontSize: 14,
    color: COLORS.muted,
    fontFace: "DM Sans",
    align: "center",
  });

  // Save the presentation
  await pptx.writeFile({ fileName: "Truckmoov_Technical_Architecture.pptx" });
}

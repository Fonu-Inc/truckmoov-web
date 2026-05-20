import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ImageRun,
  AlignmentType,
  ShadingType,
  PageBreak,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
} from "docx";
import { saveAs } from "file-saver";
import { toPng } from "html-to-image";

// Color constants matching the design system
const COLORS = {
  primary: "3B82F6",
  primaryDark: "1E40AF",
  muted: "64748B",
  background: "0F172A",
  foreground: "F8FAFC",
  border: "334155",
};

// Convert SVG to PNG blob
async function svgToPngBlob(svgElement: SVGElement): Promise<Uint8Array> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();
  
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx?.scale(2, 2);
      if (ctx) {
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx?.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          blob.arrayBuffer().then(buffer => {
            resolve(new Uint8Array(buffer));
            URL.revokeObjectURL(url);
          });
        } else {
          reject(new Error("Failed to create blob"));
        }
      }, "image/png");
    };
    img.onerror = reject;
    img.src = url;
  });
}

// Capture diagram from DOM
async function captureDiagramImage(diagramId: string): Promise<Uint8Array | null> {
  try {
    const container = document.querySelector(`[data-diagram-id="${diagramId}"]`);
    if (!container) return null;
    
    const svg = container.querySelector("svg");
    if (svg) {
      return await svgToPngBlob(svg);
    }
    return null;
  } catch (error) {
    console.error("Error capturing diagram:", error);
    return null;
  }
}

// Document sections data
export interface DocumentSection {
  number: string;
  title: string;
  content: string[];
  tables?: { headers: string[]; rows: string[][] }[];
  bullets?: string[];
  diagramId?: string;
}

// Generate Word Document
export async function generateWordDocument(
  sections: DocumentSection[],
  diagramImages: Map<string, Uint8Array>
): Promise<void> {
  const children: (Paragraph | Table)[] = [];

  // Title Page
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "FLEET PRO",
          bold: true,
          size: 72,
          color: COLORS.primary,
          font: "DM Sans",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 2000, after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Technical Architecture & Implementation Document",
          bold: true,
          size: 48,
          color: COLORS.foreground,
          font: "DM Sans",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Build & Operate Model for MTN Enterprise Business",
          size: 28,
          color: COLORS.muted,
          font: "DM Sans",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Document Version: 1.0.0 | Classification: MTN-IT Confidential`,
          size: 20,
          color: COLORS.muted,
          font: "DM Sans",
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Date: ${new Date().toLocaleDateString()}`,
          size: 20,
          color: COLORS.muted,
          font: "DM Sans",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  // Table of Contents Header
  children.push(
    new Paragraph({
      text: "Table of Contents",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    })
  );

  // TOC entries
  sections.forEach((section) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${section.number}. ${section.title}`,
            size: 22,
            font: "DM Sans",
          }),
        ],
        spacing: { before: 100 },
      })
    );
  });

  children.push(
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  // Document sections
  for (const section of sections) {
    // Section heading
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${section.number}. ${section.title}`,
            bold: true,
            size: 32,
            color: COLORS.primary,
            font: "DM Sans",
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
        border: {
          bottom: {
            color: COLORS.primary,
            size: 6,
            style: BorderStyle.SINGLE,
            space: 4,
          },
        },
      })
    );

    // Content paragraphs
    section.content.forEach((paragraph) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: paragraph,
              size: 22,
              font: "DM Sans",
            }),
          ],
          spacing: { before: 100, after: 100 },
        })
      );
    });

    // Bullet points
    if (section.bullets) {
      section.bullets.forEach((bullet) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `• ${bullet}`,
                size: 22,
                font: "DM Sans",
              }),
            ],
            spacing: { before: 50 },
            indent: { left: 400 },
          })
        );
      });
    }

    // Tables
    if (section.tables) {
      section.tables.forEach((tableData) => {
        const tableRows: TableRow[] = [];

        // Header row
        tableRows.push(
          new TableRow({
            children: tableData.headers.map(
              (header) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: header,
                          bold: true,
                          size: 20,
                          color: "FFFFFF",
                          font: "DM Sans",
                        }),
                      ],
                    }),
                  ],
                  shading: {
                    type: ShadingType.SOLID,
                    color: COLORS.primary,
                  },
                  margins: {
                    top: 100,
                    bottom: 100,
                    left: 100,
                    right: 100,
                  },
                })
            ),
            tableHeader: true,
          })
        );

        // Data rows
        tableData.rows.forEach((row, rowIndex) => {
          tableRows.push(
            new TableRow({
              children: row.map(
                (cell) =>
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: cell,
                            size: 20,
                            font: "DM Sans",
                          }),
                        ],
                      }),
                    ],
                    shading: {
                      type: ShadingType.SOLID,
                      color: rowIndex % 2 === 0 ? "F8FAFC" : "E2E8F0",
                    },
                    margins: {
                      top: 80,
                      bottom: 80,
                      left: 100,
                      right: 100,
                    },
                  })
              ),
            })
          );
        });

        children.push(
          new Table({
            rows: tableRows,
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
          })
        );

        children.push(
          new Paragraph({
            children: [],
            spacing: { after: 200 },
          })
        );
      });
    }

    // Diagram image
    if (section.diagramId && diagramImages.has(section.diagramId)) {
      const imageData = diagramImages.get(section.diagramId)!;
      children.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: imageData,
              transformation: {
                width: 600,
                height: 400,
              },
              type: "png",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 },
        })
      );
    }

    // Page break after each major section
    if (parseInt(section.number) < sections.length) {
      children.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "DM Sans",
            size: 22,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "FleetPro Technical Architecture Document | MTN-IT Confidential",
                    size: 18,
                    color: COLORS.muted,
                    font: "DM Sans",
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Page ",
                    size: 18,
                    font: "DM Sans",
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    font: "DM Sans",
                  }),
                  new TextRun({
                    text: " of ",
                    size: 18,
                    font: "DM Sans",
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 18,
                    font: "DM Sans",
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "FleetPro_Technical_Architecture.docx");
}

// Export helper to get all diagram images
export async function getAllDiagramImages(): Promise<Map<string, Uint8Array>> {
  const images = new Map<string, Uint8Array>();
  const diagramContainers = document.querySelectorAll("[data-diagram-id]");
  
  for (const container of diagramContainers) {
    const diagramId = container.getAttribute("data-diagram-id");
    if (diagramId) {
      try {
        const dataUrl = await toPng(container as HTMLElement, {
          backgroundColor: "#1e293b",
          quality: 1,
          pixelRatio: 2,
        });
        
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        images.set(diagramId, new Uint8Array(arrayBuffer));
      } catch (error) {
        console.error(`Error capturing diagram ${diagramId}:`, error);
      }
    }
  }
  
  return images;
}

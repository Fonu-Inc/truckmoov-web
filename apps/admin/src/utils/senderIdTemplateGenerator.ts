import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { saveAs } from "file-saver";

type TemplateData = {
  companyName?: string;
  companyAddress?: string;
  senderId?: string;
  senderType?: string;
};

export async function generateSenderIdRequestLetter(data: TemplateData = {}) {
  const today = new Date().toLocaleDateString(
    "en-NG",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Company Letterhead placeholder
          new Paragraph({
            children: [
              new TextRun({
                text: "[COMPANY LETTERHEAD]",
                bold: true,
                size: 28,
                color: "666666",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Date
          new Paragraph({
            children: [
              new TextRun({
                text: `Date: ${today}`,
                size: 24,
              }),
            ],
            spacing: { after: 400 },
          }),

          // Recipient
          new Paragraph({
            children: [
              new TextRun({
                text: "The Platform Administrator",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "FleetPro Fleet Management Platform",
                size: 24,
              }),
            ],
            spacing: { after: 400 },
          }),

          // Subject
          new Paragraph({
            children: [
              new TextRun({
                text: "Subject: ",
                bold: true,
                size: 24,
              }),
              new TextRun({
                text: "Request for SMS/Voice Sender ID Whitelisting",
                bold: true,
                size: 24,
                underline: {},
              }),
            ],
            spacing: { after: 400 },
          }),

          // Salutation
          new Paragraph({
            children: [
              new TextRun({
                text: "Dear Sir/Madam,",
                size: 24,
              }),
            ],
            spacing: { after: 200 },
          }),

          // Body paragraph 1
          new Paragraph({
            children: [
              new TextRun({
                text: "We, ",
                size: 24,
              }),
              new TextRun({
                text: data.companyName || "[COMPANY NAME]",
                bold: true,
                size: 24,
                highlight: data.companyName ? undefined : "yellow",
              }),
              new TextRun({
                text: ", a registered fleet management company operating on the FleetPro platform, hereby formally request the whitelisting and approval of the following Sender ID for use in our business communications:",
                size: 24,
              }),
            ],
            spacing: { after: 300 },
          }),

          // Sender ID details table
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Sender ID:",
                            bold: true,
                            size: 24,
                          }),
                        ],
                      }),
                    ],
                    width: {
                      size: 30,
                      type: WidthType.PERCENTAGE,
                    },
                    borders: {
                      top: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                      },
                      bottom: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                      },
                      left: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                      },
                      right: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                      },
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: data.senderId || "[REQUESTED SENDER ID]",
                            size: 24,
                            highlight: data.senderId ? undefined : "yellow",
                          }),
                        ],
                      }),
                    ],
                    width: {
                      size: 70,
                      type: WidthType.PERCENTAGE,
                    },
                    borders: {
                      top: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                      },
                      bottom: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                      },
                      left: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                      },
                      right: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                      },
                    },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Type:",
                            bold: true,
                            size: 24,
                          }),
                        ],
                      }),
                    ],
                    borders: {
                      top: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                      },
                      bottom: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                      },
                      left: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                      },
                      right: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                      },
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: data.senderType || "[SMS / Voice / Both]",
                            size: 24,
                            highlight: data.senderType ? undefined : "yellow",
                          }),
                        ],
                      }),
                    ],
                    borders: {
                      top: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                      },
                      bottom: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                      },
                      left: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                      },
                      right: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                      },
                    },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Purpose:",
                            bold: true,
                            size: 24,
                          }),
                        ],
                      }),
                    ],
                    borders: {
                      top: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                      },
                      bottom: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                      },
                      left: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                      },
                      right: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                      },
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Driver communication, job notifications, and fleet operations",
                            size: 24,
                          }),
                        ],
                      }),
                    ],
                    borders: {
                      top: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                      },
                      bottom: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                      },
                      left: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                      },
                      right: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                      },
                    },
                  }),
                ],
              }),
            ],
          }),

          // Spacing after table
          new Paragraph({
            children: [],
            spacing: { after: 300 },
          }),

          // Body paragraph 2
          new Paragraph({
            children: [
              new TextRun({
                text: "We confirm that:",
                size: 24,
              }),
            ],
            spacing: { after: 200 },
          }),

          // Bullet points
          new Paragraph({
            children: [
              new TextRun({
                text: "•  The requested Sender ID will be used exclusively for legitimate business communications",
                size: 24,
              }),
            ],
            indent: { left: 360 },
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "•  We are authorized to use this Sender ID and it does not infringe on any trademarks",
                size: 24,
              }),
            ],
            indent: { left: 360 },
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "•  We will comply with all applicable telecommunications regulations and anti-spam laws",
                size: 24,
              }),
            ],
            indent: { left: 360 },
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "•  We understand that misuse may result in suspension of the Sender ID",
                size: 24,
              }),
            ],
            indent: { left: 360 },
            spacing: { after: 300 },
          }),

          // Closing paragraph
          new Paragraph({
            children: [
              new TextRun({
                text: "Attached herewith are copies of our company registration documents for verification purposes. We kindly request your prompt attention to this matter.",
                size: 24,
              }),
            ],
            spacing: { after: 300 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Thank you for your cooperation.",
                size: 24,
              }),
            ],
            spacing: { after: 400 },
          }),

          // Signature block
          new Paragraph({
            children: [
              new TextRun({
                text: "Yours faithfully,",
                size: 24,
              }),
            ],
            spacing: { after: 600 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "_________________________",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "[AUTHORIZED SIGNATORY NAME]",
                size: 24,
                highlight: "yellow",
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "[DESIGNATION]",
                size: 24,
                highlight: "yellow",
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: data.companyName || "[COMPANY NAME]",
                size: 24,
                bold: true,
                highlight: data.companyName ? undefined : "yellow",
              }),
            ],
            spacing: { after: 200 },
          }),

          // Company details
          new Paragraph({
            children: [
              new TextRun({
                text: "Company Address: ",
                size: 22,
              }),
              new TextRun({
                text: data.companyAddress || "[COMPANY ADDRESS]",
                size: 22,
                highlight: data.companyAddress ? undefined : "yellow",
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Phone: [COMPANY PHONE]",
                size: 22,
                highlight: "yellow",
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Email: [COMPANY EMAIL]",
                size: 22,
                highlight: "yellow",
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "RC Number: [REGISTRATION NUMBER]",
                size: 22,
                highlight: "yellow",
              }),
            ],
            spacing: { after: 400 },
          }),

          // Footer note
          new Paragraph({
            children: [
              new TextRun({
                text: "Note: Fields highlighted in yellow should be edited before submission.",
                size: 20,
                italics: true,
                color: "888888",
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(
    blob,
    "Sender_ID_Request_Letter_Template.docx",
  );
}

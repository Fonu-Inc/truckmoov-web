import { format } from "date-fns";
import {
  Download, Eye, FileText,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { DocumentViewerDialog } from "./DocumentViewerDialog";

type SubmittedDocument = {
  id: string;
  document_type: string;
  document_name: string;
  file_size: number;
  created_at: string;
};

/** Documents a business customer submits with the application. */
const ENTERPRISE_DOCUMENTS = [
  {
    type: "customer_request_letter", label: "Customer Request Letter", file: "Customer-Request-Letter.pdf",
  },
  {
    type: "cac_document", label: "CAC Document", file: "CAC-Document.pdf",
  },
  {
    type: "tax_certificate", label: "Tax Certificate / TIN", file: "Tax-Certificate-TIN.pdf",
  },
  {
    type: "signature_card", label: "Signature Card", file: "Signature-Card.pdf",
  },
];

/** Documents an owner-operator (individual vehicle owner) submits. */
const OWNER_OPERATOR_DOCUMENTS = [
  {
    type: "proof_of_ownership", label: "Proof of Ownership", file: "Proof-of-Ownership.pdf",
  },
  {
    type: "vehicle_license", label: "Vehicle License", file: "Vehicle-License.pdf",
  },
];

const DOCUMENT_LABELS: Record<string, string> = Object.fromEntries(
  [
    ...ENTERPRISE_DOCUMENTS,
    ...OWNER_OPERATOR_DOCUMENTS,
  ].map(d => [
    d.type,
    d.label,
  ]),
);

const prettyDocumentType = (t: string) => DOCUMENT_LABELS[t] ?? t;
const prettyFileSize = (bytes: number) => `${(bytes / 1024).toFixed(0)} KB`;

// ponytail: mock data from fleetflow parity port — wire to packages/api
function buildDemoDocuments(types: typeof ENTERPRISE_DOCUMENTS): SubmittedDocument[] {
  const submittedAt = new Date(Date.now() - 86400000 * 120).toISOString();
  return types.map((d, i) => ({
    id: `demo-${d.type}`,
    document_type: d.type,
    document_name: d.file,
    file_size: 120_000 + ((i * 37_000 + 4 * 9_000) % 480_000),
    created_at: submittedAt,
  }));
}

function buildSampleFile(doc: SubmittedDocument) {
  const lines = [
    "%PDF-1.4 sample",
    "",
    `Document: ${prettyDocumentType(doc.document_type)}`,
    `File: ${doc.document_name}`,
    `Submitted: ${format(
      new Date(doc.created_at),
      "MMM d, yyyy",
    )}`,
    "",
    "This is a sample copy of the document submitted during onboarding.",
  ];
  return new Blob(
    [lines.join("\n")],
    { type: "application/pdf" },
  );
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * `/settings/documents` — read-only view of what the organization submitted
 * during onboarding. Ported from fleetflow `OrgDocumentsPanel` +
 * `TenantSubmittedDocuments`; the checklist differs for owner-operators.
 */
export function OrgDocumentsPanel() {
  const isOwnerOperator = useAuthStore(s => s.user?.role) === "OWNER_OPERATOR";
  const [docs] = useState(() => buildDemoDocuments(isOwnerOperator ? OWNER_OPERATOR_DOCUMENTS : ENTERPRISE_DOCUMENTS));
  const [
    viewing,
    setViewing,
  ] = useState<SubmittedDocument | null>(null);

  const downloadDoc = (doc: SubmittedDocument) => {
    saveBlob(
      buildSampleFile(doc),
      doc.document_name,
    );
    toast.success(`Downloading ${doc.document_name}`);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        These are the documents your organization submitted during onboarding. They are
        read-only — contact support if anything needs to change.
      </p>
      <div className="space-y-6 pr-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Submitted documents</CardTitle>
                <CardDescription>
                  {docs.length}
                  {" "}
                  document
                  {docs.length === 1 ? "" : "s"}
                  {" "}
                  on file.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {docs.length === 0
              ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No documents submitted.
                  </p>
                )
              : (
                  docs.map(d => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{prettyDocumentType(d.document_type)}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {d.document_name}
                            {" · "}
                            {prettyFileSize(d.file_size)}
                            {" · "}
                            {format(
                              new Date(d.created_at),
                              "MMM d, yyyy",
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewing(d)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadDoc(d)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))
                )}
          </CardContent>
        </Card>

        {viewing && (
          <DocumentViewerDialog
            open={!!viewing}
            onOpenChange={open => !open && setViewing(null)}
            title={prettyDocumentType(viewing.document_type)}
            subtitle={`${viewing.document_name} · ${prettyFileSize(viewing.file_size)} · ${format(
              new Date(viewing.created_at),
              "MMM d, yyyy",
            )}`}
            fileName={viewing.document_name}
            loadBlob={async () => buildSampleFile(viewing)}
          />
        )}
      </div>
    </div>
  );
}

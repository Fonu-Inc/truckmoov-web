import { format } from "date-fns";
import { FileText } from "lucide-react";

import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";

type SubmittedDocument = {
  id: string;
  document_type: string;
  document_name: string;
  file_size: number;
  created_at: string;
};

const DOCUMENT_LABELS: Record<string, string> = {
  customer_request_letter: "Customer Request Letter",
  cac_document: "CAC Document",
  tax_certificate: "Tax Certificate / TIN",
  signature_card: "Signature Card",
  proof_of_ownership: "Proof of Ownership",
  vehicle_license: "Vehicle License",
};

const prettyDocumentType = (t: string) => DOCUMENT_LABELS[t] ?? t;
const prettyFileSize = (bytes: number) => `${(bytes / 1024).toFixed(0)} KB`;

// ponytail: empty until the org-documents API lands; add View/Download back with it.
const DOCS: SubmittedDocument[] = [];

/**
 * `/settings/documents` — read-only view of what the organization submitted
 * during onboarding. Ported from fleetflow `OrgDocumentsPanel` +
 * `TenantSubmittedDocuments`.
 */
export function OrgDocumentsPanel() {
  const docs = DOCS;

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
                      className="flex items-center gap-3 rounded-xl border border-border/60 p-3"
                    >
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
                  ))
                )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

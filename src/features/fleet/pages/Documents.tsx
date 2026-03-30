import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { DocumentEntityType } from "../api/types";
import DocumentFilters from "../components/DocumentFilters";
import DocumentTable from "../components/DocumentTable";

export default function Documents() {
 const { user } = useAuthStore();
 const tenantId = user?.tenantId ?? "";

 const [search, setSearch] = useState("");
 const [entityType, setEntityType] = useState<DocumentEntityType | "all">("all");

 return (
  <section className="space-y-4">
   <DocumentFilters
    search={search}
    onSearchChange={setSearch}
    entityType={entityType}
    onEntityTypeChange={setEntityType}
   />
   <DocumentTable tenantId={tenantId} search={search} entityType={entityType} />
  </section>
 );
}

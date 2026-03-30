import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DocumentEntityType } from "../api/types";
import { Filter, Search } from "lucide-react";

type DocumentFiltersProps = {
 search: string;
 onSearchChange: (value: string) => void;
 entityType: DocumentEntityType | "all";
 onEntityTypeChange: (value: DocumentEntityType | "all") => void;
};

export default function DocumentFilters({
 search,
 onSearchChange,
 entityType,
 onEntityTypeChange,
}: DocumentFiltersProps) {
 return (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
   <div className="relative flex-1">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input
     placeholder="Search by filename..."
     className="pl-9"
     value={search}
     onChange={(e) => onSearchChange(e.target.value)}
    />
   </div>
   <Select value={entityType} onValueChange={(v) => onEntityTypeChange(v as DocumentEntityType | "all")}>
    <SelectTrigger className="w-full sm:w-44">
     <Filter className="h-4 w-4 mr-2" />
     <SelectValue placeholder="All Types" />
    </SelectTrigger>
    <SelectContent>
     <SelectItem value="all">All Types</SelectItem>
     <SelectItem value="job">Job</SelectItem>
     <SelectItem value="vehicle">Vehicle</SelectItem>
     <SelectItem value="driver">Driver</SelectItem>
    </SelectContent>
   </Select>
  </div>
 );
}

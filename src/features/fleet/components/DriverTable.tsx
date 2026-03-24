import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppAvatar from '@/shared/components/AppAvatar';
import StatusBadge from '@/shared/components/StatusBadge';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, Mail, MessageSquare, MoreHorizontal, Pencil, Phone, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import DriverFormModal from './DriverFormModal';

const commIcons: Record<string, React.ReactNode> = {
 whatsapp: <MessageSquare className="h-4 w-4 text-success" />,
 sms: <Phone className="h-4 w-4 text-primary" />,
 email: <Mail className="h-4 w-4 text-warning" />,
 voice: <Phone className="h-4 w-4 text-accent" />,
};

export default function DriverTable() {
 const [addDriverModal, setAddDriverModal] = useState(false)

 const row = [];
 const column: ColumnDef<any>[] = [
  {
   accessorKey: "driver",
   header: "Driver",
   cell: ({ row }) => {
    return (
     <div className="flex items-center gap-3">
      <AppAvatar value={row.original.name as string} />
      <div>
       <p className="font-medium">{row.original.name}</p>
       <p className="text-sm text-muted-foreground">ID: {row.original.id}</p>
      </div>
     </div>
    )
   }
  },
  {
   accessorKey: "contact",
   header: "Contact",
   cell: ({ row }) => {
    return (
     <div className="text-sm">
      <p>{row.original.phone}</p>
      {row.original.email && (
       <p className="text-muted-foreground truncate max-w-37.5">{row.original.email}</p>
      )}
     </div>
    )
   }
  },
  {
   accessorKey: "licence",
   header: "Licence",
   cell: ({ row }) => {
    return (
     <div className="text-sm">
      <p className="font-mono">{row.original.licenseNumber}</p>
      {/* <p className={`text-xs ${licenseWarning ? "text-warning" : "text-muted-foreground"}`}>
       {licenseWarning && <AlertTriangle className="h-3 w-3 inline mr-1" />}
       Exp: {format(new Date(driver.licenseExpiry), "MMM dd, yyyy")}
      </p> */}
     </div>
    )
   }
  },
  {
   accessorKey: "status",
   header: "Status",
   cell: ({ row }) => {
    return (
     <StatusBadge status='active' />
    )
   }
  },
  {
   accessorKey: "rating",
   header: "Rating",
   cell: ({ row }) => {
    return (
     <div className="flex items-center gap-1">
      <Star className="h-4 w-4 text-warning fill-current" />
      <span>{row.original.rating.toFixed(1)}</span>
     </div>
    )
   }
  },
  {
   accessorKey: "trips",
   header: "Trips",
   cell: ({ row }) => {
    return row.original.trips
   }
  },
  {
   accessorKey: "preferred",
   header: "Preffered",
   cell: ({ row }) => {
    return (
     <div className="flex items-center gap-2">
      {commIcons[row.original.communicationPreference]}
      <span className="text-sm capitalize">{row.original.communicationPreference}</span>
     </div>
    )
   }
  },
  {
   id: "action",
   cell: ({ row }) => {
    return (
     <div className="flex items-center gap-1">
      <Button
       variant="ghost"
       size="icon"
       className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
       title="WhatsApp"
      >
       <MessageSquare className="h-4 w-4" />
      </Button>
      <Button
       variant="ghost"
       size="icon"
       className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
       title="SMS"
      >
       <Mail className="h-4 w-4" />
      </Button>
      <Button
       variant="ghost"
       size="icon"
       className="h-8 w-8 text-accent hover:text-accent hover:bg-accent/10"
       title="Call"
      >
       <Phone className="h-4 w-4" />
      </Button>
      <DropdownMenu>
       <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
         <MoreHorizontal className="h-4 w-4" />
        </Button>
       </DropdownMenuTrigger>
       <DropdownMenuContent align="end">
        <DropdownMenuItem>
         <Eye className="h-4 w-4" />
         View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setAddDriverModal(true)}>
         <Pencil className="h-4 w-4" />
         Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
         <MessageSquare className="h-4 w-4" />
         Send WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem>
         <Mail className="h-4 w-4" />
         Send SMS
        </DropdownMenuItem>
        <DropdownMenuItem>
         <Phone className="h-4 w-4" />
         Call Driver
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
         className="text-destructive"
        >
         <Trash2 className="h-4 w-4 mr-2" />
         Delete
        </DropdownMenuItem>
       </DropdownMenuContent>
      </DropdownMenu>
     </div>
    )
   }
  },
 ]
 return (
  <>
   <DataTable
    data={row}
    columns={column}
   />
   <DriverFormModal open={addDriverModal} onOpenChange={setAddDriverModal} mode='edit' />
  </>
 )
}

import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppAvatar from '@/shared/components/AppAvatar';
import StatusBadge from '@/shared/components/StatusBadge';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, Mail, MessageSquare, MoreHorizontal, Pencil, Phone, Star, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import DriverFormModal from './DriverFormModal';
import { Driver } from '../api/types';
import { useQuery } from '@tanstack/react-query';
import { RequestPayloadExtractor } from '@/shared/types';
import { listDriversQueryOptions, useDeleteDriver } from '../api';
import DeleteDialog from '@/shared/components/DeleteDialog';
import { useDriverStore } from '../stores/driver';
import { useDebounce } from '@/shared/hooks/useDebounce';
import DriverDetailSheet from './DriverDetailSheet';
import { commIcons } from '../lib/commIcons';
import DriverStatusModal from './DriverStatusModal';

export default function DriverTable() {
  const [addDriverModal, setAddDriverModal] = useState(false)
  const [removeDriver, setRemoveDriver] = useState(false)
  const [openDriverDetails, setOpenDriverDetails] = useState(false)
  const [openDriverStatus, setOpenDriverStatus] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)

  function handleSelectedDriver(driver: Driver, type: "view" | "edit" | "delete" | "status") {
    setSelectedDriver(driver);
    switch (type) {
      case "edit":
        setAddDriverModal(true);
        return;
      case "view":
        setOpenDriverDetails(true);
        return;
      case "delete":
        setRemoveDriver(true);
        return;
      case "status":
        setOpenDriverStatus(true);
        return;
    }
  }

  const { mutateAsync: deleteDriver, isPending: deletingDriver } = useDeleteDriver()
  async function handleDriverDelete() {
    await deleteDriver({
      id: selectedDriver?.id
    }, {
      onSuccess: () => {
        setRemoveDriver(false)
      }
    })
  }

  const { search, status } = useDriverStore()
  const debouncedSearch = useDebounce(search)

  const listDriverParams: RequestPayloadExtractor<typeof listDriversQueryOptions> = useMemo(() => ({
    params: {
      ...(debouncedSearch && { query: debouncedSearch }),
      ...(status && { status }),
    }
  }), [debouncedSearch, status])

  const { data: drivers } = useQuery(listDriversQueryOptions(listDriverParams))
  const rows: Driver[] = useMemo(() => drivers?.data ?? [], [drivers])
  const column: ColumnDef<Driver>[] = [
    {
      accessorKey: "driver",
      header: "Driver",
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3">
            <AppAvatar value={row.original.name as string} />
            <div>
              <p className="font-medium truncate">{row.original.name}</p>
              <p className="text-sm text-muted-foreground truncate text-ellipsis w-36.5">ID: {row.original.id}</p>
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
              <p className="text-muted-foreground truncate">{row.original.email}</p>
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
          <StatusBadge status={row.original.status} />
        )
      }
    },
    // {
    //  accessorKey: "rating",
    //  header: "Rating",
    //  cell: ({ row }) => {
    //   return (
    //    <div className="flex items-center gap-1">
    //     <Star className="h-4 w-4 text-warning fill-current" />
    //     <span>{row.original.rating.toFixed(1)}</span>
    //    </div>
    //   )
    //  }
    // },
    // {
    //  accessorKey: "trips",
    //  header: "Trips",
    //  cell: ({ row }) => {
    //   return row.original.trips
    //  }
    // },
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
            {/* <Button
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
      </Button> */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleSelectedDriver(row.original, "view")}>
                  <Eye className="h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSelectedDriver(row.original, "edit")}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                {/* <DropdownMenuSeparator />
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
        <DropdownMenuSeparator /> */}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleSelectedDriver(row.original, "status")}>
                  <Pencil className="h-4 w-4" />
                  Change Status
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleSelectedDriver(row.original, "delete")}
                >
                  <Trash2 className="h-4 w-4" />
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
        data={rows}
        columns={column}
      />

      {/* Modals */}
      <DriverDetailSheet
        open={openDriverDetails}
        onOpenChange={setOpenDriverDetails}
        driver={selectedDriver}
      />
      <DriverStatusModal
        open={openDriverStatus}
        onOpenChange={setOpenDriverStatus}
        driver={selectedDriver}
      />
      <DriverFormModal
        open={addDriverModal}
        onOpenChange={setAddDriverModal}
        mode='edit'
        driver={selectedDriver}
      />
      <DeleteDialog
        open={removeDriver}
        onOpenChange={setRemoveDriver}
        handleDeleteFn={handleDriverDelete}
        isLoading={deletingDriver}
      />
    </>
  )
}

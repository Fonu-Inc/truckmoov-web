import type { ElementType } from "react";
import { DeviceTroubleshooting } from "@truckmoov/reusables/components/installation/DeviceTroubleshooting";
import { VerificationMonitor } from "@truckmoov/reusables/components/installation/VerificationMonitor";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Loader,
  Radio,
  Search,
  Wrench,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import {
  useDeviceCatalog,
  useDeviceConfig,
} from "@/features/devices/hooks/useDeviceConfig";
import { JobStatusBadge } from "@/features/jobs/components/ui/JobStatusBadge";
import { useMyJobs } from "@/features/jobs/stores/jobsStore";

const STATUS_OPTIONS = [
  {
    id: "all", label: "All Installation Jobs",
  },
  {
    id: "accepted", label: "Assigned",
  },
  {
    id: "scheduled", label: "Scheduled",
  },
  {
    id: "in_progress", label: "In Progress",
  },
  {
    id: "completed", label: "Completed",
  },
  {
    id: "issues", label: "Issue Reported",
  },
];

const ISSUE_STATUSES = [
  "issue_reported",
  "unable_to_complete",
];

export default function JobsPage() {
  const navigate = useNavigate();
  const myJobs = useMyJobs();
  const [
    tab,
    setTab,
  ] = useState("all");
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    section,
    setSection,
  ] = useState("jobs");
  const [
    selectedDeviceId,
    setSelectedDeviceId,
  ] = useState<string | null>(null);

  const {
    configQueueDevices,
    loading,
    refetch,
    resetToConfigPending,
    canResetDevices,
  } = useDeviceConfig();
  useDeviceCatalog();

  const handleOpenTroubleshooting = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    setSection("troubleshooting");
  };

  const jobs = useMemo(
    () => {
      const q = search.trim().toLowerCase();
      return myJobs.filter((j) => {
        const matchTab = tab === "all"
          ? true
          : tab === "issues"
            ? ISSUE_STATUSES.includes(j.status)
            : j.status === tab;
        const matchQ
          = !q
            || j.id.toLowerCase().includes(q)
            || j.customer.name.toLowerCase().includes(q)
            || j.vehicle.registration.toLowerCase().includes(q);
        return matchTab && matchQ;
      });
    },
    [
      myJobs,
      tab,
      search,
    ],
  );

  const kpis: {
    id: string; label: string; value: number; icon: ElementType;
  }[] = useMemo(
    () => {
      const count = (s: string) => myJobs.filter(j => j.status === s).length;
      return [
        {
          id: "all", label: "All Installation Jobs", value: myJobs.length, icon: ClipboardList,
        },
        {
          id: "accepted", label: "Assigned", value: count("accepted"), icon: ClipboardList,
        },
        {
          id: "scheduled", label: "Scheduled", value: count("scheduled"), icon: CalendarClock,
        },
        {
          id: "in_progress", label: "In Progress", value: count("in_progress"), icon: Loader,
        },
        {
          id: "completed", label: "Completed", value: count("completed"), icon: CheckCircle2,
        },
        {
          id: "issues",
          label: "Issue Reported",
          value: myJobs.filter(j => ISSUE_STATUSES.includes(j.status)).length,
          icon: AlertTriangle,
        },
      ];
    },
    [myJobs],
  );

  return (
    <div className="space-y-6">
      <Tabs
        value={section}
        onValueChange={setSection}
      >
        <div className="flex justify-center">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger
              value="jobs"
              className="flex items-center gap-2"
            >
              <CalendarClock className="h-4 w-4" />
              <span className="hidden sm:inline">Installations</span>
            </TabsTrigger>
            <TabsTrigger
              value="verification"
              className="flex items-center gap-2"
            >
              <Radio className="h-4 w-4" />
              <span className="hidden sm:inline">Verification</span>
            </TabsTrigger>
            <TabsTrigger
              value="troubleshooting"
              className="flex items-center gap-2"
            >
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">Troubleshooting</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="jobs"
          className="mt-6 space-y-6"
        >
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {kpis.map(k => (
              <Card
                key={k.id}
                className="cursor-pointer transition-colors hover:border-primary/50"
                onClick={() => setTab(k.id)}
              >
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <k.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs text-muted-foreground">{k.label}</p>
                    <p className="truncate text-xl font-semibold">{k.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Installation Jobs
                <Badge
                  variant="outline"
                  className="text-[10px]"
                >
                  Demo data
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search job, customer or vehicle"
                    className="pl-9"
                  />
                </div>
                <Select
                  value={tab}
                  onValueChange={setTab}
                >
                  <SelectTrigger className="w-full sm:w-[220px]">
                    <SelectValue placeholder="All Installation Jobs" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(t => (
                      <SelectItem
                        key={t.id}
                        value={t.id}
                      >
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-x-auto rounded-2xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Installation Location</TableHead>
                      <TableHead>Vehicles</TableHead>
                      <TableHead>Devices</TableHead>
                      <TableHead>Scheduled Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map(j => (
                      <TableRow key={j.id}>
                        <TableCell className="font-medium">{j.id}</TableCell>
                        <TableCell>{j.customer.name}</TableCell>
                        <TableCell>
                          {j.vehicle.registration}
                          <span className="block text-xs text-muted-foreground">
                            {j.vehicle.make}
                            {" "}
                            {j.vehicle.model}
                          </span>
                        </TableCell>
                        <TableCell>
                          {j.device.manufacturer}
                          <span className="block text-xs text-muted-foreground">
                            {j.device.model}
                          </span>
                        </TableCell>
                        <TableCell>
                          {j.customer.city}
                          ,
                          {" "}
                          {j.customer.state}
                        </TableCell>
                        <TableCell>1</TableCell>
                        <TableCell>1</TableCell>
                        <TableCell>{j.scheduledDate}</TableCell>
                        <TableCell>{j.scheduledTime}</TableCell>
                        <TableCell>
                          <JobStatusBadge status={j.status} />
                        </TableCell>
                        <TableCell className="space-x-2 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/jobs/${j.id}`)}
                          >
                            View Details
                          </Button>
                          {[
                            "accepted",
                            "scheduled",
                          ].includes(j.status) && (
                            <Button
                              size="sm"
                              onClick={() => navigate(`/jobs/${j.id}`)}
                            >
                              Start Installation
                            </Button>
                          )}
                          {j.status === "in_progress" && (
                            <Button
                              size="sm"
                              onClick={() => navigate(`/jobs/${j.id}`)}
                            >
                              Complete Installation
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {jobs.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={11}
                          className="py-12 text-center"
                        >
                          <p className="text-sm font-medium">No installation jobs here</p>
                          <p className="text-xs text-muted-foreground">
                            New jobs appear automatically once the system assigns them to you.
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="verification"
          className="mt-6"
        >
          <VerificationMonitor
            devices={configQueueDevices}
            loading={loading}
            onRefresh={refetch}
            onTroubleshoot={handleOpenTroubleshooting}
          />
        </TabsContent>

        <TabsContent
          value="troubleshooting"
          className="mt-6"
        >
          <DeviceTroubleshooting
            devices={configQueueDevices}
            selectedDeviceId={selectedDeviceId}
            onSelectDevice={setSelectedDeviceId}
            onReset={canResetDevices() ? resetToConfigPending : undefined}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

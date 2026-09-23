import type { ReactNode } from "react";
import {
  MapPin,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { installerName } from "@/features/jobs/demoData";
import {
  useJobsStore,
  useMyJobs,
} from "@/features/jobs/stores/jobsStore";

export default function ProfilePage() {
  const installer = useJobsStore(s => s.installer);
  const updateInstaller = useJobsStore(s => s.updateInstaller);
  const myJobs = useMyJobs();

  // Seeded straight from the store — there is no async load to wait on, so
  // this needs no effect to sync.
  const [
    form,
    setForm,
  ] = useState({
    firstName: installer.firstName,
    lastName: installer.lastName,
    phone: installer.phone,
    email: installer.email,
    city: installer.city,
  });

  const save = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("Enter your first and last name.");
      return;
    }
    if (!/^\+?[\d\s-]{7,}$/.test(form.phone.trim())) {
      toast.error("Enter a valid phone number.");
      return;
    }
    updateInstaller({ ...form });
    toast.success("Profile updated.");
  };

  const completed = myJobs.filter(j => j.status === "completed").length;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-lg font-semibold text-primary">
            {installer.firstName[0]}
            {installer.lastName[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold">{installerName(installer)}</p>
            <p className="text-sm text-muted-foreground">
              {installer.id}
              {" · "}
              {installer.city}
              ,
              {" "}
              {installer.state}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="rounded-full capitalize"
            >
              {installer.status.replace(
                "_",
                " ",
              )}
            </Badge>
            <Badge
              variant="outline"
              className="rounded-full"
            >
              {completed}
              {" installations completed"}
            </Badge>
            <Badge
              variant="outline"
              className="text-[10px]"
            >
              Demo data
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal & Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name">
                <Input
                  value={form.firstName}
                  onChange={e => setForm({
                    ...form, firstName: e.target.value,
                  })}
                />
              </Field>
              <Field label="Last name">
                <Input
                  value={form.lastName}
                  onChange={e => setForm({
                    ...form, lastName: e.target.value,
                  })}
                />
              </Field>
              <Field label="Phone number">
                <Input
                  value={form.phone}
                  onChange={e => setForm({
                    ...form, phone: e.target.value,
                  })}
                />
              </Field>
              <Field label="Email">
                <Input
                  value={form.email}
                  onChange={e => setForm({
                    ...form, email: e.target.value,
                  })}
                />
              </Field>
              <Field label="City">
                <Input
                  value={form.city}
                  onChange={e => setForm({
                    ...form, city: e.target.value,
                  })}
                />
              </Field>
              <Field label="Installer ID">
                <Input
                  value={installer.id}
                  disabled
                />
              </Field>
            </div>
            <Button
              className="w-full sm:w-auto"
              onClick={save}
            >
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-primary" />
                {" "}
                Service Areas
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {installer.serviceAreas.map(a => (
                <Badge
                  key={a}
                  variant="outline"
                  className="rounded-full"
                >
                  {a}
                </Badge>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wrench className="h-4 w-4 text-primary" />
                {" "}
                Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {installer.capabilities.map(c => (
                <Badge
                  key={c}
                  variant="secondary"
                  className="rounded-full"
                >
                  {c}
                </Badge>
              ))}
              {installer.deviceTypes.map(c => (
                <Badge
                  key={c}
                  variant="outline"
                  className="rounded-full"
                >
                  {c}
                </Badge>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-primary" />
                {" "}
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Service areas, capabilities and account status are maintained by the Fleet
                Pro operations team. Jobs are assigned to you automatically based on them.
              </p>
              <p>
                Last activity:
                {" "}
                {new Date(installer.lastActivity).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

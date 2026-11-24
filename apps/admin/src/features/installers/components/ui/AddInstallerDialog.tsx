import type { SystemInstaller } from "@truckmoov/api/auth";
import type { ReactNode } from "react";
import {
  useCreateSystemInstaller, useUpdateSystemInstaller,
} from "@truckmoov/api/auth";
import { CityCombobox } from "@truckmoov/reusables/components/location/CityCombobox";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  CAPABILITY_OPTIONS,
  capabilityLabel,
  capabilityValue,
  fromApiState,
  STATE_OPTIONS,
  toApiState,
} from "@/features/installers/installerOptions";
import { cn } from "@/lib/utils";
import { MultiSelect } from "./MultiSelect";

const STEPS = [
  "Installer Information",
  "Service Information",
  "Review & Create",
];

type InstallerForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  installerId: string;
  state: string;
  city: string;
  serviceAreas: string[];
  capabilities: string[];
};

function emptyForm(): InstallerForm {
  return {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    installerId: "",
    state: "",
    city: "",
    serviceAreas: [],
    capabilities: [],
  };
}

function formFromInstaller(i: SystemInstaller): InstallerForm {
  return {
    firstName: i.firstName,
    lastName: i.lastName,
    email: i.email,
    phone: i.phoneNumber,
    installerId: i.code,
    state: fromApiState(i.state),
    city: i.city,
    serviceAreas: i.serviceAreas.map(fromApiState),
    capabilities: i.capabilities.map(capabilityLabel),
  };
}

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  installer?: SystemInstaller | null;
};

export function AddInstallerDialog({
  open,
  onOpenChange,
  installer,
}: Props) {
  const isEdit = !!installer;
  const [
    step,
    setStep,
  ] = useState(0);
  const [
    form,
    setForm,
  ] = useState<InstallerForm>(emptyForm);
  const [
    errors,
    setErrors,
  ] = useState<Record<string, string>>({});
  const createInstaller = useCreateSystemInstaller();
  const updateInstaller = useUpdateSystemInstaller();
  const saving = createInstaller.isPending || updateInstaller.isPending;

  const set = <K extends keyof InstallerForm>(key: K, value: InstallerForm[K]) =>
    setForm(f => ({
      ...f,
      [key]: value,
    }));

  const reset = () => {
    setForm(emptyForm());
    setStep(0);
    setErrors({});
  };

  useEffect(
    () => {
      if (!open)
        return;
      setForm(installer ? formFromInstaller(installer) : emptyForm());
      setStep(0);
      setErrors({});
    },
    [
      open,
      installer,
    ],
  );

  const validate = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!form.firstName.trim())
        e.firstName = "Enter a first name.";
      if (!form.lastName.trim())
        e.lastName = "Enter a last name.";
      if (!/^\S[^\s@]*@\S[^\s.]*\.\S+$/.test(form.email))
        e.email = "Enter a valid email address.";
      if (form.phone.trim().length < 7)
        e.phone = "Enter a valid phone number.";
    }
    if (s === 1) {
      if (!form.state.trim())
        e.state = "Enter a state or region.";
      if (!form.city.trim())
        e.city = "Enter a city or location.";
      if (form.serviceAreas.length === 0)
        e.serviceAreas = "Select at least one service area.";
      if (form.capabilities.length === 0)
        e.capabilities = "Select at least one capability.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validate(step))
      return;
    setStep(s => Math.min(
      s + 1,
      STEPS.length - 1,
    ));
  };

  const close = () => {
    reset();
    onOpenChange(false);
  };

  const details = () => ({
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    phoneNumber: form.phone.trim(),
    ...(form.state.trim() ? { state: toApiState(form.state.trim()) } : {}),
    ...(form.city.trim() ? { city: form.city.trim() } : {}),
    serviceAreas: form.serviceAreas.map(toApiState),
    capabilities: form.capabilities.flatMap(label => capabilityValue(label) ?? []),
  });

  const submit = () => {
    if (isEdit && installer) {
      updateInstaller.mutate(
        {
          id: installer.id,
          data: details(),
        },
        {
          onSuccess: () => {
            toast.success("Installer details updated.");
            close();
          },
          onError: error => toast.error(error.message),
        },
      );
      return;
    }
    createInstaller.mutate(
      {
        data: {
          ...details(),
          email: form.email.trim(),
        },
      },
      {
        onSuccess: () => {
          toast.success(
            "Installer added successfully.",
            { description: "An invitation link to the platform has been emailed to the installer." },
          );
          close();
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  const summary = useMemo(
    () => [
      {
        label: "Installer",
        value: `${form.firstName} ${form.lastName}`.trim() || "-",
      },
      {
        label: "Installer ID", value: form.installerId || "Assigned on creation",
      },
      {
        label: "Email", value: form.email || "-",
      },
      {
        label: "Phone", value: form.phone || "-",
      },
      {
        label: "Service area", value: form.serviceAreas.join(", ") || "-",
      },
      {
        label: "Location",
        value: [
          form.city,
          form.state,
        ].filter(Boolean).join(", ") || "-",
      },
      {
        label: "Capabilities", value: form.capabilities.join(", ") || "-",
      },
      {
        label: "Account status",
        value: isEdit ? "Existing installer" : "Invitation sent",
      },
    ],
    [
      form,
      isEdit,
    ],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v)
          reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Installer" : "Add Installer"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this installer's details. Their service area and capabilities are used for automatic job assignment."
              : "Onboard an installer into the pool. The system uses their service area and capabilities to assign installation jobs automatically."}
          </DialogDescription>
        </DialogHeader>

        <ol className="flex flex-wrap gap-2 border-y py-3">
          {STEPS.map((s, i) => (
            <li
              key={s}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
                i === step
                  ? "bg-primary/10 text-primary"
                  : i < step
                    ? "bg-success/10 text-success"
                    : "text-muted-foreground",
              )}
            >
              <span className="tabular-nums">
                0
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>

        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="First Name*"
              error={errors.firstName}
            >
              <Input
                value={form.firstName}
                onChange={e => set(
                  "firstName",
                  e.target.value,
                )}
                placeholder="Tunde"
              />
            </Field>
            <Field
              label="Last Name*"
              error={errors.lastName}
            >
              <Input
                value={form.lastName}
                onChange={e => set(
                  "lastName",
                  e.target.value,
                )}
                placeholder="Akinwale"
              />
            </Field>
            <Field
              label="Email Address*"
              error={errors.email}
            >
              <Input
                type="email"
                value={form.email}
                onChange={e => set(
                  "email",
                  e.target.value,
                )}
                placeholder="installer@example.com"
                disabled={isEdit}
              />
            </Field>
            <Field
              label="Phone Number*"
              error={errors.phone}
            >
              <Input
                value={form.phone}
                onChange={e => set(
                  "phone",
                  e.target.value,
                )}
                placeholder="+234 800 000 0000"
              />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="State / Region*"
              error={errors.state}
            >
              <Select
                value={form.state}
                onValueChange={state => setForm(f => ({
                  ...f,
                  state,
                  city: "",
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent>
                  {STATE_OPTIONS.map(state => (
                    <SelectItem
                      key={state}
                      value={state}
                    >
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field
              label="City / Location*"
              error={errors.city}
            >
              <CityCombobox
                state={toApiState(form.state)}
                value={form.city}
                onChange={city => set(
                  "city",
                  city,
                )}
              />
            </Field>
            <Field
              label="Service Area*"
              error={errors.serviceAreas}
              full
            >
              <MultiSelect
                options={STATE_OPTIONS}
                value={form.serviceAreas}
                onChange={v => set(
                  "serviceAreas",
                  v,
                )}
                placeholder="Select service areas"
              />
            </Field>
            <Field
              label="Installer Capabilities*"
              error={errors.capabilities}
              full
            >
              <MultiSelect
                options={CAPABILITY_OPTIONS}
                value={form.capabilities}
                onChange={v => set(
                  "capabilities",
                  v,
                )}
                placeholder="Select capabilities"
              />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="grid gap-3 rounded-2xl border p-4 sm:grid-cols-2">
              {summary.map(row => (
                <div key={row.label}>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {row.label}
                  </p>
                  <p className="text-sm font-medium">{row.value}</p>
                </div>
              ))}
            </div>
            <Badge
              variant="secondary"
              className="rounded-full"
            >
              Job assignment is handled automatically by the system
            </Badge>
            {!isEdit && (
              <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                Once created, the system automatically emails the installer an invitation
                link to access the platform. No credentials need to be shared manually.
              </p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => (step === 0 ? onOpenChange(false) : setStep(s => s - 1))}
          >
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < STEPS.length - 1
            ? (
                <Button
                  type="button"
                  onClick={next}
                >
                  Continue
                </Button>
              )
            : (
                <Button
                  type="button"
                  onClick={submit}
                  disabled={saving}
                >
                  {saving
                    ? isEdit
                      ? "Saving changes…"
                      : "Creating installer…"
                    : isEdit
                      ? "Save Changes"
                      : "Create Installer"}
                </Button>
              )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  full,
  children,
}: {
  label: string;
  error?: string;
  full?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn(
      "space-y-1.5",
      full && "sm:col-span-2",
    )}
    >
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

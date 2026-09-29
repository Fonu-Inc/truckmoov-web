import type { InstallerCapability } from "@truckmoov/api/auth";
import type { ReactNode } from "react";
import type { Installer } from "@/features/installers/demoData";
import { useCreateSystemInstaller } from "@truckmoov/api/auth";
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
  CAPABILITY_OPTIONS,
  DEVICE_TYPE_OPTIONS,
  STATE_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
} from "@/features/installers/demoData";
import { cn } from "@/lib/utils";
import { MultiSelect } from "./MultiSelect";

const STEPS = [
  "Installer Information",
  "Service Information",
  "Review & Create",
];

// POST /auth/system/installers takes enum values, not the labels the form shows.
const CAPABILITY_VALUE: Record<string, InstallerCapability> = {
  "Tracker installation & wiring": "tracker_installation_wiring",
  "SIM installation & activation": "sim_installation_activation",
  "Device configuration & provisioning": "device_configuration_provisioning",
  "Fuel sensor installation & calibration": "fuel_sensor_installation_calibration",
  "Camera & accessory installation": "camera_accessory_installation",
  "Diagnostics, repairs & troubleshooting": "diagnostics_repairs_troubleshooting",
  "Device replacement & de-installation": "device_replacement_deinstallation",
  "On-site customer training & handover": "onsite_customer_training_handover",
};

// The API's state enum spells Abuja as "FCT"; every other option already matches.
const toApiState = (s: string) => (s === "Abuja (FCT)" ? "FCT" : s);

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
    installerId: `INS-${Math.floor(1000 + Math.random() * 8999)}`,
    state: "",
    city: "",
    serviceAreas: [],
    capabilities: [],
  };
}

function formFromInstaller(i: Installer): InstallerForm {
  return {
    firstName: i.firstName,
    lastName: i.lastName,
    email: i.email,
    phone: i.phone,
    installerId: i.id,
    state: i.state,
    city: i.city,
    serviceAreas: [...i.serviceAreas],
    capabilities: [...i.capabilities],
  };
}

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  installer?: Installer | null;
  onCreate: (installer: Installer) => void;
  onUpdate: (id: string, updates: Partial<Installer>) => void;
};

export function AddInstallerDialog({
  open,
  onOpenChange,
  installer,
  onCreate,
  onUpdate,
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

  const submit = () => {
    const now = new Date().toISOString();
    if (isEdit && installer) {
      onUpdate(
        installer.id,
        {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          state: form.state.trim(),
          city: form.city.trim(),
          serviceAreas: form.serviceAreas,
          capabilities: form.capabilities,
        },
      );
      toast.success("Installer details updated.");
      reset();
      onOpenChange(false);
      return;
    }
    // Create is live: the server stores the installer and emails their invite to the
    // installer portal. The list itself is still local state (see demoData.ts).
    createInstaller.mutate(
      {
        data: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phoneNumber: form.phone.trim(),
          ...(form.state.trim() ? { state: toApiState(form.state.trim()) } : {}),
          ...(form.city.trim() ? { city: form.city.trim() } : {}),
          serviceAreas: form.serviceAreas.map(toApiState),
          capabilities: form.capabilities.map(c => CAPABILITY_VALUE[c]).filter(Boolean),
        },
      },
      {
        onSuccess: (res) => {
          onCreate({
            id: res.data.code ?? form.installerId,
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            state: form.state.trim(),
            city: form.city.trim(),
            serviceAreas: form.serviceAreas,
            capabilities: form.capabilities,
            deviceTypes: [...DEVICE_TYPE_OPTIONS],
            vehicleTypes: [...VEHICLE_TYPE_OPTIONS],
            status: "pending_activation",
            loginEmail: form.email.trim(),
            accountSetup: "activation_email",
            dateAdded: now,
            lastActivity: now,
          });
          toast.success(
            "Installer added successfully.",
            { description: "An invitation link to the installer portal has been emailed to the installer." },
          );
          reset();
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  };

  const summary = useMemo(
    () => [
      {
        label: "Installer",
        value: `${form.firstName} ${form.lastName}`.trim() || "—",
      },
      {
        label: "Installer ID", value: form.installerId,
      },
      {
        label: "Email", value: form.email || "—",
      },
      {
        label: "Phone", value: form.phone || "—",
      },
      {
        label: "Service area", value: form.serviceAreas.join(", ") || "—",
      },
      {
        label: "Location",
        value: [
          form.city,
          form.state,
        ].filter(Boolean).join(", ") || "—",
      },
      {
        label: "Capabilities", value: form.capabilities.join(", ") || "—",
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
              <Input
                value={form.state}
                onChange={e => set(
                  "state",
                  e.target.value,
                )}
                placeholder="Lagos"
              />
            </Field>
            <Field
              label="City / Location*"
              error={errors.city}
            >
              <Input
                value={form.city}
                onChange={e => set(
                  "city",
                  e.target.value,
                )}
                placeholder="Ikeja"
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
                  loading={createInstaller.isPending}
                >
                  {isEdit ? "Save Changes" : "Create Installer"}
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

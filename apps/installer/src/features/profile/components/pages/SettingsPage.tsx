import type { UseQueryResult } from "@tanstack/react-query";
import type { InstallerProfile } from "@truckmoov/api/auth";
import type {
  ElementType, ReactNode,
} from "react";
import {
  useInstallerDisplayPreferences,
  useInstallerNotificationPreferences,
  useInstallerProfile,
  useInstallerWorkPreferences,
  useTwoFactor,
  useUploadInstallerProfilePhoto,
} from "@truckmoov/api/auth";
import { TwoFactorSetupCard } from "@truckmoov/reusables/components/auth/TwoFactorSetupCard";
import {
  Bell,
  Database,
  Globe,
  Shield,
  Upload,
  User,
  Wrench,
} from "lucide-react";
import {
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { QueryState } from "@/components/QueryState";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcn/avatar";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Label } from "@/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Switch } from "@/components/shadcn/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import { DisplayPreferencesForm } from "../forms/DisplayPreferencesForm";
import { NotificationPreferencesForm } from "../forms/NotificationPreferencesForm";
import { PasswordForm } from "../forms/PasswordForm";
import { ProfileDetailsForm } from "../forms/ProfileDetailsForm";
import { WorkPreferencesForm } from "../forms/WorkPreferencesForm";

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

export default function SettingsPage() {
  const profile = useInstallerProfile();
  const display = useInstallerDisplayPreferences();
  const notifications = useInstallerNotificationPreferences();
  const work = useInstallerWorkPreferences();

  return (
    <Tabs
      defaultValue="profile"
      className="space-y-6"
    >
      <TabsList className="mx-auto flex h-auto w-fit max-w-full flex-wrap justify-center gap-1">
        <TabsTrigger
          value="profile"
          className="gap-2"
        >
          <User className="h-4 w-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger
          value="notifications"
          className="gap-2"
        >
          <Bell className="h-4 w-4" />
          Notification Settings
        </TabsTrigger>
        <TabsTrigger
          value="work"
          className="gap-2"
        >
          <Wrench className="h-4 w-4" />
          Work Preferences
        </TabsTrigger>
      </TabsList>

      <TabsContent
        value="profile"
        className="mt-3 space-y-6"
      >
        <Loaded query={profile}>
          {({ data }) => (
            <>
              <PhotoCard personal={data.personal} />
              <Section
                title="Personal Details"
                description="Your name and contact information."
              >
                <ProfileDetailsForm personal={data.personal} />
              </Section>
            </>
          )}
        </Loaded>
        <AccountSecurity />
        <Section
          icon={Globe}
          title="Display Preferences"
          description="Time and language defaults used for charts, tables, and reports."
        >
          <Loaded query={display}>
            {({ data }) => <DisplayPreferencesForm preferences={data} />}
          </Loaded>
        </Section>
        <DataRetention />
      </TabsContent>

      <TabsContent
        value="notifications"
        className="mt-3 space-y-6"
      >
        <Section
          title="Job Notifications"
          description="Choose what you want to be alerted about."
        >
          <Loaded query={notifications}>
            {({ data }) => <NotificationPreferencesForm preferences={data} />}
          </Loaded>
        </Section>
      </TabsContent>

      <TabsContent
        value="work"
        className="mt-3 space-y-6"
      >
        <Section
          title="Work Preferences"
          description="Helps the system schedule your installations."
        >
          <Loaded query={work}>
            {({ data }) => <WorkPreferencesForm preferences={data} />}
          </Loaded>
        </Section>
      </TabsContent>
    </Tabs>
  );
}

/** Skeleton while loading, the error on failure, the children once the data is in. */
function Loaded<T>({
  query, children,
}: {
  query: UseQueryResult<T, { message: string }>;
  children: (data: T) => ReactNode;
}) {
  return (
    <QueryState
      query={query}
      skeleton={<Skeleton className="h-40 w-full rounded-2xl" />}
    >
      {query.data && children(query.data)}
    </QueryState>
  );
}

function Section({
  icon: Icon, title, description, children,
}: {
  icon?: ElementType;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="surface-sleek rounded-2xl">
      <CardHeader className="p-6 pb-4 space-y-1.5">
        <CardTitle className="font-display flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-primary" />}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">{children}</CardContent>
    </Card>
  );
}

function Row({
  title, description, children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/**
 * Two-factor and password open their real flows in a dialog; the rows only
 * summarise them, as on appdemo.
 */
function AccountSecurity() {
  const enrolled = !!useTwoFactor().data?.data.enrolled;
  const [
    dialog,
    setDialog,
  ] = useState<"2fa" | "password" | null>(null);
  // ponytail: no session-timeout endpoint yet — kept in component state so the row matches appdemo.
  const [
    sessionTimeout,
    setSessionTimeout,
  ] = useState("60");

  return (
    <Section
      icon={Shield}
      title="Account & Security"
      description="Manage sign-in protection and account access."
    >
      <div className="space-y-4">
        <Row
          title="Two-Factor Authentication"
          description="Require an additional verification step when signing in."
        >
          <Switch
            checked={enrolled}
            onCheckedChange={() => setDialog("2fa")}
            aria-label="Two-factor authentication"
          />
        </Row>
        <Row
          title="Portal Session Timeout"
          description="Automatically sign out after a period of inactivity."
        >
          <Select
            value={sessionTimeout}
            onValueChange={setSessionTimeout}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="240">4 hours</SelectItem>
            </SelectContent>
          </Select>
        </Row>
        <Row
          title="Change Password"
          description="Update the password used to sign in to your account."
        >
          <Button
            variant="outline"
            onClick={() => setDialog("password")}
          >
            Change Password
          </Button>
        </Row>
      </div>

      <Dialog
        open={dialog === "2fa"}
        onOpenChange={o => !o && setDialog(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="sr-only">
            <DialogTitle>Two-factor authentication</DialogTitle>
            <DialogDescription>Turn two-factor authentication on or off.</DialogDescription>
          </DialogHeader>
          <TwoFactorSetupCard className="border-0 shadow-none" />
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog === "password"}
        onOpenChange={o => !o && setDialog(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Use at least 8 characters. Changing it signs you out everywhere else.</DialogDescription>
          </DialogHeader>
          <PasswordForm />
        </DialogContent>
      </Dialog>
    </Section>
  );
}

/** ponytail: mock from appdemo parity — no data-retention endpoint for installers; wire to packages/api when one lands. */
const RETENTION = [
  {
    label: "GPS Data Retention",
    value: "1y",
    options: [
      [
        "90d",
        "90 Days",
      ],
      [
        "6m",
        "6 Months",
      ],
      [
        "1y",
        "1 Year",
      ],
      [
        "2y",
        "2 Years",
      ],
    ],
  },
  {
    label: "Log Retention",
    value: "30d",
    options: [
      [
        "7d",
        "7 Days",
      ],
      [
        "30d",
        "30 Days",
      ],
      [
        "90d",
        "90 Days",
      ],
    ],
  },
  {
    label: "Backup Frequency",
    value: "daily",
    options: [
      [
        "daily",
        "Daily",
      ],
      [
        "weekly",
        "Weekly",
      ],
      [
        "monthly",
        "Monthly",
      ],
    ],
  },
] as const;

function DataRetention() {
  return (
    <Section
      icon={Database}
      title="Data Retention"
      description="Configure how long data is retained in the system"
    >
      <div className="grid gap-4 md:grid-cols-3">
        {RETENTION.map(r => (
          <div
            key={r.label}
            className="space-y-2"
          >
            <Label>{r.label}</Label>
            <Select defaultValue={r.value}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {r.options.map(([
                  v,
                  l,
                ]) => (
                  <SelectItem
                    key={v}
                    value={v}
                  >
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </Section>
  );
}

function PhotoCard({ personal }: { personal: InstallerProfile["personal"] }) {
  const upload = useUploadInstallerProfilePhoto();
  const fileRef = useRef<HTMLInputElement>(null);
  const initials = `${personal.firstName[0] ?? ""}${personal.lastName[0] ?? ""}`.toUpperCase() || "IN";

  const pick = (file?: File) => {
    if (fileRef.current)
      fileRef.current.value = "";
    if (!file)
      return;
    if (![
      "image/jpeg",
      "image/png",
    ].includes(file.type)) {
      toast.error("Choose a JPG or PNG image.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error("The photo must be 2 MB or smaller.");
      return;
    }
    upload.mutate(
      { file },
      {
        onSuccess: () => toast.success("Profile picture updated."),
        onError: error => toast.error(error.message),
      },
    );
  };

  return (
    <Section
      title="Profile Picture"
      description="Shown to customers on installation jobs."
    >
      <div className="flex flex-wrap items-center gap-6">
        <Avatar className="h-20 w-20">
          {personal.photoUrl
            ? (
                <AvatarImage
                  src={personal.photoUrl}
                  alt={`${personal.firstName} ${personal.lastName}`}
                />
              )
            : null}
          <AvatarFallback className="bg-primary text-primary-foreground text-xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={e => pick(e.target.files?.[0])}
          />
          <Button
            variant="outline"
            onClick={() => fileRef.current?.click()}
            loading={upload.isPending}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload photo
          </Button>
          <p className="text-xs text-muted-foreground">JPG or PNG, up to 2MB.</p>
        </div>
      </div>
    </Section>
  );
}

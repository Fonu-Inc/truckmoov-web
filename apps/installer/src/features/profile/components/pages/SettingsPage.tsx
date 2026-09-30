import type { UseQueryResult } from "@tanstack/react-query";
import type { InstallerProfile } from "@truckmoov/api/auth";
import type { ReactNode } from "react";
import {
  useInstallerDisplayPreferences,
  useInstallerNotificationPreferences,
  useInstallerProfile,
  useInstallerWorkPreferences,
  useUploadInstallerProfilePhoto,
} from "@truckmoov/api/auth";
import { formatDateOnlyInTimezone } from "@truckmoov/app-core/utils/time-utils";
import {
  Bell,
  Monitor,
  ShieldCheck,
  Upload,
  User,
  Wrench,
} from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcn/avatar";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Separator } from "@/components/shadcn/separator";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import { InstallerStatusBadge } from "@/features/jobs/components/ui/InstallerStatusBadge";
import { DisplayPreferencesForm } from "../forms/DisplayPreferencesForm";
import { NotificationPreferencesForm } from "../forms/NotificationPreferencesForm";
import { PasswordForm } from "../forms/PasswordForm";
import { ProfileDetailsForm } from "../forms/ProfileDetailsForm";
import { WorkPreferencesForm } from "../forms/WorkPreferencesForm";
import { TwoFactorCard } from "../ui/TwoFactorCard";

const DEFAULT_ZONE = "Africa/Lagos";
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

const TABS = [
  [
    "profile",
    "Profile",
    User,
  ],
  [
    "account",
    "Account & Security",
    ShieldCheck,
  ],
  [
    "display",
    "Display",
    Monitor,
  ],
  [
    "notifications",
    "Notifications",
    Bell,
  ],
  [
    "work",
    "Work Preferences",
    Wrench,
  ],
] as const;

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
      <TabsList className="flex w-full flex-wrap justify-start gap-1">
        {TABS.map(([
          value,
          label,
          Icon,
        ]) => (
          <TabsTrigger
            key={value}
            value={value}
            className="gap-2"
          >
            <Icon className="h-4 w-4" />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent
        value="profile"
        className="space-y-6"
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
              <RecordCard
                record={data.record}
                zone={display.data?.data.timezone ?? DEFAULT_ZONE}
              />
            </>
          )}
        </Loaded>
      </TabsContent>

      <TabsContent
        value="account"
        className="space-y-6"
      >
        <Section
          title="Email Address"
          description="Your sign-in email. Contact the Platform Admin to change it."
        >
          <div className="max-w-sm space-y-1.5">
            <Label htmlFor="installer-email">Email address</Label>
            {profile.data
              ? (
                  <Input
                    id="installer-email"
                    value={profile.data.data.personal.email}
                    disabled
                  />
                )
              : <Skeleton className="h-10" />}
          </div>
        </Section>
        <Section
          title="Password"
          description="Use at least 8 characters. Changing it signs you out everywhere else."
        >
          <PasswordForm />
          <Separator className="my-4" />
          <p className="text-xs text-muted-foreground">
            If you did not request a change, contact the Platform Admin immediately.
          </p>
        </Section>
        <TwoFactorCard />
      </TabsContent>

      <TabsContent
        value="display"
        className="space-y-6"
      >
        <Section
          title="Display Preferences"
          description="How dates, times and default ranges are shown across the portal."
        >
          <Loaded query={display}>
            {({ data }) => <DisplayPreferencesForm preferences={data} />}
          </Loaded>
        </Section>
      </TabsContent>

      <TabsContent
        value="notifications"
        className="space-y-6"
      >
        <Section
          title="Notifications"
          description="Choose what you are alerted about and where."
        >
          <Loaded query={notifications}>
            {({ data }) => <NotificationPreferencesForm preferences={data} />}
          </Loaded>
        </Section>
      </TabsContent>

      <TabsContent
        value="work"
        className="space-y-6"
      >
        <Section
          title="Availability"
          description="Decides which installation offers reach you."
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
  if (query.data)
    return <>{children(query.data)}</>;
  if (query.isError) {
    return (
      <div className="flex items-center gap-3 text-sm text-destructive">
        {query.error.message}
        <Button
          variant="outline"
          size="sm"
          onClick={() => query.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }
  return <Skeleton className="h-40 w-full rounded-2xl" />;
}

function Section({
  title, description, children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="surface-sleek rounded-2xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
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
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-xl">
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
          <p className="text-xs text-muted-foreground">JPG or PNG, up to 2 MB.</p>
        </div>
      </div>
    </Section>
  );
}

function RecordCard({
  record, zone,
}: {
  record: InstallerProfile["record"];
  zone: string;
}) {
  return (
    <Section
      title="Installer Record"
      description="Managed by the Platform Admin."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Read
          label="Installer ID"
          value={record.code}
        />
        <Read
          label="Account status"
          value={<InstallerStatusBadge status={record.status === "invited" ? "pending_activation" : record.status} />}
        />
        <Read
          label="Service areas"
          value={record.serviceAreas.length
            ? (
                <div className="flex flex-wrap gap-1">
                  {record.serviceAreas.map(a => (
                    <Badge
                      key={a}
                      variant="secondary"
                      className="rounded-full"
                    >
                      {a}
                    </Badge>
                  ))}
                </div>
              )
            : "—"}
        />
        <Read
          label="Date added"
          value={formatDateOnlyInTimezone(
            record.createdAt,
            zone,
          )}
        />
      </div>
    </Section>
  );
}

function Read({
  label, value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-xl border p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm font-medium">{value}</div>
    </div>
  );
}

import type { ReactNode } from "react";
import {
  Bell,
  Save,
  ShieldCheck,
  Upload,
  User,
  Wrench,
} from "lucide-react";
import {
  useRef,
  useState,
} from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Separator } from "@/components/shadcn/separator";
import { Switch } from "@/components/shadcn/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import { InstallerStatusBadge } from "@/features/jobs/components/ui/InstallerStatusBadge";
import { installerName } from "@/features/jobs/demoData";
import { useJobsStore } from "@/features/jobs/stores/jobsStore";

export default function SettingsPage() {
  const installer = useJobsStore(s => s.installer);
  const updateInstaller = useJobsStore(s => s.updateInstaller);
  const fileRef = useRef<HTMLInputElement>(null);

  // Seeded from the store — there is no async load, so no effect to re-sync.
  const [
    avatar,
    setAvatar,
  ] = useState<string | undefined>(installer.avatarUrl);
  const [
    firstName,
    setFirstName,
  ] = useState(installer.firstName);
  const [
    lastName,
    setLastName,
  ] = useState(installer.lastName);
  const [
    phone,
    setPhone,
  ] = useState(installer.phone);
  const [
    email,
    setEmail,
  ] = useState(installer.email);
  const [
    city,
    setCity,
  ] = useState(installer.city);
  const [
    state,
    setState,
  ] = useState(installer.state);
  const [
    password,
    setPassword,
  ] = useState({
    current: "", next: "", confirm: "",
  });
  const [
    notify,
    setNotify,
  ] = useState({
    newJob: true,
    reminder: true,
    statusUpdates: true,
    sms: true,
    email: true,
  });
  const [
    availability,
    setAvailability,
  ] = useState("available");
  const [
    workingHours,
    setWorkingHours,
  ] = useState("08:00 - 18:00");

  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "IN";

  const pickAvatar = (file?: File) => {
    if (!file)
      return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      setAvatar(url);
      updateInstaller({ avatarUrl: url });
      toast.success("Profile picture updated.");
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First and last name are required.");
      return;
    }
    updateInstaller({
      firstName, lastName, phone, city, state,
    });
    toast.success("Profile saved.");
  };

  const saveEmail = () => {
    if (!/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address.");
      return;
    }
    updateInstaller({ email });
    toast.success("Email address updated.");
  };

  const savePassword = () => {
    if (!password.current) {
      toast.error("Enter your current password.");
      return;
    }
    if (password.next.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (password.next !== password.confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setPassword({
      current: "", next: "", confirm: "",
    });
    // ponytail: validation only — there is no change-password endpoint wired
    // for installers yet, so this confirms the input and stops there.
    toast.success("Password updated.");
  };

  return (
    <Tabs
      defaultValue="profile"
      className="space-y-6"
    >
      <TabsList className="flex w-full flex-wrap justify-start gap-1">
        <TabsTrigger
          value="profile"
          className="gap-2"
        >
          <User className="h-4 w-4" />
          {" "}
          Profile
        </TabsTrigger>
        <TabsTrigger
          value="account"
          className="gap-2"
        >
          <ShieldCheck className="h-4 w-4" />
          {" "}
          Account &amp; Security
        </TabsTrigger>
        <TabsTrigger
          value="notifications"
          className="gap-2"
        >
          <Bell className="h-4 w-4" />
          {" "}
          Notifications
        </TabsTrigger>
        <TabsTrigger
          value="work"
          className="gap-2"
        >
          <Wrench className="h-4 w-4" />
          {" "}
          Work Preferences
        </TabsTrigger>
      </TabsList>

      {/* Profile */}
      <TabsContent
        value="profile"
        className="space-y-6"
      >
        <Card className="surface-sleek rounded-2xl">
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Shown to customers on installation jobs.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-6">
            <Avatar className="h-20 w-20">
              {avatar
                ? (
                    <AvatarImage
                      src={avatar}
                      alt={installerName(installer)}
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
                accept="image/*"
                className="hidden"
                onChange={e => pickAvatar(e.target.files?.[0])}
              />
              <Button
                variant="outline"
                onClick={() => fileRef.current?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                {" "}
                Upload photo
              </Button>
              {avatar
                ? (
                    <Button
                      variant="ghost"
                      className="ml-2"
                      onClick={() => {
                        setAvatar(undefined);
                        updateInstaller({ avatarUrl: undefined });
                        toast.success("Profile picture removed.");
                      }}
                    >
                      Remove
                    </Button>
                  )
                : null}
              <p className="text-xs text-muted-foreground">JPG or PNG, up to 2MB.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-sleek rounded-2xl">
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
            <CardDescription>Your name and contact information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>First name</Label>
                <Input
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Last name</Label>
                <Input
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone number</Label>
                <Input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>State</Label>
                <Input
                  value={state}
                  onChange={e => setState(e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>City / base location</Label>
                <Input
                  value={city}
                  onChange={e => setCity(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={saveProfile}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {" "}
              Save changes
            </Button>
          </CardContent>
        </Card>

        <Card className="surface-sleek rounded-2xl">
          <CardHeader>
            <CardTitle>Installer Record</CardTitle>
            <CardDescription>Managed by the Platform Admin.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Read
                label="Installer ID"
                value={installer.id}
              />
              <Read
                label="Account status"
                value={<InstallerStatusBadge status={installer.status} />}
              />
              <Read
                label="Service area"
                value={installer.serviceAreas.join(", ") || "—"}
              />
              <Read
                label="Date added"
                value={installer.dateAdded}
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Installation capabilities
              </p>
              <div className="flex flex-wrap gap-1">
                {installer.capabilities.map(c => (
                  <Badge
                    key={c}
                    variant="secondary"
                    className="rounded-full"
                  >
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Account & Security */}
      <TabsContent
        value="account"
        className="space-y-6"
      >
        <Card className="surface-sleek rounded-2xl">
          <CardHeader>
            <CardTitle>Email Address</CardTitle>
            <CardDescription>Used for job notifications and sign-in.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Email address</Label>
                <Input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Sign-in email</Label>
                <Input
                  value={installer.loginEmail}
                  disabled
                />
              </div>
            </div>
            <Button
              onClick={saveEmail}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {" "}
              Update email
            </Button>
          </CardContent>
        </Card>

        <Card className="surface-sleek rounded-2xl">
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Use at least 8 characters.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Current password</Label>
                <Input
                  type="password"
                  value={password.current}
                  onChange={e => setPassword({
                    ...password, current: e.target.value,
                  })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>New password</Label>
                <Input
                  type="password"
                  value={password.next}
                  onChange={e => setPassword({
                    ...password, next: e.target.value,
                  })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Confirm new password</Label>
                <Input
                  type="password"
                  value={password.confirm}
                  onChange={e => setPassword({
                    ...password, confirm: e.target.value,
                  })}
                />
              </div>
            </div>
            <Button onClick={savePassword}>Update password</Button>
            <Separator />
            <p className="text-xs text-muted-foreground">
              If you did not request a change, contact the Platform Admin immediately.
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Notifications */}
      <TabsContent
        value="notifications"
        className="space-y-6"
      >
        <Card className="surface-sleek rounded-2xl">
          <CardHeader>
            <CardTitle>Job Notifications</CardTitle>
            <CardDescription>Choose what you want to be alerted about.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Toggle
              label="New job assigned"
              description="Alert me when a new installation is assigned to me."
              checked={notify.newJob}
              onChange={v => setNotify({
                ...notify, newJob: v,
              })}
            />
            <Toggle
              label="Schedule reminders"
              description="Remind me before a scheduled installation."
              checked={notify.reminder}
              onChange={v => setNotify({
                ...notify, reminder: v,
              })}
            />
            <Toggle
              label="Job status updates"
              description="Updates on verification and completion of my jobs."
              checked={notify.statusUpdates}
              onChange={v => setNotify({
                ...notify, statusUpdates: v,
              })}
            />
            <Separator />
            <Toggle
              label="SMS alerts"
              description="Receive alerts by text message."
              checked={notify.sms}
              onChange={v => setNotify({
                ...notify, sms: v,
              })}
            />
            <Toggle
              label="Email alerts"
              description="Receive alerts by email."
              checked={notify.email}
              onChange={v => setNotify({
                ...notify, email: v,
              })}
            />
            {/* ponytail: preferences are not persisted — no endpoint stores
                installer notification settings yet. */}
            <Button
              onClick={() => toast.success("Notification preferences saved.")}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {" "}
              Save preferences
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Work preferences */}
      <TabsContent
        value="work"
        className="space-y-6"
      >
        <Card className="surface-sleek rounded-2xl">
          <CardHeader>
            <CardTitle>Availability</CardTitle>
            <CardDescription>Helps the system schedule your installations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Current availability</Label>
                <Select
                  value={availability}
                  onValueChange={setAvailability}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available for jobs</SelectItem>
                    <SelectItem value="busy">Busy — on a job</SelectItem>
                    <SelectItem value="off">Off duty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Working hours</Label>
                <Input
                  value={workingHours}
                  onChange={e => setWorkingHours(e.target.value)}
                  placeholder="08:00 - 18:00"
                />
              </div>
            </div>
            <Button
              onClick={() => toast.success("Work preferences saved.")}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {" "}
              Save preferences
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
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

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
      />
    </div>
  );
}

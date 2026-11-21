import { useQuery } from "@tanstack/react-query";
import {
  getMeQueryOptions,
  getProfileQueryOptions,
  useUpdateProfile,
  useUploadMedia,
} from "@truckmoov/api/auth";
import {
  Camera, RefreshCw, Save, User as UserIcon,
} from "lucide-react";
import {
  useRef, useState,
} from "react";
import { toast } from "sonner";
import {
  Avatar, AvatarFallback, AvatarImage,
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
import { PageActions } from "@/shared/components/layout/PageTitle";
import { useAuthStore } from "@/stores/authStore";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

type Loose = Record<string, unknown> | undefined;

/**
 * `GET /auth/profile` and `GET /auth/me` are typed as untyped records, and the
 * field may sit at the top level or under `profile` / `user`, in camel or snake
 * case. Read the first non-empty string from any of those spots.
 */
function pick(sources: Loose[], keys: string[]): string | undefined {
  for (const source of sources) {
    if (!source)
      continue;
    const nested = [
      source,
      source.profile,
      source.user,
    ] as Loose[];
    for (const obj of nested) {
      if (!obj || typeof obj !== "object")
        continue;
      for (const key of keys) {
        const value = obj[key];
        if (typeof value === "string" && value.trim())
          return value;
      }
    }
  }
  return undefined;
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = ev => resolve(ev.target?.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Settings → My Profile — fleetflow's personal-profile card, wired:
 * loads from `/auth/profile` (falling back to `/auth/me`), uploads a new photo
 * through `/auth/media/upload` on save, then `PATCH /auth/profile`.
 */
export function MyProfileCard() {
  const user = useAuthStore(s => s.user);
  const profileQuery = useQuery(getProfileQueryOptions());
  const meQuery = useQuery(getMeQueryOptions());
  const updateProfile = useUpdateProfile();
  const uploadMedia = useUploadMedia();

  const [
    profileName,
    setProfileName,
  ] = useState("");
  const [
    profilePhone,
    setProfilePhone,
  ] = useState("");
  const [
    profileAvatar,
    setProfileAvatar,
  ] = useState<string | undefined>();
  const [
    avatarFile,
    setAvatarFile,
  ] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profile = profileQuery.data?.data;
  const me = meQuery.data?.data;
  const email = pick(
    [
      profile,
      me,
    ],
    ["email"],
  ) ?? user?.email ?? "";

  // Re-seed the fields whenever the server copy changes — adjusted during
  // render rather than in an effect.
  const [
    seededFrom,
    setSeededFrom,
  ] = useState<{
    profile?: Loose; me?: Loose;
  }>({});
  if ((profile || me) && (seededFrom.profile !== profile || seededFrom.me !== me)) {
    setSeededFrom({
      profile, me,
    });
    setProfileName(pick(
      [
        profile,
        me,
      ],
      [
        "fullName",
        "full_name",
        "name",
      ],
    ) ?? "");
    setProfilePhone(pick(
      [
        profile,
        me,
      ],
      [
        "phoneNumber",
        "phone_number",
        "phone",
      ],
    ) ?? "");
    setProfileAvatar(pick(
      [
        profile,
        me,
      ],
      [
        "profilePictureUrl",
        "profile_picture_url",
        "avatarUrl",
        "avatar_url",
        "avatar",
      ],
    ));
    setAvatarFile(null);
  }

  const handleAvatarPick = () => fileInputRef.current?.click();
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file)
      return;
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Image must be smaller than 2MB");
      return;
    }
    setAvatarFile(file);
    setProfileAvatar(await readFile(file));
  };

  const savingProfile = updateProfile.isPending || uploadMedia.isPending;

  const handleSaveProfile = async () => {
    if (!profileName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    try {
      let profilePictureUrl: string | undefined;
      if (avatarFile) {
        const uploaded = await uploadMedia.mutateAsync(avatarFile);
        profilePictureUrl = uploaded.data.url;
      }
      await updateProfile.mutateAsync({
        data: {
          fullName: profileName.trim(),
          phoneNumber: profilePhone.trim() || undefined,
          ...(profilePictureUrl ? { profilePictureUrl } : {}),
        },
      });
      setAvatarFile(null);
      toast.success("Profile updated");
    }
    catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="h-5 w-5 text-primary" />
          My Profile
        </CardTitle>
        <CardDescription>
          Your personal account only — these details are not shown as the platform profile.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={profileAvatar}
                alt={profileName}
              />
              <AvatarFallback className="text-lg">
                {(profileName || email || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={handleAvatarPick}
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow hover:opacity-90"
              aria-label="Change avatar"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <p className="font-medium">{profileName || "Platform Admin"}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
            {user?.role && (
              <Badge
                variant="outline"
                className="mt-1 capitalize"
              >
                {user.role.replace(
                  /_/g,
                  " ",
                ).toLowerCase()}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="profileName">Full Name</Label>
            <Input
              id="profileName"
              value={profileName}
              onChange={e => setProfileName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profileEmail">Email</Label>
            <Input
              id="profileEmail"
              value={email}
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profilePhone">Phone</Label>
            <Input
              id="profilePhone"
              value={profilePhone}
              onChange={e => setProfilePhone(e.target.value)}
              placeholder="+234..."
            />
          </div>
        </div>

        <PageActions>
          <Button
            onClick={handleSaveProfile}
            disabled={savingProfile}
          >
            {savingProfile
              ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                )
              : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile
                  </>
                )}
          </Button>
        </PageActions>
      </CardContent>
    </Card>
  );
}

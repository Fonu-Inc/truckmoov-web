export type Authentication = {
  "accessToken": string,
  "refreshToken": string
  "expiresIn": number;
  "user": User;
}

export type RegisterPayload = {
  data: {
    "email": string,
    "password": string,
    "firstName": string,
    "lastName": string,
    "organizationName": string,
  }
}

export type LoginPayload = {
  data: {
    "email": string,
    "password": string,
  }
};

export type GetNewAccessTokenPayload = {
  data: {
    "refreshToken": string
  }
}

export type InviteMemberPayload = {
  data: {
    "email": string,
    "role": UserRole
  }
}

export type RegisterInviteMemberPayload = {
  data: {
    "inviteToken": string,
    "username": string,
    "password": string
  }
}

export type ForgetPasswordPayload = {
  data: {
    "identifier": string,
  }
}

export type VerifyEmailPayload = {
  data: {
    "token": string,
  }
}

export type VerifyPasswordResetPayload = {
  data: {
    "token": string,
  }
}

export type ResetPasswordPayload = {
  data: {
    "token": string,
    "newPassword": string
  }
}

export type VerifyPasswordResetResponse = {
  token: string;
}

export type ChangeUserRolePayload = {
  data: {
    "targetUserId": string,
    "newRole": string;
  }
}

export type LogoutPayload = {
  data: {
    "refreshToken": string
    "accessToken"?: string
  }
}

export type UserProfile = {
  "fullName": string,
  "phoneNumber": string
  "profilePictureUrl": string,
}

export type UserRole = "ENTERPRISE_ADMIN" | "AGGREGATOR_ADMIN" | "OWNER_OPERATOR" | "PLATFORM_ADMIN" | "FLEET_ADMIN" | "OPERATIONS_MANAGER" | "DISPATCHER" | "FINANCE_VIEWER";

export type User = {
  "id": string,
  "email": string,
  "tenantId": string,
  "role": UserRole,
  "profile": UserProfile | null
}

export type UpdateUserProfilePayload = {
  data: Partial<UserProfile>
}

export type NotificationPreferences = {
  "emailAlerts": boolean,
  "smsAlerts": boolean,
  "pushAlerts": boolean,
  "incidentAlerts": boolean,
  "jobUpdates": boolean,
  "marketingAnnouncements": boolean
}

export type NotificationPreferencesResponse = {
  userId: string;
  notificationPreferences: NotificationPreferences;
}

export type UpdateNotificationPreferencesPayload = {
  data: Partial<NotificationPreferences>;
}

export type DispatcherPreferences = {
  "timezone": string,
  "shiftStart": string,
  "shiftEnd": string,
  "workDays": Array<number>
}

export type DispatchPreferencesResponse = {
  userId: string;
  dispatcherPreferences: DispatcherPreferences;
}

export type UpdateDispatcherPreferencesPayload = {
  data: Partial<DispatchPreferencesResponse>
}

export type Branding = {
  "organizationName": string,
  "logoUrl": string,
  "primaryColor": string,
  "secondaryColor": string
  "accentColor": string,
  "successColor": string,
  "warningColor": string,
  "destructiveColor": string,
  "sidebarBackground": string,
  "sidebarText": string,
  "sidebarAccent": string
}

export type OrganizationSettingsDefaults = {
  "timezone": string,
  "currency": string,
  "dateFormat": string,
  "weekStartsOn": string;
}

export type OrganizationSettings = {
  tenantId: string
  branding: Branding;
  defaults: OrganizationSettingsDefaults
}

export type UpdateOrganizationsSettingsPayload = {
  data: Partial<Omit<OrganizationSettings, "tenantId">>;
}

export type LogOutResponse = {
  messsage: string
}

export type UploadImageToBucketPayload = {
  files: any[];
}

export type UploadedImage = {
  "key": string,
  "url": string,
  "filename": string,
  "contentType": string,
  "size": number;
}
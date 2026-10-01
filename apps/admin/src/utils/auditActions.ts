/** Sentences for the audit actions people see most; everything else is worded from its key. */
const SENTENCES: Record<string, string> = {
  "user.logged_in": "Signed in",
  "user.logged_out": "Signed out",
  "user.session.refreshed": "Session renewed",
  "user.registered_from_invite": "Accepted an invite and created an account",
  "user.email.verified": "Verified their email",
  "user.password.reset": "Reset their password",
  "user.password_reset.requested": "Asked for a password reset",
  "user.profile.completed": "Completed their profile",
  "installer.logged_in": "Installer signed in",
  "installer.password.changed": "Installer changed their password",
  "installer.profile.updated": "Installer updated their profile",
  "installer.support_ticket.created": "Installer raised a support ticket",
  "superadmin.logged_in": "Super admin signed in",
  "admin.logged_in": "Platform admin signed in",
  "auth.two_factor.enabled": "Turned on two-factor sign-in",
  "auth.two_factor.disabled": "Turned off two-factor sign-in",
  "system.installer.created": "Added an installer",
  "system.installer.updated": "Updated an installer",
  "system.installer.suspended": "Suspended an installer",
  "system.installer.reactivated": "Reactivated an installer",
  "system.installer.invite_resent": "Resent an installer's invite",
  "system.admin.created": "Added a platform admin",
  "system.admin.deleted": "Removed a platform admin",
  "system.admin.invited": "Invited a platform admin",
  "system.admin.invite.cancelled": "Cancelled a platform admin invite",
  "system.admin.invite.resent": "Resent a platform admin invite",
  "system.tenant.updated": "Updated a tenant",
  "system.tenant.deleted": "Deleted a tenant",
  "system.tenants.exported": "Exported the tenant list",
  "tenant.terminated": "Terminated a tenant",
  "tenant.onboarding.created": "Started onboarding a tenant",
  "tenant.onboarding.invite.resent": "Resent a tenant onboarding invite",
  "system.kyc.document.approved": "Approved a KYC document",
  "system.kyc.document.rejected": "Rejected a KYC document",
  "system.feature_flag.updated": "Changed a feature flag",
  "system.settings.updated": "Changed platform settings",
  "system.ai.settings_updated": "Changed AI settings",
  "system.security.auto_block_rule_updated": "Changed an auto-block rule",
  "system.support_ticket.assigned": "Assigned a support ticket",
  "system.support_ticket.escalated": "Escalated a support ticket",
  "system.support_ticket.status_updated": "Changed a support ticket's status",
  "system.device_setup.approved": "Approved a device setup request",
  "system.device_setup.rejected": "Rejected a device setup request",
  "system.device_setup.assigned": "Assigned a device setup request",
  "system.device.suspended": "Suspended a device",
  "system.device.reinstated": "Reinstated a device",
  "system.devices.exported": "Exported the device list",
  "system.installation.unit_bound": "Bound a device to an installation unit",
  "system.sim_request.approved": "Approved a SIM request",
  "system.sim_request.rejected": "Rejected a SIM request",
  "system.sim.reassigned": "Reassigned a SIM",
  "system.sim.updated": "Updated a SIM",
  "system.sims.exported": "Exported the SIM list",
  "wallet.platform_top_up": "Topped up a wallet",
  "platform_integration.credentials_changed": "Changed integration credentials",
  "platform.communication_rates.updated": "Changed communication rates",
  "staff_role.changed": "Changed a staff member's role",
  "tenant_role.assigned": "Assigned a tenant role",
  "whatsapp.account.connected": "Connected a WhatsApp number",
  "whatsapp.account.disconnected": "Disconnected a WhatsApp number",
  "whatsapp.message.received": "Received a WhatsApp message",
  "whatsapp.message.sent": "Sent a WhatsApp message",
  "whatsapp.template.created": "Submitted a WhatsApp template",
  "job.created": "Created a job",
  "job.assigned": "Assigned a job",
  "job.cancelled": "Cancelled a job",
  "job.status.changed": "Changed a job's status",
  "vehicle.created": "Added a vehicle",
  "vehicle.updated": "Updated a vehicle",
  "vehicle.deleted": "Removed a vehicle",
  "driver.created": "Added a driver",
  "driver.updated": "Updated a driver",
  "driver.suspended": "Suspended a driver",
  "driver.reinstated": "Reinstated a driver",
  "organization.invite.sent": "Invited a team member",
  "organization.user.removed": "Removed a team member",
  "organization.user.role_changed": "Changed a team member's role",
};

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * The sentence for an audit action key. An action with no entry above is worded
 * from its key, so a new one never shows up as raw code.
 */
export function describeAction(action: string): string {
  const known = SENTENCES[action];
  if (known)
    return known;
  const words = action
    .replace(/^system\./, "")
    .split(".")
    .map(part => part.replace(/_/g, " "));
  return capitalise(words.join(" "));
}

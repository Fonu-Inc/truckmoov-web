import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TenantOnboardingRequest {
  companyName: string;
  email: string;
  phone?: string;
  address?: string;
  billingEmail?: string;
  primaryContactName?: string;
  organizationType?: "FLEET_PROVIDER" | "ENTERPRISE" | "AGGREGATOR" | "OWNER_OPERATOR";
  plan: "starter" | "professional" | "enterprise";
  billingModel?: "SUBSCRIPTION" | "TRIAL";
  vehicleQuota?: number;
  driverQuota?: number;
  deviceQuota?: number;
  simQuota?: number;
  // Trial-specific (only used when billingModel === "TRIAL")
  trialDays?: number;
  trialVehicleCap?: number;
  trialSimCap?: number;
  trialWhatsappDailyCap?: number;
  trialSmsDailyCap?: number;
  provisionDevices: boolean;
  deviceCount?: number;
  deviceManufacturer?: string;
  provisionSims: boolean;
  simCount?: number;
  simCarrier?: string;
  dataPackage?: string;
  features: {
    liveTracking: boolean;
    geofencing: boolean;
    routeOptimization: boolean;
    messaging: boolean;
    analytics: boolean;
    apiAccess: boolean;
  };
}

// All org types use the generic ADMIN role — permissions are scoped by org type
const ORG_TYPE_TO_ADMIN_ROLE: Record<string, string> = {
  ENTERPRISE: "ADMIN",
  FLEET_PROVIDER: "ADMIN",
  AGGREGATOR: "ADMIN",
  OWNER_OPERATOR: "ADMIN",
};

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

const sendEmail = async (
  resendApiKey: string,
  to: string,
  subject: string,
  html: string
): Promise<void> => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "FleetPro <noreply@truckmoov.com>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Resend API error: ${response.status} - ${errorData}`);
  }

  const result = await response.json();
  console.log("Email sent successfully:", result);
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    if (!resendApiKey) {
      throw new Error("Missing RESEND_API_KEY");
    }

    // Validate authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client for operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify user is platform admin
    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is platform admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", authData.user.id)
      .eq("role", "platform_admin")
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Only platform admins can onboard tenants" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data: TenantOnboardingRequest = await req.json();

    // Validate required fields
    if (!data.companyName || !data.email) {
      return new Response(
        JSON.stringify({ error: "Company name and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate unique slug
    let baseSlug = generateSlug(data.companyName);
    let slug = baseSlug;
    let counter = 0;

    // Check for slug uniqueness
    while (true) {
      const { data: existingTenant } = await supabaseAdmin
        .from("tenants")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!existingTenant) break;
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    const isTrial = data.billingModel === "TRIAL";
    const trialDays = Math.max(1, Math.min(365, data.trialDays ?? 30));
    const trialVehicleCap = Math.max(1, data.trialVehicleCap ?? 5);
    const trialSimCap = Math.max(1, data.trialSimCap ?? 5);
    const trialWhatsappDailyCap = Math.max(1, data.trialWhatsappDailyCap ?? 100);
    const trialSmsDailyCap = Math.max(1, data.trialSmsDailyCap ?? 50);
    const trialEndsAt = isTrial ? new Date(Date.now() + trialDays * 86400_000).toISOString() : null;

    // 1. Create tenant record
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .insert({
        name: data.companyName,
        slug,
        email: data.email,
        phone: data.phone || null,
        address: data.address || null,
        billing_email: data.billingEmail || data.email,
        primary_contact_name: data.primaryContactName || null,
        plan: data.plan,
        status: isTrial ? "trial" : "pending",
        
        features: data.features,
        device_count: data.provisionDevices ? data.deviceCount : 0,
        sim_count: data.provisionSims ? data.simCount : 0,
        vehicle_quota: typeof data.vehicleQuota === "number" && data.vehicleQuota > 0
          ? (isTrial ? Math.min(data.vehicleQuota, trialVehicleCap) : data.vehicleQuota)
          : (isTrial ? trialVehicleCap : 25),
        driver_quota: typeof data.driverQuota === "number" && data.driverQuota > 0 ? data.driverQuota : 30,
        device_quota: typeof data.deviceQuota === "number" && data.deviceQuota > 0 ? data.deviceQuota : 25,
        sim_quota: typeof data.simQuota === "number" && data.simQuota > 0
          ? (isTrial ? Math.min(data.simQuota, trialSimCap) : data.simQuota)
          : (isTrial ? trialSimCap : 25),
        ...(isTrial
          ? {
              trial_started_at: new Date().toISOString(),
              trial_ends_at: trialEndsAt,
              trial_vehicle_cap: trialVehicleCap,
              trial_sim_cap: trialSimCap,
              trial_whatsapp_daily_cap: trialWhatsappDailyCap,
              trial_sms_daily_cap: trialSmsDailyCap,
            }
          : {}),
      })
      .select()
      .single();

    if (tenantError) {
      console.error("Error creating tenant:", tenantError);
      throw new Error(`Failed to create tenant: ${tenantError.message}`);
    }

    console.log("Created tenant:", tenant.id);

    // 1b. Create organization with the chosen type
    const orgType = data.organizationType || "FLEET_PROVIDER";
    const { data: org, error: orgError } = await supabaseAdmin
      .from("organizations")
      .insert({
        name: data.companyName,
        organization_type: orgType,
        tenant_id: tenant.id,
        status: "ACTIVE",
      })
      .select()
      .single();

    if (orgError) {
      console.error("Error creating organization:", orgError);
      // Not fatal — org can be created later
    } else {
      console.log("Created organization:", org.id, "type:", orgType);
    }

    // 1c. Ensure a business info row exists so KYC can be tracked (defaults to pending)
    const { error: businessInfoError } = await supabaseAdmin
      .from("tenant_business_info")
      .insert({
        tenant_id: tenant.id,
        company_name: data.companyName,
        verification_status: "pending",
      });

    if (businessInfoError) {
      console.error("Error creating tenant_business_info:", businessInfoError);
    }

    // 2. Create user invitation for tenant admin
    const adminRole = orgType === "ENTERPRISE" ? "tenant_admin" : "tenant_admin";
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from("user_invitations")
      .insert({
        email: data.email,
        role: adminRole,
        tenant_id: tenant.id,
        invited_by: authData.user.id,
        metadata: org ? { org_id: org.id, org_type: orgType, org_role: ORG_TYPE_TO_ADMIN_ROLE[orgType] } : undefined,
      })
      .select()
      .single();

    if (invitationError) {
      console.error("Error creating invitation:", invitationError);
      await supabaseAdmin.from("tenants").delete().eq("id", tenant.id);
      throw new Error(`Failed to create invitation: ${invitationError.message}`);
    }

    console.log("Created invitation:", invitation.id);

    // 3. Send welcome email with login link
    const appUrl = Deno.env.get("APP_URL") || "https://id-preview--bcfb2085-e574-4c60-954f-92b37a72fe54.lovable.app";
    const signupUrl = `${appUrl}/auth?invitation=${invitation.token}&email=${encodeURIComponent(data.email)}`;

    const planNames: Record<string, string> = {
      starter: "Starter",
      professional: "Professional",
      enterprise: "Enterprise",
    };

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to FleetPro</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 30px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; }
            .details h3 { margin-top: 0; color: #374151; }
            .details-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
            .details-row:last-child { border-bottom: none; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚚 Welcome to FleetPro</h1>
            </div>
            <div class="content">
              <p>Dear <strong>${data.companyName}</strong> Team,</p>
              
              <p>Your fleet management account has been created successfully! You're now part of the FleetPro platform.</p>
              
              <div class="details">
                <h3>📋 Account Details</h3>
                <div class="details-row">
                  <span>Company:</span>
                  <strong>${data.companyName}</strong>
                </div>
                <div class="details-row">
                  <span>Tenant URL:</span>
                  <strong>${slug}</strong>
                </div>
                <div class="details-row">
                  <span>Plan:</span>
                  <strong>${planNames[data.plan]}</strong>
                </div>
                <div class="details-row">
                  <span>Admin Email:</span>
                  <strong>${data.email}</strong>
                </div>
              </div>

              <p style="text-align: center;">
                <a href="${signupUrl}" class="button">Complete Your Registration →</a>
              </p>

              <p>Click the button above to set up your password and access your dashboard. This link will expire in 7 days.</p>

              ${data.provisionDevices ? `
              <p>📡 <strong>Devices:</strong> ${data.deviceCount} ${data.deviceManufacturer} tracking devices will be provisioned for your fleet.</p>
              ` : ""}

              ${data.provisionSims ? `
              <p>📱 <strong>SIM Cards:</strong> ${data.simCount} ${data.simCarrier?.toUpperCase()} SIM cards with ${data.dataPackage} data package will be assigned.</p>
              ` : ""}

              <p>If you have any questions, please contact our support team.</p>

              <p>Best regards,<br><strong>The FleetPro Team</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} FleetPro. All rights reserved.</p>
              <p>This invitation was sent to ${data.email}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    let emailSent = false;
    let emailErrorMessage: string | null = null;

    try {
      await sendEmail(
        resendApiKey,
        data.email,
        `Welcome to FleetPro - ${data.companyName} Account Created`,
        emailHtml
      );
      emailSent = true;
    } catch (emailError: unknown) {
      console.error("Error sending email:", emailError);
      emailErrorMessage = emailError instanceof Error ? emailError.message : "Unknown email error";
      // We still return the signup URL so the platform admin can share it manually.
    }

    return new Response(
      JSON.stringify({
        success: true,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          email: tenant.email,
        },
        invitation: {
          id: invitation.id,
          token: invitation.token,
          signupUrl,
        },
        emailSent,
        emailError: emailErrorMessage,
        message: emailSent
          ? `Tenant "${data.companyName}" created successfully. Invitation email sent to ${data.email}`
          : `Tenant "${data.companyName}" created successfully, but we couldn't send the invite email. Use the signup link to proceed or resend the invitation.`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error in tenant-onboarding:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface UserInvitationRequest {
  email: string;
  role: "supervisor" | "dispatcher" | "viewer_finance" | "operations_manager";
  inviterName?: string;
  organizationName?: string;
}

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

const roleDisplayNames: Record<string, string> = {
  supervisor: "Supervisor",
  dispatcher: "Dispatcher",
  viewer_finance: "Finance Viewer",
  operations_manager: "Operations Manager",
  tenant_admin: "Partner Admin",
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

    // Verify user token
    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is tenant_admin or operations_manager
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", authData.user.id)
      .in("role", ["tenant_admin", "operations_manager", "platform_admin"])
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "You don't have permission to invite users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get inviter's profile and tenant info
    const { data: inviterProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, tenant_id")
      .eq("user_id", authData.user.id)
      .single();

    if (!inviterProfile?.tenant_id) {
      return new Response(
        JSON.stringify({ error: "Inviter must belong to a tenant" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get tenant info
    const { data: tenant } = await supabaseAdmin
      .from("tenants")
      .select("id, name, slug")
      .eq("id", inviterProfile.tenant_id)
      .single();

    if (!tenant) {
      return new Response(
        JSON.stringify({ error: "Tenant not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data: UserInvitationRequest = await req.json();

    // Validate required fields
    if (!data.email || !data.role) {
      return new Response(
        JSON.stringify({ error: "Email and role are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already exists with this email in the tenant
    const { data: existingInvitation } = await supabaseAdmin
      .from("user_invitations")
      .select("id, accepted_at")
      .eq("email", data.email)
      .eq("tenant_id", tenant.id)
      .is("accepted_at", null)
      .single();

    if (existingInvitation) {
      return new Response(
        JSON.stringify({ error: "An invitation for this email already exists" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user invitation
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from("user_invitations")
      .insert({
        email: data.email,
        role: data.role,
        tenant_id: tenant.id,
        invited_by: authData.user.id,
      })
      .select()
      .single();

    if (invitationError) {
      console.error("Error creating invitation:", invitationError);
      throw new Error(`Failed to create invitation: ${invitationError.message}`);
    }

    console.log("Created invitation:", invitation.id);

    // Send invitation email
    const appUrl = Deno.env.get("APP_URL") || "https://id-preview--bcfb2085-e574-4c60-954f-92b37a72fe54.lovable.app";
    const signupUrl = `${appUrl}/auth?invitation=${invitation.token}&email=${encodeURIComponent(data.email)}`;

    const inviterName = data.inviterName || inviterProfile.full_name || "A team member";
    const organizationName = data.organizationName || tenant.name;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>You're Invited to Join ${organizationName}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 30px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; }
            .details h3 { margin-top: 0; color: #374151; }
            .details-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
            .details-row:last-child { border-bottom: none; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            .role-badge { display: inline-block; background: #e0e7ff; color: #4338ca; padding: 4px 12px; border-radius: 16px; font-size: 14px; font-weight: 500; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚚 You're Invited!</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              
              <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on FleetPro - a fleet management platform.</p>
              
              <div class="details">
                <h3>📋 Invitation Details</h3>
                <div class="details-row">
                  <span>Organization:</span>
                  <strong>${organizationName}</strong>
                </div>
                <div class="details-row">
                  <span>Your Role:</span>
                  <span class="role-badge">${roleDisplayNames[data.role] || data.role}</span>
                </div>
                <div class="details-row">
                  <span>Invited By:</span>
                  <strong>${inviterName}</strong>
                </div>
              </div>

              <p style="text-align: center;">
                <a href="${signupUrl}" class="button">Accept Invitation →</a>
              </p>

              <p>Click the button above to create your account and join the team. This link will expire in <strong>7 days</strong>.</p>

              <p style="font-size: 14px; color: #6b7280;">If you weren't expecting this invitation, you can safely ignore this email.</p>

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
        `You're invited to join ${organizationName} on FleetPro`,
        emailHtml
      );
      emailSent = true;
    } catch (emailError: unknown) {
      console.error("Error sending email:", emailError);
      emailErrorMessage = emailError instanceof Error ? emailError.message : "Unknown email error";
      // We still return success so the invitation token can be shared manually.
    }

    return new Response(
      JSON.stringify({
        success: true,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expires_at,
        },
        emailSent,
        emailError: emailErrorMessage,
        message: emailSent
          ? `Invitation email sent to ${data.email}`
          : `Invitation created, but we couldn't send the email. Please copy/share the signup link from the UI or try resending.`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error in user-invitation:", error);
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

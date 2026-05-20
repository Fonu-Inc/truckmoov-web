import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ResendInvitationRequest {
  tenantId: string;
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

const handler = async (req: Request): Promise<Response> => {
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

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", authData.user.id)
      .eq("role", "platform_admin")
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Only platform admins can resend tenant invitations" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data: ResendInvitationRequest = await req.json();

    if (!data.tenantId) {
      return new Response(
        JSON.stringify({ error: "tenantId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get tenant info
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .select("*")
      .eq("id", data.tenantId)
      .single();

    if (tenantError || !tenant) {
      return new Response(
        JSON.stringify({ error: "Tenant not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get existing invitation or create a new one
    let invitation;
    const { data: existingInvitation } = await supabaseAdmin
      .from("user_invitations")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("role", "tenant_admin")
      .is("accepted_at", null)
      .single();

    if (existingInvitation) {
      // Update expiry date
      const { data: updatedInvitation, error: updateError } = await supabaseAdmin
        .from("user_invitations")
        .update({ expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })
        .eq("id", existingInvitation.id)
        .select()
        .single();
      
      if (updateError) {
        throw new Error(`Failed to update invitation: ${updateError.message}`);
      }
      invitation = updatedInvitation;
      console.log("Updated existing invitation:", invitation.id);
    } else {
      // Create new invitation
      const { data: newInvitation, error: invitationError } = await supabaseAdmin
        .from("user_invitations")
        .insert({
          email: tenant.email,
          role: "tenant_admin",
          tenant_id: tenant.id,
          invited_by: authData.user.id,
        })
        .select()
        .single();

      if (invitationError) {
        throw new Error(`Failed to create invitation: ${invitationError.message}`);
      }
      invitation = newInvitation;
      console.log("Created new invitation:", invitation.id);
    }

    // Send welcome email
    const appUrl = Deno.env.get("APP_URL") || "https://id-preview--bcfb2085-e574-4c60-954f-92b37a72fe54.lovable.app";
    const signupUrl = `${appUrl}/auth?invitation=${invitation.token}&email=${encodeURIComponent(tenant.email)}`;

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
              <p>Dear <strong>${tenant.name}</strong> Team,</p>
              
              <p>Your fleet management account has been created successfully! You're now part of the FleetPro platform.</p>
              
              <div class="details">
                <h3>📋 Account Details</h3>
                <div class="details-row">
                  <span>Company:</span>
                  <strong>${tenant.name}</strong>
                </div>
                <div class="details-row">
                  <span>Tenant URL:</span>
                  <strong>${tenant.slug}</strong>
                </div>
                <div class="details-row">
                  <span>Plan:</span>
                  <strong>${planNames[tenant.plan] || tenant.plan}</strong>
                </div>
                <div class="details-row">
                  <span>Admin Email:</span>
                  <strong>${tenant.email}</strong>
                </div>
              </div>

              <p style="text-align: center;">
                <a href="${signupUrl}" class="button">Complete Your Registration →</a>
              </p>

              <p>Click the button above to set up your password and access your dashboard. This link will expire in 7 days.</p>

              <p>If you have any questions, please contact our support team.</p>

              <p>Best regards,<br><strong>The FleetPro Team</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} FleetPro. All rights reserved.</p>
              <p>This invitation was sent to ${tenant.email}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail(
      resendApiKey,
      tenant.email,
      `Welcome to FleetPro - ${tenant.name} Account Created`,
      emailHtml
    );

    return new Response(
      JSON.stringify({
        success: true,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          email: tenant.email,
        },
        invitation: {
          id: invitation.id,
          expiresAt: invitation.expires_at,
        },
        message: `Welcome email resent to ${tenant.email}`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error in resend-tenant-invitation:", error);
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

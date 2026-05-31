import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotifyRequest {
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
};

const buildHtml = (companyName: string, threshold: 80 | 100, activeCount: number, quota: number) => {
  const isFull = threshold === 100;
  const headline = isFull
    ? "🚫 Vehicle quota reached"
    : "⚠️ You're at 80% of your vehicle quota";
  const intro = isFull
    ? "You have reached the maximum number of active vehicles allowed on your plan. Adding new vehicles is now blocked until your quota is increased or active vehicles are reduced."
    : "Your fleet is approaching the maximum number of active vehicles allowed on your plan. Plan ahead so dispatch isn't disrupted.";
  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;">
        <div style="max-width:600px;margin:0 auto;padding:24px;">
          <div style="text-align:center;padding:24px 0;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:12px 12px 0 0;">
            <h1 style="color:#fff;margin:0;font-size:22px;">${headline}</h1>
          </div>
          <div style="background:#f9fafb;padding:28px;border-radius:0 0 12px 12px;">
            <p>Hi <strong>${companyName}</strong> team,</p>
            <p>${intro}</p>
            <div style="background:#fff;padding:18px;border-radius:8px;border:1px solid #e5e7eb;margin:18px 0;">
              <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f3f4f6;">
                <span>Active vehicles:</span><strong>${activeCount}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;padding:6px 0;">
                <span>Quota:</span><strong>${quota}</strong>
              </div>
            </div>
            <p>Need a higher limit? Reply to this email and our team will adjust your quota.</p>
            <p style="margin-top:24px;">— The FleetPro Team</p>
          </div>
        </div>
      </body>
    </html>
  `;
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

    const body: NotifyRequest = await req.json();
    if (!body.tenantId || typeof body.tenantId !== "string") {
      return new Response(
        JSON.stringify({ error: "tenantId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Load tenant
    const { data: tenant, error: tenantErr } = await supabaseAdmin
      .from("tenants")
      .select("id, name, email, billing_email, vehicle_quota, vehicle_quota_notifications")
      .eq("id", body.tenantId)
      .single();

    if (tenantErr || !tenant) {
      return new Response(
        JSON.stringify({ error: "Tenant not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const quota = tenant.vehicle_quota ?? 25;
    if (quota <= 0) {
      return new Response(JSON.stringify({ skipped: "no quota" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Count ACTIVE vehicles (suspended/inactive/decommissioned/maintenance don't count)
    const { count, error: countErr } = await supabaseAdmin
      .from("vehicles")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .eq("status", "active");

    if (countErr) {
      throw new Error(`Failed to count vehicles: ${countErr.message}`);
    }

    const activeCount = count ?? 0;
    const pct = (activeCount / quota) * 100;

    const notifications = (tenant.vehicle_quota_notifications as Record<string, unknown> | null) ?? {};
    // Threshold key = "<quota>:<threshold>" so changing the quota resets the gate.
    const key80 = `${quota}:80`;
    const key100 = `${quota}:100`;

    const updates: Record<string, unknown> = { ...notifications };
    const sentNow: number[] = [];
    const recipient = tenant.billing_email || tenant.email;

    if (pct >= 100 && !notifications[key100]) {
      await sendEmail(
        resendApiKey,
        recipient,
        `[FleetPro] Vehicle quota reached for ${tenant.name}`,
        buildHtml(tenant.name, 100, activeCount, quota)
      );
      updates[key100] = new Date().toISOString();
      sentNow.push(100);
    } else if (pct >= 80 && !notifications[key80]) {
      await sendEmail(
        resendApiKey,
        recipient,
        `[FleetPro] You're at 80% of your vehicle quota`,
        buildHtml(tenant.name, 80, activeCount, quota)
      );
      updates[key80] = new Date().toISOString();
      sentNow.push(80);
    }

    if (sentNow.length > 0) {
      await supabaseAdmin
        .from("tenants")
        .update({ vehicle_quota_notifications: updates })
        .eq("id", tenant.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        activeCount,
        quota,
        percentage: Math.round(pct),
        notificationsSent: sentNow,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in tenant-quota-notify:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);

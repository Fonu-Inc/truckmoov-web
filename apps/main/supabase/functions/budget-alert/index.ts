import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BudgetAlertRequest {
  tenantId: string;
  tenantName: string;
  currentSpend: number;
  monthlyBudget: number;
  alertThreshold: number;
  recipientEmails: string[];
  recipientPhones?: string[];
  alertType: "threshold" | "exceeded";
}

interface LowBalanceAlertRequest {
  alertType: "low_balance";
  tenant_id: string;
  tenant_name?: string;
  tenant_email?: string;
  tenant_phone?: string;
  balance: number;
  threshold: number;
}

type AlertRequest = BudgetAlertRequest | LowBalanceAlertRequest;

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
};

async function handleLowBalanceAlert(request: LowBalanceAlertRequest): Promise<Response> {
  const { tenant_id, tenant_name, tenant_email, tenant_phone, balance, threshold } = request;

  console.log(`Processing low balance alert for tenant: ${tenant_id}`);
  console.log(`Balance: ₦${balance}, Threshold: ₦${threshold}`);

  // Only send alert if balance is at or below threshold
  if (balance > threshold) {
    console.log('Balance is above threshold, no alert needed');
    return new Response(JSON.stringify({ success: true, message: 'No alert needed' }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const alertsSent: string[] = [];
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  // Send email alert if Resend is configured and email provided
  if (resendApiKey && tenant_email) {
    try {
      const resend = new Resend(resendApiKey);
      
      const emailResult = await resend.emails.send({
        from: "FleetPro <alerts@resend.dev>",
        to: [tenant_email],
        subject: "⚠️ Low Wallet Balance Alert",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
                .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
                .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px; }
                .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
                .stat { background: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .stat-value { font-size: 24px; font-weight: bold; color: #1e293b; }
                .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; }
                .cta { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; font-weight: 600; }
                .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0; font-size: 24px;">⚠️ Low Wallet Balance</h1>
                  <p style="margin: 10px 0 0 0; opacity: 0.9;">Action Required</p>
                </div>
                <div class="content">
                  <p>Dear ${tenant_name || 'Valued Customer'},</p>
                  
                  <div class="alert-box">
                    <p style="margin: 0; font-weight: 600;">Your FleetPro wallet balance has dropped below your set threshold.</p>
                  </div>
                  
                  <div class="stats">
                    <div class="stat">
                      <div class="stat-value" style="color: #f59e0b;">${formatCurrency(balance)}</div>
                      <div class="stat-label">Current Balance</div>
                    </div>
                    <div class="stat">
                      <div class="stat-value">${formatCurrency(threshold)}</div>
                      <div class="stat-label">Alert Threshold</div>
                    </div>
                  </div>
                  
                  <p style="color: #64748b;">To continue using our communication services (Calls, SMS, WhatsApp) without interruption, please top up your wallet.</p>
                  
                  <div style="text-align: center;">
                    <a href="#" class="cta">Top Up Now</a>
                  </div>
                </div>
                <div class="footer">
                  <p>This is an automated alert from FleetPro Fleet Management System.</p>
                  <p>You received this email because your wallet balance dropped below your configured threshold.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      console.log("Email alert sent:", emailResult);
      alertsSent.push('email');
    } catch (emailError) {
      console.error("Failed to send email alert:", emailError);
    }
  }

  // Send SMS alert if Fonu is configured and phone provided
  const fonuApiKey = Deno.env.get("FONU_API_KEY");
  const fonuApiSecret = Deno.env.get("FONU_API_SECRET");
  if (fonuApiKey && fonuApiSecret && tenant_phone) {
    try {
      const smsMessage = `FleetPro: Low wallet balance (${formatCurrency(balance)}). Top up now to avoid service interruption. Threshold: ${formatCurrency(threshold)}`;
      
      const smsResponse = await fetch("https://api.fonu.com/v1/sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${btoa(`${fonuApiKey}:${fonuApiSecret}`)}`,
        },
        body: JSON.stringify({
          to: tenant_phone,
          message: smsMessage,
          from: "FleetPro",
        }),
      });

      const smsResult = await smsResponse.text();
      console.log("SMS alert response:", smsResult);
      if (smsResponse.ok) {
        alertsSent.push('sms');
      }
    } catch (smsError) {
      console.error("Failed to send SMS alert:", smsError);
    }
  }

  // Log the alert in security audit logs
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  await supabase.rpc('log_security_event', {
    p_event_type: 'low_balance_alert',
    p_severity: 'warning',
    p_description: `Low balance alert sent to tenant. Balance: ${formatCurrency(balance)}, Threshold: ${formatCurrency(threshold)}`,
    p_tenant_id: tenant_id,
    p_tenant_name: tenant_name,
    p_metadata: { balance, threshold, alerts_sent: alertsSent }
  });

  return new Response(
    JSON.stringify({ 
      success: true, 
      alerts_sent: alertsSent,
      message: alertsSent.length > 0 ? `Alerts sent via: ${alertsSent.join(', ')}` : 'No alerts configured'
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    }
  );
}

async function handleBudgetAlert(request: BudgetAlertRequest): Promise<Response> {
  const {
    tenantId,
    tenantName,
    currentSpend,
    monthlyBudget,
    alertThreshold,
    recipientEmails,
    alertType,
  } = request;

  console.log(`Processing budget alert for tenant: ${tenantName}`);
  console.log(`Current spend: ${currentSpend}, Budget: ${monthlyBudget}, Threshold: ${alertThreshold}%`);

  const spendPercentage = Math.round((currentSpend / monthlyBudget) * 100);
  const remainingBudget = monthlyBudget - currentSpend;

  const emailSubject = alertType === "exceeded"
    ? `⚠️ Telephony Budget Exceeded - ${tenantName}`
    : `📊 Telephony Budget Alert: ${spendPercentage}% Used - ${tenantName}`;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
          .alert-box { background: ${alertType === "exceeded" ? "#fef2f2" : "#fff7ed"}; border: 1px solid ${alertType === "exceeded" ? "#fecaca" : "#fed7aa"}; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
          .stat { background: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .stat-value { font-size: 24px; font-weight: bold; color: #1e293b; }
          .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; }
          .progress { background: #e2e8f0; height: 12px; border-radius: 6px; overflow: hidden; margin: 10px 0; }
          .progress-bar { height: 100%; background: ${spendPercentage >= 100 ? "#ef4444" : spendPercentage >= alertThreshold ? "#f97316" : "#22c55e"}; transition: width 0.3s; }
          .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
          .cta { display: inline-block; background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">
              ${alertType === "exceeded" ? "⚠️ Budget Exceeded" : "📊 Budget Alert"}
            </h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Telephony Usage Report</p>
          </div>
          <div class="content">
            <div class="alert-box">
              <h3 style="margin: 0 0 10px 0; color: ${alertType === "exceeded" ? "#dc2626" : "#ea580c"};">
                ${alertType === "exceeded" 
                  ? "Your telephony spending has exceeded the monthly budget!" 
                  : `Your telephony spending has reached ${spendPercentage}% of your monthly budget.`}
              </h3>
              <p style="margin: 0; color: #64748b;">
                ${alertType === "exceeded"
                  ? "Please review your usage and consider adjusting your budget or reducing call volume."
                  : "This is a notification based on your configured alert threshold."}
              </p>
            </div>

            <div class="stats">
              <div class="stat">
                <div class="stat-value">${formatCurrency(currentSpend)}</div>
                <div class="stat-label">Current Spend</div>
              </div>
              <div class="stat">
                <div class="stat-value">${formatCurrency(monthlyBudget)}</div>
                <div class="stat-label">Monthly Budget</div>
              </div>
              <div class="stat">
                <div class="stat-value">${spendPercentage}%</div>
                <div class="stat-label">Budget Used</div>
              </div>
              <div class="stat">
                <div class="stat-value">${formatCurrency(Math.max(0, remainingBudget))}</div>
                <div class="stat-label">Remaining</div>
              </div>
            </div>

            <div style="margin: 20px 0;">
              <p style="margin: 0 0 5px 0; font-weight: 600;">Budget Usage</p>
              <div class="progress">
                <div class="progress-bar" style="width: ${Math.min(spendPercentage, 100)}%;"></div>
              </div>
            </div>

            <div style="text-align: center;">
              <a href="#" class="cta">View Detailed Report</a>
            </div>
          </div>
          <div class="footer">
            <p>This alert was sent by FleetPro Fleet Management</p>
            <p>Tenant: ${tenantName}</p>
          </div>
        </div>
      </body>
    </html>
  `;

  // Send email notifications
  const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
  const emailResults = [];
  for (const email of recipientEmails) {
    try {
      console.log(`Sending email to: ${email}`);
      const result = await resend.emails.send({
        from: "FleetPro Alerts <alerts@resend.dev>",
        to: [email],
        subject: emailSubject,
        html: emailHtml,
      });
      emailResults.push({ email, success: true, id: result.data?.id });
      console.log(`Email sent successfully to ${email}`);
    } catch (emailError: unknown) {
      const errorMessage = emailError instanceof Error ? emailError.message : "Unknown error";
      console.error(`Failed to send email to ${email}:`, errorMessage);
      emailResults.push({ email, success: false, error: errorMessage });
    }
  }

  // Log the alert
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  await supabase.rpc("log_security_event", {
    p_event_type: "budget_alert",
    p_severity: alertType === "exceeded" ? "high" : "medium",
    p_description: `Telephony budget ${alertType === "exceeded" ? "exceeded" : "threshold reached"}: ${spendPercentage}% of ${formatCurrency(monthlyBudget)}`,
    p_tenant_id: tenantId,
    p_tenant_name: tenantName,
    p_metadata: {
      currentSpend,
      monthlyBudget,
      alertThreshold,
      spendPercentage,
      emailsSent: emailResults.filter(r => r.success).length,
    },
  });

  return new Response(
    JSON.stringify({
      success: true,
      message: `Budget alert sent to ${emailResults.filter(r => r.success).length} recipients`,
      emailResults,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    }
  );
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Budget alert function invoked");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: AlertRequest = await req.json();

    // Route to appropriate handler based on alert type
    if ('alertType' in request && request.alertType === 'low_balance') {
      return await handleLowBalanceAlert(request as LowBalanceAlertRequest);
    } else {
      return await handleBudgetAlert(request as BudgetAlertRequest);
    }
  } catch (error: any) {
    console.error("Error in budget-alert function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

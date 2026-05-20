import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderRequest {
  tenant_id: string;
  reminder_type: 'compliance' | 'maintenance' | 'all';
  recipient_email: string;
  days_before?: number[];
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const handler = async (req: Request): Promise<Response> => {
  console.log("Fleet reminders function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { tenant_id, reminder_type, recipient_email, days_before = [30, 14, 7, 1] }: ReminderRequest = await req.json();

    if (!tenant_id || !recipient_email) {
      return new Response(
        JSON.stringify({ error: "tenant_id and recipient_email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${reminder_type} reminders for tenant: ${tenant_id}`);

    const reminders: { type: string; items: any[] }[] = [];
    const now = new Date();

    // Check compliance documents
    if (reminder_type === 'compliance' || reminder_type === 'all') {
      const { data: documents, error: docError } = await supabase
        .from('compliance_documents')
        .select('*')
        .eq('tenant_id', tenant_id)
        .gte('expiry_date', now.toISOString());

      if (docError) {
        console.error("Error fetching compliance documents:", docError);
      } else if (documents) {
        const expiringDocs = documents.filter(doc => {
          const expiryDate = new Date(doc.expiry_date);
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return days_before.includes(daysUntilExpiry);
        });

        if (expiringDocs.length > 0) {
          reminders.push({ type: 'Compliance Documents', items: expiringDocs });
        }
      }
    }

    // Check maintenance records
    if (reminder_type === 'maintenance' || reminder_type === 'all') {
      const { data: maintenance, error: maintError } = await supabase
        .from('maintenance_records')
        .select('*')
        .eq('tenant_id', tenant_id)
        .in('status', ['scheduled', 'overdue'])
        .gte('scheduled_date', now.toISOString());

      if (maintError) {
        console.error("Error fetching maintenance records:", maintError);
      } else if (maintenance) {
        const upcomingMaintenance = maintenance.filter(record => {
          const scheduledDate = new Date(record.scheduled_date);
          const daysUntil = Math.ceil((scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return days_before.includes(daysUntil);
        });

        if (upcomingMaintenance.length > 0) {
          reminders.push({ type: 'Scheduled Maintenance', items: upcomingMaintenance });
        }
      }

      // Get overdue maintenance
      const { data: overdue, error: overdueError } = await supabase
        .from('maintenance_records')
        .select('*')
        .eq('tenant_id', tenant_id)
        .eq('status', 'overdue');

      if (!overdueError && overdue && overdue.length > 0) {
        reminders.push({ type: 'Overdue Maintenance', items: overdue });
      }
    }

    if (reminders.length === 0) {
      console.log("No reminders to send");
      return new Response(
        JSON.stringify({ success: true, message: "No reminders needed", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build email content
    let emailHtml = `
      <h1 style="color: #1a1a1a; margin-bottom: 20px;">Fleet Management Reminders</h1>
      <p style="color: #666; margin-bottom: 30px;">The following items require your attention:</p>
    `;

    for (const reminder of reminders) {
      emailHtml += `
        <h2 style="color: #2563eb; margin-top: 30px; margin-bottom: 15px;">${reminder.type}</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Item</th>
              <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Details</th>
              <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Date</th>
            </tr>
          </thead>
          <tbody>
      `;

      for (const item of reminder.items) {
        const itemName = item.document_name || item.vehicle_name || 'Unknown';
        const details = item.document_type || item.maintenance_type || item.category || '';
        const date = item.expiry_date || item.scheduled_date;
        const formattedDate = new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        emailHtml += `
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${itemName}</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${details}</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${formattedDate}</td>
          </tr>
        `;
      }

      emailHtml += `
          </tbody>
        </table>
      `;
    }

    emailHtml += `
      <p style="color: #666; margin-top: 30px;">
        Please take action on these items to ensure fleet compliance and safety.
      </p>
      <p style="color: #999; font-size: 12px; margin-top: 40px;">
        This is an automated reminder from your Fleet Management System.
      </p>
    `;

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Fleet Management <onboarding@resend.dev>",
      to: [recipient_email],
      subject: `Fleet Reminders: ${reminders.reduce((sum, r) => sum + r.items.length, 0)} items require attention`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    // Mark documents as reminded
    if (reminder_type === 'compliance' || reminder_type === 'all') {
      const complianceReminder = reminders.find(r => r.type === 'Compliance Documents');
      if (complianceReminder) {
        const ids = complianceReminder.items.map(item => item.id);
        await supabase
          .from('compliance_documents')
          .update({ reminder_sent: true })
          .in('id', ids);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Reminders sent successfully",
        sent: reminders.reduce((sum, r) => sum + r.items.length, 0),
        email_response: emailResponse
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in fleet-reminders function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsErr } = await supabaseAdmin.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = claimsData.claims.sub as string;

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('tenant_id')
      .eq('user_id', userId)
      .single();

    const tenantId = profile?.tenant_id;
    if (!tenantId) {
      return new Response(JSON.stringify({ error: 'Tenant not found' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const activeOrgId = req.headers.get('X-Active-Org-Id') || null;

    const { invoiceId, recipientEmail, recipientName, subject, message } = await req.json();

    if (!invoiceId || !recipientEmail) {
      return new Response(JSON.stringify({ error: 'invoiceId and recipientEmail are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch invoice — scoped to tenant
    let invoiceQuery = supabaseAdmin
      .from('waybill_invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('tenant_id', tenantId);

    if (activeOrgId) {
      invoiceQuery = invoiceQuery.eq('org_id', activeOrgId);
    }

    const { data: invoice, error: invErr } = await invoiceQuery.single();

    if (invErr || !invoice) {
      return new Response(JSON.stringify({ error: 'Invoice not found or access denied' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch tenant invoice config for branding
    const { data: config } = await supabaseAdmin
      .from('tenant_invoice_config')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    // Get PDF from storage if available
    let pdfAttachment: { filename: string; content: number[] } | null = null;

    if (invoice.pdf_storage_path) {
      const { data: pdfData, error: pdfErr } = await supabaseAdmin.storage
        .from('invoice-pdfs')
        .download(invoice.pdf_storage_path);

      if (!pdfErr && pdfData) {
        const arrayBuffer = await pdfData.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);
        pdfAttachment = {
          filename: `${invoice.invoice_number}.pdf`,
          content: Array.from(uint8),
        };
      }
    }

    // Build email body
    const companyName = config?.company_name || 'Our Company';
    const formatNGN = (n: number) => `₦${Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

    const emailSubject = subject || `Invoice ${invoice.invoice_number} from ${companyName}`;
    const customMessage = message || '';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: #f8f9fa; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px; color: #111;">${companyName}</h1>
          ${config?.company_address ? `<p style="margin: 4px 0 0; font-size: 13px; color: #666;">${config.company_address}</p>` : ''}
        </div>
        <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="margin: 0 0 16px;">Dear ${recipientName || invoice.customer_name || 'Customer'},</p>
          ${customMessage ? `<p style="margin: 0 0 16px;">${customMessage}</p>` : `<p style="margin: 0 0 16px;">Please find attached your invoice <strong>${invoice.invoice_number}</strong>.</p>`}
          
          <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 4px 0; color: #666;">Invoice Number</td><td style="padding: 4px 0; text-align: right; font-weight: bold;">${invoice.invoice_number}</td></tr>
              <tr><td style="padding: 4px 0; color: #666;">Date</td><td style="padding: 4px 0; text-align: right;">${invoice.invoice_date}</td></tr>
              <tr><td style="padding: 4px 0; color: #666;">Due Date</td><td style="padding: 4px 0; text-align: right;">${invoice.due_date || 'On receipt'}</td></tr>
              ${invoice.origin && invoice.destination ? `<tr><td style="padding: 4px 0; color: #666;">Route</td><td style="padding: 4px 0; text-align: right;">${invoice.origin} → ${invoice.destination}</td></tr>` : ''}
              ${invoice.vehicle_number ? `<tr><td style="padding: 4px 0; color: #666;">Vehicle</td><td style="padding: 4px 0; text-align: right;">${invoice.vehicle_number}</td></tr>` : ''}
              <tr style="border-top: 2px solid #333;"><td style="padding: 8px 0; font-weight: bold; font-size: 16px;">Total</td><td style="padding: 8px 0; text-align: right; font-weight: bold; font-size: 16px;">${formatNGN(invoice.total_ngn)}</td></tr>
            </table>
          </div>

          ${config?.bank_name ? `
          <div style="background: #fffef0; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0 0 8px; font-weight: bold; font-size: 13px; color: #666; text-transform: uppercase;">Payment Details</p>
            <p style="margin: 2px 0;">Bank: ${config.bank_name}</p>
            <p style="margin: 2px 0;">Account Name: ${config.bank_account_name}</p>
            <p style="margin: 2px 0;">Account Number: ${config.bank_account_number}</p>
          </div>` : ''}

          ${pdfAttachment ? '<p style="margin: 16px 0 0; font-size: 13px; color: #666;">The invoice PDF is attached to this email.</p>' : ''}
          
          <p style="margin: 24px 0 0; font-size: 13px; color: #999;">Thank you for your business.</p>
        </div>
      </div>
    `;

    // Send via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resend = new Resend(resendApiKey);

    const fromEmail = config?.company_email
      ? `${companyName} <${config.company_email}>`
      : `${companyName} <onboarding@resend.dev>`;

    const emailPayload: Record<string, unknown> = {
      from: fromEmail,
      to: [recipientEmail],
      subject: emailSubject,
      html: emailHtml,
    };

    if (pdfAttachment) {
      emailPayload.attachments = [pdfAttachment];
    }

    const { error: sendErr } = await resend.emails.send(emailPayload as any);

    if (sendErr) {
      console.error('Resend error:', sendErr);
      return new Response(JSON.stringify({ error: `Email send failed: ${sendErr.message}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update invoice status to sent
    await supabaseAdmin
      .from('waybill_invoices')
      .update({
        status: invoice.status === 'draft' ? 'sent' : invoice.status,
        sent_via: 'email',
        sent_at: new Date().toISOString(),
        sent_to: recipientEmail,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .eq('tenant_id', tenantId);

    // Record share event
    await supabaseAdmin.from('invoice_shares').insert({
      invoice_id: invoiceId,
      tenant_id: tenantId,
      channel: 'EMAIL',
      recipient: recipientEmail,
      status: 'SENT',
      sent_at: new Date().toISOString(),
    });

    // Audit log
    await supabaseAdmin.from('waybill_audit_log').insert({
      tenant_id: tenantId,
      entity_type: 'invoice',
      entity_id: invoiceId,
      action: 'email_sent',
      actor_id: userId,
      metadata: {
        recipient_email: recipientEmail,
        invoice_number: invoice.invoice_number,
        has_pdf: !!pdfAttachment,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      message: `Invoice sent to ${recipientEmail}`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Send invoice email error:', error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

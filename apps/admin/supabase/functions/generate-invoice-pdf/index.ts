import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Auth — use getClaims per project convention, with demo mode fallback
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const DEMO_TENANT_ID = 'f7f5af88-fd76-4439-aae3-0461be52f63f';
    let userId: string | null = null;
    let tenantId: string | null = null;

    const { data: claimsData, error: claimsErr } = await supabaseAdmin.auth.getClaims(token);
    const claimSub = claimsData?.claims?.sub as string | undefined;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

    if (claimsErr || !claimSub) {
      // Demo mode fallback: anon key OR tokens without a sub claim (preview/anonymous)
      if (token === anonKey || !claimSub) {
        tenantId = DEMO_TENANT_ID;
        userId = 'demo-user';
      } else {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      userId = claimSub;

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('tenant_id')
        .eq('user_id', userId)
        .single();

      tenantId = profile?.tenant_id || null;
      if (!tenantId) {
        return new Response(JSON.stringify({ error: 'Tenant not found' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Org scoping from header
    const activeOrgId = req.headers.get('X-Active-Org-Id') || null;

    const { invoiceId } = await req.json();
    if (!invoiceId) {
      return new Response(JSON.stringify({ error: 'invoiceId required' }), {
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

    // Fetch tenant invoice config
    const { data: config } = await supabaseAdmin
      .from('tenant_invoice_config')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    // ─── Build PDF binary ───
    const pdfBytes = buildInvoicePdf(invoice, config);

    const storagePath = `${tenantId}/${invoice.invoice_number.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`;

    const { error: uploadErr } = await supabaseAdmin.storage
      .from('invoice-pdfs')
      .upload(storagePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadErr) {
      console.error('Upload error:', uploadErr);
      throw new Error('Failed to store invoice PDF');
    }

    // Store ONLY the storage path — URLs generated on-demand in frontend
    const updatePayload: Record<string, unknown> = {
      pdf_storage_path: storagePath,
      pdf_url: null, // deprecated — use on-demand signed URLs
      updated_at: new Date().toISOString(),
    };

    const updateQuery = supabaseAdmin
      .from('waybill_invoices')
      .update(updatePayload)
      .eq('id', invoiceId)
      .eq('tenant_id', tenantId);

    await updateQuery;

    // Audit log
    await supabaseAdmin.from('waybill_audit_log').insert({
      tenant_id: tenantId,
      entity_type: 'invoice',
      entity_id: invoiceId,
      action: 'pdf_generated',
      actor_id: userId,
      metadata: { storage_path: storagePath, invoice_number: invoice.invoice_number },
    });

    return new Response(JSON.stringify({
      success: true,
      storage_path: storagePath,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('PDF generation error:', error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ════════════════════════════════════════════════════════
// Minimal PDF builder — generates a valid PDF/1.4 binary
// without any external libraries. Produces a real .pdf file.
// ════════════════════════════════════════════════════════

function buildInvoicePdf(invoice: Record<string, unknown>, config: Record<string, unknown> | null): Uint8Array {
  const lines: string[] = [];
  const formatNGN = (n: unknown) => `NGN ${Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  const lineItems = (invoice.line_items as Array<{ description: string; total: number; quantity?: number; unit_price?: number }>) || [];

  // Collect text content lines for PDF
  lines.push(`INVOICE`);
  lines.push(``);
  lines.push(`Invoice Number: ${invoice.invoice_number}`);
  lines.push(`Invoice Date: ${invoice.invoice_date}`);
  lines.push(`Due Date: ${invoice.due_date || 'On receipt'}`);
  lines.push(``);

  if (config) {
    if (config.company_name) lines.push(`From: ${config.company_name}`);
    if (config.company_address) lines.push(`${config.company_address}`);
    if (config.company_phone) lines.push(`Tel: ${config.company_phone}`);
    if (config.company_email) lines.push(`Email: ${config.company_email}`);
    lines.push(``);
  }

  lines.push(`Bill To: ${invoice.customer_name}`);
  if (invoice.customer_phone) lines.push(`Phone: ${invoice.customer_phone}`);
  if (invoice.customer_email) lines.push(`Email: ${invoice.customer_email}`);
  if (invoice.customer_address) lines.push(`Address: ${invoice.customer_address}`);
  lines.push(``);

  lines.push(`Route: ${invoice.origin || '-'} -> ${invoice.destination || '-'}`);
  lines.push(`Vehicle: ${invoice.vehicle_number || '-'}`);
  lines.push(`Waybill: ${invoice.waybill_number || '-'}`);
  if (invoice.waybill_date) lines.push(`Waybill Date: ${invoice.waybill_date}`);
  lines.push(``);

  // Compute due date from payment_terms_days when missing
  const termsDays = Number((config?.payment_terms_days as number | undefined) ?? 15);
  if (!invoice.due_date && invoice.invoice_date) {
    const d = new Date(String(invoice.invoice_date));
    d.setDate(d.getDate() + termsDays);
    (invoice as Record<string, unknown>).due_date = d.toISOString().slice(0, 10);
  }


  // Line items header
  lines.push(`${'Description'.padEnd(40)} ${'Qty'.padStart(6)} ${'Unit Price'.padStart(15)} ${'Amount'.padStart(15)}`);
  lines.push('-'.repeat(80));
  for (const item of lineItems) {
    const desc = (item.description || '').substring(0, 38).padEnd(40);
    const qty = String(item.quantity || 1).padStart(6);
    const up = formatNGN(item.unit_price || item.total).padStart(15);
    const amt = formatNGN(item.total).padStart(15);
    lines.push(`${desc} ${qty} ${up} ${amt}`);
  }
  lines.push('-'.repeat(80));
  lines.push(`${'Subtotal:'.padStart(63)} ${formatNGN(invoice.subtotal_ngn).padStart(15)}`);

  const taxAmt = Number(invoice.tax_amount_ngn || 0);
  if (taxAmt > 0) {
    const taxLabel = config?.tax_label || 'VAT';
    lines.push(`${`${taxLabel} (${invoice.tax_rate_percent}%):`.padStart(63)} ${formatNGN(taxAmt).padStart(15)}`);
  }

  // NCC regulatory levy
  const nccEnabled = !!config?.ncc_levy_enabled;
  const nccPct = Number((config?.ncc_levy_percent as number | undefined) ?? 0);
  let nccAmt = 0;
  if (nccEnabled && nccPct > 0) {
    nccAmt = Math.round((Number(invoice.subtotal_ngn || 0) * nccPct) / 100 * 100) / 100;
    const lbl = config?.ncc_levy_label || 'NCC Levy';
    lines.push(`${`${lbl} (${nccPct}%):`.padStart(63)} ${formatNGN(nccAmt).padStart(15)}`);
  }

  const discount = Number(invoice.discount_ngn || 0);
  if (discount > 0) {
    lines.push(`${'Discount:'.padStart(63)} -${formatNGN(discount).padStart(14)}`);
  }

  const grandTotal = Number(invoice.total_ngn || 0) + nccAmt;
  lines.push(`${'TOTAL:'.padStart(63)} ${formatNGN(grandTotal).padStart(15)}`);
  lines.push(``);
  lines.push(`Payment Terms: Net ${termsDays} — due ${invoice.due_date || 'on receipt'}`);
  lines.push(``);

  if (config?.bank_name) {
    lines.push(`Payment Details:`);
    lines.push(`  Bank: ${config.bank_name}`);
    lines.push(`  Account Name: ${config.bank_account_name}`);
    lines.push(`  Account Number: ${config.bank_account_number}`);
    lines.push(``);
  }

  if (invoice.notes) {
    lines.push(`Notes: ${invoice.notes}`);
    lines.push(``);
  }

  lines.push(`Generated: ${new Date().toISOString().split('T')[0]}`);

  return textToPdf(lines);
}

/**
 * Creates a minimal valid PDF/1.4 document from an array of text lines.
 * Uses Helvetica (built-in PDF font) so no font embedding needed.
 */
function textToPdf(lines: string[]): Uint8Array {
  const fontSize = 10;
  const titleFontSize = 18;
  const lineHeight = 14;
  const marginLeft = 50;
  const marginTop = 750;
  const pageWidth = 595; // A4
  const pageHeight = 842;

  // Prepare content stream
  let y = marginTop;
  let streamContent = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isTitle = i === 0;
    const fs = isTitle ? titleFontSize : fontSize;
    const lh = isTitle ? 24 : lineHeight;

    // Escape special PDF characters
    const escaped = line
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      // Replace non-ASCII currency symbols with text equivalents
      .replace(/₦/g, 'NGN ');

    streamContent += `BT /F1 ${fs} Tf ${marginLeft} ${y} Td (${escaped}) Tj ET\n`;
    y -= lh;

    // Page break if needed (simple: just stop adding — single page for now)
    if (y < 50) {
      // For very long invoices we'd need multi-page support
      // For typical invoices (< 40 lines) single page is sufficient
      break;
    }
  }

  // Build PDF structure
  const objects: string[] = [];
  const offsets: number[] = [];

  // Object 1: Catalog
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Object 2: Pages
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  // Object 3: Page
  objects.push(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`
  );

  // Object 4: Stream
  const streamBytes = new TextEncoder().encode(streamContent);
  objects.push(
    `4 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n${streamContent}endstream\nendobj\n`
  );

  // Object 5: Font
  objects.push(
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n'
  );

  // Assemble
  let pdf = '%PDF-1.4\n';
  for (let i = 0; i < objects.length; i++) {
    offsets.push(pdf.length);
    pdf += objects[i];
  }

  // Cross-reference table
  const xrefOffset = pdf.length;
  pdf += 'xref\n';
  pdf += `0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (const off of offsets) {
    pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  }

  // Trailer
  pdf += 'trailer\n';
  pdf += `<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += 'startxref\n';
  pdf += `${xrefOffset}\n`;
  pdf += '%%EOF\n';

  return new TextEncoder().encode(pdf);
}

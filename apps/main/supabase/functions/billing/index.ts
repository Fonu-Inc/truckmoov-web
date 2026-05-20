import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateInvoiceRequest {
  action: 'generate_invoice' | 'process_payment' | 'check_renewals' | 'get_billing_summary';
  subscriptionId?: string;
  invoiceId?: string;
  phoneNumber?: string;
  tenantId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const request: GenerateInvoiceRequest = await req.json();
    console.log('Billing request:', request);

    let result;

    switch (request.action) {
      case 'generate_invoice':
        result = await generateInvoice(supabase, request.subscriptionId!);
        break;
      case 'process_payment':
        result = await processPayment(supabase, request.invoiceId!, request.phoneNumber!);
        break;
      case 'check_renewals':
        result = await checkAndProcessRenewals(supabase);
        break;
      case 'get_billing_summary':
        result = await getBillingSummary(supabase, request.tenantId);
        break;
      default:
        throw new Error(`Unknown action: ${request.action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Billing error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateInvoice(supabase: any, subscriptionId: string) {
  // Get subscription details
  const { data: subscription, error: subError } = await supabase
    .from('tenant_subscriptions')
    .select('*, subscription_plans(*)')
    .eq('id', subscriptionId)
    .single();

  if (subError || !subscription) {
    throw new Error('Subscription not found');
  }

  const plan = subscription.subscription_plans;
  const taxRate = 0.075; // 7.5% VAT in Nigeria
  const taxAmount = plan.price_ngn * taxRate;
  const totalAmount = plan.price_ngn + taxAmount;

  // Calculate due date based on billing cycle
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7); // 7 days to pay

  // Create invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      tenant_id: subscription.tenant_id,
      tenant_name: subscription.tenant_name,
      subscription_id: subscriptionId,
      amount_ngn: plan.price_ngn,
      tax_ngn: taxAmount,
      total_ngn: totalAmount,
      due_date: dueDate.toISOString(),
      payment_method: subscription.payment_method,
      line_items: [
        {
          description: `${plan.name} - ${plan.billing_cycle} subscription`,
          quantity: 1,
          unit_price: plan.price_ngn,
          total: plan.price_ngn,
        },
        {
          description: 'VAT (7.5%)',
          quantity: 1,
          unit_price: taxAmount,
          total: taxAmount,
        },
      ],
    })
    .select()
    .single();

  if (invoiceError) {
    console.error('Invoice creation error:', invoiceError);
    throw new Error('Failed to create invoice');
  }

  console.log('Invoice generated:', invoice);
  return { success: true, invoice };
}

async function processPayment(supabase: any, invoiceId: string, phoneNumber: string) {
  // Get invoice details
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single();

  if (invoiceError || !invoice) {
    throw new Error('Invoice not found');
  }

  if (invoice.status === 'paid') {
    return { success: false, error: 'Invoice already paid' };
  }

  // Create payment transaction
  const { data: transaction, error: txError } = await supabase
    .from('payment_transactions')
    .insert({
      invoice_id: invoiceId,
      tenant_id: invoice.tenant_id,
      amount_ngn: invoice.total_ngn,
      payment_method: 'mtn_momo',
      phone_number: phoneNumber,
      status: 'processing',
    })
    .select()
    .single();

  if (txError) {
    throw new Error('Failed to create payment transaction');
  }

  // Call MTN MoMo payment function
  try {
    const momoResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/mtn-momo-payment`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: invoice.total_ngn,
          phone_number: phoneNumber,
          external_id: transaction.id,
          payer_message: `Invoice ${invoice.invoice_number}`,
          payee_note: `Payment for ${invoice.tenant_name}`,
        }),
      }
    );

    const momoResult = await momoResponse.json();
    console.log('MoMo payment result:', momoResult);

    if (momoResult.error) {
      // Update transaction as failed
      await supabase
        .from('payment_transactions')
        .update({
          status: 'failed',
          error_message: momoResult.error,
        })
        .eq('id', transaction.id);

      return { success: false, error: momoResult.error };
    }

    // Update transaction with MoMo reference
    await supabase
      .from('payment_transactions')
      .update({
        momo_reference: momoResult.referenceId,
        status: 'processing',
      })
      .eq('id', transaction.id);

    return {
      success: true,
      transactionId: transaction.id,
      momoReference: momoResult.referenceId,
      message: 'Payment initiated. Please approve on your phone.',
    };
  } catch (error) {
    console.error('MoMo payment error:', error);
    
    await supabase
      .from('payment_transactions')
      .update({
        status: 'failed',
        error_message: 'Payment service unavailable',
      })
      .eq('id', transaction.id);

    return { success: false, error: 'Payment service unavailable' };
  }
}

async function checkAndProcessRenewals(supabase: any) {
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  // Find subscriptions whose current period ends within the next 7 days,
  // OR has already ended (overdue renewals that auto-renew).
  const { data: dueSubscriptions, error } = await supabase
    .from('tenant_subscriptions')
    .select('*, subscription_plans(*)')
    .eq('status', 'active')
    .eq('auto_renew', true)
    .lte('current_period_end', sevenDaysFromNow.toISOString());

  if (error) {
    console.error('Renewal lookup error:', error);
    throw new Error('Failed to fetch expiring subscriptions');
  }

  const eligible = dueSubscriptions || [];
  console.log(`Found ${eligible.length} subscriptions due for renewal`);

  const created: any[] = [];
  const skipped: any[] = [];
  const failed: any[] = [];

  for (const subscription of eligible) {
    try {
      // Skip if an invoice already exists for the current period
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('subscription_id', subscription.id)
        .gte('created_at', subscription.current_period_start)
        .maybeSingle();

      if (existingInvoice) {
        skipped.push({ subscriptionId: subscription.id, reason: 'invoice_exists' });
        continue;
      }

      const invoice = await generateInvoice(supabase, subscription.id);
      created.push({ subscriptionId: subscription.id, invoice: invoice.invoice });
    } catch (err) {
      console.error(`Failed to process renewal for ${subscription.id}:`, err);
      failed.push({
        subscriptionId: subscription.id,
        error: err instanceof Error ? err.message : 'Failed to generate invoice',
      });
    }
  }

  return {
    success: true,
    eligible: eligible.length,
    processed: created.length,
    skipped: skipped.length,
    failed: failed.length,
    results: created,
    skippedDetails: skipped,
    failedDetails: failed,
  };
}

async function getBillingSummary(supabase: any, tenantId?: string) {
  let query = supabase.from('invoices').select('*');
  
  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data: invoices, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw new Error('Failed to fetch invoices');
  }

  const summary = {
    totalInvoices: invoices.length,
    totalRevenue: invoices
      .filter((i: any) => i.status === 'paid')
      .reduce((sum: number, i: any) => sum + parseFloat(i.total_ngn), 0),
    pendingAmount: invoices
      .filter((i: any) => i.status === 'pending')
      .reduce((sum: number, i: any) => sum + parseFloat(i.total_ngn), 0),
    overdueAmount: invoices
      .filter((i: any) => i.status === 'pending' && new Date(i.due_date) < new Date())
      .reduce((sum: number, i: any) => sum + parseFloat(i.total_ngn), 0),
    paidCount: invoices.filter((i: any) => i.status === 'paid').length,
    pendingCount: invoices.filter((i: any) => i.status === 'pending').length,
    overdueCount: invoices.filter((i: any) => i.status === 'pending' && new Date(i.due_date) < new Date()).length,
  };

  return { summary, invoices: invoices.slice(0, 50) };
}

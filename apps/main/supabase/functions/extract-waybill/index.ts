import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ExtractRequest {
  action: 'extract_waybill' | 'generate_invoice' | 'match_pricing' | 'update_waybill';
  waybillId?: string;
  imageUrl?: string;
  imageBase64?: string;
  tenantId?: string;
  // For generate_invoice
  waybillData?: Record<string, unknown>;
  // For match_pricing
  destination?: string;
  origin?: string;
  vehicleType?: string;
  customerName?: string;
  weightTons?: number | null;
  // For update_waybill
  updates?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth: extract user from JWT
    const authHeader = req.headers.get('Authorization');
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let userId: string | null = null;
    let tenantId: string | null = null;
    let userRole: string | null = null;
    let userOrgType: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) {
        userId = user.id;
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('tenant_id')
          .eq('user_id', user.id)
          .single();
        tenantId = profile?.tenant_id ?? null;

        // Fetch user role
        const { data: roleRow } = await supabaseAdmin
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .limit(1)
          .single();
        userRole = roleRow?.role ?? null;

        // Fetch active org type from X-Active-Org-Id header
        const activeOrgId = req.headers.get('X-Active-Org-Id');
        if (activeOrgId) {
          const { data: orgRow } = await supabaseAdmin
            .from('user_org_memberships')
            .select('org_id, organizations!inner(organization_type)')
            .eq('user_id', user.id)
            .eq('org_id', activeOrgId)
            .eq('membership_status', 'active')
            .single();
          userOrgType = (orgRow?.organizations as any)?.organization_type ?? null;
        }
      }
    }

    const request: ExtractRequest = await req.json();
    console.log('Waybill request:', request.action, { userRole, userOrgType });

    if (!tenantId && request.tenantId) {
      tenantId = request.tenantId;
    }

    if (!tenantId) {
      return new Response(JSON.stringify({ error: 'Tenant context required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── RBAC enforcement per action ──
    const WRITE_ORG_TYPES = ['FLEET_PROVIDER', 'AGGREGATOR', 'OWNER_OPERATOR'];
    const isWriteOrg = userOrgType && WRITE_ORG_TYPES.includes(userOrgType);
    const isPlatformAdmin = userRole === 'platform_admin';

    // Enterprise = read-only (can only view via RLS); cannot call write actions
    if (userOrgType === 'ENTERPRISE' && ['extract_waybill', 'generate_invoice', 'update_waybill'].includes(request.action)) {
      return new Response(JSON.stringify({ error: 'Enterprise orgs have read-only access to invoices' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Platform admin: can view + configure, but cannot generate invoices (not a billing party)
    if (isPlatformAdmin && request.action === 'generate_invoice') {
      return new Response(JSON.stringify({ error: 'Platform admins cannot generate invoices — oversight role only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Write actions require a billing-capable org
    if (['extract_waybill', 'generate_invoice', 'update_waybill'].includes(request.action)) {
      if (!isWriteOrg && !isPlatformAdmin) {
        return new Response(JSON.stringify({ error: 'Insufficient permissions for this action' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    let result: Record<string, unknown>;

    switch (request.action) {
      case 'extract_waybill':
        result = await extractWaybill(supabaseAdmin, request, tenantId, userId);
        break;
      case 'generate_invoice':
        result = await generateInvoice(supabaseAdmin, request, tenantId, userId);
        break;
      case 'match_pricing':
        result = await matchPricing(supabaseAdmin, request, tenantId);
        break;
      case 'update_waybill':
        result = await updateWaybillFields(supabaseAdmin, request, tenantId, userId);
        break;
      default:
        throw new Error(`Unknown action: ${request.action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Waybill error:', error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// deno-lint-ignore no-explicit-any
async function extractWaybill(
  supabase: any,
  request: ExtractRequest,
  tenantId: string,
  userId: string | null
) {
  const { waybillId, imageUrl, imageBase64 } = request;

  if (!waybillId) throw new Error('waybillId required');

  // Update waybill status to processing
  await supabase
    .from('waybill_records')
    .update({ status: 'processing', processed_by: userId })
    .eq('id', waybillId);

  try {
    // Build AI prompt for waybill extraction (Section 6.1)
    const prompt = `You are an expert at reading logistics waybills and delivery notes. Extract the following fields from this waybill image. Return ONLY valid JSON with these fields:
{
  "destination": "the delivery destination city/location",
  "origin": "the pickup/origin city/location if visible",
  "vehicle_number": "the truck/vehicle registration number",
  "order_number": "the order or reference number",
  "waybill_number": "the waybill number",
  "customer_name": "the customer or consignee name",
  "date": "the date on the waybill in YYYY-MM-DD format",
  "weight_tons": "weight in metric tons if present (convert from kg if needed)",
  "quantity": "numeric quantity if present",
  "quantity_unit": "unit of quantity (tons, bags, pieces, etc.)",
  "driver_name": "driver name if present",
  "notes": "any other relevant information",
  "confidence_overall": 0.0,
  "confidence_per_field": {
    "destination": 0.0,
    "origin": 0.0,
    "vehicle_number": 0.0,
    "order_number": 0.0,
    "waybill_number": 0.0,
    "customer_name": 0.0,
    "date": 0.0,
    "weight_tons": 0.0,
    "quantity": 0.0,
    "driver_name": 0.0
  }
}
For confidence_overall and confidence_per_field, rate from 0 to 1 based on how clearly you can read each value. Set a field to null if it is not visible or readable, and set its confidence to 0. Be precise with numbers and dates.`;

    // Call Lovable AI (Gemini) for vision extraction
    const aiResponse = await fetch('https://api.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: imageBase64 
              ? [
                  { type: 'text', text: prompt },
                  { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
                ]
              : [
                  { type: 'text', text: prompt },
                  ...(imageUrl ? [{ type: 'image_url', image_url: { url: imageUrl } }] : [])
                ],
          },
        ],
        temperature: 0.1,
        max_tokens: 1500,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('AI extraction failed:', errText);
      throw new Error('AI extraction service unavailable');
    }

    const aiResult = await aiResponse.json();
    const rawContent = aiResult.choices?.[0]?.message?.content || '';
    
    // Parse JSON from AI response (handle markdown code blocks)
    let extracted: Record<string, unknown>;
    try {
      const jsonMatch = rawContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                        rawContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : rawContent;
      extracted = JSON.parse(jsonStr);
    } catch {
      console.error('Failed to parse AI response:', rawContent);
      await supabase
        .from('waybill_records')
        .update({ 
          status: 'extraction_failed', 
          extraction_error: 'Failed to parse AI response',
          processed_at: new Date().toISOString(),
        })
        .eq('id', waybillId);
      
      return { success: false, error: 'Failed to parse waybill data' };
    }

    // Extract confidence values (Section 6.1)
    const confidenceOverall = typeof extracted.confidence_overall === 'number' 
      ? extracted.confidence_overall 
      : 0.5;
    const confidencePerField = (extracted.confidence_per_field as Record<string, number>) || {};

    // Section 6.2 — Review rule: auto-route based on confidence and missing critical fields
    const destinationMissing = !extracted.destination;
    const orderNumberMissing = !extracted.order_number;
    const needsReview = confidenceOverall < 0.75 || destinationMissing || orderNumberMissing;
    const autoStatus = needsReview ? 'needs_review' : 'approved';

    // Build update data with Section 6.1 normalized keys
    const updateData = {
      status: autoStatus as 'needs_review' | 'approved',
      extracted_data: extracted,
      destination: (extracted.destination as string) || null,
      origin: (extracted.origin as string) || null,
      vehicle_number: (extracted.vehicle_number as string) || null,
      order_number: (extracted.order_number as string) || null,
      waybill_number: (extracted.waybill_number as string) || null,
      customer_name: (extracted.customer_name as string) || null,
      waybill_date: (extracted.date as string) || null,
      quantity: extracted.quantity ? Number(extracted.quantity) : null,
      quantity_unit: (extracted.quantity_unit as string) || null,
      weight_kg: extracted.weight_tons ? Number(extracted.weight_tons) * 1000 : null,
      weight_tons: extracted.weight_tons ? Number(extracted.weight_tons) : null,
      driver_name: (extracted.driver_name as string) || null,
      additional_notes: (extracted.notes as string) || null,
      ai_confidence_score: confidenceOverall,
      confidence_per_field: confidencePerField,
      ai_model_used: 'google/gemini-2.5-flash',
      processed_at: new Date().toISOString(),
      processed_by: userId,
    };

    await supabase
      .from('waybill_records')
      .update(updateData)
      .eq('id', waybillId);

    // Section 6.3 — Destination matching (including aliases)
    if (extracted.destination) {
      const pricing = await matchPricing(supabase, {
        action: 'match_pricing',
        destination: extracted.destination as string,
        origin: extracted.origin as string,
        vehicleType: null as unknown as string,
        customerName: extracted.customer_name as string,
        weightTons: extracted.weight_tons ? Number(extracted.weight_tons) : null,
      }, tenantId);

      if (pricing.matched) {
        await supabase
          .from('waybill_records')
          .update({
            matched_pricing_rule_id: pricing.rule?.id,
            calculated_price_ngn: pricing.calculatedPrice,
          })
          .eq('id', waybillId);
      }
      // If no match found, frontend will prompt user to select pricing manually
    }

    // Audit log
    await supabase.from('waybill_audit_log').insert({
      tenant_id: tenantId,
      entity_type: 'waybill',
      entity_id: waybillId,
      action: 'extracted',
      actor_id: userId,
      metadata: { 
        model: 'google/gemini-2.5-flash', 
        fields_extracted: Object.keys(extracted).filter(k => extracted[k] != null).length,
        confidence_overall: confidenceOverall,
        auto_status: autoStatus,
        needs_review_reason: needsReview 
          ? [
              confidenceOverall < 0.75 ? 'low_confidence' : null,
              destinationMissing ? 'destination_missing' : null,
              orderNumberMissing ? 'order_number_missing' : null,
            ].filter(Boolean)
          : null,
      },
    });

    return { success: true, extracted: updateData, autoStatus, needsReview };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Extraction failed';
    await supabase
      .from('waybill_records')
      .update({ status: 'extraction_failed', extraction_error: errMsg, processed_at: new Date().toISOString() })
      .eq('id', waybillId);
    
    return { success: false, error: errMsg };
  }
}

// Section 6.3 — Destination matching with alias support
// deno-lint-ignore no-explicit-any
async function matchPricing(
  supabase: any,
  request: ExtractRequest,
  tenantId: string
) {
  const { destination, origin, vehicleType, customerName } = request;

  if (!destination) return { matched: false, error: 'No destination provided' };

  const destLower = destination.toLowerCase();

  // Fetch all active pricing rules for tenant (we need to check aliases in-memory)
  const { data: rules, error } = await supabase
    .from('destination_pricing_rules')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error || !rules?.length) {
    return { matched: false, error: 'No pricing rule found for destination' };
  }

  // Filter rules that match destination name OR destination_aliases
  const matchingRules = rules.filter((rule: any) => {
    // Match against destination name
    if (rule.destination.toLowerCase().includes(destLower) || destLower.includes(rule.destination.toLowerCase())) {
      return true;
    }
    // Match against destination_aliases (JSONB array)
    if (rule.destination_aliases && Array.isArray(rule.destination_aliases)) {
      return (rule.destination_aliases as string[]).some(
        alias => typeof alias === 'string' && (alias.toLowerCase().includes(destLower) || destLower.includes(alias.toLowerCase()))
      );
    }
    return false;
  });

  if (!matchingRules.length) {
    return { matched: false, error: 'No pricing rule found for destination', destinationUnmatched: true };
  }

  // Score rules by specificity
  let bestRule = matchingRules[0];
  let bestScore = 0;

  for (const rule of matchingRules) {
    let score = 1; // Base: destination matches
    if (origin && rule.origin && rule.origin.toLowerCase().includes(origin.toLowerCase())) score += 2;
    if (vehicleType && rule.vehicle_type && rule.vehicle_type.toLowerCase() === vehicleType.toLowerCase()) score += 2;
    if (customerName && rule.customer_name && rule.customer_name.toLowerCase().includes(customerName.toLowerCase())) score += 3;
    if (rule.effective_to === null || new Date(rule.effective_to) >= new Date()) score += 1;
    
    if (score > bestScore) {
      bestScore = score;
      bestRule = rule;
    }
  }

  // Section 7 — Compute price based on pricing_mode
  const weightTons = request.weightTons ?? null;
  let calculatedPrice: number;

  switch (bestRule.pricing_mode) {
    case 'PER_WEIGHT': {
      if (weightTons && weightTons > 0 && bestRule.price_per_unit_ngn) {
        calculatedPrice = weightTons * bestRule.price_per_unit_ngn;
        // Apply minimum charge floor
        if (bestRule.minimum_charge && calculatedPrice < bestRule.minimum_charge) {
          calculatedPrice = bestRule.minimum_charge;
        }
      } else {
        // Fallback: use minimum_charge if weight missing, else flat price
        calculatedPrice = bestRule.minimum_charge ?? bestRule.price_ngn;
      }
      break;
    }
    case 'PER_DISTANCE': {
      // PER_DISTANCE uses price_per_unit_ngn * distance — but distance isn't extracted from waybills
      // Fallback to flat price or minimum_charge
      calculatedPrice = bestRule.price_ngn || bestRule.minimum_charge || 0;
      break;
    }
    case 'FLAT':
    default: {
      calculatedPrice = bestRule.price_ngn;
      if (bestRule.minimum_charge && calculatedPrice < bestRule.minimum_charge) {
        calculatedPrice = bestRule.minimum_charge;
      }
      break;
    }
  }

  return {
    matched: true,
    rule: bestRule,
    calculatedPrice,
    pricingMode: bestRule.pricing_mode,
    allRules: matchingRules,
  };
}

// deno-lint-ignore no-explicit-any
async function generateInvoice(
  supabase: any,
  request: ExtractRequest,
  tenantId: string,
  userId: string | null
) {
  const { waybillId } = request;
  if (!waybillId) throw new Error('waybillId required');

  // Get waybill data
  const { data: waybill, error: wbErr } = await supabase
    .from('waybill_records')
    .select('*')
    .eq('id', waybillId)
    .single();

  if (wbErr || !waybill) throw new Error('Waybill not found');

  // Get tenant invoice config
  const { data: config } = await supabase
    .from('tenant_invoice_config')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  // Section 7 — Re-compute price using pricing_mode logic via matchPricing
  let subtotal = waybill.calculated_price_ngn || 0;
  let pricingMode = 'FLAT';

  if (waybill.matched_pricing_rule_id) {
    // Re-fetch the matched rule to get pricing_mode details
    const { data: rule } = await supabase
      .from('destination_pricing_rules')
      .select('*')
      .eq('id', waybill.matched_pricing_rule_id)
      .single();

    if (rule) {
      pricingMode = rule.pricing_mode || 'FLAT';
      switch (pricingMode) {
        case 'PER_WEIGHT': {
          const wt = waybill.weight_tons ?? (waybill.weight_kg ? waybill.weight_kg / 1000 : null);
          if (wt && wt > 0 && rule.price_per_unit_ngn) {
            subtotal = wt * rule.price_per_unit_ngn;
            if (rule.minimum_charge && subtotal < rule.minimum_charge) {
              subtotal = rule.minimum_charge;
            }
          } else {
            subtotal = rule.minimum_charge ?? rule.price_ngn;
          }
          break;
        }
        case 'FLAT':
        default: {
          subtotal = rule.price_ngn;
          if (rule.minimum_charge && subtotal < rule.minimum_charge) {
            subtotal = rule.minimum_charge;
          }
          break;
        }
      }
    }
  }

  // Generate invoice number using DB function
  const { data: invoiceNumber } = await supabase.rpc('generate_waybill_invoice_number', {
    p_tenant_id: tenantId,
  });

  const taxRate = config?.tax_enabled ? (config.tax_rate_percent || 7.5) : 0;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (config?.payment_terms_days || 30));

  // Section 7 — Line items with spec-compliant description
  const freightDescription = pricingMode === 'PER_WEIGHT' && waybill.weight_tons
    ? `Freight charge to ${waybill.destination || 'Destination'} (${waybill.weight_tons}t × rate)`
    : `Freight charge to ${waybill.destination || 'Destination'}`;

  const lineItems = [
    {
      description: freightDescription,
      vehicle: waybill.vehicle_number,
      waybill_ref: waybill.waybill_number,
      quantity: waybill.quantity || 1,
      unit: waybill.quantity_unit || 'trip',
      unit_price: subtotal,
      total: subtotal,
    },
  ];

  if (taxAmount > 0) {
    lineItems.push({
      description: `${config?.tax_label || 'VAT'} (${taxRate}%)`,
      vehicle: '',
      waybill_ref: '',
      quantity: 1,
      unit: '',
      unit_price: taxAmount,
      total: taxAmount,
    });
  }

  const { data: invoice, error: invErr } = await supabase
    .from('waybill_invoices')
    .insert({
      tenant_id: tenantId,
      org_id: waybill.org_id,
      invoice_number: invoiceNumber,
      waybill_id: waybillId,
      status: 'draft',
      customer_name: waybill.customer_name || 'Unknown Customer',
      line_items: lineItems,
      subtotal_ngn: subtotal,
      tax_rate_percent: taxRate,
      tax_amount_ngn: taxAmount,
      total_ngn: total,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      payment_terms: `Net ${config?.payment_terms_days || 30} days`,
      origin: waybill.origin,
      destination: waybill.destination,
      vehicle_number: waybill.vehicle_number,
      waybill_number: waybill.waybill_number,
      waybill_date: waybill.waybill_date,
      quantity: waybill.quantity,
      quantity_unit: waybill.quantity_unit,
      notes: config?.notes_template || null,
      created_by: userId,
    })
    .select()
    .single();

  if (invErr) {
    console.error('Invoice creation error:', invErr);
    throw new Error('Failed to create invoice');
  }

  // Write line items to invoice_line_items table
  const lineItemRows = lineItems.map((item: any) => ({
    invoice_id: invoice.id,
    description: item.description,
    quantity: item.quantity || 1,
    unit_price: item.unit_price || item.total,
    amount: item.total,
  }));

  await supabase.from('invoice_line_items').insert(lineItemRows);

  // Update waybill status
  await supabase
    .from('waybill_records')
    .update({ status: 'invoice_generated' })
    .eq('id', waybillId);

  // Audit log
  await supabase.from('waybill_audit_log').insert({
    tenant_id: tenantId,
    entity_type: 'invoice',
    entity_id: invoice.id,
    action: 'created',
    actor_id: userId,
    metadata: { waybill_id: waybillId, invoice_number: invoiceNumber, total_ngn: total },
  });

  return { success: true, invoice };
}

// deno-lint-ignore no-explicit-any
async function updateWaybillFields(
  supabase: any,
  request: ExtractRequest,
  tenantId: string,
  userId: string | null
) {
  const { waybillId, updates } = request;
  if (!waybillId) throw new Error('waybillId required');
  if (!updates) throw new Error('updates required');

  // Whitelist allowed fields
  const allowedFields = [
    'destination', 'origin', 'vehicle_number', 'waybill_number',
    'customer_name', 'waybill_date', 'quantity', 'quantity_unit',
    'weight_kg', 'weight_tons', 'driver_name', 'order_number', 'additional_notes',
  ];

  const safeUpdates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in updates) {
      safeUpdates[key] = updates[key];
    }
  }

  if (Object.keys(safeUpdates).length === 0) {
    return { success: false, error: 'No valid fields to update' };
  }

  safeUpdates.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('waybill_records')
    .update(safeUpdates)
    .eq('id', waybillId)
    .eq('tenant_id', tenantId);

  if (error) throw error;

  // Re-match pricing if destination changed
  if (safeUpdates.destination) {
    const pricing = await matchPricing(supabase, {
      action: 'match_pricing',
      destination: safeUpdates.destination as string,
      origin: (safeUpdates.origin as string) || undefined,
      customerName: (safeUpdates.customer_name as string) || undefined,
    } as ExtractRequest, tenantId);

    if (pricing.matched) {
      await supabase
        .from('waybill_records')
        .update({
          matched_pricing_rule_id: pricing.rule?.id,
          calculated_price_ngn: pricing.calculatedPrice,
        })
        .eq('id', waybillId);
    }
  }

  // Audit log
  await supabase.from('waybill_audit_log').insert({
    tenant_id: tenantId,
    entity_type: 'waybill',
    entity_id: waybillId,
    action: 'fields_updated',
    actor_id: userId,
    metadata: { updated_fields: Object.keys(safeUpdates) },
  });

  // Fetch updated record
  const { data: updated } = await supabase
    .from('waybill_records')
    .select('*')
    .eq('id', waybillId)
    .single();

  return { success: true, waybill: updated };
}

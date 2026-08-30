export type WaybillRecord = any;
export type WaybillInvoice = any;
export type PricingRule = any;

export const DEMO_WAYBILLS: WaybillRecord[] = [
  {
    id: "demo-w-1", tenant_id: "demo", org_id: null, status: "invoice_generated", source_type: "whatsapp", source_message_id: null, source_phone: "+2348012345678", driver_name: "Adebayo Okafor", image_url: null, image_storage_path: null, extracted_data: null, destination: "Abuja", origin: "Lagos", vehicle_number: "LAG-234-XR", waybill_number: "WB-20284", customer_name: "Dangote Cement", waybill_date: "2026-04-22", quantity: 30, quantity_unit: "tons", weight_kg: 30000, weight_tons: 30, matched_pricing_rule_id: null, calculated_price_ngn: 850000, ai_confidence_score: 0.96, ai_model_used: "gemini-2.5-pro", confidence_per_field: null, extraction_error: null, processed_at: null, processed_by: null, created_at: "2026-04-22T08:14:00Z", updated_at: "2026-04-22T08:20:00Z",
  },
  {
    id: "demo-w-2", tenant_id: "demo", org_id: null, status: "extracted", source_type: "upload", source_message_id: null, source_phone: null, driver_name: "Chinedu Eze", image_url: null, image_storage_path: null, extracted_data: null, destination: "Port Harcourt", origin: "Lagos", vehicle_number: "LAG-901-KN", waybill_number: "WB-20285", customer_name: "Nigerian Breweries", waybill_date: "2026-04-23", quantity: 18, quantity_unit: "pallets", weight_kg: 12000, weight_tons: 12, matched_pricing_rule_id: null, calculated_price_ngn: 620000, ai_confidence_score: 0.93, ai_model_used: "gemini-2.5-pro", confidence_per_field: null, extraction_error: null, processed_at: null, processed_by: null, created_at: "2026-04-23T10:02:00Z", updated_at: "2026-04-23T10:08:00Z",
  },
  {
    id: "demo-w-3", tenant_id: "demo", org_id: null, status: "needs_review", source_type: "whatsapp", source_message_id: null, source_phone: "+2348023456789", driver_name: "Ibrahim Musa", image_url: null, image_storage_path: null, extracted_data: null, destination: "Kano", origin: "Kaduna", vehicle_number: "KAD-455-ZT", waybill_number: "WB-20286", customer_name: "BUA Foods", waybill_date: "2026-04-23", quantity: 24, quantity_unit: "tons", weight_kg: 24000, weight_tons: 24, matched_pricing_rule_id: null, calculated_price_ngn: 410000, ai_confidence_score: 0.71, ai_model_used: "gemini-2.5-pro", confidence_per_field: null, extraction_error: null, processed_at: null, processed_by: null, created_at: "2026-04-23T13:35:00Z", updated_at: "2026-04-23T13:40:00Z",
  },
  {
    id: "demo-w-4", tenant_id: "demo", org_id: null, status: "received", source_type: "whatsapp", source_message_id: null, source_phone: "+2348034567890", driver_name: "Olumide Bello", image_url: null, image_storage_path: null, extracted_data: null, destination: null, origin: null, vehicle_number: null, waybill_number: null, customer_name: null, waybill_date: null, quantity: null, quantity_unit: null, weight_kg: null, weight_tons: null, matched_pricing_rule_id: null, calculated_price_ngn: null, ai_confidence_score: null, ai_model_used: null, confidence_per_field: null, extraction_error: null, processed_at: null, processed_by: null, created_at: "2026-04-24T07:48:00Z", updated_at: "2026-04-24T07:48:00Z",
  },
  {
    id: "demo-w-5", tenant_id: "demo", org_id: null, status: "extracted", source_type: "whatsapp", source_message_id: null, source_phone: "+2348045678901", driver_name: "Tunde Akinwale", image_url: null, image_storage_path: null, extracted_data: null, destination: "Onitsha", origin: "Lagos", vehicle_number: "LAG-712-MV", waybill_number: "WB-20287", customer_name: "Flour Mills of Nigeria", waybill_date: "2026-04-24", quantity: 40, quantity_unit: "tons", weight_kg: 40000, weight_tons: 40, matched_pricing_rule_id: null, calculated_price_ngn: 720000, ai_confidence_score: 0.94, ai_model_used: "gemini-2.5-pro", confidence_per_field: null, extraction_error: null, processed_at: null, processed_by: null, created_at: "2026-04-24T09:22:00Z", updated_at: "2026-04-24T09:30:00Z",
  },
  {
    id: "demo-w-6", tenant_id: "demo", org_id: null, status: "extraction_failed", source_type: "upload", source_message_id: null, source_phone: null, driver_name: "Femi Adeyemi", image_url: null, image_storage_path: null, extracted_data: null, destination: null, origin: null, vehicle_number: null, waybill_number: null, customer_name: null, waybill_date: null, quantity: null, quantity_unit: null, weight_kg: null, weight_tons: null, matched_pricing_rule_id: null, calculated_price_ngn: null, ai_confidence_score: null, ai_model_used: "gemini-2.5-pro", confidence_per_field: null, extraction_error: "Image too blurry", processed_at: null, processed_by: null, created_at: "2026-04-24T11:05:00Z", updated_at: "2026-04-24T11:06:00Z",
  },
  {
    id: "demo-w-7", tenant_id: "demo", org_id: null, status: "invoice_generated", source_type: "whatsapp", source_message_id: null, source_phone: "+2348056789012", driver_name: "Yusuf Garba", image_url: null, image_storage_path: null, extracted_data: null, destination: "Ibadan", origin: "Lagos", vehicle_number: "OYO-118-CL", waybill_number: "WB-20288", customer_name: "Cadbury Nigeria", waybill_date: "2026-04-21", quantity: 22, quantity_unit: "tons", weight_kg: 22000, weight_tons: 22, matched_pricing_rule_id: null, calculated_price_ngn: 320000, ai_confidence_score: 0.97, ai_model_used: "gemini-2.5-pro", confidence_per_field: null, extraction_error: null, processed_at: null, processed_by: null, created_at: "2026-04-21T14:55:00Z", updated_at: "2026-04-21T15:02:00Z",
  },
  {
    id: "demo-w-8", tenant_id: "demo", org_id: null, status: "approved", source_type: "whatsapp", source_message_id: null, source_phone: "+2348067890123", driver_name: "Kunle Adesola", image_url: null, image_storage_path: null, extracted_data: null, destination: "Enugu", origin: "Lagos", vehicle_number: "LAG-553-WP", waybill_number: "WB-20289", customer_name: "Innoson Motors", waybill_date: "2026-04-24", quantity: 15, quantity_unit: "tons", weight_kg: 15000, weight_tons: 15, matched_pricing_rule_id: null, calculated_price_ngn: 580000, ai_confidence_score: 0.95, ai_model_used: "gemini-2.5-pro", confidence_per_field: null, extraction_error: null, processed_at: null, processed_by: null, created_at: "2026-04-24T16:18:00Z", updated_at: "2026-04-24T16:25:00Z",
  },
];

export const DEMO_INVOICES: WaybillInvoice[] = [
  {
    id: "demo-i-1", tenant_id: "demo", org_id: null, invoice_number: "INV-20284", waybill_id: "demo-w-1", status: "paid", customer_name: "Dangote Cement", customer_phone: "+2348011112222", customer_email: "accounts@dangote.com", customer_address: "Marina, Lagos", line_items: [], subtotal_ngn: 850000, tax_rate_percent: 7.5, tax_amount_ngn: 63750, discount_ngn: 0, total_ngn: 913750, amount_paid_ngn: 913750, invoice_date: "2026-04-22", due_date: "2026-05-22", payment_terms: "NET 30", notes: null, origin: "Lagos", destination: "Abuja", vehicle_number: "LAG-234-XR", waybill_number: "WB-20284", waybill_date: "2026-04-22", quantity: 30, quantity_unit: "tons", sent_via: "EMAIL", sent_at: "2026-04-22T11:00:00Z", sent_to: "accounts@dangote.com", pdf_storage_path: null, pdf_url: null, created_by: null, approved_by: null, approved_at: "2026-04-22T10:50:00Z", created_at: "2026-04-22T10:30:00Z", updated_at: "2026-04-22T10:50:00Z",
  },
  {
    id: "demo-i-2", tenant_id: "demo", org_id: null, invoice_number: "INV-20288", waybill_id: "demo-w-7", status: "sent", customer_name: "Cadbury Nigeria", customer_phone: "+2348022223333", customer_email: "finance@cadbury.ng", customer_address: "Lateef Jakande Rd, Ikeja", line_items: [], subtotal_ngn: 320000, tax_rate_percent: 7.5, tax_amount_ngn: 24000, discount_ngn: 0, total_ngn: 344000, amount_paid_ngn: 0, invoice_date: "2026-04-21", due_date: "2026-05-21", payment_terms: "NET 30", notes: null, origin: "Lagos", destination: "Ibadan", vehicle_number: "OYO-118-CL", waybill_number: "WB-20288", waybill_date: "2026-04-21", quantity: 22, quantity_unit: "tons", sent_via: "WHATSAPP", sent_at: "2026-04-21T16:10:00Z", sent_to: "+2348022223333", pdf_storage_path: null, pdf_url: null, created_by: null, approved_by: null, approved_at: "2026-04-21T15:30:00Z", created_at: "2026-04-21T15:15:00Z", updated_at: "2026-04-21T16:10:00Z",
  },
  {
    id: "demo-i-3", tenant_id: "demo", org_id: null, invoice_number: "INV-20278", waybill_id: "demo-w-x", status: "overdue", customer_name: "Honeywell Flour", customer_phone: "+2348033334444", customer_email: "pay@honeywell.ng", customer_address: "Apapa, Lagos", line_items: [], subtotal_ngn: 1250000, tax_rate_percent: 7.5, tax_amount_ngn: 93750, discount_ngn: 0, total_ngn: 1343750, amount_paid_ngn: 0, invoice_date: "2026-03-12", due_date: "2026-04-11", payment_terms: "NET 30", notes: null, origin: "Lagos", destination: "Maiduguri", vehicle_number: "LAG-882-RY", waybill_number: "WB-20278", waybill_date: "2026-03-12", quantity: 35, quantity_unit: "tons", sent_via: "EMAIL", sent_at: "2026-03-12T17:00:00Z", sent_to: "pay@honeywell.ng", pdf_storage_path: null, pdf_url: null, created_by: null, approved_by: null, approved_at: null, created_at: "2026-03-12T16:30:00Z", updated_at: "2026-04-11T00:00:00Z",
  },
  {
    id: "demo-i-4", tenant_id: "demo", org_id: null, invoice_number: "INV-20281", waybill_id: "demo-w-y", status: "partially_paid", customer_name: "Nestlé Nigeria", customer_phone: "+2348044445555", customer_email: "ap@nestle.ng", customer_address: "Ilupeju, Lagos", line_items: [], subtotal_ngn: 980000, tax_rate_percent: 7.5, tax_amount_ngn: 73500, discount_ngn: 20000, total_ngn: 1033500, amount_paid_ngn: 500000, invoice_date: "2026-04-05", due_date: "2026-05-05", payment_terms: "NET 30", notes: null, origin: "Lagos", destination: "Calabar", vehicle_number: "LAG-664-TM", waybill_number: "WB-20281", waybill_date: "2026-04-05", quantity: 28, quantity_unit: "tons", sent_via: "EMAIL", sent_at: "2026-04-05T12:00:00Z", sent_to: "ap@nestle.ng", pdf_storage_path: null, pdf_url: null, created_by: null, approved_by: null, approved_at: null, created_at: "2026-04-05T11:30:00Z", updated_at: "2026-04-15T09:00:00Z",
  },
  {
    id: "demo-i-5", tenant_id: "demo", org_id: null, invoice_number: "INV-20283", waybill_id: "demo-w-z", status: "approved", customer_name: "Lafarge Africa", customer_phone: "+2348055556666", customer_email: "invoices@lafarge.ng", customer_address: "Ewekoro, Ogun", line_items: [], subtotal_ngn: 740000, tax_rate_percent: 7.5, tax_amount_ngn: 55500, discount_ngn: 0, total_ngn: 795500, amount_paid_ngn: 0, invoice_date: "2026-04-20", due_date: "2026-05-20", payment_terms: "NET 30", notes: null, origin: "Ewekoro", destination: "Sokoto", vehicle_number: "OGN-220-FH", waybill_number: "WB-20283", waybill_date: "2026-04-20", quantity: 25, quantity_unit: "tons", sent_via: null, sent_at: null, sent_to: null, pdf_storage_path: null, pdf_url: null, created_by: null, approved_by: null, approved_at: "2026-04-20T14:00:00Z", created_at: "2026-04-20T13:40:00Z", updated_at: "2026-04-20T14:00:00Z",
  },
  {
    id: "demo-i-6", tenant_id: "demo", org_id: null, invoice_number: "INV-20285", waybill_id: "demo-w-2", status: "draft", customer_name: "Nigerian Breweries", customer_phone: "+2348066667777", customer_email: "finance@nb.ng", customer_address: "Iganmu, Lagos", line_items: [], subtotal_ngn: 620000, tax_rate_percent: 7.5, tax_amount_ngn: 46500, discount_ngn: 0, total_ngn: 666500, amount_paid_ngn: 0, invoice_date: "2026-04-23", due_date: "2026-05-23", payment_terms: "NET 30", notes: null, origin: "Lagos", destination: "Port Harcourt", vehicle_number: "LAG-901-KN", waybill_number: "WB-20285", waybill_date: "2026-04-23", quantity: 18, quantity_unit: "pallets", sent_via: null, sent_at: null, sent_to: null, pdf_storage_path: null, pdf_url: null, created_by: null, approved_by: null, approved_at: null, created_at: "2026-04-23T10:30:00Z", updated_at: "2026-04-23T10:30:00Z",
  },
];

export const DEMO_PRICING_RULES: PricingRule[] = [
  {
    id: "demo-p-1", tenant_id: "demo", org_id: null, rule_name: "Lagos → Abuja • Cement", origin: "Lagos", destination: "Abuja", vehicle_type: "30-ton trailer", price_ngn: 850000, price_per_unit_ngn: 28333, unit_type: "ton", customer_name: "Dangote Cement", effective_from: "2026-01-01", effective_to: null, is_active: true, notes: "Long-term framework agreement", destination_aliases: [
      "FCT",
      "Abuja Central",
    ], pricing_mode: "FLAT", currency: "NGN", minimum_charge: 800000, created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "demo-p-2", tenant_id: "demo", org_id: null, rule_name: "Lagos → Port Harcourt • Beverages", origin: "Lagos", destination: "Port Harcourt", vehicle_type: "20-ton truck", price_ngn: 620000, price_per_unit_ngn: null, unit_type: null, customer_name: null, effective_from: "2026-02-15", effective_to: null, is_active: true, notes: null, destination_aliases: [
      "PH",
      "Rivers",
    ], pricing_mode: "FLAT", currency: "NGN", minimum_charge: null, created_at: "2026-02-15T00:00:00Z",
  },
  {
    id: "demo-p-3", tenant_id: "demo", org_id: null, rule_name: "Kaduna → Kano • Per-Ton", origin: "Kaduna", destination: "Kano", vehicle_type: "Flatbed", price_ngn: 17000, price_per_unit_ngn: 17000, unit_type: "ton", customer_name: null, effective_from: "2026-03-01", effective_to: null, is_active: true, notes: "Charged per ton above minimum", destination_aliases: [], pricing_mode: "PER_WEIGHT", currency: "NGN", minimum_charge: 380000, created_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "demo-p-4", tenant_id: "demo", org_id: null, rule_name: "Lagos → Onitsha • Flour Mills", origin: "Lagos", destination: "Onitsha", vehicle_type: "40-ton trailer", price_ngn: 720000, price_per_unit_ngn: null, unit_type: null, customer_name: "Flour Mills of Nigeria", effective_from: "2026-01-10", effective_to: "2026-12-31", is_active: true, notes: null, destination_aliases: ["Anambra"], pricing_mode: "FLAT", currency: "NGN", minimum_charge: null, created_at: "2026-01-10T00:00:00Z",
  },
  {
    id: "demo-p-5", tenant_id: "demo", org_id: null, rule_name: "Lagos → Ibadan • Express", origin: "Lagos", destination: "Ibadan", vehicle_type: "Box truck", price_ngn: 320000, price_per_unit_ngn: null, unit_type: null, customer_name: null, effective_from: "2025-11-01", effective_to: null, is_active: true, notes: "Same-day delivery rate", destination_aliases: ["Oyo"], pricing_mode: "FLAT", currency: "NGN", minimum_charge: null, created_at: "2025-11-01T00:00:00Z",
  },
  {
    id: "demo-p-6", tenant_id: "demo", org_id: null, rule_name: "Lagos → Maiduguri • Long Haul", origin: "Lagos", destination: "Maiduguri", vehicle_type: "40-ton trailer", price_ngn: 1450000, price_per_unit_ngn: null, unit_type: null, customer_name: null, effective_from: "2026-02-01", effective_to: null, is_active: false, notes: "Suspended pending security review", destination_aliases: ["Borno"], pricing_mode: "FLAT", currency: "NGN", minimum_charge: 1200000, created_at: "2026-02-01T00:00:00Z",
  },
];

-- Allow anon users (demo mode) to view waybills and invoices for the specific demo tenant
CREATE POLICY "Anon waybill select demo" 
ON waybill_records 
FOR SELECT 
TO anon 
USING (tenant_id = 'f7f5af88-fd76-4439-aae3-0461be52f63f');

CREATE POLICY "Anon invoice select demo" 
ON waybill_invoices 
FOR SELECT 
TO anon 
USING (tenant_id = 'f7f5af88-fd76-4439-aae3-0461be52f63f');

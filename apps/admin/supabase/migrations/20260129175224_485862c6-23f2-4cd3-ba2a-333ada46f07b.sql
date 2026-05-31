-- Add a permissive policy for viewing all tenants (for platform admin demo)
CREATE POLICY "Anyone can view tenants for demo" 
ON public.tenants 
FOR SELECT 
USING (true);
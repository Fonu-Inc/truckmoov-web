-- Drop existing policies and recreate with demo-friendly access
DROP POLICY IF EXISTS "Platform admins can manage phone numbers" ON public.platform_phone_numbers;

-- Allow public read access for demo
CREATE POLICY "Public can view phone numbers"
ON public.platform_phone_numbers
FOR SELECT
USING (true);

-- Allow public insert for demo
CREATE POLICY "Public can insert phone numbers"
ON public.platform_phone_numbers
FOR INSERT
WITH CHECK (true);

-- Allow public update for demo
CREATE POLICY "Public can update phone numbers"
ON public.platform_phone_numbers
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow public delete for demo
CREATE POLICY "Public can delete phone numbers"
ON public.platform_phone_numbers
FOR DELETE
USING (true);
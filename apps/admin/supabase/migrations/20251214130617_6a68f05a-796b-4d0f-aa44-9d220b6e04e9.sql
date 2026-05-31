-- Create helper functions for incrementing broadcast counts atomically
CREATE OR REPLACE FUNCTION public.increment_broadcast_delivered(broadcast_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.broadcast_messages
  SET delivered_count = delivered_count + 1
  WHERE id = broadcast_uuid;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_broadcast_read(broadcast_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.broadcast_messages
  SET read_count = read_count + 1
  WHERE id = broadcast_uuid;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_broadcast_replied(broadcast_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.broadcast_messages
  SET replied_count = replied_count + 1
  WHERE id = broadcast_uuid;
END;
$$;

-- Enable realtime for broadcast_recipients so UI updates automatically
ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcast_recipients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcast_messages;
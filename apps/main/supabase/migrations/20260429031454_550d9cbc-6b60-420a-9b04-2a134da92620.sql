-- Fix search_path on the helper installer function
ALTER FUNCTION public._attach_field_audit(text) SET search_path = public;
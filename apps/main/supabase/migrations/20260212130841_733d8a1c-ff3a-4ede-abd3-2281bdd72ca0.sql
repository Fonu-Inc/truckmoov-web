-- Add metadata column to user_invitations for storing org context
ALTER TABLE public.user_invitations ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT NULL;

-- Update handle_new_user to also create org membership and org role from invitation metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation_record RECORD;
  v_org_id uuid;
  v_org_role text;
BEGIN
  -- Check for invitation
  SELECT * INTO invitation_record
  FROM public.user_invitations
  WHERE email = NEW.email
    AND accepted_at IS NULL
    AND expires_at > now()
  LIMIT 1;

  -- Create profile
  INSERT INTO public.profiles (user_id, email, full_name, tenant_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    invitation_record.tenant_id
  );

  -- If invitation exists, create role and mark invitation as accepted
  IF invitation_record.id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, invitation_record.role);

    UPDATE public.user_invitations
    SET accepted_at = now()
    WHERE id = invitation_record.id;

    -- If invitation has org metadata, create org membership and org role
    IF invitation_record.metadata IS NOT NULL AND (invitation_record.metadata->>'org_id') IS NOT NULL THEN
      v_org_id := (invitation_record.metadata->>'org_id')::uuid;
      v_org_role := invitation_record.metadata->>'org_role';

      -- Create org membership
      INSERT INTO public.user_org_memberships (user_id, org_id, membership_status)
      VALUES (NEW.id, v_org_id, 'active')
      ON CONFLICT DO NOTHING;

      -- Create org role if specified
      IF v_org_role IS NOT NULL THEN
        INSERT INTO public.user_org_roles (user_id, org_id, role_key)
        VALUES (NEW.id, v_org_id, v_org_role)
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
-- Create function to handle new user registration from Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users_table (supabase_auth_id, updated_at)
  VALUES (
    NEW.id,
    NOW()
  );
  RETURN NEW;
END;
$$;

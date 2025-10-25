-- Update handle_new_user function to process referral code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref_code TEXT;
  referral_code_input TEXT;
BEGIN
  -- Generate unique referral code for new user
  ref_code := SUBSTRING(MD5(NEW.id::TEXT || NOW()::TEXT) FROM 1 FOR 8);
  
  -- Get referral code from user metadata
  referral_code_input := NEW.raw_user_meta_data->>'referral_code';
  
  -- Insert profile with referral info
  INSERT INTO public.profiles (id, email, referral_code, referred_by)
  VALUES (
    NEW.id, 
    NEW.email, 
    ref_code,
    referral_code_input
  );
  
  -- Assign user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;
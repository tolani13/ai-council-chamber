UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email = 'tolani13@gmail.com' 
  AND email_confirmed_at IS NULL;
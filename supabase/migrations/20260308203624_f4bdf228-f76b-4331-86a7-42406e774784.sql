-- Clean slate: remove existing user data so fresh signup gets founder role
DELETE FROM public.user_roles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'tolani13@gmail.com');
DELETE FROM public.profiles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'tolani13@gmail.com');
DELETE FROM auth.users WHERE email = 'tolani13@gmail.com';
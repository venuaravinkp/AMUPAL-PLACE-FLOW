create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id, email, full_name) values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'));
  insert into public.streaks(user_id) values (new.id);
  insert into public.user_roles(user_id, role) values (new.id, 'student');
  if lower(new.email) in ('amupaltechnologies@gmail.com','venuaravinkpcse@gmail.com') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end $$;

delete from public.user_roles r using auth.users u
 where r.user_id = u.id and r.role = 'admin'
   and lower(u.email) not in ('amupaltechnologies@gmail.com','venuaravinkpcse@gmail.com');

insert into public.user_roles(user_id, role)
select id, 'admin' from auth.users
 where lower(email) in ('amupaltechnologies@gmail.com','venuaravinkpcse@gmail.com')
on conflict do nothing;
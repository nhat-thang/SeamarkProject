-- =========================================================
-- Cho phép mỗi người tự sửa hồ sơ của chính mình (tên hiển thị,
-- số điện thoại) — nhưng CHẶN việc tự đổi cột `role` để tránh
-- học viên tự nâng quyền thành admin.
-- =========================================================

create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Không được tự đổi vai trò tài khoản';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_role_change on public.profiles;
create trigger trg_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

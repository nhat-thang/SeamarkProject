// Edge Function: tạo tài khoản học viên (chạy trên server Supabase, KHÔNG chạy
// trong trình duyệt) — vì tạo tài khoản đăng nhập cần quyền đặc biệt
// (service role key) mà trình duyệt không bao giờ được phép giữ.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function randomPassword(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const callerToken = authHeader.replace("Bearer ", "");
  if (!callerToken) {
    return jsonResponse({ error: "Thiếu thông tin đăng nhập" }, 401);
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Xác minh người gọi là ai, và họ phải là admin
  const { data: callerData, error: callerError } = await adminClient.auth.getUser(callerToken);
  if (callerError || !callerData.user) {
    return jsonResponse({ error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn" }, 401);
  }

  const { data: callerProfile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", callerData.user.id)
    .single();

  if (!callerProfile || callerProfile.role !== "admin") {
    return jsonResponse({ error: "Chỉ admin mới được tạo tài khoản học viên" }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Dữ liệu gửi lên không hợp lệ" }, 400);
  }

  const email = String(body.email || "").trim();
  const full_name = String(body.full_name || "").trim();
  const phone = body.phone ? String(body.phone).trim() : null;
  const dob = body.dob || null;
  const parent_name = body.parent_name ? String(body.parent_name).trim() : null;
  const parent_phone = body.parent_phone ? String(body.parent_phone).trim() : null;
  const campus = body.campus ? String(body.campus).trim() : null;
  const registration_request_id = body.registration_request_id || null;

  if (!email || !full_name) {
    return jsonResponse({ error: "Thiếu email hoặc họ tên học viên" }, 400);
  }

  const password = randomPassword();

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return jsonResponse({ error: createError?.message || "Không tạo được tài khoản đăng nhập" }, 400);
  }

  const studentId = created.user.id;

  const { error: profileError } = await adminClient.from("profiles").insert({
    id: studentId,
    role: "student",
    full_name,
    phone,
  });

  const { error: studentError } = await adminClient.from("students").insert({
    id: studentId,
    dob,
    parent_name,
    parent_phone,
    campus,
  });

  if (profileError || studentError) {
    await adminClient.auth.admin.deleteUser(studentId);
    return jsonResponse(
      { error: profileError?.message || studentError?.message || "Không lưu được hồ sơ học viên" },
      400
    );
  }

  if (registration_request_id) {
    await adminClient
      .from("registration_requests")
      .update({ status: "confirmed" })
      .eq("id", registration_request_id);
  }

  return jsonResponse({ student_id: studentId, email, password });
});

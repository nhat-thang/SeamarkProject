// Edge Function: admin cấp lại mật khẩu mới cho 1 học viên (dùng khi học
// viên quên mật khẩu và không đăng nhập được để tự đổi).

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
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const callerToken = authHeader.replace("Bearer ", "");
  if (!callerToken) return jsonResponse({ error: "Thiếu thông tin đăng nhập" }, 401);

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

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
    return jsonResponse({ error: "Chỉ admin mới được đặt lại mật khẩu học viên" }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Dữ liệu gửi lên không hợp lệ" }, 400);
  }

  const studentId = String(body.student_id || "");
  if (!studentId) return jsonResponse({ error: "Thiếu student_id" }, 400);

  const newPassword = randomPassword();
  const { error: updateError } = await adminClient.auth.admin.updateUserById(studentId, {
    password: newPassword,
  });

  if (updateError) {
    return jsonResponse({ error: updateError.message }, 400);
  }

  return jsonResponse({ password: newPassword });
});

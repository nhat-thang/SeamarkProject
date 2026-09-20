// =========================================================
// Form "Liên hệ / Đăng ký tư vấn" — gửi thẳng vào bảng
// registration_requests trên Supabase (không cần đăng nhập).
// Dùng chung 1 dự án Supabase với app quản lý (app/).
// =========================================================

var SUPABASE_URL = "https://xghvxamehzgjcgjrebme.supabase.co";
var SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnaHZ4YW1laHpnamNnanJlYm1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MDUxMTMsImV4cCI6MjEwNTM4MTExM30.4TuyHV9nfzM9bEhk8Cl5uQ3hr7WhxddEWqdQcPjaCEE";

document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("contactForm");
  if (!form || !window.supabase) return;

  var supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  var submitBtn = form.querySelector("button[type=submit]");
  var successBox = document.getElementById("formSuccess");
  var errorBox = document.getElementById("formError");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    errorBox.style.display = "none";
    submitBtn.disabled = true;
    submitBtn.textContent = "Đang gửi...";

    var payload = {
      full_name: form.full_name.value.trim(),
      phone: form.phone.value.trim(),
      parent_name: form.parent_name.value.trim() || null,
      course_interested: form.course_interested.value || null,
      note: form.note.value.trim() || null,
    };

    var { error } = await supabaseClient.from("registration_requests").insert(payload);

    submitBtn.disabled = false;
    submitBtn.textContent = "Gửi đăng ký tư vấn";

    if (error) {
      errorBox.textContent = "Có lỗi xảy ra, vui lòng thử lại hoặc gọi hotline. (" + error.message + ")";
      errorBox.style.display = "block";
      return;
    }

    form.reset();
    form.style.display = "none";
    successBox.style.display = "block";
  });
});

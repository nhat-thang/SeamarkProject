// =========================================================
// Anh ngữ Seamark — mobile nav + trợ lý chatbot demo (rule-based)
// =========================================================

document.addEventListener("DOMContentLoaded", function () {
  initMobileNav();
  initChatbot();
});

function initMobileNav() {
  var toggle = document.querySelector(".nav-toggle");
  var collapse = document.getElementById("navCollapse");
  if (!toggle || !collapse) return;

  toggle.addEventListener("click", function () {
    var isOpen = collapse.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  // Đóng menu khi bấm chọn 1 mục (tránh menu che màn hình sau khi điều hướng)
  collapse.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      collapse.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

// ---------------------------------------------------------
// Chatbot — kịch bản dựng sẵn (rule-based), chạy hoàn toàn
// phía trình duyệt. Sẽ được nâng cấp lên trợ lý AI thật sau.
// ---------------------------------------------------------

var CHATBOT_RULES = [
  {
    keywords: ["hoc phi", "gia tien", "chi phi", "bao nhieu tien"],
    reply:
      "Học phí tại Seamark tùy theo khoá học và lộ trình, dao động khoảng 1.500.000đ – 3.200.000đ/tháng. Bạn xem chi tiết ở trang Học phí, hoặc để lại số điện thoại ở phần Liên hệ để được báo giá chính xác theo nhu cầu nhé.",
  },
  {
    keywords: ["khai giang", "lich hoc", "khi nao hoc", "lich khai giang"],
    reply:
      "Seamark khai giảng lớp mới hằng tháng. Bạn cho mình biết độ tuổi hoặc mục tiêu học để mình gợi ý lớp gần nhất nhé!",
  },
  {
    keywords: ["dia chi", "o dau", "co so", "chi nhanh"],
    reply:
      "Seamark có 2 cơ sở: CS1 - 172 Nguyễn Du, TP Vinh và CS2 - Khối 7, TT Cầu Giát, Huyện Quỳnh Lưu, Nghệ An.",
  },
  {
    keywords: ["khoa hoc", "lop hoc", "chuong trinh"],
    reply:
      "Seamark hiện có các khoá: Anh ngữ Thiếu nhi, Anh ngữ Thiếu niên, Luyện thi IELTS và Giao tiếp cho người đi làm. Bạn đang quan tâm khoá nào để mình tư vấn chi tiết hơn?",
  },
  {
    keywords: ["dang ky", "tu van", "lien he", "so dien thoai"],
    reply:
      "Bạn để lại số điện thoại ở form Liên hệ hoặc gọi hotline, Seamark sẽ liên hệ tư vấn miễn phí trong vòng 24h nhé!",
  },
  {
    keywords: ["giao vien", "gv", "thay co"],
    reply:
      "Đội ngũ giáo viên Seamark gồm giáo viên bản ngữ và giáo viên Việt Nam giàu kinh nghiệm. Bạn xem chi tiết ở trang Đội ngũ giáo viên nhé.",
  },
  {
    keywords: ["cam on", "thanks", "cảm ơn"],
    reply: "Rất vui được hỗ trợ bạn! Nếu cần thêm thông tin gì cứ nhắn cho mình nhé.",
  },
];

var FALLBACK_REPLY =
  "Mình chưa rõ câu hỏi này lắm. Bạn có thể gọi hotline hoặc nhắn Zalo để được tư vấn viên hỗ trợ trực tiếp, hoặc thử chọn 1 trong các câu gợi ý bên dưới nhé!";

var GREETING =
  "Xin chào, mình là Sea — trợ lý tư vấn của Anh ngữ Seamark. Mình có thể giúp gì cho bạn? Bạn chọn câu hỏi bên dưới hoặc nhập câu hỏi của riêng bạn nhé.";

var QUICK_REPLIES = [
  "Học phí",
  "Lịch khai giảng",
  "Địa chỉ trung tâm",
  "Các khoá học",
  "Đăng ký tư vấn",
];

function normalizeVN(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

function matchReply(text) {
  var normalized = normalizeVN(text);
  for (var i = 0; i < CHATBOT_RULES.length; i++) {
    var rule = CHATBOT_RULES[i];
    for (var j = 0; j < rule.keywords.length; j++) {
      if (normalized.indexOf(normalizeVN(rule.keywords[j])) !== -1) {
        return rule.reply;
      }
    }
  }
  return FALLBACK_REPLY;
}

function initChatbot() {
  var toggleBtn = document.getElementById("chatToggle");
  var panel = document.getElementById("chatPanel");
  var closeBtn = document.getElementById("chatClose");
  var messages = document.getElementById("chatMessages");
  var quickRepliesEl = document.getElementById("chatQuickReplies");
  var form = document.getElementById("chatForm");
  var input = document.getElementById("chatInput");

  if (!toggleBtn || !panel) return;

  var hasGreeted = false;

  function openPanel() {
    panel.classList.add("is-open");
    if (!hasGreeted) {
      hasGreeted = true;
      renderQuickReplies();
      addMessage(GREETING, "bot");
    }
    input.focus();
  }

  function closePanel() {
    panel.classList.remove("is-open");
  }

  toggleBtn.addEventListener("click", function () {
    if (panel.classList.contains("is-open")) {
      closePanel();
    } else {
      openPanel();
    }
  });

  if (closeBtn) closeBtn.addEventListener("click", closePanel);

  // Nút "Trò chuyện với trợ lý ngay" ở section spotlight trên trang chủ
  document.querySelectorAll("[data-open-chat]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      openPanel();
    });
  });

  function addMessage(text, sender) {
    var el = document.createElement("div");
    el.className = "msg " + sender;
    el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
  }

  function showTypingThenReply(userText) {
    var typingEl = document.createElement("div");
    typingEl.className = "msg bot typing";
    typingEl.innerHTML = "<span></span><span></span><span></span>";
    messages.appendChild(typingEl);
    messages.scrollTop = messages.scrollHeight;

    setTimeout(function () {
      typingEl.remove();
      addMessage(matchReply(userText), "bot");
    }, 550);
  }

  function renderQuickReplies() {
    quickRepliesEl.innerHTML = "";
    QUICK_REPLIES.forEach(function (label) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.textContent = label;
      chip.addEventListener("click", function () {
        addMessage(label, "user");
        showTypingThenReply(label);
      });
      quickRepliesEl.appendChild(chip);
    });
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text) return;
      addMessage(text, "user");
      input.value = "";
      showTypingThenReply(text);
    });
  }
}

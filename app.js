/**
 * Editorial Minimal Interactive Engine & Content Hydration
 * Reads from Single Source of Truth (site/data/content.json)
 */

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Attempt dynamic hydration from Single Source of Truth (content.json)
  try {
    const res = await fetch("data/content.json");
    if (res.ok) {
      const data = await res.json();
      hydrateContent(data);
    }
  } catch (err) {
    // When opened directly via file://, browser CORS may prevent fetch;
    // pre-rendered semantic HTML serves as the deterministic fallback.
    console.info("Pre-rendered static HTML active (Offline/file protocol mode).");
  }

  // 2. Paper Modal Reader Controller
  const modalOverlay = document.getElementById("paper-modal");
  const modalClose = document.getElementById("modal-close-btn");
  const modalContent = document.getElementById("modal-paper-body");
  const openButtons = document.querySelectorAll(".open-paper-modal");

  openButtons.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      modalOverlay.classList.add("active");
      document.body.style.overflow = "hidden";

      if (modalContent.dataset.loaded !== "true") {
        modalContent.innerHTML = "<p>논문 원문을 불러오는 중입니다...</p>";
        try {
          const pRes = await fetch("docs/T10_PAPER.md");
          if (pRes.ok) {
            const rawMd = await pRes.text();
            modalContent.innerHTML = `<pre style="white-space: pre-wrap; font-family: var(--font-body); font-size: 0.95rem; line-height: 1.8;">${escapeHtml(rawMd)}</pre>`;
            modalContent.dataset.loaded = "true";
          } else {
            modalContent.innerHTML = `<p>원문을 바로 확인하시려면 <a href="docs/T10_PAPER.md" target="_blank">여기(T10_PAPER.md)</a>를 클릭하세요.</p>`;
          }
        } catch (err) {
          modalContent.innerHTML = `<p>원문 파일: <a href="docs/T10_PAPER.md" target="_blank">docs/T10_PAPER.md 다운로드 또는 새 창 열기</a></p>`;
        }
      }
    });
  });

  const closeModal = () => {
    modalOverlay.classList.remove("active");
    document.body.style.overflow = "";
  };

  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalOverlay.classList.contains("active")) {
      closeModal();
    }
  });
});

/**
 * Hydrates DOM elements from JSON data
 */
function hydrateContent(data) {
  if (!data) return;

  // Profile elements
  if (data.profile) {
    setText("profile-name", data.profile.name);
    setText("profile-role", data.profile.role);
    setText("profile-one-line", data.profile.one_line);
    setText("footer-contact-link", data.profile.email);
    setHref("footer-contact-link", `mailto:${data.profile.email}`);
  }

  // Story elements
  if (data.story && Array.isArray(data.story.paragraphs)) {
    const container = document.getElementById("story-flow-container");
    if (container) {
      container.innerHTML = data.story.paragraphs
        .map(
          (p) => `
        <article class="story-item" id="story-${p.id}">
          <div class="story-header">
            <time class="story-date">${p.date}</time>
            <span class="story-tag">${p.tag}</span>
            <span class="story-competency">[${p.competency}]</span>
          </div>
          <h3>${p.title}</h3>
          <p>${p.text}</p>
        </article>
      `
        )
        .join("");
    }
  }

  // Metrics elements
  if (data.metrics) {
    if (Array.isArray(data.metrics.items)) {
      const metricsContainer = document.getElementById("metrics-row-container");
      if (metricsContainer) {
        metricsContainer.innerHTML = data.metrics.items
          .map(
            (m) => `
          <div class="metric-text-item">
            <div class="metric-value">${m.value}</div>
            <div class="metric-label">${m.label}</div>
            <div class="metric-detail">${m.detail}</div>
            <div class="metric-source">출처: ${m.source}</div>
          </div>
        `
          )
          .join("");
      }
    }

    if (data.metrics.hardship_coupling) {
      const c = data.metrics.hardship_coupling;
      setText("hardship-card-title", `${c.matched_date} 고난 장면과 숫자의 짝짓기`);
      setText("hardship-card-record", `${c.matched_record} (${c.matched_source})`);
      setText("hardship-card-text", c.scene_explanation);
    }
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el && text) el.textContent = text;
}

function setHref(id, href) {
  const el = document.getElementById(id);
  if (el && href) el.href = href;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

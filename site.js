(function () {
  const key = "portfolioAdminData";
  const data = normalizeData(merge(clone(window.DEFAULT_PORTFOLIO), loadSavedData()));

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadJson(storageKey, fallback) {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || JSON.stringify(fallback));
    } catch (error) {
      localStorage.removeItem(storageKey);
      return fallback;
    }
  }

  function loadSavedData() {
    const saved = loadJson(key, {});
    if (!saved || saved._version !== window.DEFAULT_PORTFOLIO._version) {
      localStorage.removeItem(key);
      return {};
    }
    return saved;
  }

  function merge(base, saved) {
    Object.keys(saved || {}).forEach((name) => {
      if (saved[name] && typeof saved[name] === "object" && !Array.isArray(saved[name]) && base[name] && !Array.isArray(base[name])) merge(base[name], saved[name]);
      else base[name] = saved[name];
    });
    return base;
  }

  function normalizeData(source) {
    const defaults = window.DEFAULT_PORTFOLIO;
    source._version = defaults._version;
    source.site = source.site && typeof source.site === "object" ? source.site : clone(defaults.site);
    source.theme = source.theme && typeof source.theme === "object" ? source.theme : clone(defaults.theme);
    source.typography = source.typography && typeof source.typography === "object" ? source.typography : clone(defaults.typography);
    source.textAlign = source.textAlign && typeof source.textAlign === "object" ? source.textAlign : clone(defaults.textAlign);
    source.hero = source.hero && typeof source.hero === "object" ? source.hero : clone(defaults.hero);
    source.media = source.media && typeof source.media === "object" ? source.media : clone(defaults.media);
    source.about = source.about && typeof source.about === "object" ? source.about : clone(defaults.about);
    source.contact = source.contact && typeof source.contact === "object" ? source.contact : clone(defaults.contact);
    ["stats", "languages", "experience", "education", "skills", "works", "socials"].forEach((name) => {
      if (!Array.isArray(source[name])) source[name] = clone(defaults[name]);
    });
    if (!source.socials.length && source.contact && source.contact.socialsText) {
      source.socials = source.contact.socialsText.split(",").map((item) => item.trim()).filter(Boolean).map((label) => ({
        label,
        url: "#",
        image: ""
      }));
    }
    return merge(clone(defaults), source);
  }

  function get(path) {
    return path.split(".").reduce((obj, part) => obj && obj[part], data);
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  function safeUrl(value) {
    const url = String(value || "").trim();
    if (!url) return "#";
    if (/^(https?:|mailto:|tel:)/i.test(url)) return url;
    return `https://${url.replace(/^\/+/, "")}`;
  }

  function safeAlign(value) {
    return ["left", "center", "right", "justify"].includes(value) ? value : "left";
  }

  function alignValue(path) {
    return safeAlign(get(path));
  }

  function alignStyle(key) {
    return `text-align: ${safeAlign(data.textAlign && data.textAlign[key])}`;
  }

  function flexJustify(value) {
    if (value === "center") return "center";
    if (value === "right") return "flex-end";
    return "flex-start";
  }

  function applyTheme() {
    const root = document.documentElement;
    root.style.setProperty("--accent", data.theme.accent);
    root.style.setProperty("--ink", data.theme.ink);
    root.style.setProperty("--paper", data.theme.paper);
    root.style.setProperty("--soft", data.theme.soft);
    root.style.setProperty("--font", data.typography.font || data.theme.font);
    applyTypography(root, data.typography);
  }

  function applyTypography(root, typography) {
    const values = typography || {};
    setPx(root, "--base-size", values.baseSize, 16, 12, 24);
    setPx(root, "--small-size", values.smallSize, 14, 10, 20);
    setPx(root, "--hero-kicker-size", values.heroKickerSize, 56, 12, 90);
    setPx(root, "--hero-title-size", values.heroTitleSize, 76, 34, 96);
    setPx(root, "--hero-bio-size", values.heroBioSize, 18, 13, 28);
    setPx(root, "--section-title-size", values.sectionTitleSize, 42, 24, 58);
    setPx(root, "--card-title-size", values.cardTitleSize, 18, 13, 28);
    setPx(root, "--about-size", values.aboutSize, 16, 12, 28);
    setPx(root, "--experience-size", values.experienceSize, 16, 12, 28);
    setPx(root, "--education-size", values.educationSize, 16, 12, 28);
    setPx(root, "--work-size", values.workSize, 16, 12, 28);
    setPx(root, "--contact-size", values.contactSize, 16, 12, 28);
  }

  function setPx(root, name, value, fallback, min, max) {
    const scale = Math.min(140, Math.max(75, Number(data.typography && data.typography.globalScale) || 100)) / 100;
    const number = Math.min(max, Math.max(min, Number(value) || fallback)) * scale;
    root.style.setProperty(name, `${number}px`);
  }

  function text() {
    document.querySelectorAll("[data-text]").forEach((el) => (el.textContent = get(el.dataset.text) || ""));
    document.querySelectorAll("[data-align]").forEach((el) => {
      const value = alignValue(el.dataset.align);
      el.style.textAlign = value;
      if (el.classList.contains("language-row") || el.classList.contains("contact-strip")) {
        el.style.justifyContent = flexJustify(value);
      }
      if (el.classList.contains("contact-strip")) {
        const socials = el.querySelector(".socials");
        if (socials) socials.style.marginLeft = value === "left" || value === "justify" ? "auto" : "0";
      }
      if (el.classList.contains("contact-form")) {
        const button = el.querySelector("button");
        if (button) button.style.justifySelf = value === "right" ? "end" : value === "center" ? "center" : "start";
      }
    });
    document.querySelectorAll("[data-src]").forEach((el) => {
      const src = get(el.dataset.src);
      if (src) el.src = src;
    });
    document.querySelectorAll("[data-video]").forEach((el) => {
      const src = get(el.dataset.video);
      el.src = src || "";
      const block = el.closest("[data-video-block]");
      if (block) block.hidden = !src;
    });
  }

  const dots = (rating) => Array.from({ length: 5 }, (_, i) => `<span class="${i < Number(rating) ? "on" : ""}"></span>`).join("");

  function render() {
    const stats = document.querySelector('[data-repeat="stats"]');
    if (stats) stats.innerHTML = data.stats.map((item) => `<article style="${alignStyle("stats")}"><strong>${escapeHtml(item.value)}</strong><span>${escapeHtml(item.label)}</span></article>`).join("");

    const languages = document.querySelector('[data-repeat="languages"]');
    if (languages) languages.innerHTML = `<span class="language-title">Language</span>${data.languages.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}`;

    const exp = document.querySelector('[data-repeat="experience"]');
    if (exp) exp.innerHTML = data.experience.map((item) => `
      <article style="${alignStyle("experience")}">
        <div><strong>${escapeHtml(item.year)}</strong><span>${escapeHtml(item.role)}</span></div>
        <div class="company"><b>${escapeHtml(item.company)}</b><span>${escapeHtml(item.type)}</span></div>
        <p>${escapeHtml(item.desc)}</p>
      </article>`).join("");

    const edu = document.querySelector('[data-repeat="education"]');
    if (edu) edu.innerHTML = data.education.map((item) => `<article style="${alignStyle("education")}"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.desc)}</p></article>`).join("");

    const skills = document.querySelector('[data-repeat="skills"]');
    if (skills) skills.innerHTML = data.skills.map((item) => `
      <article style="${alignStyle("skills")}">
        ${item.image ? `<img class="skill-image" src="${escapeAttr(item.image)}" alt="${escapeAttr(item.title)}">` : `<div class="skill-icon">${escapeHtml(item.icon)}</div>`}
        <h3>${escapeHtml(item.title)}</h3>
        <div class="rating">${dots(item.rating)}</div>
      </article>`).join("");

    const works = document.querySelector('[data-repeat="works"]');
    if (works) works.innerHTML = data.works.map((item) => `
      <article style="${alignStyle("works")}">
        ${item.image ? `<img src="${escapeAttr(item.image)}" alt="${escapeAttr(item.title)}">` : `<div class="work-blank"></div>`}
        <h3>${escapeHtml(item.title)}</h3>
        <p>Client: ${escapeHtml(item.client)}</p>
      </article>`).join("");

    const socials = Array.isArray(data.socials) && data.socials.length
      ? data.socials
      : (data.contact.socialsText || "").split(",").map((item) => item.trim()).filter(Boolean).map((label) => ({ label, url: "#", image: "" }));
    document.querySelectorAll("[data-socials]").forEach((el) => {
      el.innerHTML = socials.map((item) => {
        const label = item.label || "Link";
        const image = item.image ? `<img src="${escapeAttr(item.image)}" alt="">` : escapeHtml(label.charAt(0));
        return `<a href="${escapeAttr(safeUrl(item.url))}" title="${escapeAttr(label)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeAttr(label)}">${image}</a>`;
      }).join("");
    });
  }

  function bindContactForm() {
    const form = document.getElementById("contactForm");
    const status = document.getElementById("contactStatus");
    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const formData = new FormData(form);
      const message = {
        name: formData.get("name").trim(),
        phone: formData.get("phone").trim(),
        email: formData.get("email").trim(),
        message: formData.get("message").trim(),
        date: new Date().toLocaleString()
      };

      const messages = loadJson("portfolioMessages", []);
      messages.unshift(message);
      try {
        localStorage.setItem("portfolioMessages", JSON.stringify(messages));
      } catch (error) {
        status.textContent = "Message is ready, but browser storage is full. Opening email draft now.";
      }

      const to = data.contact.email || "hello@example.com";
      const subject = encodeURIComponent(`Portfolio message from ${message.name}`);
      const body = encodeURIComponent(`Name: ${message.name}\nPhone: ${message.phone}\nEmail: ${message.email}\n\nMessage:\n${message.message}`);
      status.textContent = "Message saved. Opening email draft now.";
      location.href = `mailto:${to}?subject=${subject}&body=${body}`;
      form.reset();
    });
  }

  function bindResumeDownload() {
    const button = document.querySelector("[data-resume-download]");
    if (!button) return;

    button.addEventListener("click", (event) => {
      event.preventDefault();
      const originalText = button.textContent;
      const current = normalizeData(merge(clone(window.DEFAULT_PORTFOLIO), loadSavedData()));
      button.textContent = "Preparing Resume...";
      downloadResumePdf(current);
      setTimeout(() => {
        button.textContent = originalText;
      }, 1200);
    });
  }

  function cleanText(value) {
    return String(value || "").replace(/[^\x20-\x7E\n]/g, " ").replace(/\s+/g, " ").trim();
  }

  function pdfText(value) {
    return cleanText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  }

  function downloadResumePdf(resume) {
    const pageWidth = 595;
    const pageHeight = 842;
    const left = 48;
    const right = 48;
    const bottom = 56;
    const maxWidth = pageWidth - left - right;
    const pages = [[]];
    let y = 790;

    function activePage() {
      return pages[pages.length - 1];
    }

    function newPage() {
      pages.push([]);
      y = 790;
    }

    function line(text, size, font, x) {
      if (y < bottom) newPage();
      activePage().push(`BT /${font} ${size} Tf ${x || left} ${y} Td (${pdfText(text)}) Tj ET`);
      y -= size + 6;
    }

    function wrap(text, size) {
      const chars = Math.max(32, Math.floor(maxWidth / (size * 0.48)));
      const words = cleanText(text).split(" ");
      const rows = [];
      let row = "";
      words.forEach((word) => {
        const next = row ? `${row} ${word}` : word;
        if (next.length > chars) {
          if (row) rows.push(row);
          row = word;
        } else {
          row = next;
        }
      });
      if (row) rows.push(row);
      return rows;
    }

    function paragraph(text, size) {
      wrap(text, size).forEach((row) => line(row, size, "F1"));
      y -= 6;
    }

    function section(title) {
      y -= 6;
      line(title.toUpperCase(), 12, "F2");
      activePage().push(`${left} ${y + 7} ${maxWidth} 0.7 re f`);
      y -= 8;
    }

    const name = cleanText(resume.hero.intro).replace(/^i'?m\s+/i, "") || "Your Name";
    line(name, 28, "F2");
    line(resume.hero.title || "Your Professional Title", 16, "F1");
    paragraph(`${resume.contact.email} | ${resume.contact.phone} | ${resume.contact.website}`, 10);

    section("Profile");
    paragraph(resume.hero.bio, 10);

    section("About");
    paragraph(resume.about.text, 10);

    section("Highlights");
    paragraph(resume.stats.map((item) => `${item.value} ${item.label}`).join(" | "), 10);

    section("Experience");
    resume.experience.forEach((item) => {
      line(`${item.year} - ${item.role}`, 11, "F2");
      line(`${item.company} | ${item.type}`, 10, "F1");
      paragraph(item.desc, 10);
    });

    section("Education");
    resume.education.forEach((item) => {
      line(item.title, 10, "F2");
      paragraph(item.desc, 10);
    });

    section("Skills");
    paragraph(resume.skills.map((item) => item.title).join(", "), 10);

    section("Selected Works");
    paragraph(resume.works.map((item) => `${item.title} (${item.client})`).join(", "), 10);

    const objects = [];
    objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
    objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
    objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

    const kids = [];
    let objectId = 5;
    pages.forEach((content) => {
      const pageId = objectId++;
      const contentId = objectId++;
      kids.push(`${pageId} 0 R`);
      const stream = content.join("\n");
      objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
      objects[contentId] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    });
    objects[2] = `<< /Type /Pages /Kids [${kids.join(" ")}] /Count ${pages.length} >>`;

    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    for (let i = 1; i < objects.length; i += 1) {
      offsets[i] = pdf.length;
      pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
    }
    const xref = pdf.length;
    pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
    for (let i = 1; i < objects.length; i += 1) {
      pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

    const blob = new Blob([pdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name.replace(/[^a-z0-9]+/gi, "-") || "resume"}-resume.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  applyTheme();
  text();
  render();
  bindContactForm();
  bindResumeDownload();
})();

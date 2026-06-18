(function () {
  if (sessionStorage.getItem("portfolioAdminLoggedIn") !== "true") {
    location.href = "login.html";
    return;
  }

  const key = "portfolioAdminData";
  let data = normalizeData(merge(clone(window.DEFAULT_PORTFOLIO), loadSavedData()));
  const toast = document.getElementById("saveToast");

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
        url: "",
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

  function set(path, value) {
    const parts = path.split(".");
    const last = parts.pop();
    const target = parts.reduce((obj, part) => obj[part], data);
    const previous = target[last];
    target[last] = value;
    if (!save()) {
      target[last] = previous;
      return false;
    }
    return true;
  }

  function save() {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      showToast("File too large to save in this browser. Use a smaller image or video.");
      return false;
    }
    document.documentElement.style.setProperty("--accent", data.theme.accent);
    document.documentElement.style.setProperty("--ink", data.theme.ink);
    document.documentElement.style.setProperty("--paper", data.theme.paper);
    document.documentElement.style.setProperty("--soft", data.theme.soft);
    document.documentElement.style.setProperty("--font", data.typography.font || data.theme.font);
    applyTypography(document.documentElement, data.typography);
    document.querySelector("[data-admin-logo]").textContent = data.site.logo;
    showToast("Saved");
    return true;
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

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(save.timer);
    save.timer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function bindFields() {
    document.querySelectorAll("[data-align-select]").forEach((select) => {
      select.innerHTML = `
        <option value="left">Left</option>
        <option value="center">Center</option>
        <option value="right">Right</option>
        <option value="justify">Justify</option>
      `;
    });
    document.querySelectorAll("[data-field]").forEach((input) => {
      input.value = get(input.dataset.field) || "";
      input.addEventListener("input", () => {
        if (!set(input.dataset.field, input.value)) {
          input.value = get(input.dataset.field) || "";
          return;
        }
        syncFieldInputs(input.dataset.field, input.value, input);
      });
    });
    document.querySelectorAll("[data-upload]").forEach((input) => {
      input.addEventListener("change", () => {
        const file = input.files[0];
        if (!file) return;
        if (!validUpload(file)) {
          input.value = "";
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          set(input.dataset.upload, reader.result);
          input.value = "";
          refreshPreviews();
        };
        reader.readAsDataURL(file);
      });
    });
  }

  function syncFieldInputs(path, value, source) {
    document.querySelectorAll(`[data-field="${path}"]`).forEach((input) => {
      if (input !== source) input.value = value;
    });
  }

  function refreshPreviews() {
    document.querySelectorAll("[data-preview]").forEach((img) => (img.src = get(img.dataset.preview) || ""));
    document.querySelectorAll("[data-preview-video]").forEach((video) => {
      video.src = get(video.dataset.previewVideo) || "";
      video.style.display = video.src ? "block" : "none";
    });
  }

  function validUpload(file) {
    const isVideo = file.type.startsWith("video/");
    const maxSize = isVideo ? 4 * 1024 * 1024 : 2 * 1024 * 1024;
    if (file.size <= maxSize) return true;
    showToast(isVideo ? "Use a video under 4 MB." : "Use an image under 2 MB.");
    return false;
  }

  const schemas = {
    stats: ["value", "label"],
    experience: ["year", "role", "company", "type", "desc"],
    education: ["title", "desc"],
    skills: ["title", "icon", "rating", "image"],
    works: ["title", "client", "image"],
    socials: ["label", "url", "image"]
  };

  function renderObjectList(name) {
    const host = document.querySelector(`[data-list-editor="${name}"]`);
    if (!host) return;
    host.innerHTML = data[name].map((item, index) => `
      <article class="edit-card">
        <div class="edit-card-head"><strong>${escapeHtml(name)} ${index + 1}</strong><button data-remove="${name}:${index}">Remove</button></div>
        <div class="editor-grid">
          ${schemas[name].map((field) => `<label>${field}<${field === "desc" ? "textarea" : "input"} data-array="${name}:${index}:${field}" ${field === "image" ? 'placeholder="Paste image URL or upload below"' : ""}>${field === "desc" ? `</textarea>` : ""}</label>`).join("")}
          ${name === "works" ? `<label>Upload work image<input type="file" accept="image/*" data-array-upload="${name}:${index}:image" /></label>` : ""}
          ${name === "skills" ? `<label>Upload skill image<input type="file" accept="image/*" data-array-upload="${name}:${index}:image" /></label>` : ""}
          ${name === "socials" ? `<label>Upload button image<input type="file" accept="image/*" data-array-upload="${name}:${index}:image" /></label>` : ""}
        </div>
      </article>`).join("") + `<button class="add-button" data-add="${name}">Add ${name}</button>`;

    host.querySelectorAll("[data-array]").forEach((input) => {
      const [list, index, field] = input.dataset.array.split(":");
      input.value = data[list][index][field] || "";
      input.addEventListener("input", () => {
        const previous = data[list][index][field];
        data[list][index][field] = input.value;
        if (!save()) {
          data[list][index][field] = previous;
          input.value = previous || "";
        }
      });
    });
    host.querySelectorAll("[data-array-upload]").forEach((input) => {
      input.addEventListener("change", () => {
        const [list, index, field] = input.dataset.arrayUpload.split(":");
        const file = input.files[0];
        if (!file) return;
        if (!validUpload(file)) {
          input.value = "";
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const previous = data[list][index][field];
          data[list][index][field] = reader.result;
          if (!save()) data[list][index][field] = previous;
          input.value = "";
          renderAllLists();
        };
        reader.readAsDataURL(file);
      });
    });
  }

  function renderSimpleList(name) {
    const host = document.querySelector(`[data-simple-list="${name}"]`);
    if (!host) return;
    host.innerHTML = data[name].map((item, index) => `
      <div class="inline-edit"><input data-simple="${name}:${index}" value="${escapeAttr(item)}"><button data-simple-remove="${name}:${index}">Remove</button></div>`).join("") + `<button class="add-button" data-simple-add="${name}">Add language</button>`;
  }

  function renderAllLists() {
    Object.keys(schemas).forEach(renderObjectList);
    renderSimpleList("languages");
    renderMessages();
  }

  function renderMessages() {
    const host = document.getElementById("messageList");
    if (!host) return;
    const messages = loadJson("portfolioMessages", []);
    host.innerHTML = messages.length ? messages.map((item) => `
      <article class="message-card">
        <div><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.date)}</span></div>
        <p>${escapeHtml(item.message)}</p>
        <small>${escapeHtml(item.email)} | ${escapeHtml(item.phone)}</small>
      </article>`).join("") : `<p class="empty-state">No messages yet.</p>`;
  }

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (target.matches("[data-panel]")) {
      document.querySelectorAll("[data-panel], .admin-panel").forEach((el) => el.classList.remove("active"));
      target.classList.add("active");
      document.getElementById(`panel-${target.dataset.panel}`).classList.add("active");
    }
    if (target.matches("[data-add]")) {
      const name = target.dataset.add;
      data[name].push(Object.fromEntries(schemas[name].map((field) => [field, field === "rating" ? "4" : ""])));
      renderAllLists();
      save();
    }
    if (target.matches("[data-remove]")) {
      const [name, index] = target.dataset.remove.split(":");
      data[name].splice(index, 1);
      renderAllLists();
      save();
    }
    if (target.matches("[data-simple-add]")) {
      data[target.dataset.simpleAdd].push("New language");
      renderAllLists();
      save();
    }
    if (target.matches("[data-simple-remove]")) {
      const [name, index] = target.dataset.simpleRemove.split(":");
      data[name].splice(index, 1);
      renderAllLists();
      save();
    }
  });

  document.addEventListener("input", (event) => {
    if (!event.target.matches("[data-simple]")) return;
    const [name, index] = event.target.dataset.simple.split(":");
    const previous = data[name][index];
    data[name][index] = event.target.value;
    if (!save()) {
      data[name][index] = previous;
      event.target.value = previous || "";
    }
  });

  document.getElementById("resetSite").addEventListener("click", () => {
    localStorage.removeItem(key);
    location.reload();
  });

  document.getElementById("logoutAdmin").addEventListener("click", () => {
    sessionStorage.removeItem("portfolioAdminLoggedIn");
    location.href = "index.html";
  });

  document.getElementById("clearMessages").addEventListener("click", () => {
    localStorage.removeItem("portfolioMessages");
    renderMessages();
  });

  bindFields();
  renderAllLists();
  refreshPreviews();
  save();
})();

const params = new URLSearchParams(window.location.search);
const projectId = params.get("id");
const project = portfolioProjects[projectId];

const title = document.querySelector("#project-title");
const area = document.querySelector("#project-area");
const description = document.querySelector("#project-description");
const stage = document.querySelector("#project-stage");

function setText(node, text) {
  node.textContent = text || "";
}

function getExtension(source) {
  return source.split("?")[0].split(".").pop().toLowerCase();
}

function buildLivePreview(item) {
  const preview = item.preview || item.src;
  const extension = getExtension(preview);

  if (["mp4", "webm", "mov"].includes(extension)) {
    return `<video class="project-video project-live-preview" src="${preview}" autoplay muted loop playsinline></video>`;
  }

  if (["jpg", "jpeg", "png", "webp", "gif"].includes(extension)) {
    return `<img class="project-image project-live-preview" src="${preview}" alt="${item.title}">`;
  }

  return `
    <div class="document-preview project-document">
      <strong>${item.kind}</strong>
      <span>${item.title}</span>
    </div>
  `;
}

function buildStage(item) {
  const source = item.src;
  const extension = getExtension(source);

  if (item.live) {
    if (projectId === "quebra-jazz") {
      stage.innerHTML = `
        <div class="project-actions">
          <a class="open-source" href="${item.src}" target="_blank" rel="noreferrer">Abrir site</a>
        </div>
      `;
      appendProjectGallery(item);
      return;
    }

    const demoVideo = item.video || (
      ["mp4", "webm", "mov"].includes(getExtension(item.preview || ""))
        ? item.preview
        : ""
    );

    stage.innerHTML = `
      <div class="project-actions">
        <a class="open-source" href="${item.src}" target="_blank" rel="noreferrer">Abrir site</a>
      </div>
    `;
    appendProjectGallery(item);
    appendProjectVideo({
      ...item,
      video: demoVideo
    });
    return;
  }

  if (["mp4", "webm", "mov"].includes(extension)) {
    stage.innerHTML = `
      <video class="project-video" src="${item.src}" controls autoplay playsinline></video>
    `;
    return;
  }

  if (extension === "pdf") {
    stage.innerHTML = `
      <iframe class="project-frame" src="${item.src}" title="${item.title}"></iframe>
    `;
    return;
  }

  if (["jpg", "jpeg", "png", "webp", "gif"].includes(extension)) {
    if (item.gallery?.length) {
      const galleryImages = item.showSrcInGallery === false
        ? item.gallery
        : [item.src, ...item.gallery];

      stage.innerHTML = "";
      appendProjectGallery({
        ...item,
        gallery: galleryImages
      });
      return;
    }

    stage.innerHTML = `
      <img class="project-image" src="${source}" alt="${item.title}">
    `;
    return;
  }

  stage.innerHTML = `
    <div class="document-preview project-document">
      <strong>${item.kind}</strong>
      <span>${item.title}</span>
    </div>
  `;
}

function renderList(items) {
  return items.map((item) => `<li>${item}</li>`).join("");
}

function buildProjectInfo(item) {
  if (!item.details) {
    return "";
  }

  const details = item.details;
  const tools = details.tools?.length
    ? `
      <div class="project-detail-block">
        <h3>Tools</h3>
        <ul class="project-tags">${renderList(details.tools)}</ul>
      </div>
    `
    : "";
  const colors = details.colors?.length
    ? `
      <div class="project-detail-block">
        <h3>Colors</h3>
        <ul class="color-list">
          ${details.colors.map((color) => `
            <li>
              <span class="color-swatch" style="--swatch: ${color}"></span>
              <span>${color}</span>
            </li>
          `).join("")}
        </ul>
      </div>
    `
    : "";

  return `
    <article class="project-info">
      <div class="project-detail-block">
        <h2>Project details</h2>
        <dl class="project-facts">
          ${details.year ? `<div><dt>Year</dt><dd>${details.year}</dd></div>` : ""}
          ${details.role ? `<div><dt>Role</dt><dd>${details.role}</dd></div>` : ""}
          ${details.typography ? `<div><dt>Typography</dt><dd>${details.typography}</dd></div>` : ""}
        </dl>
      </div>
      ${tools}
      ${colors}
    </article>
  `;
}

function buildDescription(item) {
  const projectInfo = buildProjectInfo(item);

  if (!item.description && !projectInfo) {
    description.hidden = true;
    description.innerHTML = "";
    return;
  }

  const concept = typeof item.description === "string"
    ? item.description
    : item.description?.concept || item.description?.feito || "";

  description.hidden = false;
  description.innerHTML = `
    ${projectInfo}
    ${concept ? `
      <article class="project-concept">
        <h2>Concept</h2>
        <p>${concept}</p>
      </article>
    ` : ""}
  `;
}

function appendProjectGallery(item) {
  if (!item.gallery?.length) {
    return;
  }

  const gallery = document.createElement("section");
  const galleryClass = projectId === "safelink"
    ? "project-gallery--safelink"
    : projectId === "between-lines"
      ? "project-gallery--between-lines"
      : "";

  gallery.className = ["project-gallery", galleryClass].filter(Boolean).join(" ");
  gallery.setAttribute("aria-label", "Project images");
  gallery.innerHTML = item.gallery
    .map((image, index) => `<a href="${image}" target="_blank" rel="noreferrer"><img src="${image}" alt="${item.title} ${index + 1}"></a>`)
    .join("");
  stage.append(gallery);
}

function appendProjectVideo(item) {
  if (!item.video) {
    return;
  }

  const videoBlock = document.createElement("section");
  videoBlock.className = "project-extra";
  videoBlock.innerHTML = `
    <video class="project-video" src="${item.video}" controls playsinline></video>
  `;
  stage.append(videoBlock);
}

if (!project) {
  setText(title, "Project not found");
  setText(area, "Portfolio");
  stage.innerHTML = `<a class="open-source" href="index.html#projects">View all projects</a>`;
} else {
  document.title = `${project.title} | Laura Freire`;
  setText(title, project.title);
  setText(area, project.area);
  buildDescription(project);
  buildStage(project);
}

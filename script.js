const STORAGE_KEY = "cineflow-projects";
const SCHEMA_STORAGE_KEY = "cineflow-project-schema";
const STAGES = [
  { id: "Pre-Sale", label: "Pre-Sale" },
  { id: "Девелопмент", label: "Девелопмент" },
  { id: "Пре-продакшн", label: "Пре-продакшн" },
  { id: "Продакшн", label: "Продакшн" },
  { id: "Пост-продакшн", label: "Пост-продакшн" },
  { id: "Релиз", label: "Релиз" }
];

const SYSTEM_FIELDS = {
  title: { label: "Название", type: "text" },
  owner: { label: "Продакшн", type: "text" },
  deadline: { label: "Дата релиза", type: "date" }
};

const FIELD_TYPES = [
  { value: "text", label: "Текст" },
  { value: "date", label: "Дата" },
  { value: "number", label: "Число" },
  { value: "link", label: "Ссылка" }
];

const defaultSchema = [
  {
    id: "title",
    label: "Название",
    type: "text",
    required: true,
    locked: true,
    placeholder: "Например, Северный ветер"
  },
  {
    id: "owner",
    label: "Продакшн",
    type: "text",
    required: true,
    locked: true,
    placeholder: "Имя ответственного"
  },
  {
    id: "deadline",
    label: "Дата релиза",
    type: "date",
    required: true,
    locked: true,
    placeholder: ""
  },
  {
    id: "format",
    label: "Формат",
    type: "text",
    required: false,
    locked: false,
    placeholder: "Фильм, сериал, док"
  },
  {
    id: "description",
    label: "Описание",
    type: "text",
    required: false,
    locked: false,
    multiline: true,
    placeholder: "Краткое описание, статус переговоров, состав команды"
  }
];

const defaultProjects = [
  {
    id: crypto.randomUUID(),
    title: "Полярная линия",
    owner: "Анна Белова",
    deadline: "2026-08-15",
    format: "Сериал",
    description: "Разработка пилота, упаковка для платформы и сбор режиссерских референсов.",
    stage: "Девелопмент",
    archived: false,
    tasks: [
      { text: "Подготовить one-pager для партнера", assignee: "Анна Белова", remindAt: "2026-07-01" },
      { text: "Согласовать shortlist сценаристов", assignee: "Илья Продакшн", remindAt: "2026-07-04" }
    ]
  },
  {
    id: crypto.randomUUID(),
    title: "Тихий монтаж",
    owner: "Марк Орлов",
    deadline: "2026-07-02",
    format: "Полный метр",
    description: "Фильм в посте: цвет, звук, графика титров и подготовка фестивальной версии.",
    stage: "Пост-продакшн",
    archived: false,
    tasks: [
      { text: "Напомнить про финальный саунд-дизайн", assignee: "Марк Орлов", remindAt: "2026-06-30" }
    ]
  }
];

const projectForm = document.querySelector("#project-form");
const projectFormFields = document.querySelector("#project-form-fields");
const projectList = document.querySelector("#project-list");
const projectCount = document.querySelector("#project-count");
const boardSubtitle = document.querySelector("#board-subtitle");
const boardSwitcher = document.querySelector("#board-switcher");
const boardSwitcherLabel = document.querySelector("#board-switcher-label");
const boardSwitcherMenu = document.querySelector("#board-switcher-menu");
const projectCardTemplate = document.querySelector("#project-card-template");

const remindersList = document.querySelector("#reminders-list");
const remindersPrev = document.querySelector("#reminders-prev");
const remindersNext = document.querySelector("#reminders-next");
const releasesList = document.querySelector("#releases-list");
const releasesPrev = document.querySelector("#releases-prev");
const releasesNext = document.querySelector("#releases-next");

const projectModal = document.querySelector("#project-modal");
const projectModalClose = document.querySelector("#project-modal-close");
const modalProjectStage = document.querySelector("#modal-project-stage");
const modalProjectTitle = document.querySelector("#modal-project-title");
const modalArchiveAction = document.querySelector("#modal-archive-action");
const modalDeleteAction = document.querySelector("#modal-delete-action");
const modalProjectOwnerLabel = document.querySelector("#modal-project-owner-label");
const modalProjectDeadlineLabel = document.querySelector("#modal-project-deadline-label");
const modalProjectOwner = document.querySelector("#modal-project-owner");
const modalProjectDeadline = document.querySelector("#modal-project-deadline");
const modalProjectFields = document.querySelector("#modal-project-fields");
const modalTaskCount = document.querySelector("#modal-task-count");
const modalTaskList = document.querySelector("#modal-task-list");
const modalTaskForm = document.querySelector("#modal-task-form");
const modalTaskText = document.querySelector("#modal-task-text");
const modalTaskAssignee = document.querySelector("#modal-task-assignee");
const modalTaskDate = document.querySelector("#modal-task-date");

const schemaModal = document.querySelector("#schema-modal");
const schemaModalClose = document.querySelector("#schema-modal-close");
const schemaEditorOpen = document.querySelector("#schema-editor-open");
const schemaFieldsList = document.querySelector("#schema-fields-list");
const schemaAddField = document.querySelector("#schema-add-field");
const schemaSave = document.querySelector("#schema-save");

let projectSchema = loadSchema();
let projects = loadProjects();
let schemaDraft = [];
let draggedProjectId = null;
let activeProjectId = null;
let boardView = "active";
let remindersPage = 0;
let releasesPage = 0;

renderForm();
renderBoardMode();
renderProjects();
renderHeaderMetrics();

boardSwitcherMenu.hidden = true;

projectForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(projectForm);
  const project = {
    id: crypto.randomUUID(),
    tasks: [],
    archived: false,
    stage: normalizeStage(formData.get("stage").toString())
  };

  projectSchema.forEach((field) => {
    project[field.id] = normalizeFieldValue(field, formData.get(field.id));
  });

  projects = [project, ...projects].map(normalizeProject);
  persistProjects();
  renderProjects();
  renderHeaderMetrics();
  projectForm.reset();
});

boardSwitcher.addEventListener("click", () => {
  const expanded = boardSwitcher.getAttribute("aria-expanded") === "true";
  boardSwitcher.setAttribute("aria-expanded", String(!expanded));
  boardSwitcherMenu.hidden = expanded;
});

boardSwitcherMenu.querySelectorAll("[data-board-view]").forEach((button) => {
  button.addEventListener("click", () => {
    boardView = button.dataset.boardView;
    boardSwitcherMenu.hidden = true;
    boardSwitcher.setAttribute("aria-expanded", "false");
    renderBoardMode();
    renderProjects();
    renderHeaderMetrics();
  });
});

document.addEventListener("click", (event) => {
  if (!boardSwitcher.contains(event.target) && !boardSwitcherMenu.contains(event.target)) {
    boardSwitcherMenu.hidden = true;
    boardSwitcher.setAttribute("aria-expanded", "false");
  }
});

projectModalClose.addEventListener("click", closeProjectModal);
schemaEditorOpen.addEventListener("click", openSchemaModal);
schemaModalClose.addEventListener("click", closeSchemaModal);

projectModal.addEventListener("click", (event) => {
  if (event.target instanceof HTMLElement && event.target.dataset.closeModal === "true") {
    closeProjectModal();
  }
});

schemaModal.addEventListener("click", (event) => {
  if (event.target instanceof HTMLElement && event.target.dataset.closeSchema === "true") {
    closeSchemaModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !projectModal.hidden) {
    closeProjectModal();
  }

  if (event.key === "Escape" && !schemaModal.hidden) {
    closeSchemaModal();
  }
});

modalTaskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!activeProjectId) {
    return;
  }

  const text = modalTaskText.value.trim();
  const assignee = modalTaskAssignee.value.trim();
  const remindAt = modalTaskDate.value;

  if (!text || !assignee) {
    return;
  }

  const currentProject = projects.find((project) => project.id === activeProjectId);

  if (!currentProject) {
    return;
  }

  currentProject.tasks.unshift({ text, assignee, remindAt });
  persistProjects();
  renderProjects();
  renderHeaderMetrics();
  openProjectModal(activeProjectId);
  modalTaskForm.reset();
});

modalArchiveAction.addEventListener("click", () => {
  if (!activeProjectId) {
    return;
  }

  toggleArchiveProject(activeProjectId);
});

modalDeleteAction.addEventListener("click", () => {
  if (!activeProjectId) {
    return;
  }

  deleteProject(activeProjectId);
});

schemaAddField.addEventListener("click", () => {
  schemaDraft.push(createNewField());
  renderSchemaEditor();
});

schemaSave.addEventListener("click", () => {
  syncSchemaDraftFromInputs();
  ensureLockedFieldsIntegrity();
  projectSchema = schemaDraft.map((field) => ({ ...field }));
  persistSchema();
  projects = projects.map((project) => normalizeProject(project));
  persistProjects();
  renderForm();
  renderProjects();
  renderHeaderMetrics();

  if (activeProjectId) {
    openProjectModal(activeProjectId);
  }

  closeSchemaModal();
});

remindersPrev.addEventListener("click", () => {
  remindersPage = Math.max(0, remindersPage - 1);
  renderReminders();
});

remindersNext.addEventListener("click", () => {
  const pages = getReminderPages().length;
  remindersPage = Math.min(pages - 1, remindersPage + 1);
  renderReminders();
});

releasesPrev.addEventListener("click", () => {
  releasesPage = Math.max(0, releasesPage - 1);
  renderReleases();
});

releasesNext.addEventListener("click", () => {
  const releases = getReleaseItems();
  releasesPage = Math.min(Math.max(0, releases.length - 1), releasesPage + 1);
  renderReleases();
});

function loadSchema() {
  const saved = localStorage.getItem(SCHEMA_STORAGE_KEY);

  if (!saved) {
    localStorage.setItem(SCHEMA_STORAGE_KEY, JSON.stringify(defaultSchema));
    return structuredClone(defaultSchema);
  }

  try {
    return normalizeSchema(JSON.parse(saved));
  } catch {
    localStorage.setItem(SCHEMA_STORAGE_KEY, JSON.stringify(defaultSchema));
    return structuredClone(defaultSchema);
  }
}

function normalizeSchema(schema) {
  const normalized = Array.isArray(schema) ? schema.map(normalizeFieldSchema).filter(Boolean) : [];

  Object.entries(SYSTEM_FIELDS).forEach(([fieldId, config]) => {
    if (!normalized.some((field) => field.id === fieldId)) {
      normalized.unshift({
        id: fieldId,
        label: config.label,
        type: config.type,
        required: true,
        locked: true,
        placeholder: ""
      });
    }
  });

  return normalized;
}

function normalizeFieldSchema(field) {
  if (!field || typeof field.id !== "string") {
    return null;
  }

  const systemField = SYSTEM_FIELDS[field.id];

  return {
    id: field.id,
    label: field.label || systemField?.label || "Новое поле",
    type: systemField?.type || field.type || "text",
    required: Boolean(systemField || field.required),
    locked: Boolean(systemField || field.locked),
    placeholder: field.placeholder || "",
    multiline: Boolean(field.multiline)
  };
}

function persistSchema() {
  localStorage.setItem(SCHEMA_STORAGE_KEY, JSON.stringify(projectSchema));
}

function loadProjects() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProjects));
    return structuredClone(defaultProjects).map(normalizeProject);
  }

  try {
    return JSON.parse(saved).map(normalizeProject);
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProjects));
    return structuredClone(defaultProjects).map(normalizeProject);
  }
}

function normalizeProject(project) {
  const normalizedProject = {
    id: project.id || crypto.randomUUID(),
    stage: normalizeStage(project.stage),
    archived: Boolean(project.archived),
    tasks: Array.isArray(project.tasks)
      ? project.tasks.map((task) => ({
          text: task.text || "",
          assignee: task.assignee || "",
          remindAt: task.remindAt || ""
        }))
      : []
  };

  projectSchema.forEach((field) => {
    normalizedProject[field.id] = normalizeProjectFieldValue(field, project[field.id]);
  });

  return normalizedProject;
}

function normalizeProjectFieldValue(field, value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function persistProjects() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function renderForm() {
  projectFormFields.innerHTML = "";

  projectSchema.forEach((field) => {
    projectFormFields.append(createFormField(field));
  });

  projectFormFields.append(createStageField());
}

function createFormField(field) {
  const wrapper = document.createElement("label");
  wrapper.className = "form-field";
  wrapper.textContent = field.label;

  let input;

  if (field.multiline) {
    input = document.createElement("textarea");
    input.rows = 1;
  } else {
    input = document.createElement("input");
    input.type = mapFieldTypeToInputType(field.type);
  }

  input.name = field.id;
  input.id = field.id;
  input.required = field.required;
  input.placeholder = "";
  wrapper.append(input);

  return wrapper;
}

function createStageField() {
  const wrapper = document.createElement("label");
  wrapper.className = "form-field";
  wrapper.textContent = "Этап";

  const select = document.createElement("select");
  select.name = "stage";
  select.id = "stage";
  select.required = true;

  STAGES.forEach((stage) => {
    const option = document.createElement("option");
    option.value = stage.id;
    option.textContent = stage.label;
    select.append(option);
  });

  wrapper.append(select);
  return wrapper;
}

function mapFieldTypeToInputType(type) {
  if (type === "date" || type === "number") {
    return type;
  }

  if (type === "link") {
    return "url";
  }

  return "text";
}

function normalizeFieldValue(field, rawValue) {
  return rawValue?.toString().trim() || "";
}

function renderBoardMode() {
  const title = boardView === "archive" ? "Архив" : "Текущий пайплайн";
  boardSwitcherLabel.textContent = title;
  boardSubtitle.textContent =
    boardView === "archive"
      ? "Архивные карточки проектов"
      : "Основные проекты по этапам производства";
}

function getVisibleProjects() {
  return projects.filter((project) => project.archived === (boardView === "archive"));
}

function renderProjects() {
  const visibleProjects = getVisibleProjects();
  projectList.innerHTML = "";
  projectCount.textContent = formatProjectCount(visibleProjects.length);

  STAGES.forEach((stage) => {
    const stageProjects = visibleProjects.filter((project) => project.stage === stage.id);
    const column = document.createElement("section");
    column.className = "stage-column";
    column.dataset.stage = stage.id;

    column.innerHTML = `
      <header class="stage-column__header">
        <div>
          <p class="stage-column__eyebrow">Этап производства</p>
          <h3>${stage.label}</h3>
        </div>
        <span class="stage-column__count">${stageProjects.length}</span>
      </header>
      <div class="stage-column__body"></div>
    `;

    const columnBody = column.querySelector(".stage-column__body");

    if (boardView === "active") {
      setupColumnDnD(column, columnBody, stage.id);
    }

    if (stageProjects.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "stage-empty";
      emptyState.textContent =
        boardView === "archive"
          ? "В архиве пока нет проектов на этом этапе."
          : "Пока пусто. Добавьте проект или перетащите карточку сюда.";
      columnBody.append(emptyState);
    } else {
      stageProjects.forEach((project) => {
        columnBody.append(createProjectCard(project));
      });
    }

    projectList.append(column);
  });
}

function createProjectCard(project) {
  const card = projectCardTemplate.content.firstElementChild.cloneNode(true);
  card.dataset.projectId = project.id;
  card.draggable = boardView === "active";
  card.tabIndex = 0;

  card.querySelector(".stage-pill").textContent = project.stage;
  card.querySelector(".project-title").textContent = project.title || "Без названия";
  card.querySelector(".project-owner-label").textContent = getFieldLabel("owner");
  card.querySelector(".project-deadline-label").textContent = getFieldLabel("deadline");
  card.querySelector(".project-owner").textContent = project.owner || "Не указано";
  card.querySelector(".project-deadline").textContent = formatDate(project.deadline);

  card.addEventListener("click", () => {
    if (!draggedProjectId) {
      openProjectModal(project.id);
    }
  });

  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProjectModal(project.id);
    }
  });

  card.addEventListener("dragstart", () => {
    if (boardView !== "active") {
      return;
    }

    draggedProjectId = project.id;
    card.classList.add("project-card--dragging");
  });

  card.addEventListener("dragend", () => {
    draggedProjectId = null;
    card.classList.remove("project-card--dragging");
    document.querySelectorAll(".stage-column__body").forEach((columnBody) => {
      columnBody.classList.remove("stage-column__body--active");
    });
  });

  return card;
}

function toggleArchiveProject(projectId) {
  const project = projects.find((item) => item.id === projectId);

  if (!project) {
    return;
  }

  project.archived = !project.archived;
  persistProjects();
  renderProjects();
  renderHeaderMetrics();

  if (activeProjectId === projectId) {
    closeProjectModal();
  }
}

function deleteProject(projectId) {
  projects = projects.filter((project) => project.id !== projectId);
  persistProjects();
  renderProjects();
  renderHeaderMetrics();

  if (activeProjectId === projectId) {
    closeProjectModal();
  }
}

function setupColumnDnD(column, columnBody, stageId) {
  column.addEventListener("dragover", (event) => {
    if (!draggedProjectId || boardView !== "active") {
      return;
    }

    event.preventDefault();
    columnBody.classList.add("stage-column__body--active");
  });

  column.addEventListener("dragleave", (event) => {
    if (!column.contains(event.relatedTarget)) {
      columnBody.classList.remove("stage-column__body--active");
    }
  });

  column.addEventListener("drop", (event) => {
    event.preventDefault();
    columnBody.classList.remove("stage-column__body--active");

    if (!draggedProjectId || boardView !== "active") {
      return;
    }

    moveProjectToStage(draggedProjectId, stageId);
  });
}

function moveProjectToStage(projectId, nextStage) {
  const project = projects.find((item) => item.id === projectId);

  if (!project || project.stage === nextStage) {
    return;
  }

  project.stage = nextStage;
  persistProjects();
  renderProjects();
  renderHeaderMetrics();

  if (activeProjectId === projectId) {
    openProjectModal(projectId);
  }
}

function openProjectModal(projectId) {
  const project = projects.find((item) => item.id === projectId);

  if (!project) {
    return;
  }

  activeProjectId = project.id;
  modalProjectStage.textContent = project.stage;
  modalProjectTitle.textContent = project.title || "Без названия";
  modalArchiveAction.textContent = project.archived ? "Вернуть" : "В архив";
  modalProjectOwnerLabel.textContent = getFieldLabel("owner");
  modalProjectDeadlineLabel.textContent = getFieldLabel("deadline");
  modalProjectOwner.textContent = project.owner || "Не указано";
  modalProjectDeadline.textContent = formatDate(project.deadline);
  renderProjectDetails(project);
  renderModalTasks(project.tasks);

  projectModal.hidden = false;
  document.body.classList.add("modal-open");
}

function renderProjectDetails(project) {
  modalProjectFields.innerHTML = "";

  const extraFields = projectSchema.filter((field) => !["title", "owner", "deadline"].includes(field.id));

  if (extraFields.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "detail-empty";
    emptyState.textContent = "Дополнительные поля не настроены.";
    modalProjectFields.append(emptyState);
    return;
  }

  extraFields.forEach((field) => {
    const detail = document.createElement("article");
    detail.className = field.multiline ? "detail-card detail-card--full" : "detail-card";

    const title = document.createElement("h4");
    title.textContent = field.label;
    detail.append(title);

    const value = project[field.id];

    if (field.type === "link" && value) {
      const link = document.createElement("a");
      link.href = value;
      link.target = "_blank";
      link.rel = "noreferrer noopener";
      link.textContent = value;
      detail.append(link);
    } else {
      const paragraph = document.createElement("p");
      paragraph.textContent = formatFieldValue(field, value);
      detail.append(paragraph);
    }

    modalProjectFields.append(detail);
  });
}

function closeProjectModal() {
  activeProjectId = null;
  projectModal.hidden = true;
  document.body.classList.remove("modal-open");
}

function renderModalTasks(tasks) {
  modalTaskCount.textContent = String(tasks.length);
  modalTaskList.innerHTML = "";

  if (tasks.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "task-item";
    emptyItem.innerHTML = "<strong>Задач пока нет</strong><span>Добавьте первое напоминание для команды.</span>";
    modalTaskList.append(emptyItem);
    return;
  }

  tasks.forEach((task) => {
    const item = document.createElement("li");
    item.className = "task-item";

    const title = document.createElement("strong");
    title.textContent = task.text;
    item.append(title);

    const meta = document.createElement("span");
    meta.textContent = `${task.assignee}${task.remindAt ? ` · ${formatDate(task.remindAt)}` : ""}`;
    item.append(meta);

    modalTaskList.append(item);
  });
}

function renderHeaderMetrics() {
  remindersPage = Math.min(remindersPage, Math.max(0, getReminderPages().length - 1));
  releasesPage = Math.min(releasesPage, Math.max(0, getReleaseItems().length - 1));
  renderReminders();
  renderReleases();
}

function getReminderItems() {
  return getVisibleProjects()
    .flatMap((project) =>
      project.tasks.map((task) => ({
        projectTitle: project.title || "Без названия",
        stage: project.stage,
        text: task.text,
        assignee: task.assignee,
        remindAt: task.remindAt
      }))
    )
    .sort((left, right) => compareDates(left.remindAt, right.remindAt));
}

function getReminderPages() {
  const reminders = getReminderItems();
  const pages = [];

  for (let index = 0; index < reminders.length; index += 3) {
    pages.push(reminders.slice(index, index + 3));
  }

  return pages;
}

function renderReminders() {
  const pages = getReminderPages();
  remindersList.innerHTML = "";

  if (pages.length === 0) {
    const item = document.createElement("li");
    item.className = "metric-list__empty";
    item.textContent = "Для этой доски пока нет напоминаний.";
    remindersList.append(item);
  } else {
    pages[remindersPage].forEach((reminder) => {
      const item = document.createElement("li");
      item.className = "metric-list__item";
      item.innerHTML = `
        <strong>${escapeHtml(reminder.text)}</strong>
        <span>${escapeHtml(reminder.projectTitle)} · ${escapeHtml(reminder.assignee)}</span>
        <em>${reminder.remindAt ? formatDate(reminder.remindAt) : "Без даты"}</em>
      `;
      remindersList.append(item);
    });
  }

  remindersPrev.disabled = remindersPage === 0;
  remindersNext.disabled = pages.length === 0 || remindersPage >= pages.length - 1;
}

function getReleaseItems() {
  return getVisibleProjects()
    .filter((project) => isValidDate(project.deadline))
    .sort((left, right) => new Date(left.deadline) - new Date(right.deadline));
}

function renderReleases() {
  const releases = getReleaseItems();
  releasesList.innerHTML = "";

  if (releases.length === 0) {
    const empty = document.createElement("div");
    empty.className = "release-card release-card--empty";
    empty.textContent = "Для этой доски пока нет проектов с датой релиза.";
    releasesList.append(empty);
  } else {
    const visibleReleases = releases.slice(releasesPage, releasesPage + 3);

    visibleReleases.forEach((release) => {
      const card = document.createElement("article");
      card.className = "release-card";
      card.innerHTML = `
        <strong>${escapeHtml(release.title || "Без названия")}</strong>
        <span>${escapeHtml(release.owner || "Не указано")}</span>
        <em>${formatDate(release.deadline)} · ${escapeHtml(release.stage)}</em>
      `;
      releasesList.append(card);
    });
  }

  releasesPrev.disabled = releasesPage === 0;
  releasesNext.disabled = releases.length === 0 || releasesPage >= Math.max(0, releases.length - 3);
}

function openSchemaModal() {
  schemaDraft = projectSchema.map((field) => ({ ...field }));
  renderSchemaEditor();
  schemaModal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeSchemaModal() {
  schemaModal.hidden = true;
  document.body.classList.remove("modal-open");
}

function renderSchemaEditor() {
  schemaFieldsList.innerHTML = "";

  schemaDraft.forEach((field, index) => {
    const row = document.createElement("article");
    row.className = "schema-field";
    row.dataset.index = String(index);

    row.innerHTML = `
      <div class="schema-field__main">
        <label class="schema-field__label">
          Название поля
          <input class="schema-input schema-input--label" type="text" value="${escapeHtmlAttribute(field.label)}">
        </label>
        <label class="schema-field__label">
          Формат
          <select class="schema-input schema-input--type" ${field.locked ? "disabled" : ""}>
            ${FIELD_TYPES.map((type) => `<option value="${type.value}" ${type.value === field.type ? "selected" : ""}>${type.label}</option>`).join("")}
          </select>
        </label>
      </div>
      <div class="schema-field__actions">
        <button class="schema-action" type="button" data-action="up" ${index === 0 ? "disabled" : ""}>↑</button>
        <button class="schema-action" type="button" data-action="down" ${index === schemaDraft.length - 1 ? "disabled" : ""}>↓</button>
        <button class="schema-action" type="button" data-action="delete" ${field.locked ? "disabled" : ""}>Удалить</button>
      </div>
      <p class="schema-field__meta">${field.locked ? "Обязательное поле" : "Пользовательское поле"}</p>
    `;

    const labelInput = row.querySelector(".schema-input--label");
    const typeSelect = row.querySelector(".schema-input--type");

    labelInput.addEventListener("input", () => {
      schemaDraft[index].label = labelInput.value.trim() || schemaDraft[index].label;
    });

    typeSelect?.addEventListener("change", () => {
      schemaDraft[index].type = typeSelect.value;
      schemaDraft[index].multiline = false;
    });

    row.querySelectorAll(".schema-action").forEach((button) => {
      button.addEventListener("click", () => {
        handleSchemaAction(button.dataset.action, index);
      });
    });

    schemaFieldsList.append(row);
  });
}

function handleSchemaAction(action, index) {
  syncSchemaDraftFromInputs();

  if (action === "up" && index > 0) {
    [schemaDraft[index - 1], schemaDraft[index]] = [schemaDraft[index], schemaDraft[index - 1]];
  }

  if (action === "down" && index < schemaDraft.length - 1) {
    [schemaDraft[index + 1], schemaDraft[index]] = [schemaDraft[index], schemaDraft[index + 1]];
  }

  if (action === "delete" && !schemaDraft[index].locked) {
    schemaDraft.splice(index, 1);
  }

  renderSchemaEditor();
}

function syncSchemaDraftFromInputs() {
  Array.from(schemaFieldsList.children).forEach((row, index) => {
    const labelInput = row.querySelector(".schema-input--label");
    const typeSelect = row.querySelector(".schema-input--type");

    schemaDraft[index].label = labelInput.value.trim() || schemaDraft[index].label;

    if (typeSelect && !schemaDraft[index].locked) {
      schemaDraft[index].type = typeSelect.value;
    }
  });
}

function ensureLockedFieldsIntegrity() {
  Object.entries(SYSTEM_FIELDS).forEach(([fieldId, config]) => {
    const field = schemaDraft.find((item) => item.id === fieldId);

    if (!field) {
      schemaDraft.unshift({
        id: fieldId,
        label: config.label,
        type: config.type,
        required: true,
        locked: true,
        placeholder: ""
      });
      return;
    }

    field.required = true;
    field.locked = true;
    field.type = config.type;
  });
}

function createNewField() {
  return {
    id: `field_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    label: "Новое поле",
    type: "text",
    required: false,
    locked: false,
    placeholder: "",
    multiline: false
  };
}

function getFieldLabel(fieldId) {
  return projectSchema.find((field) => field.id === fieldId)?.label || SYSTEM_FIELDS[fieldId]?.label || "";
}

function normalizeStage(stage) {
  return STAGES.some((item) => item.id === stage) ? stage : "Pre-Sale";
}

function compareDates(left, right) {
  const leftValid = isValidDate(left);
  const rightValid = isValidDate(right);

  if (leftValid && rightValid) {
    return new Date(left) - new Date(right);
  }

  if (leftValid) {
    return -1;
  }

  if (rightValid) {
    return 1;
  }

  return 0;
}

function formatDate(dateString) {
  if (!isValidDate(dateString)) {
    return "Дата не указана";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(dateString));
}

function formatFieldValue(field, value) {
  if (!value) {
    return "Не заполнено";
  }

  if (field.type === "date") {
    return formatDate(value);
  }

  return value;
}

function isValidDate(dateString) {
  return Boolean(dateString) && !Number.isNaN(new Date(dateString).getTime());
}

function formatProjectCount(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return `${count} проект`;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} проекта`;
  }

  return `${count} проектов`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeHtmlAttribute(value) {
  return escapeHtml(value);
}

const STORAGE_KEY = "cineflow-projects";
const STAGES = [
  { id: "Pre-Sale", label: "Pre-Sale" },
  { id: "Девелопмент", label: "Девелопмент" },
  { id: "Пре-продакшн", label: "Пре-продакшн" },
  { id: "Продакшн", label: "Продакшн" },
  { id: "Пост-продакшн", label: "Пост-продакшн" },
  { id: "Релиз", label: "Релиз" }
];

const STAGE_ALIASES = {
  "Pre-sale": "Pre-Sale",
  "Pre-Sale": "Pre-Sale",
  Development: "Девелопмент",
  "Pre-production": "Пре-продакшн",
  Production: "Продакшн",
  "Post-production": "Пост-продакшн",
  Release: "Релиз"
};

const defaultProjects = [
  {
    id: crypto.randomUUID(),
    title: "Полярная линия",
    format: "Сериал",
    owner: "Анна Белова",
    stage: "Девелопмент",
    deadline: "2026-08-15",
    description: "Разработка пилота, упаковка для платформы и сбор режиссерских референсов.",
    tasks: [
      { text: "Подготовить one-pager для партнера", assignee: "Анна Белова" },
      { text: "Согласовать shortlist сценаристов", assignee: "Илья Продакшн" }
    ]
  },
  {
    id: crypto.randomUUID(),
    title: "Тихий монтаж",
    format: "Полный метр",
    owner: "Марк Орлов",
    stage: "Пост-продакшн",
    deadline: "2026-07-02",
    description: "Фильм в посте: цвет, звук, графика титров и подготовка фестивальной версии.",
    tasks: [
      { text: "Напомнить про финальный саунд-дизайн", assignee: "Марк Орлов" }
    ]
  }
];

const projectForm = document.querySelector("#project-form");
const projectList = document.querySelector("#project-list");
const projectCount = document.querySelector("#project-count");
const resetDemoButton = document.querySelector("#reset-demo");
const projectCardTemplate = document.querySelector("#project-card-template");

const projectModal = document.querySelector("#project-modal");
const projectModalClose = document.querySelector("#project-modal-close");
const modalProjectStage = document.querySelector("#modal-project-stage");
const modalProjectTitle = document.querySelector("#modal-project-title");
const modalProjectFormat = document.querySelector("#modal-project-format");
const modalProjectOwner = document.querySelector("#modal-project-owner");
const modalProjectDeadline = document.querySelector("#modal-project-deadline");
const modalProjectDescription = document.querySelector("#modal-project-description");
const modalTaskCount = document.querySelector("#modal-task-count");
const modalTaskList = document.querySelector("#modal-task-list");
const modalTaskForm = document.querySelector("#modal-task-form");
const modalTaskText = document.querySelector("#modal-task-text");
const modalTaskAssignee = document.querySelector("#modal-task-assignee");

let projects = loadProjects();
let draggedProjectId = null;
let activeProjectId = null;

renderProjects();

projectForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(projectForm);
  const project = {
    id: crypto.randomUUID(),
    title: formData.get("title").toString().trim(),
    format: formData.get("format").toString().trim(),
    owner: formData.get("owner").toString().trim(),
    stage: normalizeStage(formData.get("stage").toString()),
    deadline: formData.get("deadline").toString(),
    description: formData.get("description").toString().trim(),
    tasks: []
  };

  projects = [project, ...projects];
  persistProjects();
  renderProjects();
  projectForm.reset();
});

resetDemoButton.addEventListener("click", () => {
  projects = structuredClone(defaultProjects);
  persistProjects();
  closeProjectModal();
  renderProjects();
});

projectModalClose.addEventListener("click", closeProjectModal);

projectModal.addEventListener("click", (event) => {
  if (event.target instanceof HTMLElement && event.target.dataset.closeModal === "true") {
    closeProjectModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !projectModal.hidden) {
    closeProjectModal();
  }
});

modalTaskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!activeProjectId) {
    return;
  }

  const text = modalTaskText.value.trim();
  const assignee = modalTaskAssignee.value.trim();

  if (!text || !assignee) {
    return;
  }

  const currentProject = projects.find((project) => project.id === activeProjectId);

  if (!currentProject) {
    return;
  }

  currentProject.tasks.unshift({ text, assignee });
  persistProjects();
  renderProjects();
  openProjectModal(activeProjectId);
  modalTaskForm.reset();
});

function loadProjects() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProjects));
    return structuredClone(defaultProjects);
  }

  try {
    const parsedProjects = JSON.parse(saved);
    return parsedProjects.map(normalizeProject);
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProjects));
    return structuredClone(defaultProjects);
  }
}

function normalizeProject(project) {
  return {
    ...project,
    stage: normalizeStage(project.stage),
    tasks: Array.isArray(project.tasks) ? project.tasks : []
  };
}

function normalizeStage(stage) {
  return STAGE_ALIASES[stage] || "Pre-Sale";
}

function persistProjects() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function renderProjects() {
  projectList.innerHTML = "";
  projectCount.textContent = formatProjectCount(projects.length);

  STAGES.forEach((stage) => {
    const column = document.createElement("section");
    column.className = "stage-column";
    column.dataset.stage = stage.id;

    column.innerHTML = `
      <header class="stage-column__header">
        <div>
          <p class="stage-column__eyebrow">Этап производства</p>
          <h3>${stage.label}</h3>
        </div>
        <span class="stage-column__count">${projects.filter((project) => project.stage === stage.id).length}</span>
      </header>
      <div class="stage-column__body"></div>
    `;

    const columnBody = column.querySelector(".stage-column__body");
    setupColumnDnD(column, columnBody, stage.id);

    const stageProjects = projects.filter((project) => project.stage === stage.id);

    if (stageProjects.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "stage-empty";
      emptyState.textContent = "Пока пусто. Добавьте проект или перетащите карточку сюда.";
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
  card.draggable = true;
  card.tabIndex = 0;

  card.querySelector(".stage-pill").textContent = project.stage;
  card.querySelector(".project-title").textContent = project.title;
  card.querySelector(".project-format").textContent = project.format;
  card.querySelector(".project-owner").textContent = project.owner;
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

function setupColumnDnD(column, columnBody, stageId) {
  column.addEventListener("dragover", (event) => {
    if (!draggedProjectId) {
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

    if (!draggedProjectId) {
      return;
    }

    moveProjectToStage(draggedProjectId, stageId);
  });
}

function moveProjectToStage(projectId, nextStage) {
  const currentProject = projects.find((project) => project.id === projectId);

  if (!currentProject || currentProject.stage === nextStage) {
    return;
  }

  currentProject.stage = nextStage;
  persistProjects();
  renderProjects();

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
  modalProjectTitle.textContent = project.title;
  modalProjectFormat.textContent = project.format;
  modalProjectOwner.textContent = project.owner;
  modalProjectDeadline.textContent = formatDate(project.deadline);
  modalProjectDescription.textContent = project.description || "Описание пока не заполнено.";
  renderModalTasks(project.tasks);

  projectModal.hidden = false;
  document.body.classList.add("modal-open");
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
    item.innerHTML = `<strong>${escapeHtml(task.text)}</strong><span>Ответственный: ${escapeHtml(task.assignee)}</span>`;
    modalTaskList.append(item);
  });
}

function formatDate(dateString) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Дата не указана";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
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
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

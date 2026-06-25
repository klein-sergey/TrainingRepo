const STORAGE_KEY = "cineflow-projects";

const defaultProjects = [
  {
    id: crypto.randomUUID(),
    title: "Полярная линия",
    format: "Сериал",
    owner: "Анна Белова",
    stage: "Development",
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
    stage: "Post-production",
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

let projects = loadProjects();

renderProjects();

projectForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(projectForm);
  const project = {
    id: crypto.randomUUID(),
    title: formData.get("title").toString().trim(),
    format: formData.get("format").toString().trim(),
    owner: formData.get("owner").toString().trim(),
    stage: formData.get("stage").toString(),
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
  renderProjects();
});

function loadProjects() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProjects));
    return structuredClone(defaultProjects);
  }

  try {
    return JSON.parse(saved);
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProjects));
    return structuredClone(defaultProjects);
  }
}

function persistProjects() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function renderProjects() {
  projectList.innerHTML = "";
  projectCount.textContent = formatProjectCount(projects.length);

  if (projects.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.textContent = "Пока нет проектов. Добавьте первую карточку через форму слева.";
    projectList.append(emptyState);
    return;
  }

  projects.forEach((project) => {
    const card = projectCardTemplate.content.firstElementChild.cloneNode(true);
    card.dataset.projectId = project.id;

    card.querySelector(".stage-pill").textContent = project.stage;
    card.querySelector(".project-title").textContent = project.title;
    card.querySelector(".project-format").textContent = project.format;
    card.querySelector(".project-owner").textContent = project.owner;
    card.querySelector(".project-deadline").textContent = formatDate(project.deadline);
    card.querySelector(".project-description").textContent =
      project.description || "Описание пока не заполнено.";

    renderTasks(card, project.tasks);

    const taskForm = card.querySelector(".task-form");
    taskForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const taskTextInput = taskForm.querySelector(".task-text");
      const taskAssigneeInput = taskForm.querySelector(".task-assignee");

      const text = taskTextInput.value.trim();
      const assignee = taskAssigneeInput.value.trim();

      if (!text || !assignee) {
        return;
      }

      const currentProject = projects.find((item) => item.id === project.id);

      if (!currentProject) {
        return;
      }

      currentProject.tasks.unshift({ text, assignee });
      persistProjects();
      renderProjects();
    });

    projectList.append(card);
  });
}

function renderTasks(card, tasks) {
  const taskList = card.querySelector(".task-list");
  const taskCount = card.querySelector(".task-count");

  taskCount.textContent = String(tasks.length);
  taskList.innerHTML = "";

  if (tasks.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "task-item";
    emptyItem.innerHTML = "<strong>Задач пока нет</strong><span>Добавьте первое напоминание для команды.</span>";
    taskList.append(emptyItem);
    return;
  }

  tasks.forEach((task) => {
    const item = document.createElement("li");
    item.className = "task-item";
    item.innerHTML = `<strong>${escapeHtml(task.text)}</strong><span>Ответственный: ${escapeHtml(task.assignee)}</span>`;
    taskList.append(item);
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

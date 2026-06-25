# CineFlow CRM Demo

Простейший статический сайт для GitHub Pages без фреймворков и сборки.

Что внутри:

- `index.html` — структура страницы
- `styles.css` — адаптивные стили
- `script.js` — базовая логика карточек проектов и задач

## Что умеет демо

- создавать карточки проектов кино-студии
- хранить основную информацию о проекте
- вести проекты по этапам производства
- добавлять задачи и напоминания внутри карточки проекта
- сохранять данные локально в браузере через `localStorage`

## Локальный запуск

1. Откройте `index.html` в браузере.
2. Для более реалистичной проверки можно поднять любой простой статический сервер, но это не обязательно.

## Публикация на GitHub Pages

1. Создайте первый коммит и отправьте файлы в репозиторий:

```bash
git add .
git commit -m "Add GitHub Pages demo site"
git push -u origin main
```

2. Откройте репозиторий на GitHub:
   [https://github.com/klein-sergey/TrainingRepo](https://github.com/klein-sergey/TrainingRepo)

3. Перейдите в `Settings` → `Pages`.
4. В блоке `Build and deployment` выберите:
   - `Source`: `Deploy from a branch`
   - `Branch`: `main`
   - `Folder`: `/ (root)`
5. Сохраните настройки.
6. После публикации сайт будет доступен по адресу:
   [https://klein-sergey.github.io/TrainingRepo/](https://klein-sergey.github.io/TrainingRepo/)

## Структура проекта

```text
.
├── index.html
├── README.md
├── script.js
└── styles.css
```

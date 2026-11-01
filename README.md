# Tranquil 🌿
> An elegant, all-in-one productivity platform uniting notes, tasks, projects, interactive knowledge graphs, and Pomodoro focus tracking.

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Django](https://img.shields.io/badge/Django-5.1-092e20?logo=django)](https://www.djangoproject.com/)
[![DRF](https://img.shields.io/badge/Django%20REST-Framework-red)](https://www.django-rest-framework.org/)

---

## ✨ Features

- 📝 **Smart Notes**: Rich note editor with tagging, pinning, colors, and bidirectional note linking.
- 🕸️ **Interactive Knowledge Graph**: Visualize connections between your thoughts and notes in real time.
- 🎯 **Task Management**: Inbox, Today, Upcoming, and custom Project views with priority and tagging.
- ⏳ **Pomodoro Focus Timer**: Customizable work/break intervals, sound alerts, ambient background audio, and focus session history.
- 📊 **Productivity Analytics**: Heatmaps, focus vs. task completion metrics, and streak tracking.
- ⚡ **Modern Stack**: Built with Next.js 16 (Turbopack, Partial Prerendering) and Django REST Framework (JWT Authentication).

---

## 🏗️ Project Structure

```text
├── frontend/             # Next.js 16 + React 19 Frontend
│   ├── app/              # App Router pages (Today, Inbox, Notes, Focus, etc.)
│   ├── components/       # UI components & widgets
│   ├── lib/              # API clients & contexts
│   └── public/           # Static assets & audio
├── backend/              # Django REST Framework Backend
│   ├── apps/             # Modular Django apps (accounts, notes, tasks, etc.)
│   ├── tranquil/         # Project settings & configuration
│   └── manage.py         # Django CLI
└── .gitignore            # Git ignore rules for Python & Node
```

---

## 🚀 Getting Started

### 1. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`.

### 2. Backend (Django)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements/development.txt
python manage.py migrate
python seed_demo_data.py   # Optional: seeds demo user and sample data
python manage.py runserver 8001
```

The backend API will run on `http://localhost:8001/api/`.

---

## 🌐 Deploy to Vercel

The frontend is ready for immediate deployment on [Vercel](https://vercel.com):

1. Go to [Vercel Dashboard](https://vercel.com/new).
2. Import repository **`Yuvansh-thx/tranquil-app`**.
3. Under **Root Directory**, click **Edit** and select **`frontend`**.
4. Set the environment variable:
   - `NEXT_PUBLIC_API_URL`: Your deployed backend API URL (or your server URL).
5. Click **Deploy**.

---

## 📄 License

MIT

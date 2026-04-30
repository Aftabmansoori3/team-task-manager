# TaskFlow — Team Task Manager

A full-stack team task management app with JWT auth, role-based access, project boards, and a dashboard.

Built with Node.js/Express + MySQL + vanilla HTML/CSS/JS.

![Stack](https://img.shields.io/badge/Node.js-Express-green) ![DB](https://img.shields.io/badge/MySQL-Sequelize-blue) ![Auth](https://img.shields.io/badge/Auth-JWT-orange)

## Features

- **Authentication** — Signup/Login with JWT tokens
- **Roles** — Admin (full access) and Member (scoped access)
- **Projects** — Create, manage, and add team members
- **Tasks** — Create, assign, set priority/due dates, update status (To Do → In Progress → Done)
- **Dashboard** — Task counts, status breakdown bar, overdue tasks list

## Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8+ (running locally or remote)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd team-task-manager
npm install
```

### 2. Setup Database

Create a MySQL database:

```sql
CREATE DATABASE task_manager;
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your MySQL credentials:

```
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_NAME=task_manager
DB_USER=root
DB_PASS=yourpassword
JWT_SECRET=some_random_secret_string_here
JWT_EXPIRES_IN=7d
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:5000](http://localhost:5000) — tables are created automatically on first run.

### 5. First User

Sign up with role **Admin** to get full access (create projects, manage members).

## Project Structure

```
├── server/
│   ├── config/db.js          # Sequelize connection
│   ├── controllers/          # Route handlers
│   ├── middleware/            # Auth & role check
│   ├── models/               # Sequelize models + associations
│   ├── routes/               # Express routes
│   ├── utils/                # Error handler
│   └── server.js             # Entry point
├── client/
│   ├── css/style.css         # Design system
│   ├── js/                   # Frontend logic
│   └── *.html                # Pages
├── .env.example
├── package.json
└── README.md
```

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Sign up | No |
| POST | `/api/auth/login` | Log in | No |
| GET | `/api/auth/me` | Current user | Yes |
| GET | `/api/auth/users` | All users | Yes |
| GET | `/api/projects` | List projects | Yes |
| POST | `/api/projects` | Create project | Admin |
| GET | `/api/projects/:id` | Project detail | Yes |
| PUT | `/api/projects/:id` | Update project | Owner/Admin |
| DELETE | `/api/projects/:id` | Delete project | Owner/Admin |
| POST | `/api/projects/:id/members` | Add member | Owner/Admin |
| DELETE | `/api/projects/:id/members/:userId` | Remove member | Owner/Admin |
| GET | `/api/tasks/project/:projectId` | Tasks by project | Yes |
| POST | `/api/tasks` | Create task | Yes |
| PUT | `/api/tasks/:id` | Update task | Yes |
| DELETE | `/api/tasks/:id` | Delete task | Creator/Admin |
| GET | `/api/dashboard/stats` | Dashboard stats | Yes |

## Deploy to Railway

1. Push code to a GitHub repo
2. Go to [railway.app](https://railway.app) and create a new project
3. Add a **MySQL** service from the Railway dashboard
4. Connect your GitHub repo as a service
5. Set these environment variables:
   - `DB_HOST` — from Railway MySQL service
   - `DB_PORT` — from Railway MySQL service
   - `DB_NAME` — from Railway MySQL service
   - `DB_USER` — from Railway MySQL service
   - `DB_PASS` — from Railway MySQL service
   - `JWT_SECRET` — any random string
   - `JWT_EXPIRES_IN` — `7d`
   - `NODE_ENV` — `production`
   - `PORT` — Railway sets this automatically
6. Railway auto-detects Node.js and runs `npm start`
7. The app serves the frontend as static files, so no separate deploy needed

## License

MIT

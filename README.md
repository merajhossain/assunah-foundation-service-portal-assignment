# Assunnah Foundation Service Portal

A web portal for submitting, tracking, assigning, and resolving service requests at Assunnah Foundation. Requesters submit tickets. Staff (admin, manager, office) review them, assign officers, and update status. Every change is written to an activity history.

The interface is available in **Bangla (default)** and **English**.

**Demo login credentials:** see [`docs/CREDENTIALS.txt`](docs/CREDENTIALS.txt).

**Short install guide:** see [`docs/INSTALL.txt`](docs/INSTALL.txt).
All seeded accounts use the password `Password123!`.

---

## Table of contents

1. [Technology stack](#technology-stack)
2. [Requirements](#requirements)
3. [Quick setup (all commands)](#quick-setup-all-commands)
4. [Setup: install to seed (step by step)](#setup-install-to-seed-step-by-step)
5. [Running the application](#running-the-application)
6. [Verify the installation](#verify-the-installation)
7. [Demo credentials](#demo-credentials)
8. [Suggested review walkthrough](#suggested-review-walkthrough)
9. [Features by role](#features-by-role)
10. [Features shared by all roles](#features-shared-by-all-roles)
11. [Reliability and data protection](#reliability-and-data-protection)
12. [Environment variables](#environment-variables)
13. [Resetting and updating](#resetting-and-updating)
14. [Useful commands](#useful-commands)
15. [Troubleshooting](#troubleshooting)
16. [Project structure](#project-structure)

---

## Technology stack

| Area | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) with React 19 |
| Language | TypeScript |
| Database | MySQL (or MariaDB) through Prisma ORM 7 |
| Authentication | NextAuth.js v5 (email and password, JWT sessions) |
| Forms and validation | Formik and Yup |
| Tables | TanStack Table |
| Languages | next-intl (Bangla and English) |
| Styling | Tailwind CSS 4 |
| Tests | Vitest |

---

## Requirements

Install these before you start:

- **Node.js 20 or newer.** The project was built with Node.js 22.
- **npm 10 or newer.** It comes with Node.js.
- **MySQL 8** or **MariaDB 10.6+**, running locally or reachable over the network. XAMPP, Laragon, WAMP, or a standalone MySQL server all work.
- **Git**, if you are cloning the repository.

Check the installed versions:

```bash
node -v      # should print v20.x or newer
npm -v       # should print 10.x or newer
mysql --version
```

Make sure the MySQL server is **started** before continuing. In XAMPP or Laragon, press **Start** next to MySQL.

---

## Quick setup (all commands)

For reviewers who already have Node.js and MySQL running. Each step is explained in the next section.

```bash
# 1. Get the code
git clone https://github.com/merajhossain/assunah-foundation-service-portal-assignment.git
cd assunah-foundation-service-portal-assignment

# 2. Install dependencies
npm install

# 3. Create an empty database (any name; enter your MySQL password when asked)
mysql -u root -p -e "CREATE DATABASE your_database_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 4. Create .env, then edit DATABASE_URL and AUTH_SECRET inside it
cp .env.example .env

# 5. Create the tables
npx prisma migrate deploy

# 6. Generate the database client
npx prisma generate

# 7. Load demo users and 12,000 sample requests
npm run db:seed

# 8. Start the app
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) and sign in with `admin@assunnah.local` / `Password123!`.

---

## Setup: install to seed (step by step)

Run every command from the project root folder, which is the folder that contains `package.json`.

### Step 1: Get the code

```bash
git clone https://github.com/merajhossain/assunah-foundation-service-portal-assignment.git
cd assunah-foundation-service-portal-assignment
```

If you received the project as a ZIP file, extract it and open a terminal in the extracted folder.

### Step 2: Install dependencies

```bash
npm install
```

This installs every package listed in `package.json`, at the exact versions locked in `package-lock.json`. It takes a few minutes the first time.

If npm stops with an `ERESOLVE` peer dependency error, run:

```bash
npm install --legacy-peer-deps
```

### Step 3: Create the database

The application needs an **empty** MySQL database. Use whichever tool you prefer.

> **Choose any database name you like.** In this guide the name is written as `your_database_name`. Replace it with your own name (for example `service_portal`) here and in `DATABASE_URL` in Step 4.

**Option A: MySQL command line**

```bash
mysql -u root -p -e "CREATE DATABASE your_database_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

If your `root` user has no password, leave out `-p`.

**Option B: phpMyAdmin (XAMPP / Laragon / WAMP)**

1. Open [http://localhost/phpmyadmin](http://localhost/phpmyadmin).
2. Select **New** in the left panel.
3. Enter `your_database_name` as the database name.
4. Choose `utf8mb4_unicode_ci` as the collation.
5. Select **Create**.

**Option C: MySQL Workbench or any SQL client**

```sql
CREATE DATABASE your_database_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Use exactly the same name in `DATABASE_URL` in the next step. `utf8mb4` is required so Bangla text is stored correctly.

### Step 4: Create the environment file

Copy the example file:

```bash
# macOS / Linux / Git Bash
cp .env.example .env

# Windows Command Prompt
copy .env.example .env
```

Open `.env` and set the values:

```env
# MySQL user WITH a password:
DATABASE_URL="mysql://root:yourpassword@127.0.0.1:3306/your_database_name"

# MySQL user WITHOUT a password (common with XAMPP):
# DATABASE_URL="mysql://root:@127.0.0.1:3306/your_database_name"

AUTH_SECRET="replace-with-a-generated-secret"
AUTH_TRUST_HOST="true"
```

- `DATABASE_URL` must point to the database you created in Step 3. The format is:

  ```
  mysql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
  ```

  Example with user `root`, password `secret`, the default port, and your database name:

  ```
  mysql://root:secret@127.0.0.1:3306/your_database_name
  ```

  If the password contains special characters such as `@`, `#`, `:` or `/`, URL-encode them. For example, `@` becomes `%40`.

- `AUTH_SECRET` signs login sessions. Generate one with **any one** of these commands:

  ```bash
  npx auth secret
  ```

  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```

  Paste the printed value into `AUTH_SECRET`. Any long random string also works.

- `AUTH_TRUST_HOST="true"` lets sign-in work on `localhost` and on your own server. Leave it as it is.

Save the file. Every variable is described in [Environment variables](#environment-variables).

### Step 5: Create the database tables

```bash
npx prisma migrate deploy
```

This applies the migrations in `prisma/migrations/` in order. It creates these tables with their indexes:

| Table | Purpose |
|---|---|
| `roles` | admin, manager, office, requester |
| `users` | Accounts with a hashed password and a role |
| `services` | Service catalogue, grouped by category |
| `service_requests` | Tickets: subject, description, priority, status, assignee |
| `service_activities` | History of every change made to a request |

When it succeeds, the last line says **"All migrations have been successfully applied."**

Use `migrate deploy`, not `migrate dev`. `migrate deploy` only applies the existing migrations and never asks to reset your data.

### Step 6: Generate the Prisma client

```bash
npx prisma generate
```

This writes the type-safe database client into the `generated/prisma` folder. That folder is not stored in Git, so this step is **required** on every fresh copy of the project. The application will not start without it.

When it succeeds, it prints **"Generated Prisma Client"**.

### Step 7: Seed demo data

```bash
npm run db:seed
```

The seed creates:

- the four roles (admin, manager, office, requester)
- 19 demo user accounts (see [`docs/CREDENTIALS.txt`](docs/CREDENTIALS.txt))
- a catalogue of services across 12 categories: Education, Skill development, Healthcare, Emergency relief, Food, Winter, WASH, Shelter, Livelihood, Dawah, Environment, and Internal support
- **12,000 service requests** with realistic activity history, used to test search, filters, and pagination at scale

Seeding takes about one to two minutes. Wait for the command to finish before starting the app.

It is safe to run again. Users are updated and every password is reset to `Password123!`. All services, requests, and activity history are **deleted and generated again**, so any requests you created by hand are removed. To start again from a completely empty database, see [Resetting and updating](#resetting-and-updating).

When it finishes, the terminal prints a summary like:

```
Seeded 19 users.
Seeded ... services.
Seeded 12000 service requests.
Seeded ... service activities.
Default password for all seeded users: Password123!
```

### Step 8: Start the application

```bash
npm run dev
```

Wait for **"Ready"** in the terminal, then open [http://localhost:3000](http://localhost:3000).

Setup is complete. Continue with [Verify the installation](#verify-the-installation).

---

## Running the application

### Development mode

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be sent to the login page.

- Bangla: `http://localhost:3000/bn/login`
- English: `http://localhost:3000/en/login`

### Production mode

```bash
npm run build
npm start
```

This serves the optimized build on [http://localhost:3000](http://localhost:3000). Use production mode for performance testing. Development mode compiles pages on first visit, so the first load of each page is slower.

Stop either server with **Ctrl + C** in the terminal.

---

## Verify the installation

Go through this checklist once to confirm everything works:

1. Open [http://localhost:3000](http://localhost:3000). You are redirected to the Bangla login page (`/bn/login`).
2. Sign in as `admin@assunnah.local` with `Password123!`. The dashboard opens.
3. The summary cards show about **12,000** total requests, and the table shows 20 rows with page numbers below it.
4. Type a word such as `scholarship` into the search box. The list filters after a short pause.
5. Open any request. Its details and the **Activity** history appear.
6. Select **English** in the header. The page switches to English. Select **বাংলা** to switch back.
7. No red "Database connection failed" message appears at the top right.

If any step fails, see [Troubleshooting](#troubleshooting).

---

## Demo credentials

The full list of accounts is in **[`docs/CREDENTIALS.txt`](docs/CREDENTIALS.txt)**.

For a quick review:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@assunnah.local` | `Password123!` |
| Manager | `manager.education@assunnah.local` | `Password123!` |
| Office | `office.one@assunnah.local` | `Password123!` |
| Requester | `requester.one@assunnah.local` | `Password123!` |

Sign out with the **Sign out** button in the header before switching to another account.

---

## Suggested review walkthrough

These scenarios show the main features and permission rules. Each one takes a few minutes.

### Scenario 1: A requester submits and edits a request

1. Sign in as `requester.one@assunnah.local`.
2. The list shows **only** requests submitted by Requester One.
3. Select **New request**. Fill in Subject, Description, Service, and Priority, then select **Create request**. The new request's page opens.
4. Go back to the list. An **Edit** (pencil) button appears on the new request because it is still **Open**. Change the subject and save.
5. Open the request. The **Activity** history shows "Subject changed".
6. Rows that are In progress, Resolved, or Closed show a greyed-out pencil. Hovering it explains why editing is not allowed.

### Scenario 2: A manager assigns and updates a request

1. Sign in as `manager.education@assunnah.local`.
2. The list shows only requests assigned to this manager, or that this manager has worked on.
3. Select the **Assign** (person) button on an Open request. A pop-up shows the request title, its ID, and the update form.
4. Change the assignee or the status, then select **Save changes**. A success message appears and the list refreshes.
5. On a Resolved or Closed request, the Assign button is greyed out. Only an admin can change it.

### Scenario 3: An admin changes a solved request

1. Sign in as `admin@assunnah.local`. The admin sees all 12,000 requests.
2. Filter by status **Closed**, then open any request.
3. Change the status back to **Open**. The form requires a **note** before it will save.
4. After saving, the activity history shows the change with the admin's note.

### Scenario 4: Two people edit the same request at once

1. Open the same request in two browser windows. Use a private or incognito window for the second one, and sign in as admin in both.
2. In window A, change the status and save.
3. In window B, without reloading, change the assignee and save.
4. Window B shows **"This request was changed by someone else"** and a **Reload latest** button. Nothing is overwritten.

### Scenario 5: Access control through direct links

1. As admin, open any request and copy its URL.
2. Sign out, then sign in as `requester.two@assunnah.local`.
3. Paste the URL. A "not found" page appears instead of someone else's data.
4. Sign out and open `http://localhost:3000/bn/dashboard`. You are sent to the login page.

---

## Features by role

The portal has four roles. Each role sees only the requests it is allowed to see, and the server enforces this on every page and API call.

### Admin

Full access to the whole request queue.

- Sees **all** service requests in the system.
- Creates new requests, and can assign an officer while creating.
- Opens any request to see its details and full activity history.
- Changes the **status** of any request (Open, In progress, Resolved, Closed).
- Assigns or reassigns any request to a manager, office staff member, or admin.
- Uses the **Assign** button in the request list to open the update form in a pop-up.
- Is the **only role that can change resolved or closed requests**, for example to reopen them.
- **Must write a note** whenever changing status or assignee. The note is stored in the activity history.
- Sees the officer workload panel on the request page.
- Uses the dashboard summary cards, search, filters, sorting, and pagination.

### Manager

Manages the requests in their own area of work.

- Sees requests **assigned to them**, plus any request they have acted on before.
- Creates new requests, and can assign an officer while creating.
- Opens a request to see its details and activity history.
- Changes the status of open and in-progress requests.
- Assigns or reassigns open and in-progress requests.
- Uses the **Assign** button in the request list.
- **Cannot** change requests that are already resolved or closed. The Assign button is greyed out, and its tooltip explains that only an admin can change them.
- Sees the officer workload panel.
- Uses the dashboard summary cards, search, filters, sorting, and pagination.

### Office staff

Handles day-to-day processing of assigned work.

- Sees requests **assigned to them**, plus any request they have acted on before.
- Creates new requests, and can assign an officer while creating.
- Opens a request to see its details and activity history.
- Changes the status of open and in-progress requests.
- Assigns or reassigns open and in-progress requests.
- Uses the **Assign** button in the request list.
- **Cannot** change resolved or closed requests (the same rule as managers).
- Sees the officer workload panel.
- Uses the dashboard summary cards, search, filters, sorting, and pagination.

### Requester

A staff member or stakeholder who needs a service.

- Sees **only the requests they submitted**.
- Submits new service requests with a subject, description, service, and priority.
- Opens their own requests to follow progress, read the activity history, and see the officer workload panel.
- **Edits their own request while it is still Open**: subject, description, service, and priority.
  - Each changed field is recorded as a separate entry in the activity history.
  - Once a request is In progress, Resolved, or Closed, the Edit button is greyed out, and its tooltip explains that it can no longer be edited.
- **Cannot** change status or assignee, and cannot see other people's requests.
- Does **not** see the staff update form or the Assign button.

### Permission summary

| Feature | Admin | Manager | Office | Requester |
|---|:---:|:---:|:---:|:---:|
| Sign in / sign out | Yes | Yes | Yes | Yes |
| Switch language (Bangla / English) | Yes | Yes | Yes | Yes |
| Requests visible | All | Assigned or acted on | Assigned or acted on | Own only |
| Dashboard summary cards | Yes | Yes | Yes | Yes |
| Search, filter, sort, paginate | Yes | Yes | Yes | Yes |
| Create a new request | Yes | Yes | Yes | Yes |
| Assign an officer when creating | Yes | Yes | Yes | No |
| View request details and activity | Yes | Yes | Yes | Own only |
| Edit subject, description, service, priority | No | No | No | Own, while Open |
| Change status | Yes | Yes | Yes | No |
| Assign / reassign officer | Yes | Yes | Yes | No |
| Assign button in the list | Yes | Yes | Yes | No |
| Change resolved or closed requests | Yes | No | No | No |
| Note required when changing status or assignee | Yes | No | No | Not applicable |
| Officer workload panel on the request page | Yes | Yes | Yes | Own requests |

---

## Features shared by all roles

### Sign in and access control
- Email and password login with a secure session.
- The "Forgot password" page is a placeholder screen and does not reset passwords yet. Use the seeded passwords from [`docs/CREDENTIALS.txt`](docs/CREDENTIALS.txt).
- Signed-out visitors are sent to the login page. Signed-in users who open the login page are sent to the dashboard.
- Pasting a link to a request you are not allowed to see shows a "not found" page, so no data is revealed.

### Dashboard
- Summary cards showing total requests and resolved/closed requests for your role.
- Request list with ID, subject, requester, category, priority, status, assignee, and last update time.
- **Search** by request ID or subject.
- **Filters** for status, category, priority, and assignee (including "Unassigned").
- **Sorting** by last updated, priority, or subject.
- **Pagination** with 10, 20, or 50 rows per page.
- Search, filters, sort, and page are kept in the URL, so a filtered view can be bookmarked or shared.
- On phones the list turns into cards. From tablet width up it is a table.

### Request details
- Full request information: requester, assignee, category, service, created time, updated time, and description.
- **Activity history** showing who did what and when: created, status changed, assignee changed, priority changed, subject, description, or service changed.
- The history shows the latest 50 entries first. **Load older activity** fetches more.

### New request form
- Pop-up form with Subject, Description, Service, and Priority. Staff also get an Assignee field.
- Validation runs on submit and explains any problem next to the field.
- If the service list fails to load, the form shows a **Try again** button.

### Language and accessibility
- Bangla and English, switchable from the header. Dates and numbers follow the selected language.
- Keyboard-friendly New Request and Edit pop-up: focus stays inside the form, **Escape** closes it, and focus returns to the button that opened it.
- Screen-reader labels on search, filters, tables, pagination, and form messages.

---

## Reliability and data protection

- **One assignee per request.** Assigning someone else replaces the current assignee. Earlier assignments stay visible in the activity history.
- **Protection against duplicate and conflicting saves.**
  - The Save button is disabled while a save is in progress.
  - Saving with nothing changed is rejected with "No changes to save".
  - If two people edit the same request at the same time, the first save wins. The second person sees "This request was changed by someone else" and a **Reload latest** button, so nobody silently overwrites someone else's change.
- **All-or-nothing saves.** A status or assignee change and its activity entry are saved together in a single database transaction. If any part fails, nothing is saved.
- **Slow or failed network.**
  - Requests time out after 15 seconds with a clear message.
  - Errors appear as a toast and as an inline message.
  - The screen keeps showing the last saved data until the server confirms a change.
- **Rate limiting.** Each user can make up to 20 create or update calls per minute, which blocks accidental repeat clicks and scripted spam.
- **Loading states.** Skeleton placeholders appear while pages load. If a page fails, it shows **Retry** and **Back to requests** buttons.
- **Database status.** If the database cannot be reached, a warning toast appears at the top right.
- **Passwords** are stored as bcrypt hashes and never in plain text.

---

## Environment variables

All settings live in the `.env` file in the project root. `.env` is not stored in Git. Copy `.env.example` to create it.

| Variable | Required | Example | Description |
|---|:---:|---|---|
| `DATABASE_URL` | Yes | `mysql://root:secret@127.0.0.1:3306/your_database_name` | MySQL connection string: user, password, host, port, and database name |
| `AUTH_SECRET` | Yes | *(random 32+ character string)* | Secret key used to sign login sessions. Keep it private, and use a different value in production. |
| `AUTH_TRUST_HOST` | Yes | `true` | Allows sign-in on the host the app runs on. Keep it `true`. |

Restart `npm run dev` after changing `.env`.

---

## Resetting and updating

### Start again with a fresh database

This **deletes all data**, recreates every table, and runs the seed again:

```bash
npx prisma migrate reset
```

Type `y` to confirm. If the seed does not run automatically, run `npm run db:seed` afterwards.

### Reset the demo passwords and sample data

```bash
npm run db:seed
```

This resets every demo password to `Password123!` and regenerates all sample requests.

### After pulling new code

```bash
git pull
npm install
npx prisma migrate deploy
npx prisma generate
npm run dev
```

### Run the automated tests

```bash
npm test
```

This runs unit tests for the role permissions, list query parsing, and form validation. It does not need the database. All tests should pass.

---

## Useful commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npx prisma migrate deploy` | Create or update the database tables |
| `npx prisma generate` | Generate the Prisma database client |
| `npm run db:seed` | Load demo users, services, and 12,000 requests |
| `npm run dev` | Start the development server on port 3000 |
| `npm run build` | Build for production |
| `npm start` | Run the production build |
| `npm run lint` | Check code style |
| `npm test` | Run unit tests (access rules, query parsing, validation) |
| `npx prisma studio` | Open a browser-based viewer for the database |
| `npx prisma migrate reset` | Delete all data, recreate the tables, and reseed |

---

## Troubleshooting

**"Database connection failed" toast, or pages load slowly**
- Make sure MySQL is running.
- Check that the database name, user, and password in `DATABASE_URL` are correct, and that the database exists.
- Restart `npm run dev` after editing `.env`.

**`Cannot find module '.../generated/prisma/...'`**
- Run `npx prisma generate`, then start the app again.

**The seed fails with a missing table error**
- Run `npx prisma migrate deploy` before `npm run db:seed`.

**Login does not work**
- Run `npm run db:seed` again to recreate the accounts and reset every password to `Password123!`.
- Make sure `AUTH_SECRET` is set in `.env`.

**`EPERM: operation not permitted, rename ... .next ...` (Windows)**
- Stop every running `npm run dev`, delete the `.next` folder, and start one dev server again. Only one dev server should run at a time.

**Port 3000 is already in use**
- Stop the other process, or run on another port: `npx next dev -p 3001`.

**`Access denied for user 'root'@'localhost'`**
- The username or password in `DATABASE_URL` is wrong. Check them in phpMyAdmin or MySQL Workbench, then update `.env`.

**`Unknown database 'your_database_name'`**
- The database does not exist yet. Repeat [Step 3](#step-3-create-the-database), or correct the database name at the end of `DATABASE_URL`.

**`npm run db:seed` is slow or looks stuck**
- It inserts 12,000 requests and their activity history, which takes one to two minutes. Wait until the command prints its summary and returns to the prompt.

**`ERESOLVE unable to resolve dependency tree` during install**
- Run `npm install --legacy-peer-deps`.

---

## Project structure

```
app/                    Pages, layouts, and API routes (Next.js App Router)
  [locale]/(guest)/     Login and public pages
  [locale]/(portal)/    Signed-in dashboard and request pages
  api/                  REST API routes for requests and authentication
components/             Reusable UI components (tables, forms, modals)
lib/                    Business logic, access rules, validation, API client
messages/               Bangla (bn.json) and English (en.json) text
prisma/                 Database schema, migrations, and seed script
docs/CREDENTIALS.txt    Demo user accounts and passwords
docs/INSTALL.txt        Short install guide
```

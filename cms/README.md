# WardCheck CMS

The standalone editorial content management system for the WardCheck website.

This project is a completely independent Strapi 5 application. It is **not** connected to
the AfyaScope Strapi CMS or to the WardCheck operational backend / PostgreSQL database.

## Responsibilities

This CMS manages **content only**.

- Articles (`/api/articles`)
- Salary Guides (`/api/salary-guides`)
- Career Guides (`/api/career-guides`)
- Workplace Guides (`/api/workplace-guides`)
- Authors (`/api/authors`)
- Categories (`/api/categories`)
- Tags (`/api/tags`)
- SEO metadata, featured images, related editorial content

The WardCheck operational backend remains responsible for facilities, facility reports,
users, moderation, approvals, statistics, search, facility APIs, and admin reporting.

> There is **no** database relationship between CMS content and the WardCheck operational
> facilities database. The frontend resolves related facilities using the existing WardCheck API.

## Tech Stack

- Strapi 5 (current stable, `5.51.2`)
- TypeScript
- PostgreSQL for production, SQLite for local development
- Cloudinary for media (fallback: local media library)
- Draft & Publish for all editorial content types
- REST API
- Strapi Admin

## Directory Layout

```
wardcheck/
├── (frontend)          # existing WardCheck frontend (repo root)
├── backend/            # existing WardCheck operational API
└── cms/                # this standalone CMS
```

The CMS owns its own `package.json`, `node_modules`, `config/`, `src/`, `public/`,
`database/` and `.tmp/`. It runs independently on port **1338**.

## Requirements

- Node.js >= 20 (Node 22 used during development)
- npm (the CMS uses its own npm-managed `node_modules`; it is isolated from the repo's pnpm workspace)

## Installation

```bash
cd cms
npm install
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your values. The CMS uses its own secrets —
do **not** reuse WardCheck backend secrets or AfyaScope secrets.

| Variable               | Description                                                    | Default      |
| ---------------------- | -------------------------------------------------------------- | ------------ |
| `HOST`                 | Bind host                                                      | `0.0.0.0`    |
| `PORT`                 | CMS port                                                       | `1338`       |
| `APP_KEYS`             | Comma separated app keys (generate fresh)                      | —            |
| `API_TOKEN_SALT`       | Salt for API tokens                                            | —            |
| `ADMIN_JWT_SECRET`     | Secret for the admin panel                                     | —            |
| `TRANSFER_TOKEN_SALT`  | Salt for transfer tokens                                       | —            |
| `JWT_SECRET`           | JWT secret                                                     | —            |
| `ENCRYPTION_KEY`       | Encryption key                                                 | —            |
| `DATABASE_CLIENT`      | `sqlite` (local) or `postgres` (production)                    | `sqlite`     |
| `DATABASE_FILENAME`    | SQLite file path (local dev)                                   | `.tmp/data.db` |
| `DATABASE_URL`         | PostgreSQL connection string (production)                      | —            |
| `DATABASE_HOST/PORT/NAME/USERNAME/PASSWORD/SSL` | PostgreSQL connection details (when not using `DATABASE_URL`) | — |
| `CLOUDINARY_NAME`       | Cloudinary cloud name                                          | —            |
| `CLOUDINARY_KEY`        | Cloudinary API key                                             | —            |
| `CLOUDINARY_SECRET`     | Cloudinary API secret                                          | —            |

> Never commit `.env`, database credentials, JWT secrets, or Cloudinary credentials.
> `.env` is git-ignored.

## Development

```bash
cd cms
npm run develop
```

Open the admin panel at `http://localhost:1338/admin` and create the first admin user.

The CMS listens on port **1338** to avoid colliding with the WardCheck frontend (Vite,
`5173`) and the WardCheck backend (`3001`).

```bash
# also available
npm run start        # run without watch mode / auto-reload
npm run build        # build the admin panel for production
npx strapi console   # interactive Strapi console
```

## Database Setup

### Local development (SQLite)

The default configuration uses SQLite at `cms/.tmp/data.db`. No setup required.

```bash
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db
```

### Production (PostgreSQL)

The CMS uses a **completely separate** PostgreSQL database from the WardCheck operational
database. Use a dedicated database name such as `wardcheck_cms`.

```bash
DATABASE_CLIENT=postgres
DATABASE_URL=postgresql://postgres:password@localhost:5432/wardcheck_cms?schema=public
```

or the individual `DATABASE_*` variables. Migrations are applied automatically by Strapi
on boot for schema changes you make via the Content-Type Builder.

- Backup the CMS database independently of the operational database.
- Do **not** point the CMS at the WardCheck operational PostgreSQL database.

## Cloudinary Setup

1. Create a Cloudinary account and grab your cloud name, API key, and API secret.
2. Set the environment variables:

```bash
CLOUDINARY_NAME=your-cloud
CLOUDINARY_KEY=your-key
CLOUDINARY_SECRET=your-secret
```

3. Restart the CMS. Uploads will be stored on Cloudinary.

If `CLOUDINARY_NAME` is empty, the CMS automatically falls back to the local media library
(`cms/public/uploads`), which is fine for local development.

> Cloudinary credentials are never hardcoded and are git-ignored.

## Draft & Publish

Draft & Publish is enabled for the four editorial content types:

- `Article`
- `Salary Guide`
- `Career Guide`
- `Workplace Guide`

Authors, categories, and tags do not use Draft & Publish. Publish an editorial entry from
the content manager (or via the document publish action) for it to appear in the REST API.

## Content Models

### Reusable components

- **shared.seo** — `seoTitle`, `seoDescription`, `seoKeywords`, `canonicalUrl`,
  `ogTitle`, `ogDescription`, `ogImage`. Used by all four editorial content types.
- **shared.social-link** — `label`, `url`. Used by Author (repeatable).

### Collection types

| Type               | Key fields                                                             | Notes                     |
| ------------------ | ---------------------------------------------------------------------- | ------------------------- |
| Article            | title, slug, excerpt, content (blocks), featuredImage, author, category, tags, seo | Draft & Publish on |
| Salary Guide       | title, slug, excerpt, content (blocks), featuredImage, author, profession, location, salaryRange, salaryNotes, category, tags, seo | Draft & Publish on |
| Career Guide       | title, slug, excerpt, content (blocks), featuredImage, author, category, tags, seo | Draft & Publish on |
| Workplace Guide    | title, slug, excerpt, content (blocks), featuredImage, author, category, tags, seo | Draft & Publish on |
| Author             | name, slug, bio, photo, role, email (`private`), socialLinks, relations to all editorial types | email excluded from public API |
| Category           | name, slug, description, relations to all editorial types                | tags/dedupe manually      |
| Tag                | name, slug, relations to all editorial types                             | many-to-many              |

### Relationships

- Author `1─N` Articles / Salary Guides / Career Guides / Workplace Guides
- Category `1─N` each editorial type
- Tag `N─N` each editorial type

### SEO

Each editorial type carries the reusable **shared.seo** component covering SEO title,
description, keywords, canonical URL, and Open Graph (title, description, image). The
models support URLs such as:

- `/articles/clinical-officer-salary-expectations-kenya`
- `/salary-guides/clinical-officer-salary-kenya`
- `/career-guides/how-to-evaluate-a-hospital-employer`
- `/workplace-guides/how-to-identify-a-good-healthcare-employer`

Frontend routing is out of scope for the CMS.

## REST API

The CMS exposes standard Strapi REST endpoints under `/api`.

| Endpoint                     | Description                          |
| ---------------------------- | ------------------------------------ |
| `GET /api/articles`          | List articles                        |
| `GET /api/articles/:id`      | Single article                       |
| `GET /api/salary-guides`     | List salary guides                   |
| `GET /api/salary-guides/:id` | Single salary guide                  |
| `GET /api/career-guides`     | List career guides                   |
| `GET /api/career-guides/:id` | Single career guide                  |
| `GET /api/workplace-guides`  | List workplace guides                |
| `GET /api/workplace-guides/:id` | Single workplace guide            |
| `GET /api/authors`           | List authors (email excluded)        |
| `GET /api/authors/:id`       | Single author (email excluded)       |
| `GET /api/categories`        | List categories                      |
| `GET /api/tags`              | List tags                            |

Only published documents are returned. Populate relations and media with `?populate=*`
(or specific fields), e.g.:

```bash
curl "https://cms.wardcheck.co.ke/api/articles?populate=*"
```

```json
{
  "data": [{
    "id": 1,
    "title": "Clinical Officer Salary Expectations in Kenya",
    "slug": "clinical-officer-salary-expectations-kenya",
    "content": [/* blocks */],
    "featuredImage": { "url": "..." },
    "author": { "name": "Dr. Jane Wanjiku", "...": "..." },
    "category": { "name": "Salary" },
    "tags": [{ "name": "Clinical Officer" }],
    "seo": { "seoTitle": "...", "seoDescription": "...", "canonicalUrl": "..." }
  }],
  "meta": { "pagination": { "page": 1, "pageSize": 25, "pageCount": 1, "total": 1 } }
}
```

### Public API permissions

Public (`/api`) permissions are **disabled by default** — public requests return `403`.

To publish content to the WardCheck frontend, enable `find` and `findOne` for the
editorial content types needed from:

```
Administration panel → Settings → Users & Permissions → Roles → Public → Permissions
```

Only grant `find` / `findOne`; never expose admin functionality publicly.

## Production Deployment

1. Provision a dedicated PostgreSQL database for the CMS (e.g. `wardcheck_cms`).
2. Configure `DATABASE_CLIENT=postgres` and `DATABASE_URL`, plus Cloudinary credentials.
3. Set fresh, strong secrets for `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`,
   `TRANSFER_TOKEN_SALT`, `JWT_SECRET`, and `ENCRYPTION_KEY`.
4. Build and start:

```bash
cd cms
npm ci
npm run build
npm run start
```

5. Front it with a reverse proxy / CDN. Site will live at `https://cms.wardcheck.co.ke`.
6. The WardCheck website consumes `https://cms.wardcheck.co.ke/api/*` with an API token
   (or with public `find`/`findOne` permissions if appropriate).

### Docker (example)

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 1338
CMD ["npm", "run", "start"]
```

## Scripts

| Script                  | Description                          |
| ----------------------- | ------------------------------------ |
| `npm run develop`       | Start with watch mode / auto-reload  |
| `npm run start`         | Start without watch mode             |
| `npm run build`         | Build the admin panel                |
| `npm run strapi`        | Run any Strapi CLI command           |
| `npm run upgrade`       | Upgrade Strapi to latest             |
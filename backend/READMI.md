# WardCheck Backend

Production backend for WardCheck.

WardCheck is a healthcare workplace transparency platform that helps healthcare workers make informed employment decisions through verified workplace reporting and facility statistics.

## Tech Stack

- NestJS
- TypeScript
- PostgreSQL
- Prisma ORM
- Neon Database
- JWT Authentication
- Swagger
- Helmet
- bcrypt
- class-validator

## Features

- Facility management
- Facility search
- Workplace report submission
- Report moderation
- National statistics
- Admin authentication
- Excel facility imports
- Health check endpoint

## Installation

Clone the repository.

```bash
git clone git@github.com:Afyascope/wardcheck.git
cd wardcheck/backend
```

Install dependencies.

```bash
npm install
```

Create a `.env` file.

```env
DATABASE_URL=

JWT_SECRET=

PORT=3000

NODE_ENV=development
```

Generate Prisma Client.

```bash
npx prisma generate
```

Run database migrations.

```bash
npx prisma migrate dev
```

Build the project.

```bash
npm run build
```

Start the server.

```bash
npm start
```

## Health Check

```
GET /health
```

Example response

```json
{
  "status": "ok",
  "database": "up",
  "uptime": 39.3,
  "version": "0.1.0"
}
```

## API Documentation

Swagger UI

```
http://localhost:3000/api/docs
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection string |
| JWT_SECRET | JWT signing secret |
| PORT | Application port |
| NODE_ENV | Environment |

## Current Status

- ✅ NestJS backend
- ✅ Prisma ORM
- ✅ PostgreSQL (Neon)
- ✅ Health endpoint
- ✅ Swagger documentation
- ✅ Authentication foundation
- ✅ Facilities module
- ✅ Reports module
- ✅ Statistics module
- ✅ Excel import foundation

## License

Private.

Copyright © AfyaScope Technologies.
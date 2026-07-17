# UNISCA Attendance Frontend

React frontend for the UNISCA attendance system.

## Requirements

- Bun
- Docker and Docker Compose, if running with containers

## Environment

Create a local `.env` file from the example:

```bash
cp .env.example .env
```

The default API URL is:

```text
REACT_APP_API_URL=http://localhost:8000/api
```

## Install

```bash
bun install
```

## Run Locally

```bash
bun run start
```

The app will be available at:

```text
http://localhost:3000
```

## Build

```bash
bun run build
```

The production files are generated in `build/`.

## Run With Docker Compose

```bash
docker compose up --build
```

This starts the React dev server on `http://localhost:3000`.

## Facial-recognition models

The production image downloads the face-api.js 0.22.2 model weights during its
build, then copies them to `/models`. This prevents Nginx's SPA fallback from
returning `index.html` in place of a model manifest.

For a local production-style build, download them before starting the app:

```bash
npm run download:face-models
```

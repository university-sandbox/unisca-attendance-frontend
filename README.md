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

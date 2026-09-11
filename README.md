# NetBase FE

###### NetBase FE

NetBase FE is a frontend application for managing assets, liabilities, and personal finance tracking with a minimalist and user-friendly interface.

## Technology Stack

`JavaScript` `React`

## Features

- User Registration
- User Login

## Demo

**LIVE URL** : `https://link-to-live-url`

## Installation

Follow these steps to install and run NetBase on your local machine:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/fazriegi/netbase-fe.git <your_project_name>
   ```

2. **Move to cloned repository folder**

   ```bash
   cd <your_project_name>
   ```

3. **Install dependecies**

   ```bash
   npm i
   ```

4. **Copy `example.config.json` to `config.json`**

   ```bash
   cp .env.example .env
   ```

5. **Configure your `.env`**
6. **Run the app**

   ```bash
   npm run dev
   ```

## Running with Docker (Recommended)

You can run the frontend application inside a container served via an optimized Nginx server using Docker and Docker Compose.

### Prerequisites

Make sure you have [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed.

### Steps to Run

1. **Copy `.env.example` to `.env`:**

   ```bash
   cp .env.example .env
   ```

2. **Configure your `.env`:**
   Adjust `VITE_BASE_URL` (points to the backend API), `VITE_APP_NAME`, and `PORT` (the port on your host machine to access the frontend, default: `3000`).

3. **Build and start the container:**

   ```bash
   docker compose up --build -d
   ```

   _Note: This will read the `.env` variables, pass them as build arguments to compile the production static files, and serve them via a lightweight Nginx container._

4. **Access the application:**
   Open your browser and navigate to `http://localhost:<PORT>` (e.g. `http://localhost:3000`).

5. **Check container status:**

   ```bash
   docker compose ps
   ```

6. **View logs:**

   ```bash
   docker compose logs -f
   ```

7. **Stop the container:**
   ```bash
   docker compose down
   ```

## CI/CD & Deployment

This project uses **GitHub Actions** for automated continuous integration and continuous deployment:

### 1. Continuous Integration (CI)
- Workflow file: `.github/workflows/ci.yml`
- Runs on: Every push and pull request to `master` and `development`.
- Validates code style and checks build integrity with `npm run lint` and `npm run build`.

### 2. Docker Image & Continuous Deployment (CD)
- Workflow file: `.github/workflows/deploy.yml`
- Runs on: Every push to `master` (or manual trigger via `workflow_dispatch`).
- Builds a production-ready Nginx container, tags it, and publishes it to **GitHub Container Registry** (`ghcr.io/fazriegi/netbase-fe:latest`).
- Automatically deploys to your remote server via SSH using `docker-compose.prod.yml`.

### Required GitHub Secrets & Variables

To enable automated deployment to your VPS, add the following secrets in GitHub (**Settings > Secrets and variables > Actions**):

| Secret / Variable | Type | Description |
|---|---|---|
| `SSH_HOST` | Secret | IP address or domain name of your remote server |
| `SSH_USER` | Secret | SSH username (e.g. `ubuntu`, `root`, or `deploy`) |
| `SSH_KEY` | Secret | Private SSH key for server access |
| `SSH_PORT` | Secret | *(Optional)* SSH port (defaults to `22`) |
| `REMOTE_TARGET_DIR` | Secret | *(Optional)* Directory on server (defaults to `~/netbase-fe`) |
| `VITE_BASE_URL` | Variable | *(Optional)* Backend API base URL for production builds |
| `VITE_APP_NAME` | Variable | *(Optional)* App name displayed in production |

### Production Deployment on Server

On your VPS, you only need `docker-compose.prod.yml` to run the latest published image:

```bash
# 1. Place docker-compose.prod.yml in your remote directory (e.g. ~/netbase-fe)
# 2. Pull and start the container
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

## Author

Fazri Egi - [Github](https://github.com/fazriegi)

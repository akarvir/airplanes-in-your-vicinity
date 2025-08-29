# 🐳 Docker Deployment Guide

This guide covers how to containerize and deploy the Airplane Tracker application using Docker.

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB RAM available
- Ports 3001, 80, 443 available

## 🚀 Quick Start

### 1. Build and Run with Docker Compose

```bash
# Build and start the application
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f
```

### 2. Access the Application

- **Frontend**: http://localhost:3001
- **API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health

## 🏗️ Build Options

### Option 1: Standard Build (Recommended)

```bash
# Build the image
docker build -t airplane-tracker .

# Run the container
docker run -d \
  --name airplane-tracker \
  -p 3001:3001 \
  -v airplane_data:/app/data \
  airplane-tracker
```

### Option 2: Production Build with Nginx

```bash
# Build production image
docker build -f Dockerfile.production -t airplane-tracker:production .

# Run production container
docker run -d \
  --name airplane-tracker-prod \
  -p 80:80 \
  -p 443:443 \
  -p 3001:3001 \
  -v airplane_data:/app/data \
  airplane-tracker:production
```

## 🔧 Docker Compose Configurations

### Development Mode

```bash
# Start development environment
docker-compose up --build

# Stop services
docker-compose down

# Remove volumes (clears database)
docker-compose down -v
```

### Production Mode

```bash
# Start production environment with nginx
docker-compose --profile production up --build

# Scale the application
docker-compose up --scale airplane-tracker=3
```

## 🌍 Environment Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Server Configuration
NODE_ENV=production
PORT=3001

# Database Configuration
DB_PATH=/app/data/airplanes.db

# API Configuration
AIRCRAFT_UPDATE_INTERVAL=30
USER_LOCATION_CACHE_DURATION=300

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000

# Optional: Aviation Stack API
AVIATION_API_KEY=your_api_key_here
```

### Docker Compose Environment

```yaml
environment:
  - NODE_ENV=production
  - PORT=3001
  - AIRCRAFT_UPDATE_INTERVAL=30
  - DB_PATH=/app/data/airplanes.db
```

## 📊 Container Management

### View Running Containers

```bash
# List all containers
docker ps

# List all containers (including stopped)
docker ps -a

# View container logs
docker logs airplane-tracker-app

# Follow logs in real-time
docker logs -f airplane-tracker-app
```

### Container Operations

```bash
# Stop container
docker stop airplane-tracker-app

# Start container
docker start airplane-tracker-app

# Restart container
docker restart airplane-tracker-app

# Remove container
docker rm airplane-tracker-app

# Execute commands in container
docker exec -it airplane-tracker-app sh
```

### Volume Management

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect airplane_data

# Remove volume (WARNING: This deletes all data)
docker volume rm airplane_data
```

## 🔒 Security Features

### Non-Root User
- Container runs as `nodejs` user (UID 1001)
- No root privileges
- Secure file permissions

### Signal Handling
- Uses `dumb-init` for proper signal propagation
- Graceful shutdown handling
- Process management

### Network Security
- Isolated network namespace
- Port exposure control
- Internal service communication

## 📈 Performance Optimization

### Multi-Stage Build
- Separate build and runtime stages
- Optimized image size
- Cached dependency layers

### Resource Limits

```yaml
# In docker-compose.yml
deploy:
  resources:
    limits:
      memory: 1G
      cpus: '0.5'
    reservations:
      memory: 512M
      cpus: '0.25'
```

### Health Checks

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' airplane-tracker-app

# View health check logs
docker inspect --format='{{json .State.Health}}' airplane-tracker-app | jq
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or use a different port
docker run -p 3002:3001 airplane-tracker
```

#### 2. Permission Denied
```bash
# Fix volume permissions
docker run --rm -v airplane_data:/app/data alpine chown -R 1001:1001 /app/data
```

#### 3. Container Won't Start
```bash
# Check container logs
docker logs airplane-tracker-app

# Check container status
docker inspect airplane-tracker-app

# Restart with fresh state
docker-compose down && docker-compose up --build
```

#### 4. Database Issues
```bash
# Access container shell
docker exec -it airplane-tracker-app sh

# Check database file
ls -la /app/data/

# Check database integrity
sqlite3 /app/data/airplanes.db "PRAGMA integrity_check;"
```

### Debug Mode

```bash
# Run with debug logging
docker run -e DEBUG=* airplane-tracker

# Interactive debugging
docker run -it --rm airplane-tracker sh
```

## 🌐 Production Deployment

### SSL/HTTPS Setup

1. **Generate SSL Certificates**
```bash
mkdir ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem -out ssl/cert.pem
```

2. **Use Production Dockerfile**
```bash
docker build -f Dockerfile.production -t airplane-tracker:prod .
```

3. **Run with SSL**
```bash
docker run -d \
  --name airplane-tracker-prod \
  -p 80:80 -p 443:443 \
  -v $(pwd)/ssl:/etc/nginx/ssl:ro \
  -v airplane_data:/app/data \
  airplane-tracker:prod
```

### Load Balancing

```yaml
# docker-compose.yml with multiple instances
services:
  airplane-tracker:
    build: .
    deploy:
      replicas: 3
    environment:
      - NODE_ENV=production
```

### Monitoring

```bash
# Resource usage
docker stats

# Container metrics
docker system df

# Log aggregation
docker-compose logs --tail=100 -f
```

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Deploy
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -t airplane-tracker .
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker tag airplane-tracker:latest ${{ secrets.REGISTRY }}/airplane-tracker:latest
          docker push ${{ secrets.REGISTRY }}/airplane-tracker:latest
```

## 📚 Additional Resources

### Docker Commands Reference

```bash
# Build with specific tag
docker build -t airplane-tracker:v1.0.0 .

# Push to registry
docker tag airplane-tracker:latest username/airplane-tracker:latest
docker push username/airplane-tracker:latest

# Pull from registry
docker pull username/airplane-tracker:latest

# Save/load images
docker save airplane-tracker > airplane-tracker.tar
docker load < airplane-tracker.tar
```

### Best Practices

1. **Always use specific base image tags**
2. **Implement health checks**
3. **Use multi-stage builds**
4. **Run as non-root user**
5. **Implement proper logging**
6. **Use .dockerignore files**
7. **Optimize layer caching**
8. **Scan images for vulnerabilities**

---

**Ready to deploy? Start with `docker-compose up --build` and enjoy your containerized airplane tracker!** 🚀✈️


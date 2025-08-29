# 🌍 Environment Configuration Guide

This guide explains how to configure environment variables for the Airplane Tracker application, both for local development and Docker deployment.

## 📋 Quick Setup

### 1. **Automatic Setup (Recommended)**
```bash
# Run the setup script to create .env from template
./setup-env.sh

# Edit the .env file with your values
nano .env
```

### 2. **Manual Setup**
```bash
# Copy the example file
cp env.example .env

# Edit with your values
nano .env
```

## 🔑 Required Environment Variables

### **Aviation API Configuration**

#### **Option 1: Aviation Stack (Recommended for enhanced data)**
```bash
# Get your API key from: https://aviationstack.com/
AVIATION_API_KEY=your_actual_api_key_here
AVIATION_API_BASE_URL=https://api.aviationstack.com/v1
```

#### **Option 2: OpenSky Network (Free, no key required)**
```bash
# Optional: For higher rate limits
OPENSKY_USERNAME=your_username_here
OPENSKY_PASSWORD=your_password_here
```

### **Server Configuration**
```bash
PORT=3001
NODE_ENV=production
```

### **Database Configuration**
```bash
DB_PATH=./data/airplanes.db
```

### **Update Intervals**
```bash
# How often to fetch aircraft data (in seconds)
AIRCRAFT_UPDATE_INTERVAL=30

# How long to cache user locations (in seconds)
USER_LOCATION_CACHE_DURATION=300
```

### **CORS Configuration**
```bash
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000
```

## 🐳 Docker Environment Integration

### **How It Works**

1. **Local .env file** contains your configuration
2. **Docker containers** automatically read these values
3. **No need to manually specify** environment variables
4. **Changes to .env** require container restart to take effect

### **Docker Compose**
```yaml
# Automatically loads .env file
env_file:
  - .env

# Uses values from .env with fallbacks
environment:
  - AVIATION_API_KEY=${AVIATION_API_KEY}
  - AIRCRAFT_UPDATE_INTERVAL=${AIRCRAFT_UPDATE_INTERVAL:-30}
```

### **Docker Run**
```bash
# Mount .env file and use its values
docker run -v $(pwd)/.env:/app/.env:ro \
  -e AVIATION_API_KEY=${AVIATION_API_KEY} \
  airplane-tracker
```

## 🔧 Configuration Examples

### **Basic Configuration (OpenSky Network only)**
```bash
# .env file
NODE_ENV=production
PORT=3001
AIRCRAFT_UPDATE_INTERVAL=30
USER_LOCATION_CACHE_DURATION=300
DB_PATH=./data/airplanes.db
ALLOWED_ORIGINS=http://localhost:3001

# OpenSky Network (optional)
OPENSKY_USERNAME=your_username
OPENSKY_PASSWORD=your_password
```

### **Enhanced Configuration (with Aviation Stack)**
```bash
# .env file
NODE_ENV=production
PORT=3001
AIRCRAFT_UPDATE_INTERVAL=15
USER_LOCATION_CACHE_DURATION=300
DB_PATH=./data/airplanes.db
ALLOWED_ORIGINS=http://localhost:3001

# Aviation Stack API
AVIATION_API_KEY=abc123def456ghi789
AVIATION_API_BASE_URL=https://api.aviationstack.com/v1

# OpenSky Network (fallback)
OPENSKY_USERNAME=your_username
OPENSKY_PASSWORD=your_password
```

### **Production Configuration**
```bash
# .env file
NODE_ENV=production
PORT=3001
AIRCRAFT_UPDATE_INTERVAL=60
USER_LOCATION_CACHE_DURATION=600
DB_PATH=/app/data/airplanes.db
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Aviation Stack API
AVIATION_API_KEY=your_production_api_key
AVIATION_API_BASE_URL=https://api.aviationstack.com/v1
```

## 🚀 Deployment Workflow

### **1. Setup Environment**
```bash
# Create .env file
./setup-env.sh

# Edit with your values
nano .env
```

### **2. Deploy with Docker**
```bash
# Option A: Use Docker Compose
docker-compose up --build

# Option B: Use the build script
./docker-build.sh

# Option C: Manual Docker commands
docker build -t airplane-tracker .
docker run -v $(pwd)/.env:/app/.env:ro airplane-tracker
```

### **3. Verify Configuration**
```bash
# Check container environment
docker exec airplane-tracker-app env | grep AVIATION

# Check API health
curl http://localhost:3001/api/health
```

## 🔍 Troubleshooting

### **Environment Variables Not Loading**

#### **Check .env file exists**
```bash
ls -la .env
```

#### **Verify file format**
```bash
# Should not have spaces around =
cat .env | grep AVIATION_API_KEY
```

#### **Check Docker container environment**
```bash
docker exec airplane-tracker-app env | grep AVIATION
```

### **Common Issues**

#### **1. "AVIATION_API_KEY is undefined"**
```bash
# Solution: Ensure .env file exists and has the key
echo "AVIATION_API_KEY=your_key_here" >> .env
```

#### **2. "Permission denied" when reading .env**
```bash
# Solution: Check file permissions
chmod 644 .env
```

#### **3. "Container can't find .env file"**
```bash
# Solution: Ensure .env is in the same directory as docker-compose.yml
ls -la .env docker-compose.yml
```

### **Debug Environment Loading**

#### **Enable debug logging**
```bash
# Add to .env file
DEBUG=airplane-tracker:*

# Or run container with debug
docker run -e DEBUG=* airplane-tracker
```

#### **Check container logs**
```bash
docker logs airplane-tracker-app | grep -i env
```

## 📊 Environment Variable Reference

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `AVIATION_API_KEY` | - | No* | Aviation Stack API key |
| `AVIATION_API_BASE_URL` | `https://api.aviationstack.com/v1` | No | Aviation Stack API base URL |
| `OPENSKY_USERNAME` | - | No | OpenSky Network username |
| `OPENSKY_PASSWORD` | - | No | OpenSky Network password |
| `PORT` | `3001` | No | Server port |
| `NODE_ENV` | `development` | No | Node.js environment |
| `DB_PATH` | `./data/airplanes.db` | No | SQLite database path |
| `AIRCRAFT_UPDATE_INTERVAL` | `30` | No | Aircraft data update frequency (seconds) |
| `USER_LOCATION_CACHE_DURATION` | `300` | No | User location cache duration (seconds) |
| `ALLOWED_ORIGINS` | `http://localhost:3001` | No | CORS allowed origins |

*Note: Either `AVIATION_API_KEY` or OpenSky credentials are recommended for best results.

## 🔄 Updating Configuration

### **After Changing .env**

#### **Docker Compose**
```bash
# Restart services to pick up new values
docker-compose restart

# Or rebuild and restart
docker-compose down && docker-compose up --build
```

#### **Docker Run**
```bash
# Stop and restart container
docker stop airplane-tracker-app
docker start airplane-tracker-app
```

### **Hot Reload (Development)**
```bash
# For development, changes to .env require restart
# No hot reload available for environment variables
```

## 🌟 Best Practices

1. **Never commit .env files** to version control
2. **Use different .env files** for different environments
3. **Set secure defaults** for production deployments
4. **Validate environment variables** at startup
5. **Use secrets management** for production API keys
6. **Monitor API usage** to stay within rate limits

## 📞 Support

For environment configuration issues:
1. Check the troubleshooting section above
2. Verify .env file format and permissions
3. Check container logs for error messages
4. Ensure Docker has access to the .env file

---

**Ready to configure? Run `./setup-env.sh` and start tracking planes!** 🚀✈️


# Docker Deployment Guide for Gregify

This guide provides comprehensive instructions for deploying the Gregify Chrome extension with its FastAPI backend using Docker on an AWS EC2 instance.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setting up the EC2 Instance](#setting-up-the-ec2-instance)
3. [Dockerizing the FastAPI Backend](#dockerizing-the-fastapi-backend)
4. [Deploying to EC2](#deploying-to-ec2)
5. [Configuring the Chrome Extension](#configuring-the-chrome-extension)
6. [Managing an Existing EC2 Deployment](#managing-an-existing-ec2-deployment)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance and Updates](#maintenance-and-updates)

## Prerequisites

Before starting, ensure you have:

- An AWS account
- Docker installed on your local machine
- Git installed on your local machine
- Basic knowledge of terminal/command line
- The Gregify repository cloned locally

## Setting up the EC2 Instance

### 1. Launch an EC2 Instance

1. Log in to the AWS Management Console
2. Navigate to EC2 service
3. Click "Launch Instance"
4. Select an Amazon Machine Image (AMI) - Linux 2023
5. Choose an instance type (t2.micro is sufficient for testing)
6. Configure instance details as needed
7. Add storage (default is usually sufficient)
8. Add tags (optional)
9. Configure security group:
   - Allow SSH (port 22) from your IP
   - Allow HTTP (port 80)
   - Allow HTTPS (port 443)
   - Allow custom TCP for your API port (8000)
10. Review and launch
11. Create or select an existing key pair and download it

### 2. Connect to Your EC2 Instance

```bash
# Change permissions for your key file
chmod 400 your-key-pair.pem

# Connect to your instance
ssh -i "your-key-pair.pem" ubuntu@your-ec2-public-dns.amazonaws.com
```

Or just connect online. Click the "Connect" button.

### 3. Install Docker on EC2

```bash
# Update the package index
sudo yum update

# Install Docker
sudo yum install -y docker

# Start Docker Service
sudo systemctl start docker

# Enable Docker Service on Boot
sudo systemctl enable docker

# Add ec2-user to the docker group so we can run docker without sudo
sudo usermod -a -G docker ec2-user

# Check Version
docker --version
```

### 4. Install Docker Compose

```bash
# Download the current stable release of Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Apply executable permissions
sudo chmod +x /usr/local/bin/docker-compose

# Verify the installation
docker-compose --version
```

## Dockerizing the FastAPI Backend

### 1. Create a Dockerfile

In your backend directory, create a `Dockerfile`:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=8000
ENV PYTHONPATH=/app

# Run the application
CMD ["python", "main.py"]
```

### 3. Create a .dockerignore file if you want to. I didnt.

```
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
*.egg-info/
.installed.cfg
*.egg
.env
.venv
venv/
ENV/
.git
.gitignore
```

## Deploying to EC2

### 1. Transfer Your Code to EC2

Pull from a Git repository:

```bash
# On your EC2 instance
git clone https://github.com/vikvang/gregify-backend.git 
cd gregify
git checkout sathwik-build
git pull

nano .env
# Copy paste the environment variables
# Ctrl+O, Enter, Ctrl+X
```

### 2. Build and Run the Docker Container

```bash
# Navigate to your backend directory on EC2
cd ~/backend

# Build and start your containers
docker-compose up -d --build

# Check if the container is running
docker ps

# View logs if needed
docker-compose logs -f
```

### 3. Test Your API

```bash
# Test your API endpoint
curl http://localhost:8000/health
```

## Configuring the Chrome Extension

### 1. Update Production Configuration

In your Chrome extension project, ensure your `config.js` has the correct EC2 IP address:

```javascript
// config.js
const config = {
  isProduction: true,
  api: {
    baseUrl: "http://your-ec2-public-ip", // Replace with your EC2 public IP
  },
  // ... other config options
};

export default config;
```

### 2. Update build-extension.js

Ensure your build script includes the correct EC2 IP address in the manifest:

```javascript
// In build-extension.js
content_security_policy: {
  extension_pages:
    "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; connect-src * http://localhost:* http://127.0.0.1:* https://* http://your-ec2-public-ip:8000/*"
},
host_permissions: [
  "http://localhost:*/*",
  "http://127.0.0.1:*/*",
  "http://your-ec2-public-ip/*",
],
```

### 3. Update apiService.ts

Make sure your API service uses the config settings:

```typescript
// In apiService.ts
import config from '../config';

export class ApiService {
  private static AGENT_URL = config.api.baseUrl;
  private static RAG_URL = `${config.api.baseUrl}/rag`;
  
  // ... rest of your service
}
```

### 4. Build and Test the Extension

```bash
# Build the extension
npm run build

# The built extension will be in the dist directory
# Load it in Chrome by going to chrome://extensions/
# Enable Developer mode and click "Load unpacked"
# Select the dist directory
```

## Managing an Existing EC2 Deployment

If you already have an EC2 instance with Docker and your application deployed, use these instructions to access and manage it.

### 1. Accessing Your Existing EC2 Instance

Option 1: SSH from your local machine:
```bash
# Connect to your EC2 instance using SSH with your actual key file and username
ssh -i "C:\Users\vedan\OneDrive\Documents\Gregify\gregify.pem" ec2-user@3.95.190.47
```

Option 2: Using AWS EC2 Instance Connect (easiest browser-based option):
```
1. Log in to the AWS Management Console (https://console.aws.amazon.com/)
2. Go to EC2 service
3. Select your instance (with IP 3.95.190.47)
4. Click "Connect" button at the top
5. Choose "EC2 Instance Connect" tab
6. Leave the default username (ec2-user)
7. Click "Connect" button
```
This opens a terminal in your browser directly connected to your instance - no SSH key needed!

Option 3: Using AWS CloudShell (browser-based terminal):
```bash
# 1. Log in to the AWS Management Console (https://console.aws.amazon.com/)
# 2. Click the CloudShell icon in the top navigation bar (shell icon)
# 3. Once CloudShell loads, you can connect to your EC2 instance:

# First, set up the key file in CloudShell
# Create the key file
nano gregify.pem
# Paste your private key content, then press Ctrl+X, Y, Enter to save

# Change permissions on the key file
chmod 400 gregify.pem

# Connect to your EC2 instance
ssh -i gregify.pem ec2-user@3.95.190.47
```

CloudShell benefits:
- No need to install anything locally
- Pre-authenticated with your AWS credentials
- Access from any browser
- Includes AWS CLI, tools, and utilities pre-installed

### 2. Check Status of Docker Containers

Once connected to your EC2 instance, check if your containers are running:

```bash
# List all running containers
docker ps

# List all containers (including stopped ones)
docker ps -a
```

### 3. Managing Your Docker Compose Setup

Navigate to your project directory:

```bash
# Go to your backend directory (adjust path if necessary)
cd ~/backend
```

Restart your Docker Compose setup:

```bash
# If Docker Compose is down and you need to start it
docker-compose up -d

# If you need to rebuild and restart (e.g., after code changes)
docker-compose down
docker-compose up -d --build
```

### 4. Viewing Application Logs

To see what's happening with your application:

```bash
# View all container logs
docker-compose logs -f

# View logs for a specific service
docker-compose logs -f api
```

### 5. Managing Docker Resources

```bash
# Remove unused Docker resources (helpful if disk space is running low)
docker system prune -a

# Check disk space usage by Docker
docker system df
```

### 6. Checking Server Resources

```bash
# Check CPU and memory usage
top

# Check disk space
df -h

# Check running processes
ps aux | grep docker
```

### 7. Updating Your Deployment

If you need to update your code:

```bash
# Pull latest changes if using Git
cd ~/backend
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Content Security Policy (CSP) Errors

If your extension cannot connect to the backend due to CSP errors:

- Check the `manifest.json` file to ensure it has the correct `content_security_policy` section
- Ensure the EC2 IP address is correctly included in both `connect-src` and `host_permissions`
- Use wildcard (`*`) for `connect-src` if needed

Example fix:
```json
"content_security_policy": {
  "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; connect-src * http://your-ec2-ip:8000/*"
},
"host_permissions": [
  "http://localhost:*/*",
  "http://your-ec2-ip:8000/*"
]
```

#### 2. API Connection Issues

If your extension can't connect to the API:

- Check if the API server is running on EC2 (`docker ps`)
- Verify the EC2 security group allows traffic on port 8000
- Make sure your API service is using the correct base URL from config
- Check network requests in Chrome DevTools for more detailed error info

#### 3. CORS Issues

If you encounter CORS errors:

- Ensure your FastAPI backend has CORS middleware configured properly:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Maintenance and Updates

### Updating Your Backend

To update your backend:

```bash
# SSH into your EC2 instance
ssh -i "your-key-pair.pem" ubuntu@your-ec2-public-dns.amazonaws.com

# Navigate to your backend directory
cd ~/backend

# Pull the latest changes if using git
git pull

# Rebuild and restart the containers
docker-compose down
docker-compose up -d --build
```

### Monitoring Logs

```bash
# View container logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api
```

### Backing Up Data

If your application stores data:

```bash
# Create a backup directory
mkdir -p ~/backups

# Backup database or volumes
docker run --rm --volumes-from your-data-container -v ~/backups:/backup busybox tar cvf /backup/backup-$(date +%Y%m%d).tar /path/to/data
```

## Security Considerations

For a production environment, consider:

1. Setting up HTTPS with Let's Encrypt
2. Restricting API access with authentication
3. Using environment variables for sensitive data
4. Limiting security group access to specific IPs
5. Implementing rate limiting on your API

## Conclusion

This guide provides a comprehensive approach to deploy Gregify's backend on AWS EC2 using Docker and configure the Chrome extension to communicate with it. Make sure to keep your EC2 instance, Docker containers, and dependencies updated for security and stability.

Remember that your EC2 public IP address (like the one we used: 3.95.190.47) may change if you stop and start your instance. Consider using an Elastic IP address if you need a static IP.
# Gregify Deployment

This directory contains the deployment configuration files for Gregify.

## Files

- `Dockerfile` - Docker configuration for building the application container
- `docker-compose.yaml` - Docker Compose configuration for orchestrating services
- `nginx.conf` - Nginx configuration for reverse proxy
- `Procfile` - Configuration for deploying to Heroku or other platforms

## Deployment Options

### Docker Deployment

To deploy using Docker:

```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f
```

### Heroku Deployment

The Procfile is configured for Heroku deployment. See the main [DEPLOYMENT.md](../docs/DEPLOYMENT.md) file for detailed instructions.

## Environment Variables

Make sure to set up the appropriate environment variables before deployment. See `.env.example` in the root directory for required variables.

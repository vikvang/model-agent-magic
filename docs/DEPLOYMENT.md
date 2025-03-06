# Gregify Deployment Guide

This guide provides step-by-step instructions for deploying the Gregify application, which consists of:

1. A FastAPI backend hosted on Railway
2. A Supabase database for storage and authentication
3. A Chrome extension published to the Chrome Web Store

## Prerequisites

- [Railway](https://railway.app/) account
- [Supabase](https://supabase.com/) account
- [Chrome Developer](https://developer.chrome.com/docs/webstore/register/) account ($5 one-time fee)
- [GitHub](https://github.com/) account (optional, but recommended)
- [OpenAI API key](https://platform.openai.com/) or [Perplexity API key](https://docs.perplexity.ai/)

## Part 1: Setting Up Supabase

### 1.1. Create a New Supabase Project

1. Log in to your Supabase account
2. Click "New project"
3. Fill out the project details:
   - Name: `gregify-prod` (or your preferred name)
   - Database Password: Create a strong password
   - Region: Choose a region close to your users
4. Click "Create new project"

### 1.2. Set Up Database Schema

1. In your Supabase project, navigate to the "SQL Editor" section
2. Create a new query
3. Copy and paste the contents of `backend/supabase/schema.sql`
4. Run the query to create the database tables and functions

### 1.3. Get API Credentials

1. In your Supabase project, navigate to the "Project Settings" → "API" section
2. Note down the following:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **API Key**: Use the "anon public" key for the extension

## Part 2: Deploying the Backend to Railway

### 2.1. Prepare Environment Variables

Create a file called `.env.production` in the `backend` directory with the following content:

```env
# Environment
ENVIRONMENT=production

# API Keys
OPENAI_API_KEY=your_openai_or_perplexity_api_key
PERPLEXITY_BASE_URL=https://api.perplexity.ai

# Supabase settings
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key

# Server settings
PORT=8000
HOST=0.0.0.0

# Security
JWT_SECRET=your_secure_random_string
JWT_EXPIRATION_MINUTES=1440

# Other settings can use defaults from .env.example
```

Replace the placeholder values with your actual API keys and credentials.

### 2.2. Deploy to Railway

#### Option 1: Using Railway CLI

1. Install the Railway CLI:

   ```bash
   npm install -g @railway/cli
   ```

2. Log in to Railway:

   ```bash
   railway login
   ```

3. Initialize a new project:

   ```bash
   cd backend
   railway init
   ```

4. Deploy the project:

   ```bash
   railway up
   ```

5. Add environment variables:
   ```bash
   railway vars set ENVIRONMENT=production
   railway vars set OPENAI_API_KEY=your_api_key
   # ... add all other variables from .env.production
   ```

#### Option 2: Using Railway Web Dashboard

1. Log in to [Railway Dashboard](https://railway.app/)
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your GitHub repository or click "Deploy from public repo" and enter your repository URL
4. Configure the project:
   - Root Directory: `backend`
   - Environment Variables: Add all variables from your `.env.production` file
5. Click "Deploy"

### 2.3. Get Your Production API URL

Once deployed, Railway will provide a URL for your API. It will look something like:

```
https://gregify-production.up.railway.app
```

Note this URL for configuring your Chrome extension.

## Part 3: Publishing the Chrome Extension

### 3.1. Update Extension Configuration

1. Open the `src/config.js` file (create it if it doesn't exist)
2. Add the following content:

```javascript
const config = {
  apiUrl:
    process.env.NODE_ENV === "production"
      ? "https://your-railway-app-url"
      : "http://localhost:8000",
  supabaseUrl: "https://your-supabase-project-id.supabase.co",
  supabaseKey: "your-supabase-anon-key",
};

export default config;
```

Replace the placeholder values with your actual production URLs.

### 3.2. Build the Extension

1. Install dependencies and build the production version:

   ```bash
   npm install
   npm run build
   ```

2. This will generate a `dist` folder with the production build.

### 3.3. Package the Extension

1. Compress the `dist` folder into a ZIP file:
   - On macOS/Linux: `cd dist && zip -r ../gregify.zip *`
   - On Windows: Right-click the `dist` folder → Send to → Compressed (zipped) folder

### 3.4. Publish to Chrome Web Store

1. Go to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. Click "New Item"
3. Upload the ZIP file (`gregify.zip`)
4. Fill out the store listing:
   - Detailed description
   - Store icon (at least 128x128 pixels)
   - Screenshot(s) of your extension in action
   - Choose relevant categories
   - Set pricing and visibility
5. Submit for review

The Chrome Web Store review process typically takes a few business days. You'll receive an email when your extension is approved or if further changes are needed.

## Part 4: Testing the Deployment

### 4.1. Test Backend API

1. Use your browser or a tool like Postman to access:
   ```
   https://your-railway-app-url/health
   ```
2. You should see a JSON response with the API health status

### 4.2. Test Supabase Connection

1. Use the register endpoint to create a test user:
   ```
   POST https://your-railway-app-url/auth/register
   {
     "email": "test@example.com",
     "password": "password123",
     "name": "Test User"
   }
   ```
2. Check the Supabase dashboard to confirm the user was created

### 4.3. Test Chrome Extension

1. Install your published extension from the Chrome Web Store
2. Open ChatGPT and use the extension
3. Verify that prompts are being enhanced and inserted correctly

## Part 5: Ongoing Maintenance

### 5.1. Monitoring

- Set up [Railway Metrics](https://docs.railway.app/reference/metrics) to monitor your API usage
- Use [Supabase Dashboard](https://app.supabase.io/) to monitor database activity

### 5.2. Updating the Deployment

To update your deployed backend:

1. Make changes to your code
2. If using Railway CLI:
   ```bash
   cd backend
   railway up
   ```
3. If using GitHub integration, simply push changes to your repository

To update your Chrome extension:

1. Make changes to your code
2. Build a new production version
3. Package and upload to the Chrome Web Store
4. Submit for review again

## Part 6: Troubleshooting

### Common Issues

#### Backend API Not Responding

- Check Railway logs for errors
- Verify environment variables are set correctly
- Confirm the API is running (`/health` endpoint)

#### Database Connection Issues

- Check Supabase dashboard for connection information
- Verify your IP is not blocked
- Check that database credentials are correct

#### Chrome Extension Problems

- Check browser console for errors
- Verify the manifest.json has correct permissions
- Ensure content scripts are properly targeting ChatGPT

### Getting Help

- Railway documentation: https://docs.railway.app/
- Supabase documentation: https://supabase.com/docs
- Chrome Web Store documentation: https://developer.chrome.com/docs/webstore/

## Part 7: Scaling Considerations

As your user base grows, consider the following:

### 7.1. Database Scaling

- Monitor your Supabase usage and upgrade to a higher tier if needed
- Consider implementing caching for frequently accessed data

### 7.2. API Rate Limiting

- Implement rate limiting to prevent abuse
- Consider a tiered approach based on user plans

### 7.3. Premium Features

- Consider implementing premium features like:
  - Custom roles and fine-tuning
  - Prompt history and templates
  - Team collaboration features
  - Analytics and insights

## Conclusion

You now have a fully deployed Gregify application with a backend on Railway, a database on Supabase, and a Chrome extension available in the Chrome Web Store. Users can install your extension and enhance their prompts with your multi-agent system.

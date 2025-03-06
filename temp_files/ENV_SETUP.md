# Environment Variables Setup

This document explains how to properly set up environment variables for the Gregify application.

## Security Warning

**NEVER commit your actual API keys to the repository!** 

GitHub has security measures that will block pushes containing API keys and other sensitive information. This is to protect you from accidentally exposing your credentials.

## Setting Up Environment Variables

1. Copy the example environment files to create your own:
   ```bash
   cp .env.example .env
   cp backend/agents/.env.example backend/agents/.env
   ```

2. Edit the `.env` and `backend/agents/.env` files to add your actual API keys:
   ```
   OPENAI_API_KEY=your_actual_openai_key_here
   DEEPSEEK_API_KEY=your_actual_deepseek_key_here
   ```

3. Make sure `.env` files are in your `.gitignore` to prevent them from being committed.

## If You've Already Committed API Keys

If you've already committed API keys to the repository, you can use the provided scripts to remove them:

### For Windows:
```powershell
.\remove_api_keys.ps1
```

### For macOS/Linux:
```bash
chmod +x remove_api_keys.sh
./remove_api_keys.sh
```

After running the script, commit the changes:
```bash
git add .env backend/agents/.env
git commit -m "Remove API keys"
git push
```

## Best Practices

1. Use environment variables for all sensitive information
2. Keep `.env` files in your `.gitignore`
3. Provide `.env.example` files with placeholders
4. Consider using a secrets management service for production environments 
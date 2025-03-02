#!/bin/bash

# This script removes API keys from .env files and replaces them with placeholders

# Root .env file
if [ -f .env ]; then
  echo "Cleaning root .env file..."
  sed -i 's/OPENAI_API_KEY=.*/OPENAI_API_KEY=your_openai_api_key_here/' .env
  sed -i 's/DEEPSEEK_API_KEY=.*/DEEPSEEK_API_KEY=your_deepseek_api_key_here/' .env
  echo "Done."
fi

# Backend .env file
if [ -f backend/agents/.env ]; then
  echo "Cleaning backend/agents/.env file..."
  sed -i 's/OPENAI_API_KEY=.*/OPENAI_API_KEY=your_openai_api_key_here/' backend/agents/.env
  sed -i 's/DEEPSEEK_API_KEY=.*/DEEPSEEK_API_KEY=your_deepseek_api_key_here/' backend/agents/.env
  echo "Done."
fi

echo "API keys have been removed from .env files."
echo "Please run 'git add .env backend/agents/.env' and commit the changes."
echo "Then try pushing again." 
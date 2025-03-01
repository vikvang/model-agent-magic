import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Print OpenAI API key
openai_key = os.getenv("OPENAI_API_KEY")
print(f"OpenAI API key: {openai_key[:10]}... (length: {len(openai_key) if openai_key else 0})")

# Check if any pplx key is loaded
if openai_key and openai_key.startswith("pplx-"):
    print("WARNING: Your OpenAI API key starts with 'pplx-', which indicates it's a Perplexity API key, not an OpenAI key")

# Check all paths where .env files might be
print("\nChecking .env files:")
paths = [
    ".",
    "../",
    "./agents",
    "../agents"
]

for path in paths:
    env_path = os.path.join(path, ".env")
    if os.path.exists(env_path):
        print(f"Found .env file at: {os.path.abspath(env_path)}")
        with open(env_path, "r") as f:
            lines = f.readlines()
            for line in lines:
                if "OPENAI_API_KEY" in line and not line.strip().startswith("#"):
                    print(f"  Contains OPENAI_API_KEY: {line.strip()[:30]}...") 
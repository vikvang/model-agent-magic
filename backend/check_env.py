import os
from dotenv import load_dotenv

# Load root .env file explicitly
root_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
print(f"Loading environment variables from: {root_env_path}")
load_dotenv(dotenv_path=root_env_path, override=True)

# Print OpenAI API key
openai_key = os.getenv("OPENAI_API_KEY")
print(f"OpenAI API key: {openai_key[:10]}... (length: {len(openai_key) if openai_key else 0})")

# Check if any pplx key is loaded
if openai_key and openai_key.startswith("pplx-"):
    print("WARNING: Your OpenAI API key starts with 'pplx-', which indicates it's a Perplexity API key, not an OpenAI key")

# Print DeepSeek API key
deepseek_key = os.getenv("DEEPSEEK_API_KEY")
print(f"DeepSeek API key: {deepseek_key[:10] if deepseek_key else 'None'}... (length: {len(deepseek_key) if deepseek_key else 0})")

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
                if ("OPENAI_API_KEY" in line or "DEEPSEEK_API_KEY" in line) and not line.strip().startswith("#"):
                    print(f"  Contains API KEY: {line.strip()[:30]}...") 
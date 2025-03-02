import os
from dotenv import load_dotenv

print("===== MAIN.PY ENVIRONMENT CHECK =====")

# First check environment before loading anything
deepseek_key_before = os.environ.get("DEEPSEEK_API_KEY", "Not set")
openai_key_before = os.environ.get("OPENAI_API_KEY", "Not set")

print(f"BEFORE LOADING:")
print(f"DEEPSEEK_API_KEY={deepseek_key_before[:5] if deepseek_key_before != 'Not set' else 'Not set'}... (length: {len(deepseek_key_before) if deepseek_key_before != 'Not set' else 0})")
print(f"OPENAI_API_KEY={openai_key_before[:5] if openai_key_before != 'Not set' else 'Not set'}... (length: {len(openai_key_before) if openai_key_before != 'Not set' else 0})")

# Load environment variables like main.py does
load_dotenv()

# Get keys after loading
deepseek_key = os.getenv("DEEPSEEK_API_KEY")
openai_key = os.getenv("OPENAI_API_KEY")

print(f"\nAFTER LOADING:")
print(f"DEEPSEEK_API_KEY={deepseek_key[:5] if deepseek_key else 'None'}... (length: {len(deepseek_key) if deepseek_key else 0})")
print(f"OPENAI_API_KEY={openai_key[:5] if openai_key else 'None'}... (length: {len(openai_key) if openai_key else 0})")

# Check for a potential backend/.env file that might be hidden
backend_env_path = os.path.join(os.getcwd(), ".env")
print(f"\nChecking for potential hidden .env file in backend directory:")
print(f"Path: {backend_env_path}")
print(f"Exists: {os.path.exists(backend_env_path)}")

# Walk the directory and look for all .env files with full permissions check
print("\nDetailed search for all .env files:")
for root, dirs, files in os.walk(".."):
    for file in files:
        if ".env" in file:
            full_path = os.path.join(root, file)
            try:
                readable = os.access(full_path, os.R_OK)
                hidden = os.path.basename(full_path).startswith(".")
                print(f"Found: {full_path} (Readable: {readable}, Hidden: {hidden})")
            except Exception as e:
                print(f"Error checking {full_path}: {e}")

print("\nCheck loading with explicit override:")
try:
    load_dotenv(override=True)
    deepseek_key_override = os.getenv("DEEPSEEK_API_KEY")
    openai_key_override = os.getenv("OPENAI_API_KEY")
    print(f"DEEPSEEK_API_KEY={deepseek_key_override[:5] if deepseek_key_override else 'None'}... (length: {len(deepseek_key_override) if deepseek_key_override else 0})")
    print(f"OPENAI_API_KEY={openai_key_override[:5] if openai_key_override else 'None'}... (length: {len(openai_key_override) if openai_key_override else 0})")
except Exception as e:
    print(f"Error with override loading: {e}") 
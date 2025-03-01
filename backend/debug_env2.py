import os
import sys

print("===== ENVIRONMENT VARIABLE DEBUGGING =====")
print("Current working directory:", os.getcwd())

# Check specific keys
deepseek_key = os.environ.get("DEEPSEEK_API_KEY", "Not set")
openai_key = os.environ.get("OPENAI_API_KEY", "Not set")

print("\nDEEPSEEK_API_KEY:")
if deepseek_key != "Not set":
    print(f"Value (first 5 chars): {deepseek_key[:5]}...")
    print(f"Length: {len(deepseek_key)}")
    if deepseek_key.startswith("sk-c7"):
        print("MATCH: This key matches the one shown in the output")
    elif deepseek_key.startswith("sk-53"):
        print("NOT MATCH: This is the key from the root .env file")
    else:
        print("UNKNOWN: This key doesn't match either known pattern")
else:
    print("Not set in environment")

print("\nOPENAI_API_KEY:")
if openai_key != "Not set":
    print(f"Value (first 5 chars): {openai_key[:5]}...")
    print(f"Length: {len(openai_key)}")
    if openai_key.startswith("sk-pr"):
        print("MATCH: This key matches the one shown in the output")
    elif openai_key.startswith("sk-proj"):
        print("NOT MATCH: This is the key from the root .env file")
    else:
        print("UNKNOWN: This key doesn't match either known pattern")
else:
    print("Not set in environment")

print("\nChecking environment sourcing:")
# Print all environment variables that might be related to configuration
for key in sorted(os.environ.keys()):
    if any(term in key.lower() for term in ["env", "path", "config", "profile", "api", "key"]):
        value = os.environ[key]
        print(f"{key}: {value[:10]}{'...' if len(value) > 10 else ''}")

print("\nAll .env files in the project:")
env_files = []
for root, dirs, files in os.walk(".."):
    for file in files:
        if file == ".env" or file.endswith(".env"):
            full_path = os.path.join(root, file)
            env_files.append(full_path)
            print(f"- {full_path}")
            
print("\nVirtual environments:")
for root, dirs, files in os.walk(".."):
    for dir in dirs:
        if "env" in dir.lower() or "venv" in dir.lower():
            print(f"- {os.path.join(root, dir)}") 
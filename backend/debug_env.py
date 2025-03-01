import os
import sys
from dotenv import load_dotenv

print("Current working directory:", os.getcwd())
print("Python executable:", sys.executable)
print("\nBEFORE LOADING ENV:")
for k in sorted(os.environ.keys()):
    if 'API_KEY' in k:
        print(f"{k}={os.environ[k][:5]}... (length: {len(os.environ[k])})")

print("\nLOADING ROOT .ENV:")
load_dotenv()
for k in sorted(os.environ.keys()):
    if 'API_KEY' in k:
        print(f"{k}={os.getenv(k)[:5]}... (length: {len(os.getenv(k))})")

print("\nLOADING AGENTS .ENV:")
load_dotenv("./agents/.env")
for k in sorted(os.environ.keys()):
    if 'API_KEY' in k:
        print(f"{k}={os.getenv(k)[:5]}... (length: {len(os.getenv(k))})")

print("\nTRYING WITH EXPLICIT PATH:")
try:
    abs_path = os.path.join(os.getcwd(), "../.env")
    print(f"Loading from {abs_path} (exists: {os.path.exists(abs_path)})")
    load_dotenv(abs_path)
    deepseek_key = os.getenv("DEEPSEEK_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    print(f"DEEPSEEK_API_KEY={deepseek_key[:5] if deepseek_key else None}... (length: {len(deepseek_key) if deepseek_key else 0})")
    print(f"OPENAI_API_KEY={openai_key[:5] if openai_key else None}... (length: {len(openai_key) if openai_key else 0})")
except Exception as e:
    print(f"Error: {e}")

print("\nCheck all .env files in the project:")
for root, dirs, files in os.walk(".."):
    for file in files:
        if file.endswith(".env"):
            print(f"Found .env file: {os.path.join(root, file)}") 
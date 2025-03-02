import os
from dotenv import load_dotenv

def check_key(label):
    key = os.getenv("OPENAI_API_KEY")
    if key:
        print(f"{label}: {key[:10]}... (length: {len(key)})")
    else:
        print(f"{label}: None")

# Start fresh
if "OPENAI_API_KEY" in os.environ:
    del os.environ["OPENAI_API_KEY"]

print("CHECKING DOTENV LOADING ORDER:")

# Check without any dotenv
check_key("No dotenv")

# Load root .env
load_dotenv("../.env")
check_key("After loading root .env")

# Load agents .env
load_dotenv("./agents/.env")
check_key("After loading agents/.env")

# Load agents .env again but with override=True
load_dotenv("./agents/.env", override=True)
check_key("After override loading agents/.env")

# Path check
import sys
print("\nPYTHON PATH:")
print(sys.path[0])

print("\nCURRENT DIRECTORY:")
print(os.getcwd()) 
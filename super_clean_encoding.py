
import os
import re

# Final list of fixes
FIXES = {
    "Responsabilitè": "Responsabilità",
    "responsabilitè": "responsabilità",
    "avrè": "avrà",
    "riceverè": "riceverà",
    "svolgerè": "svolgerà",
    "attivitè": "attività",
    "difficoltè": "difficoltà",
    "sarè": "sarà",
    "verrè": "verrà",
    "terrè": "terrà",
    "sarè": "sarà",
    "verrè": "verrà",
    "terrè": "terrà",
    "à¨": "è",
    "Ã¨": "è",
    "Ã ": "à",
    "è¢â€šÂ¬": "€",
    "â‚¬": "€",
}

def clean_file(filepath):
    print(f"Cleaning: {filepath}")
    
    # Read as bytes to detect and remove BOM
    with open(filepath, 'rb') as f:
        data = f.read()
    
    # Remove UTF-8 BOM
    if data.startswith(b'\xef\xbb\xbf'):
        data = data[3:]
        print(f"  Removed BOM from {filepath}")
    
    # Decode
    try:
        content = data.decode('utf-8')
    except UnicodeDecodeError:
        content = data.decode('latin-1')
        
    original = content
    
    # Positional fixes for HTML
    if filepath.endswith(".html"):
        # 1. Normalize Head structure
        # Remove empty lines between <head> and first tag
        content = re.sub(r'(<head\b[^>]*>)\s+', r'\1\n    ', content, flags=re.IGNORECASE)
        # Ensure <meta charset="UTF-8"> is the first line after <head>
        if "charset=\"UTF-8\"" in content.upper():
            # Already there, just make sure there is no junk before it
            pass
        else:
            # Insert it
            content = re.sub(r'(<head\b[^>]*>)', r'\1\n    <meta charset="UTF-8">', content, flags=re.IGNORECASE)

    # 2. String replacements
    for old, new in FIXES.items():
        content = content.replace(old, new)
    
    # 3. Case variants
    content = content.replace("RESPONSABILITè", "RESPONSABILITÀ")

    # Save
    if content != original:
        with open(filepath, 'w', encoding='utf-8', newline='') as f:
            f.write(content)
        print(f"  Updated strings in {filepath}")
    else:
        # Save anyway to ensure UTF-8 without BOM
        with open(filepath, 'w', encoding='utf-8', newline='') as f:
            f.write(content)

if __name__ == "__main__":
    for root, dirs, files in os.walk("."):
        if any(d in root for d in ["node_modules", ".git", "dist", ".gemini"]):
            continue
        for file in files:
            if file.endswith((".html", ".js", ".json", ".css")):
                if file in ["super_clean_encoding.py", "master_charset_fix.py"]: continue
                clean_file(os.path.join(root, file))

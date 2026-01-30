
import os
import re

MOJI_MAP = {
    "Ã¨": "è",
    "Ã ": "à",
    "Ã²": "ò",
    "Ã¹": "ù",
    "Ã¬": "ì",
    "Ã©": "é",
    "Ã³": "ó",
    "Ã€": "À",
    "Ãˆ": "È",
    "Ã’": "Ò",
    "Ã™": "Ù",
    "ÃŒ": "Ì",
    "è¢â€šÂ¬": "€",
    "â‚¬": "€",
    "Responsabilitè": "Responsabilità",
    "avrè": "avrà",
    "riceverè": "riceverà",
}

def fix_content(content, filepath):
    # 1. Remove Literal Double-Encoded BOM
    if content.startswith("ï»¿"):
        content = content[3:]
        print(f"  Removed Literal mojibake BOM from {filepath}")
    
    # 2. String fixes
    for old, new in MOJI_MAP.items():
        content = content.replace(old, new)
    
    content = content.replace("RESPONSABILITè", "RESPONSABILITÀ")

    # 3. HTML specific fixes
    if filepath.endswith(".html"):
        # Fix double charset
        # We'll just rebuild the head a bit
        head_match = re.search(r'(<head\b[^>]*>)', content, re.IGNORECASE)
        if head_match:
            head_tag = head_match.group(1)
            # Remove ALL existing charset meta tags
            content = re.sub(r'<meta\s+charset=["\']?[\w-]+["\']?\s*/?>', '', content, flags=re.IGNORECASE)
            
            # Re-insert the single correct one right after <head>
            content = re.sub(r'(<head\b[^>]*>)', r'\1\n    <meta charset="UTF-8">\n    ', content, flags=re.IGNORECASE, count=1)
            
            # Clean up potential white space mess created by removals
            content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)
            
    return content

def run_fix():
    for root, dirs, files in os.walk("."):
        if any(d in root for d in ["node_modules", ".git", "dist", ".gemini"]):
            continue
        for file in files:
            if file.lower().endswith((".html", ".js", ".css", ".json")):
                if "fix" in file: continue
                path = os.path.join(root, file)
                try:
                    # Read as bytes
                    with open(path, 'rb') as f:
                        raw = f.read()
                    
                    # Try to decode as UTF-8
                    try:
                        text = raw.decode('utf-8')
                    except:
                        text = raw.decode('latin-1')
                        
                    fixed = fix_content(text, path)
                    
                    # Write back as clean UTF-8
                    with open(path, 'w', encoding='utf-8', newline='') as f:
                        f.write(fixed)
                except Exception as e:
                    print(f"Error {path}: {e}")

if __name__ == "__main__":
    run_fix()
    print("Optimization Complete.")

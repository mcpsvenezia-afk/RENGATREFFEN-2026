
import os
import re

# Comprehensive map of mojibake and broken accents
REPLACEMENTS = {
    # Euro and currency
    "è¢â€šÂ¬": "€",
    "â‚¬": "€",
    "è¢â€šÂ": "€",
    "è¢â‚¬": "€",
    
    # Emojis (Triple byte messes)
    "è¢Ëœâ€¢": "☕",
    "à¢Ëœ€€¢": "☕",
    "è°Å¸Â Â ": "🍽️",
    "à°Å¸Â Â ": "🍽️",
    "è°Å¸Å½Â«": "🎟️",
    "à°Å¸Å½Â«": "🎟️",
    "è°Å¸â€ºÂ¡è¯Â¸Â ": "🛡️",
    "à°Å¸€€ºÂ¡à¯Â¸Â ": "🛡️",
    "è°Å¸Â â€ ": "🏆",
    "à°Å¸Â €€ ": "🏆",
    "è°Å¸Â¥â€¡": "🥇",
    "à°Å¸Â¥€€¡": "🥇",
    "è¢Å¡Â è¯Â¸Â ": "⚠️",
    "à¢Å¡Â à¯Â¸Â ": "⚠️",
    "è°Å¸Å¡Â²": "🏍️",
    "è°Å¸Å’Â²": "🏞️",
    "ðŸ—º": "🗺️",
    "ðŸ›£": "🛣️",
    "âš–": "⚖️",
    "â ¤": "❤️",

    # Accented characters - common double-encodings
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
    
    # Fragments and specific typos
    "avrè": "avrà",
    "riceverè": "riceverà",
    "Responsabilitè": "Responsabilità",
    "responsabilitè": "responsabilità",
    "svolgerè": "svolgerà",
    "attivitè": "attività",
    "difficoltè": "difficoltà",
    "caffà": "caffè",
    "caffèƒÂ¨": "caffè",
    "sarè": "sarà",
    "verrè": "verrà",
    "terrè": "terrà",
    "avverrè": "avverrà",
    "potrè": "potrà",
    "dovrè": "dovrà",
    "annullerè": "annullerà",
    "effettuà ": "effettuerà", # Usually this is the intent
}

def fix_html_head_and_charset(content):
    # Remove BOM if present
    content = content.replace('\ufeff', '')
    
    # 1. Ensure <meta charset="UTF-8"> is the first line after <head>
    # We find <head>, then remove any whitespace or tags before the first meta or title,
    # and insert/move charset=UTF-8 there.
    
    head_match = re.search(r'(<head\b[^>]*>)', content, re.IGNORECASE)
    if not head_match:
        return content
        
    head_end = head_match.end()
    
    # Search for existing charset meta
    charset_pattern = r'<meta\s+charset=["\']?UTF-8["\']?\s*/?>'
    existing_charset = re.search(charset_pattern, content, re.IGNORECASE)
    
    if existing_charset:
        # Remove existing one to reposition it
        content = content[:existing_charset.start()] + content[existing_charset.end():]
        # Re-calc head_end if it shifted
        head_match = re.search(r'(<head\b[^>]*>)', content, re.IGNORECASE)
        head_end = head_match.end()
    
    # Insert it right after <head>
    # We also remove excessive empty lines immediately after <head>
    post_head = content[head_end:].lstrip()
    content = content[:head_end] + "\n    <meta charset=\"UTF-8\">\n    " + post_head
    
    return content

def fix_mojibake(content):
    original = content
    # Sort keys by length descending to match longest sequences first
    for old in sorted(REPLACEMENTS.keys(), key=len, reverse=True):
        content = content.replace(old, REPLACEMENTS[old])
        # Also handle variants with different spaces if needed, but simple replace usually works
    return content

def process_file(filepath):
    print(f"Checking: {filepath}")
    try:
        # Read as bytes to handle potential encoding issues
        with open(filepath, 'rb') as f:
            raw = f.read()
            
        # Try UTF-8 first
        try:
            content = raw.decode('utf-8')
        except UnicodeDecodeError:
            # Fallback to latin-1
            content = raw.decode('latin-1')
            
        original = content
        
        # 1. Charset and Head fix (only for HTML)
        if filepath.endswith(".html"):
            content = fix_html_head_and_charset(content)
            
        # 2. Mojibake fix
        content = fix_mojibake(content)
        
        # 3. Text cleanings
        # Remove triple empty lines
        content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)
        
        if content != original:
            with open(filepath, 'w', encoding='utf-8', newline='') as f:
                f.write(content)
            print(f"  Fixed: {filepath}")
        else:
            # Still re-save as UTF-8 without BOM to normalize
            with open(filepath, 'w', encoding='utf-8', newline='') as f:
                f.write(content)
            # print(f"  Normalized: {filepath}")
            
    except Exception as e:
        print(f"  Error processing {filepath}: {e}")

if __name__ == "__main__":
    targets = [".html", ".js", ".json", ".css"]
    skip_dirs = ["node_modules", ".git", "dist", ".gemini"]
    
    for root, dirs, files in os.walk("."):
        if any(d in root for d in skip_dirs):
            continue
            
        for file in files:
            if any(file.endswith(ext) for ext in targets):
                if file in ["fix_encoding_master.py", "final_fix.py", "master_charset_fix.py"]:
                    continue
                process_file(os.path.join(root, file))

    print("--- Done ---")

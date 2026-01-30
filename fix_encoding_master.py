
import os
import re

replacements = {
    # Euro and currency
    "è¢â€šÂ¬": "€",
    "â‚¬": "€",
    "è¢â€šÂ": "€",
    
    # Accented characters - common double-encodings and mojibake
    "Ã¨": "è",
    "Ã ": "à",
    "Ã²": "ò",
    "Ã¹": "ù",
    "Ã¬": "ì",
    "Ã©": "é",
    "Ã³": "ó",
    "èƒÂ¨": "è",
    "èƒÂ ": "à",
    "èƒÂ²": "ò",
    "èƒÂ¹": "ù",
    "èƒÂ¬": "ì",
    "èƒÂ©": "é",
    "àƒÂ ": "à",
    "àƒÂ¨": "è",
    "àƒÂ²": "ò",
    "àƒÂ¹": "ù",
    "àƒÂ¬": "ì",
    "àƒ ": "à",
    "àƒ¨": "è",
    "àƒ²": "ò",
    "àƒ¹": "ù",
    "àƒ¬": "ì",
    "à ": "à",
    "è ": "à",
    "à¨": "è",
    "è¨": "è",
    "svolgeràƒ ": "svolgerà",
    "svolgerèƒÂ ": "svolgerà",
    "attivitàƒ ": "attività",
    "attivitèƒÂ ": "attività",
    "caffà": "caffè",
    "caffèƒÂ¨": "caffè",
    "Responsabilità ": "Responsabilità",
    "responsabilità ": "responsabilità",
    "effettuà ": "effettuà", # Should likely be effettua' or effettua
    
    # Emojis and special symbols
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
    "Â ": " ", # Non-breaking space junk
    "â€": "–", # En-dash
    "â€œ": "“",
    "â€": "”",
    
    # Duplication artifacts
    "La quota comprende:La quota comprende:": "La quota comprende:",
}

def fix_charset_meta(text):
    if "<head>" in text.lower():
        # Ensure charset is there
        if "charset=\"UTF-8\"" not in text and "charset='UTF-8'" not in text and "charset=UTF-8" not in text:
            text = re.sub(r'(<head\b[^>]*>)', r'\1\n    <meta charset="UTF-8">', text, flags=re.IGNORECASE)
        else:
            # If it's there but maybe not first, we could reorder but let's just make sure it's UTF-8
            pass
    return text

def fix_file(filepath):
    print(f"Processing: {filepath}")
    
    # Read as bytes to detect various encodings
    with open(filepath, 'rb') as f:
        raw_data = f.read()
    
    encodings = ['utf-8', 'latin-1', 'cp1252']
    text = None
    for enc in encodings:
        try:
            text = raw_data.decode(enc)
            # Check if it was double-encoded
            if enc == 'utf-8':
                # Sometimes UTF-8 content is read as Latin-1 then re-encoded as UTF-8
                # but for simplicity we'll just treat the decoded string
                pass
            break
        except UnicodeDecodeError:
            continue
    
    if text is None:
        print(f"Error: Could not decode {filepath}")
        return

    original_text = text
    
    # Applying replacements
    # Sort keys by length descending to avoid partial matches
    sorted_keys = sorted(replacements.keys(), key=len, reverse=True)
    for old in sorted_keys:
        text = text.replace(old, replacements[old])
    
    # Special case for isolated 'à' or 'è' mojibake fragments
    # Often 'à' followed by some garbage
    text = re.sub(r'à¨', 'è', text)
    text = re.sub(r'à ', 'à', text)
    text = re.sub(r'à²', 'ò', text)
    text = re.sub(r'à¹', 'ù', text)
    text = re.sub(r'à¬', 'ì', text)
    
    # Fix HTML charset
    if filepath.endswith(".html"):
        text = fix_charset_meta(text)
    
    if text != original_text:
        with open(filepath, 'w', encoding='utf-8', newline='') as f:
            f.write(text)
        print(f"Updated: {filepath}")
    else:
        # Still write back as UTF-8 to ensure consistency
        with open(filepath, 'w', encoding='utf-8', newline='') as f:
            f.write(text)
        print(f"Verified/Normalized: {filepath}")

if __name__ == "__main__":
    target_exts = (".html", ".js", ".json", ".css")
    for root, dirs, files in os.walk("."):
        # Skip certain directories
        if any(skip in root for skip in ["node_modules", "dist", ".git", ".gemini"]):
            continue
            
        for file in files:
            if file.lower().endswith(target_exts):
                if file == "fix_encoding.py": continue
                filepath = os.path.join(root, file)
                fix_file(filepath)

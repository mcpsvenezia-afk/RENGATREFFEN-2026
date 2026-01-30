
import os
import re

replacements = {
    "è¢â€šÂ¬": "€",
    "â‚¬": "€",
    "caffèƒÂ¨": "caffè",
    "caffà": "caffè",
    "èƒÂ¨": "è",
    "èƒÂ ": "à",
    "attivitèƒÂ ": "attività",
    "svolgerèƒÂ ": "svolgerà",
    "svolgeràƒ ": "svolgerà",
    "attivitàƒ ": "attività",
    "Responsabilità ": "Responsabilità",
    "responsabilità ": "responsabilità",
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
    "è°Å¸Â¥â€¡": "🏅",
    "à°Å¸Â¥€€¡": "🏅",
    "è¢Å¡Â è¯Â¸Â ": "⚠️",
    "à¢Å¡Â à¯Â¸Â ": "⚠️",
    "Ã¨": "è",
    "Ã ": "à",
    "Ã²": "ò",
    "Ã¹": "ù",
    "Ã¬": "ì",
    "Ã©": "é",
    "Ã³": "ó",
    "à¨": "è",
    "àƒÂ ": "à",
    "àƒ¨": "è",
    "à ": "à",
    "è¨": "è",
    "è ": "à",
    "La quota comprende:La quota comprende:": "La quota comprende:",
}

def fix_file(filepath):
    with open(filepath, 'rb') as f:
        data = f.read()
    
    # Try decoding as UTF-8 first
    try:
        text = data.decode('utf-8')
    except UnicodeDecodeError:
        # Fallback to latin-1 to avoid errors
        text = data.decode('latin-1')
        
    original = text
    for old, new in replacements.items():
        text = text.replace(old, new)
        
    if text != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"Fixed: {filepath}")

for root, dirs, files in os.walk("."):
    for file in files:
        if file.endswith(".html") and file != "temp_check.html":
            fix_file(os.path.join(root, file))

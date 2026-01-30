
import os
import re

def fix_regolamento():
    filepath = 'regolamento.html'
    if not os.path.exists(filepath): return
    
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()

    # Specific fixes for the quota section
    # ⚠️ replacement (the long hex mess)
    text = re.sub(r'à¢Å¡Â à¯Â¸Â ', '⚠️', text)
    # If the above failed, try the raw chars if possible
    text = text.replace('\xe0\xa2\xc5\xa1\xc2\xa0\xe0\xa2\xaf\xc2\xb8\xc2\x8f', '⚠️')
    
    # Shield icon 🛡️
    text = text.replace('<li> <strong>ISCRIZIONE FANGO CON TESSERA BASE', '<li>🛡️ <strong>ISCRIZIONE FANGO CON TESSERA BASE')
    
    # Medal icon 🏅
    text = text.replace('<li> <strong>Medaglia ricordo</strong>', '<li>🏅 <strong>Medaglia ricordo</strong>')
    
    # Bullet point/Coffee ☕
    text = text.replace('<li> <strong>Colazione</strong>', '<li>☕ <strong>Colazione</strong>')

    # Euro messes
    text = text.replace('è¢â€šÂ¬', '€')
    text = text.replace('â‚¬', '€')

    # Accent messes
    text = text.replace('à¨', 'è')
    text = text.replace('à ', 'à')
    text = text.replace('à²', 'ò')
    text = text.replace('à¹', 'ù')
    text = text.replace('à¬', 'ì')
    text = text.replace('àƒÂ ', 'à')
    text = text.replace('àƒÂ¨', 'è')
    text = text.replace('àƒÂ²', 'ò')
    text = text.replace('àƒÂ¹', 'ù')
    text = text.replace('àƒÂ¬', 'ì')
    text = text.replace('àƒ ', 'à')
    text = text.replace('àƒ¨', 'è')
    text = text.replace('àƒ²', 'ò')
    text = text.replace('àƒ¹', 'ù')
    text = text.replace('àƒ¬', 'ì')
    text = text.replace('èƒÂ¨', 'è')
    text = text.replace('èƒÂ ', 'à')
    text = text.replace('Ã¨', 'è')
    text = text.replace('Ã ', 'à')
    text = text.replace('Ã²', 'ò')
    text = text.replace('Ã¹', 'ù')
    text = text.replace('Ã¬', 'ì')
    text = text.replace('Ã©', 'é')
    text = text.replace('Ã³', 'ó')
    
    # Duplication
    text = text.replace('La quota comprende:La quota comprende:', 'La quota comprende:')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(text)
    print("Fixed regolamento.html specifically")

def global_fix():
    for root, dirs, files in os.walk("."):
        if any(skip in root for skip in ["node_modules", "dist", ".git", ".gemini"]):
            continue
        for file in files:
            if file.lower().endswith((".html", ".js", ".css")):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    original = content
                    content = content.replace('Ã¨', 'è')
                    content = content.replace('Ã ', 'à')
                    content = content.replace('Ã²', 'ò')
                    content = content.replace('Ã¹', 'ù')
                    content = content.replace('Ã¬', 'ì')
                    content = content.replace('Ã©', 'é')
                    content = content.replace('Ã³', 'ó')
                    content = content.replace('è¢â€šÂ¬', '€')
                    content = content.replace('â‚¬', '€')
                    
                    if content != original:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(content)
                        print(f"Fixed global patterns in: {filepath}")
                except:
                    pass

if __name__ == "__main__":
    fix_regolamento()
    global_fix()

import os
from PIL import Image

# Path to the source image
source_path = r'c:\Users\Utente\.gemini\antigravity\scratch\RENGATREFFEN\moto_race_hero_final.png'
# Output paths
root_output = r'c:\Users\Utente\.gemini\antigravity\scratch\RENGATREFFEN\og-image.png'
public_output = r'c:\Users\Utente\.gemini\antigravity\scratch\RENGATREFFEN\public\og-image.png'

def generate_og_image():
    try:
        with Image.open(source_path) as img:
            # Target size 1200x630
            target_width = 1200
            target_height = 630
            
            # Calculate aspect ratio
            img_ratio = img.width / img.height
            target_ratio = target_width / target_height
            
            if img_ratio > target_ratio:
                # Image is wider than target
                new_height = img.height
                new_width = int(img.height * target_ratio)
                left = (img.width - new_width) / 2
                top = 0
                right = left + new_width
                bottom = img.height
            else:
                # Image is taller than target
                new_width = img.width
                new_height = int(img.width / target_ratio)
                left = 0
                top = (img.height - new_height) / 2
                right = img.width
                bottom = top + new_height
            
            # Crop to aspect ratio
            img_cropped = img.crop((left, top, right, bottom))
            
            # Resize
            img_final = img_cropped.resize((target_width, target_height), Image.Resampling.LANCZOS)
            
            # Save
            img_final.save(root_output, "PNG")
            img_final.save(public_output, "PNG")
            print(f"Social preview image generated: {target_width}x{target_height}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    generate_og_image()

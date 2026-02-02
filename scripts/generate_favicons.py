import os
from PIL import Image

# Path to the source image
source_image_path = r'C:\Users\Utente\.gemini\antigravity\brain\63d6c61c-ab22-4401-b478-9742698e3e47\renga_treffen_r_icon_1770017828035.png'
# Output directory (root of the project)
project_root = r'c:\Users\Utente\.gemini\antigravity\scratch\RENGATREFFEN'
public_dir = os.path.join(project_root, 'public')

def generate_icons():
    try:
        with Image.open(source_image_path) as img:
            # Convert to RGBA if necessary
            img = img.convert("RGBA")
            
            # 1. favicon.ico (16x16, 32x32, 48x48)
            # favicon.ico usually contains multiple sizes
            ico_sizes = [(16, 16), (32, 32), (48, 48)]
            img.save(os.path.join(project_root, 'favicon.ico'), sizes=ico_sizes)
            img.save(os.path.join(public_dir, 'favicon.ico'), sizes=ico_sizes)
            print("Generated favicon.ico in root and public/")

            # 2. apple-touch-icon.png (180x180)
            apple_size = (180, 180)
            img.resize(apple_size, Image.Resampling.LANCZOS).save(os.path.join(project_root, 'apple-touch-icon.png'))
            img.resize(apple_size, Image.Resampling.LANCZOS).save(os.path.join(public_dir, 'apple-touch-icon.png'))
            print("Generated apple-touch-icon.png")

            # 3. android-chrome-192x192.png
            android_size_192 = (192, 192)
            img.resize(android_size_192, Image.Resampling.LANCZOS).save(os.path.join(project_root, 'android-chrome-192x192.png'))
            img.resize(android_size_192, Image.Resampling.LANCZOS).save(os.path.join(public_dir, 'android-chrome-192x192.png'))
            print("Generated android-chrome-192x192.png")

            # 4. android-chrome-512x512.png (Optional but standard)
            android_size_512 = (512, 512)
            img.resize(android_size_512, Image.Resampling.LANCZOS).save(os.path.join(project_root, 'android-chrome-512x512.png'))
            img.resize(android_size_512, Image.Resampling.LANCZOS).save(os.path.join(public_dir, 'android-chrome-512x512.png'))
            print("Generated android-chrome-512x512.png")

            # 5. favicon.png (Commonly linked)
            img.resize((32, 32), Image.Resampling.LANCZOS).save(os.path.join(project_root, 'favicon.png'))
            img.resize((32, 32), Image.Resampling.LANCZOS).save(os.path.join(public_dir, 'favicon.png'))
            print("Generated favicon.png")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    generate_icons()

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from PIL import Image
import os
import json
import requests
from tqdm import tqdm
import time

# ==================== CONFIGURATION ====================

parent_folder_name = "One Piece scans"
zip_folder = r"D:\ONE PIECE\One Piece scans"
output_file = r"D:\MON PORTAIL\manga\mangalinks.json"
credentials_file = r"D:\ONE PIECE\credentials.json"
token_file = r"D:\ONE PIECE\token.json"

max_image_size_mb = 5

# ==================== MODE URL ====================
USE_URL_MODE = True
base_url = "https://mangamoinsScans.mangamoins.com/64b55755e395/"   # termine par /
first_page = 1
num_pages = 16
chapter_number = 1188.0   # ← Change ici pour le prochain

# ======================================================

def download_image(url, save_path):
    try:
        r = requests.get(url, stream=True, timeout=20)
        if r.status_code == 200:
            with open(save_path, 'wb') as f:
                for chunk in r.iter_content(1024*1024):
                    f.write(chunk)
            return True
        else:
            print(f"Erreur {r.status_code} → {url}")
            return False
    except:
        return False


def convert_to_webp(input_path, output_path):
    try:
        with Image.open(input_path) as img:
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            img.save(output_path, 'WEBP', quality=82, method=6)
        return True
    except Exception as e:
        print(f"Erreur conversion {input_path} : {e}")
        return False


# ==================== AUTH GOOGLE ====================
SCOPES = ['https://www.googleapis.com/auth/drive']
creds = None

if os.path.exists(token_file):
    try:
        creds = Credentials.from_authorized_user_file(token_file, SCOPES)
    except:
        creds = None

if not creds or not creds.valid:
    print("Authentification requise...")
    flow = InstalledAppFlow.from_client_secrets_file(credentials_file, SCOPES)
    creds = flow.run_local_server(port=0)
    with open(token_file, 'w') as f:
        f.write(creds.to_json())

service = build('drive', 'v3', credentials=creds)

# ==================== DOSSIER PARENT ====================
query = f"name='{parent_folder_name}' and mimeType='application/vnd.google-apps.folder'"
results = service.files().list(q=query, fields="files(id, name)").execute()
parent_id = results.get('files', [{}])[0].get('id')

if not parent_id:
    folder = service.files().create(body={'name': parent_folder_name, 'mimeType': 'application/vnd.google-apps.folder'}, fields='id').execute()
    parent_id = folder.get('id')

# ==================== TÉLÉCHARGEMENT ====================
chapter_folder_name = f"Chapter_{int(chapter_number)}"
chapter_folder_path = os.path.join(zip_folder, chapter_folder_name)
os.makedirs(chapter_folder_path, exist_ok=True)

if USE_URL_MODE:
    print(f"\nTéléchargement du chapitre {chapter_number} ({num_pages} pages)...\n")
    
    for i in tqdm(range(first_page, num_pages + 1), desc="Download"):
        page_number = f"{i:02d}"
        page_url = f"{base_url}{page_number}.webp"
        
        temp_path = os.path.join(chapter_folder_path, f"temp_{page_number}.webp")
        
        if download_image(page_url, temp_path):
            final_path = os.path.join(chapter_folder_path, f"{page_number}.webp")
            convert_to_webp(temp_path, final_path)
            if os.path.exists(temp_path):
                os.remove(temp_path)
        else:
            print(f"❌ Page {page_number} introuvable")

    print("✅ Téléchargement terminé.\n")

# ==================== UPLOAD VERS GOOGLE DRIVE ====================
print(f"Création du dossier {chapter_folder_name} sur Drive...")

folder_metadata = {
    'name': chapter_folder_name,
    'mimeType': 'application/vnd.google-apps.folder',
    'parents': [parent_id]
}
folder = service.files().create(body=folder_metadata, fields='id').execute()
chapter_folder_id = folder.get('id')

image_urls = []
print("Upload des images vers Drive...")

for file_name in sorted(os.listdir(chapter_folder_path)):
    if file_name.endswith('.webp'):
        file_path = os.path.join(chapter_folder_path, file_name)
        
        # Conversion / Compression
        compressed_path = os.path.join(chapter_folder_path, f"comp_{file_name}")
        convert_to_webp(file_path, compressed_path)
        
        # Upload
        file_metadata = {'name': file_name, 'parents': [chapter_folder_id]}
        media = MediaFileUpload(compressed_path, mimetype='image/webp', resumable=True)
        
        try:
            uploaded_file = service.files().create(
                body=file_metadata, 
                media_body=media, 
                fields='id'
            ).execute()
            
            image_urls.append(f"https://drive.google.com/file/d/{uploaded_file.get('id')}/view")
            print(f"✓ {file_name} uploadé")
            
        except Exception as e:
            print(f"Erreur upload {file_name} : {e}")
        
        # Attente + suppression (solution au PermissionError Windows)
        time.sleep(0.3)
        try:
            if os.path.exists(compressed_path):
                os.remove(compressed_path)
        except:
            pass

# ==================== SAUVEGARDE JSON ====================
if image_urls:
    new_chapter = {"chapter": chapter_number, "imageUrls": image_urls}
    
    try:
        with open(output_file, 'r', encoding='utf-8') as f:
            all_chapters = json.load(f)
    except:
        all_chapters = []
    
    all_chapters.append(new_chapter)
    all_chapters.sort(key=lambda x: float(x['chapter']))
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_chapters, f, indent=2, ensure_ascii=False)
    
    print(f"\n🎉 Chapitre {chapter_number} ajouté avec succès ({len(image_urls)} pages)")
else:
    print("Aucune image uploadée.")
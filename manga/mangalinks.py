from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
import os
import json
import zipfile
import re
import mimetypes
import shutil

# Config
parent_folder_name = "One Piece scans"
zip_folder = r"D:\HakuNeko Desktop\One Piece scans"
output_file = r"D:\MON PORTAIL\manga\mangalinks.json"
credentials_file = r"D:\HakuNeko Desktop\Manga\credentials.json"
token_file = r"D:\HakuNeko Desktop\Manga\token.json"

# Authentification Google Drive API
SCOPES = ['https://www.googleapis.com/auth/drive']

def authenticate_drive():
    creds = None
    if os.path.exists(token_file):
        try:
            with open(token_file, 'r') as f:
                token_data = f.read().strip()
                if token_data:
                    creds = Credentials.from_authorized_user_file(token_file, SCOPES)
                    print(f"Credentials chargés depuis {token_file}")
                else:
                    print(f"{token_file} est vide, nouvelle authentification requise")
        except (json.JSONDecodeError, ValueError) as e:
            print(f"Erreur lecture {token_file}: {e}, nouvelle authentification requise")
            creds = None

    if not creds or not creds.valid:
        print("Aucune credential valide, lancement de l'authentification...")
        if not os.path.exists(credentials_file):
            print(f"Erreur : {credentials_file} n'existe pas. Veuillez le créer via Google Cloud Console.")
            exit()
        try:
            flow = InstalledAppFlow.from_client_secrets_file(credentials_file, SCOPES)
            creds = flow.run_local_server(port=0)
            with open(token_file, 'w') as f:
                f.write(creds.to_json())
            print(f"Credentials sauvegardés dans {token_file}")
        except Exception as e:
            print(f"Erreur lors de l'authentification : {str(e)}")
            exit()

    service = build('drive', 'v3', credentials=creds)
    about = service.about().get(fields="user").execute()
    print(f"Connecté avec le compte Google : {about['user']['emailAddress']}")
    return service

# Trouver ou créer un dossier sur Google Drive
def get_or_create_folder(service, folder_name, parent_id=None):
    try:
        query = f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder'"
        if parent_id:
            query += f" and '{parent_id}' in parents"
        results = service.files().list(
            q=query,
            fields="files(id, name)",
            spaces='drive',
            supportsAllDrives=True
        ).execute()
        folders = results.get('files', [])
        if folders:
            print(f"Dossier trouvé : {folder_name} (ID: {folders[0]['id']})")
            return folders[0]['id']
        folder_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        if parent_id:
            folder_metadata['parents'] = [parent_id]
        folder = service.files().create(body=folder_metadata, fields='id').execute()
        print(f"Dossier créé : {folder_name} (ID: {folder.get('id')})")
        return folder.get('id')
    except Exception as e:
        print(f"Erreur lors de la gestion du dossier {folder_name} : {e}")
        raise

# Uploader une image sur Google Drive
def upload_image(service, file_path, file_name, folder_id):
    try:
        mime_type, _ = mimetypes.guess_type(file_path)
        if not mime_type or not mime_type.startswith('image/'):
            mime_type = 'image/jpeg'
        file_metadata = {
            'name': file_name,
            'parents': [folder_id],
            'visibility': 'anyoneWithLink'
        }
        media = MediaFileUpload(file_path, mimetype=mime_type)
        file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id'
        ).execute()
        image_id = file.get('id')
        image_url = f"https://drive.google.com/file/d/{image_id}/view"
        print(f"Image uploadée : {file_name} -> {image_url}")
        return image_url
    except Exception as e:
        print(f"Erreur lors de l'upload de {file_name} : {e}")
        raise

def main():
    # Authentification
    service = authenticate_drive()

    # Charger les chapitres existants
    existing_chapters = []
    if os.path.exists(output_file):
        try:
            with open(output_file, 'r') as f:
                existing_chapters = json.load(f)
            print(f"Chargé {len(existing_chapters)} chapitres depuis {output_file}")
        except (json.JSONDecodeError, ValueError) as e:
            print(f"Erreur lecture {output_file}: {e}, création d'un nouveau fichier")

    last_chapter_num = max(float(ch['chapter']) for ch in existing_chapters) if existing_chapters else 0
    print(f"Dernier chapitre dans mangalinks.json : {last_chapter_num}")

    # Vérifier le dossier des ZIPs
    if not os.path.exists(zip_folder):
        print(f"Erreur : Le dossier {zip_folder} n'existe pas.")
        exit()

    zip_files = [f for f in os.listdir(zip_folder) if f.lower().endswith('.zip') and f.lower().startswith('op')]
    if not zip_files:
        print("Aucun fichier ZIP trouvé commençant par 'OP'. Tout est à jour !")
        exit()
    print(f"Fichiers ZIP détectés : {zip_files}")

    # Trouver ou créer le dossier parent
    parent_id = get_or_create_folder(service, parent_folder_name)

    new_chapters = []
    for zip_file in zip_files:
        match = re.match(r'(?i)OP(\d+)\.zip', zip_file)
        if not match:
            print(f"Fichier ZIP ignoré (nom invalide) : {zip_file}")
            continue
        chapter_num = float(match.group(1))
        if chapter_num <= last_chapter_num:
            print(f"Chapitre {chapter_num} déjà traité, ignoré.")
            continue

        zip_path = os.path.join(zip_folder, zip_file)
        chapter_folder_name = f"Chapter_{int(chapter_num)}"
        chapter_folder_path = os.path.join(zip_folder, chapter_folder_name)

        # Vérifier le ZIP
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                if zip_ref.testzip() is not None:
                    print(f"Erreur : {zip_file} est corrompu.")
                    continue
        except zipfile.BadZipFile as e:
            print(f"Erreur : {zip_file} n'est pas un fichier ZIP valide ({str(e)}).")
            continue

        # Extraire le ZIP dans le dossier Chapter_XXXX
        print(f"Extraction de {zip_file} vers {chapter_folder_path}...")
        try:
            # Supprimer le dossier s'il existe déjà
            if os.path.exists(chapter_folder_path):
                shutil.rmtree(chapter_folder_path)
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(chapter_folder_path)
            print(f"Extraction de {zip_file} réussie.")
        except Exception as e:
            print(f"Erreur lors de l'extraction de {zip_file} : {str(e)}")
            continue

        # Créer le dossier du chapitre sur Google Drive
        chapter_folder_id = get_or_create_folder(service, chapter_folder_name, parent_id)

        # Uploader les images
        image_urls = []
        for file_name in sorted(os.listdir(chapter_folder_path)):
            if file_name.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                file_path = os.path.join(chapter_folder_path, file_name)
                try:
                    image_url = upload_image(service, file_path, file_name, chapter_folder_id)
                    image_urls.append(image_url)
                except Exception as e:
                    print(f"Ignoré : {file_name} (upload échoué)")
                    continue

        if image_urls:
            new_chapters.append({
                "chapter": int(chapter_num),
                "imageUrls": image_urls
            })

        # Supprimer le fichier ZIP
        try:
            os.remove(zip_path)
            print(f"Fichier ZIP {zip_file} supprimé.")
        except Exception as e:
            print(f"Erreur lors de la suppression de {zip_file} : {e}")

    # Mettre à jour mangalinks.json
    if new_chapters:
        all_chapters = existing_chapters + new_chapters
        all_chapters.sort(key=lambda x: float(x['chapter']))
        with open(output_file, 'w') as f:
            json.dump(all_chapters, f, indent=2)
        print(f"Liens sauvegardés dans {output_file}")
    else:
        print("Aucun nouveau chapitre valide traité.")

if __name__ == "__main__":
    main()
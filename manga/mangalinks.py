from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
import os
import json
import zipfile
import re
import mimetypes

# Config
parent_folder_name = "One Piece scans"  # Nom du dossier parent sur Drive
zip_folder = r"D:\HakuNeko Desktop\One Piece scans"  # Dossier contenant les ZIPs
output_file = r"manga\mangalinks.json"
credentials_file = r"D:\HakuNeko Desktop\Manga\credentials.json"
token_file = r"D:\HakuNeko Desktop\Manga\token.json"

# Authentification Google Drive API
SCOPES = ['https://www.googleapis.com/auth/drive']
creds = None

# Étape 1 : Vérifier si token.json existe et est valide
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

# Étape 2 : Si pas de credentials valides, authentification manuelle
if not creds or not creds.valid:
    print("Aucune credential valide, lancement de l'authentification...")
    try:
        if not os.path.exists(credentials_file):
            print(f"Erreur : {credentials_file} n'existe pas. Veuillez le créer via Google Cloud Console.")
            exit()
        
        flow = InstalledAppFlow.from_client_secrets_file(credentials_file, SCOPES)
        creds = flow.run_local_server(port=0)
        with open(token_file, 'w') as f:
            f.write(creds.to_json())
        print(f"Credentials sauvegardés dans {token_file}")
    except Exception as e:
        print(f"Erreur lors de l'authentification : {str(e)}")
        print("Vérifiez que :")
        print("- credentials.json est valide et inclut le scope 'https://www.googleapis.com/auth/drive'.")
        print("- Vous êtes connecté au bon compte Google avec accès au dossier 'One Piece scans'.")
        exit()

# Utiliser les credentials
service = build('drive', 'v3', credentials=creds)

# Vérifier le compte authentifié
try:
    about = service.about().get(fields="user").execute()
    user_email = about['user']['emailAddress']
    print(f"Connecté avec le compte Google : {user_email}")
except Exception as e:
    print(f"Erreur lors de la vérification du compte Google : {e}")

# Charger les chapitres existants depuis mangalinks.json
existing_chapters = []
if os.path.exists(output_file):
    try:
        with open(output_file, 'r') as f:
            existing_chapters = json.load(f)
        print(f"Chargé {len(existing_chapters)} chapitres existants depuis {output_file}")
    except (json.JSONDecodeError, ValueError) as e:
        print(f"Erreur lecture {output_file}: {e}, création d'un nouveau fichier")
        existing_chapters = []

# Trouver le dernier chapitre dans mangalinks.json
last_chapter_num = 0
if existing_chapters:
    try:
        last_chapter_num = max(float(chapter['chapter']) for chapter in existing_chapters)
        print(f"Dernier chapitre dans mangalinks.json : {last_chapter_num}")
    except (ValueError, KeyError) as e:
        print(f"Erreur lors de la recherche du dernier chapitre : {e}")
        last_chapter_num = 0

# Vérifier que le dossier zip_folder existe
if not os.path.exists(zip_folder):
    print(f"Erreur : Le dossier {zip_folder} n'existe pas.")
    exit()

# Vérifier les fichiers dans le dossier local
print(f"Scan du dossier {zip_folder} pour les fichiers ZIP...")
all_files = os.listdir(zip_folder)
print(f"Fichiers trouvés dans {zip_folder} : {all_files}")

# Filtrer les fichiers ZIP (insensible à la casse)
zip_files = [f for f in all_files if f.lower().endswith('.zip') and f.lower().startswith('op')]
if not zip_files:
    print("Aucun fichier ZIP trouvé commençant par 'OP' et finissant par '.zip'. Tout est à jour !")
    exit()
else:
    print(f"Fichiers ZIP détectés : {zip_files}")

# Trouver ou créer le dossier parent sur Google Drive
query = f"name='{parent_folder_name}' and mimeType='application/vnd.google-apps.folder'"
results = service.files().list(
    q=query,
    fields="files(id, name)",
    spaces='drive',
    supportsAllDrives=True
).execute()
folders = results.get('files', [])
if not folders:
    print(f"Dossier '{parent_folder_name}' non trouvé. Création du dossier...")
    folder_metadata = {
        'name': parent_folder_name,
        'mimeType': 'application/vnd.google-apps.folder'
    }
    try:
        folder = service.files().create(body=folder_metadata, fields='id').execute()
        parent_id = folder.get('id')
        print(f"Dossier créé : {parent_folder_name} (ID: {parent_id})")
    except Exception as e:
        print(f"Erreur lors de la création du dossier {parent_folder_name} : {e}")
        exit()
else:
    parent_id = folders[0]['id']
    print(f"Dossier parent trouvé : {parent_folder_name} (ID: {parent_id})")

# Traiter chaque fichier ZIP
new_chapters = []
for zip_file in zip_files:
    # Extraire le numéro du chapitre depuis le nom du ZIP (ex: OP1148.zip -> 1148)
    match = re.match(r'(?i)OP(\d+)\.zip', zip_file)
    if not match:
        print(f"Fichier ZIP ignoré (nom invalide) : {zip_file}")
        continue
    chapter_num = float(match.group(1))
    if chapter_num <= last_chapter_num:
        print(f"Chapitre {chapter_num} déjà traité, ignoré.")
        continue

    chapter_folder_name = f"Chapter_{int(chapter_num)}"
    chapter_folder_path = os.path.join(zip_folder, chapter_folder_name)
    zip_path = os.path.join(zip_folder, zip_file)

    # Vérifier la taille du fichier
    file_size = os.path.getsize(zip_path)
    print(f"Taille de {zip_file} : {file_size} octets")

    # Vérifier le type MIME du fichier
    mime_type, _ = mimetypes.guess_type(zip_path)
    print(f"Type MIME de {zip_file} : {mime_type if mime_type else 'Inconnu'}")

    # Vérifier si le fichier est un ZIP valide
    print(f"Vérification de {zip_file}...")
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            if zip_ref.testzip() is not None:
                print(f"Erreur : {zip_file} est corrompu (fichiers internes invalides). Vérifiez le fichier manuellement.")
                continue
            print(f"{zip_file} est un fichier ZIP valide.")
    except zipfile.BadZipFile as e:
        print(f"Erreur : {zip_file} n'est pas un fichier ZIP valide ({str(e)}). Essayez de l'ouvrir avec 7-Zip ou retéléchargez-le.")
        continue
    except Exception as e:
        print(f"Erreur inattendue lors de la vérification de {zip_file} : {str(e)}")
        continue

    # Étape 1 : Extraire le ZIP
    print(f"Extraction de {zip_file} vers {chapter_folder_name}...")
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(chapter_folder_path)
        print(f"Extraction de {zip_file} réussie.")
    except Exception as e:
        print(f"Erreur lors de l'extraction de {zip_file} : {str(e)}")
        continue

    # Étape 2 : Supprimer le fichier ZIP après extraction
    try:
        os.remove(zip_path)
        print(f"Fichier ZIP {zip_file} supprimé avec succès.")
    except Exception as e:
        print(f"Erreur lors de la suppression de {zip_file} : {str(e)}")
        continue

    # Étape 3 : Créer le dossier Chapter_XXXX sur Google Drive
    print(f"Création du dossier {chapter_folder_name} sur Google Drive...")
    folder_metadata = {
        'name': chapter_folder_name,
        'mimeType': 'application/vnd.google-apps.folder',
        'parents': [parent_id]
    }
    try:
        folder = service.files().create(body=folder_metadata, fields='id').execute()
        chapter_folder_id = folder.get('id')
        print(f"Dossier créé : {chapter_folder_name} (ID: {chapter_folder_id})")
    except Exception as e:
        print(f"Erreur lors de la création du dossier {chapter_folder_name} : {e}")
        continue

    # Étape 4 : Uploader les images .jpg
    image_urls = []
    for file_name in os.listdir(chapter_folder_path):
        if file_name.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
            file_path = os.path.join(chapter_folder_path, file_name)
            print(f"Upload de {file_name} vers {chapter_folder_name}...")
            file_metadata = {
                'name': file_name,
                'parents': [chapter_folder_id]
            }
            media = MediaFileUpload(file_path, mimetype='image/jpeg')
            try:
                file = service.files().create(
                    body=file_metadata,
                    media_body=media,
                    fields='id'
                ).execute()
                image_id = file.get('id')
                image_url = f"https://drive.google.com/file/d/{image_id}/view"
                image_urls.append(image_url)
                print(f"Image uploadée : {file_name} -> {image_url}")
            except Exception as e:
                print(f"Erreur lors de l'upload de {file_name} : {e}")
                continue

    # Étape 5 : Ajouter le chapitre à la liste des nouveaux chapitres
    if image_urls:
        new_chapters.append({
            "chapter": int(chapter_num),
            "imageUrls": image_urls
        })

# Étape 6 : Mettre à jour mangalinks.json si des nouveaux chapitres ont été traités
if new_chapters:
    all_chapters = existing_chapters + new_chapters
    all_chapters.sort(key=lambda x: float(x['chapter']))
    with open(output_file, 'w') as f:
        json.dump(all_chapters, f, indent=2)
    print(f"Liens sauvegardés dans {output_file}")
else:
    print("Aucun nouveau chapitre valide traité. mangalinks.json inchangé.")
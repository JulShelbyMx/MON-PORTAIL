from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
import os
import json

# Config
parent_folder_name = "One Piece scans"  # Nom de ton dossier parent sur Drive
output_file = r"manga\mangalinks.json"
credentials_file = r"D:\HakuNeko Desktop\Manga\credentials.json"
token_file = r"D:\HakuNeko Desktop\Manga\token.json"

# Authentification Google Drive API
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
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
        flow = InstalledAppFlow.from_client_secrets_file(
            credentials_file,
            SCOPES,
            redirect_uri='urn:ietf:wg:oauth:2.0:oob'
        )
        auth_url, _ = flow.authorization_url(prompt='consent')
        print("Veuillez visiter cette URL pour autoriser l'application :")
        print(auth_url)
        code = input("Entrez le code d'autorisation affiché dans votre navigateur : ").strip()
        flow.fetch_token(code=code)
        creds = flow.credentials
        with open(token_file, 'w') as f:
            f.write(creds.to_json())
        print(f"Credentials sauvegardés dans {token_file}")
    except Exception as e:
        print(f"Erreur lors de l'authentification : {e}")
        exit()

# Utiliser les credentials
service = build('drive', 'v3', credentials=creds)

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

# Créer un ensemble des numéros de chapitres existants pour une recherche rapide
existing_chapter_nums = {float(chapter['chapter']) for chapter in existing_chapters}

# Trouver le dossier parent
query = f"name='{parent_folder_name}' and mimeType='application/vnd.google-apps.folder'"
results = service.files().list(q=query, fields="files(id, name)").execute()
folders = results.get('files', [])
if not folders:
    print(f"Dossier {parent_folder_name} non trouvé.")
    exit()
parent_id = folders[0]['id']
print(f"Dossier parent: {parent_folder_name} (ID: {parent_id})")

# Lister tous les sous-dossiers avec pagination
chapter_folders = []
page_token = None
while True:
    results = service.files().list(
        q=f"'{parent_id}' in parents and mimeType='application/vnd.google-apps.folder'",
        fields="nextPageToken, files(id, name)",
        pageToken=page_token
    ).execute()
    chapter_folders.extend(results.get('files', []))
    page_token = results.get('nextPageToken')
    if not page_token:
        break
print(f"Dossiers trouvés: {len(chapter_folders)}")

# Trier les dossiers numériquement et filtrer les nouveaux chapitres
chapter_folders_sorted = []
ignored_count = 0
first_ignored = None
last_ignored = None

for folder in chapter_folders:
    folder_name = folder['name']
    if not folder_name.startswith("Chapter_"):
        print(f"Dossier ignoré (nom invalide): {folder_name}")
        continue
    chapter_str = folder_name.replace("Chapter_", "")
    try:
        chapter_num = float(chapter_str)  # Gère entiers et décimaux
        # Ignorer les chapitres déjà présents dans mangalinks.json
        if chapter_num in existing_chapter_nums:
            ignored_count += 1
            if first_ignored is None:
                first_ignored = chapter_num
            last_ignored = chapter_num
            continue
        chapter_folders_sorted.append((chapter_num, folder))
    except ValueError:
        print(f"Dossier ignoré (numéro invalide): {folder_name}")
        continue

# Afficher un message groupé pour les chapitres ignorés
if ignored_count > 0:
    if first_ignored == last_ignored:
        print(f"Chapitre {int(first_ignored)} déjà traité, ignoré.")
    else:
        print(f"Chapitres {int(first_ignored)}-{int(last_ignored)} déjà traités, ignorés ({ignored_count} chapitres).")

# Trier par numéro de chapitre
chapter_folders_sorted.sort(key=lambda x: x[0])
print(f"Nouveaux dossiers à traiter: {len(chapter_folders_sorted)}")

# Générer les liens pour les nouveaux chapitres
new_chapters = []
for chapter_num, folder in chapter_folders_sorted:
    folder_name = folder['name']
    folder_id = folder['id']
    print(f"Traitement de {folder_name} (numéro: {chapter_num})...")

    # Lister les images avec pagination
    image_urls = []
    page_token = None
    while True:
        results = service.files().list(
            q=f"'{folder_id}' in parents and (mimeType='image/jpeg' or mimeType='image/png' or mimeType='image/webp')",
            fields="nextPageToken, files(id, name)",
            orderBy="name",
            pageToken=page_token
        ).execute()
        images = results.get('files', [])
        for image in images:
            image_id = image['id']
            image_url = f"https://drive.google.com/file/d/{image_id}/view"
            image_urls.append(image_url)
            print(f"Image: {image['name']} -> {image_url}")
        page_token = results.get('nextPageToken')
        if not page_token:
            break

    if image_urls:
        new_chapters.append({
            "chapter": str(chapter_num),  # Convertir en string pour streaming.js
            "imageUrls": image_urls
        })

# Ajouter les nouveaux chapitres aux chapitres existants
all_chapters = existing_chapters + new_chapters

# Trier tous les chapitres par numéro de chapitre
all_chapters.sort(key=lambda x: float(x['chapter']))

# Sauvegarder dans mangalinks.json
with open(output_file, 'w') as f:
    json.dump(all_chapters, f, indent=2)
print(f"Liens sauvegardés dans {output_file}")

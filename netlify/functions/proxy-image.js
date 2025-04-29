// netlify/functions/proxy-image.js
const fetch = require('node-fetch');
const sharp = require('sharp');

exports.handler = async (event) => {
    const { url, id } = event.queryStringParameters;

    if (url) {
        try {
            const response = await fetch(decodeURIComponent(url), {
                headers: {
                    'Accept': 'image/*',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Referer': 'https://julportal.netlify.app',
                },
            });
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const buffer = await response.buffer();
            const contentType = response.headers.get('content-type') || 'image/jpeg';

            // Obtenir les métadonnées de l'image (dimensions)
            const metadata = await sharp(buffer).metadata();
            const originalWidth = metadata.width;
            const originalHeight = metadata.height;
            let resizedImage = buffer;
            let finalWidth = originalWidth;
            let finalHeight = originalHeight;
            let resizeInfo = `Dimensions originales: ${originalWidth}x${originalHeight}`;

            // Redimensionner uniquement si la largeur dépasse 600px
            if (originalWidth > 600) {
                resizedImage = await sharp(buffer)
                    .resize({ width: 600, fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality: 100, progressive: true, force: false })
                    .toBuffer();
                const newMetadata = await sharp(resizedImage).metadata();
                finalWidth = newMetadata.width;
                finalHeight = newMetadata.height;
                resizeInfo += ` | Redimensionnée à: ${finalWidth}x${finalHeight}`;
            } else {
                resizeInfo += ` | Pas de redimensionnement (largeur <= 600px)`;
            }

            return {
                statusCode: 200,
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=31536000',
                    'Access-Control-Allow-Origin': '*',
                    'Accept-Ranges': 'bytes',
                    'X-Image-Info': resizeInfo, // Header personnalisé pour les logs
                },
                body: resizedImage.toString('base64'),
                isBase64Encoded: true,
            };
        } catch (error) {
            console.error('Erreur proxy (URL directe):', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Erreur lors de la récupération de l’image: ' + error.message }),
            };
        }
    }

    if (!id) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'ID du fichier requis' })
        };
    }

    const driveUrl = `https://drive.google.com/uc?export=download&id=${id}&confirm=1`;
    try {
        const response = await fetch(driveUrl, {
            headers: {
                'Accept': 'image/*',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://julportal.netlify.app',
            },
        });
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const buffer = await response.buffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        // Obtenir les métadonnées de l'image (dimensions)
        const metadata = await sharp(buffer).metadata();
        const originalWidth = metadata.width;
        const originalHeight = metadata.height;
        let resizedImage = buffer;
        let finalWidth = originalWidth;
        let finalHeight = originalHeight;
        let resizeInfo = `Dimensions originales: ${originalWidth}x${originalHeight}`;

        // Redimensionner uniquement si la largeur dépasse 600px
        if (originalWidth > 600) {
            resizedImage = await sharp(buffer)
                .resize({ width: 600, fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 100, progressive: true, force: false })
                .toBuffer();
            const newMetadata = await sharp(resizedImage).metadata();
            finalWidth = newMetadata.width;
            finalHeight = newMetadata.height;
            resizeInfo += ` | Redimensionnée à: ${finalWidth}x${finalHeight}`;
        } else {
            resizeInfo += ` | Pas de redimensionnement (largeur <= 600px)`;
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000',
                'Access-Control-Allow-Origin': '*',
                'Accept-Ranges': 'bytes',
                'X-Image-Info': resizeInfo, // Header personnalisé pour les logs
            },
            body: resizedImage.toString('base64'),
            isBase64Encoded: true,
        };
    } catch (error) {
        console.error('Erreur proxy (ID):', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erreur lors de la récupération de l’image: ' + error.message }),
        };
    }
};
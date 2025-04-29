// netlify/functions/proxy-image.js
const fetch = require('node-fetch');
const sharp = require('sharp');

exports.handler = async (event) => {
    const { id } = event.queryStringParameters;
    if (!id) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'ID du fichier requis' })
        };
    }

    const url = `https://drive.google.com/uc?export=download&id=${id}&confirm=1`;
    try {
        const response = await fetch(url, {
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

        // Redimensionner à 1200px (2x pour écrans haute densité) avec qualité maximale
        const resizedImage = await sharp(buffer)
            .resize({ width: 1200, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 100, progressive: true, force: false }) // Qualité max, sans perte
            .toBuffer();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000',
                'Access-Control-Allow-Origin': '*',
                'Accept-Ranges': 'bytes',
            },
            body: resizedImage.toString('base64'),
            isBase64Encoded: true,
        };
    } catch (error) {
        console.error('Erreur proxy:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erreur lors de la récupération de l’image: ' + error.message }),
        };
    }
};
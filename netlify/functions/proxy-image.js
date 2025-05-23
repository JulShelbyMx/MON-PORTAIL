const fetch = require('node-fetch');

exports.handler = async (event) => {
    const { id } = event.queryStringParameters;
    if (!id) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'ID du fichier requis' })
        };
    }

    const url = `https://drive.google.com/uc?export=view&id=${id}`;
    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'image/*', // Demander l'image originale
                'User-Agent': 'Mozilla/5.0', // Simuler un navigateur
            },
        });
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const buffer = await response.buffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        return {
            statusCode: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000',
                'Access-Control-Allow-Origin': '*', // Pour CORS
                'Accept-Ranges': 'bytes', // Supporte les requêtes partielles
            },
            body: buffer.toString('base64'),
            isBase64Encoded: true,
        };
    } catch (error) {
        console.error('Erreur proxy:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erreur lors de la récupération de l’image' }),
        };
    }
};
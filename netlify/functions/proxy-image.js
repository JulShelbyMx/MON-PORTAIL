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

    const url = `https://drive.google.com/uc?export=download&id=${id}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const buffer = await response.buffer();
        // Redimensionner et compresser l'image avec sharp
        const optimizedImage = await sharp(buffer)
            .resize({ width: 600 }) // Réduire à 600px de large (au lieu de 800px)
            .jpeg({ quality: 90 }) // Augmenter la qualité à 90% (au lieu de 80%)
            .toBuffer();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'image/jpeg',
                'Cache-Control': 'public, max-age=31536000'
            },
            body: optimizedImage.toString('base64'),
            isBase64Encoded: true
        };
    } catch (error) {
        console.error('Erreur proxy:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erreur lors de la récupération de l’image' })
        };
    }
};
const fetch = require('node-fetch');

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

        return {
            statusCode: 200,
            headers: {
                'Content-Type': response.headers.get('content-type') || 'image/jpeg',
                'Cache-Control': 'public, max-age=31536000'
            },
            body: buffer.toString('base64'),
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
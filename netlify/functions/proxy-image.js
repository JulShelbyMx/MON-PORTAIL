const fetch = require('node-fetch');

exports.handler = async (event) => {
    const { id } = event.queryStringParameters;
    if (!id) {
        console.error('Erreur: ID du fichier manquant');
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'ID du fichier requis' })
        };
    }

    // Essayer thumbnail pour contourner la limite de taille
    const url = `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
    console.log(`Tentative de fetch pour fileId: ${id}, URL: ${url}`);

    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'image/*',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
            redirect: 'follow'
        });

        console.log(`Réponse HTTP: ${response.status}, Headers:`, Object.fromEntries(response.headers));

        if (!response.ok) {
            console.error(`Erreur HTTP: ${response.status} ${response.statusText}`);
            throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type') || 'image/jpeg';
        console.log(`Content-Type détecté: ${contentType}`);

        if (!contentType.startsWith('image/')) {
            console.error(`Type de contenu invalide: ${contentType}`);
            throw new Error(`Type de contenu invalide: ${contentType}`);
        }

        const buffer = await response.buffer();
        console.log(`Taille du buffer: ${buffer.length} octets`);

        if (buffer.length > 6_291_556) {
            console.error(`Erreur: Taille du buffer (${buffer.length}) dépasse la limite Netlify (6 Mo)`);
            throw new Error('Image trop grande pour la limite Netlify');
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                'Access-Control-Allow-Origin': '*',
                'Accept-Ranges': 'bytes',
                'X-File-Id': id // Ajouter fileId pour débogage
            },
            body: buffer.toString('base64'),
            isBase64Encoded: true
        };
    } catch (error) {
        console.error(`Erreur proxy pour fileId ${id}:`, error.message);
        return {
            statusCode: 502,
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
            body: JSON.stringify({ error: 'Erreur lors de la récupération de l’image', details: error.message })
        };
    }
};
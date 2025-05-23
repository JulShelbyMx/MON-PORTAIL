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

    const tryFetchImage = async (url, attempt, size) => {
        console.log(`Tentative ${attempt} de fetch pour fileId: ${id}, URL: ${url} (sz=${size})`);
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
                buffer,
                contentType,
                size
            };
        } catch (error) {
            console.error(`Erreur fetch pour fileId ${id} (sz=${size}):`, error.message);
            throw error;
        }
    };

    try {
        let result;
        // Forcer sz=w1000 pour la page 1 du chapitre 1149
        if (id === '1P6lgDQXLN0iGj1lPYJBpKhs51R_YaUcU') {
            try {
                result = await tryFetchImage(`https://drive.google.com/thumbnail?id=${id}&sz=w1000`, 1, 'w1000');
            } catch (error) {
                console.warn(`Échec avec sz=w1000 pour fileId ${id}: ${error.message}`);
                // Fallback sur sz=w800
                result = await tryFetchImage(`https://drive.google.com/thumbnail?id=${id}&sz=w800`, 2, 'w800');
            }
        } else {
            // Pour les autres images, essayer sz=w1500
            try {
                result = await tryFetchImage(`https://drive.google.com/thumbnail?id=${id}&sz=w1500`, 1, 'w1500');
            } catch (error) {
                console.warn(`Échec avec sz=w1500 pour fileId ${id}: ${error.message}`);
                try {
                    // Fallback sur sz=w1000
                    result = await tryFetchImage(`https://drive.google.com/thumbnail?id=${id}&sz=w1000`, 2, 'w1000');
                } catch (error) {
                    console.warn(`Échec avec sz=w1000 pour fileId ${id}: ${error.message}`);
                    // Fallback sur sz=w800
                    result = await tryFetchImage(`https://drive.google.com/thumbnail?id=${id}&sz=w800`, 3, 'w800');
                }
            }
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': result.contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                'Access-Control-Allow-Origin': '*',
                'Accept-Ranges': 'bytes',
                'X-File-Id': id,
                'X-Image-Size': result.size || 'unknown'
            },
            body: result.buffer.toString('base64'),
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
const fetch = require('node-fetch');
const sharp = require('sharp');

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

            let buffer = await response.buffer();
            console.log(`Taille initiale du buffer: ${buffer.length} octets`);

            // Compresser si > 6 Mo
            const maxSizeBytes = 6_291_556;
            if (buffer.length > maxSizeBytes) {
                console.log(`Compression de l'image pour fileId: ${id} (sz=${size})...`);
                try {
                    buffer = await sharp(buffer)
                        .jpeg({ quality: 80, progressive: true, force: true })
                        .toBuffer();
                    console.log(`Taille après compression: ${buffer.length} octets`);
                    if (buffer.length > maxSizeBytes) {
                        console.error(`Erreur: Taille après compression (${buffer.length}) dépasse toujours la limite Netlify (6 Mo)`);
                        throw new Error('Image trop grande même après compression');
                    }
                } catch (error) {
                    console.error(`Erreur lors de la compression pour fileId ${id} (sz=${size}):`, error.message);
                    throw error;
                }
            }

            return {
                buffer,
                contentType: 'image/jpeg', // Forcer JPEG après compression
                size
            };
        } catch (error) {
            console.error(`Erreur fetch pour fileId ${id} (sz=${size}):`, error.message);
            throw error;
        }
    };

    try {
        let result;
        // Essayer différentes tailles dans l'ordre : w1500, w1200, w1000, w800
        const sizes = ['w1500', 'w1200', 'w1000', 'w800'];
        for (let attempt = 0; attempt < sizes.length; attempt++) {
            const size = sizes[attempt];
            try {
                result = await tryFetchImage(`https://drive.google.com/thumbnail?id=${id}&sz=${size}`, attempt + 1, size);
                break; // Si ça marche, sortir de la boucle
            } catch (error) {
                console.warn(`Échec avec sz=${size} pour fileId ${id}: ${error.message}`);
                if (attempt === sizes.length - 1) {
                    throw new Error(`Échec pour toutes les tailles pour fileId ${id}`);
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
function generateMangaChapters() {
    return [
        { chapter: 1, cbzUrl: 'https://drive.google.com/uc?export=download&id=1NbvCbS2-vJQJIFcFMQ_iFiZK-qhrGK-4' },
        { chapter: 2, cbzUrl: 'https://mega.nz/file/YwQnkRCA#BqdBwQS0XcPOa23FiJs-4hRMHGJs0yMKHsS-dRxo3vg' } // Mets le 2e lien ici
    ];
}

async function getIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip || 'Inconnue';
    } catch (err) {
        console.error('Erreur récupération IP:', err);
        return 'Inconnue';
    }
}

export { generateMangaChapters, getIP };
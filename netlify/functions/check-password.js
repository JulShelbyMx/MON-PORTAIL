exports.handler = async (event, context) => {
    const { password } = JSON.parse(event.body || '{}');
    const correctPassword = process.env.PASSWORD;
    const megaLink = process.env.MEGA_LINK;

    if (password === correctPassword) {
        return {
            statusCode: 200,
            body: JSON.stringify({ url: megaLink })
        };
    }
    return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Mot de passe incorrect' })
    };
};
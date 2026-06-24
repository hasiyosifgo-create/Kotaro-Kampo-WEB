const { getStore } = require('@netlify/blobs');

exports.handler = async function(event, context) {
    try {
        const store = getStore({ name: "kotaro-data", siteID: process.env.MY_SITE_ID, token: process.env.NETLIFY_API_TOKEN }); if (!process.env.MY_SITE_ID) throw new Error("MY_SITE_ID is undefined"); if (!process.env.NETLIFY_API_TOKEN) throw new Error("TOKEN is undefined");
        const medicinesStr = await store.get("medicines");
        const changesStr = await store.get("changes");
        
        const data = medicinesStr ? JSON.parse(medicinesStr) : [];
        const changes = changesStr ? JSON.parse(changesStr) : { added: [], deleted: [] };
        
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ data, changes })
        };
    } catch (e) {
        console.error(e);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: e.toString(), siteID: process.env.MY_SITE_ID ? "SET" : "UNDEFINED", token: process.env.NETLIFY_API_TOKEN ? "SET" : "UNDEFINED" })
        };
    }
};





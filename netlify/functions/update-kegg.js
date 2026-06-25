const { schedule } = require('@netlify/functions');
const cheerio = require('cheerio');
const { getStore } = require('@netlify/blobs');

const Si = "https://www.kegg.jp";

function L0(n) { return n.replace(/[（(][^）)]*[）)]/g, "").replace(/\s+/g, " ").trim(); }
function U0(n) { return n.trim(); }
function H0(n) { return n.trim(); }

async function CA() {
    const n = [];
    let r = 1;
    for (;;) {
        const l = `${Si}/medicus-bin/search_drug?search_keyword=%E5%B0%8F%E5%A4%AA%E9%83%8E%E6%BC%A2%E6%96%B9%E8%A3%BD%E8%96%AC&page=${r}`;
        const res = await fetch(l);
        const html = await res.text();
        const $ = cheerio.load(html);
        const f = $("table.list1 tr");
        let d = 0;
        f.each((i, el) => {
            const p = $(el).find("td");
            if (p.length < 1) return;
            const y = $(p[0]).find("a");
            if (!y.length) return;
            const x = y.text().trim();
            const w = y.attr("href");
            if (!x || !w || !w.includes("japic_med")) return;
            let O = "";
            if (p.length >= 3) O = $(p[2]).text().trim();
            else if (p.length >= 2) O = $(p[1]).text().trim();
            const C = L0(O);
            const N = U0(x);
            n.push({ name: N, rawName: x, url: H0(w), type: "medical", otcCategory: null, subCategory: C, sortKey: N });
            d++;
        });
        const hasNext = $("a").filter((i, el) => $(el).text().trim() === "次へ").length > 0;
        if (d === 0 || !hasNext || r > 10) break;
        r++;
    }
    return n;
}

async function OA() {
    const n = [];
    let r = 1;
    for (;;) {
        const l = `${Si}/medicus-bin/search_drug?display=otc&search_keyword=%e5%b0%8f%e5%a4%aa%e9%83%8e%e6%bc%a2%e6%96%b9%e8%a3%bd%e8%96%ac&page=${r}`;
        const res = await fetch(l);
        const html = await res.text();
        const $ = cheerio.load(html);
        const f = $("table.list1 tr");
        let d = 0;
        f.each((i, el) => {
            const p = $(el).find("td");
            if (p.length < 1) return;
            const y = $(p[0]).find("a");
            if (!y.length) return;
            const x = y.text().trim();
            const w = y.attr("href");
            if (!x || !w || !w.includes("japic_otc")) return;
            let O = "";
            if (p.length >= 3) O = $(p[2]).text().trim();
            else if (p.length >= 2) O = $(p[1]).text().trim();
            const C = L0(O);
            const N = U0(x);
            n.push({ name: N, rawName: x, url: H0(w), type: "otc", otcCategory: "other", subCategory: C, sortKey: N });
            d++;
        });
        const hasNext = $("a").filter((i, el) => $(el).text().trim() === "次へ").length > 0;
        if (d === 0 || !hasNext || r > 10) break;
        r++;
    }
    return n;
}

const handler = async function(event, context) {
    try {
        const [med, otc] = await Promise.all([CA(), OA()]);
        const F = [...med, ...otc].sort((a,b) => a.sortKey.localeCompare(b.sortKey, "ja"));
        
        const store = getStore({ name: "kotaro-data", siteID: process.env.MY_SITE_ID, token: process.env.MY_API_TOKEN });
        const existingDataStr = await store.get("medicines");
        let added = [];
        let deleted = [];
        
        if (existingDataStr) {
            const B = JSON.parse(existingDataStr);
            const ee = new Set(B.map(ie => ie.url));
            const Fe = new Set(F.map(ie => ie.url));
            
            added = F.filter(ie => !ee.has(ie.url)).map(i => i.name);
            deleted = B.filter(ie => !Fe.has(ie.url)).map(i => i.name);
        }
        
        await store.setJSON("medicines", F);
        await store.setJSON("changes", { added, deleted, lastUpdated: new Date().toISOString() });
        
        return { statusCode: 200, body: "Updated successfully" };
    } catch (e) {
        console.error(e);
        return { statusCode: 500, body: e.toString() };
    }
};

module.exports.handler = schedule("@daily", handler);




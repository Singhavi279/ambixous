// Private document intelligence worker. It never makes a network request.
let pages = [];
const stopWords = new Set('the a an and or but is are was were be been being to of in on for with as by at from that this it its document page what which who when where how does do tell give show find about'.split(' '));
const terms = text => (text.toLowerCase().match(/[a-z0-9][a-z0-9'-]{1,}/g) || []).filter(word => !stopWords.has(word));
function score(query, passage) {
    const wanted = new Set(terms(query));
    const passageTerms = terms(passage);
    let total = 0;
    for (const word of passageTerms) if (wanted.has(word)) total += word.length > 6 ? 2 : 1;
    return total / Math.sqrt(Math.max(1, passageTerms.length));
}
function answer(question) {
    const candidates = [];
    for (const page of pages) {
        const chunks = page.text.match(/[^.!?\n]+[.!?]?/g) || [page.text];
        chunks.forEach((chunk, i) => {
            const passage = [chunks[i - 1], chunk, chunks[i + 1]].filter(Boolean).join(' ').trim();
            const relevance = score(question, passage);
            if (relevance > 0) candidates.push({ page: page.page, passage, relevance });
        });
    }
    candidates.sort((a, b) => b.relevance - a.relevance);
    const unique = [];
    for (const item of candidates) if (!unique.some(x => x.passage.slice(0, 80) === item.passage.slice(0, 80)) && unique.push(item) === 3) break;
    if (!unique.length) return { text: 'I could not find a relevant passage. Try a distinctive name, heading, or phrase.', sources: [] };
    return { text: unique.map(x => x.passage).join(' '), sources: [...new Set(unique.map(x => x.page))] };
}
function scanPII() {
    const patterns = [
        ['Email address', /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi],
        ['US Social Security number', /\b\d{3}-\d{2}-\d{4}\b/g],
        ['Payment card number', /\b(?:\d[ -]*?){13,19}\b/g],
        ['Phone number', /(?:\+?\d{1,3}[ .-]?)?(?:\(?\d{3}\)?[ .-]?)\d{3}[ .-]?\d{4}\b/g]
    ];
    const matches = [];
    for (const page of pages) for (const [kind, regex] of patterns) {
        regex.lastIndex = 0;
        for (const match of page.text.matchAll(regex)) matches.push({ kind, value: match[0], page: page.page });
    }
    return matches.slice(0, 250);
}
function summarize() {
    if (!pages.length) return { text: 'No document is indexed yet.', sources: [] };
    const snippets = pages.slice(0, 8).map(page => {
        const sentences = page.text.match(/[^.!?\n]+[.!?]?/g) || [];
        const useful = sentences.find(sentence => sentence.trim().split(/\s+/).length >= 7);
        return useful ? { page: page.page, text: useful.trim() } : null;
    }).filter(Boolean).slice(0, 5);
    return { text: snippets.map(x => x.text).join(' '), sources: snippets.map(x => x.page) };
}
self.onmessage = event => {
    const { action, payload = {}, id } = event.data || {};
    try {
        let data;
        if (action === 'INIT_ENGINE') {
            const sharedMemory = payload.sharedState instanceof SharedArrayBuffer;
            if (sharedMemory) Atomics.store(new Int32Array(payload.sharedState), 0, 1);
            data = { sharedMemory, crossOriginIsolated: self.crossOriginIsolated === true };
        }
        else if (action === 'INDEX_DOCUMENT') { pages = payload.pages || []; data = { pages: pages.length }; }
        else if (action === 'ASK_DOCUMENT') data = answer(payload.question || '');
        else if (action === 'SUMMARIZE') data = summarize();
        else if (action === 'SCAN_PII') data = scanPII();
        else throw new Error(`Unknown action: ${action}`);
        self.postMessage({ id, status: 'success', data });
    } catch (error) { self.postMessage({ id, status: 'error', error: error.message }); }
};

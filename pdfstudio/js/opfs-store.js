const FILE_NAME = 'active-document.pdf';
const META_KEY = 'pdf-studio-opfs-meta';
const root = () => navigator.storage.getDirectory();

export const opfsStore = {
    supported: Boolean(navigator.storage?.getDirectory),
    async save(file) {
        if (!this.supported) return false;
        const handle = await (await root()).getFileHandle(FILE_NAME, { create: true });
        const writable = await handle.createWritable();
        try {
            await file.stream().pipeTo(writable);
        } catch (error) {
            await writable.abort().catch(() => {});
            throw error;
        }
        localStorage.setItem(META_KEY, JSON.stringify({ name: file.name, size: file.size, savedAt: Date.now() }));
        return true;
    },
    async restore() {
        if (!this.supported) return null;
        let meta;
        try {
            meta = JSON.parse(localStorage.getItem(META_KEY) || 'null');
        } catch {
            localStorage.removeItem(META_KEY);
            return null;
        }
        if (!meta) return null;
        try {
            const stored = await (await (await root()).getFileHandle(FILE_NAME)).getFile();
            return new File([stored], meta.name || FILE_NAME, { type: 'application/pdf', lastModified: meta.savedAt });
        } catch {
            localStorage.removeItem(META_KEY);
            return null;
        }
    }
};

import { MediaFile, MediaFileRecord, Category, FavPart, AppSettings, Collection, Workspace } from './types';

const DB_NAME = 'MediaHubDB';
const DB_VERSION = 4;

let dbInstance: IDBDatabase | null = null;
let openPromise: Promise<IDBDatabase> | null = null;

function closeDB() {
    if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
    }
}

export function openDB(attempt = 1): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (openPromise) return openPromise;

  openPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
        openPromise = null;
        console.error("IndexedDB open error:", request.error);
        if (attempt === 1) {
            console.warn("Attempting DB recovery...");
            if (request.result) try { (request.result as IDBDatabase).close(); } catch(e) {}
            closeDB();
            const delReq = indexedDB.deleteDatabase(DB_NAME);
            delReq.onsuccess = () => openDB(2).then(resolve).catch(reject);
            delReq.onerror = () => reject(new Error("Critical: DB corrupted. Clear browser data."));
        } else {
            reject(request.error || new Error("Failed to open DB."));
        }
    };

    request.onblocked = () => console.warn("DB blocked. Close other tabs.");

    request.onsuccess = () => {
      dbInstance = request.result;
      openPromise = null;
      dbInstance.onversionchange = () => { closeDB(); };
      dbInstance.onclose = () => { dbInstance = null; };
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('mediaFiles')) db.createObjectStore('mediaFiles', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('categories')) db.createObjectStore('categories', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('collections')) db.createObjectStore('collections', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('workspaces')) db.createObjectStore('workspaces', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('favParts')) db.createObjectStore('favParts', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('settings')) {
        const settingsStore = db.createObjectStore('settings', { keyPath: 'id' });
        settingsStore.put({ id: 'default' });
      }
      if (!db.objectStoreNames.contains('playbackPositions')) db.createObjectStore('playbackPositions', { keyPath: 'mediaId' });
    };
  });
  return openPromise;
}

async function getStore(storeName: string, mode: IDBTransactionMode): Promise<IDBObjectStore> {
  const db = await openDB();
  const tx = db.transaction(storeName, mode);
  return tx.objectStore(storeName);
}

// --- Media Files ---

export async function addMediaFile(meta: MediaFile, src: Blob, thumbnail?: Blob): Promise<void> {
    // Store everything in one record. IndexedDB handles Blobs efficiently.
    const record: MediaFileRecord = { ...meta, src, thumbnail };
    const store = await getStore('mediaFiles', 'readwrite');
    return new Promise((resolve, reject) => {
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

export async function getAllMediaFiles(): Promise<MediaFile[]> {
    // We only need metadata for the grid, so we strip large blobs to avoid memory hogging during list view
    const store = await getStore('mediaFiles', 'readonly');
    return new Promise((resolve, reject) => {
        const req = store.openCursor();
        const files: MediaFile[] = [];
        req.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
            if (cursor) {
                // Destructure to separate heavy blobs from metadata
                const { src, thumbnail, ...meta } = cursor.value as MediaFileRecord;
                files.push(meta);
                cursor.continue();
            } else {
                resolve(files.sort((a,b) => b.createdAt - a.createdAt));
            }
        };
        req.onerror = () => reject(req.error);
    });
}

export async function getMediaFileRecord(id: string): Promise<MediaFileRecord | undefined> {
    const store = await getStore('mediaFiles', 'readonly');
    return new Promise((resolve, reject) => {
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export async function getMediaFileSrc(id: string): Promise<Blob | undefined> {
    const record = await getMediaFileRecord(id);
    return record?.src;
}

export async function getMediaFileThumbnail(id: string): Promise<Blob | undefined> {
    const record = await getMediaFileRecord(id);
    return record?.thumbnail;
}

export async function getMediaFileMimeType(id: string): Promise<string | undefined> {
    const record = await getMediaFileRecord(id);
    return record?.src?.type;
}

export async function updateMediaFileMeta(meta: MediaFile): Promise<void> {
    const store = await getStore('mediaFiles', 'readwrite');
    return new Promise((resolve, reject) => {
        const getReq = store.get(meta.id);
        getReq.onsuccess = () => {
            const record = getReq.result as MediaFileRecord;
            if (record) {
                // Keep existing binary data, update metadata
                const updatedRecord = { ...record, ...meta };
                store.put(updatedRecord).onsuccess = () => resolve();
            } else {
                resolve();
            }
        };
        getReq.onerror = () => reject(getReq.error);
    });
}

export async function updateMediaFilesMeta(updates: {id: string, changes: Partial<MediaFile>}[]): Promise<void> {
    const db = await openDB();
    const tx = db.transaction('mediaFiles', 'readwrite');
    const store = tx.objectStore('mediaFiles');
    
    updates.forEach(u => {
        const req = store.get(u.id);
        req.onsuccess = () => {
            const record = req.result as MediaFileRecord;
            if (record) {
                store.put({ ...record, ...u.changes });
            }
        };
    });
    
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function deleteMediaFile(id: string): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(['mediaFiles', 'playbackPositions'], 'readwrite');
    tx.objectStore('mediaFiles').delete(id);
    tx.objectStore('playbackPositions').delete(id);
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// --- Categories ---
export async function getAllCategories(): Promise<Category[]> {
    const store = await getStore('categories', 'readonly');
    return new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result as Category[]).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
        req.onerror = () => reject(req.error);
    });
}
export const addCategory = async (cat: Category) => (await getStore('categories', 'readwrite')).put(cat);
export const updateCategory = async (cat: Category) => (await getStore('categories', 'readwrite')).put(cat);
export const deleteCategory = async (id: string) => (await getStore('categories', 'readwrite')).delete(id);
export async function updateAllCategories(categories: Category[]): Promise<void> {
    const db = await openDB();
    const tx = db.transaction('categories', 'readwrite');
    const store = tx.objectStore('categories');
    categories.forEach(cat => store.put(cat));
    return new Promise((resolve) => { tx.oncomplete = () => resolve(); });
}

// --- Collections ---
export async function getAllCollections(): Promise<Collection[]> {
    const store = await getStore('collections', 'readonly');
    return new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}
export const putCollection = async (c: Collection) => (await getStore('collections', 'readwrite')).put(c);
export const deleteCollection = async (id: string) => (await getStore('collections', 'readwrite')).delete(id);

// --- Workspaces ---
export async function getAllWorkspaces(): Promise<Workspace[]> {
    const store = await getStore('workspaces', 'readonly');
    return new Promise((resolve) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve([]);
    });
}
export const putWorkspace = async (w: Workspace) => (await getStore('workspaces', 'readwrite')).put(w);
export const deleteWorkspace = async (id: string) => (await getStore('workspaces', 'readwrite')).delete(id);

// --- FavParts ---
export async function getAllFavParts(): Promise<FavPart[]> {
    const store = await getStore('favParts', 'readonly');
    return new Promise((resolve) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve([]);
    });
}
export const addFavPart = async (p: FavPart) => (await getStore('favParts', 'readwrite')).put(p);
export const deleteFavPart = async (id: string) => (await getStore('favParts', 'readwrite')).delete(id);

// --- Settings ---
export async function getSettings(): Promise<AppSettings | undefined> {
    const store = await getStore('settings', 'readonly');
    return new Promise((resolve) => {
        const req = store.get('default');
        req.onsuccess = () => {
            const res = req.result;
            if (res) { const { id, ...rest } = res; resolve(rest); }
            else resolve(undefined);
        };
        req.onerror = () => resolve(undefined);
    });
}
export const saveSettings = async (s: AppSettings) => (await getStore('settings', 'readwrite')).put({ id: 'default', ...s });

// --- Playback Positions ---
export async function getPlaybackPosition(mediaId: string): Promise<number | undefined> {
    const store = await getStore('playbackPositions', 'readonly');
    return new Promise((resolve) => {
        const req = store.get(mediaId);
        req.onsuccess = () => resolve(req.result?.position);
        req.onerror = () => resolve(undefined);
    });
}
export const setPlaybackPosition = async (mediaId: string, position: number) => (await getStore('playbackPositions', 'readwrite')).put({ mediaId, position });

// --- Cleanup ---
export const clearMediaAndClips = async () => {
    const db = await openDB();
    const tx = db.transaction(['mediaFiles', 'favParts', 'playbackPositions'], 'readwrite');
    tx.objectStore('mediaFiles').clear();
    tx.objectStore('favParts').clear();
    tx.objectStore('playbackPositions').clear();
    return new Promise((resolve) => { tx.oncomplete = () => resolve(); });
};
export const clearCategories = async () => (await getStore('categories', 'readwrite')).clear();
export const clearAllData = async () => {
    const db = await openDB();
    const tx = db.transaction(db.objectStoreNames, 'readwrite');
    Array.from(db.objectStoreNames).forEach(name => tx.objectStore(name).clear());
    // Restore default settings to prevent corruption
    tx.objectStore('settings').put({ id: 'default' });
    return new Promise((resolve) => { tx.oncomplete = () => resolve(); });
};
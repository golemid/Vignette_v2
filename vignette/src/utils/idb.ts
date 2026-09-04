import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface VignetteDB extends DBSchema {
  media: {
    key: string;
    value: {
      id: string;
      name: string;
      type: 'image' | 'audio';
      file: Blob;
      proxyBlob?: Blob;
      width?: number;
      height?: number;
      duration?: number;
      description?: string;
      hookScore?: number;
    };
    indexes: { 'by-type': string };
  };
  project: {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
    };
  };
}

const DB_NAME = 'vignette-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<VignetteDB> | null = null;

export const getDB = async (): Promise<IDBPDatabase<VignetteDB>> => {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<VignetteDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Media store for File/Blob objects
      if (!db.objectStoreNames.contains('media')) {
        const mediaStore = db.createObjectStore('media', { keyPath: 'id' });
        mediaStore.createIndex('by-type', 'type');
      }
      // Project store for state snapshots
      if (!db.objectStoreNames.contains('project')) {
        db.createObjectStore('project', { keyPath: 'id' });
      }
    },
  });

  return dbInstance;
};

export const saveMediaFile = async (
  id: string,
  file: Blob,
  metadata: {
    name: string;
    type: 'image' | 'audio';
    proxyBlob?: Blob;
    width?: number;
    height?: number;
    duration?: number;
    description?: string;
    hookScore?: number;
  }
): Promise<void> => {
  const db = await getDB();
  await db.put('media', {
    id,
    file,
    ...metadata,
  });
};

export const getMediaFile = async (id: string): Promise<{
  id: string;
  name: string;
  type: 'image' | 'audio';
  file: Blob;
  proxyBlob?: Blob;
  width?: number;
  height?: number;
  duration?: number;
  description?: string;
  hookScore?: number;
} | null> => {
  const db = await getDB();
  return (await db.get('media', id)) ?? null;
};

export const getAllMediaFiles = async (): Promise<Array<{
  id: string;
  name: string;
  type: 'image' | 'audio';
  file: Blob;
  proxyBlob?: Blob;
  width?: number;
  height?: number;
  duration?: number;
  description?: string;
  hookScore?: number;
}>> => {
  const db = await getDB();
  return db.getAll('media');
};

export const deleteMediaFile = async (id: string): Promise<void> => {
  const db = await getDB();
  await db.delete('media', id);
};

export const clearAllMedia = async (): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction('media', 'readwrite');
  await tx.store.clear();
  await tx.done;
};

export const saveProjectState = async (
  projectId: string,
  data: any
): Promise<void> => {
  const db = await getDB();
  await db.put('project', {
    id: projectId,
    data,
    timestamp: Date.now(),
  });
};

export const loadProjectState = async (
  projectId: string
): Promise<any | null> => {
  const db = await getDB();
  const project = await db.get('project', projectId);
  return project?.data ?? null;
};

export const getAllProjectSnapshots = async (): Promise<Array<{
  id: string;
  data: any;
  timestamp: number;
}>> => {
  const db = await getDB();
  return db.getAll('project');
};

export const createObjectURL = (blob: Blob): string => {
  return URL.createObjectURL(blob);
};

export const revokeObjectURL = (url: string): void => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

export const blobToProxyUrl = async (proxyBlob: Blob): Promise<string> => {
  return createObjectURL(proxyBlob);
};

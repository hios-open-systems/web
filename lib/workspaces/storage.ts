import { emptyStore, parseStore, type WorkspaceStore } from './model';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('hios-workspaces', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('accounts');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('blocked'));
  });
}

export async function readStore(account: string): Promise<WorkspaceStore> {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction('accounts').objectStore('accounts').get(account);
      request.onsuccess = () => { try { resolve(request.result ? parseStore(request.result) : emptyStore()); } catch (error) { reject(error); } };
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
}

export async function writeStore(account: string, state: WorkspaceStore): Promise<void> {
  parseStore(state);
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('accounts', 'readwrite');
      transaction.objectStore('accounts').put(state, account);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally { db.close(); }
}

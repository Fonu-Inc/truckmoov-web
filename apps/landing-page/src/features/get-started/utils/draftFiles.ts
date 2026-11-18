/**
 * Files the applicant picked that the server hasn't confirmed yet, kept in IndexedDB so
 * "Apply as Returning Customer" can bring them back after the tab is closed:
 * - `signature`: the indemnity signature drawn before the application exists. It is
 *   uploaded right after the details are first saved.
 * - `doc:<slot>`: a document upload that failed or was cut off.
 *
 * Each entry is deleted as soon as its upload succeeds; `deleteDraftFiles()` drops the
 * whole database (see `clearApplyDraft`). localStorage can't hold binary data, hence IDB.
 */

const DB_NAME = "truckmoov_landing_apply";
const STORE = "files";

export type DraftFile<Meta = Record<string, string>> = {
  key: string;
  blob: Blob;
  meta: Meta;
};

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(
      DB_NAME,
      1,
    );
    request.onupgradeneeded = () => {
      request.result.createObjectStore(
        STORE,
        { keyPath: "key" },
      );
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = action(db.transaction(
        STORE,
        mode,
      ).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  finally {
    db.close();
  }
}

/** Storage can be blocked (private mode, quota): a lost draft file is never fatal. */
async function safely<T>(fallback: T, task: () => Promise<T>) {
  try {
    return await task();
  }
  catch {
    return fallback;
  }
}

export function putDraftFile(file: DraftFile) {
  return safely(
    undefined,
    () => run(
      "readwrite",
      store => store.put(file),
    ).then(() => undefined),
  );
}

export function getDraftFile<Meta = Record<string, string>>(key: string) {
  return safely<DraftFile<Meta> | undefined>(
    undefined,
    () => run(
      "readonly",
      store => store.get(key) as IDBRequest<DraftFile<Meta> | undefined>,
    ),
  );
}

export function listDraftFiles(prefix: string) {
  return safely<DraftFile[]>(
    [],
    async () => {
      const all = await run(
        "readonly",
        store => store.getAll() as IDBRequest<DraftFile[]>,
      );
      return all.filter(file => file.key.startsWith(prefix));
    },
  );
}

export function deleteDraftFile(key: string) {
  return safely(
    undefined,
    () => run(
      "readwrite",
      store => store.delete(key),
    ).then(() => undefined),
  );
}

export function deleteDraftFiles() {
  return safely(
    undefined,
    () => new Promise<undefined>((resolve) => {
      const request = indexedDB.deleteDatabase(DB_NAME);
      // A blocked delete still completes once the last connection closes.
      request.onsuccess = () => resolve(undefined);
      request.onerror = () => resolve(undefined);
      request.onblocked = () => resolve(undefined);
    }),
  );
}

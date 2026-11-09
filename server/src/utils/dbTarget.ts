// server/src/utils/dbTarget.ts

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]'];

export interface MongoTarget {
  host: string;     // Note; hostname only, never credentials
  database: string;
  isLocal: boolean;
}

/**
 * Note; Describe which MongoDB a URI points at without exposing credentials,
 * so scripts can print it and refuse to write to anything that isn't local.
 */
export const describeMongoTarget = (uri: string | undefined): MongoTarget => {
  try {
    const url = new URL(uri || '');
    const database = decodeURIComponent(url.pathname.replace(/^\//, '')) || 'test (driver default)';
    return { host: url.hostname, database, isLocal: LOCAL_HOSTS.includes(url.hostname) };
  } catch {
    // Note; Unparseable or multi-host URIs are treated as remote
    return { host: 'unknown', database: 'unknown', isLocal: false };
  }
};

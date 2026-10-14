import {
  BlobServiceClient,
  ContainerClient,
  StorageSharedKeyCredential,
  BlobSASPermissions,
} from '@azure/storage-blob';

/**
 * Azure Blob Storage for uploaded files (resumes, chat attachments, avatars, website images).
 * The container stays private; reads go through /api/files/:id, which checks access and
 * redirects to a short-lived SAS link.
 */

export class StorageNotConfiguredError extends Error {
  constructor() {
    super('File storage is not configured. Set AZURE_STORAGE_CONNECTION_STRING (see .env.example).');
    this.name = 'StorageNotConfiguredError';
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __mc_blob: { container: ContainerClient; ready: Promise<unknown> } | undefined;
}

export function isBlobConfigured() {
  return Boolean(
    process.env.AZURE_STORAGE_CONNECTION_STRING ||
      (process.env.AZURE_STORAGE_ACCOUNT_NAME && process.env.AZURE_STORAGE_ACCOUNT_KEY)
  );
}

export function containerName() {
  return process.env.AZURE_STORAGE_CONTAINER || 'maxicareer-uploads';
}

function createServiceClient(): BlobServiceClient {
  const conn = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (conn) return BlobServiceClient.fromConnectionString(conn);
  const account = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const key = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  if (account && key) {
    return new BlobServiceClient(`https://${account}.blob.core.windows.net`, new StorageSharedKeyCredential(account, key));
  }
  throw new StorageNotConfiguredError();
}

async function getContainer(): Promise<ContainerClient> {
  if (!isBlobConfigured()) throw new StorageNotConfiguredError();
  if (!globalThis.__mc_blob) {
    const container = createServiceClient().getContainerClient(containerName());
    const ready = container.createIfNotExists();
    globalThis.__mc_blob = { container, ready };
    ready.catch(() => {
      globalThis.__mc_blob = undefined;
    });
  }
  await globalThis.__mc_blob.ready;
  return globalThis.__mc_blob.container;
}

export async function uploadBlob(blobName: string, data: Buffer, contentType: string, downloadName?: string) {
  const container = await getContainer();
  const blob = container.getBlockBlobClient(blobName);
  await blob.uploadData(data, {
    blobHTTPHeaders: {
      blobContentType: contentType,
      blobContentDisposition: downloadName ? `inline; filename="${downloadName.replace(/["\\\r\n]/g, '_')}"` : undefined,
    },
  });
  return blob.url;
}

/**
 * Returns a read-only SAS URL valid for `minutes`, or null when the credential
 * can't sign (e.g. a SAS-token connection string) so callers can stream instead.
 */
export async function getReadUrl(blobName: string, minutes = 10, contentDisposition?: string): Promise<string | null> {
  const container = await getContainer();
  const blob = container.getBlobClient(blobName);
  try {
    return await blob.generateSasUrl({
      permissions: BlobSASPermissions.parse('r'),
      startsOn: new Date(Date.now() - 2 * 60_000),
      expiresOn: new Date(Date.now() + minutes * 60_000),
      contentDisposition,
    });
  } catch {
    return null;
  }
}

export async function downloadBlob(blobName: string) {
  const container = await getContainer();
  const res = await container.getBlobClient(blobName).download();
  return { stream: res.readableStreamBody, contentType: res.contentType, length: res.contentLength };
}

export async function deleteBlob(blobName: string) {
  const container = await getContainer();
  await container.getBlobClient(blobName).deleteIfExists();
}

export async function pingBlob(): Promise<{ ok: boolean; ms: number; container: string; error?: string }> {
  const start = Date.now();
  try {
    const container = await getContainer();
    await container.getProperties();
    return { ok: true, ms: Date.now() - start, container: containerName() };
  } catch (err: any) {
    return { ok: false, ms: Date.now() - start, container: containerName(), error: err?.message || String(err) };
  }
}

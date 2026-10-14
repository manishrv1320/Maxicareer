import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'node:stream';
import { route, ok, fail } from '@/lib/server/http';
import { col, COLLECTIONS } from '@/lib/server/db';
import { getCurrentUser, isStaff, isAdmin, type UserDoc } from '@/lib/server/auth';
import { getReadUrl, downloadBlob, deleteBlob } from '@/lib/server/blob';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

interface FileDoc {
  _id: string;
  blobName: string;
  originalName: string;
  contentType: string;
  visibility: 'public' | 'private' | 'members';
  ownerUserId: string;
  allowedProfileIds?: string[];
}

function canRead(file: FileDoc, user: UserDoc | null) {
  if (file.visibility === 'public') return true;
  if (!user) return false;
  if (file.visibility === 'members') return true;
  return file.ownerUserId === user._id || isStaff(user) || Boolean(user.refId && file.allowedProfileIds?.includes(user.refId));
}

/** Checks access, then redirects to a short-lived Azure SAS link (or streams if SAS isn't available). */
export const GET = route<Ctx>(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const file = await (await col<FileDoc>(COLLECTIONS.files)).findOne({ _id: id });
  if (!file) return fail('File not found.', 404);
  const user = file.visibility === 'public' ? null : await getCurrentUser(req);
  if (!canRead(file, user)) return fail('You do not have access to this file.', user ? 403 : 401);

  const download = req.nextUrl.searchParams.get('download') === '1';
  const disposition = `${download ? 'attachment' : 'inline'}; filename="${file.originalName.replace(/["\\\r\n]/g, '_')}"`;
  const sas = await getReadUrl(file.blobName, 10, disposition);
  if (sas) {
    const res = NextResponse.redirect(sas, 302);
    res.headers.set('Cache-Control', file.visibility === 'public' ? 'public, max-age=300' : 'private, no-store');
    return res;
  }

  const blob = await downloadBlob(file.blobName);
  if (!blob.stream) return fail('File is unavailable.', 404);
  return new NextResponse(Readable.toWeb(blob.stream as Readable) as ReadableStream, {
    headers: {
      'Content-Type': file.contentType,
      'Content-Disposition': disposition,
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
      'Cache-Control': file.visibility === 'public' ? 'public, max-age=300' : 'private, no-store',
    },
  });
});

export const DELETE = route<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const user = await getCurrentUser(req);
  const files = await col<FileDoc>(COLLECTIONS.files);
  const file = await files.findOne({ _id: id });
  if (!file) return fail('File not found.', 404);
  if (!user || (file.ownerUserId !== user._id && !isAdmin(user))) return fail('You can only delete your own files.', 403);
  await deleteBlob(file.blobName);
  await files.deleteOne({ _id: id });
  return ok();
});

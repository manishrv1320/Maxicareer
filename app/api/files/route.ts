import { NextRequest } from 'next/server';
import { route, ok, fail } from '@/lib/server/http';
import { col, COLLECTIONS, newId, nowIso } from '@/lib/server/db';
import { requireUser, isStaff, canEditWebsite, rateLimit } from '@/lib/server/auth';
import { uploadBlob } from '@/lib/server/blob';

export const dynamic = 'force-dynamic';

type Category = 'avatar' | 'website' | 'attachment' | 'document' | 'resource';

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

const RULES: Record<Category, { types: string[]; maxMb: number; visibility: 'public' | 'private' | 'members' }> = {
  avatar: { types: IMAGE_TYPES, maxMb: 3, visibility: 'public' },
  website: { types: [...IMAGE_TYPES, 'image/svg+xml'], maxMb: 8, visibility: 'public' },
  attachment: { types: [...IMAGE_TYPES, ...DOC_TYPES], maxMb: 10, visibility: 'private' },
  document: { types: [...IMAGE_TYPES, ...DOC_TYPES], maxMb: 10, visibility: 'private' },
  // Course material shared by staff: any signed-in student, counsellor or mentor may open it.
  resource: { types: [...IMAGE_TYPES, ...DOC_TYPES], maxMb: 25, visibility: 'members' },
};

/** multipart/form-data with `file` and `category`. Returns a stable /api/files/:id URL. */
export const POST = route(async (req: NextRequest) => {
  const user = await requireUser(req);
  rateLimit(req, `upload:${user._id}`, 60, 60 * 60_000);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail('Send the file as multipart/form-data.');
  }
  const file = form.get('file');
  const category = String(form.get('category') || 'document') as Category;
  const rules = RULES[category];
  if (!rules) return fail('Unknown upload category.');
  if (!(file instanceof File) || file.size === 0) return fail('Choose a file to upload.');
  if (category === 'website' && !canEditWebsite(user)) return fail('Only website editors can upload site images.', 403);
  if (category === 'resource' && !isStaff(user)) return fail('Only staff can upload shared course material.', 403);
  if (!rules.types.includes(file.type)) return fail('That file type is not allowed here.', 415);
  if (file.size > rules.maxMb * 1024 * 1024) return fail(`Files must be under ${rules.maxMb} MB.`, 413);

  const id = newId('file');
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-80) || 'upload';
  const d = new Date();
  const blobName = `${category}/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${id}-${safeName}`;
  await uploadBlob(blobName, Buffer.from(await file.arrayBuffer()), file.type, file.name);

  await (await col(COLLECTIONS.files)).insertOne({
    _id: id as any,
    blobName,
    originalName: file.name.slice(0, 200),
    contentType: file.type,
    size: file.size,
    category,
    visibility: rules.visibility,
    ownerUserId: user._id,
    ownerProfileId: user.refId,
    allowedProfileIds: [],
    uploadedByStaff: isStaff(user),
    createdAt: nowIso(),
  });

  return ok({ data: { id, url: `/api/files/${id}`, name: file.name, size: file.size, contentType: file.type } }, { status: 201 });
});

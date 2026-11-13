import { REVIEW_PHOTO_MAX_BYTES, REVIEW_PHOTO_MAX_COUNT, REVIEW_TAGS, type ReviewTag } from './constants';

export type PhotoMime = 'image/jpeg' | 'image/png' | 'image/webp';

/** Reconnaît le format réel d'une image à ses premiers octets (le type annoncé par le navigateur n'est pas fiable). */
export function sniffImage(bytes: Uint8Array): PhotoMime | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (png.every((byte, i) => bytes[i] === byte)) return 'image/png';
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  return null;
}

export type ParsedPhoto = { mime: PhotoMime; data: Buffer };

/** Lit et contrôle les photos d'un formulaire : nombre, poids et format réel. */
export async function readPhotos(formData: FormData, field = 'photos'): Promise<{ photos: ParsedPhoto[] } | { error: string }> {
  const files = formData.getAll(field).filter((value): value is File => typeof value !== 'string' && value.size > 0);
  if (files.length > REVIEW_PHOTO_MAX_COUNT) {
    return { error: `Vous pouvez joindre ${REVIEW_PHOTO_MAX_COUNT} photos au maximum.` };
  }

  const photos: ParsedPhoto[] = [];
  for (const file of files) {
    if (file.size > REVIEW_PHOTO_MAX_BYTES) return { error: 'Une des photos est trop lourde. Réessayez avec une autre image.' };
    const data = Buffer.from(await file.arrayBuffer());
    const mime = sniffImage(data);
    if (!mime) return { error: 'Seules les images JPEG, PNG ou WebP sont acceptées.' };
    photos.push({ mime, data });
  }
  return { photos };
}

/** Adresse publique d'une photo d'avis. */
export const photoUrl = (id: number) => `/api/photos/${id}`;

/** Transforme la colonne `tags` (clés séparées par des virgules) en liste de compliments connus. */
export function parseTags(tags: string | null | undefined): ReviewTag[] {
  if (!tags) return [];
  return tags.split(',').filter((tag): tag is ReviewTag => tag in REVIEW_TAGS);
}

'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { createReview } from '@/actions/reviews';
import {
  REVIEW_PHOTO_MAX_BYTES,
  REVIEW_PHOTO_MAX_COUNT,
  REVIEW_PHOTO_MAX_SIDE,
  REVIEW_TAG_KEYS,
  REVIEW_TAGS,
} from '@/lib/constants';
import { SubmitButton } from './SubmitButton';
import { Notice } from './ui';

const LABELS = ['Très décevant', 'Décevant', 'Correct', 'Très bien', 'Excellent'];

type Photo = { key: string; file: File; preview: string };

const toJpeg = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));

/**
 * Réduit une image dans le navigateur avant l'envoi : une photo de téléphone de 5 Mo devient un JPEG
 * de quelques centaines de Ko. Le passage par un canevas retire aussi les métadonnées (lieu de prise de vue…).
 */
async function shrink(file: File): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();

    let scale = Math.min(1, REVIEW_PHOTO_MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) break;
      // Fond blanc : les zones transparentes d'un PNG ne deviennent pas noires en JPEG.
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      for (const quality of [0.82, 0.68, 0.5]) {
        const blob = await toJpeg(canvas, quality);
        if (blob && blob.size <= REVIEW_PHOTO_MAX_BYTES) {
          return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
        }
      }
      scale *= 0.7;
    }
    throw new Error('too-large');
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function ReviewForm({ bookingId, helperName }: { bookingId: number; helperName: string }) {
  const [state, action] = useActionState(createReview.bind(null, bookingId), undefined);
  const [rating, setRating] = useState(Number(state?.values?.rating ?? 0));
  const [tags, setTags] = useState<string[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const group = `note-${bookingId}`;

  // Libère les aperçus quand le formulaire disparaît.
  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(() => () => photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.preview)), []);

  if (state?.success) return <Notice>{state.success}</Notice>;

  async function addPhotos(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (picked.length === 0) return;

    const room = REVIEW_PHOTO_MAX_COUNT - photos.length;
    setPhotoError(picked.length > room ? `Vous pouvez joindre ${REVIEW_PHOTO_MAX_COUNT} photos au maximum.` : null);
    setPreparing(true);
    const added: Photo[] = [];
    for (const original of picked.slice(0, room)) {
      try {
        const file = await shrink(original);
        added.push({ key: crypto.randomUUID(), file, preview: URL.createObjectURL(file) });
      } catch {
        setPhotoError(`« ${original.name} » n’a pas pu être lue. Essayez avec une image JPEG ou PNG.`);
      }
    }
    setPhotos((current) => [...current, ...added].slice(0, REVIEW_PHOTO_MAX_COUNT));
    setPreparing(false);
  }

  function removePhoto(key: string) {
    setPhotos((current) => {
      current.filter((photo) => photo.key === key).forEach((photo) => URL.revokeObjectURL(photo.preview));
      return current.filter((photo) => photo.key !== key);
    });
    setPhotoError(null);
  }

  // Le champ fichier n'a pas de nom : seules les versions réduites partent vers le serveur.
  function submit(formData: FormData) {
    for (const photo of photos) formData.append('photos', photo.file);
    action(formData);
  }

  return (
    <form action={submit} className="bg-brand-50 space-y-5 rounded-xl p-4">
      {state?.error && <Notice tone="error">{state.error}</Notice>}

      <fieldset>
        <legend className="label">Comment s’est passée l’aide de {helperName} ?</legend>
        <div className="flex flex-wrap items-center gap-1">
          {LABELS.map((label, index) => {
            const value = index + 1;
            return (
              <label
                key={value}
                className="has-focus-visible:outline-ink flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg has-focus-visible:outline-3"
              >
                <input
                  type="radio"
                  name="rating"
                  value={value}
                  checked={rating === value}
                  onChange={() => setRating(value)}
                  className="sr-only"
                />
                <span aria-hidden="true" className={`text-4xl leading-none ${value <= rating ? 'text-brand-700' : 'text-line-strong'}`}>
                  {value <= rating ? '★' : '☆'}
                </span>
                <span className="sr-only">
                  {value} {value > 1 ? 'étoiles' : 'étoile'} sur 5 — {label}
                </span>
              </label>
            );
          })}
          <span className="ml-2 font-bold" aria-hidden="true">
            {rating > 0 ? LABELS[rating - 1] : 'Choisissez une note'}
          </span>
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">
          Ce que vous avez apprécié <span className="text-ink-soft font-normal">(facultatif)</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {REVIEW_TAG_KEYS.map((key) => {
            const checked = tags.includes(key);
            return (
              <label
                key={key}
                className={`has-focus-visible:outline-ink flex min-h-12 cursor-pointer items-center gap-2 rounded-full border-2 px-4 font-bold has-focus-visible:outline-3 ${
                  checked ? 'border-brand-700 bg-brand-700 text-white' : 'border-line-strong hover:bg-brand-100 bg-white'
                }`}
              >
                <input
                  type="checkbox"
                  name="tags"
                  value={key}
                  checked={checked}
                  onChange={() => setTags((current) => (checked ? current.filter((tag) => tag !== key) : [...current, key]))}
                  className="sr-only"
                />
                <span aria-hidden="true">{REVIEW_TAGS[key].icon}</span>
                {REVIEW_TAGS[key].label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor={`${group}-commentaire`} className="label">
          Votre commentaire <span className="text-ink-soft font-normal">(facultatif)</span>
        </label>
        <textarea
          id={`${group}-commentaire`}
          name="comment"
          rows={3}
          maxLength={600}
          className="input"
          placeholder="Quelques mots pour remercier votre voisin et aider les autres à choisir…"
          defaultValue={state?.values?.comment}
        />
      </div>

      <div>
        <p className="label" id={`${group}-photos-titre`}>
          Photos ou captures d’écran <span className="text-ink-soft font-normal">(facultatif)</span>
        </p>
        <p className="hint" id={`${group}-photos-aide`}>
          Jusqu’à {REVIEW_PHOTO_MAX_COUNT} images : l’imprimante qui remarche, l’écran réparé… Vérifiez qu’aucune
          information personnelle n’y apparaît (adresse, mot de passe, numéro de compte).
        </p>

        {photos.length > 0 && (
          <ul className="mb-3 flex flex-wrap gap-3" aria-labelledby={`${group}-photos-titre`}>
            {photos.map((photo, index) => (
              <li key={photo.key} className="relative">
                <img
                  src={photo.preview}
                  alt={`Photo ${index + 1} à joindre`}
                  className="border-line h-24 w-24 rounded-xl border-2 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(photo.key)}
                  aria-label={`Retirer la photo ${index + 1}`}
                  className="bg-ink absolute -top-2 -right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-white font-bold text-white"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        {photos.length < REVIEW_PHOTO_MAX_COUNT && (
          <label className="btn btn-secondary has-focus-visible:outline-ink has-focus-visible:outline-3">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              multiple
              onChange={addPhotos}
              disabled={preparing}
              aria-describedby={`${group}-photos-aide`}
              className="sr-only"
            />
            <span aria-hidden="true">📷</span>
            {preparing ? 'Préparation…' : photos.length > 0 ? 'Ajouter une autre photo' : 'Ajouter des photos'}
          </label>
        )}
        {photoError && (
          <p className="field-error" role="alert">
            <span aria-hidden="true">⚠</span>
            <span>{photoError}</span>
          </p>
        )}
      </div>

      <SubmitButton pendingLabel="Envoi…">Publier mon avis</SubmitButton>
    </form>
  );
}

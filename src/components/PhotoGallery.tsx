'use client';

import { useRef, useState } from 'react';

export type GalleryPhoto = { id: number; caption?: string };

type Props = {
  photos: GalleryPhoto[];
  /** Décrit la série pour les lecteurs d'écran, par exemple « Photos de l'avis de Monique D. ». */
  label: string;
  /** Taille des vignettes. */
  size?: 'sm' | 'lg';
};

const src = (id: number) => `/api/photos/${id}`;

/** Vignettes cliquables qui ouvrent les photos en grand, avec navigation au clavier et au doigt. */
export function PhotoGallery({ photos, label, size = 'sm' }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [current, setCurrent] = useState<number | null>(null);
  const touchStart = useRef<number | null>(null);

  if (photos.length === 0) return null;

  const open = (index: number) => {
    setCurrent(index);
    dialogRef.current?.showModal();
  };
  const step = (delta: number) =>
    setCurrent((index) => (index === null ? index : (index + delta + photos.length) % photos.length));

  const shown = current === null ? null : photos[current];
  const thumb = size === 'lg' ? 'h-28 w-28 sm:h-32 sm:w-32' : 'h-20 w-20';

  return (
    <>
      <ul className="flex flex-wrap gap-2" aria-label={label}>
        {photos.map((photo, index) => (
          <li key={photo.id}>
            <button
              type="button"
              onClick={() => open(index)}
              aria-label={`Agrandir la photo ${index + 1} sur ${photos.length}`}
              className={`${thumb} border-line block cursor-zoom-in overflow-hidden rounded-xl border-2 bg-white transition-transform duration-200 hover:scale-105`}
            >
              <img src={src(photo.id)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        aria-label={label}
        onClose={() => setCurrent(null)}
        onClick={(event) => {
          // Un clic sur le fond sombre ferme la fenêtre.
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') step(-1);
          if (event.key === 'ArrowRight') step(1);
        }}
        onTouchStart={(event) => {
          touchStart.current = event.touches[0].clientX;
        }}
        onTouchEnd={(event) => {
          if (touchStart.current === null) return;
          const delta = event.changedTouches[0].clientX - touchStart.current;
          touchStart.current = null;
          if (Math.abs(delta) > 50) step(delta < 0 ? 1 : -1);
        }}
        className="text-ink m-auto w-[min(100%-1.5rem,56rem)] rounded-2xl bg-white p-0 shadow-2xl"
      >
        {shown && current !== null && (
          <div className="flex max-h-[92vh] flex-col">
            <div className="border-line flex items-center justify-between gap-4 border-b px-4 py-3">
              <p className="font-bold" aria-live="polite">
                Photo {current + 1} sur {photos.length}
                {shown.caption && <span className="text-ink-soft block text-sm font-normal">{shown.caption}</span>}
              </p>
              <button
                type="button"
                className="btn btn-quiet shrink-0 px-4"
                onClick={() => dialogRef.current?.close()}
                aria-label="Fermer la photo"
              >
                ✕
              </button>
            </div>

            <div className="bg-ink flex min-h-0 flex-1 items-center justify-center">
              <img
                key={shown.id}
                src={src(shown.id)}
                alt={`${label} — photo ${current + 1}`}
                className="max-h-[70vh] w-auto max-w-full object-contain"
              />
            </div>

            {photos.length > 1 && (
              <div className="flex items-center justify-between gap-3 p-3">
                <button type="button" className="btn btn-secondary" onClick={() => step(-1)}>
                  <span aria-hidden="true">←</span> Précédente
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => step(1)}>
                  Suivante <span aria-hidden="true">→</span>
                </button>
              </div>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}

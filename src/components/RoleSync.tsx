'use client';

import { useEffect } from 'react';
import type { Role } from '@/lib/constants';

/**
 * Reporte le rôle de l'utilisateur (data-role) et l'affichage simplifié (data-view) sur la balise <html> :
 * la taille du texte en dépend.
 * Le serveur pose déjà cet attribut au chargement de la page ; ce composant le tient à jour
 * après une connexion ou une déconnexion, sans rechargement complet.
 */
export function RoleSync({ role, simple = false }: { role: Role | null; simple?: boolean }) {
  useEffect(() => {
    const root = document.documentElement;
    if (role) root.dataset.role = role;
    else delete root.dataset.role;
    if (simple) root.dataset.view = 'simple';
    else delete root.dataset.view;
  }, [role, simple]);

  return null;
}

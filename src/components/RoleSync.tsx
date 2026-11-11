'use client';

import { useEffect } from 'react';
import type { Role } from '@/lib/constants';

/**
 * Reporte le rôle de l'utilisateur sur la balise <html> (attribut data-role), dont dépend la taille du texte.
 * Le serveur pose déjà cet attribut au chargement de la page ; ce composant le tient à jour
 * après une connexion ou une déconnexion, sans rechargement complet.
 */
export function RoleSync({ role }: { role: Role | null }) {
  useEffect(() => {
    const root = document.documentElement;
    if (role) root.dataset.role = role;
    else delete root.dataset.role;
  }, [role]);

  return null;
}

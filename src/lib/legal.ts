/**
 * Informations légales du site (mentions légales, politique de confidentialité, CGU).
 *
 * Les coordonnées de l'éditeur sont lues dans les variables d'environnement (voir .env.example) :
 * elles ne doivent pas être écrites dans le dépôt, qui est public. Tant qu'une valeur manque,
 * la page affiche « [à compléter] » pour que l'oubli se voie.
 */

const env = (name: string) => process.env[name]?.trim() || null;
export const MISSING = '[à compléter]';

export type Host = { name: string; address: string; phone: string; website: string };

/** Hébergeurs connus. LEGAL_HOST choisit celui qui est affiché (vercel par défaut, contabo sur le VPS). */
const HOSTS: Record<string, Host> = {
  vercel: {
    name: 'Vercel Inc.',
    address: '440 N Barranca Ave #4133, Covina, CA 91723, États-Unis',
    phone: MISSING, // À relever sur https://vercel.com/legal puis à renseigner dans LEGAL_HOST_PHONE.
    website: 'https://vercel.com',
  },
  contabo: {
    name: 'Contabo GmbH',
    // Adresse relevée dans les conditions générales de Contabo (dossier de cadrage, 25/11/2026).
    address: 'Welfenstraße 22, 81541 Munich, Allemagne',
    phone: MISSING, // Numéro de l'Impressum de Contabo, à renseigner dans LEGAL_HOST_PHONE.
    website: 'https://contabo.com',
  },
};

export function legalInfo() {
  const hostKey = env('LEGAL_HOST') ?? 'vercel';
  const host: Host = {
    ...(HOSTS[hostKey] ?? HOSTS.vercel),
    ...(env('LEGAL_HOST_NAME') && { name: env('LEGAL_HOST_NAME')! }),
    ...(env('LEGAL_HOST_ADDRESS') && { address: env('LEGAL_HOST_ADDRESS')! }),
    ...(env('LEGAL_HOST_PHONE') && { phone: env('LEGAL_HOST_PHONE')! }),
  };
  return {
    /** Nom de la personne ou de la structure qui édite le site (association, société, ou nom des étudiants). */
    editorName: env('LEGAL_EDITOR_NAME') ?? MISSING,
    /** Statut : « Association loi 1901 », « Projet étudiant non commercial », « SAS au capital de … »… */
    editorStatus: env('LEGAL_EDITOR_STATUS'),
    /** Adresse postale de l'éditeur. Une personne physique non professionnelle peut ne donner que celle de l'hébergeur (LCEN art. 6). */
    editorAddress: env('LEGAL_EDITOR_ADDRESS'),
    /** Numéro RNA (association) ou SIREN/RCS (société), s'il existe. */
    editorRegistration: env('LEGAL_EDITOR_REGISTRATION'),
    publicationDirector: env('LEGAL_PUBLICATION_DIRECTOR') ?? MISSING,
    /** Adresse de contact : questions, signalements, exercice des droits RGPD. */
    contactEmail: env('LEGAL_CONTACT_EMAIL') ?? MISSING,
    contactConfigured: !!env('LEGAL_CONTACT_EMAIL'),
    host,
    hostKey,
    /** Date de la dernière mise à jour des documents légaux. */
    updatedAt: '27 novembre 2026',
  };
}

/** Lien de signalement par e-mail (avis, message, membre). */
export function reportHref(subject: string): string | null {
  const { contactEmail, contactConfigured } = legalInfo();
  if (!contactConfigured) return null;
  return `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}`;
}

/** Durées de conservation, reprises dans la politique de confidentialité et appliquées par scripts/purge.ts. */
export const RETENTION = {
  inactiveAccountYears: 3,
  cancelledRequestMonths: 12,
};

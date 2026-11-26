-- Comptes de démonstration (adresses @example.fr) : l'ancien mot de passe commun a été publié dans
-- l'historique du dépôt. On le remplace par un nouveau mot de passe aléatoire (seule son empreinte
-- bcrypt figure ici) et on invalide toutes les sessions ouvertes sur ces comptes.
UPDATE `users`
SET `password_hash` = '$2b$12$wEbIZbu4akXklNkYULG1a.HaqjUXnM4tNEgwFPtjM7DaTYSc0Peca',
    `session_version` = `session_version` + 1
WHERE `email` LIKE '%@example.fr';
--> statement-breakpoint
-- Numéros de démonstration remplacés par des numéros réservés à la fiction par l'ARCEP
-- (04 65 71 xx xx et 06 39 98 xx xx), pour ne jamais afficher le numéro d'une vraie personne.
UPDATE `users` SET `phone` = CASE `email`
  WHEN 'monique.durand@example.fr' THEN '04 65 71 41 17'
  WHEN 'jean-pierre.lefevre@example.fr' THEN '04 65 71 02 96'
  WHEN 'colette.moreau@example.fr' THEN '06 39 98 45 09'
  WHEN 'francoise.bernard@example.fr' THEN '06 39 98 13 58'
  WHEN 'lucas.martin@example.fr' THEN '06 39 98 56 78'
  WHEN 'ines.benali@example.fr' THEN '06 39 98 92 30'
  WHEN 'theo.rousseau@example.fr' THEN '06 39 98 83 21'
  WHEN 'hugo.lambert@example.fr' THEN '06 39 98 70 15'
  ELSE `phone` END
WHERE `email` LIKE '%@example.fr' AND `phone` IS NOT NULL;

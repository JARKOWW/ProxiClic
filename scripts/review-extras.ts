// Compliments, réponse de l'aidant et photos de certains avis, repérés par le titre de la demande.
// Les images de scripts/seed-photos/ sont des illustrations fictives créées pour la démonstration.
export const reviewExtras: Record<string, { tags?: string; reply?: string; photos?: string[] }> = {
  'Installer un antivirus sur mon ordinateur': {
    tags: 'patient,pedagogue',
    photos: ['antivirus'],
    reply: 'Merci Monique ! N’hésitez pas à me faire signe si l’antivirus vous affiche un message que vous ne comprenez pas.',
  },
  'Mon imprimante n’imprime plus en couleur': {
    tags: 'ponctuel,efficace',
    photos: ['imprimante-couleur'],
    reply: 'Avec plaisir André. Pensez à lancer une impression par semaine pour éviter que les buses ne sèchent.',
  },
  'Envoyer des photos en pièce jointe': { tags: 'pedagogue' },
  'Transférer mes documents sur un nouvel ordinateur': { tags: 'efficace,soigneux' },
  'Prendre rendez-vous en ligne chez le médecin': { tags: 'patient,pedagogue' },
  'Régler la taille du texte sur mon téléphone': {
    tags: 'souriant,patient',
    photos: ['taille-texte'],
    reply: 'Ravie d’avoir pu vous aider Françoise, profitez bien de vos messages !',
  },
  'Installer l’application de ma banque': { tags: 'pedagogue,soigneux' },
  'Faire des appels vidéo avec ma sœur': { tags: 'souriant' },
  'Sauvegarder mes contacts': { tags: 'efficace' },
  'Installer un répéteur Wi-Fi dans le garage': { tags: 'efficace,soigneux', photos: ['wifi-garage'] },
  'Retrouver les chaînes de ma télévision': { tags: 'efficace,souriant', photos: ['chaines-tv'] },
  'Changer le mot de passe du Wi-Fi': { tags: 'ponctuel,efficace,soigneux' },
  'Créer mon compte Ameli': { tags: 'patient,pedagogue' },
  'Télécharger des livres sur ma liseuse': { tags: 'souriant' },
  'Vérifier que mon ordinateur n’a pas de virus': { tags: 'efficace,pedagogue' },
  'Trier ma boîte mail et bloquer les messages indésirables': { tags: 'patient,pedagogue', photos: ['messagerie-rangee'] },
};

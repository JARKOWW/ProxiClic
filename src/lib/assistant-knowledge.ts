/**
 * Base de connaissances de l'assistant d'aide.
 * - Sans clé d'IA, l'assistant répond en choisissant la fiche la plus proche de la question.
 * - Avec une clé d'IA (voir app/api/assistant), ces fiches sont données au modèle comme référence.
 * Pour ajouter une réponse : ajoutez une fiche, avec des mots-clés écrits comme les gens parlent.
 */
export type KnowledgeEntry = {
  id: string;
  /** Question telle qu'elle est proposée en bouton. */
  question: string;
  keywords: string[];
  answer: string;
  /** Montrée parmi les questions proposées à l'ouverture. */
  suggested?: boolean;
};

export const KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: 'demander',
    question: 'Comment demander de l’aide ?',
    suggested: true,
    keywords: ['demander', 'aide', 'publier', 'probleme', 'panne', 'poster', 'depanner', 'quelqu un', 'imprimante', 'ordinateur', 'tablette', 'box', 'internet', 'mail', 'marche plus', 'fonctionne plus', 'installer', 'aider'],
    answer:
      'Sur votre page, appuyez sur « Demander de l’aide ». Choisissez l’appareil concerné, expliquez le problème avec vos mots, puis appuyez sur « Envoyer ma demande ». Les aidants de votre quartier la voient tout de suite et vous proposent un jour pour venir.',
  },
  {
    id: 'proposition',
    question: 'Un voisin m’a fait une proposition, que faire ?',
    suggested: true,
    keywords: ['proposition', 'propose', 'accepter', 'accepte', 'choisir', 'creneau', 'date', 'venir', 'refuser', 'refuse'],
    answer:
      'La proposition s’affiche sur votre page avec le jour, l’heure et la note de l’aidant. Appuyez sur « Accepter » si cela vous convient : le rendez-vous est confirmé et les autres propositions pour la même demande sont refusées. Sinon, appuyez sur « Refuser ». Vous pouvez aussi lui écrire avant de décider.',
  },
  {
    id: 'rendez-vous',
    question: 'Où voir mon rendez-vous ?',
    keywords: ['rendez vous', 'rdv', 'quand', 'heure', 'jour', 'visite', 'prevu', 'confirme'],
    answer:
      'Votre rendez-vous confirmé apparaît tout en haut de votre page, dans le grand cadre rouge : le jour, l’heure et le nom de l’aidant. Un bouton permet de l’appeler directement s’il a donné son numéro.',
  },
  {
    id: 'appeler',
    question: 'Comment appeler l’aidant ?',
    keywords: ['appeler', 'telephone', 'numero', 'joindre', 'contacter', 'portable', 'tel'],
    answer:
      'Une fois le rendez-vous confirmé, le bouton « Appeler » apparaît dans le cadre du rendez-vous, si l’aidant a donné son numéro. Sinon, écrivez-lui dans la rubrique « Messages ». Votre propre numéro n’est donné qu’à l’aidant dont vous avez accepté le rendez-vous.',
  },
  {
    id: 'messages',
    question: 'Comment écrire à un aidant ?',
    keywords: ['message', 'messages', 'ecrire', 'repondre', 'reponse', 'discussion', 'conversation', 'parler'],
    answer:
      'Dans la rubrique « Messages », appuyez sur le nom de l’aidant : la discussion s’ouvre. Écrivez votre réponse dans la case en bas, puis appuyez sur « Envoyer ». Un aidant peut vous écrire dès qu’il s’intéresse à votre demande.',
  },
  {
    id: 'annuler-rdv',
    question: 'Comment annuler un rendez-vous ?',
    keywords: ['annuler', 'annulation', 'decommander', 'empeche', 'reporter', 'deplacer', 'annuler mon rendez vous', 'annuler le rendez vous', 'annuler rdv'],
    answer:
      'Dans le cadre du rendez-vous, appuyez sur « Annuler ce rendez-vous » puis confirmez. L’aidant est prévenu par message et votre demande redevient visible pour les autres voisins. Pour changer seulement l’heure, le plus simple est d’écrire à l’aidant.',
  },
  {
    id: 'annuler-demande',
    question: 'Comment annuler une demande ?',
    keywords: ['annuler', 'supprimer', 'effacer', 'retirer', 'demande', 'plus besoin', 'regle'],
    answer:
      'Dans « Vos demandes », appuyez sur « Annuler » à côté de la demande, puis confirmez. Si un rendez-vous était prévu pour cette demande, il est annulé lui aussi.',
  },
  {
    id: 'apres-visite',
    question: 'Que faire après la visite ?',
    keywords: ['apres', 'fini', 'termine', 'fait', 'avis', 'noter', 'note', 'etoiles', 'merci', 'remercier'],
    answer:
      'Appuyez sur « La visite est faite » dans le cadre du rendez-vous. Vous pourrez ensuite donner une note de 1 à 5 étoiles et un petit mot. Votre avis aide les autres voisins à choisir.',
  },
  {
    id: 'aidant-absent',
    question: 'L’aidant n’est pas venu, que faire ?',
    keywords: ['pas venu', 'absent', 'retard', 'oublie', 'personne', 'attend', 'lapin'],
    answer:
      'Appelez-le ou écrivez-lui d’abord : il a peut-être un simple retard. S’il ne peut pas venir, annulez le rendez-vous : votre demande redeviendra visible et un autre voisin pourra vous proposer son aide.',
  },
  {
    id: 'prix',
    question: 'Est-ce que c’est payant ?',
    suggested: true,
    keywords: ['payant', 'gratuit', 'prix', 'cout', 'coute', 'payer', 'argent', 'tarif', 'euros', 'combien'],
    answer:
      'L’inscription sur Proxi’Tech est gratuite. Le site ne gère aucun paiement : c’est de l’entraide entre voisins. Ne donnez jamais vos codes bancaires ni vos mots de passe, même à un aidant.',
  },
  {
    id: 'securite',
    question: 'Est-ce que c’est sûr ?',
    suggested: true,
    keywords: ['sur', 'securite', 'confiance', 'arnaque', 'danger', 'peur', 'inconnu', 'fiable', 'prudent', 'escroquerie'],
    answer:
      'Chaque aidant a un profil avec son quartier, ses compétences et les avis des voisins qu’il a déjà aidés. Quelques conseils : échangez d’abord par messages, restez à côté de l’aidant pendant la visite, ne donnez jamais vos mots de passe ni vos codes bancaires, et demandez à un proche d’être là pour la première visite si vous le souhaitez.',
  },
  {
    id: 'aidants',
    question: 'Qui sont les aidants ?',
    keywords: ['aidant', 'aidants', 'qui sont', 'jeune', 'etudiant', 'benevole', 'profil', 'grade'],
    answer:
      'Ce sont des habitants de votre ville à l’aise avec le numérique : lycéens, étudiants, jeunes actifs… Sur leur profil, vous voyez leur quartier, leurs compétences, leur grade (qui augmente avec le nombre de visites) et les avis laissés par les voisins.',
  },
  {
    id: 'donnees',
    question: 'Qui voit mes informations ?',
    keywords: ['donnees', 'information', 'informations', 'adresse', 'prive', 'confidentiel', 'vie privee', 'naissance', 'age', 'nom'],
    answer:
      'Les autres membres voient seulement votre prénom, l’initiale de votre nom et votre quartier. Votre numéro de téléphone n’est donné qu’à l’aidant dont vous avez accepté le rendez-vous. Votre adresse et votre date de naissance ne sont jamais affichées.',
  },
  {
    id: 'affichage',
    question: 'Comment changer d’affichage ?',
    keywords: ['affichage', 'simplifie', 'complet', 'vue', 'page', 'changer', 'interface', 'compliqué', 'complique'],
    answer:
      'En affichage simplifié, tout est sur une seule page : tout en bas, appuyez sur « Passer à l’affichage complet ». En affichage complet, appuyez sur « Affichage simplifié » en haut de l’écran. Vous pouvez changer quand vous voulez.',
  },
  {
    id: 'texte',
    question: 'Le texte est trop petit',
    keywords: ['petit', 'grand', 'grossir', 'agrandir', 'lire', 'voir', 'taille', 'zoom', 'loupe', 'police'],
    answer:
      'Pour agrandir le texte : sur ordinateur, appuyez en même temps sur la touche « Ctrl » (« Cmd » sur Mac) et sur « + ». Sur téléphone ou tablette, écartez deux doigts sur l’écran. Pour revenir à la taille normale : « Ctrl » et « 0 ».',
  },
  {
    id: 'mot-de-passe',
    question: 'J’ai oublié mon mot de passe',
    keywords: ['mot de passe', 'oublie', 'connecter', 'connexion', 'identifiant', 'perdu', 'bloque'],
    answer:
      'Il n’est pas encore possible de changer un mot de passe oublié directement sur le site. Vérifiez d’abord l’adresse e-mail saisie et les majuscules. Après plusieurs essais ratés, la connexion est bloquée 15 minutes : patientez puis réessayez.',
  },
  {
    id: 'compte',
    question: 'Comment créer un compte ?',
    keywords: ['inscrire', 'inscription', 'creer', 'compte', 'commencer', 'rejoindre'],
    answer:
      'Appuyez sur « Créer un compte » en haut de la page. Choisissez « J’ai besoin d’aide », puis indiquez votre nom, votre e-mail, un mot de passe, votre date de naissance et votre quartier. Un proche peut vous aider à le faire.',
  },
  {
    id: 'preparer',
    question: 'Que préparer avant la visite ?',
    keywords: ['preparer', 'avant', 'prevoir', 'besoin', 'apporter', 'materiel', 'cable', 'wifi'],
    answer:
      'Gardez à portée de main l’appareil concerné, son chargeur ou ses câbles, et les codes utiles notés sur papier (par exemple le mot de passe du Wi-Fi, souvent écrit sous la box). Préparez aussi vos questions : l’aidant prendra le temps de vous expliquer.',
  },
  {
    id: 'bonjour',
    question: 'Bonjour',
    keywords: ['bonjour', 'salut', 'bonsoir', 'coucou', 'aide moi', 'aidez moi'],
    answer:
      'Bonjour ! Je peux vous expliquer comment demander de l’aide, accepter une proposition, écrire à un aidant ou annuler un rendez-vous. Posez votre question avec vos mots.',
  },
];

export const SUGGESTED_QUESTIONS = KNOWLEDGE.filter((entry) => entry.suggested).map((entry) => ({
  id: entry.id,
  question: entry.question,
}));

/** Minuscules, sans accents ni ponctuation. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Fiche la plus proche d'une question, ou null si rien ne correspond vraiment. */
export function findAnswer(question: string): KnowledgeEntry | null {
  const text = ` ${normalize(question)} `;
  const words = new Set(text.trim().split(' ').filter((word) => word.length > 2));
  let best: { entry: KnowledgeEntry; score: number } | null = null;

  for (const entry of KNOWLEDGE) {
    let score = 0;
    for (const keyword of entry.keywords) {
      const key = normalize(keyword);
      if (key.includes(' ') ? text.includes(` ${key} `) : words.has(key)) score += key.includes(' ') ? 3 : 2;
      // Mots proches : « annulation » / « annuler », « appeler » / « appelle »…
      else if (key.length > 4 && [...words].some((word) => word.startsWith(key.slice(0, 5)))) score += 1;
    }
    if (normalize(entry.question) === normalize(question)) score += 10;
    if (score > 0 && (!best || score > best.score)) best = { entry, score };
  }
  return best && best.score >= 2 ? best.entry : null;
}

export const FALLBACK_ANSWER =
  'Je n’ai pas bien compris votre question. Essayez avec d’autres mots, ou choisissez une des questions proposées. Vous pouvez aussi écrire à votre aidant dans la rubrique « Messages ».';

import './load-env';
import { readFileSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import { parisToDate } from '../src/lib/format';
import { reviewExtras } from './review-extras';
import type { BookingStatus, Category, RequestStatus } from '../src/lib/constants';

/** Mot de passe commun à tous les comptes de démonstration. */
const DEMO_PASSWORD = 'Proxitech2026';

const DAY = 86_400_000;
const HOUR = 3_600_000;
const now = Date.now();
const ago = (ms: number) => new Date(now - ms);

/** Jour J+offset à l'heure de Paris indiquée. */
function parisDay(offsetDays: number, time: string): Date {
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date(now + offsetDays * DAY));
  return parisToDate(date, time);
}

async function main() {
  const { db, client, schema } = await import('../src/db');
  const { users, requests, bookings, conversations, messages, reviews, reviewPhotos } = schema;

  // On repart d'une base vide (l'ordre respecte les clés étrangères).
  await db.delete(reviewPhotos);
  await db.delete(reviews);
  await db.delete(messages);
  await db.delete(conversations);
  await db.delete(bookings);
  await db.delete(requests);
  await db.delete(users);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const userRows = [
    // Demandeurs
    { key: 'monique', role: 'client', firstName: 'Monique', lastName: 'Durand', neighborhood: 'Croix-Rousse', postalCode: '69004', phone: '04 78 28 41 17', bio: 'Retraitée de l’enseignement, je débute avec le numérique mais je suis curieuse d’apprendre.' },
    { key: 'jeanpierre', role: 'client', firstName: 'Jean-Pierre', lastName: 'Lefèvre', neighborhood: 'Monplaisir', postalCode: '69008', phone: '04 78 74 02 96', bio: 'Ancien menuisier. À l’aise avec les outils, beaucoup moins avec les écrans !' },
    { key: 'colette', role: 'client', firstName: 'Colette', lastName: 'Moreau', neighborhood: 'Vaise', postalCode: '69009', phone: '06 81 22 45 09', bio: null },
    { key: 'andre', role: 'client', firstName: 'André', lastName: 'Girard', neighborhood: 'Guillotière', postalCode: '69007', phone: null, bio: 'J’utilise surtout mon ordinateur pour les mails et les photos de mes petits-enfants.' },
    { key: 'francoise', role: 'client', firstName: 'Françoise', lastName: 'Bernard', neighborhood: 'Croix-Rousse', postalCode: '69004', phone: '06 47 90 13 58', bio: null },
    // Aidants
    { key: 'lucas', role: 'helper', firstName: 'Lucas', lastName: 'Martin', neighborhood: 'Croix-Rousse', postalCode: '69004', phone: '06 12 34 56 78', bio: 'Étudiant en BUT Informatique, j’habite le quartier depuis toujours. Patient et pédagogue.', skills: 'Imprimantes, Windows, messagerie, sauvegarde de photos' },
    { key: 'ines', role: 'helper', firstName: 'Inès', lastName: 'Benali', neighborhood: 'Guillotière', postalCode: '69007', phone: '07 68 11 92 30', bio: 'En master de communication. J’ai appris WhatsApp à toute ma famille, grands-parents compris !', skills: 'Smartphones Android et iPhone, WhatsApp, appels vidéo, tablettes' },
    { key: 'theo', role: 'helper', firstName: 'Théo', lastName: 'Rousseau', neighborhood: 'Monplaisir', postalCode: '69008', phone: '06 55 07 83 21', bio: 'Apprenti technicien réseau. Les box et le Wi-Fi n’ont plus de secret pour moi.', skills: 'Box Internet, Wi-Fi, décodeurs TV, télévisions connectées' },
    { key: 'camille', role: 'helper', firstName: 'Camille', lastName: 'Petit', neighborhood: 'Vaise', postalCode: '69009', phone: null, bio: 'Lycéenne en terminale, bénévole à la médiathèque de Vaise le samedi.', skills: 'Tablettes, e-mails, démarches en ligne' },
    { key: 'hugo', role: 'helper', firstName: 'Hugo', lastName: 'Lambert', neighborhood: 'Part-Dieu', postalCode: '69003', phone: '06 29 64 70 15', bio: 'Jeune développeur. Je donne volontiers un coup de main le soir et le week-end.', skills: 'Ordinateurs lents, antivirus, sécurité, Mac et Windows' },
  ] as const;

  const userId: Record<string, number> = {};
  for (const [i, u] of userRows.entries()) {
    const [row] = await db
      .insert(users)
      .values({
        email: `${u.firstName}.${u.lastName}@example.fr`
          .toLowerCase()
          .normalize('NFD')
          .replace(/[̀-ͯ]/g, ''),
        passwordHash,
        role: u.role,
        firstName: u.firstName,
        lastName: u.lastName,
        neighborhood: u.neighborhood,
        city: 'Lyon',
        postalCode: u.postalCode,
        phone: u.phone,
        bio: u.bio,
        skills: 'skills' in u ? u.skills : null,
        createdAt: ago((60 - i * 4) * DAY),
      })
      .returning({ id: users.id });
    userId[u.key] = row.id;
  }

  type SeedMessage = { from: string; body: string; at: Date; read?: boolean };
  type SeedProposal = {
    helper: string;
    at: Date;
    durationMin: number;
    status: BookingStatus;
    createdAt: Date;
    messages: SeedMessage[];
    review?: { rating: number; comment: string | null; at: Date };
  };
  type SeedRequest = {
    client: string;
    title: string;
    description: string;
    category: Category;
    availability: string | null;
    status: RequestStatus;
    createdAt: Date;
    proposals?: SeedProposal[];
  };

  const requestRows: SeedRequest[] = [
    {
      client: 'monique',
      title: 'Installer ma nouvelle imprimante HP',
      description:
        'Mon fils m’a offert une imprimante HP DeskJet sans fil. Elle est déballée et branchée, mais je n’arrive pas à la relier à mon ordinateur portable. J’aimerais aussi apprendre à numériser un document.',
      category: 'imprimante',
      availability: 'En semaine, plutôt l’après-midi',
      status: 'open',
      createdAt: ago(1 * DAY + 3 * HOUR),
      proposals: [
        {
          helper: 'lucas',
          at: parisDay(2, '14:00'),
          durationMin: 60,
          status: 'pending',
          createdAt: ago(20 * HOUR),
          messages: [
            { from: 'lucas', body: 'Bonjour Madame Durand, j’habite à deux rues de chez vous. Je peux passer installer votre imprimante après-demain à 14 h si cela vous convient.', at: ago(20 * HOUR), read: true },
            { from: 'monique', body: 'Bonjour Lucas, merci beaucoup ! Faut-il que je prépare quelque chose avant votre venue ?', at: ago(18 * HOUR), read: true },
            { from: 'lucas', body: 'Gardez simplement le câble fourni dans la boîte et le mot de passe de votre Wi-Fi (souvent sur l’étiquette de la box). Je m’occupe du reste 🙂', at: ago(17 * HOUR), read: false },
          ],
        },
      ],
    },
    {
      client: 'monique',
      title: 'Apprendre à utiliser WhatsApp pour appeler mes petits-enfants',
      description:
        'Mes petits-enfants habitent à Bordeaux et me disent d’installer WhatsApp pour les appels vidéo. J’ai un téléphone Samsung. Il me faudrait de l’aide pour l’installation et une petite démonstration.',
      category: 'smartphone',
      availability: 'Le matin, sauf le mercredi',
      status: 'booked',
      createdAt: ago(4 * DAY),
      proposals: [
        {
          helper: 'ines',
          at: parisDay(3, '10:00'),
          durationMin: 90,
          status: 'confirmed',
          createdAt: ago(3 * DAY + 5 * HOUR),
          messages: [
            { from: 'ines', body: 'Bonjour Monique ! Je serais ravie de vous montrer WhatsApp. Je vous propose de venir un matin, on prendra le temps qu’il faut.', at: ago(3 * DAY + 5 * HOUR), read: true },
            { from: 'monique', body: 'Avec plaisir Inès. J’ai accepté votre proposition. Je vous préparerai un café !', at: ago(3 * DAY + 2 * HOUR), read: true },
            { from: 'ines', body: 'Parfait, à très bientôt alors. Pensez à charger votre téléphone la veille 😊', at: ago(3 * DAY + 1 * HOUR), read: true },
          ],
        },
      ],
    },
    {
      client: 'jeanpierre',
      title: 'Le Wi-Fi ne fonctionne plus à l’étage',
      description:
        'Depuis le changement de box la semaine dernière, la connexion est très mauvaise dans la chambre et le bureau à l’étage. En bas, tout fonctionne. Faut-il un répéteur ? Je ne sais pas lequel choisir ni comment l’installer.',
      category: 'wifi',
      availability: 'Tous les jours après 16 h',
      status: 'open',
      createdAt: ago(5 * HOUR),
    },
    {
      client: 'colette',
      title: 'Configurer la tablette offerte par mes enfants',
      description:
        'J’ai reçu une tablette Samsung pour mon anniversaire. J’aimerais pouvoir lire le journal, regarder mes photos et jouer au scrabble. Elle n’a encore jamais été allumée.',
      category: 'tablette',
      availability: 'Samedi ou dimanche',
      status: 'open',
      createdAt: ago(2 * DAY),
      proposals: [
        {
          helper: 'camille',
          at: parisDay(4, '15:00'),
          durationMin: 60,
          status: 'pending',
          createdAt: ago(1 * DAY + 6 * HOUR),
          messages: [
            { from: 'camille', body: 'Bonjour Madame Moreau, je suis disponible à 15 h dans quelques jours pour configurer votre tablette avec vous. Est-ce que cela vous irait ?', at: ago(1 * DAY + 6 * HOUR), read: false },
          ],
        },
      ],
    },
    {
      client: 'andre',
      title: 'Créer mon espace personnel sur impots.gouv.fr',
      description:
        'Je dois désormais déclarer mes revenus en ligne et je n’ai jamais créé mon compte. J’ai mon dernier avis d’imposition sous la main. Je souhaite être accompagné pas à pas, sans que l’on fasse les choses à ma place.',
      category: 'demarches',
      availability: 'Lundi, mardi ou jeudi matin',
      status: 'open',
      createdAt: ago(3 * DAY + 2 * HOUR),
    },
    {
      client: 'francoise',
      title: 'Trier ma boîte mail et bloquer les messages indésirables',
      description:
        'Ma boîte Orange déborde de publicités : plus de 4 000 messages non lus. J’ai peur de supprimer des courriers importants. J’aimerais apprendre à faire le tri et à me désabonner.',
      category: 'email',
      availability: null,
      status: 'done',
      createdAt: ago(12 * DAY),
      proposals: [
        {
          helper: 'lucas',
          at: parisDay(-5, '16:00'),
          durationMin: 90,
          status: 'completed',
          createdAt: ago(11 * DAY),
          review: { rating: 5, comment: 'Lucas a été d’une patience remarquable. Ma messagerie est enfin rangée et j’ai compris comment faire toute seule.', at: ago(4 * DAY) },
          messages: [
            { from: 'lucas', body: 'Bonjour Madame Bernard, je peux vous aider à faire le ménage dans votre messagerie. À 16 h en début de semaine, cela vous convient ?', at: ago(11 * DAY), read: true },
            { from: 'francoise', body: 'Bonjour Lucas, c’est parfait. Je sonne au nom de Bernard, 2e étage.', at: ago(10 * DAY + 20 * HOUR), read: true },
            { from: 'francoise', body: 'Encore merci pour votre patience hier ! Ma boîte est enfin propre et j’ai bien noté comment me désabonner.', at: ago(4 * DAY + 2 * HOUR), read: true },
            { from: 'lucas', body: 'Avec grand plaisir ! N’hésitez pas si vous avez d’autres questions.', at: ago(4 * DAY + 1 * HOUR), read: true },
          ],
        },
      ],
    },
    {
      client: 'jeanpierre',
      title: 'Brancher le décodeur TV de ma nouvelle box',
      description:
        'Le technicien a installé la box mais pas le décodeur. Il y a plusieurs câbles et je ne sais pas lequel va où. Ma télévision est une Sony d’il y a quelques années.',
      category: 'tv',
      availability: 'En fin d’après-midi',
      status: 'booked',
      createdAt: ago(2 * DAY + 8 * HOUR),
      proposals: [
        {
          helper: 'theo',
          at: parisDay(1, '16:00'),
          durationMin: 60,
          status: 'confirmed',
          createdAt: ago(2 * DAY),
          messages: [
            { from: 'theo', body: 'Bonjour Monsieur Lefèvre, je fais ce branchement toutes les semaines en alternance. Je peux passer demain à 16 h.', at: ago(2 * DAY), read: true },
            { from: 'jeanpierre', body: 'Très bien, c’est noté. L’interphone est au nom de Lefèvre.', at: ago(1 * DAY + 20 * HOUR), read: true },
            { from: 'theo', body: 'Entendu ! Par chance, avez-vous un câble HDMI ? Sinon j’en apporte un.', at: ago(3 * HOUR), read: false },
          ],
        },
      ],
    },
    {
      client: 'colette',
      title: 'J’ai reçu un SMS suspect : mon téléphone est-il en danger ?',
      description:
        'J’ai reçu un SMS me demandant de payer des frais de livraison pour un colis et j’ai cliqué sur le lien, sans rien payer. Je voudrais que quelqu’un vérifie mon téléphone et m’explique comment reconnaître ces arnaques.',
      category: 'securite',
      availability: 'Dès que possible',
      status: 'open',
      createdAt: ago(9 * HOUR),
    },
    {
      client: 'andre',
      title: 'Mon ordinateur est devenu très lent',
      description:
        'Mon ordinateur portable Asus met plus de dix minutes à démarrer et des fenêtres de publicité s’ouvrent toutes seules. Il a environ six ans. Peut-on le réparer ou faut-il le remplacer ?',
      category: 'ordinateur',
      availability: 'L’après-midi en semaine',
      status: 'open',
      createdAt: ago(1 * DAY + 10 * HOUR),
      proposals: [
        {
          helper: 'hugo',
          at: parisDay(2, '18:00'),
          durationMin: 120,
          status: 'pending',
          createdAt: ago(1 * DAY + 2 * HOUR),
          messages: [
            { from: 'hugo', body: 'Bonjour Monsieur Girard, ces symptômes ressemblent à des logiciels publicitaires. Un bon nettoyage devrait suffire, pas besoin de racheter un ordinateur. Je peux venir en fin de journée.', at: ago(1 * DAY + 2 * HOUR), read: true },
          ],
        },
        {
          helper: 'ines',
          at: parisDay(3, '15:00'),
          durationMin: 90,
          status: 'pending',
          createdAt: ago(22 * HOUR),
          messages: [
            { from: 'ines', body: 'Bonjour André, nous sommes voisins à la Guillotière. Je peux passer un après-midi comme vous le souhaitez.', at: ago(22 * HOUR), read: false },
          ],
        },
      ],
    },
    {
      client: 'francoise',
      title: 'Sauvegarder mes photos de famille',
      description:
        'J’ai des centaines de photos sur mon téléphone et il me dit que la mémoire est pleine. J’aimerais les copier sur mon ordinateur et sur une clé USB pour ne pas les perdre.',
      category: 'ordinateur',
      availability: 'Le mardi ou le vendredi',
      status: 'open',
      createdAt: ago(2 * HOUR),
    },
  ];

  // Historique : interventions déjà effectuées, avec l'avis laissé par le demandeur.
  const history: [client: string, helper: string, category: Category, title: string, daysAgo: number, rating: number, comment: string | null][] = [
    ['monique', 'lucas', 'ordinateur', 'Installer un antivirus sur mon ordinateur', 52, 5, 'Très gentil et très clair. Il m’a tout expliqué sans jamais s’impatienter.'],
    ['andre', 'lucas', 'imprimante', 'Mon imprimante n’imprime plus en couleur', 45, 5, 'Problème réglé en vingt minutes. Un jeune homme sérieux et ponctuel.'],
    ['colette', 'lucas', 'email', 'Envoyer des photos en pièce jointe', 38, 4, 'Bonne explication, j’ai encore besoin de m’entraîner mais j’y arrive !'],
    ['jeanpierre', 'lucas', 'ordinateur', 'Transférer mes documents sur un nouvel ordinateur', 30, 5, null],
    ['monique', 'lucas', 'demarches', 'Prendre rendez-vous en ligne chez le médecin', 21, 5, 'Grâce à Lucas, je prends maintenant mes rendez-vous toute seule sur Internet.'],
    ['francoise', 'ines', 'smartphone', 'Régler la taille du texte sur mon téléphone', 48, 5, 'Inès est adorable. Je peux enfin lire mes messages sans mes lunettes !'],
    ['andre', 'ines', 'smartphone', 'Installer l’application de ma banque', 34, 5, 'Rassurante et prudente : elle m’a bien expliqué comment éviter les arnaques.'],
    ['colette', 'ines', 'tablette', 'Faire des appels vidéo avec ma sœur', 19, 4, 'Très bon moment, ma sœur était ravie de me voir à l’écran.'],
    ['jeanpierre', 'ines', 'smartphone', 'Sauvegarder mes contacts', 9, 5, null],
    ['jeanpierre', 'theo', 'wifi', 'Installer un répéteur Wi-Fi dans le garage', 41, 5, 'Théo connaît son affaire. Le Wi-Fi fonctionne maintenant jusque dans l’atelier.'],
    ['francoise', 'theo', 'tv', 'Retrouver les chaînes de ma télévision', 27, 4, 'Efficace et souriant. Toutes les chaînes sont revenues.'],
    ['andre', 'theo', 'wifi', 'Changer le mot de passe du Wi-Fi', 14, 5, 'Rapide, poli, et il m’a noté le nouveau mot de passe en gros caractères.'],
    ['colette', 'camille', 'demarches', 'Créer mon compte Ameli', 25, 5, 'Camille est très mûre pour son âge. Tout a été fait avec moi, pas à ma place.'],
    ['monique', 'camille', 'tablette', 'Télécharger des livres sur ma liseuse', 11, 4, 'Une jeune fille charmante. Ma liseuse est pleine de romans !'],
    ['francoise', 'hugo', 'securite', 'Vérifier que mon ordinateur n’a pas de virus', 17, 5, 'Hugo a tout nettoyé et m’a donné de bons conseils pour la suite.'],
  ];
  for (const [client, helper, category, title, daysAgo, rating, comment] of history) {
    requestRows.push({
      client,
      title,
      description: `${title}. Intervention réalisée à domicile avec l’aide d’un voisin.`,
      category,
      availability: null,
      status: 'done',
      createdAt: ago((daysAgo + 4) * DAY),
      proposals: [
        {
          helper,
          at: parisDay(-daysAgo, '15:00'),
          durationMin: 60,
          status: 'completed',
          createdAt: ago((daysAgo + 3) * DAY),
          messages: [],
          review: { rating, comment, at: ago((daysAgo - 1) * DAY) },
        },
      ],
    });
  }

  let bookingCount = 0;
  let reviewCount = 0;
  let photoCount = 0;
  let messageCount = 0;

  for (const r of requestRows) {
    const client = userRows.find((u) => u.key === r.client)!;
    const [request] = await db
      .insert(requests)
      .values({
        clientId: userId[r.client],
        title: r.title,
        description: r.description,
        category: r.category,
        availability: r.availability,
        neighborhood: client.neighborhood,
        city: 'Lyon',
        status: r.status,
        createdAt: r.createdAt,
      })
      .returning({ id: requests.id });

    for (const p of r.proposals ?? []) {
      const [booking] = await db
        .insert(bookings)
        .values({
          requestId: request.id,
          helperId: userId[p.helper],
          scheduledAt: p.at,
          durationMin: p.durationMin,
          status: p.status,
          createdAt: p.createdAt,
        })
        .returning({ id: bookings.id });
      bookingCount += 1;

      if (p.review) {
        const extras = reviewExtras[r.title] ?? {};
        const [review] = await db
          .insert(reviews)
          .values({
            bookingId: booking.id,
            authorId: userId[r.client],
            helperId: userId[p.helper],
            rating: p.review.rating,
            comment: p.review.comment,
            tags: extras.tags ?? null,
            reply: extras.reply ?? null,
            repliedAt: extras.reply ? new Date(p.review.at.getTime() + 5 * HOUR) : null,
            createdAt: p.review.at,
          })
          .returning({ id: reviews.id });
        reviewCount += 1;
        for (const name of extras.photos ?? []) {
          await db.insert(reviewPhotos).values({
            reviewId: review.id,
            mime: 'image/jpeg',
            data: readFileSync(new URL(`./seed-photos/${name}.jpg`, import.meta.url)),
            createdAt: p.review.at,
          });
          photoCount += 1;
        }
      }
      if (p.messages.length === 0) continue;

      const [conversation] = await db
        .insert(conversations)
        .values({ requestId: request.id, clientId: userId[r.client], helperId: userId[p.helper], createdAt: p.createdAt })
        .returning({ id: conversations.id });

      for (const m of p.messages) {
        await db.insert(messages).values({
          conversationId: conversation.id,
          senderId: userId[m.from],
          body: m.body,
          createdAt: m.at,
          readAt: m.read ? new Date(m.at.getTime() + 10 * 60_000) : null,
        });
        messageCount += 1;
      }
    }
  }

  client.close();

  console.log(
    `✔ Données de démonstration insérées : ${userRows.length} membres, ${requestRows.length} demandes, ${bookingCount} rendez-vous, ${reviewCount} avis (${photoCount} photos), ${messageCount} messages.`,
  );
  console.log('\nComptes de démonstration (mot de passe : %s)', DEMO_PASSWORD);
  console.log('  Demandeuse : monique.durand@example.fr');
  console.log('  Aidant     : lucas.martin@example.fr');
}

main().catch((error) => {
  console.error('✖ Échec du peuplement de la base :', error);
  process.exit(1);
});

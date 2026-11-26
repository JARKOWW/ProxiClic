import { NextResponse } from 'next/server';
import { z } from 'zod';
import { FALLBACK_ANSWER, findAnswer, KNOWLEDGE } from '@/lib/assistant-knowledge';
import { clientIp, rateLimit } from '@/lib/rate-limit';

/**
 * Assistant d'aide.
 * - Si GROQ_API_KEY est défini : réponse rédigée par un modèle open source (gpt-oss, licence Apache 2.0)
 *   hébergé gratuitement par Groq, à partir de la base de connaissances du site.
 * - Sinon, ou si l'IA ne répond pas : réponse tirée de la base de connaissances (aucun service extérieur).
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const MAX_TURNS = 10;
/** Plafond global d'appels à Groq par jour (protège le quota et la facturation du compte Groq). */
const DAILY_AI_LIMIT = Number(process.env.GROQ_DAILY_LIMIT) || 500;

/**
 * Minimisation des données (RGPD art. 5) : on masque ce qui ressemble à une adresse e-mail, un numéro de
 * téléphone ou une longue suite de chiffres (carte bancaire, IBAN, code) avant tout envoi à Groq (États-Unis).
 */
function maskPersonalData(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[adresse e-mail masquée]')
    .replace(/\bFR\d{2}(?:[ ]?[A-Z0-9]{4}){5,6}\b/gi, '[IBAN masqué]')
    .replace(/(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4}/g, '[numéro masqué]')
    .replace(/\d(?:[\s-]?\d){5,}/g, '[chiffres masqués]');
}

/** Refuse les appels venant d'un autre site (la route ne sert qu'à la fenêtre d'aide de Proxi'Clic). */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return request.headers.get('sec-fetch-site') !== 'cross-site';
  try {
    return new URL(origin).host === (request.headers.get('x-forwarded-host') ?? request.headers.get('host'));
  } catch {
    return false;
  }
}

const bodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().trim().min(1).max(600) }))
    .min(1)
    .max(MAX_TURNS * 2),
});

const SYSTEM_PROMPT = `Tu es l'assistant d'aide de Proxi'Clic, un site d'entraide numérique : des voisins à l'aise avec le numérique (les « aidants ») viennent gratuitement aider à domicile des personnes, souvent âgées, qui ont un souci avec un appareil (les « demandeurs »).

Comment répondre :
- En français, avec des phrases courtes et des mots simples, comme à une personne qui débute avec le numérique. Vouvoie toujours.
- 5 phrases au maximum. Pour une marche à suivre, donne au plus 4 étapes numérotées. Texte brut uniquement : pas d'astérisques, pas de Markdown, pas de tableaux, pas de jargon.
- Pour le fonctionnement du site, appuie-toi uniquement sur la fiche ci-dessous. N'invente jamais un bouton, une page ou un service qui n'y figure pas.
- Pour une question pratique sur un appareil (imprimante, Wi-Fi, téléphone, e-mails, télévision…), donne un ou deux conseils simples et sans risque. Si cela demande une manipulation délicate, conseille de publier une demande d'aide pour qu'un voisin vienne.
- Ne demande jamais et n'accepte jamais de mot de passe, code bancaire ou code reçu par SMS. Si la personne en parle, rappelle-lui de ne jamais les communiquer.
- Si un message semble être une arnaque (faux conseiller, paiement urgent, colis, remboursement…), dis-le clairement et conseille de ne rien payer et de ne pas cliquer.
- Pour une urgence de santé ou un danger, dis d'appeler le 15 ou le 112.
- Si tu ne sais pas, dis-le simplement et propose de publier une demande d'aide.

Fiche du site :
${KNOWLEDGE.map((entry) => `- ${entry.question} ${entry.answer}`).join('\n')}`;

async function askGroq(messages: z.infer<typeof bodySchema>['messages'], apiKey: string): Promise<string | null> {
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || DEFAULT_MODEL,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      reasoning_effort: 'low',
      include_reasoning: false,
      max_completion_tokens: 1024,
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    console.error('Assistant : réponse Groq', response.status, (await response.text()).slice(0, 300));
    return null;
  }
  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  // La fenêtre affiche du texte brut : on retire le Markdown éventuel (gras, titres, puces en étoile).
  const answer = data.choices?.[0]?.message?.content
    ?.replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[*-]\s+/gm, '• ')
    .replace(/[ \t]+$/gm, '')
    .trim();
  return answer || null;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ answer: 'Requête refusée.', source: 'error' }, { status: 403 });
  }
  const limit = await rateLimit(`assistant:${await clientIp()}`, 20, 10 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { answer: `Vous avez posé beaucoup de questions. Réessayez dans ${limit.retryAfterMin} minutes.`, source: 'limit' },
      { status: 429 },
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ answer: 'Votre question est vide ou trop longue.', source: 'error' }, { status: 400 });
  }
  const messages = parsed.data.messages
    .slice(-MAX_TURNS * 2)
    .map((m) => ({ ...m, content: maskPersonalData(m.content) }));
  const question = messages.findLast((m) => m.role === 'user')?.content ?? '';

  const apiKey = process.env.GROQ_API_KEY;
  const day = new Date().toISOString().slice(0, 10);
  if (apiKey && (await rateLimit(`assistant-ai:${day}`, DAILY_AI_LIMIT, 86_400_000)).allowed) {
    try {
      const answer = await askGroq(messages, apiKey);
      if (answer) return NextResponse.json({ answer, source: 'ai' });
    } catch (error) {
      console.error('Assistant : Groq injoignable', error);
    }
  }

  const entry = findAnswer(question);
  return NextResponse.json({ answer: entry?.answer ?? FALLBACK_ANSWER, source: 'faq' });
}

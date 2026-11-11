'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { sendMessage, type ChatMessage } from '@/actions/messages';
import { formatDate, formatTime } from '@/lib/format';
import { Avatar } from './ConversationList';
import { MESSAGES_READ_EVENT } from './NavLink';

const POLL_INTERVAL_MS = 3000;

/** Messages automatiques liés aux rendez-vous (proposition, confirmation, annulation). */
const EVENT_PREFIX = /^(📅|✅|❌)\s*/u;
const EVENT_STYLES: Record<string, string> = {
  '📅': 'border-brand-200 bg-white text-ink',
  '✅': 'border-ok-ink bg-ok-bg text-ok-ink',
  '❌': 'border-line-strong bg-mute-bg text-mute-ink',
};

const QUICK_REPLIES = ['Bonjour !', 'Quand seriez-vous disponible ?', 'Merci beaucoup !'];

type Props = {
  conversationId: number;
  currentUserId: number;
  other: { id: number; firstName: string };
  initialMessages: ChatMessage[];
};

function dayLabel(iso: string): string {
  const day = formatDate(iso);
  if (day === formatDate(new Date())) return 'Aujourd’hui';
  if (day === formatDate(Date.now() - 86_400_000)) return 'Hier';
  return day;
}

export function ChatWindow({ conversationId, currentUserId, other, initialMessages }: Props) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastIdRef = useRef(initialMessages.at(-1)?.id ?? 0);

  /** Ajoute les messages reçus en ignorant ceux déjà affichés. */
  function append(incoming: ChatMessage[]) {
    if (incoming.length === 0) return;
    setMessages((current) => {
      const known = new Set(current.map((m) => m.id));
      const fresh = incoming.filter((m) => !known.has(m.id));
      return fresh.length ? [...current, ...fresh].sort((a, b) => a.id - b.id) : current;
    });
    lastIdRef.current = Math.max(lastIdRef.current, ...incoming.map((m) => m.id));
  }

  // Récupère régulièrement les nouveaux messages tant que l'onglet est visible.
  useEffect(() => {
    let cancelled = false;
    async function poll() {
      if (document.hidden) return;
      try {
        const res = await fetch(`/api/conversations/${conversationId}/messages?after=${lastIdRef.current}`, {
          cache: 'no-store',
        });
        if (!res.ok || cancelled) return;
        const data: { messages: ChatMessage[] } = await res.json();
        if (cancelled) return;
        append(data.messages);
        // Les messages reçus sont désormais lus : la pastille du menu doit suivre.
        if (data.messages.some((m) => m.senderId !== currentUserId)) {
          window.dispatchEvent(new Event(MESSAGES_READ_EVENT));
        }
      } catch {
        // Coupure réseau passagère : on réessaiera au prochain tour.
      }
    }
    // À l'ouverture, le serveur vient de marquer la conversation comme lue.
    window.dispatchEvent(new Event(MESSAGES_READ_EVENT));
    const timer = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [conversationId, currentUserId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  /** La zone de saisie grandit avec le texte, jusqu'à une hauteur maximale. */
  function resize() {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
  }
  useEffect(resize, [draft]);

  function submit() {
    const body = draft.trim();
    if (!body || sending) return;
    setError(null);
    startSending(async () => {
      const result = await sendMessage(conversationId, body);
      if (result.ok) {
        append([result.message]);
        setDraft('');
        inputRef.current?.focus();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex h-[68vh] min-h-[30rem] flex-col">
      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-label={`Conversation avec ${other.firstName}`}
        tabIndex={0}
        className="bg-brand-50 flex-1 overflow-y-auto px-3 py-5 sm:px-6"
        style={{
          backgroundImage: 'radial-gradient(circle, rgb(139 0 0 / 0.07) 1.2px, transparent 1.2px)',
          backgroundSize: '22px 22px',
        }}
      >
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span aria-hidden="true" className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl shadow-sm">
              👋
            </span>
            <p className="mt-4 text-xl font-bold">Dites bonjour à {other.firstName} !</p>
            <p className="text-ink-soft mt-1 max-w-sm">Présentez-vous en quelques mots pour démarrer la conversation.</p>
          </div>
        )}

        {messages.map((message, index) => {
          const previous = messages[index - 1];
          const next = messages[index + 1];
          const mine = message.senderId === currentUserId;
          const day = formatDate(message.createdAt);
          const newDay = !previous || formatDate(previous.createdAt) !== day;
          const isEvent = EVENT_PREFIX.test(message.body);

          // Regroupe les messages consécutifs d'un même auteur, le même jour.
          const sameGroup = (a: ChatMessage | undefined) =>
            !!a && a.senderId === message.senderId && formatDate(a.createdAt) === day && !EVENT_PREFIX.test(a.body);
          const firstOfGroup = isEvent || !sameGroup(previous);
          const lastOfGroup = isEvent || !sameGroup(next);

          // Un message d'événement peut être suivi d'un mot personnel (après une ligne vide).
          const [head, ...rest] = isEvent ? message.body.split('\n\n') : [message.body];
          const text = isEvent ? rest.join('\n\n') : head;
          const icon = isEvent ? (head.match(EVENT_PREFIX)?.[1] ?? '📅') : '';
          const author = mine ? 'Vous' : other.firstName;

          return (
            <div key={message.id} className={firstOfGroup ? 'mt-4 first:mt-0' : 'mt-1'}>
              {newDay && (
                <p className="my-5 flex justify-center first:mt-0">
                  <span className="text-ink-soft rounded-full bg-white px-4 py-1 text-sm font-bold shadow-sm">
                    {dayLabel(message.createdAt)}
                  </span>
                </p>
              )}

              {isEvent && (
                <div className={`mx-auto my-2 flex max-w-md items-center gap-3 rounded-2xl border-2 px-4 py-3 ${EVENT_STYLES[icon]}`}>
                  <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-2xl">
                    {icon}
                  </span>
                  <p className="leading-snug">
                    <span className="block font-bold">{head.replace(EVENT_PREFIX, '')}</span>
                    <span className="text-sm opacity-80">
                      {author} · {formatTime(message.createdAt)}
                    </span>
                  </p>
                </div>
              )}

              {text && (
                <div className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                  {!mine && (lastOfGroup ? <Avatar user={other} size="h-9 w-9 text-sm" /> : <span className="w-9 shrink-0" />)}
                  <div
                    className={`max-w-[82%] px-4 py-2.5 sm:max-w-[70%] ${
                      mine
                        ? `bg-brand-700 rounded-3xl text-white ${lastOfGroup ? 'rounded-br-md' : ''}`
                        : `border-line text-ink rounded-3xl border bg-white shadow-sm ${lastOfGroup ? 'rounded-bl-md' : ''}`
                    }`}
                  >
                    <span className="sr-only">{author} : </span>
                    <p className="break-words whitespace-pre-wrap">{text}</p>
                    {lastOfGroup && (
                      <p className={`mt-0.5 text-right text-sm ${mine ? 'text-brand-100' : 'text-ink-soft'}`}>
                        {formatTime(message.createdAt)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <form
        className="border-line border-t bg-white p-3 sm:p-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        {error && (
          <p role="alert" className="field-error mb-2">
            <span aria-hidden="true">⚠</span> {error}
          </p>
        )}

        {messages.length === 0 && !draft && (
          <ul className="mb-3 flex flex-wrap gap-2" aria-label="Suggestions de message">
            {QUICK_REPLIES.map((reply) => (
              <li key={reply}>
                <button
                  type="button"
                  className="border-brand-700 text-brand-700 hover:bg-brand-100 min-h-11 cursor-pointer rounded-full border-2 bg-white px-4 font-bold"
                  onClick={() => {
                    setDraft(reply);
                    inputRef.current?.focus();
                  }}
                >
                  {reply}
                </button>
              </li>
            ))}
          </ul>
        )}

        <label htmlFor="message-body" className="sr-only">
          Votre message à {other.firstName}
        </label>
        <div className="border-line-strong focus-within:border-brand-700 focus-within:ring-brand-100 flex items-end gap-2 rounded-[1.75rem] border-2 bg-white p-1.5 pl-5 transition-shadow focus-within:ring-4">
          <textarea
            id="message-body"
            ref={inputRef}
            className="max-h-40 min-h-12 flex-1 resize-none bg-transparent py-2.5 outline-none placeholder:text-[#7a686d]"
            rows={1}
            maxLength={2000}
            placeholder={`Écrivez à ${other.firstName}…`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                submit();
              }
            }}
          />
          <button type="submit" className="btn btn-primary shrink-0 px-5 shadow-none" disabled={sending || !draft.trim()}>
            {sending ? 'Envoi…' : 'Envoyer'}
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
        <p className="text-ink-soft mt-2 hidden px-2 text-sm sm:block">
          Touche Entrée pour envoyer · Maj + Entrée pour aller à la ligne
        </p>
      </form>
    </div>
  );
}

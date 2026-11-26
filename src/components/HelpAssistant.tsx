"use client";

import { useEffect, useRef, useState } from "react";
import { SUGGESTED_QUESTIONS } from "@/lib/assistant-knowledge";

type Turn = { role: "user" | "assistant"; content: string };

const WELCOME =
  "Bonjour ! Posez-moi votre question, ou choisissez-en une ci-dessous.";

/**
 * Bouton « Une question ? » présent sur toutes les pages, qui ouvre une petite fenêtre de discussion.
 * Fenêtre modale native (<dialog>) : piège le focus, se ferme avec Échap ; les réponses sont annoncées
 * aux lecteurs d'écran grâce à la zone role="log".
 */
/** `aiEnabled` : vrai si une clé Groq est configurée (les questions partent alors aux États-Unis). */
export function HelpAssistant({ aiEnabled = false }: { aiEnabled?: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Dernier message affiché : on fait défiler jusqu'à son début pour lire la réponse depuis la première ligne.
  const lastRef = useRef<HTMLParagraphElement>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    lastRef.current?.scrollIntoView({ block: "start" });
  }, [turns, pending]);

  function open() {
    dialogRef.current?.showModal();
    inputRef.current?.focus();
  }

  async function ask(question: string) {
    const text = question.trim();
    if (!text || pending) return;
    const history: Turn[] = [
      ...turns,
      { role: "user", content: text.slice(0, 600) },
    ];
    setTurns(history);
    setDraft("");
    setPending(true);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data: { answer?: string } = await response.json();
      setTurns([
        ...history,
        {
          role: "assistant",
          content: data.answer ?? "Désolé, je n’ai pas pu répondre.",
        },
      ]);
    } catch {
      setTurns([
        ...history,
        {
          role: "assistant",
          content:
            "La connexion semble coupée. Vérifiez votre Internet puis réessayez.",
        },
      ]);
    } finally {
      setPending(false);
      inputRef.current?.focus();
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="btn btn-primary fixed right-4 bottom-4 z-40 shadow-pop sm:right-6 sm:bottom-6"
        aria-haspopup="dialog"
      >
        <span aria-hidden="true" className="text-xl leading-none">
          ?
        </span>
        Une question ?
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="assistant-titre"
        className="m-auto h-[min(90vh,44rem)] w-[min(100%-1.5rem,32rem)] rounded-3xl p-0 shadow-2xl sm:mr-6 sm:mb-6"
      >
        <div className="flex h-full flex-col">
          <div className="border-line flex items-center justify-between gap-4 border-b px-5 py-4">
            <div>
              <h2 id="assistant-titre" className="text-2xl">
                {aiEnabled ? "Assistant automatique (IA)" : "Assistant automatique"}
              </h2>
              <p className="text-ink-soft text-sm">
                {aiEnabled
                  ? "Je suis un programme d’intelligence artificielle, pas une personne. Je peux me tromper : pour un vrai problème, demandez l’aide d’un voisin."
                  : "Je suis un programme, pas une personne. Pour un vrai problème, demandez l’aide d’un voisin."}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-quiet shrink-0 px-4"
              onClick={() => dialogRef.current?.close()}
            >
              Fermer
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            <div
              role="log"
              aria-live="polite"
              aria-label="Discussion avec l’assistant"
              className="space-y-3"
            >
              <p className="bg-brand-50 max-w-[90%] rounded-2xl px-4 py-3">
                {WELCOME}
              </p>
              {turns.map((turn, index) => (
                <p
                  key={index}
                  ref={index === turns.length - 1 ? lastRef : undefined}
                  className={`max-w-[90%] rounded-2xl px-4 py-3 whitespace-pre-wrap ${
                    turn.role === "user"
                      ? "bg-brand-700 ml-auto text-white"
                      : "bg-brand-50"
                  }`}
                >
                  <span className="sr-only">
                    {turn.role === "user" ? "Vous : " : "Assistant : "}
                  </span>
                  {turn.content}
                </p>
              ))}
              {pending && (
                <p className="text-ink-soft px-1">
                  L’assistant écrit sa réponse…
                </p>
              )}
            </div>

            {!pending && (
              <div>
                <p className="text-ink-soft mb-2 text-sm font-bold">
                  {turns.length
                    ? "Autres questions fréquentes"
                    : "Questions fréquentes"}
                </p>
                <ul className="flex flex-wrap gap-2">
                  {SUGGESTED_QUESTIONS.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => ask(item.question)}
                        className="border-brand-200 text-brand-800 hover:bg-brand-100 min-h-12 cursor-pointer rounded-2xl border-2 bg-white px-4 py-2 text-left font-bold"
                      >
                        {item.question}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <form
            className="border-line border-t p-4"
            onSubmit={(event) => {
              event.preventDefault();
              ask(draft);
            }}
          >
            <label htmlFor="assistant-question" className="label text-sm">
              Votre question
            </label>
            <p id="assistant-consigne" className="text-ink-soft mb-2 text-sm">
              N’écrivez ni votre nom, ni votre adresse, ni un mot de passe ou un code.
              {aiEnabled && " Vos questions sont envoyées à un service d’IA situé aux États-Unis (Groq)."}{" "}
              <a href="/confidentialite#destinataires" className="link">
                En savoir plus
              </a>
            </p>
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                id="assistant-question"
                rows={2}
                maxLength={600}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    ask(draft);
                  }
                }}
                aria-describedby="assistant-consigne"
                placeholder="Par exemple : mon Wi-Fi ne marche plus"
                className="input min-h-14 flex-1 resize-none"
              />
              <button
                type="submit"
                className="btn btn-primary shrink-0"
                disabled={pending || !draft.trim()}
              >
                Envoyer
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}

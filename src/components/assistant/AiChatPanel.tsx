import React, { useEffect, useRef, useState } from "react";
import {
  Bot,
  CornerDownLeft,
  LoaderCircle,
  MessageCircle,
  PanelRightClose,
  RefreshCw,
  Sparkles,
  User2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/src/hooks/useLocale";

interface AiChatPanelProps {
  fetchWithAuth: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>;
  userName?: string | null;
}

type MessageRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  createdAt: string;
}

const STARTER_KEYS = [
  "assistant.starters.linkIdeas",
  "assistant.starters.campaignReview",
  "assistant.starters.utmPlan",
  "assistant.starters.workspaceGuide",
] as const;

const createMessage = (role: MessageRole, text: string): ChatMessage => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  text,
  createdAt: new Date().toISOString(),
});

const renderFormattedText = (text: string) => {
  const lines = text.split(/\r?\n/);

  return lines.map((line, lineIndex) => {
    const trimmed = line.trim();
    const isBullet = /^[-*]\s+/.test(trimmed);
    const content = isBullet ? trimmed.replace(/^[-*]\s+/, "") : line;
    const segments = content.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);

    const renderedSegments = segments.map((segment, segmentIndex) => {
      const isBold = /^\*\*[^*]+\*\*$/.test(segment);
      const value = isBold ? segment.slice(2, -2) : segment;

      if (isBold) {
        return (
          <strong
            key={`seg-${lineIndex}-${segmentIndex}`}
            className="font-black"
          >
            {value}
          </strong>
        );
      }

      return (
        <React.Fragment key={`seg-${lineIndex}-${segmentIndex}`}>
          {value}
        </React.Fragment>
      );
    });

    if (!trimmed) {
      return <div key={`line-${lineIndex}`} className="h-3" />;
    }

    return (
      <div
        key={`line-${lineIndex}`}
        className={isBullet ? "flex gap-2" : undefined}
      >
        {isBullet && <span className="mt-[0.45rem] text-[10px]">•</span>}
        <span>{renderedSegments}</span>
      </div>
    );
  });
};

export function AiChatPanel({ fetchWithAuth, userName }: AiChatPanelProps) {
  const { locale, t } = useLocale();
  const welcomeText = t("assistant.welcomeMessage");
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage("assistant", welcomeText),
  ]);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastUserPrompt, setLastUserPrompt] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMessages((current) => {
      if (current.length <= 1) {
        return [createMessage("assistant", welcomeText)];
      }

      return current.map((message, index) =>
        index === 0 && message.role === "assistant"
          ? { ...message, text: welcomeText }
          : message,
      );
    });
  }, [welcomeText]);

  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, submitting, open]);

  useEffect(() => {
    if (!open) return;
    textareaRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const sendChat = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed || submitting) return;

    const nextUserMessage = createMessage("user", trimmed);
    const requestMessages = [...messages, nextUserMessage]
      .filter((message) => message.text !== welcomeText)
      .map((message) => ({
        role:
          message.role === "assistant" ? ("model" as const) : ("user" as const),
        text: message.text,
      }));

    setInput("");
    setLastUserPrompt(trimmed);
    setSubmitting(true);
    setMessages((current) => [...current, nextUserMessage]);
    setOpen(true);

    try {
      const response = await fetchWithAuth("/api/v1/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: requestMessages,
        }),
      });
      const data = await response.json();
      const replyText =
        typeof data?.reply === "string" ? data.reply.trim() : "";

      if (!replyText) {
        throw new Error(t("assistant.errors.emptyReply"));
      }

      setMessages((current) => [
        ...current,
        createMessage("assistant", replyText),
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("assistant.errors.generic");
      toast.error(message);
    } finally {
      setSubmitting(false);
      textareaRef.current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendChat(input);
  };

  const handleRetry = async () => {
    if (!lastUserPrompt || submitting) return;
    await sendChat(lastUserPrompt);
  };

  const formatTime = (value: string) =>
    new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label={t("assistant.close")}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[1px] md:hidden"
        />
      )}

      <div className="pointer-events-none fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
        <div className="pointer-events-auto flex flex-col items-end gap-3">
          {open && (
            <div className="flex h-[min(78vh,720px)] w-[min(calc(100vw-1rem),420px)] flex-col overflow-hidden rounded-4xl border border-orange-100 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.22)] dark:border-slate-700 dark:bg-slate-800 sm:w-105">
              <div className="border-b border-orange-100 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.18),transparent_48%),linear-gradient(135deg,#fff7ed,white)] px-4 py-4 dark:border-slate-700 dark:bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.22),transparent_48%),linear-gradient(135deg,rgba(30,41,59,0.96),rgba(15,23,42,0.98))]">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-orange-600 dark:border-orange-500/20 dark:bg-slate-900/50 dark:text-orange-300">
                      <Sparkles size={14} />
                      {t("assistant.badge")}
                    </div>
                    <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                      {t("assistant.widgetTitle")}
                    </h2>
                    <p className="mt-1 pr-2 text-[13px] font-medium leading-5 text-slate-600 dark:text-slate-300">
                      {t("assistant.description")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="hidden rounded-2xl bg-slate-900 px-3 py-2 text-center text-[11px] font-black text-white shadow-lg shadow-slate-900/15 dark:bg-white dark:text-slate-900 sm:block">
                      <div className="leading-4">
                        {submitting
                          ? t("assistant.statusThinking")
                          : t("assistant.statusReady")}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="rounded-2xl border border-white/60 bg-white/70 p-2 text-slate-500 transition-colors hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:text-white"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-b border-slate-100 px-4 py-2.5 dark:border-slate-700">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {STARTER_KEYS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => void sendChat(t(key))}
                      disabled={submitting}
                      className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-bold text-slate-700 transition-all hover:border-orange-200 hover:bg-orange-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-orange-500/30 dark:hover:bg-slate-950"
                    >
                      {t(key)}
                    </button>
                  ))}
                </div>
              </div>

              <div
                ref={listRef}
                className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4"
              >
                {messages.map((message) => {
                  const isAssistant = message.role === "assistant";
                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        isAssistant ? "justify-start" : "justify-end"
                      }`}
                    >
                      <div
                        className={`flex max-w-[90%] items-start gap-3 ${
                          isAssistant ? "" : "flex-row-reverse"
                        }`}
                      >
                        <div
                          className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                            isAssistant
                              ? "bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300"
                              : "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                          }`}
                        >
                          {isAssistant ? (
                            <Bot size={18} />
                          ) : (
                            <User2 size={18} />
                          )}
                        </div>
                        <div
                          className={`rounded-3xl px-4 py-3 shadow-sm ${
                            isAssistant
                              ? "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100"
                              : "bg-orange-600 text-white"
                          }`}
                        >
                          <div className="text-sm font-medium leading-6">
                            {renderFormattedText(message.text)}
                          </div>
                          <div
                            className={`mt-2 text-[11px] font-bold uppercase tracking-[0.18em] ${
                              isAssistant
                                ? "text-slate-400 dark:text-slate-500"
                                : "text-orange-100/80"
                            }`}
                          >
                            {isAssistant
                              ? t("assistant.roles.assistant")
                              : userName || t("assistant.roles.user")}{" "}
                            · {formatTime(message.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {submitting && (
                  <div className="flex justify-start">
                    <div className="flex max-w-[90%] items-start gap-3">
                      <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300">
                        <Bot size={18} />
                      </div>
                      <div className="rounded-3xl bg-slate-100 px-4 py-3 text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <LoaderCircle size={16} className="animate-spin" />
                          {t("assistant.typing")}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 px-4 py-2.5 dark:border-slate-700">
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-2 transition-colors focus-within:border-orange-300 focus-within:bg-white dark:border-slate-700 dark:bg-slate-900 dark:focus-within:border-orange-500/40">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      rows={2}
                      maxLength={4000}
                      placeholder={t("assistant.inputPlaceholder")}
                      className="min-h-12 w-full resize-none bg-transparent text-sm font-medium leading-5 text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                        {input.length}/4000
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleRetry}
                          disabled={!lastUserPrompt || submitting}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
                        >
                          <RefreshCw size={14} />
                          {t("assistant.retry")}
                        </button>
                        <button
                          type="submit"
                          disabled={!input.trim() || submitting}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-orange-600/20 transition-all hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {submitting ? (
                            <LoaderCircle size={14} className="animate-spin" />
                          ) : (
                            <CornerDownLeft size={14} />
                          )}
                          {t("assistant.send")}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          <button
            type="button"
            aria-label={open ? t("assistant.close") : t("assistant.open")}
            onClick={() => setOpen((prev) => !prev)}
            className={`group flex items-center gap-3 rounded-full border border-orange-300 bg-[linear-gradient(135deg,#f97316,#ea580c)] px-4 py-3 text-white shadow-[0_18px_40px_rgba(234,88,12,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(234,88,12,0.45)] ${
              open ? "pr-3" : ""
            }`}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/18">
              {open ? (
                <PanelRightClose size={20} />
              ) : (
                <MessageCircle size={20} />
              )}
            </div>
            <div className="hidden text-left sm:block">
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-orange-100">
                {t("assistant.badge")}
              </div>
              <div className="mt-0.5 text-sm font-black leading-none">
                {open ? t("assistant.close") : t("assistant.open")}
              </div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}

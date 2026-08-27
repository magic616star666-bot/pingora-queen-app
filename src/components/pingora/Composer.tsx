import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Mic,
  Paperclip,
  Send,
  Smile,
  Trash2,
  X,
  Check,
} from "lucide-react";
import type { Attachment, Message } from "@/lib/types";
import { EmojiPicker } from "./EmojiPicker";
import { AttachmentSheet } from "./AttachmentSheet";
import { cn } from "@/lib/utils";
import { duration } from "@/lib/format";

export function Composer({
  draft,
  onDraftChange,
  onSend,
  replyTo,
  replyAuthorName,
  onCancelReply,
  editing,
  onCancelEdit,
  onSaveEdit,
  enterToSend,
  disabled,
  disabledReason,
}: {
  draft: string;
  onDraftChange: (v: string) => void;
  onSend: (input: { text?: string | undefined; attachment?: Attachment | undefined }) => void;
  replyTo?: Message | undefined;
  replyAuthorName?: string | undefined;
  onCancelReply: () => void;
  editing?: Message | undefined;
  onCancelEdit: () => void;
  onSaveEdit: (text: string) => void;
  enterToSend: boolean;
  disabled?: boolean | undefined;
  disabledReason?: string | undefined;
}) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      onDraftChange(editing.text ?? "");
      inputRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing?.id]);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [draft]);

  const submit = () => {
    const text = draft.trim();
    if (editing) {
      if (text) onSaveEdit(text);
      return;
    }
    if (!text) return;
    onSend({ text });
    setEmojiOpen(false);
  };

  if (disabled) {
    return (
      <div className="safe-bottom sticky bottom-0 z-20 border-t border-border bg-card px-4 pt-3 text-center">
        <p className="text-sm text-muted-foreground">{disabledReason}</p>
      </div>
    );
  }

  return (
    <div className="safe-bottom sticky bottom-0 z-20 border-t border-border/70 bg-card/95 backdrop-blur-xl">
      {(replyTo || editing) && (
        <div className="flex items-start gap-2 border-b border-border/60 px-3 py-2">
          <div className="min-w-0 flex-1 rounded-xl border-l-[3px] border-primary bg-secondary/70 px-2.5 py-1.5">
            <p className="text-[11px] font-semibold text-primary">
              {editing ? "Editing message" : `Replying to ${replyAuthorName ?? "you"}`}
            </p>
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {(editing ?? replyTo)?.text ?? (editing ?? replyTo)?.attachment?.kind ?? "Attachment"}
            </p>
          </div>
          <button
            type="button"
            aria-label="Cancel"
            onClick={() => {
              if (editing) {
                onCancelEdit();
                onDraftChange("");
              } else onCancelReply();
            }}
            className="mt-1 grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {emojiOpen && (
        <div className="border-b border-border/60">
          <EmojiPicker onPick={(e) => onDraftChange(draft + e)} />
        </div>
      )}

      {recording ? (
        <div className="flex items-center gap-3 px-3 py-3">
          <button
            type="button"
            aria-label="Cancel recording"
            onClick={() => {
              setRecording(false);
              setSeconds(0);
            }}
            className="grid h-10 w-10 place-items-center rounded-full text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-5 w-5" />
          </button>
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-destructive" />
          <span className="flex-1 font-mono text-sm">{duration(seconds || 1)}</span>
          <span className="flex items-center gap-[3px]" aria-hidden="true">
            {Array.from({ length: 14 }).map((_, i) => (
              <span
                key={i}
                className="w-[3px] animate-pulse rounded-full bg-primary"
                style={{ height: `${8 + ((i * 7) % 16)}px`, animationDelay: `${i * 60}ms` }}
              />
            ))}
          </span>
          <button
            type="button"
            aria-label="Send voice note"
            onClick={() => {
              onSend({ attachment: { kind: "voice", durationSec: Math.max(seconds, 1) } });
              setRecording(false);
              setSeconds(0);
            }}
            className="grid h-11 w-11 place-items-center rounded-full aurora-bg text-primary-foreground shadow-float"
          >
            <Check className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <div className="flex items-end gap-1.5 px-2 py-2">
          <div className="flex flex-1 items-end gap-1 rounded-3xl bg-secondary px-2 py-1.5">
            <button
              type="button"
              aria-label="Emoji"
              onClick={() => setEmojiOpen((v) => !v)}
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground",
                emojiOpen && "text-primary",
              )}
            >
              <Smile className="h-[22px] w-[22px]" />
            </button>
            <textarea
              ref={inputRef}
              rows={1}
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && enterToSend) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={editing ? "Edit your message" : "Message"}
              className="max-h-33 min-h-9 flex-1 resize-none bg-transparent py-2 text-[15px] outline-hidden placeholder:text-muted-foreground"
            />
            <button
              type="button"
              aria-label="Attach"
              onClick={() => setAttachOpen(true)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground"
            >
              <Paperclip className="h-[21px] w-[21px]" />
            </button>
            {!draft.trim() && !editing && (
              <button
                type="button"
                aria-label="Camera"
                onClick={() => setAttachOpen(true)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground"
              >
                <Camera className="h-[21px] w-[21px]" />
              </button>
            )}
          </div>
          {draft.trim() || editing ? (
            <button
              type="button"
              aria-label={editing ? "Save edit" : "Send"}
              onClick={submit}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full aurora-bg text-primary-foreground shadow-float active:scale-95"
            >
              {editing ? <Check className="h-5 w-5" /> : <Send className="h-5 w-5" />}
            </button>
          ) : (
            <button
              type="button"
              aria-label="Record voice note"
              onClick={() => setRecording(true)}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full aurora-bg text-primary-foreground shadow-float active:scale-95"
            >
              <Mic className="h-5 w-5" />
            </button>
          )}
        </div>
      )}

      <AttachmentSheet
        open={attachOpen}
        onOpenChange={setAttachOpen}
        onPick={(attachment) => {
          onSend({ attachment });
          setAttachOpen(false);
        }}
      />
    </div>
  );
}

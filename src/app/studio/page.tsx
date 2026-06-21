"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { useProfile, useManuscripts, useBooks } from "@/lib/store";
import { ENGINES, type Engine, type Manuscript, type VoiceProfile, type Book } from "@/lib/types";
import { Logo, EnginePicker, mdToHtml } from "@/components/ui";
import { GhostEditor } from "@/components/editor";
import { FidelityPanel } from "@/components/fidelity";
import { VoiceEditor } from "@/components/voice-editor";
import { downloadDoc, downloadMarkdown, copyText, downloadBook } from "@/lib/export";
import { uid, wordCount } from "@/lib/utils";
import {
  BookOpen, FileText, ListTree, Sparkles, Plus, Trash2, Loader2, Wand2,
  Quote, ArrowRightLeft, ChevronRight, Send, Eye, Pencil, Maximize2,
  Download, Copy, FileType, Gauge, PenLine, Library, FolderPlus,
  ChevronUp, ChevronDown, X, BookMarked,
} from "lucide-react";

type Kind = "chapter" | "outline" | "intro" | "devotional";
const KINDS: { id: Kind; label: string; icon: React.ElementType }[] = [
  { id: "chapter", label: "Chapter", icon: BookOpen },
  { id: "outline", label: "Outline", icon: ListTree },
  { id: "intro", label: "Introduction", icon: FileText },
  { id: "devotional", label: "Devotional", icon: Sparkles },
];

async function streamInto(url: string, body: unknown, onChunk: (full: string) => void) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) throw new Error("stream failed");
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    full += dec.decode(value, { stream: true });
    onChunk(full);
  }
  return full;
}

export default function StudioPage() {
  return (
    <Suspense fallback={null}>
      <Studio />
    </Suspense>
  );
}

function Studio() {
  const router = useRouter();
  const params = useSearchParams();
  const { profile, save: saveProfile, ready } = useProfile();
  const { items, upsert, remove } = useManuscripts();
  const { books, create: createBook, update: updateBook, remove: removeBook } = useBooks();
  const [editVoice, setEditVoice] = useState(false);
  const [bookId, setBookId] = useState<string>("");
  const [compiling, setCompiling] = useState<Book | null>(null);

  const [engine, setEngine] = useState<Engine>(ENGINES[0]);
  const [topic, setTopic] = useState("");
  const [kind, setKind] = useState<Kind>("chapter");
  const [title, setTitle] = useState("Untitled draft");
  const [body, setBody] = useState("");
  const [docId, setDocId] = useState<string>(() => uid());
  const [generating, setGenerating] = useState(false);
  const [view, setView] = useState<"read" | "edit">("read");
  const [showReveal, setShowReveal] = useState(params.get("fresh") === "1");
  const [toast, setToast] = useState("");
  const [pane, setPane] = useState<"compose" | "draft" | "assist">("draft");

  useEffect(() => {
    if (ready && !profile) router.replace("/interview");
  }, [ready, profile, router]);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 1800); };

  if (!profile) return null;

  const save = () => {
    if (!body.trim()) return;
    const now = Date.now();
    const existing = items.find((m) => m.id === docId);
    upsert({ id: docId, title, topic, body, model: engine.label, bookId: existing?.bookId ?? (bookId || undefined), order: existing?.order ?? now, createdAt: existing?.createdAt ?? now, updatedAt: now });
    flash("Saved to library");
  };

  const orderedFor = (bid: string) =>
    items.filter((m) => (m.bookId || "") === bid).sort((a, b) => (a.order ?? a.createdAt) - (b.order ?? b.createdAt));

  const moveChapter = (bid: string, id: string, dir: "up" | "down") => {
    const list = orderedFor(bid);
    const i = list.findIndex((m) => m.id === id);
    const j = dir === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    list.forEach((m, idx) => upsert({ ...m, order: idx, updatedAt: Date.now() }));
  };

  const assignBook = (id: string, bid: string) => {
    const m = items.find((x) => x.id === id);
    if (m) upsert({ ...m, bookId: bid || undefined, order: Date.now(), updatedAt: Date.now() });
  };

  const generate = async () => {
    if (!topic.trim() || generating) return;
    setGenerating(true);
    setBody("");
    setView("read");
    setPane("draft");
    const id = uid();
    setDocId(id);
    try {
      const full = await streamInto("/api/generate", { profile, topic, kind, modelSlug: engine.slug }, setBody);
      const t = full.match(/^#\s+(.+)$/m)?.[1] || topic;
      setTitle(t);
      const now = Date.now();
      upsert({ id, title: t, topic, body: full, model: engine.label, bookId: bookId || undefined, order: now, createdAt: now, updatedAt: now });
    } catch {
      setBody("*The Scribe could not complete this draft. Check your OpenRouter key and try again.*");
    } finally {
      setGenerating(false);
    }
  };

  const openDoc = (m: Manuscript) => {
    setDocId(m.id);
    setTitle(m.title);
    setTopic(m.topic);
    setBody(m.body);
    setEngine(ENGINES.find((e) => e.label === m.model) ?? ENGINES[0]);
    setView("read");
    setPane("draft");
  };

  const blank = () => { setBody(""); setTitle("Untitled draft"); setTopic(""); setDocId(uid()); };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b bg-card/70 px-4 py-3 backdrop-blur sm:px-5">
        <Link href="/"><Logo /></Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-ink-soft md:inline">
            Writing as <strong className="text-ink">{profile.penName}</strong>
          </span>
          <EnginePicker value={engine} onChange={setEngine} />
          <UserButton />
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[300px_1fr_360px]">
        {/* LEFT */}
        <aside className={`${pane === "compose" ? "flex" : "hidden"} flex-col overflow-y-auto border-r p-4 scrollbar-thin lg:flex`}>
          <VoiceCard profile={profile} onEdit={() => setEditVoice(true)} />

          <div className="mt-5 rounded-2xl border bg-card p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold">New draft</h3>
            <div className="mb-3 grid grid-cols-2 gap-2">
              {KINDS.map((k) => (
                <button key={k.id} onClick={() => setKind(k.id)}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition ${
                    kind === k.id ? "border-gold bg-parchment-2 font-medium" : "hover:border-gold"}`}>
                  <k.icon size={14} className="text-gold-deep" /> {k.label}
                </button>
              ))}
            </div>
            <textarea value={topic} onChange={(e) => setTopic(e.target.value)}
              placeholder="What is this about? e.g. Walking in kingdom authority" rows={3}
              className="w-full resize-none rounded-lg border bg-parchment p-3 text-sm outline-none focus:border-gold" />
            <label className="mt-2 flex items-center gap-2 text-xs text-ink-soft">
              <BookMarked size={13} className="shrink-0 text-gold-deep" /> Add to
              <select value={bookId} onChange={(e) => setBookId(e.target.value)}
                className="flex-1 rounded-md border bg-parchment px-2 py-1 outline-none focus:border-gold">
                <option value="">Unfiled</option>
                {books.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
              </select>
            </label>
            <button onClick={generate} disabled={generating || !topic.trim()}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-ink py-2.5 text-sm font-medium text-parchment transition hover:bg-gold-deep disabled:opacity-40">
              {generating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
              {generating ? "Writing…" : "Generate in my voice"}
            </button>
          </div>

          <BookLibrary
            books={books} items={items} docId={docId}
            orderedFor={orderedFor}
            onOpen={openDoc} onDelete={remove} onBlank={blank}
            onNewBook={() => { const b = createBook("Untitled book"); setBookId(b.id); flash("Book created"); }}
            onRenameBook={(id, title) => updateBook(id, { title })}
            onDeleteBook={(id) => { removeBook(id); if (bookId === id) setBookId(""); orderedFor(id).forEach((m) => assignBook(m.id, "")); }}
            onMove={moveChapter} onAssign={assignBook} onCompile={setCompiling}
          />
        </aside>

        {/* CENTER */}
        <main className={`${pane === "draft" ? "flex" : "hidden"} flex-col overflow-hidden bg-parchment lg:flex`}>
          <div className="flex items-center justify-between gap-2 border-b bg-card/50 px-4 py-2.5 sm:px-6">
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="min-w-0 flex-1 bg-transparent font-serif text-lg outline-none" />
            <div className="flex items-center gap-2 text-sm text-ink-soft">
              <span className="hidden sm:inline">{wordCount(body)} words</span>
              <div className="flex overflow-hidden rounded-lg border">
                <button onClick={() => setView("read")} className={`flex items-center gap-1 px-2.5 py-1 text-xs ${view === "read" ? "bg-parchment-2" : ""}`}><Eye size={13} /> Read</button>
                <button onClick={() => setView("edit")} className={`flex items-center gap-1 px-2.5 py-1 text-xs ${view === "edit" ? "bg-parchment-2" : ""}`}><Pencil size={13} /> Edit</button>
              </div>
              <ExportMenu title={title} body={body} onCopy={() => { copyText(body); flash("Copied"); }} disabled={!body.trim()} />
              <button onClick={save} className="rounded-lg bg-ink px-3 py-1 text-xs text-parchment transition hover:bg-gold-deep">Save</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="mx-auto max-w-2xl px-5 py-10 sm:px-6">
              {!body && !generating && <EmptyState onStart={() => setPane("compose")} />}
              {view === "read" ? (
                <article className="prose-scribe" dangerouslySetInnerHTML={{ __html: mdToHtml(body) }} />
              ) : (
                <GhostEditor value={body} onChange={setBody} profile={profile} />
              )}
              {generating && <span className="ml-0.5 inline-block h-5 w-1.5 animate-pulse bg-gold-deep align-middle" />}
            </div>
          </div>
        </main>

        {/* RIGHT */}
        <div className={`${pane === "assist" ? "flex" : "hidden"} lg:flex`}>
          <AssistPanel profile={profile} body={body} setBody={setBody} engine={engine} />
        </div>
      </div>

      {/* MOBILE NAV */}
      <nav className="flex border-t bg-card lg:hidden">
        {([
          { id: "compose", label: "Compose", icon: PenLine },
          { id: "draft", label: "Draft", icon: Library },
          { id: "assist", label: "Assist", icon: Sparkles },
        ] as const).map((t) => (
          <button key={t.id} onClick={() => setPane(t.id)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${pane === t.id ? "text-gold-deep" : "text-ink-soft"}`}>
            <t.icon size={18} /> {t.label}
          </button>
        ))}
      </nav>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm text-parchment shadow-lg lg:bottom-6">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReveal && <VoiceReveal profile={profile} onClose={() => setShowReveal(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {editVoice && (
          <VoiceEditor
            profile={profile}
            onSave={(p) => { saveProfile(p); flash("Voice updated"); }}
            onClose={() => setEditVoice(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {compiling && (
          <CompileView book={compiling} chapters={orderedFor(compiling.id)} onClose={() => setCompiling(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function BookLibrary({
  books, items, docId, orderedFor, onOpen, onDelete, onBlank, onNewBook,
  onRenameBook, onDeleteBook, onMove, onAssign, onCompile,
}: {
  books: Book[]; items: Manuscript[]; docId: string;
  orderedFor: (bid: string) => Manuscript[];
  onOpen: (m: Manuscript) => void; onDelete: (id: string) => void; onBlank: () => void;
  onNewBook: () => void; onRenameBook: (id: string, t: string) => void; onDeleteBook: (id: string) => void;
  onMove: (bid: string, id: string, dir: "up" | "down") => void;
  onAssign: (id: string, bid: string) => void; onCompile: (b: Book) => void;
}) {
  const groups: { book: Book | null; chapters: Manuscript[] }[] = [
    ...books.map((b) => ({ book: b, chapters: orderedFor(b.id) })),
    { book: null, chapters: orderedFor("") },
  ];

  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold">Library</h3>
        <div className="flex items-center gap-2">
          <button onClick={onNewBook} className="text-ink-soft transition hover:text-ink" title="New book"><FolderPlus size={16} /></button>
          <button onClick={onBlank} className="text-ink-soft transition hover:text-ink" title="New blank draft"><Plus size={16} /></button>
        </div>
      </div>
      {items.length === 0 && books.length === 0 && (
        <p className="px-1 text-xs text-ink-soft">Your drafts and books will appear here.</p>
      )}
      <div className="space-y-3">
        {groups.map(({ book, chapters }) => {
          if (!book && chapters.length === 0) return null;
          return (
            <div key={book?.id ?? "unfiled"}>
              {book ? (
                <div className="mb-1 flex items-center gap-1.5 px-1">
                  <BookOpen size={13} className="shrink-0 text-gold-deep" />
                  <input
                    defaultValue={book.title}
                    onBlur={(e) => onRenameBook(book.id, e.target.value || "Untitled book")}
                    className="min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none"
                  />
                  <span className="text-[10px] text-ink-soft">{chapters.length}</span>
                  {chapters.length > 0 && (
                    <button onClick={() => onCompile(book)} className="text-ink-soft transition hover:text-ink" title="Compile book"><BookMarked size={13} /></button>
                  )}
                  <button onClick={() => onDeleteBook(book.id)} className="text-ink-soft transition hover:text-red-700" title="Delete book"><Trash2 size={12} /></button>
                </div>
              ) : (
                <div className="mb-1 px-1 text-[11px] uppercase tracking-wider text-ink-soft">Unfiled</div>
              )}
              <div className="space-y-1.5">
                {chapters.map((m, i) => (
                  <div key={m.id} className={`group rounded-lg border px-2.5 py-2 transition hover:border-gold ${m.id === docId ? "border-gold bg-parchment-2" : "bg-card"}`}>
                    <div className="flex items-center gap-1.5">
                      {book && (
                        <span className="flex flex-col">
                          <button onClick={() => onMove(book.id, m.id, "up")} disabled={i === 0} className="text-ink-soft disabled:opacity-20 hover:text-ink"><ChevronUp size={12} /></button>
                          <button onClick={() => onMove(book.id, m.id, "down")} disabled={i === chapters.length - 1} className="text-ink-soft disabled:opacity-20 hover:text-ink"><ChevronDown size={12} /></button>
                        </span>
                      )}
                      <button onClick={() => onOpen(m)} className="min-w-0 flex-1 text-left">
                        <div className="truncate text-sm font-medium">{book ? `${i + 1}. ` : ""}{m.title}</div>
                        <div className="text-[11px] text-ink-soft">{m.model} · {wordCount(m.body)} words</div>
                      </button>
                      <button onClick={() => onDelete(m.id)} className="text-ink-soft opacity-0 transition group-hover:opacity-100 hover:text-red-700"><Trash2 size={14} /></button>
                    </div>
                    {books.length > 0 && (
                      <select value={m.bookId ?? ""} onChange={(e) => onAssign(m.id, e.target.value)}
                        className="mt-1.5 w-full rounded-md border bg-parchment px-2 py-0.5 text-[11px] text-ink-soft outline-none focus:border-gold">
                        <option value="">Unfiled</option>
                        {books.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompileView({ book, chapters, onClose }: { book: Book; chapters: Manuscript[]; onClose: () => void }) {
  const words = chapters.reduce((n, c) => n + wordCount(c.body), 0);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div>
            <h2 className="font-serif text-lg">{book.title}</h2>
            <p className="text-xs text-ink-soft">{chapters.length} chapters · {words.toLocaleString()} words</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => downloadBook(book.title, book.subtitle, chapters.map((c) => ({ title: c.title, body: c.body })))}
              className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs text-parchment transition hover:bg-gold-deep">
              <Download size={13} /> Export book (.doc)
            </button>
            <button onClick={onClose} className="text-ink-soft hover:text-ink"><X size={18} /></button>
          </div>
        </div>
        <div className="overflow-y-auto px-8 py-8 scrollbar-thin">
          <div className="mb-10 border-b pb-8 text-center">
            <h1 className="font-serif text-3xl">{book.title}</h1>
            {book.subtitle && <p className="mt-2 text-ink-soft">{book.subtitle}</p>}
          </div>
          {chapters.length === 0 && <p className="text-center text-ink-soft">No chapters yet — generate some into this book.</p>}
          {chapters.map((c, i) => (
            <div key={c.id} className="mb-10">
              <div className="mb-2 text-[11px] uppercase tracking-wider text-gold-deep">Chapter {i + 1}</div>
              <article className="prose-scribe" dangerouslySetInnerHTML={{ __html: mdToHtml(c.body) }} />
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ExportMenu({ title, body, onCopy, disabled }: { title: string; body: string; onCopy: () => void; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} disabled={disabled}
        className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs transition hover:border-gold disabled:opacity-40">
        <Download size={13} /> Export
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border bg-card shadow-xl">
            <Item icon={Copy} label="Copy text" onClick={() => { onCopy(); setOpen(false); }} />
            <Item icon={FileType} label="Word (.doc)" onClick={() => { downloadDoc(title, body); setOpen(false); }} />
            <Item icon={FileText} label="Markdown (.md)" onClick={() => { downloadMarkdown(title, body); setOpen(false); }} />
          </div>
        </>
      )}
    </div>
  );
}
function Item({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-parchment-2">
      <Icon size={14} className="text-gold-deep" /> {label}
    </button>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="grid h-[50vh] place-items-center text-center">
      <div>
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-card shadow-sm"><BookOpen className="text-gold-deep" /></div>
        <h2 className="font-serif text-2xl">A blank page, ready for your voice</h2>
        <p className="mx-auto mt-2 max-w-sm text-ink-soft">Pick what to write and a topic, then watch The Scribe draft it in your style.</p>
        <button onClick={onStart} className="mt-4 rounded-full bg-ink px-5 py-2 text-sm text-parchment lg:hidden">Compose</button>
      </div>
    </div>
  );
}

function VoiceCard({ profile, onEdit }: { profile: VoiceProfile; onEdit: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Sparkles size={16} className="text-gold-deep" /><h3 className="text-sm font-semibold">Voice DNA</h3></div>
        <button onClick={onEdit} className="flex items-center gap-1 text-xs text-ink-soft transition hover:text-ink"><Pencil size={12} /> Edit</button>
      </div>
      <p className="mt-2 text-sm italic text-ink-soft">&ldquo;{profile.oneLine}&rdquo;</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {profile.toneTags.slice(0, 5).map((t) => <span key={t} className="rounded-full bg-parchment-2 px-2 py-0.5 text-[11px]">{t}</span>)}
      </div>
      <button onClick={() => setOpen((o) => !o)} className="mt-3 flex items-center gap-1 text-xs text-gold-deep">
        <ChevronRight size={13} className={`transition ${open ? "rotate-90" : ""}`} />{open ? "Hide details" : "View full profile"}
      </button>
      {open && (
        <div className="mt-3 space-y-2 border-t pt-3 text-xs text-ink-soft">
          <Detail label="Signature phrases" items={profile.signaturePhrases} />
          <Detail label="Anchor scriptures" items={profile.anchorScriptures} />
          <Detail label="Themes" items={profile.themes} />
          <p><strong className="text-ink">Cadence:</strong> {profile.cadence}</p>
        </div>
      )}
    </div>
  );
}
function Detail({ label, items }: { label: string; items: string[] }) {
  if (!items?.length) return null;
  return <p><strong className="text-ink">{label}:</strong> {items.join(", ")}</p>;
}

function AssistPanel({ profile, body, setBody, engine }: {
  profile: VoiceProfile; body: string; setBody: (s: string) => void; engine: Engine;
}) {
  const [tab, setTab] = useState<"cowriter" | "fidelity">("cowriter");
  return (
    <aside className="flex w-full flex-col overflow-hidden border-l bg-card/40">
      <div className="flex border-b">
        {([["cowriter", "Co-writer", Sparkles], ["fidelity", "Fidelity", Gauge]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-sm transition ${
              tab === id ? "border-b-2 border-gold-deep font-medium text-ink" : "text-ink-soft"}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>
      {tab === "cowriter" ? (
        <CoWriter profile={profile} body={body} setBody={setBody} engine={engine} />
      ) : (
        <div className="overflow-y-auto p-4 scrollbar-thin"><FidelityPanel profile={profile} text={body} /></div>
      )}
    </aside>
  );
}

function CoWriter({ profile, body, setBody, engine }: {
  profile: VoiceProfile; body: string; setBody: (s: string) => void; engine: Engine;
}) {
  const [selection, setSelection] = useState("");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onSel = () => {
      const s = window.getSelection()?.toString() ?? "";
      if (s.trim().length > 1) setSelection(s.trim());
    };
    document.addEventListener("mouseup", onSel);
    document.addEventListener("keyup", onSel);
    return () => { document.removeEventListener("mouseup", onSel); document.removeEventListener("keyup", onSel); };
  }, []);

  const run = async (action?: string, prompt?: string) => {
    if (busy) return;
    setBusy(true); setOut("");
    try {
      await streamInto("/api/assist", { profile, action, selection, prompt, modelSlug: engine.slug }, setOut);
    } catch {
      setOut("Could not reach The Scribe. Check your OpenRouter key.");
    } finally {
      setBusy(false);
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const actions = [
    { id: "rewrite", label: "Rewrite in my voice", icon: ArrowRightLeft },
    { id: "expand", label: "Expand", icon: Maximize2 },
    { id: "punchier", label: "Make it preachable", icon: Wand2 },
    { id: "scripture", label: "Find my scriptures", icon: Quote },
  ];

  return (
    <>
      <div className="border-b px-4 py-2.5"><p className="text-xs text-ink-soft">Select text in your draft, then act on it.</p></div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        <div className="rounded-lg border bg-parchment p-2.5 text-xs">
          {selection ? <span className="line-clamp-3 text-ink-soft">&ldquo;{selection}&rdquo;</span>
            : <span className="text-ink-soft">No selection — actions use the draft&rsquo;s end.</span>}
        </div>
        <div className="mt-3 grid gap-1.5">
          {actions.map((a) => (
            <button key={a.id} onClick={() => run(a.id)} disabled={busy}
              className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-left text-sm transition hover:border-gold disabled:opacity-50">
              <a.icon size={15} className="text-gold-deep" /> {a.label}
            </button>
          ))}
          <button onClick={() => run("continue")} disabled={busy}
            className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-left text-sm transition hover:border-gold disabled:opacity-50">
            <ChevronRight size={15} className="text-gold-deep" /> Continue the draft
          </button>
        </div>
        {(out || busy) && (
          <div className="mt-4 rounded-xl border bg-card p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-ink-soft">Suggestion</span>
              {out && !busy && (
                <button onClick={() => setBody(body ? body + "\n\n" + out : out)}
                  className="rounded bg-ink px-2 py-0.5 text-[11px] text-parchment transition hover:bg-gold-deep">Insert</button>
              )}
            </div>
            <div className="prose-scribe !text-sm" dangerouslySetInnerHTML={{ __html: mdToHtml(out) }} />
            {busy && <Loader2 size={14} className="mt-1 animate-spin text-gold-deep" />}
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="border-t p-3">
        <div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2">
          <input value={ask} onChange={(e) => setAsk(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && ask.trim()) { run(undefined, ask); setAsk(""); } }}
            placeholder="Ask The Scribe… (e.g. a chapter title)" className="flex-1 bg-transparent text-sm outline-none" />
          <button onClick={() => { if (ask.trim()) { run(undefined, ask); setAsk(""); } }} disabled={busy || !ask.trim()}
            className="text-gold-deep disabled:opacity-40"><Send size={16} /></button>
        </div>
      </div>
    </>
  );
}

function VoiceReveal({ profile, onClose }: { profile: VoiceProfile; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-6 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.94, y: 14 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 14 }}
        onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl border bg-card p-7 shadow-2xl">
        <div className="mb-1 flex items-center gap-2 text-xs text-gold-deep"><Sparkles size={14} /> YOUR VOICE DNA</div>
        <h2 className="font-serif text-2xl">{profile.penName}</h2>
        <p className="mt-2 italic text-ink-soft">&ldquo;{profile.oneLine}&rdquo;</p>
        <div className="mt-4 grid gap-3 text-sm">
          <Row label="Tradition" value={profile.tradition} />
          <Row label="Tone" value={profile.toneTags.join(", ")} />
          <Row label="Signature phrases" value={profile.signaturePhrases.join(" · ")} />
          <Row label="Anchor scriptures" value={profile.anchorScriptures.join(", ")} />
        </div>
        <button onClick={onClose} className="mt-6 w-full rounded-full bg-ink py-3 font-medium text-parchment transition hover:bg-gold-deep">Start writing</button>
      </motion.div>
    </motion.div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="border-b pb-2">
      <div className="text-[11px] uppercase tracking-wider text-ink-soft">{label}</div>
      <div className="mt-0.5">{value}</div>
    </div>
  );
}

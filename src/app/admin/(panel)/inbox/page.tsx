import Link from "next/link";
import { Inbox } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/admin/page-header";
import { SegmentedLinks } from "@/components/admin/segmented-links";
import { EmptyState } from "@/components/shared/empty-state";
import { relativeAge } from "@/components/admin/table-helpers";
import { getSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { sp } from "../../_lib/ranges";
import { MessageActions, MarkRead } from "./inbox-client";

export const metadata = { title: "Inbox" };

export default async function InboxPage(props: PageProps<"/admin/inbox">) {
  await requireAdmin();
  const raw = await props.searchParams;
  const filter = sp(raw.filter) ?? "all";
  const selectedId = sp(raw.id);
  const [messages, counts, settings] = await Promise.all([
    db.contactMessage.findMany({ where: filter === "all" ? {} : { status: filter }, orderBy: { createdAt: "desc" } }),
    db.contactMessage.groupBy({ by: ["status"], _count: { _all: true } }),
    getSettings(),
  ]);
  const c = Object.fromEntries(counts.map((x) => [x.status, x._count._all]));
  const total = counts.reduce((s, x) => s + x._count._all, 0);
  const selected = messages.find((m) => m.id === selectedId) ?? (selectedId ? await db.contactMessage.findUnique({ where: { id: selectedId } }) : messages[0]) ?? null;
  const link = (id: string) => `/admin/inbox?${new URLSearchParams({ ...(filter !== "all" ? { filter } : {}), id })}`;

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Inbox"
        description="Messages from the contact form."
        actions={
          <SegmentedLinks
            active={filter}
            items={[
              { key: "all", label: "All", count: total, href: "/admin/inbox" },
              { key: "NEW", label: "Unread", count: c.NEW ?? 0, href: "/admin/inbox?filter=NEW" },
              { key: "READ", label: "Read", count: c.READ ?? 0, href: "/admin/inbox?filter=READ" },
              { key: "REPLIED", label: "Replied", count: c.REPLIED ?? 0, href: "/admin/inbox?filter=REPLIED" },
            ]}
          />
        }
      />
      {messages.length || selected ? (
        <div className="grid overflow-hidden rounded-xl border bg-card shadow-xs lg:h-[calc(100svh-12rem)] lg:grid-cols-[360px_minmax(0,1fr)]">
          <ul className="max-h-96 divide-y overflow-y-auto border-b lg:max-h-none lg:border-r lg:border-b-0">
            {messages.map((m) => {
              const active = selected?.id === m.id;
              return (
                <li key={m.id}>
                  <Link
                    href={link(m.id)}
                    scroll={false}
                    className={cn("relative block px-4 py-3.5 transition-colors hover:bg-muted/60", active && "bg-accent/60 hover:bg-accent/60")}
                  >
                    {m.status === "NEW" && <span className="absolute top-5 left-1.5 size-1.5 rounded-full bg-primary" aria-label="Unread" />}
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={cn("truncate text-sm", m.status === "NEW" ? "font-semibold" : "font-medium")}>{m.name}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">{relativeAge(m.createdAt)}</span>
                    </div>
                    <p className={cn("truncate text-sm", m.status === "NEW" ? "text-foreground" : "text-muted-foreground")}>{m.subject}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{m.message}</p>
                  </Link>
                </li>
              );
            })}
            {!messages.length && <li className="p-6 text-center text-sm text-muted-foreground">No messages in this view.</li>}
          </ul>
          {selected ? (
            <article className="flex min-h-80 flex-col overflow-y-auto">
              <MarkRead id={selected.id} status={selected.status} />
              <header className="flex flex-wrap items-start justify-between gap-3 border-b px-6 py-5">
                <div className="min-w-0">
                  <h2 className="font-heading text-lg font-semibold">{selected.subject}</h2>
                  <p className="mt-1 text-sm">
                    <span className="font-medium">{selected.name}</span>{" "}
                    <a href={`mailto:${selected.email}`} className="text-muted-foreground hover:text-primary">&lt;{selected.email}&gt;</a>
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(selected.createdAt)}</p>
                </div>
                <MessageActions id={selected.id} status={selected.status} />
              </header>
              <div className="flex-1 px-6 py-5 text-[15px] leading-relaxed whitespace-pre-wrap">{selected.message}</div>
              <footer className="border-t bg-muted/30 px-6 py-4">
                <a
                  href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}&body=${encodeURIComponent(`Hi ${selected.name.split(" ")[0]},\n\n\n\n— ${settings.storeName} team\n\n> ${selected.message.replace(/\n/g, "\n> ")}`)}`}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Reply by email
                </a>
                <span className="ml-3 text-xs text-muted-foreground">Opens your email app. Mark as replied when done.</span>
              </footer>
            </article>
          ) : (
            <div className="grid place-items-center p-10 text-sm text-muted-foreground">Select a message</div>
          )}
        </div>
      ) : (
        <EmptyState icon={Inbox} title="Inbox zero" description="New contact form messages will appear here." />
      )}
    </div>
  );
}

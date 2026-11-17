import Link from "next/link";
import { Mail, ServerCog } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { emailTransportInfo } from "@/lib/email/mailer";
import { EMAIL_TEMPLATE_LABELS } from "@/lib/email/templates";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { SegmentedLinks, withParams } from "@/components/admin/segmented-links";
import { PaginationBar, TableWrap } from "@/components/admin/table-helpers";
import { EmailPreviewButton, EmailStatusPill } from "@/components/admin/email-ui";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { sp } from "../../_lib/ranges";

export const metadata = { title: "Email log" };

const PAGE_SIZE = 40;

export default async function EmailLogPage(props: PageProps<"/admin/emails">) {
  await requireAdmin();
  const raw = await props.searchParams;
  const status = sp(raw.status) ?? "all";
  const template = sp(raw.template) ?? "all";
  const q = (sp(raw.q) ?? "").trim().slice(0, 100);
  const page = Math.max(1, Number(sp(raw.page)) || 1);

  const where: Prisma.EmailLogWhereInput = {
    ...(status !== "all" ? { status } : {}),
    ...(template !== "all" ? { template } : {}),
    ...(q ? { OR: [{ to: { contains: q } }, { subject: { contains: q } }] } : {}),
  };
  const [logs, total, counts] = await Promise.all([
    db.emailLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, to: true, subject: true, template: true, status: true, error: true, createdAt: true, order: { select: { id: true, number: true } } },
    }),
    db.emailLog.count({ where }),
    db.emailLog.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const c = Object.fromEntries(counts.map((x) => [x.status, x._count._all]));
  const all = counts.reduce((n, x) => n + x._count._all, 0);
  const current = { status: sp(raw.status), template: sp(raw.template), q: q || undefined };
  const transport = emailTransportInfo();

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Email log"
        description="Every order email the store has sent, or saved to the dev outbox."
        actions={
          <Link href="/admin/settings" className="inline-flex h-8 items-center gap-1.5 rounded-lg border bg-background px-2.5 text-sm font-medium hover:bg-muted">
            <ServerCog className="size-4" /> Notification settings
          </Link>
        }
      />

      {transport.mode === "outbox" && (
        <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-800 dark:text-amber-300">
          No SMTP server is configured, so emails are saved here (and to <span className="font-mono">storage/emails/</span>) instead of being delivered. Add SMTP settings to
          <span className="font-mono"> .env</span> to send real email.
        </p>
      )}

      <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <SegmentedLinks
          active={status}
          items={[
            { key: "all", label: "All", count: all, href: withParams("/admin/emails", current, { status: undefined, page: undefined }) },
            { key: "SENT", label: "Sent", count: c.SENT ?? 0, href: withParams("/admin/emails", current, { status: "SENT", page: undefined }) },
            { key: "OUTBOX", label: "Outbox", count: c.OUTBOX ?? 0, href: withParams("/admin/emails", current, { status: "OUTBOX", page: undefined }) },
            { key: "FAILED", label: "Failed", count: c.FAILED ?? 0, href: withParams("/admin/emails", current, { status: "FAILED", page: undefined }) },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedLinks
            active={template}
            items={[
              { key: "all", label: "All types", href: withParams("/admin/emails", current, { template: undefined, page: undefined }) },
              ...Object.entries(EMAIL_TEMPLATE_LABELS).map(([key, label]) => ({ key, label, href: withParams("/admin/emails", current, { template: key, page: undefined }) })),
            ]}
          />
          <form action="/admin/emails" className="w-full sm:w-56">
            {current.status && <input type="hidden" name="status" value={current.status} />}
            {current.template && <input type="hidden" name="template" value={current.template} />}
            <Input name="q" defaultValue={q} placeholder="Search recipient or subject" className="h-8" />
          </form>
        </div>
      </div>

      {logs.length ? (
        <Panel bodyClassName="p-0">
          <TableWrap>
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">When</th>
                  <th className="px-4 py-2.5 font-medium">Type</th>
                  <th className="px-4 py-2.5 font-medium">To</th>
                  <th className="px-4 py-2.5 font-medium">Subject</th>
                  <th className="px-4 py-2.5 font-medium">Order</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground tabular-nums">{formatDateTime(l.createdAt)}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">{EMAIL_TEMPLATE_LABELS[l.template] ?? l.template}</td>
                    <td className="max-w-[220px] truncate px-4 py-2.5">{l.to}</td>
                    <td className="max-w-[340px] truncate px-4 py-2.5 text-muted-foreground" title={l.subject}>
                      {l.subject}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {l.order ? (
                        <Link href={`/admin/orders/${l.order.id}`} className="font-mono text-xs font-medium text-primary hover:underline">
                          {l.order.number}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <EmailStatusPill status={l.status} error={l.error} />
                      {l.error && <p className="mt-1 max-w-[220px] truncate text-xs text-destructive" title={l.error}>{l.error}</p>}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <EmailPreviewButton id={l.id} subject={l.subject} to={l.to} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
          <PaginationBar page={page} pageSize={PAGE_SIZE} total={total} base="/admin/emails" params={current} />
        </Panel>
      ) : (
        <EmptyState
          icon={Mail}
          title={all ? "No emails match these filters" : "No emails yet"}
          description={all ? "Try a different status, type or search." : "Order confirmations, status updates and alerts will appear here as they go out. Use “Send test” in Settings to try it."}
        />
      )}
    </div>
  );
}

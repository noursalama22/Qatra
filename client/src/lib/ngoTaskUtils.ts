export const TASK_STATUS_UI: Record<string, { label: string; cls: string }> = {
  pending: { label: "بانتظار المزود", cls: "dash-status-todo" },
  in_progress: { label: "جاري التنفيذ", cls: "dash-status-progress" },
  delivered: { label: "مكتمل", cls: "dash-status-done" },
  cancelled: { label: "ملغي", cls: "dash-status-cancelled" },
};

export function parseProviderFromNotes(notes: string | null): string | null {
  if (!notes) return null;
  const m = notes.match(/مزود:\s*(.+)/);
  return m?.[1]?.trim() ?? null;
}

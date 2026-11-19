"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useLayoutEffect, useState } from "react";
import { useLocalEntry, useToday } from "@/client/localStore";
import { ButtonLink } from "@/components/ui/Button";
import type { EntryType } from "@/domain/entry";
import { useT } from "@/i18n/client";
import {
  CashOutForm,
  DepositForm,
  ExpenseForm,
  FixedPaidForm,
  type FormProps,
  SaleForm,
} from "./EntryForms";

const FORMS: Record<EntryType, (props: FormProps) => React.ReactNode> = {
  sale: SaleForm,
  expense: ExpenseForm,
  cash_out: CashOutForm,
  deposit: DepositForm,
  fixed_paid: FixedPaidForm,
};

/**
 * Add or edit screen for one entry type. Fully static and client-side, so it
 * opens even offline. ?id=... edits an entry; ?date=YYYY-MM-DD adds one for another day.
 */
export function AddScreen({ type }: { type: EntryType }) {
  return (
    <main className="flex flex-1 flex-col">
      {/* Reading the address (?id=, ?date=) happens in the browser, behind a boundary. */}
      <Suspense fallback={<Loading />}>
        <AddScreenContent type={type} />
      </Suspense>
    </main>
  );
}

function AddScreenContent({ type }: { type: EntryType }) {
  const params = useSearchParams();
  const id = params.get("id");
  const today = useToday();
  const existing = useLocalEntry(id);
  const t = useT();

  // Next keeps a visited screen mounted but hidden. Every visit must start with an
  // empty form, so when this screen is hidden the form gets a new key.
  const [visit, setVisit] = useState(0);
  useLayoutEffect(() => () => setVisit((v) => v + 1), []);

  if (!today || existing === undefined) return <Loading />;

  if (id && (existing === null || existing.type !== type)) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
        <p className="text-muted">{t("This entry is not on this phone any more.")}</p>
        <ButtonLink href="/">{t("Back to Today")}</ButtonLink>
      </div>
    );
  }

  const askedDate = params.get("date");
  const initialDate =
    existing?.businessDate ??
    (askedDate && /^\d{4}-\d{2}-\d{2}$/.test(askedDate) && askedDate <= today ? askedDate : today);

  const Form = FORMS[type];
  return (
    <Form
      key={`${existing?.id ?? "new"}-${visit}`}
      existing={existing}
      initialDate={initialDate}
      today={today}
    />
  );
}

function Loading() {
  const t = useT();
  return <p className="py-10 text-center text-sm text-muted">{t("Loading…")}</p>;
}

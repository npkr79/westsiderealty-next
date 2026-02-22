"use client";

import { FormEvent, useState } from "react";

const investorTypes = ["Sovereign Fund", "Private Equity", "Family Office", "Pension Fund", "Insurance Capital"];

export default function InstitutionalLeadForm() {
  const [submitted, setSubmitted] = useState(false);
  const [investorType, setInvestorType] = useState(investorTypes[0]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <form
      id="institutional-investment-memo"
      onSubmit={onSubmit}
      className="rounded-2xl border border-white/10 bg-slate-950/75 p-5 md:p-7"
    >
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#B48A3C]">Institutional Access</p>
      <h3 className="mt-2 text-xl font-semibold text-white">Request Institutional Investment Memorandum</h3>
      <p className="mt-2 text-sm text-slate-300">
        Complete this form to unlock the data room, underwriting assumptions, and the gated deck.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <input required placeholder="Name" className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-400" />
        <input required placeholder="Institution" className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-400" />
        <input required placeholder="Ticket size (INR crore)" className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-400" />
        <select
          value={investorType}
          onChange={(event) => setInvestorType(event.target.value)}
          className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2.5 text-sm text-white"
        >
          {investorTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <input required type="email" placeholder="Email" className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-400" />
        <input required type="tel" placeholder="Phone" className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-400" />
      </div>

      <label className="mt-4 flex items-start gap-2 text-xs text-slate-300">
        <input type="checkbox" required className="mt-0.5" />
        <span>I agree to receive the gated institutional deck and data room access instructions.</span>
      </label>

      <button
        type="submit"
        className="mt-5 rounded-lg bg-[#B48A3C] px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:brightness-110"
      >
        Request Access
      </button>

      {submitted ? (
        <p className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          Access granted to institutional data room.
        </p>
      ) : null}
    </form>
  );
}

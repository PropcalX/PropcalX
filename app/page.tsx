"use client";

import { useMemo, useState } from "react";
import {
  buildReportPayload,
  computeResult,
  COUNTRY_NAME,
  fmtMoney,
  fmtPct2,
  formatThousandsInput,
  getUiText,
  initialInputs,
  type CountryCode,
  type Inputs,
  type Lang,
  type Purpose,
  type Residency,
  type HomeCount,
} from "./lib/reporting";

function GoldCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_45px_rgba(0,0,0,0.22)]">
      <div className="text-xs uppercase tracking-[0.24em] text-[#cdb57a]">{title}</div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
      {subtitle ? <div className="mt-2 text-xs text-white/55">{subtitle}</div> : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 py-3 last:border-b-0">
      <div className="text-sm text-white/72">{label}</div>
      <div className="text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function MoneyInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#d7c28a] focus:ring-2 focus:ring-[#d7c28a]/20"
      value={value}
      onChange={(e) => onChange(formatThousandsInput(e.target.value))}
      placeholder={placeholder}
      inputMode="numeric"
    />
  );
}

function PercentInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <input
        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 pr-10 text-white outline-none transition focus:border-[#d7c28a] focus:ring-2 focus:ring-[#d7c28a]/20"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, "").slice(0, 6))}
        inputMode="decimal"
      />
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white/55">
        %
      </span>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm text-[#d7c28a]">{label}</div>
      {children}
    </label>
  );
}

export default function Page() {
  const [inputs, setInputs] = useState<Inputs>(initialInputs);
  const [email, setEmail] = useState("");
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [sendError, setSendError] = useState("");
  const ui = getUiText(inputs.lang);
  const result = useMemo(() => computeResult(inputs), [inputs]);
  const isInvestment = inputs.purpose === "investment";
  const currency = result.currency;

  async function onSendProReport() {
    try {
      setSendStatus("sending");
      setSendError("");

      const response = await fetch("/api/pro-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildReportPayload(inputs, email)),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}`);
      }

      setSendStatus("sent");
    } catch (error) {
      setSendStatus("error");
      setSendError(error instanceof Error ? error.message : "Unknown error");
    }
  }

  return (
    <div className="min-h-screen bg-[#07141c] text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(215,194,138,0.18),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(44,111,138,0.22),_transparent_25%),linear-gradient(180deg,#07141c_0%,#091118_45%,#0c0c0f_100%)]" />
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.28)] backdrop-blur md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <div className="text-sm uppercase tracking-[0.28em] text-[#d7c28a]">{ui.brand}</div>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-5xl">
                  {ui.title}
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-6 text-white/68 md:text-base">
                  {ui.subtitle}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-1">
                <div className="mb-2 px-2 text-xs text-white/55">{ui.language}</div>
                <div className="inline-flex gap-1">
                  {(["en", "zh"] as Lang[]).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setInputs((state) => ({ ...state, lang }))}
                      className={`rounded-xl px-4 py-2 text-sm transition ${
                        inputs.lang === lang ? "bg-[#d7c28a] text-black" : "text-white/70 hover:bg-white/8"
                      }`}
                    >
                      {lang === "en" ? "EN" : "中文"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label={ui.purpose}>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#d7c28a] focus:ring-2 focus:ring-[#d7c28a]/20"
                  value={inputs.purpose}
                  onChange={(e) => setInputs((state) => ({ ...state, purpose: e.target.value as Purpose }))}
                >
                  <option value="investment">{ui.purposeInvestment}</option>
                  <option value="selfuse">{ui.purposeSelfuse}</option>
                </select>
              </Field>

              <Field label={ui.country}>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#d7c28a] focus:ring-2 focus:ring-[#d7c28a]/20"
                  value={inputs.country}
                  onChange={(e) => setInputs((state) => ({ ...state, country: e.target.value as CountryCode }))}
                >
                  <option value="uk">{COUNTRY_NAME[inputs.lang].uk}</option>
                  <option value="uae">{COUNTRY_NAME[inputs.lang].uae}</option>
                  <option value="th">{COUNTRY_NAME[inputs.lang].th}</option>
                  <option value="jp">{COUNTRY_NAME[inputs.lang].jp}</option>
                </select>
              </Field>

              <Field label={ui.region}>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#d7c28a] focus:ring-2 focus:ring-[#d7c28a]/20"
                  value={inputs.region}
                  onChange={(e) => setInputs((state) => ({ ...state, region: e.target.value }))}
                  placeholder={inputs.lang === "en" ? "e.g. Nine Elms / Dubai Marina" : "例如：伦敦 / 迪拜码头"}
                />
              </Field>

              <Field label={ui.project}>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#d7c28a] focus:ring-2 focus:ring-[#d7c28a]/20"
                  value={inputs.project}
                  onChange={(e) => setInputs((state) => ({ ...state, project: e.target.value }))}
                  placeholder={inputs.lang === "en" ? "e.g. Thames City" : "例如：Thames City"}
                />
              </Field>

              <Field label={`${ui.price} (${currency})`}>
                <MoneyInput
                  value={inputs.price}
                  onChange={(price) => setInputs((state) => ({ ...state, price }))}
                  placeholder="420,000"
                />
              </Field>

              <Field label={ui.residency}>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#d7c28a] focus:ring-2 focus:ring-[#d7c28a]/20"
                  value={inputs.residency}
                  onChange={(e) => setInputs((state) => ({ ...state, residency: e.target.value as Residency }))}
                >
                  <option value="resident">{ui.resident}</option>
                  <option value="nonResident">{ui.nonResident}</option>
                </select>
              </Field>

              <Field label={ui.homeCount}>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#d7c28a] focus:ring-2 focus:ring-[#d7c28a]/20"
                  value={inputs.homeCount}
                  onChange={(e) => setInputs((state) => ({ ...state, homeCount: e.target.value as HomeCount }))}
                >
                  <option value="first">{ui.first}</option>
                  <option value="additional">{ui.additional}</option>
                </select>
              </Field>

              <Field label={`${ui.monthlyRent} (${currency})`}>
                <MoneyInput
                  value={inputs.monthlyRent}
                  onChange={(monthlyRent) => setInputs((state) => ({ ...state, monthlyRent }))}
                  placeholder="1,800"
                />
              </Field>

              <Field label={`${ui.agentFeePct} (%)`}>
                <PercentInput
                  value={inputs.agentFeePct}
                  onChange={(agentFeePct) => setInputs((state) => ({ ...state, agentFeePct }))}
                />
              </Field>

              <Field label={`${ui.mortgagePct} (%)`}>
                <PercentInput
                  value={inputs.mortgagePct}
                  onChange={(mortgagePct) => setInputs((state) => ({ ...state, mortgagePct }))}
                />
              </Field>

              <Field label={`${ui.aprPct} (%)`}>
                <PercentInput value={inputs.aprPct} onChange={(aprPct) => setInputs((state) => ({ ...state, aprPct }))} />
              </Field>

              <Field label={`${ui.annualHoldingCosts} (${currency})`}>
                <MoneyInput
                  value={inputs.annualHoldingCosts}
                  onChange={(annualHoldingCosts) => setInputs((state) => ({ ...state, annualHoldingCosts }))}
                  placeholder="2,500"
                />
              </Field>

              <Field label={`${ui.otherOneOffCosts} (${currency})`}>
                <MoneyInput
                  value={inputs.otherOneOffCosts}
                  onChange={(otherOneOffCosts) => setInputs((state) => ({ ...state, otherOneOffCosts }))}
                  placeholder={ui.otherPlaceholder}
                />
              </Field>

              <Field label={`${ui.propertyFeeSelf} (${currency})`}>
                <MoneyInput
                  value={inputs.annualPropertyFeeSelf}
                  onChange={(annualPropertyFeeSelf) =>
                    setInputs((state) => ({ ...state, annualPropertyFeeSelf }))
                  }
                  placeholder="2,500"
                />
              </Field>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-[32px] border border-white/10 bg-[#101317]/90 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.28)] md:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.25em] text-[#d7c28a]">{ui.estimateTag}</div>
                  <div className="mt-2 text-sm text-white/70">
                    {ui.countryLabel}: {COUNTRY_NAME[inputs.lang][inputs.country]} · {ui.currencyLabel}: {currency}
                    {inputs.region ? ` · ${inputs.region}` : ""}
                    {inputs.project ? ` · ${inputs.project}` : ""}
                  </div>
                </div>
              </div>

              {isInvestment ? (
                <>
                  <div className="mt-6">
                    <div className="text-xs uppercase tracking-[0.24em] text-[#d7c28a]">{ui.invTitle}</div>
                    <div className="mt-3 text-5xl font-semibold tracking-tight text-white">
                      {fmtPct2(result.cashOnCashPct)}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <GoldCard title={ui.netYield} value={fmtPct2(result.netYieldPct)} />
                    <GoldCard title={ui.netAnnualRent} value={`${currency} ${fmtMoney(result.netAnnualRent)}`} />
                    <GoldCard title={ui.upfrontCosts} value={`${currency} ${fmtMoney(result.upfrontCosts)}`} />
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                      <div className="text-sm font-semibold text-white">{ui.breakdown}</div>
                      <div className="mt-4">
                        <Row label={ui.stampDuty} value={`${currency} ${fmtMoney(result.stampDuty)}`} />
                        <Row
                          label={ui.govFees}
                          value={`${currency} ${fmtMoney(result.govSolicitorFeesEst)}`}
                        />
                        <Row
                          label={ui.otherOneOffCosts}
                          value={`${currency} ${fmtMoney(result.otherOneOffCosts)}`}
                        />
                        <Row label={ui.upfrontCosts} value={`${currency} ${fmtMoney(result.upfrontCosts)}`} />
                      </div>
                      <div className="mt-4 text-xs text-white/55">{ui.noteGov}</div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                      <div className="text-sm font-semibold text-white">{ui.annualCashflow}</div>
                      <div className="mt-4">
                        <Row
                          label={ui.grossAnnualRent}
                          value={`${currency} ${fmtMoney(result.grossAnnualRent)}`}
                        />
                        <Row
                          label={ui.agentFeeAnnual}
                          value={`${currency} ${fmtMoney(result.agentFeeAnnual)}`}
                        />
                        <Row
                          label={ui.holdingAnnual}
                          value={`${currency} ${fmtMoney(result.holdingAnnual)}`}
                        />
                        <Row
                          label={ui.interestAnnual}
                          value={`${currency} ${fmtMoney(result.interestAnnual)}`}
                        />
                        <Row
                          label={ui.netAnnualRent}
                          value={`${currency} ${fmtMoney(result.netAnnualRent)}`}
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <GoldCard
                      title={ui.annualFixed}
                      value={`${currency} ${fmtMoney(result.annualFixedOutgoings)}`}
                      subtitle={ui.annualFixedHint}
                    />
                    <GoldCard title={ui.perMonth} value={`${currency} ${fmtMoney(result.monthlyFixedOutgoings)}`} />
                    <GoldCard
                      title={ui.firstYear}
                      value={`${currency} ${fmtMoney(result.firstYearTotalOutgoings)}`}
                    />
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                      <div className="text-sm font-semibold text-white">{ui.annualFixed}</div>
                      <div className="mt-4">
                        <Row label={ui.councilTax} value={`${currency} ${fmtMoney(result.councilTaxEst)}`} />
                        <Row label={ui.utilities} value={`${currency} ${fmtMoney(result.utilitiesEst)}`} />
                        <Row label={ui.holdingAnnual} value={`${currency} ${fmtMoney(result.holdingAnnual)}`} />
                        <Row label={ui.propertyFeeSelf} value={`${currency} ${fmtMoney(result.propertyFeeSelf)}`} />
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                      <div className="text-sm font-semibold text-white">{ui.breakdown}</div>
                      <div className="mt-4">
                        <Row label={ui.stampDuty} value={`${currency} ${fmtMoney(result.stampDuty)}`} />
                        <Row
                          label={ui.govFees}
                          value={`${currency} ${fmtMoney(result.govSolicitorFeesEst)}`}
                        />
                        <Row
                          label={ui.otherOneOffCosts}
                          value={`${currency} ${fmtMoney(result.otherOneOffCosts)}`}
                        />
                        <Row label={ui.upfrontCosts} value={`${currency} ${fmtMoney(result.upfrontCosts)}`} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="mt-6 rounded-3xl border border-white/10 bg-[#0a0d10] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm font-semibold text-white">{ui.sensitivity}</div>
                  <div className="text-xs text-white/55">{ui.sensitivityHint}</div>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[460px] border-separate border-spacing-0 text-sm">
                    <thead>
                      <tr>
                        <th className="rounded-tl-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-left text-[#d7c28a]">
                          APR \ Rent
                        </th>
                        <th className="border border-white/10 bg-white/[0.04] px-3 py-3 text-center text-[#d7c28a]">
                          -10%
                        </th>
                        <th className="border border-white/10 bg-white/[0.04] px-3 py-3 text-center text-[#d7c28a]">
                          Base
                        </th>
                        <th className="rounded-tr-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-center text-[#d7c28a]">
                          +10%
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[3, 5, 7].map((apr) => (
                        <tr key={apr}>
                          <td className="border border-white/10 bg-black/20 px-3 py-3 font-semibold text-white">
                            {apr}%
                          </td>
                          {[0.9, 1.0, 1.1].map((rentFactor) => {
                            const point = result.sensitivity.find(
                              (item) => item.apr === apr && item.rentFactor === rentFactor,
                            );
                            return (
                              <td
                                key={`${apr}-${rentFactor}`}
                                className="border border-white/10 bg-black/10 px-3 py-3 text-center text-white"
                              >
                                {fmtPct2(point?.cocPct ?? 0)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-[#d7c28a]/25 bg-[linear-gradient(135deg,rgba(215,194,138,0.12),rgba(215,194,138,0.03))] p-6 shadow-[0_30px_70px_rgba(0,0,0,0.22)]">
              <div className="text-lg font-semibold text-white">{ui.proTitle}</div>
              <p className="mt-2 text-sm leading-6 text-white/72">{ui.proHint}</p>

              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                <input
                  className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-[#d7c28a] focus:ring-2 focus:ring-[#d7c28a]/20"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  inputMode="email"
                />
                <button
                  type="button"
                  onClick={onSendProReport}
                  disabled={!email || sendStatus === "sending"}
                  className="rounded-2xl bg-[#d7c28a] px-6 py-3 font-semibold text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sendStatus === "sending" ? ui.sending : ui.send}
                </button>
              </div>

              {sendStatus === "sent" ? <div className="mt-3 text-sm text-[#f3deaa]">{ui.sent}</div> : null}
              {sendStatus === "error" ? (
                <div className="mt-3 text-sm text-red-300">
                  {ui.failed} {sendError}
                </div>
              ) : null}

              <div className="mt-4 text-xs text-white/55">{ui.disclaimer}</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

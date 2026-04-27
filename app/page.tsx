"use client";

import { useMemo, useState } from "react";
import {
  buildFinancialBreakdown,
  buildReportPayload,
  computeResult,
  COUNTRY_NAME,
  fmtMoney,
  fmtPct2,
  formatThousandsInput,
  getUiText,
  initialInputs,
  initialReportDetails,
  type CountryCode,
  type HomeCount,
  type Inputs,
  type Lang,
  type RentalMarketEstimate,
  type ReportDetails,
  type Residency,
  type Purpose,
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm text-[#d7c28a]">{label}</div>
      {children}
    </label>
  );
}

function TextInput({
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
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
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

function MiniLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] uppercase tracking-[0.2em] text-[#cdb57a]">{children}</div>;
}

export default function Page() {
  const [inputs, setInputs] = useState<Inputs>(initialInputs);
  const [reportDetails, setReportDetails] = useState<ReportDetails>(initialReportDetails);
  const [detailStepOpen, setDetailStepOpen] = useState(false);
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [sendError, setSendError] = useState("");
  const [rentLookupStatus, setRentLookupStatus] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [rentLookupError, setRentLookupError] = useState("");
  const [rentalMarket, setRentalMarket] = useState<RentalMarketEstimate | null>(null);
  const [rentModalOpen, setRentModalOpen] = useState(false);

  const ui = getUiText(inputs.lang);
  const result = useMemo(() => computeResult(inputs), [inputs]);
  const currency = result.currency;
  const isInvestment = inputs.purpose === "investment";
  const financialBreakdown = useMemo(
    () => buildFinancialBreakdown(inputs, reportDetails, result, rentalMarket),
    [inputs, reportDetails, result, rentalMarket],
  );

  function updateInput<K extends keyof Inputs>(key: K, value: Inputs[K]) {
    setInputs((state) => ({ ...state, [key]: value }));
  }

  function updateDetail<K extends keyof ReportDetails>(key: K, value: ReportDetails[K]) {
    setReportDetails((state) => ({ ...state, [key]: value }));
  }

  async function onCheckRent() {
    try {
      setRentLookupStatus("loading");
      setRentLookupError("");
      setRentalMarket(null);

      const response = await fetch("/api/rent-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postcode: reportDetails.postcode,
          bedrooms: reportDetails.bedrooms,
          propertyType: reportDetails.propertyType,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || ui.rentCheckError);
      }

      setRentalMarket(data.estimate);
      setRentLookupStatus("done");
      setRentModalOpen(true);
    } catch (error) {
      setRentLookupStatus("error");
      setRentLookupError(error instanceof Error ? error.message : ui.rentCheckError);
    }
  }

  function applyRentEstimate(value: number) {
    const formatted = formatThousandsInput(String(Math.round(value)));
    updateDetail("monthlyRentOverride", formatted);
    updateInput("monthlyRent", formatted);
    setRentModalOpen(false);
  }

  async function onSendProReport() {
    try {
      setSendStatus("sending");
      setSendError("");

      const response = await fetch("/api/pro-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildReportPayload(inputs, reportDetails, rentalMarket)),
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

  const summaryCards = isInvestment
    ? [
        { title: ui.netYield, value: fmtPct2(result.netYieldPct) },
        { title: ui.netAnnualRent, value: `${currency} ${fmtMoney(result.netAnnualRent)}` },
        { title: ui.upfrontCosts, value: `${currency} ${fmtMoney(result.upfrontCosts)}` },
      ]
    : [
        { title: ui.annualFixed, value: `${currency} ${fmtMoney(result.annualFixedOutgoings)}` },
        { title: ui.perMonth, value: `${currency} ${fmtMoney(result.monthlyFixedOutgoings)}` },
        { title: ui.firstYear, value: `${currency} ${fmtMoney(result.firstYearTotalOutgoings)}` },
      ];

  return (
    <div className="min-h-screen bg-[#07141c] text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(215,194,138,0.18),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(44,111,138,0.22),_transparent_25%),linear-gradient(180deg,#07141c_0%,#091118_45%,#0c0c0f_100%)]" />
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.28)] backdrop-blur md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <div className="text-sm uppercase tracking-[0.28em] text-[#d7c28a]">{ui.brand}</div>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-5xl">{ui.title}</h1>
                <p className="mt-4 max-w-xl text-sm leading-6 text-white/68 md:text-base">{ui.subtitle}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-1">
                <div className="mb-2 px-2 text-xs text-white/55">{ui.language}</div>
                <div className="inline-flex gap-1">
                  {(["en", "zh"] as Lang[]).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => updateInput("lang", lang)}
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
                  onChange={(e) => updateInput("purpose", e.target.value as Purpose)}
                >
                  <option value="investment">{ui.purposeInvestment}</option>
                  <option value="selfuse">{ui.purposeSelfuse}</option>
                </select>
              </Field>

              <Field label={ui.country}>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#d7c28a] focus:ring-2 focus:ring-[#d7c28a]/20"
                  value={inputs.country}
                  onChange={(e) => updateInput("country", e.target.value as CountryCode)}
                >
                  <option value="uk">{COUNTRY_NAME[inputs.lang].uk}</option>
                  <option value="uae">{COUNTRY_NAME[inputs.lang].uae}</option>
                  <option value="th">{COUNTRY_NAME[inputs.lang].th}</option>
                  <option value="jp">{COUNTRY_NAME[inputs.lang].jp}</option>
                </select>
              </Field>

              <Field label={ui.region}>
                <TextInput
                  value={inputs.region}
                  onChange={(value) => updateInput("region", value)}
                  placeholder={inputs.lang === "en" ? "e.g. Nine Elms / Dubai Marina" : "例如：伦敦 / 迪拜码头"}
                />
              </Field>

              <Field label={ui.project}>
                <TextInput
                  value={inputs.project}
                  onChange={(value) => updateInput("project", value)}
                  placeholder={inputs.lang === "en" ? "e.g. Thames City" : "例如：Thames City"}
                />
              </Field>

              <Field label={`${ui.price} (${currency})`}>
                <MoneyInput value={inputs.price} onChange={(value) => updateInput("price", value)} placeholder="420,000" />
              </Field>

              <Field label={ui.residency}>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#d7c28a] focus:ring-2 focus:ring-[#d7c28a]/20"
                  value={inputs.residency}
                  onChange={(e) => updateInput("residency", e.target.value as Residency)}
                >
                  <option value="resident">{ui.resident}</option>
                  <option value="nonResident">{ui.nonResident}</option>
                </select>
              </Field>

              <Field label={ui.homeCount}>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#d7c28a] focus:ring-2 focus:ring-[#d7c28a]/20"
                  value={inputs.homeCount}
                  onChange={(e) => updateInput("homeCount", e.target.value as HomeCount)}
                >
                  <option value="first">{ui.first}</option>
                  <option value="additional">{ui.additional}</option>
                </select>
              </Field>

              <Field label={`${ui.monthlyRent} (${currency})`}>
                <MoneyInput
                  value={inputs.monthlyRent}
                  onChange={(value) => updateInput("monthlyRent", value)}
                  placeholder="1,800"
                />
              </Field>

              <Field label={`${ui.agentFeePct} (%)`}>
                <PercentInput value={inputs.agentFeePct} onChange={(value) => updateInput("agentFeePct", value)} />
              </Field>

              <Field label={`${ui.mortgagePct} (%)`}>
                <PercentInput value={inputs.mortgagePct} onChange={(value) => updateInput("mortgagePct", value)} />
              </Field>

              <Field label={`${ui.aprPct} (%)`}>
                <PercentInput value={inputs.aprPct} onChange={(value) => updateInput("aprPct", value)} />
              </Field>

              <Field label={`${ui.annualHoldingCosts} (${currency})`}>
                <MoneyInput
                  value={inputs.annualHoldingCosts}
                  onChange={(value) => updateInput("annualHoldingCosts", value)}
                  placeholder="2,500"
                />
              </Field>

              <Field label={`${ui.otherOneOffCosts} (${currency})`}>
                <MoneyInput
                  value={inputs.otherOneOffCosts}
                  onChange={(value) => updateInput("otherOneOffCosts", value)}
                  placeholder={ui.otherPlaceholder}
                />
              </Field>

              <Field label={`${ui.propertyFeeSelf} (${currency})`}>
                <MoneyInput
                  value={inputs.annualPropertyFeeSelf}
                  onChange={(value) => updateInput("annualPropertyFeeSelf", value)}
                  placeholder="2,500"
                />
              </Field>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-[32px] border border-white/10 bg-[#101317]/90 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.28)] md:p-7">
              <div className="text-xs uppercase tracking-[0.25em] text-[#d7c28a]">{ui.estimateTag}</div>
              <div className="mt-2 text-sm text-white/70">
                {ui.countryLabel}: {COUNTRY_NAME[inputs.lang][inputs.country]} · {ui.currencyLabel}: {currency}
                {inputs.region ? ` · ${inputs.region}` : ""}
                {inputs.project ? ` · ${inputs.project}` : ""}
              </div>

              <div className="mt-6">
                <div className="text-xs uppercase tracking-[0.24em] text-[#d7c28a]">
                  {isInvestment ? ui.invTitle : ui.selfTitle}
                </div>
                <div className="mt-3 text-5xl font-semibold tracking-tight text-white">
                  {isInvestment ? fmtPct2(result.cashOnCashPct) : `${currency} ${fmtMoney(result.firstYearTotalOutgoings)}`}
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {summaryCards.map((card) => (
                  <GoldCard key={card.title} title={card.title} value={card.value} />
                ))}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-sm font-semibold text-white">{ui.breakdown}</div>
                  <div className="mt-4">
                    <Row label={ui.stampDuty} value={`${currency} ${fmtMoney(result.stampDuty)}`} />
                    <Row label={ui.govFees} value={`${currency} ${fmtMoney(result.govSolicitorFeesEst)}`} />
                    <Row label={ui.otherOneOffCosts} value={`${currency} ${fmtMoney(result.otherOneOffCosts)}`} />
                    <Row label={ui.upfrontCosts} value={`${currency} ${fmtMoney(result.upfrontCosts)}`} />
                  </div>
                  <div className="mt-4 text-xs text-white/55">{ui.noteGov}</div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-sm font-semibold text-white">{ui.annualCashflow}</div>
                  <div className="mt-4">
                    <Row label={ui.grossAnnualRent} value={`${currency} ${fmtMoney(result.grossAnnualRent)}`} />
                    <Row label={ui.agentFeeAnnual} value={`${currency} ${fmtMoney(result.agentFeeAnnual)}`} />
                    <Row label={ui.holdingAnnual} value={`${currency} ${fmtMoney(result.holdingAnnual)}`} />
                    <Row label={ui.interestAnnual} value={`${currency} ${fmtMoney(result.interestAnnual)}`} />
                    <Row label={ui.netAnnualRent} value={`${currency} ${fmtMoney(result.netAnnualRent)}`} />
                  </div>
                </div>
              </div>

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
                        <th className="border border-white/10 bg-white/[0.04] px-3 py-3 text-center text-[#d7c28a]">-10%</th>
                        <th className="border border-white/10 bg-white/[0.04] px-3 py-3 text-center text-[#d7c28a]">Base</th>
                        <th className="rounded-tr-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-center text-[#d7c28a]">+10%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[3, 5, 7].map((apr) => (
                        <tr key={apr}>
                          <td className="border border-white/10 bg-black/20 px-3 py-3 font-semibold text-white">{apr}%</td>
                          {[0.9, 1.0, 1.1].map((rentFactor) => {
                            const point = result.sensitivity.find((item) => item.apr === apr && item.rentFactor === rentFactor);
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

              <div className="mt-6 rounded-3xl border border-[#d7c28a]/25 bg-[linear-gradient(135deg,rgba(215,194,138,0.12),rgba(215,194,138,0.03))] p-5">
                <div className="text-lg font-semibold text-white">{ui.proTitle}</div>
                <p className="mt-2 text-sm leading-6 text-white/72">{ui.proHint}</p>
                <button
                  type="button"
                  onClick={() => setDetailStepOpen(true)}
                  className="mt-4 rounded-2xl bg-[#d7c28a] px-6 py-3 font-semibold text-black transition hover:brightness-105"
                >
                  {ui.continueReport}
                </button>
              </div>
            </div>

            {detailStepOpen ? (
              <div className="rounded-[32px] border border-white/10 bg-[#101317]/90 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.28)] md:p-7">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.25em] text-[#d7c28a]">Step 2</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{ui.detailStepTitle}</div>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/72">{ui.detailStepHint}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailStepOpen(false)}
                    className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-white/72 hover:bg-white/8"
                  >
                    {ui.backToCalculator}
                  </button>
                </div>

                <div className="mt-6 rounded-3xl border border-white/10 bg-[#0a0d10] p-5">
                  <MiniLabel>{ui.rentCheckTitle}</MiniLabel>
                  <p className="mt-2 text-sm leading-6 text-white/72">{ui.rentCheckHint}</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr_0.8fr_0.8fr_auto]">
                    <Field label={ui.postcode}>
                      <TextInput value={reportDetails.postcode} onChange={(value) => updateDetail("postcode", value)} placeholder="SW11 8BX" />
                    </Field>
                    <Field label={ui.bedrooms}>
                      <TextInput value={reportDetails.bedrooms} onChange={(value) => updateDetail("bedrooms", value)} placeholder="2" />
                    </Field>
                    <Field label={ui.propertyType}>
                      <TextInput value={reportDetails.propertyType} onChange={(value) => updateDetail("propertyType", value)} placeholder="Apartment" />
                    </Field>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={onCheckRent}
                        disabled={!reportDetails.postcode || rentLookupStatus === "loading"}
                        className="w-full rounded-2xl bg-[#d7c28a] px-5 py-3 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {rentLookupStatus === "loading" ? ui.rentCheckLoading : ui.rentCheckButton}
                      </button>
                    </div>
                  </div>

                  {rentalMarket ? (
                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <GoldCard title={ui.rentModalMedian} value={`GBP ${fmtMoney(rentalMarket.medianPcm)}`} />
                      <GoldCard title={ui.rentModalAverage} value={`GBP ${fmtMoney(rentalMarket.averagePcm)}`} />
                      <GoldCard title={ui.rentModalRange} value={`GBP ${fmtMoney(rentalMarket.minPcm)} - ${fmtMoney(rentalMarket.maxPcm)}`} subtitle={`${rentalMarket.listingCount} listings`} />
                    </div>
                  ) : null}

                  {rentLookupStatus === "error" ? <div className="mt-3 text-sm text-red-300">{rentLookupError}</div> : null}
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label={ui.email}>
                    <TextInput value={reportDetails.email} onChange={(value) => updateDetail("email", value)} placeholder="name@example.com" />
                  </Field>
                  <Field label={ui.development}>
                    <TextInput value={reportDetails.development} onChange={(value) => updateDetail("development", value)} placeholder={inputs.project || "Thames City"} />
                  </Field>
                  <Field label={ui.plotNumber}>
                    <TextInput value={reportDetails.plotNumber} onChange={(value) => updateDetail("plotNumber", value)} placeholder="607" />
                  </Field>
                  <Field label={ui.levelAspect}>
                    <TextInput value={reportDetails.levelAspect} onChange={(value) => updateDetail("levelAspect", value)} placeholder="6th floor / west-south" />
                  </Field>
                  <Field label={ui.internalAreaSqft}>
                    <MoneyInput value={reportDetails.internalAreaSqft} onChange={(value) => updateDetail("internalAreaSqft", value)} placeholder="876" />
                  </Field>
                  <Field label={ui.internalAreaSqm}>
                    <MoneyInput value={reportDetails.internalAreaSqm} onChange={(value) => updateDetail("internalAreaSqm", value)} placeholder="81.4" />
                  </Field>
                  <Field label={ui.totalAreaSqm}>
                    <MoneyInput value={reportDetails.totalAreaSqm} onChange={(value) => updateDetail("totalAreaSqm", value)} placeholder="81.4" />
                  </Field>
                  <Field label={`${ui.askingPrice} (${currency})`}>
                    <MoneyInput value={reportDetails.askingPrice} onChange={(value) => updateDetail("askingPrice", value)} placeholder={inputs.price} />
                  </Field>
                  <Field label={ui.discountPct}>
                    <PercentInput value={reportDetails.discountPct} onChange={(value) => updateDetail("discountPct", value)} />
                  </Field>
                  <Field label={ui.fxRate}>
                    <TextInput value={reportDetails.fxRate} onChange={(value) => updateDetail("fxRate", value)} placeholder="9.2" />
                  </Field>
                  <Field label={`${ui.legalFee} (${currency})`}>
                    <MoneyInput value={reportDetails.legalFee} onChange={(value) => updateDetail("legalFee", value)} />
                  </Field>
                  <Field label={`${ui.stampDutyAdminFee} (${currency})`}>
                    <MoneyInput value={reportDetails.stampDutyAdminFee} onChange={(value) => updateDetail("stampDutyAdminFee", value)} />
                  </Field>
                  <Field label={`${ui.amlCheckFee} (${currency})`}>
                    <MoneyInput value={reportDetails.amlCheckFee} onChange={(value) => updateDetail("amlCheckFee", value)} />
                  </Field>
                  <Field label={`${ui.landRegistryFee} (${currency})`}>
                    <MoneyInput value={reportDetails.landRegistryFee} onChange={(value) => updateDetail("landRegistryFee", value)} />
                  </Field>
                  <Field label={`${ui.landSearchFee} (${currency})`}>
                    <MoneyInput value={reportDetails.landSearchFee} onChange={(value) => updateDetail("landSearchFee", value)} />
                  </Field>
                  <Field label={`${ui.leaseholdFee} (${currency})`}>
                    <MoneyInput value={reportDetails.leaseholdFee} onChange={(value) => updateDetail("leaseholdFee", value)} />
                  </Field>
                  <Field label={`${ui.chapsFee} (${currency})`}>
                    <MoneyInput value={reportDetails.chapsFee} onChange={(value) => updateDetail("chapsFee", value)} />
                  </Field>
                  <Field label={`${ui.annualMaintenanceFee} (${currency})`}>
                    <MoneyInput value={reportDetails.annualMaintenanceFee} onChange={(value) => updateDetail("annualMaintenanceFee", value)} placeholder="If blank, will use service charge per sqft × area" />
                  </Field>
                  <Field label={`${ui.serviceChargePerSqft} (${currency})`}>
                    <TextInput value={reportDetails.serviceChargePerSqft} onChange={(value) => updateDetail("serviceChargePerSqft", value)} placeholder="10.54" />
                  </Field>
                  <Field label={`${ui.monthlyRentOverride} (${currency})`}>
                    <MoneyInput value={reportDetails.monthlyRentOverride} onChange={(value) => updateDetail("monthlyRentOverride", value)} placeholder={inputs.monthlyRent} />
                  </Field>
                  <Field label={`${ui.reservationFee} (${currency})`}>
                    <MoneyInput value={reportDetails.reservationFee} onChange={(value) => updateDetail("reservationFee", value)} />
                  </Field>
                  <Field label={ui.exchangeDepositPct}>
                    <PercentInput value={reportDetails.exchangeDepositPct} onChange={(value) => updateDetail("exchangeDepositPct", value)} />
                  </Field>
                  <Field label={ui.completionDate}>
                    <TextInput value={reportDetails.completionDate} onChange={(value) => updateDetail("completionDate", value)} placeholder="2026-10-01" />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label={ui.notes}>
                      <textarea
                        className="min-h-[110px] w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#d7c28a] focus:ring-2 focus:ring-[#d7c28a]/20"
                        value={reportDetails.notes}
                        onChange={(e) => updateDetail("notes", e.target.value)}
                        placeholder="Special conditions, furnishing notes, client context..."
                      />
                    </Field>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-white/10 bg-[#0a0d10] p-5">
                  <MiniLabel>Financial Breakdown Preview</MiniLabel>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <GoldCard title="Discounted Price" value={`${currency} ${fmtMoney(financialBreakdown.discountedPrice)}`} />
                    <GoldCard title="One-off Total" value={`${currency} ${fmtMoney(financialBreakdown.oneOffCostsTotal)}`} />
                    <GoldCard title="Annual Rent" value={`${currency} ${fmtMoney(financialBreakdown.annualRentalIncome)}`} />
                    <GoldCard title="Annual Maintenance" value={`${currency} ${fmtMoney(financialBreakdown.annualMaintenanceFee)}`} />
                    <GoldCard title="Cash Profit" value={`${currency} ${fmtMoney(financialBreakdown.annualCashProfit)}`} />
                    <GoldCard title="Leveraged Profit" value={`${currency} ${fmtMoney(financialBreakdown.annualLeveragedProfit)}`} />
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="text-xs text-white/55">{ui.disclaimer}</div>
                  <button
                    type="button"
                    onClick={onSendProReport}
                    disabled={!reportDetails.email || sendStatus === "sending"}
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
              </div>
            ) : null}
          </section>
        </div>
      </div>

      {rentModalOpen && rentalMarket ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 py-8">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[32px] border border-white/10 bg-[#091118] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-[#d7c28a]">{ui.rentModalTitle}</div>
                <div className="mt-2 text-2xl font-semibold text-white">{rentalMarket.postcode}</div>
                <div className="mt-1 text-sm text-white/65">
                  {ui.rentModalSource}: Rightmove · {rentalMarket.listingCount} listings
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRentModalOpen(false)}
                className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-white/72 hover:bg-white/8"
              >
                {ui.close}
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <GoldCard title={ui.rentModalMedian} value={`GBP ${fmtMoney(rentalMarket.medianPcm)}`} />
              <GoldCard title={ui.rentModalAverage} value={`GBP ${fmtMoney(rentalMarket.averagePcm)}`} />
              <GoldCard title={ui.rentModalRange} value={`GBP ${fmtMoney(rentalMarket.minPcm)} - ${fmtMoney(rentalMarket.maxPcm)}`} />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => applyRentEstimate(rentalMarket.medianPcm)}
                className="rounded-2xl bg-[#d7c28a] px-5 py-3 font-semibold text-black"
              >
                {ui.rentCheckUseMedian}
              </button>
              <button
                type="button"
                onClick={() => applyRentEstimate(rentalMarket.averagePcm)}
                className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-white"
              >
                {ui.rentCheckUseAverage}
              </button>
              <a
                href={rentalMarket.searchUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-white"
              >
                {ui.rentModalOpenSource}
              </a>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-sm font-semibold text-white">{ui.rentModalListings}</div>
              <div className="mt-4 space-y-3">
                {rentalMarket.sampleListings.map((item) => (
                  <div key={`${item.title}-${item.pricePcm}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-medium text-white">{item.title}</div>
                        <div className="mt-1 text-sm text-white/65">
                          {[item.bedrooms ? `${item.bedrooms} bed` : "", item.propertyType || ""].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <div className="text-lg font-semibold text-[#f3deaa]">GBP {fmtMoney(item.pricePcm)} pcm</div>
                    </div>
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-[#d7c28a]">
                        Open listing
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

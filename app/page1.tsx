"use client";

import React, { useMemo, useState } from "react";

type Country = "UK" | "Dubai" | "Thailand" | "Japan";
type UKBuyerResidency = "UK resident" | "Overseas buyer";
type UKPropertyCount = "First home" | "Additional home";

function formatMoney(n: number, currency: string) {
  if (!isFinite(n)) return "-";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * UK SDLT (MVP):
 * - Uses baseline (standard) bands (illustrative)
 * - Adds:
 *   - +3% surcharge for Additional home
 *   - +2% surcharge for Overseas buyer (illustrative)
 *
 * NOTE: SDLT rules & thresholds change; refine with proper tables later.
 */
function calcUKSDLT(price: number, isAdditional: boolean, isOverseas: boolean): number {
  // Simplified baseline bands (standard residential) - illustrative MVP
  // 0-250k: 0%
  // 250k-925k: 5%
  // 925k-1.5m: 10%
  // 1.5m+: 12%
  const bands = [
    { upTo: 250000, rate: 0.0 },
    { upTo: 925000, rate: 0.05 },
    { upTo: 1500000, rate: 0.10 },
    { upTo: Infinity, rate: 0.12 },
  ];

  let remaining = price;
  let last = 0;
  let tax = 0;

  for (const b of bands) {
    const cap = b.upTo;
    const bandSize = Math.max(0, Math.min(remaining, cap - last));
    tax += bandSize * b.rate;
    remaining -= bandSize;
    last = cap;
    if (remaining <= 0) break;
  }

  // Surcharges (illustrative):
  // Additional home: +3% on entire price
  // Overseas buyer: +2% on entire price
  if (isAdditional) tax += price * 0.03;
  if (isOverseas) tax += price * 0.02;

  return Math.max(0, Math.round(tax));
}

function calcDubaiCosts(priceAED: number) {
  // Simplified: DLD 4% + trustee fee 4,000 AED + admin 580 AED (illustrative)
  const dld = priceAED * 0.04;
  const trustee = 4000;
  const admin = 580;
  return {
    purchaseTax: Math.round(dld),
    otherGovFees: trustee + admin,
    totalGov: Math.round(dld + trustee + admin),
  };
}

function calcThailandCosts(priceTHB: number) {
  // Thailand costs vary by structure and sale type.
  // MVP approximation: "transfer/registration" 2% of appraised/value (illustrative)
  const transfer = priceTHB * 0.02;
  return {
    purchaseTax: Math.round(transfer),
    otherGovFees: 0,
    totalGov: Math.round(transfer),
  };
}

function calcJapanCosts(priceJPY: number) {
  // Japan has multiple items (acquisition tax, registration, stamp, etc).
  // MVP approximation: 3% of price as a placeholder bundle (illustrative)
  const bundle = priceJPY * 0.03;
  return {
    purchaseTax: Math.round(bundle),
    otherGovFees: 0,
    totalGov: Math.round(bundle),
  };
}

export default function Home() {
  const [country, setCountry] = useState<Country>("UK");

  // Core inputs
  const [price, setPrice] = useState<string>("");
  const [rentMonthly, setRentMonthly] = useState<string>("");

  // New inputs
  const [mortgagePercent, setMortgagePercent] = useState<string>("0"); // loan %
  const [mortgageRate, setMortgageRate] = useState<string>("5"); // annual interest rate %
  const [agentFeePercent, setAgentFeePercent] = useState<string>("10"); // % of monthly rent (annualised)
  const [annualCosts, setAnnualCosts] = useState<string>(""); // holding costs (service charge, tax, insurance etc.)
  const [otherOneOffCosts, setOtherOneOffCosts] = useState<string>(""); // lawyer, furniture pack, etc.

  // UK-specific
  const [ukResidency, setUkResidency] = useState<UKBuyerResidency>("UK resident");
  const [ukPropertyCount, setUkPropertyCount] = useState<UKPropertyCount>("First home");

  const currency = useMemo(() => {
    switch (country) {
      case "UK":
        return "GBP";
      case "Dubai":
        return "AED";
      case "Thailand":
        return "THB";
      case "Japan":
        return "JPY";
      default:
        return "USD";
    }
  }, [country]);

  const [result, setResult] = useState<null | {
    currency: string;

    // Purchase cost
    purchaseTax: number;
    otherGovFees: number;
    otherOneOffCosts: number;
    totalUpfrontCosts: number;

    // Mortgage
    mortgagePercent: number;
    loanAmount: number;
    cashDeposit: number;
    annualInterestCost: number;

    // Rent + costs
    grossAnnualRent: number;
    lettingAgentAnnualFee: number;
    annualCosts: number;
    netAnnualRent: number;

    // Ratios
    netYieldOnPrice: number; // net rent / price
    roiCashOnCash: number; // net rent / total cash in
  }>(null);

  function onCalculate(e: React.FormEvent) {
    e.preventDefault();

    const p = Number(price);
    const r = Number(rentMonthly);

    const mPct = clamp(Number(mortgagePercent) || 0, 0, 100);
    const mRate = clamp(Number(mortgageRate) || 0, 0, 50);

    const agentPct = clamp(Number(agentFeePercent) || 0, 0, 100);
    const holdCosts = Math.max(0, Number(annualCosts) || 0);
    const oneOff = Math.max(0, Number(otherOneOffCosts) || 0);

    if (!p || p <= 0) {
      alert("Please enter a valid property price.");
      return;
    }

    // --- Government purchase taxes/fees (MVP) ---
    let purchaseTax = 0;
    let otherGovFees = 0;

    if (country === "UK") {
      const isAdditional = ukPropertyCount === "Additional home";
      const isOverseas = ukResidency === "Overseas buyer";
      purchaseTax = calcUKSDLT(p, isAdditional, isOverseas);
      otherGovFees = 0; // keep gov fees separate; put solicitor etc into otherOneOffCosts
    } else if (country === "Dubai") {
      const dubai = calcDubaiCosts(p);
      purchaseTax = dubai.purchaseTax;
      otherGovFees = dubai.otherGovFees;
    } else if (country === "Thailand") {
      const th = calcThailandCosts(p);
      purchaseTax = th.purchaseTax;
      otherGovFees = th.otherGovFees;
    } else if (country === "Japan") {
      const jp = calcJapanCosts(p);
      purchaseTax = jp.purchaseTax;
      otherGovFees = jp.otherGovFees;
    }

    // --- Mortgage ---
    const loanAmount = (p * mPct) / 100;
    const cashDeposit = p - loanAmount;
    const annualInterestCost = (loanAmount * mRate) / 100; // interest-only estimate (MVP)

    // --- Rent / costs ---
    const grossAnnualRent = Math.max(0, r) * 12;
    const lettingAgentAnnualFee = grossAnnualRent * (agentPct / 100);
    const netAnnualRent = Math.max(
      0,
      grossAnnualRent - lettingAgentAnnualFee - holdCosts - annualInterestCost
    );

    // --- Totals ---
    const totalUpfrontCosts = purchaseTax + otherGovFees + oneOff;

    // total cash in = deposit + upfront costs (assumes mortgage covers the rest of price)
    const totalCashIn = cashDeposit + totalUpfrontCosts;

    const netYieldOnPrice = grossAnnualRent > 0 ? (netAnnualRent / p) * 100 : 0;
    const roiCashOnCash = grossAnnualRent > 0 ? (netAnnualRent / totalCashIn) * 100 : 0;

    setResult({
      currency,
      purchaseTax,
      otherGovFees,
      otherOneOffCosts: oneOff,
      totalUpfrontCosts,

      mortgagePercent: mPct,
      loanAmount,
      cashDeposit,
      annualInterestCost,

      grossAnnualRent,
      lettingAgentAnnualFee,
      annualCosts: holdCosts,
      netAnnualRent,

      netYieldOnPrice,
      roiCashOnCash,
    });
  }

  return (
    <main className="min-h-screen p-6 flex flex-col items-center bg-white text-black">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">Global Property Calculator</h1>
        <p className="text-black-600 mb-6">
          MVP version: tax + yield estimate (you’ll refine country rules later).
        </p>

        <form onSubmit={onCalculate} className="rounded-xl border p-4 shadow-sm bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Country */}
            <div>
              <label className="block text-sm font-medium mb-1">Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value as Country)}
                className="w-full border rounded-lg px-3 py-2 bg-white text-black"
              >
                <option value="UK">UK</option>
                <option value="Dubai">Dubai (UAE)</option>
                <option value="Thailand">Thailand</option>
                <option value="Japan">Japan</option>
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Property Price ({currency})
              </label>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                type="number"
                inputMode="decimal"
                className="w-full border rounded-lg px-3 py-2 bg-white text-black"
                placeholder={
                  country === "UK"
                    ? "e.g. 750000"
                    : country === "Dubai"
                    ? "e.g. 2000000"
                    : country === "Thailand"
                    ? "e.g. 8000000"
                    : "e.g. 90000000"
                }
              />
            </div>

            {/* UK options */}
            {country === "UK" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Buyer residency
                  </label>
                  <select
                    value={ukResidency}
                    onChange={(e) => setUkResidency(e.target.value as UKBuyerResidency)}
                    className="w-full border rounded-lg px-3 py-2 bg-white text-black"
                  >
                    <option value="UK resident">UK resident</option>
                    <option value="Overseas buyer">Overseas buyer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    First home or additional home
                  </label>
                  <select
                    value={ukPropertyCount}
                    onChange={(e) => setUkPropertyCount(e.target.value as UKPropertyCount)}
                    className="w-full border rounded-lg px-3 py-2 bg-white text-black"
                  >
                    <option value="First home">First home</option>
                    <option value="Additional home">Additional home</option>
                  </select>
                </div>
              </>
            )}

            {/* Rent */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Monthly Rent ({currency})
              </label>
              <input
                value={rentMonthly}
                onChange={(e) => setRentMonthly(e.target.value)}
                type="number"
                inputMode="decimal"
                className="w-full border rounded-lg px-3 py-2 bg-white text-black"
                placeholder={country === "UK" ? "e.g. 2800" : "e.g. 12000"}
              />
            </div>

            {/* Letting agent fee */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Letting agent fee (% of rent)
              </label>
              <input
                value={agentFeePercent}
                onChange={(e) => setAgentFeePercent(e.target.value)}
                type="number"
                inputMode="decimal"
                className="w-full border rounded-lg px-3 py-2 bg-white text-black"
                placeholder="e.g. 10"
              />
              <p className="text-xs text-black-500 mt-1">
                We apply this percentage to annual rent (MVP).
              </p>
            </div>

            {/* Mortgage % */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Mortgage / Loan (% of price)
              </label>
              <input
                value={mortgagePercent}
                onChange={(e) => setMortgagePercent(e.target.value)}
                type="number"
                inputMode="decimal"
                className="w-full border rounded-lg px-3 py-2 bg-white text-black"
                placeholder="e.g. 70"
              />
              <p className="text-xs text-black-500 mt-1">
                0 means cash purchase.
              </p>
            </div>

            {/* Mortgage rate */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Interest rate (% per year)
              </label>
              <input
                value={mortgageRate}
                onChange={(e) => setMortgageRate(e.target.value)}
                type="number"
                inputMode="decimal"
                className="w-full border rounded-lg px-3 py-2 bg-white text-black"
                placeholder="e.g. 5"
              />
              <p className="text-xs text-black-500 mt-1">
                MVP assumes interest-only annual cost.
              </p>
            </div>

            {/* Annual holding costs */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Annual Holding Costs ({currency}) (optional)
              </label>
              <input
                value={annualCosts}
                onChange={(e) => setAnnualCosts(e.target.value)}
                type="number"
                inputMode="decimal"
                className="w-full border rounded-lg px-3 py-2 bg-white text-black"
                placeholder={country === "UK" ? "e.g. 4500" : "e.g. 20000"}
              />
              <p className="text-xs text-black-500 mt-1">
                Service charge, property tax, insurance, management, maintenance, etc.
              </p>
            </div>

            {/* Other one-off costs */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Other one-off costs ({currency}) (optional)
              </label>
              <input
                value={otherOneOffCosts}
                onChange={(e) => setOtherOneOffCosts(e.target.value)}
                type="number"
                inputMode="decimal"
                className="w-full border rounded-lg px-3 py-2 bg-white text-black"
                placeholder="e.g. lawyer + furniture pack"
              />
              <p className="text-xs text-black-500 mt-1">
                Lawyer, furniture pack, valuation, mortgage fee, etc.
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="mt-4 w-full rounded-lg bg-black text-white py-2 font-semibold"
          >
            Calculate
          </button>
        </form>

        {result && (
          <div className="mt-8 p-6 rounded-2xl shadow-lg bg-gradient-to-b from-gray-50 to-white border border-gray-200">
            <h2 className="text-xl font-semibold mb-3">Result</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-black-50 p-3">
                <div className="text-black-500">Purchase tax (estimate)</div>
                <div className="text-lg font-semibold">
                  {formatMoney(result.purchaseTax, result.currency)}
                </div>
              </div>

              <div className="rounded-lg bg-black-50 p-3">
                <div className="text-black-500">Other government fees</div>
                <div className="text-lg font-semibold">
                  {formatMoney(result.otherGovFees, result.currency)}
                </div>
              </div>

              <div className="rounded-lg bg-black-50 p-3">
                <div className="text-black-500">Other one-off costs</div>
                <div className="text-lg font-semibold">
                  {formatMoney(result.otherOneOffCosts, result.currency)}
                </div>
              </div>

              <div className="rounded-lg bg-black-50 p-3">
                <div className="text-black-500">Total upfront costs</div>
                <div className="text-lg font-semibold">
                  {formatMoney(result.totalUpfrontCosts, result.currency)}
                </div>
              </div>

              <div className="rounded-lg bg-black-50 p-3">
                <div className="text-black-500">Loan amount</div>
                <div className="text-lg font-semibold">
                  {formatMoney(result.loanAmount, result.currency)}
                </div>
                <div className="text-xs text-black-500">
                  ({result.mortgagePercent.toFixed(0)}% LTV)
                </div>
              </div>

              <div className="rounded-lg bg-black-50 p-3">
                <div className="text-black-500">Cash deposit</div>
                <div className="text-lg font-semibold">
                  {formatMoney(result.cashDeposit, result.currency)}
                </div>
              </div>

              <div className="rounded-lg bg-black-50 p-3 md:col-span-2">
                <div className="text-black-500">Annual interest cost (MVP)</div>
                <div className="text-lg font-semibold">
                  {formatMoney(result.annualInterestCost, result.currency)}
                </div>
              </div>

              <div className="rounded-lg bg-black-50 p-3">
                <div className="text-black-500">Gross annual rent</div>
                <div className="text-lg font-semibold">
                  {formatMoney(result.grossAnnualRent, result.currency)}
                </div>
              </div>

              <div className="rounded-lg bg-black-50 p-3">
                <div className="text-black-500">Letting agent fee (annual)</div>
                <div className="text-lg font-semibold">
                  {formatMoney(result.lettingAgentAnnualFee, result.currency)}
                </div>
              </div>

              <div className="rounded-lg bg-black-50 p-3">
                <div className="text-black-500">Annual holding costs</div>
                <div className="text-lg font-semibold">
                  {formatMoney(result.annualCosts, result.currency)}
                </div>
              </div>

              <div className="rounded-lg bg-black-50 p-3">
                <div className="text-black-500">Net annual rent</div>
                <div className="text-lg font-semibold">
                  {formatMoney(result.netAnnualRent, result.currency)}
                </div>
              </div>

              <div className="rounded-lg bg-black-50 p-3">
                <div className="text-black-500">Net yield (on price)</div>
                <div className="text-lg font-semibold">
                  {result.netYieldOnPrice.toFixed(2)}%
                </div>
              </div>

              <div className="rounded-lg bg-black-50 p-3">
                <div className="text-black-500">ROI (cash-on-cash)</div>
                <div className="text-lg font-semibold">
                  {result.roiCashOnCash.toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border p-3">
              <div className="font-semibold mb-1">Next step (CTA)</div>
              <p className="text-sm text-black-600">
                Add a button here to “Generate Pro Report (PDF)” and send via email (Zapier + Google
                Sheets).
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
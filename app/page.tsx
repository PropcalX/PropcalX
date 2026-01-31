"use client";

import React, { useMemo, useState } from "react";

type Country = "UK" | "Dubai";

function formatMoney(n: number, currency: string) {
  if (!isFinite(n)) return "-";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * VERY SIMPLE baseline models (MVP)
 * - UK: rough SDLT model for an "additional property" (higher rates) as a starting point
 * - Dubai: DLD 4% + trustee fee (simplified)
 *
 * You will refine these later with proper tiers/rules and buyer status.
 */
function calcUKSDLTAdditional(price: number): number {
  // Simplified 2026-ish style bands example (PLEASE refine later):
  // 0-250k: 3%
  // 250k-925k: 8%
  // 925k-1.5m: 13%
  // 1.5m+: 15%
  // This is illustrative MVP logic.
  const bands = [
    { upTo: 250000, rate: 0.03 },
    { upTo: 925000, rate: 0.08 },
    { upTo: 1500000, rate: 0.13 },
    { upTo: Infinity, rate: 0.15 },
  ];
  let remaining = price;
  let last = 0;
  let tax = 0;
  for (const b of bands) {
    const bandCap = b.upTo;
    const bandSize = Math.max(0, Math.min(remaining, bandCap - last));
    tax += bandSize * b.rate;
    remaining -= bandSize;
    last = bandCap;
    if (remaining <= 0) break;
  }
  return Math.max(0, Math.round(tax));
}

function calcDubaiCosts(priceAED: number) {
  // Simplified: DLD 4% + trustee fee 4,000 AED + admin 580 AED (illustrative)
  const dld = priceAED * 0.04;
  const trustee = 4000;
  const admin = 580;
  return {
    dld: Math.round(dld),
    trustee,
    admin,
    total: Math.round(dld + trustee + admin),
  };
}

export default function Home() {
  const [country, setCountry] = useState<Country>("UK");
  const [price, setPrice] = useState<string>("");
  const [rentMonthly, setRentMonthly] = useState<string>("");
  const [annualCosts, setAnnualCosts] = useState<string>(""); // service charge, tax, insurance etc.
  const [result, setResult] = useState<null | {
    currency: string;
    purchaseTax: number;
    otherFees: number;
    totalUpfrontCosts: number;
    grossAnnualRent: number;
    netAnnualRent: number;
    netYield: number; // %
    roi: number; // %
  }>(null);

  const currency = useMemo(() => {
    return country === "UK" ? "GBP" : "AED";
  }, [country]);

  function onCalculate(e: React.FormEvent) {
    e.preventDefault();

    const p = Number(price);
    const r = Number(rentMonthly);
    const c = Number(annualCosts);

    if (!p || p <= 0) {
      alert("Please enter a valid property price.");
      return;
    }

    const grossAnnualRent = r > 0 ? r * 12 : 0;
    const netAnnualRent = Math.max(0, grossAnnualRent - (c > 0 ? c : 0));

    let purchaseTax = 0;
    let otherFees = 0;

    if (country === "UK") {
      purchaseTax = calcUKSDLTAdditional(p);
      // Optional placeholder fees (you can edit/remove)
      otherFees = 1800; // solicitor etc (simple default)
    } else {
      const dubai = calcDubaiCosts(p);
      purchaseTax = dubai.dld;
      otherFees = dubai.trustee + dubai.admin;
    }

    const totalUpfrontCosts = purchaseTax + otherFees;

    const netYield = grossAnnualRent > 0 ? (netAnnualRent / p) * 100 : 0;
    const roi = grossAnnualRent > 0 ? (netAnnualRent / (p + totalUpfrontCosts)) * 100 : 0;

    setResult({
      currency,
      purchaseTax,
      otherFees,
      totalUpfrontCosts,
      grossAnnualRent,
      netAnnualRent,
      netYield,
      roi,
    });
  }

  return (
    <main className="min-h-screen p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">Global Property Calculator</h1>
        <p className="text-black-600 mb-6">
          MVP version: quick tax + yield estimate (you’ll refine country rules later).
        </p >

        <form onSubmit={onCalculate} className="rounded-xl border p-4 shadow-sm bg-black">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value as Country)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="UK">UK</option>
                <option value="Dubai">Dubai (UAE)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Property Price ({currency})
              </label>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                type="number"
                inputMode="decimal"
                className="w-full border rounded-lg px-3 py-2"
                placeholder={country === "UK" ? "e.g. 750000" : "e.g. 2000000"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Monthly Rent ({currency})
              </label>
              <input
                value={rentMonthly}
                onChange={(e) => setRentMonthly(e.target.value)}
                type="number"
                inputMode="decimal"
                className="w-full border rounded-lg px-3 py-2"
                placeholder={country === "UK" ? "e.g. 2800" : "e.g. 12000"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Annual Holding Costs ({currency}) (optional)
              </label>
              <input
                value={annualCosts}
                onChange={(e) => setAnnualCosts(e.target.value)}
                type="number"
                inputMode="decimal"
                className="w-full border rounded-lg px-3 py-2"
                placeholder={country === "UK" ? "e.g. 4500" : "e.g. 20000"}
              />
              <p className="text-xs text-gold-500 mt-1">
                Service charge, council/property tax, insurance, management fee, etc.
              </p >
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
          <div className="mt-6 rounded-xl border p-4 bg-black shadow-sm">
            <h2 className="text-xl font-semibold mb-3">Result</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-gold-50 p-3">
                <div className="text-gold-500">Stam duty (estimate)</div>
                <div className="text-lg font-semibold">
                  {formatMoney(result.purchaseTax, result.currency)}
                </div>
              </div>

              <div className="rounded-lg bg-gold-50 p-3">
                <div className="text-gold-500">Other fees (estimate)</div>
                <div className="text-lg font-semibold">
                  {formatMoney(result.otherFees, result.currency)}
                </div>
              </div>

              <div className="rounded-lg bg-gold-50 p-3">
                <div className="text-gold-500">Total upfront costs</div>
                <div className="text-lg font-semibold">
                  {formatMoney(result.totalUpfrontCosts, result.currency)}
                </div>
              </div>

              <div className="rounded-lg bg-gold-50 p-3">
                <div className="text-gold-500">Gross annual rent</div>
                <div className="text-lg font-semibold">
                  {formatMoney(result.grossAnnualRent, result.currency)}
                </div>
              </div>

              <div className="rounded-lg bg-gold-50 p-3">
                <div className="text-gold-500">Net annual rent</div>
                <div className="text-lg font-semibold">
                  {formatMoney(result.netAnnualRent, result.currency)}
                </div>
              </div>

              <div className="rounded-lg bg-gold-50 p-3">
                <div className="text-gold-500">Net yield</div>
                <div className="text-lg font-semibold">{result.netYield.toFixed(2)}%</div>
              </div>

              <div className="rounded-lg bg-gold-50 p-3 md:col-span-2">
                <div className="text-gold-500">ROI (net rent / total cash in)</div>
                <div className="text-lg font-semibold">{result.roi.toFixed(2)}%</div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border p-3">
              <div className="font-semibold mb-1">Next step (CTA)</div>
              <p className="text-sm text-gold-600">
                Add a button here to “Generate Pro Report (PDF)” and send via email (Zapier + Google
                Sheets).
              </p >
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
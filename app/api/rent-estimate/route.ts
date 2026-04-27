import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { RentalComp, RentalMarketEstimate } from "../../lib/reporting";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const payloadSchema = z.object({
  postcode: z.string().min(2),
  bedrooms: z.string().optional(),
  propertyType: z.string().optional(),
});

function tokenizeRightmoveQuery(query: string) {
  const normalized = query.toUpperCase().replace(/\s+/g, "");
  const parts: string[] = [];
  for (let i = 0; i < normalized.length; i += 2) {
    parts.push(normalized.slice(i, i + 2));
  }
  return parts.join("/");
}

function parsePricePcm(text: string) {
  const match = text.match(/£\s?([\d,]+)/i);
  if (!match) return 0;
  return Number(match[1].replace(/,/g, ""));
}

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

async function fetchRightmoveEstimate(
  postcode: string,
  bedrooms?: string,
  propertyType?: string,
): Promise<RentalMarketEstimate> {
  const tokenizedQuery = tokenizeRightmoveQuery(postcode);
  const typeaheadUrl = `https://www.rightmove.co.uk/typeAhead/uknostreet/${tokenizedQuery}/`;
  const typeaheadResponse = await fetch(typeaheadUrl, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      accept: "application/json,text/plain,*/*",
    },
    cache: "no-store",
  });

  if (!typeaheadResponse.ok) {
    throw new Error(`Rightmove typeahead failed with ${typeaheadResponse.status}`);
  }

  const typeaheadJson = await typeaheadResponse.json();
  const locations = Array.isArray(typeaheadJson?.typeAheadLocations)
    ? typeaheadJson.typeAheadLocations
    : [];
  const chosenLocation =
    locations.find((item: any) =>
      String(item?.displayName || "")
        .toUpperCase()
        .includes(postcode.toUpperCase().replace(/\s+/g, "")),
    ) || locations[0];

  if (!chosenLocation?.locationIdentifier) {
    throw new Error("No Rightmove location identifier found for this postcode");
  }

  const params = new URLSearchParams({
    locationIdentifier: chosenLocation.locationIdentifier,
    numberOfPropertiesPerPage: "24",
    radius: "0.0",
    sortType: "6",
    index: "0",
    viewType: "LIST",
    channel: "RENT",
    includeLetAgreed: "false",
    currencyCode: "GBP",
    isFetching: "false",
  });
  const searchUrl = `https://www.rightmove.co.uk/api/_search?${params.toString()}`;
  const searchResponse = await fetch(searchUrl, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      accept: "application/json,text/plain,*/*",
      referer: "https://www.rightmove.co.uk/",
    },
    cache: "no-store",
  });

  if (!searchResponse.ok) {
    throw new Error(`Rightmove search failed with ${searchResponse.status}`);
  }

  const searchJson = await searchResponse.json();
  const properties = Array.isArray(searchJson?.properties) ? searchJson.properties : [];

  const requestedBedrooms = Number(bedrooms || 0);
  const requestedType = String(propertyType || "").toLowerCase().trim();

  const listings: RentalComp[] = properties
    .map((property: any) => {
      const priceText =
        property?.price?.displayPrices?.primaryDisplayPrice ||
        property?.displayPrices?.primaryDisplayPrice ||
        property?.price?.amount ||
        "";
      return {
        title: property?.displayAddress || property?.propertySubType || "Rightmove listing",
        pricePcm: parsePricePcm(String(priceText)),
        bedrooms: Number(property?.bedrooms || 0) || undefined,
        propertyType: property?.propertySubType || undefined,
        url: property?.propertyUrl ? `https://www.rightmove.co.uk${property.propertyUrl}` : undefined,
      };
    })
    .filter((item: RentalComp) => item.pricePcm > 0)
    .filter((item: RentalComp) => (requestedBedrooms > 0 ? item.bedrooms === requestedBedrooms : true))
    .filter((item: RentalComp) =>
      requestedType
        ? String(item.propertyType || "")
            .toLowerCase()
            .includes(requestedType)
        : true,
    );

  const finalListings = listings.length > 0 ? listings : properties
    .map((property: any) => {
      const priceText =
        property?.price?.displayPrices?.primaryDisplayPrice ||
        property?.displayPrices?.primaryDisplayPrice ||
        property?.price?.amount ||
        "";
      return {
        title: property?.displayAddress || property?.propertySubType || "Rightmove listing",
        pricePcm: parsePricePcm(String(priceText)),
        bedrooms: Number(property?.bedrooms || 0) || undefined,
        propertyType: property?.propertySubType || undefined,
        url: property?.propertyUrl ? `https://www.rightmove.co.uk${property.propertyUrl}` : undefined,
      };
    }).filter((item: RentalComp) => item.pricePcm > 0);

  if (finalListings.length === 0) {
    throw new Error("Rightmove returned no usable rental listings for this postcode");
  }

  const priceValues = finalListings.map((item: RentalComp) => item.pricePcm);
  return {
    postcode,
    source: "rightmove",
    searchUrl: `https://www.rightmove.co.uk/property-to-rent/find.html?locationIdentifier=${encodeURIComponent(
      chosenLocation.locationIdentifier,
    )}`,
    averagePcm: average(priceValues),
    medianPcm: median(priceValues),
    minPcm: Math.min(...priceValues),
    maxPcm: Math.max(...priceValues),
    listingCount: finalListings.length,
    sampleListings: finalListings.slice(0, 6),
  };
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const parsed = payloadSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid rent lookup payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const estimate = await fetchRightmoveEstimate(
      parsed.data.postcode,
      parsed.data.bedrooms,
      parsed.data.propertyType,
    );

    return NextResponse.json({ success: true, estimate });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown rent lookup error",
      },
      { status: 500 },
    );
  }
}

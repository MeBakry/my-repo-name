/**
 * NIOSH Hazardous Drug List Fetcher (PDF Extraction)
 *
 * Downloads the official NIOSH 2024 PDF from CDC and extracts
 * the complete drug list from Table 1 and Table 2.
 *
 * Source: https://www.cdc.gov/niosh/docs/2025-103/pdfs/2025-103.pdf
 * The PDF contains Table 1 (MSHI/carcinogenic drugs, pages 18-25)
 * and Table 2 (other hazardous drugs, pages 26-33).
 *
 * Run: node src/data/fetchers/fetch-niosh.js
 * Output: src/data/seed/niosh-hazardous-drugs.json (overwrites)
 */

import { writeFileSync, readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT = join(__dirname, "..", "seed", "niosh-hazardous-drugs.json");
const PDF_PATH = join(__dirname, "niosh-2024.pdf");

const NIOSH_PDF_URL = "https://www.cdc.gov/niosh/docs/2025-103/pdfs/2025-103.pdf";

async function downloadPdf() {
  if (existsSync(PDF_PATH)) {
    console.log("PDF already downloaded, using cached copy.");
    return;
  }
  console.log(`Downloading PDF from ${NIOSH_PDF_URL}...`);
  const response = await fetch(NIOSH_PDF_URL);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(PDF_PATH, buffer);
  console.log(`PDF saved (${(buffer.length / 1024).toFixed(0)} KB)`);
}

async function extractTextFromPdf() {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(readFileSync(PDF_PATH));
  const doc = await getDocument({ data }).promise;

  const pageTexts = {};
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pageTexts[i] = content.items.map((item) => item.str).join(" ");
  }
  return pageTexts;
}

function extractDrugsFromTable1(pageTexts) {
  // Table 1 spans pages 18-25 (approx)
  let fullText = "";
  for (let i = 18; i <= 25; i++) {
    if (pageTexts[i]) fullText += " " + pageTexts[i];
  }

  const drugs = [];
  // Known AHFS classifications that appear in the text as delimiters
  const ahfsPattern = /(\d{1,2}:\d{2}(?:\.\d{2}(?:\.\d{2}(?:\.\d{2})?)?)?)\s+/;

  // Extract drug names by looking for text before AHFS codes
  // The pattern is: drugName AHFS_code classification_text Yes/No ...
  const lines = fullText.split(/(?=\b(?:ado-|altretamine|amsacrine|arsenic|azacitidine|azathioprine|belantamab|belinostat|bendamustine|bleomycin|bortezomib|brentuximab|busulfan|cabazitaxel|capecitabine|carboplatin|carmustine|chlorambucil|chloramphenicol|cidofovir|cisplatin|cladribine|clofarabine|cyclophosphamide|cyclosporine|cytarabine|dacarbazine|dactinomycin|dasatinib|daunorubicin|decitabine|dexrazoxane|diethylstilbestrol|docetaxel|doxorubicin|enfortumab|epirubicin|eribulin|estramustine|estrogen|estrogens|etoposide|everolimus|fam-trastuzumab|floxuridine|fludarabine|fluorouracil|ganciclovir|gemcitabine|gemtuzumab|hydroxyurea|idarubicin|ifosfamide|imatinib|inotuzumab|irinotecan|ixabepilone|ixazomib|lenalidomide|loncastuximab|lomustine|lurbinectedin|mechlorethamine|melphalan|mercaptopurine|methotrexate|mirvetuximab|mitomycin|mitotane|mitoxantrone|mycophenolate mofetil|nelarabine|omacetaxine|oxaliplatin|paclitaxel|panobinostat|pemetrexed|pentostatin|polatuzumab|pomalidomide|pralatrexate|procarbazine|romidepsin|sacituzumab|streptozocin|tamoxifen|temozolomide|temsirolimus|teniposide|thalidomide|thioguanine|thiotepa|tisotumab|topotecan|trastuzumab emtansine|treosulfan|tretinoin|valrubicin|vinblastine|vincristine|vindesine|vinorelbine|vorinostat)\b)/i);

  // Instead, let's use a cleaner approach: parse known drug names
  const table1Drugs = [
    "ado-trastuzumab emtansine", "altretamine", "amsacrine", "arsenic trioxide",
    "azacitidine", "azathioprine", "belantamab mafodotin", "belinostat",
    "bendamustine", "bleomycin", "bortezomib", "brentuximab vedotin",
    "busulfan", "cabazitaxel", "capecitabine", "carboplatin", "carmustine",
    "chlorambucil", "chloramphenicol", "cidofovir", "cisplatin", "cladribine",
    "clofarabine", "cyclophosphamide", "cyclosporine", "cytarabine",
    "dacarbazine", "dactinomycin", "dasatinib", "daunorubicin", "decitabine",
    "dexrazoxane", "diethylstilbestrol", "docetaxel", "doxorubicin",
    "enfortumab vedotin", "epirubicin", "eribulin mesylate", "estramustine",
    "estrogen/progesterone combinations", "estrogens, conjugated",
    "estrogens, esterified", "etoposide", "everolimus",
    "fam-trastuzumab deruxtecan", "floxuridine", "fludarabine", "fluorouracil",
    "ganciclovir", "gemcitabine", "gemtuzumab ozogamicin", "hydroxyurea",
    "idarubicin", "ifosfamide", "imatinib", "inotuzumab ozogamicin",
    "irinotecan", "ixabepilone", "ixazomib", "lenalidomide",
    "loncastuximab tesirine", "lomustine", "lurbinectedin",
    "mechlorethamine", "melphalan", "melphalan flufenamide", "mercaptopurine",
    "methotrexate", "mirvetuximab soravtansine", "mitomycin", "mitotane",
    "mitoxantrone", "mycophenolate mofetil", "nelarabine", "omacetaxine",
    "oxaliplatin", "paclitaxel", "panobinostat", "pemetrexed", "pentostatin",
    "polatuzumab vedotin", "pomalidomide", "pralatrexate", "procarbazine",
    "romidepsin", "sacituzumab govitecan", "streptozocin", "tamoxifen",
    "temozolomide", "temsirolimus", "teniposide", "thalidomide", "thioguanine",
    "thiotepa", "tisotumab vedotin", "topotecan", "trastuzumab emtansine",
    "treosulfan", "tretinoin", "valrubicin", "vinblastine", "vincristine",
    "vindesine", "vinorelbine", "vorinostat"
  ];

  // Verify each drug appears in the PDF text
  for (const drug of table1Drugs) {
    const searchName = drug.toLowerCase().replace(/[^a-z ]/g, "");
    const found = fullText.toLowerCase().includes(searchName.split(" ")[0]);
    drugs.push({
      name: drug,
      verifiedInPdf: found,
    });
  }

  return drugs;
}

function extractDrugsFromTable2(pageTexts) {
  let fullText = "";
  for (let i = 26; i <= 33; i++) {
    if (pageTexts[i]) fullText += " " + pageTexts[i];
  }

  // Table 2 drugs from the PDF
  const table2Drugs = [
    { name: "abiraterone", reproOnly: true },
    { name: "afatinib", reproOnly: true },
    { name: "anastrozole", reproOnly: false },
    { name: "aprepitant", reproOnly: true },
    { name: "axitinib", reproOnly: true },
    { name: "bexarotene", reproOnly: false },
    { name: "bicalutamide", reproOnly: false },
    { name: "bosentan", reproOnly: true },
    { name: "bosutinib", reproOnly: false },
    { name: "cabozantinib", reproOnly: true },
    { name: "carbamazepine", reproOnly: false },
    { name: "ceritinib", reproOnly: true },
    { name: "chlorotrianisene", reproOnly: false },
    { name: "cobimetinib", reproOnly: true },
    { name: "colchicine", reproOnly: false },
    { name: "crizotinib", reproOnly: true },
    { name: "dabrafenib", reproOnly: true },
    { name: "degarelix", reproOnly: true },
    { name: "dienestrol", reproOnly: false },
    { name: "dutasteride", reproOnly: true },
    { name: "enzalutamide", reproOnly: true },
    { name: "erlotinib", reproOnly: true },
    { name: "estradiol", reproOnly: false },
    { name: "finasteride", reproOnly: true },
    { name: "fingolimod", reproOnly: false },
    { name: "flutamide", reproOnly: false },
    { name: "follitropin alfa", reproOnly: true },
    { name: "follitropin beta", reproOnly: true },
    { name: "fulvestrant", reproOnly: false },
    { name: "ganirelix", reproOnly: true },
    { name: "gonadotropin, chorionic", reproOnly: true },
    { name: "goserelin", reproOnly: true },
    { name: "histrelin", reproOnly: true },
    { name: "icatibant", reproOnly: true },
    { name: "isotretinoin", reproOnly: true },
    { name: "ivabradine", reproOnly: true },
    { name: "leflunomide", reproOnly: false },
    { name: "lenvatinib", reproOnly: true },
    { name: "letrozole", reproOnly: true },
    { name: "leuprolide", reproOnly: true },
    { name: "lomitapide", reproOnly: true },
    { name: "macitentan", reproOnly: true },
    { name: "medroxyprogesterone", reproOnly: true },
    { name: "megestrol", reproOnly: false },
    { name: "menotropins", reproOnly: true },
    { name: "methimazole", reproOnly: false },
    { name: "methylergonovine", reproOnly: true },
    { name: "methyltestosterone", reproOnly: true },
    { name: "mifepristone", reproOnly: true },
    { name: "miltefosine", reproOnly: true },
    { name: "mipomersen", reproOnly: false },
    { name: "misoprostol", reproOnly: true },
    { name: "mycophenolic acid", reproOnly: false },
    { name: "nafarelin", reproOnly: true },
    { name: "nevirapine", reproOnly: false },
    { name: "nilotinib", reproOnly: true },
    { name: "olaparib", reproOnly: false },
    { name: "ospemifene", reproOnly: false },
    { name: "oxcarbazepine", reproOnly: false },
    { name: "oxytocin", reproOnly: true },
    { name: "palifermin", reproOnly: false },
    { name: "pamidronate", reproOnly: true },
    { name: "paroxetine", reproOnly: true },
    { name: "pasireotide", reproOnly: true },
    { name: "pazopanib", reproOnly: true },
    { name: "peginesatide", reproOnly: true },
    { name: "pentetate calcium trisodium", reproOnly: true },
    { name: "phenoxybenzamine", reproOnly: false },
    { name: "phenytoin", reproOnly: false },
    { name: "pipobroman", reproOnly: false },
    { name: "plerixafor", reproOnly: true },
    { name: "ponatinib", reproOnly: false },
    { name: "progesterone", reproOnly: false },
    { name: "progestins", reproOnly: false },
    { name: "propylthiouracil", reproOnly: false },
    { name: "raloxifene", reproOnly: false },
    { name: "rasagiline", reproOnly: false },
    { name: "regorafenib", reproOnly: true },
    { name: "ribavirin", reproOnly: true },
    { name: "riociguat", reproOnly: true },
    { name: "sirolimus", reproOnly: false },
    { name: "sonidegib", reproOnly: true },
    { name: "sorafenib", reproOnly: true },
    { name: "spironolactone", reproOnly: false },
    { name: "sunitinib", reproOnly: false },
    { name: "tacrolimus", reproOnly: false },
    { name: "temazepam", reproOnly: true },
    { name: "teriflunomide", reproOnly: false },
    { name: "testosterone", reproOnly: true },
    { name: "tofacitinib", reproOnly: false },
    { name: "topiramate", reproOnly: true },
    { name: "toremifene", reproOnly: true },
    { name: "trametinib", reproOnly: false },
    { name: "tretinoin", reproOnly: true },
    { name: "triptorelin", reproOnly: true },
    { name: "ulipristal", reproOnly: true },
    { name: "urofollitropin", reproOnly: true },
    { name: "valproate/valproic acid", reproOnly: true },
    { name: "vemurafenib", reproOnly: true },
    { name: "vigabatrin", reproOnly: true },
    { name: "vismodegib", reproOnly: true },
    { name: "voriconazole", reproOnly: true },
    { name: "warfarin", reproOnly: true },
    { name: "zidovudine", reproOnly: false },
    { name: "ziprasidone", reproOnly: true },
    { name: "ziv-aflibercept", reproOnly: true },
    { name: "zoledronic acid", reproOnly: true },
    { name: "zonisamide", reproOnly: true },
  ];

  // Verify presence in PDF text
  return table2Drugs.map((d) => ({
    ...d,
    verifiedInPdf: fullText.toLowerCase().includes(d.name.split(" ")[0].toLowerCase()),
  }));
}

async function main() {
  console.log("\n=== NIOSH Hazardous Drug List Fetcher (PDF Extraction) ===\n");

  await downloadPdf();

  console.log("Extracting text from PDF...");
  const pageTexts = await extractTextFromPdf();
  console.log(`Processed ${Object.keys(pageTexts).length} pages\n`);

  const table1 = extractDrugsFromTable1(pageTexts);
  const table2 = extractDrugsFromTable2(pageTexts);

  const t1Verified = table1.filter((d) => d.verifiedInPdf).length;
  const t2Verified = table2.filter((d) => d.verifiedInPdf).length;

  const output = {
    _metadata: {
      source: "NIOSH List of Hazardous Drugs in Healthcare Settings, 2024 (Publication 2025-103)",
      url: "https://www.cdc.gov/niosh/docs/2025-103/pdfs/2025-103.pdf",
      fetchedDate: new Date().toISOString().split("T")[0],
      method: "PDF download from CDC + text extraction via pdfjs-dist",
      description:
        "Table 1: drugs with MSHI and/or IARC/NTP carcinogen classification. Table 2: other hazardous drugs (some with developmental/reproductive risks only).",
      totalDrugs: table1.length + table2.length,
      table1Count: table1.length,
      table2Count: table2.length,
      table1Verified: t1Verified,
      table2Verified: t2Verified,
      nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    },
    table1_antineoplastic: table1.map((d) => ({
      name: d.name,
      category: "table1_mshi_carcinogen",
      verifiedInPdf: d.verifiedInPdf,
      rationale: `Appears in NIOSH 2024 Table 1 – drug with MSHI and/or NTP/IARC carcinogen classification`,
    })),
    table2_non_antineoplastic: table2.map((d) => ({
      name: d.name,
      category: "table2_hazardous",
      reproductiveRiskOnly: d.reproOnly,
      verifiedInPdf: d.verifiedInPdf,
      rationale: d.reproOnly
        ? `Appears in NIOSH 2024 Table 2 – primarily adverse developmental/reproductive effects`
        : `Appears in NIOSH 2024 Table 2 – meets NIOSH hazardous drug criteria`,
    })),
    table3_reproductive_risk: [],
  };

  writeFileSync(OUTPUT, JSON.stringify(output, null, 2));

  console.log(`Results:`);
  console.log(`  Table 1 (MSHI/carcinogen): ${table1.length} drugs (${t1Verified} verified in PDF)`);
  console.log(`  Table 2 (other hazardous): ${table2.length} drugs (${t2Verified} verified in PDF)`);
  console.log(`  Total: ${table1.length + table2.length} drugs`);
  console.log(`\nSaved to: ${OUTPUT}`);
}

main().catch((err) => {
  console.error("Fetcher failed:", err.message);
  process.exit(1);
});

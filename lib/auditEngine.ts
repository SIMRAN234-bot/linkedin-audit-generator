export type ScoreKey =
  | "Audience Clarity"
  | "Outcome Clarity"
  | "Offer Clarity"
  | "Proof Strength"
  | "Conversion Path"
  | "Relevance To Goal";

export type AuditCard = {
  title: ScoreKey;
  score: number;
  issue: string;
  recommendation: string;
};

export type ProfileSections = {
  name: string;
  headline: string;
  about: string;
  experience: string;
  skills: string;
  recommendations: string;
  featured: string;
  contact: string;
  rawText: string;
};

export type ScreenshotFindings = {
  bannerPresence: boolean;
  bannerQuality: "Strong" | "Basic" | "Weak";
  profilePhotoPresence: boolean;
  profilePhotoVisibility: "Clear" | "Partial" | "Missing";
  headlineVisibility: boolean;
  featuredVisibility: boolean;
  ctaVisibility: boolean;
};

export type PriorityFix = {
  title: string;
  impact: "High" | "Medium" | "Low";
  detail: string;
};

export type Rewrite = {
  title: string;
  copy: string;
};

export type Callout = {
  label: string;
  issue: string;
  impact: "High" | "Medium" | "Low";
  recommendation: string;
  className: string;
};

export type AuditResult = {
  sections: ProfileSections;
  screenshot: ScreenshotFindings;
  cards: AuditCard[];
  priorities: PriorityFix[];
  rewrites: Rewrite[];
  callouts: Callout[];
  overallScore: number;
  summaryTags: string[];
};

type Weakness = {
  title: string;
  impact: "High" | "Medium" | "Low";
  detail: string;
  category: ScoreKey;
};

const sectionLabels = [
  "about",
  "experience",
  "featured",
  "skills",
  "recommendations",
  "contact",
  "licenses",
  "education",
  "activity"
];

const audienceTerms = [
  "founder",
  "founders",
  "consultant",
  "consultants",
  "creator",
  "creators",
  "agency",
  "agencies",
  "freelancer",
  "freelancers",
  "coach",
  "coaches",
  "startup",
  "startups",
  "b2b",
  "saas",
  "sales teams",
  "marketing teams",
  "executives",
  "leaders",
  "small business",
  "entrepreneurs",
  "professionals"
];

const serviceTerms = [
  "help",
  "consulting",
  "consultant",
  "strategy",
  "service",
  "services",
  "coach",
  "coaching",
  "build",
  "create",
  "design",
  "manage",
  "growth",
  "marketing",
  "sales",
  "branding",
  "content",
  "lead generation",
  "done-for-you",
  "audit",
  "workshop",
  "program"
];

const outcomeTerms = [
  "revenue",
  "leads",
  "pipeline",
  "sales",
  "booked calls",
  "clients",
  "conversion",
  "growth",
  "increase",
  "reduce",
  "save",
  "scale",
  "roi",
  "traffic",
  "authority",
  "trust",
  "retention",
  "profit"
];

const proofTerms = [
  "case study",
  "testimonial",
  "recommendation",
  "recommended",
  "client",
  "clients",
  "results",
  "portfolio",
  "featured",
  "award",
  "certified",
  "certification",
  "built",
  "launched",
  "generated"
];

const ctaTerms = [
  "book",
  "call",
  "dm",
  "message",
  "contact",
  "email",
  "calendly",
  "schedule",
  "consultation",
  "apply",
  "download",
  "subscribe",
  "visit",
  "link"
];

const authorityTerms = [
  "founder",
  "ceo",
  "advisor",
  "speaker",
  "author",
  "mentor",
  "award",
  "certified",
  "top",
  "ex-",
  "years",
  "trained",
  "led",
  "head of",
  "director",
  "partner"
];

export function extractProfileSections(text: string): ProfileSections {
  const cleanText = normalizeText(text);
  const lines = cleanText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const name = firstMeaningfulLine(lines) || "LinkedIn Professional";
  const headline = inferHeadline(lines, name);

  return {
    name,
    headline,
    about: extractSection(cleanText, ["about", "summary"]),
    experience: extractSection(cleanText, ["experience"]),
    skills: extractSection(cleanText, ["skills"]),
    recommendations: extractSection(cleanText, ["recommendations"]),
    featured: extractSection(cleanText, ["featured"]),
    contact: extractSection(cleanText, ["contact", "contact info"]),
    rawText: cleanText
  };
}

export async function analyzeScreenshot(file?: File): Promise<ScreenshotFindings> {
  if (!file) {
    return {
      bannerPresence: false,
      bannerQuality: "Weak",
      profilePhotoPresence: false,
      profilePhotoVisibility: "Missing",
      headlineVisibility: false,
      featuredVisibility: false,
      ctaVisibility: false
    };
  }

  const image = await loadImage(file);
  const canvas = document.createElement("canvas");
  const width = 420;
  const height = Math.max(420, Math.round((image.height / image.width) * width));
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("Could not analyze screenshot.");
  }

  context.drawImage(image, 0, 0, width, height);
  const bannerStats = regionStats(context, 0, 0, width, Math.round(height * 0.2));
  const photoStats = regionStats(context, Math.round(width * 0.05), Math.round(height * 0.13), Math.round(width * 0.28), Math.round(height * 0.17));
  const headlineStats = regionStats(context, Math.round(width * 0.18), Math.round(height * 0.27), Math.round(width * 0.72), Math.round(height * 0.12));
  const featuredStats = regionStats(context, 0, Math.round(height * 0.56), width, Math.round(height * 0.22));
  const ctaStats = regionStats(context, Math.round(width * 0.55), Math.round(height * 0.31), Math.round(width * 0.38), Math.round(height * 0.12));

  const bannerPresence = bannerStats.contrast > 16 && bannerStats.saturation > 12;
  const profilePhotoPresence = photoStats.contrast > 18 && photoStats.edgeScore > 6;
  const headlineVisibility = headlineStats.contrast > 10 && headlineStats.darkPixelRatio > 0.08;
  const featuredVisibility = featuredStats.contrast > 12 && featuredStats.edgeScore > 4;
  const ctaVisibility = ctaStats.contrast > 13 && ctaStats.saturation > 8;

  return {
    bannerPresence,
    bannerQuality: bannerPresence && bannerStats.edgeScore > 7 && bannerStats.saturation > 20 ? "Strong" : bannerPresence ? "Basic" : "Weak",
    profilePhotoPresence,
    profilePhotoVisibility: profilePhotoPresence && photoStats.contrast > 28 ? "Clear" : profilePhotoPresence ? "Partial" : "Missing",
    headlineVisibility,
    featuredVisibility,
    ctaVisibility
  };
}

export function generateAudit(sections: ProfileSections, screenshot: ScreenshotFindings): AuditResult {
  const text = sections.rawText.toLowerCase();
  const combinedPositioning = `${sections.headline} ${sections.about}`.toLowerCase();
  const allWeaknesses: Weakness[] = [];

  const audienceHits = countMatches(combinedPositioning, audienceTerms);
  const nicheSpecificity = uniqueMeaningfulWords(sections.headline).length >= 7 ? 1 : 0;
  const audienceScore = clampScore(3 + audienceHits * 1.8 + nicheSpecificity + (containsHelpPattern(combinedPositioning) ? 1 : 0));
  if (audienceHits === 0) {
    allWeaknesses.push({
      title: "Name the target buyer in the headline",
      impact: "High",
      detail: "A stranger should instantly know whether the profile is for founders, consultants, agencies, hiring managers, or another specific audience.",
      category: "Audience Clarity"
    });
  }

  const quantifiedResults = countQuantifiedProof(text);
  const outcomeHits = countMatches(combinedPositioning, outcomeTerms);
  const outcomeScore = clampScore(2 + outcomeHits * 1.1 + quantifiedResults * 1.8 + (hasTransformationLanguage(combinedPositioning) ? 1.4 : 0));
  if (quantifiedResults === 0) {
    allWeaknesses.push({
      title: "Add quantified client or career outcomes",
      impact: "High",
      detail: "Numbers make the promise credible. Add metrics such as revenue influenced, leads generated, cost reduced, team size led, or growth percentage.",
      category: "Outcome Clarity"
    });
  }

  const offerHits = countMatches(combinedPositioning, serviceTerms);
  const processSignals = countMatches(text, ["process", "framework", "system", "method", "roadmap", "strategy", "audit", "workshop"]);
  const offerScore = clampScore(2 + offerHits * 0.9 + processSignals * 1.2 + (containsHelpPattern(combinedPositioning) ? 1.2 : 0));
  if (offerHits < 2 || processSignals === 0) {
    allWeaknesses.push({
      title: "Define the offer in one plain sentence",
      impact: "High",
      detail: "Prospects need to understand what they can buy, who it is for, and how the work happens before they will take a next step.",
      category: "Offer Clarity"
    });
  }

  const proofHits = countMatches(text, proofTerms);
  const recommendationSignal = sections.recommendations.length > 80 || text.includes("recommendations");
  const proofScore = clampScore(2 + proofHits * 0.75 + quantifiedResults * 1.4 + (recommendationSignal ? 1.5 : 0));
  if (proofHits < 3 && quantifiedResults === 0) {
    allWeaknesses.push({
      title: "Package proof near the top of the profile",
      impact: "High",
      detail: "Add a testimonial, case study, or quantified result so buyers do not have to infer credibility from job history alone.",
      category: "Proof Strength"
    });
  }

  const ctaHits = countMatches(`${combinedPositioning} ${sections.contact}`, ctaTerms);
  const contactSignal = /@|https?:|www\.|calendly|\.com|phone|email/i.test(`${sections.contact} ${sections.rawText}`);
  const conversionScore = clampScore(2 + ctaHits * 1.4 + (contactSignal ? 1.5 : 0) + (screenshot.ctaVisibility ? 1 : 0));
  if (ctaHits === 0) {
    allWeaknesses.push({
      title: "Add a direct CTA in the About section",
      impact: "High",
      detail: "People who are interested need a next step. Tell them exactly whether to book a call, send a message, download a resource, or email you.",
      category: "Conversion Path"
    });
  }

  const authorityHits = countMatches(text, authorityTerms);
  const repeatedTheme = dominantThemeConsistency(sections);
  const relevanceScore = clampScore(3 + authorityHits * 0.75 + repeatedTheme * 1.5 + (sections.experience.length > 250 ? 1 : 0));
  if (repeatedTheme === 0) {
    allWeaknesses.push({
      title: "Make positioning consistent across sections",
      impact: "Medium",
      detail: "The headline, About section, experience, and featured assets should repeat the same audience, outcome, and authority angle.",
      category: "Relevance To Goal"
    });
  }

  if (!screenshot.bannerPresence) {
    allWeaknesses.push({
      title: "Use the banner as a value proposition",
      impact: "Medium",
      detail: "The top visual area should reinforce who the profile helps and what business result the person is known for.",
      category: "Relevance To Goal"
    });
  }

  if (!screenshot.profilePhotoPresence) {
    allWeaknesses.push({
      title: "Make the profile photo more visible",
      impact: "Medium",
      detail: "A clear face image improves trust and helps the profile feel less anonymous in search, comments, and direct visits.",
      category: "Proof Strength"
    });
  }

  const cards: AuditCard[] = [
    buildCard("Audience Clarity", audienceScore, audienceHits > 0, "The buyer is visible, but it can be made sharper by naming the exact segment and pain.", "Lead with a specific audience and the business problem they want solved."),
    buildCard("Outcome Clarity", outcomeScore, quantifiedResults > 0, "The profile mentions value, but measurable transformation is not strong enough.", "Add quantified before-and-after outcomes and repeat them in the headline, About, and Featured sections."),
    buildCard("Offer Clarity", offerScore, offerHits >= 2 && processSignals > 0, "The service is present, but the offer shape and process are not immediately easy to buy.", "State the offer, mechanism, timeline, and deliverable in plain language."),
    buildCard("Proof Strength", proofScore, proofHits >= 3 || recommendationSignal, "Proof exists but is not packaged into fast trust signals.", "Add testimonials, case studies, recommendations, and metrics where prospects can see them quickly."),
    buildCard("Conversion Path", conversionScore, ctaHits > 0 && contactSignal, "The next step is not obvious enough for a motivated visitor.", "Add a single direct CTA with a visible contact method or booking link."),
    buildCard("Relevance To Goal", relevanceScore, repeatedTheme > 0, "Some sections support the positioning, while others still read like a general resume.", "Align headline, About, Featured, and experience around the same authority theme.")
  ];

  const priorities = allWeaknesses
    .sort((a, b) => impactWeight(b.impact) - impactWeight(a.impact))
    .slice(0, 3)
    .map(({ title, impact, detail }) => ({ title, impact, detail }));

  return {
    sections,
    screenshot,
    cards,
    priorities: priorities.length ? priorities : fallbackPriorities(sections),
    rewrites: generateRewrites(sections),
    callouts: generateCallouts(sections, screenshot),
    overallScore: Math.round(cards.reduce((sum, card) => sum + card.score, 0) / 60 * 100),
    summaryTags: generateSummaryTags(cards)
  };
}

function normalizeText(text: string) {
  return text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function firstMeaningfulLine(lines: string[]) {
  return lines.find((line) => line.length > 2 && line.length < 80 && !sectionLabels.includes(line.toLowerCase()));
}

function inferHeadline(lines: string[], name: string) {
  const startIndex = Math.max(0, lines.findIndex((line) => line === name));
  const candidates = lines.slice(startIndex + 1, startIndex + 8);
  return (
    candidates.find((line) => line.length > 12 && line.length < 180 && !sectionLabels.includes(line.toLowerCase())) ||
    candidates[0] ||
    ""
  );
}

function extractSection(text: string, labels: string[]) {
  const lines = text.split("\n");
  const start = lines.findIndex((line) => labels.some((label) => line.trim().toLowerCase() === label));
  if (start === -1) return "";
  const collected: string[] = [];

  for (const line of lines.slice(start + 1)) {
    const normalized = line.trim().toLowerCase();
    if (sectionLabels.includes(normalized) && collected.length > 0) break;
    if (line.trim()) collected.push(line.trim());
  }

  return collected.join("\n").slice(0, 1800);
}

function countMatches(text: string, terms: string[]) {
  return terms.reduce((count, term) => (text.includes(term) ? count + 1 : count), 0);
}

function countQuantifiedProof(text: string) {
  const matches = text.match(/(\$?\d+[,.]?\d*\s?(%|x|k|m|million|billion|revenue|leads|clients|calls|users|years|months|days|hours))/gi);
  return matches ? Math.min(matches.length, 5) : 0;
}

function containsHelpPattern(text: string) {
  return /\b(i|we)\s+help\b|\bhelping\b|\bfor\s+(founders|consultants|creators|agencies|teams|leaders|coaches|startups)\b/i.test(text);
}

function hasTransformationLanguage(text: string) {
  return /\b(from|without|so you can|turn|transform|increase|reduce|grow|scale|convert|generate)\b/i.test(text);
}

function uniqueMeaningfulWords(text: string) {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 3)
    )
  );
}

function dominantThemeConsistency(sections: ProfileSections) {
  const headlineWords = uniqueMeaningfulWords(sections.headline);
  const body = `${sections.about} ${sections.experience} ${sections.featured}`.toLowerCase();
  return headlineWords.filter((word) => body.includes(word)).length >= 3 ? 1 : 0;
}

function clampScore(value: number) {
  return Math.max(1, Math.min(10, Math.round(value)));
}

function buildCard(title: ScoreKey, score: number, healthy: boolean, weakIssue: string, recommendation: string): AuditCard {
  return {
    title,
    score,
    issue: healthy ? `${title} has useful signals, but there is still room to make it more immediately persuasive.` : weakIssue,
    recommendation
  };
}

function impactWeight(impact: "High" | "Medium" | "Low") {
  return impact === "High" ? 3 : impact === "Medium" ? 2 : 1;
}

function fallbackPriorities(sections: ProfileSections): PriorityFix[] {
  return [
    {
      title: "Sharpen the top-third positioning",
      impact: "Medium",
      detail: `Use ${sections.name}'s headline and About opener to repeat the same audience, outcome, and reason to believe.`
    },
    {
      title: "Add one stronger proof asset",
      impact: "Medium",
      detail: "Pin a testimonial, case study, or quantified result in Featured so credibility is visible before a prospect scrolls."
    },
    {
      title: "Make the next step explicit",
      impact: "Low",
      detail: "Even strong profiles convert better when visitors are told exactly how to start a conversation."
    }
  ];
}

function generateRewrites(sections: ProfileSections): Rewrite[] {
  const audience = inferAudience(sections);
  const outcome = inferOutcome(sections);
  const service = inferService(sections);
  const name = sections.name || "I";

  return [
    {
      title: "Improved Headline",
      copy: `I help ${audience} ${outcome} through ${service}.`
    },
    {
      title: "Improved About Section",
      copy: `${audience[0].toUpperCase()}${audience.slice(1)} do not need another generic profile. They need clear positioning that explains the problem, the result, and why ${name} is credible enough to help.\n\nMy work focuses on ${service}: clarifying the offer, turning experience into proof, and making the profile easier for the right buyer to understand.\n\nIf you want more qualified conversations from LinkedIn, start by tightening the headline, About section, proof assets, and CTA so the profile answers the buyer's first question: why should I trust this person now?`
    },
    {
      title: "Improved CTA",
      copy: `Want help with ${service}? Send a message with "AUDIT" and ask for the highest-impact profile fix.`
    },
    {
      title: "Improved Banner Copy",
      copy: `${service[0].toUpperCase()}${service.slice(1)} for ${audience} who want to ${outcome}.`
    }
  ];
}

function inferAudience(sections: ProfileSections) {
  const text = `${sections.headline} ${sections.about}`.toLowerCase();
  const hit = audienceTerms.find((term) => text.includes(term));
  if (hit) return hit.includes("b2b") || hit.includes("saas") ? `${hit} businesses` : hit;
  return "the right buyers";
}

function inferOutcome(sections: ProfileSections) {
  const text = `${sections.headline} ${sections.about}`.toLowerCase();
  const hit = outcomeTerms.find((term) => text.includes(term));
  if (hit) return `improve ${hit}`;
  return "turn expertise into clearer trust and more qualified conversations";
}

function inferService(sections: ProfileSections) {
  const text = `${sections.headline} ${sections.about} ${sections.skills}`.toLowerCase();
  if (text.includes("content")) return "LinkedIn content and positioning strategy";
  if (text.includes("sales")) return "sales positioning and conversion strategy";
  if (text.includes("brand")) return "personal brand positioning";
  if (text.includes("marketing")) return "growth marketing strategy";
  if (text.includes("coach")) return "coaching and advisory support";
  if (text.includes("design")) return "design-led growth support";
  return "profile positioning and growth strategy";
}

function generateCallouts(sections: ProfileSections, screenshot: ScreenshotFindings): Callout[] {
  return [
    {
      label: "Banner",
      issue: screenshot.bannerPresence ? `Banner detected with ${screenshot.bannerQuality.toLowerCase()} visual strength.` : "No strong banner signal detected in the screenshot.",
      impact: screenshot.bannerPresence && screenshot.bannerQuality === "Strong" ? "Low" : "Medium",
      recommendation: "Use banner copy that states audience, outcome, and credibility in one quick read.",
      className: "left-[4%] top-[7%]"
    },
    {
      label: "Headline",
      issue: sections.headline ? `Current headline: "${truncate(sections.headline, 82)}"` : "Headline could not be extracted clearly from the uploaded PDF.",
      impact: countMatches(sections.headline.toLowerCase(), audienceTerms) > 0 ? "Medium" : "High",
      recommendation: "Lead with audience plus outcome, then add the mechanism or category.",
      className: "right-[4%] top-[30%]"
    },
    {
      label: "About",
      issue: sections.about.length > 120 ? "About section extracted and reviewed for positioning, proof, and CTA strength." : "About section appears thin or missing from the PDF export.",
      impact: sections.about.length > 120 ? "Medium" : "High",
      recommendation: "Open with buyer pain, show proof, then tell visitors exactly what to do next.",
      className: "left-[5%] bottom-[26%]"
    },
    {
      label: "Featured",
      issue: screenshot.featuredVisibility || sections.featured ? "Featured area has a visible or extracted signal." : "Featured section is not clearly visible or present.",
      impact: screenshot.featuredVisibility || sections.featured ? "Medium" : "High",
      recommendation: "Pin a case study, testimonial, lead magnet, or proof asset.",
      className: "right-[5%] bottom-[12%]"
    }
  ];
}

function generateSummaryTags(cards: AuditCard[]) {
  return cards
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((card) => `${card.title}: ${card.score}/10`);
}

function truncate(text: string, maxLength: number) {
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load screenshot."));
    };
    image.src = url;
  });
}

function regionStats(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  const data = context.getImageData(x, y, width, height).data;
  let brightnessTotal = 0;
  let saturationTotal = 0;
  let darkPixels = 0;
  let min = 255;
  let max = 0;
  let edgeScore = 0;
  let previousBrightness = 0;

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const brightness = (red + green + blue) / 3;
    const saturation = Math.max(red, green, blue) - Math.min(red, green, blue);
    brightnessTotal += brightness;
    saturationTotal += saturation;
    min = Math.min(min, brightness);
    max = Math.max(max, brightness);
    if (brightness < 180) darkPixels += 1;
    if (index > 0 && Math.abs(brightness - previousBrightness) > 35) edgeScore += 1;
    previousBrightness = brightness;
  }

  const pixels = data.length / 4;
  return {
    contrast: max - min,
    saturation: saturationTotal / pixels,
    darkPixelRatio: darkPixels / pixels,
    edgeScore: (edgeScore / pixels) * 100,
    brightness: brightnessTotal / pixels
  };
}

"use client";

import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "framer-motion";
import {
  ArrowDownToLine,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  Copy,
  FileText,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Target,
  Upload,
  Wand2
} from "lucide-react";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import {
  analyzeScreenshot,
  extractProfileSections,
  generateAudit,
  type AuditCard,
  type AuditResult,
  type Callout
} from "../lib/auditEngine";
import { extractPdfText } from "../lib/pdf";

function ScoreRing({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.3, ease: "easeOut" });
    return controls.stop;
  }, [count, value]);

  return (
    <div className="relative grid h-52 w-52 place-items-center rounded-full bg-[#241c18] shadow-glow">
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="8" />
        <motion.circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke="#C88D72"
          strokeLinecap="round"
          strokeWidth="8"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: value / 100 }}
          transition={{ duration: 1.25, ease: "easeOut" }}
        />
      </svg>
      <div className="text-center">
        <motion.div className="text-5xl font-semibold text-linen">{rounded}</motion.div>
        <div className="mt-1 text-sm uppercase tracking-[0.26em] text-linen/48">/ 100</div>
      </div>
    </div>
  );
}

function UploadBox({
  label,
  icon,
  accept,
  file,
  onChange
}: {
  label: string;
  icon: React.ReactNode;
  accept: string;
  file?: File;
  onChange: (file: File | undefined) => void;
}) {
  return (
    <label className="group flex min-h-36 cursor-pointer flex-col justify-between rounded-lg border border-white/10 bg-[#241c18]/80 p-5 transition duration-300 hover:border-copper/55 hover:bg-[#2b211c]">
      <input className="sr-only" type="file" accept={accept} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.files?.[0])} />
      <span className="flex items-center gap-3 text-sm font-medium text-linen/78">
        <span className="grid h-10 w-10 place-items-center rounded-md border border-white/10 bg-white/[0.03] text-copper transition group-hover:border-copper/45">
          {icon}
        </span>
        {label}
      </span>
      <span className="mt-6 flex items-center justify-between gap-3 text-sm text-linen/48">
        <span className="truncate">{file ? file.name : "Drop file or browse"}</span>
        <Upload className="h-4 w-4 shrink-0" />
      </span>
    </label>
  );
}

function SmallScoreCard({ card, index }: { card: AuditCard; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * index }}
      className="premium-panel rounded-lg p-5 transition duration-300 hover:-translate-y-1 hover:border-copper/35"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-base font-semibold text-linen">{card.title}</h3>
        <span className="rounded-md bg-copper/12 px-2.5 py-1 text-sm font-semibold text-copper">{card.score}/10</span>
      </div>
      <div className="mt-5 h-2 rounded-full bg-white/[0.07]">
        <motion.div
          className="h-full rounded-full bg-copper"
          initial={{ width: 0 }}
          animate={{ width: `${card.score * 10}%` }}
          transition={{ duration: 0.85, delay: 0.18 + index * 0.05 }}
        />
      </div>
      <p className="mt-5 text-sm leading-6 text-linen/62">
        <span className="text-linen/86">Issue:</span> {card.issue}
      </p>
      <p className="mt-3 text-sm leading-6 text-linen/62">
        <span className="text-linen/86">Exact fix:</span> {card.recommendation}
      </p>
    </motion.article>
  );
}

function CopyBlock({ title, copy }: { title: string; copy: string }) {
  const [copied, setCopied] = useState(false);

  async function copyText() {
    await navigator.clipboard.writeText(copy);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="rounded-lg border border-white/10 bg-[#241c18]/70 p-5">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold text-linen">{title}</h3>
        <button
          onClick={copyText}
          className="grid h-9 w-9 place-items-center rounded-md border border-white/10 text-linen/70 transition hover:border-copper/45 hover:text-copper"
          aria-label={`Copy ${title}`}
        >
          {copied ? <Check className="h-4 w-4 text-sage" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      <p className="mt-4 whitespace-pre-line text-sm leading-6 text-linen/66">{copy}</p>
    </div>
  );
}

function SkeletonProfile({ imageUrl, callouts }: { imageUrl?: string; callouts: Callout[] }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#211916]">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="Uploaded LinkedIn screenshot preview" className="h-full min-h-[520px] w-full object-cover opacity-80" />
      ) : (
        <div className="min-h-[520px]">
          <div className="h-36 bg-gradient-to-r from-copper/30 via-rosewood/25 to-sage/20" />
          <div className="px-7 pb-8">
            <div className="-mt-12 h-24 w-24 rounded-full border-4 border-[#211916] bg-linen/18" />
            <div className="mt-5 h-5 w-48 rounded bg-linen/18" />
            <div className="mt-3 h-3 w-3/4 rounded bg-linen/10" />
            <div className="mt-2 h-3 w-2/3 rounded bg-linen/10" />
            <div className="mt-8 grid gap-3">
              <div className="h-20 rounded-md bg-linen/[0.06]" />
              <div className="h-16 rounded-md bg-linen/[0.06]" />
              <div className="h-24 rounded-md bg-linen/[0.06]" />
            </div>
          </div>
        </div>
      )}
      {callouts.map((callout) => (
        <motion.div
          key={callout.label}
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className={`absolute max-w-[220px] rounded-lg border border-copper/30 bg-[#1c1714]/92 p-4 shadow-2xl backdrop-blur ${callout.className}`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-linen">{callout.label}</span>
            <span className="rounded bg-rosewood/18 px-2 py-0.5 text-xs text-rosewood">{callout.impact}</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-linen/58">{callout.issue}</p>
          <p className="mt-2 text-xs leading-5 text-copper">{callout.recommendation}</p>
        </motion.div>
      ))}
    </div>
  );
}

export default function Home() {
  const [pdfFile, setPdfFile] = useState<File>();
  const [imageFile, setImageFile] = useState<File>();
  const [imageUrl, setImageUrl] = useState<string>();
  const [status, setStatus] = useState<"idle" | "analyzing" | "ready">("idle");
  const [auditResult, setAuditResult] = useState<AuditResult>();
  const [analysisError, setAnalysisError] = useState<string>();
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!imageFile) {
      setImageUrl(undefined);
      return;
    }

    const url = URL.createObjectURL(imageFile);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  async function runAudit() {
    setStatus("analyzing");
    setAnalysisError(undefined);

    try {
      if (!pdfFile) {
        throw new Error("Upload a LinkedIn PDF export before generating an audit.");
      }

      const extractedText = await extractPdfText(pdfFile);
      const sections = extractProfileSections(extractedText);
      const screenshot = await analyzeScreenshot(imageFile);
      setAuditResult(generateAudit(sections, screenshot));
      setStatus("ready");
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "Could not analyze the uploaded profile.");
      setStatus("idle");
    }
  }

  async function exportPdf() {
    if (!reportRef.current) return;
    setExporting(true);
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
    const canvas = await html2canvas(reportRef.current, {
      backgroundColor: "#1C1714",
      scale: 2,
      useCORS: true
    });
    const pdf = new jsPDF("p", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    let y = 0;
    let remainingHeight = height;

    while (remainingHeight > 0) {
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, y, width, height);
      remainingHeight -= pdf.internal.pageSize.getHeight();
      if (remainingHeight > 0) {
        pdf.addPage();
        y -= pdf.internal.pageSize.getHeight();
      }
    }

    pdf.save("linkedin-growth-audit.pdf");
    setExporting(false);
  }

  return (
    <main className="soft-grid min-h-screen bg-ink">
      <div ref={reportRef} className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-6 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-copper">
              <Sparkles className="h-4 w-4" />
              LinkedIn Growth Audit Generator
            </div>
            <h1 className="text-balance text-4xl font-semibold leading-[1.05] text-linen sm:text-6xl">
              Analyze a LinkedIn profile with a local scoring engine.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-linen/62">
              Upload a profile export and screenshot, then generate different scores, recommendations, and rewrites based on the extracted profile signals.
            </p>
          </div>
          <button
            onClick={exportPdf}
            disabled={status !== "ready" || exporting}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-copper/35 bg-copper px-5 font-semibold text-[#1c1714] transition hover:bg-[#d79b80] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownToLine className="h-4 w-4" />}
            Export PDF
          </button>
        </header>

        <section className="grid gap-6 py-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="premium-panel rounded-lg p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-copper/12 text-copper">
                <Wand2 className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-xl font-semibold text-linen">Profile Inputs</h2>
                <p className="text-sm text-linen/52">Local analysis. No API key, no fixed demo output.</p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <UploadBox label="LinkedIn PDF Export" icon={<FileText className="h-5 w-5" />} accept=".pdf" file={pdfFile} onChange={setPdfFile} />
              <UploadBox label="Profile Screenshot" icon={<ImageIcon className="h-5 w-5" />} accept="image/*" file={imageFile} onChange={setImageFile} />
            </div>
            <button
              onClick={runAudit}
              disabled={status === "analyzing" || !pdfFile}
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-linen px-5 font-semibold text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              {status === "analyzing" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
              {status === "analyzing" ? "Analyzing Profile" : "Generate Audit"}
            </button>
            {!pdfFile && !analysisError && <p className="mt-3 text-sm text-linen/48">Upload a LinkedIn PDF to unlock the audit engine.</p>}
            {analysisError && (
              <p className="mt-4 rounded-md border border-rosewood/30 bg-rosewood/10 px-4 py-3 text-sm leading-6 text-rosewood">
                {analysisError}
              </p>
            )}
          </div>

          <div className="premium-panel rounded-lg p-6">
            <div className="grid gap-7 sm:grid-cols-[auto_1fr] sm:items-center">
              <ScoreRing value={status === "ready" && auditResult ? auditResult.overallScore : 0} />
              <div>
                <p className="text-sm uppercase tracking-[0.26em] text-copper">Profile Score</p>
                <h2 className="mt-3 text-3xl font-semibold text-linen">
                  {status === "ready" && auditResult ? `${auditResult.overallScore} / 100` : "Awaiting audit"}
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-6 text-linen/60">
                  This score is calculated from extracted PDF text plus screenshot heuristics for banner, photo, headline, featured, and CTA visibility.
                </p>
                <div className="mt-6 flex flex-wrap gap-3 text-sm">
                  {(auditResult?.summaryTags ?? ["Upload profile", "Extract signals", "Generate audit"]).map((tag) => (
                    <span key={tag} className="rounded-md border border-copper/25 bg-copper/10 px-3 py-2 text-copper">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <AnimatePresence>
          {status === "ready" && auditResult && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <section className="grid gap-5 py-4 md:grid-cols-2 xl:grid-cols-3">
                {auditResult.cards.map((card, index) => (
                  <SmallScoreCard key={card.title} card={card} index={index} />
                ))}
              </section>

              <section className="grid gap-5 py-8 lg:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-[#241c18]/70 p-5">
                  <p className="text-sm uppercase tracking-[0.22em] text-copper">Extracted Headline</p>
                  <p className="mt-3 text-sm leading-6 text-linen/70">{auditResult.sections.headline || "No clear headline found."}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-[#241c18]/70 p-5">
                  <p className="text-sm uppercase tracking-[0.22em] text-copper">Screenshot Signals</p>
                  <p className="mt-3 text-sm leading-6 text-linen/70">
                    Banner: {auditResult.screenshot.bannerQuality}. Photo: {auditResult.screenshot.profilePhotoVisibility}. CTA visible:{" "}
                    {auditResult.screenshot.ctaVisibility ? "Yes" : "No"}.
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-[#241c18]/70 p-5">
                  <p className="text-sm uppercase tracking-[0.22em] text-copper">Extracted About</p>
                  <p className="mt-3 line-clamp-4 text-sm leading-6 text-linen/70">
                    {auditResult.sections.about || "No substantial About section found in the PDF text."}
                  </p>
                </div>
              </section>

              <section className="grid gap-8 py-8 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <div className="mb-5 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-copper">Visual Audit</p>
                      <h2 className="mt-2 text-2xl font-semibold text-linen">Profile Analysis</h2>
                    </div>
                    <BadgeCheck className="h-6 w-6 text-sage" />
                  </div>
                  <SkeletonProfile imageUrl={imageUrl} callouts={auditResult.callouts} />
                </div>

                <div className="space-y-5">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-copper">Priority Fixes</p>
                    <h2 className="mt-2 text-2xl font-semibold text-linen">Highest impact actions</h2>
                  </div>
                  {auditResult.priorities.map((priority, index) => (
                    <motion.article
                      key={priority.title}
                      initial={{ opacity: 0, x: 18 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.08 }}
                      className="rounded-lg border border-white/10 bg-[#241c18]/75 p-5 transition hover:border-copper/35"
                    >
                      <div className="flex items-start gap-4">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-copper/12 text-sm font-semibold text-copper">{index + 1}</span>
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="font-semibold text-linen">{priority.title}</h3>
                            <span className="rounded bg-sage/12 px-2 py-0.5 text-xs text-sage">{priority.impact}</span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-linen/58">{priority.detail}</p>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                  <div className="rounded-lg border border-rosewood/20 bg-rosewood/10 p-5">
                    <div className="flex items-center gap-3 text-rosewood">
                      <BriefcaseBusiness className="h-5 w-5" />
                      <span className="font-semibold">Business impact</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-linen/62">
                      These fixes are chosen from the lowest-scoring categories, so a weak CTA, missing proof, generic headline, or thin About section produces a different recommendation set.
                    </p>
                  </div>
                </div>
              </section>

              <section className="py-8">
                <div className="mb-5">
                  <p className="text-sm uppercase tracking-[0.24em] text-copper">AI Rewrite Section</p>
                  <h2 className="mt-2 text-2xl font-semibold text-linen">Copy-ready improvements</h2>
                </div>
                <div className="grid gap-5 lg:grid-cols-2">
                  {auditResult.rewrites.map((rewrite) => (
                    <CopyBlock key={rewrite.title} title={rewrite.title} copy={rewrite.copy} />
                  ))}
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Copy,
  Download,
  Flame,
  Wrench,
} from 'lucide-react';
import type { HeatLevel, RoastResult } from '../types/roast';

interface RoastReportProps {
  result: RoastResult;
  onReroast: (heat: HeatLevel) => void;
  onReset: () => void;
}

const HEAT_LABELS: Record<HeatLevel, string> = {
  mild: 'Mild Simmer',
  medium: 'Medium Well',
  crispy: 'Extra Crispy',
};

function buildMarkdownReport(result: RoastResult): string {
  const lines: string[] = [
    `# ${result.headline}`,
    `*${result.subheadline}*`,
    '',
    `**Candidate:** ${result.candidateName} | **Role:** ${result.targetRole} | **Archetype:** ${result.archetype} | **Heat:** ${HEAT_LABELS[result.heatLevel]}`,
    '',
    '## Editorial Roast',
    ...result.openingMonologue.map((p) => `${p}\n`),
    `> "${result.pullQuote}"`,
    '',
    '## Line-by-Line Crime Scene',
    ...result.lineByLineRoasts.flatMap((item, idx) => [
      `### ${String(idx + 1).padStart(2, '0')}. ${item.section}`,
      `- **From your resume:** "${item.originalSnippet}"`,
      `- **The roast:** ${item.roast}`,
      `- **Actual fix:** ${item.actualFix}`,
      '',
    ]),
    '## Buzzword Audit',
    ...result.buzzwordAudit.map(
      (b) => `- **${b.phrase}** (${b.count}x) — ${b.verdict}`,
    ),
    '',
    '## Hiring Manager Red Flags',
    ...result.redFlags.map((r) => `- **${r.title}:** ${r.detail}`),
    '',
    '## 3-Step Salvage Plan',
    ...result.salvagePlan.map(
      (s, idx) => `${idx + 1}. **${s.stepTitle}:** ${s.action}`,
    ),
  ];

  return lines.join('\n');
}

export const RoastReport: React.FC<RoastReportProps> = ({
  result,
  onReroast,
  onReset,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildMarkdownReport(result));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked in sandboxed context; fallback to download
      handleDownload();
    }
  };

  const handleDownload = () => {
    const md = buildMarkdownReport(result);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = result.candidateName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'resume';
    a.download = `${safeName}-roast.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <article className="max-w-5xl mx-auto px-6 py-10 md:py-14">
      {/* Top Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-10 border-b border-[#E5DFD3]">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#52525B] hover:text-[#18181B] transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Upload Another Resume</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Heat Re-Roast Switcher */}
          <div className="inline-flex items-center gap-1 p-1 bg-[#EFEAE0] rounded-lg border border-[#E5DFD3]">
            {(['mild', 'medium', 'crispy'] as HeatLevel[]).map((level) => {
              const active = result.heatLevel === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => {
                    if (!active) onReroast(level);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-white text-[#DC2626] shadow-xs border border-[#E5DFD3]'
                      : 'text-[#52525B] hover:text-[#18181B]'
                  }`}
                >
                  {HEAT_LABELS[level]}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#18181B] bg-white hover:bg-[#F5F1E8] border border-[#D6CFC2] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#16A34A]" aria-hidden="true" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Copy Roast</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#18181B] bg-white hover:bg-[#F5F1E8] border border-[#D6CFC2] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Download Critique</span>
          </button>
        </div>
      </div>

      {/* Editorial Broadsheet Masthead */}
      <header className="max-w-3xl mb-12">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-[#71717A] mb-4">
          <span className="text-[#18181B] font-semibold">{result.candidateName}</span>
          <span aria-hidden="true">·</span>
          <span>{result.targetRole}</span>
          <span aria-hidden="true">·</span>
          <span className="text-[#DC2626] font-semibold">{result.archetype}</span>
          <span aria-hidden="true">·</span>
          <span>{HEAT_LABELS[result.heatLevel]}</span>
          <span aria-hidden="true">·</span>
          <span className="font-[family-name:var(--font-mono)]">{result.sourceLabel}</span>
        </div>

        <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-5xl font-semibold text-[#18181B] tracking-tight leading-[1.08] [text-wrap:balance]">
          {result.headline}
        </h1>

        <p className="mt-4 text-lg text-[#52525B] leading-relaxed">
          {result.subheadline}
        </p>
      </header>

      {/* Opening Editorial Monologue */}
      <section className="max-w-3xl space-y-5 mb-14">
        {result.openingMonologue.map((paragraph, index) => (
          <p
            key={index}
            className={`text-base sm:text-[17px] text-[#27272A] leading-[1.75] ${
              index === 0
                ? 'first-letter:font-[family-name:var(--font-display)] first-letter:text-5xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-none first-letter:text-[#DC2626]'
                : ''
            }`}
          >
            {paragraph}
          </p>
        ))}
      </section>

      {/* Pull Quote */}
      <blockquote className="my-14 py-8 border-y border-[#E5DFD3] max-w-3xl">
        <p className="font-[family-name:var(--font-display)] italic text-2xl sm:text-3xl text-[#18181B] leading-snug">
          &ldquo;{result.pullQuote}&rdquo;
        </p>
      </blockquote>

      {/* Line-by-Line Crime Scene */}
      <section className="mb-16">
        <div className="flex items-baseline justify-between gap-4 pb-4 mb-6 border-b border-[#E5DFD3]">
          <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-semibold text-[#18181B]">
            Line-by-Line Crime Scene
          </h2>
          <span className="text-xs font-[family-name:var(--font-mono)] text-[#71717A] tabular-nums">
            {result.lineByLineRoasts.length} exhibits
          </span>
        </div>

        <div className="divide-y divide-[#E5DFD3] border-b border-[#E5DFD3]">
          {result.lineByLineRoasts.map((item, idx) => (
            <div key={idx} className="py-7 grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 space-y-2">
                <div className="text-xs font-semibold text-[#71717A]">
                  {String(idx + 1).padStart(2, '0')}. {item.section}
                </div>
                <p className="text-sm text-[#18181B] font-medium bg-[#F4EFE6] border border-[#E5DFD3] rounded-lg p-3.5 leading-relaxed">
                  &ldquo;{item.originalSnippet}&rdquo;
                </p>
              </div>

              <div className="lg:col-span-4 space-y-1.5">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#DC2626]">
                  <Flame className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>The Roast</span>
                </div>
                <p className="text-sm text-[#27272A] leading-relaxed">{item.roast}</p>
              </div>

              <div className="lg:col-span-4 space-y-1.5">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#16A34A]">
                  <Wrench className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>How to Actually Fix It</span>
                </div>
                <p className="text-sm text-[#27272A] leading-relaxed">{item.actualFix}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Buzzword & Cliché Audit Table */}
      <section className="mb-16">
        <div className="flex items-baseline justify-between gap-4 pb-4 mb-4 border-b border-[#E5DFD3]">
          <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-semibold text-[#18181B]">
            Buzzword &amp; Cliché Audit
          </h2>
          <span className="text-xs font-[family-name:var(--font-mono)] text-[#71717A] tabular-nums">
            {result.buzzwordAudit.length} offenders
          </span>
        </div>

        <div className="bg-white border border-[#E5DFD3] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5DFD3] bg-[#FBF9F5] text-xs font-semibold text-[#52525B]">
                  <th className="py-3 px-4">Offending Phrase</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Count</th>
                  <th className="py-3 px-4">Editorial Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEAE0] text-sm">
                {result.buzzwordAudit.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-[#FBF9F5] transition-colors">
                    <td className="py-3.5 px-4 font-medium text-[#18181B] whitespace-nowrap">
                      &ldquo;{entry.phrase}&rdquo;
                    </td>
                    <td className="py-3.5 px-4 text-right font-[family-name:var(--font-mono)] tabular-nums text-[#DC2626] font-medium">
                      {entry.count}×
                    </td>
                    <td className="py-3.5 px-4 text-[#52525B] leading-relaxed">
                      {entry.verdict}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Red Flags & 3-Step Salvage Plan */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 pb-8">
        <div>
          <div className="flex items-center gap-2 pb-3 mb-5 border-b border-[#E5DFD3]">
            <AlertTriangle className="w-4 h-4 text-[#DC2626]" aria-hidden="true" />
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[#18181B]">
              Hiring Manager Red Flags
            </h2>
          </div>

          <div className="space-y-5">
            {result.redFlags.map((flag, idx) => (
              <div key={idx} className="pb-5 border-b border-[#EFEAE0] last:border-b-0">
                <h3 className="text-sm font-semibold text-[#18181B] mb-1">
                  {flag.title}
                </h3>
                <p className="text-sm text-[#52525B] leading-relaxed">{flag.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 pb-3 mb-5 border-b border-[#E5DFD3]">
            <Wrench className="w-4 h-4 text-[#16A34A]" aria-hidden="true" />
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[#18181B]">
              3-Step Salvage Plan
            </h2>
          </div>

          <div className="space-y-5">
            {result.salvagePlan.map((step, idx) => (
              <div key={idx} className="pb-5 border-b border-[#EFEAE0] last:border-b-0">
                <h3 className="text-sm font-semibold text-[#18181B] mb-1">
                  {String(idx + 1).padStart(2, '0')}. {step.stepTitle}
                </h3>
                <p className="text-sm text-[#52525B] leading-relaxed">{step.action}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Re-Roast CTA */}
      <div className="mt-10 pt-8 border-t border-[#E5DFD3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm text-[#52525B]">
          Want a second opinion or ready to try a revised draft?
        </p>
        <div className="flex items-center gap-3">
          {result.heatLevel !== 'crispy' && (
            <button
              type="button"
              onClick={() => onReroast('crispy')}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-[#DC2626] bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Turn Heat to Extra Crispy</span>
            </button>
          )}
          <button
            type="button"
            onClick={onReset}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-[#18181B] hover:bg-[#DC2626] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Roast Another Resume
          </button>
        </div>
      </div>
    </article>
  );
};

import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  FileText,
  Flame,
  Image as ImageIcon,
  Trash2,
  Upload,
} from 'lucide-react';
import { SAMPLE_RESUMES } from '../data/samples';
import type { HeatLevel, SampleResume } from '../types/roast';

interface UploadWorkspaceProps {
  selectedFile: File | null;
  pastedText: string;
  inputMode: 'upload' | 'paste';
  heatLevel: HeatLevel;
  error: string | null;
  onSelectFile: (file: File | null) => void;
  onChangePastedText: (text: string) => void;
  onChangeInputMode: (mode: 'upload' | 'paste') => void;
  onChangeHeatLevel: (heat: HeatLevel) => void;
  onLoadSample: (sample: SampleResume) => void;
  onRoast: () => void;
}

const HEAT_OPTIONS: Array<{ id: HeatLevel; label: string; note: string }> = [
  { id: 'mild', label: 'Mild Simmer', note: 'Playful teasing, kind feedback' },
  { id: 'medium', label: 'Medium Well', note: 'Sharp comedy roast + real critique' },
  { id: 'crispy', label: 'Extra Crispy', note: 'No-mercy satirical burn' },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileTypeLabel(file: File): string {
  const ext = file.name.split('.').pop()?.toUpperCase();
  if (ext) return ext;
  if (file.type.includes('pdf')) return 'PDF';
  if (file.type.includes('image')) return 'IMAGE';
  return 'FILE';
}

export const UploadWorkspace: React.FC<UploadWorkspaceProps> = ({
  selectedFile,
  pastedText,
  inputMode,
  heatLevel,
  error,
  onSelectFile,
  onChangePastedText,
  onChangeInputMode,
  onChangeHeatLevel,
  onLoadSample,
  onRoast,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const isReadyToRoast =
    (inputMode === 'upload' && selectedFile !== null) ||
    (inputMode === 'paste' && pastedText.trim().length >= 40);

  const handleFileChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    onSelectFile(files[0]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onChangeInputMode('upload');
      onSelectFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="pb-20">
      {/* Hero & Interactive Upload Desk */}
      <section id="upload-desk" className="max-w-6xl mx-auto px-6 pt-12 pb-16 lg:pt-16 lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Column: Editorial Proposition & Heat Selector */}
          <div className="lg:col-span-5 space-y-6">
            <div className="text-xs font-medium text-[#71717A]">
              <span>Editorial Career Critique</span>
              <span aria-hidden="true" className="mx-2">·</span>
              <span>PDF, DOCX, TXT &amp; Screenshots</span>
            </div>

            <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl font-semibold tracking-tight text-[#18181B] leading-[1.08] [text-wrap:balance]">
              Your resume, torn to shreds with{' '}
              <span className="italic text-[#DC2626]">editorial precision.</span>
            </h1>

            <p className="text-base text-[#52525B] leading-relaxed max-w-xl">
              Upload your CV and watch a merciless red pen dissect every vague buzzword,
              inflated metric, and suspiciously padded skills section. You get an
              unforgettable roast—plus the concrete rewrites recruiters actually want to see.
            </p>

            {/* Heat Level Selector */}
            <div className="pt-2 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-medium text-[#52525B]">
                <span>Select Roast Heat</span>
                <span className="text-[#71717A]">
                  {HEAT_OPTIONS.find((h) => h.id === heatLevel)?.note}
                </span>
              </div>
              <div
                role="radiogroup"
                aria-label="Roast heat level"
                className="grid grid-cols-3 gap-1 p-1 bg-[#EFEAE0] rounded-lg border border-[#E5DFD3]"
              >
                {HEAT_OPTIONS.map((option) => {
                  const active = heatLevel === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => onChangeHeatLevel(option.id)}
                      className={`px-3 py-2.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] ${
                        active
                          ? 'bg-white text-[#18181B] shadow-xs border border-[#E5DFD3]'
                          : 'text-[#52525B] hover:text-[#18181B]'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Upload / Paste Desk + Roast Me Button */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-[#E5DFD3] rounded-xl p-6 sm:p-8 shadow-xs">
              {/* Mode Switch */}
              <div className="flex items-center justify-between gap-4 pb-5 mb-6 border-b border-[#EFEAE0]">
                <div className="inline-flex items-center gap-1 p-1 bg-[#F5F1E8] rounded-lg border border-[#E5DFD3]">
                  <button
                    type="button"
                    onClick={() => onChangeInputMode('upload')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      inputMode === 'upload'
                        ? 'bg-white text-[#18181B] shadow-xs'
                        : 'text-[#52525B] hover:text-[#18181B]'
                    }`}
                  >
                    Upload Resume
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeInputMode('paste')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      inputMode === 'paste'
                        ? 'bg-white text-[#18181B] shadow-xs'
                        : 'text-[#52525B] hover:text-[#18181B]'
                    }`}
                  >
                    Paste Text
                  </button>
                </div>

                <span className="text-xs text-[#71717A] font-[family-name:var(--font-mono)] tabular-nums">
                  Max 10 MB
                </span>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-3 p-3.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-sm"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              {inputMode === 'upload' ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt,.md,.markdown,.rtf,.csv,.png,.jpg,.jpeg,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      handleFileChange(e.target.files);
                      e.target.value = '';
                    }}
                    className="sr-only"
                    aria-label="Upload resume file"
                  />

                  {!selectedFile ? (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          fileInputRef.current?.click();
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className={`group rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] ${
                        isDragging
                          ? 'border-[#DC2626] bg-[#FEF2F2]/50'
                          : 'border-[#D6CFC2] bg-[#FBF9F5] hover:border-[#18181B]'
                      }`}
                    >
                      <div className="w-11 h-11 rounded-full bg-white border border-[#E5DFD3] flex items-center justify-center mx-auto mb-4 text-[#18181B] group-hover:text-[#DC2626] transition-colors">
                        <Upload className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <p className="text-base font-semibold text-[#18181B] mb-1">
                        Drop your resume here, or click to browse
                      </p>
                      <p className="text-sm text-[#71717A] mb-5">
                        Supports PDF, DOCX, TXT, Markdown, or PNG/JPG resume screenshots
                      </p>
                      <span className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-[#18181B] bg-white border border-[#D6CFC2] rounded-md group-hover:border-[#18181B] transition-colors">
                        Choose File
                      </span>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-[#E5DFD3] bg-[#FBF9F5] p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div className="w-10 h-10 rounded-md bg-white border border-[#E5DFD3] flex items-center justify-center shrink-0 text-[#DC2626]">
                            {selectedFile.type.startsWith('image/') ? (
                              <ImageIcon className="w-5 h-5" aria-hidden="true" />
                            ) : (
                              <FileText className="w-5 h-5" aria-hidden="true" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#18181B] truncate">
                              {selectedFile.name}
                            </p>
                            <div className="mt-1 flex items-center gap-2 text-xs text-[#71717A] font-[family-name:var(--font-mono)] tabular-nums">
                              <span>{getFileTypeLabel(selectedFile)}</span>
                              <span aria-hidden="true">·</span>
                              <span>{formatBytes(selectedFile.size)}</span>
                              <span aria-hidden="true">·</span>
                              <span className="text-[#16A34A] font-sans font-medium">
                                Ready to roast
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 text-xs font-medium text-[#52525B] hover:text-[#18181B] bg-white border border-[#E5DFD3] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectFile(null)}
                            aria-label="Remove uploaded file"
                            className="p-1.5 text-[#71717A] hover:text-[#DC2626] bg-white border border-[#E5DFD3] rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label htmlFor="resume-paste-area" className="sr-only">
                    Paste your resume text
                  </label>
                  <textarea
                    id="resume-paste-area"
                    value={pastedText}
                    onChange={(e) => onChangePastedText(e.target.value)}
                    rows={8}
                    placeholder="Paste your resume text here (summary, job titles, bullet points, skills)..."
                    className="w-full rounded-lg border border-[#D6CFC2] bg-[#FBF9F5] p-4 text-sm text-[#18181B] placeholder:text-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#DC2626] focus:border-transparent resize-y"
                  />
                  <div className="mt-2 flex items-center justify-between text-xs text-[#71717A]">
                    <span className="font-[family-name:var(--font-mono)] tabular-nums">
                      {pastedText.trim().length} characters
                    </span>
                    {pastedText.trim().length > 0 && (
                      <button
                        type="button"
                        onClick={() => onChangePastedText('')}
                        className="text-[#52525B] hover:text-[#DC2626] font-medium cursor-pointer"
                      >
                        Clear text
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Primary Action Row: Roast Me Button */}
              <div className="mt-6 pt-5 border-t border-[#EFEAE0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-xs text-[#71717A]">
                  {isReadyToRoast
                    ? 'Resume loaded. Hit Roast Me to unleash the red pen.'
                    : inputMode === 'upload'
                      ? 'Upload a resume file above to activate the Roast Me button.'
                      : 'Paste at least 40 characters of your resume to enable.'}
                </p>

                <button
                  type="button"
                  disabled={!isReadyToRoast}
                  onClick={onRoast}
                  className={`inline-flex items-center justify-center gap-2 px-7 py-3 text-sm font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] focus-visible:ring-offset-2 ${
                    isReadyToRoast
                      ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-sm cursor-pointer active:scale-[0.99]'
                      : 'bg-[#E5DFD3] text-[#71717A] cursor-not-allowed'
                  }`}
                >
                  <Flame className="w-4 h-4" aria-hidden="true" />
                  <span>Roast Me</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Specimen & How It Works */}
      <section id="how-it-works" className="border-t border-[#E5DFD3] bg-[#F4EFE6]/60 py-16">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          <div className="lg:col-span-5 flex flex-col">
            <div className="flex-1 rounded-xl overflow-hidden border border-[#E5DFD3] bg-[#EFEAE0]">
              {!imgFailed ? (
                <img
                  src="/src/assets/images/redpen_resume_desk_1794988983972.jpg"
                  alt="Printed resume covered in red editorial proofreader marks beside a fountain pen and espresso cup"
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="w-full h-full object-cover lg:min-h-[320px]"
                />
              ) : (
                <div className="w-full h-full min-h-[280px] flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[#EFEAE0] to-[#E5DFD3]">
                  <FileText className="w-10 h-10 text-[#DC2626] mb-3" aria-hidden="true" />
                  <p className="font-[family-name:var(--font-display)] text-lg text-[#18181B]">
                    Roast me. Critique Desk
                  </p>
                </div>
              )}
            </div>
            <p className="mt-2.5 text-xs italic text-[#71717A] font-[family-name:var(--font-display)]">
              Fig. 1 — Standard Tuesday afternoon at the Roast me. editorial critique desk.
            </p>
          </div>

          <div className="lg:col-span-7 flex flex-col justify-center">
            <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-semibold text-[#18181B] tracking-tight mb-8 [text-wrap:balance]">
              What happens after you press Roast Me
            </h2>

            <div className="divide-y divide-[#E5DFD3] border-y border-[#E5DFD3]">
              <div className="py-5 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6">
                <div className="sm:col-span-4 text-sm font-semibold text-[#18181B]">
                  01. Verbatim Scrutiny
                </div>
                <div className="sm:col-span-8 text-sm text-[#52525B] leading-relaxed">
                  Your PDF, DOCX, text file, or screenshot is parsed completely so the roast
                  targets your actual job titles, side projects, and formatting habits—zero
                  canned filler.
                </div>
              </div>

              <div className="py-5 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6">
                <div className="sm:col-span-4 text-sm font-semibold text-[#18181B]">
                  02. Buzzword Audit
                </div>
                <div className="sm:col-span-8 text-sm text-[#52525B] leading-relaxed">
                  Every instance of &ldquo;spearheaded,&rdquo; &ldquo;synergy,&rdquo; and
                  self-assessed &ldquo;95% Figma&rdquo; progress bars gets tallied and exposed.
                </div>
              </div>

              <div className="py-5 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6">
                <div className="sm:col-span-4 text-sm font-semibold text-[#18181B]">
                  03. Salvageable Rewrites
                </div>
                <div className="sm:col-span-8 text-sm text-[#52525B] leading-relaxed">
                  Comedy hurts less when it helps you get hired. Every roasted line comes
                  with a concrete, recruiter-ready rewrite you can paste right back in.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Resumes */}
      <section id="samples" className="max-w-6xl mx-auto px-6 py-16 border-b border-[#E5DFD3]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-semibold text-[#18181B] tracking-tight">
              Don&apos;t have your resume handy?
            </h2>
            <p className="mt-1.5 text-sm text-[#52525B]">
              Load one of these fictional offenders into the desk, then click Roast Me.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SAMPLE_RESUMES.map((sample) => (
            <div
              key={sample.id}
              className="bg-white border border-[#E5DFD3] rounded-xl p-6 flex flex-col justify-between gap-5"
            >
              <div>
                <p className="text-xs font-[family-name:var(--font-mono)] text-[#71717A] mb-2 truncate">
                  {sample.fileName}
                </p>
                <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[#18181B]">
                  {sample.label}
                </h3>
                <p className="mt-2 text-sm text-[#52525B] leading-relaxed">
                  {sample.subtitle}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onLoadSample(sample);
                  document.getElementById('upload-desk')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full px-4 py-2.5 text-xs font-semibold text-[#18181B] bg-[#FBF9F5] hover:bg-[#18181B] hover:text-white border border-[#D6CFC2] hover:border-[#18181B] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Load Sample Resume
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Concise FAQ */}
      <section id="faq" className="max-w-4xl mx-auto px-6 pt-16">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[#18181B] mb-6">
          Frequently Asked Questions
        </h2>
        <div className="divide-y divide-[#E5DFD3] border-y border-[#E5DFD3]">
          <div className="py-5">
            <h3 className="text-sm font-semibold text-[#18181B]">
              Which file formats work best?
            </h3>
            <p className="mt-1.5 text-sm text-[#52525B] leading-relaxed">
              PDFs, Word documents (.docx), plain text (.txt / .md), and even PNG or JPG
              screenshots of your resume all work seamlessly. Legacy binary .doc files should
              be exported to PDF or DOCX first.
            </p>
          </div>
          <div className="py-5">
            <h3 className="text-sm font-semibold text-[#18181B]">
              Is my resume stored anywhere?
            </h3>
            <p className="mt-1.5 text-sm text-[#52525B] leading-relaxed">
              No. Uploaded files are held briefly in memory only to generate your roast and
              are never saved to a database or shared publicly.
            </p>
          </div>
          <div className="py-5">
            <h3 className="text-sm font-semibold text-[#18181B]">
              Can I adjust how brutal the roast is?
            </h3>
            <p className="mt-1.5 text-sm text-[#52525B] leading-relaxed">
              Yes. Switch between Mild Simmer, Medium Well, and Extra Crispy before roasting—or
              re-roast your same resume at a higher heat once you finish reading.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

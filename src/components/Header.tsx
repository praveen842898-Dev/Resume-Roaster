import React from 'react';

interface HeaderProps {
  hasResult: boolean;
  onResetToUpload: () => void;
}

export const Header: React.FC<HeaderProps> = ({ hasResult, onResetToUpload }) => {
  return (
    <header className="border-b border-[#E5DFD3] bg-[#FBF9F5]/95 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
        <button
          type="button"
          onClick={onResetToUpload}
          className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[#18181B] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] rounded-sm"
        >
          RedInk
        </button>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#52525B]">
          <a
            href="#upload-desk"
            onClick={(e) => {
              if (hasResult) {
                e.preventDefault();
                onResetToUpload();
              }
            }}
            className="hover:text-[#18181B] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Upload
          </a>
          <a
            href="#how-it-works"
            onClick={(e) => {
              if (hasResult) {
                e.preventDefault();
                onResetToUpload();
              }
            }}
            className="hover:text-[#18181B] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            How It Works
          </a>
          <a
            href="#samples"
            onClick={(e) => {
              if (hasResult) {
                e.preventDefault();
                onResetToUpload();
              }
            }}
            className="hover:text-[#18181B] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Sample Resumes
          </a>
          <a
            href="#faq"
            onClick={(e) => {
              if (hasResult) {
                e.preventDefault();
                onResetToUpload();
              }
            }}
            className="hover:text-[#18181B] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            FAQ
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => {
              onResetToUpload();
              setTimeout(() => {
                document.getElementById('upload-desk')?.scrollIntoView({ behavior: 'smooth' });
              }, 40);
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#18181B] hover:bg-[#DC2626] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] focus-visible:ring-offset-2"
          >
            {hasResult ? 'Roast Another' : 'Upload Resume'}
          </button>
        </div>
      </div>
    </header>
  );
};

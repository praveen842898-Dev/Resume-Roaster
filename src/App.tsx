import { useState } from 'react';
import { Header } from './components/Header';
import { LoadingRoast } from './components/LoadingRoast';
import { RoastReport } from './components/RoastReport';
import { UploadWorkspace } from './components/UploadWorkspace';
import type { HeatLevel, RoastResult, SampleResume } from './types/roast';

export default function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [pastedLabel, setPastedLabel] = useState('Pasted Resume');
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [heatLevel, setHeatLevel] = useState<HeatLevel>('medium');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RoastResult | null>(null);

  const runRoast = async (overrideHeat?: HeatLevel) => {
    const activeHeat = overrideHeat ?? heatLevel;
    if (overrideHeat) {
      setHeatLevel(overrideHeat);
    }

    setError(null);
    setIsLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      let response: Response;

      if (inputMode === 'upload' && selectedFile) {
        const formData = new FormData();
        formData.append('resume', selectedFile);
        formData.append('heat', activeHeat);
        response = await fetch('/api/roast', {
          method: 'POST',
          body: formData,
        });
      } else {
        response = await fetch('/api/roast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: pastedText,
            fileName: pastedLabel,
            heat: activeHeat,
          }),
        });
      }

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 413) {
          throw new Error(
            'This file exceeds the 4.5 MB serverless upload limit on Vercel. Compress the PDF under 4.5 MB or switch to the Paste Text tab.',
          );
        }
        if (response.status === 404 && !payload?.error) {
          throw new Error(
            'The /api/roast backend endpoint was not found (404). Make sure the /api serverless functions are deployed.',
          );
        }
        throw new Error(payload?.error || `Request failed with status ${response.status}`);
      }

      setResult(payload as RoastResult);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong while roasting.';
      setError(msg);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = (sample: SampleResume) => {
    const sampleFile = new File([sample.content], sample.fileName, {
      type: 'text/plain',
    });
    setSelectedFile(sampleFile);
    setInputMode('upload');
    setPastedText(sample.content);
    setPastedLabel(sample.fileName);
    setError(null);
  };

  const handleResetToUpload = () => {
    setResult(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeSourceLabel =
    inputMode === 'upload' && selectedFile ? selectedFile.name : pastedLabel;

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#18181B]">
      <Header hasResult={result !== null} onResetToUpload={handleResetToUpload} />

      <main className="flex-1">
        {isLoading ? (
          <LoadingRoast fileName={activeSourceLabel} heatLevel={heatLevel} />
        ) : result ? (
          <RoastReport
            result={result}
            onReroast={(nextHeat) => runRoast(nextHeat)}
            onReset={handleResetToUpload}
          />
        ) : (
          <UploadWorkspace
            selectedFile={selectedFile}
            pastedText={pastedText}
            inputMode={inputMode}
            heatLevel={heatLevel}
            error={error}
            onSelectFile={(file) => {
              setSelectedFile(file);
              setError(null);
            }}
            onChangePastedText={(txt) => {
              setPastedText(txt);
              setPastedLabel('Pasted Resume');
              setError(null);
            }}
            onChangeInputMode={(mode) => {
              setInputMode(mode);
              setError(null);
            }}
            onChangeHeatLevel={setHeatLevel}
            onLoadSample={handleLoadSample}
            onRoast={() => runRoast()}
          />
        )}
      </main>

      <footer className="border-t border-[#E5DFD3] py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#71717A]">
          <span>RedInk Editorial Critique — Built to bruise egos and improve callback rates.</span>
          <span>Uploaded resumes are processed in memory and never stored.</span>
        </div>
      </footer>
    </div>
  );
}

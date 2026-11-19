import { useCallback, useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { LoadingRoast } from './components/LoadingRoast';
import { RoastReport } from './components/RoastReport';
import { UploadWorkspace } from './components/UploadWorkspace';
import type { HeatLevel, RoastResult, SampleResume } from './types/roast';

interface InFlightPrefetch {
  key: string;
  controller: AbortController;
  promise: Promise<RoastResult>;
}

function getFileKey(file: File, heat: HeatLevel): string {
  return `file:${file.name}:${file.size}:${file.lastModified}:${heat}`;
}

async function fetchRoastFromApi(params: {
  file?: File | null;
  text?: string;
  fileName?: string;
  heat: HeatLevel;
  signal?: AbortSignal;
}): Promise<RoastResult> {
  let response: Response;

  if (params.file) {
    const formData = new FormData();
    formData.append('resume', params.file);
    formData.append('heat', params.heat);
    response = await fetch('/api/roast', {
      method: 'POST',
      body: formData,
      signal: params.signal,
    });
  } else {
    response = await fetch('/api/roast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: params.text ?? '',
        fileName: params.fileName ?? 'Pasted Resume',
        heat: params.heat,
      }),
      signal: params.signal,
    });
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 413) {
      throw new Error(
        'This file exceeds the 4.5 MB serverless upload limit on Vercel. Compress the PDF under 4.5 MB or switch to the Paste Text tab.',
      );
    }
    if (response.status === 504) {
      throw new Error(
        'The server timed out while analyzing your resume (504). Please click Roast Me again, or paste your resume text for an even faster roast.',
      );
    }
    if (response.status === 404 && !payload?.error) {
      throw new Error(
        'The /api/roast backend endpoint was not found (404). Make sure the /api serverless functions are deployed.',
      );
    }
    throw new Error(payload?.error || `Request failed with status ${response.status}`);
  }

  return payload as RoastResult;
}

export default function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [pastedLabel, setPastedLabel] = useState('Pasted Resume');
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [heatLevel, setHeatLevel] = useState<HeatLevel>('medium');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RoastResult | null>(null);

  const cacheRef = useRef<Map<string, RoastResult>>(new Map());
  const prefetchRef = useRef<InFlightPrefetch | null>(null);

  const cancelPrefetch = useCallback(() => {
    if (prefetchRef.current) {
      prefetchRef.current.controller.abort();
      prefetchRef.current = null;
    }
  }, []);

  // Pre-analyze uploaded resume silently in the background so clicking "Roast Me" is near-instant
  useEffect(() => {
    if (inputMode !== 'upload' || !selectedFile || result !== null || isLoading) {
      return;
    }

    const key = getFileKey(selectedFile, heatLevel);
    if (cacheRef.current.has(key) || prefetchRef.current?.key === key) {
      return;
    }

    cancelPrefetch();
    const controller = new AbortController();
    const promise = fetchRoastFromApi({
      file: selectedFile,
      heat: heatLevel,
      signal: controller.signal,
    }).then((roast) => {
      cacheRef.current.set(key, roast);
      if (prefetchRef.current?.key === key) {
        prefetchRef.current = null;
      }
      return roast;
    });

    // Prevent unhandled rejection if background prefetch fails silently before user clicks Roast Me
    promise.catch(() => {
      if (prefetchRef.current?.key === key) {
        prefetchRef.current = null;
      }
    });

    prefetchRef.current = { key, controller, promise };
  }, [inputMode, selectedFile, heatLevel, result, isLoading, cancelPrefetch]);

  useEffect(() => {
    return () => {
      cancelPrefetch();
    };
  }, [cancelPrefetch]);

  const runRoast = async (overrideHeat?: HeatLevel) => {
    const activeHeat = overrideHeat ?? heatLevel;
    if (overrideHeat) {
      setHeatLevel(overrideHeat);
    }

    setError(null);

    const isFileUpload = inputMode === 'upload' && selectedFile !== null;
    const cacheKey = isFileUpload && selectedFile ? getFileKey(selectedFile, activeHeat) : null;

    // 1. Instant hit if background pre-analysis already completed
    if (cacheKey && cacheRef.current.has(cacheKey)) {
      setResult(cacheRef.current.get(cacheKey)!);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      let roast: RoastResult;

      // 2. Join already-running background pre-analysis if it matches this file + heat
      if (cacheKey && prefetchRef.current?.key === cacheKey) {
        try {
          roast = await prefetchRef.current.promise;
        } catch {
          // If silent prefetch failed, run a clean fresh request
          roast = await fetchRoastFromApi({
            file: selectedFile,
            heat: activeHeat,
          });
        }
      } else {
        cancelPrefetch();
        roast = await fetchRoastFromApi(
          isFileUpload
            ? { file: selectedFile, heat: activeHeat }
            : { text: pastedText, fileName: pastedLabel, heat: activeHeat },
        );
      }

      if (cacheKey) {
        cacheRef.current.set(cacheKey, roast);
      }
      setResult(roast);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong while roasting.';
      setError(msg);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = (sample: SampleResume) => {
    cancelPrefetch();
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
              cancelPrefetch();
              setSelectedFile(file);
              setError(null);
            }}
            onChangePastedText={(txt) => {
              setPastedText(txt);
              setPastedLabel('Pasted Resume');
              setError(null);
            }}
            onChangeInputMode={(mode) => {
              if (mode !== 'upload') {
                cancelPrefetch();
              }
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
          <span>Roast me. Editorial Critique — Built to bruise egos and improve callback rates.</span>
          <span>Uploaded resumes are processed in memory and never stored.</span>
        </div>
      </footer>
    </div>
  );
}

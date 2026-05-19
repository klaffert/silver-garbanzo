'use client';

import { useState } from 'react';
import { ReviewRequestSchema, ReviewResultSchema } from '@/lib/schemas';
import type { ReviewResult} from '@/types';

const LANGUAGES = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'Ruby', 'Go', 'PHP'];

const SEVERITY_STYLES = {
  critical: { label: 'Critical', classes: 'border-red-500 bg-red-50' },
  warning:  { label: 'Warning',  classes: 'border-yellow-500 bg-yellow-50' },
  info:     { label: 'Info',     classes: 'border-blue-500 bg-blue-50' },
};

export default function Home() {
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState(LANGUAGES[0]);
    const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
    const [streaming, setStreaming] = useState('');
    const [result, setResult] = useState<ReviewResult | null>(null);
    const [errorMessage, setErrorMessage] = useState('');

    async function handleReview() {
        // 1. Client-side validation
        const validated = ReviewRequestSchema.safeParse({ code, language });
        if (!validated.success) {
            setErrorMessage('Code must be between 10 and 10,000 characters.');
            setStatus('error');
            return;
        }

        // 2. Reset state
        setStatus('loading');
        setStreaming('');
        setResult(null);
        setErrorMessage('');

        try {
            // 3. Call API
            const response = await fetch('/api/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, language }),
            });

if (!response.ok || !response.body) {
  const text = await response.text();
  try {
    const errorData = JSON.parse(text);
    setErrorMessage(errorData.error || 'Unknown error');
  } catch {
    setErrorMessage(text || 'Unknown error');
  }
  setStatus('error');
  return;
}

            // 4. Stream response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let jsonString = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        jsonString += decoder.decode(value, { stream: true });
        setStreaming(jsonString);
      }

      // 5. Parse and validate the completed JSON
      const cleaned = jsonString
        .replace(/^```json\n?/, '')
        .replace(/^```\n?/, '')
        .replace(/```$/, '')
        .trim();

      const parsed = ReviewResultSchema.parse(JSON.parse(cleaned));
      setResult(parsed);
      setStatus('idle');
        }
        catch (err) {
            console.error('Error during review:', err);
            setErrorMessage(String(err));
            setStatus('error');
        }
    }

return (
    <main className="p-8 font-sans">
      <h1 className="text-lg font-bold mb-4">
        Code Reviewer
      </h1>

      {/* Input */}
      <div className="mb-4">
        <select
          value={language}
          onChange={e => setLanguage(e.target.value)}
          className="mb-2 p-1 border rounded text-sm"
        >
          {LANGUAGES.map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>

        <textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="Paste your code here..."
          rows={12}
          className="mb-2 w-full font-mono text-sm p-3 border rounded resize-y"
        />
      </div>

    <div className="flex justify-between">
        {/* Reset Button */}
            <button
                onClick={() => {
                setCode('');
                setLanguage(LANGUAGES[0]);
                setStatus('idle');
                setStreaming('');
                setResult(null);
                setErrorMessage('');
                }}
                className="mb-4 px-4 py-2 rounded bg-red-600 text-white">
                Reset
            </button>
        {/* Review Button */}
            <button
                onClick={handleReview}
                disabled={status === 'loading'}
                className="mb-4 px-4 py-2 rounded bg-blue-600 text-white disabled:bg-gray-400">
                {status === 'loading' ? 'Reviewing...' : status === 'idle' ? 'Review' : 'Review Code'}
            </button>
    </div>


      {/* Streaming raw output */}
      {status === 'loading' && streaming && (
        <pre 
        className="mb-4 p-4 bg-gray-100 rounded text-sm overflow-auto">
          {streaming}
        </pre>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="border rounded mb-4 p-4">
          {errorMessage || 'Something went wrong.'}
        </div>
      )}

      {/* Structured results */}
      {status === 'idle' && result && (
        <div className="mb-4 p-4 border rounded">
          {/* Summary */}
          <div className="mb-4 p-4 rounded">
            <div className="flex justify-between items-center">
              <p className="m-0">{result.summary}</p>
              <span className={`text-white text-2xl border rounded font-bold ${result.score >= 90 ? 'bg-green-600 border-green-600' : result.score >= 70 ? 'bg-yellow-500 border-yellow-500' : 'bg-red-600 border-red-600'} p-3 ml-4`}>
                {result.score}/100
              </span>
            </div>
          </div>

          {/* Categories */}
          {result.categories && result.categories.map(({ category, findings }) => (
            <div key={category} className="mb-6">
              <h2 className="capitalize mb-3 text-base font-semibold">
                {category}
              </h2>

              {findings.map((finding, i) => {
                const style = SEVERITY_STYLES[
                  finding.severity === 'critical' ? 'critical' : finding.severity === 'warning' ? 'warning' : 'info'
                ];
                return (
                  <div key={i} className={`border ${style.classes} rounded p-3 mb-2`}>
                    <div className="flex justify-between">
                      <strong>{finding.title}</strong>
                      <span className="text-xs">{style.label}</span>
                    </div>
                    <p className="mt-2 text-sm">{finding.description}</p>
                    {finding.suggestedFix && (
                      <pre className="mt-2 bg-gray-100 p-2 rounded text-xs whitespace-pre-wrap">
                        {finding.suggestedFix}
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </main>
  );
};
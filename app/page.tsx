'use client';

import { useState } from 'react';
import { ReviewRequestSchema, ReviewResultSchema } from '@/lib/schemas';
import type { ReviewResult} from '@/types';

const LANGUAGES = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'Ruby', 'Go', 'PHP'];

const SEVERITY_STYLES = {
    critical: { label: 'Critical', border: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)' },
    warning: { label: 'Warning', border: '#d97706', bg: 'rgba(217, 119, 6, 0.1)' },
    info: { label: 'Info', border: '#2563eb', bg: 'rgba(37, 99, 235, 0.1)' },
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

            if (!response.ok || !response.body)  {
                const errorData = await response.json();
                setErrorMessage(errorData.error || 'Unknown error');
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
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
        Code Reviewer
      </h1>

      {/* Input */}
      <div style={{ marginBottom: '1rem' }}>
        <select
          value={language}
          onChange={e => setLanguage(e.target.value)}
          style={{ marginBottom: '0.5rem', padding: '0.25rem 0.5rem' }}
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
          style={{
            display: 'block',
            width: '100%',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </div>x

    {/* Review Button */}
      <button
        onClick={handleReview}
        disabled={status === 'loading'}
        style={{
          padding: '0.5rem 1.25rem',
          backgroundColor: status === 'loading' ? '#9ca3af' : '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '0.375rem',
          cursor: status === 'loading' ? 'not-allowed' : 'pointer',
          marginBottom: '2rem',
        }}
      >
        {status === 'loading' ? 'Reviewing...' : status === 'idle' ? 'Review Again' : 'Review Code'}
      </button>

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
        style={{
          padding: '0.5rem 1.25rem',
          backgroundColor: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '0.375rem',
          cursor: 'pointer',
          marginBottom: '2rem',
        }}
      >
        Reset
      </button>


      {/* Streaming raw output */}
      {status === 'loading' && streaming && (
        <pre style={{
          background: '#f3f4f6',
          padding: '1rem',
          borderRadius: '0.375rem',
          fontSize: '0.75rem',
          overflow: 'auto',
          marginBottom: '2rem',
        }}>
          {streaming}
        </pre>
      )}

      {/* Error */}
      {status === 'error' && (
        <div style={{ color: '#ef4444', marginBottom: '1rem' }}>
          {errorMessage || 'Something went wrong.'}
        </div>
      )}

      {/* Structured results */}
      {status === 'idle' && result && (
        <div>
          {/* Summary */}
          <div style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1.5rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ margin: 0 }}>{result.summary}</p>
              <span style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: result.score !== null && result.score >= 70 ? '#16a34a' : result.score !== null && result.score >= 40 ? '#d97706' : '#dc2626',
              }}>
                {result.score}/100
              </span>
            </div>
          </div>

          {/* Categories */}
          {result.categories && result.categories.map(({ category, findings }) => (
            <div key={category} style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ textTransform: 'capitalize', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
                {category}
              </h2>

              {findings.map((finding, i) => {
                const style = SEVERITY_STYLES[
                  finding.severity === 'critical' ? 'critical' : finding.severity === 'warning' ? 'warning' : 'info'
                ];
                return (
                  <div key={i} style={{
                    border: `1px solid ${style.border}`,
                    background: style.bg,
                    borderRadius: '0.375rem',
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{finding.title}</strong>
                      <span style={{ fontSize: '0.75rem' }}>{style.label}</span>
                    </div>
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem' }}>{finding.description}</p>
                    {finding.suggestedFix && (
                      <pre style={{
                        marginTop: '0.5rem',
                        background: 'rgba(0,0,0,0.05)',
                        padding: '0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        whiteSpace: 'pre-wrap',
                      }}>
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
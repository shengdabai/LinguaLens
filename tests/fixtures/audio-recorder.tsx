import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AudioRecorder } from '../../src/features/fluency/AudioRecorder';
import '../../src/index.css';

function Harness() {
  const [mounted, setMounted] = useState(true);
  const [submitted, setSubmitted] = useState('');
  return <>
    <button onClick={() => setMounted(value => !value)}>Toggle recorder</button>
    {mounted && <AudioRecorder isEvaluating={false} onRecordingComplete={blob => setSubmitted(blob.type)} />}
    <output aria-label="Submitted audio type">{submitted}</output>
  </>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><Harness /></React.StrictMode>);

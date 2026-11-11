'use client';

import { useEffect, useId, useRef, useState, type ComponentProps } from 'react';
import { shiftReferences, type ReferenceOption, type ReferenceSpan } from '@/lib/discussions/references';

type Props = Omit<ComponentProps<'textarea'>, 'onChange' | 'value'> & {
  value: string;
  references: ReferenceSpan[];
  onDraft: (value: string, references: ReferenceSpan[]) => void;
};

export default function ReferenceEditor({ value, references, onDraft, ...props }: Props) {
  const field = useRef<HTMLTextAreaElement>(null);
  const id = useId();
  const [token, setToken] = useState<{ start: number; end: number; trigger: string; query: string } | null>(null);
  const [results, setResults] = useState<ReferenceOption[]>([]);
  const [active, setActive] = useState(0);
  const [notice, setNotice] = useState('');
  const [ready, setReady] = useState(false);

  function inspect(text: string, start: number, end: number) {
    const match = text.slice(0, start).match(/(?:^|\s)([@#])([^\s@#]{0,100})$/);
    if (!match || start !== end || references.some(r => r.start < start && r.end >= start)) {
      setToken(null);
      return;
    }
    const next = { start: start - match[1].length - match[2].length, end, trigger: match[1], query: match[2] };
    if (token?.start === next.start && token?.end === next.end && token?.trigger === next.trigger && token?.query === next.query) return;
    setResults([]); setActive(0); setReady(false); setToken(next);
  }

  useEffect(() => {
    if (!token) return;
    const abort = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ mode: 'references', trigger: token.trigger, query: token.query });
        const response = await fetch('/api/discussions?' + params, { signal: abort.signal });
        const data = await response.json();
        if (!abort.signal.aborted) {
          setResults(response.ok && Array.isArray(data) ? data : []);
          setNotice(response.ok ? '' : 'Reference search is unavailable.');
          setReady(true);
        }
      } catch {
        if (!abort.signal.aborted) { setNotice('Reference search is unavailable.'); setReady(true); }
      }
    }, 180);
    return () => { clearTimeout(timer); abort.abort(); };
  }, [token]);

  function select(option: ReferenceOption) {
    if (!token) return;
    if (references.some(ref => ref.kind === option.kind && ref.id === option.id)) {
      setNotice('This reference is already in your comment.'); setToken(null); return;
    }
    const label = token.trigger + option.label;
    const next = value.slice(0, token.start) + label + ' ' + value.slice(token.end);
    if (next.length > (props.maxLength ?? 4000)) {
      setNotice('This reference would exceed the comment length.'); setToken(null); return;
    }
    const end = token.start + label.length;
    const delta = end + 1 - token.end;
    const kept = references.flatMap(ref => ref.end <= token.start ? [ref] : ref.start >= token.end
      ? [{ ...ref, start: ref.start + delta, end: ref.end + delta }] : []);
    onDraft(next, [...kept, { kind: option.kind, id: option.id, start: token.start, end }]);
    setToken(null); setNotice('');
    requestAnimationFrame(() => { field.current?.focus(); field.current?.setSelectionRange(end + 1, end + 1); });
  }

  return <div className="relative">
    <textarea {...props} ref={field}
      aria-autocomplete="list" aria-controls={token ? id : undefined}
      aria-activedescendant={token && results.length ? id + '-' + active : undefined}
      value={value}
      onBlur={() => setToken(null)}
      onSelect={event => { const node = event.currentTarget; inspect(node.value, node.selectionStart, node.selectionEnd); }}
      onChange={event => {
        const node = event.target;
        setNotice('');
        onDraft(node.value, shiftReferences(value, node.value, references));
        if (typeof node.selectionStart === 'number') inspect(node.value, node.selectionStart, node.selectionEnd);
      }}
      onKeyDown={event => {
        if (!token || event.nativeEvent.isComposing) return;
        if (event.key === 'Escape') { event.preventDefault(); setToken(null); }
        if (!results.length) return;
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          setActive((active + (event.key === 'ArrowDown' ? 1 : results.length - 1)) % results.length);
        }
        if (event.key === 'Enter' || event.key === 'Tab' && !event.shiftKey) { event.preventDefault(); select(results[active]); }
      }} />
    {token && <ul id={id} role="listbox" aria-label={token.trigger === '@' ? 'Identities' : 'Published mods'}
      className="absolute left-0 right-0 top-full z-40 max-h-60 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-950 p-1 shadow-xl sm:right-auto sm:min-w-72">
      {results.map((option, index) => <li key={option.kind + option.id} id={id + '-' + index} role="option" aria-selected={index === active}>
        <button type="button" tabIndex={-1} onPointerDown={event => event.preventDefault()} onClick={() => select(option)}
          className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm ${index === active ? 'bg-purple-950' : 'hover:bg-zinc-800'}`}>
          {option.avatar && /^(https?:\/\/|\/(?!\/))/.test(option.avatar) && <img src={option.avatar} alt="" className="size-8 shrink-0 rounded object-cover" />}
          <span className="min-w-0 break-words">{option.label}<span className="block text-xs capitalize text-zinc-400">{option.kind}{option.context && ' · ' + option.context}</span></span>
        </button>
      </li>)}
      {!results.length && <li role="presentation" className="px-2 py-2 text-xs text-zinc-400">{ready ? notice || 'No matches' : 'Searching…'}</li>}
    </ul>}
    {references.length > 0 && <div className="mt-1 flex flex-wrap gap-1" aria-label="Selected references">
      {references.map(ref => {
        const label = value.slice(ref.start, ref.end);
        return <button key={ref.kind + ref.id} type="button" aria-label={'Remove ' + label}
          className="max-w-full break-words rounded bg-purple-950 px-2 py-0.5 text-xs text-purple-200"
          onClick={() => {
            const next = value.slice(0, ref.start) + value.slice(ref.end);
            onDraft(next, shiftReferences(value, next, references.filter(r => r !== ref)));
          }}>{label} ×</button>;
      })}
    </div>}
    {!token && notice && <p role="status" className="text-xs text-zinc-400">{notice}</p>}
  </div>;
}

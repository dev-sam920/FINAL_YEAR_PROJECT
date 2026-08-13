import { useEffect, useRef, useState } from 'react';

export default function LocationAutocompleteInput({ value, onChange, onSelect, placeholder, error }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [noResults, setNoResults] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setNoResults(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        setFetchError('');
        // Restrict results to Nigeria (country code 'ng').
        // Note: removed `bounded=1` and `viewbox` because they can be too strict.
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5&countrycodes=ng`;

        const resp = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'User-Agent': 'SmartMaint/1.0',
          },
        });

        if (!resp.ok) throw new Error('Search failed');
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          setSuggestions(data);
          setNoResults(false);
        } else {
          setSuggestions([]);
          setNoResults(true);
        }
      } catch (err) {
        setFetchError('Failed to fetch suggestions');
        setSuggestions([]);
        setNoResults(false);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleInput = (e) => {
    const v = e.target.value;
    setQuery(v);
    if (typeof onChange === 'function') onChange({ target: { name: 'location', value: v } });
    // clear selected coords while typing
    if (typeof onSelect === 'function') onSelect(null);
  };

  const handlePick = (item) => {
    const display = item.display_name || item.formatted || item.name || '';
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    setQuery(display);
    setSuggestions([]);
    if (typeof onChange === 'function') onChange({ target: { name: 'location', value: display } });
    if (typeof onSelect === 'function') onSelect({ latitude: lat, longitude: lon });
  };

  return (
    <div className="form-group" style={{ position: 'relative' }}>
      <label htmlFor="location" className="form-label">Location / Area</label>
      <input
        id="location"
        name="location"
        type="text"
        ref={inputRef}
        value={query}
        onChange={handleInput}
        className={`form-input ${error ? 'error' : ''}`}
        placeholder={placeholder}
        autoComplete="off"
      />
      {(error || fetchError) && <div className="error-text">{error || fetchError}</div>}

      {suggestions.length > 0 && (
        <ul style={{ position: 'absolute', zIndex: 9999, left: 0, right: 0, marginTop: 6, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, listStyle: 'none', padding: 8, maxHeight: 240, overflow: 'auto' }}>
          {suggestions.map((s) => (
            <li key={s.place_id} style={{ padding: '8px', cursor: 'pointer' }} onClick={() => handlePick(s)}>
              <div style={{ fontSize: 13, color: '#111827' }}>{s.display_name}</div>
            </li>
          ))}
        </ul>
      )}

      {!loading && noResults && (
        <div style={{ marginTop: 8, color: '#6B7280' }}>No matches found — you can still type the full address manually.</div>
      )}

      {loading && <div style={{ marginTop: 8, color: '#6B7280' }}>Searching...</div>}
    </div>
  );
}

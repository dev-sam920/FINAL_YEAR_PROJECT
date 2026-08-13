import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon paths for Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

export default function RequestLocationMap({ latitude, longitude, address }) {
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
  if (!hasCoordinates) return null;

  const center = useMemo(() => [Number(latitude), Number(longitude)], [latitude, longitude]);

  return (
    <div style={{ marginTop: 18, borderRadius: 16, overflow: 'hidden', border: '1px solid #E5E7EB', boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)', background: '#FFFFFF' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #E5E7EB', background: '#F8FAFC' }}>
        <p style={{ margin: 0, fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Location map</p>
        {address && <p style={{ margin: '0.6rem 0 0', color: '#111827', fontSize: 14, lineHeight: 1.6 }}>{address}</p>}
      </div>
      <div style={{ height: 220 }}>
        <MapContainer center={center} zoom={15} style={{ width: '100%', height: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={center}>
            <Popup>{address || `${latitude}, ${longitude}`}</Popup>
          </Marker>
        </MapContainer>
      </div>
      <div style={{ padding: '0.8rem 1.25rem', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end' }}>
        <a
          href={`https://www.openstreetmap.org/directions?to=${latitude},${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#2563EB', fontWeight: 600 }}
        >
          Get directions
        </a>
      </div>
    </div>
  );
}

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Note } from '../types/note';
import { customMarkerIcon } from './customMarker';
import { formatDistanceToNow } from 'date-fns';

interface MapDashboardProps {
    notes: Note[];
    onNoteClick: (note: Note) => void;
}

const MapDashboard = ({ notes, onNoteClick }: MapDashboardProps) => {
    const mappedNotes = notes.filter((note) => {
        if (note.latitude == null || note.longitude == null) return false;
        const latitude = Number(note.latitude);
        const longitude = Number(note.longitude);
        return Number.isFinite(latitude) && Number.isFinite(longitude) &&
            latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
    });
    const firstLocation = mappedNotes[0];
    const mapCenter: [number, number] = firstLocation
        ? [Number(firstLocation.latitude), Number(firstLocation.longitude)]
        : [0, 0];

    return (
        <div className="relative z-0 h-[calc(100vh-120px)] w-full overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            {mappedNotes.length === 0 ? (
                <div className="flex h-full min-h-72 flex-col items-center justify-center px-6 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--surface-sage))] text-[#263B35]">✳</div>
                    <h3 className="mt-4 font-editorial text-2xl text-foreground">No mapped letters yet</h3>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Letters will appear here when they include valid location coordinates. We never guess where a letter was written.</p>
                </div>
            ) : (
            <MapContainer
                center={mapCenter}
                zoom={11}
                scrollWheelZoom={true}
                className="h-full w-full"
                style={{ background: '#F6F1E9' }}
            >
                <TileLayer
                    attribution='© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {mappedNotes.map((note) => {
                    const lat = Number(note.latitude);
                    const lng = Number(note.longitude);

                    return (
                        <Marker
                            key={note.id}
                            position={[lat, lng]}
                            icon={customMarkerIcon}
                            eventHandlers={{
                                click: () => onNoteClick(note),
                            }}
                        >
                            <Popup>
                                <div className="min-w-[200px] p-2 cursor-pointer" onClick={() => onNoteClick(note)}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-stone-200 overflow-hidden">
                                            {note.authorName ? (
                                                <div className="w-full h-full flex items-center justify-center text-xs font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                                    {note.authorName[0] || '?'}
                                                </div>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-stone-500">
                                                    ?
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-stone-900 line-clamp-1">{note.title || 'Untitled'}</p>
                                            <p className="text-xs text-stone-500">{note.authorName}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-stone-600 line-clamp-2 mb-2">{note.content}</p>
                                    <p className="text-[10px] text-stone-400">
                                        {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
            )}
        </div>
    );
};

export default MapDashboard;

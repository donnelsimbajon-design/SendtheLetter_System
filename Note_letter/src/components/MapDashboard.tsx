import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Note } from '../types/note';
import { customMarkerIcon } from './customMarker';
import { getImageUrl } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface MapDashboardProps {
    notes: Note[];
    onNoteClick: (note: Note) => void;
}

const MapDashboard = ({ notes, onNoteClick }: MapDashboardProps) => {
    // Default center (can be user's location or a general center)
    const defaultCenter: [number, number] = [20, 0]; // World view roughly
    const defaultZoom = 2;

    return (
        <div className="h-[calc(100vh-120px)] w-full rounded-3xl overflow-hidden border border-stone-200 shadow-sm relative z-0">
            <MapContainer
                center={defaultCenter}
                zoom={defaultZoom}
                scrollWheelZoom={true}
                className="h-full w-full"
                style={{ background: '#fdfbf7' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                {notes.map((note) => {
                    // Generate random coordinates if not present (Mocking for now as backend doesn't seem to have coords)
                    // In a real app, you'd use note.latitude and note.longitude
                    // For demo purposes, we'll hash the ID to get a consistent random position
                    const lat = (Math.sin(Number(note.id)) * 180) % 85;
                    const lng = (Math.cos(Number(note.id)) * 360) % 180;

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
                                            {note.authorAvatar ? (
                                                <img src={getImageUrl(note.authorAvatar)} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-stone-500">
                                                    {note.authorName?.[0] || '?'}
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
        </div>
    );
};

export default MapDashboard;

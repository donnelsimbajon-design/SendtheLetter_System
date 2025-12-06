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
    // Default center - Butuan City, Philippines
    const defaultCenter: [number, number] = [8.9475, 125.5406];
    const defaultZoom = 13;

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
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {notes.map((note) => {
                    // Use actual coordinates if available, otherwise use random positions in Butuan area
                    let lat, lng;
                    if (note.latitude && note.longitude) {
                        lat = Number(note.latitude);
                        lng = Number(note.longitude);
                    } else {
                        // Random position in Butuan City area (8.9-9.0 lat, 125.5-125.6 lng)
                        const hashValue = Math.abs(Number(note.id) || 0);
                        lat = 8.9 + (Math.sin(hashValue) * 0.05 + 0.05);
                        lng = 125.5 + (Math.cos(hashValue) * 0.05 + 0.05);
                    }

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
        </div>
    );
};

export default MapDashboard;

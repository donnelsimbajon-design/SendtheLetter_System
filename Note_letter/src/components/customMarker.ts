// Custom Leaflet marker icon to replace the default
import L from 'leaflet';

export const customMarkerIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAzMiA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE2IDQ4QzE2IDQ4IDMyIDI4IDE2IDE2QzggOCA0IDEyIDQgMTZDNCAxMiA4IDggMTYgMTZDMjQgOCAyOCAxMiAyOCAxNkMyOCAyMCAxNiA0OCAxNiA0OFoiIGZpbGw9IiM1ODcwYmUiLz4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iOCIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
    iconSize: [32, 48],
    iconAnchor: [16, 48],
    popupAnchor: [0, -48],
});

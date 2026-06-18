import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function LiveMap({ tickets }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapRef.current && mapContainerRef.current) {
      // Initialize map
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([40.7128, -74.0060], 11);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      if (mapRef.current) {
        mapRef.current.removeLayer(marker);
      }
    });
    markersRef.current = [];

    const bounds = [];
    const theme = {
      '1': { dotBg: 'bg-red-500' },
      '2': { dotBg: 'bg-orange-500' },
      '3': { dotBg: 'bg-yellow-500' },
      'default': { dotBg: 'bg-gray-500' }
    };

    tickets.forEach((ticket) => {
      if (ticket.status !== 'resolved' && ticket.lat && ticket.lng) {
        const levelStr = String(ticket.level);
        const tTheme = theme[levelStr] || theme.default;

        const pulsingIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="relative flex h-3 w-3 md:h-4 md:w-4"><span class="animate-ping absolute inline-flex h-full w-full rounded-full ${tTheme.dotBg} opacity-75"></span><span class="relative inline-flex rounded-full h-3 w-3 md:h-4 md:w-4 ${tTheme.dotBg}"></span></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        const marker = L.marker([ticket.lat, ticket.lng], { icon: pulsingIcon })
          .bindPopup(`<b>L${levelStr}: ${ticket.title || ticket.location}</b>`);
        
        marker.addTo(mapRef.current);
        markersRef.current.push(marker);
        bounds.push([ticket.lat, ticket.lng]);
      }
    });

    if (bounds.length > 0 && mapRef.current) {
      mapRef.current.fitBounds(bounds, { padding: [20, 20], maxZoom: 15 });
    }
  }, [tickets]);

  return (
    <div className="absolute inset-0 w-full h-full z-10" ref={mapContainerRef} />
  );
}

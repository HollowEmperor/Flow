/// <reference types="google.maps" />
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useAdvancedMarkerRef,
  useMapsLibrary,
  useMap,
  MapMouseEvent,
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Search,
  Navigation,
  Plus,
  CheckSquare,
  Flame,
  Target,
  Trash2,
  Clock,
  Compass,
  Route as RouteIcon,
  LocateFixed,
} from 'lucide-react';
import {
  Category,
  LIFE_AREAS,
  Priority,
  TodoItem,
  HabitItem,
  TopicItem,
} from '../utils/todoLogic';

const GOOGLE_MAPS_API_KEY: string =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export type WorkspacePinKind = 'task' | 'habit' | 'goal';

export interface WorkspaceMapPin {
  id: string;
  title: string;
  placeName: string;
  formattedAddress: string;
  position: google.maps.LatLngLiteral;
  kind: WorkspacePinKind;
  lifeArea: Category;
  scheduledHour?: number;
  linkedItemId?: string;
  notes: string;
  createdAt: string;
}

interface GoogleMapsDashboardProps {
  todos: TodoItem[];
  habits: HabitItem[];
  topics: TopicItem[];
  onAddTodoWithLocation: (params: {
    title: string;
    notes: string;
    priority: Priority;
    category: Category;
    dueDate: string;
    isRepeating: boolean;
    scheduledHour?: number;
  }) => void;
}

function checkAndDispatchQuotaError(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  if (
    msg.includes('OVER_QUERY_LIMIT') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('QuotaExceeded') ||
    msg.includes('OverQuotaMapError') ||
    msg.includes('429')
  ) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
}

interface PinMarkerItemProps {
  pin: WorkspaceMapPin;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onCloseInfo: () => void;
  onDeletePin: (id: string) => void;
  onCreateTaskFromPin: (pin: WorkspaceMapPin) => void;
}

const PinMarkerItem: React.FC<PinMarkerItemProps> = ({
  pin,
  isSelected,
  onSelect,
  onCloseInfo,
  onDeletePin,
  onCreateTaskFromPin,
}) => {
  const [markerRef, marker] = useAdvancedMarkerRef();

  const pinColors =
    pin.kind === 'task'
      ? { bg: '#059669', border: '#047857', glyph: '#FFFFFF' }
      : pin.kind === 'habit'
        ? { bg: '#2563EB', border: '#1D4ED8', glyph: '#FFFFFF' }
        : { bg: '#7C3AED', border: '#6D28D9', glyph: '#FFFFFF' };

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={pin.position}
        title={pin.title}
        onClick={() => onSelect(pin.id)}
      >
        <Pin
          background={pinColors.bg}
          borderColor={pinColors.border}
          glyphColor={pinColors.glyph}
        />
      </AdvancedMarker>

      {isSelected && marker && (
        <InfoWindow anchor={marker} onCloseClick={onCloseInfo} maxWidth={280}>
          <div className="p-1 space-y-2 text-slate-900">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white ${
                  pin.kind === 'task'
                    ? 'bg-emerald-600'
                    : pin.kind === 'habit'
                      ? 'bg-blue-600'
                      : 'bg-purple-700'
                }`}
              >
                {pin.kind} · {pin.lifeArea}
              </span>
              {pin.scheduledHour !== undefined && (
                <span className="text-[10px] font-mono font-bold text-blue-700">
                  {String(pin.scheduledHour).padStart(2, '0')}:00
                </span>
              )}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">{pin.title}</h4>
              {pin.placeName && (
                <p className="text-[11px] font-semibold text-slate-700 mt-0.5">
                  {pin.placeName}
                </p>
              )}
              {pin.formattedAddress && (
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {pin.formattedAddress}
                </p>
              )}
              {pin.notes && (
                <p className="text-[11px] text-slate-600 mt-1 border-t border-slate-100 pt-1">
                  {pin.notes}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => onCreateTaskFromPin(pin)}
                className="flex-1 px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold cursor-pointer"
              >
                + Deploy to Today&apos;s Tasks
              </button>
              <button
                type="button"
                onClick={() => onDeletePin(pin.id)}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-[10px] font-bold cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

interface PlacesAutocompleteAndRouteOverlayProps {
  pins: WorkspaceMapPin[];
  onPlaceSelected: (placeData: {
    placeName: string;
    formattedAddress: string;
    location: google.maps.LatLngLiteral;
  }) => void;
}

const PlacesAutocompleteAndRouteOverlay: React.FC<
  PlacesAutocompleteAndRouteOverlayProps
> = ({ pins, onPlaceSelected }) => {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const routesLib = useMapsLibrary('routes');

  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const activePolylinesRef = useRef<google.maps.Polyline[]>([]);

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompleteSuggestion[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);

  const [originPinId, setOriginPinId] = useState<string>('');
  const [destPinId, setDestPinId] = useState<string>('');
  const [routeStatus, setRouteStatus] = useState<string | null>(null);
  const [isRouting, setIsRouting] = useState(false);

  // Places API (New) AutocompleteSuggestion with SessionToken
  useEffect(() => {
    if (!placesLib) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions([]);
      return;
    }

    const { AutocompleteSessionToken, AutocompleteSuggestion } = placesLib;
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new AutocompleteSessionToken();
    }

    let cancelled = false;
    setIsSearching(true);

    const timer = window.setTimeout(() => {
      AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: trimmed,
        sessionToken: sessionTokenRef.current ?? undefined,
      })
        .then((res) => {
          if (!cancelled) {
            setSuggestions(res?.suggestions ?? []);
          }
        })
        .catch((err) => {
          checkAndDispatchQuotaError(err);
          if (!cancelled) {
            setSuggestions([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsSearching(false);
          }
        });
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [placesLib, query]);

  const handleSelectSuggestion = useCallback(
    async (suggestion: google.maps.places.AutocompleteSuggestion) => {
      if (!placesLib || !suggestion.placePrediction) return;
      try {
        const place = suggestion.placePrediction.toPlace();
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location', 'viewport'],
        });

        const loc = place.location;
        if (loc) {
          const coords: google.maps.LatLngLiteral = {
            lat: typeof loc.lat === 'function' ? loc.lat() : Number(loc.lat),
            lng: typeof loc.lng === 'function' ? loc.lng() : Number(loc.lng),
          };
          if (map) {
            if (place.viewport) {
              map.fitBounds(place.viewport);
            } else {
              map.setCenter(coords);
              map.setZoom(15);
            }
          }
          onPlaceSelected({
            placeName:
              place.displayName ||
              suggestion.placePrediction.text?.text ||
              'Selected Place',
            formattedAddress: place.formattedAddress || '',
            location: coords,
          });
        }

        // Reset session token after fetchFields completes
        sessionTokenRef.current = null;
        setSuggestions([]);
        setQuery('');
      } catch (err) {
        checkAndDispatchQuotaError(err);
      }
    },
    [placesLib, map, onPlaceSelected]
  );

  const clearRoutePolylines = useCallback(() => {
    activePolylinesRef.current.forEach((p) => p.setMap(null));
    activePolylinesRef.current = [];
    setRouteStatus(null);
  }, []);

  // Compute Route via modern Routes API (routesLib.Route)
  const handleComputeRoute = useCallback(async () => {
    if (!routesLib || !map) {
      setRouteStatus('Map or Routes library is still initializing.');
      return;
    }
    const originPin = pins.find((p) => p.id === originPinId);
    const destPin = pins.find((p) => p.id === destPinId);
    if (!originPin || !destPin) {
      setRouteStatus('Select both an origin pin and a destination pin.');
      return;
    }

    setIsRouting(true);
    clearRoutePolylines();

    try {
      const RoutesClass = (
        routesLib as unknown as {
          Route?: {
            computeRoutes?: (
              req: Record<string, unknown>
            ) => Promise<{
              routes?: Array<{
                createPolylines?: () => google.maps.Polyline[];
                distanceMeters?: number;
                durationMillis?: number;
              }>;
            }>;
          };
        }
      ).Route;

      if (RoutesClass && typeof RoutesClass.computeRoutes === 'function') {
        const response = await RoutesClass.computeRoutes({
          origin: originPin.position,
          destination: destPin.position,
          travelMode: 'DRIVING',
          fields: ['path', 'distanceMeters', 'durationMillis'],
        });

        const firstRoute = response?.routes?.[0];
        if (firstRoute) {
          if (typeof firstRoute.createPolylines === 'function') {
            const polylines = firstRoute.createPolylines();
            polylines.forEach((pl) => {
              pl.setMap(map);
            });
            activePolylinesRef.current = polylines;
          }
          const km = firstRoute.distanceMeters
            ? (firstRoute.distanceMeters / 1000).toFixed(1)
            : null;
          const mins = firstRoute.durationMillis
            ? Math.round(firstRoute.durationMillis / 60000)
            : null;
          setRouteStatus(
            `Route ready: ${originPin.title} → ${destPin.title}${
              km ? ` · ${km} km` : ''
            }${mins ? ` (~${mins} min)` : ''}`
          );
        } else {
          setRouteStatus('No driving route found between the selected pins.');
        }
      } else {
        setRouteStatus('Routes SDK method unavailable in current environment.');
      }
    } catch (err) {
      checkAndDispatchQuotaError(err);
      setRouteStatus(
        'Unable to compute route. Check locations or Google Maps API quota.'
      );
    } finally {
      setIsRouting(false);
    }
  }, [routesLib, map, pins, originPinId, destPinId, clearRoutePolylines]);

  const handleLocateMe = () => {
    if (!navigator.geolocation || !map) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        map.setCenter(coords);
        map.setZoom(14);
        onPlaceSelected({
          placeName: 'Current Device Location',
          formattedAddress: `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
          location: coords,
        });
      },
      () => {
        setRouteStatus('Location permission was declined or unavailable.');
      }
    );
  };

  return (
    <div className="bg-slate-50 border-b border-slate-200 p-3.5 space-y-3">
      {/* Row 1: Places API (New) Autocomplete Search + Geolocation Button */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            data-testid="gmp-places-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search real-world places via Google Places API (New)..."
            aria-label="Search places on Google Maps"
            className="w-full pl-9 pr-3 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-600"
          />

          {/* Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <ul
              role="listbox"
              aria-label="Place autocomplete suggestions"
              className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100"
            >
              {suggestions.map((suggestion, idx) => {
                const text =
                  suggestion.placePrediction?.text?.text || 'Place result';
                return (
                  <li key={idx}>
                    <button
                      type="button"
                      onClick={() => void handleSelectSuggestion(suggestion)}
                      className="w-full text-left px-3.5 py-2.5 text-xs text-slate-800 hover:bg-blue-50 flex items-center gap-2 cursor-pointer"
                    >
                      <MapPin
                        className="w-3.5 h-3.5 text-blue-600 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="truncate font-medium">{text}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={handleLocateMe}
          data-testid="gmp-locate-me-btn"
          className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <LocateFixed className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Use My Location</span>
        </button>

        {isSearching && (
          <span className="text-[11px] font-mono text-slate-500">
            Searching Places...
          </span>
        )}
      </div>

      {/* Row 2: Modern Routes API Planner Between Any 2 Pinned Workspace Locations */}
      {pins.length >= 2 && (
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 shrink-0">
            <RouteIcon
              className="w-3.5 h-3.5 text-purple-700"
              aria-hidden="true"
            />
            <span>Routes API Planner:</span>
          </div>

          <select
            aria-label="Select route origin pin"
            value={originPinId}
            onChange={(e) => setOriginPinId(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
          >
            <option value="">Origin Pin...</option>
            {pins.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          <span className="text-xs text-slate-400 font-bold">→</span>

          <select
            aria-label="Select route destination pin"
            value={destPinId}
            onChange={(e) => setDestPinId(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
          >
            <option value="">Destination Pin...</option>
            {pins.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={isRouting}
            onClick={() => void handleComputeRoute()}
            className="px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            {isRouting ? 'Computing...' : 'Compute Route'}
          </button>

          {routeStatus && (
            <button
              type="button"
              onClick={clearRoutePolylines}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold cursor-pointer"
            >
              Clear Route
            </button>
          )}

          {routeStatus && (
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              {routeStatus}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export const GoogleMapsDashboard: React.FC<GoogleMapsDashboardProps> = ({
  todos,
  habits,
  topics,
  onAddTodoWithLocation,
}) => {
  // Note: No LLM-hallucinated or pre-filled place data! Pins are created strictly by user search or map clicks.
  const [pins, setPins] = useState<WorkspaceMapPin[]>([]);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);

  // Draft location from either a Places API (New) selection or a Map click
  const [draftLocation, setDraftLocation] = useState<{
    placeName: string;
    formattedAddress: string;
    location: google.maps.LatLngLiteral;
  } | null>(null);

  const [pinTitle, setPinTitle] = useState('');
  const [pinKind, setPinKind] = useState<WorkspacePinKind>('task');
  const [pinLifeArea, setPinLifeArea] = useState<Category>('Portfolio');
  const [pinScheduledHour, setPinScheduledHour] = useState<number>(9);
  const [pinLinkedId, setPinLinkedId] = useState<string>('');
  const [pinNotes, setPinNotes] = useState('');
  const [alsoCreateScheduledTask, setAlsoCreateScheduledTask] = useState(true);

  const handleMapClick = (ev: MapMouseEvent) => {
    const latLng = ev.detail.latLng;
    if (!latLng) return;
    setDraftLocation({
      placeName: `Pinned Coordinates (${latLng.lat.toFixed(4)}, ${latLng.lng.toFixed(4)})`,
      formattedAddress: `Lat ${latLng.lat.toFixed(5)}, Lng ${latLng.lng.toFixed(5)}`,
      location: { lat: latLng.lat, lng: latLng.lng },
    });
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftLocation) return;

    const cleanTitle =
      pinTitle.trim() ||
      `${pinKind === 'task' ? 'Task' : pinKind === 'habit' ? 'Habit Routine' : 'Goal'} at ${draftLocation.placeName}`;

    const newPin: WorkspaceMapPin = {
      id: `pin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: cleanTitle,
      placeName: draftLocation.placeName,
      formattedAddress: draftLocation.formattedAddress,
      position: draftLocation.location,
      kind: pinKind,
      lifeArea: pinLifeArea,
      scheduledHour: pinScheduledHour,
      linkedItemId: pinLinkedId || undefined,
      notes:
        pinNotes.trim() ||
        `Location: ${draftLocation.placeName}${
          draftLocation.formattedAddress
            ? ` (${draftLocation.formattedAddress})`
            : ''
        }`,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setPins((prev) => [newPin, ...prev]);
    setSelectedPinId(newPin.id);

    if (alsoCreateScheduledTask) {
      onAddTodoWithLocation({
        title: `${cleanTitle} @ ${draftLocation.placeName}`,
        notes: newPin.notes,
        priority: 'high',
        category: pinLifeArea,
        dueDate: new Date().toISOString().slice(0, 10),
        isRepeating: pinKind === 'habit',
        scheduledHour: pinScheduledHour,
      });
    }

    setPinTitle('');
    setPinNotes('');
  };

  const handleCreateTaskFromPin = (pin: WorkspaceMapPin) => {
    onAddTodoWithLocation({
      title: `${pin.title} @ ${pin.placeName}`,
      notes: `${pin.notes} [Coordinates: ${pin.position.lat.toFixed(4)}, ${pin.position.lng.toFixed(4)}]`,
      priority: 'high',
      category: pin.lifeArea,
      dueDate: new Date().toISOString().slice(0, 10),
      isRepeating: pin.kind === 'habit',
      scheduledHour: pin.scheduledHour ?? 9,
    });
  };

  const handleDeletePin = (id: string) => {
    setPins((prev) => prev.filter((p) => p.id !== id));
    if (selectedPinId === id) {
      setSelectedPinId(null);
    }
  };

  return (
    <div
      data-testid="google-maps-dashboard"
      className="space-y-5 text-slate-900"
    >
      {/* Solid Flat Header Banner — 60-30-10 Design Theory (Zero Gradients) */}
      <header className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider mb-1.5">
              <Compass className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Google Maps Platform · Spatial Execution</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold font-display">
              Google Maps Task, Habit Routine &amp; Goal Location Studio
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Search real-world places with{' '}
              <strong className="text-white">Places API (New)</strong>, click
              anywhere on the map to drop an{' '}
              <strong className="text-emerald-400">Advanced Marker</strong> for
              your scheduled Tasks, Habit Routines, or Goals, and calculate live
              routes with the{' '}
              <strong className="text-purple-300">Routes API</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-center">
              <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                Active Pins
              </span>
              <span className="text-sm font-mono font-bold text-emerald-400">
                {pins.length}
              </span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-center">
              <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                Habits &amp; Tasks
              </span>
              <span className="text-sm font-mono font-bold text-blue-400">
                {habits.length + todos.length}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Interactive Map + Places Search + Route Calculator */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <APIProvider
          apiKey={GOOGLE_MAPS_API_KEY}
          libraries={['places', 'routes', 'marker']}
        >
          <PlacesAutocompleteAndRouteOverlay
            pins={pins}
            onPlaceSelected={(placeData) => {
              setDraftLocation(placeData);
              if (!pinTitle.trim()) {
                setPinTitle(placeData.placeName);
              }
            }}
          />

          {/* Map Viewport Container with Explicit Height (CF2 Compliance) */}
          <div
            data-testid="google-map-canvas-container"
            className="h-[440px] w-full relative bg-slate-100"
          >
            <GoogleMap
              mapId="DEMO_MAP_ID"
              defaultCenter={{ lat: 20, lng: 0 }}
              defaultZoom={2}
              gestureHandling="greedy"
              onClick={handleMapClick}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
            >
              {/* Draft Selection Marker */}
              {draftLocation && (
                <AdvancedMarker
                  position={draftLocation.location}
                  title={draftLocation.placeName}
                >
                  <Pin
                    background="#0F172A"
                    borderColor="#3B82F6"
                    glyphColor="#FFFFFF"
                  />
                </AdvancedMarker>
              )}

              {/* Saved Workspace Pins */}
              {pins.map((pin) => (
                <PinMarkerItem
                  key={pin.id}
                  pin={pin}
                  isSelected={selectedPinId === pin.id}
                  onSelect={(id) => setSelectedPinId(id)}
                  onCloseInfo={() => setSelectedPinId(null)}
                  onDeletePin={handleDeletePin}
                  onCreateTaskFromPin={handleCreateTaskFromPin}
                />
              ))}
            </GoogleMap>
          </div>
        </APIProvider>

        {/* Bottom Map Legend Bar */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              <span>Task Note Pin (Green)</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
              <span>Habit Routine Pin (Blue)</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-700 inline-block" />
              <span>Goal / Topic Pin (Purple)</span>
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Tip: Search a place above or click anywhere on the map to pin a task
            or habit location.
          </span>
        </div>
      </section>

      {/* Pin Assignment Form + Active Workspace Location Pins List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left 5 Cols: Attach Selected Map Location to a Task, Habit Routine, or Goal */}
        <form
          onSubmit={handleSavePin}
          data-testid="create-map-pin-form"
          className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 space-y-3.5"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                <MapPin className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Attach Map Location to Workspace
                </h2>
                <p className="text-[11px] text-slate-500">
                  Link a real place to a Task Note, Habit Routine, or Goal
                </p>
              </div>
            </div>
          </div>

          {draftLocation ? (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 space-y-0.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                Selected Map Location
              </div>
              <div className="text-xs font-bold text-slate-900">
                {draftLocation.placeName}
              </div>
              {draftLocation.formattedAddress && (
                <div className="text-[11px] text-slate-600">
                  {draftLocation.formattedAddress}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-xs text-slate-600">
              Search for a place in the bar above or click any point on the
              Google Map to select a location.
            </div>
          )}

          {/* Kind Selector: Task Note / Habit Routine / Goal */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Workspace Ontology Target
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  {
                    id: 'task',
                    label: 'Task Note',
                    icon: <CheckSquare className="w-3.5 h-3.5" />,
                    activeClass: 'bg-emerald-600 text-white',
                  },
                  {
                    id: 'habit',
                    label: 'Habit Routine',
                    icon: <Flame className="w-3.5 h-3.5" />,
                    activeClass: 'bg-blue-600 text-white',
                  },
                  {
                    id: 'goal',
                    label: 'Goal / Topic',
                    icon: <Target className="w-3.5 h-3.5" />,
                    activeClass: 'bg-purple-700 text-white',
                  },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setPinKind(item.id);
                    setPinLinkedId('');
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
                    pinKind === item.id
                      ? `${item.activeClass} border-transparent`
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Pin Action Title
            </label>
            <input
              type="text"
              value={pinTitle}
              onChange={(e) => setPinTitle(e.target.value)}
              placeholder="e.g., Deep Work Study Session / Morning Run"
              className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Life Area
              </label>
              <select
                value={pinLifeArea}
                onChange={(e) => setPinLifeArea(e.target.value as Category)}
                className="w-full px-2.5 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl"
              >
                {LIFE_AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Time Schedule (Hour)
              </label>
              <select
                value={pinScheduledHour}
                onChange={(e) => setPinScheduledHour(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded-xl"
              >
                {Array.from({ length: 17 }, (_, i) => i + 6).map((hr) => (
                  <option key={hr} value={hr}>
                    {String(hr).padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Link to Existing Habit or Topic Goal */}
          {pinKind === 'habit' && habits.length > 0 && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Link to Existing Habit Routine
              </label>
              <select
                value={pinLinkedId}
                onChange={(e) => setPinLinkedId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="">Select a Habit Routine...</option>
                {habits.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.title} ({h.lifeArea})
                  </option>
                ))}
              </select>
            </div>
          )}

          {pinKind === 'goal' && topics.length > 0 && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Link to Existing Topic / Goal
              </label>
              <select
                value={pinLinkedId}
                onChange={(e) => setPinLinkedId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="">Select a Topic / Goal...</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} — {t.goalLabel}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Location Notes
            </label>
            <textarea
              rows={2}
              value={pinNotes}
              onChange={(e) => setPinNotes(e.target.value)}
              placeholder="What checklist or routine steps happen at this location?"
              className="w-full px-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={alsoCreateScheduledTask}
              onChange={(e) => setAlsoCreateScheduledTask(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
            />
            <span>
              Also add as a{' '}
              <strong className="text-emerald-700">
                Scheduled Tickbox Task Note
              </strong>{' '}
              in today&apos;s Hourly Calendar
            </span>
          </label>

          <button
            type="submit"
            disabled={!draftLocation}
            data-testid="save-workspace-map-pin-btn"
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              draftLocation
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Pin Location to Map &amp; Workspace</span>
          </button>
        </form>

        {/* Right 7 Cols: Saved Workspace Pins Directory */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <Navigation className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Pinned Workspace Locations ({pins.length})
                </h2>
                <p className="text-[11px] text-slate-500">
                  Click any pin to inspect on the map or deploy to your daily
                  schedule
                </p>
              </div>
            </div>
          </div>

          {pins.length === 0 ? (
            <div className="py-10 px-4 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
              <MapPin
                className="w-7 h-7 text-blue-600 mx-auto"
                aria-hidden="true"
              />
              <h3 className="text-xs font-bold text-slate-900">
                No locations pinned yet
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Use the Google Places search bar above or click anywhere on the
                map to pin a real-world venue for your Tasks, Habit Routines, or
                30-Year Goals.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pins.map((pin) => (
                <div
                  key={pin.id}
                  onClick={() => setSelectedPinId(pin.id)}
                  className={`p-3.5 rounded-xl border transition-colors cursor-pointer flex flex-wrap items-center justify-between gap-3 ${
                    selectedPinId === pin.id
                      ? 'bg-blue-50/50 border-blue-400'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white ${
                          pin.kind === 'task'
                            ? 'bg-emerald-600'
                            : pin.kind === 'habit'
                              ? 'bg-blue-600'
                              : 'bg-purple-700'
                        }`}
                      >
                        {pin.kind}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-semibold text-slate-700">
                        {pin.lifeArea}
                      </span>
                      {pin.scheduledHour !== undefined && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          <Clock className="w-3 h-3" aria-hidden="true" />
                          <span>
                            {String(pin.scheduledHour).padStart(2, '0')}:00
                          </span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs font-bold text-slate-900 truncate">
                      {pin.title}
                    </h3>
                    <p className="text-[11px] font-medium text-slate-700 truncate">
                      {pin.placeName}
                      {pin.formattedAddress ? ` · ${pin.formattedAddress}` : ''}
                    </p>
                    {pin.notes && (
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {pin.notes}
                      </p>
                    )}
                  </div>

                  <div
                    className="flex items-center gap-1.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => handleCreateTaskFromPin(pin)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer"
                    >
                      + Schedule Task
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePin(pin.id)}
                      aria-label={`Remove ${pin.title}`}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 text-slate-500 hover:text-rose-700 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

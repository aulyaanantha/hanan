
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  APIProvider,
  Map,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import {
  MapPin,
  X,
  Heart,
  BookmarkCheck,
  LoaderCircle,
  RefreshCw,
  ImagePlus,
  Maximize2,
  Search,
} from "lucide-react";

import { filterSavedPlaces } from "@/lib/places/filter";
import PlacesPanel from "@/components/PlacesPanel";
import PlaceUploadPreview from "@/components/PlaceUploadPreview";

type SelectedPlace = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  savedPlaceId?: string;
};

type PlaceVisit = {
  id: string;
  place_id: string;
  title: string;
  story: string;
  visited_at: string;
  created_at: string;
};

type PlacePhoto = {
  id: string;
  visit_id: string;
  storage_path: string;
  caption: string | null;
  taken_at: string | null;
  created_at: string;
  url: string | null;
};

type SavedPlace = {
  id: string;
  google_place_id: string;
  place_name: string;
  custom_name: string | null;
  formatted_address: string | null;
  latitude: number;
  longitude: number;
  category: string;
  is_favorite: boolean;
  created_at: string;
};

const DEFAULT_CENTER = {
  lat: 1.0456,
  lng: 104.0305,
};



type AccentColor = "pink" | "purple" | "blue" | "sage";

const MAP_PALETTES: Record<
  AccentColor,
  {
    land: string;
    road: string;
    roadBorder: string;
    water: string;
    park: string;
    label: string;
    labelOutline: string;
    border: string;
  }
> = {
  pink: {
    land: "#fff7fb",
    road: "#ffffff",
    roadBorder: "#f3d4e3",
    water: "#f5d8e6",
    park: "#fce7f3",
    label: "#b77b98",
    labelOutline: "#fffafd",
    border: "#f0d5e2",
  },
  purple: {
    land: "#faf7ff",
    road: "#ffffff",
    roadBorder: "#e5d9fb",
    water: "#e9ddfa",
    park: "#f0e7ff",
    label: "#8b70b5",
    labelOutline: "#fdfaff",
    border: "#e3d8f4",
  },
  blue: {
    land: "#f5f9ff",
    road: "#ffffff",
    roadBorder: "#d5e5fb",
    water: "#dceafb",
    park: "#e6f1ff",
    label: "#6689b8",
    labelOutline: "#fbfdff",
    border: "#d6e5f6",
  },
  sage: {
    land: "#f6faf7",
    road: "#ffffff",
    roadBorder: "#d7e7dc",
    water: "#dcebe2",
    park: "#e4f0e7",
    label: "#688b75",
    labelOutline: "#fcfffc",
    border: "#d6e5da",
  },
};

function getMapStyles(accent: AccentColor, dark: boolean) {
  const colors = dark ? {
    land: "#20232c", road: "#353946", roadBorder: "#414756",
    water: { pink: "#392535", purple: "#2e2946", blue: "#1d3046", sage: "#223a32" }[accent],
    park: "#2a3a32", label: "#c6cbd8", labelOutline: "#20232c", border: "#454b5a",
  } : MAP_PALETTES[accent];

  return [
    {
      elementType: "geometry",
      stylers: [{ color: colors.land }],
    },
    {
      elementType: "labels.text.fill",
      stylers: [{ color: colors.label }],
    },
    {
      elementType: "labels.text.stroke",
      stylers: [{ color: colors.labelOutline }],
    },
    {
      featureType: "poi",
      elementType: "geometry",
      stylers: [{ color: colors.park }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: colors.park }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: colors.road }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: colors.roadBorder }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: colors.water }],
    },
    {
      featureType: "transit",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "administrative",
      elementType: "geometry.stroke",
      stylers: [{ color: colors.border }],
    },
  ];
}



const CATEGORIES = [
  { value: "photobox", label: "Photobox 📸" },
  { value: "cafe", label: "Cafe ☕" },
  { value: "food", label: "Food 🍜" },
  { value: "mall", label: "Mall 🏢" },
  { value: "shopping", label: "Shopping 🛍️" },
  { value: "other", label: "Other 🌷" },
];

type PlacePredictionEvent = Event & {
  placePrediction?: {
    toPlace: () => {
      fetchFields: (options: {
        fields: string[];
      }) => Promise<void>;
      id?: string;
      displayName?: string;
      formattedAddress?: string;
      location?: {
        lat: () => number;
        lng: () => number;
      };
    };
  };
};

function PlaceSearch({
  onSelect,
}: {
  onSelect: (place: SelectedPlace) => void;
}) {
  const places = useMapsLibrary("places");
  const map = useMap();
  const [error, setError] = useState("");
  const [searchElement, setSearchElement] =
    useState<HTMLDivElement | null>(null);

  const handleSelect = useCallback(
    async (event: Event) => {
      const prediction = (event as PlacePredictionEvent).placePrediction;

      if (!prediction) {
        setError("Place details are unreadable. Try selecting another result.");
        return;
      }

      try {
        setError("");

        const place = prediction.toPlace();

        await place.fetchFields({
          fields: [
            "id",
            "displayName",
            "formattedAddress",
            "location",
          ],
        });

        if (!place.id || !place.location) {
          setError("Place coordinates not found.");
          return;
        }

        const selected: SelectedPlace = {
          id: place.id,
          name: place.displayName ?? "Nameless place",
          address: place.formattedAddress ?? "",
          lat: place.location.lat(),
          lng: place.location.lng(),
        };

        map?.panTo({ lat: selected.lat, lng: selected.lng });
        map?.setZoom(16);
        onSelect(selected);
      } catch (err) {
        console.error("Failed to retrieve place details:", err);
        setError("Failed to load place details. Please try again later.");
      }
    },
    [map, onSelect]
  );

  useEffect(() => {
    if (!places || !searchElement) return;


    const autocomplete = new places.PlaceAutocompleteElement({});

    autocomplete.placeholder = "Find a place to remember...";
    const applySearchTheme = () => {
    autocomplete.style.width = "100%";
    autocomplete.style.boxSizing = "border-box";
    autocomplete.style.backgroundColor =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--surface")
        .trim() || "#ffffff";
    autocomplete.style.color =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--foreground")
        .trim() || "#374151";
    autocomplete.style.border =
      `1px solid ${getComputedStyle(document.documentElement)
        .getPropertyValue("--primary")
        .trim() || "#ec4899"
      }`;
    autocomplete.style.borderRadius = "12px";
    autocomplete.style.fontFamily = "Arial, sans-serif";
    autocomplete.style.fontSize = "14px";
    autocomplete.style.colorScheme =
      document.documentElement.dataset.theme === "dark"
        ? "dark"
        : "light";

    };
    applySearchTheme();
    const themeObserver = new MutationObserver(applySearchTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-accent"] });
    autocomplete.locationBias = {
      center: DEFAULT_CENTER,
      radius: 25000,
    };

    autocomplete.includedRegionCodes = ["id"];

    searchElement.replaceChildren(autocomplete);

    const handleError = () => {
      setError(
        "Google search is currently unavailable. You can still view your saved places."
      );
    };

    autocomplete.addEventListener("gmp-select", handleSelect);
    autocomplete.addEventListener("gmp-error", handleError);

    return () => {
      themeObserver.disconnect();
      autocomplete.removeEventListener("gmp-select", handleSelect);
      autocomplete.removeEventListener("gmp-error", handleError);
      searchElement.replaceChildren();
    };
  }, [places, searchElement, handleSelect]);


  return (
    <div className="space-y-2">
      <div
        ref={setSearchElement}
        className="relative z-30 min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm [&_gmp-place-autocomplete]:w-full"
      />
      {error && (
        <p role="alert" className="places-feedback">
          {error}
        </p>
      )}
    </div>
  );
}

function SavedPlaceMarkers({
  places,
  onSelect,
  focusedPlaceId,
  accent,
}: {
  places: SavedPlace[];
  onSelect: (place: SavedPlace) => void;
  focusedPlaceId: string | null;
  accent: AccentColor;
}) {
  const map = useMap();



  useEffect(() => {
    if (!map) return;

    const markers: google.maps.Marker[] = [];

    const rootStyles = getComputedStyle(document.documentElement);
    const primaryColor =
      rootStyles.getPropertyValue("--primary").trim() || "#ec4899";
    const selectedColor =
      rootStyles.getPropertyValue("--primary-dark").trim() || "#db2777";

    for (const place of places) {
      const isSelected = place.google_place_id === focusedPlaceId;

      const marker = new google.maps.Marker({
        map,
        position: {
          lat: place.latitude,
          lng: place.longitude,
        },
        title: place.custom_name || place.place_name,
        zIndex: isSelected ? 1000 : 1,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isSelected ? 13 : 10,
          fillColor: isSelected ? selectedColor : primaryColor,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: isSelected ? 4 : 3,
        },
      });

      marker.addListener("click", () => {
        map.setCenter({
          lat: place.latitude,
          lng: place.longitude,
        });

        map.setZoom(16);
        onSelect(place);
      });

      markers.push(marker);
    }

    return () => {
      markers.forEach((marker) => marker.setMap(null));
    };
  }, [map, places, onSelect, focusedPlaceId, accent]);

  useEffect(() => {
    if (!map || !focusedPlaceId) return;

    const place = places.find(
      (item) => item.google_place_id === focusedPlaceId
    );

    if (!place) return;

    const position = {
      lat: place.latitude,
      lng: place.longitude,
    };

    map.setCenter(position);
    map.setZoom(16);
  }, [map, places, focusedPlaceId]);

  return null;
}

function MemoryMapContent() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const [darkMap, setDarkMap] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [mapCamera, setMapCamera] = useState({ center: DEFAULT_CENTER, zoom: 12 });
  const [savedQuery, setSavedQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [accentColor, setAccentColor] =
    useState<AccentColor>("pink");

  useEffect(() => {
    const root = document.documentElement;

    const updateAccent = () => {
      const accent = root.dataset.accent;
      setDarkMap(root.dataset.theme === "dark");

      if (
        accent === "pink" ||
        accent === "purple" ||
        accent === "blue" ||
        accent === "sage"
      ) {
        setAccentColor(accent);
      } else {
        setAccentColor("pink");
      }
    };

    updateAccent();

    const observer = new MutationObserver(updateAccent);

    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-accent", "data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  const mapStyles = useMemo(() => getMapStyles(accentColor, darkMap), [accentColor, darkMap]);


  const [selectedPlace, setSelectedPlace] =
    useState<SelectedPlace | null>(null);
  const [focusedPlaceId, setFocusedPlaceId] =
    useState<string | null>(null);
  const [category, setCategory] = useState("other");
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [visits, setVisits] = useState<PlaceVisit[]>([]);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [savingVisit, setSavingVisit] = useState(false);

  const [photosByVisit, setPhotosByVisit] = useState<
    Record<string, PlacePhoto[]>
  >({});
  const [previewPhoto, setPreviewPhoto] =
    useState<PlacePhoto | null>(null);
  const [loadingPhotos, setLoadingPhotos] = useState<
    Record<string, boolean>
  >({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] =
    useState<string | null>(null);
  const [photoVisitId, setPhotoVisitId] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoCaption, setPhotoCaption] = useState("");
  const [photoDate, setPhotoDate] = useState("");

  const [showVisitForm, setShowVisitForm] = useState(false);

  const [visitTitle, setVisitTitle] = useState("");
  const [visitStory, setVisitStory] = useState("");

  const [visitDate, setVisitDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  });

  const loadPlaces = useCallback(async () => {
    setLoadingPlaces(true);
    setError("");

    try {
      const response = await fetch("/api/places", {
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal mengambil daftar tempat.");
      }

      setSavedPlaces(result.places ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil daftar tempat."
      );
    } finally {
      setLoadingPlaces(false);
    }
  }, []);

  const loadPhotos = useCallback(async (visitId: string) => {
    setLoadingPhotos((current) => ({
      ...current,
      [visitId]: true,
    }));

    try {
      const response = await fetch(
        `/api/places/${selectedPlace?.savedPlaceId}/visits/${visitId}/photos`,
        { cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load photos.");
      }

      setPhotosByVisit((current) => ({
        ...current,
        [visitId]: result.photos ?? [],
      }));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load photos."
      );
    } finally {
      setLoadingPhotos((current) => ({
        ...current,
        [visitId]: false,
      }));
    }
  }, [selectedPlace]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadPlaces(), 0);
    return () => clearTimeout(timer);
  }, [loadPlaces]);

  useEffect(() => {
    const placeId = selectedPlace?.savedPlaceId;

    if (!placeId) {
      return;
    }

    let cancelled = false;

    async function loadVisits() {
      setLoadingVisits(true);

      try {
        const response = await fetch(
          `/api/places/${placeId}/visits`,
          { cache: "no-store" }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "Gagal mengambil daftar kenangan."
          );
        }

        if (!cancelled) {
          const loadedVisits: PlaceVisit[] = result.visits ?? [];

          setVisits(loadedVisits);

          await Promise.all(
            loadedVisits.map((visit) => loadPhotos(visit.id))
          );
        }
      } catch (err) {
        if (!cancelled) {
          setVisits([]);
          setError(
            err instanceof Error
              ? err.message
              : "Gagal mengambil daftar kenangan."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingVisits(false);
        }
      }
    }

    const timer = window.setTimeout(() => void loadVisits(), 0);

    return () => {
      clearTimeout(timer);
      cancelled = true;
    };
  }, [selectedPlace?.savedPlaceId, loadPhotos]);

  const handleSelect = useCallback((place: SelectedPlace) => {
    setShowVisitForm(false); setPhotoVisitId(null); setPhotoFile(null); setVisits([]); setLoadingVisits(Boolean(place.savedPlaceId));
    setSelectedPlace(place);
    setCategory("other");
    setMessage("");
    setError("");
  }, []);



  const handleSavedPlaceClick = useCallback(
    (place: SavedPlace) => {
      setShowVisitForm(false); setPhotoVisitId(null); setPhotoFile(null); setVisits([]); setLoadingVisits(true);
      setSelectedPlace({
        id: place.google_place_id,
        name: place.custom_name || place.place_name,
        address: place.formatted_address || "",
        lat: place.latitude,
        lng: place.longitude,
        savedPlaceId: place.id,
      });

      setCategory(place.category);
      setFocusedPlaceId(place.google_place_id);
      setError("");
      setMessage("");
    },
    []
  );



  async function handleSavePlace() {
    if (!selectedPlace) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/places", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          google_place_id: selectedPlace.id,
          place_name: selectedPlace.name,
          formatted_address: selectedPlace.address,
          latitude: selectedPlace.lat,
          longitude: selectedPlace.lng,
          category,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Place failed to save.");
      }

      setMessage(`"${result.place.place_name}" saved successfully!`);
      setSelectedPlace(null);
      await loadPlaces();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while saving the place."
      );
    } finally {
      setSaving(false);
    }
  }
  async function handleSaveVisit() {
    if (!selectedPlace?.savedPlaceId) {
      setError("Select a place that has been saved first.");
      return;
    }

    if (!visitTitle.trim()) {
      setError("The title of the memory is required.");
      return;
    }

    setSavingVisit(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/places/${selectedPlace.savedPlaceId}/visits`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: visitTitle.trim(),
            story: visitStory.trim(),
            visited_at: visitDate,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to save memories."
        );
      }

      setVisits((current) => [
        result.visit,
        ...current,
      ]);

      setVisitTitle("");
      setVisitStory("");
      setShowVisitForm(false);

      setMessage("Memories saved successfully!");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while saving memories."
      );
    } finally {
      setSavingVisit(false);
    }
  }


  async function handleUploadPhoto(visitId: string) {
    if (!selectedPlace?.savedPlaceId || !photoFile) {
      setError("Please select a photo first.");
      return;
    }

    setUploadingPhoto(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", photoFile);
      formData.append("caption", photoCaption.trim());

      if (photoDate) {
        formData.append("taken_at", photoDate);
      }

      const response = await fetch(
        `/api/places/${selectedPlace.savedPlaceId}/visits/${visitId}/photos`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload photo.");
      }

      setPhotoFile(null);
      setPhotoCaption("");
      setPhotoDate("");
      setPhotoVisitId(null);

      await loadPhotos(visitId);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while uploading the photo."
      );
    } finally {
      setUploadingPhoto(false);
    }
  }
  async function handleDeletePhoto(
    visitId: string,
    photo: PlacePhoto
  ) {
    if (!selectedPlace?.savedPlaceId) {
      setError("Please select a saved place first.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this photo? This action cannot be undone."
    );

    if (!confirmed) return;

    setDeletingPhotoId(photo.id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/places/${selectedPlace.savedPlaceId}/visits/${visitId}/photos?photoId=${encodeURIComponent(photo.id)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete photo.");
      }

      setPhotosByVisit((current) => ({
        ...current,
        [visitId]: (current[visitId] ?? []).filter(
          (item) => item.id !== photo.id
        ),
      }));

      setPreviewPhoto((current) =>
        current?.id === photo.id ? null : current
      );

      setMessage("Photo deleted successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while deleting the photo."
      );
    } finally {
      setDeletingPhotoId(null);
    }
  }
  if (!apiKey) {
    return (
      <p className="places-feedback">
        The map is currently unavailable. Please try again later.
      </p>
    );
  }

  const filteredPlaces = filterSavedPlaces(savedPlaces, savedQuery, categoryFilter);
  const mapView = (
      <section className="places-map-shell">
        <div className={`places-map-canvas ${mapExpanded ? "places-map-canvas-expanded" : ""}`}>


          <Map
            defaultCenter={mapCamera.center}
            defaultZoom={mapCamera.zoom}
            onCameraChanged={event => {
              const { center, zoom } = event.detail;
              setMapCamera(current => current.zoom === zoom && current.center.lat === center.lat && current.center.lng === center.lng ? current : { center, zoom });
            }}
            gestureHandling={mapExpanded ? "greedy" : "cooperative"}
            styles={mapStyles}
            clickableIcons={false}
            mapTypeControl={false}
            streetViewControl={false}
            fullscreenControl={false}
            style={{ width: "100%", height: "100%" }}
          >
            <SavedPlaceMarkers
              places={savedPlaces}
              onSelect={handleSavedPlaceClick}
              focusedPlaceId={focusedPlaceId}
              accent={accentColor}
            />
          </Map>


        </div>
        {!mapExpanded && <button type="button" className="places-map-expand soft-button" onClick={() => setMapExpanded(true)}><Maximize2 size={16} /> Expand map</button>}
      </section>

  );

  return (
    <div className="space-y-5">
      <PlaceSearch onSelect={handleSelect} />


      {selectedPlace && (
        <PlacesPanel title="Place details" centered onClose={() => setSelectedPlace(null)}><section className="places-detail-body">
          {error && <p role="alert" className="places-feedback">{error}</p>}
          {message && <p role="status" className="places-feedback">{message}</p>}
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--primary)] shadow-sm">
              <MapPin size={21} />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-[var(--foreground)]">
                {selectedPlace.name}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                {selectedPlace.address || "Address not available"}
              </p>

            </div>


          </div>

          <div className="mt-4 space-y-3">
            <label
              htmlFor="place-category"
              className="block text-sm font-medium text-[var(--foreground)]"
            >
              Place category
            </label>
            <select
              id="place-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
            >
              {CATEGORIES.map((item) => (
                <option
                  key={item.value}
                  value={item.value}
                  className="bg-[var(--surface)] text-[var(--foreground)]"
                >
                  {item.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleSavePlace}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <BookmarkCheck size={18} />
              )}
              {saving ? "Saving..." : "Save Place"}
            </button>
          </div>

          {/* Memories Section */}
          {selectedPlace.savedPlaceId && (
            <section
              className="mt-5 border-t pt-4"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3
                    className="font-semibold"
                    style={{ color: "var(--foreground)" }}
                  >
                    Our Memories
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowVisitForm((current) => !current);
                    setError("");
                    setMessage("");
                  }}
                  className="shrink-0 rounded-xl px-3 py-2 text-sm font-medium transition"
                  style={{
                    background: "var(--primary)",
                    color: "white",
                  }}
                >
                  {showVisitForm ? "Cancel" : "+ Add Memory"}
                </button>
              </div>

              {showVisitForm && (
                <PlacesPanel title="Add a memory" centered onClose={() => setShowVisitForm(false)}>{error && <p role="alert" className="places-feedback">{error}</p>}<form
                  className="mt-4 space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleSaveVisit();
                  }}
                >
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Memory Title
                    </label>

                    <input
                      type="text"
                      value={visitTitle}
                      onChange={(event) =>
                        setVisitTitle(event.target.value)
                      }
                      placeholder="e.g. Our first photobox"
                      maxLength={200}
                      required
                      className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm outline-none"
                      style={{
                        borderColor: "var(--border)",
                        color: "var(--foreground)",
                      }}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Visit Date
                    </label>

                    <input
                      type="date"
                      value={visitDate}
                      onChange={(event) =>
                        setVisitDate(event.target.value)
                      }
                      required
                      className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm outline-none"
                      style={{
                        borderColor: "var(--border)",
                        color: "var(--foreground)",
                      }}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Our Story
                    </label>

                    <textarea
                      value={visitStory}
                      onChange={(event) =>
                        setVisitStory(event.target.value)
                      }
                      placeholder="Write your story here..."
                      maxLength={10000}
                      rows={4}
                      className="w-full resize-y rounded-xl border bg-transparent px-3 py-2 text-sm outline-none"
                      style={{
                        borderColor: "var(--border)",
                        color: "var(--foreground)",
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingVisit}
                    className="w-full rounded-xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      background: "var(--primary)",
                      color: "white",
                    }}
                  >
                    {savingVisit ? "Saving memory..." : "Save Memory"}
                  </button>
                </form></PlacesPanel>
              )}

              <div className="mt-4 space-y-3">
                {loadingVisits ? (
                  <p
                    className="text-sm"
                    style={{ color: "var(--muted)" }}
                  >
                    Loading memories...
                  </p>
                ) : visits.length === 0 ? (
                  <p
                    className="rounded-xl p-3 text-sm"
                    style={{
                      background: "var(--surface)",
                      color: "var(--muted)",
                    }}
                  >
                    No memories yet. Save your first story together!
                  </p>
                ) : (
                  visits.map((visit) => (
                    <article
                      key={visit.id}
                      className="rounded-2xl border p-4"
                      style={{
                        borderColor: "var(--border)",
                        background: "var(--surface)",
                      }}
                    >
                      <p
                        className="text-xs"
                        style={{ color: "var(--muted)" }}
                      >
                        {new Date(
                          `${visit.visited_at}T12:00:00`
                        ).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>

                      <h4
                        className="mt-1 font-semibold"
                        style={{ color: "var(--foreground)" }}
                      >
                        {visit.title}
                      </h4>

                      {visit.story && (
                        <p
                          className="mt-2 whitespace-pre-wrap text-sm"
                          style={{ color: "var(--muted)" }}
                        >
                          {visit.story}
                        </p>
                      )}

                      <div className="mt-4 border-t pt-4" style={{ borderColor: "var(--border)" }}>
                        <div className="flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setPhotoVisitId((current) =>
                                current === visit.id ? null : visit.id
                              );
                              setPhotoFile(null); setPhotoCaption(""); setPhotoDate("");
                              setError("");
                              setMessage("");
                            }}
                            className="rounded-lg px-3 py-2 text-xs font-medium"
                            style={{
                              background: "var(--primary)",
                              color: "white",
                            }}
                          >
                            {photoVisitId === visit.id ? "Cancel" : "+ Add Photos"}
                          </button>
                        </div>

                        {photoVisitId === visit.id && (
                          <PlacesPanel title="Add a photo" centered onClose={() => setPhotoVisitId(null)}>{error && <p role="alert" className="places-feedback">{error}</p>}<form
                            className="mt-3 space-y-3"
                            onSubmit={(event) => {
                              event.preventDefault();
                              void handleUploadPhoto(visit.id);
                            }}
                          >
                            <div>
                              <label className="mb-1 block text-sm font-medium">
                                Choose Photo
                              </label>

                              <label
                                className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-4 transition-all hover:opacity-80"
                                style={{
                                  borderColor: "var(--border)",
                                  background: "var(--surface)",
                                }}
                              >
                                <div
                                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                                  style={{
                                    background: "var(--surface-raised)",
                                    color: "var(--primary)",
                                  }}
                                >
                                  <ImagePlus size={22} />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p
                                    className="text-sm font-medium"
                                    style={{ color: "var(--foreground)" }}
                                  >
                                    Choose a photo
                                  </p>
                                  <p
                                    className="mt-1 text-xs"
                                    style={{ color: "var(--muted)" }}
                                  >
                                    JPEG, PNG, or WebP · Max 10 MB
                                  </p>
                                </div>

                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  required
                                  onChange={(event) =>
                                    setPhotoFile(event.target.files?.[0] ?? null)
                                  }
                                  className="hidden"
                                />

                                <span
                                  className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium"
                                  style={{
                                    background: "var(--surface-raised)",
                                    color: "var(--foreground)",
                                  }}
                                >
                                  Browse
                                </span>
                              </label>
                            </div>

                            <PlaceUploadPreview key={photoFile?.name ?? "empty"} file={photoFile} />
                            <div>
                              <label className="mb-1 block text-sm font-medium">
                                Caption (Optional)
                              </label>

                              <input
                                type="text"
                                value={photoCaption}
                                onChange={(event) => setPhotoCaption(event.target.value)}
                                maxLength={500}
                                placeholder="Add a little note to this photo..."
                                className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm"
                                style={{
                                  borderColor: "var(--border)",
                                  color: "var(--foreground)",
                                }}
                              />
                            </div>

                            <div>
                              <label className="mb-1 block text-sm font-medium">
                                Photo Date (Optional)
                              </label>

                              <input
                                type="date"
                                value={photoDate}
                                onChange={(event) => setPhotoDate(event.target.value)}
                                className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm"
                                style={{
                                  borderColor: "var(--border)",
                                  color: "var(--foreground)",
                                }}
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={uploadingPhoto || !photoFile}
                              className="w-full rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60"
                              style={{
                                background: "var(--primary)",
                                color: "white",
                              }}
                            >
                              {uploadingPhoto ? "Uploading photo..." : "Save Photo"}
                            </button>
                          </form></PlacesPanel>
                        )}

                        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {loadingPhotos[visit.id] ? (
                            <p className="col-span-full text-sm" style={{ color: "var(--muted)" }}>
                              Loading photos...
                            </p>
                          ) : (
                            (photosByVisit[visit.id] ?? []).map((photo) => (
                              <div key={photo.id} className="min-w-0">
                                {photo.url ? (
                                  <div className="group relative min-w-0">
                                    <button
                                      type="button"
                                      onClick={() => setPreviewPhoto(photo)}
                                      className="block w-full overflow-hidden rounded-xl"
                                      aria-label="View photo in full size"
                                    >
                                      <img
                                        src={photo.url}
                                        alt={photo.caption || visit.title}
                                        loading="lazy"
                                        className="aspect-square w-full rounded-xl object-cover transition duration-300 group-hover:scale-105"
                                      />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => void handleDeletePhoto(visit.id, photo)}
                                      disabled={deletingPhotoId === photo.id}
                                      aria-label="Delete photo"
                                      title="Delete photo"
                                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-100 shadow-sm transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60 sm:opacity-0 sm:group-hover:opacity-100"
                                    >
                                      {deletingPhotoId === photo.id ? (
                                        <LoaderCircle size={16} className="animate-spin" />
                                      ) : (
                                        <X size={16} />
                                      )}
                                    </button>
                                  </div>
                                ) : (
                                  <div
                                    className="flex aspect-square items-center justify-center rounded-xl p-3 text-center text-xs"
                                    style={{
                                      background: "var(--surface)",
                                      color: "var(--muted)",
                                    }}
                                  >
                                    Photo unavailable
                                  </div>
                                )}

                                {photo.caption && (
                                  <p
                                    className="mt-1 break-words text-xs"
                                    style={{ color: "var(--muted)" }}
                                  >
                                    {photo.caption}
                                  </p>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          )}

        </section></PlacesPanel>
      )}

      {message && (
        <p
          role="status"
          className="places-feedback"
        >
          {message}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="places-feedback"
        >
          {error}
        </p>
      )}

      {mapExpanded ? <PlacesPanel title="Explore our places" full onClose={() => setMapExpanded(false)}>{mapView}</PlacesPanel> : mapView}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              Place of Memories
            </h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {savedQuery.trim() || categoryFilter !== "all" ? `${filteredPlaces.length} of ` : ""}{savedPlaces.length} saved {savedPlaces.length === 1 ? "place" : "places"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadPlaces()}
            disabled={loadingPlaces}
            aria-label="Muat ulang daftar tempat"
            className="rounded-full border border-[var(--border)] bg-[var(--surface)] p-2.5 text-[var(--primary)] transition hover:opacity-80 disabled:opacity-50"

          >
        {loadingPlaces ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <RefreshCw size={18} />
            )}
          </button>
        </div>


        <label className="places-saved-search"><Search size={18} aria-hidden="true" /><input type="search" value={savedQuery} onChange={event => setSavedQuery(event.target.value)} placeholder="Search your saved places..." aria-label="Search saved places" /></label>
        <div className="places-category-filters" aria-label="Filter saved places">
          {[{ value: "all", label: "All" }, ...CATEGORIES].map(item => <button key={item.value} type="button" aria-pressed={categoryFilter === item.value} onClick={() => setCategoryFilter(item.value)}>{item.label}</button>)}
        </div>
        {loadingPlaces ? (
          <div className="soft-card-inset flex items-center justify-center gap-2 rounded-2xl p-6 text-sm text-[var(--muted)]">
            <LoaderCircle
              size={18}
              className="animate-spin text-[var(--primary)]"
            />
            Loading memory place...
          </div>
        ) : savedPlaces.length === 0 ? (
          <div className="soft-card flex flex-col items-center px-5 py-8 text-center">
            <div className="soft-card-inset flex h-14 w-14 items-center justify-center rounded-2xl">
              <Heart
                className="text-[var(--primary)]"
                size={26}
              />
            </div>

            <p className="mt-4 font-semibold text-[var(--foreground)]">
              There is no saved space yet
            </p>

            <p className="mt-1 text-sm text-[var(--muted)]">
              Find places you&apos;ve visited and save them here.
            </p>
          </div>
        ) : filteredPlaces.length === 0 ? (
          <div className="soft-card-inset rounded-2xl p-6 text-center text-sm text-[var(--muted)]"><p>No saved places match your search.</p><button type="button" className="mt-3 font-semibold text-[var(--primary)]" onClick={() => { setSavedQuery(""); setCategoryFilter("all"); }}>Clear filters</button></div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filteredPlaces.map((place) => (
              <article
                key={place.id}
                onClick={() => handleSavedPlaceClick(place)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleSavedPlaceClick(place);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Lihat lokasi ${place.custom_name || place.place_name}`}
                className="soft-card places-saved-card flex cursor-pointer items-start gap-3 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              >
                <div className="soft-card-inset flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
                  <MapPin
                    size={20}
                    strokeWidth={1.8}
                    className="text-[var(--primary)]"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="break-words font-semibold text-[var(--foreground)]">
                    {place.custom_name || place.place_name}
                  </h4>

                  <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
                    {place.formatted_address || "Alamat tidak tersedia"}
                  </p>

                  <span className="soft-card-inset mt-3 inline-flex rounded-full px-3 py-1.5 text-xs font-medium text-[var(--primary)]">
                    {CATEGORIES.find(
                      (item) => item.value === place.category
                    )?.label ?? place.category}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}

      </section>
      {previewPhoto?.url && <PlacesPanel title="Memory photo" onClose={() => setPreviewPhoto(null)}>
        <img src={previewPhoto.url} alt={previewPhoto.caption || "Memory photo"} className="max-h-[72dvh] w-full rounded-2xl object-contain" />
        {previewPhoto.caption && <p className="mt-3 break-words text-center text-sm text-[var(--foreground)]">{previewPhoto.caption}</p>}
      </PlacesPanel>}
    </div>
  );
}

export default function MemoryMap() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <p className="places-feedback">
        The map is currently unavailable. Please try again later.
      </p>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <MemoryMapContent />
    </APIProvider>
  );
}

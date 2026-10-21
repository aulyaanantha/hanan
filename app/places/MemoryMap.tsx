
"use client";

import { useCallback, useEffect, useState } from "react";
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
} from "lucide-react";

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

function getMapStyles(accent: AccentColor) {
  const colors = MAP_PALETTES[accent];

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
      autocomplete.removeEventListener("gmp-select", handleSelect);
      autocomplete.removeEventListener("gmp-error", handleError);
      searchElement.replaceChildren();
    };
  }, [places, searchElement, handleSelect]);


  return (
    <div className="space-y-2">
      <div
        ref={setSearchElement}
        className="relative z-30 min-w-0 rounded-xl border border-pink-100 bg-white shadow-sm [&_gmp-place-autocomplete]:w-full"
      />
      {error && (
        <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
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
}: {
  places: SavedPlace[];
  onSelect: (place: SavedPlace) => void;
  focusedPlaceId: string | null;
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
  }, [map, places, onSelect, focusedPlaceId]);

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

  const [accentColor, setAccentColor] =
    useState<AccentColor>("pink");

  useEffect(() => {
    const root = document.documentElement;

    const updateAccent = () => {
      const accent = root.dataset.accent;

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
      attributeFilter: ["data-accent"],
    });

    return () => observer.disconnect();
  }, []);

  const mapStyles = getMapStyles(accentColor);


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

  useEffect(() => {
    void loadPlaces();
  }, [loadPlaces]);

  useEffect(() => {
    const placeId = selectedPlace?.savedPlaceId;

    if (!placeId) {
      setVisits([]);
      setShowVisitForm(false);
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

    void loadVisits();

    return () => {
      cancelled = true;
    };
  }, [selectedPlace?.savedPlaceId]);

  const handleSelect = useCallback((place: SelectedPlace) => {
    setSelectedPlace(place);
    setCategory("other");
    setMessage("");
    setError("");
  }, []);



  const handleSavedPlaceClick = useCallback(
    (place: SavedPlace) => {
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


  async function loadPhotos(visitId: string) {
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
      <p className="rounded-xl bg-pink-50 p-4 text-sm text-pink-800">
        API key not found. Check the .env.local file.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <PlaceSearch onSelect={handleSelect} />


      {selectedPlace && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 transition-colors duration-300 sm:p-5">
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

            <button
              type="button"
              aria-label="Close place details"
              onClick={() => setSelectedPlace(null)}
              className="rounded-full p-2 text-[var(--primary)] transition hover:bg-[var(--surface)]"
            >
              <X size={17} />
            </button>
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
                <form
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
                </form>
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
                          <form
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
                          </form>
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

        </section>
      )}

      {message && (
        <p
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800"
        >
          {message}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <section className="overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-sm">
        <div className="h-[360px] w-full sm:h-[460px] md:h-[560px]">


          <Map
            defaultCenter={DEFAULT_CENTER}
            defaultZoom={12}
            gestureHandling="greedy"
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
            />
          </Map>


        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Place of Memories
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {savedPlaces.length} stored place
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
              Find places you've visited and save them here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {savedPlaces.map((place) => (
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
                className="soft-card flex cursor-pointer items-start gap-3 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
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
      {previewPhoto?.url && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-md"
          onClick={() => setPreviewPhoto(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewPhoto(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
            aria-label="Close photo preview"
          >
            <X size={22} />
          </button>

          <div
            className="flex max-h-[90vh] max-w-5xl flex-col items-center gap-3"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={previewPhoto.url}
              alt={previewPhoto.caption || "Memory photo"}
              className="max-h-[78vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />

            {previewPhoto.caption && (
              <p className="max-w-2xl text-center text-sm text-white">
                {previewPhoto.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MemoryMap() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <p className="rounded-xl bg-pink-50 p-4 text-sm text-pink-800">
        API key not found. Check the .env.local file.
      </p>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <MemoryMapContent />
    </APIProvider>
  );
}

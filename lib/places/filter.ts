type SearchablePlace = { category: string; custom_name: string | null; place_name: string; formatted_address: string | null };

export function filterSavedPlaces<T extends SearchablePlace>(places: T[], search: string, category: string) {
  const query = search.trim().toLocaleLowerCase();
  return places.filter(place => (category === "all" || place.category === category) &&
    [place.custom_name, place.place_name, place.formatted_address].some(value => value?.toLocaleLowerCase().includes(query)));
}

export const MAX_BIKES = 2;

export function addWorkspaceBike(bikes, bike) {
  if (bikes.length >= MAX_BIKES) return bikes;
  return [...bikes, bike];
}

export function replaceWorkspaceBike(bikes, index, bike) {
  if (index < 0 || index >= bikes.length) return bikes;
  return bikes.map((current, bikeIndex) => (bikeIndex === index ? bike : current));
}

export function deleteWorkspaceBike(bikes, index) {
  if (index < 0 || index >= bikes.length) return bikes;
  return bikes.filter((_, bikeIndex) => bikeIndex !== index);
}

export function getComparisonSlotLabel(index) {
  return index === 0 ? "A" : "B";
}

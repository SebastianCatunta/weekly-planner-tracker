// 001/RF-4.2
// Half-open intervals [start, end): touching at one end is not an overlap.
export function overlaps(a, b) {
  return a.startMinute < b.endMinute && b.startMinute < a.endMinute;
}

// 001/RF-4.4
// Exact comparison: "Estudio" and "estudio" are different categories.
function isIdentical(a, b) {
  return (
    a.name === b.name && a.category === b.category && a.startMinute === b.startMinute && a.endMinute === b.endMinute
  );
}

// 001/RF-4.1, 001/RF-4.3, 001/RF-4.4
// Only activities of the candidate's day can conflict with it.
export function findConflicts(candidate, sameDayActivities) {
  const conflicts = sameDayActivities.filter(
    (existing) => existing.day === candidate.day && overlaps(candidate, existing),
  );
  const isDuplicate = conflicts.some((existing) => isIdentical(candidate, existing));
  return { conflicts, isDuplicate };
}

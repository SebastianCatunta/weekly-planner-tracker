// 001/RF-4.2
// Half-open intervals [start, end): touching at one end is not an overlap.
export function overlaps(a, b) {
  return a.startMinute < b.endMinute && b.startMinute < a.endMinute;
}

// 001/RF-4.1, 001/RF-4.3
// Only activities of the candidate's day can conflict with it.
export function findConflicts(candidate, sameDayActivities) {
  const conflicts = sameDayActivities.filter(
    (existing) => existing.day === candidate.day && overlaps(candidate, existing),
  );
  return { conflicts };
}

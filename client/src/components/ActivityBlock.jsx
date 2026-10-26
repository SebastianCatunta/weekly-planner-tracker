// 001/RF-5.1, 001/RF-5.3, 001/RF-5.4
// One activity inside its day column. The category is plain text, with no color.
export default function ActivityBlock({ activity, top, height }) {
  const hours = `${activity.start}–${activity.end}`;
  return (
    <div
      className="activity-block"
      style={{ top, height }}
      title={`${activity.name} · ${activity.category} · ${hours}`}
    >
      <span className="activity-name">{activity.name}</span>
      <span className="activity-category">{activity.category}</span>
      <span className="activity-hours">{hours}</span>
    </div>
  );
}

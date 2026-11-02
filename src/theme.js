export const colors = {
  bg: "#0c0c10",
  card: "#16161c",
  line: "#2a2a33",
  text: "#f4f1ea",
  muted: "#9a958c",
  accent: "#e21b24",
  ink: "#1a1404",
};

export function timeAgo(value) {
  if (!value) return "";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days}d`;
  return new Date(value).toLocaleDateString();
}

export function activityText(item) {
  const title = item?.titleName || "a title";
  switch (item?.type) {
    case "StartedWatching":
      return `started ${title}`;
    case "Finished":
      return `finished ${title}`;
    case "Rated":
      return item.rating != null ? `rated ${title} ${item.rating}` : `rated ${title}`;
    case "Reviewed":
      return `reviewed ${title}`;
    case "InvitedToWatch":
      return `wants to watch ${title}`;
    default:
      return item?.suggestReason || title;
  }
}

const stdout = `
  📅 Activity Patterns
  ────────────────────────────────────────────────────────
  Mon                  0
  Tue                  0
  Wed                  0
  Thu                  0
  Fri                  0
  Sat                  0
  Sun  ███████████████ 10

  Peak hours: 2AM (5), 1AM (2), 3AM (2), 12AM (1)
`;

const activityRegex = /📅 Activity Patterns[\s\S]*?────────────────────────────────────────────────────────([\s\S]*?)Peak hours:/;
const match = stdout.match(activityRegex);
if (match) {
  const lines = match[1].trim().split('\n');
  const activity = lines.map(line => {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 2) {
      return {
        day: parts[0],
        count: parseInt(parts[parts.length - 1], 10)
      };
    }
  }).filter(Boolean);
  console.log(activity);
}

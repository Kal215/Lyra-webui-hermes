const stdout = `Profile          Model                        Gateway      Alias        Distribution
 ───────────────    ───────────────────────────    ───────────    ───────────    ────────────────────
 ◆default         hermes-agent                 stopped      —            —
  worker-1        minicpm-v                    stopped      —            —`;

const lines = stdout.split('\n').slice(2).filter(l => l.trim().length > 0);
const profiles = lines.map(l => {
  const is_active = l.includes('◆');
  const nameMatch = l.match(/[◆\s]([a-zA-Z0-9_-]+)\s+/);
  return {
    name: nameMatch ? nameMatch[1] : 'unknown',
    is_active,
    dir: nameMatch && nameMatch[1] === 'default' ? '.hermes-backend' : '.hermes-backend/profiles/' + (nameMatch ? nameMatch[1] : '')
  };
});
console.log(profiles);

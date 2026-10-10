const fs = require('fs');
const stdout = `
  🔧 Top Tools
  ────────────────────────────────────────────────────────
  Tool                            Calls        %
  terminal                           15    33.3%
  write_file                         13    28.9%
  web_search                          7    15.6%
  kanban_show                         4     8.9%
  kanban_complete                     3     6.7%
  execute_code                        2     4.4%
  browser_exec                        1     2.2%

  📅 Activity Patterns
`;

const toolsRegex = /🔧 Top Tools[\s\S]*?Tool\s+Calls\s+%([\s\S]*?)📅 Activity Patterns/;
const match = stdout.match(toolsRegex);
if (match) {
  const lines = match[1].trim().split('\n');
  const tools = lines.map(line => {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 3) {
      return {
        name: parts[0],
        calls: parseInt(parts[1], 10),
        percentage: parseFloat(parts[2].replace('%', ''))
      };
    }
  }).filter(Boolean);
  console.log(tools);
}

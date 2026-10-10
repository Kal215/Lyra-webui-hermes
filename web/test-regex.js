const line = "2026-10-11 00:16:11,194 INFO hermes_cli.plugins: Plugin\r";
const regex = /^(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2},\d{3})\s+(INFO|WARNING|ERROR|DEBUG)\s+(?:\[(.*?)\]\s+)?(.*?):\s+(.*)$/;
console.log(line.match(regex));

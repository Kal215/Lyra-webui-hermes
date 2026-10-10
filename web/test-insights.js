const { execFileSync } = require('child_process');
const stdout = execFileSync('hermes', ['insights'], { env: { ...process.env, HERMES_HOME: 'D:/project/LyraWebsite/lyra-stack-opensource/web/.hermes-backend' }, encoding: 'utf8' });

const extractRegex = (regex, text, defaultValue = 0) => {
  const match = text.match(regex);
  return match ? parseInt(match[1].replace(/,/g, ''), 10) : defaultValue;
}

const sessions = extractRegex(/Sessions:\s+([\d,]+)/, stdout);
const messages = extractRegex(/Messages:\s+([\d,]+)/, stdout);
const inputTokens = extractRegex(/Input tokens:\s+([\d,]+)/, stdout);
const outputTokens = extractRegex(/Output tokens:\s+([\d,]+)/, stdout);
const totalTokens = extractRegex(/Total tokens:\s+([\d,]+)/, stdout);
const toolCalls = extractRegex(/Tool calls:\s+([\d,]+)/, stdout);

console.log({sessions, messages, inputTokens, outputTokens, totalTokens, toolCalls});

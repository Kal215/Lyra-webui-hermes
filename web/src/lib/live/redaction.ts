// Redaction patterns
const AUTH_HEADER_REGEX = /(Authorization:\s*Bearer\s+)[A-Za-z0-9\-\._~+\/]+/gi;
const API_KEY_REGEX = /(API_KEY\s*=\s*['"]?)[A-Za-z0-9\-\._~+\/]+/gi;
const URL_CREDENTIAL_REGEX = /([a-zA-Z0-9\+\.\-]+:\/\/)([^:@\s]+):([^:@\s]+)@/gi;
const PASSWORD_KV_REGEX = /(password\s*=\s*['"]?)[^'"\s]+/gi;

export function redactText(text: string): string {
  if (!text) return text;
  
  let redacted = text;
  redacted = redacted.replace(AUTH_HEADER_REGEX, '$1[REDACTED]');
  redacted = redacted.replace(API_KEY_REGEX, '$1[REDACTED]');
  redacted = redacted.replace(URL_CREDENTIAL_REGEX, '$1$2:[REDACTED]@');
  redacted = redacted.replace(PASSWORD_KV_REGEX, '$1[REDACTED]');
  
  return redacted;
}

const SENSITIVE_FILE_PATTERNS = [
  /\.env(\..+)?$/,
  /\.pem$/,
  /\.key$/,
  /id_rsa$/,
  /id_ed25519$/,
  /^\/\.ssh\//,
  /^\/\.config\//,
  /^\/etc\//,
  /^\/var\/lib\/9router\//,
];

export function isSensitiveFile(filePath: string): boolean {
  return SENSITIVE_FILE_PATTERNS.some(pattern => pattern.test(filePath));
}

export function isWithinProjectRoot(filePath: string, projectRoot: string): boolean {
  // A simplistic mock check to prevent traversal
  const normalizedPath = filePath.replace(/\\/g, '/');
  if (normalizedPath.includes('../') || normalizedPath.includes('..\\')) {
    return false;
  }
  
  // If it's absolute, check it starts with root
  if (normalizedPath.startsWith('/')) {
    return normalizedPath.startsWith(projectRoot.replace(/\\/g, '/'));
  }
  
  // If relative and no ../, it's generally fine
  return true;
}

export function processFileEvent(filePath: string, projectRoot: string, eventObj: any) {
  if (!isWithinProjectRoot(filePath, projectRoot)) {
    return {
      ...eventObj,
      hidden: true,
      reason: 'out_of_bounds'
    };
  }

  if (isSensitiveFile(filePath)) {
    return {
      ...eventObj,
      hidden: true,
      reason: 'sensitive_file',
      payload: { ...eventObj.payload, content: '[hidden]', patch: [] } // omit content
    };
  }

  return eventObj;
}

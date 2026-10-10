import fs from 'fs';
import path from 'path';

export const MAX_FILE_SIZE = 50 * 1024; // 50 KB
export const MAX_PATCH_BYTES = 50 * 1024; // 50 KB

const SENSITIVE_PATTERNS = [
  /^\.env(\..*)?$/,
  /credentials/i,
  /secrets/i,
  /private.*key/i,
  /id_rsa/,
  /id_ed25519/,
  /auth_token/i,
];

const SENSITIVE_DIRS = [
  process.env.HOME + '/.ssh',
  process.env.HOME + '/.hermes',
  '/var/lib/9router',
  '/etc'
];

export function isSensitive(absolutePath: string): boolean {
  for (const dir of SENSITIVE_DIRS) {
    // Prefix collision safe
    const dirWithSep = dir.endsWith(path.sep) ? dir : dir + path.sep;
    if (absolutePath === dir || absolutePath.startsWith(dirWithSep)) {
      return true;
    }
  }
  
  const filename = path.basename(absolutePath);
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(filename)) {
      return true;
    }
  }
  return false;
}

export function safeReadFile(filePath: string): { content?: string, truncated?: boolean, error?: string } {
  try {
    const absolutePath = path.resolve(filePath);
    let realPath: string;
    
    // NEW_FILE_SAFE_PARENT_POLICY: Handle non-existent files safely
    try {
      realPath = fs.realpathSync(absolutePath);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        const parent = path.dirname(absolutePath);
        const realParent = fs.realpathSync(parent);
        realPath = path.join(realParent, path.basename(absolutePath));
      } else {
        throw err;
      }
    }
    
    const approvedRoot = process.env.APPROVED_ROOT || '/app';
    const rootWithSep = approvedRoot.endsWith(path.sep) ? approvedRoot : approvedRoot + path.sep;
    
    // ROOT_PREFIX_COLLISION_BLOCKED: safe containment
    if (realPath !== approvedRoot && !realPath.startsWith(rootWithSep)) {
      return { error: "path_outside_root" };
    }
    
    if (isSensitive(realPath)) {
      return { error: "sensitive_file_blocked" };
    }
    
    if (!fs.existsSync(realPath)) {
        return { error: "file_does_not_exist" };
    }

    const stats = fs.statSync(realPath);
    if (!stats.isFile()) {
      return { error: "not_a_file" };
    }
    
    if (stats.size > MAX_FILE_SIZE) {
      return { truncated: true, error: "too_large" };
    }
    
    // Binary detection: check first 4KB for NUL bytes
    const buffer = Buffer.alloc(4096);
    const fd = fs.openSync(realPath, 'r');
    const bytesRead = fs.readSync(fd, buffer, 0, 4096, 0);
    fs.closeSync(fd);
    
    if (buffer.subarray(0, bytesRead).includes(0)) {
      return { error: "binary_file_blocked" };
    }
    
    const content = fs.readFileSync(realPath, 'utf8');
    return { content };
  } catch (err: any) {
    return { error: err.message };
  }
}

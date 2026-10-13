/**
 * Lyra Autonomous Studio - Smart Document Chunker (Phase 4)
 * 
 * Implements sliding-window document chunking for deep file context.
 * Splits large files (source code, logs, datasets, markdown docs) into
 * overlapping windows with precise line index boundaries and token estimations,
 * preventing model context window overflow while preserving deep semantic continuity.
 */

export interface DocumentChunk {
  id: string;
  chunkIndex: number; // 1-based index (e.g. 1, 2, 3...)
  totalChunks: number;
  startLine: number;
  endLine: number;
  charCount: number;
  estimatedTokens: number;
  content: string;
  snippet: string;
}

export interface ChunkingResult {
  totalLines: number;
  totalChars: number;
  estimatedTokens: number;
  isChunked: boolean;
  chunks: DocumentChunk[];
}

export interface ChunkingOptions {
  maxLinesPerChunk?: number; // default: 120 lines
  overlapLines?: number;     // default: 20 lines
  maxCharsPerChunk?: number; // default: 12000 characters
}

/**
 * Splits plain text/document content into overlapping sliding-window chunks.
 */
export function chunkDocument(
  content: string, 
  options: ChunkingOptions = {}
): ChunkingResult {
  const maxLines = options.maxLinesPerChunk || 120;
  const overlap = options.overlapLines || 20;
  const maxChars = options.maxCharsPerChunk || 12000;

  const lines = content.split(/\r?\n/);
  const totalLines = lines.length;
  const totalChars = content.length;
  const estimatedTokens = Math.ceil(totalChars / 4);

  // If document is small enough in lines and characters, return single chunk
  if (totalLines <= maxLines && totalChars <= maxChars) {
    return {
      totalLines,
      totalChars,
      estimatedTokens,
      isChunked: false,
      chunks: [{
        id: 'chunk_1',
        chunkIndex: 1,
        totalChunks: 1,
        startLine: 1,
        endLine: totalLines,
        charCount: totalChars,
        estimatedTokens,
        content: content,
        snippet: lines[0] ? lines[0].slice(0, 100) : ''
      }]
    };
  }

  const step = Math.max(1, maxLines - overlap);
  const chunks: DocumentChunk[] = [];
  let chunkIdx = 1;

  for (let i = 0; i < totalLines; i += step) {
    const sliceEnd = Math.min(totalLines, i + maxLines);
    const chunkLines = lines.slice(i, sliceEnd);
    const chunkContent = chunkLines.join('\n');

    // Handle minified files or ultra-dense lines
    if (chunkContent.length > maxChars) {
      const charStep = Math.max(1000, maxChars - 1000);
      for (let c = 0; c < chunkContent.length; c += charStep) {
        const sub = chunkContent.slice(c, c + maxChars);
        chunks.push({
          id: `chunk_${chunkIdx}`,
          chunkIndex: chunkIdx,
          totalChunks: 0,
          startLine: i + 1,
          endLine: sliceEnd,
          charCount: sub.length,
          estimatedTokens: Math.ceil(sub.length / 4),
          content: sub,
          snippet: sub.slice(0, 100).trim()
        });
        chunkIdx++;
      }
    } else {
      chunks.push({
        id: `chunk_${chunkIdx}`,
        chunkIndex: chunkIdx,
        totalChunks: 0,
        startLine: i + 1,
        endLine: sliceEnd,
        charCount: chunkContent.length,
        estimatedTokens: Math.ceil(chunkContent.length / 4),
        content: chunkContent,
        snippet: chunkLines[0] ? chunkLines[0].trim().slice(0, 100) : ''
      });
      chunkIdx++;
    }

    if (sliceEnd >= totalLines) break;
  }

  // Assign resolved totalChunks to each chunk item
  for (const c of chunks) {
    c.totalChunks = chunks.length;
  }

  return {
    totalLines,
    totalChars,
    estimatedTokens,
    isChunked: chunks.length > 1,
    chunks
  };
}

/**
 * Formats chunked document metadata into a structured system prompt context.
 * Injects a Table of Contents (TOC) and sequential sliding windows so the AI model
 * has full visibility of document topology without crashing token context limits.
 */
export function buildChunkedContextPrompt(
  fileName: string,
  chunkResult: ChunkingResult,
  maxPromptChars: number = 75000
): string {
  if (!chunkResult.isChunked || chunkResult.chunks.length === 1) {
    const singleContent = chunkResult.chunks[0]?.content || '';
    return `\n[ATTACHED FILE CONTENT: "${fileName}" (Total ${chunkResult.totalLines} lines)]\n\`\`\`\n${singleContent}\n\`\`\`\n[END OF FILE "${fileName}"]\n`;
  }

  let prompt = `\n[SMART CHUNKED DOCUMENT: "${fileName}" | Total: ${chunkResult.totalLines} lines across ${chunkResult.chunks.length} sliding chunks (overlap: 20 lines)]\n`;
  
  // Table of Contents (TOC)
  prompt += `--- DOCUMENT INDEX & TOPOLOGY ---\n`;
  for (const ch of chunkResult.chunks) {
    prompt += `• Chunk ${ch.chunkIndex}/${ch.totalChunks} (Lines ${ch.startLine}-${ch.endLine}, ~${ch.estimatedTokens} tokens): "${ch.snippet.replace(/\n/g, ' ').slice(0, 70)}..."\n`;
  }
  prompt += `---------------------------------\n\n`;

  // Append sequential chunks within budget
  let currentChars = prompt.length;
  for (const ch of chunkResult.chunks) {
    const chunkBlock = `--- [Chunk ${ch.chunkIndex}/${ch.totalChunks} | Lines ${ch.startLine}-${ch.endLine}] ---\n${ch.content}\n\n`;
    if (currentChars + chunkBlock.length > maxPromptChars) {
      prompt += `[REMAINDER OF CHUNKS (${ch.chunkIndex} to ${ch.totalChunks}) INDEXED IN TOPOLOGY ABOVE TO PRESERVE TOKEN BUDGET]\n`;
      break;
    }
    prompt += chunkBlock;
    currentChars += chunkBlock.length;
  }

  prompt += `[END OF SMART CHUNKED DOCUMENT "${fileName}"]\n`;
  return prompt;
}

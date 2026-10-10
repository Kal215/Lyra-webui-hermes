export function extractInlineThinking(text: string, streaming: boolean = false): { reasoning: string; content: string; inThinking: boolean } {
  const openTag = '<think>';
  const closeTag = '</think>';
  
  if (!text) return { reasoning: '', content: '', inThinking: false };

  // Fast path: if no open tag or partial open tag, return as is
  if (text.indexOf(openTag) === -1) {
    let tailIsPartial = false;
    if (streaming) {
      for (let n = openTag.length - 1; n > 0; n--) {
        if (text.endsWith(openTag.substring(0, n))) {
          tailIsPartial = true;
          break;
        }
      }
    }
    if (!tailIsPartial) {
      return { reasoning: '', content: text, inThinking: false };
    }
  }

  let reasoning = '';
  let content = '';
  let inThinking = false;
  let i = 0;

  while (i < text.length) {
    if (!inThinking) {
      const openIdx = text.indexOf(openTag, i);
      if (openIdx !== -1) {
        content += text.substring(i, openIdx);
        inThinking = true;
        i = openIdx + openTag.length;
      } else {
        // Check partial tag at the end when streaming
        if (streaming) {
          let matchedPartial = false;
          for (let n = openTag.length - 1; n > 0; n--) {
            const prefix = openTag.substring(0, n);
            if (text.endsWith(prefix)) {
              content += text.substring(i, text.length - prefix.length);
              inThinking = true;
              matchedPartial = true;
              i = text.length; // Stop parsing
              break;
            }
          }
          if (matchedPartial) break;
        }
        
        content += text.substring(i);
        break;
      }
    } else {
      const closeIdx = text.indexOf(closeTag, i);
      if (closeIdx !== -1) {
        reasoning += text.substring(i, closeIdx);
        inThinking = false;
        i = closeIdx + closeTag.length;
        // add newline between multiple reasoning blocks if needed
        if (reasoning && !reasoning.endsWith('\n')) reasoning += '\n\n';
      } else {
        reasoning += text.substring(i);
        break;
      }
    }
  }

  return { 
    reasoning: reasoning.trim(), 
    content: content.trimStart(), // Only trim leading whitespace so streaming markdown isn't broken
    inThinking 
  };
}
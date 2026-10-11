import { extractInlineThinking } from '@/lib/reasoning/extractor';

export function buildRichMessages(rawMessages: any[]) {
  const richMsgs: any[] = [];
  let currentAssistant: any = null;

  for (const m of rawMessages) {
    const rawTs = m.timestamp ? (m.timestamp > 1e11 ? m.timestamp : m.timestamp * 1000) : Date.now();
    if (m.role === 'user') {
      richMsgs.push({ role: 'user', content: m.content, timestamp: rawTs });
      currentAssistant = null;
    } else if (m.role === 'assistant') {
      const extracted = extractInlineThinking(m.content || '', false);
      const displayContent = extracted.content;
      
      let reasoningObj = null;
      if (extracted.reasoning) {
        reasoningObj = {
          startTime: Date.now() - 1000,
          endTime: Date.now(),
          text: extracted.reasoning
        };
      }

      if (m.tool_calls && m.tool_calls.length > 0) {
        if (!currentAssistant) {
          currentAssistant = { role: 'assistant', content: displayContent, rawContent: m.content || '', tools: [], reasoning: reasoningObj, timestamp: rawTs };
          richMsgs.push(currentAssistant);
        } else {
          if (m.content) {
            currentAssistant.rawContent += '\n' + m.content;
            const updated = extractInlineThinking(currentAssistant.rawContent, false);
            currentAssistant.content = updated.content;
            if (updated.reasoning) {
              currentAssistant.reasoning = { ...currentAssistant.reasoning, text: updated.reasoning };
            }
          }
        }

        for (const tc of m.tool_calls) {
          currentAssistant.tools.push({
            id: tc.id,
            name: tc.function.name,
            input: JSON.parse(tc.function.arguments || '{}'),
            result: null,
            startTime: Date.now()
          });
        }
      } else {
        if (!currentAssistant) {
          currentAssistant = { role: 'assistant', content: displayContent, rawContent: m.content || '', tools: [], reasoning: reasoningObj, timestamp: rawTs };
          richMsgs.push(currentAssistant);
        } else {
          if (m.content) {
            currentAssistant.rawContent += (currentAssistant.rawContent ? '\n\n' : '') + m.content;
            const updated = extractInlineThinking(currentAssistant.rawContent, false);
            currentAssistant.content = updated.content;
            if (updated.reasoning) {
              if (!currentAssistant.reasoning) currentAssistant.reasoning = { startTime: Date.now() - 1000, endTime: Date.now(), text: '' };
              currentAssistant.reasoning.text = updated.reasoning;
            }
          }
        }
      }
    } else if (m.role === 'tool') {
      // Tool result
      if (currentAssistant && currentAssistant.tools) {
        const activeTool = currentAssistant.tools.find((t: any) => t.id === m.tool_call_id || !t.result);
        if (activeTool) {
          let output = m.content;
          let isError = false;
          let duration = 0;
          try {
            const parsed = JSON.parse(output);
            if (parsed.output !== undefined) output = parsed.output;
            if (parsed.duration_ms) duration = parsed.duration_ms;
            if (parsed.is_error) isError = true;
          } catch (e) {}
          activeTool.result = { output, duration_ms: duration, is_error: isError };
        }
      }
    }
  }

  return richMsgs;
}

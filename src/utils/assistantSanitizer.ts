const TOOL_NAMES = [
  'get_user_profile',
  'get_workout_history',
  'get_diet_history',
  'get_club_and_wallet_info',
  'search_exercise_media',
  'get_youtube_videos',
  'get_scheduled_plans',
  'schedule_workout_plan',
  'schedule_diet_plan',
  'output_workout_plan',
  'search_swiggy_food',
];
const TRACE_LABEL_TEXTS = [
  'Tool Call',
  'Tool Result',
  'Tool Response',
  'Function Call',
  'Function Response',
  'Function',
  'tool_code',
  'function_response',
  'function_call',
  'Input',
  'Output',
  'Arguments',
  'Result',
];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const labelToPattern = (value: string) => escapeRegExp(value).replace(/\s+/g, '\\s*');

const TOOL_NAME_PATTERN = TOOL_NAMES.map(escapeRegExp).sort((a, b) => b.length - a.length).join('|');
const TRACE_LABEL_SOURCE = TRACE_LABEL_TEXTS.map(labelToPattern).join('|');
const TRACE_LABEL_PATTERN = `(${TRACE_LABEL_SOURCE})`;
const STREAM_PREFIX = new RegExp(`(^|[^A-Za-z0-9_])(?:${TRACE_LABEL_SOURCE})\\s*:?`, 'i');
const NORMALIZED_TRACE_LABELS = TRACE_LABEL_TEXTS.map((label) => label.toLowerCase());

export const sanitizeAssistantText = (value: unknown, options?: { strip?: boolean }): string => {
  if (value === null || value === undefined) return '';

  const strip = options?.strip ?? true;
  let text = String(value).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const fencedTrace = new RegExp(
    '```(?:json|tool_code|python|javascript|js)?\\s*\\n(?=[\\s\\S]*?(?:' +
      TOOL_NAME_PATTERN +
      '|function_call|function_response|tool_code|"args"|"arguments"|"response"))[\\s\\S]*?```',
    'gi'
  );
  const labelBlock = new RegExp(
    '^\\s*' + TRACE_LABEL_PATTERN + '\\s*:?\\s*(?:```[\\s\\S]*?```|\\{[\\s\\S]*?\\}|\\[[\\s\\S]*?\\])\\s*$',
    'gim'
  );
  const labelLine = new RegExp('^\\s*' + TRACE_LABEL_PATTERN + '\\s*:?\\s*.*$', 'gim');
  const toolLine = new RegExp(
    '^\\s*(?:[-*]\\s*)?(?:' + TOOL_NAME_PATTERN + ')\\s*(?:\\(|:|\\{|\\[|=).*$',
    'gim'
  );
  const jsonToolLine = new RegExp(
    '^\\s*(?:\\{|\\[).*(?:' +
      TOOL_NAME_PATTERN +
      '|function_call|function_response|tool_code|"args"|"arguments").*(?:\\}|\\])\\s*$',
    'gim'
  );
  const xmlTrace = /<(?:tool_code|function_call|function_response|tool_result)[^>]*>[\s\S]*?<\/(?:tool_code|function_call|function_response|tool_result)>/gi;
  const dangling = new RegExp(TRACE_LABEL_PATTERN + '\\s*:?\\s*$', 'i');

  let previous = '';
  while (previous !== text) {
    previous = text;
    text = text
      .replace(xmlTrace, '')
      .replace(fencedTrace, '')
      .replace(labelBlock, '')
      .replace(jsonToolLine, '')
      .replace(toolLine, '')
      .replace(labelLine, '')
      .replace(dangling, '');
  }

  text = text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  return strip ? text.trim() : text;
};

export const createAssistantStreamSanitizer = () => {
  const HOLD_TAIL = 96;
  let buffer = '';
  let cleanTotal = '';
  let skipping = false;
  let depth = 0;
  let seenStructured = false;
  let lineChars = 0;

  const appendCleanDelta = (delta: string) => {
    const cleaned = sanitizeAssistantText(delta, { strip: false });
    if (cleaned) cleanTotal += cleaned;
  };

  const normalizeTraceFragment = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trimStart();

  const findPartialTraceStart = () => {
    const scanStart = Math.max(0, buffer.length - 40);
    for (let index = scanStart; index < buffer.length; index += 1) {
      if (index > 0 && /[A-Za-z0-9_]/.test(buffer[index - 1])) continue;

      const fragment = normalizeTraceFragment(buffer.slice(index));
      if (!fragment.trim()) continue;

      const isPartialTrace = NORMALIZED_TRACE_LABELS.some(
        (label) => label.startsWith(fragment) && fragment.length < label.length
      );
      if (isPartialTrace) return index;
    }
    return -1;
  };

  const currentVisibleText = () => {
    const partialTraceStart = findPartialTraceStart();
    const visibleBuffer = partialTraceStart >= 0 ? buffer.slice(0, partialTraceStart) : buffer;
    return sanitizeAssistantText(cleanTotal + visibleBuffer);
  };

  const consumeSkippedChar = (ch: string) => {
    lineChars += 1;
    if (ch === '{' || ch === '[') {
      seenStructured = true;
      depth += 1;
      return;
    }
    if (ch === '}' || ch === ']') {
      depth = Math.max(0, depth - 1);
      if (seenStructured && depth === 0) {
        skipping = false;
        lineChars = 0;
      }
      return;
    }
    if (ch === '\n' && !seenStructured) {
      skipping = false;
      lineChars = 0;
      return;
    }
    if (lineChars > 1500) {
      skipping = false;
      lineChars = 0;
    }
  };

  return {
    feed(chunk: unknown) {
      if (chunk === null || chunk === undefined || chunk === '') {
        return currentVisibleText();
      }

      for (const ch of String(chunk)) {
        if (skipping) {
          consumeSkippedChar(ch);
          continue;
        }

        buffer += ch;
        const match = STREAM_PREFIX.exec(buffer);
        if (match) {
          const labelStart = match.index + (match[1]?.length || 0);
          appendCleanDelta(buffer.slice(0, labelStart));
          buffer = '';
          skipping = true;
          depth = 0;
          seenStructured = false;
          lineChars = 0;
          continue;
        }

        if (buffer.length > HOLD_TAIL) {
          appendCleanDelta(buffer.slice(0, -HOLD_TAIL));
          buffer = buffer.slice(-HOLD_TAIL);
        }
      }

      return currentVisibleText();
    },
    flush() {
      if (skipping) {
        buffer = '';
        skipping = false;
        return sanitizeAssistantText(cleanTotal);
      }

      appendCleanDelta(buffer);
      buffer = '';
      return sanitizeAssistantText(cleanTotal);
    },
  };
};

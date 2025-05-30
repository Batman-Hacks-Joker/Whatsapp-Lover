
import type { ChatMessage } from '@/types/chat';
import { parse as parseDate, isValid } from 'date-fns';

// General WhatsApp-style regex: captures dates with . or /, optional AM/PM, flexible spacing
// Example: 1/15/23, 10:00 - Alice: Hello world
// Or: 15.01.2023, 10:00 AM - Bob: Message
const WHATSAPP_GENERAL_REGEX = /^(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{2,4}),\s*(\d{1,2}:\d{2}(?:\s*[AP]M)?)\s*-\s*([^:]+):\s*([\s\S]+)$/;

// Simpler regex: [YYYY-MM-DD HH:MM:SS] User: Message
const GENERIC_STYLE_REGEX = /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] ([^:]+): ([\s\S]+)$/;

function parseMdyTimestamp(dateStrRaw: string, timeStr: string): Date | null {
    const fullDateTimeStr = `${dateStrRaw}, ${timeStr}`;
    // Order matters: try more specific (e.g. MM/dd/yyyy) before less specific (M/d/yy) if there's ambiguity,
    // but date-fns parse is generally good at picking the right one from these.
    const formatsToTry = [
        // MDY with /
        'MM/dd/yyyy, h:mm a', 'MM/dd/yyyy, HH:mm',
        'M/d/yyyy, h:mm a', 'M/d/yyyy, HH:mm',
        'MM/dd/yy, h:mm a', 'MM/dd/yy, HH:mm',
        'M/d/yy, h:mm a', 'M/d/yy, HH:mm',
        // MDY with .
        'MM.dd.yyyy, h:mm a', 'MM.dd.yyyy, HH:mm',
        'M.d.yyyy, h:mm a', 'M.d.yyyy, HH:mm',
        'MM.dd.yy, h:mm a', 'MM.dd.yy, HH:mm',
        'M.d.yy, h:mm a', 'M.d.yy, HH:mm',
    ];
    for (const fmt of formatsToTry) {
        const parsed = parseDate(fullDateTimeStr, fmt, new Date());
        if (isValid(parsed)) return parsed;
    }
    return null;
}

function parseDmyTimestamp(dateStrRaw: string, timeStr: string): Date | null {
    const fullDateTimeStr = `${dateStrRaw}, ${timeStr}`;
    const formatsToTry = [
        // DMY with /
        'dd/MM/yyyy, h:mm a', 'dd/MM/yyyy, HH:mm',
        'd/M/yyyy, h:mm a', 'd/M/yyyy, HH:mm',
        'dd/MM/yy, h:mm a', 'dd/MM/yy, HH:mm',
        'd/M/yy, h:mm a', 'd/M/yy, HH:mm',
        // DMY with .
        'dd.MM.yyyy, h:mm a', 'dd.MM.yyyy, HH:mm',
        'd.M.yyyy, h:mm a', 'd.M.yyyy, HH:mm',
        'dd.MM.yy, h:mm a', 'dd.MM.yy, HH:mm',
        'd.M.yy, h:mm a', 'd.M.yy, HH:mm',
    ];
    for (const fmt of formatsToTry) {
        const parsed = parseDate(fullDateTimeStr, fmt, new Date());
        if (isValid(parsed)) return parsed;
    }
    return null;
}

interface LineParserResult {
  timestamp: Date;
  user: string;
  message: string;
}

interface LineParser {
    regex: RegExp;
    parseFn: (match: RegExpMatchArray) => LineParserResult | null;
}

const TXT_PARSERS: LineParser[] = [
    {
        regex: WHATSAPP_GENERAL_REGEX,
        parseFn: (match: RegExpMatchArray): LineParserResult | null => {
            const datePart = match[1];
            const timePart = match[2];
            const user = match[3];
            const messageContent = match[4];

            // Try parsing as MDY first (common in US)
            let ts = parseMdyTimestamp(datePart, timePart);
            // If MDY fails or returns an invalid date, try DMY
            if (!ts || !isValid(ts)) {
                ts = parseDmyTimestamp(datePart, timePart);
            }

            if (ts && isValid(ts)) {
                return { timestamp: ts, user: user.trim(), message: messageContent.trim() };
            }
            return null;
        }
    },
    {
        regex: GENERIC_STYLE_REGEX,
        parseFn: (match: RegExpMatchArray): LineParserResult | null => {
            const dateTimeString = match[1]; // "YYYY-MM-DD HH:MM:SS"
            const user = match[2];
            const messageContent = match[3];
            const timestamp = parseDate(dateTimeString, 'yyyy-MM-dd HH:mm:ss', new Date());
            if (isValid(timestamp)) {
                return { timestamp, user: user.trim(), message: messageContent.trim() };
            }
            return null;
        }
    }
];


export function parseChatFile(fileContent: string, fileType: 'txt' | 'csv'): { messages: ChatMessage[]; topEmojis: { emoji: string; count: number }[] } {
  const lines = fileContent.split('\n');
  const messages: ChatMessage[] = [];
  let unknownLines = 0;

  if (fileType === 'csv') {
    console.warn("CSV parsing is basic. Assumes specific column orders and comma as delimiter without escaping.");
    lines.forEach((line, index) => {
      if (index === 0 && (line.toLowerCase().includes('timestamp') || line.toLowerCase().includes('date') || line.toLowerCase().includes('time'))) return; // Skip header

      const parts = line.split(','); // Naive split, won't handle commas in messages
      if (parts.length >= 3) {
        let timestampStr = parts[0].trim();
        let user = parts[1].trim();
        let message = parts.slice(2).join(',').trim(); // Re-joins the rest
        
        // Attempt to handle "Date, Time, User, Message" structure
        if (parts.length >= 4 && parts[0].match(/^\d{1,2}[\.\/]\d{1,2}[\.\/]\d{2,4}$/i) && parts[1].match(/^\d{1,2}:\d{2}(?:\s*[AP]M)?$/i)) {
            timestampStr = `${parts[0].trim()} ${parts[1].trim()}`;
            user = parts[2].trim();
            message = parts.slice(3).join(',').trim();
        }
        
        let parsedTimestamp: Date | null = null;
        // Try common date/time parsing for CSV timestamps
        // These functions expect "date, time" structure, so we pass date as first arg, time as second (if available)
        // If timestampStr is already combined, it might work with one of the internal formats.
        const dateTimeParts = timestampStr.split(/[\s,]+/); // Split by space or comma
        const datePart = dateTimeParts[0];
        const timePart = dateTimeParts.length > 1 ? dateTimeParts.slice(1).join(' ') : '00:00'; // Default time if not present

        parsedTimestamp = parseMdyTimestamp(datePart, timePart);
        if (!parsedTimestamp || !isValid(parsedTimestamp)) {
            parsedTimestamp = parseDmyTimestamp(datePart, timePart);
        }
        // Fallback for ISO-like or other direct parses
        if (!parsedTimestamp || !isValid(parsedTimestamp)) {
             parsedTimestamp = new Date(timestampStr); // Last resort direct parse
        }


        if (parsedTimestamp && isValid(parsedTimestamp)) {
           messages.push({
            id: `msg-${parsedTimestamp.getTime()}-${messages.length}`,
            timestamp: parsedTimestamp,
            user: user,
            message: message,
          });
        } else {
          if (line.trim() !== '') unknownLines++;
        }
      } else if (line.trim() !== '') {
        unknownLines++;
      }
    });

  } else { // TXT parsing
    let currentMessageBuffer: Partial<LineParserResult> = {};

    // Helper function to process and potentially add a message
    const processAndAddMessage = (messageBuffer: Partial<LineParserResult>) => {
      if (messageBuffer.message && messageBuffer.timestamp && messageBuffer.user) {
        let messageContent = messageBuffer.message.trim();
        // Remove "<This message was edited>" tag
        messageContent = messageContent.replace(/\s*<this message was edited>$/i, '').trim();

        const lowerMessageContent = messageContent.toLowerCase();
        // Check ignore conditions
        if (lowerMessageContent !== 'this message was deleted' && lowerMessageContent !== 'null' && lowerMessageContent !== '<media omitted>' && !lowerMessageContent.endsWith('(file attached)')) {
          messages.push({
            id: `msg-${messageBuffer.timestamp.getTime()}-${messages.length}`,
            timestamp: messageBuffer.timestamp,
            user: messageBuffer.user,
            message: messageContent,
          });
        }
      }
    };

    for (const line of lines) {
      if (line.trim() === '') continue; // Skip empty lines

      let parsedLineData: LineParserResult | null = null;
      for (const parser of TXT_PARSERS) {
          const match = line.match(parser.regex);
          if (match) {
              parsedLineData = parser.parseFn(match);
              if (parsedLineData) break; // Found a valid parse for this line
          }
      }

      if (parsedLineData) {
        // If there was a pending message in buffer, process and potentially push it
        processAndAddMessage(currentMessageBuffer);
        // Start a new message buffer
        currentMessageBuffer = {
          timestamp: parsedLineData.timestamp,
          user: parsedLineData.user,
          message: parsedLineData.message,
        };
      } else {
        // This line doesn't match a new message format. Append to the current message buffer if it exists.
        if (currentMessageBuffer.message) {
          currentMessageBuffer.message += '\n' + line;
        } else {
          unknownLines++; // Line doesn't start a message and no current message to append to
        }
      }
    }
    // Process and push any remaining message in the buffer
    processAndAddMessage(currentMessageBuffer);
  }

  if (unknownLines > 0) {
    console.warn(`Parser skipped ${unknownLines} lines due to unrecognized format or invalid date.`);
  }
  
 messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const topEmojis = extractEmojis(messages);
 return { messages, topEmojis };
}
export function extractEmojis(messages: ChatMessage[]): { emoji: string; count: number }[] {
  if (!messages || messages.length === 0) {
    return [];
  }

  const emojiCounts: { [key: string]: number } = {};
  // Regex to match emojis (basic support, might need refinement for all Unicode emojis)
  const emojiRegex = /([\uD800-\uDBFF][\uDC00-\uDFFF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]|[\u2600-\u26FF]|[\u2700-\u27BF])/g;

  messages.forEach(message => {
    const emojisInMessage = message.message.match(emojiRegex);
    if (emojisInMessage) {
      emojisInMessage.forEach(emoji => {
        emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1;
      });
    }
  });

  const sortedEmojis = Object.entries(emojiCounts)
    .sort(([, countA], [, countB]) => countB - countA);

  return sortedEmojis.slice(0, 5).map(([emoji, count]) => ({ emoji, count }));
}
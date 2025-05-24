import type { ChatMessage } from '@/types/chat';
import { parse as parseDate, isValid } from 'date-fns';

// Regex for a common format: MM/DD/YY, HH:mm - User Name: Message content
// Example: 1/15/23, 10:00 - Alice: Hello world
// Or: 01/15/2023, 10:00 AM - Alice: Message content
const WHATSAPP_STYLE_REGEX = /^(\d{1,2}\/\d{1,2}\/\d{2,4}), (\d{1,2}:\d{2}(?: [AP]M)?) - ([^:]+): ([\s\S]+)$/;

// Simpler regex: [YYYY-MM-DD HH:MM:SS] User: Message
const GENERIC_STYLE_REGEX = /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] ([^:]+): ([\s\S]+)$/;


export function parseChatFile(fileContent: string, fileType: 'txt' | 'csv'): ChatMessage[] {
  const lines = fileContent.split('\n');
  const messages: ChatMessage[] = [];
  let unknownLines = 0;

  if (fileType === 'csv') {
    // Basic CSV parsing assuming "timestamp,user,message" or "date,time,user,message"
    // This is a placeholder and would need a more robust CSV parser for production
    console.warn("CSV parsing is basic. Assumes specific column orders.");
    lines.forEach((line, index) => {
      if (index === 0 && (line.toLowerCase().includes('timestamp') || line.toLowerCase().includes('date'))) return; // Skip header

      const parts = line.split(',');
      if (parts.length >= 3) {
        let timestampStr = parts[0];
        let user = parts[1];
        let message = parts.slice(2).join(',');
        
        if (parts.length >= 4 && parts[0].match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/)) { // date,time,user,message format
            timestampStr = `${parts[0]} ${parts[1]}`;
            user = parts[2];
            message = parts.slice(3).join(',');
        }
        
        const parsedTimestamp = new Date(timestampStr); // Attempt direct parsing
        if (isValid(parsedTimestamp)) {
           messages.push({
            id: `msg-${Date.now()}-${index}`,
            timestamp: parsedTimestamp,
            user: user.trim(),
            message: message.trim(),
          });
        } else {
          unknownLines++;
        }
      } else if (line.trim() !== '') {
        unknownLines++;
      }
    });

  } else { // TXT parsing
    let currentMessageBuffer: Partial<ChatMessage> = {};
    let lastMessageTimestamp: Date | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let match = line.match(WHATSAPP_STYLE_REGEX);
      let dateFormat = 'M/d/yy, HH:mm';
      if (match && match[2].toLowerCase().includes('m')) { // if AM/PM is present
        dateFormat = 'M/d/yy, hh:mm a';
      }

      if (!match) {
        match = line.match(GENERIC_STYLE_REGEX);
        dateFormat = 'yyyy-MM-dd HH:mm:ss';
      }

      if (match) {
        // If there was a pending message in buffer, push it
        if (currentMessageBuffer.message && currentMessageBuffer.timestamp && currentMessageBuffer.user) {
          messages.push({
            id: `msg-${currentMessageBuffer.timestamp.getTime()}-${messages.length}`,
            timestamp: currentMessageBuffer.timestamp,
            user: currentMessageBuffer.user,
            message: currentMessageBuffer.message.trim(),
          });
        }
        currentMessageBuffer = {};


        const dateTimeString = match[1] + (match[2] && !GENERIC_STYLE_REGEX.test(line) ? `, ${match[2]}` : '');
        const user = match[GENERIC_STYLE_REGEX.test(line) ? 2 : 3];
        const messageContent = match[GENERIC_STYLE_REGEX.test(line) ? 3 : 4];
        
        let timestamp: Date;
        if (GENERIC_STYLE_REGEX.test(line)) { // For [YYYY-MM-DD HH:MM:SS] format
            timestamp = parseDate(match[1], 'yyyy-MM-dd HH:mm:ss', new Date());
        } else { // For MM/DD/YY, HH:mm format
            const datePart = match[1];
            const timePart = match[2];
            const fullDateTimeStr = `${datePart}, ${timePart}`;
            
            // Try parsing with AM/PM first if present
            let potentialTimestamp = parseDate(fullDateTimeStr, 'M/d/yy, h:mm a', new Date());
            if (!isValid(potentialTimestamp)) {
                 // Try 24-hour format
                potentialTimestamp = parseDate(fullDateTimeStr, 'M/d/yy, HH:mm', new Date());
            }
            if (!isValid(potentialTimestamp)) {
                 // Try with 4-digit year
                potentialTimestamp = parseDate(fullDateTimeStr, 'M/d/yyyy, h:mm a', new Date());
                 if (!isValid(potentialTimestamp)) {
                    potentialTimestamp = parseDate(fullDateTimeStr, 'M/d/yyyy, HH:mm', new Date());
                 }
            }
            timestamp = potentialTimestamp;
        }

        if (isValid(timestamp)) {
          currentMessageBuffer = {
            timestamp,
            user: user.trim(),
            message: messageContent.trim(),
          };
          lastMessageTimestamp = timestamp;
        } else {
          // If timestamp is invalid, treat as continuation of previous message if possible
          if (currentMessageBuffer.message && line.trim() !== '') {
            currentMessageBuffer.message += '\n' + line;
          } else if (line.trim() !== '') {
            unknownLines++;
          }
        }
      } else if (line.trim() !== '') {
        // This line doesn't match the new message format.
        // Append to the current message buffer if it exists (multi-line message part).
        if (currentMessageBuffer.message) {
          currentMessageBuffer.message += '\n' + line;
        } else {
          unknownLines++;
        }
      }
    }
    // Push any remaining message in the buffer
    if (currentMessageBuffer.message && currentMessageBuffer.timestamp && currentMessageBuffer.user) {
      messages.push({
        id: `msg-${currentMessageBuffer.timestamp.getTime()}-${messages.length}`,
        timestamp: currentMessageBuffer.timestamp,
        user: currentMessageBuffer.user,
        message: currentMessageBuffer.message.trim(),
      });
    }
  }


  if (unknownLines > 0) {
    console.warn(`Parser skipped ${unknownLines} lines due to unrecognized format.`);
  }
  
  // Sort messages by timestamp just in case
  messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return messages;
}

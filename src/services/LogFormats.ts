import type { LogEntry } from '../types/LogTypes';

export interface LogFormat {
    name: string;
    pattern: RegExp;
    extract: (match: RegExpExecArray) => Partial<LogEntry>;
}

export const logFormats: LogFormat[] = [
    // Spring Boot log format with embedded pipe-separated data
    {
        name: 'Spring Boot with Pipe Data',
        pattern: /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{2}:\d{2})\s+(\w+)\s+\d+\s+---\s+\[[^\]]+\]\s+\[[^\]]+\]\s+([^\s]+)\s*:\s*(.*\|.*\|.*)$/,
        extract: (match) => {
            const timestamp = match[1];
            const level = match[2];
            const source = match[3];
            const pipeContent = match[4].trim();
            
            const parts = pipeContent.split('|').map(p => p.trim());
            let entry: Partial<LogEntry> = {
                timestamp,
                level,
                source
            };
            entry.additionalInfo = {};
            
            const logType = parts[0];
            entry.eventType = logType as any;
            
            switch (logType) {
                case 'TRANSACTION':
                    entry.additionalInfo.uniqueId = parts[1];
                    entry.additionalInfo.txType = parts[2];
                    entry.additionalInfo.status = parts[4];
                    
                    // Handle the complex response and ofsResponse fields
                    for (let i = 5; i < parts.length; i++) {
                        const part = parts[i];
                        if (part.startsWith('response=')) {
                            entry.additionalInfo.response = part.substring(9);
                        } else if (part.startsWith('ofsResponse=')) {
                            entry.additionalInfo.ofsResponse = part.substring(12);
                        } else if (part.match(/^\d+\.\d+\.\d+\.\d+$/)) {
                            entry.additionalInfo.remoteAddr = part;
                        }
                    }
                    
                    entry.message = `Transaction ${parts[2]} with ID ${parts[1]} - Status: ${parts[4]}`;
                    break;
                default:
                    // For other types, use the generic approach
                    entry.additionalInfo.parts = parts;
                    entry.message = pipeContent;
                    break;
            }
            
            return entry;
        }
    },
    // Tomcat/Catalina format
    {
        name: 'Tomcat/Catalina',
        pattern: /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2},\d{3}\s+\w+\s+\[[^\]]+\]\s+[^\s-]+\s+-\s+.+/,
        extract: (match) => ({
            timestamp: match[1],
            level: match[2],
            source: match[4],
            message: match[5],
            additionalInfo: { thread: match[3] }
        })
    },
    // ISO DateTime with Level
    {
        name: 'ISO DateTime',
        pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:?\d{2})?\s*\[\w+\]\s+.+/,
        extract: (match) => ({
            timestamp: match[1],
            level: match[2],
            message: match[3]
        })
    },
    // Simple datetime level message
    {
        name: 'Simple DateTime',
        pattern: /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?\s+\w+\s+.+/,
        extract: (match) => ({
            timestamp: match[1],
            level: match[2],
            message: match[3]
        })
    },
    // Enhanced pipe-separated format: dynamically map fields (including embedded in standard log format)
    {
        name: 'Dynamic Pipe Separated',
        pattern: /^.*?:\s*(.*\|.*\|.*)$/,
        extract: (match) => {
            const pipeContent = match[1].trim();
            const parts = pipeContent.split('|').map(p => p.trim());
            let entry: Partial<LogEntry> = {};
            entry.additionalInfo = {};
            
            const logType = parts[0];
            entry.eventType = logType as any; // Set eventType
            
            switch (logType) {
                case 'AUTH_EVENT':
                    entry.timestamp = parts[1];
                    entry.additionalInfo.username = parts[2];
                    entry.additionalInfo.remoteAddr = parts[3];
                    entry.additionalInfo.action = parts[4];
                    entry.additionalInfo.response = parts[5];
                    entry.additionalInfo.ofsResponse = parts[6];
                    entry.message = `Authentication event for user ${parts[2]}`;
                    break;
                case 'ACCOUNT_QUERY':
                    entry.additionalInfo.accountNo = parts[1];
                    entry.timestamp = parts[2];
                    entry.additionalInfo.remoteAddr = parts[3];
                    entry.additionalInfo.status = parts[4];
                    entry.additionalInfo.response = parts[5];
                    entry.additionalInfo.ofsResponse = parts[6];
                    entry.message = `Account query for ${parts[1]}`;
                    break;
                case 'CARD_STATUS':
                    entry.additionalInfo.cardNo = parts[1];
                    entry.timestamp = parts[2];
                    entry.additionalInfo.remoteAddr = parts[3];
                    entry.additionalInfo.action = parts[4];
                    entry.additionalInfo.status = parts[5];
                    entry.additionalInfo.response = parts[6];
                    entry.additionalInfo.ofsResponse = parts[7];
                    entry.message = `Card status check for ${parts[1]}`;
                    break;
                case 'TRANSACTION':
                    entry.additionalInfo.uniqueId = parts[1];
                    entry.additionalInfo.txType = parts[2];
                    entry.timestamp = parts[3];
                    entry.additionalInfo.status = parts[4];
                    
                    // Handle the complex response and ofsResponse fields
                    // Format: TRANSACTION | uniqueId | txType | timestamp | status | response=... | ofsResponse=...
                    for (let i = 5; i < parts.length; i++) {
                        const part = parts[i];
                        if (part.startsWith('response=')) {
                            entry.additionalInfo.response = part.substring(9); // Remove 'response=' prefix
                        } else if (part.startsWith('ofsResponse=')) {
                            entry.additionalInfo.ofsResponse = part.substring(12); // Remove 'ofsResponse=' prefix
                        } else if (!entry.additionalInfo.remoteAddr && part.match(/^\d+\.\d+\.\d+\.\d+$/)) {
                            // If it looks like an IP address, assume it's remoteAddr
                            entry.additionalInfo.remoteAddr = part;
                        } else if (part && !entry.additionalInfo.response && !entry.additionalInfo.ofsResponse) {
                            // If we haven't set response yet and this doesn't match known patterns, it might be response
                            entry.additionalInfo.response = part;
                        }
                    }
                    
                    entry.message = `Transaction ${parts[2]} with ID ${parts[1]} - Status: ${parts[4]}`;
                    break;
                case 'ERROR':
                    entry.additionalInfo.uniqueId = parts[1];
                    entry.timestamp = parts[2];
                    entry.level = 'ERROR';
                    entry.additionalInfo.eventType = parts[3];
                    entry.additionalInfo.status = parts[4];
                    entry.message = parts[5] || `Error event for ${parts[1]}`;
                    entry.additionalInfo.response = parts[6];
                    entry.additionalInfo.ofsResponse = parts[7];
                    break;
                case 'OTHER_EVENT':
                    entry.timestamp = parts[1];
                    entry.additionalInfo.remoteAddr = parts[2];
                    let customFields = parts.slice(3, parts.length - 2);
                    for (let idx = 0; idx < customFields.length; idx++) {
                        entry.additionalInfo[`customField${idx+1}`] = customFields[idx];
                    }
                    entry.additionalInfo.response = parts[parts.length - 2];
                    entry.additionalInfo.ofsResponse = parts[parts.length - 1];
                    entry.message = `Other event: ${customFields.join(', ')}`;
                    break;
                default:
                    entry.additionalInfo.parts = parts;
                    entry.message = `Unknown log type: ${logType}`;
                    break;
            }
            
            // Extract timestamp from the beginning of the original line if available
            const fullLine = match[0];
            const timestampMatch = fullLine.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{2}:\d{2})/);
            if (timestampMatch) {
                entry.timestamp = timestampMatch[1];
            }
            
            // Extract log level from the beginning of the line
            const levelMatch = fullLine.match(/\s+(INFO|ERROR|WARN|DEBUG|TRACE)\s+/);
            if (levelMatch && !entry.level) {
                entry.level = levelMatch[1];
            }
            
            // Extract source/class from the line
            const sourceMatch = fullLine.match(/\]\s+([a-zA-Z0-9_.]+)\s+:/);
            if (sourceMatch) {
                entry.source = sourceMatch[1];
            }
            
            return entry;
        }
    },
    // Common Log Format
    {
        name: 'Common Format',
        pattern: /^\[[^\]]+\]\s+\w+:\s+.+$/,
        extract: (match) => ({
            timestamp: match[1],
            level: match[2],
            message: match[3]
        })
    },
    // Syslog-like format
    {
        name: 'Syslog-like',
        pattern: /^\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\s+\S+\[\d+\]\s+\w+:\s+.+$/,
        extract: (match) => ({
            timestamp: match[1],
            source: match[2],
            level: match[4],
            message: match[5],
            additionalInfo: { pid: match[3] }
        })
    }
];

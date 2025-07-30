import type { LogEntry } from '../types/LogTypes';

export interface LogFormat {
    name: string;
    pattern: RegExp;
    extract: (match: RegExpExecArray) => Partial<LogEntry>;
}

export const logFormats: LogFormat[] = [
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
    // Enhanced pipe-separated format: dynamically map fields
    {
        name: 'Dynamic Pipe Separated',
        pattern: /^(.+\|)+.+$/,
        extract: (match) => {
            const parts = match[0].split('|').map(p => p.trim());
            let entry: Partial<LogEntry> = {};
            entry.additionalInfo = { LOG_TYPE: parts[0] };
            switch (parts[0]) {
                case 'AUTH_EVENT':
                    entry.timestamp = parts[1];
                    entry.additionalInfo.username = parts[2];
                    entry.additionalInfo.remoteAddr = parts[3];
                    entry.additionalInfo.eventType = parts[4];
                    entry.additionalInfo.response = parts[5];
                    entry.additionalInfo.ofsResponse = parts[6];
                    break;
                case 'ACCOUNT_QUERY':
                    entry.additionalInfo.accountNo = parts[1];
                    entry.timestamp = parts[2];
                    entry.additionalInfo.remoteAddr = parts[3];
                    entry.additionalInfo.status = parts[4];
                    entry.additionalInfo.response = parts[5];
                    entry.additionalInfo.ofsResponse = parts[6];
                    break;
                case 'CARD_STATUS':
                    entry.additionalInfo.cardNo = parts[1];
                    entry.timestamp = parts[2];
                    entry.additionalInfo.remoteAddr = parts[3];
                    entry.additionalInfo.action = parts[4];
                    entry.additionalInfo.status = parts[5];
                    entry.additionalInfo.response = parts[6];
                    entry.additionalInfo.ofsResponse = parts[7];
                    break;
                case 'TRANSACTION':
                    entry.additionalInfo.uniqueId = parts[1];
                    entry.additionalInfo.txType = parts[2];
                    entry.timestamp = parts[3];
                    entry.additionalInfo.remoteAddr = parts[4];
                    entry.additionalInfo.status = parts[5];
                    entry.additionalInfo.response = parts[6];
                    entry.additionalInfo.ofsResponse = parts[7];
                    break;
                case 'ERROR':
                    entry.additionalInfo.uniqueId = parts[1];
                    entry.timestamp = parts[2];
                    entry.additionalInfo.eventType = parts[3];
                    entry.additionalInfo.status = parts[4];
                    entry.message = parts[5];
                    entry.additionalInfo.response = parts[6];
                    entry.additionalInfo.ofsResponse = parts[7];
                    break;
                case 'OTHER_EVENT':
                    entry.timestamp = parts[1];
                    entry.additionalInfo = entry.additionalInfo || {};
                    entry.additionalInfo.remoteAddr = parts[2];
                    let customFields = parts.slice(3, parts.length - 2);
                    // Always ensure additionalInfo is initialized before loop
                    if (!entry.additionalInfo) entry.additionalInfo = {};
                    for (let idx = 0; idx < customFields.length; idx++) {
                        entry.additionalInfo[`customField${idx+1}`] = customFields[idx];
                    }
                    entry.additionalInfo.response = parts[parts.length - 2];
                    entry.additionalInfo.ofsResponse = parts[parts.length - 1];
                    break;
                default:
                    entry.additionalInfo.parts = parts;
                    break;
            }
            if (!entry.message && parts.length > 5) {
                entry.message = parts.find(p => p && p.toLowerCase().includes('failed') || p.toLowerCase().includes('error')) || '';
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

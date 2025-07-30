import type { LogEntry } from '../types/LogTypes';

export function extractBasicInfo(line: string): Partial<LogEntry> | null {
    const timestampMatch = line.match(/\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}/);
    const levelMatch = line.match(/\b(ERROR|WARN(?:ING)?|INFO|DEBUG|TRACE)\b/i);
    if (timestampMatch || levelMatch) {
        return {
            timestamp: timestampMatch ? timestampMatch[0] : new Date().toISOString(),
            level: levelMatch ? levelMatch[0].toUpperCase() : 'UNKNOWN',
            message: line,
            additionalInfo: {
                parseNote: 'Partial match using basic extraction'
            }
        };
    }
    return null;
}

export function normalizeTimestamp(timestamp: string): string {
    try {
        let date: Date;
        if (timestamp.includes(',')) {
            date = new Date(timestamp.replace(',', '.'));
        } else {
            date = new Date(timestamp);
        }
        if (isNaN(date.getTime())) {
            throw new Error('Invalid date format');
        }
        return date.toISOString();
    } catch (err) {
        return new Date().toISOString();
    }
}

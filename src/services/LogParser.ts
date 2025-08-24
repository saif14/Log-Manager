import Papa from 'papaparse';
import type { LogEntry, LogFilter, LogStats } from '../types/LogTypes';
import { logFormats } from './LogFormats';

export class LogParser {
    // Use imported logFormats
    private static logFormats = logFormats;

    static parseLogContent(content: string): LogEntry[] {
        const lines = content.split(/\r?\n/);
        const entries: LogEntry[] = [];
        const errors: string[] = [];

        let currentEntry: Partial<LogEntry> | null = null;
        let currentStackTrace: string[] = [];

        const finalizeCurrentEntry = () => {
            if (currentEntry) {
                if (currentStackTrace.length > 0) {
                    currentEntry.stackTrace = currentStackTrace.join('\n');
                    currentStackTrace = [];
                }
                entries.push({
                    timestamp: this.normalizeTimestamp(currentEntry.timestamp || new Date().toISOString()),
                    level: (currentEntry.level || 'UNKNOWN').toUpperCase(),
                    message: currentEntry.message || '',
                    source: currentEntry.source,
                    stackTrace: currentEntry.stackTrace,
                    additionalInfo: currentEntry.additionalInfo || {}
                });
                currentEntry = null;
            }
        };

        lines.forEach((line, index) => {
            if (!line.trim()) return;

            // Check if line looks like a stack trace
            if (line.trim().startsWith('at ') || line.trim().startsWith('Caused by: ') || line.match(/^\s+at\s+/)) {
                if (currentEntry) {
                    currentStackTrace.push(line);
                    return;
                }
            }

            // If we have a current entry, finalize it before starting a new one
            finalizeCurrentEntry();

            // Try to parse the line with each format
            let parsed = false;
            let attemptedFormats: string[] = [];

            for (const format of this.logFormats) {
                const match = format.pattern.exec(line);
                if (match) {
                    try {
                        currentEntry = format.extract(match);
                        parsed = true;
                        break;
                    } catch (err) {
                        const error = err as Error;
                        attemptedFormats.push(`${format.name}: ${error.message}`);
                    }
                } else {
                    attemptedFormats.push(format.name);
                }
            }

            if (!parsed) {
                // If no format matches, try to extract basic information
                const basicInfo = this.extractBasicInfo(line);
                if (basicInfo) {
                    currentEntry = basicInfo;
                } else {
                    // Store as unknown entry with details about the attempted formats
                    currentEntry = {
                        timestamp: new Date().toISOString(),
                        level: 'UNKNOWN',
                        message: line,
                        additionalInfo: {
                            parseNote: 'No matching format found',
                            attemptedFormats: attemptedFormats,
                            originalLine: line
                        }
                    };
                }
                errors.push(`Warning: No format match for line ${index + 1}`);
            }
        });

        // Don't forget to finalize the last entry
        finalizeCurrentEntry();

        if (errors.length > 0) {
            console.warn('Log parsing warnings:', errors);
        }

        return entries;
    }

    private static extractBasicInfo(line: string): Partial<LogEntry> | null {
        // Try to extract timestamp
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

    private static normalizeTimestamp(timestamp: string): string {
        try {
            // Handle various date formats
            let date: Date;

            if (timestamp.includes(',')) {
                // Handle format: 2023-05-29 10:15:30,123
                date = new Date(timestamp.replace(',', '.'));
            } else {
                date = new Date(timestamp);
            }

            if (isNaN(date.getTime())) {
                throw new Error('Invalid date format');
            }

            return date.toISOString();
        } catch (err) {
            const error = err as Error;
            console.warn(`Error normalizing timestamp "${timestamp}":`, error);
            return new Date().toISOString();
        }
    }

    static filterLogs(logs: LogEntry[], filter: LogFilter): LogEntry[] {
        return logs.filter(log => {
            const timestampDate = new Date(log.timestamp);

            if (filter.startDate && timestampDate < filter.startDate) {
                return false;
            }

            if (filter.endDate && timestampDate > filter.endDate) {
                return false;
            }

            if (filter.level && log.level.toUpperCase() !== filter.level.toUpperCase()) {
                return false;
            }

            if (filter.source && log.source && !log.source.includes(filter.source)) {
                return false;
            }

            if (filter.uniqueId) {
                // Check multiple locations for uniqueId:
                // 1. In additionalInfo.uniqueId (pipe-separated logs)
                // 2. In the log message content (for mixed format logs)
                // 3. In the level if it matches (for display purposes)
                const hasUniqueIdInAdditionalInfo = log.additionalInfo && log.additionalInfo.uniqueId === filter.uniqueId;
                const hasUniqueIdInMessage = log.message && log.message.includes(filter.uniqueId);
                const hasUniqueIdInLevel = log.level === filter.uniqueId;
                
                if (!hasUniqueIdInAdditionalInfo && !hasUniqueIdInMessage && !hasUniqueIdInLevel) {
                    return false;
                }
            }

            if (filter.accountNo) {
                // Check multiple locations for accountNo
                const hasAccountNoInAdditionalInfo = log.additionalInfo && log.additionalInfo.accountNo === filter.accountNo;
                const hasAccountNoInMessage = log.message && log.message.includes(filter.accountNo);
                const hasAccountNoInLevel = log.level === filter.accountNo;
                
                if (!hasAccountNoInAdditionalInfo && !hasAccountNoInMessage && !hasAccountNoInLevel) {
                    return false;
                }
            }

            if (filter.cardNo) {
                // Check multiple locations for cardNo
                const hasCardNoInAdditionalInfo = log.additionalInfo && log.additionalInfo.cardNo === filter.cardNo;
                const hasCardNoInMessage = log.message && log.message.includes(filter.cardNo);
                const hasCardNoInLevel = log.level === filter.cardNo;
                
                if (!hasCardNoInAdditionalInfo && !hasCardNoInMessage && !hasCardNoInLevel) {
                    return false;
                }
            }

            if (filter.username) {
                // Check multiple locations for username
                const hasUsernameInAdditionalInfo = log.additionalInfo && log.additionalInfo.username === filter.username;
                const hasUsernameInMessage = log.message && log.message.includes(filter.username);
                
                if (!hasUsernameInAdditionalInfo && !hasUsernameInMessage) {
                    return false;
                }
            }

            if (filter.status) {
                // Check multiple locations for status
                const hasStatusInAdditionalInfo = log.additionalInfo && log.additionalInfo.status === filter.status;
                const hasStatusInMessage = log.message && log.message.toUpperCase().includes(filter.status.toUpperCase());
                
                if (!hasStatusInAdditionalInfo && !hasStatusInMessage) {
                    return false;
                }
            }

            if (filter.eventType) {
                // Check the eventType field and also check if it appears in the message
                const hasEventTypeField = log.eventType === filter.eventType;
                const hasEventTypeInMessage = log.message && log.message.includes(filter.eventType);
                
                if (!hasEventTypeField && !hasEventTypeInMessage) {
                    return false;
                }
            }

            if (filter.searchTerm) {
                const searchLower = filter.searchTerm.toLowerCase();
                return (
                    log.message.toLowerCase().includes(searchLower) ||
                    (log.source && log.source.toLowerCase().includes(searchLower)) ||
                    (log.stackTrace && log.stackTrace.toLowerCase().includes(searchLower)) ||
                    (log.level && log.level.toLowerCase().includes(searchLower)) ||
                    (log.eventType && log.eventType.toLowerCase().includes(searchLower)) ||
                    (log.additionalInfo && Object.values(log.additionalInfo).some(value => 
                        typeof value === 'string' && value.toLowerCase().includes(searchLower)
                    ))
                );
            }

            return true;
        });
    }

    static calculateStats(logs: LogEntry[]): LogStats {
        const stats: LogStats = {
            totalEntries: logs.length,
            errorCount: 0,
            warningCount: 0,
            infoCount: 0,
            sourcesDistribution: {},
            timeDistribution: {},
            accountNoDistribution: {},
            uniqueIdDistribution: {},
            eventTypeDistribution: {},
            statusDistribution: {},
            dateAccountNoDistribution: {},
            dateUniqueIdDistribution: {}
        };

        logs.forEach(log => {
            // Count by level
            switch (log.level.toUpperCase()) {
                case 'ERROR':
                    stats.errorCount++;
                    break;
                case 'WARN':
                case 'WARNING':
                    stats.warningCount++;
                    break;
                case 'INFO':
                    stats.infoCount++;
                    break;
            }

            // Count by source
            if (log.source) {
                stats.sourcesDistribution[log.source] =
                    (stats.sourcesDistribution[log.source] || 0) + 1;
            }

            // Group by hour for time distribution
            const hour = new Date(log.timestamp)
                .toISOString()
                .split('T')[0] + 'T' +
                new Date(log.timestamp)
                    .getHours()
                    .toString()
                    .padStart(2, '0');

            stats.timeDistribution[hour] =
                (stats.timeDistribution[hour] || 0) + 1;

            // Group by accountNo (for ACCOUNT_QUERY)
            if (log.additionalInfo && log.additionalInfo.accountNo) {
                const acc = log.additionalInfo.accountNo;
                stats.accountNoDistribution[acc] = (stats.accountNoDistribution[acc] || 0) + 1;

                // Date-based grouping
                const date = new Date(log.timestamp).toISOString().split('T')[0];
                if (!stats.dateAccountNoDistribution[date]) stats.dateAccountNoDistribution[date] = {};
                stats.dateAccountNoDistribution[date][acc] = (stats.dateAccountNoDistribution[date][acc] || 0) + 1;
            }

            // Group by uniqueId (for TRANSACTION)
            if (log.additionalInfo && log.additionalInfo.uniqueId) {
                const uid = log.additionalInfo.uniqueId;
                stats.uniqueIdDistribution[uid] = (stats.uniqueIdDistribution[uid] || 0) + 1;

                // Date-based grouping
                const date = new Date(log.timestamp).toISOString().split('T')[0];
                if (!stats.dateUniqueIdDistribution[date]) stats.dateUniqueIdDistribution[date] = {};
                stats.dateUniqueIdDistribution[date][uid] = (stats.dateUniqueIdDistribution[date][uid] || 0) + 1;
            }

            // Group by eventType
            if (log.eventType) {
                stats.eventTypeDistribution[log.eventType] = (stats.eventTypeDistribution[log.eventType] || 0) + 1;
            }

            // Group by status
            if (log.additionalInfo && log.additionalInfo.status) {
                const status = log.additionalInfo.status;
                stats.statusDistribution[status] = (stats.statusDistribution[status] || 0) + 1;
            }
        });

        return stats;
    } static async parseFile(file: File): Promise<LogEntry[]> {
        // Try parsing as CSV first
        if (file.name.toLowerCase().endsWith('.csv')) {
            return new Promise((resolve, reject) => {
                Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        try {
                            const entries = results.data
                                .map((row: any): LogEntry | null => {
                                    try {
                                        return {
                                            timestamp: this.normalizeTimestamp(row.timestamp || row.time || row.date || new Date().toISOString()),
                                            level: (row.level || row.severity || row.type || 'UNKNOWN').toUpperCase(),
                                            message: row.message || row.msg || row.log || '',
                                            source: row.source || row.logger || row.class,
                                            stackTrace: row.stackTrace || row.stack || row.exception,
                                            additionalInfo: this.parseAdditionalInfo(row)
                                        };
                                    } catch (error) {
                                        console.warn('Error parsing CSV row:', error, row);
                                        return null;
                                    }
                                })
                                .filter((entry): entry is LogEntry => entry !== null);

                            resolve(entries);
                        } catch (err) {
                            const error = err as Error;
                            reject(new Error(`Failed to parse CSV: ${error.message}`));
                        }
                    },
                    error: (error) => reject(new Error(`CSV parsing error: ${error.message}`))
                });
            });
        }

        // For other file types, read as text and parse line by line
        try {
            const content = await file.text();
            return this.parseLogContent(content);
        } catch (err) {
            const error = err as Error;
            throw new Error(`Failed to read file: ${error.message}`);
        }
    }

    private static parseAdditionalInfo(row: any): Record<string, any> {
        const additionalInfo: Record<string, any> = {};
        for (const [key, value] of Object.entries(row)) {
            if (!['timestamp', 'time', 'date', 'level', 'severity', 'type', 'message', 'msg', 'log', 'source', 'logger', 'class', 'stackTrace', 'stack', 'exception'].includes(key)) {
                additionalInfo[key] = value;
            }
        }
        return additionalInfo;
    }
}

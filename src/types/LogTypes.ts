export type LogEventType = 'AUTH_EVENT' | 'ACCOUNT_QUERY' | 'CARD_STATUS' | 'TRANSACTION' | 'ERROR' | 'OTHER_EVENT';

export interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
    source?: string;
    stackTrace?: string;
    eventType?: LogEventType;
    additionalInfo?: {
        accountNo?: string;
        cardNo?: string;
        uniqueId?: string;
        txType?: string;
        username?: string;
        remoteAddr?: string;
        action?: string;
        status?: string;
        response?: string;
        ofsResponse?: string;
        [key: string]: any;
    };
}

export interface LogFile {
    name: string;
    path: string;
    entries: LogEntry[];
}

export interface LogFilter {
    startDate?: Date;
    endDate?: Date;
    level?: string;
    searchTerm?: string;
    source?: string;
    accountNo?: string;
    uniqueId?: string;
    eventType?: LogEventType;
    cardNo?: string;
    username?: string;
    status?: string;
}

export interface LogStats {
    totalEntries: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    sourcesDistribution: Record<string, number>;
    timeDistribution: Record<string, number>;
    accountNoDistribution: Record<string, number>;
    uniqueIdDistribution: Record<string, number>;
    eventTypeDistribution: Record<string, number>;
    statusDistribution: Record<string, number>;
    dateAccountNoDistribution: Record<string, Record<string, number>>;
    dateUniqueIdDistribution: Record<string, Record<string, number>>;
}

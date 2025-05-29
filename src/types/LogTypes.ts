export interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
    source?: string;
    stackTrace?: string;
    additionalInfo?: Record<string, any>;
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
}

export interface LogStats {
    totalEntries: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    sourcesDistribution: Record<string, number>;
    timeDistribution: Record<string, number>;
}

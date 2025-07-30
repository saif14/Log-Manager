
import React from 'react';
import { Box, Paper, Typography, Stack } from '@mui/material';
import type { LogStats, LogEntry } from '../types/LogTypes';

interface LogStatsProps {
    stats: LogStats;
    filteredLogs: LogEntry[];
}

const renderGroupedLogs = (
    title: string,
    logs: LogEntry[] | undefined,
    key: 'accountNo' | 'uniqueId'
) => {
    const safeLogs = Array.isArray(logs) ? logs : [];
    const groups: Record<string, LogEntry[]> = {};
    safeLogs.forEach(log => {
        const value = log.additionalInfo && log.additionalInfo[key];
        if (value) {
            if (!groups[value]) groups[value] = [];
            groups[value].push(log);
        }
    });
    return (
        <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2">{title}</Typography>
            {Object.entries(groups).map(([groupKey, groupLogs]) => (
                <Box key={groupKey} sx={{ mb: 1, pl: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {key}: {groupKey} ({groupLogs.length})
                    </Typography>
                    <Paper sx={{ p: 1, bgcolor: '#f5f5f5', mb: 1 }}>
                        <table style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>Level</th>
                                    <th>Message</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupLogs.map((log, idx) => (
                                    <tr key={idx}>
                                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                                        <td>{log.level}</td>
                                        <td>{log.message}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Paper>
                </Box>
            ))}
        </Box>
    );
};

const LogStats: React.FC<LogStatsProps> = ({ stats, filteredLogs }) => {
    return (
        <Paper sx={{ p: 2 }}>
            <Stack spacing={2}>
                <Typography variant="h6">Log Statistics</Typography>
                <Box>
                    <Typography variant="subtitle1" component="div">
                        Total Entries: {stats.totalEntries} |{' '}
                        Errors: {stats.errorCount} |{' '}
                        Warnings: {stats.warningCount} |{' '}
                        Info: {stats.infoCount}
                    </Typography>
                </Box>
                {renderGroupedLogs('Logs Grouped by Account No (Account Query)', filteredLogs, 'accountNo')}
                {renderGroupedLogs('Logs Grouped by Unique Id (Transaction)', filteredLogs, 'uniqueId')}
            </Stack>
        </Paper>
    );
};

export default LogStats;

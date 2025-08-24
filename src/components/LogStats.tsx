
import React, { useMemo } from 'react';
import { Box, Paper, Typography, Stack, Divider } from '@mui/material';
import type { LogStats as LogStatsType, LogEntry } from '../types/LogTypes';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

interface LogStatsProps {
    stats: LogStatsType;
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

const renderDistributionTable = (
    title: string,
    data: Record<string, number>,
    totalEntries: number
) => (
    <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2">{title}</Typography>
        <Paper sx={{ p: 1, bgcolor: '#f5f5f5' }}>
            <table style={{ width: '100%' }}>
                <thead>
                    <tr>
                        <th style={{ textAlign: 'left', padding: '8px' }}>Type</th>
                        <th style={{ textAlign: 'right', padding: '8px' }}>Count</th>
                        <th style={{ textAlign: 'right', padding: '8px' }}>Percentage</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(data).map(([key, value]) => (
                        <tr key={key}>
                            <td style={{ padding: '8px' }}>{key}</td>
                            <td style={{ textAlign: 'right', padding: '8px' }}>{value}</td>
                            <td style={{ textAlign: 'right', padding: '8px' }}>
                                {((value / totalEntries) * 100).toFixed(1)}%
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Paper>
    </Box>
);

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const LogStats: React.FC<LogStatsProps> = ({ stats, filteredLogs }) => {
    const distributionData = {
        Error: stats.errorCount,
        Warning: stats.warningCount,
        Info: stats.infoCount
    };

    const timeBasedData = useMemo(() => {
        const timeGroups = new Map<string, { errors: number; warnings: number; info: number }>();
        
        filteredLogs.forEach(log => {
            const date = new Date(log.timestamp);
            const key = date.toLocaleDateString();
            
            const current = timeGroups.get(key) || { errors: 0, warnings: 0, info: 0 };
            
            if (log.level === 'ERROR') current.errors++;
            else if (log.level === 'WARN') current.warnings++;
            else if (log.level === 'INFO') current.info++;
            
            timeGroups.set(key, current);
        });

        const sortedDates = Array.from(timeGroups.keys()).sort();
        return {
            labels: sortedDates,
            datasets: [
                {
                    label: 'Errors',
                    data: sortedDates.map(date => timeGroups.get(date)?.errors || 0),
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                },
                {
                    label: 'Warnings',
                    data: sortedDates.map(date => timeGroups.get(date)?.warnings || 0),
                    borderColor: 'rgb(255, 205, 86)',
                    backgroundColor: 'rgba(255, 205, 86, 0.5)',
                },
                {
                    label: 'Info',
                    data: sortedDates.map(date => timeGroups.get(date)?.info || 0),
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                },
            ],
        };
    }, [filteredLogs]);

    const distributionChartData = {
        labels: Object.keys(distributionData),
        datasets: [{
            label: 'Log Level Distribution',
            data: Object.values(distributionData),
            backgroundColor: [
                'rgba(255, 99, 132, 0.5)',
                'rgba(255, 205, 86, 0.5)',
                'rgba(75, 192, 192, 0.5)',
            ],
            borderColor: [
                'rgb(255, 99, 132)',
                'rgb(255, 205, 86)',
                'rgb(75, 192, 192)',
            ],
            borderWidth: 1,
        }],
    };

    return (
        <Paper sx={{ p: 2 }}>
            <Stack spacing={2}>
                <Typography variant="h6">Log Statistics</Typography>
                <Box>
                    <Typography variant="subtitle1" component="div" sx={{ mb: 2 }}>
                        Total Entries: {stats.totalEntries}
                    </Typography>
                    <Box sx={{ mb: 3, height: '300px' }}>
                        <Typography variant="subtitle2" gutterBottom>Time-based Log Distribution</Typography>
                        <Line options={{ 
                            responsive: true,
                            maintainAspectRatio: false,
                            interaction: { mode: 'index' },
                            plugins: { title: { display: false } }
                        }} data={timeBasedData} />
                    </Box>
                    <Box sx={{ mb: 3, height: '300px' }}>
                        <Typography variant="subtitle2" gutterBottom>Log Level Distribution</Typography>
                        <Bar options={{ 
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { title: { display: false } }
                        }} data={distributionChartData} />
                    </Box>
                    {renderDistributionTable('Log Level Distribution', distributionData, stats.totalEntries)}
                </Box>
                <Divider />
                {renderGroupedLogs('Logs Grouped by Account No (Account Query)', filteredLogs, 'accountNo')}
                <Divider />
                {renderGroupedLogs('Logs Grouped by Unique Id (Transaction)', filteredLogs, 'uniqueId')}
            </Stack>
        </Paper>
    );
};

export default LogStats;

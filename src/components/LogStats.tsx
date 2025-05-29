import React from 'react';
import { Box, Paper, Typography, Stack } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import type { LogStats as LogStatsType } from '../types/LogTypes';
import type { ChartOptions } from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface LogStatsProps {
    stats: LogStatsType;
}

const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top' as const,
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: {
                precision: 0
            }
        }
    }
};

export const LogStats: React.FC<LogStatsProps> = ({ stats }) => {
    const levelData = {
        labels: ['Error', 'Warning', 'Info'],
        datasets: [
            {
                label: 'Log Levels',
                data: [stats.errorCount, stats.warningCount, stats.infoCount],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const timeData = {
        labels: Object.keys(stats.timeDistribution),
        datasets: [
            {
                label: 'Time Distribution',
                data: Object.values(stats.timeDistribution),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
            },
        ],
    };

    const sourceData = {
        labels: Object.keys(stats.sourcesDistribution),
        datasets: [
            {
                label: 'Sources Distribution',
                data: Object.values(stats.sourcesDistribution),
                backgroundColor: 'rgba(153, 102, 255, 0.5)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1,
            },
        ],
    };

    return (
        <Paper sx={{ p: 2 }}>
            <Stack spacing={2}>
                <Typography variant="h6">
                    Log Statistics
                </Typography>

                <Box>
                    <Typography variant="subtitle1" component="div">
                        Total Entries: {stats.totalEntries} |{' '}
                        Errors: {stats.errorCount} |{' '}
                        Warnings: {stats.warningCount} |{' '}
                        Info: {stats.infoCount}
                    </Typography>
                </Box>

                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={2}
                    sx={{ width: '100%' }}
                >
                    <Box sx={{ height: 300, flex: 1 }}>
                        <Bar
                            data={levelData}
                            options={{
                                ...chartOptions,
                                plugins: {
                                    ...chartOptions.plugins,
                                    title: {
                                        display: true,
                                        text: 'Log Levels Distribution'
                                    }
                                }
                            }}
                        />
                    </Box>
                    <Box sx={{ height: 300, flex: 1 }}>
                        <Bar
                            data={timeData}
                            options={{
                                ...chartOptions,
                                plugins: {
                                    ...chartOptions.plugins,
                                    title: {
                                        display: true,
                                        text: 'Time Distribution'
                                    }
                                }
                            }}
                        />
                    </Box>
                    <Box sx={{ height: 300, flex: 1 }}>
                        <Bar
                            data={sourceData}
                            options={{
                                ...chartOptions,
                                plugins: {
                                    ...chartOptions.plugins,
                                    title: {
                                        display: true,
                                        text: 'Sources Distribution'
                                    }
                                }
                            }}
                        />
                    </Box>
                </Stack>
            </Stack>
        </Paper>
    );
};

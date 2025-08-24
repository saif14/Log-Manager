import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Collapse,
    Box,
    IconButton,
    Typography,
    Chip,
    TablePagination,
    Tooltip
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import type { LogEntry, LogEventType } from '../types/LogTypes';

interface LogViewerProps {
    logs: LogEntry[];
}

interface RowProps {
    log: LogEntry;
}

const Row: React.FC<RowProps> = ({ log }) => {
    const [open, setOpen] = useState(false);

    const getDisplayLevel = (log: LogEntry): string => {
        // If level is UNKNOWN, try to show a more meaningful identifier
        if (log.level === 'UNKNOWN' || !log.level) {
            // For transaction logs, show unique ID
            if (log.additionalInfo?.uniqueId) {
                return log.additionalInfo.uniqueId;
            }
            // For account queries, show account number
            if (log.additionalInfo?.accountNo) {
                return log.additionalInfo.accountNo;
            }
            // For card status, show card number
            if (log.additionalInfo?.cardNo) {
                return log.additionalInfo.cardNo;
            }
            // For auth events, show username
            if (log.additionalInfo?.username) {
                return log.additionalInfo.username;
            }
        }
        return log.level || 'UNKNOWN';
    };

    const getLevelColor = (level: string): "error" | "warning" | "info" | "default" => {
        switch (level.toUpperCase()) {
            case 'ERROR':
                return 'error';
            case 'WARN':
                return 'warning';
            case 'INFO':
                return 'info';
            default:
                return 'default';
        }
    };

    const getEventTypeColor = (eventType?: LogEventType): string => {
        switch (eventType) {
            case 'AUTH_EVENT':
                return '#4CAF50';
            case 'ACCOUNT_QUERY':
                return '#2196F3';
            case 'CARD_STATUS':
                return '#9C27B0';
            case 'TRANSACTION':
                return '#FF9800';
            case 'ERROR':
                return '#F44336';
            default:
                return '#757575';
        }
    };

    const formatDate = (timestamp: string) => {
        try {
            const date = new Date(timestamp);
            const relativeTime = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
            const diff = date.getTime() - Date.now();
            const minutes = Math.round(diff / 60000);
            const hours = Math.round(minutes / 60);
            const days = Math.round(hours / 24);

            if (Math.abs(minutes) < 60) {
                return `${relativeTime.format(minutes, 'minute')} (${date.toLocaleString()})`;
            } else if (Math.abs(hours) < 24) {
                return `${relativeTime.format(hours, 'hour')} (${date.toLocaleString()})`;
            } else if (Math.abs(days) < 7) {
                return `${relativeTime.format(days, 'day')} (${date.toLocaleString()})`;
            } else {
                return date.toLocaleString();
            }
        } catch {
            return timestamp;
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    // Helper to group and render fields
    const renderFields = () => {
        const mainFields = {
            Timestamp: formatDate(log.timestamp),
            Level: getDisplayLevel(log),
            EventType: log.eventType,
            Source: log.source,
        };

        const transactionFields = log.additionalInfo && {
            AccountNo: log.additionalInfo.accountNo,
            CardNo: log.additionalInfo.cardNo,
            UniqueId: log.additionalInfo.uniqueId,
            TxType: log.additionalInfo.txType,
            Status: log.additionalInfo.status,
        };

        const authFields = log.additionalInfo && {
            Username: log.additionalInfo.username,
            RemoteAddr: log.additionalInfo.remoteAddr,
            Action: log.additionalInfo.action,
        };

        const responseFields = log.additionalInfo && {
            Response: log.additionalInfo.response,
            OfsResponse: log.additionalInfo.ofsResponse,
        };

        const renderSection = (title: string, fields: Record<string, any> | false | undefined) => {
            if (!fields) return null;
            
            const hasValue = Object.values(fields).some(v => v !== undefined);
            if (!hasValue) return null;

            return (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>{title}</Typography>
                    <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
                        gap: 2 
                    }}>
                        {Object.entries(fields).map(([key, value]) => 
                            value !== undefined && (
                                <Box key={key}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <Typography variant="subtitle2" sx={{ mr: 1, mt: 0.5 }}>{key}:</Typography>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Paper sx={{ p: 1, bgcolor: '#f5f5f5', position: 'relative' }}>
                                                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', paddingRight: '28px' }}>
                                                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
                                                </pre>
                                                <Tooltip title="Copy to clipboard">
                                                    <IconButton
                                                        size="small"
                                                        sx={{ position: 'absolute', right: 4, top: 4 }}
                                                        onClick={() => copyToClipboard(typeof value === 'object' ? JSON.stringify(value) : String(value))}
                                                    >
                                                        <ContentCopyIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Paper>
                                        </Box>
                                    </Box>
                                </Box>
                            )
                        )}
                    </Box>
                </Box>
            );
        };

        return (
            <Box sx={{ p: 2 }}>
                {renderSection('Basic Information', mainFields)}
                {renderSection('Message', { Message: log.message })}
                {log.stackTrace && renderSection('Stack Trace', { StackTrace: log.stackTrace })}
                {transactionFields && renderSection('Transaction Details', transactionFields)}
                {authFields && renderSection('Authentication Details', authFields)}
                {responseFields && renderSection('Response Details', responseFields)}
            </Box>
        );
    };

    return (
        <>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell>
                    <IconButton
                        size="small"
                        onClick={() => setOpen(!open)}
                        aria-label={open ? "collapse row" : "expand row"}
                    >
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell component="th" scope="row">
                    <Typography variant="body2" color="textSecondary">
                        {formatDate(log.timestamp)}
                    </Typography>
                </TableCell>
                <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip
                            label={getDisplayLevel(log)}
                            color={getLevelColor(log.level)}
                            size="small"
                        />
                        {log.eventType && (
                            <Chip
                                label={log.eventType}
                                size="small"
                                sx={{
                                    backgroundColor: getEventTypeColor(log.eventType),
                                    color: 'white',
                                }}
                            />
                        )}
                    </Box>
                </TableCell>
                <TableCell>
                    <Typography variant="body2">
                        {log.source || '-'}
                    </Typography>
                </TableCell>
                <TableCell>
                    <Typography
                        variant="body2"
                        sx={{
                            maxWidth: '400px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {log.message}
                    </Typography>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            <Typography variant="h6" gutterBottom component="div">
                                Details
                            </Typography>
                            {renderFields()}
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
};

export const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const paginatedLogs = logs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Paper sx={{ width: '100%', mb: 2 }}>
            <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader aria-label="collapsible log table">
                    <TableHead>
                        <TableRow>
                            <TableCell style={{ width: '48px' }} />
                            <TableCell style={{ width: '200px' }}>Timestamp</TableCell>
                            <TableCell style={{ width: '220px' }}>Level & Type</TableCell>
                            <TableCell style={{ width: '150px' }}>Source</TableCell>
                            <TableCell>Message</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedLogs.map((log, index) => (
                            <Row key={`${page}-${index}`} log={log} />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
                component="div"
                count={logs.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                    '.MuiTablePagination-toolbar': {
                        minHeight: '48px',
                    }
                }}
            />
        </Paper>
    );
};

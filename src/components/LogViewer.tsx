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
    TablePagination
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import type { LogEntry } from '../types/LogTypes';

interface LogViewerProps {
    logs: LogEntry[];
}

interface RowProps {
    log: LogEntry;
}

const Row: React.FC<RowProps> = ({ log }) => {
    const [open, setOpen] = useState(false);

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

    const formatDate = (timestamp: string) => {
        try {
            return new Date(timestamp).toLocaleString();
        } catch {
            return timestamp;
        }
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
                    {formatDate(log.timestamp)}
                </TableCell>
                <TableCell>
                    <Chip
                        label={log.level}
                        color={getLevelColor(log.level)}
                        size="small"
                    />
                </TableCell>
                <TableCell>{log.source || '-'}</TableCell>
                <TableCell>{log.message}</TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            <Typography variant="h6" gutterBottom component="div">
                                Details
                            </Typography>
                            {log.stackTrace && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2">Stack Trace:</Typography>
                                    <Paper sx={{ p: 1, bgcolor: '#f5f5f5' }}>
                                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                            {log.stackTrace}
                                        </pre>
                                    </Paper>
                                </Box>
                            )}
                            {log.additionalInfo && Object.keys(log.additionalInfo).length > 0 && (
                                <Box>
                                    <Typography variant="subtitle2">Additional Information:</Typography>
                                    <Paper sx={{ p: 1, bgcolor: '#f5f5f5' }}>
                                        <pre style={{ margin: 0 }}>
                                            {JSON.stringify(log.additionalInfo, null, 2)}
                                        </pre>
                                    </Paper>
                                </Box>
                            )}
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
                            <TableCell>Timestamp</TableCell>
                            <TableCell>Level</TableCell>
                            <TableCell>Source</TableCell>
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
            />
        </Paper>
    );
};

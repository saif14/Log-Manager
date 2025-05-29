import React, { useCallback, useState } from 'react';
import { Box, Button, Typography, Paper, Alert, Snackbar } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import type { LogEntry } from '../types/LogTypes';
import { LogParser } from '../services/LogParser';

interface LogUploaderProps {
    onLogsLoaded: (entries: LogEntry[]) => void;
}

export const LogUploader: React.FC<LogUploaderProps> = ({ onLogsLoaded }) => {
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const entries = await LogParser.parseFile(file);
            onLogsLoaded(entries);
            setError(null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error parsing log file';
            setError(errorMessage);
            console.error('Error parsing log file:', err);
        }
    }, [onLogsLoaded]);

    const handleDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (!file) return;

        try {
            const entries = await LogParser.parseFile(file);
            onLogsLoaded(entries);
            setError(null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error parsing log file';
            setError(errorMessage);
            console.error('Error parsing log file:', err);
        }
    }, [onLogsLoaded]);

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const handleCloseError = () => {
        setError(null);
    };

    return (
        <>
            <Paper
                elevation={3}
                sx={{
                    p: 3,
                    textAlign: 'center',
                    backgroundColor: '#f5f5f5',
                    cursor: 'pointer'
                }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                <input
                    type="file"
                    id="log-file-input"
                    hidden
                    onChange={handleFileUpload}
                    accept=".log,.txt,.csv"
                />
                <Box
                    sx={{
                        border: '2px dashed #9e9e9e',
                        borderRadius: 2,
                        p: 3,
                        mb: 2
                    }}
                >
                    <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                        Drag and drop your log file here
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        or
                    </Typography>
                    <Button
                        component="label"
                        htmlFor="log-file-input"
                        variant="contained"
                        sx={{ mt: 2 }}
                    >
                        Browse Files
                    </Button>
                </Box>
                <Typography variant="body2" color="textSecondary">
                    Supported formats: .log, .txt, .csv
                </Typography>
            </Paper>
            <Snackbar
                open={error !== null}
                autoHideDuration={6000}
                onClose={handleCloseError}
            >
                <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>
        </>
    );
};

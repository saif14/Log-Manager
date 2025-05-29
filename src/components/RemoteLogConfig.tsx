import React, { useState } from 'react';
import {
    Box,
    Button,
    TextField,
    MenuItem,
    Paper,
    Typography,
    Stack,
    Alert,
} from '@mui/material';
import type { RemoteLogConfig } from '../services/RemoteLogFetcher';
import { RemoteLogFetcher } from '../services/RemoteLogFetcher';
import type { LogEntry } from '../types/LogTypes';

interface RemoteLogConfigProps {
    onLogsFetched: (logs: LogEntry[]) => void;
}

export const RemoteLogConfiguration: React.FC<RemoteLogConfigProps> = ({ onLogsFetched }) => {
    const [config, setConfig] = useState<RemoteLogConfig>({
        url: '',
        username: '',
        password: '',
        logType: 'tomcat',
        customPath: '',
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleConfigChange = (field: keyof RemoteLogConfig) => (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setConfig((prev) => ({
            ...prev,
            [field]: event.target.value,
        }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const logs = await RemoteLogFetcher.fetchLogs(config);
            onLogsFetched(logs);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch logs');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
                Remote Log Configuration
            </Typography>
            <form onSubmit={handleSubmit}>
                <Stack spacing={2}>
                    <TextField
                        fullWidth
                        label="Server URL"
                        value={config.url}
                        onChange={handleConfigChange('url')}
                        required
                        placeholder="https://your-server.com/logs"
                    />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            fullWidth
                            label="Username"
                            value={config.username}
                            onChange={handleConfigChange('username')}
                        />
                        <TextField
                            fullWidth
                            type="password"
                            label="Password"
                            value={config.password}
                            onChange={handleConfigChange('password')}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            fullWidth
                            select
                            label="Log Type"
                            value={config.logType}
                            onChange={handleConfigChange('logType')}
                        >
                            <MenuItem value="tomcat">Tomcat</MenuItem>
                            <MenuItem value="catalina">Catalina</MenuItem>
                            <MenuItem value="custom">Custom</MenuItem>
                        </TextField>
                        <TextField
                            fullWidth
                            label="Custom Log Path"
                            value={config.customPath}
                            onChange={handleConfigChange('customPath')}
                            disabled={config.logType !== 'custom'}
                            placeholder="/path/to/custom/log"
                        />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={loading}
                        >
                            {loading ? 'Fetching...' : 'Fetch Logs'}
                        </Button>
                    </Box>
                    {error && (
                        <Alert severity="error">{error}</Alert>
                    )}
                </Stack>
            </form>
        </Paper>
    );
};

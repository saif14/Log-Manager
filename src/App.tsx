import { useState } from 'react';
import { Container, Box, Typography, CssBaseline, ThemeProvider, createTheme, Tabs, Tab } from '@mui/material';
import { LogUploader } from './components/LogUploader';
import { LogViewer } from './components/LogViewer';
import { LogFilter } from './components/LogFilter';
import { LogStats } from './components/LogStats';
import { RemoteLogConfiguration } from './components/RemoteLogConfig';
import type { LogEntry, LogFilter as LogFilterType } from './types/LogTypes';
import { LogParser } from './services/LogParser';

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

function App() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<LogFilterType>({});
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState(0);

  const handleLogsLoaded = (entries: LogEntry[]) => {
    setLogs(entries);
    setFilteredLogs(entries);
  };

  const handleFilterChange = (newFilter: LogFilterType) => {
    setFilter(newFilter);
    const filtered = LogParser.filterLogs(logs, newFilter);
    setFilteredLogs(filtered);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Log Analyzer
          </Typography>

          <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="Upload Logs" />
            <Tab label="Remote Logs" />
          </Tabs>

          {activeTab === 0 ? (
            <Box sx={{ mb: 4 }}>
              <LogUploader onLogsLoaded={handleLogsLoaded} />
            </Box>
          ) : (
            <Box sx={{ mb: 4 }}>
              <RemoteLogConfiguration onLogsFetched={handleLogsLoaded} />
            </Box>
          )}

          {logs.length > 0 && (
            <>
              <LogFilter filter={filter} onFilterChange={handleFilterChange} />
              <LogStats stats={LogParser.calculateStats(filteredLogs)} />
              <Box sx={{ mt: 3 }}>
                <LogViewer logs={filteredLogs} />
              </Box>
            </>
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;

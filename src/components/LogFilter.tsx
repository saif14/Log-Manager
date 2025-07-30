import React from 'react';
import {
    Box,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Stack,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import type { LogFilter as LogFilterType } from '../types/LogTypes';

interface LogFilterProps {
    filter: LogFilterType;
    onFilterChange: (filter: LogFilterType) => void;
}

export const LogFilter: React.FC<LogFilterProps> = ({ filter, onFilterChange }) => {
    const handleChange = (field: keyof LogFilterType, value: any) => {
        onFilterChange({
            ...filter,
            [field]: value
        });
    };

    const handleLevelChange = (event: SelectChangeEvent<string>) => {
        handleChange('level', event.target.value || undefined);
    };

    const handleDateChange = (field: 'startDate' | 'endDate') => (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const date = event.target.value ? new Date(event.target.value) : undefined;
        handleChange(field, date);
    };

    return (
        <Box sx={{ mb: 3 }}>
            <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} alignItems="flex-start">
                <TextField
                    type="datetime-local"
                    label="Start Date"
                    value={filter.startDate?.toISOString().slice(0, 16) || ''}
                    onChange={handleDateChange('startDate')}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 200 }}
                />
                <TextField
                    type="datetime-local"
                    label="End Date"
                    value={filter.endDate?.toISOString().slice(0, 16) || ''}
                    onChange={handleDateChange('endDate')}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 200 }}
                />
                <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel id="log-level-label">Level</InputLabel>
                    <Select
                        labelId="log-level-label"
                        value={filter.level || ''}
                        label="Level"
                        onChange={handleLevelChange}
                    >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="ERROR">Error</MenuItem>
                        <MenuItem value="WARN">Warning</MenuItem>
                        <MenuItem value="INFO">Info</MenuItem>
                    </Select>
                </FormControl>
                <TextField
                    label="Source"
                    value={filter.source || ''}
                    onChange={(e) => handleChange('source', e.target.value || undefined)}
                    sx={{ minWidth: 150 }}
                />
                <TextField
                    label="Account No"
                    value={filter.accountNo || ''}
                    onChange={(e) => handleChange('accountNo', e.target.value || undefined)}
                    sx={{ minWidth: 150 }}
                />
                <TextField
                    label="Unique Id"
                    value={filter.uniqueId || ''}
                    onChange={(e) => handleChange('uniqueId', e.target.value || undefined)}
                    sx={{ minWidth: 150 }}
                />
                <TextField
                    label="Search"
                    value={filter.searchTerm || ''}
                    onChange={(e) => handleChange('searchTerm', e.target.value || undefined)}
                    placeholder="Search in logs..."
                    sx={{ minWidth: 200 }}
                />
            </Stack>
        </Box>
    );
};

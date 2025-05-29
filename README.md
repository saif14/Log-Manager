# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ["./tsconfig.node.json", "./tsconfig.app.json"],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    "react-x": reactX,
    "react-dom": reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs["recommended-typescript"].rules,
    ...reactDom.configs.recommended.rules,
  },
});
```

# Log Analyzer

A powerful log analysis tool built with React and TypeScript that helps you analyze log files from various sources like Tomcat, Catalina, and more.

## Features

- 📊 Visual log analysis with charts and statistics
- 🔍 Advanced filtering and searching capabilities
- 📁 Support for multiple log file formats
- 📈 Error and warning trend analysis
- 🕒 Time-based log analysis
- 📋 Detailed log entry inspection
- 🎨 Modern and responsive user interface

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Development

To start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## Usage

1. Upload your log file using the drag-and-drop interface or file browser
2. Use the filter panel to:
   - Set date range
   - Filter by log level (ERROR, WARN, INFO)
   - Search for specific terms
   - Filter by source
3. View statistics and charts showing:
   - Distribution of log levels
   - Time-based patterns
   - Source distribution
4. Click on any log entry to view detailed information including:
   - Stack traces
   - Additional metadata
   - Full message content

## Supported Log Formats

The analyzer supports various log formats:

- Plain text logs with timestamp, level, and message
- CSV formatted logs
- Structured logs with additional metadata

### Expected Log Format

The basic log format should include:

- Timestamp
- Log Level (ERROR, WARN, INFO, etc.)
- Message
- (Optional) Source
- (Optional) Stack Trace
- (Optional) Additional Information

## Technical Details

Built with:

- React 18
- TypeScript
- Vite
- Material-UI
- Chart.js
- Papa Parse (for CSV parsing)

## License

This project is licensed under the MIT License.

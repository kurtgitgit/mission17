# Mission17 Project Rules

## Deployment & Updates
- **Mobile Updates**: Always default to using Over-The-Air (OTA) updates via `eas update` instead of doing full APK builds (`eas build`) for the `mission17-mobile` project, unless explicitly asked otherwise.

## Coding Standards & Best Practices
- **Error Handling**: Always use `try/catch` blocks around async/await operations. Ensure error logs are descriptive and provide context (e.g., `console.error('Failed to fetch user:', error)`).
- **Environment Variables**: Never hardcode sensitive information (API keys, database URIs). Always read from `process.env` and ensure `dotenv` is configured correctly.
- **Modern JavaScript**: Default to modern ES6+ syntax (arrow functions, template literals, destructuring). 
- **Clean Code**: Before concluding a task, ensure there are no unused imports, unused variables, or leftover "scratchpad" `console.log` statements (unless it's specifically a script meant for logging, like `check_user.js`).
- **Verification**: Always run and test code locally to verify it works before declaring a task complete.

## Architecture & Project Structure
- **Modularity**: Keep React Native components small and focused on a single responsibility. If a file exceeds 200-300 lines, consider breaking it down into smaller sub-components.
- **Separation of Concerns**: Keep business logic (API calls, data formatting) separate from UI components. Use custom hooks or dedicated utility/service files for complex logic.
- **Backend Communication**: When writing frontend code that calls the `mission17-backend`, always handle loading states (spinners) and network failure states gracefully so the app doesn't crash on the user.

## UI / UX Standards
- **Responsive Design**: For mobile layouts, prefer using React Native's Flexbox instead of hardcoding pixel widths/heights, ensuring the app looks good on different screen sizes.
- **User Feedback**: Always provide visual feedback for user actions (e.g., disable buttons while submitting, show toast messages on success/failure).

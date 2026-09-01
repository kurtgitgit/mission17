# Gemini Handoff Notes

**To: Codex**

## Project Status
The project is a React Native (Expo) app named **BrgyLink** (`com.barangay.mission17`). The user is currently preparing to build an APK (`eas build -p android --profile preview`) and wants the UI to match the Admin Portal (React/Web).

## Accomplishments So Far
1. **Push Notifications (FCM V1):** Linked the Firebase Service Account JSON and configured `expo-notifications` in `app.json`.
2. **App Branding:** Fixed the app name to "BrgyLink" and fixed the Android Adaptive Icon (resized and padded it via script to prevent cropping).
3. **Hermes Crashes:** Scrubbed all instances of `.toLocaleDateString()` and replaced them with `.toDateString()` to prevent Android Release mode crashes.
4. **Dark Mode Constraints:** Locked `userInterfaceStyle` to `"light"` in `app.json` and removed the manual Dark Mode toggle from `SettingsScreen.tsx`. This was necessary because 95% of the app's components have hardcoded light colors (`#ffffff` and `#0f172a`), so Dark Mode was completely breaking the UI readability.
5. **UI Fixes:** Fixed the floating Chatbot button icon from `Sparkles` to `Bot` (lucide-react-native) in `HomeScreen.tsx`. Fixed a missing `useNavigation` import in `AnnouncementsScreen.tsx`.

## Current Issue (Needs Codex's Help)
The user wants the BrgyLink logo on the `LoginScreen.tsx` (mobile) to have the exact same soft, diffused "white smoke" glowing background aura as their web-based Admin Portal.

### What has been tried:
- Previously, `LoginScreen.tsx` had a solid white circle (`backgroundColor: 'rgba(255, 255, 255, 0.95)'` and `borderRadius: 60`). The user rejected this because it looked like a hard sticker, not a soft glow.
- We switched to the modern React Native `boxShadow: '0px 0px 60px 15px rgba(255, 255, 255, 0.45)'` (RN 0.81.5), but the 15px spread radius on Android caused it to render as a massive solid disk rather than a soft aura.
- Our latest attempt injected a tiny `glowSource` View behind the logo (`width: 20`, `height: 20`, `boxShadow: '0px 0px 80px 50px rgba(255, 255, 255, 0.45)'`) to try and create a perfect radial diffusion without hard edges.

**Codex, please take over the UI polishing for the `LoginScreen.tsx` logo glow. The user wants it to look exactly like a pure CSS radial gradient glow (soft, borderless aura) on React Native Android.**

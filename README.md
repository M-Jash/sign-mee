# sign-mee
# SignMee 👋 

SignMee is an interactive, web-based tool designed to translate American Sign Language (ASL) and hand gestures into text in real-time. By leveraging computer vision and web-based camera inputs, this application bridges communication gaps and provides an accessible platform for learning and recognizing sign language.

## 🚀 Features

- **Real-Time Video Processing:** Captures and feeds live webcam data directly into custom gesture analysis hooks.
- **ASL & Gesture Classification:** Uses custom mapping algorithms (`aslClassifier.ts`) to match hand coordinates to letters and actions.
- **Dual Mode Support:** Switch seamlessly between specific ASL alphabet recognition and universal gesture tracking.
- **Visual Reference Guide:** Includes an on-screen reference panel to help users learn and perfect their hand positioning.
- **Clean Responsive UI:** A modern workspace built with Tailwind CSS, featuring status badges, camera toggles, and live text readouts.

## 🛠️ Tech Stack

- **Frontend:** React with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + PostCSS
- **Linting:** ESLint

## 📁 Project Structure

The core architecture of the tracking and classification logic is structured as follows:

```text
src/
├── components/
│   ├── CameraToggle.tsx       # Controls video stream access
│   ├── GestureReference.tsx   # Visual guide for users
│   ├── Header.tsx             # Main navigation & branding
│   ├── ResultPanel.tsx        # Displays translated text outputs
│   ├── StatusBadge.tsx        # Real-time connection/tracking state
│   └── VideoWorkspace.tsx     # Video layout container
├── aslClassifier.ts           # ASL letter translation rules
├── gestureClassifier.ts       # Core gesture matching logic
├── useHandGestureRecognition.ts # React hook managing model state & frames
├── types.ts                   # TypeScript interfaces and declarations
└── main.tsx                   # Application entry point

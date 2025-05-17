# Real-Character.AI

A modern React Native app for interacting with AI-generated personalities based on real user conversations. This frontend connects to the [AI Social App Backend](https://github.com/Hardik500/real-character-ai-backend) to provide a chat experience where you can converse with simulated personalities derived from Slack, WhatsApp, and other platforms.

---

## Features

- **User List**: Browse and select from a list of available AI-generated personalities.
- **Chat Interface**: Real-time chat with personalities, with responses generated to match their unique style and interests.
- **Conversation History**: View and clear your chat history with each personality.
- **Optimistic UI**: Instant feedback when sending messages, with loading indicators for AI responses.
- **Profile Avatars**: Auto-generated avatars for each personality.
- **Error Handling**: User-friendly error and loading states.
- **TypeScript**: Full type safety for robust development.
- **Modern UI**: Clean, mobile-friendly design with theming support.

---

## Architecture

- **React Native** with TypeScript
- **Navigation**: Stack navigation using `@react-navigation/native` and `@react-navigation/native-stack`
- **API Integration**: Communicates with the backend via RESTful endpoints (see [Backend README](../real-character-ai-backend/README.md) for API details)
- **Component Structure**:
  - `src/screens/`: App screens (Home, Chat)
  - `src/components/`: Reusable UI components (UserList, ChatMessage, ChatInput)
  - `src/services/api.ts`: API client (Axios)
  - `src/types/`: TypeScript types and interfaces

---

## Getting Started

### Prerequisites
- Node.js (>=18)
- Yarn or npm
- React Native CLI
- [Backend API running and accessible](../real-character-ai-backend/README.md)
- (For iOS) Xcode and CocoaPods

### 1. Install Dependencies

```sh
npm install
# or
yarn install
```

### 2. Configure API Endpoint

Edit `src/services/api.ts` and set `API_URL` to your backend's accessible IP address (not `localhost` if running on a device):

```js
const API_URL = 'http://<YOUR_BACKEND_IP>:8000';
```

### 3. Start Metro Bundler

```sh
npm start
# or
yarn start
```

### 4. Run the App

#### Android
```sh
npm run android
# or
yarn android
```

#### iOS
```sh
cd ios && bundle install && bundle exec pod install && cd ..
npm run ios
# or
yarn ios
```

---

## Usage

1. **Home Screen**: See a list of available personalities. Tap a user to start chatting.
2. **Chat Screen**: Send messages and receive AI-generated responses in the selected user's style. Use the "Clear" button to reset the conversation.
3. **Profile Avatars**: Each personality is shown with an avatar (auto-generated if not provided).

---

## Development

- **TypeScript**: All code is type-safe. Types are in `src/types/`.
- **Navigation**: Stack navigation is set up in `App.tsx`.
- **API**: All backend calls are in `src/services/api.ts`.
- **Code Style**: Linting with ESLint (`npm run lint`), formatting with Prettier.
- **Path Aliases**: Use `@components/`, `@screens/`, etc., as defined in `tsconfig.json`.

### Scripts
- `npm start` / `yarn start`: Start Metro bundler
- `npm run android` / `yarn android`: Run on Android
- `npm run ios` / `yarn ios`: Run on iOS
- `npm run lint`: Lint code
- `npm test`: Run tests (Jest)

---

## Troubleshooting

- **Metro not connecting**: Ensure your device/emulator is on the same network as your backend, and `API_URL` is correct.
- **iOS build issues**: Run `bundle install` and `bundle exec pod install` in the `ios/` directory.
- **Backend errors**: See [Backend README](../real-character-ai-backend/README.md) for API and data requirements.

---

## Contributing

1. Fork the repo and create a feature branch.
2. Follow the code style (ESLint, Prettier).
3. Use TypeScript for all new code.
4. Submit a pull request with a clear description.

---

## License

MIT

---

## References
- [AI Social App Backend](../real-character-ai-backend/README.md)
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [React Navigation](https://reactnavigation.org/)

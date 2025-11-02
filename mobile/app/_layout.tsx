import { Slot } from "expo-router";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import SafeScreen from "../components/SafeScreen";
import ErrorBoundary from '../components/ErrorBoundary';
import Constants from "expo-constants";

export default function RootLayout() {
  // Attempt to read the publishable key from environment or expo config extra.
  const publishableKey =
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    Constants.expoConfig?.extra?.CLERK_PUBLISHABLE_KEY ||
    Constants.manifest?.extra?.CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    // Provide a clearer runtime hint than the default error so developer knows where to set it.
    console.error(
      "Clerk publishable key is missing. Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your environment or add { extra: { CLERK_PUBLISHABLE_KEY: 'pk_...' } } to app.json/app.config.js"
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <SafeScreen>
        <ErrorBoundary>
          <Slot />
        </ErrorBoundary>
      </SafeScreen>
    </ClerkProvider>
  );
}

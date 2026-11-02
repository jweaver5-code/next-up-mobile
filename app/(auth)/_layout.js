import { Redirect, Stack } from "expo-router";
import { useSession } from "../../src/api";
import { colors } from "../../src/theme";

export default function AuthLayout() {
  const { user, ready } = useSession();
  if (!ready) return null;
  if (user?.needsLegalAgreement) return <Redirect href="/legal" />;
  if (user && !user.onboardingComplete) return <Redirect href="/onboard" />;
  if (user) return <Redirect href="/feed" />;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ title: "Create account" }} />
      <Stack.Screen name="forgot" options={{ title: "Reset password" }} />
    </Stack>
  );
}

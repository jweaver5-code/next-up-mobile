import { Redirect, Stack, useSegments } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useSession } from "../../src/api";
import { colors } from "../../src/theme";

export default function AppLayout() {
  const { user, ready } = useSession();
  const segments = useSegments();
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  if (!user) return <Redirect href="/login" />;
  const onLegal = segments.includes("legal");
  const onOnboard = segments.includes("onboard");
  if (user.needsLegalAgreement && !onLegal) return <Redirect href="/legal" />;
  if (!user.onboardingComplete && !onOnboard && !user.needsLegalAgreement) return <Redirect href="/onboard" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboard" options={{ title: "Get started", headerBackVisible: false }} />
      <Stack.Screen name="legal" options={{ title: "Agreements", headerBackVisible: false }} />
      <Stack.Screen name="title/[type]/[id]" options={{ title: "Title" }} />
      <Stack.Screen name="person/[id]" options={{ title: "Profile" }} />
      <Stack.Screen name="group" options={{ title: "Watch together" }} />
      <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
      <Stack.Screen name="edit-profile" options={{ title: "Edit profile" }} />
    </Stack>
  );
}

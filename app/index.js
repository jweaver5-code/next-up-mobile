import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useSession } from "../src/api";
import { colors } from "../src/theme";

export default function Index() {
  const { user, ready } = useSession();
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  if (!user) return <Redirect href="/login" />;
  if (user.needsLegalAgreement) return <Redirect href="/legal" />;
  if (!user.onboardingComplete) return <Redirect href="/onboard" />;
  return <Redirect href="/feed" />;
}

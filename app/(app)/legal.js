import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { API_URL, api, useSession } from "../../src/api";
import { colors } from "../../src/theme";
import { Button, ErrorText, Screen } from "../../src/ui";

export default function LegalScreen() {
  const { user, setUser } = useSession();
  const router = useRouter();
  const [privacy, setPrivacy] = useState(false);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function accept() {
    setBusy(true);
    setError("");
    try {
      const next = await api("/api/auth/legal", { method: "POST", body: { privacy, terms } });
      await setUser(next);
      router.replace(next.onboardingComplete ? "/feed" : "/onboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen style={styles.wrap}>
      <Text style={styles.title}>Before you continue</Text>
      <Text style={styles.body}>
        {user?.displayName ? `${user.displayName}, the` : "The"} Privacy Policy and Terms need a fresh agreement.
      </Text>
      <Check
        label="I agree to the Privacy Policy"
        checked={privacy}
        onPress={() => setPrivacy((v) => !v)}
        href={`${API_URL}/privacy.html`}
      />
      <Check
        label="I agree to the Terms"
        checked={terms}
        onPress={() => setTerms((v) => !v)}
        href={`${API_URL}/terms.html`}
      />
      <ErrorText>{error}</ErrorText>
      <Button title="Continue" onPress={accept} disabled={busy || !privacy || !terms} />
    </Screen>
  );
}

function Check({ label, checked, onPress, href }) {
  return (
    <View style={styles.row}>
      <Pressable onPress={onPress} style={[styles.box, checked && styles.boxOn]}>
        <Text style={styles.mark}>{checked ? "✓" : ""}</Text>
      </Pressable>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.link} onPress={() => WebBrowser.openBrowserAsync(href)}>Read</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, gap: 16 },
  title: { color: colors.text, fontSize: 28, fontWeight: "700" },
  body: { color: colors.muted, lineHeight: 21 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  label: { color: colors.text, flex: 1 },
  link: { color: colors.accent, fontWeight: "700" },
  box: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  boxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  mark: { color: "#fff", fontWeight: "700" },
});

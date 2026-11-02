import { Link } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { useSession } from "../../src/api";
import { colors } from "../../src/theme";
import { Button, ErrorText, Field, Screen } from "../../src/ui";

export default function LoginScreen() {
  const { login } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView style={styles.wrap} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Text style={styles.brand}>NextUp</Text>
        <Text style={styles.sub}>See what friends are watching.</Text>
        <Field label="Email" value={email} onChangeText={setEmail} autoComplete="email" keyboardType="email-address" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
        <ErrorText>{error}</ErrorText>
        <Button title="Sign in" onPress={submit} disabled={busy || !email || !password} />
        <Link href="/forgot" style={styles.link}>Forgot password</Link>
        <View style={styles.row}>
          <Text style={styles.muted}>New here?</Text>
          <Link href="/register" style={styles.link}>Create an account</Link>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, gap: 14, justifyContent: "center" },
  brand: { color: colors.text, fontSize: 42, fontWeight: "700" },
  sub: { color: colors.muted, fontSize: 16, marginBottom: 8 },
  link: { color: colors.accent, fontSize: 15, fontWeight: "600" },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  muted: { color: colors.muted },
});

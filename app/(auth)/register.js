import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { API_URL, useSession } from "../../src/api";
import { colors } from "../../src/theme";
import { Button, ErrorText, Field, Screen } from "../../src/ui";

export default function RegisterScreen() {
  const { register } = useSession();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthday, setBirthday] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
        throw new Error("Birthday must look like 2000-01-31.");
      }
      await register({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        username: username.trim(),
        dateOfBirth: birthday,
        acceptPrivacy: privacy,
        acceptTerms: terms,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={["top", "left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create account</Text>
        <Field label="Name" value={displayName} onChangeText={setDisplayName} autoCapitalize="words" />
        <Field label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <Field label="Birthday (YYYY-MM-DD)" value={birthday} onChangeText={setBirthday} placeholder="2000-01-31" />
        <Check label="I agree to the Privacy Policy" checked={privacy} onPress={() => setPrivacy((v) => !v)} href={`${API_URL}/privacy.html`} />
        <Check label="I agree to the Terms" checked={terms} onPress={() => setTerms((v) => !v)} href={`${API_URL}/terms.html`} />
        <ErrorText>{error}</ErrorText>
        <Button title="Create account" onPress={submit} disabled={busy || !privacy || !terms} />
        <Link href="/login" style={styles.link}>Already have an account</Link>
      </ScrollView>
    </Screen>
  );
}

function Check({ label, checked, onPress, href }) {
  return (
    <View style={styles.checkRow}>
      <Pressable onPress={onPress} style={[styles.box, checked && styles.boxOn]}>
        <Text style={styles.boxMark}>{checked ? "✓" : ""}</Text>
      </Pressable>
      <Text style={styles.checkLabel}>{label}. </Text>
      <Text style={styles.link} onPress={() => WebBrowser.openBrowserAsync(href)}>Read</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 24, gap: 14 },
  title: { color: colors.text, fontSize: 32, fontWeight: "700" },
  link: { color: colors.accent, fontWeight: "600" },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkLabel: { color: colors.text, flexShrink: 1 },
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
  boxMark: { color: "#fff", fontWeight: "700" },
});

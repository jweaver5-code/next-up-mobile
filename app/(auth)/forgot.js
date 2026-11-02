import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { api } from "../../src/api";
import { colors } from "../../src/theme";
import { Button, ErrorText, Field, Screen } from "../../src/ui";

export default function ForgotScreen() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const data = await api("/api/auth/forgot-password", {
        method: "POST",
        body: { email: email.trim() },
      });
      setMessage(data?.resetUrl ? `${data.message} ${data.resetUrl}` : data?.message || "Check your email.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={["left", "right", "bottom"]} style={styles.wrap}>
      <Text style={styles.title}>Reset password</Text>
      <Text style={styles.body}>We’ll email a link if this address has an account. The link opens the website, then you can sign in here.</Text>
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <ErrorText>{error}</ErrorText>
      {message ? <Text style={styles.ok}>{message}</Text> : null}
      <Button title="Send reset link" onPress={submit} disabled={busy || !email} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 24, gap: 14 },
  title: { color: colors.text, fontSize: 28, fontWeight: "700" },
  body: { color: colors.muted, lineHeight: 21 },
  ok: { color: colors.text, lineHeight: 21 },
});

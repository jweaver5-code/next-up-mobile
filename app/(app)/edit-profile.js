import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { api, useSession } from "../../src/api";
import { colors } from "../../src/theme";
import { Button, ErrorText, Field, Screen } from "../../src/ui";

export default function EditProfileScreen() {
  const { user, setUser } = useSession();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [email, setEmail] = useState(user?.email || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setError("");
    try {
      const next = await api("/api/profiles/me", {
        method: "PUT",
        body: { displayName, username, bio, email },
      });
      await setUser(next);
      router.back();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function pickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Photo access is needed to set a profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const body = new FormData();
    body.append("file", {
      uri: asset.uri,
      name: "avatar.jpg",
      type: asset.mimeType || "image/jpeg",
    });
    setBusy(true);
    setError("");
    try {
      const next = await api("/api/profiles/me/avatar", { method: "POST", body });
      await setUser(next);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen style={styles.wrap}>
      <Text style={styles.title}>Edit profile</Text>
      <Field label="Name" value={displayName} onChangeText={setDisplayName} autoCapitalize="words" />
      <Field label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Field label="Bio" value={bio} onChangeText={setBio} autoCapitalize="sentences" multiline />
      <ErrorText>{error}</ErrorText>
      <Button title="Choose photo" secondary onPress={pickAvatar} disabled={busy} />
      <Button title="Save" onPress={save} disabled={busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 12 },
  title: { color: colors.text, fontSize: 24, fontWeight: "700" },
});

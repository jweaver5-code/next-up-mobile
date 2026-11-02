import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { api, useSession } from "../../../src/api";
import { colors } from "../../../src/theme";
import { Button, ErrorText, Field, Poster } from "../../../src/ui";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, setUser } = useSession();
  const [profile, setProfile] = useState(null);
  const [services, setServices] = useState([]);
  const [mine, setMine] = useState([]);
  const [wrapped, setWrapped] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deleteName, setDeleteName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [me, catalog, saved, recap] = await Promise.all([
        api(`/api/profiles/${user.id}`),
        api("/api/meta/services"),
        api("/api/profiles/me/platforms"),
        api("/api/profiles/me/wrapped").catch(() => null),
      ]);
      setProfile(me);
      setServices(catalog || []);
      setMine(saved?.services || []);
      setWrapped(recap);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function toggleService(name) {
    const next = mine.includes(name) ? mine.filter((item) => item !== name) : [...mine, name];
    setMine(next);
    try {
      await api("/api/profiles/me/platforms", { method: "PUT", body: { services: next } });
    } catch (err) {
      setError(err.message);
    }
  }

  async function changePassword() {
    setMessage("");
    setError("");
    try {
      await api("/api/auth/change-password", {
        method: "POST",
        body: { currentPassword, newPassword },
      });
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Password updated. Sign in again on this phone.");
      await logout();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeAccount() {
    setError("");
    try {
      await api("/api/auth/me", { method: "DELETE", body: { username: deleteName.trim() } });
      await setUser(null);
      await logout();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Poster uri={profile?.user?.avatarUrl || user?.avatarUrl} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{profile?.user?.displayName || user?.displayName}</Text>
          <Text style={styles.muted}>@{profile?.user?.username || user?.username}</Text>
          {profile?.user?.bio ? <Text style={styles.bio}>{profile.user.bio}</Text> : null}
        </View>
      </View>
      <Text style={styles.muted}>
        {profile?.followerCount || 0} followers · {profile?.followingCount || 0} following
      </Text>
      <ErrorText>{error}</ErrorText>
      {message ? <Text style={styles.ok}>{message}</Text> : null}
      <Button title="Edit profile" secondary onPress={() => router.push("/edit-profile")} />
      <Button title="Notifications" secondary onPress={() => router.push("/notifications")} />
      <Button title="Watch together" secondary onPress={() => router.push("/group")} />
      {wrapped ? (
        <View style={styles.card}>
          <Text style={styles.heading}>{wrapped.monthLabel} {wrapped.year}</Text>
          <Text style={styles.bio}>{wrapped.titlesLogged} titles · {wrapped.minutesWatched} minutes</Text>
        </View>
      ) : null}
      <Text style={styles.heading}>Your services</Text>
      <View style={styles.chips}>
        {services.map((name) => (
          <Pressable key={name} onPress={() => toggleService(name)} style={[styles.chip, mine.includes(name) && styles.chipOn]}>
            <Text style={styles.chipText}>{name}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.heading}>Change password</Text>
      <Field label="Current password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
      <Field label="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
      <Button title="Update password" onPress={changePassword} disabled={!currentPassword || newPassword.length < 6} />
      <Text style={styles.heading}>Delete account</Text>
      <Field label="Type your username" value={deleteName} onChangeText={setDeleteName} autoCapitalize="none" />
      <Button title="Delete account" danger onPress={removeAccount} disabled={!deleteName} />
      <Button title="Sign out" secondary onPress={logout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 12 },
  header: { flexDirection: "row", gap: 12 },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  name: { color: colors.text, fontSize: 24, fontWeight: "700" },
  muted: { color: colors.muted },
  bio: { color: colors.text, marginTop: 4 },
  heading: { color: colors.text, fontSize: 18, fontWeight: "700", marginTop: 8 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 12, gap: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.line, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.text },
  ok: { color: "#b6f0c2" },
});

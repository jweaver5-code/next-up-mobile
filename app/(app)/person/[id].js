import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { api } from "../../../src/api";
import { colors } from "../../../src/theme";
import { Button, ErrorText, Poster } from "../../../src/ui";

export default function PersonScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      setProfile(await api(`/api/profiles/${id}`));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function run(method, path) {
    try {
      await api(path, { method, body: method === "DELETE" ? undefined : {} });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const relation = profile?.friendRelation;
  const user = profile?.user;
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: user?.displayName || "Profile" }} />
      <Poster uri={user?.avatarUrl} style={styles.avatar} />
      <Text style={styles.name}>{user?.displayName}</Text>
      <Text style={styles.muted}>@{user?.username}</Text>
      {user?.bio ? <Text style={styles.body}>{user.bio}</Text> : null}
      <Text style={styles.muted}>{profile?.followerCount || 0} followers · {profile?.followingCount || 0} following</Text>
      <ErrorText>{error}</ErrorText>
      {profile && !profile.isSelf ? (
        <View style={styles.actions}>
          {relation === "Incoming" ? <Button title="Accept" onPress={() => run("POST", `/api/people/${id}/accept`)} /> : null}
          {relation === "Incoming" ? <Button title="Decline" secondary onPress={() => run("POST", `/api/people/${id}/decline`)} /> : null}
          {relation === "Outgoing" ? <Button title="Cancel request" secondary onPress={() => run("DELETE", `/api/people/${id}/request`)} /> : null}
          {relation === "Friends" ? <Button title="Watch together" onPress={() => router.push(`/group?friendId=${id}`)} /> : null}
          {relation === "None" ? <Button title="Add friend" onPress={() => run("POST", `/api/people/${id}/request`)} /> : null}
          <Button
            title={profile.isFollowing ? "Unfollow" : "Follow"}
            secondary
            onPress={() => run(profile.isFollowing ? "DELETE" : "POST", `/api/people/${id}/follow`)}
          />
        </View>
      ) : null}
      <Text style={styles.heading}>History</Text>
      {(profile?.history || []).map((item) => (
        <Pressable key={item.activityId} style={styles.row} onPress={() => router.push(`/title/${item.mediaType}/${item.tmdbId}`)}>
          <Poster uri={item.posterUrl} style={styles.poster} />
          <Text style={styles.body}>{item.titleName}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 10 },
  avatar: { width: 88, height: 88, borderRadius: 44, alignSelf: "center" },
  name: { color: colors.text, fontSize: 26, fontWeight: "700", textAlign: "center" },
  muted: { color: colors.muted, textAlign: "center" },
  body: { color: colors.text, lineHeight: 20 },
  heading: { color: colors.text, fontSize: 18, fontWeight: "700", marginTop: 8 },
  actions: { gap: 8 },
  row: { flexDirection: "row", gap: 10, alignItems: "center" },
  poster: { width: 42, height: 63, borderRadius: 6 },
});

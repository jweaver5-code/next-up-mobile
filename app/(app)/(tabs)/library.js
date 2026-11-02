import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { api } from "../../../src/api";
import { colors } from "../../../src/theme";
import { Button, Empty, ErrorText, Poster, Section } from "../../../src/ui";

export default function LibraryScreen() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setData(await api("/api/library"));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function respond(activityId, accept) {
    try {
      await api(`/api/watch/invite/${activityId}/${accept ? "accept" : "decline"}`, { method: "POST", body: {} });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ErrorText>{error}</ErrorText>
      <Section title="Invites">
        {(data?.pendingInvites || []).length === 0 ? <Text style={styles.muted}>No pending invites.</Text> : null}
        {(data?.pendingInvites || []).map((invite) => (
          <View key={invite.activityId} style={styles.card}>
            <Text style={styles.name}>{invite.otherDisplayName} invited you to {invite.titleName}</Text>
            <View style={styles.row}>
              <Button title="Accept" onPress={() => respond(invite.activityId, true)} />
              <Button title="Decline" secondary onPress={() => respond(invite.activityId, false)} />
            </View>
          </View>
        ))}
      </Section>
      <Section title="Watchlist">
        {(data?.watchList || []).length === 0 ? <Empty title="Nothing saved" /> : null}
        <View style={styles.grid}>
          {(data?.watchList || []).map((title) => (
            <Pressable key={`${title.mediaType}-${title.tmdbId}`} style={styles.cell} onPress={() => router.push(`/title/${title.mediaType}/${title.tmdbId}`)}>
              <Poster uri={title.posterUrl} style={styles.poster} />
              <Text style={styles.caption} numberOfLines={2}>{title.name}</Text>
            </Pressable>
          ))}
        </View>
      </Section>
      <Section title="History">
        {(data?.history || []).map((title) => (
          <Pressable key={`${title.mediaType}-${title.tmdbId}-${title.titleName}`} style={styles.history} onPress={() => router.push(`/title/${title.mediaType}/${title.tmdbId}`)}>
            <Poster uri={title.posterUrl} style={styles.small} />
            <View>
              <Text style={styles.name}>{title.titleName}</Text>
              {title.rating != null ? <Text style={styles.muted}>{title.rating}/10</Text> : null}
            </View>
          </Pressable>
        ))}
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 22 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 12, gap: 10 },
  row: { flexDirection: "row", gap: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: "33.33%", padding: 4 },
  poster: { width: "100%", aspectRatio: 2 / 3, borderRadius: 8 },
  caption: { color: colors.text, fontSize: 12, marginTop: 4 },
  history: { flexDirection: "row", gap: 10, alignItems: "center", marginBottom: 10 },
  small: { width: 42, height: 63, borderRadius: 6 },
  name: { color: colors.text, fontWeight: "700" },
  muted: { color: colors.muted },
});

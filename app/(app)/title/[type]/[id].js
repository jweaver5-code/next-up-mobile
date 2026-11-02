import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { api } from "../../../../src/api";
import { colors } from "../../../../src/theme";
import { Button, ErrorText, Field, Poster } from "../../../../src/ui";

export default function TitleScreen() {
  const { type, id } = useLocalSearchParams();
  const router = useRouter();
  const [title, setTitle] = useState(null);
  const [rating, setRating] = useState("");
  const [review, setReview] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api(`/api/titles/${type}/${id}`)
      .then((data) => {
        setTitle(data);
        setRating(data?.rating != null ? String(data.rating) : "");
        setReview(data?.review || "");
      })
      .catch((err) => setError(err.message));
  }, [type, id]);

  async function save(status) {
    setBusy(true);
    setError("");
    try {
      await api("/api/watch", {
        method: "POST",
        body: {
          tmdbId: Number(id),
          mediaType: type,
          status,
          rating: rating ? Number(rating) : null,
          review,
          streamingService: title?.streamingService || null,
        },
      });
      setTitle(await api(`/api/titles/${type}/${id}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function bookmark() {
    try {
      const data = await api("/api/bookmarks", {
        method: "POST",
        body: { tmdbId: Number(id), mediaType: type },
      });
      setTitle((current) => ({ ...current, bookmarked: data.bookmarked }));
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeLog() {
    try {
      await api(`/api/watch?tmdbId=${id}&mediaType=${type}`, { method: "DELETE" });
      setTitle(await api(`/api/titles/${type}/${id}`));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: title?.name || "Title" }} />
      <Poster uri={title?.posterUrl} style={styles.poster} />
      <Text style={styles.name}>{title?.name || "Loading…"}</Text>
      <Text style={styles.muted}>{[title?.year, type, ...(title?.genres || [])].filter(Boolean).join(" · ")}</Text>
      {title?.overview ? <Text style={styles.body}>{title.overview}</Text> : null}
      {(title?.streamingOn || []).length ? (
        <Text style={styles.muted}>Streaming on {title.streamingOn.join(", ")}</Text>
      ) : null}
      <ErrorText>{error}</ErrorText>
      <Field label="Rating (1-10)" value={rating} onChangeText={setRating} keyboardType="decimal-pad" />
      <Field label="Review" value={review} onChangeText={setReview} autoCapitalize="sentences" multiline />
      <Button title="Mark watched" onPress={() => save("Watched")} disabled={busy} />
      <Button title="Watching now" secondary onPress={() => save("Watching")} disabled={busy} />
      <Button title={title?.bookmarked ? "Remove from watchlist" : "Add to watchlist"} secondary onPress={bookmark} />
      {title?.currentStatus ? <Button title="Remove log" danger onPress={removeLog} /> : null}
      <Text style={styles.heading}>Similar</Text>
      <View style={styles.row}>
        {(title?.similar || []).slice(0, 8).map((item) => (
          <Pressable key={`${item.mediaType}-${item.tmdbId}`} onPress={() => router.push(`/title/${item.mediaType}/${item.tmdbId}`)}>
            <Poster uri={item.posterUrl} style={styles.small} />
          </Pressable>
        ))}
      </View>
      {(title?.friendLogs || []).map((log) => (
        <Text key={log.userId} style={styles.body}>{log.displayName}{log.rating != null ? ` · ${log.rating}` : ""}{log.review ? ` — ${log.review}` : ""}</Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 12 },
  poster: { width: 180, height: 270, borderRadius: 12, alignSelf: "center" },
  name: { color: colors.text, fontSize: 28, fontWeight: "700", textAlign: "center" },
  muted: { color: colors.muted, textAlign: "center" },
  body: { color: colors.text, lineHeight: 21 },
  heading: { color: colors.text, fontSize: 18, fontWeight: "700" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  small: { width: 72, height: 108, borderRadius: 8 },
});

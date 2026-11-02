import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { api, useSession } from "../../src/api";
import { colors } from "../../src/theme";
import { Button, ErrorText, Poster, Screen } from "../../src/ui";

const RATINGS = [2, 4, 6, 8, 10];

export default function OnboardScreen() {
  const router = useRouter();
  const { user, setUser } = useSession();
  const [state, setState] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState(null);

  const load = useCallback(async () => {
    setError("");
    try {
      setState(await api("/api/onboard"));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(action) {
    if (!state?.card) return;
    if (action === "seen" && rating == null) {
      setError("Pick a rating first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const next = await api("/api/onboard", {
        method: "POST",
        body: {
          tmdbId: state.card.tmdbId,
          mediaType: state.card.mediaType,
          action,
          rating: action === "seen" ? rating : null,
        },
      });
      setRating(null);
      setState(next);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    setBusy(true);
    setError("");
    try {
      await api("/api/onboard/complete", { method: "POST", body: {} });
      await setUser({ ...user, onboardingComplete: true });
      router.replace("/feed");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const card = state?.card;
  return (
    <Screen style={styles.wrap}>
      <Text style={styles.count}>
        {state ? `${state.actions} logged · ${state.minActions} to finish` : "Loading titles…"}
      </Text>
      <ErrorText>{error}</ErrorText>
      {card ? (
        <View style={styles.card}>
          <Poster uri={card.posterUrl} style={styles.poster} />
          <Text style={styles.name}>{card.name}</Text>
          <Text style={styles.meta}>{[card.year, card.mediaType].filter(Boolean).join(" · ")}</Text>
          {card.overview ? <Text style={styles.overview} numberOfLines={4}>{card.overview}</Text> : null}
          <View style={styles.ratings}>
            {RATINGS.map((value) => (
              <Button key={value} title={String(value)} secondary={rating !== value} onPress={() => setRating(value)} />
            ))}
          </View>
          <Button title="I've seen it" onPress={() => act("seen")} disabled={busy} />
          <Button title="Watchlist" secondary onPress={() => act("watchlist")} disabled={busy} />
          <Button title="Skip" secondary onPress={() => act("skip")} disabled={busy} />
        </View>
      ) : null}
      {state?.canFinish ? <Button title="Finish" onPress={finish} disabled={busy} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 12 },
  count: { color: colors.muted },
  card: { gap: 10 },
  poster: { width: 160, height: 240, borderRadius: 12, alignSelf: "center" },
  name: { color: colors.text, fontSize: 24, fontWeight: "700", textAlign: "center" },
  meta: { color: colors.muted, textAlign: "center" },
  overview: { color: colors.text, lineHeight: 20 },
  ratings: { flexDirection: "row", gap: 8, justifyContent: "space-between" },
});

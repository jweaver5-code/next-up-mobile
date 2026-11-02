import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { api } from "../../src/api";
import { colors } from "../../src/theme";
import { Button, ErrorText, Poster, Screen } from "../../src/ui";

export default function GroupScreen() {
  const { friendId, sessionId } = useLocalSearchParams();
  const [state, setState] = useState(null);
  const [pending, setPending] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function openSession(id) {
    setState(await api(`/api/group-watch/${id}`));
  }

  useEffect(() => {
    (async () => {
      try {
        if (sessionId) {
          await openSession(sessionId);
        } else if (friendId) {
          const created = await api("/api/group-watch", { method: "POST", body: { userIds: [friendId] } });
          setState(created);
        } else {
          setPending(await api("/api/group-watch/pending"));
        }
      } catch (err) {
        setError(err.message);
      }
    })();
  }, [friendId, sessionId]);

  async function ready() {
    setBusy(true);
    try {
      setState(await api(`/api/group-watch/${state.sessionId}/ready`, { method: "POST", body: {} }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function act(action) {
    if (!state?.card) return;
    setBusy(true);
    try {
      setState(await api(`/api/group-watch/${state.sessionId}/act`, {
        method: "POST",
        body: { tmdbId: state.card.tmdbId, mediaType: state.card.mediaType, action },
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const card = state?.card;
  const match = state?.match;
  return (
    <Screen style={styles.wrap}>
      <ErrorText>{error}</ErrorText>
      {!state && pending.map((row) => (
        <Button key={row.sessionId} title={`${row.hostName} invited you`} secondary onPress={() => openSession(row.sessionId).catch((err) => setError(err.message))} />
      ))}
      {!state && pending.length === 0 ? <Text style={styles.muted}>Pick a friend from the Friends tab to start.</Text> : null}
      {state && !state.meReady ? <Button title="I'm ready" onPress={ready} disabled={busy} /> : null}
      {match ? (
        <View style={styles.card}>
          <Text style={styles.match}>You both liked</Text>
          <Poster uri={match.posterUrl} style={styles.poster} />
          <Text style={styles.name}>{match.name}</Text>
        </View>
      ) : null}
      {card ? (
        <View style={styles.card}>
          <Poster uri={card.posterUrl} style={styles.poster} />
          <Text style={styles.name}>{card.name}</Text>
          <Text style={styles.muted}>{card.year} · {card.source}</Text>
          <View style={styles.row}>
            <Button title="Like" onPress={() => act("like")} disabled={busy} />
            <Button title="Nope" secondary onPress={() => act("nope")} disabled={busy} />
          </View>
        </View>
      ) : null}
      {state ? <Text style={styles.muted}>{state.likes} likes · {state.nopes} nopes · goal {state.matchGoal}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 12 },
  card: { gap: 10, alignItems: "center" },
  poster: { width: 160, height: 240, borderRadius: 12 },
  name: { color: colors.text, fontSize: 22, fontWeight: "700", textAlign: "center" },
  match: { color: colors.accent, fontWeight: "700" },
  muted: { color: colors.muted, textAlign: "center" },
  row: { flexDirection: "row", gap: 10 },
});

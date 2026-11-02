import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { api } from "../../../src/api";
import { colors } from "../../../src/theme";
import { Button, ErrorText, Field, Poster } from "../../../src/ui";

export default function FriendsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async (q = query) => {
    try {
      const path = q.trim() ? `/api/people?q=${encodeURIComponent(q.trim())}` : "/api/people";
      setPage(await api(path));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, [query]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function run(method, path) {
    try {
      await api(path, { method, body: method === "GET" ? undefined : {} });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Field value={query} onChangeText={setQuery} placeholder="Find people" onSubmitEditing={() => load(query)} autoCapitalize="none" />
      <ErrorText>{error}</ErrorText>
      <Group title={`Requests (${page?.incomingRequestCount || 0})`} people={page?.incomingRequests} router={router} run={run} incoming />
      <Group title="Friends" people={page?.friends} router={router} run={run} />
      <Group title="Suggested" people={page?.suggested} router={router} run={run} />
      <Group title="Results" people={page?.searchResults} router={router} run={run} />
    </ScrollView>
  );
}

function Group({ title, people, router, run, incoming }) {
  if (!people?.length) return null;
  return (
    <View style={styles.group}>
      <Text style={styles.heading}>{title}</Text>
      {people.map((person) => (
        <View key={person.userId} style={styles.row}>
          <Pressable style={styles.person} onPress={() => router.push(`/person/${person.userId}`)}>
            <Poster uri={person.avatarUrl} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{person.displayName}</Text>
              {person.reason ? <Text style={styles.muted}>{person.reason}</Text> : null}
            </View>
          </Pressable>
          <Actions person={person} incoming={incoming} run={run} router={router} />
        </View>
      ))}
    </View>
  );
}

function Actions({ person, incoming, run, router }) {
  const id = person.userId;
  if (incoming || person.relation === "Incoming") {
    return (
      <View style={styles.actions}>
        <Button title="Accept" onPress={() => run("POST", `/api/people/${id}/accept`)} />
        <Button title="Decline" secondary onPress={() => run("POST", `/api/people/${id}/decline`)} />
      </View>
    );
  }
  if (person.relation === "Friends") {
    return <Button title="Watch" secondary onPress={() => router.push(`/group?friendId=${id}`)} />;
  }
  if (person.relation === "Outgoing") {
    return <Button title="Cancel" secondary onPress={() => run("DELETE", `/api/people/${id}/request`)} />;
  }
  return <Button title="Add" onPress={() => run("POST", `/api/people/${id}/request`)} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 16 },
  group: { gap: 10 },
  heading: { color: colors.text, fontSize: 20, fontWeight: "700" },
  row: { gap: 8 },
  person: { flexDirection: "row", gap: 10, alignItems: "center" },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  name: { color: colors.text, fontWeight: "700" },
  muted: { color: colors.muted },
  actions: { flexDirection: "row", gap: 8 },
});

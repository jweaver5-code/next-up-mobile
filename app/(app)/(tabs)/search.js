import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { api } from "../../../src/api";
import { colors } from "../../../src/theme";
import { Empty, ErrorText, Field, Poster } from "../../../src/ui";

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [people, setPeople] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const handle = setTimeout(async () => {
      setError("");
      try {
        const path = query.trim().length >= 2 ? `/api/search?q=${encodeURIComponent(query.trim())}` : "/api/search/popular";
        const data = await api(path);
        setResults(data?.results || []);
        setPeople(data?.people || []);
      } catch (err) {
        setError(err.message);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  const rows = [
    ...people.map((person) => ({ kind: "person", ...person })),
    ...results.map((title) => ({ kind: "title", ...title })),
  ];

  return (
    <View style={styles.screen}>
      <View style={styles.pad}>
        <Field value={query} onChangeText={setQuery} placeholder="Movies, shows, people" autoCapitalize="words" />
        <ErrorText>{error}</ErrorText>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(item, index) => `${item.kind}-${item.tmdbId}-${index}`}
        numColumns={3}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Empty title="No matches" body="Try another title." />}
        renderItem={({ item }) =>
          item.kind === "person" ? (
            <View style={styles.cell}>
              <Poster uri={item.photoUrl} style={styles.poster} />
              <Text style={styles.caption} numberOfLines={2}>{item.name}</Text>
            </View>
          ) : (
            <Pressable style={styles.cell} onPress={() => router.push(`/title/${item.mediaType}/${item.tmdbId}`)}>
              <Poster uri={item.posterUrl} style={styles.poster} />
              <Text style={styles.caption} numberOfLines={2}>{item.name}</Text>
            </Pressable>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: 12, gap: 8 },
  list: { padding: 8 },
  cell: { width: "33.33%", padding: 6 },
  poster: { width: "100%", aspectRatio: 2 / 3, borderRadius: 8 },
  caption: { color: colors.text, marginTop: 6, fontSize: 12 },
});

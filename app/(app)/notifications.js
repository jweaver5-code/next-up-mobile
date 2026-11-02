import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { api } from "../../src/api";
import { colors, timeAgo } from "../../src/theme";
import { Empty, ErrorText, Poster } from "../../src/ui";

export default function NotificationsScreen() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/feed/notifications")
      .then((data) => setItems(data || []))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <View style={styles.screen}>
      <ErrorText>{error}</ErrorText>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Empty title="You're caught up" />}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => item.tmdbId && router.push(`/title/${item.mediaType}/${item.tmdbId}`)}>
            <Poster uri={item.actorAvatarUrl || item.posterUrl} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.text}>{item.actorDisplayName} {item.kind} {item.titleName}</Text>
              {item.body ? <Text style={styles.muted}>{item.body}</Text> : null}
              <Text style={styles.muted}>{timeAgo(item.createdAt)}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 16, gap: 12 },
  row: { flexDirection: "row", gap: 10, marginBottom: 14 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  text: { color: colors.text },
  muted: { color: colors.muted, marginTop: 2 },
});

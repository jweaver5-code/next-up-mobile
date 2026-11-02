import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { api } from "../../../src/api";
import { activityText, colors, timeAgo } from "../../../src/theme";
import { Button, Empty, ErrorText, Poster } from "../../../src/ui";

const EMOJIS = ["❤️", "😂", "🔥", "👏"];

export default function FeedScreen() {
  const router = useRouter();
  const [tab, setTab] = useState("friends");
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [commentsFor, setCommentsFor] = useState(null);
  const [draft, setDraft] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await api(`/api/feed?tab=${tab}`);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  async function react(item, emoji) {
    if (!item.activityId) return;
    try {
      await api(`/api/feed/${item.activityId}/react`, { method: "POST", body: { emoji } });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function sendComment() {
    if (!commentsFor || !draft.trim()) return;
    try {
      await api(`/api/feed/${commentsFor.activityId}/comments`, {
        method: "POST",
        body: { body: draft.trim() },
      });
      setDraft("");
      setCommentsFor(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function less(item) {
    try {
      if (item.suggestKind) {
        await api("/api/feed/suggest-less", {
          method: "POST",
          body: {
            kind: item.suggestKind,
            key: item.suggestKey,
            tmdbId: item.tmdbId,
            mediaType: item.mediaType,
          },
        });
      } else if (item.userId) {
        await api(`/api/people/${item.userId}/mute`, { method: "POST", body: {} });
      }
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const onViewable = useRef(({ viewableItems }) => {
    const ids = viewableItems.map((row) => row.item.activityId).filter((id) => id > 0);
    if (ids.length) api("/api/feed/seen", { method: "POST", body: { activityIds: ids } }).catch(() => {});
  }).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  return (
    <View style={styles.screen}>
      <View style={styles.tabs}>
        {["friends", "suggested"].map((name) => (
          <Pressable key={name} onPress={() => setTab(name)} style={[styles.tab, tab === name && styles.tabOn]}>
            <Text style={[styles.tabText, tab === name && styles.tabTextOn]}>{name === "friends" ? "Friends" : "Suggested"}</Text>
          </Pressable>
        ))}
      </View>
      <ErrorText>{error}</ErrorText>
      <FlatList
        data={items}
        keyExtractor={(item, index) => String(item.activityId || `${item.tmdbId}-${index}`)}
        refreshing={loading}
        onRefresh={load}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={viewabilityConfig}
        contentContainerStyle={styles.list}
        ListEmptyComponent={loading ? null : <Empty title="Nothing here yet" body="Follow friends or check Suggested." />}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => item.tmdbId && router.push(`/title/${item.mediaType}/${item.tmdbId}`)}
          >
            <View style={styles.row}>
              <Poster uri={item.avatarUrl} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.displayName}</Text>
                <Text style={styles.meta}>{activityText(item)} · {timeAgo(item.createdAt)}</Text>
              </View>
            </View>
            <View style={styles.row}>
              <Poster uri={item.posterUrl} style={styles.poster} />
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={styles.title}>{item.titleName}</Text>
                {item.review ? <Text style={styles.review} numberOfLines={3}>{item.review}</Text> : null}
                {item.overview && !item.review ? <Text style={styles.review} numberOfLines={3}>{item.overview}</Text> : null}
              </View>
            </View>
            <View style={styles.row}>
              {EMOJIS.map((emoji) => (
                <Pressable key={emoji} onPress={() => react(item, emoji)} style={styles.emoji}>
                  <Text>{emoji}</Text>
                </Pressable>
              ))}
              {item.activityId ? (
                <Pressable onPress={() => setCommentsFor(item)}>
                  <Text style={styles.link}>Comments {item.comments?.length ? `(${item.comments.length})` : ""}</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={() => less(item)}>
                <Text style={styles.link}>Less</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
      />
      <Modal visible={!!commentsFor} animationType="slide" transparent>
        <View style={styles.modal}>
          <Text style={styles.title}>{commentsFor?.titleName}</Text>
          {(commentsFor?.comments || []).map((comment) => (
            <Text key={comment.id} style={styles.review}>
              {comment.displayName}: {comment.body}
            </Text>
          ))}
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Write a comment"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
          <Button title="Post" onPress={sendComment} />
          <Button title="Close" secondary onPress={() => setCommentsFor(null)} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  tabs: { flexDirection: "row", gap: 8, padding: 12 },
  tab: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: colors.line },
  tabOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  tabText: { color: colors.muted, fontWeight: "700" },
  tabTextOn: { color: "#fff" },
  list: { padding: 12, gap: 12 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 12, gap: 10, marginBottom: 12 },
  row: { flexDirection: "row", gap: 10, alignItems: "center" },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  poster: { width: 72, height: 108, borderRadius: 8 },
  name: { color: colors.text, fontWeight: "700" },
  title: { color: colors.text, fontSize: 16, fontWeight: "700" },
  meta: { color: colors.muted, fontSize: 13 },
  review: { color: colors.text, lineHeight: 18 },
  emoji: { padding: 6, backgroundColor: colors.bg, borderRadius: 999 },
  link: { color: colors.accent, fontWeight: "700" },
  modal: { marginTop: "auto", backgroundColor: colors.card, padding: 16, gap: 10, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: "80%" },
  input: { backgroundColor: colors.bg, color: colors.text, borderRadius: 12, padding: 12 },
});

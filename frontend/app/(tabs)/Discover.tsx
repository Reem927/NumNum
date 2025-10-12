import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRestaurants } from '@/hooks/useRestaurants';
import { ActivityIndicator, FlatList, Image, StyleSheet, View } from 'react-native';

export default function DiscoverScreen() {
  const { data, loading, err } = useRestaurants(25);

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator />
        <ThemedText>Loading restaurants…</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {err ? <ThemedText style={styles.err}>({err}) showing mock data</ThemedText> : null}
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {!!item.photo_url ? (
              <Image source={{ uri: item.photo_url }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, styles.photoPlaceholder]} />
            )}
            <ThemedText type="title">{item.name}</ThemedText>
            <ThemedText>{item.city ?? '—'}</ThemedText>
            <ThemedText>⭐ {item.rating ?? '—'} · ${'💲'.repeat(item.price_level ?? 1)}</ThemedText>
            {item.tags?.length ? (
              <View style={styles.tagContainer}>
                {item.tags.map((tag) => (
                  <View key={tag.id} style={styles.tag}>
                    <ThemedText style={styles.tagText}>{tag.name}</ThemedText>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  err: { margin: 12 },
  card: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ececec',
    gap: 6,
  },
  photo: { width: '100%', height: 160, borderRadius: 8 },
  photoPlaceholder: { backgroundColor: '#f0f0f0' },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  tag: {
    backgroundColor: '#f2f2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#333',
  },
});
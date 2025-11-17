import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StyleSheet } from 'react-native';

export default function DiscoverScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Create</ThemedText>
      <ThemedText>Welcome to the Create tab!</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
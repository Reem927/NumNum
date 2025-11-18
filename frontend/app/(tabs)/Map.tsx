import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StyleSheet } from 'react-native';

export default function MapScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Map</ThemedText>
      <ThemedText>Welcome to the Map tab!</ThemedText>
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
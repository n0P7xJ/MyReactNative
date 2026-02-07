import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Сторінку не знайдено' }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title">Сторінку не знайдено</ThemedText>
        <ThemedText style={styles.description}>
          На жаль, запитана сторінка не існує.
        </ThemedText>
        <Link href="/" style={styles.link}>
          <ThemedText type="link">Перейти на головну сторінку</ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  description: {
    marginTop: 10,
    textAlign: 'center',
  },
  link: {
    marginTop: 20,
    paddingVertical: 15,
  },
});

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  FlatList,
  Modal,
  SafeAreaView,
  ListRenderItem,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Quote } from './types';
import rawQuotesData from './assets/quotes.json';

// Cast the JSON import to typed array
const quotesData: Quote[] = rawQuotesData as Quote[];

const FAVORITES_KEY = '@favorite_quote_ids';

export default function App(): React.JSX.Element {
  const [currentQuote, setCurrentQuote] = useState<Quote>(quotesData[0]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesModal, setShowFavoritesModal] = useState<boolean>(false);

  // Fade animation reference
  const fadeAnim = useRef<Animated.Value>(new Animated.Value(1)).current;

  // Load saved favorite IDs on launch
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async (): Promise<void> => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored !== null) {
        const parsedIds: string[] = JSON.parse(stored);
        setFavorites(parsedIds);
      }
    } catch (e) {
      console.error('Failed to load favorites', e);
    }
  };

  // Toggle favorite status and save to AsyncStorage
  const toggleFavorite = async (id: string): Promise<void> => {
    try {
      let updated: string[];
      if (favorites.includes(id)) {
        updated = favorites.filter((favId) => favId !== id);
      } else {
        updated = [...favorites, id];
      }
      setFavorites(updated);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save favorite', e);
    }
  };

  // Randomize quote selection with fade out/in animation
  const getRandomQuote = (): void => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      let randomIndex: number;
      do {
        randomIndex = Math.floor(Math.random() * quotesData.length);
      } while (
        quotesData.length > 1 &&
        quotesData[randomIndex].id === currentQuote.id
      );

      setCurrentQuote(quotesData[randomIndex]);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };

  const isCurrentFavorite = favorites.includes(currentQuote.id);
  const favoritedQuotesList = quotesData.filter((item) =>
    favorites.includes(item.id)
  );

  // Render method for modal FlatList
  const renderFavItem: ListRenderItem<Quote> = ({ item }) => (
    <View style={styles.favItemCard}>
      <Text style={styles.favQuoteText}>"{item.quote}"</Text>
      <Text style={styles.favAuthorText}>
        — {item.author ? item.author : 'Unknown'}
      </Text>
      <TouchableOpacity
        onPress={() => toggleFavorite(item.id)}
        style={styles.removeButton}
      >
        <Text style={styles.removeText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daily Quotes</Text>
        <TouchableOpacity
          onPress={() => setShowFavoritesModal(true)}
          style={styles.favBadgeButton}
        >
          <Text style={styles.favBadgeText}>
            Favorites ({favorites.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Quote Card */}
      <View style={styles.cardContainer}>
        <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
          <View style={styles.genreBadge}>
            <Text style={styles.genreText}>
              {currentQuote.genre || 'General'}
            </Text>
          </View>

          <Text style={styles.quoteText}>"{currentQuote.quote}"</Text>

          {/* Graceful Author Fallback */}
          <Text style={styles.authorText}>
            — {currentQuote.author ? currentQuote.author : 'Unknown'}
          </Text>

          <TouchableOpacity
            onPress={() => toggleFavorite(currentQuote.id)}
            style={styles.favoriteButton}
          >
            <Text style={styles.favoriteButtonText}>
              {isCurrentFavorite ? '❤️ Favorited' : '🤍 Add to Favorites'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Action Button */}
      <TouchableOpacity style={styles.newQuoteButton} onPress={getRandomQuote}>
        <Text style={styles.newQuoteButtonText}>New Quote</Text>
      </TouchableOpacity>

      {/* Favorites Modal */}
      <Modal visible={showFavoritesModal} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Saved Favorites</Text>
            <TouchableOpacity onPress={() => setShowFavoritesModal(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>

          {favoritedQuotesList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No favorited quotes yet.</Text>
            </View>
          ) : (
            <FlatList
              data={favoritedQuotesList}
              keyExtractor={(item) => item.id}
              renderItem={renderFavItem}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F4F9', padding: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 10,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  favBadgeButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  favBadgeText: { color: '#FFF', fontWeight: '600', fontSize: 13 },
  cardContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  genreBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EAE8FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  genreText: { color: '#6C63FF', fontSize: 12, fontWeight: 'bold' },
  quoteText: {
    fontSize: 20,
    color: '#2D3748',
    lineHeight: 28,
    fontStyle: 'italic',
  },
  authorText: {
    fontSize: 16,
    color: '#718096',
    marginTop: 16,
    textAlign: 'right',
    fontWeight: '500',
  },
  favoriteButton: { marginTop: 24, alignItems: 'center' },
  favoriteButtonText: { fontSize: 15, color: '#E53E3E', fontWeight: '600' },
  newQuoteButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    marginHorizontal: 10,
  },
  newQuoteButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  modalContainer: { flex: 1, backgroundColor: '#F4F4F9', padding: 20 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  closeText: { fontSize: 16, color: '#6C63FF', fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#A0AEC0', fontSize: 16 },
  favItemCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  favQuoteText: { fontSize: 15, color: '#2D3748', fontStyle: 'italic' },
  favAuthorText: {
    fontSize: 13,
    color: '#718096',
    marginTop: 8,
    textAlign: 'right',
  },
  removeButton: { marginTop: 8, alignSelf: 'flex-start' },
  removeText: { color: '#E53E3E', fontSize: 13, fontWeight: '600' },
});
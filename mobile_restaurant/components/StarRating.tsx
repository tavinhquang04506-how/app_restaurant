import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StarRatingProps {
  rating: number;
  size?: number;
  color?: string;
}

export function StarRating({ rating, size = 16, color = '#FFD700' }: StarRatingProps) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      stars.push(<Ionicons key={i} name="star" size={size} color={color} />);
    } else if (rating >= i - 0.5) {
      stars.push(<Ionicons key={i} name="star-half" size={size} color={color} />);
    } else {
      stars.push(<Ionicons key={i} name="star-outline" size={size} color={color} />);
    }
  }
  return <View style={styles.row}>{stars}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
});

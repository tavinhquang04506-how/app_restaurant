import React from 'react';
import { View, Image, StyleSheet, type ViewStyle, type ImageStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../styles/AppColors';

interface FoodImageProps {
  uri?: string;
  size?: number;
  style?: ImageStyle | ViewStyle;
}

export function FoodImage({ uri, size = 100, style }: FoodImageProps) {
  if (!uri) {
    return (
      <View style={[styles.placeholder, { width: size, height: size, borderRadius: size * 0.15 }, style]}>
        <Ionicons name="restaurant-outline" size={size * 0.4} color={AppColors.textHint} />
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={[{ width: size, height: size, borderRadius: size * 0.15 }, style as ImageStyle]}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: AppColors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppColors.border,
  },
});

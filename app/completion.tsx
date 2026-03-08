import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check } from 'phosphor-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useResult } from '@/hooks/useResult';

export default function CompletionScreen() {
  const { colors } = useTheme();
  const { topic, mode, recordingId } = useLocalSearchParams<{
    topic: string;
    mode: string;
    recordingId?: string;
  }>();

  // prefetch/warm the result cache so it loads faster when the user taps View Feedback
  useResult(recordingId);

  const iconOpacity = useSharedValue(0);
  const iconScale = useSharedValue(0.6);
  const textOpacity = useSharedValue(0);
  const btnOpacity = useSharedValue(0);

  useEffect(() => {
    iconOpacity.value = withDelay(100, withTiming(1, { duration: 300 }));
    iconScale.value = withDelay(100, withTiming(1, { duration: 300 }));
    textOpacity.value = withDelay(350, withTiming(1, { duration: 300 }));
    btnOpacity.value = withDelay(550, withTiming(1, { duration: 300 }));
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const btnStyle = useAnimatedStyle(() => ({
    opacity: btnOpacity.value,
  }));

  const handleViewFeedback = () => {
    router.replace({
      pathname: '/(tabs)/results',
      params: { topic, mode, recordingId },
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.inner}>
        <Animated.View
          style={[
            styles.iconCircle,
            { backgroundColor: colors.successSurface },
            iconStyle,
          ]}
        >
          <Check size={32} color={colors.success} weight="bold" />
        </Animated.View>

        <Animated.View style={[styles.textBlock, textStyle]}>
          <Text
            style={[
              styles.heading,
              { color: colors.text, fontFamily: FontFamily.sansSemiBold },
            ]}
          >
            All done.
          </Text>
          <Text
            style={[
              styles.subtext,
              { color: colors.textSecondary, fontFamily: FontFamily.sans },
            ]}
          >
            Your session is being analyzed.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.btnWrapper, btnStyle]}>
          <Pressable
            onPress={handleViewFeedback}
            style={[styles.ctaButton, { backgroundColor: colors.accent }]}
          >
            <Text
              style={[
                styles.ctaText,
                { color: '#F4F1EC', fontFamily: FontFamily.sansMedium },
              ]}
            >
              View Feedback
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  heading: {
    fontSize: 28,
  },
  subtext: {
    fontSize: 15,
    textAlign: 'center',
  },
  btnWrapper: {
    width: '100%',
  },
  ctaButton: {
    borderRadius: Radius.md,
    paddingVertical: 18,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 15,
  },
});

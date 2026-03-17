import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useResult } from '@/hooks/useResult';

// ─── Brain SVG icon ─────────────────────────────────────────────────────────
function BrainIcon({ color }: { color: string }) {
  return (
    <Svg width={52} height={52} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Bouncing dot ────────────────────────────────────────────────────────────
function BounceDot({ color, delay }: { color: string; delay: number }) {
  const y = useSharedValue(0);
  const op = useSharedValue(0.5);

  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: 300 }),
          withTiming(0, { duration: 300 })
        ),
        -1,
        false
      )
    );
    op.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0.5, { duration: 300 })
        ),
        -1,
        false
      )
    );
  }, []);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
    opacity: op.value,
  }));

  return <Animated.View style={[styles.dot, { backgroundColor: color }, dotStyle]} />;
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function CompletionScreen() {
  const { colors } = useTheme();
  const { topic, mode, recordingId } = useLocalSearchParams<{
    topic: string;
    mode: string;
    recordingId?: string;
  }>();

  // prefetch/warm the result cache so results load faster when user taps View Feedback
  useResult(recordingId);

  const [analyzing, setAnalyzing] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setAnalyzing(false), 2600);
    return () => clearTimeout(t);
  }, []);

  // analyzing phase fade-out
  const analyzeOpacity = useSharedValue(1);
  const analyzeStyle = useAnimatedStyle(() => ({ opacity: analyzeOpacity.value }));

  // done phase animations
  const headingOpacity = useSharedValue(0);
  const headingY = useSharedValue(28);
  const dividerOpacity = useSharedValue(0);
  const subtextOpacity = useSharedValue(0);
  const subtextY = useSharedValue(10);
  const btnOpacity = useSharedValue(0);
  const btnY = useSharedValue(10);

  useEffect(() => {
    if (!analyzing) {
      analyzeOpacity.value = withTiming(0, { duration: 200 });
      headingOpacity.value = withDelay(50, withTiming(1, { duration: 500 }));
      headingY.value = withDelay(50, withTiming(0, { duration: 500 }));
      dividerOpacity.value = withDelay(150, withTiming(1, { duration: 300 }));
      subtextOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
      subtextY.value = withDelay(200, withTiming(0, { duration: 300 }));
      btnOpacity.value = withDelay(250, withTiming(1, { duration: 300 }));
      btnY.value = withDelay(250, withTiming(0, { duration: 300 }));
    }
  }, [analyzing]);

  const headingStyle = useAnimatedStyle(() => ({
    opacity: headingOpacity.value,
    transform: [{ translateY: headingY.value }],
  }));

  const dividerStyle = useAnimatedStyle(() => ({ opacity: dividerOpacity.value }));

  const subtextStyle = useAnimatedStyle(() => ({
    opacity: subtextOpacity.value,
    transform: [{ translateY: subtextY.value }],
  }));

  const btnStyle = useAnimatedStyle(() => ({
    opacity: btnOpacity.value,
    transform: [{ translateY: btnY.value }],
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
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text
          style={[
            styles.wordmark,
            { color: colors.text, fontFamily: FontFamily.sansSemiBold },
          ]}
        >
          Coherence
        </Text>
        <View style={styles.topBarRight} />
      </View>

      {/* Analyzing phase */}
      {analyzing && (
        <Animated.View style={[styles.analyzeContainer, analyzeStyle]}>
          <BrainIcon color={colors.accent} />
          <Text
            style={[
              styles.analyzingLabel,
              { color: colors.textSecondary, fontFamily: FontFamily.sansMedium },
            ]}
          >
            Analyzing session
          </Text>
          <View style={styles.dotsRow}>
            <BounceDot color={colors.accent} delay={0} />
            <BounceDot color={colors.accent} delay={180} />
            <BounceDot color={colors.accent} delay={360} />
          </View>
        </Animated.View>
      )}

      {/* Done phase */}
      {!analyzing && (
        <View style={styles.doneContainer}>
          <Animated.Text
            style={[
              styles.doneHeading,
              { color: colors.text, fontFamily: FontFamily.serif },
              headingStyle,
            ]}
          >
            All done.
          </Animated.Text>

          <Animated.View
            style={[
              styles.divider,
              { backgroundColor: colors.accent },
              dividerStyle,
            ]}
          />

          <Animated.Text
            style={[
              styles.doneSubtext,
              { color: colors.textSecondary, fontFamily: FontFamily.sans },
              subtextStyle,
            ]}
          >
            Your session is being analyzed. Results will be ready shortly.
          </Animated.Text>

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
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    flexShrink: 0,
  },
  wordmark: {
    fontSize: 16,
    letterSpacing: -0.15,
  },
  topBarRight: {
    width: 24,
  },
  analyzeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingBottom: 80,
  },
  analyzingLabel: {
    fontSize: 13,
    letterSpacing: 0.6,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  doneContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: 80,
  },
  doneHeading: {
    fontSize: 56,
    lineHeight: 56,
    marginBottom: 6,
  },
  divider: {
    width: 32,
    height: 2,
    borderRadius: 1,
    marginBottom: 24,
  },
  doneSubtext: {
    fontSize: 15,
    lineHeight: 25,
    maxWidth: 260,
    marginBottom: 48,
  },
  btnWrapper: {
    width: '100%',
  },
  ctaButton: {
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 15,
  },
});

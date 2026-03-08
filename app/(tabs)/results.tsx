import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useResult } from '@/hooks/useResult';
import type { ResultFeedback } from '@/types';

const FALLBACK_FEEDBACK: ResultFeedback = {
  fillerWords: { count: 2, examples: ['um', 'like'] },
  pace: { wpm: 128, rating: 'good' },
  clarity: { score: 74 },
  improvements: [
    'Take 10 to 15 seconds to outline your main points before speaking to avoid going blank mid-sentence.',
    'Practice utilizing silent pauses instead of verbalizing frustrations when you lose your train of thought, as this helps maintain a more professional flow.',
  ],
  summary:
    'The speaker attempts to define the topic but quickly encounters a mental block, leading to a loss of coherence. While the delivery is natural and thoughtful, the message lacks clarity because the primary thought is never completed.',
};

function MetricCard({
  label,
  value,
  detail,
  delay,
}: {
  label: string;
  value: string | number;
  detail: string;
  delay: number;
}) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 250 }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 250 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.metricCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.divider,
        },
        animStyle,
      ]}
    >
      <Text
        style={[
          styles.metricLabel,
          { color: colors.textSecondary, fontFamily: FontFamily.sansSemiBold },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.metricValue,
          { color: colors.text, fontFamily: FontFamily.sansSemiBold },
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          styles.metricDetail,
          { color: colors.textSecondary, fontFamily: FontFamily.sans },
        ]}
      >
        {detail}
      </Text>
    </Animated.View>
  );
}

export default function ResultsScreen() {
  const { colors } = useTheme();
  const { topic, recordingId } = useLocalSearchParams<{ topic: string; recordingId?: string }>();
  const displayTopic = topic || 'Wisdom';

  const resultQuery = useResult(recordingId);
  const isLoading = !!recordingId && resultQuery.isLoading;
  const feedback = resultQuery.data?.feedback ?? (recordingId ? null : FALLBACK_FEEDBACK);

  const paceRatingLabel =
    feedback?.pace.rating === 'slow'
      ? 'Too slow'
      : feedback?.pace.rating === 'fast'
        ? 'Too fast'
        : 'Good pace';

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <View style={[styles.header]}>
          <Text
            style={[
              styles.headerTitle,
              { color: colors.text, fontFamily: FontFamily.sansSemiBold },
            ]}
          >
            Today's Feedback
          </Text>
          <Text
            style={[
              styles.headerSub,
              { color: colors.textSecondary, fontFamily: FontFamily.sans },
            ]}
          >
            Topic: "{displayTopic}"
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text
            style={[
              styles.loadingText,
              { color: colors.textSecondary, fontFamily: FontFamily.sans },
            ]}
          >
            Analyzing your session...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header]}>
        <Text
          style={[
            styles.headerTitle,
            { color: colors.text, fontFamily: FontFamily.sansSemiBold },
          ]}
        >
          Today's Feedback
        </Text>
        <Text
          style={[
            styles.headerSub,
            { color: colors.textSecondary, fontFamily: FontFamily.sans },
          ]}
        >
          Topic: "{displayTopic}"
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Metric grid */}
        <View style={styles.metricGrid}>
          <MetricCard
            label="FILLER WORDS"
            value={feedback?.fillerWords.count ?? 0}
            detail={feedback?.fillerWords.examples.join(', ') ?? ''}
            delay={0}
          />
          <MetricCard
            label="PACE"
            value={feedback ? `${feedback.pace.wpm} wpm` : '—'}
            detail={paceRatingLabel}
            delay={60}
          />
        </View>

        {/* Feedback block */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionLabel,
              { color: colors.textSecondary, fontFamily: FontFamily.sansSemiBold },
            ]}
          >
            FEEDBACK
          </Text>
          <Text
            style={[
              styles.feedbackText,
              { color: colors.text, fontFamily: FontFamily.sans },
            ]}
          >
            {feedback?.summary ?? ''}
          </Text>
        </View>

        {/* To Improve block */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionLabel,
              { color: colors.textSecondary, fontFamily: FontFamily.sansSemiBold },
            ]}
          >
            TO IMPROVE
          </Text>
          <View style={styles.improvementList}>
            {(feedback?.improvements ?? []).map((item, i) => (
              <View key={i} style={styles.improvementItem}>
                <View
                  style={[styles.improvementBorder, { backgroundColor: colors.accent }]}
                />
                <Text
                  style={[
                    styles.improvementText,
                    { color: colors.text, fontFamily: FontFamily.sans },
                  ]}
                >
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: 22,
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 15,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  loadingText: {
    fontSize: 15,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 48,
    gap: Spacing.xl,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metricCard: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 20,
    gap: 6,
  },
  metricLabel: {
    fontSize: 11,
    letterSpacing: 1.0,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 32,
    lineHeight: 36,
  },
  metricDetail: {
    fontSize: 13,
  },
  section: {
    gap: Spacing.md,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1.0,
    textTransform: 'uppercase',
  },
  feedbackText: {
    fontSize: 15,
    lineHeight: 24,
  },
  improvementList: {
    gap: Spacing.md,
  },
  improvementItem: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  improvementBorder: {
    width: 2,
    borderRadius: 1,
    minHeight: '100%',
  },
  improvementText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
  },
});

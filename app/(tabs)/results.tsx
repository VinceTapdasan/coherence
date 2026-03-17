import { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { FontFamily, Spacing } from '@/constants/theme';
import { useResult } from '@/hooks/useResult';
import type { ResultFeedback } from '@/types';

const FALLBACK_FEEDBACK: ResultFeedback = {
  fillerWords: { count: 2, examples: ['um', 'like'] },
  pace: { wpm: 128, rating: 'good' },
  clarity: { score: 72 },
  improvements: [
    'Take 10 to 15 seconds to outline your main points before speaking to avoid going blank mid-sentence.',
    'Practice utilizing silent pauses instead of verbalizing frustrations when you lose your train of thought, as this helps maintain a more professional flow.',
  ],
  summary:
    'The speaker attempts to define the topic but quickly encounters a mental block, leading to a loss of coherence. While the delivery is natural and humorous, the message lacks clarity because the primary thought is never completed.',
};

// ─── Loading screen ──────────────────────────────────────────────────────────
function LoadingScreen({ displayTopic }: { displayTopic: string }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
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

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function ResultsScreen() {
  const { colors } = useTheme();
  const { topic, recordingId } = useLocalSearchParams<{ topic: string; recordingId?: string }>();
  const displayTopic = topic || 'Wisdom';

  const resultQuery = useResult(recordingId);
  const isLoading = !!recordingId && resultQuery.isLoading;
  const feedback = resultQuery.data?.feedback ?? (recordingId ? null : FALLBACK_FEEDBACK);

  // Scroll content fade-in animation
  const contentOpacity = useSharedValue(0);
  const contentY = useSharedValue(20);

  useEffect(() => {
    contentOpacity.value = withDelay(80, withTiming(1, { duration: 350 }));
    contentY.value = withDelay(80, withTiming(0, { duration: 350 }));
  }, []);

  const scoreOpacity = useSharedValue(0);
  const scoreY = useSharedValue(28);

  useEffect(() => {
    scoreOpacity.value = withTiming(1, { duration: 550 });
    scoreY.value = withTiming(0, { duration: 550 });
  }, []);

  const scoreStyle = useAnimatedStyle(() => ({
    opacity: scoreOpacity.value,
    transform: [{ translateY: scoreY.value }],
  }));

  const fadeUpStyle1 = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentY.value }],
  }));

  if (isLoading) {
    return <LoadingScreen displayTopic={displayTopic} />;
  }

  const paceLabel =
    feedback?.pace.rating === 'slow'
      ? 'Too slow'
      : feedback?.pace.rating === 'fast'
        ? 'Too fast'
        : 'within range';

  const durationSecs = feedback ? Math.round((feedback.pace.wpm * 60) / 130) : 47;
  const durationLabel = `0:${String(durationSecs).padStart(2, '0')}`;

  const metrics = [
    {
      label: 'Filler Words',
      value: feedback ? String(feedback.fillerWords.count).padStart(2, '0') : '—',
      sub: feedback?.fillerWords.examples.join(', ') ?? '',
    },
    {
      label: 'Pace',
      value:
        feedback?.pace.rating === 'slow'
          ? 'Slow'
          : feedback?.pace.rating === 'fast'
            ? 'Fast'
            : 'Good',
      sub: paceLabel,
    },
    {
      label: 'Duration',
      value: durationLabel,
      sub: 'of 1:00 target',
    },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Overline */}
        <Text
          style={[
            styles.overline,
            { color: colors.textSecondary, fontFamily: FontFamily.sansSemiBold },
          ]}
        >
          SESSION RESULTS
        </Text>

        {/* Score hero — large editorial */}
        <Animated.View style={[styles.scoreHero, scoreStyle]}>
          <View style={styles.scoreRow}>
            <Text
              style={[
                styles.scoreNumber,
                { color: colors.accent, fontFamily: FontFamily.serif },
              ]}
            >
              {feedback?.clarity.score ?? 72}
            </Text>
            <Text
              style={[
                styles.scoreOutOf,
                { color: colors.textSecondary, fontFamily: FontFamily.sans },
              ]}
            >
              /100
            </Text>
          </View>
          <Text
            style={[
              styles.scoreLabel,
              { color: colors.textSecondary, fontFamily: FontFamily.sansSemiBold },
            ]}
          >
            Coherence Score
          </Text>
        </Animated.View>

        {/* Topic pill */}
        <Animated.View style={fadeUpStyle1}>
          <View style={[styles.topicPill, { backgroundColor: colors.accentSurface }]}>
            <Text
              style={[
                styles.topicPillText,
                { color: colors.accent, fontFamily: FontFamily.serifItalic },
              ]}
            >
              {displayTopic}
            </Text>
          </View>
        </Animated.View>

        {/* Divider */}
        <View style={[styles.hrDivider, { backgroundColor: colors.divider }]} />

        {/* Metrics — editorial data rows */}
        <Animated.View style={fadeUpStyle1}>
          {metrics.map((m) => (
            <View
              key={m.label}
              style={[styles.metricRow, { borderBottomColor: colors.divider }]}
            >
              <View>
                <Text
                  style={[
                    styles.metricRowLabel,
                    { color: colors.textSecondary, fontFamily: FontFamily.sansSemiBold },
                  ]}
                >
                  {m.label.toUpperCase()}
                </Text>
                <Text
                  style={[
                    styles.metricRowSub,
                    { color: colors.textSecondary, fontFamily: FontFamily.sans },
                  ]}
                >
                  {m.sub}
                </Text>
              </View>
              <Text
                style={[
                  styles.metricRowValue,
                  { color: colors.text, fontFamily: FontFamily.sansMedium },
                ]}
              >
                {m.value}
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* Analysis — serif italic pull quote */}
        <Animated.View style={[styles.analysisBlock, fadeUpStyle1]}>
          <Text
            style={[
              styles.sectionLabel,
              { color: colors.textSecondary, fontFamily: FontFamily.sansSemiBold },
            ]}
          >
            Analysis
          </Text>
          <Text
            style={[
              styles.analysisText,
              { color: colors.text, fontFamily: FontFamily.serifItalic },
            ]}
          >
            {feedback?.summary ? `"${feedback.summary}"` : ''}
          </Text>
        </Animated.View>

        {/* Focus areas — numbered, no left-border cards */}
        <Animated.View style={[styles.focusBlock, fadeUpStyle1]}>
          <Text
            style={[
              styles.sectionLabel,
              { color: colors.textSecondary, fontFamily: FontFamily.sansSemiBold },
            ]}
          >
            Focus Areas
          </Text>
          <View style={styles.focusList}>
            {(feedback?.improvements ?? []).map((item, i) => (
              <View key={i} style={styles.focusItem}>
                <Text
                  style={[
                    styles.focusNumber,
                    { color: colors.accent, fontFamily: FontFamily.serif },
                  ]}
                >
                  {String(i + 1).padStart(2, '0')}
                </Text>
                <Text
                  style={[
                    styles.focusText,
                    { color: colors.text, fontFamily: FontFamily.sans },
                  ]}
                >
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
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
  },
  wordmark: {
    fontSize: 16,
    letterSpacing: -0.15,
  },
  topBarRight: {
    width: 24,
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
    paddingTop: 8,
    paddingBottom: 80,
  },
  overline: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 0,
  },
  scoreHero: {
    marginTop: 16,
    marginBottom: 20,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  scoreNumber: {
    fontSize: 88,
    lineHeight: 90,
  },
  scoreOutOf: {
    fontSize: 17,
    paddingBottom: 14,
  },
  scoreLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 8,
  },
  topicPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 100,
    marginBottom: 24,
  },
  topicPillText: {
    fontSize: 15,
  },
  hrDivider: {
    height: 1,
    marginBottom: 0,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  metricRowLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 3,
  },
  metricRowSub: {
    fontSize: 12,
    opacity: 0.65,
  },
  metricRowValue: {
    fontSize: 26,
    letterSpacing: -0.15,
  },
  analysisBlock: {
    marginTop: 32,
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  analysisText: {
    fontSize: 18,
    lineHeight: 32,
  },
  focusBlock: {
    paddingBottom: 8,
  },
  focusList: {
    gap: 28,
  },
  focusItem: {
    flexDirection: 'row',
    gap: 18,
    alignItems: 'flex-start',
  },
  focusNumber: {
    fontSize: 38,
    lineHeight: 34,
    opacity: 0.3,
    flexShrink: 0,
    paddingTop: 3,
  },
  focusText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 25,
    paddingTop: 4,
  },
});

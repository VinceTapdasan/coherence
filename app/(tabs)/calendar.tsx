import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { CaretLeft, CaretRight } from 'phosphor-react-native';
import { useTheme } from '@/hooks/useTheme';
import { FontFamily, Spacing } from '@/constants/theme';
import { useCalendar, useStreak } from '@/hooks/useCalendar';

const WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getMonthData(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { firstDay, daysInMonth };
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function CalendarScreen() {
  const { colors } = useTheme();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const calendarQuery = useCalendar(viewYear, viewMonth);
  const streakQuery = useStreak();

  const entries = calendarQuery.data ?? [];
  const streakCurrent = streakQuery.data?.current ?? 0;

  // Build a Set of completed date strings from the real data
  const completedDates = new Set<string>(
    entries.filter((e) => e.completed).map((e) => e.date)
  );

  // Sum sessionCount for current view month
  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const sessionCount = entries
    .filter((e) => e.date.startsWith(monthPrefix))
    .reduce((sum, e) => sum + e.sessionCount, 0);

  const { firstDay, daysInMonth } = getMonthData(viewYear, viewMonth);

  const isToday = (day: number) =>
    viewYear === today.getFullYear() &&
    viewMonth === today.getMonth() &&
    day === today.getDate();

  const isCompleted = (day: number) =>
    completedDates.has(toDateKey(viewYear, viewMonth, day));

  const goToPrev = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNext = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Build grid cells: empty slots + day numbers
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text
          style={[
            styles.headerTitle,
            { color: colors.text, fontFamily: FontFamily.sansSemiBold },
          ]}
        >
          Your Progress
        </Text>
        <Text
          style={[
            styles.headerSub,
            { color: colors.textSecondary, fontFamily: FontFamily.sans },
          ]}
        >
          Keep up the daily habit.
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Streak */}
        <View style={styles.streakRow}>
          <Text
            style={[
              styles.streakNumber,
              { color: colors.accent, fontFamily: FontFamily.serif },
            ]}
          >
            {streakCurrent}
          </Text>
          <Text
            style={[
              styles.streakLabel,
              { color: colors.textSecondary, fontFamily: FontFamily.sans },
            ]}
          >
            {' '}day streak
          </Text>
        </View>

        {/* Month nav */}
        <View style={styles.monthNav}>
          <Text
            style={[
              styles.monthTitle,
              { color: colors.text, fontFamily: FontFamily.sansSemiBold },
            ]}
          >
            {MONTH_NAMES[viewMonth]} {viewYear}
          </Text>
          <View style={styles.monthNavActions}>
            <Pressable onPress={goToPrev} hitSlop={8}>
              <CaretLeft size={18} color={colors.textSecondary} weight="light" />
            </Pressable>
            <Pressable onPress={goToNext} hitSlop={8}>
              <CaretRight size={18} color={colors.textSecondary} weight="light" />
            </Pressable>
          </View>
        </View>

        {/* Weekday labels */}
        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((d) => (
            <View key={d} style={styles.weekdayCell}>
              <Text
                style={[
                  styles.weekdayLabel,
                  { color: colors.textSecondary, fontFamily: FontFamily.sansSemiBold },
                ]}
              >
                {d}
              </Text>
            </View>
          ))}
        </View>

        {/* Day grid */}
        <View style={styles.dayGrid}>
          {cells.map((day, i) => {
            if (day === null) {
              return <View key={`empty-${i}`} style={styles.dayCell} />;
            }

            const completed = isCompleted(day);
            const todayCell = isToday(day);

            const circleStyle = completed
              ? { backgroundColor: colors.accent }
              : todayCell
                ? { borderWidth: 1.5, borderColor: colors.accent }
                : { borderWidth: 1, borderColor: colors.divider };

            const textColor = completed
              ? '#F4F1EC'
              : todayCell
                ? colors.accent
                : colors.textSecondary;

            return (
              <View key={day} style={styles.dayCell}>
                <View style={[styles.dayCircle, circleStyle]}>
                  <Text
                    style={[
                      styles.dayNumber,
                      { color: textColor, fontFamily: FontFamily.sans },
                    ]}
                  >
                    {day}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Session count */}
        <Text
          style={[
            styles.sessionCount,
            { color: colors.textSecondary, fontFamily: FontFamily.sans },
          ]}
        >
          {sessionCount} session{sessionCount !== 1 ? 's' : ''} this month
        </Text>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 48,
    gap: Spacing.xl,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  streakNumber: {
    fontSize: 48,
    lineHeight: 52,
  },
  streakLabel: {
    fontSize: 15,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthTitle: {
    fontSize: 17,
  },
  monthNavActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: -Spacing.sm,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 14,
  },
  sessionCount: {
    fontSize: 14,
    textAlign: 'center',
  },
});

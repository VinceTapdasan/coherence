import { Tabs } from 'expo-router';
import { House, ChartBar, CalendarBlank } from 'phosphor-react-native';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useRecording } from '@/contexts/RecordingContext';
import { FontFamily } from '@/constants/theme';

function TabIcon({
  icon: Icon,
  focused,
  color,
}: {
  icon: React.ComponentType<{ size: number; color: string; weight: 'light' | 'fill' }>;
  focused: boolean;
  color: string;
}) {
  return (
    <View style={styles.iconWrapper}>
      <Icon size={22} color={color} weight={focused ? 'fill' : 'light'} />
    </View>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();
  const { isRecording } = useRecording();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isRecording ? colors.background : colors.accent,
        tabBarInactiveTintColor: isRecording ? colors.background : colors.textSecondary,
        tabBarLabelStyle: {
          fontFamily: FontFamily.sansSemiBold,
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          marginTop: -2,
        },
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: isRecording ? 0 : 1,
          borderTopColor: colors.divider,
          elevation: 0,
          shadowOpacity: 0,
          height: 72,
          paddingBottom: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon={House} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="results"
        options={{
          tabBarLabel: 'Results',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon={ChartBar} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          tabBarLabel: 'Calendar',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon={CalendarBlank} focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

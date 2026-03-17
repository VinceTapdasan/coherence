import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Microphone, Check } from 'phosphor-react-native';
import { useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';

interface RecordButtonProps {
  state: 'idle' | 'recording' | 'completed';
  onPress: () => void;
}

export function RecordButton({ state, onPress }: RecordButtonProps) {
  const { colors } = useTheme();
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    if (state === 'recording') {
      pulseScale.value = 1;
      pulseOpacity.value = 0.3;
      pulseScale.value = withRepeat(
        withTiming(1.7, { duration: 2000, easing: Easing.out(Easing.quad) }),
        -1,
        false
      );
      pulseOpacity.value = withRepeat(
        withTiming(0, { duration: 2000, easing: Easing.out(Easing.quad) }),
        -1,
        false
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
      pulseOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [state]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.93, { damping: 15 });
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15 });
  };

  const iconColor = '#F4F1EC';

  const shadowStyle = state === 'recording'
    ? {
        shadowColor: '#C4614A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 16,
        elevation: 8,
      }
    : {
        shadowColor: '#C4614A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 4,
      };

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.pulse,
          { borderColor: colors.accent, backgroundColor: colors.accent },
          pulseStyle,
        ]}
      />
      <Animated.View style={buttonAnimStyle}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[styles.button, { backgroundColor: colors.accent }, shadowStyle]}
        >
          {state === 'completed' ? (
            <Check size={28} color={colors.success} weight="bold" />
          ) : (
            <Microphone size={28} color={iconColor} weight="light" />
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
  },
});

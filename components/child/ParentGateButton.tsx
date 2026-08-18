import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { BRAND_PRIMARY } from '../../constants/branding';
import { spacing, typography } from '../../theme/colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  onUnlock: () => void;
};

function randomPuzzle() {
  const a = 2 + Math.floor(Math.random() * 4);
  const b = 2 + Math.floor(Math.random() * 4);
  return { a, b, answer: a + b };
}

/** Hidden parent gate — long-press opens a simple math puzzle. */
export default function ParentGateButton({ onUnlock }: Props) {
  const [visible, setVisible] = useState(false);
  const [puzzle, setPuzzle] = useState(randomPuzzle);
  const [error, setError] = useState(false);
  const scale = useSharedValue(1);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const openGate = () => {
    setPuzzle(randomPuzzle());
    setError(false);
    setVisible(true);
  };

  const choices = useMemo(() => {
    const set = new Set<number>([puzzle.answer]);
    while (set.size < 4) {
      set.add(puzzle.answer + Math.floor(Math.random() * 5) - 2);
    }
    return Array.from(set)
      .filter((n) => n > 0)
      .slice(0, 4)
      .sort(() => Math.random() - 0.5);
  }, [puzzle.answer]);

  return (
    <>
      <AnimatedPressable
        onLongPress={openGate}
        delayLongPress={900}
        onPressIn={() => {
          scale.value = withSpring(0.92);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        style={[styles.hiddenBtn, pressStyle]}
        accessibilityLabel="Parent settings"
        accessibilityHint="Long press to open parent settings"
      />

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.title}>Grown-ups only</Text>
            <Text style={styles.question}>
              What is {puzzle.a} + {puzzle.b}?
            </Text>
            {error ? <Text style={styles.error}>Try again!</Text> : null}
            <View style={styles.choices}>
              {choices.map((choice) => (
                <Pressable
                  key={choice}
                  style={[styles.choice, choice === puzzle.answer && styles.choiceActive]}
                  onPress={() => {
                    if (choice === puzzle.answer) {
                      setTimeout(() => {
                        setVisible(false);
                        onUnlock();
                      }, 180);
                    } else {
                      setError(true);
                    }
                  }}
                >
                  <Text style={styles.choiceText}>{choice}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.cancel} onPress={() => setVisible(false)}>
              <Text style={styles.cancelText}>Go back</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  hiddenBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 56,
    height: 56,
    zIndex: 20,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    ...typography.h3,
    color: BRAND_PRIMARY,
  },
  question: {
    ...typography.h2,
    textAlign: 'center',
  },
  error: {
    color: '#EF4444',
    fontWeight: '700',
  },
  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  choice: {
    minWidth: 72,
    minHeight: 72,
    borderRadius: 22,
    backgroundColor: '#F3EEFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  choiceActive: {
    borderColor: BRAND_PRIMARY,
  },
  choiceText: {
    fontSize: 28,
    fontWeight: '900',
    color: BRAND_PRIMARY,
  },
  cancel: {
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  cancelText: {
    ...typography.body,
    color: '#64748B',
    fontWeight: '600',
  },
});

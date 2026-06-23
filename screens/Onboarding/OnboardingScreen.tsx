import React, { useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenFooter from '../../components/layout/ScreenFooter';
import AppLogo from '../../components/brand/AppLogo';
import GradientBackground from '../../components/ui/GradientBackground';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { useAppInsets } from '../../hooks/useAppInsets';
import { useTheme } from '../../context/ThemeContext';
import { spacing, typography } from '../../theme/colors';

const { width } = Dimensions.get('window');

type Props = {
  onComplete: () => void;
};

const SLIDES = [
  { icon: 'shield-checkmark', titleKey: 'onboarding_1_title', descKey: 'onboarding_1_desc' },
  { icon: 'play-circle', titleKey: 'onboarding_2_title', descKey: 'onboarding_2_desc' },
  { icon: 'analytics', titleKey: 'onboarding_3_title', descKey: 'onboarding_3_desc' },
] as const;

export default function OnboardingScreen({ onComplete }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { headerTop } = useAppInsets();
  const pagerRef = useRef<PagerView>(null);
  const [page, setPage] = useState(0);

  const isLast = page === SLIDES.length - 1;

  const goNext = () => {
    if (isLast) {
      onComplete();
      return;
    }
    pagerRef.current?.setPage(page + 1);
  };

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingTop: headerTop }]}>
        <PrimaryButton
          label={t('skip')}
          variant="ghost"
          onPress={onComplete}
          style={styles.skip}
        />

        <PagerView
          ref={pagerRef}
          style={styles.pager}
          initialPage={0}
          onPageSelected={(e) => setPage(e.nativeEvent.position)}
        >
          {SLIDES.map((slide, index) => (
            <View key={slide.titleKey} style={styles.slide}>
              {index === 0 ? (
                <AppLogo size={120} shadow={false} />
              ) : (
                <View style={[styles.iconWrap, { backgroundColor: colors.primary + '20' }]}>
                  <Icon name={slide.icon} size={56} color={colors.primary} />
                </View>
              )}
              <Text style={[styles.title, { color: colors.text }]}>{t(slide.titleKey)}</Text>
              <Text style={[styles.desc, { color: colors.textSecondary }]}>{t(slide.descKey)}</Text>
            </View>
          ))}
        </PagerView>

        <ScreenFooter style={styles.footer}>
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: i === page ? colors.primary : colors.border,
                    width: i === page ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>
          <PrimaryButton
            label={isLast ? t('get_started') : t('next')}
            onPress={goNext}
            style={{ width: width - spacing.lg * 2 }}
          />
        </ScreenFooter>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skip: { alignSelf: 'flex-end', marginRight: spacing.md },
  pager: { flex: 1 },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  desc: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    gap: spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});

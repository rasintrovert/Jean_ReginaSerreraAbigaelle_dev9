import { ScreenContainer } from '@/components/ScreenContainer';
import {
  ThemedCard,
  ThemedText,
  ThemedView
} from '@/components/ThemedComponents';
import { PressableButton } from '@/components/PressableButton';
import { useResponsive } from '@/hooks/useResponsive';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/theme';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabType = 'faq' | 'guide' | 'contact';

export default function HospitalHelpScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isTablet } = useResponsive();
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('faq');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  const toggleQuestion = (index: number) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedQuestions(newExpanded);
  };

  const handleContact = (type: 'phone' | 'email' | 'whatsapp') => {
    switch (type) {
      case 'phone':
        Linking.openURL(`tel:${t('hospital.help.contactPhoneValue') || t('agent.help.contactPhoneValue')}`);
        break;
      case 'email':
        Linking.openURL(`mailto:${t('hospital.help.contactEmailValue') || t('agent.help.contactEmailValue')}`);
        break;
      case 'whatsapp':
        Linking.openURL(`https://wa.me/${(t('hospital.help.contactWhatsAppValue') || t('agent.help.contactWhatsAppValue')).replace(/\s/g, '')}`);
        break;
    }
  };

  const faqQuestions = [
    {
      question: t('hospital.help.faqQ1') || t('agent.help.faqQ1'),
      answer: t('hospital.help.faqA1') || t('agent.help.faqA1'),
    },
    {
      question: t('hospital.help.faqQ2') || t('agent.help.faqQ2'),
      answer: t('hospital.help.faqA2') || t('agent.help.faqA2'),
    },
    {
      question: t('hospital.help.faqQ3') || t('agent.help.faqQ3'),
      answer: t('hospital.help.faqA3') || t('agent.help.faqA3'),
    },
    {
      question: t('hospital.help.faqQ4') || t('agent.help.faqQ4'),
      answer: t('hospital.help.faqA4') || t('agent.help.faqA4'),
    },
    {
      question: t('hospital.help.faqQ5') || t('agent.help.faqQ5'),
      answer: t('hospital.help.faqA5') || t('agent.help.faqA5'),
    },
    {
      question: t('hospital.help.faqQ6') || t('agent.help.faqQ6'),
      answer: t('hospital.help.faqA6') || t('agent.help.faqA6'),
    },
  ];

  const guideCards = [
    {
      icon: 'heart' as const,
      title: t('hospital.help.guideRegisterPregnancy') || t('agent.help.guideRegisterPregnancy'),
      description: t('hospital.help.guideRegisterPregnancyDesc') || t('agent.help.guideRegisterPregnancyDesc'),
    },
    {
      icon: 'child' as const,
      title: t('hospital.help.guideRegisterBirth') || t('agent.help.guideRegisterBirth'),
      description: t('hospital.help.guideRegisterBirthDesc') || t('agent.help.guideRegisterBirthDesc'),
    },
    {
      icon: 'file-text' as const,
      title: t('hospital.help.guideGenerateProof') || t('agent.help.guideGenerateProof'),
      description: t('hospital.help.guideGenerateProofDesc') || t('agent.help.guideGenerateProofDesc'),
    },
    {
      icon: 'history' as const,
      title: t('hospital.help.guideHistory') || t('agent.help.guideHistory'),
      description: t('hospital.help.guideHistoryDesc') || t('agent.help.guideHistoryDesc'),
    },
  ];

  const renderFAQ = () => (
    <ThemedCard style={styles.contentCard}>
      {faqQuestions.map((item, index) => {
        const isExpanded = expandedQuestions.has(index);
        return (
          <View key={index}>
            <Pressable
              style={[
                styles.faqItem,
                {
                  borderBottomWidth: index < faqQuestions.length - 1 ? 1 : 0,
                  borderBottomColor: theme.colors.border,
                }
              ]}
              onPress={() => toggleQuestion(index)}
            >
              <ThemedText size="base" weight="medium" style={styles.faqQuestion}>
                {item.question}
              </ThemedText>
              <FontAwesome
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={theme.colors.textSecondary}
              />
            </Pressable>
            {isExpanded && (
              <ThemedView variant="transparent" style={styles.faqAnswer}>
                <ThemedText variant="secondary" size="sm" style={styles.answerText}>
                  {item.answer}
                </ThemedText>
              </ThemedView>
            )}
          </View>
        );
      })}
    </ThemedCard>
  );

  const renderGuide = () => (
    <>
      <View style={styles.guideCardsContainer}>
        {guideCards.map((card, index) => (
          <ThemedCard key={index} style={styles.guideCard}>
            <ThemedView variant="transparent" style={styles.guideCardContent}>
              <FontAwesome
                name={card.icon}
                size={24}
                color={theme.colors.primary}
                style={styles.guideIcon}
              />
              <ThemedView variant="transparent" style={styles.guideCardText}>
                <ThemedText size="base" weight="semibold" style={styles.guideCardTitle}>
                  {card.title}
                </ThemedText>
                <ThemedText variant="secondary" size="sm" style={styles.guideCardDesc}>
                  {card.description}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedCard>
        ))}
      </View>

      <ThemedCard style={styles.videoCard}>
        <ThemedView variant="transparent" style={styles.videoCardContent}>
          <FontAwesome
            name="play-circle"
            size={48}
            color={theme.colors.primary}
            style={styles.videoIcon}
          />
          <ThemedText size="base" weight="medium" style={styles.videoTitle}>
            {t('hospital.help.guideVideoTitle') || t('agent.help.guideVideoTitle')}
          </ThemedText>
          <PressableButton
            variant="outline"
            size="md"
            onPress={() => console.log('Ouvrir vidéo')}
          >
            <FontAwesome name="play" size={16} color={theme.colors.primary} />
            <ThemedText size="sm" style={{ color: theme.colors.primary, marginLeft: 8 }}>
              {t('hospital.help.guideVideoButton') || t('agent.help.guideVideoButton')}
            </ThemedText>
          </PressableButton>
        </ThemedView>
      </ThemedCard>
    </>
  );

  const renderContact = () => (
    <>
      <ThemedCard style={styles.contactCard}>
        <Pressable
          style={styles.contactItem}
          onPress={() => handleContact('phone')}
        >
          <FontAwesome name="phone" size={20} color={theme.colors.primary} style={styles.contactIcon} />
          <ThemedView variant="transparent" style={styles.contactTextContainer}>
            <ThemedText variant="secondary" size="sm">
              {t('hospital.help.contactPhoneLabel') || t('agent.help.contactPhoneLabel')}
            </ThemedText>
            <ThemedText size="base" weight="medium">
              {t('hospital.help.contactPhoneValue') || t('agent.help.contactPhoneValue')}
            </ThemedText>
          </ThemedView>
        </Pressable>

        <Pressable
          style={[
            styles.contactItem,
            {
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
            }
          ]}
          onPress={() => handleContact('email')}
        >
          <FontAwesome name="envelope" size={20} color={theme.colors.primary} style={styles.contactIcon} />
          <ThemedView variant="transparent" style={styles.contactTextContainer}>
            <ThemedText variant="secondary" size="sm">
              {t('hospital.help.contactEmailLabel') || t('agent.help.contactEmailLabel')}
            </ThemedText>
            <ThemedText size="base" weight="medium">
              {t('hospital.help.contactEmailValue') || t('agent.help.contactEmailValue')}
            </ThemedText>
          </ThemedView>
        </Pressable>

        <Pressable
          style={styles.contactItem}
          onPress={() => handleContact('whatsapp')}
        >
          <FontAwesome name="whatsapp" size={20} color={theme.colors.success} style={styles.contactIcon} />
          <ThemedView variant="transparent" style={styles.contactTextContainer}>
            <ThemedText variant="secondary" size="sm">
              {t('hospital.help.contactWhatsAppLabel') || t('agent.help.contactWhatsAppLabel')}
            </ThemedText>
            <ThemedText size="base" weight="medium">
              {t('hospital.help.contactWhatsAppValue') || t('agent.help.contactWhatsAppValue')}
            </ThemedText>
          </ThemedView>
        </Pressable>
      </ThemedCard>

      <ThemedCard style={styles.infoCard}>
        <ThemedView variant="transparent" style={styles.infoCardContent}>
          <FontAwesome name="clock-o" size={20} color={theme.colors.info} style={styles.infoIcon} />
          <ThemedText variant="secondary" size="sm" style={styles.infoText}>
            {t('hospital.help.contactAvailable') || t('agent.help.contactAvailable')}
          </ThemedText>
        </ThemedView>
      </ThemedCard>
    </>
  );

  return (
    <ScreenContainer variant="background">
      <ThemedView 
        variant="transparent"
        style={StyleSheet.flatten([
          styles.header, 
          { 
            backgroundColor: theme.colors.primary,
            paddingTop: Math.max(insets.top, 16),
          }
        ])}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <FontAwesome
            name="arrow-left"
            size={20}
            color="#fff"
          />
        </Pressable>
        <ThemedView variant="transparent" style={styles.headerText}>
          <ThemedText 
            size="xl" 
            weight="bold" 
            style={StyleSheet.flatten([styles.headerTitle, { color: '#fff' }])}
          >
            {t('hospital.help.title') || t('agent.help.title')}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.tabsContainer}>
        <Pressable
          style={[
            styles.tab,
            activeTab === 'faq' && {
              backgroundColor: theme.colors.primary + '15',
              borderBottomWidth: 2,
              borderBottomColor: theme.colors.primary,
            }
          ]}
          onPress={() => setActiveTab('faq')}
        >
          <FontAwesome
            name="question-circle"
            size={16}
            color={activeTab === 'faq' ? theme.colors.primary : theme.colors.textSecondary}
            style={styles.tabIcon}
          />
          <ThemedText
            size="sm"
            weight={activeTab === 'faq' ? 'semibold' : 'normal'}
            style={{
              color: activeTab === 'faq' ? theme.colors.primary : theme.colors.textSecondary,
            }}
          >
            {t('hospital.help.tabFAQ') || t('agent.help.tabFAQ')}
          </ThemedText>
        </Pressable>

        <Pressable
          style={[
            styles.tab,
            activeTab === 'guide' && {
              backgroundColor: theme.colors.primary + '15',
              borderBottomWidth: 2,
              borderBottomColor: theme.colors.primary,
            }
          ]}
          onPress={() => setActiveTab('guide')}
        >
          <FontAwesome
            name="book"
            size={16}
            color={activeTab === 'guide' ? theme.colors.primary : theme.colors.textSecondary}
            style={styles.tabIcon}
          />
          <ThemedText
            size="sm"
            weight={activeTab === 'guide' ? 'semibold' : 'normal'}
            style={{
              color: activeTab === 'guide' ? theme.colors.primary : theme.colors.textSecondary,
            }}
          >
            {t('hospital.help.tabGuide') || t('agent.help.tabGuide')}
          </ThemedText>
        </Pressable>

        <Pressable
          style={[
            styles.tab,
            activeTab === 'contact' && {
              backgroundColor: theme.colors.primary + '15',
              borderBottomWidth: 2,
              borderBottomColor: theme.colors.primary,
            }
          ]}
          onPress={() => setActiveTab('contact')}
        >
          <FontAwesome
            name="phone"
            size={16}
            color={activeTab === 'contact' ? theme.colors.primary : theme.colors.textSecondary}
            style={styles.tabIcon}
          />
          <ThemedText
            size="sm"
            weight={activeTab === 'contact' ? 'semibold' : 'normal'}
            style={{
              color: activeTab === 'contact' ? theme.colors.primary : theme.colors.textSecondary,
            }}
          >
            {t('hospital.help.tabContact') || t('agent.help.tabContact')}
          </ThemedText>
        </Pressable>
      </ThemedView>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.scrollContentTablet
        ]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'faq' && renderFAQ()}
        {activeTab === 'guide' && renderGuide()}
        {activeTab === 'contact' && renderContact()}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {},
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  tabIcon: {
    marginRight: 0,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  scrollContentTablet: {
    paddingHorizontal: 32,
    maxWidth: 800,
    alignSelf: 'center',
  },
  contentCard: {
    marginBottom: 16,
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  faqQuestion: {
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingLeft: 32,
  },
  answerText: {
    lineHeight: 20,
  },
  guideCardsContainer: {
    gap: 16,
    marginBottom: 16,
  },
  guideCard: {
    marginBottom: 0,
  },
  guideCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  guideIcon: {
    marginTop: 2,
  },
  guideCardText: {
    flex: 1,
  },
  guideCardTitle: {
    marginBottom: 8,
  },
  guideCardDesc: {
    lineHeight: 20,
  },
  videoCard: {
    marginBottom: 16,
  },
  videoCardContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  videoIcon: {
    marginBottom: 16,
  },
  videoTitle: {
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  contactCard: {
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 16,
  },
  contactIcon: {},
  contactTextContainer: {
    flex: 1,
  },
  infoCard: {
    marginBottom: 16,
  },
  infoCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  infoIcon: {},
  infoText: {
    flex: 1,
    textAlign: 'center',
  },
});


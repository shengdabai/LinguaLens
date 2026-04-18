import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Navigation, ActiveTab, PracticeSubTab, LearnSubTab } from './components/Navigation';
import { Layout } from './components/Layout';
import { QuestDashboard } from './features/quest/QuestDashboard';
import { LearningStore } from './store/learningStore';
import { Scenario } from './features/roleplay/scenarios';
import { UserProfile, VocabCard } from './types';
import { Loader2 } from 'lucide-react';

// Lazy-loaded feature modules
const SnapMode = lazy(() => import('./features/snap/SnapMode').then(m => ({ default: m.SnapMode })));
const LiveMode = lazy(() => import('./features/live/LiveMode').then(m => ({ default: m.LiveMode })));
const ScenarioSelection = lazy(() => import('./features/roleplay/ScenarioSelection').then(m => ({ default: m.ScenarioSelection })));
const RoleplaySession = lazy(() => import('./features/roleplay/RoleplaySession').then(m => ({ default: m.RoleplaySession })));
const FluencyCoach = lazy(() => import('./features/fluency/FluencyCoach').then(m => ({ default: m.FluencyCoach })));
const TranslationBridge = lazy(() => import('./features/translation/TranslationBridge').then(m => ({ default: m.TranslationBridge })));
const ImmersiveReader = lazy(() => import('./features/reader/ImmersiveReader').then(m => ({ default: m.ImmersiveReader })));
const OmniReader = lazy(() => import('./features/omnireader/OmniReader').then(m => ({ default: m.OmniReader })));
const Shadowing = lazy(() => import('./features/shadowing/Shadowing').then(m => ({ default: m.Shadowing })));
const ScriptDrafting = lazy(() => import('./features/script/ScriptDrafting').then(m => ({ default: m.ScriptDrafting })));
const SRSReview = lazy(() => import('./features/srs/SRSReview').then(m => ({ default: m.SRSReview })));
const ProfilePage = lazy(() => import('./features/profile/ProfilePage').then(m => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('./features/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));

const LazyFallback = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="animate-spin text-brand-500" size={28} />
  </div>
);

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [practiceSubTab, setPracticeSubTab] = useState<PracticeSubTab>('live');
  const [learnSubTab, setLearnSubTab] = useState<LearnSubTab>('translation');
  const [profile, setProfile] = useState<UserProfile>(LearningStore.loadProfile());
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);

  const saveAndRefresh = (updated: UserProfile) => {
    LearningStore.saveProfile(updated);
    setProfile(updated);
  };

  const handleSnapComplete = (_detectedObject: string) => {
    let p = LearningStore.loadProfile();
    const snapQuest = p.quests.find((q) => q.type === 'snap' && !q.completed);
    if (snapQuest) {
      snapQuest.progress = (snapQuest.progress || 0) + 1;
      if (snapQuest.progress >= (snapQuest.totalRequired || 1)) {
        snapQuest.completed = true;
        p = LearningStore.addXP(p, snapQuest.xpReward);
      }
      saveAndRefresh(p);
    }
  };

  const handleAddVocab = (
    card: Omit<VocabCard, 'id' | 'interval' | 'easeFactor' | 'nextReviewDate' | 'reviewCount' | 'isFavorite'>
  ) => {
    const p = LearningStore.loadProfile();
    const updated = LearningStore.addVocabCard(p, card);
    saveAndRefresh(updated);
  };

  const handleLiveSessionStart = () => {
    let p = LearningStore.loadProfile();
    const liveQuest = p.quests.find((q) => q.type === 'live' && !q.completed);
    if (liveQuest) {
      liveQuest.completed = true;
      p = LearningStore.addXP(p, liveQuest.xpReward);
      saveAndRefresh(p);
    }
  };

  const handleRoleplayComplete = () => {
    let p = LearningStore.loadProfile();
    const rpQuest = p.quests.find((q) => q.type === 'roleplay' && !q.completed);
    if (rpQuest) {
      rpQuest.completed = true;
      p = LearningStore.addXP(p, rpQuest.xpReward);
      saveAndRefresh(p);
    }
  };

  const handleTranslationComplete = () => {
    let p = LearningStore.loadProfile();
    const tQuest = p.quests.find((q) => q.type === 'translation' && !q.completed);
    if (tQuest) {
      tQuest.progress = (tQuest.progress || 0) + 1;
      if (tQuest.progress >= (tQuest.totalRequired || 1)) {
        tQuest.completed = true;
        p = LearningStore.addXP(p, tQuest.xpReward);
      }
      saveAndRefresh(p);
    }
  };

  const handleReviewCard = (cardId: string, grade: 'again' | 'hard' | 'good' | 'easy') => {
    let p = LearningStore.loadProfile();
    p = LearningStore.updateCard(p, cardId, grade);
    const reviewQuest = p.quests.find((q) => q.type === 'review' && !q.completed);
    if (reviewQuest) {
      reviewQuest.progress = (reviewQuest.progress || 0) + 1;
      if (reviewQuest.progress >= (reviewQuest.totalRequired || 1)) {
        reviewQuest.completed = true;
        p = LearningStore.addXP(p, reviewQuest.xpReward);
      }
    }
    saveAndRefresh(p);
  };

  const handleFluencyComplete = () => {
    let p = LearningStore.loadProfile();
    const fluencyQuest = p.quests.find((q) => q.type === 'fluency' && !q.completed);
    if (fluencyQuest) {
      fluencyQuest.progress = (fluencyQuest.progress || 0) + 1;
      if (fluencyQuest.progress >= (fluencyQuest.totalRequired || 1)) {
        fluencyQuest.completed = true;
        p = LearningStore.addXP(p, fluencyQuest.xpReward);
      }
      saveAndRefresh(p);
    }
  };

  const reviewCards = LearningStore.getTodayReviewCards(profile);
  const toSettings = () => setActiveTab('settings');

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <QuestDashboard quests={profile.quests} xp={profile.xp} level={profile.level} />;

      case 'snap':
        return (
          <SnapMode
            onSnapComplete={handleSnapComplete}
            onAddVocab={handleAddVocab}
            onNeedApiKey={toSettings}
          />
        );

      case 'practice':
        if (practiceSubTab === 'live') {
          return <LiveMode onSessionStart={handleLiveSessionStart} onNeedApiKey={toSettings} />;
        }
        if (practiceSubTab === 'roleplay') {
          if (selectedScenario) {
            return (
              <RoleplaySession
                scenario={selectedScenario}
                onExit={() => setSelectedScenario(null)}
                onSessionComplete={handleRoleplayComplete}
                onNeedApiKey={toSettings}
              />
            );
          }
          return <ScenarioSelection onSelect={setSelectedScenario} />;
        }
        if (practiceSubTab === 'fluency') {
          return <FluencyCoach onPracticeComplete={handleFluencyComplete} onNeedApiKey={toSettings} />;
        }
        return null;

      case 'settings':
        return <SettingsPage />;

      case 'learn':
        if (learnSubTab === 'translation') {
          return (
            <TranslationBridge
              onTranslationComplete={handleTranslationComplete}
              onNeedApiKey={toSettings}
              onAddVocab={handleAddVocab}
            />
          );
        }
        if (learnSubTab === 'reader') {
          return <ImmersiveReader onNeedApiKey={toSettings} />;
        }
        if (learnSubTab === 'omnireader') {
          return <OmniReader onNeedApiKey={toSettings} />;
        }
        if (learnSubTab === 'shadowing') {
          return <Shadowing onNeedApiKey={toSettings} />;
        }
        if (learnSubTab === 'script') {
          return <ScriptDrafting onNeedApiKey={toSettings} />;
        }
        return null;

      case 'review':
        return <SRSReview cards={reviewCards} onGrade={handleReviewCard} />;

      case 'profile':
        return <ProfilePage profile={profile} />;

      default:
        return null;
    }
  };

  useEffect(() => {
    if (practiceSubTab !== 'roleplay') {
      setSelectedScenario(null);
    }
  }, [practiceSubTab]);

  return (
    <Layout>
      <div className="flex w-full overflow-x-hidden">
        <Navigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          practiceSubTab={practiceSubTab}
          setPracticeSubTab={setPracticeSubTab}
          learnSubTab={learnSubTab}
          setLearnSubTab={setLearnSubTab}
          xp={profile.xp}
          level={profile.level}
        />

        <main id="main-content" className="flex-1 min-w-0 md:ml-64 min-h-screen">
          <div className={`md:hidden ${activeTab === 'practice' || activeTab === 'learn' ? 'pt-12' : 'pt-0'}`} />
          <div className="pb-20 md:pb-0">
            <Suspense fallback={<LazyFallback />}>{renderContent()}</Suspense>
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default App;

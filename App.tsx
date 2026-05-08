
import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import ChatView from './components/ChatView';
import VoiceView from './components/VoiceView';
import HomeworkView from './components/HomeworkView';
import WriterView from './components/WriterView';
import TeacherUAEView from './components/TeacherUAEView';
import IslamicHubView from './components/IslamicHubView';
import SettingsView from './components/SettingsView';
import FilesView from './components/FilesView';
import TranslatorView from './components/TranslatorView';
import StudyRoomView from './components/StudyRoomView';
import ThreeCanvas from './components/ThreeCanvas';
import { AppTab } from './types';

// ── Animated page wrapper ──────────────────────────────────────
const PageTransition: React.FC<{ children: React.ReactNode; tabKey: string }> = ({ children, tabKey }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, [tabKey]);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0px) scale(1)' : 'translateY(18px) scale(0.985)',
        transition: 'opacity 0.45s cubic-bezier(0.23,1,0.32,1), transform 0.45s cubic-bezier(0.23,1,0.32,1)',
        width: '100%',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </div>
  );
};

// ── Floating voice button ──────────────────────────────────────
const VoiceFAB: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered
            ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
            : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
          boxShadow: hovered
            ? '0 0 50px rgba(99,102,241,0.7), 0 8px 32px rgba(99,102,241,0.5)'
            : '0 0 30px rgba(99,102,241,0.4), 0 8px 20px rgba(99,102,241,0.3)',
          transform: hovered ? 'scale(1.12) translateY(-3px)' : 'scale(1) translateY(0)',
          transition: 'all 0.3s cubic-bezier(0.23,1,0.32,1)',
        }}
        className="p-4 md:p-5 text-white rounded-full"
      >
        <div className="relative">
          {/* Animated rings */}
          <div
            className="absolute inset-0 rounded-full border border-white/30 animate-ping"
            style={{ animationDuration: '2s' }}
          />
          <div
            className="absolute -inset-2 rounded-full border border-indigo-400/20 animate-ping"
            style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}
          />
          <svg className="w-6 h-6 md:w-7 md:h-7 relative" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
      </button>
    </div>
  );
};

// ── App ────────────────────────────────────────────────────────
const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const isStandalone = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('code');

  useEffect(() => {
    if (isStandalone) {
      setActiveTab('study_room');
    }
  }, [isStandalone]);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':           return <HomeView setActiveTab={setActiveTab} />;
      case 'chat':           return <ChatView />;
      case 'voice':          return <VoiceView />;
      case 'homework':       return <HomeworkView />;
      case 'writer':         return <WriterView />;
      case 'teacher-uae':    return <TeacherUAEView />;
      case 'islamic-hub':    return <IslamicHubView />;
      case 'settings':       return <SettingsView />;
      case 'files':          return <FilesView />;
      case 'translator':     return <TranslatorView />;
      case 'study_room':     return <StudyRoomView />;
      default:               return <HomeView setActiveTab={setActiveTab} />;
    }
  };

  const isChat = activeTab === 'chat';
  const showFAB = activeTab !== 'voice' && activeTab !== 'teacher-uae' && activeTab !== 'translator' && !isStandalone;

  return (
    <div className="h-[100dvh] flex flex-col bg-[#050505] overflow-hidden">
      {/* 3D Canvas Background — only on non-chat pages for performance */}
      {activeTab !== 'chat' && !isStandalone && <ThreeCanvas />}

      {!isStandalone && <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />}

      <main
        className={`flex-1 relative flex flex-col overflow-hidden ${
          isStandalone ? '' : 
          isChat
            ? 'mt-[60px] md:mt-[68px]'
            : 'mt-[72px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10'
        }`}
      >
        <div
          className={`flex-1 flex flex-col ${
            isChat || isStandalone
              ? 'w-full h-full'
              : 'max-w-[1920px] mx-auto w-full px-4 md:px-10 pb-20 md:pb-10'
          }`}
        >
          {isStandalone ? (
            renderContent()
          ) : (
            <PageTransition tabKey={activeTab}>
              {renderContent()}
            </PageTransition>
          )}
        </div>
      </main>

      {showFAB && <VoiceFAB onClick={() => setActiveTab('voice')} />}
    </div>
  );
};

export default App;

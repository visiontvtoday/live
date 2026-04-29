/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, ReactNode, useEffect } from 'react';
import { 
  Home, 
  Book, 
  Video, 
  Image as ImageIcon, 
  User, 
  Eye, 
  EyeOff, 
  History, 
  CheckCircle2, 
  Quote,
  ChevronRight,
  BookOpen,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  ChevronLeft,
  Settings,
  LogOut,
  Bell,
  ShieldCheck,
  Mail,
  MapPin,
  Heart,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { auth } from './lib/firebase';

type Page = 'auth' | 'home' | 'books' | 'videos' | 'gallery'| 'profile' | 'history' | 'niyam' | 'checkin' | 'reader';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('auth');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedBook, setSelectedBook] = useState<{title: string, author: string} | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        if (currentPage === 'auth') setCurrentPage('home');
      } else {
        setCurrentPage('auth');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bishnoi-beige flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-bishnoi-brown" />
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'auth':
        return <AuthPage onLogin={() => setCurrentPage('home')} />;
      case 'home':
        return <HomePage onNavigate={(page) => setCurrentPage(page)} />;
      case 'books':
        return <BooksPage onRead={(book) => {
          setSelectedBook(book);
          setCurrentPage('reader');
        }} />;
      case 'reader':
        return selectedBook ? (
          <ReaderPage 
            book={selectedBook} 
            onBack={() => setCurrentPage('books')} 
          />
        ) : null;
      case 'gallery':
        return <GalleryPage />;
      case 'profile':
        return <ProfilePage onLogout={() => setCurrentPage('auth')} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full pt-20 px-6 text-center">
            <h2 className="text-2xl font-serif font-bold text-bishnoi-brown mb-4">Coming Soon</h2>
            <p className="text-bishnoi-brown/60">This section is currently under development.</p>
            <button 
              onClick={() => setCurrentPage('home')}
              className="mt-8 px-6 py-2 bg-bishnoi-brown text-white rounded-full font-medium"
            >
              Back to Home
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-bishnoi-beige flex flex-col max-w-md mx-auto relative overflow-hidden">
      <main className="flex-1 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      {currentPage !== 'auth' && (
        <BottomNav current={currentPage} onNavigate={setCurrentPage} />
      )}
    </div>
  );
}

function BottomNav({ current, onNavigate }: { current: Page, onNavigate: (page: Page) => void }) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'books', icon: Book, label: 'Books' },
    { id: 'videos', icon: Video, label: 'Videos' },
    { id: 'gallery', icon: ImageIcon, label: 'Gallery' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-md border-t border-bishnoi-brown/10 px-6 py-3 flex justify-between items-center z-50">
      {tabs.map((tab) => {
        const isActive = current === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id as Page)}
            className="flex flex-col items-center gap-1 group relative"
          >
            <div className={`p-2 rounded-2xl transition-colors ${isActive ? 'bg-bishnoi-brown/10 text-bishnoi-brown' : 'text-bishnoi-brown/40 group-hover:text-bishnoi-brown/60'}`}>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-medium uppercase tracking-wider ${isActive ? 'text-bishnoi-brown' : 'text-bishnoi-brown/40'}`}>
              {tab.label}
            </span>
            {isActive && (
              <motion.div 
                layoutId="navIndicator"
                className="absolute -bottom-3 w-1 h-1 rounded-full bg-bishnoi-brown" 
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

function AuthPage({ onLogin }: { onLogin: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (fullName) {
          await updateProfile(userCredential.user, { displayName: fullName });
        }
      }
      onLogin();
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen px-8 pt-20 pb-10 overflow-y-auto">
      <div className="flex flex-col items-center mb-12">
        <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center p-6 shadow-xl shadow-bishnoi-brown/5 border border-bishnoi-brown/5 mb-6">
          <div className="relative w-full h-full text-bishnoi-green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
              <path d="M12 19V5M5 12l7-7 7 7M17 21a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2z" />
              <path d="M3 21a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H3z" />
              <circle cx="12" cy="5" r="1.5" fill="currentColor" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center top-4">
              <div className="w-8 h-8 rounded-full border-2 border-bishnoi-brown" />
            </div>
          </div>
        </div>
        <h1 className="text-3xl font-serif font-bold text-bishnoi-brown tracking-tight text-center">
          {mode === 'signin' ? 'SIGN IN' : 'SIGN UP'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          {mode === 'signup' && (
            <div className="relative">
              <input 
                type="text" 
                placeholder="FULL NAME" 
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-6 py-4 bg-white border border-bishnoi-brown/20 rounded-2xl focus:outline-none focus:border-bishnoi-brown font-serif tracking-widest text-sm placeholder:text-bishnoi-brown/30"
              />
            </div>
          )}
          <div className="relative">
            <input 
              type="email" 
              placeholder="EMAIL" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 bg-white border border-bishnoi-brown/20 rounded-2xl focus:outline-none focus:border-bishnoi-brown font-serif tracking-widest text-sm placeholder:text-bishnoi-brown/30"
            />
          </div>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="PASSWORD" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 bg-white border border-bishnoi-brown/20 rounded-2xl focus:outline-none focus:border-bishnoi-brown font-serif tracking-widest text-sm placeholder:text-bishnoi-brown/30"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-bishnoi-brown/30 hover:text-bishnoi-brown"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {authError && (
          <p className="text-bishnoi-red text-[10px] uppercase font-bold tracking-widest text-center px-4">
            {authError}
          </p>
        )}

        {mode === 'signin' && (
          <div className="flex justify-end">
            <button type="button" className="text-[10px] font-serif font-bold text-bishnoi-brown hover:opacity-70 tracking-widest">
              FORGOT PASSWORD ?
            </button>
          </div>
        )}

        <button 
          type="submit"
          disabled={authLoading}
          className="w-full py-4 bg-bishnoi-red text-white rounded-2xl font-serif font-bold tracking-widest shadow-lg shadow-bishnoi-red/20 active:bg-bishnoi-earth transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {authLoading && <Loader2 size={18} className="animate-spin" />}
          {mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}
        </button>

        <div className="text-center pt-4">
          <button 
            type="button" 
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setAuthError('');
            }}
            className="text-sm font-serif font-bold text-bishnoi-brown hover:opacity-70 tracking-widest"
          >
            {mode === 'signin' ? 'SIGN UP ?' : 'ALREADY HAVE AN ACCOUNT?'}
          </button>
        </div>
      </form>
    </div>
  );
}

function HomePage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const banners = [
    "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&q=80&w=1000", // Rajasthan desert
    "https://images.unsplash.com/photo-1542332213-31f87348057f?auto=format&fit=crop&q=80&w=1000", // Deer in nature
  ];

  return (
    <div className="space-y-8 px-6 pt-12">
      <header className="space-y-1">
        <h1 className="text-3xl font-serif font-bold text-bishnoi-brown">बिश्नोई संस्कृति</h1>
        <p className="text-bishnoi-brown/40 font-serif font-bold tracking-widest uppercase text-sm">BISHNOI CULTURE</p>
      </header>

      {/* Image Slider */}
      <div className="relative group overflow-hidden rounded-3xl h-48 bg-bishnoi-brown/5">
        <div className="absolute inset-0 flex">
           <img 
            src={banners[0]} 
            alt="Bishnoi Heritage" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
          <div className="w-4 h-1.5 rounded-full bg-white" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
        </div>
      </div>

      <section className="space-y-6">
        <h2 className="text-3xl font-serif font-bold text-bishnoi-brown">Explore</h2>
        <div className="grid grid-cols-2 gap-4">
          <ExploreCard 
            icon={<BookOpen size={24} className="text-bishnoi-brown" />} 
            title="Books" 
            subtitle="Sacred Knowledge" 
            onClick={() => onNavigate('books')}
          />
          <ExploreCard 
            icon={<History size={24} className="text-bishnoi-green" />} 
            title="History" 
            subtitle="Explore the Past" 
            onClick={() => onNavigate('history')}
          />
          <ExploreCard 
            icon={<div className="text-bishnoi-red font-serif font-bold text-2xl">29</div>} 
            title="Niyam" 
            subtitle="Way of Life" 
            onClick={() => onNavigate('niyam')}
          />
          <ExploreCard 
            icon={<Video size={24} className="text-bishnoi-brown" />} 
            title="Videos" 
            subtitle="Cultural Visuals" 
            onClick={() => onNavigate('videos')}
          />
          <ExploreCard 
            icon={<ImageIcon size={24} className="text-bishnoi-green" />} 
            title="Gallery" 
            subtitle="Cultural Moments" 
            onClick={() => onNavigate('gallery')}
          />
          <ExploreCard 
            icon={<CheckCircle2 size={24} className="text-bishnoi-orange" />} 
            title="Check-in" 
            subtitle="Sacred Routine" 
            onClick={() => onNavigate('checkin')}
          />
        </div>
      </section>

      <div className="bg-white/50 border border-bishnoi-brown/10 rounded-[32px] p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="text-bishnoi-orange">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
            </svg>
          </div>
          <h3 className="text-xl font-serif font-bold text-bishnoi-brown">Guru Vani</h3>
        </div>
        <p className="text-bishnoi-brown/70 italic leading-relaxed font-sans">
          "One should not cut trees, because they give shelter to living beings. This is the way of compassion taught by Guru Jambheshwar."
        </p>
      </div>
    </div>
  );
}

function ExploreCard({ icon, title, subtitle, onClick }: { icon: ReactNode, title: string, subtitle: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="bg-white/40 border border-bishnoi-brown/10 rounded-2xl p-5 text-left space-y-3 shadow-sm hover:shadow-md transition-all active:bg-bishnoi-earth/10 flex flex-col justify-between"
    >
      <div className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-bishnoi-brown/5">
        {icon}
      </div>
      <div>
        <h4 className="font-serif font-bold text-bishnoi-brown text-lg leading-none">{title}</h4>
        <p className="text-[10px] text-bishnoi-brown/40 font-medium uppercase tracking-wider mt-1">{subtitle}</p>
      </div>
    </button>
  );
}

function BooksPage({ onRead }: { onRead: (book: {title: string, author: string}) => void }) {
  const books = [
    { id: 1, title: 'CULTURE', author: 'SUMIT', cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400' },
  ];

  return (
    <div className="space-y-8 px-6 pt-12">
      <header>
        <h2 className="text-4xl font-serif font-bold text-bishnoi-brown">Books</h2>
      </header>

      <div className="space-y-4">
        {books.map(book => (
          <div key={book.id} className="bg-white/40 border border-bishnoi-brown/10 rounded-3xl p-5 flex gap-4 items-center shadow-sm">
            <div className="w-24 h-32 flex-shrink-0 bg-bishnoi-brown/5 rounded-2xl overflow-hidden shadow-inner">
              <img 
                src={book.cover} 
                alt={book.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <h4 className="font-serif font-bold text-bishnoi-brown tracking-widest text-xl uppercase leading-tight">{book.title}</h4>
                <p className="text-xs font-serif font-bold text-bishnoi-brown/40 tracking-widest uppercase">{book.author}</p>
              </div>
              <button 
                onClick={() => onRead({ title: book.title, author: book.author })}
                className="flex items-center gap-1 text-bishnoi-brown/60 hover:text-bishnoi-earth active:text-bishnoi-earth transition-colors"
              >
                <span className="text-[10px] font-bold tracking-widest uppercase underline underline-offset-4">READ NOW</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReaderPage({ book, onBack }: { book: { title: string, author: string }, onBack: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(30);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [speechInstance, setSpeechInstance] = useState<SpeechSynthesisUtterance | null>(null);

  const handleAiNarrate = async () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    setIsAiLoading(true);
    try {
      const textToNarrate = `The Bishnoi community, founded in 1485 AD by Guru Jambheshwar, is one of the world's first environment-loving religious movements.`;
      
      const response = await fetch('/api/narrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToNarrate })
      });

      const data = await response.json();
      if (data.content) {
        const utterance = new SpeechSynthesisUtterance(data.content);
        utterance.onend = () => setIsPlaying(false);
        utterance.rate = 0.9; // Slightly slower for spiritual tone
        setSpeechInstance(utterance);
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Narration error:', error);
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#fdfdfb] text-bishnoi-brown">
      {/* Reader Header */}
      <header className="px-6 py-8 flex items-center justify-between border-b border-bishnoi-brown/5 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <button onClick={onBack} className="p-2 -ml-2 text-bishnoi-brown hover:text-bishnoi-earth transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
          <h1 className="text-xs font-serif font-bold tracking-[0.2em] opacity-30 uppercase">Reading</h1>
          <h2 className="text-sm font-serif font-bold tracking-widest uppercase">{book.title}</h2>
        </div>
        <button className="p-2 -mr-2 text-bishnoi-brown/30">
          <Settings size={20} />
        </button>
      </header>

      {/* Reader Content */}
      <div className="flex-1 overflow-y-auto px-8 py-10 space-y-8 font-serif leading-relaxed text-lg">
        <p className="transition-opacity hover:opacity-100 opacity-90 first-letter:text-5xl first-letter:font-bold first-letter:mr-3 first-letter:float-left first-letter:text-bishnoi-earth">
          The Bishnoi community, founded in 1485 AD by Guru Jambheshwar, is one of the world's first environment-loving religious movements. The name "Bishnoi" is derived from 'Bish' (20) and 'Noi' (9), representing the 29 principles taught by the Guru.
        </p>
        <p className="opacity-80">
          Central to their faith is the sanctity of all living beings. "Pran jahi par vachan na jahi" — which translates to "let the head be severed, but save the tree" — is not just a quote but a way of life that they havehistorically demonstrated through immense sacrifice.
        </p>
        <p className="opacity-80">
          In 1730, 363 Bishnois, led by Amrita Devi, sacrificed their lives to protect the Khejri trees of their village from being felled by the King's soldiers. This legendary event remains a cornerstone of their cultural identity and global recognition for environmentalism.
        </p>
        <div className="h-40 w-full bg-bishnoi-brown/5 rounded-[40px] flex items-center justify-center border border-bishnoi-brown/10 p-8 text-center text-bishnoi-brown/40 text-sm italic">
          "Nature is not a resource to be consumed, but a sacred heritage to be protected for future generations."
        </div>
        <p className="opacity-80">
          Today, the Bishnoi villages are like green oases in the desert, where deer roam freely and trees grow tall, protected by a community that treats nature with divine reverence.
        </p>
      </div>

      {/* Audio Player Controls */}
      <div className="bg-white border-t border-bishnoi-brown/10 p-8 pb-12 space-y-6 shadow-2xl shadow-bishnoi-brown/20 rounded-t-[48px]">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="relative h-1.5 w-full bg-bishnoi-brown/10 rounded-full overflow-hidden">
            <motion.div 
              className="absolute top-0 left-0 h-full bg-bishnoi-earth"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-bold tracking-widest text-bishnoi-brown/40 uppercase">
            <span>04:12</span>
            <span>12:45</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-10">
          <button className="text-bishnoi-brown/40 hover:text-bishnoi-earth transition-colors">
            <SkipBack size={24} fill="currentColor" />
          </button>
          
          <button 
            onClick={handleAiNarrate}
            disabled={isAiLoading}
            className="w-20 h-20 bg-bishnoi-earth rounded-full flex items-center justify-center text-white shadow-xl shadow-bishnoi-earth/30 active:scale-95 transition-transform disabled:opacity-50"
          >
            {isAiLoading ? (
              <Loader2 size={32} className="animate-spin text-white" />
            ) : isPlaying ? (
              <Pause size={32} fill="currentColor" />
            ) : (
              <Play size={32} fill="currentColor" className="ml-1" />
            )}
          </button>

          <button className="text-bishnoi-brown/40 hover:text-bishnoi-earth transition-colors">
            <SkipForward size={24} fill="currentColor" />
          </button>
        </div>

        {/* Secondary controls */}
        <div className="flex justify-around items-center pt-2 text-bishnoi-brown/30">
          <button className="hover:text-bishnoi-earth transition-colors"><Volume2 size={20} /></button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-bishnoi-earth">AI Narrate</span>
            <span className="text-[8px] font-bold text-bishnoi-brown/20 uppercase tracking-widest">OpenRouter Online</span>
          </div>
          <button className="hover:text-bishnoi-earth transition-colors"><Bell size={20} /></button>
        </div>
      </div>
    </div>
  );
}


function GalleryPage() {
  const images = [
    { id: 1, url: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07', title: 'Desert Morning' },
    { id: 2, url: 'https://images.unsplash.com/photo-1542332213-31f87348057f', title: 'Sacred Blackbuck' },
    { id: 3, url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470', title: 'Golden Hour' },
    { id: 4, url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e', title: 'Khejri Canopy' },
    { id: 5, url: 'https://images.unsplash.com/photo-1500622397079-49d9cb046467', title: 'Arid Heritage' },
    { id: 6, url: 'https://images.unsplash.com/photo-1533044109260-261545625c27', title: 'Traditional Patterns' },
  ];

  return (
    <div className="space-y-8 px-6 pt-12 text-bishnoi-brown">
      <header>
        <h2 className="text-4xl font-serif font-bold">Gallery</h2>
        <p className="text-bishnoi-brown/40 font-medium uppercase tracking-widest text-[10px] mt-2">Cultural Moments</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        {images.map((image, index) => (
          <motion.div 
            key={image.id}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            className="group relative aspect-[4/5] rounded-3xl overflow-hidden shadow-sm border border-bishnoi-brown/5 bg-white/10"
          >
            <img 
              src={`${image.url}?auto=format&fit=crop&q=80&w=600`}
              alt={image.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bishnoi-brown/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
              <span className="text-white text-[10px] font-bold tracking-widest uppercase">{image.title}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ProfilePage({ onLogout }: { onLogout: () => void }) {
  const stats = [
    { label: 'Books Read', value: '12', icon: BookOpen },
    { label: 'Moments Share', value: '45', icon: ImageIcon },
    { label: 'Niyam Followed', value: '29', icon: Heart },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const user = auth.currentUser;

  return (
    <div className="space-y-8 px-6 pt-12 pb-10 text-bishnoi-brown">
      <header className="flex justify-between items-start">
        <div className="space-y-1">
          <h2 className="text-4xl font-serif font-bold">Profile</h2>
          <p className="text-bishnoi-brown/40 font-medium uppercase tracking-widest text-[10px]">Your Connection</p>
        </div>
        <button onClick={handleLogout} className="p-3 bg-white rounded-2xl shadow-sm border border-bishnoi-brown/5 text-bishnoi-red active:scale-90 transition-transform">
          <LogOut size={20} />
        </button>
      </header>

      {/* Profile Header */}
      <div className="bg-white/40 border border-bishnoi-brown/10 rounded-[40px] p-8 flex flex-col items-center text-center space-y-4">
        <div className="w-24 h-24 rounded-full border-2 border-bishnoi-green p-1">
          <div className="w-full h-full rounded-full bg-bishnoi-green/10 flex items-center justify-center text-bishnoi-green overflow-hidden">
            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Profile" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <User size={40} />
            )}
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-serif font-bold">{user?.displayName || 'Seeker'}</h3>
          <p className="text-sm text-bishnoi-brown/40 font-medium tracking-wide">{user?.email}</p>
        </div>
        <div className="flex gap-2 items-center text-bishnoi-green bg-bishnoi-green/5 px-4 py-1.5 rounded-full border border-bishnoi-green/10">
          <ShieldCheck size={14} />
          <span className="text-[10px] font-bold tracking-widest uppercase">
            {user?.emailVerified ? 'Verified follower' : 'Awaiting alignment'}
          </span>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white/40 border border-bishnoi-brown/5 rounded-3xl p-4 flex flex-col items-center gap-2 text-center shadow-sm">
              <div className="p-2 bg-bishnoi-brown/5 rounded-xl text-bishnoi-brown/60">
                <Icon size={18} />
              </div>
              <span className="text-lg font-serif font-bold leading-none">{stat.value}</span>
              <span className="text-[8px] font-bold text-bishnoi-brown/30 uppercase tracking-widest">{stat.label}</span>
            </div>
          );
        })}
      </div>

      {/* Settings Sections */}
      <div className="space-y-4">
        <h4 className="text-xs font-serif font-bold text-bishnoi-brown/30 uppercase tracking-[4px] ml-4">Preferences</h4>
        <div className="bg-white/40 border border-bishnoi-brown/10 rounded-[32px] overflow-hidden">
          <ProfileLink icon={<User size={18} />} label="Personal Information" />
          <ProfileLink icon={<Mail size={18} />} label="Email Preferences" />
          <ProfileLink icon={<Bell size={18} />} label="Notifications" />
          <ProfileLink icon={<MapPin size={18} />} label="Location" last />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-serif font-bold text-bishnoi-brown/30 uppercase tracking-[4px] ml-4">Account</h4>
        <div className="bg-white/40 border border-bishnoi-brown/10 rounded-[32px] overflow-hidden">
          <ProfileLink icon={<ShieldCheck size={18} />} label="Privacy & Security" />
          <ProfileLink icon={<Settings size={18} />} label="App Settings" last />
        </div>
      </div>
    </div>
  );
}

function ProfileLink({ icon, label, last }: { icon: ReactNode, label: string, last?: boolean }) {
  return (
    <button className={`w-full px-6 py-5 flex items-center justify-between group active:bg-bishnoi-earth/10 transition-colors ${!last ? 'border-b border-bishnoi-brown/5' : ''}`}>
      <div className="flex items-center gap-4">
        <div className="text-bishnoi-brown/40 group-hover:text-bishnoi-brown transition-colors">
          {icon}
        </div>
        <span className="text-sm font-medium tracking-wide">{label}</span>
      </div>
      <ChevronRight size={16} className="text-bishnoi-brown/20 group-hover:text-bishnoi-brown transition-colors" />
    </button>
  );
}

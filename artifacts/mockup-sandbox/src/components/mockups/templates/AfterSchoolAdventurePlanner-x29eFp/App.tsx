import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Palette, Code2, Trees, Drama, ChefHat, Music, Puzzle,
  Clock, Users, X, Check, ArrowRight, CalendarDays, Sun
} from 'lucide-react';

const CHILDREN = [
  { id: 'maya', name: 'Maya', age: 7, color: '#FF6B4A', initial: 'M' },
  { id: 'theo', name: 'Theo', age: 9, color: '#5B9BD5', initial: 'T' },
];

const CATEGORIES = [
  { id: 'all', label: 'Everything' },
  { id: 'create', label: 'Make & Create' },
  { id: 'move', label: 'Move & Play' },
  { id: 'think', label: 'Think & Build' },
  { id: 'outside', label: 'Outdoors' },
];

const ACTIVITIES = [
  { id: 'pottery', name: 'Mudslingers Pottery', day: 'Mon', time: '3:30 – 4:45', cat: 'create', icon: Palette, instructor: 'Ms. Reyes', spots: 3, price: 18, ages: '6–10', color: '#FF6B4A', bg: '#FFE9E2' },
  { id: 'chess', name: 'Knights & Pawns Chess', day: 'Mon', time: '4:00 – 5:00', cat: 'think', icon: Puzzle, instructor: 'Mr. Okafor', spots: 8, price: 12, ages: '7–12', color: '#9B6BB3', bg: '#F1E7F7' },
  { id: 'forest', name: 'Forest Explorers', day: 'Tue', time: '3:30 – 5:00', cat: 'outside', icon: Trees, instructor: 'Coach Lena', spots: 5, price: 16, ages: '5–11', color: '#7BA05B', bg: '#E9F1E0' },
  { id: 'coding', name: 'Scratch Coding Club', day: 'Tue', time: '4:00 – 5:15', cat: 'think', icon: Code2, instructor: 'Mr. Patel', spots: 2, price: 20, ages: '8–12', color: '#5B9BD5', bg: '#E3EEF9' },
  { id: 'drama', name: 'Big Feelings Drama', day: 'Wed', time: '3:30 – 4:45', cat: 'create', icon: Drama, instructor: 'Ms. Calloway', spots: 6, price: 15, ages: '6–11', color: '#F2B43A', bg: '#FBF0D8' },
  { id: 'cooking', name: 'Tiny Chefs Kitchen', day: 'Wed', time: '4:00 – 5:30', cat: 'create', icon: ChefHat, instructor: 'Chef Marco', spots: 1, price: 22, ages: '7–12', color: '#FF6B4A', bg: '#FFE9E2' },
  { id: 'parkour', name: 'Playground Parkour', day: 'Thu', time: '3:30 – 4:30', cat: 'move', icon: Sparkles, instructor: 'Coach Dre', spots: 7, price: 14, ages: '6–10', color: '#7BA05B', bg: '#E9F1E0' },
  { id: 'ukulele', name: 'Ukulele Jam Squad', day: 'Thu', time: '4:30 – 5:30', cat: 'create', icon: Music, instructor: 'Ms. Watanabe', spots: 4, price: 17, ages: '6–12', color: '#9B6BB3', bg: '#F1E7F7' },
  { id: 'garden', name: 'Garden & Grub Club', day: 'Fri', time: '3:30 – 4:45', cat: 'outside', icon: Sun, instructor: 'Ms. Hollis', spots: 9, price: 13, ages: '5–10', color: '#F2B43A', bg: '#FBF0D8' },
  { id: 'lego', name: 'LEGO Robotics Lab', day: 'Fri', time: '4:00 – 5:30', cat: 'think', icon: Puzzle, instructor: 'Mr. Linden', spots: 3, price: 21, ages: '8–12', color: '#5B9BD5', bg: '#E3EEF9' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const DAY_LABELS = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday' };

export default function App() {
  const [activeChild, setActiveChild] = useState('maya');
  const [filter, setFilter] = useState('all');
  const [bookings, setBookings] = useState([
    { activityId: 'forest', childId: 'maya' },
    { activityId: 'coding', childId: 'theo' },
  ]);
  const [confirmed, setConfirmed] = useState(false);

  const isBooked = (activityId, childId) =>
    bookings.some((b) => b.activityId === activityId && b.childId === childId);

  const toggleBooking = (activityId) => {
    setConfirmed(false);
    setBookings((prev) => {
      const exists = prev.find((b) => b.activityId === activityId && b.childId === activeChild);
      if (exists) return prev.filter((b) => !(b.activityId === activityId && b.childId === activeChild));
      return [...prev, { activityId, childId: activeChild }];
    });
  };

  const filtered = useMemo(
    () => ACTIVITIES.filter((a) => filter === 'all' || a.cat === filter),
    [filter]
  );

  const subtotal = bookings.reduce((sum, b) => {
    const act = ACTIVITIES.find((a) => a.id === b.activityId);
    return sum + (act ? act.price * 11 : 0);
  }, 0);

  const bothChildrenBooked = new Set(bookings.map((b) => b.childId)).size > 1;
  const siblingDiscount = bothChildrenBooked ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal - siblingDiscount;

  const child = CHILDREN.find((c) => c.id === activeChild);

  return (
    <div className="min-h-screen bg-[#FAF6EF] text-[#2A2520]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,900&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: `
        .font-display { font-family: 'Fraunces', serif; }
        .paper-texture {
          background-image: radial-gradient(#E8E0D0 1px, transparent 1px);
          background-size: 22px 22px;
        }
        .squiggle { position: relative; display: inline-block; }
        .squiggle::after {
          content: ''; position: absolute; left: 0; right: 0; bottom: -6px; height: 8px;
          background: url("data:image/svg+xml,%3Csvg width='80' height='8' viewBox='0 0 80 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 5 Q 10 0, 20 5 T 40 5 T 60 5 T 80 5' stroke='%23F2B43A' stroke-width='3' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") repeat-x;
          background-size: 80px 8px;
        }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D9CFBC; border-radius: 8px; }
      `}} />

      {/* Header */}
      <header className="border-b-2 border-[#2A2520] bg-[#FAF6EF] sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2A2520] flex items-center justify-center rotate-[-6deg]">
              <Sun className="w-5 h-5 text-[#F2B43A]" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-display font-black text-xl leading-none tracking-tight">Pinecone Club</div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-[#8A8070] font-semibold mt-0.5">After-school programs</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-[#6B6354]">
            <CalendarDays className="w-4 h-4" />
            <span className="font-medium">Spring Term · Apr 7 – Jun 20 · 11 weeks</span>
          </div>
          <button className="bg-[#2A2520] text-[#FAF6EF] text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#FF6B4A] transition-colors">
            Parent portal
          </button>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 pt-10 pb-20">
        {/* Hero */}
        <div className="mb-10">
          <h1 className="font-display font-black text-[clamp(2.2rem,4.5vw,3.6rem)] leading-[1.05] tracking-tight max-w-2xl">
            Pick the afternoons<br />they'll <span className="squiggle">talk about at dinner.</span>
          </h1>
          <p className="mt-5 text-[#6B6354] max-w-lg text-[15px] leading-relaxed">
            Tap a session to add it to your week. Booking covers all 11 weeks of term — snacks, materials, and the inevitable glitter included.
          </p>
        </div>

        {/* Child + filter row */}
        <div className="flex flex-wrap items-center gap-6 mb-8">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-[0.15em] font-bold text-[#8A8070]">Booking for</span>
            <div className="flex gap-2">
              {CHILDREN.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveChild(c.id)}
                  className={`flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full border-2 transition-all ${
                    activeChild === c.id ? 'border-[#2A2520] bg-white shadow-[3px_3px_0_#2A2520]' : 'border-[#D9CFBC] bg-transparent hover:border-[#2A2520]'
                  }`}
                >
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: c.color }}>
                    {c.initial}
                  </span>
                  <span className="text-sm font-semibold">{c.name}<span className="text-[#8A8070] font-medium"> · {c.age}</span></span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-6 w-px bg-[#D9CFBC] hidden sm:block" />

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                className={`text-sm font-semibold px-4 py-1.5 rounded-full transition-all ${
                  filter === cat.id ? 'bg-[#2A2520] text-[#FAF6EF]' : 'bg-transparent text-[#6B6354] hover:bg-[#EFE7D8]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
          {/* Schedule grid */}
          <div className="paper-texture rounded-3xl border-2 border-[#2A2520] bg-[#FFFDF8] p-5 overflow-x-auto">
            <div className="grid grid-cols-5 gap-4 min-w-[820px]">
              {DAYS.map((day) => {
                const dayActivities = filtered.filter((a) => a.day === day);
                return (
                  <div key={day}>
                    <div className="mb-3 px-1">
                      <div className="font-display font-bold text-lg">{DAY_LABELS[day]}</div>
                      <div className="text-[11px] uppercase tracking-[0.12em] text-[#8A8070] font-semibold">
                        {dayActivities.length} session{dayActivities.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="space-y-3">
                      {dayActivities.length === 0 && (
                        <div className="rounded-2xl border-2 border-dashed border-[#D9CFBC] py-10 text-center text-xs text-[#A39A87] font-medium">
                          Nothing here<br />for this filter
                        </div>
                      )}
                      {dayActivities.map((act) => {
                        const Icon = act.icon;
                        const bookedForActive = isBooked(act.id, activeChild);
                        const otherChild = CHILDREN.find((c) => c.id !== activeChild);
                        const bookedForOther = isBooked(act.id, otherChild.id);
                        const full = act.spots <= 1;
                        return (
                          <motion.button
                            key={act.id}
                            whileHover={{ y: -3 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => toggleBooking(act.id)}
                            className={`w-full text-left rounded-2xl border-2 p-4 transition-shadow relative ${
                              bookedForActive
                                ? 'border-[#2A2520] shadow-[4px_4px_0_#2A2520]'
                                : 'border-[#2A2520]/15 hover:border-[#2A2520] hover:shadow-[4px_4px_0_rgba(42,37,32,0.15)]'
                            }`}
                            style={{ backgroundColor: act.bg }}
                          >
                            <div className="flex items-start justify-between mb-2.5">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: act.color }}>
                                <Icon className="w-[18px] h-[18px] text-white" strokeWidth={2.25} />
                              </div>
                              <AnimatePresence>
                                {bookedForActive && (
                                  <motion.div
                                    initial={{ scale: 0, rotate: -30 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0 }}
                                    className="w-6 h-6 rounded-full bg-[#2A2520] flex items-center justify-center"
                                  >
                                    <Check className="w-3.5 h-3.5 text-[#FAF6EF]" strokeWidth={3} />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                            <div className="font-display font-bold text-[15px] leading-tight mb-1">{act.name}</div>
                            <div className="flex items-center gap-1.5 text-[12px] text-[#6B6354] font-medium mb-2">
                              <Clock className="w-3 h-3" /> {act.time}
                            </div>
                            <div className="text-[12px] text-[#6B6354]">
                              {act.instructor} · ages {act.ages}
                            </div>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2A2520]/10">
                              <span className={`text-[11px] font-bold flex items-center gap-1 ${full ? 'text-[#D14B2A]' : 'text-[#6B6354]'}`}>
                                <Users className="w-3 h-3" />
                                {full ? `Only ${act.spots} spot left!` : `${act.spots} spots left`}
                              </span>
                              <span className="text-[13px] font-bold">${act.price}<span className="text-[#8A8070] font-medium">/wk</span></span>
                            </div>
                            {bookedForOther && (
                              <div
                                className="absolute -top-2 -left-2 w-6 h-6 rounded-full border-2 border-[#FFFDF8] flex items-center justify-center text-[10px] font-bold text-white"
                                style={{ backgroundColor: otherChild.color }}
                                title={`Booked for ${otherChild.name}`}
                              >
                                {otherChild.initial}
                              </div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Booking summary */}
          <div className="lg:sticky lg:top-24 rounded-3xl border-2 border-[#2A2520] bg-[#2A2520] text-[#FAF6EF] p-6 shadow-[6px_6px_0_#F2B43A]">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-display font-bold text-2xl">Your week</h2>
              <span className="text-xs font-semibold bg-[#FAF6EF]/10 px-3 py-1 rounded-full">
                {bookings.length} session{bookings.length !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-[13px] text-[#FAF6EF]/55 mb-5">Spring term · billed weekly for 11 weeks</p>

            <div className="space-y-2.5 mb-5 max-h-[300px] overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {bookings.length === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-[#FAF6EF]/50 border border-dashed border-[#FAF6EF]/25 rounded-2xl p-5 text-center">
                    No sessions yet — tap a card to add one for {child.name}.
                  </motion.div>
                )}
                {bookings.map((b) => {
                  const act = ACTIVITIES.find((a) => a.id === b.activityId);
                  const c = CHILDREN.find((ch) => ch.id === b.childId);
                  if (!act) return null;
                  return (
                    <motion.div
                      key={`${b.activityId}-${b.childId}`}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                      className="flex items-center gap-3 bg-[#FAF6EF]/[0.07] rounded-2xl p-3"
                    >
                      <span className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ backgroundColor: c.color }}>
                        {c.initial}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold truncate">{act.name}</div>
                        <div className="text-[11px] text-[#FAF6EF]/50">{act.day} · {act.time}</div>
                      </div>
                      <div className="text-[13px] font-bold">${act.price * 11}</div>
                      <button
                        onClick={() => setBookings((prev) => prev.filter((x) => !(x.activityId === b.activityId && x.childId === b.childId)))}
                        className="text-[#FAF6EF]/40 hover:text-[#FF6B4A] transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <div className="space-y-2 text-sm border-t border-[#FAF6EF]/15 pt-4 mb-5">
              <div className="flex justify-between text-[#FAF6EF]/70">
                <span>Term subtotal</span><span>${subtotal}</span>
              </div>
              <div className={`flex justify-between ${bothChildrenBooked ? 'text-[#F2B43A]' : 'text-[#FAF6EF]/35'}`}>
                <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Sibling discount (10%)</span>
                <span>{bothChildrenBooked ? `–$${siblingDiscount}` : '—'}</span>
              </div>
              <div className="flex justify-between font-display font-bold text-xl pt-2">
                <span>Total</span><span>${total}</span>
              </div>
            </div>

            <button
              onClick={() => bookings.length && setConfirmed(true)}
              disabled={!bookings.length}
              className="w-full bg-[#FF6B4A] disabled:bg-[#FAF6EF]/15 disabled:text-[#FAF6EF]/40 text-[#2A2520] disabled:cursor-not-allowed font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#F2B43A] transition-colors"
            >
              {confirmed ? (
                <><Check className="w-5 h-5" strokeWidth={2.5} /> Spots reserved!</>
              ) : (
                <>Reserve these spots <ArrowRight className="w-4 h-4" strokeWidth={2.5} /></>
              )}
            </button>
            <p className="text-[11px] text-center text-[#FAF6EF]/40 mt-3">
              Free cancellation up to 7 days before term starts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
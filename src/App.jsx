import React, { useState, useEffect } from "react";
import { db } from './lib/supabase';

// Enhanced Telegram WebApp integration
const getTelegramWebApp = () => {
  if (typeof window === 'undefined') return null;
  
  // Wait for Telegram WebApp to be ready
  const tg = window.Telegram?.WebApp;
  if (tg) {
    try {
      tg.ready();
      tg.expand();
      console.log('Telegram WebApp initialized:', {
        initData: tg.initData ? 'present' : 'missing',
        initDataUnsafe: tg.initDataUnsafe ? 'present' : 'missing',
        user: tg.initDataUnsafe?.user ? 'present' : 'missing',
        userId: tg.initDataUnsafe?.user?.id || 'missing'
      });
    } catch (e) {
      console.warn('Telegram WebApp initialization error:', e);
    }
  }
  return tg;
};

const tg = getTelegramWebApp();

// Get user ID with multiple fallbacks
const getUserId = () => {
  try {
    // Primary: Telegram WebApp user ID
    if (tg?.initDataUnsafe?.user?.id) {
      return tg.initDataUnsafe.user.id;
    }
    
    // Fallback: Check URL parameters
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const userId = urlParams.get('user_id') || urlParams.get('userId');
      if (userId) return parseInt(userId);
    }
    
    // Demo mode: Use a demo user ID for testing
    console.warn('No Telegram user ID found, using demo mode');
    return 12345678; // Demo user ID
  } catch (e) {
    console.error('Error getting user ID:', e);
    return 12345678; // Demo fallback
  }
};

// Get user data with fallbacks
const getUserData = () => {
  const userId = getUserId();
  return {
    id: userId,
    username: tg?.initDataUnsafe?.user?.username || 'demo_user',
    first_name: tg?.initDataUnsafe?.user?.first_name || 'Demo',
    last_name: tg?.initDataUnsafe?.user?.last_name || 'User'
  };
};

// === THEME ===
const ACCENT = "#C6FF3E";
const BG = "#0F1115";
const CARD = "#161922";
const BORDER = "#23283C";

// === INLINE ICONS (no external deps) ===
const IconCheck = ({ size = 16, color = "currentColor" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 6L9 17l-5-5" />
  </svg>
);
const IconChevronLeft = ({ size = 20, color = "currentColor" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M15 18l-6-6 6-6" />
  </svg>
);
const IconChevronDown = ({ size = 20, color = "currentColor" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M6 9l6 6 6-6" />
  </svg>
);
const IconTicket = ({ size = 18, color = "currentColor" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 9a3 3 0 0 1 3-3h12v3a2 2 0 0 0 0 6v3H6a3 3 0 0 1-3-3z" />
  </svg>
);
const IconUSDT = ({ size = 14 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
    <circle cx="12" cy="12" r="10" fill="#26A17B" />
    <path d="M7 7.5h10v2H13v2.2c2.9.1 5 .6 5 1.3 0 .7-2.1 1.2-5 1.3V17h-2v-2.7c-2.9-.1-5-.6-5-1.3 0-.7 2.1-1.2 5-1.3V9.5H7v-2z" fill="#fff" />
  </svg>
);
const IconTelegram = ({ size = 20 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden fill="currentColor">
    <path d="M9.54 15.17 9.4 18.7c.36 0 .52-.16.7-.34l1.68-1.6 3.48 2.55c.64.36 1.1.18 1.28-.6l2.32-10.9c.24-.98-.36-1.36-1-.1L6.02 13.6c-.94.38-.92.92-.16 1.16l3.68 1.16 8.52-5.38c.4-.24.76-.1.46.16l-9.98 4.47Z"/>
  </svg>
);
const IconXAlt = ({ size = 20 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden fill="currentColor">
    <path d="M3 3h4.6l5.02 6.74L17.8 3H21l-7.06 9.18L21 21h-4.6l-5.18-6.96L6.2 21H3l7.34-9.6L3 3Z"/>
  </svg>
);
const IconBear = ({ size = 20 }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
    <defs>
      <linearGradient id="bgrad" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stopColor="#2dd3ff"/>
        <stop offset="100%" stopColor="#0066ff"/>
      </linearGradient>
    </defs>
    <g fill="url(#bgrad)">
      <path d="M19 17a7 7 0 0 1 9-5c2 1 3 3 4 5c1-2 2-4 4-5a7 7 0 0 1 9 5c3 2 6 6 6 11c0 9-8 17-23 17S6 37 6 28c0-5 3-9 6-11z"/>
      <circle cx="20" cy="14" r="5"/><circle cx="44" cy="14" r="5"/>
    </g>
    <rect x="20" y="26" width="24" height="6" rx="3" fill="#0b1a2e"/>
    <g transform="translate(32,38)"><circle r="8" fill="#0b1a2e"/><path d="M-2 -4 L4 0 L-2 4 Z" fill="url(#bgrad)"/></g>
    <path d="M40 24c0 2-2 3-4 3s-4-1-4-3" fill="none" stroke="#0b1a2e" strokeWidth="2"/>
  </svg>
);

// === PRIMITIVES ===
const IconDot = () => (
  <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 999, background: ACCENT }} />
);

function TopBar({ title, onBack, showBack = false, showRight = false, extraRight = null }) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 16px 12px",
        background: BG,
      }}
    >
      <div style={{ width: 40 }}>
        {showBack && (
          <button
            onClick={onBack}
            aria-label="Back"
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              background: "#1a2030",
              border: `1px solid ${BORDER}`,
            }}
          >
            <IconChevronLeft />
          </button>
        )}
      </div>

      <div style={{ color: "#fff", fontSize: 18, fontWeight: 800, textAlign: "center", flex: 1 }}>
        {title}
      </div>

      <div style={{ width: 40, textAlign: "right" }}>
        {showRight ? (extraRight || <IconChevronDown color="rgba(255,255,255,.6)" />) : null}
      </div>
    </div>
  );
}

function Badge({ children }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "2px 8px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: ACCENT + "22", color: "#EAFEE0", border: `1px solid ${ACCENT}55` }}>
      {children}
    </span>
  );
}
function NeonButton({ children, onClick, disabled = false }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: 0, background: disabled ? "#2A2E3E" : ACCENT, color: disabled ? "#95A0B5" : "#0C0F14", fontWeight: 800, boxShadow: disabled ? "none" : "0 0 24px rgba(198,255,62,.2)" }}>
      {children}
    </button>
  );
}
function SectionTitle({ children }) {
  return <div style={{ color: "rgba(255,255,255,.9)", fontWeight: 700, fontSize: 14, margin: 16 }}>{children}</div>;
}

function TaskItem({ icon, title, reward, onClick, iconBg = ACCENT, iconColor = "#0C0F14" }) {
  return (
    <button onClick={onClick} style={{ width: "100%", textAlign: "left", background: "transparent", border: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: CARD, borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", background: iconBg, color: iconColor }}>{icon}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "#fff", fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
            {reward ? <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>{reward}</div> : null}
          </div>
        </div>
        <div style={{ transform: "rotate(-90deg)" }}><IconChevronDown color="rgba(255,255,255,.5)" /></div>
      </div>
    </button>
  );
}

// === HOME (3x3 DAILY CHECK-IN) ===
function HomeScreen() {
  const rewards = [0.002, 0.004, 0.006, 0.008, 0.01, 0.012, 0.014, 0.016, 0.018];
  const [claimStatus, setClaimStatus] = useState({ canClaim: false, nextDay: 1, alreadyClaimed: false });
  const [userStats, setUserStats] = useState({ balance: 0, total_earned: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError('');
      const userId = getUserId();
      console.log('Loading data for user:', userId);

      const [status, stats] = await Promise.all([
        db.getDailyClaimStatus(userId),
        db.getUserStats(userId)
      ]);

      setClaimStatus(status);
      setUserStats(stats);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load data: ' + error.message);
      // Set demo data on error
      setClaimStatus({ canClaim: true, nextDay: 1, alreadyClaimed: false });
      setUserStats({ balance: 0, total_earned: 0 });
    }
  };

  const claim = async () => {
    if (busy || !claimStatus.canClaim) return;
    setBusy(true);
    setError('');
    
    try {
      const userId = getUserId();
      console.log('Claiming reward for user:', userId);

      const result = await db.claimDailyReward(userId);
      await loadData(); // Refresh data
      
      // Show success message
      if (tg?.showAlert) {
        tg.showAlert(`✅ Claimed ${result.amount} USDT for day ${result.day}!`);
      }
    } catch (error) {
      console.error('Claim failed:', error);
      setError('Claim failed: ' + error.message);
      if (tg?.showAlert) {
        tg.showAlert('❌ Claim failed: ' + error.message);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: "100dvh", background: BG }}>
      <TopBar title="Daily reward" />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>
        {error && (
          <div style={{ background: '#ff4444', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}
        
        {/* Balance Display */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 16, marginBottom: 16, textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: 14, color: '#C7CCDA', marginBottom: 4 }}>Your Balance</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: ACCENT }}>{userStats.balance?.toFixed(6) || '0.000000'} USDT</div>
          <div style={{ fontSize: 12, color: '#95A0B5', marginTop: 4 }}>Total Earned: {userStats.total_earned?.toFixed(6) || '0.000000'} USDT</div>
        </div>

        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 10, color: "#fff" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 8 }}>
            {rewards.map((amt, i) => {
              const d = i + 1;
              const isPast = d < claimStatus.nextDay;
              const isToday = d === claimStatus.nextDay && claimStatus.canClaim;
              const isClaimed = d === claimStatus.nextDay && claimStatus.alreadyClaimed;
              return (
                <div key={d} style={{ position: "relative", width: "100%", paddingTop: "78%" }}>
                  <div style={{ position: "absolute", inset: 0, padding: 6 }}>
                    <div style={{ border: `1px solid ${(isToday || isClaimed) ? ACCENT : "#202538"}`, background: (isToday || isClaimed) ? "linear-gradient(135deg, rgba(198,255,62,.12), rgba(198,255,62,.04))" : "#11141C", borderRadius: 12, width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: (isToday || isClaimed) ? `inset 0 0 0 1px ${ACCENT}55, 0 0 16px ${ACCENT}22` : "none" }}>
                      <div style={{ fontSize: 11, color: "#C7CCDA", marginBottom: 2 }}>Day {d}</div>
                      <div style={{ marginBottom: 4 }}>
                        <div style={{ width: 18, height: 18, borderRadius: 999, background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {(isPast || isClaimed) ? <IconCheck size={11} color="#0C0F14" /> : <span style={{ color: "#0C0F14", fontSize: 11, lineHeight: "18px", fontWeight: 800 }}>♠</span>}
                        </div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 800 }}>{amt.toFixed(3)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <button onClick={claim} disabled={busy || !claimStatus.canClaim} style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: 0, background: (busy || !claimStatus.canClaim) ? "#2A2E3E" : ACCENT, color: (busy || !claimStatus.canClaim) ? "#95A0B5" : "#0C0F14", fontWeight: 800 }}>
              {claimStatus.alreadyClaimed ? "Claimed Today" : claimStatus.nextDay <= 9 ? (busy ? "Processing…" : "Claim Day " + claimStatus.nextDay) : "Completed"}
            </button>
          </div>
        </div>
      </div>
      <div style={{ height: 96 }} />
    </div>
  );
}

// === EARN ===
function EarnScreen() {
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [sheet, setSheet] = useState({ open: false, kind: null, step: "join" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setError('');
      const userId = getUserId();
      console.log('Loading tasks for user:', userId);

      const [allTasks, userCompletions] = await Promise.all([
        db.getTasks(),
        db.getUserTaskCompletions(userId)
      ]);

      setTasks(allTasks);
      setCompletedTasks(userCompletions);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      setError('Failed to load tasks: ' + error.message);
    }
  };

  const open = (kind) => setSheet({ open: true, kind, step: "join" });
  const close = () => setSheet({ open: false, kind: null, step: "join" });

  const onPrimary = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    
    try {
      const userId = getUserId();
      console.log('Processing task for user:', userId);

      if (sheet.step === "join") {
        // Open the task URL
        const task = tasks.find(t => t.id === sheet.kind);
        if (task) {
          window.open(task.url, "_blank");
          setSheet((s) => ({ ...s, step: "check" }));
        }
      } else {
        // Complete the task
        const result = await db.completeTask(userId, sheet.kind);
        
        if (tg?.showAlert) {
          tg.showAlert(`✅ Task completed! Earned ${result.reward} USDT`);
        }
        
        await loadTasks(); // Refresh tasks
        close();
      }
    } catch (e) {
      console.error('Task error:', e);
      setError('Task error: ' + e.message);
      if (tg?.showAlert) {
        tg.showAlert('❌ Error: ' + e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const currentTask = tasks.find(t => t.id === sheet.kind);
  const isCompleted = (taskId) => completedTasks.some(c => c.task_id === taskId);
  const canComplete = (task) => {
    if (task.max_completions === 1) {
      return !isCompleted(task.id);
    }
    return true; // Unlimited tasks
  };

  const getTaskIcon = (task) => {
    if (task.type === 'ads') return <IconBear />;
    if (task.url.includes('twitter') || task.url.includes('x.com')) return <IconXAlt />;
    if (task.url.includes('telegram') || task.url.includes('t.me')) return <IconTelegram />;
    if (task.url.includes('tiktok')) return <IconTicket />;
    return <IconTicket />;
  };

  return (
    <div style={{ minHeight: "100dvh", background: BG }}>
      <TopBar title="Tasks" />
      
      {error && (
        <div style={{ margin: 16, background: '#ff4444', color: '#fff', padding: 12, borderRadius: 8, fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Ads Tasks */}
      {tasks.filter(t => t.type === 'ads').length > 0 && (
        <>
          <SectionTitle>Advertisement Tasks</SectionTitle>
          <div style={{ margin: 16, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
            {tasks.filter(t => t.type === 'ads').map(task => (
              <TaskItem 
                key={task.id}
                onClick={() => canComplete(task) ? open(task.id) : null} 
                iconBg={task.icon_bg} 
                iconColor={task.icon_color} 
                icon={getTaskIcon(task)} 
                title={task.title} 
                reward={<Badge><IconUSDT /> {task.reward}</Badge>} 
              />
            ))}
          </div>
        </>
      )}

      {/* Follow Tasks */}
      {tasks.filter(t => t.type === 'follow').length > 0 && (
        <>
          <SectionTitle>Follow Tasks</SectionTitle>
          <div style={{ margin: 16, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
            {tasks.filter(t => t.type === 'follow').map(task => (
              <TaskItem 
                key={task.id}
                onClick={() => canComplete(task) ? open(task.id) : null} 
                iconBg={task.icon_bg} 
                iconColor={task.icon_color} 
                icon={getTaskIcon(task)} 
                title={isCompleted(task.id) ? `${task.title} ✓` : task.title} 
                reward={<Badge><IconUSDT /> {task.reward}</Badge>} 
              />
            ))}
          </div>
        </>
      )}

      {/* Partner Tasks */}
      {tasks.filter(t => t.type === 'partner').length > 0 && (
        <>
          <SectionTitle>Partner Tasks</SectionTitle>
          <div style={{ margin: 16, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
            {tasks.filter(t => t.type === 'partner').map(task => (
              <TaskItem 
                key={task.id}
                onClick={() => canComplete(task) ? open(task.id) : null} 
                iconBg={task.icon_bg} 
                iconColor={task.icon_color} 
                icon={getTaskIcon(task)} 
                title={isCompleted(task.id) ? `${task.title} ✓` : task.title} 
                reward={<Badge><IconUSDT /> {task.reward}</Badge>} 
              />
            ))}
          </div>
        </>
      )}

      {sheet.open && (
        <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "flex-end", zIndex: 50 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", background: BG, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, borderTop: `1px solid ${BORDER}` }}>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
              <div style={{ width: 64, height: 64, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", background: currentTask?.icon_bg || "#222A3A", color: "#fff" }}>
                {currentTask ? getTaskIcon(currentTask) : <IconTicket />}
              </div>
            </div>
            <div style={{ textAlign: "center", color: "#fff", fontSize: 22, fontWeight: 800, marginTop: 12 }}>{currentTask?.title || 'Task'}</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 8, color: "#fff" }}>
              <span style={{ width: 16, height: 16, borderRadius: 999, border: "2px solid #C7CCDA", display: "inline-block" }} />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700 }}><IconUSDT /> {currentTask?.reward || 0}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
              <button onClick={close} style={{ padding: "12px 14px", borderRadius: 12, border: `1px solid ${BORDER}`, background: "#2A2E3E", color: "#E6EAF6", fontWeight: 800 }}>Cancel</button>
              <button onClick={onPrimary} disabled={loading} style={{ padding: "12px 14px", borderRadius: 12, border: 0, background: loading ? "#2A2E3E" : ACCENT, color: loading ? "#95A0B5" : "#0C0F14", fontWeight: 800 }}>
                {loading ? "Processing..." : (sheet.step === "join" ? "Start Task" : "Complete")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: 96 }} />
    </div>
  );
}

// === REFERRAL ===
function FriendsScreen() {
  const [userStats, setUserStats] = useState({ referral_code: '', referralCount: 0 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      const userId = tg?.initDataUnsafe?.user?.id;
      if (!userId) {
        console.warn('No Telegram user ID available');
        return;
      }

      const stats = await db.getUserStats(userId);
      setUserStats(stats);
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const refLink = `https://t.me/${tg?.initDataUnsafe?.start_param || 'YourBot'}?start=${userStats.referral_code}`;
  
  const copy = async () => {
    try { await navigator.clipboard.writeText(refLink); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div style={{ minHeight: "100dvh", background: BG }}>
      <TopBar title="Refer" />
      <div style={{ padding: 16 }}>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 12, color: "#fff", position: "relative" }}>
          <div style={{ position: "absolute", top: 12, right: 12 }}>
            <span style={{ background: ACCENT + "22", border: `1px solid ${ACCENT}55`, color: "#EAFEE0", borderRadius: 999, padding: "3px 7px", fontSize: 11, fontWeight: 800 }}>10%</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>Refer & Earn Forever</div>
          <div style={{ color: "#D6DBEA" }}>Earn <span style={{ color: ACCENT, fontWeight: 800 }}>10%</span> of your friends earnings for life! Follow these simple steps to start:</div>

          <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
            {[
              { title: "1. Copy Your Link", desc: "Grab your unique referral link below." },
              { title: "2. Share with Friends", desc: "Use Telegram, WhatsApp, or X to share your link." },
              { title: "3. Earn Lifetime Rewards", desc: "Get 10% of your friends earnings forever once they join!" },
            ].map((s, idx) => (
              <div key={idx} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 40, height: 40, borderRadius: 999, background: "#2A2E3E", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontWeight: 900, color: "#BFD6A6" }}>{idx + 1}</span>
                </div>
                <div>
                  <div style={{ fontWeight: 800 }}>{s.title}</div>
                  <div style={{ color: "#C7CCDA" }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Your Referral Link</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#0F1220", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "10px 12px" }}>
              <div style={{ color: "#E6EAF6", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{refLink}</div>
              <button onClick={copy} style={{ border: 0, background: ACCENT, color: "#0C0F14", fontWeight: 800, padding: "8px 10px", borderRadius: 10 }}>{copied ? "Copied" : "Copy"}</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
            <button style={{ padding: "8px 10px", borderRadius: 999, background: "#229ED9", color: "#fff", fontSize: 12, fontWeight: 800, border: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <IconTelegram /> Telegram
            </button>
            <button style={{ padding: "8px 10px", borderRadius: 999, background: "#25D366", color: "#0C0F14", fontSize: 12, fontWeight: 800, border: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#0C0F14" d="M17 3H7a4 4 0 0 0-4 4v10a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4V7a4 4 0 0 0-4-4Zm-5 15a5 5 0 1 1 0-10a5 5 0 0 1 0 10Zm0-2.5a2.5 2.5 0 1 0 0-5a2.5 2.5 0 0 0 0 5Z"/></svg>
              WhatsApp
            </button>
            <button style={{ padding: "8px 10px", borderRadius: 999, background: "#0B0B0B", color: "#fff", fontSize: 12, fontWeight: 800, border: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <IconXAlt /> Twitter/X
            </button>
          </div>
        </div>

        <div style={{ marginTop: 16, textAlign: 'center', color: '#C7CCDA' }}>
          <div style={{ fontSize: 14, marginBottom: 4 }}>Your Referrals</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: ACCENT }}>{userStats.referralCount}</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Friends joined through your link</div>
        </div>
      </div>
      <div style={{ height: 96 }} />
    </div>
  );
}

// === WALLET (Withdraw) ===
function WalletScreen() {
  const [userStats, setUserStats] = useState({ balance: 0 });
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [memo, setMemo] = useState("");
  const [network, setNetwork] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      const userId = tg?.initDataUnsafe?.user?.id;
      if (!userId) {
        console.warn('No Telegram user ID available');
        return;
      }

      const stats = await db.getUserStats(userId);
      setUserStats(stats);
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const canContinue = Number(amount) > 0 && address.trim().length > 0;
  const pasteTo = async (setter) => {
    try { const t = await navigator.clipboard.readText(); setter(t); } catch {}
  };
  const setMax = () => setAmount(String(userStats.balance || 0));

  const handleWithdraw = async () => {
    if (loading || !canContinue || !network) return;
    setLoading(true);

    try {
      const userId = tg?.initDataUnsafe?.user?.id;
      if (!userId) {
        throw new Error('No Telegram user ID available');
      }

      const withdrawal = await db.createWithdrawal(
        userId,
        Number(amount),
        address,
        memo,
        network
      );

      if (tg?.showAlert) {
        tg.showAlert(`✅ Withdrawal request submitted! ID: ${withdrawal.id.slice(0, 8)}`);
      }

      // Reset form
      setAmount('');
      setAddress('');
      setMemo('');
      setNetwork('');
      
      await loadUserStats(); // Refresh balance
    } catch (error) {
      console.error('Withdrawal failed:', error);
      if (tg?.showAlert) {
        tg.showAlert('❌ Withdrawal failed: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const fieldWrap = { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 12 };

  return (
    <div style={{ minHeight: "100dvh", background: BG }}>
      <TopBar title="Withdraw" />
      <div style={{ padding: 16 }}>
        {/* Amount */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", color: "#C7CCDA", fontWeight: 700, marginBottom: 8 }}>
          <div>Amount</div>
          <div style={{ fontWeight: 600, color: "#9FB0CE" }}>Available: {userStats.balance?.toFixed(6) || '0.000000'} USDT</div>
        </div>
        <div style={{ ...fieldWrap, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "#0E1726" }}>
              <IconUSDT />
            </div>
            <input type="number" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ flex: 1, outline: "none", border: 0, background: "transparent", color: "#fff", fontSize: 18, fontWeight: 800, paddingRight: 64 }} />
          </div>
          <button onClick={setMax} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", padding: "8px 12px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "#2A2E3E", color: "#E6EAF6", fontWeight: 800 }}>
            Max
          </button>
        </div>

        {/* Network */}
        <div style={{ marginTop: 16 }}>
          <div style={{ color: "#C7CCDA", fontWeight: 700, marginBottom: 8 }}>Network</div>
          <button onClick={() => setShowPicker(true)} style={{ ...fieldWrap, width: "100%", textAlign: "left", padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between", background: CARD, border: `1px solid ${BORDER}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 10, background: "#0E1726", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconUSDT />
              </div>
              <span style={{ color: "#E6EAF6", fontWeight: 800 }}>{network || "Select network"}</span>
            </div>
            <IconChevronDown color="rgba(255,255,255,.6)" />
          </button>
        </div>

        {/* Wallet */}
        <div style={{ marginTop: 16 }}>
          <div style={{ color: "#C7CCDA", fontWeight: 700, marginBottom: 8 }}>Wallet</div>
          <div style={fieldWrap}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input placeholder="Enter address" value={address} onChange={(e) => setAddress(e.target.value)} style={{ flex: 1, outline: "none", border: 0, background: "transparent", color: "#fff", fontSize: 14, fontWeight: 700 }} />
              <button onClick={() => pasteTo(setAddress)} style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "#2A2E3E", color: "#E6EAF6", fontWeight: 800 }}>
                Paste
              </button>
            </div>
          </div>
        </div>

        {/* MEMO */}
        <div style={{ marginTop: 16 }}>
          <div style={{ color: "#C7CCDA", fontWeight: 700, marginBottom: 8 }}>MEMO (optional)</div>
          <div style={fieldWrap}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input placeholder="Enter MEMO" value={memo} onChange={(e) => setMemo(e.target.value)} style={{ flex: 1, outline: "none", border: 0, background: "transparent", color: "#fff", fontSize: 14, fontWeight: 700 }} />
              <button onClick={() => pasteTo(setMemo)} style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "#2A2E3E", color: "#E6EAF6", fontWeight: 800 }}>
                Paste
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <NeonButton
            disabled={!canContinue || !network || loading}
            onClick={handleWithdraw}
          >
            {loading ? "Processing..." : "Request withdraw"}
          </NeonButton>
        </div>
      </div>

      {showPicker && (
        <div onClick={() => setShowPicker(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "flex-end", zIndex: 60 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", background: BG, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, borderTop: `1px solid ${BORDER}` }}>
            <div style={{ textAlign: "center", color: "#fff", fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Select network</div>
            <div style={{ display: "grid", gap: 8 }}>
              <button onClick={() => { setNetwork("Binance ID"); setShowPicker(false); }} style={{ padding: "12px 14px", borderRadius: 12, border: `1px solid ${BORDER}`, background: CARD, color: "#E6EAF6", textAlign: "left", fontWeight: 800 }}>Binance ID</button>
              <button onClick={() => { setNetwork("EVM"); setShowPicker(false); }} style={{ padding: "12px 14px", borderRadius: 12, border: `1px solid ${BORDER}`, background: CARD, color: "#E6EAF6", textAlign: "left", fontWeight: 800 }}>EVM</button>
              <button onClick={() => setShowPicker(false)} style={{ padding: "12px 14px", borderRadius: 12, border: `1px solid ${BORDER}`, background: "#2A2E3E", color: "#E6EAF6", fontWeight: 800 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: 96 }} />
    </div>
  );
}

// === ABOUT (Terms) ===
function About() {
  return (
    <div style={{ minHeight: "100dvh", background: BG }}>
      <TopBar title="About" />
      <div style={{ padding: 16 }}>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 16, color: "#E6EAF6" }}>
          <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 8 }}>Terms of Services</div>
          <ul style={{ lineHeight: 1.6, color: "#C7CCDA" }}>
            <li>Free and Optional – You can stop using the app anytime.</li>
            <li>No Spam or Abuse – Misuse may lead to a ban.</li>
            <li>Data Usage – We only access minimal necessary Telegram data and never sell it.</li>
            <li>Fair Play – No cheats, bots, or exploits.</li>
            <li>Changes & Updates – Features may change without notice.</li>
            <li>This app isn't affiliated with Telegram.</li>
          </ul>
        </div>
      </div>
      <div style={{ height: 96 }} />
    </div>
  );
}

// === NAV BAR ===
const tabs = [
  { key: "home", label: "Home", icon: (<svg width="20" height="20" viewBox="0 0 24 24"><path d="M4.5 11 12 5l7.5 6v7a2.5 2.5 0 0 1-2.5 2.5H7A2.5 2.5 0 0 1 4.5 18V11Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M9.75 21v-4.25a2.25 2.25 0 0 1 4.5 0V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M2.5 12.5 12 4l9.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>) },
  { key: "earn", label: "Earn", icon: (<svg width="20" height="20" viewBox="0 0 24 24"><path d="M3.5 8.5h13.5a2.5 2.5 0 0 1 2.5 2.5v5.5A3.5 3.5 0  0 1 16 20.5H7A3.5 3.5 0  0 1 3.5 17V8.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M3.5 9.5V7.8c0-.94.76-1.7 1.7-1.7H14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>) },
  { key: "friends", label: "Refer", icon: (<svg width="20" height="20" viewBox="0 0 24 24"><path d="M15.5 8.5a3.5 3.5 0 1 1-7 0a3.5 3.5 0 0 1 7 0Z" stroke="currentColor" strokeWidth="1.6"/><path d="M3.5 20.5a7.5 7.5 0 0 1 17 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>) },
  { key: "wallet", label: "Withdraw", icon: (<svg width="20" height="20" viewBox="0 0 24 24"><path d="M3.5 8.5h13.5a2.5 2.5 0  0 1 2.5 2.5v5.5A3.5 3.5 0 0 1 16 20.5H7A3.5 3.5 0 0 1 3.5 17V8.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M3.5 9.5V7.8c0-.94.76-1.7 1.7-1.7H14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>) },
  { key: "about", label: "About", icon: (<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/><path d="M12 10.5v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><circle cx="12" cy="7.5" r="1.2" fill="currentColor"/></svg>) },
];

function BottomBar({ value, onChange }) {
  // penting: hapus background putih default <button> di mobile
  const btnBase = {
    background: "transparent",
    border: 0,
    outline: "none",
    WebkitAppearance: "none",
    appearance: "none",
  };

  return (
    <div style={{ position: "fixed", left: 0, right: 0, zIndex: 40, bottom: "calc(env(safe-area-inset-bottom) + 16px)" }}>
      <div
        style={{
          margin: "0 auto",
          width: "92%",
          maxWidth: 480,
          border: `1px solid #202538`,
          background: "rgba(20,26,35,.95)",
          borderRadius: 16,
          padding: "8px 12px",
          display: "flex",
          gap: 8,
          justifyContent: "space-between",
          boxShadow: "0 12px 30px rgba(0,0,0,.35)",
        }}
      >
        {tabs.map((t) => {
          const active = value === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              style={{
                ...btnBase,
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: "4px 0",
                color: active ? "#fff" : "rgba(255,255,255,.6)",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: active ? ACCENT : "#1a1f2f",
                  boxShadow: active ? "0 0 18px rgba(198,255,62,.35)" : "none",
                  color: active ? "#0C0F14" : "rgba(255,255,255,.8)",
                }}
              >
                {t.icon}
              </div>
              <div style={{ fontSize: 10, lineHeight: 1 }}>{t.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// === APP ===
export default function App() {
  const [tab, setTab] = useState("home");
  const [user, setUser] = useState(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    document.body.style.background = BG;
    
    try {
      // Initialize Telegram WebApp
      const tgApp = getTelegramWebApp();
      
      // Initialize user
      const userData = getUserData();
      console.log('Initializing app for user:', userData);
      
      if (userData.id) {
        const dbUser = await db.getOrCreateUser(telegramUser);
        setUser(dbUser);
        
        // Process referral if present
        const startParam = tgApp?.initDataUnsafe?.start_param;
        if (startParam && startParam.startsWith('REF')) {
          try {
            await db.processReferral(userData.id, startParam);
            console.log('Referral processed:', startParam);
          } catch (error) {
            console.error('Failed to process referral:', error);
          }
        }
      }
    } catch (e) {
      console.error('App initialization error:', e);
    }
  };

  return (
    <div style={{ minHeight: "100dvh", color: "#fff", background: BG, fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" }}>
      {tab === "earn" ? (
        <EarnScreen />
      ) : tab === "friends" ? (
        <FriendsScreen />
      ) : tab === "wallet" ? (
        <WalletScreen />
      ) : tab === "about" ? (
        <About />
      ) : (
        <HomeScreen />
      )}
      <BottomBar value={tab} onChange={setTab} />
    </div>
  );
}
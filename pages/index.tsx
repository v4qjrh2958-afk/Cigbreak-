import Head from 'next/head';
import { useEffect, useMemo, useRef, useState } from 'react';

type Clip = {
  title: string;
  sourceUrl: string;
};

const CLIPS: Clip[] = [
  { title: "Best quotes compilation (AP Coach of the Year)… YouTube", sourceUrl: "https://www.youtube.com/watch?v=qAcv2EKJhlc" },
  { title: "College GameDay feature… 'GOOGLE ME'… YouTube", sourceUrl: "https://www.youtube.com/watch?v=4RCRjU9tp-A" },
  { title: "Motivational hype (Short)… YouTube", sourceUrl: "https://www.youtube.com/shorts/ccm8_-Sy6JI" },
  { title: "Never Change (Short)… YouTube", sourceUrl: "https://www.youtube.com/shorts/MQmb7xUXqEI" },
  { title: "'Google me' (Short)… YouTube", sourceUrl: "https://www.youtube.com/shorts/tldbhgZtlE0" },
  { title: "Press conference (Big Ten)… YouTube", sourceUrl: "https://www.youtube.com/watch?v=GzvNz2vktL0" },
  { title: "Postgame presser… YouTube", sourceUrl: "https://www.youtube.com/watch?v=1dXehUHKYuM" }
];

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.replace("/", "");
    if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2] || null;
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    const parts = u.pathname.split("/").filter(Boolean);
    const embedIdx = parts.indexOf("embed");
    if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1];
    return null;
  } catch {
    return null;
  }
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function Home() {
  const [reminderMinutes, setReminderMinutes] = useState<number>(90);
  const [remindersOn, setRemindersOn] = useState<boolean>(false);
  const reminderTimerRef = useRef<number | null>(null);

  const [breaksTaken, setBreaksTaken] = useState<number>(0);
  const [yesCount, setYesCount] = useState<number>(0);
  const [notYetCount, setNotYetCount] = useState<number>(0);

  const [active, setActive] = useState<boolean>(false);
  const [clip, setClip] = useState<Clip | null>(null);
  const [clipKey, setClipKey] = useState<number>(0);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);

  const [seen, setSeen] = useState<Set<string>>(new Set());

  const segmentSeconds = 22;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("cigBreakStats") || "{}");
      setBreaksTaken(Number(saved.breaksTaken || 0));
      setYesCount(Number(saved.yesCount || 0));
      setNotYetCount(Number(saved.notYetCount || 0));
      setReminderMinutes(Number(saved.reminderMinutes || 90));
    } catch {}
  }, []);

  useEffect(() => {
    const payload = { breaksTaken, yesCount, notYetCount, reminderMinutes };
    try { localStorage.setItem("cigBreakStats", JSON.stringify(payload)); } catch {}
  }, [breaksTaken, yesCount, notYetCount, reminderMinutes]);

  const embedUrl = useMemo(() => {
    if (!clip) return "";
    const id = getYouTubeId(clip.sourceUrl);
    if (!id) return "";
    // Use a fresh key to force reload on every new clip selection.
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=0&rel=0&modestbranding=1`;
  }, [clip, clipKey]);

  useEffect(() => {
    if (!active) return;
    setShowPrompt(false);
    const t = window.setTimeout(() => setShowPrompt(true), segmentSeconds * 1000);
    return () => window.clearTimeout(t);
  }, [active, clipKey]);

  function pickNextClip() {
    // Prefer unseen clips first, then allow repeats.
    const unseen = CLIPS.filter(c => !seen.has(c.sourceUrl));
    const pool = unseen.length ? unseen : CLIPS;
    const next = pool[Math.floor(Math.random() * pool.length)];
    setClip(next);
    setClipKey(k => k + 1);
    setSeen(prev => new Set(prev).add(next.sourceUrl));
  }

  function startBreak() {
    setActive(true);
    setBreaksTaken(n => n + 1);
    pickNextClip();
  }

  function stopBreak() {
    setActive(false);
    setShowPrompt(false);
    setClip(null);
  }

  function onYes() {
    setYesCount(n => n + 1);
    stopBreak();
  }

  function onNotYet() {
    setNotYetCount(n => n + 1);
    pickNextClip();
  }

  async function enableNotificationsIfPossible() {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    const p = await Notification.requestPermission();
    return p === "granted";
  }

  async function startReminders() {
    const ok = await enableNotificationsIfPossible();
    setRemindersOn(true);
    if (reminderTimerRef.current) window.clearInterval(reminderTimerRef.current);

    const ms = clampInt(reminderMinutes, 15, 240) * 60 * 1000;
    reminderTimerRef.current = window.setInterval(() => {
      // Browser notifications only fire while the browser can run JS (best effort).
      if (ok) new Notification("Cig Break", { body: "Time to step away for 90 seconds… cig like Cignetti." });
    }, ms);
  }

  function stopReminders() {
    setRemindersOn(false);
    if (reminderTimerRef.current) {
      window.clearInterval(reminderTimerRef.current);
      reminderTimerRef.current = null;
    }
  }

  return (
    <>
      <Head>
        <title>Cig Break (MVP)</title>
        <meta name="description" content="A 90 second reset… cig like Cignetti, not cigarette." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="container">
        <div className="header">
          <div className="brand">
            <div className="logo" />
            <div>
              <div className="title">Cig Break</div>
              <div className="subtitle">Step away for 90 seconds… cig like Cignetti, not cigarette.</div>
            </div>
          </div>
          <div className="small">Web MVP</div>
        </div>

        <div className="grid">
          <div className="card big">
            {!active && (
              <>
                <h2 style={{ margin: "0 0 6px 0" }}>Need a reset?</h2>
                <div className="small">Tap the button. Coach pops up. If it didn’t hit, run it back until it does.</div>
                <div className="ctaRow">
                  <button className="btn btnPrimary" onClick={startBreak}>Take a Cig Break</button>
                </div>

                <div className="pillRow">
                  <span className="pill">90 sec mindset</span>
                  <span className="pill">No fluff</span>
                  <span className="pill">Built for the grind</span>
                </div>
              </>
            )}

            {active && clip && (
              <>
                <h2 style={{ margin: "0 0 10px 0" }}>Coach Curt… on deck</h2>
                <div className="playerWrap">
                  <iframe
                    key={clipKey}
                    src={embedUrl}
                    title={clip.title}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                </div>

                <div className="small" style={{ marginTop: 10 }}>
                  Showing a short segment (prompt appears after ~{segmentSeconds}s). Source:{" "}
                  <a href={clip.sourceUrl} target="_blank" rel="noreferrer">{clip.title}</a>
                </div>

                <div className="ctaRow">
                  <button className="btn btnGood" onClick={onYes} disabled={!showPrompt}>Feel better… yes</button>
                  <button className="btn btnBad" onClick={onNotYet} disabled={!showPrompt}>Not yet… another one</button>
                  <button className="btn" onClick={stopBreak}>Stop</button>
                </div>
                {!showPrompt && <div className="small">Let it land…</div>}
              </>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Scoreboard</h3>
            <div className="kpi">
              <div className="kpiBox">
                <div className="kpiLabel">Breaks taken</div>
                <div className="kpiValue">{breaksTaken}</div>
              </div>
              <div className="kpiBox">
                <div className="kpiLabel">Felt better</div>
                <div className="kpiValue">{yesCount}</div>
              </div>
              <div className="kpiBox">
                <div className="kpiLabel">Needed another</div>
                <div className="kpiValue">{notYetCount}</div>
              </div>
              <div className="kpiBox">
                <div className="kpiLabel">Cadence</div>
                <div className="kpiValue">{clampInt(reminderMinutes, 15, 240)}m</div>
              </div>
            </div>

            <hr style={{ border: 0, borderTop: "1px solid rgba(255,255,255,0.08)", margin: "14px 0" }} />

            <h3 style={{ margin: 0 }}>Reminders (demo)</h3>
            <div className="small">
              Browser notifications are best-effort… great for a demo, not a production push system.
            </div>

            <label className="small" style={{ display: "block", marginTop: 10 }}>
              Reminder interval (minutes)
              <input
                className="input"
                type="number"
                min={15}
                max={240}
                value={reminderMinutes}
                onChange={(e) => setReminderMinutes(clampInt(Number(e.target.value), 15, 240))}
              />
            </label>

            <div className="ctaRow">
              {!remindersOn ? (
                <button className="btn btnPrimary" onClick={startReminders}>Turn reminders on</button>
              ) : (
                <button className="btn" onClick={stopReminders}>Turn reminders off</button>
              )}
            </div>

            <div className="footer">
              Clip list is embedded from public sources… swap in your licensed library later.
              <div style={{ marginTop: 8 }}>
                {CLIPS.map((c) => (
                  <div key={c.sourceUrl}>
                    <a href={c.sourceUrl} target="_blank" rel="noreferrer">{c.title}</a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="footer">
          Disclaimer… this MVP is for demo and humor. Not medical advice.
        </div>
      </div>
    </>
  );
}

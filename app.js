// Local localStorage shadowing to prevent crashes on strict file:// protocol or private browsing
let localStorage;
try {
  const testStorage = window.localStorage;
  testStorage.setItem('__storage_test__', '__storage_test__');
  testStorage.removeItem('__storage_test__');
  localStorage = window.localStorage;
} catch (e) {
  console.warn("localStorage is restricted or blocked under the file:// protocol. Falling back to in-memory storage.");
  const memoryStorage = {};
  localStorage = {
    getItem(key) {
      return key in memoryStorage ? memoryStorage[key] : null;
    },
    setItem(key, value) {
      memoryStorage[key] = String(value);
    },
    removeItem(key) {
      delete memoryStorage[key];
    },
    clear() {
      for (let k in memoryStorage) delete memoryStorage[k];
    }
  };
}

// Supabase Client Configuration
const SUPABASE_URL = "https://bfbqiocegzjqbogvjlux.supabase.co";
const SUPABASE_KEY = "sb_publishable_EIvJY4hLqsnZbgC-AVs76Q_yey2GIAE";
let supabaseClient = null;
try {
  if (window.location.protocol !== 'file:' && window.supabase && typeof window.supabase.createClient === 'function') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
} catch (e) {
  console.warn("Error initializing Supabase client:", e);
}

let isSyncingFromSupabase = false;

// Override setItem to automatically sync wallet and profile changes to Supabase in real-time
try {
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key, value) {
    try {
      originalSetItem.call(localStorage, key, value);
    } catch(e) {}
    
    if (supabaseClient && !isSyncingFromSupabase) {
      if (key === 'sabi_user_wallet') {
        try {
          supabaseClient.auth.getSession().then(res => {
            const session = res.data.session;
            if (session && session.user) {
              supabaseClient.from('profiles')
                .update({ wallet_balance: parseFloat(value) })
                .eq('id', session.user.id)
                .then(r => {
                  if (r.error) console.error("Error auto-syncing wallet to Supabase:", r.error.message);
                });
            }
          });
        } catch(err) {
          console.error("Error invoking wallet sync:", err);
        }
      } else if (key === 'sabi_user_profile') {
        try {
          const profile = JSON.parse(value);
          supabaseClient.auth.getSession().then(res => {
            const session = res.data.session;
            if (session && session.user) {
              supabaseClient.from('profiles')
                .update({
                  name: profile.name,
                  phone: profile.phone,
                  driver_status: profile.driverStatus || 'unregistered',
                  driver_info: {
                    bankName: profile.bankName,
                    bankAccount: profile.bankAccount
                  }
                })
                .eq('id', session.user.id)
                .then(r => {
                  if (r.error) console.error("Error auto-syncing profile to Supabase:", r.error.message);
                });
            }
          });
        } catch(err) {
          console.error("Error invoking profile sync:", err);
        }
      }
    }
  };
} catch(e) {
  console.warn("Could not wrap localStorage setItem:", e);
}

// Global Application State
let appState = {
  activeMainTab: 'servicios',    // 'suerte', 'servicios', 'comunidad'
  activeServiceTab: 'emergencia', // 'emergencia', 'directorio', 'calculadora', 'educacion', 'deportes'
  currentGame: 'lottodidia',   // 'lottodidia', 'zodiac', 'catochi', 'big4', 'lotto5', 'landsloterie'
  
  // Premium Paywall Status
  sabiSubscribed: false,
  sabiPlan: 'monthly',
  
  // Tab 1: Suerte State
  selectedNumbers: [],        // Lotto di Dia & Lotto 5
  selectedCombo: 'standard',  // Lotto di Dia combos
  facilitoEnabled: false,
  positionActiveTab: 0,
  generatedTicket: null,
  
  selectedZodiacDigits: [null, null, null, null],
  selectedZodiacSign: null,
  zodiacWager: 1.00,
  zodiacPositionActiveTab: 0,
  zodiacListPositionActiveTab: 0,
  
  selectedDigits: [null, null, null, null, null], // General digits for Catochi/Big 4/Landsloterie
  catochiWager: 1.00,
  selectedMegaBall: null,       // Mini Mega Mega Ball
  megaplusEnabled: false,       // Mini Mega Mega Plus
  
  historyPage: 1,
  historyPageSize: 10,
  filteredHistory: [],
  
  // Databases (Dynamic and static)
  gamesData: {}, // Compiled draw histories
  
  // Tab 3: Comunidad State
  b2bWallet: 50.00,
  b2bClicks: 55,
  b2bImpressions: 1420,
  marketplaceAds: [],
  marketplaceFilterCategory: 'all',
  marketplaceSearchQuery: '',

  // Delivery System State
  activeComunidadTab: 'market',
  driverStatus: 'unregistered',
  driverActive: false,
  driverWallet: 0.00,
  driverCompletedCount: 0,
  driverInfo: null,
  adminEarnings: 0.00,
  activeLoan: null,
  lendingPool: 10000.00,
  lendingEarnings: 0.00,
  creditTier: 1,
  loanSuspensionUntil: null,
  lendingQueue: [],
  pendingDrivers: [],
  activeTrip: null,
  activeLlegadasSubTab: 'vuelos',
  customDeliveries: [],
  _userProfile: {
    name: "Amaury Maduro",
    email: "amaury@sabi.aw",
    phone: "593-5555",
    photo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    id: "SABI-8842",
    since: "2026-01-15",
    bankName: "Aruba Bank",
    bankAccount: "100-245-8842",
    role: "admin"
  },
  get userProfile() {
    if (this._userProfile && this._userProfile.email && this._userProfile.email.trim().toLowerCase() === 'amaury@sabi.aw') {
      this._userProfile.role = 'admin';
    }
    return this._userProfile;
  },
  set userProfile(val) {
    if (val && val.email && val.email.trim().toLowerCase() === 'amaury@sabi.aw') {
      val.role = 'admin';
    }
    this._userProfile = val;
  },
  userProducts: [],
  userWallet: 250.00,
  activeAccountTab: 'profile',
  checkoutPaymentMethod: 'wallet',
  driverActiveTrip: null,
  purchasedCourses: JSON.parse(localStorage.getItem('sabi_purchased_courses') || '[]'),
  financialTransactions: JSON.parse(localStorage.getItem('sabi_financial_transactions') || '[]')
};

// Web Audio API Retro Synthesizer
const SoundEffects = {
  audioCtx: null,
  init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },
  playClick() {
    this.init();
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.08);
  },
  playJingle() {
    this.init();
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    const now = this.audioCtx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    const duration = 0.08;
    notes.forEach((freq, index) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + (index * duration));
      gain.gain.setValueAtTime(0.1, now + (index * duration));
      gain.gain.exponentialRampToValueAtTime(0.001, now + (index * duration) + 0.15);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now + (index * duration));
      osc.stop(now + (index * duration) + 0.15);
    });
  },
  playAlert() {
    this.init();
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    const now = this.audioCtx.currentTime;
    const osc1 = this.audioCtx.createOscillator();
    const osc2 = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.linearRampToValueAtTime(659.25, now + 0.15);
    osc1.frequency.linearRampToValueAtTime(783.99, now + 0.3);
    
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(261.63, now); // C4
    osc2.frequency.linearRampToValueAtTime(329.63, now + 0.3);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.audioCtx.destination);
    
    osc1.start();
    osc2.start();
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);
  },
  playDrawSound() {
    this.init();
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.25);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(now + 0.25);
  }
};

function updateArubaWeather() {
  const widget = document.getElementById("weather-widget-header");
  if (!widget) return;

  const states = [
    { temp: 30, text: "Soleado", icon: "☀️", rain: "10%", wind: "24 km/h" },
    { temp: 31, text: "Despejado", icon: "☀️", rain: "5%", wind: "28 km/h" },
    { temp: 29, text: "Parcialmente Nublado", icon: "⛅", rain: "20%", wind: "22 km/h" },
    { temp: 29, text: "Ventoso", icon: "💨", rain: "10%", wind: "32 km/h" },
    { temp: 28, text: "Llovizna Ligera", icon: "🌦️", rain: "65%", wind: "18 km/h" }
  ];

  // Select based on current hour for a pseudo-live weather effect
  const hour = new Date().getHours();
  const index = (hour + new Date().getDate()) % states.length;
  const weather = states[index];

  const renderWeather = (temp, text, icon, humidity, wind, updatedAt) => {
    let freshnessLabel = "";
    if (updatedAt) {
      const minutesAgo = Math.round((Date.now() - new Date(updatedAt).getTime()) / 60000);
      if (minutesAgo < 1) freshnessLabel = "actualizado ahora";
      else if (minutesAgo < 60) freshnessLabel = `actualizado hace ${minutesAgo} min`;
      else freshnessLabel = `actualizado hace ${Math.round(minutesAgo / 60)} h`;
    }
    widget.innerHTML = `
      <div class="weather-pill" style="display:flex; align-items:center; gap:0.65rem; background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); padding:0.45rem 1rem; border-radius:30px; backdrop-filter:blur(8px); box-shadow:0 4px 15px rgba(0,0,0,0.15)">
        <div style="font-size:1.6rem; line-height:1">${icon}</div>
        <div style="text-align:left">
          <div style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; font-weight:700">Clima en Aruba</div>
          <div style="font-size:0.8rem; font-weight:800; color:var(--text-main); display:flex; align-items:center; gap:4px">
            <span>${temp}°C</span>
            <span style="color:var(--text-muted); font-weight:400">&bull;</span>
            <span style="color:var(--neon-cyan)">${text}</span>
          </div>
          <div style="font-size:0.7rem; color:var(--text-muted); margin-top:1px">
            🌧️ Humedad: ${humidity}% | 💨 Viento: ${wind}
          </div>
          ${freshnessLabel ? `<div style="font-size:0.6rem; color:var(--text-muted); opacity:0.7; margin-top:1px">${freshnessLabel}</div>` : ""}
        </div>
      </div>
    `;
  };

  const client = supabaseClient;
  if (client) {
    client
      .from("weather_data")
      .select("*")
      .eq("id", 1)
      .single()
      .then(({ data, error }) => {
        if (data && !error) {
          // Mapa de iconos: soporta tanto los nuevos valores de Open-Meteo
          // ("sunny", "night", "cloudy", "night_cloudy", "rainy") como los
          // códigos legacy de OpenWeatherMap ("01", "02", etc.)
          const emojiMap = {
            // Open-Meteo (nuevos)
            "sunny": "☀️", "night": "🌙", "cloudy": "⛅",
            "night_cloudy": "🌙", "rainy": "🌧️",
            // OpenWeatherMap (legacy, por si acaso)
            "01": "☀️", "02": "⛅", "03": "☁️", "04": "☁️",
            "09": "🌧️", "10": "🌦️", "11": "⛈️", "13": "❄️", "50": "🌫️"
          };
          const iconKey = data.icon || "sunny";
          const iconEmoji = emojiMap[iconKey] || emojiMap[iconKey.substring(0, 2)] || "☀️";
          renderWeather(data.temperature, data.description, iconEmoji, data.humidity, `${data.wind_speed} m/s`, data.updated_at);
        } else {
          renderWeather(weather.temp, weather.text, weather.icon, weather.rain.replace("%", ""), weather.wind);
        }
      })
      .catch(() => {
        renderWeather(weather.temp, weather.text, weather.icon, weather.rain.replace("%", ""), weather.wind);
      });
  } else {
    renderWeather(weather.temp, weather.text, weather.icon, weather.rain.replace("%", ""), weather.wind);
  }
}

function syncRealtimeDataFromSupabase() {
  const client = supabaseClient;
  if (!client) return;

  console.log("⚡ [Sabi Realtime] Synchronizing data from Supabase...");

  // 1. Fetch and Sync Lottery Draws
  client
    .from("lottery_draws")
    .select("*")
    .order("draw_date", { ascending: false })
    .then(({ data, error }) => {
      if (error) console.error("❌ [Sabi Realtime] Lottery sync error:", error);
      else console.log(`✅ [Sabi Realtime] Lottery sync success: ${data ? data.length : 0} rows`);
      if (data && !error) {
        data.forEach(d => {
          const game = d.game;
          const rawNums = d.numbers;
          const parsedNumbers = Array.isArray(rawNums)
            ? rawNums.map(Number)
            : String(rawNums).split("-").map(Number);
          const drawItem = {
            date: d.draw_date,
            drawType: d.draw_type || "Evening",
            draw: d.draw_number,
            numbers: parsedNumbers
          };
          if (game === "zodiac") drawItem.sign = d.zodiac_sign || "Aries";
          if (game === "minimega") drawItem.megaBall = d.mega_ball;

          // Asegurar que el array existe y está asignado en appState
          if (!appState.gamesData[game]) appState.gamesData[game] = [];
          const list = appState.gamesData[game];
          // Para juegos de sorteo único (sin turno Midday/Evening), buscar solo por draw_number
          const isSingleDraw = game === "lottodidia" || game === "lotto5" || game === "minimega";
          const idx = isSingleDraw
            ? list.findIndex(item => item.draw === d.draw_number)
            : list.findIndex(item => item.draw === d.draw_number && item.drawType === (d.draw_type || "Evening"));
          if (idx !== -1) {
            list[idx] = drawItem;
          } else {
            list.push(drawItem);
          }
        });
        for (const game in appState.gamesData) {
          appState.gamesData[game].sort((a, b) => new Date(b.date) - new Date(a.date));
        }
        if (appState.activeMainTab === 'suerte') {
          // Actualizar filteredHistory y re-renderizar sin cambiar el tab activo
          setTimeout(() => {
            const game = appState.currentGame || 'lottodidia';
            const draws = appState.gamesData[game] || [];
            appState.filteredHistory = [...draws];
            applyFilters();
          }, 800);
        }
      }
    });

  // Subscribe to new Lottery Draws
  try {
    client
      .channel("lottery_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "lottery_draws" }, payload => {
        const d = payload.new;
        if (d && d.game && d.numbers) {
          const game = d.game;
          const rawNums = d.numbers;
          const parsedNumbers = Array.isArray(rawNums)
            ? rawNums.map(Number)
            : String(rawNums).split("-").map(Number);
          const drawItem = {
            date: d.draw_date,
            drawType: d.draw_type || "Evening",
            draw: d.draw_number,
            numbers: parsedNumbers
          };
          if (game === "zodiac") drawItem.sign = d.zodiac_sign || "Aries";
          if (game === "minimega") drawItem.megaBall = d.mega_ball;

          const list = appState.gamesData[game] || [];
          const exists = list.some(item => item.draw === d.draw_number && item.drawType === (d.draw_type || "Evening"));
          if (!exists) {
            list.unshift(drawItem);
            list.sort((a, b) => new Date(b.date) - new Date(a.date));
            appState.gamesData[game] = list;
            
            showToast(`¡SORTEO EN VIVO: ${game.toUpperCase()}!`, `Resultado oficial publicado: \n${d.numbers}`);
            try {
              SoundEffects.playAlert();
            } catch(e) {}

            if (appState.activeMainTab === 'suerte') {
              switchGame(appState.currentGame || 'lottodidia');
            }
          }
        }
      })
      .subscribe();
  } catch (e) {
    console.warn("Error subscribing to lottery_draws realtime:", e);
  }

  // 2. Fetch and Sync Live Sports Matches
  client
    .from("live_sports_matches")
    .select("*")
    .then(({ data, error }) => {
      if (error) console.error("❌ [Sabi Realtime] Sports sync error:", error);
      else console.log(`✅ [Sabi Realtime] Sports sync success: ${data ? data.length : 0} rows`);
      if (data && !error) {
        data.forEach(d => {
          const idx = SPORTS_HUB_DATA.matches.findIndex(m => m.homeTeam === d.home_team && m.awayTeam === d.away_team && m.sport === d.sport);
          const matchObj = {
            sport: d.sport,
            homeTeam: d.home_team,
            awayTeam: d.away_team,
            homeScore: d.home_score,
            awayScore: d.away_score,
            status: d.status === "scheduled" ? "upcoming" : d.status,
            minute: d.minute,
            venue: "Estadio Oficial",
            date: "Hoy",
            time: d.status === "live" ? "En Vivo" : "Programado",
            prediction_h2h: d.prediction_h2h,
            odds_home: d.odds_home,
            odds_draw: d.odds_draw,
            odds_away: d.odds_away
          };
          if (idx !== -1) {
            SPORTS_HUB_DATA.matches[idx] = matchObj;
          } else {
            SPORTS_HUB_DATA.matches.unshift(matchObj);
          }

          if (d.prediction_h2h) {
            const pIdx = SPORTS_HUB_DATA.predictions.findIndex(p => p.homeTeam === d.home_team && p.awayTeam === d.away_team && p.sport === d.sport);
            const probs = d.prediction_h2h.split("-").map(Number);
            const predObj = {
              sport: d.sport,
              homeTeam: d.home_team,
              awayTeam: d.away_team,
              winProbHome: probs[0] || 50,
              winProbDraw: probs[1] || 0,
              winProbAway: probs[2] || 50,
              streakHome: "G-G-G",
              streakAway: "G-P-G",
              oddsHome: d.odds_home || 1.95,
              oddsDraw: d.odds_draw || 3.40,
              oddsAway: d.odds_away || 3.80,
              bestBetKey: "sports_bestbet_futbol",
              totalsPredict: "Over 2.5",
              aiTipKey: "sports_aitip_futbol",
              h2h: `${d.home_team} vs ${d.away_team}`
            };
            if (pIdx !== -1) {
              SPORTS_HUB_DATA.predictions[pIdx] = predObj;
            } else {
              SPORTS_HUB_DATA.predictions.unshift(predObj);
            }
          }
        });
        if (appState.activeMainTab === 'servicios' && appState.activeServiceTab === 'deportes') {
          renderSportsHub();
        }
      }
    });

  // Subscribe to Live Sports changes
  try {
    client
      .channel("sports_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_sports_matches" }, payload => {
        const d = payload.new;
        if (d) {
          const idx = SPORTS_HUB_DATA.matches.findIndex(m => m.homeTeam === d.home_team && m.awayTeam === d.away_team && m.sport === d.sport);
          const matchObj = {
            sport: d.sport,
            homeTeam: d.home_team,
            awayTeam: d.away_team,
            homeScore: d.home_score,
            awayScore: d.away_score,
            status: d.status === "scheduled" ? "upcoming" : d.status,
            minute: d.minute,
            venue: "Estadio Oficial",
            date: "Hoy",
            time: d.status === "live" ? "En Vivo" : "Programado",
            prediction_h2h: d.prediction_h2h,
            odds_home: d.odds_home,
            odds_draw: d.odds_draw,
            odds_away: d.odds_away
          };
          if (idx !== -1) {
            SPORTS_HUB_DATA.matches[idx] = matchObj;
          } else {
            SPORTS_HUB_DATA.matches.unshift(matchObj);
          }

          if (d.prediction_h2h) {
            const pIdx = SPORTS_HUB_DATA.predictions.findIndex(p => p.homeTeam === d.home_team && p.awayTeam === d.away_team && p.sport === d.sport);
            const probs = d.prediction_h2h.split("-").map(Number);
            const predObj = {
              sport: d.sport,
              homeTeam: d.home_team,
              awayTeam: d.away_team,
              winProbHome: probs[0] || 50,
              winProbDraw: probs[1] || 0,
              winProbAway: probs[2] || 50,
              streakHome: "G-G-G",
              streakAway: "G-P-G",
              oddsHome: d.odds_home || 1.95,
              oddsDraw: d.odds_draw || 3.40,
              oddsAway: d.odds_away || 3.80,
              bestBetKey: "sports_bestbet_futbol",
              totalsPredict: "Over 2.5",
              aiTipKey: "sports_aitip_futbol",
              h2h: `${d.home_team} vs ${d.away_team}`
            };
            if (pIdx !== -1) {
              SPORTS_HUB_DATA.predictions[pIdx] = predObj;
            } else {
              SPORTS_HUB_DATA.predictions.unshift(predObj);
            }
          }
          if (appState.activeMainTab === 'servicios' && appState.activeServiceTab === 'deportes') {
            renderSportsHub();
          }
        }
      })
      .subscribe();
  } catch (e) {
    console.warn("Error subscribing to live_sports_matches realtime:", e);
  }

  // 2.5 Fetch and Sync Sports Standings
  client
    .from("sports_standings")
    .select("*")
    .then(({ data, error }) => {
      if (error) console.error("❌ [Sabi Realtime] Standings sync error:", error);
      else console.log(`✅ [Sabi Realtime] Standings sync success: ${data ? data.length : 0} rows`);
      if (data && !error) {
        const mappedStandings = {
          local: [],
          futbol: [],
          beisbol: [],
          baloncesto: [],
          nfl: [],
          nhl: []
        };
        data.forEach(d => {
          const row = {
            rank: d.rank,
            team: d.team,
            played: d.played,
            won: d.won,
            lost: d.lost,
            pct: d.pct || ".000",
            group_name: d.group_name || d.league || ""
          };
          if (d.sport === 'futbol' || d.sport === 'local' || d.sport === 'nhl') {
            row.drawn = d.drawn || 0;
            row.points = d.points || 0;
          }
          if (mappedStandings[d.sport]) {
            mappedStandings[d.sport].push(row);
          }
        });
        
        for (const s in mappedStandings) {
          if (mappedStandings[s].length > 0) {
            mappedStandings[s].sort((a, b) => a.rank - b.rank);
            SPORTS_HUB_DATA.standings[s] = mappedStandings[s];
          }
        }
        
        if (appState.activeMainTab === 'servicios' && appState.activeServiceTab === 'deportes') {
          renderSportsHub();
        }
      }
    });

  // Subscribe to Sports Standings changes
  try {
    client
      .channel("standings_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "sports_standings" }, payload => {
        const d = payload.new;
        if (d) {
          const list = SPORTS_HUB_DATA.standings[d.sport] || [];
          const idx = list.findIndex(row => row.team === d.team);
          const rowObj = {
            rank: d.rank,
            team: d.team,
            played: d.played,
            won: d.won,
            lost: d.lost,
            pct: d.pct || ".000",
            group_name: d.group_name || d.league || ""
          };
          if (d.sport === 'futbol' || d.sport === 'local' || d.sport === 'nhl') {
            rowObj.drawn = d.drawn || 0;
            rowObj.points = d.points || 0;
          }
          if (idx !== -1) {
            list[idx] = rowObj;
          } else {
            list.push(rowObj);
          }
          list.sort((a, b) => a.rank - b.rank);
          SPORTS_HUB_DATA.standings[d.sport] = list;
          
          if (appState.activeMainTab === 'servicios' && appState.activeServiceTab === 'deportes') {
            renderSportsHub();
          }
        }
      })
      .subscribe();
  } catch (e) {
    console.warn("Error subscribing to sports_standings realtime:", e);
  }

  // 3. Fetch flight arrivals
  client
    .from("flight_arrivals")
    .select("*")
    .order("scheduled_time", { ascending: true })
    .then(({ data, error }) => {
      if (error) console.error("❌ [Sabi Realtime] Flights sync error:", error);
      else console.log(`✅ [Sabi Realtime] Flights sync success: ${data ? data.length : 0} rows`);
      if (data && !error) {
        SABI_DATA.comercio.arrivalsDb.vuelos.today = data.map(f => {
          const parts = f.scheduled_time.split(":");
          let hr = parseInt(parts[0], 10);
          const min = parts[1];
          const ampm = hr >= 12 ? "PM" : "AM";
          hr = hr % 12;
          if (hr === 0) hr = 12;
          const formattedTime = `${hr.toString().padStart(2, '0')}:${min} ${ampm}`;
          
          let statusMap = "Expected";
          if (f.status === "landed") statusMap = "Landed";
          else if (f.status === "delayed") statusMap = "Delayed";

          return {
            flightNo: f.flight_number,
            airline: f.airline,
            origin: f.origin,
            time: formattedTime,
            status: statusMap,
            terminal: f.gate ? `Gate ${f.gate}` : "Terminal U.S."
          };
        });

        // Estadísticas reales calculadas desde la base de datos de vuelos.
        // NOTA: AviationStack no provee conteo de pasajeros por vuelo,
        // así que ya no se inventa un número de pasajeros (antes era
        // vuelos × 180, una estimación sin base real). Solo se muestra
        // el conteo real de vuelos y el % real de puntualidad.
        const totalFlights = data.length;
        const delayedCount = data.filter(f => f.status === "delayed").length;
        const onTimePct = totalFlights > 0
          ? Math.round(((totalFlights - delayedCount) / totalFlights) * 100)
          : null;

        SABI_DATA.comercio.flightsToday = {
          totalArrivals: totalFlights,
          onTimePct: onTimePct,
        };

        // Compute dynamic occupancy rates based on real flights count
        const dynamicOccNoord = Math.min(95, Math.max(70, 75 + totalFlights * 0.7));
        const dynamicOccOranjestad = Math.min(95, Math.max(65, 68 + totalFlights * 0.5));
        const dynamicOccSanNicolas = Math.min(95, Math.max(70, 72 + totalFlights * 0.6));

        SABI_DATA.comercio.occupancyRates = {
          noord: Math.round(dynamicOccNoord),
          oranjestad: Math.round(dynamicOccOranjestad),
          sannicolas: Math.round(dynamicOccSanNicolas)
        };

        // Compute lodging occupancy details dynamically
        SABI_DATA.comercio.lodgingOccupancy = {
          resorts: Math.min(100, Math.round(dynamicOccNoord * 0.97)),
          allInclusive: Math.min(100, Math.round(dynamicOccNoord * 1.02)),
          condos: Math.min(100, Math.round(dynamicOccOranjestad * 0.95)),
          villas: Math.min(100, Math.round(dynamicOccSanNicolas * 0.85)),
          boutiqueApts: Math.min(100, Math.round(dynamicOccOranjestad * 1.01))
        };

        if (appState.activeMainTab === 'servicios') {
          if (appState.activeServiceTab === 'llegadas') {
            renderArrivalsTab();
          } else if (appState.activeServiceTab === 'comercio') {
            renderComercioStats();
          }
        }
      }
    });
}

// DOM Initialization
document.addEventListener("DOMContentLoaded", () => {
  // Register Service Worker & Manifest for PWA (only if not running on file:// protocol)
  try {
    if (window.location.protocol !== 'file:') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
          .then(reg => console.log('⚡ [PWA] Service Worker registrado con éxito:', reg.scope))
          .catch(err => console.warn('⚡ [PWA] Error al registrar Service Worker:', err));
      }
      const manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = 'manifest.json';
      document.head.appendChild(manifestLink);
    }
  } catch (e) {
    console.warn("⚡ [PWA] Service worker registration error:", e);
  }

  // Initialize App Language
  appState.language = localStorage.getItem('sabi_lang') || 'es';
  translatePage();

  // Update Aruba Weather Widget
  updateArubaWeather();

  // Load Subscription Status
  if (supabaseClient) {
    isSyncingFromSupabase = true;
    supabaseClient.auth.getSession().then(sessionRes => {
      const session = sessionRes.data.session;
      if (session && session.user) {
        supabaseClient.from('profiles').select('*').eq('id', session.user.id).single().then(profileRes => {
          if (!profileRes.error && profileRes.data) {
            const pData = profileRes.data;
            appState.userProfile = {
              name: pData.name,
              email: pData.email,
              phone: pData.phone || "593-5555",
              photo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
              id: pData.id,
              since: pData.created_at ? pData.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
              bankName: pData.driver_info?.bankName || "Aruba Bank",
              bankAccount: pData.driver_info?.bankAccount || "100-245-8842",
              role: pData.role || 'user'
            };
            appState.userWallet = parseFloat(pData.wallet_balance || 250.00);
            appState.sabiSubscribed = true;
            localStorage.setItem('sabi_subscribed', 'true');
            localStorage.setItem('sabi_user_profile', JSON.stringify(appState.userProfile));
            localStorage.setItem('sabi_user_wallet', appState.userWallet.toString());
            
            const overlay = document.getElementById("paywall-overlay");
            if (overlay) overlay.classList.remove("active");
            
            renderAccountModal();
          }
          isSyncingFromSupabase = false;
        });
      } else {
        isSyncingFromSupabase = false;
        const subscribed = localStorage.getItem('sabi_subscribed');
        if (subscribed === 'true') {
          appState.sabiSubscribed = true;
          const overlay = document.getElementById("paywall-overlay");
          if (overlay) overlay.classList.remove("active");
        }
      }
    }).catch(e => {
      isSyncingFromSupabase = false;
      console.warn("Supabase session check error:", e);
    });
  } else {
    const subscribed = localStorage.getItem('sabi_subscribed');
    if (subscribed === 'true') {
      appState.sabiSubscribed = true;
      const overlay = document.getElementById("paywall-overlay");
      if (overlay) overlay.classList.remove("active");
    }
  }

  // Load B2B Wallet & Marketplace Ads from Storage
  const wallet = localStorage.getItem('sabi_b2b_wallet');
  if (wallet !== null) {
    appState.b2bWallet = parseFloat(wallet);
  }
  const balanceEl = document.getElementById("b2b-wallet-balance");
  if (balanceEl) {
    balanceEl.innerText = `$${appState.b2bWallet.toFixed(2)} USD`;
  }

  const clicks = localStorage.getItem('sabi_b2b_clicks');
  if (clicks !== null) {
    appState.b2bClicks = parseInt(clicks);
  }
  const impressions = localStorage.getItem('sabi_b2b_impressions');
  if (impressions !== null) {
    appState.b2bImpressions = parseInt(impressions);
  }
  updateB2BStatsDisplay();

  // Load User Wallet
  const userWallet = localStorage.getItem('sabi_user_wallet');
  if (userWallet !== null) {
    appState.userWallet = parseFloat(userWallet);
  }

  // Load marketplace ads with migration check
  let adsLoaded = false;
  const ads = localStorage.getItem('sabi_marketplace_ads');
  if (ads !== null && ads !== 'null' && ads !== 'undefined') {
    try {
      const parsedAds = JSON.parse(ads);
      if (Array.isArray(parsedAds) && parsedAds.length > 0) {
        // Discard if ads use obsolete categories ('bienes' or 'servicios')
        const hasObsoleteCats = parsedAds.some(ad => ad.category === 'bienes' || ad.category === 'servicios');
        if (!hasObsoleteCats) {
          appState.marketplaceAds = parsedAds;
          adsLoaded = true;
        }
      }
    } catch(e) {
      console.warn("Error parsing sabi_marketplace_ads, resetting database", e);
    }
  }

  if (!adsLoaded) {
    appState.marketplaceAds = SABI_DATA && SABI_DATA.marketplace ? [...SABI_DATA.marketplace] : [];
    localStorage.setItem('sabi_marketplace_ads', JSON.stringify(appState.marketplaceAds));
  }

  // Ensure that physical ads have deliveryEnabled default value
  const physicalCats = ['vehiculos', 'ropa', 'electronica', 'joyeria', 'hogar'];
  if (Array.isArray(appState.marketplaceAds)) {
    appState.marketplaceAds.forEach(ad => {
      if (ad && physicalCats.includes(ad.category) && ad.deliveryEnabled === undefined) {
        ad.deliveryEnabled = true;
      }
    });
  }

  // Load Delivery state from storage with robust try-catch blocks
  const driverStatus = localStorage.getItem('sabi_driver_status');
  if (driverStatus !== null) appState.driverStatus = driverStatus;

  const driverActive = localStorage.getItem('sabi_driver_active');
  if (driverActive !== null) appState.driverActive = (driverActive === 'true');

  const driverWallet = localStorage.getItem('sabi_driver_wallet');
  if (driverWallet !== null) appState.driverWallet = parseFloat(driverWallet) || 0.0;

  const driverCompletedCount = localStorage.getItem('sabi_driver_trips_completed');
  if (driverCompletedCount !== null) appState.driverCompletedCount = parseInt(driverCompletedCount, 10) || 0;
  else appState.driverCompletedCount = 0;

  const driverInfo = localStorage.getItem('sabi_driver_info');
  if (driverInfo !== null && driverInfo !== 'null' && driverInfo !== 'undefined') {
    try {
      appState.driverInfo = JSON.parse(driverInfo);
    } catch(e) {
      appState.driverInfo = null;
    }
  }

  const adminEarnings = localStorage.getItem('sabi_admin_earnings');
  if (adminEarnings !== null) appState.adminEarnings = parseFloat(adminEarnings) || 0.0;

  const activeLoan = localStorage.getItem('sabi_active_loan');
  if (activeLoan !== null && activeLoan !== 'null' && activeLoan !== 'undefined') {
    try {
      appState.activeLoan = JSON.parse(activeLoan);
    } catch(e) {
      appState.activeLoan = null;
    }
  } else {
    appState.activeLoan = null;
  }

  appState.lendingPool = parseFloat(localStorage.getItem('sabi_lending_pool') || '10000.00');
  appState.lendingEarnings = parseFloat(localStorage.getItem('sabi_lending_earnings') || '0.00');
  appState.creditTier = parseInt(localStorage.getItem('sabi_credit_tier') || '1', 10);
  appState.loanSuspensionUntil = localStorage.getItem('sabi_loan_suspension_until');
  if (appState.loanSuspensionUntil === 'null' || appState.loanSuspensionUntil === 'undefined') {
    appState.loanSuspensionUntil = null;
  }

  const lendingQueue = localStorage.getItem('sabi_lending_queue');
  if (lendingQueue !== null && lendingQueue !== 'null' && lendingQueue !== 'undefined') {
    try {
      appState.lendingQueue = JSON.parse(lendingQueue);
    } catch(e) {
      appState.lendingQueue = [];
    }
  }
  if (!Array.isArray(appState.lendingQueue) || appState.lendingQueue.length === 0) {
    appState.lendingQueue = [
      { id: 'app-1', name: "Maria's Bakery", amount: 200, status: 'pending', date: '2026-06-18' },
      { id: 'app-2', name: "Jan Barber Shop", amount: 400, status: 'pending', date: '2026-06-19' },
      { id: 'app-3', name: "Aruba Car Rental", amount: 1500, status: 'pending', date: '2026-06-20' }
    ];
    localStorage.setItem('sabi_lending_queue', JSON.stringify(appState.lendingQueue));
  }

  const pendingDrivers = localStorage.getItem('sabi_pending_drivers');
  appState.pendingDrivers = [];
  if (pendingDrivers !== null && pendingDrivers !== 'null' && pendingDrivers !== 'undefined') {
    try {
      const parsedDrivers = JSON.parse(pendingDrivers);
      if (Array.isArray(parsedDrivers)) {
        appState.pendingDrivers = parsedDrivers;
      }
    } catch(e) {
      // Keep empty
    }
  }

  const activeTrip = localStorage.getItem('sabi_active_trip');
  appState.activeTrip = null;
  if (activeTrip !== null && activeTrip !== 'null' && activeTrip !== 'undefined') {
    try {
      appState.activeTrip = JSON.parse(activeTrip);
    } catch(e) {
      // Keep null
    }
  }

  const customDeliveries = localStorage.getItem('sabi_custom_deliveries');
  appState.customDeliveries = [];
  if (customDeliveries !== null && customDeliveries !== 'null' && customDeliveries !== 'undefined') {
    try {
      appState.customDeliveries = JSON.parse(customDeliveries);
    } catch(e) {
      // Keep empty
    }
  }

  // Resume any active simulations on load
  if (Array.isArray(appState.customDeliveries)) {
    appState.customDeliveries.forEach(d => {
      if (d.status !== 'delivered') {
        setTimeout(() => {
          startDeliverySimulation(d.id);
        }, 1000);
      }
    });
  }

  // Initialize registered accounts with a default demo account if empty
  let accounts = [];
  try {
    const saved = localStorage.getItem('sabi_registered_accounts');
    if (saved) {
      accounts = JSON.parse(saved);
    }
  } catch(e) {}
  
  const demoExists = accounts.some(acc => acc.username === 'amaury' || acc.email === 'amaury@sabi.aw');
  if (!demoExists) {
    accounts.push({
      username: "amaury",
      email: "amaury@sabi.aw",
      password: "sabi123",
      profile: {
        name: "Amaury Maduro",
        email: "amaury@sabi.aw",
        phone: "593-5555",
        photo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
        id: "SABI-8842",
        since: "2026-01-15",
        bankName: "Aruba Bank",
        bankAccount: "100-245-8842"
      }
    });
    localStorage.setItem('sabi_registered_accounts', JSON.stringify(accounts));
  }

  const savedProfile = localStorage.getItem('sabi_user_profile');
  if (savedProfile) {
    try {
      appState.userProfile = JSON.parse(savedProfile);
      if (appState.userProfile.bankName === undefined) {
        appState.userProfile.bankName = "Aruba Bank";
        appState.userProfile.bankAccount = "100-245-8842";
      }
      if (appState.userProfile.role === undefined) {
        appState.userProfile.role = (appState.userProfile.email === "amaury@sabi.aw") ? "admin" : "user";
      }
    } catch(e) {
      // Keep default
    }
  }

  const savedUserProducts = localStorage.getItem('sabi_user_products');
  appState.userProducts = [];
  if (savedUserProducts) {
    try {
      appState.userProducts = JSON.parse(savedUserProducts);
    } catch(e) {
      // Keep empty
    }
  }

  const savedDriverTrip = localStorage.getItem('sabi_driver_active_trip');
  appState.driverActiveTrip = null;
  if (savedDriverTrip && savedDriverTrip !== 'null' && savedDriverTrip !== 'undefined') {
    try {
      appState.driverActiveTrip = JSON.parse(savedDriverTrip);
    } catch(e) {
      // Keep null
    }
  }

  // Compile Lottery Database Histories
  initializeLotteryDatabases();

  // Setup Event Listeners
  setupMainNavigation();
  setupServicesNavigation();
  setupLotteryEvents();
  setupCustomsCalculator();
  setupSchoolsSection();
  setupDeportesSection();
  setupMarketplaceSection();

  // Stripe Payment Return check
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('payment') === 'success') {
    const amountStr = urlParams.get('amount');
    const amount = parseFloat(amountStr) || 100.00;
    
    appState.userWallet += amount;
    localStorage.setItem('sabi_user_wallet', appState.userWallet.toString());
    
    setTimeout(() => {
      SoundEffects.playJingle();
      showToast("¡Recarga Exitosa!", `Se han añadido Afl. ${amount.toFixed(2)} AWG a tu billetera Sabí-Pay a través de Stripe.`);
    }, 1500);

    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (urlParams.get('payment') === 'cancel') {
    setTimeout(() => {
      showToast("Carga Cancelada", "Has cancelado la recarga de tu saldo.");
    }, 1500);
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // Set default state
  switchMainTab('servicios');
  switchGame('lottodidia');
  switchLotteryTab('dashboard');

  if (supabaseClient) {
    syncRealtimeDataFromSupabase();
  }
});

// Paywall Onboarding Controller
appState.sabiPlan = 'annual';

document.querySelectorAll(".plan-card").forEach(card => {
  card.addEventListener("click", (e) => {
    document.querySelectorAll(".plan-card").forEach(c => c.classList.remove("active"));
    const selected = e.currentTarget;
    selected.classList.add("active");
    appState.sabiPlan = selected.dataset.plan;
    
    const checkoutBtn = document.querySelector(".btn-checkout");
    if (appState.sabiPlan === 'lifetime') {
      checkoutBtn.innerText = "🚀 Comprar Acceso de por Vida (Afl. 25.00)";
    } else {
      checkoutBtn.innerText = "🚀 Activar Suscripción Anual (Afl. 10.00)";
    }
  });
});

function switchPaywallMode(mode) {
  const purchaseView = document.getElementById("paywall-view-purchase");
  const registerView = document.getElementById("paywall-view-register");
  const loginView = document.getElementById("paywall-view-login");
  
  if (purchaseView) purchaseView.style.display = (mode === 'purchase') ? 'block' : 'none';
  if (registerView) registerView.style.display = (mode === 'register') ? 'block' : 'none';
  if (loginView) loginView.style.display = (mode === 'login') ? 'block' : 'none';
}

function handlePaywallCheckout() {
  SoundEffects.playJingle();
  // Clear any previous register inputs
  const regUser = document.getElementById("register-username");
  const regEmail = document.getElementById("register-email");
  const regPass = document.getElementById("register-password");
  if (regUser) regUser.value = "";
  if (regEmail) regEmail.value = "";
  if (regPass) regPass.value = "";

  // Switch to register screen
  switchPaywallMode('register');
}

function handlePaywallRegister() {
  const usernameInput = document.getElementById("register-username");
  const emailInput = document.getElementById("register-email");
  const passwordInput = document.getElementById("register-password");
  
  if (!usernameInput || !emailInput || !passwordInput) return;
  
  const username = usernameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  
  if (!username || !email || !password) {
    showToast("Campos Incompletos", "Por favor completa todos los campos.");
    return;
  }
  
  if (supabaseClient) {
    showToast("Registrando...", "Creando tu cuenta en Supabase...");
    supabaseClient.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          name: username
        }
      }
    }).then(res => {
      if (res.error) {
        showToast("Error de Registro", res.error.message);
        return;
      }
      
      const user = res.data.user;
      const newProfile = {
        name: username,
        email: email,
        phone: "593-5555",
        photo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
        id: user.id,
        since: new Date().toISOString().split('T')[0],
        bankName: "Aruba Bank",
        bankAccount: "100-245-" + Math.floor(1000 + Math.random() * 9000)
      };
      
      // Update Supabase profiles table
      supabaseClient.from('profiles').update({
        wallet_balance: 250.00
      }).eq('id', user.id).then(() => {
        appState.userProfile = newProfile;
        localStorage.setItem('sabi_user_profile', JSON.stringify(appState.userProfile));
        
        appState.sabiSubscribed = true;
        localStorage.setItem('sabi_subscribed', 'true');
        
        // Close overlay
        const overlay = document.getElementById("paywall-overlay");
        if (overlay) {
          overlay.style.transition = "opacity 0.5s ease";
          overlay.classList.remove("active");
        }
        
        SoundEffects.playJingle();
        showToast("¡Cuenta Creada!", "Bienvenido a Sabí Premium con base de datos real.");
      });
    });
    return;
  }
  
  // Offline fallback
  let accounts = [];
  try {
    const saved = localStorage.getItem('sabi_registered_accounts');
    if (saved) accounts = JSON.parse(saved);
  } catch(e) {}
  
  const exists = accounts.some(acc => acc.email.toLowerCase() === email.toLowerCase() || acc.username.toLowerCase() === username.toLowerCase());
  if (exists) {
    showToast("Cuenta Existente", "Ya existe una cuenta con este correo o nombre de usuario.");
    return;
  }
  
  const newAccount = {
    username: username,
    email: email,
    password: password,
    profile: {
      name: username,
      email: email,
      phone: "593-5555",
      photo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
      id: "SABI-" + Math.floor(1000 + Math.random() * 9000),
      since: new Date().toISOString().split('T')[0],
      bankName: "Aruba Bank",
      bankAccount: "100-245-" + Math.floor(1000 + Math.random() * 9000)
    }
  };
  
  accounts.push(newAccount);
  localStorage.setItem('sabi_registered_accounts', JSON.stringify(accounts));
  
  appState.userProfile = newAccount.profile;
  localStorage.setItem('sabi_user_profile', JSON.stringify(appState.userProfile));
  
  appState.sabiSubscribed = true;
  localStorage.setItem('sabi_subscribed', 'true');
  
  const overlay = document.getElementById("paywall-overlay");
  if (overlay) {
    overlay.style.transition = "opacity 0.5s ease";
    overlay.classList.remove("active");
  }
  
  SoundEffects.playJingle();
  showToast("¡Cuenta Creada!", "Bienvenido a Sabí Premium.");
}

function handlePaywallLoginSubmit() {
  const usernameInput = document.getElementById("login-username");
  const passwordInput = document.getElementById("login-password");
  
  if (!usernameInput || !passwordInput) return;
  
  const loginInput = usernameInput.value.trim().toLowerCase();
  const password = passwordInput.value.trim();
  
  if (!loginInput || !password) {
    showToast("Campos Incompletos", "Por favor completa todos los campos.");
    return;
  }
  
  const checkLocalCredentials = () => {
    let accounts = [];
    try {
      const saved = localStorage.getItem('sabi_registered_accounts');
      if (saved) accounts = JSON.parse(saved);
    } catch(e) {}
    
    const matched = accounts.find(acc => 
      (acc.email.toLowerCase() === loginInput || acc.username.toLowerCase() === loginInput) && 
      acc.password === password
    );
    
    if (matched) {
      appState.userProfile = matched.profile;
      localStorage.setItem('sabi_user_profile', JSON.stringify(appState.userProfile));
      
      appState.sabiSubscribed = true;
      localStorage.setItem('sabi_subscribed', 'true');
      
      const overlay = document.getElementById("paywall-overlay");
      if (overlay) {
        overlay.style.transition = "opacity 0.5s ease";
        overlay.classList.remove("active");
      }
      
      SoundEffects.playJingle();
      showToast("¡Sesión Iniciada!", `Bienvenido de vuelta, ${appState.userProfile.name}.`);
      renderAccountModal();
      return true;
    }
    return false;
  };

  if (supabaseClient) {
    showToast("Verificando...", "Autenticando credenciales...");
    supabaseClient.auth.signInWithPassword({
      email: loginInput,
      password: password
    }).then(res => {
      if (res.error) {
        // Fallback to local accounts check
        if (checkLocalCredentials()) {
          return;
        }
        showToast("Error de Acceso", "Usuario o contraseña incorrectos.");
        return;
      }
      
      const user = res.data.user;
      supabaseClient.from('profiles').select('*').eq('id', user.id).single().then(profileRes => {
        const pData = profileRes.data || {};
        const loadedProfile = {
          name: pData.name || user.user_metadata.name || "Usuario de Sabí",
          email: user.email,
          phone: pData.phone || "593-5555",
          photo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
          id: user.id,
          since: pData.created_at ? pData.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          bankName: pData.driver_info?.bankName || "Aruba Bank",
          bankAccount: pData.driver_info?.bankAccount || "100-245-8842",
          role: pData.role || 'user'
        };
        
        if (pData.wallet_balance !== undefined) {
          appState.userWallet = parseFloat(pData.wallet_balance);
          localStorage.setItem('sabi_user_wallet', appState.userWallet.toString());
        }
        
        appState.userProfile = loadedProfile;
        localStorage.setItem('sabi_user_profile', JSON.stringify(appState.userProfile));
        
        appState.sabiSubscribed = true;
        localStorage.setItem('sabi_subscribed', 'true');
        
        const overlay = document.getElementById("paywall-overlay");
        if (overlay) {
          overlay.style.transition = "opacity 0.5s ease";
          overlay.classList.remove("active");
        }
        
        SoundEffects.playJingle();
        showToast("¡Sesión Iniciada!", `Bienvenido de vuelta, ${appState.userProfile.name}.`);
        
        renderAccountModal();
      });
    });
    return;
  }
  
  // Offline fallback
  if (!checkLocalCredentials()) {
    showToast("Credenciales Incorrectas", "Usuario/correo o contraseña incorrectos.");
  }
}

function resetSubscriptionState() {
  if (supabaseClient) {
    supabaseClient.auth.signOut();
  }
  localStorage.removeItem('sabi_subscribed');
  appState.sabiSubscribed = false;
  closeAccountModal();
  switchPaywallMode('purchase');
  const overlay = document.getElementById("paywall-overlay");
  if (overlay) overlay.classList.add("active");
}

function chargeUserWallet(amount) {
  // Let the user know we're opening Stripe Checkout
  showToast("Conectando con Stripe...", "Generando sesión de pago seguro...", 2000);
  
  // Get current email
  const userEmail = appState.userProfile ? appState.userProfile.email : '';
  
  // Success/Cancel redirects should target the current page URL
  const successUrl = `${window.location.origin}${window.location.pathname}?payment=success&amount=${amount}`;
  const cancelUrl = `${window.location.origin}${window.location.pathname}?payment=cancel`;

  fetch('http://localhost:3000/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: amount,
      email: userEmail,
      successUrl: successUrl,
      cancelUrl: cancelUrl
    })
  })
  .then(res => {
    if (!res.ok) throw new Error('El servidor local no está disponible.');
    return res.json();
  })
  .then(data => {
    if (data.url) {
      // Redirect to Stripe checkout
      window.location.href = data.url;
    } else {
      throw new Error('No se recibió la URL de pago.');
    }
  })
  .catch(err => {
    console.warn("Stripe Server Offline - Usando modo simulación local:", err);
    
    // FALLBACK: Simulación local si el servidor backend no está encendido
    appState.userWallet += amount;
    localStorage.setItem('sabi_user_wallet', appState.userWallet.toString());
    SoundEffects.playJingle();
    showToast("Saldo Cargado (Simulación)", `Se han añadido Afl. ${amount.toFixed(2)} AWG a tu billetera Sabí-Pay.`);
    renderAccountModal();
  });
}

function resetUserWallet() {
  appState.userWallet = 250.00;
  localStorage.setItem('sabi_user_wallet', '250');
  SoundEffects.playClick();
  showToast("Saldo Restablecido", "El saldo de tu billetera Sabí-Pay se ha restablecido a Afl. 250.00 AWG.");
  renderAccountModal();
}

function withdrawUserWallet() {
  if (!appState.userProfile.bankName || !appState.userProfile.bankAccount) {
    showToast("Cuenta Requerida", "Debes vincular una cuenta bancaria antes de poder realizar un retiro.", 4000);
    linkBankAccount();
    return;
  }

  if (appState.userWallet <= 0) {
    showToast("Sin Fondos", "No tienes saldo disponible en Sabí-Pay para retirar.");
    return;
  }
  
  const withdrawAmountStr = prompt(`Retirar Saldo de Sabí-Pay\n\nTu saldo actual: Afl. ${appState.userWallet.toFixed(2)} AWG\nIngresa el monto a transferir (Mínimo Afl. 10.00):`);
  if (withdrawAmountStr === null) return;
  
  const amount = parseFloat(withdrawAmountStr);
  if (isNaN(amount) || amount < 10.00) {
    showToast("Monto Inválido", "Por favor ingresa un monto válido igual o mayor a Afl. 10.00 AWG.");
    return;
  }
  
  if (amount > appState.userWallet) {
    showToast("Monto Excedido", `No tienes saldo suficiente. Tu saldo es de Afl. ${appState.userWallet.toFixed(2)} AWG.`);
    return;
  }

  const confirmTransfer = confirm(`Confirmar Transferencia\n\n¿Estás seguro de transferir Afl. ${amount.toFixed(2)} AWG a tu cuenta vinculada?\n\nDestino: ${appState.userProfile.bankName}\nCuenta: ${appState.userProfile.bankAccount}`);
  if (!confirmTransfer) return;

  SoundEffects.playJingle();
  appState.userWallet -= amount;
  localStorage.setItem('sabi_user_wallet', appState.userWallet.toString());
  
  showToast(
    "Transferencia en Proceso", 
    `Se han retirado Afl. ${amount.toFixed(2)} AWG de tu billetera Sabí-Pay. La transferencia a tu cuenta de ${appState.userProfile.bankName} (${appState.userProfile.bankAccount}) se completará en 24 horas hábiles.`,
    8000
  );
  
  renderAccountModal();
}

function linkBankAccount() {
  const bank = prompt(`Vincular Cuenta Bancaria\n\nSelecciona o escribe el nombre del banco local:\n1. Aruba Bank\n2. CMB (Caribbean Mercantile Bank)\n3. Banco di Caribe`, appState.userProfile.bankName || "Aruba Bank");
  if (bank === null) return;
  
  const account = prompt(`Ingresa tu número de cuenta bancaria para ${bank}:`, appState.userProfile.bankAccount || "");
  if (account === null) return;
  
  if (!bank.trim() || !account.trim()) {
    showToast("Error", "Los datos bancarios no pueden estar vacíos.");
    return;
  }
  
  appState.userProfile.bankName = bank.trim();
  appState.userProfile.bankAccount = account.trim();
  localStorage.setItem('sabi_user_profile', JSON.stringify(appState.userProfile));
  
  SoundEffects.playClick();
  showToast("Cuenta Vinculada", `Tu cuenta de ${appState.userProfile.bankName} ha sido vinculada correctamente para retiros.`);
  renderAccountModal();
}

// Main Navigation Switcher
function setupMainNavigation() {
  document.querySelectorAll(".main-tab-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const tab = e.currentTarget.dataset.mainTab;
      switchMainTab(tab);
    });
  });

  // Account modal controls
  const profileBtn = document.getElementById("profile-btn");
  if (profileBtn) {
    profileBtn.addEventListener("click", () => {
      SoundEffects.playClick();
      appState.activeAccountTab = 'profile';
      renderAccountModal();
      document.getElementById("account-modal").classList.add("active");
    });
  }
}

function switchMainTab(tab) {
  if (!tab) return;
  appState.activeMainTab = tab;
  SoundEffects.playClick();
  
  document.querySelectorAll(".main-tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mainTab === tab);
  });

  document.querySelectorAll(".main-section").forEach(sec => {
    sec.classList.toggle("active", sec.id === `${tab}-section`);
  });

  // Specific tab entry hooks
  if (tab === 'servicios') {
    switchServiceTab(appState.activeServiceTab);
  } else if (tab === 'comunidad') {
    switchComunidadTab(appState.activeComunidadTab);
    populateAdSelector();
  }
}

function closeAccountModal() {
  document.getElementById("account-modal").classList.remove("active");
}

// Services Sub-Navigation
function setupServicesNavigation() {
  document.querySelectorAll(".service-tab-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const tab = e.currentTarget.dataset.serviceTab;
      switchServiceTab(tab);
    });
  });

  const selectTimeframe = document.getElementById("comercio-timeframe");
  if (selectTimeframe) {
    selectTimeframe.addEventListener("change", () => {
      renderComercioStats();
    });
  }
}

function switchServiceTab(tab) {
  if (!tab) return;
  appState.activeServiceTab = tab;
  SoundEffects.playClick();

  document.querySelectorAll(".service-tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.serviceTab === tab);
  });

  document.querySelectorAll(".service-content").forEach(content => {
    content.classList.toggle("active", content.id === `service-content-${tab}`);
  });

  // Render contents
  if (tab === 'emergencia') {
    renderEmergencies();
  } else if (tab === 'directorio') {
    renderDirectory();
  } else if (tab === 'educacion') {
    renderSchoolsList();
  } else if (tab === 'deportes') {
    renderSportsContent();
  } else if (tab === 'comercio') {
    renderComercioStats();
  } else if (tab === 'llegadas') {
    renderArrivalsTab();
  } else if (tab === 'cursos') {
    renderSabiCourses();
  } else if (tab === 'financiero') {
    renderFinancialHub();
  } else if (tab === 'credito') {
    renderCredito();
  }
}

// Database Initializer & Mock Generator (3 years history)
function initializeLotteryDatabases() {
  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

  // Clone real databases so we don't modify raw constants
  appState.gamesData['lottodidia'] = [...LOTTO_DRAWS];
  appState.gamesData['zodiac'] = [...ZODIAC_DRAWS];

  // Fill gap in real databases to cover exactly 3 years
  fillHistoryGap('lottodidia', appState.gamesData['lottodidia'], threeYearsAgo);
  fillHistoryGap('zodiac', appState.gamesData['zodiac'], threeYearsAgo);

  // Mock Catochi (3 numbers drawn, 0000-9999, Midday & Evening)
  appState.gamesData['catochi'] = generateMockDraws('catochi', 6029, 4247);
  
  // Mock Big 4 (1 number drawn, 0000-9999, Midday & Evening)
  appState.gamesData['big4'] = generateMockDraws('big4', 6029, 4247);

  // Mock Lotto 5 (5 numbers from 1 to 35, Wed/Sat draws)
  appState.gamesData['lotto5'] = generateMockDraws('lotto5', 2410, null);

  // Mock Landsloterie (5-digit ticket number, drawn bi-weekly)
  appState.gamesData['landsloterie'] = generateMockDraws('landsloterie', 850, null);

  // Real database clone + gap fill to cover exactly 3 years
  appState.gamesData['minimega'] = [...MINIMEGA_DRAWS];
  fillHistoryGap('minimega', appState.gamesData['minimega'], threeYearsAgo);
}

function fillHistoryGap(game, list, targetDate) {
  if (list.length === 0) return;
  list.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  const earliestDraw = list[list.length - 1];
  let currentDate = new Date(earliestDraw.date);
  currentDate.setDate(currentDate.getDate() - 1);

  if (game === 'lottodidia') {
    let minDraw = Math.min(...list.map(d => d.draw));
    while (currentDate >= targetDate) {
      let dateStr = currentDate.toISOString().split('T')[0];
      list.push({
        date: dateStr,
        draw: --minDraw,
        numbers: randUniqueNumbers(5, 1, 30)
      });
      currentDate.setDate(currentDate.getDate() - 1);
    }
  } else if (game === 'zodiac') {
    let minMidday = Math.min(...list.filter(d => d.drawType === 'Midday').map(d => d.draw));
    let minEvening = Math.min(...list.filter(d => d.drawType === 'Evening').map(d => d.draw));
    if (!isFinite(minMidday)) minMidday = 4000;
    if (!isFinite(minEvening)) minEvening = 6000;
    
    const signs = ["Aries", "Tauro", "Geminis", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagitario", "Capricornio", "Acuario", "Piscis"];

    while (currentDate >= targetDate) {
      let dateStr = currentDate.toISOString().split('T')[0];
      let isSunday = currentDate.getDay() === 0;

      list.push({
        date: dateStr,
        drawType: 'Midday',
        draw: --minMidday,
        numbers: [randInt(0, 9), randInt(0, 9), randInt(0, 9), randInt(0, 9)],
        sign: signs[randInt(0, 11)]
      });

      if (!isSunday) {
        list.push({
          date: dateStr,
          drawType: 'Evening',
          draw: --minEvening,
          numbers: [randInt(0, 9), randInt(0, 9), randInt(0, 9), randInt(0, 9)],
          sign: signs[randInt(0, 11)]
        });
      }
      currentDate.setDate(currentDate.getDate() - 1);
    }
  } else if (game === 'minimega') {
    let minDraw = Math.min(...list.map(d => d.draw));
    while (currentDate >= targetDate) {
      let dateStr = currentDate.toISOString().split('T')[0];
      let isTue = currentDate.getDay() === 2;
      let isFri = currentDate.getDay() === 5;
      if (isTue || isFri) {
        list.push({
          date: dateStr,
          drawType: 'Evening',
          draw: --minDraw,
          numbers: randUniqueNumbers(4, 1, 30),
          megaball: randInt(1, 15)
        });
      }
      currentDate.setDate(currentDate.getDate() - 1);
    }
  }
  
  list.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function generateMockDraws(game, startEveningDraw, startMiddayDraw) {
  let list = [];
  let currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - 1); // Start yesterday

  let drawNoEvening = startEveningDraw || 6000;
  let drawNoMidday = startMiddayDraw || 4000;
  
  // Generate 1100 days of history (covers exactly 3 years)
  for (let i = 0; i < 1100; i++) {
    let dateStr = currentDate.toISOString().split('T')[0];
    let isSunday = currentDate.getDay() === 0;
    let isWed = currentDate.getDay() === 3;
    let isSat = currentDate.getDay() === 6;
    let isTue = currentDate.getDay() === 2;
    let isFri = currentDate.getDay() === 5;

    if (game === 'catochi' || game === 'big4') {
      // Midday draw
      list.push({
        date: dateStr,
        drawType: 'Midday',
        draw: drawNoMidday--,
        numbers: game === 'catochi' ? [randInt(0,9999), randInt(0,9999), randInt(0,9999)] : [randInt(0,9999)]
      });
      // Evening draw
      if (!isSunday) {
        list.push({
          date: dateStr,
          drawType: 'Evening',
          draw: drawNoEvening--,
          numbers: game === 'catochi' ? [randInt(0,9999), randInt(0,9999), randInt(0,9999)] : [randInt(0,9999)]
        });
      }
    } else if (game === 'lotto5') {
      // Drawn on Wednesday and Saturday
      if (isWed || isSat) {
        list.push({
          date: dateStr,
          drawType: 'Evening',
          draw: drawNoEvening--,
          numbers: randUniqueNumbers(5, 1, 35)
        });
      }
    } else if (game === 'landsloterie') {
      // Drawn bi-weekly (approx every 14 days)
      if (i % 14 === 0) {
        list.push({
          date: dateStr,
          drawType: 'Midday',
          draw: drawNoMidday--,
          numbers: [randInt(0, 99999)]
        });
      }
    } else if (game === 'minimega') {
      // Drawn on Tuesday and Friday
      if (isTue || isFri) {
        list.push({
          date: dateStr,
          drawType: 'Evening',
          draw: drawNoEvening--,
          numbers: randUniqueNumbers(4, 1, 30),
          megaball: randInt(1, 15)
        });
      }
    }

    currentDate.setDate(currentDate.getDate() - 1);
  }
  return list;
}

// Helper Random Utilities
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randUniqueNumbers(count, min, max) {
  let set = new Set();
  while (set.size < count) {
    set.add(randInt(min, max));
  }
  return [...set].sort((a,b) => a-b);
}
function getRandomFromPool(pool, count) {
  let selected = [];
  let tempPool = [...pool];
  while (selected.length < count && tempPool.length > 0) {
    let rIdx = Math.floor(Math.random() * tempPool.length);
    selected.push(tempPool.splice(rIdx, 1)[0]);
  }
  return selected;
}

// Webhook Instant Sorteo Alerts simulation
function simulateWebhookPush() {
  SoundEffects.playAlert();
  
  let gameLabel = "";
  let resultStr = "";
  
  if (appState.currentGame === 'lottodidia') {
    gameLabel = "Lotto di Dia 🍀";
    resultStr = randUniqueNumbers(5, 1, 30).map(n => n.toString().padStart(2, '0')).join(' - ');
  } else if (appState.currentGame === 'zodiac') {
    gameLabel = "Zodiac 🌟";
    const digits = [randInt(0,9), randInt(0,9), randInt(0,9), randInt(0,9)].join('-');
    const signs = ["Aries", "Tauro", "Geminis", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagitario", "Capricornio", "Acuario", "Piscis"];
    const sign = signs[randInt(0, 11)];
    resultStr = `${digits} [${sign}]`;
  } else if (appState.currentGame === 'catochi') {
    gameLabel = "Catochi 🎰";
    resultStr = `1er: ${randInt(0,9999).toString().padStart(4,'0')} | 2do: ${randInt(0,9999).toString().padStart(4,'0')} | 3er: ${randInt(0,9999).toString().padStart(4,'0')}`;
  } else if (appState.currentGame === 'big4') {
    gameLabel = "Big 4 💥";
    resultStr = randInt(0,9999).toString().padStart(4,'0');
  } else if (appState.currentGame === 'lotto5') {
    gameLabel = "Lotto 5 🏆";
    resultStr = randUniqueNumbers(5, 1, 35).map(n => n.toString().padStart(2, '0')).join(' - ');
  } else if (appState.currentGame === 'minimega') {
    gameLabel = "Mini Mega 💎";
    let nums = randUniqueNumbers(4, 1, 30).map(n => n.toString().padStart(2, '0')).join(' - ');
    let mega = randInt(1, 15);
    resultStr = `${nums} [Mega Ball: ${mega}]`;
  } else {
    gameLabel = "Landsloterie 🎟️";
    resultStr = randInt(0,99999).toString().padStart(5,'0');
  }

  showToast(`¡SORTEO EN VIVO: ${gameLabel}!`, `Resultado oficial recién publicado: \n${resultStr}`);
}

// Toast Alert Manager
function showToast(header, body) {
  // Remove existing
  const existing = document.querySelector(".sabi-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "sabi-toast";
  toast.innerHTML = `
    <div class="sabi-toast-header">${header}</div>
    <div class="sabi-toast-body">${body}</div>
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add("active"), 100);
  setTimeout(() => {
    toast.classList.remove("active");
    setTimeout(() => toast.remove(), 400);
  }, 6000);
}

// Lottery Events & Navigation Setup
function setupLotteryEvents() {
  document.querySelectorAll(".game-switch-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      switchGame(e.currentTarget.dataset.game);
    });
  });

  const gameSelect = document.getElementById("game-select-dropdown");
  if (gameSelect) {
    gameSelect.addEventListener("change", (e) => {
      switchGame(e.target.value);
    });
  }

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      switchLotteryTab(e.currentTarget.dataset.tab);
    });
  });

  // Filter event listeners
  document.getElementById("stats-filter-day").addEventListener("change", applyFilters);
  document.getElementById("stats-filter-week").addEventListener("change", applyFilters);
  document.getElementById("stats-filter-month").addEventListener("change", applyFilters);
  document.getElementById("stats-filter-drawtype").addEventListener("change", applyFilters);

  // Search filter
  document.getElementById("history-search").addEventListener("input", handleSearch);

  // Recommendation button
  document.getElementById("btn-generate-recommendation").addEventListener("click", generateRecommendation);
  document.getElementById("btn-generate-recommendation-zodiac").addEventListener("click", generateZodiacRecommendation);

  // Backtest run button
  const btnRunBacktest = document.getElementById("btn-run-backtest");
  if (btnRunBacktest) {
    btnRunBacktest.addEventListener("click", runBacktesting);
  }

  // Mini Mega Event Listeners
  const megaplus = document.getElementById("megaplus-switch");
  if (megaplus) {
    megaplus.addEventListener("change", (e) => {
      appState.megaplusEnabled = e.target.checked;
      updateWagerInvoice();
    });
  }
  const mmLoco = document.getElementById("minimega-manual-loco-btn");
  if (mmLoco) {
    mmLoco.addEventListener("click", () => {
      SoundEffects.playJingle();
      const comb = randUniqueNumbers(4, 1, 30);
      const mega = randInt(1, 15);
      appState.selectedNumbers = [...comb];
      appState.selectedMegaBall = mega;
      
      document.querySelectorAll("#minimega-numbers-grid .lotto-cell").forEach((cell, i) => {
        cell.classList.toggle("selected", comb.includes(i + 1));
      });
      document.querySelectorAll("#minimega-megaball-grid .lotto-cell").forEach((cell, i) => {
        cell.classList.toggle("selected", (i + 1) === mega);
      });
      updateWagerInvoice();
    });
  }
  const mmClear = document.getElementById("minimega-manual-clear-btn");
  if (mmClear) {
    mmClear.addEventListener("click", () => {
      SoundEffects.playClick();
      appState.selectedNumbers = [];
      appState.selectedMegaBall = null;
      document.querySelectorAll("#minimega-numbers-grid .lotto-cell").forEach(cell => cell.classList.remove("selected"));
      document.querySelectorAll("#minimega-megaball-grid .lotto-cell").forEach(cell => cell.classList.remove("selected"));
      updateWagerInvoice();
    });
  }
}

function switchLotteryTab(tab) {
  appState.activeTab = tab;
  SoundEffects.playClick();

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });

  document.querySelectorAll(".tab-content").forEach(content => {
    content.classList.toggle("active", content.id === `${tab}-tab`);
  });

  // Al abrir el tab de Sorteos, sincronizar filteredHistory con gamesData
  // para mostrar los datos más recientes de Supabase
  if (tab === 'history') {
    const currentDraws = appState.gamesData[appState.currentGame] || [];
    appState.filteredHistory = [...currentDraws];
    appState.historyPage = 1;
    renderHistoryTable();
  }
}

function rebuildDayFilter(game) {
  const daySelect = document.getElementById("stats-filter-day");
  if (!daySelect) return;

  daySelect.innerHTML = '<option value="all">Cualquier Día de la Semana</option>';

  const dayNames = {
    1: "Lunes",
    2: "Martes",
    3: "Miércoles",
    4: "Jueves",
    5: "Viernes",
    6: "Sábado",
    0: "Domingo"
  };

  let playDays = [];
  if (game === 'lotto5') {
    playDays = [3, 6];
  } else if (game === 'minimega') {
    playDays = [2, 5];
  } else {
    const draws = appState.gamesData[game] || [];
    const daysSet = new Set();
    draws.forEach(draw => {
      if (draw.date) {
        const [y, m, d] = draw.date.split("-").map(Number);
        const date = new Date(y, m - 1, d);
        daysSet.add(date.getDay());
      }
    });
    playDays = Array.from(daysSet).sort((a, b) => {
      const order = [1, 2, 3, 4, 5, 6, 0];
      return order.indexOf(a) - order.indexOf(b);
    });

    if (playDays.length === 0) {
      playDays = [1, 2, 3, 4, 5, 6, 0];
    }
  }

  playDays.forEach(day => {
    const opt = document.createElement("option");
    opt.value = day.toString();
    opt.innerText = dayNames[day];
    daySelect.appendChild(opt);
  });
}

function switchGame(game) {
  appState.currentGame = game;
  SoundEffects.playClick();
  
  // Set body class for visibility controls
  document.body.className = `game-${game}`;

  // Sync select dropdown
  const gameSelect = document.getElementById("game-select-dropdown");
  if (gameSelect) {
    gameSelect.value = game;
  }

  // Rebuild day filter based on game schedule
  rebuildDayFilter(game);

  // Reset filters
  document.getElementById("stats-filter-day").value = 'all';
  document.getElementById("stats-filter-week").value = 'all';
  document.getElementById("stats-filter-month").value = 'all';
  document.getElementById("stats-filter-drawtype").value = 'all';

  // Show or hide turn filter (schedule-filter-group) for games drawn once/twice a day
  const scheduleFilterGroup = document.querySelector(".schedule-filter-group");
  if (scheduleFilterGroup) {
    if (game === 'lottodidia' || game === 'lotto5' || game === 'landsloterie' || game === 'minimega') {
      scheduleFilterGroup.style.display = 'none';
    } else {
      scheduleFilterGroup.style.display = 'block';
    }
  }

  // Toggle active class on game-switch-btn
  document.querySelectorAll(".game-switch-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.game === game);
  });

  // Dynamic header updates
  const draws = appState.gamesData[game];
  document.getElementById("app-version").innerText = `Base de Datos: ${draws.length} sorteos`;

  // Render game manual grids
  if (game === 'lottodidia') {
    buildManualLottoGrid(30);
    const title = document.getElementById("simulator-card-title");
    if (title) title.innerText = "Construye tu Boleto";
    const desc = document.getElementById("simulator-card-desc");
    if (desc) desc.innerText = "Selecciona tus 5 números (o más para combos) en la cuadrícula de abajo.";
  } else if (game === 'lotto5') {
    buildManualLottoGrid(35);
    const title = document.getElementById("simulator-card-title");
    if (title) title.innerText = "Construye tu Boleto Lotto 5";
    const desc = document.getElementById("simulator-card-desc");
    if (desc) desc.innerText = "Selecciona tus 5 números en la cuadrícula de 1 al 35.";
  } else if (game === 'zodiac') {
    buildZodiacSelectors();
  } else if (game === 'catochi' || game === 'big4') {
    buildDigitSelectors('catochi-digits-wrapper', 4);
    const title = document.getElementById("simulator-card-title");
    if (title) title.innerText = `Apuesta Manual ${game === 'catochi' ? 'Catochi' : 'Big 4'}`;
    const desc = document.getElementById("simulator-card-desc");
    if (desc) desc.innerText = "Selecciona un dígito del 0 al 9 en cada una de las 4 posiciones.";
  } else if (game === 'landsloterie') {
    buildDigitSelectors('lands-digits-wrapper', 5);
    const title = document.getElementById("simulator-card-title");
    if (title) title.innerText = "Billete de Landsloterie";
    const desc = document.getElementById("simulator-card-desc");
    if (desc) desc.innerText = "Selecciona los 5 dígitos de tu billete (00000 - 99999) para simular la compra.";
  } else if (game === 'minimega') {
    buildManualMiniMegaGrid();
    const title = document.getElementById("simulator-card-title");
    if (title) title.innerText = "Construye tu Boleto Mini Mega";
    const desc = document.getElementById("simulator-card-desc");
    if (desc) desc.innerText = "Selecciona 4 números principales (1 al 30) y 1 Mega Ball (1 al 15) abajo.";
  }

  // Update labels
  if (game === 'zodiac') {
    document.getElementById("metric-label-hottest").innerText = "Signo Más Caliente";
    document.getElementById("metric-label-coldest").innerText = "Signo Más Frío";
    document.getElementById("metric-label-overdue").innerText = "Signo Más Atrasado";
  } else {
    document.getElementById("metric-label-hottest").innerText = "Número Más Caliente";
    document.getElementById("metric-label-coldest").innerText = "Número Más Frío";
    document.getElementById("metric-label-overdue").innerText = "Más Atrasado";
  }

  // Compile statistics & render UI
  appState.filteredHistory = [...draws];
  applyFilters();
  updateWagerInvoice();
}

function buildManualMiniMegaGrid() {
  const numbersGrid = document.getElementById("minimega-numbers-grid");
  if (!numbersGrid) return;
  numbersGrid.innerHTML = "";
  for (let i = 1; i <= 30; i++) {
    const btn = document.createElement("button");
    btn.className = "lotto-cell";
    btn.innerText = i.toString().padStart(2, '0');
    btn.addEventListener("click", () => toggleMiniMegaNumber(i));
    numbersGrid.appendChild(btn);
  }

  const megaGrid = document.getElementById("minimega-megaball-grid");
  if (!megaGrid) return;
  megaGrid.innerHTML = "";
  for (let i = 1; i <= 15; i++) {
    const btn = document.createElement("button");
    btn.className = "lotto-cell";
    btn.innerText = i.toString().padStart(2, '0');
    btn.addEventListener("click", () => selectMiniMegaMegaBall(i));
    megaGrid.appendChild(btn);
  }
}

function toggleMiniMegaNumber(num) {
  SoundEffects.playClick();
  const idx = appState.selectedNumbers.indexOf(num);
  if (idx > -1) {
    appState.selectedNumbers.splice(idx, 1);
  } else {
    if (appState.selectedNumbers.length < 4) {
      appState.selectedNumbers.push(num);
    } else {
      appState.selectedNumbers.shift();
      appState.selectedNumbers.push(num);
    }
  }
  document.querySelectorAll("#minimega-numbers-grid .lotto-cell").forEach((cell, i) => {
    cell.classList.toggle("selected", appState.selectedNumbers.includes(i + 1));
  });
  updateWagerInvoice();
}

function selectMiniMegaMegaBall(num) {
  SoundEffects.playClick();
  appState.selectedMegaBall = num;
  document.querySelectorAll("#minimega-megaball-grid .lotto-cell").forEach((cell, i) => {
    cell.classList.toggle("selected", (i + 1) === num);
  });
  updateWagerInvoice();
}

// Wager panel calculator
function adjustWager(val) {
  let input = document.getElementById("wager-amount");
  if (!input) return;
  let current = parseFloat(input.value) + val;
  if (current < 0.50) current = 0.50;
  if (current > 25.00) current = 25.00;
  input.value = current.toFixed(2);
  
  if (appState.currentGame === 'zodiac') appState.zodiacWager = current;
  else appState.catochiWager = current;
  
  updateWagerInvoice();
}

const wagerAmountEl = document.getElementById("wager-amount");
if (wagerAmountEl) {
  wagerAmountEl.addEventListener("input", (e) => {
    let val = parseFloat(e.target.value);
    if (isNaN(val) || val < 0.50) val = 0.50;
    if (val > 25.00) val = 25.00;
    
    if (appState.currentGame === 'zodiac') appState.zodiacWager = val;
    else appState.catochiWager = val;
    updateWagerInvoice();
  });
}

function updateWagerInvoice() {
  const panel = document.getElementById("wager-invoice-panel");
  if (!panel) return;
  
  let cost = 2.00;
  let label = "Costo de Boleto";
  
  if (appState.currentGame === 'lottodidia') {
    let comboMultiplier = {
      'standard': 1, 'combo3': 351, 'combo4': 26, 'combo6': 6, 'combo7': 21, 'combo8': 56, 'combo9': 126
    };
    let mult = comboMultiplier[appState.selectedCombo] || 1;
    cost = 2.00 * mult;
    if (appState.facilitoEnabled) cost += (1.00 * mult);
    label = `Boleto (${appState.selectedCombo.toUpperCase()})` + (appState.facilitoEnabled ? " + Facilito" : "");
  } else if (appState.currentGame === 'zodiac') {
    cost = appState.zodiacWager;
    label = "Apuesta del Zodiac";
  } else if (appState.currentGame === 'catochi' || appState.currentGame === 'big4') {
    cost = appState.catochiWager;
    label = `Apuesta ${appState.currentGame.toUpperCase()}`;
  } else if (appState.currentGame === 'lotto5') {
    cost = 2.00; // Fixed ticket cost
    label = "Boleto Fijo Lotto 5";
  } else if (appState.currentGame === 'landsloterie') {
    cost = 25.00; // Whole sheet
    label = "Hoja Entera de Billete";
  } else if (appState.currentGame === 'minimega') {
    cost = 5.00;
    if (appState.megaplusEnabled) cost += 2.00;
    label = "Boleto Mini Mega" + (appState.megaplusEnabled ? " + Mega Plus" : "");
  }

  panel.innerHTML = `
    <div class="summary-row" style="margin-top:1rem">
      <span>Concepto:</span>
      <span>${label}</span>
    </div>
    <div class="summary-row">
      <span>Monto Total:</span>
      <span style="font-weight:800; color:var(--neon-cyan)">Afl. ${cost.toFixed(2)}</span>
    </div>
  `;
}

// Interactive selector grid builders
function buildManualLottoGrid(limit) {
  const grid = document.getElementById("manual-lotto-grid");
  if (!grid) return;
  grid.innerHTML = "";
  for (let i = 1; i <= limit; i++) {
    const btn = document.createElement("button");
    btn.className = "lotto-cell";
    btn.innerText = i.toString().padStart(2, '0');
    btn.addEventListener("click", () => toggleLottoNumber(i, limit));
    grid.appendChild(btn);
  }
}

function toggleLottoNumber(num, limit) {
  SoundEffects.playClick();
  const idx = appState.selectedNumbers.indexOf(num);
  
  // Combo rules
  let maxSelectable = 5;
  if (appState.currentGame === 'lottodidia') {
    const rules = {
      'standard': 5, 'combo3': 3, 'combo4': 4, 'combo6': 6, 'combo7': 7, 'combo8': 8, 'combo9': 9
    };
    maxSelectable = rules[appState.selectedCombo] || 5;
  }

  if (idx > -1) {
    appState.selectedNumbers.splice(idx, 1);
  } else {
    if (appState.selectedNumbers.length < maxSelectable) {
      appState.selectedNumbers.push(num);
    } else {
      // Replaced first selected
      appState.selectedNumbers.shift();
      appState.selectedNumbers.push(num);
    }
  }

  // Update UI cells
  document.querySelectorAll(".lotto-cell").forEach((cell, i) => {
    cell.classList.toggle("selected", appState.selectedNumbers.includes(i + 1));
  });
}

function buildZodiacSelectors() {
  const wrapper = document.getElementById("zodiac-digits-wrapper");
  if (!wrapper) return;
  wrapper.innerHTML = "";
  
  for (let col = 0; col < 4; col++) {
    const colDiv = document.createElement("div");
    colDiv.className = "digit-col";
    colDiv.innerHTML = `<span class="digit-col-label">Pos ${col+1}</span>`;
    
    const btnsDiv = document.createElement("div");
    btnsDiv.className = "digit-buttons";
    
    for (let val = 0; val <= 9; val++) {
      const btn = document.createElement("button");
      btn.className = "zodiac-digit-btn";
      btn.innerText = val;
      btn.addEventListener("click", () => {
        SoundEffects.playClick();
        appState.selectedZodiacDigits[col] = val;
        // render active
        btnsDiv.querySelectorAll(".zodiac-digit-btn").forEach(b => {
          b.classList.toggle("selected", parseInt(b.innerText) === val);
        });
      });
      btnsDiv.appendChild(btn);
    }
    colDiv.appendChild(btnsDiv);
    wrapper.appendChild(colDiv);
  }

  // Signs grid
  const signsWrapper = document.getElementById("zodiac-signs-wrapper");
  if (!signsWrapper) return;
  signsWrapper.innerHTML = "";
  const signs = ["Aries", "Tauro", "Geminis", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagitario", "Capricornio", "Acuario", "Piscis"];
  
  signs.forEach(sign => {
    const btn = document.createElement("button");
    btn.className = "zodiac-sign-btn";
    btn.innerText = sign;
    btn.addEventListener("click", () => {
      SoundEffects.playClick();
      appState.selectedZodiacSign = sign;
      signsWrapper.querySelectorAll(".zodiac-sign-btn").forEach(b => {
        b.classList.toggle("selected", b.innerText === sign);
      });
    });
    signsWrapper.appendChild(btn);
  });
}

function buildDigitSelectors(wrapperId, count) {
  const wrapper = document.getElementById(wrapperId);
  if (!wrapper) return;
  wrapper.innerHTML = "";
  
  // reset selected state
  appState.selectedDigits = Array(count).fill(null);

  for (let col = 0; col < count; col++) {
    const colDiv = document.createElement("div");
    colDiv.className = "digit-col";
    colDiv.innerHTML = `<span class="digit-col-label">Pos ${col+1}</span>`;
    
    const btnsDiv = document.createElement("div");
    btnsDiv.className = "digit-buttons";
    
    for (let val = 0; val <= 9; val++) {
      const btn = document.createElement("button");
      btn.className = "zodiac-digit-btn";
      btn.innerText = val;
      btn.addEventListener("click", () => {
        SoundEffects.playClick();
        appState.selectedDigits[col] = val;
        btnsDiv.querySelectorAll(".zodiac-digit-btn").forEach(b => {
          b.classList.toggle("selected", parseInt(b.innerText) === val);
        });
      });
      btnsDiv.appendChild(btn);
    }
    colDiv.appendChild(btnsDiv);
    wrapper.appendChild(colDiv);
  }
}

// Lottery Analytics & Filter computations
function applyFilters() {
  const day = document.getElementById("stats-filter-day").value;
  const week = document.getElementById("stats-filter-week").value;
  const month = document.getElementById("stats-filter-month").value;
  const drawType = document.getElementById("stats-filter-drawtype").value;
  
  const rawHistory = appState.gamesData[appState.currentGame];
  let filtered = [...rawHistory];

  if (day !== 'all') {
    const targetDay = parseInt(day, 10);
    filtered = filtered.filter(draw => {
      const [y, m, d] = draw.date.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      return date.getDay() === targetDay;
    });
  }

  if (week !== 'all') {
    const targetWeek = parseInt(week, 10);
    filtered = filtered.filter(draw => {
      const dayOfMonth = parseInt(draw.date.split("-")[2], 10);
      let wk = 1;
      if (dayOfMonth <= 7) wk = 1;
      else if (dayOfMonth <= 14) wk = 2;
      else if (dayOfMonth <= 21) wk = 3;
      else wk = 4;
      return wk === targetWeek;
    });
  }

  if (month !== 'all') {
    const targetMonth = parseInt(month, 10);
    filtered = filtered.filter(draw => {
      const m = parseInt(draw.date.split("-")[1], 10);
      return (m - 1) === targetMonth;
    });
  }

  if (appState.currentGame === 'zodiac' || appState.currentGame === 'catochi' || appState.currentGame === 'big4') {
    if (drawType !== 'all') {
      filtered = filtered.filter(draw => draw.drawType === drawType);
    }
  }

  // Set active filtered list for history tab too
  appState.filteredHistory = filtered;
  appState.historyPage = 1;

  computeActiveGameStats(filtered);
  renderDashboardUI();
  renderHistoryTable();
}

function calculateTopCombos(draws) {
  let duoFreq = {};
  let trioFreq = {};

  draws.forEach((draw) => {
    let nums = draw.numbers;
    if (!nums || nums.length < 2) return;
    let sorted = [...nums].map(Number).sort((a, b) => a - b);
    
    // Duos
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        let key = `${sorted[i]},${sorted[j]}`;
        duoFreq[key] = (duoFreq[key] || 0) + 1;
      }
    }
    
    // Trios
    if (sorted.length >= 3) {
      for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
          for (let k = j + 1; k < sorted.length; k++) {
            let key = `${sorted[i]},${sorted[j]},${sorted[k]}`;
            trioFreq[key] = (trioFreq[key] || 0) + 1;
          }
        }
      }
    }
  });

  let topDuos = Object.keys(duoFreq).map(key => {
    return {
      nums: key.split(',').map(Number),
      freq: duoFreq[key]
    };
  }).sort((a, b) => b.freq - a.freq).slice(0, 3);

  let topTrios = Object.keys(trioFreq).map(key => {
    return {
      nums: key.split(',').map(Number),
      freq: trioFreq[key]
    };
  }).sort((a, b) => b.freq - a.freq).slice(0, 3);

  return { topDuos, topTrios };
}

function computeActiveGameStats(draws) {
  const total = draws.length;
  if (total === 0) {
    appState.stats = { total: 0, frequencies: {}, hottest: "--", coldest: "--", overdue: "--", topDuos: [], topTrios: [] };
    return;
  }

  let frequencies = {};
  let lastSeen = {};
  
  // Set baselines depending on active game rules
  if (appState.currentGame === 'lottodidia' || appState.currentGame === 'lotto5') {
    let limit = appState.currentGame === 'lottodidia' ? 30 : 35;
    for (let i = 1; i <= limit; i++) {
      frequencies[i] = 0;
      lastSeen[i] = total;
    }
    
    let posFreq = Array(5).fill(null).map(() => {
      let f = {};
      for (let i = 1; i <= limit; i++) f[i] = 0;
      return f;
    });
    
    let totalEvens = 0;
    let totalLows = 0;
    let consecutivePairs = 0;
    
    draws.forEach((draw, index) => {
      let nums = draw.numbers;
      nums.forEach((n, pos) => {
        frequencies[n]++;
        if (lastSeen[n] === total) lastSeen[n] = index;
        if (pos < 5) {
          if (!posFreq[pos][n]) posFreq[pos][n] = 0;
          posFreq[pos][n]++;
        }
      });
      
      totalEvens += nums.filter(n => n % 2 === 0).length;
      totalLows += nums.filter(n => n <= (limit / 2)).length;
      
      let sorted = [...nums].sort((a,b) => a-b);
      for (let j = 0; j < sorted.length - 1; j++) {
        if (sorted[j] + 1 === sorted[j+1]) consecutivePairs++;
      }
    });

    let sortedFreqs = Object.keys(frequencies).map(k => ({ num: parseInt(k), freq: frequencies[k] })).sort((a,b) => b.freq - a.freq);
    let sortedOverdue = Object.keys(lastSeen).map(k => ({ num: parseInt(k), overdue: lastSeen[k] })).sort((a,b) => b.overdue - a.overdue);
    
    const { topDuos, topTrios } = calculateTopCombos(draws);

    appState.stats = {
      total,
      frequencies,
      lastSeen,
      posFrequencies: posFreq,
      hottest: sortedFreqs[0].num,
      coldest: sortedFreqs[sortedFreqs.length - 1].num,
      overdue: sortedOverdue[0].num,
      avgEvens: (totalEvens / (5 * total)).toFixed(2),
      avgLows: (totalLows / (5 * total)).toFixed(2),
      consecutiveChance: ((consecutivePairs / total) * 100).toFixed(1),
      topDuos,
      topTrios
    };

  } else if (appState.currentGame === 'minimega') {
    // Mini Mega: 4 numbers from 1 to 30 + Mega Ball from 1 to 15
    for (let i = 1; i <= 30; i++) {
      frequencies[i] = 0;
      lastSeen[i] = total;
    }
    let megaBallFrequencies = {};
    for (let i = 1; i <= 15; i++) {
      megaBallFrequencies[i] = 0;
    }
    
    let posFreq = Array(4).fill(null).map(() => {
      let f = {};
      for (let i = 1; i <= 30; i++) f[i] = 0;
      return f;
    });

    let totalEvens = 0;
    let totalLows = 0;

    draws.forEach((draw, index) => {
      let nums = draw.numbers;
      nums.forEach((n, pos) => {
        frequencies[n]++;
        if (lastSeen[n] === total) lastSeen[n] = index;
        if (pos < 4) {
          if (!posFreq[pos][n]) posFreq[pos][n] = 0;
          posFreq[pos][n]++;
        }
      });
      if (draw.megaball) {
        megaBallFrequencies[draw.megaball] = (megaBallFrequencies[draw.megaball] || 0) + 1;
      }
      totalEvens += nums.filter(n => n % 2 === 0).length;
      totalLows += nums.filter(n => n <= 15).length;
    });

    let sortedFreqs = Object.keys(frequencies).map(k => ({ num: parseInt(k), freq: frequencies[k] })).sort((a,b) => b.freq - a.freq);
    let sortedOverdue = Object.keys(lastSeen).map(k => ({ num: parseInt(k), overdue: lastSeen[k] })).sort((a,b) => b.overdue - a.overdue);
    let sortedMega = Object.keys(megaBallFrequencies).map(k => ({ num: parseInt(k), freq: megaBallFrequencies[k] })).sort((a,b) => b.freq - a.freq);

    const { topDuos, topTrios } = calculateTopCombos(draws);

    appState.stats = {
      total,
      frequencies,
      lastSeen,
      posFrequencies: posFreq,
      hottest: sortedFreqs[0].num,
      coldest: sortedFreqs[sortedFreqs.length - 1].num,
      overdue: sortedOverdue[0].num,
      avgEvens: (totalEvens / (4 * total)).toFixed(2),
      avgLows: (totalLows / (4 * total)).toFixed(2),
      megaBallFrequencies,
      hottestMega: sortedMega[0] ? sortedMega[0].num : "--",
      topDuos,
      topTrios
    };

  } else if (appState.currentGame === 'zodiac') {
    // 4 digits (0-9) + Signs
    let posFreq = Array(4).fill(null).map(() => Array(10).fill(0));
    let signFreq = {};
    let signs = ["Aries", "Tauro", "Geminis", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagitario", "Capricornio", "Acuario", "Piscis"];
    signs.forEach(s => { signFreq[s] = 0; });
    
    // Calculate actual overdue sign
    let lastSeenSign = {};
    signs.forEach(s => { lastSeenSign[s] = total; });
    
    draws.forEach((draw, index) => {
      draw.numbers.forEach((digit, pos) => {
        if (pos < 4) posFreq[pos][digit]++;
      });
      if (signFreq[draw.sign] !== undefined) {
        signFreq[draw.sign]++;
        if (lastSeenSign[draw.sign] === total) lastSeenSign[draw.sign] = index;
      }
    });

    let sortedSigns = Object.keys(signFreq).map(k => ({ name: k, freq: signFreq[k] })).sort((a,b) => b.freq - a.freq);
    let sortedOverdueSigns = Object.keys(lastSeenSign).map(k => ({ name: k, overdue: lastSeenSign[k] })).sort((a,b) => b.overdue - a.overdue);
    
    appState.stats = {
      total,
      hottest: sortedSigns[0].name,
      coldest: sortedSigns[sortedSigns.length - 1].name,
      overdue: sortedOverdueSigns[0].name,
      signFrequencies: signFreq,
      posFrequencies: posFreq
    };
    
  } else if (appState.currentGame === 'catochi' || appState.currentGame === 'big4' || appState.currentGame === 'landsloterie') {
    // Digits frequency
    let digitCount = appState.currentGame === 'landsloterie' ? 5 : 4;
    let posFreq = Array(digitCount).fill(null).map(() => Array(10).fill(0));
    
    // Calculate actual overdue digit
    let lastSeenDigit = {};
    for (let d = 0; d <= 9; d++) {
      lastSeenDigit[d] = total;
    }
    
    draws.forEach((draw, index) => {
      // For Catochi, check first prize number. For others, check single numbers
      let numbersStr = draw.numbers[0].toString().padStart(digitCount, '0');
      for (let j = 0; j < digitCount; j++) {
        let val = parseInt(numbersStr[j]);
        if (!isNaN(val)) {
          posFreq[j][val]++;
          if (lastSeenDigit[val] === total) lastSeenDigit[val] = index;
        }
      }
    });

    // Find hottest digit overall
    let sumFreq = Array(10).fill(0);
    for (let pos = 0; pos < digitCount; pos++) {
      for (let val = 0; val <= 9; val++) {
        sumFreq[val] += posFreq[pos][val];
      }
    }
    
    let sortedDigits = sumFreq.map((freq, idx) => ({ digit: idx, freq })).sort((a,b) => b.freq - a.freq);
    let sortedOverdueDigits = Object.keys(lastSeenDigit).map(k => ({ digit: parseInt(k), overdue: lastSeenDigit[k] })).sort((a,b) => b.overdue - a.overdue);

    appState.stats = {
      total,
      frequencies: sumFreq,
      posFrequencies: posFreq,
      hottest: sortedDigits[0].digit,
      coldest: sortedDigits[9].digit,
      overdue: sortedOverdueDigits[0].digit
    };
  }
}

// Render Dashboard Data
function renderDashboardUI() {
  const s = appState.stats;
  
  document.getElementById("stat-total-draws").innerText = s.total;
  document.getElementById("stat-hottest").innerText = s.hottest;
  document.getElementById("stat-coldest").innerText = s.coldest;
  document.getElementById("stat-overdue").innerText = s.overdue;

  // Toggle sections
  const consecBox = document.querySelector(".consecutive-only");
  if (consecBox) consecBox.style.display = appState.currentGame === 'lottodidia' ? 'block' : 'none';

  if (appState.currentGame === 'lottodidia' || appState.currentGame === 'lotto5' || appState.currentGame === 'minimega') {
    renderStandardCharts();
  } else {
    renderZodiacCharts();
  }
}

function renderStandardCharts() {
  const s = appState.stats;
  const container = document.getElementById("general-freq-chart");
  container.innerHTML = "";
  
  if (s.total === 0) return;

  const limit = (appState.currentGame === 'lottodidia' || appState.currentGame === 'minimega') ? 30 : 35;
  const freqs = Object.values(s.frequencies);
  const max = Math.max(...freqs);
  
  document.getElementById("frequency-chart-title").innerText = `Frecuencia General (${appState.currentGame === 'lotto5' ? '1 a 35' : '1 a 30'})`;

  for (let i = 1; i <= limit; i++) {
    const f = s.frequencies[i] || 0;
    const pct = max > 0 ? (f / max) * 100 : 0;
    
    const row = document.createElement("div");
    row.className = "chart-bar-row";
    row.innerHTML = `
      <div class="chart-label chart-label-ball">${formatBall(i)}</div>
      <div class="chart-bar-wrapper">
        <div class="chart-bar" style="width: ${pct}%"></div>
      </div>
      <div class="chart-value">${f}</div>
    `;
    container.appendChild(row);
  }

  // Even odd bars (safeguarded)
  const evenOddEl = document.getElementById("bal-even-odd-ratio");
  if (evenOddEl) {
    const evenPct = Math.round(s.avgEvens * 100);
    evenOddEl.innerText = `${evenPct}% Par / ${100-evenPct}% Impar`;
    const evenOddBar = document.getElementById("balance-even-odd-bar");
    if (evenOddBar) {
      evenOddBar.innerHTML = `
        <div class="balance-segment purple" style="width: ${evenPct}%">${evenPct}% Pares</div>
        <div class="balance-segment cyan" style="width: ${100 - evenPct}%">${100 - evenPct}% Impares</div>
      `;
    }
  }

  const lowHighEl = document.getElementById("bal-low-high-ratio");
  if (lowHighEl) {
    const lowPct = Math.round(s.avgLows * 100);
    lowHighEl.innerText = `${lowPct}% Bajo / ${100-lowPct}% Alto`;
    const lowHighBar = document.getElementById("balance-low-high-bar");
    if (lowHighBar) {
      lowHighBar.innerHTML = `
        <div class="balance-segment purple" style="width: ${lowPct}%">${lowPct}% Bajos</div>
        <div class="balance-segment cyan" style="width: ${100 - lowPct}%">${100 - lowPct}% Altos</div>
      `;
    }
  }

  if (appState.currentGame === 'lottodidia') {
    const consecutiveEl = document.getElementById("stat-consecutive-pct");
    if (consecutiveEl) {
      consecutiveEl.innerText = `${s.consecutiveChance}%`;
    }
  }

  // Render top Duos and Trios
  const duosList = document.getElementById("top-duos-list");
  if (duosList) {
    duosList.innerHTML = "";
    if (s.topDuos && s.topDuos.length > 0) {
      s.topDuos.forEach(duo => {
        const item = document.createElement("div");
        item.className = "combo-item";
        item.innerHTML = `
          <div class="combo-balls-row">
            ${duo.nums.map(n => formatBall(n, 'match')).join('')}
          </div>
          <div class="combo-freq">${duo.freq} veces</div>
        `;
        duosList.appendChild(item);
      });
    } else {
      duosList.innerHTML = `<div style="color:var(--text-muted); font-size:0.85rem">No hay datos suficientes</div>`;
    }
  }

  const triosList = document.getElementById("top-trios-list");
  if (triosList) {
    triosList.innerHTML = "";
    if (s.topTrios && s.topTrios.length > 0) {
      s.topTrios.forEach(trio => {
        const item = document.createElement("div");
        item.className = "combo-item";
        item.innerHTML = `
          <div class="combo-balls-row">
            ${trio.nums.map(n => formatBall(n, 'match')).join('')}
          </div>
          <div class="combo-freq">${trio.freq} veces</div>
        `;
        triosList.appendChild(item);
      });
    } else {
      triosList.innerHTML = `<div style="color:var(--text-muted); font-size:0.85rem">No hay datos suficientes</div>`;
    }
  }

  // Render positions
  const tabsWrapper = document.getElementById("lotto-position-tabs");
  tabsWrapper.innerHTML = "";
  
  const numPos = (appState.currentGame === 'minimega') ? 4 : 5;
  for (let pos = 0; pos < numPos; pos++) {
    const btn = document.createElement("button");
    btn.className = `pos-btn ${appState.positionActiveTab === pos ? 'active' : ''}`;
    btn.innerText = `Pos ${pos+1}`;
    btn.addEventListener("click", () => {
      appState.positionActiveTab = pos;
      tabsWrapper.querySelectorAll(".pos-btn").forEach((b, idx) => b.classList.toggle("active", idx === pos));
      renderPositionLists();
    });
    tabsWrapper.appendChild(btn);
  }
  renderPositionLists();

  // Render Mega Ball chart (Solo Mini Mega)
  if (appState.currentGame === 'minimega') {
    const mmChart = document.getElementById("minimega-megaball-chart");
    if (mmChart) {
      mmChart.innerHTML = "";
      const megaBallFreqs = s.megaBallFrequencies || {};
      let freqs = Object.values(megaBallFreqs);
      let max = freqs.length > 0 ? Math.max(...freqs) : 0;

      for (let i = 1; i <= 15; i++) {
        let f = megaBallFreqs[i] || 0;
        let pct = max > 0 ? (f / max) * 100 : 0;

        let row = document.createElement("div");
        row.className = "chart-bar-row";
        row.innerHTML = `
          <div class="chart-label chart-label-ball"><div class="small-ball-inline match-gold">${i.toString().padStart(2, '0')}</div></div>
          <div class="chart-bar-wrapper">
            <div class="chart-bar" style="width: ${pct}%; background: linear-gradient(90deg, rgba(255, 190, 11, 0.3) 0%, var(--neon-gold) 100%);"></div>
          </div>
          <div class="chart-value">${f}</div>
        `;
        mmChart.appendChild(row);
      }
    }
  }
}

function formatBall(val, classType = 'match') {
  let cls = classType;
  if (cls === 'match') {
    switch (appState.currentGame) {
      case 'lottodidia': cls = 'match'; break;
      case 'lotto5': cls = 'match-emerald'; break;
      case 'minimega': cls = 'match-purple'; break;
      case 'zodiac': cls = 'match-gold'; break;
      case 'catochi': cls = 'match-pink'; break;
      case 'big4': cls = 'match-cyan'; break;
      case 'landsloterie': cls = 'match-orange'; break;
    }
  }
  const isTwoDigitGame = (appState.currentGame === 'lottodidia' || appState.currentGame === 'lotto5' || appState.currentGame === 'minimega');
  const formattedVal = isTwoDigitGame ? val.toString().padStart(2, '0') : val.toString();
  return `<div class="small-ball-inline ${cls}">${formattedVal}</div>`;
}

function getBestPartner(game, position, targetValue) {
  const draws = appState.gamesData[game] || [];
  const coCounts = {};

  const isTwoDigitGame = (game === 'lottodidia' || game === 'lotto5' || game === 'minimega');

  draws.forEach(draw => {
    if (isTwoDigitGame) {
      if (draw.numbers) {
        const sorted = [...draw.numbers].sort((a,b) => a-b);
        if (sorted[position] === targetValue) {
          sorted.forEach((num, idx) => {
            if (idx !== position) {
              coCounts[num] = (coCounts[num] || 0) + 1;
            }
          });
        }
      }
    } else if (game === 'zodiac') {
      if (draw.numbers && draw.numbers[position] === targetValue) {
        draw.numbers.forEach((digit, idx) => {
          if (idx !== position) {
            coCounts[digit] = (coCounts[digit] || 0) + 1;
          }
        });
      }
    } else {
      const digitCount = game === 'landsloterie' ? 5 : 4;
      if (draw.numbers && draw.numbers[0] !== undefined) {
        const digitsStr = draw.numbers[0].toString().padStart(digitCount, '0');
        const valAtPos = parseInt(digitsStr[position], 10);
        if (valAtPos === targetValue) {
          for (let idx = 0; idx < digitCount; idx++) {
            if (idx !== position) {
              const digitVal = parseInt(digitsStr[idx], 10);
              if (!isNaN(digitVal)) {
                coCounts[digitVal] = (coCounts[digitVal] || 0) + 1;
              }
            }
          }
        }
      }
    }
  });

  let bestVal = null;
  let maxCo = 0;
  Object.keys(coCounts).forEach(k => {
    const val = parseInt(k, 10);
    if (coCounts[k] > maxCo) {
      maxCo = coCounts[k];
      bestVal = val;
    }
  });

  if (bestVal === null) {
    if (game === 'lotto5') bestVal = targetValue === 1 ? 2 : 1;
    else if (game === 'lottodidia' || game === 'minimega') bestVal = targetValue === 1 ? 2 : 1;
    else bestVal = targetValue === 0 ? 1 : 0;
  }

  return { val: bestVal, coFreq: maxCo };
}

function renderPositionLists() {
  const game = appState.currentGame;
  const isLotto = (game === 'lottodidia' || game === 'lotto5' || game === 'minimega');
  const s = appState.stats;
  const activeSource = appState.filteredHistory || [];
  const total = activeSource.length;
  const lang = appState.language || 'es';
  
  const numPos = isLotto ? (game === 'minimega' ? 4 : 5) : (game === 'landsloterie' ? 5 : 4);
  
  if (appState.positionActiveTab >= numPos) {
    appState.positionActiveTab = 0;
  }
  const currentPos = appState.positionActiveTab;
  
  // Render tabs
  const tabsWrapper = document.getElementById("lotto-position-tabs");
  if (tabsWrapper) {
    tabsWrapper.innerHTML = "";
    const posLabelText = lang === 'es' ? 'Pos' : (lang === 'pap' ? 'Pos' : (lang === 'nl' ? 'Pos' : 'Pos'));
    for (let p = 0; p < numPos; p++) {
      const btn = document.createElement("button");
      btn.className = `pos-btn ${currentPos === p ? 'active' : ''}`;
      btn.innerText = `${posLabelText} ${p+1}`;
      btn.addEventListener("click", () => {
        appState.positionActiveTab = p;
        tabsWrapper.querySelectorAll(".pos-btn").forEach((b, idx) => b.classList.toggle("active", idx === p));
        renderPositionLists();
      });
      tabsWrapper.appendChild(btn);
    }
  }

  // Update card tag/title depending on game rules
  const tagEl = document.getElementById("pos-card-tag");
  if (tagEl) {
    const exitOrderText = {
      es: "Orden de Salida", en: "Exit Order", nl: "Uitgangsvolgorde", pap: "Orden di Salida"
    };
    const digitPosText = {
      es: "Posición de Dígito", en: "Digit Position", nl: "Cijferpositie", pap: "Posicion di Digit"
    };
    tagEl.innerText = isLotto ? exitOrderText[lang] : digitPosText[lang];
  }

  let list = [];

  if (isLotto) {
    let limit = (game === 'lottodidia' || game === 'minimega') ? 30 : 35;
    let posFreqs = Array(limit + 1).fill(0);
    let posSeen = Array(limit + 1).fill(total);

    activeSource.forEach((draw, index) => {
      let sorted = [...draw.numbers].sort((a,b) => a-b);
      let n = sorted[currentPos];
      if (n !== undefined) {
        posFreqs[n]++;
        if (posSeen[n] === total) posSeen[n] = index;
      }
    });

    for (let i = 1; i <= limit; i++) {
      list.push({ num: i, freq: posFreqs[i], overdue: posSeen[i] });
    }
  } else {
    // Digit games: values are 0 to 9
    let posFreqs = Array(10).fill(0);
    let posSeen = Array(10).fill(total);

    activeSource.forEach((draw, index) => {
      const digits = getDigitsArray(draw, game);
      let n = digits[currentPos];
      if (n !== undefined && n !== null && !isNaN(n)) {
        posFreqs[n]++;
        if (posSeen[n] === total) posSeen[n] = index;
      }
    });

    for (let i = 0; i <= 9; i++) {
      list.push({ num: i, freq: posFreqs[i], overdue: posSeen[i] });
    }
  }

  const hots = [...list].sort((a,b) => b.freq - a.freq).slice(0, 5);

  const timesText = lang === 'es' ? 'veces' : (lang === 'pap' ? 'biaha' : (lang === 'nl' ? 'keer' : 'times'));

  const posHotList = document.getElementById("pos-hot-list");
  if (posHotList) {
    posHotList.innerHTML = hots.map(h => `
      <div class="pos-list-item" style="display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          ${formatBall(h.num)}
        </div>
        <span>${h.freq} ${timesText}</span>
      </div>
    `).join('');
  }

  const posOverdueList = document.getElementById("pos-overdue-list");
  if (posOverdueList) {
    posOverdueList.innerHTML = hots.map(h => {
      const partner = getBestPartner(game, currentPos, h.num);
      return `
        <div class="pos-list-item" style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            ${formatBall(partner.val)}
          </div>
          <span>(${partner.coFreq} ${timesText})</span>
        </div>
      `;
    }).join('');
  }
}

function getDigitsArray(draw, game) {
  if (game === 'zodiac') {
    return draw.numbers; // [d1, d2, d3, d4]
  } else {
    const digitCount = game === 'landsloterie' ? 5 : 4;
    if (draw.numbers && draw.numbers[0] !== undefined) {
      const numStr = draw.numbers[0].toString().padStart(digitCount, '0');
      return numStr.split('').map(Number);
    }
    return Array(digitCount).fill(0);
  }
}

function renderZodiacCharts() {
  const s = appState.stats;
  
  // Zodiac Signs bar chart
  if (appState.currentGame === 'zodiac') {
    const signChart = document.getElementById("zodiac-sign-chart");
    signChart.innerHTML = "";
    let freqs = Object.values(s.signFrequencies);
    let max = Math.max(...freqs);
    
    Object.keys(s.signFrequencies).forEach(k => {
      let f = s.signFrequencies[k];
      let pct = max > 0 ? (f / max) * 100 : 0;
      
      let row = document.createElement("div");
      row.className = "chart-bar-row";
      row.innerHTML = `
        <div class="chart-label">${k}</div>
        <div class="chart-bar-wrapper">
          <div class="chart-bar" style="width: ${pct}%"></div>
        </div>
        <div class="chart-value">${f}</div>
      `;
      signChart.appendChild(row);
    });
  }

  // Digits by position chart
  const digitChart = document.getElementById("zodiac-digit-chart");
  digitChart.innerHTML = "";
  
  let digitCount = appState.currentGame === 'landsloterie' ? 5 : 4;
  if (appState.zodiacPositionActiveTab >= digitCount) {
    appState.zodiacPositionActiveTab = 0;
  }
  let activePos = appState.zodiacPositionActiveTab;
  
  // Generate position selector buttons dynamically
  const tabsWrapper = document.getElementById("zodiac-digit-pos-controls");
  tabsWrapper.innerHTML = "";
  const lang = appState.language || 'es';
  const posText = lang === 'es' ? 'Posición' : (lang === 'pap' ? 'Posicion' : (lang === 'nl' ? 'Positie' : 'Position'));
  for (let pos = 0; pos < digitCount; pos++) {
    const btn = document.createElement("button");
    btn.className = `pos-btn ${activePos === pos ? 'active' : ''}`;
    btn.innerText = `${posText} ${pos+1}`;
    btn.addEventListener("click", () => {
      appState.zodiacPositionActiveTab = pos;
      renderZodiacCharts();
    });
    tabsWrapper.appendChild(btn);
  }
  
  let posF = s.posFrequencies[activePos];
  let maxPos = Math.max(...posF);

  for (let i = 0; i <= 9; i++) {
    let f = posF[i];
    let pct = maxPos > 0 ? (f / maxPos) * 100 : 0;
    let row = document.createElement("div");
    row.className = "chart-bar-row";
    row.innerHTML = `
      <div class="chart-label chart-label-ball">${formatBall(i)}</div>
      <div class="chart-bar-wrapper">
        <div class="chart-bar" style="width: ${pct}%"></div>
      </div>
      <div class="chart-value">${f}</div>
    `;
    digitChart.appendChild(row);
  }

  // Balances
  let oddCount = 0;
  let evenCount = 0;
  let lowCount = 0;
  let highCount = 0;
  
  const activeDraws = appState.filteredHistory;
  activeDraws.forEach(draw => {
    const digits = getDigitsArray(draw, appState.currentGame);
    digits.forEach(n => {
      if (n !== null && !isNaN(n)) {
        if (n % 2 === 0) evenCount++; else oddCount++;
        if (n <= 4) lowCount++; else highCount++;
      }
    });
  });

  let totalD = (oddCount + evenCount);
  let evenPct = totalD > 0 ? Math.round((evenCount / totalD) * 100) : 50;
  let lowPct = totalD > 0 ? Math.round((lowCount / totalD) * 100) : 50;

  document.getElementById("zodiac-bal-even-odd-ratio").innerText = `${evenPct}% Par / ${100-evenPct}% Impar`;
  document.getElementById("zodiac-balance-even-odd-bar").innerHTML = `
    <div class="balance-segment purple" style="width: ${evenPct}%">${evenPct}% Pares</div>
    <div class="balance-segment cyan" style="width: ${100 - evenPct}%">${100 - evenPct}% Impares</div>
  `;

  document.getElementById("zodiac-bal-low-high-ratio").innerText = `${lowPct}% Bajo / ${100-lowPct}% Alto`;
  document.getElementById("zodiac-balance-low-high-bar").innerHTML = `
    <div class="balance-segment purple" style="width: ${lowPct}%">${lowPct}% Bajos</div>
    <div class="balance-segment cyan" style="width: ${100 - lowPct}%">${100 - lowPct}% Altos</div>
  `;

  renderPositionLists();
}

// Lottery Recommendation Generator
function generateRecommendation() {
  SoundEffects.playClick();
  
  const game = appState.currentGame;
  let select = document.getElementById("lotto-strategy-selector");
  if (game === 'zodiac') {
    select = document.getElementById("zodiac-strategy-selector");
  }
  const activeOpt = select ? select.querySelector(".strategy-option.active") : null;
  const strategy = activeOpt ? activeOpt.dataset.strategy : 'balanced';
  
  // Recommendation for Digit Games (Catochi, Big 4, Landsloterie)
  if (game === 'catochi' || game === 'big4' || game === 'landsloterie') {
    let digitCount = game === 'landsloterie' ? 5 : 4;
    let digits = [];
    const s = appState.stats;
    for (let pos = 0; pos < digitCount; pos++) {
      let freqs = s.posFrequencies[pos];
      let sorted = freqs.map((freq, idx) => ({ digit: idx, freq })).sort((a,b) => b.freq - a.freq);
      if (strategy === 'hot') {
        let pool = sorted.slice(0, 3).map(x => x.digit);
        digits.push(getRandomFromPool(pool, 1)[0]);
      } else if (strategy === 'overdue') {
        let pool = sorted.slice(7, 10).map(x => x.digit);
        digits.push(getRandomFromPool(pool, 1)[0]);
      } else if (strategy === 'loco') {
        digits.push(randInt(0, 9));
      } else {
        let pool = sorted.slice(1, 9).map(x => x.digit);
        digits.push(getRandomFromPool(pool, 1)[0]);
      }
    }
    
    const container = document.getElementById("recommendation-balls");
    if (container) {
      container.innerHTML = digits.map((d, idx) => `<div class="ball ball-digit gen-ball-style-${(idx % 3) + 1}">${d}</div>`).join('');
    }
    
    appState.selectedDigits = [...digits];
    
    const wrapperId = game === 'landsloterie' ? 'lands-digits-wrapper' : 'catochi-digits-wrapper';
    const gridEl = document.getElementById(wrapperId);
    if (gridEl) {
      gridEl.querySelectorAll(".digit-col").forEach((colDiv, col) => {
        colDiv.querySelectorAll(".zodiac-digit-btn").forEach(btn => {
          btn.classList.toggle("selected", parseInt(btn.innerText) === digits[col]);
        });
      });
    }
    return;
  }
  
  if (game === 'minimega') {
    let combination = [];
    let limit = 30;
    const s = appState.stats;
    
    let list = [];
    for (let i = 1; i <= limit; i++) {
      list.push({ num: i, freq: s.frequencies[i] || 0, overdue: s.lastSeen ? (s.lastSeen[i] || 0) : 0 });
    }
    
    if (strategy === 'loco') {
      combination = randUniqueNumbers(4, 1, limit);
    } else if (strategy === 'hot') {
      let pool = list.sort((a,b) => b.freq - a.freq).slice(0, 10).map(x => x.num);
      combination = getRandomFromPool(pool, 4);
    } else if (strategy === 'overdue') {
      let pool = list.sort((a,b) => b.overdue - a.overdue).slice(0, 10).map(x => x.num);
      combination = getRandomFromPool(pool, 4);
    } else if (strategy === 'positional') {
      for (let pos = 0; pos < 4; pos++) {
        let posFreq = s.posFrequencies[pos];
        let sortedPos = Object.keys(posFreq)
          .map(k => ({ num: parseInt(k), freq: posFreq[k] }))
          .sort((a,b) => b.freq - a.freq)
          .slice(0, 3)
          .map(x => x.num);
        
        let chosen = getRandomFromPool(sortedPos, 1)[0];
        let attempts = 0;
        while (combination.includes(chosen) && attempts < 10) {
          chosen = sortedPos[Math.floor(Math.random() * sortedPos.length)];
          attempts++;
        }
        if (combination.includes(chosen)) {
          for (let i = 1; i <= limit; i++) {
            if (!combination.includes(i)) {
              chosen = i;
              break;
            }
          }
        }
        combination.push(chosen);
      }
    } else {
      let sortedByFreq = [...list].sort((a,b) => b.freq - a.freq);
      let hotPool = sortedByFreq.slice(0, 8).map(x => x.num);
      let midPool = sortedByFreq.slice(8, 22).map(x => x.num);
      let overduePool = [...list].sort((a,b) => b.overdue - a.overdue).slice(0, 8).map(x => x.num);
      
      let selectedHot = getRandomFromPool(hotPool, 1);
      combination.push(...selectedHot);
      
      let selectedMid = getRandomFromPool(midPool.filter(x => !combination.includes(x)), 2);
      combination.push(...selectedMid);
      
      let filteredOverdue = overduePool.filter(x => !combination.includes(x));
      if (filteredOverdue.length === 0) filteredOverdue = overduePool;
      let selectedOverdue = getRandomFromPool(filteredOverdue, 1);
      combination.push(...selectedOverdue);
    }
    combination.sort((a,b) => a-b);
    
    let megaBall = 1;
    let megaList = [];
    for (let i = 1; i <= 15; i++) {
      megaList.push({ num: i, freq: s.megaBallFrequencies[i] || 0 });
    }
    let sortedMega = megaList.sort((a,b) => b.freq - a.freq);
    
    if (strategy === 'loco') {
      megaBall = randInt(1, 15);
    } else if (strategy === 'hot') {
      let pool = sortedMega.slice(0, 5).map(x => x.num);
      megaBall = getRandomFromPool(pool, 1)[0];
    } else if (strategy === 'overdue') {
      let pool = sortedMega.slice(10, 15).map(x => x.num);
      megaBall = getRandomFromPool(pool, 1)[0];
    } else {
      let pool = sortedMega.slice(4, 11).map(x => x.num);
      megaBall = getRandomFromPool(pool, 1)[0];
    }

    const container = document.getElementById("recommendation-balls");
    if (container) {
      container.innerHTML = `
        ${combination.map((num, idx) => `<div class="ball ball-cyan gen-ball-style-${(idx % 3) + 1}">${num.toString().padStart(2, '0')}</div>`).join('')}
        <div class="ball ball-megaball gen-ball-style-${(combination.length % 3) + 1}">${megaBall.toString().padStart(2, '0')}</div>
      `;
    }

    appState.selectedNumbers = [...combination];
    appState.selectedMegaBall = megaBall;

    document.querySelectorAll("#minimega-numbers-grid .lotto-cell").forEach((cell, i) => {
      cell.classList.toggle("selected", combination.includes(i + 1));
    });
    document.querySelectorAll("#minimega-megaball-grid .lotto-cell").forEach((cell, i) => {
      cell.classList.toggle("selected", (i + 1) === megaBall);
    });
    return;
  }

  let limit = appState.currentGame === 'lotto5' ? 35 : 30;
  let combination = [];
  const s = appState.stats;

  if (strategy === 'loco') {
    combination = randUniqueNumbers(5, 1, limit);
  } else {
    let list = [];
    for (let i = 1; i <= limit; i++) {
      list.push({ num: i, freq: s.frequencies[i] || 0, overdue: s.lastSeen ? (s.lastSeen[i] || 0) : 0 });
    }

    if (strategy === 'hot') {
      let pool = list.sort((a,b) => b.freq - a.freq).slice(0, 12).map(x => x.num);
      combination = getRandomFromPool(pool, 5);
    } else if (strategy === 'overdue') {
      let pool = list.sort((a,b) => b.overdue - a.overdue).slice(0, 12).map(x => x.num);
      combination = getRandomFromPool(pool, 5);
    } else if (strategy === 'positional') {
      for (let pos = 0; pos < 5; pos++) {
        let posFreq = s.posFrequencies[pos];
        let sortedPos = Object.keys(posFreq)
          .map(k => ({ num: parseInt(k), freq: posFreq[k] }))
          .sort((a,b) => b.freq - a.freq)
          .slice(0, 3)
          .map(x => x.num);
        
        let chosen = getRandomFromPool(sortedPos, 1)[0];
        let attempts = 0;
        while (combination.includes(chosen) && attempts < 10) {
          chosen = sortedPos[Math.floor(Math.random() * sortedPos.length)];
          attempts++;
        }
        if (combination.includes(chosen)) {
          for (let i = 1; i <= limit; i++) {
            if (!combination.includes(i)) {
              chosen = i;
              break;
            }
          }
        }
        combination.push(chosen);
      }
    } else {
      let sortedByFreq = [...list].sort((a,b) => b.freq - a.freq);
      let hotPool = sortedByFreq.slice(0, 10).map(x => x.num);
      let midPool = sortedByFreq.slice(10, limit - 10).map(x => x.num);
      let overduePool = [...list].sort((a,b) => b.overdue - a.overdue).slice(0, 10).map(x => x.num);
      
      let selectedHot = getRandomFromPool(hotPool, 2);
      combination.push(...selectedHot);
      
      let selectedMid = getRandomFromPool(midPool.filter(x => !combination.includes(x)), 2);
      combination.push(...selectedMid);
      
      let filteredOverdue = overduePool.filter(x => !combination.includes(x));
      if (filteredOverdue.length === 0) filteredOverdue = overduePool;
      let selectedOverdue = getRandomFromPool(filteredOverdue, 1);
      combination.push(...selectedOverdue);
    }
  }

  combination.sort((a,b) => a-b);
  
  const container = document.getElementById("recommendation-balls");
  if (container) {
    container.innerHTML = combination.map((num, idx) => `
      <div class="ball ball-cyan gen-ball-style-${(idx % 3) + 1}">${num.toString().padStart(2, '0')}</div>
    `).join('');
  }

  appState.selectedNumbers = [...combination];
  document.querySelectorAll(".lotto-cell").forEach((cell, i) => {
    cell.classList.toggle("selected", combination.includes(i + 1));
  });
}

function generateZodiacRecommendation() {
  SoundEffects.playClick();
  const select = document.getElementById("zodiac-strategy-selector");
  const activeOpt = select ? select.querySelector(".strategy-option.active") : null;
  const strategy = activeOpt ? activeOpt.dataset.strategy : 'zodiac-balanced';

  let digits = [];
  const signs = ["Aries", "Tauro", "Geminis", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagitario", "Capricornio", "Acuario", "Piscis"];
  let sign = "";

  const s = appState.stats;

  if (strategy === 'zodiac-loco') {
    digits = [randInt(0,9), randInt(0,9), randInt(0,9), randInt(0,9)];
    sign = signs[randInt(0,11)];
  } else {
    // Digit selection
    for (let pos = 0; pos < 4; pos++) {
      let freqs = s.posFrequencies[pos];
      let sorted = freqs.map((freq, idx) => ({ digit: idx, freq })).sort((a,b) => b.freq - a.freq);
      if (strategy === 'zodiac-hot') {
        let pool = sorted.slice(0, 3).map(x => x.digit);
        digits.push(getRandomFromPool(pool, 1)[0]);
      } else if (strategy === 'zodiac-overdue') {
        let pool = sorted.slice(7, 10).map(x => x.digit);
        digits.push(getRandomFromPool(pool, 1)[0]);
      } else {
        // balanced
        let pool = sorted.slice(1, 9).map(x => x.digit);
        digits.push(getRandomFromPool(pool, 1)[0]);
      }
    }
    
    // Sign strategy
    let sortedSigns = Object.keys(s.signFrequencies).map(k => ({ name: k, freq: s.signFrequencies[k] })).sort((a,b) => b.freq - a.freq);
    if (strategy === 'zodiac-hot') {
      let pool = sortedSigns.slice(0, 4).map(x => x.name);
      sign = getRandomFromPool(pool, 1)[0];
    } else if (strategy === 'zodiac-overdue') {
      let pool = sortedSigns.slice(8, 12).map(x => x.name);
      sign = getRandomFromPool(pool, 1)[0];
    } else {
      let pool = sortedSigns.slice(2, 10).map(x => x.name);
      sign = getRandomFromPool(pool, 1)[0];
    }
  }

  // Emoji mapping for Zodiac Sign Pill Capsule
  const ZODIAC_EMOJIS = {
    "Aries": "♈ Aries",
    "Tauro": "♉ Tauro",
    "Geminis": "♊ Géminis",
    "Cancer": "♋ Cáncer",
    "Leo": "♌ Leo",
    "Virgo": "♍ Virgo",
    "Libra": "♎ Libra",
    "Scorpio": "♏ Escorpio",
    "Sagitario": "♐ Sagitario",
    "Capricornio": "♑ Capricornio",
    "Acuario": "♒ Acuario",
    "Piscis": "♓ Piscis"
  };
  const signDisplay = ZODIAC_EMOJIS[sign] || sign;

  // Render
  const container = document.getElementById("recommendation-balls-zodiac");
  if (container) {
    container.innerHTML = `
      ${digits.map((d, idx) => `<div class="ball ball-digit gen-ball-style-${(idx % 3) + 1}">${d}</div>`).join('')}
      <div class="ball-zodiac-pill gen-ball-style-${(digits.length % 3) + 1}">${signDisplay}</div>
    `;
  }

  // Set selectors state
  appState.selectedZodiacDigits = [...digits];
  appState.selectedZodiacSign = sign;
  
  // Set selectors active
  const digitsGrid = document.getElementById("zodiac-digits-wrapper");
  if (digitsGrid) {
    digitsGrid.querySelectorAll(".digit-col").forEach((colDiv, col) => {
      colDiv.querySelectorAll(".zodiac-digit-btn").forEach(btn => {
        btn.classList.toggle("selected", parseInt(btn.innerText) === digits[col]);
      });
    });
  }

  const signsGrid = document.getElementById("zodiac-signs-wrapper");
  if (signsGrid) {
    signsGrid.querySelectorAll(".zodiac-sign-btn").forEach(btn => {
      btn.classList.toggle("selected", btn.innerText === sign);
    });
  }
}

// Bind clicks on strategy options
document.querySelectorAll(".strategy-option").forEach(opt => {
  opt.addEventListener("click", (e) => {
    const parent = e.currentTarget.parentElement;
    parent.querySelectorAll(".strategy-option").forEach(o => o.classList.remove("active"));
    e.currentTarget.classList.add("active");
  });
});

// Backtesting Simulation Engine
function runBacktesting() {
  SoundEffects.playDrawSound();
  
  const game = appState.currentGame;
  const history = appState.gamesData[game];
  
  // Validate selection
  if (game === 'lottodidia' || game === 'lotto5') {
    let limit = game === 'lotto5' ? 5 : 5; // standard simple
    if (game === 'lottodidia') {
      const rules = { 'standard': 5, 'combo3': 3, 'combo4': 4, 'combo6': 6, 'combo7': 7, 'combo8': 8, 'combo9': 9 };
      limit = rules[appState.selectedCombo] || 5;
    }
    if (appState.selectedNumbers.length < limit) {
      alert(`Por favor, selecciona al menos ${limit} números en el boleto.`);
      return;
    }
  } else if (game === 'zodiac') {
    if (appState.selectedZodiacDigits.includes(null) || !appState.selectedZodiacSign) {
      alert("Por favor, selecciona los 4 dígitos y el signo zodiacal.");
      return;
    }
  } else if (game === 'catochi' || game === 'big4') {
    if (appState.selectedDigits.slice(0,4).includes(null)) {
      alert("Por favor, selecciona los 4 dígitos del número.");
      return;
    }
  } else if (game === 'landsloterie') {
    if (appState.selectedDigits.includes(null)) {
      alert("Por favor, selecciona los 5 dígitos del billete.");
      return;
    }
  } else if (game === 'minimega') {
    if (appState.selectedNumbers.length < 4) {
      alert("Por favor, selecciona 4 números principales en el boleto.");
      return;
    }
    if (!appState.selectedMegaBall) {
      alert("Por favor, selecciona el Mega Ball.");
      return;
    }
  }

  // Setup Backtest Analytics
  let totalInvestment = 0;
  let totalWon = 0;
  let winsList = [];

  if (game === 'lottodidia') {
    let comboMultiplier = {
      'standard': 1, 'combo3': 351, 'combo4': 26, 'combo6': 6, 'combo7': 21, 'combo8': 56, 'combo9': 126
    };
    let costPerTicket = 2.00 * comboMultiplier[appState.selectedCombo];
    if (appState.facilitoEnabled) costPerTicket += (1.00 * comboMultiplier[appState.selectedCombo]);

    history.forEach(draw => {
      totalInvestment += costPerTicket;
      let matchedCount = draw.numbers.filter(n => appState.selectedNumbers.includes(n)).length;
      
      // Calculate normal prize
      let prize = 0;
      if (matchedCount === 3) prize = 5.00;
      else if (matchedCount === 4) prize = 50.00;
      else if (matchedCount === 5) prize = 50000.00; // Average jackpot

      if (prize > 0) {
        totalWon += prize;
        winsList.push({ date: draw.date, draw: draw.draw, hit: `${matchedCount} Aciertos`, prize });
      }
    });

  } else if (game === 'zodiac') {
    let costPerTicket = appState.zodiacWager;
    
    history.forEach(draw => {
      totalInvestment += costPerTicket;
      
      // Check hits
      let digitMatch = true;
      for (let j = 0; j < 4; j++) {
        if (draw.numbers[j] !== appState.selectedZodiacDigits[j]) digitMatch = false;
      }
      
      let signMatch = (draw.sign === appState.selectedZodiacSign);
      
      // Last 3 digits match
      let last3Match = true;
      for (let j = 1; j < 4; j++) {
        if (draw.numbers[j] !== appState.selectedZodiacDigits[j]) last3Match = false;
      }

      let prize = 0;
      let hitLabel = "";
      
      if (digitMatch && signMatch) {
        prize = 25000.00 * costPerTicket;
        hitLabel = "1er Premio (4 Dig + Signo)";
      } else if (digitMatch) {
        prize = 25000.00 * costPerTicket; // Catochi fallback rules or specific payout
        prize = 2500.00 * costPerTicket;
        hitLabel = "2do Premio (4 Dig)";
      } else if (last3Match && signMatch) {
        prize = 500.00 * costPerTicket;
        hitLabel = "3er Premio (3 Dig + Signo)";
      } else if (last3Match) {
        prize = 50.00 * costPerTicket;
        hitLabel = "4to Premio (3 Dig)";
      }

      if (prize > 0) {
        totalWon += prize;
        winsList.push({ date: draw.date, draw: draw.draw, hit: hitLabel, prize });
      }
    });

  } else if (game === 'catochi') {
    let costPerTicket = appState.catochiWager;
    let selectedNumStr = appState.selectedDigits.slice(0,4).join('');
    
    history.forEach(draw => {
      totalInvestment += costPerTicket;
      let wins = draw.numbers; // 3 prizes
      
      let prize = 0;
      let hitLabel = "";
      
      if (wins[0].toString().padStart(4,'0') === selectedNumStr) {
        prize = 500 * costPerTicket;
        hitLabel = "1er Premio";
      } else if (wins[1].toString().padStart(4,'0') === selectedNumStr) {
        prize = 100 * costPerTicket;
        hitLabel = "2do Premio";
      } else if (wins[2].toString().padStart(4,'0') === selectedNumStr) {
        prize = 50 * costPerTicket;
        hitLabel = "3er Premio";
      }

      if (prize > 0) {
        totalWon += prize;
        winsList.push({ date: draw.date, draw: draw.draw, hit: hitLabel, prize });
      }
    });

  } else if (game === 'big4') {
    let costPerTicket = appState.catochiWager;
    let selectedNumStr = appState.selectedDigits.slice(0,4).join('');
    
    history.forEach(draw => {
      totalInvestment += costPerTicket;
      if (draw.numbers[0].toString().padStart(4,'0') === selectedNumStr) {
        let prize = 5000 * costPerTicket;
        totalWon += prize;
        winsList.push({ date: draw.date, draw: draw.draw, hit: "Exact Match", prize });
      }
    });

  } else if (game === 'lotto5') {
    let costPerTicket = 2.00;
    
    history.forEach(draw => {
      totalInvestment += costPerTicket;
      let matched = draw.numbers.filter(n => appState.selectedNumbers.includes(n)).length;
      let prize = 0;
      if (matched === 3) prize = 15.00;
      else if (matched === 4) prize = 500.00;
      else if (matched === 5) prize = 100000.00; // Progressive base jackpot

      if (prize > 0) {
        totalWon += prize;
        winsList.push({ date: draw.date, draw: draw.draw, hit: `${matched} Aciertos`, prize });
      }
    });

  } else if (game === 'landsloterie') {
    let costPerTicket = 25.00;
    let selectedNumStr = appState.selectedDigits.join('');
    
    history.forEach(draw => {
      totalInvestment += costPerTicket;
      if (draw.numbers[0].toString().padStart(5,'0') === selectedNumStr) {
        let prize = 25000.00; // Full sheet jackpot
        totalWon += prize;
        winsList.push({ date: draw.date, draw: draw.draw, hit: "Billete Ganador", prize });
      }
    });
  } else if (game === 'minimega') {
    let costPerTicket = 5.00;
    if (appState.megaplusEnabled) costPerTicket += 2.00;

    history.forEach(draw => {
      totalInvestment += costPerTicket;
      let matchedCount = draw.numbers.filter(n => appState.selectedNumbers.includes(n)).length;
      let megaBallMatch = (draw.megaball === appState.selectedMegaBall);

      let prize = 0;
      let hitLabel = "";

      if (matchedCount === 4 && megaBallMatch) {
        prize = 150000.00;
        if (appState.megaplusEnabled) prize += 100000.00;
        hitLabel = "Jackpot (4 Núm + Mega)" + (appState.megaplusEnabled ? " + Mega Plus" : "");
      } else if (matchedCount === 4) {
        prize = 5000.00;
        hitLabel = "4 Núm";
      } else if (matchedCount === 3 && megaBallMatch) {
        prize = 500.00;
        hitLabel = "3 Núm + Mega";
      } else if (matchedCount === 3) {
        prize = 50.00;
        hitLabel = "3 Núm";
      } else if (matchedCount === 2 && megaBallMatch) {
        prize = 25.00;
        hitLabel = "2 Núm + Mega";
      } else if (matchedCount === 2) {
        prize = 5.00;
        hitLabel = "2 Núm";
      } else if (matchedCount === 1 && megaBallMatch) {
        prize = 5.00;
        hitLabel = "1 Núm + Mega";
      }

      if (prize > 0) {
        totalWon += prize;
        winsList.push({ date: draw.date, draw: draw.draw, hit: hitLabel, prize });
      }
    });
  }

  // Display metrics
  document.getElementById("backtest-results-card").style.display = "block";
  const metricsGrid = document.getElementById("backtest-metrics-grid");
  
  let netGain = totalWon - totalInvestment;
  let roi = totalInvestment > 0 ? ((totalWon / totalInvestment) * 100).toFixed(1) : 0;
  let netGainColor = netGain >= 0 ? "emerald" : "gold";

  metricsGrid.innerHTML = `
    <div class="metric-card">
      <div class="metric-label">Inversión Estimada</div>
      <div class="metric-value purple">Afl. ${totalInvestment.toFixed(2)}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Premios Cobrados</div>
      <div class="metric-value cyan">Afl. ${totalWon.toFixed(2)}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Balance Neto</div>
      <div class="metric-value ${netGainColor}">Afl. ${netGain.toFixed(2)}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Retorno (ROI)</div>
      <div class="metric-value ${netGainColor}">${roi}%</div>
    </div>
  `;

  // Render Win table
  const tableWrapper = document.getElementById("backtest-win-table-wrapper");
  if (winsList.length === 0) {
    tableWrapper.innerHTML = `<div style="padding:2rem; text-align:center; color:var(--text-muted)">El boleto no obtuvo ningún premio en la base de datos histórica.</div>`;
  } else {
    tableWrapper.innerHTML = `
      <table class="table" style="font-size:0.85rem">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Sorteo</th>
            <th>Acierto</th>
            <th>Premio</th>
          </tr>
        </thead>
        <tbody>
          ${winsList.map(w => `
            <tr>
              <td>${w.date}</td>
              <td>${w.draw}</td>
              <td><span class="turno-badge-inline">${w.hit}</span></td>
              <td style="font-weight:700; color:var(--neon-cyan)">Afl. ${w.prize.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
}

// History Table Renderers (Dynamic per game)
function renderHistoryTable() {
  const container = document.getElementById("history-table-wrapper");
  if (!container) return;

  // Siempre sincronizar filteredHistory desde gamesData antes de renderizar
  // para asegurar que los datos más recientes de Supabase se muestran
  const currentDraws = appState.gamesData[appState.currentGame] || [];
  if (currentDraws.length > (appState.filteredHistory || []).length) {
    appState.filteredHistory = [...currentDraws];
  }

  const lang = appState.language || 'es';
  const tableHeaders = {
    es: { date: "Fecha", draw: "Sorteo", numbers: "Números Ganadores", digits: "Dígitos Ganadores", shift: "Turno", sign: "Signo Zodiacal", p1: "1er Premio", p2: "2do Premio", p3: "3er Premio", megaball: "Mega Ball", empty: "No hay sorteos históricos que coincidan con la búsqueda.", ticket: "Billete Ganador", winningNum: "Número Ganador" },
    en: { date: "Date", draw: "Draw", numbers: "Winning Numbers", digits: "Winning Digits", shift: "Shift", sign: "Zodiac Sign", p1: "1st Prize", p2: "2nd Prize", p3: "3rd Prize", megaball: "Mega Ball", empty: "No historical draws found matching your search.", ticket: "Winning Ticket", winningNum: "Winning Number" },
    nl: { date: "Datum", draw: "Trekking", numbers: "Winnende Getallen", digits: "Winnende Cijfers", shift: "Shift", sign: "Dierenriemteken", p1: "1e Prijs", p2: "2e Prijs", p3: "3e Prijs", megaball: "Mega Ball", empty: "Geen trekkingen gevonden die overeenkomen met de zoekopdracht.", ticket: "Winnend Lot", winningNum: "Winnend Nummer" },
    pap: { date: "Fecha", draw: "Sorteo", numbers: "Numbernan Ganado", digits: "Digitnan Ganado", shift: "Turno", sign: "Signo Zodiacal", p1: "1er Premio", p2: "2do Premio", p3: "3er Premio", megaball: "Mega Ball", empty: "No a haya ningun sorteo historico cu ta coiñcidi cu bo busca.", ticket: "Billete Ganado", winningNum: "Number Ganado" }
  };
  const headers = tableHeaders[lang];

  const total = appState.filteredHistory.length;
  if (total === 0) {
    container.innerHTML = `<div style="padding:3rem; text-align:center; color:var(--text-muted)">${headers.empty}</div>`;
    const pagText = lang === 'es' ? 'Pág.' : (lang === 'pap' ? 'Pág.' : (lang === 'nl' ? 'Pag.' : 'Page'));
    const deText = lang === 'es' ? 'de' : (lang === 'pap' ? 'di' : (lang === 'nl' ? 'van' : 'of'));
    document.getElementById("pag-info").innerText = `${pagText} 0 ${deText} 0`;
    document.getElementById("pag-prev-btn").disabled = true;
    document.getElementById("pag-next-btn").disabled = true;
    return;
  }

  // Paginate
  const pagesCount = Math.ceil(total / appState.historyPageSize);
  if (appState.historyPage > pagesCount) appState.historyPage = pagesCount;
  if (appState.historyPage < 1) appState.historyPage = 1;
  
  const startIdx = (appState.historyPage - 1) * appState.historyPageSize;
  const pageItems = appState.filteredHistory.slice(startIdx, startIdx + appState.historyPageSize);
  let html = "";
  if (appState.currentGame === 'lottodidia' || appState.currentGame === 'lotto5') {
    html = `
      <table class="table">
        <thead>
          <tr>
            <th>${headers.date}</th>
            <th>${headers.draw}</th>
            <th>${headers.numbers}</th>
          </tr>
        </thead>
        <tbody>
          ${pageItems.map(draw => `
            <tr>
              <td>${formatDateDisplay(draw.date)}</td>
              <td>${draw.draw}</td>
              <td>
                <div style="display:flex; gap:0.4rem">
                  ${draw.numbers.map(n => formatBall(n)).join('')}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else if (appState.currentGame === 'minimega') {
    html = `
      <table class="table">
        <thead>
          <tr>
            <th>${headers.date}</th>
            <th>${headers.draw}</th>
            <th>${headers.numbers}</th>
            <th>${headers.megaball}</th>
          </tr>
        </thead>
        <tbody>
          ${pageItems.map(draw => `
            <tr>
              <td>${formatDateDisplay(draw.date)}</td>
              <td>${draw.draw}</td>
              <td>
                <div style="display:flex; gap:0.4rem">
                  ${draw.numbers.map(n => formatBall(n)).join('')}
                </div>
              </td>
              <td>
                ${draw.megaBall !== undefined && draw.megaBall !== null ? formatBall(draw.megaBall, 'match-gold') : '-'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else if (appState.currentGame === 'zodiac') {
    const zodiacTranslations = {
      es: {
        "Aries": "Aries", "Tauro": "Tauro", "Geminis": "Géminis", "Cancer": "Cáncer", "Leo": "Leo", "Virgo": "Virgo",
        "Libra": "Libra", "Escorpio": "Escorpio", "Sagitario": "Sagitario", "Capricornio": "Capricornio", "Acuario": "Acuario", "Piscis": "Piscis"
      },
      en: {
        "Aries": "Aries", "Tauro": "Taurus", "Geminis": "Gemini", "Cancer": "Cancer", "Leo": "Leo", "Virgo": "Virgo",
        "Libra": "Libra", "Escorpio": "Scorpio", "Sagitario": "Sagittarius", "Capricornio": "Capricorn", "Acuario": "Aquarius", "Piscis": "Pisces"
      },
      nl: {
        "Aries": "Ram", "Tauro": "Stier", "Geminis": "Tweelingen", "Cancer": "Kreeft", "Leo": "Leeuw", "Virgo": "Maagd",
        "Libra": "Weegschaal", "Escorpio": "Schorpioen", "Sagitario": "Boogschutter", "Capricornio": "Steenbok", "Acuario": "Waterman", "Piscis": "Vissen"
      },
      pap: {
        "Aries": "Aries", "Tauro": "Taurus", "Geminis": "Geminis", "Cancer": "Cancer", "Leo": "Leo", "Virgo": "Virgo",
        "Libra": "Libra", "Escorpio": "Escorpio", "Sagitario": "Sagitario", "Capricornio": "Capricornio", "Acuario": "Acuario", "Piscis": "Piscis"
      }
    };
    
    html = `
      <table class="table">
        <thead>
          <tr>
            <th>${headers.date}</th>
            <th>${headers.draw}</th>
            <th>${headers.shift}</th>
            <th>${headers.digits}</th>
            <th>${headers.sign}</th>
          </tr>
        </thead>
        <tbody>
          ${pageItems.map(draw => {
            const shiftVal = draw.drawType === 'Midday' 
              ? (lang === 'es' ? 'Atardi' : (lang === 'pap' ? 'Atardi' : (lang === 'nl' ? 'Middag' : 'Midday')))
              : (lang === 'es' ? 'Anochi' : (lang === 'pap' ? 'Anochi' : (lang === 'nl' ? 'Avond' : 'Evening')));
            const signVal = zodiacTranslations[lang][draw.sign] || draw.sign;
            return `
              <tr>
                <td>${formatDateDisplay(draw.date)}</td>
                <td>${draw.draw}</td>
                <td><span class="turno-badge-inline">${shiftVal}</span></td>
                <td>
                  <div style="display:flex; gap:0.4rem">
                    ${draw.numbers.map(n => formatBall(n)).join('')}
                  </div>
                </td>
                <td><span class="sign-badge-inline">${signVal}</span></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } else if (appState.currentGame === 'catochi') {
    html = `
      <table class="table">
        <thead>
          <tr>
            <th>${headers.date}</th>
            <th>${headers.draw}</th>
            <th>${headers.shift}</th>
            <th>${headers.p1}</th>
            <th>${headers.p2}</th>
            <th>${headers.p3}</th>
          </tr>
        </thead>
        <tbody>
          ${pageItems.map(draw => {
            const shiftVal = draw.drawType === 'Midday' 
              ? (lang === 'es' ? 'Atardi' : (lang === 'pap' ? 'Atardi' : (lang === 'nl' ? 'Middag' : 'Midday')))
              : (lang === 'es' ? 'Anochi' : (lang === 'pap' ? 'Anochi' : (lang === 'nl' ? 'Avond' : 'Evening')));
            return `
              <tr>
                <td>${formatDateDisplay(draw.date)}</td>
                <td>${draw.draw}</td>
                <td><span class="turno-badge-inline">${shiftVal}</span></td>
                <td style="font-weight:800; color:var(--neon-cyan)">${draw.numbers[0].toString().padStart(4,'0')}</td>
                <td style="font-weight:700; color:var(--neon-gold)">${draw.numbers[1].toString().padStart(4,'0')}</td>
                <td style="font-weight:700; color:var(--text-muted)">${draw.numbers[2].toString().padStart(4,'0')}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } else if (appState.currentGame === 'big4') {
    html = `
      <table class="table">
        <thead>
          <tr>
            <th>${headers.date}</th>
            <th>${headers.draw}</th>
            <th>${headers.shift}</th>
            <th>${headers.winningNum}</th>
          </tr>
        </thead>
        <tbody>
          ${pageItems.map(draw => {
            const shiftVal = draw.drawType === 'Midday' 
              ? (lang === 'es' ? 'Atardi' : (lang === 'pap' ? 'Atardi' : (lang === 'nl' ? 'Middag' : 'Midday')))
              : (lang === 'es' ? 'Anochi' : (lang === 'pap' ? 'Anochi' : (lang === 'nl' ? 'Avond' : 'Evening')));
            return `
              <tr>
                <td>${formatDateDisplay(draw.date)}</td>
                <td>${draw.draw}</td>
                <td><span class="turno-badge-inline">${shiftVal}</span></td>
                <td style="font-weight:800; color:var(--neon-cyan)">${draw.numbers[0].toString().padStart(4,'0')}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } else if (appState.currentGame === 'landsloterie') {
    html = `
      <table class="table">
        <thead>
          <tr>
            <th>${headers.date}</th>
            <th>${headers.draw}</th>
            <th>${headers.ticket}</th>
          </tr>
        </thead>
        <tbody>
          ${pageItems.map(draw => `
            <tr>
              <td>${formatDateDisplay(draw.date)}</td>
              <td>${draw.draw}</td>
              <td style="font-weight:800; color:var(--neon-gold); font-size:1.15rem">${draw.numbers[0].toString().padStart(5,'0')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else if (appState.currentGame === 'minimega') {
    html = `
      <table class="table">
        <thead>
          <tr>
            <th>${headers.date}</th>
            <th>${headers.draw}</th>
            <th>${headers.numbers}</th>
            <th>${headers.megaball}</th>
          </tr>
        </thead>
        <tbody>
          ${pageItems.map(draw => `
            <tr>
              <td>${formatDateDisplay(draw.date)}</td>
              <td>${draw.draw}</td>
              <td>
                <div style="display:flex; gap:0.4rem">
                  ${draw.numbers.map(n => formatBall(n)).join('')}
                </div>
              </td>
              <td>
                <span class="sign-badge-inline" style="background:rgba(255, 190, 11, 0.15); color:var(--neon-gold); border-color:rgba(255, 190, 11, 0.3)">${draw.megaball}</span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  container.innerHTML = html;

  // Set pagination labels
  const pagText = lang === 'es' ? 'Pág.' : (lang === 'pap' ? 'Pág.' : (lang === 'nl' ? 'Pag.' : 'Page'));
  const deText = lang === 'es' ? 'de' : (lang === 'pap' ? 'di' : (lang === 'nl' ? 'van' : 'of'));
  document.getElementById("pag-info").innerText = `${pagText} ${appState.historyPage} ${deText} ${pagesCount}`;
  document.getElementById("pag-prev-btn").disabled = appState.historyPage === 1;
  document.getElementById("pag-next-btn").disabled = appState.historyPage === pagesCount;

  // Pagination clicks
  document.getElementById("pag-prev-btn").onclick = () => {
    if (appState.historyPage > 1) {
      appState.historyPage--;
      renderHistoryTable();
    }
  };
  document.getElementById("pag-next-btn").onclick = () => {
    if (appState.historyPage < pagesCount) {
      appState.historyPage++;
      renderHistoryTable();
    }
  };
}

// Stats temporal filter handlers
function applyFiltersEvent() {
  applyFilters();
}

function getSearchableDateStrings(dateStr) {
  if (!dateStr) return [];
  const parts = dateStr.split("-");
  if (parts.length !== 3) return [dateStr];
  const [y, m, d] = parts.map(Number);
  const monthsEs = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const monthsEn = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  const monthsEnShort = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  
  const idx = m - 1;
  if (idx < 0 || idx > 11) return [dateStr];

  return [
    dateStr,
    `${d} de ${monthsEs[idx]} de ${y}`,
    `${d} de ${monthsEs[idx]}`,
    `${monthsEs[idx]} ${d} ${y}`,
    `${monthsEs[idx]} ${d}`,
    `${monthsEn[idx]} ${d} ${y}`,
    `${monthsEnShort[idx]} ${d} ${y}`,
    `${monthsEn[idx]} ${d}, ${y}`,
    `${monthsEnShort[idx]} ${d}, ${y}`
  ].map(s => s.toLowerCase());
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts.map(Number);
  const monthsShortEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const idx = m - 1;
  if (idx < 0 || idx > 11) return dateStr;
  return `${monthsShortEn[idx]} ${d}, ${y}`;
}

function handleSearch(e) {
  const query = e.target.value.toLowerCase().trim();
  const rawHistory = appState.gamesData[appState.currentGame];
  
  if (query === "") {
    appState.filteredHistory = [...rawHistory];
  } else {
    appState.filteredHistory = rawHistory.filter(draw => {
      const dateStrings = getSearchableDateStrings(draw.date);
      const matchDate = dateStrings.some(s => s.includes(query));
      const matchDraw = draw.draw.toString().includes(query);
      
      let matchNums = false;
      if (appState.currentGame === 'catochi') {
        matchNums = draw.numbers.some(n => n.toString().padStart(4,'0').includes(query));
      } else if (appState.currentGame === 'big4') {
        matchNums = draw.numbers[0].toString().padStart(4,'0').includes(query);
      } else if (appState.currentGame === 'landsloterie') {
        matchNums = draw.numbers[0].toString().padStart(5,'0').includes(query);
      } else {
        matchNums = draw.numbers.some(n => n.toString().includes(query)) || (draw.megaball && draw.megaball.toString() === query);
      }

      let matchSign = false;
      if (draw.sign) matchSign = draw.sign.toLowerCase().includes(query);

      let matchTurn = false;
      if (draw.drawType) {
        const turnLabel = draw.drawType === 'Midday' ? 'atardi' : 'anochi';
        matchTurn = turnLabel.includes(query) || draw.drawType.toLowerCase().includes(query);
      }

      return matchDate || matchDraw || matchNums || matchSign || matchTurn;
    });
  }

  appState.historyPage = 1;
  renderHistoryTable();
}

// Wager adjustments in combos
if (document.getElementById("combo-select")) {
  document.getElementById("combo-select").addEventListener("change", (e) => {
    appState.selectedCombo = e.target.value;
    // reset selection
    appState.selectedNumbers = [];
    document.querySelectorAll(".lotto-cell").forEach(c => c.classList.remove("selected"));
    
    // adjust grid info
    let rules = { 'standard': 5, 'combo3': 3, 'combo4': 4, 'combo6': 6, 'combo7': 7, 'combo8': 8, 'combo9': 9 };
    let max = rules[appState.selectedCombo] || 5;
    document.getElementById("simulator-card-desc").innerText = `Selecciona exactamente ${max} números en la cuadrícula de abajo. El combo calcula las combinaciones internamente.`;
    
    updateWagerInvoice();
  });
}

if (document.getElementById("facilito-switch")) {
  document.getElementById("facilito-switch").addEventListener("change", (e) => {
    appState.facilitoEnabled = e.target.checked;
    updateWagerInvoice();
  });
}

// ==================== TAB 2: SERVICIOS (THE CITIZEN Smart Assistant) ====================

// Emergencies renderer
function renderEmergencies() {
  const container = document.getElementById("emergencies-container");
  if (!container) return;

  const lang = appState.language || 'es';
  const dict = SABI_TRANSLATIONS[lang];
  const btnCall = dict['btn_call'] || "Llamar";
  const btnMap = dict['btn_map'] || "Mapa";

  container.innerHTML = SABI_DATA.emergencies.map(em => {
    const name = dict[`em_${em.id}_name`] || em.name;
    const subtitle = dict[`em_${em.id}_subtitle`] || em.subtitle;
    return `
      <div class="emergency-card linear-service-card">
        <div class="service-logo-box">${em.icon}</div>
        <div class="service-title">${name}</div>
        <div class="service-desc">${subtitle}</div>
        <div class="service-phone">${em.phone}</div>
        <div class="service-buttons-row">
          <a href="tel:${em.phone}" class="btn-sm btn-cyan" onclick="SoundEffects.playClick()">📞 ${btnCall}</a>
          <a href="${em.maps}" target="_blank" class="btn-sm btn-map">📍 ${btnMap}</a>
        </div>
      </div>
    `;
  }).join('');
}

// Government directory renderer
function renderDirectory() {
  const container = document.getElementById("directory-container");
  if (!container) return;
  
  const query = document.getElementById("directory-search-input").value.toLowerCase().trim();
  const lang = appState.language || 'es';
  const dict = SABI_TRANSLATIONS[lang];
  
  let list = SABI_DATA.government;
  if (query !== "") {
    list = list.filter(item => {
      const name = (dict[`gov_${item.id}_name`] || item.name).toLowerCase();
      const subtitle = (dict[`gov_${item.id}_subtitle`] || item.subtitle).toLowerCase();
      const desc = (dict[`gov_${item.id}_desc`] || item.desc).toLowerCase();
      return name.includes(query) || subtitle.includes(query) || desc.includes(query);
    });
  }

  if (list.length === 0) {
    const noResultsText = dict[`directory_no_results`] || "No se encontraron dependencias oficiales que coincidan con la búsqueda.";
    container.innerHTML = `<div style="grid-column:1/-1; padding:3rem; text-align:center; color:var(--text-muted)">${noResultsText}</div>`;
    return;
  }

  const btnCall = dict['btn_call'] || "Llamar";
  const btnWeb = dict['btn_web'] || "Web";
  const btnMap = dict['btn_map'] || "Mapa";

  container.innerHTML = list.map(gov => {
    const name = dict[`gov_${gov.id}_name`] || gov.name;
    const subtitle = dict[`gov_${gov.id}_subtitle`] || gov.subtitle;
    const desc = dict[`gov_${gov.id}_desc`] || gov.desc;
    return `
      <div class="directory-card linear-service-card">
        <div class="service-logo-box">${gov.icon}</div>
        <div class="service-title">${name}</div>
        <div class="service-desc">
          <div style="font-size:0.8rem; color:var(--neon-cyan); margin-bottom:0.25rem; font-weight:600">${subtitle}</div>
          <div>${desc}</div>
        </div>
        <div class="service-phone">${gov.phone}</div>
        <div class="service-buttons-row">
          <a href="tel:${gov.phone}" class="btn-sm btn-cyan" onclick="SoundEffects.playClick()">📞 ${btnCall}</a>
          <a href="${gov.link}" target="_blank" class="btn-sm btn-profile">🌐 ${btnWeb}</a>
          <a href="${gov.maps}" target="_blank" class="btn-sm btn-map">📍 ${btnMap}</a>
        </div>
      </div>
    `;
  }).join('');
}

function filterDirectory() {
  renderDirectory();
}

// Customs & Courier Calculator
function setupCustomsCalculator() {
  // Populate category dropdown
  const select = document.getElementById("calc-category");
  if (!select) return;

  const lang = appState.language || 'es';
  const dict = SABI_TRANSLATIONS[lang];
  const dutyLabel = dict['calc_duty_label'] || 'Derecho';

  select.innerHTML = SABI_DATA.customsTariffs.map(t => `
    <option value="${t.category}">${dict[`calc_cat_${t.category}`] || t.name} (${dutyLabel}: ${t.duty * 100}%)</option>
  `).join('');

  // Initial render of Pharmacy & Fuel widgets
  renderBoticasAndFuel();
}

function calculateCustomsAndCouriers() {
  SoundEffects.playClick();
  const cat = document.getElementById("calc-category").value;
  const valUSD = parseFloat(document.getElementById("calc-value").value);
  const wt = parseFloat(document.getElementById("calc-weight").value);
  
  const len = parseFloat(document.getElementById("calc-length").value) || 0;
  const wd = parseFloat(document.getElementById("calc-width").value) || 0;
  const ht = parseFloat(document.getElementById("calc-height").value) || 0;

  if (isNaN(valUSD) || valUSD <= 0) return;

  // Customs calculations (Douane Aruba rules)
  const rateUSD_AWG = 1.80;
  const valueAWG = valUSD * rateUSD_AWG;

  // Insurance and Freight estimation
  let freightAWG = wt * 3.50 * rateUSD_AWG; // Estimate flete
  if (freightAWG < 15.00 * rateUSD_AWG) freightAWG = 15.00 * rateUSD_AWG; // base cargo
  let insuranceAWG = valueAWG * 0.015; // 1.5% insurance estimate

  // CIF Value = Cost + Insurance + Freight
  const cifAWG = valueAWG + insuranceAWG + freightAWG;

  // Customs duties based on category tariff
  const tariffObj = SABI_DATA.customsTariffs.find(t => t.category === cat);
  const dutyRate = tariffObj ? tariffObj.duty : 0.12;
  const dutyAWG = cifAWG * dutyRate;

  // Append border tax (BBO/BAVP/BAZV 7% combined)
  const borderTaxAWG = (cifAWG + dutyAWG) * 0.07;
  const totalTaxAWG = dutyAWG + borderTaxAWG;

  const lang = appState.language || 'es';
  const dict = SABI_TRANSLATIONS[lang];

  // Render customs breakdown
  document.getElementById("calc-results-section").style.display = "block";
  document.getElementById("customs-breakdown-box").innerHTML = `
    <div class="summary-row">
      <span>${dict['calc_summary_invoice'] || 'Valor de Factura'}:</span>
      <span>$${valUSD.toFixed(2)} USD / Fl. ${valueAWG.toFixed(2)} AWG</span>
    </div>
    <div class="summary-row">
      <span>${dict['calc_summary_cif'] || 'Valor CIF Declarado'}:</span>
      <span>Fl. ${cifAWG.toFixed(2)} AWG</span>
    </div>
    <div class="summary-row">
      <span>${dict['calc_summary_duty'] || 'Derechos de Aduana'} (${dutyRate*100}%):</span>
      <span>Fl. ${dutyAWG.toFixed(2)} AWG</span>
    </div>
    <div class="summary-row">
      <span>${dict['calc_summary_bbo'] || 'Impuesto Fronterizo (7% BBO)'}:</span>
      <span>Fl. ${borderTaxAWG.toFixed(2)} AWG</span>
    </div>
    <div class="summary-row">
      <span>${dict['calc_summary_total_tax'] || 'Impuestos Totales a Pagar en Aduana'}:</span>
      <span>Fl. ${totalTaxAWG.toFixed(2)} AWG</span>
    </div>
  `;

  // Compare Couriers (Order by price)
  let courierResults = [];
  SABI_DATA.couriers.forEach(courier => {
    // Determine shipping weight (dimensional vs pure weight)
    let billableWeight = wt;
    let labelVol = "";
    if (courier.volumetric && len > 0 && wd > 0 && ht > 0) {
      let dimWt = (len * wd * ht) / 139;
      if (dimWt > wt) {
        billableWeight = dimWt;
        const volText = dict['calc_volumetric_weight'] || 'Volumétrico';
        labelVol = ` (${volText}: ${dimWt.toFixed(1)} lbs)`;
      }
    }

    let freightCostUSD = courier.baseFee + (billableWeight * courier.ratePerLb);
    let freightCostAWG = freightCostUSD * rateUSD_AWG;

    // Net Total (Courier charge + customs taxes)
    let netTotalAWG = freightCostAWG + totalTaxAWG;
    let netTotalUSD = netTotalAWG / rateUSD_AWG;

    courierResults.push({
      id: courier.id,
      name: courier.name,
      freight: freightCostAWG,
      tax: totalTaxAWG,
      total: netTotalAWG,
      days: courier.deliveryDays,
      link: courier.link,
      labelVol
    });
  });

  // Sort cheapest first
  courierResults.sort((a,b) => a.total - b.total);

  const tbody = document.getElementById("courier-comparison-body");
  tbody.innerHTML = courierResults.map(res => `
    <tr>
      <td>
        <strong style="color:var(--text-main)">${res.name}</strong>
        <div style="font-size:0.7rem; color:var(--text-muted)">${res.labelVol}</div>
      </td>
      <td>Fl. ${res.freight.toFixed(2)}</td>
      <td>Fl. ${res.tax.toFixed(2)}</td>
      <td style="font-weight:700; color:var(--neon-cyan)">Fl. ${res.total.toFixed(2)}</td>
      <td>
        <span class="tag-courier">${dict[`courier_days_${res.id}`] || res.days}</span>
      </td>
    </tr>
  `).join('');
}

function renderBoticasAndFuel() {
  const lang = appState.language || 'es';
  const dict = SABI_TRANSLATIONS[lang];

  const boticasCon = document.getElementById("boticas-container");
  if (boticasCon) {
    boticasCon.innerHTML = SABI_DATA.boticas.map(b => {
      let weekText = b.week;
      if (lang === 'en') weekText = weekText.replace('Semana del', 'Week from').replace('al', 'to').replace('de Junio', 'of June');
      else if (lang === 'nl') weekText = weekText.replace('Semana del', 'Week van').replace('al', 'tot').replace('de Junio', 'van Juni');
      else if (lang === 'pap') weekText = weekText.replace('Semana del', 'Siman di').replace('al', 'pa').replace('de Huni', 'di Huni').replace('de Junio', 'di Huni');

      return `
        <div class="league-box" style="margin-bottom:0.75rem">
          <div style="font-weight:700; color:var(--neon-cyan); margin-bottom:0.5rem">${weekText}</div>
          <div style="font-size:0.8rem; line-height:1.4">
            <div>📍 Noord: <strong>${b.boticaNoord}</strong></div>
            <div>📍 Oranjestad: <strong>${b.boticaPlay}</strong></div>
            <div>📍 San Nicolas: <strong>${b.boticaSn}</strong></div>
          </div>
        </div>
      `;
    }).join('');
  }

  const fuelCon = document.getElementById("fuel-container");
  if (fuelCon) {
    const monthlyAdjustmentText = dict['fuel_monthly_adjustment'] || 'Ajuste mensual';
    const gasolineText = dict['fuel_gasoline'] || 'Gasolina';
    const dieselText = dict['fuel_diesel'] || 'Diesel';
    const changeText = dict['fuel_change'] || 'Cambio';

    const dateTranslation = {
      es: { "Junio 2026": "Junio 2026", "Mayo 2026": "Mayo 2026", "Abril 2026": "Abril 2026" },
      en: { "Junio 2026": "June 2026", "Mayo 2026": "May 2026", "Abril 2026": "April 2026" },
      nl: { "Junio 2026": "Juni 2026", "Mayo 2026": "Mei 2026", "Abril 2026": "April 2026" },
      pap: { "Junio 2026": "Huni 2026", "Mayo 2026": "Mei 2026", "Abril 2026": "Aprel 2026" }
    };

    fuelCon.innerHTML = SABI_DATA.fuelPrices.map(f => {
      const dateText = (dateTranslation[lang] && dateTranslation[lang][f.date]) || f.date;
      return `
        <div class="league-box" style="margin-bottom:0.5rem; display:flex; justify-content:space-between; align-items:center">
          <div>
            <div style="font-weight:700">${dateText}</div>
            <div style="font-size:0.75rem; color:var(--text-muted)">${monthlyAdjustmentText}</div>
          </div>
          <div style="font-size:0.8rem; text-align:right">
            <div>${gasolineText}: <strong>Fl. ${f.gasoline}</strong></div>
            <div>${dieselText}: <strong>Fl. ${f.diesel}</strong></div>
            <div style="font-size:0.7rem; color:var(--neon-pink)">${changeText}: ${f.change}</div>
          </div>
        </div>
      `;
    }).join('');
  }
}

// School Guide Finder & Cost Projections
function setupSchoolsSection() {
  // Bind level filter change
  document.getElementById("school-filter-level").addEventListener("change", renderSchoolsList);
  document.getElementById("school-filter-type").addEventListener("change", renderSchoolsList);
}

function setupDeportesSection() {
  if (!appState.activeSportsHubTab) appState.activeSportsHubTab = 'live';
  if (!appState.activeSportsHubSport) appState.activeSportsHubSport = 'futbol';
  if (!appState.activeFootballLeague) appState.activeFootballLeague = 'esp.1';
  
  startSportsHubLiveTimer();
}

function setupMarketplaceSection() {
  // Bind Comunidad Sub-Tabs event listeners
  document.querySelectorAll(".comunidad-tab-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const tab = e.currentTarget.dataset.comunidadTab;
      switchComunidadTab(tab);
    });
  });
}

function toggleCustomImageUrlField() {
  const presetEl = document.getElementById("ad-form-image-preset");
  if (!presetEl) return;
  const preset = presetEl.value;
  const group = document.getElementById("ad-form-custom-image-url-group");
  if (group) {
    group.style.display = preset === "custom" ? "block" : "none";
  }
}

function toggleCpcField() {
  const sponsoredEl = document.getElementById("ad-form-sponsored");
  if (!sponsoredEl) return;
  const sponsored = sponsoredEl.value;
  const group = document.getElementById("ad-form-cpc-group");
  if (group) {
    group.style.display = sponsored === "sponsored" ? "block" : "none";
  }
}

function changeAdCategory(selectEl) {
  const deliveryToggleGroup = document.getElementById("ad-form-delivery-toggle-group");
  if (deliveryToggleGroup) {
    const physicalCats = ['vehiculos', 'ropa', 'electronica', 'joyeria', 'hogar'];
    deliveryToggleGroup.style.display = physicalCats.includes(selectEl.value) ? 'flex' : 'none';
  }
}

function updateB2BStatsDisplay() {
  const impressionsEl = document.getElementById("b2b-stat-impressions");
  const clicksEl = document.getElementById("b2b-stat-clicks");
  const ctrEl = document.getElementById("b2b-stat-ctr");
  const balanceEl = document.getElementById("b2b-wallet-balance");
  
  if (impressionsEl) impressionsEl.innerText = appState.b2bImpressions.toLocaleString();
  if (clicksEl) clicksEl.innerText = appState.b2bClicks.toLocaleString();
  if (ctrEl) {
    const ctr = appState.b2bImpressions > 0 ? (appState.b2bClicks / appState.b2bImpressions * 100) : 0;
    ctrEl.innerText = `${ctr.toFixed(2)}%`;
  }
  if (balanceEl) {
    balanceEl.innerText = `$${appState.b2bWallet.toFixed(2)} USD`;
  }
}

function renderComercioStats() {
  const timeframeSelect = document.getElementById("comercio-timeframe");
  if (!timeframeSelect) return;
  const timeframe = timeframeSelect.value;
  
  // Base values from SABI_DATA
  const data = SABI_DATA.comercio;
  const occNoord = data.occupancyRates.noord;
  const occOranjestad = data.occupancyRates.oranjestad;
  const occSanNicolas = data.occupancyRates.sannicolas || 82;
  const flights = data.flightsToday;
  
  // Lodging occupancy baseline
  const baseLodging = data.lodgingOccupancy || {
    resorts: 86,
    allInclusive: 91,
    condos: 74,
    villas: 68,
    boutiqueApts: 79
  };
  let resortsVal = baseLodging.resorts;
  let allInclusiveVal = baseLodging.allInclusive;
  let condosVal = baseLodging.condos;
  let villasVal = baseLodging.villas;
  let boutiqueAptsVal = baseLodging.boutiqueApts;
  
  const businesses = data.nearbyBusinesses || {
    noord: [],
    oranjestad: [],
    sannicolas: []
  };
  
  // Calculate cruise passengers
  let cruisesToday = data.cruises.filter(c => c.date === "Hoy");
  let cruisesList = data.cruises;
  
  let paxToday = cruisesToday.reduce((sum, c) => sum + c.passengers, 0);
  let paxWeek = data.cruises.reduce((sum, c) => sum + c.passengers, 0);
  let paxMonth = paxWeek * 4.2; // monthly estimation
  
  let indexNoord = 0;
  let indexOranjestad = 0;
  let indexSanNicolas = 0;
  let noordFactors = "";
  let oranjestadFactors = "";
  let sannicolasFactors = "";
  
  const lang = appState.language || 'es';
  const dict = SABI_TRANSLATIONS[lang];
  
  if (timeframe === "today") {
    indexNoord = Math.min(100, Math.round(occNoord * 0.95 + (flights.totalArrivals / 55) * 10));
    indexOranjestad = Math.min(100, Math.round(occOranjestad * 0.6 + (paxToday / 8000) * 40));
    
    let toursToday = 15;
    let tourPaxToday = 450;
    indexSanNicolas = Math.min(100, Math.round(occSanNicolas * 0.82 + (tourPaxToday / 1000) * 35));
    
    noordFactors = (dict['comercio_noord_factors_today'] || "Hoy: Alta ocupación hotelera ({occ}%) y llegada de {flights} vuelos comerciales.")
      .replace('{occ}', occNoord)
      .replace('{flights}', flights.totalArrivals);
      
    oranjestadFactors = (dict['comercio_oranjestad_factors_today'] || "Hoy: {cruises} cruceros en puerto con ~{pax} pasajeros estimulando el comercio en Oranjestad.")
      .replace('{cruises}', cruisesToday.length)
      .replace('{pax}', paxToday.toLocaleString());
      
    sannicolasFactors = (dict['comercio_sannicolas_factors_today'] || "Hoy: Actividad turística en el sur con ~450 visitantes llegando en tours terrestres/marítimos y ocupación del {occ}% en Secrets Hotel.")
      .replace('{occ}', occSanNicolas);
    
    resortsVal = baseLodging.resorts;
    allInclusiveVal = baseLodging.allInclusive;
    condosVal = baseLodging.condos;
    villasVal = baseLodging.villas;
    boutiqueAptsVal = baseLodging.boutiqueApts;
  } else if (timeframe === "week") {
    indexNoord = Math.min(100, Math.round(occNoord * 1.0));
    indexOranjestad = Math.min(100, Math.round(occOranjestad * 0.7 + (paxWeek / 15000) * 30));
    
    let toursWeek = 105;
    let tourPaxWeek = 3150;
    indexSanNicolas = Math.min(100, Math.round(occSanNicolas * 0.88 + (tourPaxWeek / 6000) * 20));
    
    noordFactors = (dict['comercio_noord_factors_week'] || "Esta Semana: Ocupación promedio del {occ}% proyectada por el turismo playero en Noord.")
      .replace('{occ}', occNoord);
      
    oranjestadFactors = (dict['comercio_oranjestad_factors_week'] || "Esta Semana: {cruises} barcos programados con ~{pax} pasajeros estimulando el centro histórico.")
      .replace('{cruises}', cruisesList.length)
      .replace('{pax}', paxWeek.toLocaleString());
      
    sannicolasFactors = (dict['comercio_sannicolas_factors_week'] || "Esta Semana: Ocupación proyectada del {occ}% en Secrets Hotel y ~3,150 turistas en tours de arte y playas de San Nicolas.")
      .replace('{occ}', occSanNicolas);
    
    resortsVal = Math.min(100, baseLodging.resorts + 2);
    allInclusiveVal = Math.min(100, baseLodging.allInclusive + 1);
    condosVal = Math.max(0, baseLodging.condos - 1);
    villasVal = Math.max(0, baseLodging.villas - 2);
    boutiqueAptsVal = Math.min(100, baseLodging.boutiqueApts + 1);
  } else if (timeframe === "month") {
    indexNoord = Math.min(100, Math.round(occNoord * 0.98));
    indexOranjestad = Math.min(100, Math.round(occOranjestad * 0.75 + (paxMonth / 60000) * 25));
    
    let toursMonth = 441;
    let tourPaxMonth = 13230;
    indexSanNicolas = Math.min(100, Math.round(occSanNicolas * 0.90 + (tourPaxMonth / 25000) * 15));
    
    noordFactors = (dict['comercio_noord_factors_month'] || "Este Mes: Proyección de turismo estable con ocupación hotelera estimada en {occ}%.")
      .replace('{occ}', occNoord);
      
    oranjestadFactors = (dict['comercio_oranjestad_factors_month'] || "Este Mes: Tránsito de cruceros estimado en ~{pax} pasajeros en total para el mes.")
      .replace('{pax}', Math.round(paxMonth).toLocaleString());
      
    sannicolasFactors = (dict['comercio_sannicolas_factors_month'] || "Este Mes: Estabilidad turística en el sur con ~13,230 visitantes totales vía tours organizados y el Secrets Hotel.")
      .replace('{occ}', occSanNicolas);
    
    resortsVal = Math.min(100, baseLodging.resorts + 3);
    allInclusiveVal = Math.min(100, baseLodging.allInclusive + 2);
    condosVal = Math.min(100, baseLodging.condos + 1);
    villasVal = Math.max(0, baseLodging.villas - 1);
    boutiqueAptsVal = Math.min(100, baseLodging.boutiqueApts + 2);
  }
  
  // Set badges
  const getLevelLabel = (val) => {
    if (val >= 85) return { text: dict['comercio_lvl_very_high'] || "Muy Alto 🔥", color: "var(--neon-emerald)", bg: "rgba(0, 224, 150, 0.08)", shadow: "rgba(0, 224, 150, 0.2)" };
    if (val >= 70) return { text: dict['comercio_lvl_high'] || "Alto 📈", color: "var(--neon-cyan)", bg: "rgba(0, 243, 255, 0.08)", shadow: "rgba(0, 243, 255, 0.2)" };
    if (val >= 50) return { text: dict['comercio_lvl_moderate'] || "Moderado ⚖️", color: "var(--neon-gold)", bg: "rgba(255, 224, 0, 0.08)", shadow: "rgba(255, 224, 0, 0.2)" };
    return { text: dict['comercio_lvl_low'] || "Bajo 📉", color: "var(--neon-pink)", bg: "rgba(255, 0, 128, 0.08)", shadow: "rgba(255, 0, 128, 0.2)" };
  };
  
  const noordLvl = getLevelLabel(indexNoord);
  const oranjestadLvl = getLevelLabel(indexOranjestad);
  const sannicolasLvl = getLevelLabel(indexSanNicolas);
  
  // Dynamic chips metrics
  let chipNoord1 = `${occNoord}%`;
  let chipNoord2 = timeframe === "today" ? `${flights.totalArrivals} ${dict['comercio_flights_label'] || 'Vuelos'}` : timeframe === "week" ? `${flights.totalArrivals * 7} ${dict['comercio_flights_label'] || 'Vuelos'}` : `${flights.totalArrivals * 30} ${dict['comercio_flights_label'] || 'Vuelos'}`;
  let chipNoord3 = flights.onTimePct !== null && flights.onTimePct !== undefined
    ? `${flights.onTimePct}% ${dict['comercio_flights_ontime_label'] || 'a tiempo'}`
    : (dict['comercio_no_data'] || 'Sin datos');

  let chipOranjestad1 = `${occOranjestad}%`;
  let chipOranjestad2 = timeframe === "today" ? `${cruisesToday.length} ${dict['comercio_cruises'] || 'Cruceros'}` : timeframe === "week" ? `${cruisesList.length} ${dict['comercio_cruises'] || 'Cruceros'}` : `${Math.round(cruisesList.length * 4.2)} ${dict['comercio_cruises'] || 'Cruceros'}`;
  let chipOranjestad3 = timeframe === "today" ? `${(paxToday / 1000).toFixed(1)}k pax` : timeframe === "week" ? `${(paxWeek / 1000).toFixed(1)}k pax` : `${(paxMonth / 1000).toFixed(0)}k pax`;

  let chipSanNicolas1 = `${occSanNicolas}%`;
  let chipSanNicolas2 = timeframe === "today" ? `15 ${dict['comercio_tours'] || 'Tours'}` : timeframe === "week" ? `105 ${dict['comercio_tours'] || 'Tours'}` : `441 ${dict['comercio_tours'] || 'Tours'}`;
  let chipSanNicolas3 = timeframe === "today" ? `450 pax` : timeframe === "week" ? `3.2k pax` : `13k pax`;

  const getNearbyBusinessesHTML = (list) => {
    if (!list || list.length === 0) return `<p style="font-size:0.8rem; color:var(--text-muted); margin:0">${dict['comercio_no_businesses'] || 'No se encontraron negocios cercanos.'}</p>`;
    return list.map(b => `
      <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); padding:0.5rem 0.75rem; border-radius:10px; font-size:0.8rem; text-align:left">
        <div>
          <div style="font-weight:700; color:var(--text-main)">${b.name}</div>
          <div style="font-size:0.7rem; color:var(--text-muted)">${b.type} • 📍 ${(dict['comercio_distance_lbl'] || 'a {dist}').replace('{dist}', b.dist)}</div>
        </div>
        <a href="tel:${b.phone}" class="btn btn-xs" style="padding:2px 8px; font-size:0.75rem; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1)">📞 ${b.phone}</a>
      </div>
    `).join('');
  };

  window.locateNearbyBusinesses = function(zone) {
    const container = document.getElementById(`locator-${zone}`);
    if (!container) return;
    
    container.innerHTML = `
      <div style="margin-top:1rem; display:flex; align-items:center; gap:0.5rem; justify-content:center; color:var(--neon-cyan); font-size:0.8rem">
        <span class="spinner" style="width:14px; height:14px; border:2px solid rgba(255,255,255,0.1); border-top-color:var(--neon-cyan); border-radius:50%; display:inline-block; animation: spin 1s linear infinite;"></span>
        ${dict['comercio_gps_obtaining'] || 'Obteniendo ubicación satelital GPS...'}
      </div>
    `;
    
    if (!document.getElementById("spin-animation-style")) {
      const style = document.createElement("style");
      style.id = "spin-animation-style";
      style.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
      document.head.appendChild(style);
    }

    const list = data.nearbyBusinesses[zone] || [];
    
    const renderList = (message) => {
      let businessesHTML = getNearbyBusinessesHTML(list);
      container.innerHTML = `
        <div style="margin-top:1rem; border-top:1px dashed rgba(255,255,255,0.08); padding-top:0.75rem">
          <div style="font-size:0.72rem; color:var(--neon-emerald); font-weight:700; margin-bottom:0.5rem; text-align:center; line-height:1.3">
            ${message}
          </div>
          <div style="display:flex; flex-direction:column; gap:0.4rem">
            ${businessesHTML}
          </div>
        </div>
      `;
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          const coords = {
            noord: { lat: 12.5683, lng: -70.0402, name: "Noord (Palm Beach)" },
            oranjestad: { lat: 12.5186, lng: -70.0358, name: "Oranjestad (Puerto)" },
            sannicolas: { lat: 12.4333, lng: -69.9083, name: "San Nicolas (Secrets)" }
          };
          
          const target = coords[zone];
          const R = 6371e3;
          const phi1 = lat * Math.PI/180;
          const phi2 = target.lat * Math.PI/180;
          const deltaPhi = (target.lat-lat) * Math.PI/180;
          const deltaLambda = (target.lng-lng) * Math.PI/180;

          const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
                    Math.cos(phi1) * Math.cos(phi2) *
                    Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const d = R * c;

          if (d < 10000) {
            renderList((dict['comercio_gps_shared_here'] || "📍 Ubicación compartida. ¡Te encontramos a ~{dist}m de esta zona! Negocios locales a < 100m:").replace('{dist}', Math.round(d)));
          } else {
            renderList((dict['comercio_gps_simulating'] || "📍 GPS (Lat: {lat}, Lng: {lng}). Simulando rango en {target} para demostración. Negocios a < 100m:")
              .replace('{lat}', lat.toFixed(3))
              .replace('{lng}', lng.toFixed(3))
              .replace('{target}', target.name));
          }
        },
        (error) => {
          renderList(dict['comercio_gps_denied'] || "⚠️ Permiso de ubicación denegado. Cargando negocios simulados a < 100m para esta zona:");
        },
        { timeout: 5000 }
      );
    } else {
      renderList(dict['comercio_gps_not_supported'] || "⚠️ Geolocalización no soportada. Cargando negocios simulados a < 100m para esta zona:");
    }
  };

  // Render Infographic Dashboard Cards
  const dashboardContainer = document.getElementById("comercio-dashboard-container");
  if (dashboardContainer) {
    dashboardContainer.innerHTML = `
      <!-- Tarjeta Noord -->
      <div class="comercio-info-card" style="background:rgba(255,255,255,0.015); border:1px solid var(--glass-border); border-radius:24px; padding:1.5rem; display:flex; flex-direction:row; gap:1.5rem; align-items:center; transition: all 0.3s ease;">
        <!-- Left Column: Circular Conic Gauge -->
        <div style="display:flex; flex-direction:column; align-items:center; gap:0.5rem; min-width:95px">
          <div class="gauge-ring" style="width:90px; height:90px; border-radius:50%; background:conic-gradient(${noordLvl.color} ${indexNoord}%, rgba(255,255,255,0.05) ${indexNoord}%); display:flex; justify-content:center; align-items:center; box-shadow:0 0 20px ${noordLvl.shadow}">
            <div class="gauge-inner" style="width:72px; height:72px; border-radius:50%; background:#130e2c; display:flex; justify-content:center; align-items:center; font-weight:800; font-size:1.4rem; color:var(--text-main); box-shadow:inset 0 0 10px rgba(0,0,0,0.8)">
              ${indexNoord}%
            </div>
          </div>
          <span style="font-size:0.65rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px">${dict['comercio_footfall'] || 'AFLUENCIA'}</span>
        </div>
        
        <!-- Right Column: Details & Stats Chips Grid -->
        <div class="details-wrapper" style="flex:1">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem">
            <div>
              <h3 style="font-weight:800; font-size:1.15rem; color:var(--text-main); margin:0">📍 Noord</h3>
              <span style="font-size:0.75rem; color:var(--text-muted)">Palm Beach / Eagle Beach / Hoteles</span>
            </div>
            <span class="pulse-glow-badge" style="background:${noordLvl.bg}; border:1px solid ${noordLvl.color}; color:${noordLvl.color}; padding:2px 10px; border-radius:30px; font-size:0.75rem; font-weight:800; --glow-color:${noordLvl.color}">${noordLvl.text}</span>
          </div>
          
          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.5rem; margin:0.75rem 0; text-align:center">
            <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); padding:0.4rem; border-radius:10px">
              <div style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase; font-weight:700">🏨 ${dict['comercio_occupancy'] || 'Ocupación'}</div>
              <div style="font-size:0.9rem; font-weight:800; color:var(--neon-cyan); margin-top:2px">${chipNoord1}</div>
            </div>
            <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); padding:0.4rem; border-radius:10px">
              <div style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase; font-weight:700">✈️ ${dict['comercio_transit'] || 'Tránsito'}</div>
              <div style="font-size:0.9rem; font-weight:800; color:var(--neon-gold); margin-top:2px">${chipNoord2}</div>
            </div>
            <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); padding:0.4rem; border-radius:10px">
              <div style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase; font-weight:700">👥 ${dict['comercio_visitors'] || 'Visitantes'}</div>
              <div style="font-size:0.9rem; font-weight:800; color:var(--text-main); margin-top:2px">${chipNoord3}</div>
            </div>
          </div>
          
          <p style="font-size:0.8rem; color:var(--text-muted); line-height:1.45; margin:0.5rem 0 0 0">${noordFactors}</p>
          
          <!-- Negocios Cercanos por Geolocalización -->
          <div class="nearby-locator-container" id="locator-noord">
            <button onclick="locateNearbyBusinesses('noord')" class="btn btn-sm" style="width:100%; margin-top:1rem; background:rgba(0,243,255,0.08); border:1px solid var(--neon-cyan); color:var(--neon-cyan)">
              ${dict['comercio_share_gps_btn'] || '📍 Compartir Ubicación y Buscar Negocios Cercanos'}
            </button>
          </div>
        </div>
      </div>
      
      <!-- Tarjeta Oranjestad -->
      <div class="comercio-info-card" style="background:rgba(255,255,255,0.015); border:1px solid var(--glass-border); border-radius:24px; padding:1.5rem; display:flex; flex-direction:row; gap:1.5rem; align-items:center; transition: all 0.3s ease;">
        <!-- Left Column: Circular Conic Gauge -->
        <div style="display:flex; flex-direction:column; align-items:center; gap:0.5rem; min-width:95px">
          <div class="gauge-ring" style="width:90px; height:90px; border-radius:50%; background:conic-gradient(${oranjestadLvl.color} ${indexOranjestad}%, rgba(255,255,255,0.05) ${indexOranjestad}%); display:flex; justify-content:center; align-items:center; box-shadow:0 0 20px ${oranjestadLvl.shadow}">
            <div class="gauge-inner" style="width:72px; height:72px; border-radius:50%; background:#130e2c; display:flex; justify-content:center; align-items:center; font-weight:800; font-size:1.4rem; color:var(--text-main); box-shadow:inset 0 0 10px rgba(0,0,0,0.8)">
              ${indexOranjestad}%
            </div>
          </div>
          <span style="font-size:0.65rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px">${dict['comercio_footfall'] || 'AFLUENCIA'}</span>
        </div>
        
        <!-- Right Column: Details & Stats Chips Grid -->
        <div class="details-wrapper" style="flex:1">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem">
            <div>
              <h3 style="font-weight:800; font-size:1.15rem; color:var(--text-main); margin:0">📍 Oranjestad</h3>
              <span style="font-size:0.75rem; color:var(--text-muted)">Centro Histórico / Puerto de Cruceros</span>
            </div>
            <span class="pulse-glow-badge" style="background:${oranjestadLvl.bg}; border:1px solid ${oranjestadLvl.color}; color:${oranjestadLvl.color}; padding:2px 10px; border-radius:30px; font-size:0.75rem; font-weight:800; --glow-color:${oranjestadLvl.color}">${oranjestadLvl.text}</span>
          </div>
          
          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.5rem; margin:0.75rem 0; text-align:center">
            <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); padding:0.4rem; border-radius:10px">
              <div style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase; font-weight:700">🏨 ${dict['comercio_occupancy'] || 'Ocupación'}</div>
              <div style="font-size:0.9rem; font-weight:800; color:var(--neon-cyan); margin-top:2px">${chipOranjestad1}</div>
            </div>
            <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); padding:0.4rem; border-radius:10px">
              <div style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase; font-weight:700">🚢 ${dict['comercio_cruises'] || 'Cruceros'}</div>
              <div style="font-size:0.9rem; font-weight:800; color:var(--neon-gold); margin-top:2px">${chipOranjestad2}</div>
            </div>
            <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); padding:0.4rem; border-radius:10px">
              <div style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase; font-weight:700">👥 ${dict['comercio_visitors'] || 'Visitantes'}</div>
              <div style="font-size:0.9rem; font-weight:800; color:var(--text-main); margin-top:2px">${chipOranjestad3}</div>
            </div>
          </div>
          
          <p style="font-size:0.8rem; color:var(--text-muted); line-height:1.45; margin:0.5rem 0 0 0">${oranjestadFactors}</p>
          
          <!-- Negocios Cercanos por Geolocalización -->
          <div class="nearby-locator-container" id="locator-oranjestad">
            <button onclick="locateNearbyBusinesses('oranjestad')" class="btn btn-sm" style="width:100%; margin-top:1rem; background:rgba(0,243,255,0.08); border:1px solid var(--neon-cyan); color:var(--neon-cyan)">
              ${dict['comercio_share_gps_btn'] || '📍 Compartir Ubicación y Buscar Negocios Cercanos'}
            </button>
          </div>
        </div>
      </div>

      <!-- Tarjeta San Nicolas -->
      <div class="comercio-info-card" style="background:rgba(255,255,255,0.015); border:1px solid var(--glass-border); border-radius:24px; padding:1.5rem; display:flex; flex-direction:row; gap:1.5rem; align-items:center; transition: all 0.3s ease;">
        <!-- Left Column: Circular Conic Gauge -->
        <div style="display:flex; flex-direction:column; align-items:center; gap:0.5rem; min-width:95px">
          <div class="gauge-ring" style="width:90px; height:90px; border-radius:50%; background:conic-gradient(${sannicolasLvl.color} ${indexSanNicolas}%, rgba(255,255,255,0.05) ${indexSanNicolas}%); display:flex; justify-content:center; align-items:center; box-shadow:0 0 20px ${sannicolasLvl.shadow}">
            <div class="gauge-inner" style="width:72px; height:72px; border-radius:50%; background:#130e2c; display:flex; justify-content:center; align-items:center; font-weight:800; font-size:1.4rem; color:var(--text-main); box-shadow:inset 0 0 10px rgba(0,0,0,0.8)">
              ${indexSanNicolas}%
            </div>
          </div>
          <span style="font-size:0.65rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px">${dict['comercio_footfall'] || 'AFLUENCIA'}</span>
        </div>
        
        <!-- Right Column: Details & Stats Chips Grid -->
        <div class="details-wrapper" style="flex:1">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem">
            <div>
              <h3 style="font-weight:800; font-size:1.15rem; color:var(--text-main); margin:0">📍 San Nicolas</h3>
              <span style="font-size:0.75rem; color:var(--text-muted)">Secrets Hotel / Baby Beach / Distrito de Arte</span>
            </div>
            <span class="pulse-glow-badge" style="background:${sannicolasLvl.bg}; border:1px solid ${sannicolasLvl.color}; color:${sannicolasLvl.color}; padding:2px 10px; border-radius:30px; font-size:0.75rem; font-weight:800; --glow-color:${sannicolasLvl.color}">${sannicolasLvl.text}</span>
          </div>
          
          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.5rem; margin:0.75rem 0; text-align:center">
            <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); padding:0.4rem; border-radius:10px">
              <div style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase; font-weight:700">🏨 ${dict['comercio_occupancy'] || 'Ocupación'}</div>
              <div style="font-size:0.9rem; font-weight:800; color:var(--neon-cyan); margin-top:2px">${chipSanNicolas1}</div>
            </div>
            <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); padding:0.4rem; border-radius:10px">
              <div style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase; font-weight:700">🚌 ${dict['comercio_tours'] || 'Tours'}</div>
              <div style="font-size:0.9rem; font-weight:800; color:var(--neon-gold); margin-top:2px">${chipSanNicolas2}</div>
            </div>
            <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); padding:0.4rem; border-radius:10px">
              <div style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase; font-weight:700">👥 ${dict['comercio_visitors'] || 'Visitantes'}</div>
              <div style="font-size:0.9rem; font-weight:800; color:var(--text-main); margin-top:2px">${chipSanNicolas3}</div>
            </div>
          </div>
          
          <p style="font-size:0.8rem; color:var(--text-muted); line-height:1.45; margin:0.5rem 0 0 0">${sannicolasFactors}</p>
          
          <!-- Negocios Cercanos por Geolocalización -->
          <div class="nearby-locator-container" id="locator-sannicolas">
            <button onclick="locateNearbyBusinesses('sannicolas')" class="btn btn-sm" style="width:100%; margin-top:1rem; background:rgba(0,243,255,0.08); border:1px solid var(--neon-cyan); color:var(--neon-cyan)">
              ${dict['comercio_share_gps_btn'] || '📍 Compartir Ubicación y Buscar Negocios Cercanos'}
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  // Cruise Schedule List
  const cruiseListEl = document.getElementById("cruise-schedule-list");
  if (cruiseListEl) {
    cruiseListEl.innerHTML = data.cruises.map(c => {
      let isToday = c.date === "Hoy";
      return `
        <div class="league-box" style="margin-bottom:0.25rem; display:flex; justify-content:space-between; align-items:center; border-left: 3px solid ${isToday ? 'var(--neon-gold)' : 'var(--glass-border)'}">
          <div>
            <div style="font-weight:700; color:var(--text-main)">🚢 ${c.ship}</div>
            <div style="font-size:0.75rem; color:var(--text-muted)">${dict['arrivals_passengers'] || 'Pasajeros'}: ${c.passengers.toLocaleString()} | Hora: ${c.time}</div>
          </div>
          <div style="font-size:0.8rem; font-weight:800; color:${isToday ? 'var(--neon-gold)' : 'var(--text-muted)'}">
            ${isToday ? (lang === 'es' ? 'Hoy' : lang === 'en' ? 'Today' : lang === 'nl' ? 'Vandaag' : 'Awe') : c.date}
          </div>
        </div>
      `;
    }).join('');
  }
  
  // Airport & Capacity stats
  const occNoordEl = document.getElementById("comercio-stat-occ-noord");
  if (occNoordEl) occNoordEl.innerText = `${occNoord}%`;
  
  const occOranjestadEl = document.getElementById("comercio-stat-occ-oranjestad");
  if (occOranjestadEl) occOranjestadEl.innerText = `${occOranjestad}%`;
  
  const occSanNicolasEl = document.getElementById("comercio-stat-occ-sannicolas");
  if (occSanNicolasEl) occSanNicolasEl.innerText = `${occSanNicolas}%`;
  
  const flightsEl = document.getElementById("comercio-stat-flights");
  if (flightsEl) {
    let flightsDesc = (dict['comercio_flights_desc'] || "{flights} vuelos")
      .replace('{flights}', flights.totalArrivals);
    flightsEl.innerText = flightsDesc;
  }

  // Render Lodging Occupancy
  const lodgingContainer = document.getElementById("comercio-lodging-container");
  if (lodgingContainer) {
    lodgingContainer.innerHTML = `
      <!-- Resorts -->
      <div style="display:flex; flex-direction:column; gap:0.25rem">
        <div style="display:flex; justify-content:space-between; font-size:0.8rem">
          <span style="color:var(--text-muted)">🏨 ${dict['comercio_resorts'] || 'Hoteles Resorts'}</span>
          <span style="display:flex; align-items:center; gap:0.35rem"><span style="color:var(--neon-cyan); font-weight:800">80%</span><span style="font-size:0.6rem; color:var(--text-muted); background:rgba(255,255,255,0.07); border:1px solid var(--glass-border); border-radius:3px; padding:0px 4px">Est. ATA</span></span>
        </div>
        <div style="width:100%; height:6px; background:rgba(255,255,255,0.05); border-radius:10px; overflow:hidden">
          <div style="width:80%; height:100%; background:linear-gradient(90deg, var(--neon-cyan), #00a2ff); border-radius:10px; box-shadow:0 0 8px var(--neon-cyan)"></div>
        </div>
      </div>
      
      <!-- Todo Incluidos -->
      <div style="display:flex; flex-direction:column; gap:0.25rem">
        <div style="display:flex; justify-content:space-between; font-size:0.8rem">
          <span style="color:var(--text-muted)">🍹 ${dict['comercio_all_inclusive'] || 'Hoteles Todo Incluidos'}</span>
          <span style="display:flex; align-items:center; gap:0.35rem"><span style="color:var(--neon-emerald); font-weight:800">85%</span><span style="font-size:0.6rem; color:var(--text-muted); background:rgba(255,255,255,0.07); border:1px solid var(--glass-border); border-radius:3px; padding:0px 4px">Est. ATA</span></span>
        </div>
        <div style="width:100%; height:6px; background:rgba(255,255,255,0.05); border-radius:10px; overflow:hidden">
          <div style="width:85%; height:100%; background:linear-gradient(90deg, var(--neon-emerald), #00ffaa); border-radius:10px; box-shadow:0 0 8px var(--neon-emerald)"></div>
        </div>
      </div>
      
      <!-- Condos -->
      <div style="display:flex; flex-direction:column; gap:0.25rem">
        <div style="display:flex; justify-content:space-between; font-size:0.8rem">
          <span style="color:var(--text-muted)">🏢 ${dict['comercio_condos'] || 'Condominios (Condos)'}</span>
          <span style="display:flex; align-items:center; gap:0.35rem"><span style="color:var(--neon-gold); font-weight:800">70%</span><span style="font-size:0.6rem; color:var(--text-muted); background:rgba(255,255,255,0.07); border:1px solid var(--glass-border); border-radius:3px; padding:0px 4px">Est. ATA</span></span>
        </div>
        <div style="width:100%; height:6px; background:rgba(255,255,255,0.05); border-radius:10px; overflow:hidden">
          <div style="width:70%; height:100%; background:linear-gradient(90deg, var(--neon-gold), #ffb700); border-radius:10px; box-shadow:0 0 8px var(--neon-gold)"></div>
        </div>
      </div>
      
      <!-- Villas -->
      <div style="display:flex; flex-direction:column; gap:0.25rem">
        <div style="display:flex; justify-content:space-between; font-size:0.8rem">
          <span style="color:var(--text-muted)">🏡 ${dict['comercio_villas'] || 'Villas'}</span>
          <span style="display:flex; align-items:center; gap:0.35rem"><span style="color:var(--neon-pink); font-weight:800">58%</span><span style="font-size:0.6rem; color:var(--text-muted); background:rgba(255,255,255,0.07); border:1px solid var(--glass-border); border-radius:3px; padding:0px 4px">Est. ATA</span></span>
        </div>
        <div style="width:100%; height:6px; background:rgba(255,255,255,0.05); border-radius:10px; overflow:hidden">
          <div style="width:58%; height:100%; background:linear-gradient(90deg, var(--neon-pink), #ff007f); border-radius:10px; box-shadow:0 0 8px var(--neon-pink)"></div>
        </div>
      </div>
      
      <!-- Apartamentos Boutique -->
      <div style="display:flex; flex-direction:column; gap:0.25rem">
        <div style="display:flex; justify-content:space-between; font-size:0.8rem">
          <span style="color:var(--text-muted)">✨ ${dict['comercio_boutique_apts'] || 'Apartamentos Boutique'}</span>
          <span style="display:flex; align-items:center; gap:0.35rem"><span style="color:var(--neon-purple); font-weight:800">75%</span><span style="font-size:0.6rem; color:var(--text-muted); background:rgba(255,255,255,0.07); border:1px solid var(--glass-border); border-radius:3px; padding:0px 4px">Est. ATA</span></span>
        </div>
        <div style="width:100%; height:6px; background:rgba(255,255,255,0.05); border-radius:10px; overflow:hidden">
          <div style="width:75%; height:100%; background:linear-gradient(90deg, var(--neon-purple), #9900ff); border-radius:10px; box-shadow:0 0 8px var(--neon-purple)"></div>
        </div>
      </div>
    `;
  }
}

function renderSchoolsList() {
  const container = document.getElementById("schools-container");
  if (!container) return;

  const lvl = document.getElementById("school-filter-level").value;
  const type = document.getElementById("school-filter-type").value;
  const lang = appState.language || 'es';
  const dict = SABI_TRANSLATIONS[lang];

  let list = SABI_DATA.schools;
  if (lvl !== 'all') list = list.filter(s => s.level === lvl);
  if (type !== 'all') list = list.filter(s => s.type === type);

  if (list.length === 0) {
    const noSchoolsText = dict['schools_no_results'] || "No se encontraron escuelas que coincidan con los filtros.";
    container.innerHTML = `<div style="padding:3rem 2rem; text-align:center; color:var(--text-muted); font-size:0.9rem; background:rgba(0,0,0,0.15); border-radius:16px; border:1px dashed var(--glass-border)">🔍 ${noSchoolsText}</div>`;
    return;
  }

  const levelLabels = {
    creche: dict['schools_level_creche'] || '🍼 Creche (0-3 años)',
    kleuter: dict['schools_level_kleuter'] || '🧸 Kleuter (4-5 años)',
    basis: dict['schools_level_basis'] || '📚 Primaria',
    secundario: dict['schools_level_secundario'] || '🎓 Secundario / Técnico'
  };

  const levelIcons = {
    creche: '🍼',
    kleuter: '🧸',
    basis: '📚',
    secundario: '🎓'
  };

  const langLookup = {
    es: { "Dutch": "Holandés", "Papiamento": "Papiamento", "Dutch / Papiamento": "Holandés / Papiamento", "Papiamento / Dutch": "Papiamento / Holandés" },
    en: { "Dutch": "Dutch", "Papiamento": "Papiamento", "Dutch / Papiamento": "Dutch / Papiamento", "Papiamento / Dutch": "Papiamento / Dutch" },
    nl: { "Dutch": "Nederlands", "Papiamento": "Papiamento", "Dutch / Papiamento": "Nederlands / Papiamento", "Papiamento / Dutch": "Papiamento / Nederlands" },
    pap: { "Dutch": "Hulandes", "Papiamento": "Papiamento", "Dutch / Papiamento": "Hulandes / Papiamento", "Papiamento / Dutch": "Papiamento / Hulandes" }
  };

  const langLabel = dict['schools_lbl_language'] || 'Idioma';
  const levelLabel = dict['schools_lbl_level'] || 'Nivel';

  container.innerHTML = list.map(school => {
    const icon = levelIcons[school.level] || '🏫';
    const lvlText = levelLabels[school.level] || school.level;
    const translatedLang = (langLookup[lang] && langLookup[lang][school.lang]) || school.lang;
    return `
      <div class="school-card" onclick="simulateSchoolCost('${school.id}')">
        <div class="school-info-primary">
          <div class="school-name">${icon} ${school.name}</div>
          <div class="school-metadata">
            ${langLabel}: <strong style="color:var(--text-main)">${translatedLang}</strong> &bull; ${levelLabel}: <strong style="color:var(--text-main)">${lvlText}</strong>
          </div>
        </div>
        <div>
          <span class="school-type-badge ${school.type.toLowerCase()}">${school.type}</span>
        </div>
      </div>
    `;
  }).join('');
}

// Global functions for school filter
function filterSchools() {
  renderSchoolsList();
}
window.filterSchools = filterSchools;
window.simulateSchoolCost = simulateSchoolCost;

function simulateSchoolCost(id) {
  const school = SABI_DATA.schools.find(s => s.id === id);
  if (!school) return;

  SoundEffects.playClick();
  
  // Highlight active
  document.querySelectorAll(".school-card").forEach(card => {
    const name = card.querySelector(".school-name").innerText;
    card.classList.toggle("active", name.includes(school.name));
  });

  const cardBody = document.getElementById("school-calculator-body");
  
  const directSchoolFees = school.feeEnroll + school.feeAirco;
  const otherExpenses = school.uniformCost + school.committee + school.supplies;
  const total = directSchoolFees + otherExpenses;
  
  const adminKey = school.type.toLowerCase();
  const admin = SABI_DATA.administrations[adminKey] || SABI_DATA.administrations.private;
  
  const lang = appState.language || 'es';
  const dict = SABI_TRANSLATIONS[lang];

  const notAvailableText = dict['calc_not_available'] || 'No disponible';
  const adminName = dict[`admin_name_${adminKey}`] || admin.name;
  const adminDesc = dict[`admin_desc_${adminKey}`] || admin.desc;
  const adminAddress = dict[`admin_address_${adminKey}`] || admin.address;

  let schoolWebsiteHtml = school.website 
    ? `<a href="${school.website}" target="_blank" style="color:var(--neon-cyan); text-decoration:none; display:inline-flex; align-items:center; gap:4px">${school.website.replace('https://', '').replace('www.', '')} <span style="font-size:0.75rem">🌐</span></a>` 
    : `<span style="color:var(--text-muted)">${notAvailableText}</span>`;
    
  let adminWebsiteHtml = admin.website 
    ? `<a href="${admin.website}" target="_blank" style="color:var(--neon-gold); text-decoration:none; display:inline-flex; align-items:center; gap:4px">${admin.website.replace('https://', '').replace('http://', '').replace('www.', '')} <span style="font-size:0.75rem">🌐</span></a>` 
    : `<span style="color:var(--text-muted)">${notAvailableText}</span>`;

  cardBody.innerHTML = `
    <!-- Datos de Contacto de la Escuela -->
    <div style="background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); padding:1rem; border-radius:14px; margin-bottom:1rem; font-size:0.85rem">
      <h3 style="font-weight:800; font-size:1.1rem; color:var(--text-main); margin-bottom:0.75rem">🏫 ${school.name}</h3>
      <div style="display:flex; flex-direction:column; gap:0.4rem">
        <div style="display:flex; justify-content:space-between">
          <span style="color:var(--text-muted)">${dict['school_calc_direct_phone'] || 'Teléfono Directo'}:</span>
          <strong><a href="tel:${school.phone}" style="color:var(--text-main); text-decoration:none; display:inline-flex; align-items:center; gap:4px">${school.phone} 📞</a></strong>
        </div>
        <div style="display:flex; justify-content:space-between">
          <span style="color:var(--text-muted)">${dict['school_calc_website'] || 'Sitio Web'}:</span>
          <strong>${schoolWebsiteHtml}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center">
          <span style="color:var(--text-muted)">${dict['school_calc_gps'] || 'Ubicación en GPS'}:</span>
          <a href="${school.maps}" target="_blank" class="btn-sm btn-cyan" style="font-size:0.75rem; padding:2px 8px; border-radius:6px; text-decoration:none; display:inline-flex; align-items:center; gap:4px">📍 ${dict['btn_map'] || 'Ver Mapa'}</a>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-top:0.25rem; border-top:1px dashed rgba(255,255,255,0.06); padding-top:0.5rem">
          <span style="color:var(--text-muted)">${dict['school_calc_services'] || 'Servicios / Equipamiento'}:</span>
          <strong style="color:var(--neon-cyan); font-size:0.78rem; text-align:right; max-width:180px; display:inline-block">${school.services ? school.services.join(', ') : 'A/C'}</strong>
        </div>
      </div>
    </div>

    <!-- Presupuesto Estimado -->
    <div class="customs-summary-box" style="margin-bottom:1rem">
      <h3 style="font-weight:800; font-size:1.05rem; color:var(--neon-cyan); margin-bottom:0.75rem">💰 ${dict['school_calc_budget_title'] || 'Presupuesto Inicial Proyectado'}</h3>
      
      <div style="font-weight:700; color:var(--text-main); font-size:0.82rem; margin:0.5rem 0 0.25rem 0; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:2px">
        ${dict['school_calc_school_fees'] || 'Costos de Matrícula y Servicios (Pagados al Colegio)'}:
      </div>
      <div class="summary-row" style="font-size:0.85rem; padding: 0.2rem 0">
        <span>${dict['school_calc_enrollment'] || 'Matrícula de Inscripción'}:</span>
        <span style="font-weight:700">Fl. ${school.feeEnroll.toFixed(2)} AWG</span>
      </div>
      <div class="summary-row" style="font-size:0.85rem; padding: 0.2rem 0">
        <span>${dict['school_calc_airco'] || 'Mantenimiento de Aire Acondicionado (A/C)'}:</span>
        <span style="font-weight:700">Fl. ${school.feeAirco.toFixed(2)} AWG</span>
      </div>
      <div class="summary-row" style="font-size:0.85rem; padding: 0.2rem 0; color:var(--neon-cyan)">
        <span>${dict['school_calc_subtotal'] || 'Subtotal Colegio (Obligatorio)'}:</span>
        <span style="font-weight:700">Fl. ${directSchoolFees.toFixed(2)} AWG</span>
      </div>

      <div style="font-weight:700; color:var(--text-main); font-size:0.82rem; margin:0.75rem 0 0.25rem 0; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:2px">
        ${dict['school_calc_other_expenses'] || 'Otros Gastos Estimados (Terceros / Opcionales)'}:
      </div>
      <div class="summary-row" style="font-size:0.85rem; padding: 0.2rem 0">
        <span>${dict['school_calc_uniforms'] || 'Uniformes (Proyección)'}:</span>
        <span>Fl. ${school.uniformCost.toFixed(2)} AWG</span>
      </div>
      <div class="summary-row" style="font-size:0.85rem; padding: 0.2rem 0">
        <span>${dict['school_calc_parents_committee'] || 'Comité de Padres (Oudercommissie)'}:</span>
        <span>Fl. ${school.committee.toFixed(2)} AWG</span>
      </div>
      <div class="summary-row" style="font-size:0.85rem; padding: 0.2rem 0">
        <span>${dict['school_calc_supplies'] || 'Útiles Escolares & Libros'}:</span>
        <span>Fl. ${school.supplies.toFixed(2)} AWG</span>
      </div>
      
      <div class="summary-row" style="margin-top:0.75rem; padding-top:0.55rem; border-top:1.5px solid var(--neon-cyan); font-weight:800; font-size:0.95rem">
        <span>${dict['school_calc_total'] || 'Presupuesto Inicial Total'}:</span>
        <span style="color:var(--neon-cyan)">Fl. ${total.toFixed(2)} AWG</span>
      </div>
    </div>

    <!-- Datos de la Administración Educativa -->
    <div style="background:rgba(255,224,0,0.02); border:1px solid rgba(255,224,0,0.15); padding:1.2rem; border-radius:14px; font-size:0.85rem">
      <h3 style="font-weight:800; font-size:1rem; color:var(--neon-gold); margin-bottom:0.4rem">🏢 ${dict['school_calc_regulatory_body'] || 'Ente Regulador'}: ${adminName}</h3>
      <p style="font-size:0.78rem; color:var(--text-muted); line-height:1.45; margin-bottom:0.75rem">${adminDesc}</p>
      
      <div style="display:flex; flex-direction:column; gap:0.4rem; border-top:1px dashed rgba(255,224,0,0.15); padding-top:0.75rem">
        <div style="display:flex; justify-content:space-between">
          <span style="color:var(--text-muted)">${dict['school_calc_office_phone'] || 'Teléfono Sede'}:</span>
          ${admin.phone !== 'N/A (Contacto individual)' 
            ? `<strong><a href="tel:${admin.phone}" style="color:var(--text-main); text-decoration:none; display:inline-flex; align-items:center; gap:4px">${admin.phone} 📞</a></strong>` 
            : `<strong>${dict['school_calc_individual_contact'] || admin.phone}</strong>`}
        </div>
        <div style="display:flex; justify-content:space-between">
          <span style="color:var(--text-muted)">${dict['school_calc_official_website'] || 'Sitio Web Oficial'}:</span>
          <strong>${adminWebsiteHtml}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center">
          <span style="color:var(--text-muted)">${dict['school_calc_office_address'] || 'Dirección Sede'}:</span>
          <span style="text-align:right; font-weight:700">${adminAddress}</span>
        </div>
        ${admin.maps 
          ? `<div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.25rem">
              <span style="color:var(--text-muted)">${dict['school_calc_office_gps'] || 'Ruta GPS Sede'}:</span>
              <a href="${admin.maps}" target="_blank" class="btn-sm btn-cyan" style="font-size:0.75rem; padding:2px 8px; border-radius:6px; text-decoration:none; display:inline-flex; align-items:center; gap:4px">📍 ${dict['btn_map'] || 'Ver Mapa'}</a>
            </div>` 
          : ''}
      </div>
    </div>
  `;
}

// ==================== SPORTS ANALYTICS HUB DATA & LOGIC ====================

const SPORTS_HUB_DATA = {
  matches: [],
  standings: {
    local: [],
    futbol: [
      // Liga Española (esp.1)
      { rank: 1, team: "Real Madrid", played: 38, won: 29, drawn: 8, lost: 1, points: 95, league: "esp.1" },
      { rank: 2, team: "Barcelona", played: 38, won: 26, drawn: 7, lost: 5, points: 85, league: "esp.1" },
      { rank: 3, team: "Girona", played: 38, won: 25, drawn: 6, lost: 7, points: 81, league: "esp.1" },
      { rank: 4, team: "Atlético Madrid", played: 38, won: 24, drawn: 4, lost: 10, points: 76, league: "esp.1" },

      // Premier League (eng.1)
      { rank: 1, team: "Manchester City", played: 38, won: 28, drawn: 7, lost: 3, points: 91, league: "eng.1" },
      { rank: 2, team: "Arsenal", played: 38, won: 28, drawn: 5, lost: 5, points: 89, league: "eng.1" },
      { rank: 3, team: "Liverpool", played: 38, won: 24, drawn: 10, lost: 4, points: 82, league: "eng.1" },
      { rank: 4, team: "Aston Villa", played: 38, won: 20, drawn: 8, lost: 10, points: 68, league: "eng.1" },

      // Ligue 1 (fra.1)
      { rank: 1, team: "Paris Saint-Germain", played: 34, won: 22, drawn: 10, lost: 2, points: 76, league: "fra.1" },
      { rank: 2, team: "Monaco", played: 34, won: 20, drawn: 7, lost: 7, points: 67, league: "fra.1" },
      { rank: 3, team: "Brest", played: 34, won: 17, drawn: 10, lost: 7, points: 61, league: "fra.1" },
      { rank: 4, team: "Lille", played: 34, won: 16, drawn: 11, lost: 7, points: 59, league: "fra.1" },

      // Bundesliga (ger.1)
      { rank: 1, team: "Bayer Leverkusen", played: 34, won: 28, drawn: 6, lost: 0, points: 90, league: "ger.1" },
      { rank: 2, team: "VfB Stuttgart", played: 34, won: 23, drawn: 4, lost: 7, points: 73, league: "ger.1" },
      { rank: 3, team: "Bayern Munich", played: 34, won: 23, drawn: 3, lost: 8, points: 72, league: "ger.1" },
      { rank: 4, team: "RB Leipzig", played: 34, won: 19, drawn: 8, lost: 7, points: 65, league: "ger.1" }
    ],
    beisbol: [
      { rank: 1, team: "NY Yankees", played: 162, won: 94, lost: 68, pct: ".580" },
      { rank: 2, team: "Baltimore Orioles", played: 162, won: 91, lost: 71, pct: ".562" },
      { rank: 3, team: "Boston Red Sox", played: 162, won: 81, lost: 81, pct: ".500" },
      { rank: 4, team: "Tampa Bay Rays", played: 162, won: 80, lost: 82, pct: ".494" }
    ],
    baloncesto: [
      { rank: 1, team: "Boston Celtics", played: 82, won: 64, lost: 18, pct: ".780" },
      { rank: 2, team: "New York Knicks", played: 82, won: 50, lost: 32, pct: ".610" },
      { rank: 3, team: "Milwaukee Bucks", played: 82, won: 49, lost: 33, pct: ".598" },
      { rank: 4, team: "Cleveland Cavaliers", played: 82, won: 48, lost: 34, pct: ".585" }
    ],
    nfl: [
      { rank: 1, team: "Baltimore Ravens", played: 17, won: 13, lost: 4, pct: ".765" },
      { rank: 2, team: "San Francisco 49ers", played: 17, won: 12, lost: 5, pct: ".706" },
      { rank: 3, team: "Kansas City Chiefs", played: 17, won: 11, lost: 6, pct: ".647" },
      { rank: 4, team: "Buffalo Bills", played: 17, won: 11, lost: 6, pct: ".647" }
    ],
    nhl: [
      { rank: 1, team: "NY Rangers", played: 82, won: 55, lost: 23, drawn: 4, points: 114 },
      { rank: 2, team: "Dallas Stars", played: 82, won: 52, lost: 21, drawn: 9, points: 113 },
      { rank: 3, team: "Florida Panthers", played: 82, won: 52, lost: 24, drawn: 6, points: 110 },
      { rank: 4, team: "Edmonton Oilers", played: 82, won: 49, lost: 27, drawn: 6, points: 104 }
    ]
  },
  predictions: []
};

let sportsHubLiveInterval = null;

function startSportsHubLiveTimer() {
  if (sportsHubLiveInterval) clearInterval(sportsHubLiveInterval);
  sportsHubLiveInterval = setInterval(() => {
    const container = document.getElementById("sports-hub-content-container");
    if (!container) return;
    SPORTS_HUB_DATA.matches.forEach(m => {
      if (m.status === 'live') {
        if (m.sport === 'futbol') {
          if (m.minute < 90) {
            m.minute++;
            if (Math.random() < 0.015) {
              if (Math.random() < 0.5) m.homeScore++;
              else m.awayScore++;
              if (appState.activeSportsHubTab === 'live' && appState.activeSportsHubSport === m.sport) {
                if (m.league === appState.activeFootballLeague) {
                  renderSportsHub();
                }
              }
            }
          }
        } else if (m.sport === 'beisbol') {
          if (Math.random() < 0.02) {
            if (Math.random() < 0.5) m.homeScore += Math.floor(Math.random() * 2);
            else m.awayScore += Math.floor(Math.random() * 2);
            if (appState.activeSportsHubTab === 'live' && appState.activeSportsHubSport === m.sport) {
              renderSportsHub();
            }
          }
        } else if (m.sport === 'baloncesto') {
          if (Math.random() < 0.3) {
            m.homeScore += Math.floor(Math.random() * 3) + 1;
            m.awayScore += Math.floor(Math.random() * 3) + 1;
            if (appState.activeSportsHubTab === 'live' && appState.activeSportsHubSport === m.sport) {
              renderSportsHub();
            }
          }
        } else if (m.sport === 'nfl') {
          if (Math.random() < 0.05) {
            const points = [3, 6, 7][Math.floor(Math.random() * 3)];
            if (Math.random() < 0.5) m.homeScore += points;
            else m.awayScore += points;
            if (appState.activeSportsHubTab === 'live' && appState.activeSportsHubSport === m.sport) {
              renderSportsHub();
            }
          }
        } else if (m.sport === 'nhl') {
          if (Math.random() < 0.02) {
            if (Math.random() < 0.5) m.homeScore++;
            else m.awayScore++;
            if (appState.activeSportsHubTab === 'live' && appState.activeSportsHubSport === m.sport) {
              renderSportsHub();
            }
          }
        }
      }
    });
    const minutesElements = document.querySelectorAll(".ticking-minute");
    minutesElements.forEach(el => {
      const matchSport = el.dataset.sport;
      const homeTeam = el.dataset.home;
      const awayTeam = el.dataset.away;
      const m = SPORTS_HUB_DATA.matches.find(match => match.sport === matchSport && match.homeTeam === homeTeam && match.awayTeam === awayTeam);
      if (m) {
        if (m.sport === 'futbol') {
          el.innerText = `${m.minute}'`;
        }
      }
    });
  }, 10000);
}

function switchSportsHubTab(tab) {
  appState.activeSportsHubTab = tab;
  SoundEffects.playClick();
  document.querySelectorAll("[data-hub-subtab]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.hubSubtab === tab);
  });
  renderSportsHub();
}

function switchSportsHubSport(sport) {
  appState.activeSportsHubSport = sport;
  SoundEffects.playClick();
  document.querySelectorAll("[data-hub-sport]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.hubSport === sport);
  });
  
  const flContainer = document.getElementById("sports-football-leagues-container");
  if (flContainer) {
    flContainer.style.display = sport === 'futbol' ? 'flex' : 'none';
  }
  
  renderSportsHub();
}

function switchFootballLeague(league) {
  appState.activeFootballLeague = league;
  SoundEffects.playClick();
  document.querySelectorAll("[data-football-league]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.footballLeague === league);
  });
  renderSportsHub();
}

window.switchSportsHubTab = switchSportsHubTab;
window.switchSportsHubSport = switchSportsHubSport;
window.switchFootballLeague = switchFootballLeague;

function setBettingReminder(home, away) {
  SoundEffects.playClick();
  const lang = appState.language || 'es';
  const dict = SABI_TRANSLATIONS[lang];
  showToast(dict['sports_reminder'] || "Recordatorio", `${dict['sports_reminder_saved'] || '¡Recordatorio guardado para:'} ${home} vs ${away}!`);
}

function getTeamRecordFromStandings(teamName, sport) {
  const standings = SPORTS_HUB_DATA.standings[sport] || [];
  let row = standings.find(s => s.team === teamName);
  if (!row) {
    const cleanName = teamName.toLowerCase().replace(/^(ny|la|sf|sd|kc|tb|gb|ne|tb)\s+/g, '');
    row = standings.find(s => {
      const sName = s.team.toLowerCase();
      return sName.includes(cleanName) || cleanName.includes(sName.replace(/^(ny|la|sf|sd|kc|tb|gb|ne|tb)\s+/g, ''));
    });
  }
  if (row) {
    if (sport === 'beisbol' || sport === 'baloncesto' || sport === 'nfl') {
      return `${row.won}-${row.lost}`;
    } else {
      return `${row.won}-${row.drawn || 0}-${row.lost}`;
    }
  }
  return null;
}

function showSportsMatchDetailsModal(home, away) {
  SoundEffects.playClick();
  const match = SPORTS_HUB_DATA.matches.find(m => m.homeTeam === home && m.awayTeam === away);
  if (!match) return;

  const lang = appState.language || 'es';
  const dict = SABI_TRANSLATIONS[lang];

  // Parse or calculate probabilities dynamically based on standings PCT
  let homeProb = 50;
  let drawProb = 0;
  let awayProb = 50;

  const standingsList = SPORTS_HUB_DATA.standings[match.sport] || [];
  const standHome = standingsList.find(s => s.team === home || s.team.toLowerCase().includes(home.toLowerCase()) || home.toLowerCase().includes(s.team.toLowerCase()));
  const standAway = standingsList.find(s => s.team === away || s.team.toLowerCase().includes(away.toLowerCase()) || away.toLowerCase().includes(s.team.toLowerCase()));

  if (standHome && standAway) {
    const pctHome = parseFloat(standHome.pct) || (standHome.won / (standHome.played || 1)) || 0.5;
    const pctAway = parseFloat(standAway.pct) || (standAway.won / (standAway.played || 1)) || 0.5;
    const sum = pctHome + pctAway;
    if (sum > 0) {
      if (match.sport === 'futbol' || match.sport === 'local') {
        const rawHome = (pctHome / sum) * 75;
        const rawAway = (pctAway / sum) * 75;
        homeProb = Math.round(rawHome);
        awayProb = Math.round(rawAway);
        drawProb = 100 - homeProb - awayProb;
      } else {
        homeProb = Math.round((pctHome / sum) * 100);
        awayProb = 100 - homeProb;
        drawProb = 0;
      }
    }
  } else if (match.prediction_h2h) {
    const parts = match.prediction_h2h.replace(/%/g, '').split('-');
    if (parts.length === 2) {
      homeProb = parseFloat(parts[0]) || 50;
      awayProb = parseFloat(parts[1]) || 50;
      drawProb = 0;
    } else if (parts.length === 3) {
      homeProb = parseFloat(parts[0]) || 40;
      drawProb = parseFloat(parts[1]) || 20;
      awayProb = parseFloat(parts[2]) || 40;
    }
  }

  // Force draw probability to 0 for non-soccer/non-local sports
  if (match.sport !== 'futbol' && match.sport !== 'local') {
    if (drawProb > 0) {
      homeProb = Math.round(homeProb + drawProb / 2);
      awayProb = 100 - homeProb;
      drawProb = 0;
    }
  }

  // Get dynamic deterministic statistics
  const stats = getDeterministicStats(home, away, match.sport);

  // Look up real records from standings
  const realRecordHome = getTeamRecordFromStandings(home, match.sport);
  const realRecordAway = getTeamRecordFromStandings(away, match.sport);
  const recordHome = realRecordHome || stats.recordHome;
  const recordAway = realRecordAway || stats.recordAway;

  // Generate unique modal overlay
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay active";
  overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); backdrop-filter:blur(8px); display:flex; justify-content:center; align-items:center; z-index:999999; padding:1rem;";
  
  // Close modal when clicking outside card
  overlay.onclick = function(e) {
    if (e.target === overlay) {
      overlay.remove();
    }
  };

  let probBarHtml = "";
  if (drawProb > 0) {
    probBarHtml = `
      <div style="display:flex; height:12px; border-radius:6px; overflow:hidden; background:rgba(255,255,255,0.05); margin:0.5rem 0 1rem 0">
        <div style="width:${homeProb}%; background:var(--neon-emerald);" title="Local: ${homeProb}%"></div>
        <div style="width:${drawProb}%; background:var(--neon-gold);" title="Empate: ${drawProb}%"></div>
        <div style="width:${awayProb}%; background:var(--neon-pink);" title="Visitante: ${awayProb}%"></div>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-muted); font-weight:700">
        <span style="color:var(--neon-emerald)">${homeProb}% Local</span>
        <span style="color:var(--neon-gold)">${drawProb}% Empate</span>
        <span style="color:var(--neon-pink)">${awayProb}% Visitante</span>
      </div>
    `;
  } else {
    probBarHtml = `
      <div style="display:flex; height:12px; border-radius:6px; overflow:hidden; background:rgba(255,255,255,0.05); margin:0.5rem 0 1rem 0">
        <div style="width:${homeProb}%; background:var(--neon-cyan);" title="Local: ${homeProb}%"></div>
        <div style="width:${awayProb}%; background:var(--neon-pink);" title="Visitante: ${awayProb}%"></div>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-muted); font-weight:700">
        <span style="color:var(--neon-cyan)">${homeProb}% Local</span>
        <span style="color:var(--neon-pink)">${awayProb}% Visitante</span>
      </div>
    `;
  }

  const statsRowsHtml = stats.details.map(row => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:0.6rem 0; border-bottom:1px solid rgba(255,255,255,0.05); font-size:0.8rem">
      <span style="width:30%; text-align:left; font-weight:700; color:var(--text-main)">${row.home}</span>
      <span style="width:40%; text-align:center; color:var(--text-muted); font-size:0.75rem; text-transform:uppercase; letter-spacing:0.5px">${row.label}</span>
      <span style="width:30%; text-align:right; font-weight:700; color:var(--text-main)">${row.away}</span>
    </div>
  `).join('');

  overlay.innerHTML = `
    <div class="modal-card" style="max-width:480px; width:100%; background:#130e2c; border:1px solid var(--neon-cyan); border-radius:24px; padding:1.5rem; display:flex; flex-direction:column; box-shadow:0 10px 30px rgba(0,0,0,0.5)">
      <!-- Close Header -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem">
        <span style="font-size:0.75rem; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:var(--neon-cyan)">📊 Análisis de Partido</span>
        <button style="background:none; border:none; color:var(--text-muted); font-size:1.25rem; cursor:pointer" onclick="this.closest('.modal-overlay').remove()">&times;</button>
      </div>

      <!-- Teams & Score Header -->
      <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:16px; padding:1.25rem; text-align:center; margin-bottom:1.25rem">
        <div style="display:flex; justify-content:space-between; align-items:center">
          <div style="width:40%; text-align:center">
            <div style="font-weight:800; font-size:1rem; color:var(--text-main); margin-bottom:0.25rem">${home}</div>
            <span style="font-size:0.7rem; color:var(--text-muted)">(${recordHome})</span>
          </div>
          
          <div style="width:20%; text-align:center">
            ${match.status === 'live' ? `
              <div style="font-size:1.5rem; font-weight:900; color:var(--neon-pink); line-height:1">${match.homeScore} - ${match.awayScore}</div>
              <span style="font-size:0.6rem; text-transform:uppercase; color:var(--neon-pink); font-weight:800; display:block; margin-top:0.25rem">LIV</span>
            ` : match.status === 'finished' ? `
              <div style="font-size:1.5rem; font-weight:900; color:var(--text-main); line-height:1">${match.homeScore} - ${match.awayScore}</div>
              <span style="font-size:0.6rem; text-transform:uppercase; color:var(--text-muted); font-weight:800; display:block; margin-top:0.25rem">FINAL</span>
            ` : `
              <div style="font-size:0.75rem; font-weight:800; color:var(--text-muted)">VS</div>
              <span style="font-size:0.65rem; color:var(--text-muted); display:block; margin-top:0.25rem">${match.time}</span>
            `}
          </div>

          <div style="width:40%; text-align:center">
            <div style="font-weight:800; font-size:1rem; color:var(--text-main); margin-bottom:0.25rem">${away}</div>
            <span style="font-size:0.7rem; color:var(--text-muted)">(${recordAway})</span>
          </div>
        </div>
      </div>

      <!-- Probability Bar -->
      <div style="margin-bottom:1.5rem">
        <h6 style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; margin:0 0 0.5rem 0; letter-spacing:0.5px">Probabilidades de Victoria</h6>
        ${probBarHtml}
      </div>

      <!-- Stats Grid -->
      <div>
        <h6 style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; margin:0 0 0.5rem 0; letter-spacing:0.5px">Estadísticas Comparativas</h6>
        <div style="background:rgba(255,255,255,0.01); border-radius:12px; padding:0.5rem 1rem">
          ${statsRowsHtml}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
}

function getDeterministicStats(home, away, sport) {
  function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }
  
  const hHome = hash(home);
  const hAway = hash(away);
  
  if (sport === 'beisbol') {
    const eraHome = (2.2 + (hHome % 300) / 100).toFixed(2);
    const eraAway = (2.2 + (hAway % 300) / 100).toFixed(2);
    const aveHome = "." + (230 + (hHome % 56));
    const aveAway = "." + (230 + (hAway % 56));
    const kHome = 650 + (hHome % 301);
    const kAway = 650 + (hAway % 301);
    const obpHome = "." + (300 + (hHome % 56));
    const obpAway = "." + (300 + (hAway % 56));
    const opsHome = "." + (680 + (hHome % 171));
    const opsAway = "." + (680 + (hAway % 171));
    const winsHome = 30 + (hHome % 40);
    const lossesHome = 30 + (hAway % 40);
    const winsAway = 30 + (hAway % 40);
    const lossesAway = 30 + (hHome % 40);
    return {
      recordHome: `${winsHome}-${lossesHome}`,
      recordAway: `${winsAway}-${lossesAway}`,
      details: [
        { label: "PCL (ERA)", home: eraHome, away: eraAway },
        { label: "Bateo (AVE)", home: aveHome, away: aveAway },
        { label: "Ponches (K)", home: kHome, away: kAway },
        { label: "OBP", home: obpHome, away: obpAway },
        { label: "OPS", home: opsHome, away: opsAway }
      ]
    };
  } else if (sport === 'baloncesto') {
    const ptsHome = (100 + (hHome % 25)).toFixed(1);
    const ptsAway = (100 + (hAway % 25)).toFixed(1);
    const rebHome = (38 + (hHome % 12)).toFixed(1);
    const rebAway = (38 + (hAway % 12)).toFixed(1);
    const astHome = (20 + (hHome % 10)).toFixed(1);
    const astAway = (20 + (hAway % 10)).toFixed(1);
    const winsHome = 20 + (hHome % 40);
    const lossesHome = 15 + (hAway % 30);
    const winsAway = 20 + (hAway % 40);
    const lossesAway = 15 + (hHome % 30);
    return {
      recordHome: `${winsHome}-${lossesHome}`,
      recordAway: `${winsAway}-${lossesAway}`,
      details: [
        { label: "Puntos por Juego", home: ptsHome, away: ptsAway },
        { label: "Rebotes por Juego", home: rebHome, away: rebAway },
        { label: "Asistencias por Juego", home: astHome, away: astAway }
      ]
    };
  } else {
    const goalsScoredHome = 1.0 + (hHome % 20) / 10;
    const goalsScoredAway = 1.0 + (hAway % 20) / 10;
    const possessionHome = 40 + (hHome % 21);
    const possessionAway = 100 - possessionHome;
    const winsHome = 10 + (hHome % 15);
    const drawsHome = 3 + (hAway % 8);
    const lossesHome = 5 + (hHome % 10);
    const winsAway = 10 + (hAway % 15);
    const drawsAway = 3 + (hHome % 8);
    const lossesAway = 5 + (hAway % 10);
    return {
      recordHome: `${winsHome}-${drawsHome}-${lossesHome}`,
      recordAway: `${winsAway}-${drawsAway}-${lossesAway}`,
      details: [
        { label: "Goles por Juego", home: goalsScoredHome.toFixed(2), away: goalsScoredAway.toFixed(2) },
        { label: "Posesión Promedio", home: `${possessionHome}%`, away: `${possessionAway}%` }
      ]
    };
  }
}

window.showSportsMatchDetailsModal = showSportsMatchDetailsModal;

function renderStreakHTML(streak) {
  if (!streak) return '';
  return streak.split('-').map(char => {
    let bg = "rgba(255,255,255,0.1)";
    let color = "var(--text-muted)";
    if (char === 'G' || char === 'W') { bg = "rgba(0, 224, 150, 0.15)"; color = "var(--neon-emerald)"; }
    else if (char === 'P' || char === 'L') { bg = "rgba(255, 0, 128, 0.15)"; color = "var(--neon-pink)"; }
    else if (char === 'E' || char === 'D') { bg = "rgba(255, 224, 0, 0.15)"; color = "var(--neon-gold)"; }
    return `<span style="display:inline-flex; justify-content:center; align-items:center; width:20px; height:20px; border-radius:50%; background:${bg}; color:${color}; font-size:0.7rem; font-weight:800; border:1px solid ${color}">${char}</span>`;
  }).join(' ');
}

function renderSportsHub() {
  const container = document.getElementById("sports-hub-content-container");
  if (!container) return;
  
  const lang = appState.language || 'es';
  const dict = SABI_TRANSLATIONS[lang];
  const sport = appState.activeSportsHubSport || 'futbol';
  const tab = appState.activeSportsHubTab || 'live';
  
  // Sync sport selector buttons
  document.querySelectorAll("[data-hub-sport]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.hubSport === sport);
  });
  
  // Sync football league buttons
  const activeFl = appState.activeFootballLeague || 'esp.1';
  document.querySelectorAll("[data-football-league]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.footballLeague === activeFl);
  });
  
  // Sync tab buttons
  document.querySelectorAll("[data-hub-subtab]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.hubSubtab === tab);
  });

  // Update sub-tabs text dynamically
  const gamesTabBtn = document.getElementById("sports-hub-games-tab-btn");
  if (gamesTabBtn) {
    if (sport === 'futbol') {
      gamesTabBtn.innerHTML = `📅 Próximos juegos`;
    } else {
      gamesTabBtn.innerHTML = `🏀 Juegos de hoy`;
    }
  }

  // Show/hide football leagues selector container
  const flContainer = document.getElementById("sports-football-leagues-container");
  if (flContainer) {
    flContainer.style.display = sport === 'futbol' ? 'flex' : 'none';
  }
  
  if (tab === 'live') {
    const matches = SPORTS_HUB_DATA.matches.filter(m => {
      if (m.sport !== sport) return false;
      if (sport === 'futbol') {
        return m.league === activeFl;
      }
      return true;
    });
    
    // Group matches by league/division
    const matchGroups = {};
    matches.forEach(m => {
      let lName = m.league || '';
      if (!lName) {
        if (sport === 'beisbol') lName = 'MLB';
        else if (sport === 'baloncesto') lName = 'NBA';
        else if (sport === 'nfl') lName = 'NFL';
        else if (sport === 'nhl') lName = 'NHL';
        else lName = 'General';
      }
      if (lName === 'esp.1') lName = 'Liga Española';
      if (lName === 'eng.1') lName = 'Premier League';
      if (lName === 'fra.1') lName = 'Ligue 1 de Francia';
      if (lName === 'ger.1') lName = 'Bundesliga';
      if (lName.toLowerCase() === 'nba') lName = 'NBA';
      if (lName.toLowerCase() === 'mlb') lName = 'MLB';
      if (lName.toLowerCase() === 'nfl') lName = 'NFL';
      if (lName.toLowerCase() === 'nhl') lName = 'NHL';
      
      if (!matchGroups[lName]) {
        matchGroups[lName] = [];
      }
      matchGroups[lName].push(m);
    });

    let html = `<div style="display:flex; flex-direction:column; gap:1.5rem">`;
    
    Object.keys(matchGroups).forEach(lName => {
      const groupMatches = matchGroups[lName];
      const liveMatches = groupMatches.filter(m => m.status === 'live');
      const upcomingMatches = groupMatches.filter(m => m.status === 'upcoming');
      const finishedMatches = groupMatches.filter(m => m.status === 'finished');
      
      html += `
        <div style="background:rgba(255,255,255,0.01); border:1px solid var(--glass-border); padding:1.25rem; border-radius:18px; box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2)">
          <h4 style="font-size:0.95rem; font-weight:800; color:var(--neon-cyan); margin-top:0; margin-bottom:1rem; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:8px; display:flex; align-items:center; gap:8px">
            🏆 ${lName}
          </h4>
          
          <div style="display:flex; flex-direction:column; gap:1.25rem">
            <!-- Live Matches -->
            ${liveMatches.length > 0 ? `
              <div>
                <h5 style="font-size:0.8rem; font-weight:800; text-transform:uppercase; color:var(--neon-pink); letter-spacing:1px; margin-top:0; margin-bottom:0.5rem; display:flex; align-items:center">
                  <span class="live-dot" style="margin-right:6px"></span> ${dict['sports_hub_live_now'] || 'En Vivo'}
                </h5>
                <div style="display:flex; flex-direction:column; gap:0.5rem">
                  ${liveMatches.map((m, idx) => {
                    let liveTime = "";
                    if (m.sport === 'futbol') {
                      liveTime = `<span class="ticking-minute" data-sport="${m.sport}" data-home="${m.homeTeam}" data-away="${m.awayTeam}">${m.minute}'</span>`;
                    } else if (m.sport === 'beisbol') {
                      liveTime = `${m.minute} Inning`;
                    } else if (m.sport === 'baloncesto') {
                      liveTime = `Q${m.minute} 4:32`;
                    } else if (m.sport === 'nfl') {
                      liveTime = `Q${m.minute} 8:15`;
                    } else if (m.sport === 'nhl') {
                      liveTime = `P${m.minute} 12:40`;
                    }
                    return `
                      <div class="sports-match-card live" style="cursor:pointer" onclick="window.showSportsMatchDetailsModal('${m.homeTeam}', '${m.awayTeam}')">
                        <div class="match-header">
                          <span class="live-badge"><span class="live-dot"></span> LIVE - ${liveTime}</span>
                          <span class="match-venue">${m.venue || 'Estadio Oficial'}</span>
                        </div>
                        <div class="match-teams">
                          <div class="team-row">
                            <span class="team-name">${m.homeTeam}</span>
                            <span class="team-score">${m.homeScore}</span>
                          </div>
                          <div class="team-row">
                            <span class="team-name">${m.awayTeam}</span>
                            <span class="team-score">${m.awayScore}</span>
                          </div>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            ` : ''}
            
            <!-- Upcoming Matches -->
            ${upcomingMatches.length > 0 ? `
              <div>
                <h5 style="font-size:0.8rem; font-weight:800; text-transform:uppercase; color:var(--neon-cyan); letter-spacing:1px; margin-top:0; margin-bottom:0.5rem">
                  📅 ${dict['sports_hub_upcoming'] || 'Próximos Partidos'}
                </h5>
                <div style="display:flex; flex-direction:column; gap:0.5rem">
                  ${upcomingMatches.map(m => `
                    <div class="sports-match-card upcoming" style="cursor:pointer" onclick="window.showSportsMatchDetailsModal('${m.homeTeam}', '${m.awayTeam}')">
                      <div class="match-header">
                        <span class="time-badge">${m.date || 'Hoy'} • ${m.time || '15:00'}</span>
                        <span class="match-venue">${m.venue || 'Estadio Oficial'}</span>
                      </div>
                      <div class="match-teams">
                        <div class="team-row"><span class="team-name">${m.homeTeam}</span></div>
                        <div class="team-row"><span class="team-name">${m.awayTeam}</span></div>
                      </div>
                      <div style="margin-top:0.75rem; text-align:right">
                        <button class="btn btn-xs btn-cyan" style="font-size:0.7rem; padding:3px 10px; border-radius:6px" onclick="event.stopPropagation(); window.setBettingReminder('${m.homeTeam}', '${m.awayTeam}')">
                          🔔 ${dict['sports_reminder'] || 'Recordatorio'}
                        </button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Finished Matches -->
            ${finishedMatches.length > 0 ? `
              <div>
                <h5 style="font-size:0.8rem; font-weight:800; text-transform:uppercase; color:var(--text-muted); letter-spacing:1px; margin-top:0; margin-bottom:0.5rem">
                  🏁 ${dict['sports_hub_finished'] || 'Finalizados'}
                </h5>
                <div style="display:flex; flex-direction:column; gap:0.5rem">
                  ${finishedMatches.map(m => `
                    <div class="sports-match-card finished" style="opacity:0.75; cursor:pointer" onclick="window.showSportsMatchDetailsModal('${m.homeTeam}', '${m.awayTeam}')">
                      <div class="match-header">
                        <span class="time-badge" style="background:rgba(255,255,255,0.05); color:var(--text-muted)">Finalizado</span>
                        <span class="match-venue">${m.venue || 'Estadio Oficial'}</span>
                      </div>
                      <div class="match-teams">
                        <div class="team-row">
                          <span class="team-name" style="color:var(--text-muted)">${m.homeTeam}</span>
                          <span class="team-score" style="color:var(--text-muted)">${m.homeScore}</span>
                        </div>
                        <div class="team-row">
                          <span class="team-name" style="color:var(--text-muted)">${m.awayTeam}</span>
                          <span class="team-score" style="color:var(--text-muted)">${m.awayScore}</span>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    });
    
    if (matches.length === 0) {
      html += `<p style="font-size:0.85rem; color:var(--text-muted); margin:0">${dict['sports_hub_no_live'] || 'No hay partidos en este momento.'}</p>`;
    }
    
    html += `</div>`;
    container.innerHTML = html;
  } else if (tab === 'standings') {
    let standingsData = SPORTS_HUB_DATA.standings[sport] || [];
    if (sport === 'futbol') {
      standingsData = standingsData.filter(row => row.league === activeFl);
    }
    
    // Group standingsData by parentGroup and subGroup
    const parentGroups = {};
    const MLB_DIVISIONS = {
      // Full names
      "New York Yankees": "American League - East",
      "Tampa Bay Rays": "American League - East",
      "Toronto Blue Jays": "American League - East",
      "Baltimore Orioles": "American League - East",
      "Boston Red Sox": "American League - East",
      "Cleveland Guardians": "American League - Central",
      "Chicago White Sox": "American League - Central",
      "Minnesota Twins": "American League - Central",
      "Detroit Tigers": "American League - Central",
      "Kansas City Royals": "American League - Central",
      "Seattle Mariners": "American League - West",
      "Athletics": "American League - West",
      "Texas Rangers": "American League - West",
      "Houston Astros": "American League - West",
      "Los Angeles Angels": "American League - West",
      "Atlanta Braves": "National League - East",
      "Philadelphia Phillies": "National League - East",
      "Miami Marlins": "National League - East",
      "Washington Nationals": "National League - East",
      "New York Mets": "National League - East",
      "Milwaukee Brewers": "National League - Central",
      "St. Louis Cardinals": "National League - Central",
      "Chicago Cubs": "National League - Central",
      "Pittsburgh Pirates": "National League - Central",
      "Cincinnati Reds": "National League - Central",
      "Los Angeles Dodgers": "National League - West",
      "San Diego Padres": "National League - West",
      "Arizona Diamondbacks": "National League - West",
      "San Francisco Giants": "National League - West",
      "Colorado Rockies": "National League - West",

      // Abbreviations & Short Names
      "NY Yankees": "American League - East",
      "Yankees": "American League - East",
      "Red Sox": "American League - East",
      "Rays": "American League - East",
      "Orioles": "American League - East",
      "Blue Jays": "American League - East",
      "Guardians": "American League - Central",
      "White Sox": "American League - Central",
      "Twins": "American League - Central",
      "Tigers": "American League - Central",
      "Royals": "American League - Central",
      "Mariners": "American League - West",
      "Rangers": "American League - West",
      "Astros": "American League - West",
      "Angels": "American League - West",
      "LA Angels": "American League - West",
      "Braves": "National League - East",
      "Phillies": "National League - East",
      "Marlins": "National League - East",
      "Nationals": "National League - East",
      "Mets": "National League - East",
      "NY Mets": "National League - East",
      "Brewers": "National League - Central",
      "Cardinals": "National League - Central",
      "Cubs": "National League - Central",
      "Pirates": "National League - Central",
      "Reds": "National League - Central",
      "Dodgers": "National League - West",
      "LA Dodgers": "National League - West",
      "Padres": "National League - West",
      "Diamondbacks": "National League - West",
      "Giants": "National League - West",
      "SF Giants": "National League - West",
      "Rockies": "National League - West"
    };

    const NBA_DIVISIONS = {
      // Full names
      "Boston Celtics": "Eastern Conference - Atlantic",
      "Brooklyn Nets": "Eastern Conference - Atlantic",
      "New York Knicks": "Eastern Conference - Atlantic",
      "Philadelphia 76ers": "Eastern Conference - Atlantic",
      "Toronto Raptors": "Eastern Conference - Atlantic",
      "Chicago Bulls": "Eastern Conference - Central",
      "Cleveland Cavaliers": "Eastern Conference - Central",
      "Detroit Pistons": "Eastern Conference - Central",
      "Indiana Pacers": "Eastern Conference - Central",
      "Milwaukee Bucks": "Eastern Conference - Central",
      "Atlanta Hawks": "Eastern Conference - Southeast",
      "Charlotte Hornets": "Eastern Conference - Southeast",
      "Miami Heat": "Eastern Conference - Southeast",
      "Orlando Magic": "Eastern Conference - Southeast",
      "Washington Wizards": "Eastern Conference - Southeast",
      "Denver Nuggets": "Western Conference - Northwest",
      "Minnesota Timberwolves": "Western Conference - Northwest",
      "Oklahoma City Thunder": "Western Conference - Northwest",
      "Portland Trail Blazers": "Western Conference - Northwest",
      "Utah Jazz": "Western Conference - Northwest",
      "Golden State Warriors": "Western Conference - Pacific",
      "LA Clippers": "Western Conference - Pacific",
      "Los Angeles Clippers": "Western Conference - Pacific",
      "LA Lakers": "Western Conference - Pacific",
      "Los Angeles Lakers": "Western Conference - Pacific",
      "Phoenix Suns": "Western Conference - Pacific",
      "Sacramento Kings": "Western Conference - Pacific",
      "Dallas Mavericks": "Western Conference - Southwest",
      "Houston Rockets": "Western Conference - Southwest",
      "Memphis Grizzlies": "Western Conference - Southwest",
      "New Orleans Pelicans": "Western Conference - Southwest",
      "San Antonio Spurs": "Western Conference - Southwest",

      // Abbreviations & Short Names
      "Celtics": "Eastern Conference - Atlantic",
      "Nets": "Eastern Conference - Atlantic",
      "BKN Nets": "Eastern Conference - Atlantic",
      "Knicks": "Eastern Conference - Atlantic",
      "NY Knicks": "Eastern Conference - Atlantic",
      "76ers": "Eastern Conference - Atlantic",
      "PHI 76ers": "Eastern Conference - Atlantic",
      "Raptors": "Eastern Conference - Atlantic",
      "Bulls": "Eastern Conference - Central",
      "CHI Bulls": "Eastern Conference - Central",
      "Cavaliers": "Eastern Conference - Central",
      "CLE Cavaliers": "Eastern Conference - Central",
      "Pistons": "Eastern Conference - Central",
      "DET Pistons": "Eastern Conference - Central",
      "Pacers": "Eastern Conference - Central",
      "IND Pacers": "Eastern Conference - Central",
      "Bucks": "Eastern Conference - Central",
      "MIL Bucks": "Eastern Conference - Central",
      "Hawks": "Eastern Conference - Southeast",
      "ATL Hawks": "Eastern Conference - Southeast",
      "Hornets": "Eastern Conference - Southeast",
      "CHA Hornets": "Eastern Conference - Southeast",
      "Heat": "Eastern Conference - Southeast",
      "MIA Heat": "Eastern Conference - Southeast",
      "Magic": "Eastern Conference - Southeast",
      "ORL Magic": "Eastern Conference - Southeast",
      "Wizards": "Eastern Conference - Southeast",
      "WAS Wizards": "Eastern Conference - Southeast",
      "Nuggets": "Western Conference - Northwest",
      "DEN Nuggets": "Western Conference - Northwest",
      "Timberwolves": "Western Conference - Northwest",
      "MIN Timberwolves": "Western Conference - Northwest",
      "Thunder": "Western Conference - Northwest",
      "OKC Thunder": "Western Conference - Northwest",
      "Trail Blazers": "Western Conference - Northwest",
      "POR Trail Blazers": "Western Conference - Northwest",
      "Jazz": "Western Conference - Northwest",
      "UTA Jazz": "Western Conference - Northwest",
      "Warriors": "Western Conference - Pacific",
      "GS Warriors": "Western Conference - Pacific",
      "Clippers": "Western Conference - Pacific",
      "Lakers": "Western Conference - Pacific",
      "Suns": "Western Conference - Pacific",
      "PHX Suns": "Western Conference - Pacific",
      "Kings": "Western Conference - Pacific",
      "SAC Kings": "Western Conference - Pacific",
      "Mavericks": "Western Conference - Southwest",
      "DAL Mavericks": "Western Conference - Southwest",
      "Rockets": "Western Conference - Southwest",
      "HOU Rockets": "Western Conference - Southwest",
      "Grizzlies": "Western Conference - Southwest",
      "MEM Grizzlies": "Western Conference - Southwest",
      "Pelicans": "Western Conference - Southwest",
      "NOP Pelicans": "Western Conference - Southwest",
      "Spurs": "Western Conference - Southwest",
      "SAS Spurs": "Western Conference - Southwest"
    };

    const NFL_DIVISIONS = {
      "Buffalo Bills": "AFC - East", "Bills": "AFC - East",
      "Miami Dolphins": "AFC - East", "Dolphins": "AFC - East",
      "New York Jets": "AFC - East", "NY Jets": "AFC - East", "Jets": "AFC - East",
      "New England Patriots": "AFC - East", "Patriots": "AFC - East",
      "Baltimore Ravens": "AFC - North", "Ravens": "AFC - North",
      "Cleveland Browns": "AFC - North", "Browns": "AFC - North",
      "Pittsburgh Steelers": "AFC - North", "Steelers": "AFC - North",
      "Cincinnati Bengals": "AFC - North", "Bengals": "AFC - North",
      "Houston Texans": "AFC - South", "Texans": "AFC - South",
      "Indianapolis Colts": "AFC - South", "Colts": "AFC - South",
      "Jacksonville Jaguars": "AFC - South", "Jaguars": "AFC - South",
      "Tennessee Titans": "AFC - South", "Titans": "AFC - South",
      "Kansas City Chiefs": "AFC - West", "Chiefs": "AFC - West",
      "Las Vegas Raiders": "AFC - West", "Raiders": "AFC - West",
      "Denver Broncos": "AFC - West", "Broncos": "AFC - West",
      "Los Angeles Chargers": "AFC - West", "LA Chargers": "AFC - West", "Chargers": "AFC - West",
      "Dallas Cowboys": "NFC - East", "Cowboys": "NFC - East",
      "Philadelphia Eagles": "NFC - East", "Eagles": "NFC - East",
      "New York Giants": "NFC - East", "NY Giants": "NFC - East", "Giants": "NFC - East",
      "Washington Commanders": "NFC - East", "Commanders": "NFC - East",
      "Detroit Lions": "NFC - North", "Lions": "NFC - North",
      "Green Bay Packers": "NFC - North", "Packers": "NFC - North",
      "Minnesota Vikings": "NFC - North", "Vikings": "NFC - North",
      "Chicago Bears": "NFC - North", "Bears": "NFC - North",
      "Tampa Bay Buccaneers": "NFC - South", "Buccaneers": "NFC - South",
      "New Orleans Saints": "NFC - South", "Saints": "NFC - South",
      "Atlanta Falcons": "NFC - South", "Falcons": "NFC - South",
      "Carolina Panthers": "NFC - South", "Panthers": "NFC - South",
      "San Francisco 49ers": "NFC - West", "49ers": "NFC - West",
      "Los Angeles Rams": "NFC - West", "LA Rams": "NFC - West", "Rams": "NFC - West",
      "Seattle Seahawks": "NFC - West", "Seahawks": "NFC - West",
      "Arizona Cardinals": "NFC - West", "Cardinals": "NFC - West"
    };

    const NHL_DIVISIONS = {
      "Boston Bruins": "Eastern Conference - Atlantic", "Bruins": "Eastern Conference - Atlantic",
      "Buffalo Sabres": "Eastern Conference - Atlantic", "Sabres": "Eastern Conference - Atlantic",
      "Detroit Red Wings": "Eastern Conference - Atlantic", "Red Wings": "Eastern Conference - Atlantic",
      "Florida Panthers": "Eastern Conference - Atlantic", "Panthers": "Eastern Conference - Atlantic",
      "Montreal Canadiens": "Eastern Conference - Atlantic", "Canadiens": "Eastern Conference - Atlantic",
      "Ottawa Senators": "Eastern Conference - Atlantic", "Senators": "Eastern Conference - Atlantic",
      "Tampa Bay Lightning": "Eastern Conference - Atlantic", "Lightning": "Eastern Conference - Atlantic",
      "Toronto Maple Leafs": "Eastern Conference - Atlantic", "Maple Leafs": "Eastern Conference - Atlantic",
      "Carolina Hurricanes": "Eastern Conference - Metropolitan", "Hurricanes": "Eastern Conference - Metropolitan",
      "Columbus Blue Jackets": "Eastern Conference - Metropolitan", "Blue Jackets": "Eastern Conference - Metropolitan",
      "New Jersey Devils": "Eastern Conference - Metropolitan", "Devils": "Eastern Conference - Metropolitan",
      "NY Islanders": "Eastern Conference - Metropolitan", "Islanders": "Eastern Conference - Metropolitan",
      "NY Rangers": "Eastern Conference - Metropolitan", "Rangers": "Eastern Conference - Metropolitan",
      "Philadelphia Flyers": "Eastern Conference - Metropolitan", "Flyers": "Eastern Conference - Metropolitan",
      "Pittsburgh Penguins": "Eastern Conference - Metropolitan", "Penguins": "Eastern Conference - Metropolitan",
      "Washington Capitals": "Eastern Conference - Metropolitan", "Capitals": "Eastern Conference - Metropolitan",
      "Chicago Blackhawks": "Western Conference - Central", "Blackhawks": "Western Conference - Central",
      "Colorado Avalanche": "Western Conference - Central", "Avalanche": "Western Conference - Central",
      "Dallas Stars": "Western Conference - Central", "Stars": "Western Conference - Central",
      "Minnesota Wild": "Western Conference - Central", "Wild": "Western Conference - Central",
      "Nashville Predators": "Western Conference - Central", "Predators": "Western Conference - Central",
      "St. Louis Blues": "Western Conference - Central", "Blues": "Western Conference - Central",
      "Winnipeg Jets": "Western Conference - Central",
      "Anaheim Ducks": "Western Conference - Pacific", "Ducks": "Western Conference - Pacific",
      "Calgary Flames": "Western Conference - Pacific", "Flames": "Western Conference - Pacific",
      "Edmonton Oilers": "Western Conference - Pacific", "Oilers": "Western Conference - Pacific",
      "Los Angeles Kings": "Western Conference - Pacific", "LA Kings": "Western Conference - Pacific", "Kings": "Western Conference - Pacific",
      "San Jose Sharks": "Western Conference - Pacific", "Sharks": "Western Conference - Pacific",
      "Seattle Kraken": "Western Conference - Pacific", "Kraken": "Western Conference - Pacific",
      "Vancouver Canucks": "Western Conference - Pacific", "Canucks": "Western Conference - Pacific",
      "Vegas Golden Knights": "Western Conference - Pacific", "Golden Knights": "Western Conference - Pacific"
    };

    standingsData.forEach(row => {
      let gName = "";
      if (sport === 'beisbol' && MLB_DIVISIONS[row.team]) {
        gName = MLB_DIVISIONS[row.team];
      } else if (sport === 'baloncesto' && NBA_DIVISIONS[row.team]) {
        gName = NBA_DIVISIONS[row.team];
      } else if (sport === 'nfl' && NFL_DIVISIONS[row.team]) {
        gName = NFL_DIVISIONS[row.team];
      } else if (sport === 'nhl' && NHL_DIVISIONS[row.team]) {
        gName = NHL_DIVISIONS[row.team];
      } else {
        gName = row.group_name || row.league || 'Clasificación';
      }
      
      // Standardize league names
      if (gName === 'esp.1' || gName.toLowerCase() === 'la liga') gName = 'Liga Española';
      if (gName === 'eng.1' || gName.toLowerCase() === 'premier league') gName = 'Premier League';
      if (gName === 'fra.1' || gName.toLowerCase() === 'ligue 1' || gName.toLowerCase() === 'ligue 1 de francia') gName = 'Ligue 1 de Francia';
      if (gName === 'ger.1' || gName.toLowerCase() === 'bundesliga') gName = 'Bundesliga';
      if (gName === 'aruba.local' || gName.toLowerCase() === 'aruba division di honor') gName = 'Aruba Division di Honor';
      if (gName.toLowerCase() === 'nba') gName = 'NBA';
      if (gName.toLowerCase() === 'mlb') gName = 'MLB';
      if (gName.toLowerCase() === 'nfl') gName = 'NFL';
      if (gName.toLowerCase() === 'nhl') gName = 'NHL';
      
      let parentGroup = gName;
      let subGroup = "";
      if (gName.includes(" - ")) {
        const parts = gName.split(" - ");
        parentGroup = parts[0];
        subGroup = parts[1];
      }
      
      if (!parentGroups[parentGroup]) {
        parentGroups[parentGroup] = {};
      }
      if (!parentGroups[parentGroup][subGroup]) {
        parentGroups[parentGroup][subGroup] = [];
      }
      parentGroups[parentGroup][subGroup].push(row);
    });

    let tableHtml = `<div style="display:flex; flex-direction:column; gap:2.5rem">`;
    
    // Sort Parent Groups
    let parentOrder = [];
    let subOrder = [];
    if (sport === 'beisbol') {
      parentOrder = ["American League", "National League"];
      subOrder = ["East", "Central", "West"];
    } else if (sport === 'baloncesto') {
      parentOrder = ["Eastern Conference", "Western Conference"];
      subOrder = ["Atlantic", "Central", "Southeast", "Northwest", "Pacific", "Southwest"];
    } else if (sport === 'nfl') {
      parentOrder = ["AFC", "NFC"];
      subOrder = ["East", "North", "South", "West"];
    } else if (sport === 'nhl') {
      parentOrder = ["Eastern Conference", "Western Conference"];
      subOrder = ["Atlantic", "Metropolitan", "Central", "Pacific"];
    }
    
    const parentKeys = Object.keys(parentGroups);
    if (parentOrder.length > 0) {
      parentKeys.sort((a, b) => {
        const idxA = parentOrder.indexOf(a);
        const idxB = parentOrder.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
      });
    }
    
    parentKeys.forEach(parentGroup => {
      const subGroupsObj = parentGroups[parentGroup];
      const subKeys = Object.keys(subGroupsObj);
      
      if (subOrder.length > 0) {
        subKeys.sort((a, b) => {
          const idxA = subOrder.indexOf(a);
          const idxB = subOrder.indexOf(b);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a.localeCompare(b);
        });
      }
      
      tableHtml += `
        <div style="background:rgba(255,255,255,0.015); border:1px solid var(--glass-border); padding:1.5rem; border-radius:18px; box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2)">
          <h3 style="font-size:1.1rem; font-weight:900; color:var(--text-main); margin-top:0; margin-bottom:1.5rem; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px; display:flex; align-items:center; gap:8px">
            🏆 ${parentGroup}
          </h3>
          <div style="display:flex; flex-direction:column; gap:2rem">
      `;
      
      subKeys.forEach(subGroup => {
        const groupData = subGroupsObj[subGroup];
        
        // Sort teams within division/subgroup
        groupData.sort((a, b) => {
          if (a.rank !== b.rank) {
            return a.rank - b.rank;
          }
          if (a.pct && b.pct) {
            return parseFloat(b.pct) - parseFloat(a.pct);
          }
          if (a.points !== undefined && b.points !== undefined) {
            return b.points - a.points;
          }
          return b.won - a.won;
        });
        
        const subGroupHeader = subGroup ? subGroup : "";
        
        tableHtml += `
          <div>
            ${subGroupHeader ? `
              <h4 style="font-size:0.85rem; font-weight:800; color:var(--neon-cyan); margin-top:0; margin-bottom:0.75rem; text-transform:uppercase; letter-spacing:1px; border-left:3px solid var(--neon-cyan); padding-left:8px">
                ${subGroupHeader}
              </h4>
            ` : ''}
            <div style="overflow-x:auto; width:100%">
              <table class="sports-table" style="width:100%; border-collapse:collapse; font-size:0.85rem; text-align:left; background:rgba(255,255,255,0.005); border:1px solid rgba(255,255,255,0.05); border-radius:10px; overflow:hidden">
                <thead>
                  <tr style="border-bottom: 2px solid rgba(255,255,255,0.08); color: var(--text-main); background:rgba(255,255,255,0.02)">
                    <th style="padding: 10px; width:40px">${dict['sports_hub_rank'] || 'Pos'}</th>
                    <th style="padding: 10px">${dict['sports_hub_team'] || 'Equipo'}</th>
                    <th style="padding: 10px; text-align:center; width:40px">${dict['sports_hub_played'] || 'PJ'}</th>
                    <th style="padding: 10px; text-align:center; width:40px">${dict['sports_hub_won'] || 'G'}</th>
                    ${(sport === 'futbol' || sport === 'local' || sport === 'nhl') ? `<th style="padding: 10px; text-align:center; width:40px">${dict['sports_hub_drawn'] || 'E'}</th>` : ''}
                    <th style="padding: 10px; text-align:center; width:40px">${dict['sports_hub_lost'] || 'P'}</th>
                    ${(sport === 'futbol' || sport === 'local' || sport === 'nhl') ? `<th style="padding: 10px; text-align:center; width:50px; color: var(--neon-gold)">${dict['sports_hub_points'] || 'Pts'}</th>` : `<th style="padding: 10px; text-align:center; width:60px; color: var(--neon-gold)">${dict['sports_hub_pct'] || '%'}</th>`}
                  </tr>
                </thead>
                <tbody>
                  ${groupData.map((row, idx) => `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.04)">
                      <td style="padding: 10px; font-weight:800">${idx + 1}</td>
                      <td style="padding: 10px; font-weight:700; color:var(--text-main)">${row.team}</td>
                      <td style="padding: 10px; text-align:center">${row.played}</td>
                      <td style="padding: 10px; text-align:center; color:var(--neon-emerald)">${row.won}</td>
                      ${(sport === 'futbol' || sport === 'local' || sport === 'nhl') ? `<td style="padding: 10px; text-align:center">${row.drawn || 0}</td>` : ''}
                      <td style="padding: 10px; text-align:center; color:var(--neon-pink)">${row.lost}</td>
                      ${(sport === 'futbol' || sport === 'local' || sport === 'nhl') ? `<td style="padding: 10px; text-align:center; font-weight:800; color:var(--neon-gold)">${row.points}</td>` : `<td style="padding: 10px; text-align:center; font-weight:800; color:var(--neon-gold)">${row.pct}</td>`}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
      });
      
      tableHtml += `
          </div>
        </div>
      `;
    });
    
    tableHtml += `</div>`;
    container.innerHTML = tableHtml;
  } else if (tab === 'betting') {
    const preds = SPORTS_HUB_DATA.predictions.filter(p => p.sport === sport);
    let html = `
      <div style="display:flex; flex-direction:column; gap:1rem">
        ${preds.map(p => {
          const homeProb = p.winProbHome;
          const drawProb = p.winProbDraw || 0;
          const awayProb = p.winProbAway;
          const bestBet = dict[p.bestBetKey] || p.bestBetKey;
          const aiTip = dict[p.aiTipKey] || p.aiTipKey;
          
          return `
            <div style="background:rgba(255,255,255,0.015); border:1px solid var(--glass-border); padding:1.25rem; border-radius:18px">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem">
                <span style="font-weight:800; font-size:1.05rem; color:var(--text-main)">⚔️ ${p.homeTeam} vs ${p.awayTeam}</span>
                <span class="odds-badge" style="font-size:0.72rem; padding:2px 8px; border-radius:20px; background:rgba(255, 224, 0, 0.12)">${dict['sports_hub_odds'] || 'Cuotas'}</span>
              </div>
              
              <!-- Probability Bars -->
              <div style="margin-bottom:1rem">
                <div style="display:flex; justify-content:space-between; font-size:0.72rem; color:var(--text-muted); margin-bottom:0.25rem">
                  <span>${p.homeTeam} (${homeProb}%)</span>
                  ${p.winProbDraw ? `<span>${dict['sports_hub_draw'] || 'Empate'} (${drawProb}%)</span>` : ''}
                  <span>${p.awayTeam} (${awayProb}%)</span>
                </div>
                <div style="display:flex; height:6px; background:rgba(255,255,255,0.05); border-radius:10px; overflow:hidden">
                  <div style="width:${homeProb}%; background:var(--neon-cyan); box-shadow:0 0 5px var(--neon-cyan)"></div>
                  ${p.winProbDraw ? `<div style="width:${drawProb}%; background:var(--neon-gold); box-shadow:0 0 5px var(--neon-gold)"></div>` : ''}
                  <div style="width:${awayProb}%; background:var(--neon-pink); box-shadow:0 0 5px var(--neon-pink)"></div>
                </div>
              </div>
              
              <!-- Head-to-Head & Streaks -->
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; font-size:0.8rem; margin-bottom:1rem; border-top:1px dashed rgba(255,255,255,0.06); padding-top:0.75rem">
                <div>
                  <div style="font-weight:700; color:var(--text-muted); margin-bottom:0.35rem">${dict['sports_hub_streak'] || 'Racha'}</div>
                  <div style="display:flex; flex-direction:column; gap:0.25rem">
                    <div style="display:flex; align-items:center; gap:0.35rem">
                      <span style="display:inline-block; width:45px; overflow:hidden; text-overflow:ellipsis">${p.homeTeam}:</span>
                      ${renderStreakHTML(p.streakHome)}
                    </div>
                    <div style="display:flex; align-items:center; gap:0.35rem">
                      <span style="display:inline-block; width:45px; overflow:hidden; text-overflow:ellipsis">${p.awayTeam}:</span>
                      ${renderStreakHTML(p.streakAway)}
                    </div>
                  </div>
                </div>
                <div>
                  <div style="font-weight:700; color:var(--text-muted); margin-bottom:0.25rem">${dict['sports_hub_h2h'] || 'Historial H2H'}</div>
                  <div style="color:var(--text-main); font-size:0.75rem; line-height:1.4">${p.h2h}</div>
                </div>
              </div>
              
              <!-- AI tip & Best Bet box -->
              <div style="background:rgba(0, 243, 255, 0.02); border:1px solid rgba(0, 243, 255, 0.08); padding:0.85rem; border-radius:12px; font-size:0.8rem; display:flex; flex-direction:column; gap:0.5rem">
                <div>
                  <strong style="color:var(--neon-cyan)">💡 ${dict['sports_hub_best_bet'] || 'Mejor Apuesta'}:</strong>
                  <span style="color:var(--text-main); font-weight:700">${bestBet}</span>
                  <span style="color:var(--neon-gold); font-weight:800; margin-left:6px">${p.oddsHome} (Home) ${p.winProbDraw ? `/ ${p.oddsDraw} (X)` : ''} / ${p.oddsAway} (Away)</span>
                </div>
                <div>
                  <strong style="color:var(--neon-cyan)">⚡ ${dict['sports_hub_totals_prediction'] || 'Predicción de Totales'}:</strong>
                  <span style="color:var(--text-main)">${p.totalsPredict}</span>
                </div>
                <div style="border-top:1px dashed rgba(255,255,255,0.05); padding-top:0.4rem; color:var(--text-muted); line-height:1.4; font-size:0.75rem">
                  <strong>🤖 ${dict['sports_hub_ai_tip'] || 'Análisis de la IA'}:</strong> ${aiTip}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    container.innerHTML = html;
  }
}

// Sports & Facilities Reservation contact links
function renderSportsContent() {
  const lang = appState.language || 'es';
  const dict = SABI_TRANSLATIONS[lang];

  const disciplineLabel = dict['sports_discipline'] || 'Disciplina';
  const targetLabel = dict['sports_target'] || 'Público';
  const btnEnroll = dict['sports_btn_enroll'] || 'Inscribirse';
  const btnMap = dict['btn_map'] || 'Mapa';

  const clubsCon = document.getElementById("sports-clubs-container");
  if (clubsCon) {
    clubsCon.innerHTML = SABI_DATA.sports.clubs.map(c => {
      const translatedDiscipline = dict[`sports_disc_${c.id}`] || c.discipline;
      const translatedTarget = dict[`sports_tgt_${c.id}`] || c.target;
      return `
        <div class="sports-card linear-service-card">
          <div class="service-logo-box">${c.icon}</div>
          <div class="service-title">${c.name}</div>
          <div class="service-desc">
            <div>${disciplineLabel}: <strong>${translatedDiscipline}</strong></div>
            <div>${targetLabel}: <strong>${translatedTarget}</strong></div>
          </div>
          <div class="service-phone">${c.contact}</div>
          <div class="service-buttons-row">
            <a href="tel:${c.contact}" class="btn-sm btn-cyan" onclick="SoundEffects.playClick()">📞 ${btnEnroll}</a>
            <a href="${c.maps}" target="_blank" class="btn-sm btn-map">📍 ${btnMap}</a>
          </div>
        </div>
      `;
    }).join('');
  }

  const locationLabel = dict['sports_location'] || 'Ubicación';
  const typeLabel = dict['sports_type'] || 'Canchas';
  const btnReserve = dict['sports_btn_reserve'] || 'Reservar';

  const facilitiesCon = document.getElementById("sports-facilities-container");
  if (facilitiesCon) {
    facilitiesCon.innerHTML = SABI_DATA.sports.facilities.map(f => {
      const translatedLocation = dict[`sports_loc_${f.id}`] || f.location;
      const translatedType = dict[`sports_type_${f.id}`] || f.type;
      return `
        <div class="sports-card linear-service-card">
          <div class="service-logo-box">${f.icon}</div>
          <div class="service-title">${f.name}</div>
          <div class="service-desc">
            <div>${locationLabel}: <strong>${translatedLocation}</strong></div>
            <div>${typeLabel}: <strong>${translatedType}</strong></div>
          </div>
          <div class="service-phone">${f.contact}</div>
          <div class="service-buttons-row">
            <a href="tel:${f.contact}" class="btn-sm btn-cyan" onclick="SoundEffects.playClick()">📞 ${btnReserve}</a>
            <a href="${f.maps}" target="_blank" class="btn-sm btn-map">📍 ${btnMap}</a>
          </div>
        </div>
      `;
    }).join('');
  }

  const difficultyLabel = dict['sports_difficulty'] || 'Dificultad';
  const lengthLabel = dict['sports_length'] || 'Longitud';

  const trailsCon = document.getElementById("sports-trails-container");
  if (trailsCon) {
    trailsCon.innerHTML = SABI_DATA.sports.trails.map(t => {
      const translatedName = dict[`sports_trail_name_${t.id}`] || t.name;
      const translatedDifficulty = dict[`sports_trail_diff_${t.difficulty.toLowerCase()}`] || t.difficulty;
      const translatedDesc = dict[`sports_trail_desc_${t.id}`] || t.desc;
      return `
        <div class="league-box" style="margin-bottom:0.75rem">
          <div style="font-weight:700; color:var(--neon-cyan)">🚴 ${translatedName}</div>
          <div style="font-size:0.8rem; color:var(--neon-gold); margin-top:0.15rem">${difficultyLabel}: ${translatedDifficulty} | ${lengthLabel}: ${t.length}</div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.35rem; line-height:1.4">${translatedDesc}</div>
        </div>
      `;
    }).join('');
  }
  renderSportsHub();
}

// ==================== TAB 3: COMUNIDAD (Verified Classifieds Marketplace) ====================

function renderClassifieds() {
  const container = document.getElementById("marketplace-container");
  if (!container) return;

  const cat = document.getElementById("market-filter-category").value;
  const query = document.getElementById("market-search-input").value.toLowerCase().trim();

  let list = [...appState.marketplaceAds];

  // Filtering
  if (cat !== 'all') list = list.filter(ad => ad.category === cat);
  if (query !== "") {
    list = list.filter(ad => 
      ad.title.toLowerCase().includes(query) || 
      ad.desc.toLowerCase().includes(query) || 
      ad.user.toLowerCase().includes(query)
    );
  }

  // Sort: Sponsored items (with positive balance bids) first, then by date descending
  list.sort((a,b) => {
    let aSpon = a.sponsored && appState.b2bWallet > 0 ? 1 : 0;
    let bSpon = b.sponsored && appState.b2bWallet > 0 ? 1 : 0;
    
    if (aSpon !== bSpon) {
      return bSpon - aSpon; // sponsored first
    }
    // secondary sort by bid cost
    if (a.sponsored && b.sponsored) {
      return (b.cpcBid || 0) - (a.cpcBid || 0);
    }
    return new Date(b.date) - new Date(a.date);
  });

  // Track and increment impressions for visible sponsored ads
  let sponsoredShown = list.filter(ad => ad.sponsored && appState.b2bWallet > 0).length;
  if (sponsoredShown > 0) {
    appState.b2bImpressions += sponsoredShown;
    localStorage.setItem('sabi_b2b_impressions', appState.b2bImpressions.toString());
    updateB2BStatsDisplay();
  }

  const lang = appState.language || 'es';
  const dict = SABI_TRANSLATIONS[lang];

  if (list.length === 0) {
    const emptyMarketText = {
      es: "No se encontraron anuncios clasificados.",
      en: "No classified ads found.",
      nl: "Geen advertenties gevonden.",
      pap: "No a haya ningun aviso clasifica."
    };
    container.innerHTML = `<div style="grid-column:1/-1; padding:3rem; text-align:center; color:var(--text-muted)">${emptyMarketText[lang]}</div>`;
    return;
  }

  container.innerHTML = list.map(ad => {
    let isSpon = ad.sponsored && appState.b2bWallet > 0;
    let badgeHtml = isSpon ? `<span class="market-sponsored-badge">${lang === 'es' ? 'Patrocinado' : (lang === 'pap' ? 'Patrosina' : (lang === 'nl' ? 'Gesponsord' : 'Sponsored'))}</span>` : "";
    let priceLabel = ad.category === 'trabajo' 
      ? (lang === 'es' ? 'Salario: Afl. ' : (lang === 'pap' ? 'Salario: Afl. ' : (lang === 'nl' ? 'Salaris: Afl. ' : 'Salary: Afl. ')))
      : (lang === 'es' ? 'Precio: Afl. ' : (lang === 'pap' ? 'Precio: Afl. ' : (lang === 'nl' ? 'Prijs: Afl. ' : 'Price: Afl. ')));
    
    // Default images depending on category
    let defaultImg = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80"; // shop
    if (ad.category === 'trabajo') defaultImg = "https://images.unsplash.com/photo-1521737711867-e3b904737d88?auto=format&fit=crop&w=400&q=80";
    else if (ad.category === 'alquileres') defaultImg = "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=400&q=80";
    else if (ad.category === 'vehiculos') defaultImg = "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80";
    else if (ad.category === 'ropa') defaultImg = "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80";
    else if (ad.category === 'electronica') defaultImg = "https://images.unsplash.com/photo-1468436139062-f60a71c5c892?auto=format&fit=crop&w=400&q=80";
    else if (ad.category === 'joyeria') defaultImg = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=400&q=80";
    else if (ad.category === 'hogar') defaultImg = "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80";
    else if (ad.category === 'servicios_hogar') defaultImg = "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80";
    else if (ad.category === 'servicios_profesionales') defaultImg = "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80";
    else if (ad.category === 'servicios_salud') defaultImg = "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=400&q=80";
    else if (ad.category === 'servicios_tecnicos') defaultImg = "https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=400&q=80";
    else if (ad.category === 'servicios_transporte') defaultImg = "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=400&q=80";
    else if (ad.category === 'servicios_eventos') defaultImg = "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=400&q=80";
    
    let adImg = ad.image || defaultImg;
    
    const physicalCats = ['vehiculos', 'ropa', 'electronica', 'joyeria', 'hogar'];
    const deliveryAvailText = {
      es: "Sabí-Delivery Disponible",
      en: "Sabí-Delivery Available",
      nl: "Sabí-Delivery Beschikbaar",
      pap: "Sabí-Delivery Disponibel"
    };
    
    return `
      <div class="market-card ${isSpon ? 'sponsored' : ''}" onclick="handleAdClick('${ad.id}')">
        ${badgeHtml}
        <img src="${adImg}" alt="${ad.title}" class="market-card-img" onerror="this.src='${defaultImg}'">
        <div class="market-card-body">
          <div class="market-card-title">${ad.title}</div>
          <div class="market-card-price">${priceLabel}${ad.price.toLocaleString()} AWG</div>
          <div class="market-card-desc">${ad.desc}</div>
          ${physicalCats.includes(ad.category) && ad.deliveryEnabled ? `
            <div style="font-size:0.75rem; color:var(--neon-emerald); font-weight:600; margin-top:0.4rem; display:flex; align-items:center; gap:0.25rem">
              <span>📦</span> ${deliveryAvailText[lang]}
            </div>
          ` : ''}
          ${physicalCats.includes(ad.category) ? `
            <button class="btn btn-sm btn-cyan btn-full" style="margin-top: 0.75rem; background: var(--neon-cyan); color: #000; font-weight: bold;" onclick="event.stopPropagation(); window.openCheckoutModal('${ad.id}');">
              ${dict.btn_buy_now || 'Comprar'}
            </button>
          ` : ''}
        </div>
        <div class="market-card-footer">
          <span>${lang === 'es' ? 'Por' : (lang === 'pap' ? 'Pa' : (lang === 'nl' ? 'Door' : 'By'))}: <strong>${ad.user}</strong> • 📞 <strong>${ad.contact}</strong></span>
        </div>
      </div>
    `;
  }).join('');
}

function filterMarketplace() {
  renderClassifieds();
}

function handleAdClick(id) {
  const ad = appState.marketplaceAds.find(a => a.id === id);
  if (!ad) return;

  // If sponsored, simulated click deducts CPC from B2B wallet
  if (ad.sponsored && appState.b2bWallet > 0) {
    SoundEffects.playClick();
    let bid = ad.cpcBid || 1.00;
    if (appState.b2bWallet >= bid) {
      appState.b2bWallet -= bid;
    } else {
      appState.b2bWallet = 0;
    }
    
    appState.b2bClicks += 1;
    
    // Save state
    localStorage.setItem('sabi_b2b_wallet', appState.b2bWallet.toString());
    localStorage.setItem('sabi_b2b_clicks', appState.b2bClicks.toString());
    
    showToast("Clic Patrocinado Registrado", `Has hecho clic en un anuncio patrocinado. Se descontó $${bid.toFixed(2)} USD del presupuesto del anunciante.`);
    
    updateB2BStatsDisplay();
    // Refresh list since sponsored flag might disable if wallet hits 0
    renderClassifieds();
  }
}

// B2B Campaign promotion controls (compatibility no-ops)
function populateAdSelector() {}
function promoteMarketplaceAd() {}

// Classified ad posting
function handlePostAdSubmit() {
  const title = document.getElementById("ad-form-title").value.trim();
  const category = document.getElementById("ad-form-category").value;
  const price = parseFloat(document.getElementById("ad-form-price").value);
  const desc = document.getElementById("ad-form-desc").value.trim();
  const contact = document.getElementById("ad-form-contact").value.trim();
  
  const imagePreset = document.getElementById("ad-form-image-preset").value;
  const customImageUrl = document.getElementById("ad-form-image-url").value.trim();
  
  const sponsoredVal = document.getElementById("ad-form-sponsored").value;
  const isSponsored = sponsoredVal === "sponsored";
  const cpcBid = isSponsored ? parseFloat(document.getElementById("ad-form-cpc").value) : 0;

  if (!title || isNaN(price) || price <= 0 || !desc || !contact) {
    showToast("Error", "Por favor completa todos los campos obligatorios.");
    return;
  }

  SoundEffects.playJingle();

  // Determine Image URL
  let imageUrl = "";
  if (imagePreset === "custom") {
    imageUrl = customImageUrl || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80";
  } else {
    // Presets
    const presets = {
      "trabajo": "https://images.unsplash.com/photo-1521737711867-e3b904737d88?auto=format&fit=crop&w=400&q=80",
      "alquileres": "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=400&q=80",
      "vehiculos": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80",
      "ropa": "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80",
      "electronica": "https://images.unsplash.com/photo-1468436139062-f60a71c5c892?auto=format&fit=crop&w=400&q=80",
      "joyeria": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=400&q=80",
      "hogar": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80"
    };
    imageUrl = presets[imagePreset] || presets["trabajo"];
  }

  const deliveryEnabledCheckbox = document.getElementById("ad-form-delivery-enabled");
  const physicalCats = ['vehiculos', 'ropa', 'electronica', 'joyeria', 'hogar'];
  const deliveryEnabled = physicalCats.includes(category) && deliveryEnabledCheckbox && deliveryEnabledCheckbox.checked;

  const newAd = {
    id: `ad-${Date.now()}`,
    category,
    title,
    price,
    desc,
    contact,
    image: imageUrl,
    date: new Date().toISOString().split('T')[0],
    user: isSponsored ? "Comercio Patrocinado" : "Tú (Anunciante)",
    sponsored: isSponsored,
    cpcBid: isSponsored ? cpcBid : 0,
    clicks: 0,
    deliveryEnabled: deliveryEnabled
  };

  appState.marketplaceAds.unshift(newAd);
  localStorage.setItem('sabi_marketplace_ads', JSON.stringify(appState.marketplaceAds));

  // Reset fields
  document.getElementById("ad-form-title").value = "";
  document.getElementById("ad-form-price").value = "";
  document.getElementById("ad-form-desc").value = "";
  document.getElementById("ad-form-contact").value = "";
  document.getElementById("ad-form-image-url").value = "";
  document.getElementById("ad-form-image-preset").value = "trabajo";
  document.getElementById("ad-form-sponsored").value = "organic";
  if (document.getElementById("ad-form-cpc")) {
    document.getElementById("ad-form-cpc").value = "1.00";
  }
  if (deliveryEnabledCheckbox) {
    deliveryEnabledCheckbox.checked = false;
  }
  const deliveryToggleGroup = document.getElementById("ad-form-delivery-toggle-group");
  if (deliveryToggleGroup) {
    deliveryToggleGroup.style.display = "none";
  }
  
  // Trigger UI display hides
  toggleCustomImageUrlField();
  toggleCpcField();

  if (isSponsored) {
    showToast("Campaña de Negocio Publicada", `Tu anuncio patrocinado "${title}" está activo con una oferta de CPC de $${cpcBid.toFixed(2)} USD.`);
  } else {
    showToast("Clasificado Publicado", "Tu anuncio se ha agregado de forma orgánica y gratuita a la Comunidad.");
  }
  
  renderClassifieds();
  renderAccountModal();
}

// ==================== SABI-DELIVERY DISPATCH, DRIVER PORTAL & ADMIN PANEL ====================

// Comunidad sub-navigation switcher
function switchComunidadTab(tab) {
  if (!tab) return;
  appState.activeComunidadTab = tab;
  SoundEffects.playClick();
  
  document.querySelectorAll(".comunidad-tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.comunidadTab === tab);
  });
  
  document.querySelectorAll(".comunidad-content").forEach(content => {
    content.classList.toggle("active", content.id === `comunidad-content-${tab}`);
  });
  
  if (tab === 'market') {
    renderClassifieds();
  } else if (tab === 'delivery') {
    renderDeliveryRequestPortal();
  } else if (tab === 'live') {
    renderLiveStreams();
  } else if (tab === 'admin') {
    renderAdminDashboard();
  }
}

function getDriverCommissionRate() {
  const periods = parseInt(localStorage.getItem('sabi_driver_periods_completed') || '0', 10);
  let commission = 10 - periods;
  if (commission < 5) commission = 5;
  return commission / 100;
}

function calculateTripDistance(pickup, dropoff) {
  if (pickup === dropoff) return 3.0;
  const neighbors = {
    "Noord": ["Oranjestad"],
    "Oranjestad": ["Noord", "Santa Cruz", "Savaneta"],
    "Santa Cruz": ["Oranjestad", "Savaneta", "San Nicolas"],
    "Savaneta": ["Oranjestad", "Santa Cruz", "San Nicolas"],
    "San Nicolas": ["Savaneta", "Santa Cruz"]
  };
  if (neighbors[pickup] && neighbors[pickup].includes(dropoff)) {
    return 8.0;
  }
  if ((pickup === "Noord" && dropoff === "San Nicolas") || (pickup === "San Nicolas" && dropoff === "Noord")) {
    return 25.0;
  }
  return 12.0;
}

function estimateDistance(pickup, dropoff) {
  const districts = ["Noord", "Oranjestad", "Santa Cruz", "Savaneta", "San Nicolas"];
  let pDist = "Oranjestad";
  let dDist = "Oranjestad";
  
  districts.forEach(d => {
    if (pickup.toLowerCase().includes(d.toLowerCase())) pDist = d;
    if (dropoff.toLowerCase().includes(d.toLowerCase())) dDist = d;
  });
  
  return calculateTripDistance(pDist, dDist);
}

function getDaysInPeriod() {
  const regDateStr = localStorage.getItem('sabi_driver_reg_date');
  if (!regDateStr) return 0;
  const regDate = new Date(regDateStr);
  const diffTime = Math.abs(new Date() - regDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays % 90; // Period resets every 90 days (3 months)
}

function simulateDriverDistance(km) {
  let currentDistance = parseFloat(localStorage.getItem('sabi_driver_distance_period') || '0');
  currentDistance += km;
  localStorage.setItem('sabi_driver_distance_period', currentDistance.toString());
  
  let totalDistance = parseFloat(localStorage.getItem('sabi_driver_total_distance') || '0');
  totalDistance += km;
  localStorage.setItem('sabi_driver_total_distance', totalDistance.toString());
  
  showToast("Simulación", `Has recorrido ${km.toFixed(1)} km adicionales. Distancia del período: ${currentDistance.toFixed(1)} km.`);
  
  if (appState.activeAccountTab === 'delivery') {
    renderAccountModal();
  }
  renderDriverPortal();
}

function simulateDriverInfraction() {
  let infractions = parseInt(localStorage.getItem('sabi_driver_infractions_period') || '0', 10);
  infractions += 1;
  localStorage.setItem('sabi_driver_infractions_period', infractions.toString());
  
  let totalInfractions = parseInt(localStorage.getItem('sabi_driver_total_infractions') || '0', 10);
  totalInfractions += 1;
  localStorage.setItem('sabi_driver_total_infractions', totalInfractions.toString());
  
  showToast("Infracción Simulada", "Se ha registrado una queja / infracción contra tu desempeño en este período.", 4000);
  
  if (appState.activeAccountTab === 'delivery') {
    renderAccountModal();
  }
  renderDriverPortal();
}

function evaluateDriverPeriod() {
  const distance = parseFloat(localStorage.getItem('sabi_driver_distance_period') || '0');
  const infractions = parseInt(localStorage.getItem('sabi_driver_infractions_period') || '0', 10);
  const currentPeriods = parseInt(localStorage.getItem('sabi_driver_periods_completed') || '0', 10);
  
  const minDistanceRequired = 100.0; // 100 km required
  
  let success = false;
  let msg = '';
  
  if (distance >= minDistanceRequired && infractions === 0) {
    const newPeriods = Math.min(5, currentPeriods + 1);
    localStorage.setItem('sabi_driver_periods_completed', newPeriods.toString());
    success = true;
    
    const newCommission = 10 - newPeriods;
    msg = `🎉 Período evaluado con éxito. Cumpliste con la distancia mínima (${distance.toFixed(1)} km >= ${minDistanceRequired} km) y tuviste 0 infracciones. ¡Tu comisión baja al ${newCommission}%!`;
  } else {
    let reasons = [];
    if (distance < minDistanceRequired) {
      reasons.push(`distancia insuficiente (${distance.toFixed(1)} km de ${minDistanceRequired} km requeridos)`);
    }
    if (infractions > 0) {
      reasons.push(`${infractions} infracción(es) o queja(s) registrada(s)`);
    }
    msg = `⚠️ Período evaluado. No calificas para reducción de comisión debido a: ${reasons.join(' y ')}. Tu comisión se mantiene en el ${(10 - currentPeriods)}%.`;
  }
  
  localStorage.setItem('sabi_driver_distance_period', '0');
  localStorage.setItem('sabi_driver_infractions_period', '0');
  
  let regDate = new Date(localStorage.getItem('sabi_driver_reg_date') || Date.now());
  regDate.setMonth(regDate.getMonth() + 3);
  localStorage.setItem('sabi_driver_reg_date', regDate.toISOString());
  
  appState.driverPeriodsCompleted = parseInt(localStorage.getItem('sabi_driver_periods_completed') || '0', 10);
  
  showToast("Evaluación de Comisión", msg, 6000);
  
  if (appState.activeAccountTab === 'delivery') {
    renderAccountModal();
  }
  renderDriverPortal();
}

// DRIVER PORTAL RENDERER
function renderDriverPortal() {
  const container = document.getElementById("comunidad-content-delivery");
  if (!container) return;
  
  if (appState.driverStatus === 'unregistered') {
    container.innerHTML = `
      <section class="card purple-accent" style="max-width: 600px; margin: 0 auto;">
        <h2 class="card-title">Portal de Choferes - Hazte Delivery</h2>
        <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:1.5rem">
          Únete a la flota de delivery más rápida de Aruba. Gana hasta el 95% de la tarifa del envío (comisión del 10% inicial que disminuye hasta el 5% por buen desempeño).
        </p>
        
        <form id="driver-register-form" onsubmit="event.preventDefault(); window.handleDriverRegister();">
          <div class="form-group">
            <label for="driver-reg-name">Nombre Completo</label>
            <input type="text" class="text-input" id="driver-reg-name" placeholder="Ej. Juan Croes" required>
          </div>
          
          <div class="form-group">
            <label for="driver-reg-car">Vehículo (Modelo y Placa)</label>
            <input type="text" class="text-input" id="driver-reg-car" placeholder="Ej. Hyundai Accent - V-5542" required>
          </div>
          
          <div class="form-group">
            <label for="driver-reg-license">Número de Licencia</label>
            <input type="text" class="text-input" id="driver-reg-license" placeholder="Ej. L-123456" required>
          </div>
          
          <div class="form-group">
            <label>Subir Foto de Licencia / Cédula (Simulación)</label>
            <div class="upload-dropzone" id="driver-license-dropzone" onclick="window.simulateLicenseUpload()">
              <span style="font-size:2rem; display:block; margin-bottom:0.5rem">🪪</span>
              <span id="driver-license-upload-label">Haz clic aquí para subir una imagen simulada</span>
              <input type="hidden" id="driver-reg-photo" value="">
            </div>
          </div>
          
          <button type="submit" class="btn btn-cyan btn-full" style="margin-top: 1rem;">
            📝 Enviar Solicitud de Registro
          </button>
        </form>
      </section>
    `;
  } else if (appState.driverStatus === 'pending') {
    container.innerHTML = `
      <section class="card gold-accent" style="max-width: 600px; margin: 0 auto; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem; animation: pingPulse 2s infinite">⏳</div>
        <h2 class="card-title">Solicitud en Revisión</h2>
        <p style="color:var(--text-muted); font-size:0.95rem; line-height:1.6; margin-bottom:1.5rem">
          Hola <strong>${appState.driverInfo ? appState.driverInfo.name : ''}</strong>, tu registro para conducir el vehículo <strong>${appState.driverInfo ? appState.driverInfo.car : ''}</strong> está en espera de revisión.
        </p>
        <div style="background: rgba(255, 224, 0, 0.08); border: 1px dashed var(--neon-gold); padding: 1rem; border-radius: 12px; font-size: 0.85rem; margin-bottom: 1.5rem;">
          💡 <strong>Instrucciones de Simulación:</strong> Ve a la pestaña de <strong>Panel Admin</strong> arriba a la derecha y haz clic en "Aprobar" en tu perfil de chofer para activarlo.
        </div>
        <button class="btn btn-full" onclick="window.switchComunidadTab('admin')">
          ⚙️ Ir al Panel Admin
        </button>
      </section>
    `;
  } else if (appState.driverStatus === 'approved') {
    container.innerHTML = `
      <div class="grid-2-1">
        <!-- Consola de Conducción / Viaje Activo -->
        <section class="card cyan-accent">
          <h2 class="card-title">Consola del Conductor</h2>
          
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem">
            <div>
              <h3 style="font-size:1.15rem; font-weight:800; color:var(--text-main);">${appState.driverInfo ? appState.driverInfo.name : ''}</h3>
              <p style="font-size:0.8rem; color:var(--text-muted)">Vehículo: ${appState.driverInfo ? appState.driverInfo.car : ''}</p>
            </div>
            
            <!-- Switch Delivery Activo -->
            <div class="switch-wrapper">
              <span style="font-size:0.85rem; font-weight:700; color: ${appState.driverActive ? 'var(--neon-cyan)' : 'var(--text-muted)'}">
                ${appState.driverActive ? '🟢 Activo para Recibir Viajes' : '🔴 Desconectado'}
              </span>
              <label class="active-switch">
                <input type="checkbox" id="driver-active-toggle" ${appState.driverActive ? 'checked' : ''} onchange="window.handleDriverActiveToggle(this)">
                <span class="slider"></span>
              </label>
            </div>
          </div>
          
          <!-- Contenedor del viaje activo (si existe) -->
          <div id="driver-active-trip-container">
            ${renderDriverActiveTripHtml()}
          </div>
        </section>
        
        <!-- Billetera y Métricas de Repartidor -->
        <div style="display:flex; flex-direction:column; gap:1.5rem">
          <section class="card driver-wallet-box">
            <h2 class="card-title" style="color:var(--neon-cyan)">Mi Billetera Sabí</h2>
            <div style="text-align:center; padding:1rem 0">
              <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px">Saldo Acumulado (Neto)</div>
              <div style="font-size:2.4rem; font-weight:800; color:var(--neon-cyan); margin-top:0.25rem">
                Afl. ${appState.driverWallet.toFixed(2)}
              </div>
              <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.5rem">Ganancias netas acumuladas de tus envíos realizados (con comisiones de plataforma preferenciales).</p>
            </div>
            <div style="background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); padding:1rem; border-radius:12px; font-size:0.8rem">
              <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem">
                <span style="color:var(--text-muted)">Corte del Próximo Viernes:</span>
                <span style="font-weight:700" id="driver-payout-day">Viernes, 23:59</span>
              </div>
              <div style="display:flex; justify-content:space-between">
                <span style="color:var(--text-muted)">Banco de Depósito:</span>
                <span style="font-weight:700">Aruba Bank (Simulado)</span>
              </div>
            </div>
          </section>
          
          <section class="card purple-accent">
            <h2 class="card-title">Métricas de Rendimiento (Comisiones AI)</h2>
            <div style="display:flex; flex-direction:column; gap:0.75rem; font-size:0.85rem">
              <div style="display:flex; justify-content:space-between; border-bottom:1.5px solid var(--glass-border); padding-bottom:0.5rem">
                <span style="color:var(--text-muted)">Comisión de Plataforma:</span>
                <span style="font-weight:800; color:var(--neon-cyan)">${(getDriverCommissionRate() * 100).toFixed(0)}%</span>
              </div>
              <div style="display:flex; justify-content:space-between; border-bottom:1.5px solid var(--glass-border); padding-bottom:0.5rem">
                <span style="color:var(--text-muted)">Distancia en Período:</span>
                <span style="font-weight:800; color:var(--text-main)">${parseFloat(localStorage.getItem('sabi_driver_distance_period') || '0').toFixed(1)} / 100.0 km</span>
              </div>
              <div style="display:flex; justify-content:space-between; border-bottom:1.5px solid var(--glass-border); padding-bottom:0.5rem">
                <span style="color:var(--text-muted)">Infracciones / Quejas:</span>
                <span style="font-weight:800; color:${parseInt(localStorage.getItem('sabi_driver_infractions_period') || '0') === 0 ? 'var(--neon-emerald)' : 'var(--neon-pink)'}">
                  ${localStorage.getItem('sabi_driver_infractions_period') || '0'}
                </span>
              </div>
              <div style="display:flex; justify-content:space-between; border-bottom:1.5px solid var(--glass-border); padding-bottom:0.5rem">
                <span style="color:var(--text-muted)">Período de Evaluación:</span>
                <span style="font-weight:800; color:var(--neon-gold)">Día ${getDaysInPeriod()} de 90 (3 Meses)</span>
              </div>
              <div style="display:flex; justify-content:space-between; border-bottom:1.5px solid var(--glass-border); padding-bottom:0.5rem">
                <span style="color:var(--text-muted)">Viajes Completados:</span>
                <span style="font-weight:800; color:var(--text-main)" id="driver-stat-trips-completed">0</span>
              </div>
              <div style="display:flex; flex-direction:column; gap:0.5rem; margin-top:0.5rem; border-top:1px dashed rgba(255,255,255,0.08); padding-top:0.75rem">
                <div style="font-size:0.75rem; color:var(--text-muted); font-weight:bold">🔧 Herramientas de Simulación:</div>
                <div style="display:flex; gap:0.25rem; flex-wrap:wrap">
                  <button class="btn btn-xs" onclick="window.simulateDriverDistance(25.0)" style="font-size:0.65rem; padding:4px 8px; flex:1; background:rgba(0,245,212,0.1); border:1px solid var(--neon-cyan); color:var(--neon-cyan)">🏃 +25 km</button>
                  <button class="btn btn-xs" onclick="window.simulateDriverInfraction()" style="font-size:0.65rem; padding:4px 8px; flex:1; background:rgba(255,0,128,0.1); border:1px solid var(--neon-pink); color:var(--neon-pink)">⚠️ +1 Queja</button>
                  <button class="btn btn-xs btn-cyan" onclick="window.evaluateDriverPeriod()" style="font-size:0.65rem; padding:4px 8px; flex:2; font-weight:bold">📊 Evaluar Período</button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    `;
    
    // Set completed count metric
    const tripsCompletedEl = document.getElementById("driver-stat-trips-completed");
    if (tripsCompletedEl) {
      const completedCount = localStorage.getItem('sabi_driver_trips_completed') || '0';
      tripsCompletedEl.innerText = completedCount;
    }
    
    // Trigger map canvas draw or route animation if active trip is in progress
    if (appState.activeTrip) {
      if ((appState.activeTrip.status === 'accepted' || appState.activeTrip.status === 'delivery') && !isAnimating) {
        startGpsSimulation();
      } else {
        // Draw static position
        setTimeout(() => {
          const canvas = document.getElementById("gps-canvas");
          if (canvas) {
            const currentDistrict = (appState.activeTrip.status === 'pickup' || appState.activeTrip.status === 'accepted')
              ? appState.activeTrip.pickupDistrict 
              : appState.activeTrip.deliveryDistrict;
            const coord = DISTRICT_COORDS[currentDistrict];
            if (coord) {
              drawGpsMap(canvas, coord.x, coord.y, appState.activeTrip.pickupDistrict, appState.activeTrip.deliveryDistrict, appState.activeTrip.status);
            }
          }
        }, 100);
      }
    }
  }
}

// Active Trip HTML view
function renderDriverActiveTripHtml() {
  const trip = appState.activeTrip;
  if (!trip) {
    return `
      <div style="padding: 2.5rem; text-align: center; color: var(--text-muted);">
        <span style="font-size: 2.5rem; display: block; margin-bottom: 0.75rem">📦</span>
        No tienes entregas activas en este momento. ¡Activa tu estado y espera un pedido!
      </div>
    `;
  }
  
  let statusText = "";
  let actionButtonHtml = "";
  
  if (trip.status === 'accepted') {
    statusText = "📍 En camino a recoger el paquete...";
    actionButtonHtml = `
      <button class="btn btn-cyan btn-full" disabled style="opacity: 0.6; cursor: not-allowed;">
        🚗 Viajando a Punto de Recogida...
      </button>
    `;
  } else if (trip.status === 'pickup') {
    statusText = "✅ Llegaste al punto de recogida. Solicita el paquete al vendedor.";
    actionButtonHtml = `
      <button class="btn btn-cyan btn-full" style="background: var(--neon-gold); border-color: var(--neon-gold); color: #000;" onclick="window.driverPickupPackage()">
        📦 Paquete Recogido - Iniciar Entrega
      </button>
    `;
  } else if (trip.status === 'delivery') {
    statusText = "📍 En camino a entregar el paquete...";
    actionButtonHtml = `
      <button class="btn btn-cyan btn-full" disabled style="opacity: 0.6; cursor: not-allowed;">
        🚗 Viajando a Punto de Entrega...
      </button>
    `;
  } else if (trip.status === 'reached_delivery') {
    statusText = "✅ Receptáculo de entrega alcanzado. Entrega el paquete y toma confirmación.";
    actionButtonHtml = `
      <button class="btn btn-cyan btn-full" onclick="window.openPhotoVerification()">
        📷 Tomar Foto de Confirmación
      </button>
    `;
  }
  
  return `
    <div style="margin-top:1.5rem">
      <div class="map-sim-card" style="margin-bottom: 1.25rem;">
        <canvas id="gps-canvas" width="400" height="180" class="gps-canvas-map"></canvas>
      </div>
      
      <div style="background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); padding:1.25rem; border-radius:14px; margin-bottom:1.25rem">
        <div style="font-weight:800; font-size:1.05rem; color:var(--text-main); margin-bottom:0.75rem">Información del Envío:</div>
        <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem; font-size:0.85rem">
          <span style="color:var(--text-muted)">Artículo:</span>
          <span style="font-weight:700">${trip.itemTitle}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem; font-size:0.85rem">
          <span style="color:var(--text-muted)">Recogida en:</span>
          <span style="font-weight:700">📍 ${trip.pickupDistrict}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem; font-size:0.85rem">
          <span style="color:var(--text-muted)">Entregar en:</span>
          <span style="font-weight:700">🏠 ${trip.deliveryDistrict}</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.85rem">
          <span style="color:var(--text-muted)">Pago del Viaje (${((1 - getDriverCommissionRate()) * 100).toFixed(0)}%):</span>
          <span style="font-weight:800; color:var(--neon-gold)">Afl. ${trip.driverEarnings.toFixed(2)}</span>
        </div>
      </div>
      
      <div style="font-size:0.9rem; font-weight:700; color:var(--neon-cyan); margin-bottom:1rem; text-align:center">
        ${statusText}
      </div>
      
      ${actionButtonHtml}
    </div>
  `;
}

// Driver registration handlers
function handleDriverRegister() {
  const name = document.getElementById("driver-reg-name").value.trim();
  const car = document.getElementById("driver-reg-car").value.trim();
  const license = document.getElementById("driver-reg-license").value.trim();
  const photo = document.getElementById("driver-reg-photo").value;
  
  if (!name || !car || !license) {
    showToast("Error", "Por favor completa todos los campos del registro.");
    return;
  }
  
  if (!photo) {
    showToast("Error", "Por favor sube una foto de tu licencia (simulada).");
    return;
  }
  
  SoundEffects.playJingle();
  
  const driverInfo = { name, car, license, photo };
  appState.driverInfo = driverInfo;
  appState.driverStatus = 'pending';
  
  localStorage.setItem('sabi_driver_status', 'pending');
  localStorage.setItem('sabi_driver_info', JSON.stringify(driverInfo));
  
  // Save to pending list for Admin Dashboard
  let pendingList = appState.pendingDrivers || [];
  pendingList.push({
    id: `driver-${Date.now()}`,
    ...driverInfo
  });
  appState.pendingDrivers = pendingList;
  localStorage.setItem('sabi_pending_drivers', JSON.stringify(pendingList));
  
  showToast("Registro Enviado", "Tu registro se ha enviado a revisión.");
  renderDriverPortal();
}

function simulateLicenseUpload() {
  SoundEffects.playClick();
  const label = document.getElementById("driver-license-upload-label");
  const photoInput = document.getElementById("driver-reg-photo");
  if (label && photoInput) {
    label.innerText = "⏳ Subiendo archivo...";
    setTimeout(() => {
      photoInput.value = "licencia_simulada.jpg";
      label.innerHTML = "✅ <strong>licencia_simulada.jpg</strong> subida con éxito";
      showToast("Archivo Cargado", "Se ha cargado un archivo simulado para tu licencia.");
    }, 1000);
  }
}

// Switch toggle for driver active status
function handleDriverActiveToggle(checkbox) {
  SoundEffects.playClick();
  appState.driverActive = checkbox.checked;
  localStorage.setItem('sabi_driver_active', appState.driverActive.toString());
  
  renderDriverPortal();
  
  showToast(
    appState.driverActive ? "Delivery Conectado" : "Delivery Desconectado",
    appState.driverActive 
      ? "Ya estás disponible para recibir pedidos de envío Sabí." 
      : "Te has desconectado de la red de entregas."
  );
}

// BUYER CHECKOUT ASSISTANT
function openCheckoutModal(adId) {
  const ad = appState.marketplaceAds.find(a => a.id === adId);
  if (!ad) return;
  
  SoundEffects.playClick();
  document.getElementById("checkout-ad-id").value = adId;
  document.getElementById("checkout-item-title").innerText = ad.title;
  document.getElementById("checkout-item-price").innerText = `Afl. ${ad.price.toLocaleString()}`;
  
  // Default districts
  document.getElementById("checkout-pickup-district").value = "Santa Cruz";
  document.getElementById("checkout-delivery-district").value = "Noord";
  
  // Reset payment method selection
  appState.checkoutPaymentMethod = 'wallet';
  const selectWalletBtn = document.getElementById("pay-select-wallet");
  const selectCardBtn = document.getElementById("pay-select-card");
  if (selectWalletBtn && selectCardBtn) {
    selectWalletBtn.style.background = "rgba(0,243,255,0.08)";
    selectWalletBtn.style.borderColor = "var(--neon-cyan)";
    selectWalletBtn.style.color = "var(--neon-cyan)";
    
    selectCardBtn.style.background = "transparent";
    selectCardBtn.style.borderColor = "rgba(255,255,255,0.1)";
    selectCardBtn.style.color = "var(--text-muted)";
  }
  
  // Check if product has Sabi-Delivery enabled
  const toggleContainer = document.getElementById("checkout-delivery-toggle-container");
  const deliveryCheckbox = document.getElementById("checkout-delivery-enabled");
  if (toggleContainer && deliveryCheckbox) {
    if (ad.deliveryEnabled) {
      toggleContainer.style.display = "flex";
      deliveryCheckbox.checked = true; // Checked by default if supported
    } else {
      toggleContainer.style.display = "none";
      deliveryCheckbox.checked = false; // Forced false if not supported
    }
  }
  
  updateCheckoutFare();
  
  document.getElementById("checkout-delivery-modal").classList.add("active");
}

function closeCheckoutModal() {
  SoundEffects.playClick();
  document.getElementById("checkout-delivery-modal").classList.remove("active");
}

function switchCheckoutPaymentMethod(method) {
  SoundEffects.playClick();
  appState.checkoutPaymentMethod = method;
  
  const selectWalletBtn = document.getElementById("pay-select-wallet");
  const selectCardBtn = document.getElementById("pay-select-card");
  
  if (selectWalletBtn && selectCardBtn) {
    if (method === 'wallet') {
      selectWalletBtn.style.background = "rgba(0,243,255,0.08)";
      selectWalletBtn.style.borderColor = "var(--neon-cyan)";
      selectWalletBtn.style.color = "var(--neon-cyan)";
      
      selectCardBtn.style.background = "transparent";
      selectCardBtn.style.borderColor = "rgba(255,255,255,0.1)";
      selectCardBtn.style.color = "var(--text-muted)";
    } else {
      selectCardBtn.style.background = "rgba(0,243,255,0.08)";
      selectCardBtn.style.borderColor = "var(--neon-cyan)";
      selectCardBtn.style.color = "var(--neon-cyan)";
      
      selectWalletBtn.style.background = "transparent";
      selectWalletBtn.style.borderColor = "rgba(255,255,255,0.1)";
      selectWalletBtn.style.color = "var(--text-muted)";
    }
  }
  
  updateCheckoutFare();
}

function updateCheckoutFare() {
  const adId = document.getElementById("checkout-ad-id").value;
  const ad = appState.marketplaceAds.find(a => a.id === adId);
  if (!ad) return;
  
  const deliveryCheckbox = document.getElementById("checkout-delivery-enabled");
  const deliveryFields = document.getElementById("checkout-delivery-fields");
  const shippingCostRow = document.getElementById("checkout-shipping-cost-row");
  
  const isDelivery = deliveryCheckbox && deliveryCheckbox.checked;
  
  if (deliveryFields) {
    deliveryFields.style.display = isDelivery ? "flex" : "none";
  }
  if (shippingCostRow) {
    shippingCostRow.style.display = isDelivery ? "flex" : "none";
  }
  
  let fare = 0;
  if (isDelivery) {
    const pickup = document.getElementById("checkout-pickup-district").value;
    const dropoff = document.getElementById("checkout-delivery-district").value;
    fare = calculateDeliveryFare(pickup, dropoff, ad.category);
  }
  
  const total = ad.price + fare;
  
  document.getElementById("checkout-shipping-cost").innerText = `Afl. ${fare.toFixed(2)}`;
  document.getElementById("checkout-total-amount").innerText = `Afl. ${total.toFixed(2)}`;

  // Payment Method Switching logic
  const payIcon = document.getElementById("checkout-payment-icon");
  const payTitle = document.getElementById("checkout-payment-method-title");
  const payDesc = document.getElementById("checkout-payment-method-desc");
  const walletDetails = document.getElementById("checkout-wallet-details");
  const balanceWarning = document.getElementById("checkout-balance-warning");
  const userBalanceEl = document.getElementById("checkout-user-balance");
  
  const paymentSelector = document.getElementById("checkout-payment-selector");
  const cardForm = document.getElementById("checkout-card-form");
  
  const submitBtn = document.querySelector("#checkout-delivery-form button[type='submit']");
  
  if (isDelivery) {
    if (paymentSelector) paymentSelector.style.display = "flex";
    
    if (appState.checkoutPaymentMethod === 'wallet') {
      if (cardForm) cardForm.style.display = "none";
      if (payIcon) payIcon.innerText = "💳";
      if (payTitle) payTitle.innerText = "Sabí-Pay (Custodia Digital / Escrow)";
      if (payDesc) payDesc.innerText = "El pago se descuenta de tu billetera y se retiene en garantía hasta que recibas el paquete.";
      if (walletDetails) walletDetails.style.display = "flex";
      if (userBalanceEl) {
        userBalanceEl.innerText = `Afl. ${appState.userWallet.toFixed(2)} AWG`;
      }
      
      // Check balance
      if (total > appState.userWallet) {
        if (balanceWarning) balanceWarning.style.display = "block";
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.style.opacity = "0.5";
          submitBtn.style.cursor = "not-allowed";
          submitBtn.innerText = "⚠️ Saldo Insuficiente";
        }
      } else {
        if (balanceWarning) balanceWarning.style.display = "none";
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.style.opacity = "1";
          submitBtn.style.cursor = "pointer";
          submitBtn.innerText = "🤝 Confirmar Compra";
        }
      }
    } else {
      // Direct payment (Card/Apple Pay/Google Pay)
      if (cardForm) cardForm.style.display = "block";
      if (payIcon) payIcon.innerText = "💳";
      if (payTitle) payTitle.innerText = "Tarjeta / Apple Pay / Google Pay";
      if (payDesc) payDesc.innerText = "Pago directo rápido. Se simula una transacción segura con tu pasarela bancaria.";
      if (walletDetails) walletDetails.style.display = "none";
      if (balanceWarning) balanceWarning.style.display = "none";
      
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = "1";
        submitBtn.style.cursor = "pointer";
        submitBtn.innerText = "🤝 Confirmar Compra";
      }
    }
  } else {
    if (paymentSelector) paymentSelector.style.display = "none";
    if (cardForm) cardForm.style.display = "none";
    if (payIcon) payIcon.innerText = "💵";
    if (payTitle) payTitle.innerText = "Pago contra entrega (Efectivo)";
    if (payDesc) payDesc.innerText = "Paga directamente en efectivo al recibir o recoger tu producto.";
    if (walletDetails) walletDetails.style.display = "none";
    if (balanceWarning) balanceWarning.style.display = "none";
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = "1";
      submitBtn.style.cursor = "pointer";
      submitBtn.innerText = "🤝 Confirmar Compra";
    }
  }
}

function getCategoryMultiplier(category) {
  if (!category) return 1.0;
  
  // Pequeño / Ligero
  const lightCategories = ['electronica', 'ropa', 'joyeria', 'trabajo', 'servicios_salud', 'servicios_tecnicos'];
  // Mediano
  const mediumCategories = ['hogar', 'servicios_hogar', 'servicios_profesionales', 'servicios_eventos'];
  // Grande / Pesado (Vehículos, Muebles pesados)
  const heavyCategories = ['vehiculos', 'servicios_transporte'];
  
  if (lightCategories.includes(category)) return 1.0;
  if (mediumCategories.includes(category)) return 1.5;
  if (heavyCategories.includes(category)) return 3.0;
  
  return 1.0;
}

// District Tariff Algorithm with Category Multipliers
function calculateDeliveryFare(pickup, dropoff, category) {
  let baseFare = 15.00;
  if (pickup === dropoff) {
    baseFare = 7.00;
  } else {
    const neighbors = {
      "Noord": ["Oranjestad"],
      "Oranjestad": ["Noord", "Santa Cruz", "Savaneta"],
      "Santa Cruz": ["Oranjestad", "Savaneta", "San Nicolas"],
      "Savaneta": ["Oranjestad", "Santa Cruz", "San Nicolas"],
      "San Nicolas": ["Savaneta", "Santa Cruz"]
    };
    if (neighbors[pickup] && neighbors[pickup].includes(dropoff)) {
      baseFare = 11.00;
    } else if ((pickup === "Noord" && dropoff === "San Nicolas") || (pickup === "San Nicolas" && dropoff === "Noord")) {
      baseFare = 22.00;
    }
  }
  
  const multiplier = getCategoryMultiplier(category);
  return baseFare * multiplier;
}

// Payment & Dispatch process
function processCheckoutPayment() {
  const adId = document.getElementById("checkout-ad-id").value;
  const ad = appState.marketplaceAds.find(a => a.id === adId);
  if (!ad) return;
  
  const deliveryCheckbox = document.getElementById("checkout-delivery-enabled");
  const isDelivery = deliveryCheckbox && deliveryCheckbox.checked;
  
  // Close modal
  document.getElementById("checkout-delivery-modal").classList.remove("active");
  
  if (isDelivery) {
    const pickup = document.getElementById("checkout-pickup-district").value;
    const dropoff = document.getElementById("checkout-delivery-district").value;
    const fare = calculateDeliveryFare(pickup, dropoff);
    const total = ad.price + fare;
    
    const runDispatch = () => {
      // Create active trip state with escrow amount
      appState.activeTrip = {
        adId: ad.id,
        itemTitle: ad.title,
        itemPrice: ad.price,
        pickupDistrict: pickup,
        deliveryDistrict: dropoff,
        totalFare: fare,
        driverEarnings: fare * (1 - getDriverCommissionRate()),
        platformCommission: fare * getDriverCommissionRate(),
        escrowAmount: ad.price,
        status: 'dispatched'
      };
      
      localStorage.setItem('sabi_active_trip', JSON.stringify(appState.activeTrip));
      
      if (appState.driverStatus === 'approved' && appState.driverActive) {
        // Show ping popup after 1.5s
        setTimeout(() => {
          triggerDriverPing();
        }, 1500);
      } else {
        setTimeout(() => {
          showToast("Esperando Repartidor", "No hay repartidores activos en este momento. Registra un conductor en 'Hazte Delivery', aprúebalo en 'Panel Admin' y actívalo para continuar.", 8000);
        }, 2000);
      }
    };
    
    if (appState.checkoutPaymentMethod === 'wallet') {
      // Deduct wallet and save
      appState.userWallet -= total;
      localStorage.setItem('sabi_user_wallet', appState.userWallet.toString());
      
      SoundEffects.playJingle();
      showToast("Pago en Custodia", `Se han retenido Afl. ${total.toFixed(2)} AWG en Garantía Sabí-Pay de tu saldo.`);
      runDispatch();
    } else {
      // Direct Card / Apple Pay / Google Pay simulation
      const loadingOverlay = document.getElementById("payment-loading-overlay");
      const loadingText = document.getElementById("payment-loading-text");
      if (loadingOverlay) {
        if (loadingText) loadingText.innerText = "Autorizando Pago Digital...";
        loadingOverlay.style.display = "flex";
      }
      
      setTimeout(() => {
        if (loadingOverlay) loadingOverlay.style.display = "none";
        
        SoundEffects.playJingle();
        showToast("Pago Exitoso", `Se han cargado Afl. ${total.toFixed(2)} AWG a tu tarjeta. Retenidos en Garantía Sabí-Pay.`);
        runDispatch();
      }, 1500);
    }
  } else {
    // Local Pickup COD
    appState.activeTrip = null;
    localStorage.removeItem('sabi_active_trip');
    
    SoundEffects.playJingle();
    showToast("¡Compra Confirmada!", `Ponte en contacto con el vendedor ${ad.user} (${ad.contact}) para acordar la recogida y realizar el pago contra entrega de Afl. ${ad.price.toLocaleString()} AWG.`);
  }
}

// PING Dispatch auction alert
function triggerDriverPing() {
  if (!appState.activeTrip) return;
  
  // Play double warning beep
  SoundEffects.playAlert();
  setTimeout(() => SoundEffects.playAlert(), 300);
  
  // Populate ping details
  document.getElementById("ping-pickup").innerText = appState.activeTrip.pickupDistrict;
  document.getElementById("ping-delivery").innerText = appState.activeTrip.deliveryDistrict;
  document.getElementById("ping-total-fare").innerText = `Afl. ${appState.activeTrip.totalFare.toFixed(2)}`;
  document.getElementById("ping-driver-earnings").innerText = `Afl. ${appState.activeTrip.driverEarnings.toFixed(2)}`;
  
  // Show ping modal overlay
  document.getElementById("driver-ping-modal").classList.add("active");
}

function rejectDriverTrip() {
  SoundEffects.playClick();
  document.getElementById("driver-ping-modal").classList.remove("active");
  showToast("Oferta Rechazada", "Has rechazado el viaje de entrega.");
  appState.activeTrip = null;
  localStorage.removeItem('sabi_active_trip');
  
  if (appState.activeComunidadTab === 'delivery') {
    renderDriverPortal();
  }
}

function acceptDriverTrip() {
  SoundEffects.playJingle();
  document.getElementById("driver-ping-modal").classList.remove("active");
  
  if (!appState.activeTrip) return;
  
  appState.activeTrip.status = 'accepted';
  localStorage.setItem('sabi_active_trip', JSON.stringify(appState.activeTrip));
  
  // Set driver active trip
  appState.driverActiveTrip = {
    id: `checkout-del-${Date.now()}`,
    price: appState.activeTrip.totalFare,
    title: `Entrega de: ${appState.activeTrip.itemTitle}`,
    name: appState.activeTrip.itemTitle,
    address: `${appState.activeTrip.deliveryDistrict} (Domicilio de compra)`,
    escrowAmount: appState.activeTrip.escrowAmount,
    status: 'assigned'
  };
  localStorage.setItem('sabi_driver_active_trip', JSON.stringify(appState.driverActiveTrip));
  
  showToast("Viaje Asignado", "Dirígete al punto de recogida. Monitorea tu ubicación en el mapa GPS.");
  
  // Refresh modal and navigate
  renderAccountModal();
  switchComunidadTab('delivery');
}

// Driver Pickup & Completion actions
function driverPickupPackage() {
  SoundEffects.playClick();
  if (!appState.activeTrip) return;
  
  appState.activeTrip.status = 'delivery';
  localStorage.setItem('sabi_active_trip', JSON.stringify(appState.activeTrip));
  
  showToast("Paquete Recogido", "En tránsito al punto de entrega.");
  renderDriverPortal();
}

function openPhotoVerification() {
  SoundEffects.playClick();
  
  showToast("Cámara de Reparto", "Simulando captura fotográfica del paquete en la entrada...", 2000);
  
  // Auto-complete delivery after camera delay
  setTimeout(() => {
    processDeliveryCompletion("paquete_entregado.jpg");
  }, 2000);
}

function processDeliveryCompletion(photoUrl) {
  if (!appState.activeTrip) return;
  
  SoundEffects.playJingle();
  const trip = appState.activeTrip;
  
  // Update wallet balances
  appState.driverWallet += trip.driverEarnings;
  appState.adminEarnings += trip.platformCommission;
  
  localStorage.setItem('sabi_driver_wallet', appState.driverWallet.toString());
  localStorage.setItem('sabi_admin_earnings', appState.adminEarnings.toString());
  
  // Increment completed trips
  let tripsCount = parseInt(localStorage.getItem('sabi_driver_trips_completed') || '0');
  tripsCount += 1;
  localStorage.setItem('sabi_driver_trips_completed', tripsCount.toString());
  
  // Increment distance in evaluation period
  let currentDistance = parseFloat(localStorage.getItem('sabi_driver_distance_period') || '0');
  currentDistance += 8.5;
  localStorage.setItem('sabi_driver_distance_period', currentDistance.toString());
  
  showToast("¡Entrega Exitosa!", `Envío completado. Recibes Afl. ${trip.driverEarnings.toFixed(2)} (${((1 - getDriverCommissionRate()) * 100).toFixed(0)}%) en tu billetera Sabí.`);
  
  appState.activeTrip = null;
  localStorage.removeItem('sabi_active_trip');
  
  renderDriverPortal();
}

// GPS Canvas Route Simulator
const DISTRICT_COORDS = {
  "Noord": { x: 100, y: 30 },
  "Oranjestad": { x: 80, y: 80 },
  "Santa Cruz": { x: 180, y: 90 },
  "Savaneta": { x: 260, y: 120 },
  "San Nicolas": { x: 340, y: 140 }
};

let gpsAnimationId = null;
let carPos = { x: 0, y: 0 };
let animProgress = 0;
let animStart = { x: 0, y: 0 };
let animEnd = { x: 0, y: 0 };
let isAnimating = false;

function startGpsSimulation() {
  if (!appState.activeTrip) return;
  if (gpsAnimationId) cancelAnimationFrame(gpsAnimationId);
  
  const trip = appState.activeTrip;
  
  if (trip.status === 'accepted') {
    const startCoord = DISTRICT_COORDS["Oranjestad"];
    const endCoord = DISTRICT_COORDS[trip.pickupDistrict];
    animStart = { ...startCoord };
    animEnd = { ...endCoord };
    carPos = { ...startCoord };
    animProgress = 0;
    isAnimating = true;
    
    gpsAnimationId = requestAnimationFrame(animateGpsRoute);
  } else if (trip.status === 'delivery') {
    const startCoord = DISTRICT_COORDS[trip.pickupDistrict];
    const endCoord = DISTRICT_COORDS[trip.deliveryDistrict];
    animStart = { ...startCoord };
    animEnd = { ...endCoord };
    carPos = { ...startCoord };
    animProgress = 0;
    isAnimating = true;
    
    gpsAnimationId = requestAnimationFrame(animateGpsRoute);
  }
}

function animateGpsRoute() {
  if (!isAnimating || !appState.activeTrip) {
    if (gpsAnimationId) cancelAnimationFrame(gpsAnimationId);
    return;
  }
  
  const canvas = document.getElementById("gps-canvas");
  if (!canvas) {
    isAnimating = false;
    return;
  }
  
  animProgress += 0.006; // Adjust speed
  if (animProgress >= 1) {
    animProgress = 1;
    isAnimating = false;
  }
  
  carPos.x = animStart.x + (animEnd.x - animStart.x) * animProgress;
  carPos.y = animStart.y + (animEnd.y - animStart.y) * animProgress;
  
  drawGpsMap(
    canvas, 
    carPos.x, 
    carPos.y, 
    appState.activeTrip.pickupDistrict, 
    appState.activeTrip.deliveryDistrict, 
    appState.activeTrip.status
  );
  
  if (isAnimating) {
    gpsAnimationId = requestAnimationFrame(animateGpsRoute);
  } else {
    // Arrival transitions
    if (appState.activeTrip.status === 'accepted') {
      appState.activeTrip.status = 'pickup';
      localStorage.setItem('sabi_active_trip', JSON.stringify(appState.activeTrip));
      showToast("Llegada a Recogida", "Recoge el paquete del vendedor para iniciar la entrega.");
      renderDriverPortal();
    } else if (appState.activeTrip.status === 'delivery') {
      appState.activeTrip.status = 'reached_delivery';
      localStorage.setItem('sabi_active_trip', JSON.stringify(appState.activeTrip));
      showToast("Llegada a Destino", "Toma una foto de confirmación para liberar los fondos en escrow.");
      renderDriverPortal();
    }
  }
}

function drawGpsMap(canvas, carX, carY, pickupName, deliveryName, status) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  
  ctx.fillStyle = "#121020";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Grid lines
  ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
  ctx.lineWidth = 1;
  const step = 20;
  for (let x = 0; x < canvas.width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  
  // Roads connecting districts
  ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  
  const points = [
    DISTRICT_COORDS["Noord"],
    DISTRICT_COORDS["Oranjestad"],
    DISTRICT_COORDS["Santa Cruz"],
    DISTRICT_COORDS["Savaneta"],
    DISTRICT_COORDS["San Nicolas"]
  ];
  
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
  
  // Draw base nodes
  for (const name in DISTRICT_COORDS) {
    const pt = DISTRICT_COORDS[name];
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 4, 0, 2*Math.PI);
    ctx.fill();
    
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "8px sans-serif";
    ctx.fillText(name, pt.x - 12, pt.y - 8);
  }
  
  // Highlight endpoints
  if (pickupName && DISTRICT_COORDS[pickupName]) {
    const pickupPt = DISTRICT_COORDS[pickupName];
    ctx.strokeStyle = "#FFE000";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(pickupPt.x, pickupPt.y, 8 + Math.sin(Date.now() / 150) * 1.5, 0, 2*Math.PI);
    ctx.stroke();
    
    ctx.fillStyle = "#FFE000";
    ctx.beginPath();
    ctx.arc(pickupPt.x, pickupPt.y, 5, 0, 2*Math.PI);
    ctx.fill();
  }
  
  if (deliveryName && DISTRICT_COORDS[deliveryName]) {
    const deliveryPt = DISTRICT_COORDS[deliveryName];
    ctx.strokeStyle = "#00F5D4";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(deliveryPt.x, deliveryPt.y, 8 + Math.cos(Date.now() / 150) * 1.5, 0, 2*Math.PI);
    ctx.stroke();
    
    ctx.fillStyle = "#00F5D4";
    ctx.beginPath();
    ctx.arc(deliveryPt.x, deliveryPt.y, 5, 0, 2*Math.PI);
    ctx.fill();
  }
  
  // Draw car glowing dot
  ctx.shadowColor = "#1b75ff";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(carX, carY, 6, 0, 2*Math.PI);
  ctx.fill();
  ctx.shadowBlur = 0; // reset shadow
  
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 9px sans-serif";
  ctx.fillText("🚗 Chofer", carX - 16, carY + 16);
}

// ADMIN DASHBOARD RENDERER
function renderAdminDashboard() {
  const container = document.getElementById("comunidad-content-admin");
  if (!container) return;

  const lang = appState.language || 'es';
  const dict = SABI_TRANSLATIONS[lang];
  
  const pendingCount = appState.pendingDrivers ? appState.pendingDrivers.length : 0;
  const approvedCount = (appState.driverStatus === 'approved') ? 1 : 0;
  
  let requestsHtml = "";
  if (pendingCount === 0) {
    requestsHtml = `
      <div style="padding: 2.5rem 1rem; text-align: center; color: var(--text-muted); font-size: 0.9rem;">
        No hay solicitudes de conductores pendientes de aprobación.
      </div>
    `;
  } else {
    requestsHtml = appState.pendingDrivers.map(drv => `
      <div class="approval-item">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <strong style="color:var(--text-main); font-size: 1.05rem;">${drv.name}</strong>
            <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.2rem">Vehículo: ${drv.car}</div>
            <div style="font-size:0.8rem; color:var(--text-muted);">Licencia: ${drv.license}</div>
          </div>
          <span class="turno-badge-inline" style="background: rgba(255, 224, 0, 0.15); border-color: rgba(255, 224, 0, 0.3); color: var(--neon-gold);">Pendiente</span>
        </div>
        <div class="license-preview-img" style="margin-top:0.5rem">
          🪪 Vista Previa: ${drv.photo}
        </div>
        <div style="display:flex; gap:0.5rem; margin-top:0.75rem">
          <button class="btn btn-sm btn-cyan" style="flex:1" onclick="window.approveDriver('${drv.id}')">Aprobar</button>
          <button class="btn btn-sm" style="flex:1; background:rgba(255,51,75,0.1); border-color:rgba(255,51,75,0.2); color:var(--neon-pink)" onclick="window.rejectDriver('${drv.id}')">Rechazar</button>
        </div>
      </div>
    `).join('');
  }

  // --- COLA DE ESPERA (MICROLOANS WAITLIST) ---
  let queueRowsHtml = "";
  appState.lendingQueue.forEach((item) => {
    const statusText = item.status === 'approved' 
      ? `<span class="badge" style="background:rgba(0,245,212,0.15); color:var(--neon-cyan); border:1px solid var(--neon-cyan); padding:0.15rem 0.4rem; border-radius:4px; font-size:0.65rem; font-weight:bold">${dict['loan_queue_status_approved'] || "Financia"}</span>`
      : `<span class="badge" style="background:rgba(255,184,0,0.15); color:var(--neon-gold); border:1px solid var(--neon-gold); padding:0.15rem 0.4rem; border-radius:4px; font-size:0.65rem; font-weight:bold">${dict['loan_queue_status_pending'] || "Spera riba Fondo"}</span>`;

    const actionBtn = item.status === 'pending'
      ? `<button class="btn btn-xs btn-cyan" onclick="window.approveNextLendingRequest('${item.id}')" style="font-size:0.65rem; padding:2px 8px; font-weight:bold">Fund</button>`
      : `<span style="color:var(--text-muted); font-size:0.65rem">-</span>`;

    queueRowsHtml += `
      <tr style="border-bottom:1px solid rgba(255,255,255,0.05)">
        <td style="padding:0.6rem 0.5rem; text-align:left; font-size:0.75rem; color:var(--text-main)">${item.name}</td>
        <td style="padding:0.6rem 0.5rem; text-align:right; font-size:0.75rem; font-weight:bold; color:var(--neon-cyan)">Afl. ${item.amount} AWG</td>
        <td style="padding:0.6rem 0.5rem; text-align:center">${statusText}</td>
        <td style="padding:0.6rem 0.5rem; text-align:center">${actionBtn}</td>
      </tr>
    `;
  });

  const queueHtml = `
    <section class="card purple-accent" style="margin-top:1.5rem; padding:1.2rem">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem">
        <h3 style="font-size:0.95rem; font-weight:800; color:var(--neon-purple); margin:0">
          👥 ${dict['loan_queue_title'] || "Fila di Spera (Otro Emprendedornan)"}
        </h3>
        <div style="display:flex; gap:0.5rem">
          <button class="btn btn-xs btn-cyan" onclick="window.approveNextLendingRequest()" style="font-size:0.7rem; padding:4px 10px; font-weight:bold">
            ${dict['loan_queue_btn_process'] || "Aproba Siguiente Pedido"}
          </button>
          <button class="btn btn-xs" onclick="window.simulateNewApplicant()" style="font-size:0.7rem; padding:4px 10px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:var(--text-main)">
            ${dict['loan_queue_btn_simulate'] || "Simula Pedido di Tercera Persona"}
          </button>
        </div>
      </div>
      
      <div style="overflow-x:auto">
        <table style="width:100%; border-collapse:collapse; text-align:left">
          <thead>
            <tr style="border-bottom:1.5px solid rgba(255,255,255,0.1); font-size:0.7rem; text-transform:uppercase; color:var(--text-muted)">
              <th style="padding:0.4rem 0.5rem; text-align:left">${dict['loan_queue_col_name'] || "Solicitante"}</th>
              <th style="padding:0.4rem 0.5rem; text-align:right">${dict['loan_queue_col_amount'] || "Monto Pidi"}</th>
              <th style="padding:0.4rem 0.5rem; text-align:center">${dict['loan_queue_col_status'] || "Estado"}</th>
              <th style="padding:0.4rem 0.5rem; text-align:center">${dict['loan_queue_col_action'] || "Accion"}</th>
            </tr>
          </thead>
          <tbody>
            ${queueRowsHtml || `<tr><td colspan="4" style="text-align:center; padding:1.5rem; color:var(--text-muted); font-size:0.75rem;">No hay solicitudes en la fila.</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;
  
  container.innerHTML = `
    <div class="grid-2-1">
      <!-- Aprobaciones de Conductores -->
      <section class="card purple-accent">
        <h2 class="card-title">Solicitudes de Repartidores</h2>
        <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:1.5rem">Revisa los documentos de identidad y aprueba choferes para la flota Sabí.</p>
        
        <div id="pending-drivers-list">
          ${requestsHtml}
        </div>
      </section>
      
      <!-- Finanzas y Métricas Platform -->
      <div style="display:flex; flex-direction:column; gap:1.5rem">
        <section class="card gold-accent">
          <h2 class="card-title">Métricas de la Plataforma Sabí</h2>
          <div class="wallet-box" style="background:rgba(255, 224, 0, 0.06); border:1px dashed var(--neon-gold); padding:1.25rem; border-radius:12px; text-align:center; margin-bottom:1.25rem">
            <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px">Comisiones Acumuladas Sabí (15%)</div>
            <div style="font-size:2.2rem; font-weight:800; color:var(--neon-gold); margin-top:0.25rem">
              Afl. ${appState.adminEarnings.toFixed(2)}
            </div>
            <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.5rem">Ingresos netos de comisión retenida de los envíos locales.</p>
          </div>
          
          <div style="background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); padding:1rem; border-radius:12px; font-size:0.85rem; margin-bottom:1.25rem">
            <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem">
              <span style="color:var(--text-muted)">Conductores Flota:</span>
              <span style="font-weight:700">${approvedCount} Aprobados</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem">
              <span style="color:var(--text-muted)">Choferes en Espera:</span>
              <span style="font-weight:700">${pendingCount} Pendientes</span>
            </div>
          </div>
          
          <button class="btn btn-full btn-cyan" style="background:var(--neon-cyan); border-color:var(--neon-cyan); color:#000;" onclick="window.simulateWeeklyPayout()">
            🏦 Corte de Caja (Viernes)
          </button>
        </section>
        
        <section class="card cyan-accent">
          <h2 class="card-title">Simulación del Sistema</h2>
          <p style="font-size:0.8rem; color:var(--text-muted); line-height:1.5; margin-bottom:1rem">
            Este panel administra el negocio de delivery. Los fondos cobrados se depositan temporalmente en la cuenta de Sabí N.V. y se cortan semanalmente.
          </p>
          <button class="btn btn-full" style="background:rgba(255,255,255,0.05); border:1px solid var(--glass-border);" onclick="window.resetDriverSystemState()">
            🔄 Restablecer Todo el Sistema Delivery
          </button>
        </section>
      </div>
    </div>

    ${queueHtml}
  `;
}

// Admin action handlers
function approveDriver(id) {
  SoundEffects.playJingle();
  const driver = appState.pendingDrivers.find(d => d.id === id);
  if (driver) {
    appState.driverStatus = 'approved';
    appState.driverInfo = {
      name: driver.name,
      car: driver.car,
      license: driver.license,
      photo: driver.photo
    };
    
    localStorage.setItem('sabi_driver_status', 'approved');
    localStorage.setItem('sabi_driver_info', JSON.stringify(appState.driverInfo));
  }
  
  appState.pendingDrivers = appState.pendingDrivers.filter(d => d.id !== id);
  localStorage.setItem('sabi_pending_drivers', JSON.stringify(appState.pendingDrivers));
  
  showToast("Conductor Aprobado", "El conductor ha sido aprobado y tiene acceso a su Consola.");
  renderAdminDashboard();
}

function rejectDriver(id) {
  SoundEffects.playClick();
  const driver = appState.pendingDrivers.find(d => d.id === id);
  if (driver) {
    appState.driverStatus = 'unregistered';
    appState.driverInfo = null;
    localStorage.setItem('sabi_driver_status', 'unregistered');
    localStorage.removeItem('sabi_driver_info');
  }
  
  appState.pendingDrivers = appState.pendingDrivers.filter(d => d.id !== id);
  localStorage.setItem('sabi_pending_drivers', JSON.stringify(appState.pendingDrivers));
  
  showToast("Solicitud Rechazada", "La solicitud del conductor ha sido rechazada.");
  renderAdminDashboard();
}

function simulateWeeklyPayout() {
  if (appState.adminEarnings <= 0) {
    showToast("Sin Fondos", "No hay comisiones acumuladas para retirar.");
    return;
  }
  
  SoundEffects.playJingle();
  const amount = appState.adminEarnings;
  appState.adminEarnings = 0.00;
  localStorage.setItem('sabi_admin_earnings', '0');
  
  showToast(
    "Corte de Caja Exitoso", 
    `Se transfirieron Afl. ${amount.toFixed(2)} AWG a la cuenta de Sabí Super-App N.V. en el Aruba Bank.`
  );
  renderAdminDashboard();
}

function resetDriverSystemState() {
  SoundEffects.playClick();
  
  appState.driverStatus = 'unregistered';
  appState.driverActive = false;
  appState.driverWallet = 0.00;
  appState.driverInfo = null;
  appState.adminEarnings = 0.00;
  appState.pendingDrivers = [];
  appState.activeTrip = null;
  isAnimating = false;
  if (gpsAnimationId) cancelAnimationFrame(gpsAnimationId);
  
  localStorage.removeItem('sabi_driver_status');
  localStorage.removeItem('sabi_driver_active');
  localStorage.removeItem('sabi_driver_wallet');
  localStorage.removeItem('sabi_driver_info');
  localStorage.removeItem('sabi_admin_earnings');
  localStorage.removeItem('sabi_pending_drivers');
  localStorage.removeItem('sabi_active_trip');
  localStorage.removeItem('sabi_driver_trips_completed');
  
  const physicalCats = ['vehiculos', 'ropa', 'electronica', 'joyeria', 'hogar'];
  appState.marketplaceAds.forEach(ad => {
    if (physicalCats.includes(ad.category)) {
      ad.deliveryEnabled = true;
    }
  });
  localStorage.setItem('sabi_marketplace_ads', JSON.stringify(appState.marketplaceAds));
  
  showToast("Sistema Reiniciado", "El historial de delivery y billeteras ha sido restablecido.");
  switchComunidadTab(appState.activeComunidadTab);
}

// ==================== LLEGADAS DE VUELOS Y CRUCEROS (AEROPUERTO & PUERTO) ====================

// Switcher for inner Vuelos / Cruceros tabs
function switchLlegadasSubTab(subTab) {
  if (!subTab) return;
  appState.activeLlegadasSubTab = subTab;
  SoundEffects.playClick();
  
  document.querySelectorAll(".llegadas-subtab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.llegadasSubtab === subTab);
  });
  
  renderArrivalsTab();
}

// Render the arrivals list and triggers statistics dashboard update
function renderArrivalsTab() {
  const container = document.getElementById("llegadas-items-container");
  if (!container) return;
  
  const lang = appState.language || 'es';
  const dict = SABI_TRANSLATIONS[lang];
  
  const period = document.getElementById("llegadas-period-filter").value;
  const subTab = appState.activeLlegadasSubTab || 'vuelos';
  
  const dataList = SABI_DATA.comercio.arrivalsDb[subTab][period];
  if (!dataList) return;
  
  if (subTab === 'vuelos') {
    if (period === 'today') {
      container.innerHTML = dataList.map(item => {
        let statusColor = "var(--neon-cyan)";
        if (item.status === 'Delayed') statusColor = "var(--neon-pink)";
        else if (item.status === 'Landed') statusColor = "rgba(255,255,255,0.4)";
        
        let statusLabel = item.status;
        if (item.status === 'Delayed') statusLabel = dict.arrivals_status_delayed || 'Delayed';
        else if (item.status === 'Landed') statusLabel = dict.arrivals_status_landed || 'Landed';
        else if (item.status === 'Expected') statusLabel = dict.arrivals_status_expected || 'Expected';
        else if (item.status === 'Completed') statusLabel = dict.arrivals_status_completed || 'Completed';
        else if (item.status === 'In Transit') statusLabel = dict.arrivals_status_intransit || 'In Transit';
        
        return `
          <div style="background:rgba(255,255,255,0.015); border:1px solid var(--glass-border); padding:1rem; border-radius:14px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-weight:800; font-size:1.05rem; color:var(--text-main)">✈️ ${item.flightNo}</div>
              <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.15rem">${item.airline} | ${dict.arrivals_origin || 'Origen'}: <strong>${item.origin}</strong></div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:800; color:var(--neon-gold); font-size:0.95rem">${item.time}</div>
              <span class="turno-badge-inline" style="background:rgba(0,0,0,0.3); border-color: ${statusColor}; color: ${statusColor}; font-size:0.7rem; padding:2px 8px; margin-top:0.25rem; display:inline-block">${statusLabel}</span>
              <div style="font-size:0.7rem; color:var(--text-muted); margin-top:0.15rem">${item.terminal}</div>
            </div>
          </div>
        `;
      }).join('');
    } else if (period === 'weekly') {
      container.innerHTML = dataList.map(item => {
        let statusLabel = item.status;
        if (item.status === 'Delayed') statusLabel = dict.arrivals_status_delayed || 'Delayed';
        else if (item.status === 'Landed') statusLabel = dict.arrivals_status_landed || 'Landed';
        else if (item.status === 'Expected') statusLabel = dict.arrivals_status_expected || 'Expected';
        else if (item.status === 'Completed') statusLabel = dict.arrivals_status_completed || 'Completed';
        else if (item.status === 'In Transit') statusLabel = dict.arrivals_status_intransit || 'In Transit';
        
        return `
          <div style="background:rgba(255,255,255,0.015); border:1px solid var(--glass-border); padding:1rem; border-radius:14px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:0.8rem; color:var(--neon-cyan); font-weight:700; text-transform:uppercase">${item.day}</div>
              <div style="font-weight:800; font-size:1.05rem; color:var(--text-main); margin-top:0.15rem">✈️ ${item.flightNo}</div>
              <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.15rem">${item.airline} | ${dict.arrivals_origin || 'Origen'}: <strong>${item.origin}</strong></div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:800; color:var(--neon-gold); font-size:0.95rem">${item.time}</div>
              <span class="turno-badge-inline" style="background:rgba(0,0,0,0.3); border-color: var(--neon-cyan); color: var(--neon-cyan); font-size:0.7rem; padding:2px 8px; margin-top:0.25rem; display:inline-block">${statusLabel}</span>
            </div>
          </div>
        `;
      }).join('');
    } else if (period === 'monthly') {
      container.innerHTML = dataList.map(item => `
        <div style="background:rgba(255,255,255,0.015); border:1px solid var(--glass-border); padding:1.2rem; border-radius:14px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem">
            <span style="font-size:0.8rem; color:var(--neon-gold); font-weight:800; text-transform:uppercase">${item.period}</span>
            <span class="turno-badge-inline" style="font-size:0.75rem">${item.totalWeekly}</span>
          </div>
          <div style="font-weight:800; font-size:1.1rem; color:var(--text-main)">${item.flightNo}</div>
          <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.25rem">${dict.arrivals_main_airlines || 'Líneas principales'}: ${item.airline}</div>
          <div style="font-size:0.8rem; color:var(--text-muted);">${dict.arrivals_origin || 'Origen'}: ${item.origin} | ${dict.arrivals_avg_load || 'Ocupación promedio'}: <strong style="color:var(--neon-cyan)">${item.avgLoad}</strong></div>
        </div>
      `).join('');
    }
  } else if (subTab === 'cruceros') {
    if (period === 'today') {
      container.innerHTML = dataList.map(item => {
        let statusLabel = item.status;
        if (item.status === 'Delayed') statusLabel = dict.arrivals_status_delayed || 'Delayed';
        else if (item.status === 'Landed') statusLabel = dict.arrivals_status_landed || 'Landed';
        else if (item.status === 'Expected') statusLabel = dict.arrivals_status_expected || 'Expected';
        else if (item.status === 'Completed') statusLabel = dict.arrivals_status_completed || 'Completed';
        else if (item.status === 'In Transit') statusLabel = dict.arrivals_status_intransit || 'In Transit';
        
        return `
          <div style="background:rgba(255,255,255,0.015); border:1px solid var(--glass-border); padding:1rem; border-radius:14px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-weight:800; font-size:1.05rem; color:var(--text-main)">🚢 ${item.ship}</div>
              <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.15rem">${item.cruiseLine} | ${dict.arrivals_capacity || 'Capacidad'}: <strong>${item.passengers.toLocaleString()} pax</strong></div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:800; color:var(--neon-gold); font-size:0.95rem">${item.time}</div>
              <span class="turno-badge-inline" style="background:rgba(0,0,0,0.3); border-color: var(--neon-cyan); color: var(--neon-cyan); font-size:0.7rem; padding:2px 8px; margin-top:0.25rem; display:inline-block">${statusLabel}</span>
              <div style="font-size:0.7rem; color:var(--text-muted); margin-top:0.15rem">${item.port}</div>
            </div>
          </div>
        `;
      }).join('');
    } else if (period === 'weekly') {
      container.innerHTML = dataList.map(item => {
        let statusColor = "var(--neon-cyan)";
        if (item.status === 'Expected') statusColor = "var(--neon-gold)";
        else if (item.status === 'Completed') statusColor = "rgba(255,255,255,0.3)";
        
        let statusLabel = item.status;
        if (item.status === 'Delayed') statusLabel = dict.arrivals_status_delayed || 'Delayed';
        else if (item.status === 'Landed') statusLabel = dict.arrivals_status_landed || 'Landed';
        else if (item.status === 'Expected') statusLabel = dict.arrivals_status_expected || 'Expected';
        else if (item.status === 'Completed') statusLabel = dict.arrivals_status_completed || 'Completed';
        else if (item.status === 'In Transit') statusLabel = dict.arrivals_status_intransit || 'In Transit';
        
        return `
          <div style="background:rgba(255,255,255,0.015); border:1px solid var(--glass-border); padding:1rem; border-radius:14px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:0.8rem; color:var(--neon-cyan); font-weight:700; text-transform:uppercase">${item.day}</div>
              <div style="font-weight:800; font-size:1.05rem; color:var(--text-main); margin-top:0.15rem">🚢 ${item.ship}</div>
              <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.15rem">${item.cruiseLine} | ${dict.arrivals_capacity || 'Capacidad'}: <strong>${item.passengers.toLocaleString()} pax</strong></div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:800; color:var(--neon-gold); font-size:0.95rem">${item.time}</div>
              <span class="turno-badge-inline" style="background:rgba(0,0,0,0.3); border-color: ${statusColor}; color: ${statusColor}; font-size:0.7rem; padding:2px 8px; margin-top:0.25rem; display:inline-block">${statusLabel}</span>
            </div>
          </div>
        `;
      }).join('');
    } else if (period === 'monthly') {
      container.innerHTML = dataList.map(item => `
        <div style="background:rgba(255,255,255,0.015); border:1px solid var(--glass-border); padding:1.2rem; border-radius:14px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem">
            <span style="font-size:0.8rem; color:var(--neon-gold); font-weight:800; text-transform:uppercase">${item.period}</span>
            <span class="turno-badge-inline" style="font-size:0.75rem; background:rgba(0,245,212,0.15); border-color:var(--neon-cyan); color:var(--neon-cyan)">${item.ecoImpact}</span>
          </div>
          <div style="font-weight:800; font-size:1.1rem; color:var(--text-main)">${item.ship}</div>
          <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.25rem">${dict.arrivals_main_cruiselines || 'Líneas en tránsito'}: ${item.cruiseLine}</div>
          <div style="font-size:0.8rem; color:var(--text-muted);">${dict.arrivals_passengers || 'Pasajeros'}: <strong style="color:var(--text-main)">${item.passengers.toLocaleString()} pax</strong> | ${dict.arrivals_avg_stay || 'Estancia'}: ${item.avgStay}</div>
        </div>
      `).join('');
    }
  }
  
  // Render stats and recommendations
  renderArrivalsDashboard(subTab, period);
}

function renderArrivalsDashboard(subTab, period) {
  const statsCard = document.getElementById("llegadas-stats-card");
  const infoCard = document.getElementById("llegadas-info-card");
  if (!statsCard || !infoCard) return;
  
  const lang = appState.language || 'es';
  const dict = SABI_TRANSLATIONS[lang];
  
  if (subTab === 'vuelos') {
    // Datos reales de AviationStack via Supabase
    const flightsData = SABI_DATA?.comercio?.flightsToday;
    const totalFlights = flightsData?.totalArrivals ?? '—';
    const onTimePct = flightsData?.onTimePct !== undefined ? `${flightsData.onTimePct}%` : '—';
    const flightsRaw = SABI_DATA?.comercio?.arrivalsDb?.vuelos?.today || [];

    // Calcular hora pico real (franja con más vuelos)
    let peakHour = '—';
    if (flightsRaw.length > 0) {
      const hourCount = {};
      flightsRaw.forEach(f => {
        const h = (f.time || f.scheduled_time || '').substring(0, 2);
        if (h) hourCount[h] = (hourCount[h] || 0) + 1;
      });
      const peakH = Object.entries(hourCount).sort((a,b) => b[1]-a[1])[0]?.[0];
      if (peakH) peakHour = `${peakH}:00 - ${String(parseInt(peakH)+2).padStart(2,'0')}:00`;
    }

    if (period === 'today') {
      statsCard.innerHTML = `
        <h2 class="card-title" style="color:var(--neon-gold)">${dict.arrivals_airport_title || 'Aeropuerto Reina Beatrix'}</h2>
        <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-top:1rem">Vuelos Llegando Hoy</div>
        <div style="display:flex; align-items:baseline; gap:0.5rem; margin-top:0.25rem">
          <div style="font-size:2.4rem; font-weight:800; color:var(--neon-gold)">${totalFlights}</div>
          <div style="font-size:1rem; color:var(--neon-gold); font-weight:600">Vuelos</div>
          <span style="font-size:0.65rem; color:#4ade80; background:rgba(74,222,128,0.1); border:1px solid rgba(74,222,128,0.3); border-radius:4px; padding:2px 6px; margin-left:0.25rem">● En vivo</span>
        </div>
        
        <div style="background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); padding:1rem; border-radius:12px; font-size:0.85rem; margin-top:1.25rem">
          <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem">
            <span style="color:var(--text-muted)">${dict.arrivals_flights_arriving || 'Vuelos Arribando'}:</span>
            <span style="font-weight:700">${totalFlights} vuelos</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem">
            <span style="color:var(--text-muted)">Puntualidad:</span>
            <span style="font-weight:700; color:var(--neon-cyan)">${onTimePct} a tiempo</span>
          </div>
          <div style="display:flex; justify-content:space-between">
            <span style="color:var(--text-muted)">${dict.arrivals_peak_hour || 'Hora Pico de Flujo'}:</span>
            <span style="font-weight:700">${peakHour}</span>
          </div>
        </div>
      `;
      
      infoCard.innerHTML = `
        <h2 class="card-title">${dict.arrivals_taxi_tips_title || 'Consejos para Operadores y Taxis'}</h2>
        <p style="font-size:0.85rem; color:var(--text-muted); line-height:1.5; margin-bottom:1rem">
          ${dict.arrivals_taxi_tips_desc || 'Se espera un alto flujo de pasajeros provenientes de EE.UU. entre las 12:00 PM y las 3:00 PM. Se recomienda a los taxistas posicionarse en la terminal norte.'}
        </p>
        <div style="background:rgba(0, 245, 212, 0.08); border:1px dashed var(--neon-cyan); padding:0.85rem; border-radius:10px; font-size:0.75rem; color:var(--text-main)">
          💡 <strong>${dict.arrivals_exemption_title || 'Exención Aduanera'}:</strong> ${dict.arrivals_exemption_desc || 'Los viajeros pueden ingresar compras libres de impuestos personales por un valor máximo de hasta Afl. 400.00.'}
        </div>
      `;
    } else if (period === 'weekly') {
      statsCard.innerHTML = `
        <h2 class="card-title" style="color:var(--neon-gold)">${dict.arrivals_weekly_proj_title || 'Proyección Semanal'}</h2>
        <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-top:1rem">${dict.arrivals_weekly_flights_label || 'Vuelos de la Semana'}</div>
        <div style="font-size:2.4rem; font-weight:800; color:var(--neon-gold); margin-top:0.25rem">${dict.arrivals_weekly_flights_val || '182 Arribos'}</div>
        
        <div style="background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); padding:1rem; border-radius:12px; font-size:0.85rem; margin-top:1.25rem">
          <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem">
            <span style="color:var(--text-muted)">${dict.arrivals_weekly_pax_lbl || 'Pax Estimados'}:</span>
            <span style="font-weight:700">${dict.arrivals_weekly_pax_val || '36,400 turistas'}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem">
            <span style="color:var(--text-muted)">${dict.arrivals_weekly_peak_day_lbl || 'Día de Mayor Flujo'}:</span>
            <span style="font-weight:700; color:var(--neon-cyan)">${dict.arrivals_weekly_peak_day_val || 'Sábado (32 vuelos)'}</span>
          </div>
          <div style="display:flex; justify-content:space-between">
            <span style="color:var(--text-muted)">${dict.arrivals_weekly_origin_lbl || 'Origen Principal'}:</span>
            <span style="font-weight:700">${dict.arrivals_weekly_origin_val || 'Miami / JFK'}</span>
          </div>
        </div>
      `;
      
      infoCard.innerHTML = `
        <h2 class="card-title">${dict.arrivals_weekly_tips_title || 'Planificación Turística'}</h2>
        <p style="font-size:0.85rem; color:var(--text-muted); line-height:1.5; margin-bottom:1rem">
          ${dict.arrivals_weekly_tips_desc || 'El fin de semana (especialmente el sábado) registra el 35% del volumen semanal de arribos. Agencias de rentas de autos y transfers deben reforzar su flota en el aeropuerto.'}
        </p>
        <div style="background:rgba(0, 245, 212, 0.08); border:1px dashed var(--neon-cyan); padding:0.85rem; border-radius:10px; font-size:0.75rem; color:var(--text-main)">
          ✈️ <strong>${dict.arrivals_us_terminal_title || 'Terminal de EE.UU.'}:</strong> ${dict.arrivals_us_terminal_desc || 'El pre-despacho de aduanas de EE.UU. (US Preclearance) opera regularmente desde las 8:00 AM.'}
        </div>
      `;
    } else if (period === 'monthly') {
      statsCard.innerHTML = `
        <h2 class="card-title" style="color:var(--neon-gold)">${dict.arrivals_monthly_est_title || 'Estimado Mensual (Junio)'}</h2>
        <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-top:1rem">${dict.arrivals_monthly_pax_label || 'Total Pasajeros del Mes'}</div>
        <div style="font-size:2.2rem; font-weight:800; color:var(--neon-gold); margin-top:0.25rem">${dict.arrivals_monthly_pax_val || '156,000 Pax'}</div>
        
        <div style="background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); padding:1rem; border-radius:12px; font-size:0.85rem; margin-top:1.25rem">
          <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem">
            <span style="color:var(--text-muted)">${dict.arrivals_monthly_flights_lbl || 'Vuelos Entrantes'}:</span>
            <span style="font-weight:700">${dict.arrivals_monthly_flights_val || '780 vuelos'}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem">
            <span style="color:var(--text-muted)">${dict.arrivals_monthly_occ_lbl || 'Ocupación Hotelera'}:</span>
            <span style="font-weight:700">${dict.arrivals_monthly_occ_val || '89% Noord / 78% Play'}</span>
          </div>
          <div style="display:flex; justify-content:space-between">
            <span style="color:var(--text-muted)">${dict.arrivals_monthly_leader_lbl || 'Aerolínea Líder'}:</span>
            <span style="font-weight:700">${dict.arrivals_monthly_leader_val || 'American Airlines'}</span>
          </div>
        </div>
      `;
      
      infoCard.innerHTML = `
        <h2 class="card-title">${dict.arrivals_monthly_tips_title || 'Métricas de Ocupación'}</h2>
        <p style="font-size:0.85rem; color:var(--text-muted); line-height:1.5; margin-bottom:1rem">
          ${dict.arrivals_monthly_tips_desc || 'La afluencia hotelera del mes se concentra fuertemente en el distrito de Noord (Palm Beach y Eagle Beach), impulsando el consumo nocturno en restaurantes de esa franja.'}
        </p>
      `;
    }
  } else if (subTab === 'cruceros') {
    if (period === 'today') {
      statsCard.innerHTML = `
        <h2 class="card-title" style="color:var(--neon-cyan)">${dict.arrivals_port_title || 'Puerto de Oranjestad'}</h2>
        <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-top:1rem">${dict.arrivals_cruisers_today_label || 'Cruceristas en Puerto Hoy'}</div>
        <div style="font-size:2.4rem; font-weight:800; color:var(--neon-cyan); margin-top:0.25rem">${dict.arrivals_cruisers_today_val || '5,600 Pax'}</div>
        
        <div style="background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); padding:1rem; border-radius:12px; font-size:0.85rem; margin-top:1.25rem">
          <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem">
            <span style="color:var(--text-muted)">${dict.arrivals_ships_port_lbl || 'Barcos en Puerto'}:</span>
            <span style="font-weight:700">${dict.arrivals_ships_port_val || '2 Cruceros'}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem">
            <span style="color:var(--text-muted)">${dict.arrivals_econ_impact_lbl || 'Inyección Económica'}:</span>
            <span style="font-weight:700; color:var(--neon-gold)">${dict.arrivals_econ_impact_val || 'Est. $672,000 USD'}</span>
          </div>
          <div style="display:flex; justify-content:space-between">
            <span style="color:var(--text-muted)">${dict.arrivals_avg_spend_lbl || 'Gasto Promedio/Pax'}:</span>
            <span style="font-weight:700">${dict.arrivals_avg_spend_val || '$120.00 USD'}</span>
          </div>
        </div>
      `;
      
      infoCard.innerHTML = `
        <h2 class="card-title">${dict.arrivals_commerce_tips_title || 'Consejos para Comercios locales'}</h2>
        <p style="font-size:0.85rem; color:var(--text-muted); line-height:1.5; margin-bottom:1rem">
          ${dict.arrivals_commerce_tips_desc || 'El tránsito de peatones en la zona centro de Oranjestad estará sumamente activo entre las 9:00 AM y las 3:00 PM. Tiendas en L.G. Smith Blvd y Main Street verán una gran demanda.'}
        </p>
        <div style="background:rgba(255, 224, 0, 0.08); border:1px dashed var(--neon-gold); padding:0.85rem; border-radius:10px; font-size:0.75rem; color:var(--text-main)">
          🛍️ <strong>${dict.arrivals_local_commerce_title || 'Comercio local'}:</strong> ${dict.arrivals_local_commerce_desc || 'Los cruceristas buscan principalmente joyería fina, artesanías locales y productos de Aloe Vera de Aruba.'}
        </div>
      `;
    } else if (period === 'weekly') {
      statsCard.innerHTML = `
        <h2 class="card-title" style="color:var(--neon-cyan)">${dict.arrivals_port_weekly_title || 'Puerto: Itinerario Semanal'}</h2>
        <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-top:1rem">${dict.arrivals_weekly_cruisers_lbl || 'Cruceristas de la Semana'}</div>
        <div style="font-size:2.4rem; font-weight:800; color:var(--neon-cyan); margin-top:0.25rem">${dict.arrivals_weekly_cruisers_val || '15,070 Pax'}</div>
        
        <div style="background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); padding:1rem; border-radius:12px; font-size:0.85rem; margin-top:1.25rem">
          <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem">
            <span style="color:var(--text-muted)">${dict.arrivals_scheduled_cruises_lbl || 'Cruceros Programados'}:</span>
            <span style="font-weight:700">${dict.arrivals_scheduled_cruises_val || '5 Cruceros'}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem">
            <span style="color:var(--text-muted)">${dict.arrivals_weekly_impact_lbl || 'Impacto Financiero'}:</span>
            <span style="font-weight:700; color:var(--neon-gold)">${dict.arrivals_weekly_impact_val || 'Est. $1.8M AWG'}</span>
          </div>
          <div style="display:flex; justify-content:space-between">
            <span style="color:var(--text-muted)">${dict.arrivals_largest_ship_lbl || 'Barco Más Grande'}:</span>
            <span style="font-weight:700">${dict.arrivals_largest_ship_val || 'Disney Fantasy (4,000 pax)'}</span>
          </div>
        </div>
      `;
      
      infoCard.innerHTML = `
        <h2 class="card-title">${dict.arrivals_port_logistics_title || 'Logística de Puerto'}</h2>
        <p style="font-size:0.85rem; color:var(--text-muted); line-height:1.5; margin-bottom:1rem">
          ${dict.arrivals_port_logistics_desc || 'El viernes se espera el mayor volumen de turistas simultáneos por el Disney Fantasy. Tour operadores en Oranjestad deben prever autobuses suficientes para excursiones a las ruinas de oro y playas del norte.'}
        </p>
      `;
    } else if (period === 'monthly') {
      statsCard.innerHTML = `
        <h2 class="card-title" style="color:var(--neon-cyan)">${dict.arrivals_port_monthly_title || 'Puerto: Proyección Mensual'}</h2>
        <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-top:1rem">${dict.arrivals_monthly_cruisers_lbl || 'Total Turistas por Puerto'}</div>
        <div style="font-size:2.2rem; font-weight:800; color:var(--neon-cyan); margin-top:0.25rem">${dict.arrivals_monthly_cruisers_val || '67,290 Pax'}</div>
        
        <div style="background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); padding:1rem; border-radius:12px; font-size:0.85rem; margin-top:1.25rem">
          <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem">
            <span style="color:var(--text-muted)">${dict.arrivals_monthly_ships_lbl || 'Total Barcos del Mes'}:</span>
            <span style="font-weight:700">${dict.arrivals_monthly_ships_val || '22 barcos'}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem">
            <span style="color:var(--text-muted)">${dict.arrivals_monthly_impact_lbl || 'Impacto Económico Directo'}:</span>
            <span style="font-weight:700; color:var(--neon-gold)">${dict.arrivals_monthly_impact_val || 'Est. $8.1M AWG'}</span>
          </div>
          <div style="display:flex; justify-content:space-between">
            <span style="color:var(--text-muted)">${dict.arrivals_most_frequent_line_lbl || 'Línea Más Frecuente'}:</span>
            <span style="font-weight:700">${dict.arrivals_most_frequent_line_val || 'Royal Caribbean Group'}</span>
          </div>
        </div>
      `;
      
      infoCard.innerHTML = `
        <h2 class="card-title">${dict.arrivals_gdp_impact_title || 'Impacto en el PIB Comercial'}</h2>
        <p style="font-size:0.85rem; color:var(--text-muted); line-height:1.5; margin-bottom:1rem">
          ${dict.arrivals_gdp_impact_desc || 'El turismo de cruceros representa aproximadamente el 22% de la inyección directa al comercio minorista de la isla. Las estadísticas del mes indican un repunte en el gasto en restaurantes locales y boutiques tradicionales de la capital.'}
        </p>
      `;
    }
  }
}

// ==================== NEW CUSTOM DELIVERY REQUEST SYSTEM ====================

function renderDeliveryRequestPortal() {
  const container = document.getElementById("comunidad-content-delivery");
  if (!container) return;

  const lang = appState.language || 'es';
  const dict = SABI_TRANSLATIONS[lang];

  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes().toString().padStart(2, '0');
  const isNight = (hour >= 20 || hour < 6);
  const basePrice = isNight ? 18.00 : 12.00;

  const nightLabel = {
    es: "🌙 Tarifa Nocturna Activa",
    en: "🌙 Night Fare Active",
    nl: "🌙 Nachttarief Actief",
    pap: "🌙 Tarifa di Anochi Activa"
  };
  const dayLabel = {
    es: "☀️ Tarifa Diurna Activa",
    en: "☀️ Day Fare Active",
    nl: "☀️ Dagtarief Actief",
    pap: "☀️ Tarifa di Dia Activa"
  };

  const tariffLabel = isNight 
    ? `<span style="background:rgba(255,0,128,0.08); border:1px solid var(--neon-pink); color:var(--neon-pink); padding:2px 10px; border-radius:30px; font-size:0.75rem; font-weight:800;">${nightLabel[lang]}</span>` 
    : `<span style="background:rgba(0,243,255,0.08); border:1px solid var(--neon-cyan); color:var(--neon-cyan); padding:2px 10px; border-radius:30px; font-size:0.75rem; font-weight:800;">${dayLabel[lang]}</span>`;

  const deliveriesListHtml = appState.customDeliveries.length === 0 
    ? `<div style="text-align:center; color:var(--text-muted); font-size:0.85rem; padding:2rem 0">${dict.no_recent_orders}</div>` 
    : appState.customDeliveries.map(d => {
        let statusText = dict.status_searching;
        let statusColor = "var(--neon-gold)";
        
        if (d.status === 'assigned') {
          statusText = dict.status_assigned;
          statusColor = "var(--neon-cyan)";
        } else if (d.status === 'transit') {
          statusText = dict.status_transit;
          statusColor = "var(--neon-gold)";
        } else if (d.status === 'delivered') {
          statusText = dict.status_delivered;
          statusColor = "var(--neon-emerald)";
        }

        const sizeLabel = d.size ? (d.size === 'light' ? dict.size_light : (d.size === 'medium' ? dict.size_medium : dict.size_heavy)) : '';

        return `
          <div class="league-box" style="margin-bottom:0.75rem; border-left:3px solid ${statusColor}; background:rgba(255,255,255,0.01); text-align:left; padding:0.75rem 1rem">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem">
              <div>
                <div style="font-weight:700; color:var(--text-main); font-size:0.9rem">${d.title}</div>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px; line-height:1.3">
                  📍 ${lang === 'es' ? 'Origen' : (lang === 'pap' ? 'Origen' : (lang === 'nl' ? 'Oorsprong' : 'Origin'))}: <strong>${d.pickupAddress || 'No especificada'}</strong><br/>
                  🎯 ${lang === 'es' ? 'Destino' : (lang === 'pap' ? 'Destino' : (lang === 'nl' ? 'Bestemming' : 'Destination'))}: <strong>${d.address}</strong>
                </div>
              </div>
              <span style="font-size:0.8rem; font-weight:800; color:${statusColor}; white-space:nowrap">${statusText}</span>
            </div>
            <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.4rem; padding-top:0.4rem; border-top:1px solid rgba(255,255,255,0.04); line-height:1.4">${d.desc}</div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.4rem; font-size:0.72rem; gap:0.5rem">
              <span style="color:var(--text-muted)">GPS: <strong style="color:var(--neon-cyan)">${d.coords === 'No compartida' ? dict.gps_status_none : dict.gps_status_shared}</strong> ${sizeLabel ? `• 📦 ${sizeLabel}` : ''}</span>
              <span style="font-weight:800; color:var(--text-main); font-size:0.8rem">${lang === 'es' ? 'Tarifa' : (lang === 'pap' ? 'Tarifa' : (lang === 'nl' ? 'Tarief' : 'Fare'))}: Afl. ${d.price.toFixed(2)}</span>
            </div>
          </div>
        `;
      }).join('');

  container.innerHTML = `
    <div class="grid-2-1">
      <!-- Columna izquierda: Formulario de Pedido -->
      <section class="card purple-accent">
        <h2 class="card-title">${dict.custom_delivery_title}</h2>
        <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:1.5rem">
          ${dict.custom_delivery_subtitle}
        </p>

        <form id="delivery-request-form" onsubmit="event.preventDefault(); window.handleCustomDeliverySubmit();">
          <div class="form-group">
            <label for="delivery-name">${dict.label_name}</label>
            <input type="text" class="text-input" id="delivery-name" placeholder="${dict.placeholder_name}" required>
          </div>

          <div class="form-group">
            <label>${dict.label_gps}</label>
            <div style="display:flex; align-items:center; gap:0.75rem; margin-top:0.25rem">
              <button type="button" class="btn btn-sm" id="delivery-gps-btn" onclick="window.handleDeliveryGpsShare()" style="background:rgba(0,243,255,0.08); border:1px solid var(--neon-cyan); color:var(--neon-cyan); padding:8px 15px">
                ${dict.btn_gps}
              </button>
              <span id="delivery-gps-status" style="font-size:0.8rem; color:var(--text-muted)">${dict.gps_status_none}</span>
            </div>
            <input type="hidden" id="delivery-coords" value="No compartida">
          </div>

          <div class="form-group">
            <label for="delivery-title">${dict.label_delivery_title}</label>
            <input type="text" class="text-input" id="delivery-title" placeholder="${dict.placeholder_delivery_title}" required>
          </div>

          <div class="form-group">
            <label for="delivery-desc">${dict.label_delivery_desc}</label>
            <textarea class="text-input" id="delivery-desc" rows="3" placeholder="${dict.placeholder_delivery_desc}" required style="resize:vertical"></textarea>
          </div>

          <div class="form-group">
            <label for="delivery-pickup-address">${dict.label_pickup_address}</label>
            <input type="text" class="text-input" id="delivery-pickup-address" placeholder="${dict.placeholder_pickup_address}" required style="margin-bottom:0.75rem">
            
            <label for="delivery-address">${dict.label_delivery_address}</label>
            <input type="text" class="text-input" id="delivery-address" placeholder="${dict.placeholder_delivery_address}" required>
          </div>

          <div class="form-group">
            <label for="delivery-size">${dict.label_package_size}</label>
            <select class="select-input" id="delivery-size" onchange="window.updateCustomDeliveryPrice()" style="width:100%">
              <option value="light">${dict.size_light}</option>
              <option value="medium">${dict.size_medium}</option>
              <option value="heavy">${dict.size_heavy}</option>
            </select>
          </div>

          <div class="form-group">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem">
              <label style="margin-bottom:0">${dict.label_fare}</label>
              ${tariffLabel}
            </div>
            <input type="text" class="text-input" id="delivery-price" readonly style="background:rgba(255,255,255,0.05); color:var(--neon-cyan); font-weight:800;" value="Afl. ${basePrice.toFixed(2)}">
            <p style="font-size:0.7rem; color:var(--text-muted); margin-top:0.25rem; line-height:1.3" id="delivery-tariff-desc">
              ${dict.delivery_desc_note} Hora local: ${hour.toString().padStart(2, '0')}:${minute}.
            </p>
          </div>

          <button type="submit" class="btn btn-cyan btn-full" style="margin-top:1.25rem">
            ${dict.btn_send_delivery}
          </button>
        </form>
      </section>

      <!-- Columna derecha: Pedidos Recientes -->
      <div style="display:flex; flex-direction:column; gap:1.5rem">
        <section class="card cyan-accent">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem">
            <h2 class="card-title" style="margin-bottom:0">${dict.history_title}</h2>
            ${appState.customDeliveries.length > 0 ? `<button class="btn btn-xs btn-outline" onclick="window.clearCustomDeliveries()" style="font-size:0.7rem; padding:2px 8px; border:1px solid rgba(255,0,128,0.3); color:var(--neon-pink); background:transparent">${dict.btn_clear_history}</button>` : ''}
          </div>
          <div style="display:flex; flex-direction:column; max-height:450px; overflow-y:auto; padding-right:4px" id="delivery-requests-list">
            ${deliveriesListHtml}
          </div>
        </section>
      </div>
    </div>
  `;
}

function handleDeliveryGpsShare() {
  const btn = document.getElementById("delivery-gps-btn");
  const statusLabel = document.getElementById("delivery-gps-status");
  const coordsInput = document.getElementById("delivery-coords");
  if (!btn || !statusLabel) return;

  btn.disabled = true;
  statusLabel.innerText = "Consultando satélite...";
  statusLabel.style.color = "var(--neon-gold)";

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const coordsStr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        
        statusLabel.innerText = `Compartida (${coordsStr})`;
        statusLabel.style.color = "var(--neon-emerald)";
        if (coordsInput) coordsInput.value = coordsStr;
        btn.disabled = false;
        
        showToast("GPS Compartido", "Tu ubicación ha sido vinculada correctamente al formulario.");
      },
      (error) => {
        statusLabel.innerText = "Permiso denegado / Error";
        statusLabel.style.color = "var(--neon-pink)";
        if (coordsInput) coordsInput.value = "Denegada (Ingreso manual)";
        btn.disabled = false;
        showToast("GPS no disponible", "No pudimos obtener tu ubicación. Por favor escribe tu dirección.");
      },
      { timeout: 5000 }
    );
  } else {
    statusLabel.innerText = "No soportado";
    statusLabel.style.color = "var(--neon-pink)";
    if (coordsInput) coordsInput.value = "No soportado";
    btn.disabled = false;
  }
}

function handleCustomDeliverySubmit() {
  const name = document.getElementById("delivery-name").value.trim();
  const coords = document.getElementById("delivery-coords").value;
  const title = document.getElementById("delivery-title").value.trim();
  const desc = document.getElementById("delivery-desc").value.trim();
  const pickupAddress = document.getElementById("delivery-pickup-address").value.trim();
  const address = document.getElementById("delivery-address").value.trim();
  
  if (!name || !title || !desc || !pickupAddress || !address) {
    showToast("Campos incompletos", "Por favor completa todos los campos.");
    return;
  }

  const now = new Date();
  const hour = now.getHours();
  const isNight = (hour >= 20 || hour < 6);
  
  const priceText = document.getElementById("delivery-price").value;
  const price = parseFloat(priceText.replace('Afl. ', '')) || (isNight ? 18.00 : 12.00);
  const size = document.getElementById("delivery-size").value;

  const newDel = {
    id: `del-${Date.now()}`,
    name,
    coords,
    title,
    desc,
    pickupAddress,
    address,
    price,
    size,
    status: 'searching',
    timestamp: Date.now()
  };

  appState.customDeliveries.unshift(newDel);
  localStorage.setItem('sabi_custom_deliveries', JSON.stringify(appState.customDeliveries));

  SoundEffects.playJingle();
  showToast("Pedido Recibido", "Estamos asignando un repartidor de la red Sabí.");

  renderDeliveryRequestPortal();
  startDeliverySimulation(newDel.id);
}

function startDeliverySimulation(id) {
  setTimeout(() => {
    updateDeliveryStatus(id, 'assigned');
    setTimeout(() => {
      updateDeliveryStatus(id, 'transit');
      setTimeout(() => {
        updateDeliveryStatus(id, 'delivered');
        SoundEffects.playJingle();
        showToast("¡Entrega Completada!", "Tu pedido personalizado ha sido entregado en la dirección especificada.");
      }, 10000);
    }, 10000);
  }, 5000);
}

function updateDeliveryStatus(id, status) {
  const idx = appState.customDeliveries.findIndex(d => d.id === id);
  if (idx !== -1) {
    appState.customDeliveries[idx].status = status;
    localStorage.setItem('sabi_custom_deliveries', JSON.stringify(appState.customDeliveries));
    
    if (appState.activeComunidadTab === 'delivery') {
      renderDeliveryRequestPortal();
    }
  }
}

function clearCustomDeliveries() {
  appState.customDeliveries = [];
  localStorage.removeItem('sabi_custom_deliveries');
  SoundEffects.playClick();
  renderDeliveryRequestPortal();
}

// ==================== PORTAL DE MI CUENTA (DYNAMIC RENDERER) ====================

function switchAccountTab(tab) {
  appState.activeAccountTab = tab;
  SoundEffects.playClick();
  renderAccountModal();
}

function changeTransportType(selectEl) {
  const licenseGroup = document.getElementById("driver-reg-license-group");
  if (licenseGroup) {
    licenseGroup.style.display = (selectEl.value === 'auto') ? 'block' : 'none';
  }
}

function renderAccountModal() {
  const container = document.getElementById("account-modal-card-body");
  if (!container) return;

  // Header & Sub-Tabs
  const tabs = [
    { id: 'profile', label: '👤 Perfil' },
    { id: 'delivery', label: '🚗 Conductor' },
    { id: 'upload', label: '📤 Clasificado' },
    { id: 'products', label: '🛍️ Mis Artículos' },
    { id: 'b2b_ad', label: '📢 Anuncios B2B' }
  ];
  if (appState.userProfile && (appState.userProfile.role === 'admin' || (appState.userProfile.email && appState.userProfile.email.toLowerCase() === 'amaury@sabi.aw'))) {
    tabs.push({ id: 'admin_crm', label: '🔑 Admin CRM' });
  }

  const tabsHtml = tabs.map(t => `
    <button class="comunidad-tab-btn ${appState.activeAccountTab === t.id ? 'active' : ''}" 
            onclick="window.switchAccountTab('${t.id}')" 
            style="padding:0.35rem 0.45rem; font-size:0.7rem; white-space:nowrap">
      ${t.label}
    </button>
  `).join('');

  let activeContentHtml = '';

  if (appState.activeAccountTab === 'profile') {
    // Mi Perfil Tab
    const planText = appState.sabiPlan === 'lifetime' ? "Plan de por Vida - Pagado" : 
                     appState.sabiPlan === 'annual' ? "Plan Anual - Próximo cobro: Simulado en 14 días" : 
                     "Plan Mensual - Próximo cobro: Simulado en 7 días";

    activeContentHtml = `
      <div style="display:flex; flex-direction:column; gap:1.25rem; text-align:left">
        <div style="display:flex; align-items:center; gap:1.25rem; background:rgba(255,255,255,0.02); padding:1rem; border-radius:16px; border:1px solid rgba(255,255,255,0.05)">
          <img src="${appState.userProfile.photo}" alt="${appState.userProfile.name}" style="width:70px; height:70px; border-radius:50%; border:2px solid var(--neon-cyan); object-fit:cover">
          <div>
            <h3 style="font-size:1.2rem; font-weight:800; color:var(--text-main); margin:0">${appState.userProfile.name}</h3>
            <span style="font-size:0.75rem; color:var(--text-muted)">ID: ${appState.userProfile.id} • Miembro desde: ${appState.userProfile.since}</span>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem">
          <div style="background:rgba(0, 245, 212, 0.04); border:1px solid var(--neon-cyan); padding:0.8rem; border-radius:12px">
            <div style="font-size:0.75rem; color:var(--text-muted)">Suscripción Sabí:</div>
            <div style="font-size:1.05rem; font-weight:800; color:var(--neon-cyan); margin-top:0.15rem">Premium Activa 🔥</div>
            <div style="font-size:0.65rem; color:var(--text-muted); margin-top:0.15rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${planText}</div>
          </div>
          
          <div style="background:rgba(255, 224, 0, 0.04); border:1px solid var(--neon-gold); padding:0.8rem; border-radius:12px; display:flex; flex-direction:column; justify-content:space-between">
            <div>
              <div style="font-size:0.75rem; color:var(--text-muted)">Billetera Sabí-Pay:</div>
              <div style="font-size:1.05rem; font-weight:800; color:var(--neon-gold); margin-top:0.15rem">Afl. ${appState.userWallet.toFixed(2)} AWG</div>
            </div>
            <div style="display:flex; gap:0.25rem; margin-top:0.25rem">
              <button class="btn btn-xs btn-cyan" onclick="window.chargeUserWallet(100.00)" style="font-size:0.62rem; padding:1px 6px; background:var(--neon-gold); border-color:var(--neon-gold); color:#000; font-weight:bold">➕ Recargar</button>
              <button class="btn btn-xs" onclick="window.withdrawUserWallet()" style="font-size:0.62rem; padding:1px 6px; background:rgba(0,245,212,0.1); border:1px solid var(--neon-cyan); color:var(--neon-cyan)">💸 Retirar</button>
              <button class="btn btn-xs" onclick="window.resetUserWallet()" style="font-size:0.62rem; padding:1px 6px; background:transparent; border:1px solid rgba(255,255,255,0.15); color:var(--text-muted)">🔄 Reset</button>
            </div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; font-size:0.85rem">
          <div style="background:rgba(255,255,255,0.01); border:1px solid rgba(255,255,255,0.05); padding:0.75rem; border-radius:10px">
            <span style="color:var(--text-muted); font-size:0.75rem">Correo Electrónico</span>
            <div style="font-weight:700; color:var(--text-main); margin-top:2px">${appState.userProfile.email}</div>
          </div>
          <div style="background:rgba(255,255,255,0.01); border:1px solid rgba(255,255,255,0.05); padding:0.75rem; border-radius:10px">
            <span style="color:var(--text-muted); font-size:0.75rem">Teléfono Vinculado</span>
            <div style="font-weight:700; color:var(--text-main); margin-top:2px">${appState.userProfile.phone}</div>
          </div>
        </div>

        <div style="background:rgba(255,255,255,0.01); border:1px solid rgba(255,255,255,0.05); padding:0.75rem; border-radius:10px; font-size:0.85rem; display:flex; justify-content:space-between; align-items:center; margin-top:0.25rem">
          <div>
            <span style="color:var(--text-muted); font-size:0.75rem">Cuenta Bancaria para Retiros</span>
            <div style="font-weight:700; color:var(--text-main); margin-top:2px">
              ${appState.userProfile.bankName && appState.userProfile.bankAccount ? `${appState.userProfile.bankName} (${appState.userProfile.bankAccount})` : '⚠️ Cuenta no vinculada'}
            </div>
          </div>
          <button class="btn btn-xs" onclick="window.linkBankAccount()" style="font-size:0.65rem; padding:4px 8px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.15)">
            ⚙️ Configurar
          </button>
        </div>

        <button class="btn btn-full" style="background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); margin-top:0.5rem" onclick="window.resetSubscriptionState()">
          🔄 Cancelar / Restablecer Onboarding (Ver Paywall)
        </button>
      </div>
    `;
  } else if (appState.activeAccountTab === 'delivery') {
    // Hazte Delivery Tab
    if (appState.driverStatus === 'unregistered') {
      activeContentHtml = `
        <div style="text-align:left">
          <h3 style="font-weight:800; font-size:1.15rem; color:var(--text-main); margin-bottom:0.4rem">🚗 Flota de Repartidores Sabí-Delivery</h3>
          <p style="color:var(--text-muted); font-size:0.8rem; margin-bottom:1.25rem">
            Únete a la flota oficial de envíos urbanos. Registra tus datos para la validación automática con la base fiscal (SIAD).
          </p>

          <form id="driver-account-reg-form" onsubmit="event.preventDefault(); window.handleDriverRegisterSubmit();">
            <div class="form-group" style="margin-bottom:0.75rem">
              <label style="font-size:0.75rem">Nombre del Conductor (De tu cuenta)</label>
              <input type="text" class="text-input" id="driver-reg-name" value="${appState.userProfile.name}" readonly style="background:rgba(255,255,255,0.03); color:var(--text-muted)">
            </div>

            <div class="form-group" style="margin-bottom:0.75rem">
              <label for="driver-reg-id" style="font-size:0.75rem">Número de Identificación (ID / Cédula)</label>
              <input type="text" class="text-input" id="driver-reg-id" placeholder="Ej. A-1002934" required>
            </div>

            <div class="form-group" style="margin-bottom:0.75rem">
              <label for="driver-reg-transport" style="font-size:0.75rem">Tipo de Transporte</label>
              <select class="select-input" id="driver-reg-transport" onchange="window.changeTransportType(this)" style="width:100%">
                <option value="bicicleta">Bicicleta (No requiere Licencia)</option>
                <option value="auto">Automóvil / Moto</option>
              </select>
            </div>

            <div class="form-group" id="driver-reg-license-group" style="margin-bottom:0.75rem; display:none">
              <label for="driver-reg-license" style="font-size:0.75rem">Licencia de Conducir</label>
              <input type="text" class="text-input" id="driver-reg-license" placeholder="Ej. L-554212">
            </div>

            <div class="form-group" style="margin-bottom:1rem">
              <label for="driver-reg-tax" style="font-size:0.75rem">Personnumber (Tax Number / Registro SIAD)</label>
              <input type="text" class="text-input" id="driver-reg-tax" placeholder="Ej. 10029348" required>
            </div>

            <button type="submit" class="btn btn-cyan btn-full">
              📝 Enviar Registro a Verificación SIAD
            </button>
          </form>
        </div>
      `;
    } else if (appState.driverStatus === 'pending') {
      activeContentHtml = `
        <div style="text-align:center; padding:2rem 1rem">
          <span class="spinner" style="width:36px; height:36px; border:3px solid rgba(255,255,255,0.1); border-top-color:var(--neon-cyan); border-radius:50%; display:inline-block; animation: spin 1s linear infinite;"></span>
          <h3 style="font-weight:800; font-size:1.2rem; color:var(--neon-gold); margin-top:1.25rem" id="driver-verify-title">Consultando Base Fiscal (SIAD)...</h3>
          <p style="color:var(--text-muted); font-size:0.85rem; margin-top:0.5rem" id="driver-verify-desc">
            Enviando Personnumber y datos del transporte al registro nacional de Aruba.
          </p>
        </div>
      `;
    } else if (appState.driverStatus === 'approved') {
      // Driver Console Panel
      const switchLabel = appState.driverActive 
        ? `<span style="color:var(--neon-emerald); font-weight:800">🟢 Delivery Disponible (Activo)</span>`
        : `<span style="color:var(--text-muted)">🔴 Fuera de Servicio (Inactivo)</span>`;

      // Active Trip Tracker
      let activeTripHtml = '';
      if (appState.driverActiveTrip) {
        const t = appState.driverActiveTrip;
        let actionBtn = '';
        let routeStatusText = '';
        if (t.status === 'searching' || t.status === 'assigned') {
          routeStatusText = `📍 Dirígete al punto de recogida en: <strong>${t.pickupAddress || t.address}</strong>`;
          actionBtn = `<button class="btn btn-gold btn-full" onclick="window.handleDriverPickupPackage('${t.id}')">📦 Confirmar Recogida del Paquete</button>`;
        } else if (t.status === 'transit') {
          routeStatusText = `🚚 Entregando paquete en destino: <strong>${t.address || t.deliveryAddress}</strong>`;
          actionBtn = `<button class="btn btn-emerald btn-full" onclick="window.handleDriverCompleteTrip('${t.id}')">✅ Confirmar Entrega Realizada</button>`;
        }

        activeTripHtml = `
          <div style="background:rgba(0, 243, 255, 0.04); border:1px solid var(--neon-cyan); padding:1rem; border-radius:12px; margin-top:1rem; text-align:left">
            <h4 style="color:var(--neon-cyan); font-weight:800; margin:0 0 0.5rem 0; font-size:0.9rem">🚗 Entrega en Progreso</h4>
            <div style="font-size:0.85rem; font-weight:700; color:var(--text-main)">${t.title}</div>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.25rem">${routeStatusText}</div>
            <div style="display:flex; justify-content:space-between; margin:0.75rem 0; font-size:0.8rem; border-top:1px dashed rgba(255,255,255,0.08); padding-top:0.5rem">
              <span style="color:var(--text-muted)">Cliente: ${t.name}</span>
              <span style="font-weight:800; color:var(--neon-emerald)">Ganancia: Afl. ${(t.price * (1 - getDriverCommissionRate())).toFixed(2)} (${((1 - getDriverCommissionRate()) * 100).toFixed(0)}%)</span>
            </div>
            ${actionBtn}
          </div>
        `;
      } else if (appState.driverActive) {
        // Show nearby jobs (both requests from customDeliveries in 'searching' status, and simulated defaults)
        const activeRequests = appState.customDeliveries.filter(d => d.status === 'searching');
        
        // Mock default requests if pool is empty
        const mockRequests = [
          { id: 'mock-1', title: 'Comida rápida de McDonald\'s Oranjestad', name: 'Zoe Croes', address: 'Caya di Oro 12, Noord', price: 12.00, coords: '12.554, -70.038' },
          { id: 'mock-2', title: 'Retirar repuesto de auto en Santa Cruz', name: 'Rudolf Kelly', address: 'Sabaneta 144, Savaneta', price: 18.00, coords: '12.448, -69.945' }
        ];

        const requestsToShow = activeRequests.length > 0 ? activeRequests : mockRequests;

        const requestsHtml = requestsToShow.map(r => `
          <div class="league-box" style="margin-bottom:0.5rem; text-align:left; font-size:0.8rem; padding:0.6rem 0.75rem">
            <div style="display:flex; justify-content:space-between; align-items:flex-start">
              <div>
                <strong style="color:var(--text-main)">${r.title}</strong>
                <div style="color:var(--text-muted); font-size:0.72rem; margin-top:2px">Destino: ${r.address} | Tarifa: Afl. ${r.price.toFixed(2)}</div>
              </div>
              <button class="btn btn-xs btn-cyan" onclick="window.handleDriverAcceptTrip('${r.id}', ${r.price}, '${r.title.replace(/'/g, "\\'")}', '${r.name.replace(/'/g, "\\'")}', '${r.address.replace(/'/g, "\\'")}', '${r.coords}')" style="padding:2px 8px; font-size:0.72rem">Aceptar</button>
            </div>
          </div>
        `).join('');

        activeTripHtml = `
          <div style="margin-top:1.25rem">
            <h4 style="font-weight:800; color:var(--text-main); font-size:0.85rem; margin-bottom:0.5rem; text-align:left">📦 Envíos Disponibles Cerca de Ti</h4>
            <div style="display:flex; flex-direction:column; max-height:220px; overflow-y:auto">
              ${requestsHtml}
            </div>
          </div>
        `;
      } else {
        activeTripHtml = `
          <div style="text-align:center; padding:2rem 1rem; color:var(--text-muted); font-size:0.85rem; border:1px dashed rgba(255,255,255,0.05); border-radius:12px; margin-top:1rem">
            🔒 Activa el switch "Delivery Disponible" para ver y aceptar trabajos cercanos.
          </div>
        `;
      }

      activeContentHtml = `
        <div style="text-align:left">
          <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0, 243, 255, 0.04); border:1px solid var(--neon-cyan); padding:0.75rem 1rem; border-radius:12px; margin-bottom:1rem">
            <div>
              <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase">Mi Billetera Sabí</span>
              <div style="font-size:1.5rem; font-weight:800; color:var(--neon-cyan)">Afl. ${appState.driverWallet.toFixed(2)}</div>
            </div>
            <div class="switch-wrapper" style="margin:0">
              ${switchLabel}
              <label class="active-switch" style="margin-left:0.5rem">
                <input type="checkbox" id="driver-active-modal-toggle" ${appState.driverActive ? 'checked' : ''} onchange="window.toggleDriverActiveState(this)">
                <span class="slider"></span>
              </label>
            </div>
          </div>

          ${activeTripHtml}
        </div>
      `;
    }
  } else if (appState.activeAccountTab === 'upload') {
    // Sube un Producto Tab
    activeContentHtml = `
      <div style="text-align:left">
        <h3 style="font-weight:800; font-size:1.15rem; color:var(--text-main); margin-bottom:0.4rem">📤 Publica un Clasificado</h3>
        <p style="color:var(--text-muted); font-size:0.8rem; margin-bottom:1rem">
          Carga un nuevo anuncio al marketplace de Sabí. Los artículos físicos pueden ofrecer servicio de entrega.
        </p>

        <form id="user-post-ad-form" onsubmit="event.preventDefault(); window.handleUserProductUpload();">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem">
            <div class="form-group">
              <label for="ad-modal-title" style="font-size:0.75rem">Nombre del Producto / Servicio</label>
              <input type="text" class="text-input" id="ad-modal-title" placeholder="Ej. Bicicleta Trek Marlin 5" required>
            </div>
            
            <div class="form-group">
              <label for="ad-modal-category" style="font-size:0.75rem">Categoría</label>
              <select class="select-input" id="ad-modal-category" style="width:100%">
                <option value="electronica">Electrónica</option>
                <option value="vehiculos">Vehículos</option>
                <option value="ropa">Ropa y Accesorios</option>
                <option value="joyeria">Joyería</option>
                <option value="hogar">Artículos del Hogar</option>
                <option value="trabajo">Trabajo / Empleo</option>
                <option value="alquileres">Alquileres</option>
                <option value="servicios_hogar">Servicios de Hogar (Plomería, Limpieza)</option>
                <option value="servicios_profesionales">Servicios Profesionales (Asesoría, Tutoría)</option>
                <option value="servicios_salud">Salud y Belleza (Estética, Peluquería)</option>
                <option value="servicios_tecnicos">Soporte Técnico (Reparación de PCs/Móviles)</option>
                <option value="servicios_transporte">Transporte y Acarreos (Fletes, Mudanzas)</option>
                <option value="servicios_eventos">Eventos y Catering (Comidas, Fiestas)</option>
              </select>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-top:0.5rem">
            <div class="form-group">
              <label for="ad-modal-price" style="font-size:0.75rem">Precio (AWG)</label>
              <input type="number" class="text-input" id="ad-modal-price" placeholder="Ej. 650" required>
            </div>

            <div class="form-group">
              <label for="ad-modal-contact" style="font-size:0.75rem">Teléfono de Contacto</label>
              <input type="text" class="text-input" id="ad-modal-contact" value="${appState.userProfile.phone}" required>
            </div>
          </div>

          <div class="form-group" style="margin-top:0.5rem">
            <label for="ad-modal-desc" style="font-size:0.75rem">Descripción del Clasificado</label>
            <textarea class="text-input" id="ad-modal-desc" rows="2" placeholder="Detalla el estado del producto, garantías, lugar de entrega..." required style="resize:vertical"></textarea>
          </div>

          <!-- Switch Usar Sabi Delivery -->
          <div class="form-group" style="display:flex; align-items:center; gap:0.5rem; margin-top:0.75rem; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); padding:0.6rem 0.8rem; border-radius:10px">
            <label for="ad-modal-delivery-enabled" style="margin-bottom:0; cursor:pointer; display:flex; align-items:center; gap:0.5rem; width:100%; font-size:0.8rem">
              <input type="checkbox" id="ad-modal-delivery-enabled" style="width:18px; height:18px; cursor:pointer" checked>
              <span style="flex:1">Habilitar "Sabí-Delivery" (Entrega a domicilio con pago aparte)</span>
            </label>
          </div>

          <button type="submit" class="btn btn-cyan btn-full" style="margin-top:1rem">
            🚀 Publicar en la Comunidad
          </button>
        </form>
      </div>
    `;
  } else if (appState.activeAccountTab === 'products') {
    // Mis Productos Tab
    const userAds = appState.userProducts;

    const listHtml = userAds.length === 0
      ? `<div style="text-align:center; color:var(--text-muted); font-size:0.85rem; padding:3rem 0">No has publicado ningún producto todavía.</div>`
      : userAds.map(p => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.01); border:1px solid rgba(255,255,255,0.04); padding:0.6rem 0.8rem; border-radius:12px; margin-bottom:0.5rem">
          <div style="text-align:left">
            <div style="font-weight:700; color:var(--text-main); font-size:0.85rem">${p.title}</div>
            <div style="font-size:0.75rem; color:var(--text-muted)">Precio: Fl. ${p.price} AWG • ${p.deliveryEnabled ? '📦 Sabí-Delivery Habilitado' : 'Orgánico'}</div>
          </div>
          <div style="display:flex; gap:0.4rem">
            <button class="btn btn-xs btn-cyan" onclick="window.closeAccountModal(); window.openSellerLiveStudio('${p.id}')" style="padding:2px 8px; font-size:0.72rem">🎥 Transmitir Live</button>
            <button class="btn btn-xs" onclick="window.handleUserProductDelete('${p.id}')" style="background:rgba(255,0,128,0.1); border:1px solid rgba(255,0,128,0.2); color:var(--neon-pink); padding:2px 8px; font-size:0.72rem">🗑️ Eliminar</button>
          </div>
        </div>
      `).join('');

    activeContentHtml = `
      <div style="text-align:left">
        <h3 style="font-weight:800; font-size:1.15rem; color:var(--text-main); margin-bottom:0.5rem">🛍️ Administra tus Publicaciones</h3>
        <div style="display:flex; flex-direction:column; max-height:300px; overflow-y:auto; padding-right:2px">
          ${listHtml}
        </div>
      </div>
    `;
  } else if (appState.activeAccountTab === 'b2b_ad') {
    // Portal Publicitario B2B
    activeContentHtml = `
      <div style="text-align:left; display:flex; flex-direction:column; gap:1.25rem">
        <!-- B2B Wallet & Stats card -->
        <div class="card gold-accent" style="margin:0; background:rgba(255,255,255,0.02); padding:1rem; border:1px solid rgba(255, 224, 0, 0.2)">
          <h3 style="font-weight:800; font-size:1.1rem; color:var(--text-main); margin-top:0; margin-bottom:0.75rem; display:flex; align-items:center; gap:0.4rem">
            <span>📢</span> Portal Publicitario y Billetera B2B
          </h3>
          <div class="wallet-box" style="background:rgba(255, 224, 0, 0.04); border:1px dashed var(--neon-gold); padding:0.8rem; border-radius:12px; text-align:center; margin-bottom:0.75rem">
            <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px">Saldo para Campañas PPC (Regalo)</div>
            <div style="font-size:1.8rem; font-weight:800; color:var(--neon-gold); margin-top:0.15rem" id="b2b-wallet-balance">$${appState.b2bWallet.toFixed(2)} USD</div>
            <p style="font-size:0.7rem; color:var(--text-muted); margin:0.25rem 0 0 0">Simula clics en los anuncios patrocinados para ver cómo se deduce de este presupuesto.</p>
          </div>
          
          <div style="background:rgba(255, 255, 255, 0.01); border:1px solid rgba(255, 255, 255, 0.04); padding:0.75rem; border-radius:10px; font-size:0.8rem">
            <div style="font-weight:700; color:var(--text-main); margin-bottom:0.4rem">Estadísticas Comerciales:</div>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:0.5rem; text-align:center">
              <div style="background:rgba(255,255,255,0.02); padding:0.4rem; border-radius:6px">
                <div style="color:var(--text-muted); font-size:0.65rem">Impresiones</div>
                <div style="font-weight:700; font-size:0.9rem" id="b2b-stat-impressions">${appState.b2bImpressions.toLocaleString()}</div>
              </div>
              <div style="background:rgba(255,255,255,0.02); padding:0.4rem; border-radius:6px">
                <div style="color:var(--text-muted); font-size:0.65rem">Clics PPC</div>
                <div style="font-weight:700; font-size:0.9rem" id="b2b-stat-clicks">${appState.b2bClicks.toLocaleString()}</div>
              </div>
              <div style="background:rgba(255,255,255,0.02); padding:0.4rem; border-radius:6px">
                <div style="color:var(--text-muted); font-size:0.65rem">CTR Promedio</div>
                <div style="font-weight:700; font-size:0.9rem; color:var(--neon-cyan)" id="b2b-stat-ctr">0.00%</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Formulario Cargar Anuncio -->
        <div class="card cyan-accent" style="margin:0; background:rgba(255,255,255,0.02); padding:1rem; border:1px solid rgba(0, 243, 255, 0.2)">
          <h3 style="font-weight:800; font-size:1.1rem; color:var(--text-main); margin-top:0; margin-bottom:0.75rem">🚀 Cargar Anuncio / Campaña Negocio</h3>
          <form id="post-ad-form" onsubmit="event.preventDefault(); window.handlePostAdSubmit();" style="display:flex; flex-direction:column; gap:0.75rem">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem">
              <div class="form-group">
                <label for="ad-form-title" style="font-size:0.75rem">Título del Anuncio / Negocio</label>
                <input type="text" class="text-input" id="ad-form-title" placeholder="Ej. Boutique Aruba / Plomero Autorizado" required style="font-size:0.8rem; padding:0.4rem 0.6rem">
              </div>
              <div class="form-group">
                <label for="ad-form-category" style="font-size:0.75rem">Categoría</label>
                <select class="select-input" id="ad-form-category" onchange="window.changeAdCategory(this)" style="width:100%; font-size:0.8rem; padding:0.4rem 0.6rem">
                  <option value="trabajo">Trabajo</option>
                  <option value="alquileres">Alquileres</option>
                  <option value="vehiculos">Vehículos</option>
                  <option value="ropa">Ropa y Accesorios</option>
                  <option value="electronica">Electrónica</option>
                  <option value="joyeria">Joyería</option>
                  <option value="hogar">Artículos del Hogar</option>
                </select>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem">
              <div class="form-group">
                <label for="ad-form-price" style="font-size:0.75rem">Precio / Tarifa / Salario (AWG)</label>
                <input type="number" class="text-input" id="ad-form-price" placeholder="Ej. 1800" required style="font-size:0.8rem; padding:0.4rem 0.6rem">
              </div>
              <div class="form-group">
                <label for="ad-form-contact" style="font-size:0.75rem">Teléfono Comercial</label>
                <input type="text" class="text-input" id="ad-form-contact" placeholder="Ej. 593-5555" required style="font-size:0.8rem; padding:0.4rem 0.6rem">
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem">
              <div class="form-group">
                <label for="ad-form-image-preset" style="font-size:0.75rem">Imagen Comercial</label>
                <select class="select-input" id="ad-form-image-preset" onchange="window.toggleCustomImageUrlField()" style="width:100%; font-size:0.8rem; padding:0.4rem 0.6rem">
                  <option value="trabajo">Preset: Trabajo / Empleo</option>
                  <option value="alquileres">Preset: Alquiler / Real Estate</option>
                  <option value="vehiculos">Preset: Vehículos / Auto</option>
                  <option value="ropa">Preset: Ropa y Accesorios</option>
                  <option value="electronica">Preset: Electrónica</option>
                  <option value="joyeria">Preset: Joyería</option>
                  <option value="hogar">Preset: Artículos del Hogar</option>
                  <option value="custom">Ingresar URL Personalizada...</option>
                </select>
              </div>
              <div class="form-group">
                <label for="ad-form-sponsored" style="font-size:0.75rem">Tipo de Campaña</label>
                <select class="select-input" id="ad-form-sponsored" onchange="window.toggleCpcField()" style="width:100%; font-size:0.8rem; padding:0.4rem 0.6rem">
                  <option value="organic">Gratuita (Clasificado Orgánico)</option>
                  <option value="sponsored">Patrocinada PPC (Aparece Primero)</option>
                </select>
              </div>
            </div>

            <div class="form-group" id="ad-form-custom-image-url-group" style="display:none">
              <label for="ad-form-image-url" style="font-size:0.75rem">URL de Imagen Personalizada</label>
              <input type="url" class="text-input" id="ad-form-image-url" placeholder="https://images.unsplash.com/..." style="font-size:0.8rem; padding:0.4rem 0.6rem">
            </div>

            <div class="form-group" id="ad-form-cpc-group" style="display:none">
              <label for="ad-form-cpc" style="font-size:0.75rem">Costo Por Clic Oferta (USD)</label>
              <input type="number" class="text-input" id="ad-form-cpc" value="1.00" min="0.10" max="5.00" step="0.10" style="font-size:0.8rem; padding:0.4rem 0.6rem">
              <p style="font-size:0.65rem; color:var(--text-muted); margin:0.15rem 0 0 0">Mayor oferta = Mayor prioridad de aparición en búsquedas.</p>
            </div>

            <!-- Toggle Delivery Switch -->
            <div class="form-group" id="ad-form-delivery-toggle-group" style="display:none; align-items:center; gap:0.5rem; background:rgba(255,255,255,0.01); border:1px solid rgba(255,255,255,0.04); padding:0.4rem 0.6rem; border-radius:8px">
              <label for="ad-form-delivery-enabled" style="margin-bottom:0; cursor:pointer; display:flex; align-items:center; gap:0.5rem; font-size:0.75rem">
                <input type="checkbox" id="ad-form-delivery-enabled" style="width:16px; height:16px; cursor:pointer">
                <span>Habilitar "Entrega Sabí" (Delivery de última milla)</span>
              </label>
            </div>

            <div class="form-group">
              <label for="ad-form-desc" style="font-size:0.75rem">Descripción Comercial / Oferta</label>
              <textarea class="text-input" id="ad-form-desc" rows="2" placeholder="Detalles comerciales, horarios de atención, contacto..." required style="resize:vertical; font-size:0.8rem; padding:0.4rem 0.6rem"></textarea>
            </div>

            <button type="submit" class="btn btn-cyan btn-full" style="margin-top:0.25rem; padding:0.5rem">
              🚀 Cargar Campaña de Negocio
            </button>
          </form>
        </div>
      </div>
    `;
  } else if (appState.activeAccountTab === 'admin_crm') {
    if (!appState.adminCRMUsers) {
      activeContentHtml = `
        <div style="text-align:center; padding:3rem 0; color:var(--text-muted)">
          <span class="spinner" style="width:36px; height:36px; border:3px solid rgba(255,255,255,0.1); border-top-color:var(--neon-cyan); border-radius:50%; display:inline-block; animation: spin 1s linear infinite;"></span>
          <div style="margin-top:1rem">Cargando base de datos de usuarios...</div>
        </div>
      `;
      setTimeout(() => {
        window.loadAdminCRMData();
      }, 50);
    } else {
      const users = appState.adminCRMUsers;
      const totalUsers = users.length;
      const activeDrivers = users.filter(u => u.driver_status === 'approved' && u.driver_active).length;
      const totalAds = appState.marketplaceAds ? appState.marketplaceAds.length : 0;

      const userRowsHtml = users.map(u => {
        const isUserAdmin = u.role === 'admin';
        const roleBadge = isUserAdmin 
          ? `<span class="badge" style="background:rgba(0, 245, 212, 0.15); border:1px solid var(--neon-cyan); color:var(--neon-cyan); font-size:0.65rem; padding:1px 6px">Admin</span>`
          : `<span class="badge" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.15); color:var(--text-muted); font-size:0.65rem; padding:1px 6px">User</span>`;

        const driverBadge = u.driver_status === 'approved'
          ? `<span style="color:var(--neon-emerald); font-size:0.7rem">🚗 Chofer (${u.driver_active ? 'Activo' : 'Inactivo'})</span>`
          : `<span style="color:var(--text-muted); font-size:0.7rem">Pasajero</span>`;

        return `
          <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.01); border:1px solid rgba(255,255,255,0.04); padding:0.6rem 0.8rem; border-radius:12px; margin-bottom:0.5rem">
            <div style="text-align:left; flex:1; min-width:0; padding-right:0.5rem">
              <div style="display:flex; align-items:center; gap:0.4rem; font-weight:700; color:var(--text-main); font-size:0.85rem">
                <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${u.name || 'Sin Nombre'}</span>
                ${roleBadge}
              </div>
              <div style="font-size:0.72rem; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${u.email}</div>
              <div style="display:flex; gap:0.5rem; margin-top:2px; align-items:center">
                <span style="color:var(--neon-gold); font-size:0.75rem; font-weight:bold">Afl. ${parseFloat(u.wallet_balance || 0).toFixed(2)}</span>
                <span style="color:rgba(255,255,255,0.2)">•</span>
                ${driverBadge}
              </div>
            </div>
            <div style="display:flex; gap:0.35rem; flex-shrink:0">
              <button class="btn btn-xs btn-cyan" onclick="window.adminAdjustWallet('${u.id}', ${u.wallet_balance || 0})" style="padding:2px 6px; font-size:0.65rem">💵 Saldo</button>
              <button class="btn btn-xs" onclick="window.adminToggleRole('${u.id}', '${u.role || 'user'}')" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.15); padding:2px 6px; font-size:0.65rem">🔄 Rol</button>
            </div>
          </div>
        `;
      }).join('');

      activeContentHtml = `
        <div style="text-align:left; display:flex; flex-direction:column; gap:1rem; height:100%">
          <!-- Metrics Grid -->
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:0.5rem">
            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); padding:0.6rem 0.4rem; border-radius:10px; text-align:center">
              <div style="font-size:0.65rem; color:var(--text-muted)">Total Usuarios</div>
              <div style="font-size:1.15rem; font-weight:800; color:var(--neon-cyan); margin-top:2px">${totalUsers}</div>
            </div>
            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); padding:0.6rem 0.4rem; border-radius:10px; text-align:center">
              <div style="font-size:0.65rem; color:var(--text-muted)">Choferes Activos</div>
              <div style="font-size:1.15rem; font-weight:800; color:var(--neon-emerald); margin-top:2px">${activeDrivers}</div>
            </div>
            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); padding:0.6rem 0.4rem; border-radius:10px; text-align:center">
              <div style="font-size:0.65rem; color:var(--text-muted)">Anuncios Activos</div>
              <div style="font-size:1.15rem; font-weight:800; color:var(--neon-gold); margin-top:2px">${totalAds}</div>
            </div>
          </div>

          <!-- Actions Bar -->
          <div style="display:flex; justify-content:space-between; align-items:center">
            <h4 style="font-weight:800; color:var(--text-main); font-size:0.9rem; margin:0">👥 Lista de Usuarios</h4>
            <div style="display:flex; gap:0.4rem">
              <button class="btn btn-xs" onclick="window.loadAdminCRMData()" style="padding:4px 8px; font-size:0.7rem; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.15)">🔄 Recargar</button>
              <button class="btn btn-xs btn-cyan" onclick="window.exportAdminEmailsCSV()" style="padding:4px 8px; font-size:0.7rem">📤 Exportar CSV</button>
            </div>
          </div>

          <!-- Users List Scroll Container -->
          <div style="flex:1; overflow-y:auto; max-height:260px; padding-right:2px">
            ${userRowsHtml.length === 0 ? '<div style="text-align:center; color:var(--text-muted); font-size:0.8rem; padding:2rem 0">No hay usuarios registrados en la base de datos.</div>' : userRowsHtml}
          </div>
        </div>
      `;
    }
  }

  container.innerHTML = `
    <!-- Top Account Menu Header -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:0.5rem">
      <h2 style="font-weight:800; font-size:1.35rem; color:var(--text-main); margin:0; display:flex; align-items:center; gap:0.4rem">
        <span>👤</span> Tu Cuenta Sabí
      </h2>
      <button class="btn btn-xs" onclick="window.closeAccountModal()" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); padding:2px 8px; font-size:0.75rem">Cerrar</button>
    </div>

    <!-- Sub-tab Bar -->
    <div style="display:flex; gap:0.3rem; margin-bottom:1.25rem; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:0.6rem; overflow-x:auto; white-space:nowrap; -webkit-overflow-scrolling:touch">
      ${tabsHtml}
    </div>

    <!-- Active Tab Panel Content -->
    <div style="flex:1; display:flex; flex-direction:column; min-height:0">
      ${activeContentHtml}
    </div>
  `;

  if (appState.activeAccountTab === 'b2b_ad') {
    updateB2BStatsDisplay();
  }
}

async function loadAdminCRMData() {
  if (appState.userProfile.role !== 'admin' && !(appState.userProfile.email && appState.userProfile.email.toLowerCase() === 'amaury@sabi.aw')) return;
  
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      appState.adminCRMUsers = data.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        wallet_balance: parseFloat(u.wallet_balance || 0),
        driver_status: u.driver_status || 'unregistered',
        driver_active: u.driver_active || false,
        role: u.role || 'user'
      }));
    } catch (e) {
      console.error("Error loading profiles from Supabase:", e);
      showToast("Error", "No se pudo cargar la base de datos de Supabase. Usando local.");
      fallbackLocalCRMData();
    }
  } else {
    fallbackLocalCRMData();
  }
  
  renderAccountModal();
}

function fallbackLocalCRMData() {
  let accounts = [];
  try {
    const saved = localStorage.getItem('sabi_registered_accounts');
    if (saved) accounts = JSON.parse(saved);
  } catch (e) {}
  
  const userList = accounts.map(acc => ({
    id: acc.profile.id,
    name: acc.profile.name,
    email: acc.profile.email,
    phone: acc.profile.phone,
    wallet_balance: acc.profile.id === appState.userProfile.id ? appState.userWallet : 250.00,
    driver_status: 'unregistered',
    driver_active: false,
    role: acc.profile.role || 'user'
  }));

  if (!userList.some(u => u.email === appState.userProfile.email)) {
    userList.unshift({
      id: appState.userProfile.id,
      name: appState.userProfile.name,
      email: appState.userProfile.email,
      phone: appState.userProfile.phone,
      wallet_balance: appState.userWallet,
      driver_status: appState.driverStatus,
      driver_active: appState.driverActive,
      role: appState.userProfile.role || 'admin'
    });
  }
  
  appState.adminCRMUsers = userList;
}

async function adminAdjustWallet(userId, currentBalance) {
  if (appState.userProfile.role !== 'admin' && !(appState.userProfile.email && appState.userProfile.email.toLowerCase() === 'amaury@sabi.aw')) return;
  SoundEffects.playClick();
  
  const amtStr = prompt("💵 Ingresa el nuevo saldo para este usuario (AWG):", currentBalance.toFixed(2));
  if (amtStr === null) return;
  const newBalance = parseFloat(amtStr);
  if (isNaN(newBalance) || newBalance < 0) {
    showToast("Monto Inválido", "Por favor ingresa un número positivo.");
    return;
  }
  
  showToast("Actualizando...", "Guardando cambios en el servidor...");
  
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('id', userId);
      if (error) throw error;
      
      showToast("Billetera Actualizada", "Saldo actualizado exitosamente en Supabase.");
    } catch (e) {
      console.error("Error updating wallet in Supabase:", e);
      showToast("Error", "No se pudo actualizar en Supabase. Se aplicó localmente.");
    }
  }
  
  if (appState.adminCRMUsers) {
    const idx = appState.adminCRMUsers.findIndex(u => u.id === userId);
    if (idx !== -1) {
      appState.adminCRMUsers[idx].wallet_balance = newBalance;
    }
  }
  
  if (userId === appState.userProfile.id) {
    appState.userWallet = newBalance;
    localStorage.setItem('sabi_user_wallet', newBalance.toString());
  }
  
  renderAccountModal();
}

async function adminToggleRole(userId, currentRole) {
  if (appState.userProfile.role !== 'admin' && !(appState.userProfile.email && appState.userProfile.email.toLowerCase() === 'amaury@sabi.aw')) return;
  SoundEffects.playClick();
  
  const newRole = currentRole === 'admin' ? 'user' : 'admin';
  const confirmChange = confirm(`¿Estás seguro de cambiar el rol del usuario de "${currentRole}" a "${newRole}"?`);
  if (!confirmChange) return;
  
  showToast("Actualizando...", "Guardando cambios de rol...");
  
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      if (error) throw error;
      
      showToast("Rol Actualizado", `El usuario ahora tiene el rol: ${newRole}.`);
    } catch (e) {
      console.error("Error updating role in Supabase:", e);
      showToast("Error", "No se pudo actualizar en Supabase. Se aplicó localmente.");
    }
  }
  
  if (appState.adminCRMUsers) {
    const idx = appState.adminCRMUsers.findIndex(u => u.id === userId);
    if (idx !== -1) {
      appState.adminCRMUsers[idx].role = newRole;
    }
  }
  
  if (userId === appState.userProfile.id) {
    appState.userProfile.role = newRole;
    localStorage.setItem('sabi_user_profile', JSON.stringify(appState.userProfile));
  }
  
  renderAccountModal();
}

function exportAdminEmailsCSV() {
  if ((appState.userProfile.role !== 'admin' && !(appState.userProfile.email && appState.userProfile.email.toLowerCase() === 'amaury@sabi.aw')) || !appState.adminCRMUsers) return;
  SoundEffects.playJingle();
  
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "ID,Nombre,Email,Telefono,Saldo AWG,Rol,Status Chofer,Chofer Activo\n";
  
  appState.adminCRMUsers.forEach(u => {
    const row = [
      u.id,
      `"${(u.name || '').replace(/"/g, '""')}"`,
      u.email,
      u.phone || '',
      u.wallet_balance.toFixed(2),
      u.role || 'user',
      u.driver_status || 'unregistered',
      u.driver_active ? 'SI' : 'NO'
    ].join(",");
    csvContent += row + "\n";
  });
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `sabi_crm_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("CSV Descargado", "Mailing list exportada exitosamente.");
}

window.loadAdminCRMData = loadAdminCRMData;
window.adminAdjustWallet = adminAdjustWallet;
window.adminToggleRole = adminToggleRole;
window.exportAdminEmailsCSV = exportAdminEmailsCSV;

function handleDriverRegisterSubmit() {
  const id = document.getElementById("driver-reg-id").value.trim();
  const transport = document.getElementById("driver-reg-transport").value;
  const licenseInput = document.getElementById("driver-reg-license");
  const license = licenseInput ? licenseInput.value.trim() : "";
  const tax = document.getElementById("driver-reg-tax").value.trim();

  if (!id || !tax || (transport === 'auto' && !license)) {
    showToast("Campos faltantes", "Por favor completa todos los campos requeridos.");
    return;
  }

  appState.driverStatus = 'pending';
  renderAccountModal();

  // 3 seconds simulation of SIAD fiscal database lookup
  setTimeout(() => {
    const titleEl = document.getElementById("driver-verify-title");
    const descEl = document.getElementById("driver-verify-desc");
    if (titleEl && descEl) {
      titleEl.innerText = "Verificando Licencia de Conducir (DTI)...";
      descEl.innerText = "Consultando validez y vigencia de la licencia registrada.";
    }

    setTimeout(() => {
      const titleEl2 = document.getElementById("driver-verify-title");
      const descEl2 = document.getElementById("driver-verify-desc");
      if (titleEl2 && descEl2) {
        titleEl2.innerText = "Aprobando Solicitud en Servidores Sabí...";
        descEl2.innerText = "Cargando llaves de conductor e historial fiscal.";
      }

      setTimeout(() => {
        appState.driverStatus = 'approved';
        appState.driverActive = true;
        
        // Save
        localStorage.setItem('sabi_driver_status', 'approved');
        localStorage.setItem('sabi_driver_active', 'true');
        
        showToast("Registro Aprobado", "Felicidades, tu cuenta de delivery ha sido verificada con éxito.");
        
        // Re-render
        renderAccountModal();
      }, 1000);
    }, 1000);
  }, 1000);
}

function toggleDriverActiveState(checkbox) {
  appState.driverActive = checkbox.checked;
  localStorage.setItem('sabi_driver_active', appState.driverActive.toString());
  SoundEffects.playClick();
  renderAccountModal();
}

function handleDriverAcceptTrip(tripId, price, title, name, address, coords) {
  SoundEffects.playJingle();

  const parentDel = appState.customDeliveries.find(d => d.id === tripId);
  const escrowAmt = parentDel ? parentDel.escrowAmount : 0;

  appState.driverActiveTrip = {
    id: tripId,
    price,
    title,
    name,
    address,
    coords,
    escrowAmount: escrowAmt,
    status: 'assigned'
  };

  localStorage.setItem('sabi_driver_active_trip', JSON.stringify(appState.driverActiveTrip));

  // If it is one of the custom deliveries, update its status in the pool
  const idx = appState.customDeliveries.findIndex(d => d.id === tripId);
  if (idx !== -1) {
    appState.customDeliveries[idx].status = 'assigned';
    localStorage.setItem('sabi_custom_deliveries', JSON.stringify(appState.customDeliveries));
    if (appState.activeComunidadTab === 'delivery') {
      renderDeliveryRequestPortal();
    }
  }

  showToast("Viaje Aceptado", `Has tomado la entrega: "${title}". Dirígete al punto de recogida.`);
  renderAccountModal();
}

function handleDriverPickupPackage(tripId) {
  if (!appState.driverActiveTrip || appState.driverActiveTrip.id !== tripId) return;

  SoundEffects.playClick();
  appState.driverActiveTrip.status = 'transit';
  localStorage.setItem('sabi_driver_active_trip', JSON.stringify(appState.driverActiveTrip));

  const idx = appState.customDeliveries.findIndex(d => d.id === tripId);
  if (idx !== -1) {
    appState.customDeliveries[idx].status = 'transit';
    localStorage.setItem('sabi_custom_deliveries', JSON.stringify(appState.customDeliveries));
    if (appState.activeComunidadTab === 'delivery') {
      renderDeliveryRequestPortal();
    }
  }

  showToast("Paquete Recogido", "Cargamento asegurado. Dirígete a la dirección de entrega.");
  renderAccountModal();
}

function handleDriverCompleteTrip(tripId) {
  if (!appState.driverActiveTrip || appState.driverActiveTrip.id !== tripId) return;

  SoundEffects.playJingle();
  const trip = appState.driverActiveTrip;
  
  // Earn based on dynamic commission rate
  const earnings = trip.price * (1 - getDriverCommissionRate());
  appState.driverWallet += earnings;
  localStorage.setItem('sabi_driver_wallet', appState.driverWallet.toString());

  const commission = trip.price * getDriverCommissionRate();
  appState.adminEarnings += commission;
  localStorage.setItem('sabi_admin_earnings', appState.adminEarnings.toString());

  // Increment distance in evaluation period
  let currentDistance = parseFloat(localStorage.getItem('sabi_driver_distance_period') || '0');
  currentDistance += 8.5;
  localStorage.setItem('sabi_driver_distance_period', currentDistance.toString());

  // Release Escrow Amount to the Seller (demo: add to user profile wallet)
  if (trip.escrowAmount && trip.escrowAmount > 0) {
    appState.userWallet += trip.escrowAmount;
    localStorage.setItem('sabi_user_wallet', appState.userWallet.toString());
    showToast("¡Dinero Liberado!", `Se han liberado Afl. ${trip.escrowAmount.toFixed(2)} AWG de la custodia y enviado al vendedor por la entrega.`);
  }

  const idx = appState.customDeliveries.findIndex(d => d.id === tripId);
  if (idx !== -1) {
    appState.customDeliveries[idx].status = 'delivered';
    localStorage.setItem('sabi_custom_deliveries', JSON.stringify(appState.customDeliveries));
    if (appState.activeComunidadTab === 'delivery') {
      renderDeliveryRequestPortal();
    }
  }

  appState.driverActiveTrip = null;
  localStorage.removeItem('sabi_driver_active_trip');

  // Also clear buyer's active trip if it was a checkout trip
  if (appState.activeTrip) {
    appState.activeTrip = null;
    localStorage.removeItem('sabi_active_trip');
  }

  showToast("¡Viaje Completado!", `Has entregado con éxito el pedido. Recibiste Afl. ${earnings.toFixed(2)} AWG.`);
  renderAccountModal();
}

function handleUserProductUpload() {
  const title = document.getElementById("ad-modal-title").value.trim();
  const category = document.getElementById("ad-modal-category").value;
  const price = parseFloat(document.getElementById("ad-modal-price").value);
  const desc = document.getElementById("ad-modal-desc").value.trim();
  const contact = document.getElementById("ad-modal-contact").value.trim();
  const deliveryEnabled = document.getElementById("ad-modal-delivery-enabled").checked;

  if (!title || isNaN(price) || price <= 0 || !desc || !contact) {
    showToast("Error", "Completa todos los campos obligatorios.");
    return;
  }

  const presets = {
    "trabajo": "https://images.unsplash.com/photo-1521737711867-e3b904737d88?auto=format&fit=crop&w=400&q=80",
    "alquileres": "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=400&q=80",
    "vehiculos": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80",
    "ropa": "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80",
    "electronica": "https://images.unsplash.com/photo-1468436139062-f60a71c5c892?auto=format&fit=crop&w=400&q=80",
    "joyeria": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=400&q=80",
    "hogar": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80"
  };

  const adImg = presets[category] || presets["electronica"];

  const newAd = {
    id: `ad-user-${Date.now()}`,
    category,
    title,
    price,
    desc,
    contact,
    image: adImg,
    date: new Date().toISOString().split('T')[0],
    user: appState.userProfile.name,
    sponsored: false,
    cpcBid: 0,
    clicks: 0,
    deliveryEnabled
  };

  appState.marketplaceAds.unshift(newAd);
  localStorage.setItem('sabi_marketplace_ads', JSON.stringify(appState.marketplaceAds));

  appState.userProducts.unshift(newAd);
  localStorage.setItem('sabi_user_products', JSON.stringify(appState.userProducts));

  SoundEffects.playJingle();
  showToast("Producto Publicado", `Has subido "${title}" a la Comunidad con éxito.`);

  if (appState.activeComunidadTab === 'market') {
    renderClassifieds();
  }

  appState.activeAccountTab = 'products';
  renderAccountModal();
}

function handleUserProductDelete(productId) {
  SoundEffects.playClick();

  appState.marketplaceAds = appState.marketplaceAds.filter(ad => ad.id !== productId);
  localStorage.setItem('sabi_marketplace_ads', JSON.stringify(appState.marketplaceAds));

  appState.userProducts = appState.userProducts.filter(p => p.id !== productId);
  localStorage.setItem('sabi_user_products', JSON.stringify(appState.userProducts));

  if (appState.activeComunidadTab === 'market') {
    renderClassifieds();
  }

  showToast("Publicación Eliminada", "El clasificado ha sido retirado del marketplace de Sabí.");
  renderAccountModal();
}

// ==================== SABÍ LIVE SHOPPING MODULE ====================

appState.liveStreams = [
  {
    id: "live-1",
    streamerName: "Zoe Fashion Boutique",
    streamerLogo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
    title: "Moda de Verano & Accesorios Chic 👗✨",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-fashion-woman-with-silver-glitter-makeup-40898-large.mp4",
    adId: "ad-7",
    viewers: 142,
    thumbnail: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "live-2",
    streamerName: "Noord Tech Hub",
    streamerLogo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    title: "Unboxing iPhone 15 Pro & Descuentos 📱🔥",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-holding-a-smartphone-next-to-a-laptop-41908-large.mp4",
    adId: "ad-6",
    viewers: 95,
    thumbnail: "https://images.unsplash.com/photo-1468436139062-f60a71c5c892?auto=format&fit=crop&w=400&q=80"
  }
];

let liveCommentsTimer = null;
let activeLiveStreamId = null;

function renderLiveStreams() {
  const container = document.getElementById("live-streams-container");
  if (!container) return;
  
  container.innerHTML = appState.liveStreams.map(stream => {
    return `
      <div class="market-card" onclick="window.openLiveStream('${stream.id}')" style="cursor:pointer; position:relative; overflow:hidden; border:1px solid rgba(255,51,75,0.15)">
        <span style="position:absolute; top:10px; left:10px; background:var(--neon-pink); color:#fff; padding:3px 8px; border-radius:4px; font-size:0.65rem; font-weight:bold; z-index:5;">🔴 EN VIVO</span>
        <span style="position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.6); color:#fff; padding:3px 8px; border-radius:4px; font-size:0.65rem; z-index:5">👁️ ${stream.viewers}</span>
        
        <img src="${stream.thumbnail}" alt="${stream.title}" class="market-card-img" style="filter: brightness(0.85); height: 200px; width: 100%; object-fit: cover">
        
        <div class="market-card-body" style="padding:0.75rem">
          <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.4rem">
            <img src="${stream.streamerLogo}" style="width:20px; height:20px; border-radius:50%; border:1px solid var(--neon-cyan)">
            <strong style="font-size:0.75rem; color:var(--text-muted)">${stream.streamerName}</strong>
          </div>
          <div class="market-card-title" style="font-size:0.85rem; line-height:1.3; font-weight:700; height:34px; overflow:hidden">${stream.title}</div>
          
          <div style="display:flex; align-items:center; justify-content:space-between; margin-top:0.5rem; font-size:0.72rem; color:var(--neon-cyan)">
            <span>Presentación de Producto</span>
            <strong>Ver Live ➔</strong>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openLiveStream(streamId) {
  const stream = appState.liveStreams.find(s => s.id === streamId);
  if (!stream) return;
  
  activeLiveStreamId = streamId;
  
  document.getElementById("live-streamer-name").innerText = stream.streamerName;
  document.getElementById("live-streamer-img").src = stream.streamerLogo;
  document.getElementById("live-viewer-count").innerText = stream.viewers;
  
  const ad = appState.marketplaceAds.find(a => a.id === stream.adId);
  if (ad) {
    document.getElementById("live-product-title").innerText = ad.title;
    document.getElementById("live-product-price").innerText = `Afl. ${ad.price.toLocaleString()} AWG`;
    
    let defaultImg = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80";
    if (ad.category === 'ropa') defaultImg = "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80";
    else if (ad.category === 'electronica') defaultImg = "https://images.unsplash.com/photo-1468436139062-f60a71c5c892?auto=format&fit=crop&w=400&q=80";
    document.getElementById("live-product-img").src = ad.image || defaultImg;
  }
  
  const videoPlayer = document.getElementById("live-video-player");
  if (videoPlayer) {
    videoPlayer.src = stream.videoUrl;
    videoPlayer.load();
    videoPlayer.play().catch(e => console.warn("Auto-play blocked", e));
  }
  
  document.getElementById("live-stream-overlay").style.display = "block";
  
  const commentsBox = document.getElementById("live-comments-box");
  commentsBox.innerHTML = '';
  startLiveComments();
}

function closeLiveStream() {
  SoundEffects.playClick();
  
  const videoPlayer = document.getElementById("live-video-player");
  if (videoPlayer) {
    videoPlayer.pause();
  }
  
  if (liveCommentsTimer) {
    clearInterval(liveCommentsTimer);
    liveCommentsTimer = null;
  }
  
  activeLiveStreamId = null;
  document.getElementById("live-stream-overlay").style.display = "none";
}

function buyProductFromLive() {
  const stream = appState.liveStreams.find(s => s.id === activeLiveStreamId);
  if (!stream) return;
  
  openCheckoutModal(stream.adId);
}

function startLiveComments() {
  const comments = [
    { user: "Amaury Maduro", text: "¡Se ve excelente! ¿Tienen envíos a Santa Cruz?" },
    { user: "Zoe Croes", text: "Me encanta el color. ¿Viene en su caja original?" },
    { user: "Rudolf Kelly", text: "¡Comprado con Sabí-Pay!" },
    { user: "Sandra K.", text: "Espectacular la demostración en vivo." },
    { user: "Miguel C.", text: "El precio está buenísimo." },
    { user: "Zoe Croes", text: "Una pregunta, ¿es negociable?" },
    { user: "Noord Tech Hub", text: "Sí, enviamos a toda la isla por Sabí-Delivery." },
    { user: "Elena B.", text: "¡Quiero uno ya!" },
    { user: "Amaury Maduro", text: "El pago fue instantáneo." }
  ];
  
  const commentsBox = document.getElementById("live-comments-box");
  
  for (let i = 0; i < 2; i++) {
    const r = comments[Math.floor(Math.random() * comments.length)];
    commentsBox.innerHTML += `
      <div><strong style="color:var(--neon-cyan)">${r.user}:</strong> <span style="color:#e2e2e9">${r.text}</span></div>
    `;
  }
  
  liveCommentsTimer = setInterval(() => {
    const r = comments[Math.floor(Math.random() * comments.length)];
    commentsBox.innerHTML += `
      <div><strong style="color:var(--neon-cyan)">${r.user}:</strong> <span style="color:#e2e2e9">${r.text}</span></div>
    `;
    commentsBox.scrollTop = commentsBox.scrollHeight;
    
    if (commentsBox.children.length > 20) {
      commentsBox.removeChild(commentsBox.firstChild);
    }
  }, 2500);
}

// ==================== SABÍ SELLER LIVE STUDIO MODULE ====================

let sellerCameraStream = null;
let sellerLiveTimer = null;
let sellerCommentsTimer = null;
let sellerSimulatedSaleTimer = null;
let sellerActiveProductId = null;
let sellerViewerCount = 0;

function openSellerLiveStudio(productId) {
  const ad = appState.marketplaceAds.find(a => a.id === productId) || appState.userProducts.find(p => p.id === productId);
  if (!ad) return;
  
  sellerActiveProductId = productId;
  
  document.getElementById("seller-stream-product-title").innerText = `Presentando: ${ad.title}`;
  document.getElementById("seller-active-product-title").innerText = ad.title;
  document.getElementById("seller-sales-amount").innerText = ad.price.toLocaleString();
  document.getElementById("seller-stream-title").value = `🔥 Oferta Exclusiva: ${ad.title} 🔥`;
  
  // Update wallet display initially
  document.getElementById("seller-live-wallet-balance").innerText = appState.userWallet.toFixed(2);

  document.getElementById("seller-stream-setup").style.display = "flex";
  document.getElementById("seller-stream-active-panel").style.display = "none";
  document.getElementById("seller-comments-box").style.display = "none";
  document.getElementById("seller-sales-ticker").style.display = "none";
  document.getElementById("seller-live-indicator").style.display = "none";
  document.getElementById("seller-countdown-box").style.display = "none";
  
  document.getElementById("seller-live-overlay").style.display = "block";
  
  const videoElement = document.getElementById("seller-camera-preview");
  const placeholder = document.getElementById("seller-camera-placeholder");
  
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    if (placeholder) placeholder.style.display = "flex";
    
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(stream => {
        sellerCameraStream = stream;
        if (videoElement) {
          videoElement.srcObject = stream;
        }
        if (placeholder) placeholder.style.display = "none";
      })
      .catch(err => {
        console.warn("Camera access rejected", err);
        if (placeholder) {
          placeholder.querySelector("div").innerText = "Estudio Live (Modo Demostración)";
          placeholder.querySelector("div + div").innerText = "No se pudo acceder a la cámara. Transmitiendo cámara estática...";
        }
      });
  } else {
    if (placeholder) {
      placeholder.querySelector("div").innerText = "Estudio Live (Modo Demostración)";
      placeholder.querySelector("div + div").innerText = "Cámara no soportada. Iniciando transmisión de cámara estática...";
    }
  }
}

function closeSellerLiveStudio() {
  if (sellerCameraStream) {
    sellerCameraStream.getTracks().forEach(track => track.stop());
    sellerCameraStream = null;
  }
  
  const videoElement = document.getElementById("seller-camera-preview");
  if (videoElement) {
    videoElement.srcObject = null;
  }
  
  stopSellerLiveTimers();
  
  sellerActiveProductId = null;
  document.getElementById("seller-live-overlay").style.display = "none";
}

function startSellerLiveStream() {
  const streamTitle = document.getElementById("seller-stream-title").value.trim();
  if (!streamTitle) {
    showToast("Título requerido", "Escribe un título para tu transmisión en vivo.");
    return;
  }

  // Cost of starting a Live Stream (Minimum deposit covering first 25 minutes at Afl. 12.00/hour)
  const minDeposit = 5.00;
  if (appState.userWallet < minDeposit) {
    showToast("Saldo Insuficiente", `Iniciar un Sabí Live requiere un depósito de Afl. ${minDeposit.toFixed(2)} AWG (cubre 25 min a razón de Afl. 12/hr). Recarga saldo en tu perfil.`, 5000);
    return;
  }
  
  SoundEffects.playClick();

  // Deduct initial deposit fee
  appState.userWallet -= minDeposit;
  localStorage.setItem('sabi_user_wallet', appState.userWallet.toString());
  showToast("Depósito Adjudicado", `Se han debitado Afl. ${minDeposit.toFixed(2)} AWG de tu billetera Sabí-Pay como depósito inicial de transmisión.`, 3000);
  
  const countdownBox = document.getElementById("seller-countdown-box");
  countdownBox.style.display = "block";
  let count = 3;
  countdownBox.innerText = count.toString();
  
  const interval = setInterval(() => {
    count--;
    if (count > 0) {
      countdownBox.innerText = count.toString();
      SoundEffects.playClick();
    } else {
      clearInterval(interval);
      countdownBox.style.display = "none";
      executeGoLive();
    }
  }, 1000);
}

function executeGoLive() {
  SoundEffects.playJingle();
  showToast("¡Estás en Vivo! 🔴", "Tu transmisión ha comenzado en Aruba.");
  
  document.getElementById("seller-stream-setup").style.display = "none";
  document.getElementById("seller-stream-active-panel").style.display = "flex";
  document.getElementById("seller-comments-box").style.display = "flex";
  document.getElementById("seller-live-indicator").style.display = "flex";
  
  const commentsBox = document.getElementById("seller-comments-box");
  commentsBox.innerHTML = '<div style="color:var(--neon-cyan); font-weight:700">📣 ¡Comenzó el stream! Esperando espectadores...</div>';
  
  sellerViewerCount = 0;
  document.getElementById("seller-live-viewer-count").innerText = sellerViewerCount.toString();
  
  // Set initial wallet balance in Live Studio Header
  document.getElementById("seller-live-wallet-balance").innerText = appState.userWallet.toFixed(2);
  
  sellerLiveTimer = setInterval(() => {
    sellerViewerCount += Math.floor(Math.random() * 8) + 2;
    document.getElementById("seller-live-viewer-count").innerText = sellerViewerCount.toString();
    
    // Billing per unit of time (Afl. 0.10 AWG fee consumption every 3 seconds)
    appState.userWallet -= 0.10;
    if (appState.userWallet < 0) appState.userWallet = 0;
    localStorage.setItem('sabi_user_wallet', appState.userWallet.toString());
    
    const walletBalEl = document.getElementById("seller-live-wallet-balance");
    if (walletBalEl) {
      walletBalEl.innerText = appState.userWallet.toFixed(2);
    }
    
    // Auto terminate stream if wallet balance hits zero
    if (appState.userWallet <= 0) {
      stopSellerLiveStream();
      showToast("Transmisión Cortada", "Se ha cerrado el streaming automáticamente por falta de saldo en tu billetera Sabí-Pay.", 5000);
    }
  }, 3000);
  
  const comments = [
    { user: "Amaury Maduro", text: "¡Se ve excelente! ¿Hacen envíos a Santa Cruz?" },
    { user: "Zoe Croes", text: "Me encanta, justo lo que buscaba." },
    { user: "Rudolf Kelly", text: "Hola! ¿El precio es negociable?" },
    { user: "Sandra K.", text: "Qué buen estado tiene." },
    { user: "Miguel C.", text: "¡Súper precio!" },
    { user: "Zoe Croes", text: "Quiero comprarlo ya." }
  ];
  
  sellerCommentsTimer = setInterval(() => {
    const r = comments[Math.floor(Math.random() * comments.length)];
    commentsBox.innerHTML += `
      <div><strong style="color:var(--neon-cyan)">${r.user}:</strong> <span style="color:#e2e2e9">${r.text}</span></div>
    `;
    commentsBox.scrollTop = commentsBox.scrollHeight;
  }, 3000);
  
  sellerSimulatedSaleTimer = setTimeout(() => {
    triggerSimulatedLiveSale();
  }, 12000);
}

function triggerSimulatedLiveSale() {
  const ad = appState.marketplaceAds.find(a => a.id === sellerActiveProductId) || appState.userProducts.find(p => p.id === sellerActiveProductId);
  if (!ad) return;
  
  SoundEffects.playJingle();
  
  appState.userWallet += ad.price;
  localStorage.setItem('sabi_user_wallet', appState.userWallet.toString());
  
  const walletBalEl = document.getElementById("seller-live-wallet-balance");
  if (walletBalEl) {
    walletBalEl.innerText = appState.userWallet.toFixed(2);
  }
  
  const ticker = document.getElementById("seller-sales-ticker");
  ticker.style.display = "block";
  
  const commentsBox = document.getElementById("seller-comments-box");
  commentsBox.innerHTML += `
    <div style="color:var(--neon-gold); font-weight:bold; background:rgba(255,188,5,0.08); padding:4px 8px; border-radius:6px; margin:4px 0">
      🛍️ ¡Amaury Maduro compró tu producto por Afl. ${ad.price.toLocaleString()} AWG!
    </div>
  `;
  commentsBox.scrollTop = commentsBox.scrollHeight;
  
  showToast("¡Vendido! 🎉", `Amaury Maduro ha comprado tu producto por Afl. ${ad.price.toLocaleString()} AWG.`);
}

function stopSellerLiveStream() {
  SoundEffects.playClick();
  stopSellerLiveTimers();
  
  showToast("Live Finalizado", "Tu transmisión ha concluido con éxito.");
  
  document.getElementById("seller-stream-setup").style.display = "flex";
  document.getElementById("seller-stream-active-panel").style.display = "none";
  document.getElementById("seller-comments-box").style.display = "none";
  document.getElementById("seller-sales-ticker").style.display = "none";
  document.getElementById("seller-live-indicator").style.display = "none";
}

function stopSellerLiveTimers() {
  if (sellerLiveTimer) {
    clearInterval(sellerLiveTimer);
    sellerLiveTimer = null;
  }
  if (sellerCommentsTimer) {
    clearInterval(sellerCommentsTimer);
    sellerCommentsTimer = null;
  }
  if (sellerSimulatedSaleTimer) {
    clearTimeout(sellerSimulatedSaleTimer);
    sellerSimulatedSaleTimer = null;
  }
}

// Update Custom Delivery pricing based on selected Package Size
function updateCustomDeliveryPrice() {
  const sizeSelect = document.getElementById("delivery-size");
  if (!sizeSelect) return;
  
  const size = sizeSelect.value;
  const now = new Date();
  const hour = now.getHours();
  const isNight = (hour >= 20 || hour < 6);
  
  let basePrice = 12.00;
  if (size === 'light') {
    basePrice = isNight ? 18.00 : 12.00;
  } else if (size === 'medium') {
    basePrice = isNight ? 30.00 : 20.00;
  } else if (size === 'heavy') {
    basePrice = isNight ? 65.00 : 45.00;
  }
  
  const priceInput = document.getElementById("delivery-price");
  if (priceInput) {
    priceInput.value = `Afl. ${basePrice.toFixed(2)}`;
  }
}

// ==================== SABÍ MULTILINGUAL i18n ENGINE ====================

const SABI_TRANSLATIONS = {
  es: {
    app_title: "Sabí",
    app_subtitle: "Inteligencia y Utilidad para Aruba",
    footer_disclaimer: "Servicio de suscripción premium para residentes y visitantes de Aruba. Todas las utilidades, comparativas de tarifas e importaciones se basan en normativas y directrices arubanas vigentes.",
    profile_btn: "👤 Cuenta Premium",
    tab_comunidad: "Comunidad",
    tab_servicios: "Servicios",
    tab_suerte: "Suerte",
    subtab_market: "Compra & Venta",
    subtab_delivery: "Pide un Delivery",
    subtab_live: "Sabí Live",
    subtab_emergencia: "Emergencias",
    subtab_directorio: "Directorio Gov",
    subtab_calculadora: "Calculadora",
    subtab_educacion: "Educación",
    subtab_deportes: "Deportes Sabí",
    subtab_comercio: "Negocio y Comercio",
    subtab_llegadas: "Llegadas",
    market_title: "Mercado de Clasificados Verificados",
    market_subtitle: "Encuentra empleos locales, alquileres a largo plazo, vehículos o servicios profesionales ofrecidos por miembros verificados.",
    search_placeholder: "Buscar clasificado (ej. 'Toyota', 'Plomero')...",
    cat_all: "Todas las Categorías",
    cat_trabajo: "Trabajo",
    cat_alquileres: "Alquileres",
    cat_vehiculos: "Vehículos",
    cat_ropa: "Ropa y Accesorios",
    cat_electronica: "Electrónica",
    cat_joyeria: "Joyería",
    cat_hogar: "Artículos del Hogar",
    cat_servicios_hogar: "Servicios de Hogar (Plomería, Limpieza)",
    cat_servicios_profesionales: "Servicios Profesionales (Asesoría, Tutoría)",
    cat_servicios_salud: "Salud y Belleza (Estética, Cuidado)",
    cat_servicios_tecnicos: "Soporte Técnico (Reparación de PCs/Móviles)",
    cat_servicios_transporte: "Transporte y Acarreos (Fletes, Mudanzas)",
    cat_servicios_eventos: "Eventos y Catering (Comidas, Fiestas)",
    custom_delivery_title: "📦 Pide un Delivery Personalizado",
    custom_delivery_subtitle: "Solicita que un repartidor compre o retire algo específico para ti en cualquier punto de la isla.",
    label_name: "Tu Nombre",
    placeholder_name: "Tu nombre...",
    label_gps: "Compartir Mi Ubicación Actual",
    btn_gps: "📍 Compartir Ubicación GPS",
    gps_status_none: "Ubicación no compartida",
    gps_status_shared: "Ubicación GPS compartida",
    label_delivery_title: "Título del Delivery (Qué necesitas)",
    placeholder_delivery_title: "Ej. Compras en Supermercado Kong Hing",
    label_delivery_desc: "Descripción del Pedido (Detalles)",
    placeholder_delivery_desc: "Ej. Panadol, Cambio de Afl. 50...",
    label_pickup_address: "Dirección de Recogida (Dónde retirar)",
    placeholder_pickup_address: "Ej. Supermercado Kong Hing, Caya G. F. Croes",
    label_delivery_address: "Dirección de Entrega (Dónde recibir)",
    placeholder_delivery_address: "Ej. Caya G. F. Croes 45, Oranjestad",
    label_package_size: "Tamaño del Paquete / Tipo de Carga",
    size_light: "Ligero (Documentos, Comida, Ropa, etc.)",
    size_medium: "Mediano (Cajas, Electrodomésticos, etc.)",
    size_heavy: "Pesado / Flete (Juegos de sala, Camas, etc.)",
    label_fare: "Tarifa Acordada (Calculada)",
    delivery_desc_note: "* La tarifa nocturna se aplica automáticamente de 20:00 a 06:00. Tarifas base: Ligero Afl. 12/18, Mediano Afl. 20/30, Flete Afl. 45/65.",
    btn_send_delivery: "🚀 Enviar Solicitud de Delivery",
    status_searching: "Buscando repartidor... 🔍",
    status_assigned: "Repartidor Asignado 🚗",
    status_transit: "En camino 📦",
    status_delivered: "¡Entregado! 🎉",
    history_title: "Mis Pedidos Recientes",
    btn_clear_history: "🗑️ Borrar Historial",
    no_recent_orders: "No tienes pedidos de delivery recientes.",
    btn_buy_now: "🛒 Comprar Ya",
    btn_delete: "🗑️ Eliminar",
    btn_go_live: "🎥 Transmitir Live",
    btn_close: "Cerrar",
    tab_profile: "👤 Mi Perfil",
    tab_driver: "🛵 Hazte Delivery",
    tab_upload: " Sube un Producto",
    tab_products: "🛍️ Mis Artículos",
    tab_b2b: " B2B Publicidad",
    select_game: "Seleccionar Juego:",
    loading_db: "Cargando base de datos...",
    lottery_dashboard: "Dashboard",
    lottery_generator: "Recomendador",
    lottery_history: "Sorteos",
    filter_analysis: "FILTRAR ANÁLISIS:",
    filter_any_day: "Cualquier Día de la Semana",
    day_monday: "Lunes",
    day_tuesday: "Martes",
    day_wednesday: "Miércoles",
    day_thursday: "Jueves",
    day_friday: "Viernes",
    day_saturday: "Sábado",
    day_sunday: "Domingo",
    filter_any_week: "Cualquier Semana del Mes",
    week_1: "Semana 1 (Días 1-7)",
    week_2: "Semana 2 (Días 8-14)",
    week_3: "Semana 3 (Días 15-21)",
    week_4: "Semana 4 (Días 22+)",
    filter_any_month: "Cualquier Mes del Año",
    month_january: "Enero",
    month_february: "Febrero",
    month_march: "Marzo",
    month_april: "Abril",
    month_may: "Mayo",
    month_june: "Junio",
    month_july: "Julio",
    month_august: "Agosto",
    month_september: "Septiembre",
    month_october: "Octubre",
    month_november: "Noviembre",
    month_december: "Diciembre",
    filter_any_draw: "Cualquier Turno (Todo el día)",
    draw_midday: "Turno Atardi (Mediodía)",
    draw_evening: "Turno Anochi (Noche)",
    metric_total_draws: "Sorteos Analizados",
    metric_hottest: "Número Más Caliente",
    metric_coldest: "Número Más Frío",
    metric_overdue: "Más Atrasado",
    frequency_chart_title: "Frecuencia General de Números",
    times_drawn: "Veces sorteado",
    top_combos_title: "Duos y Trios Más Frecuentes",
    top_duos_label: "Duos (Parejas) más comunes",
    top_trios_label: "Trios (Tripletas) más comunes",
    digits_balance_title: "Balance de Dígitos",
    even_odd_balance: "Balance Pares vs. Impares",
    history_short: "Historial",
    low_high_balance: "Balance Bajos (0-4) vs. Altos (5-9)",
    pos_analysis_title: "Análisis por Posición",
    exit_order: "Orden de Salida",
    most_common: "Más Comunes",
    drawn_together: "Salen juntos",
    zodiac_signs_freq: "Frecuencia de Signos Zodiacales",
    digits_freq_title: "Frecuencia de Dígitos (0 a 9)",
    by_position: "Por posición",
    generator_strategy_title: "Estrategia de Recomendación Inteligente",
    generator_strategy_desc: "Elige una estrategia probabilística impulsada por patrones de IA para generar tu combinación recomendada.",
    strat_balanced: "Balanceada",
    strat_balanced_desc: "Mezcla números calientes y fríos bajo proporciones matemáticas ideales de par e impar.",
    strat_positional: "Por Posición",
    strat_positional_desc: "Genera el boleto basándose en los números más frecuentes según su posición de salida.",
    strat_hot: "Calientes",
    strat_hot_desc: "Combina los números o dígitos de mayor recurrencia histórica general.",
    strat_overdue: "Atrasados",
    strat_overdue_desc: "Favorece los números que llevan mayor cantidad de sorteos sin ser jugados.",
    strat_random: "Al Azar",
    strat_random_desc: "Simulación clásica de selección rápida (Quick Pick) de terminal.",
    btn_generate: "⚡ Generar Combinación Recomendada",
    empty_gen_text: "Haz clic en el botón de arriba para generar números",
    generator_strategy_zodiac_title: "Estrategia de Recomendación para Zodiac",
    generator_strategy_zodiac_desc: "Elige una estrategia para generar tus 4 dígitos y signo zodiacal recomendados.",
    strat_zodiac_balanced_desc: "Combina dígitos calientes y atrasados con un balance de par/impar y un signo regular.",
    strat_zodiac_hot_desc: "Genera la jugada con los dígitos y el signo zodiacal de mayor frecuencia.",
    strat_zodiac_overdue_desc: "Favorece los dígitos y el signo que más sorteos llevan sin salir.",
    strat_zodiac_random_desc: "Quick Pick aleatorio de 4 dígitos y 1 signo zodiacal.",
    btn_generate_zodiac: "⚡ Generar Jugada Zodiac",
    empty_gen_zodiac: "Haz clic en el botón de arriba para generar tu jugada Zodiac",
    history_explorer_title: "Explorador de Sorteos Históricos",
    history_search_placeholder: "Buscar sorteo por número, fecha (ej. 'Jun 10'), turno o signo...",
    sports_hub_title: "Centro de Analítica Deportiva Sabí",
    sports_hub_subtitle: "Resultados en vivo, clasificaciones y pronósticos inteligentes para apuestas.",
    sports_hub_tab_live: "🔴 En Vivo",
    sports_hub_tab_standings: "📊 Posiciones",
    sports_hub_tab_betting: "💡 Pronósticos AI",
    sports_hub_sport_local: "Aruba Local",
    sports_hub_sport_futbol: "Fútbol Mundial",
    sports_hub_sport_beisbol: "MLB Béisbol",
    sports_hub_sport_baloncesto: "NBA Básquet",
    sports_hub_sport_nfl: "NFL",
    sports_hub_sport_nhl: "NHL",
    sports_hub_live_now: "Partidos En Curso",
    sports_hub_upcoming: "Próximos Partidos",
    sports_hub_h2h: "Historial H2H",
    sports_hub_win_prob: "Probabilidad de Victoria",
    sports_hub_streak: "Racha",
    sports_hub_best_bet: "Mejor Apuesta",
    sports_hub_ai_tip: "Análisis de la IA",
    sports_hub_totals_prediction: "Predicción de Totales",
    sports_hub_odds: "Cuotas",
    sports_hub_rank: "Pos",
    sports_hub_team: "Equipo",
    sports_hub_played: "PJ",
    sports_hub_won: "G",
    sports_hub_lost: "P",
    sports_hub_drawn: "E",
    sports_hub_points: "Pts",
    sports_hub_pct: "%",
    sports_hub_draw: "Empate",
    sports_hub_no_live: "No hay partidos en vivo en este momento.",
    sports_reminder: "Recordatorio",
    sports_reminder_saved: "¡Recordatorio guardado para:",
    sports_bestbet_local: "Ganador RCA (Home)",
    sports_bestbet_futbol: "Real Madrid o Empate (Double Chance)",
    sports_bestbet_beisbol: "NY Yankees -1.5 (Run Line)",
    sports_bestbet_baloncesto: "Boston Celtics Ganador (Moneyline)",
    sports_bestbet_nfl: "Kansas City Chiefs Ganador",
    sports_bestbet_nhl: "Edmonton Oilers (Moneyline)",
    sports_aitip_local: "RCA muestra dominio histórico de local en el clásico. Se espera un juego cerrado pero favorable a RCA.",
    sports_aitip_futbol: "El Clásico llega en un momento de alta efectividad ofensiva para ambos. El local parte con ligera ventaja debido a su invicto de local.",
    sports_aitip_beisbol: "Gerrit Cole abre por los Yankees hoy. Boston ha tenido problemas de bateo contra abridores derechos de élite esta semana.",
    sports_aitip_baloncesto: "Boston tiene mejor profundidad en la banca. Se prevé un duelo defensivo tenso con ritmo pausado.",
    sports_aitip_nfl: "Revancha del Super Bowl. Mahomes en partidos grandes suele rendir mejor que la media. Apuesta de alta volatilidad.",
    sports_aitip_nhl: "Edmonton es extremadamente fuerte en el Rogers Place. Connor McDavid se encuentra en una racha goleadora de 4 juegos.",
    school_calc_direct_phone: "Teléfono Directo",
    school_calc_services: "Servicios / Equipamiento",
    school_calc_website: "Sitio Web",
    school_calc_gps: "Ubicación en GPS",
    school_calc_budget_title: "Presupuesto Inicial Proyectado",
    school_calc_school_fees: "Costos de Matrícula y Servicios (Pagados al Colegio)",
    school_calc_enrollment: "Matrícula de Inscripción",
    school_calc_airco: "Mantenimiento de Aire Acondicionado (A/C)",
    school_calc_subtotal: "Subtotal Colegio (Obligatorio)",
    school_calc_other_expenses: "Otros Gastos Estimados (Terceros / Opcionales)",
    school_calc_uniforms: "Uniformes (Proyección)",
    school_calc_parents_committee: "Comité de Padres (Oudercommissie)",
    school_calc_supplies: "Útiles Escolares & Libros",
    school_calc_total: "Presupuesto Inicial Total",
    school_calc_regulatory_body: "Ente Regulador",
    school_calc_office_phone: "Teléfono Sede",
    school_calc_individual_contact: "Contacto individual",
    school_calc_official_website: "Sitio Web Oficial",
    school_calc_office_address: "Dirección Sede",
    school_calc_office_gps: "Ruta GPS Sede",
    calc_not_available: "No disponible",
    arrivals_status_delayed: "Retrasado",
    arrivals_status_landed: "Aterrizó",
    arrivals_status_expected: "Programado",
    arrivals_status_completed: "Completado",
    arrivals_status_intransit: "En Tránsito",
    arrivals_origin: "Origen",
    arrivals_capacity: "Capacidad",
    arrivals_passengers: "Pasajeros",
    arrivals_main_airlines: "Líneas principales",
    arrivals_main_cruiselines: "Líneas en tránsito",
    arrivals_avg_load: "Ocupación promedio",
    arrivals_avg_stay: "Estancia",
    arrivals_airport_title: "Aeropuerto Reina Beatrix",
    arrivals_pax_today_label: "Pasajeros Estimados Hoy",
    arrivals_pax_val: "5,600 PAX",
    arrivals_flights_arriving: "Vuelos Arribando",
    arrivals_flights_arriving_val: "8 Vuelos",
    arrivals_us_market: "Mercado de EE.UU.",
    arrivals_us_market_val: "78% de cuota",
    arrivals_peak_hour: "Hora Pico de Flujo",
    arrivals_peak_hour_val: "12:00 PM - 03:00 PM",
    arrivals_taxi_tips_title: "Consejos para Operadores y Taxis",
    arrivals_taxi_tips_desc: "Se espera un alto flujo de pasajeros provenientes de EE.UU. entre las 12:00 PM y las 3:00 PM. Se recomienda a los taxistas posicionarse en la terminal norte.",
    arrivals_exemption_title: "Exención Aduanera",
    arrivals_exemption_desc: "Los viajeros pueden ingresar compras libres de impuestos personales por un valor máximo de hasta Afl. 400.00.",
    arrivals_weekly_proj_title: "Proyección Semanal",
    arrivals_weekly_flights_label: "Vuelos de la Semana",
    arrivals_weekly_flights_val: "182 Arribos",
    arrivals_weekly_pax_lbl: "Pax Estimados",
    arrivals_weekly_pax_val: "36,400 turistas",
    arrivals_weekly_peak_day_lbl: "Día de Mayor Flujo",
    arrivals_weekly_peak_day_val: "Sábado (32 vuelos)",
    arrivals_weekly_origin_lbl: "Origen Principal",
    arrivals_weekly_origin_val: "Miami / JFK",
    arrivals_weekly_tips_title: "Planificación Turística",
    arrivals_weekly_tips_desc: "El fin de semana (especialmente el sábado) registra el 35% del volumen semanal de arribos. Agencias de rentas de autos y transfers deben reforzar su flota en el aeropuerto.",
    arrivals_us_terminal_title: "Terminal de EE.UU.",
    arrivals_us_terminal_desc: "El pre-despacho de aduanas de EE.UU. (US Preclearance) opera regularmente desde las 8:00 AM.",
    arrivals_monthly_est_title: "Estimado Mensual (Junio)",
    arrivals_monthly_pax_label: "Total Pasajeros del Mes",
    arrivals_monthly_pax_val: "156,000 Pax",
    arrivals_monthly_flights_lbl: "Vuelos Entrantes",
    arrivals_monthly_flights_val: "780 vuelos",
    arrivals_monthly_occ_lbl: "Ocupación Hotelera",
    arrivals_monthly_occ_val: "89% Noord / 78% Play",
    arrivals_monthly_leader_lbl: "Aerolínea Líder",
    arrivals_monthly_leader_val: "American Airlines",
    arrivals_monthly_tips_title: "Métricas de Ocupación",
    arrivals_monthly_tips_desc: "La afluencia hotelera del mes se concentra fuertemente en el distrito de Noord (Palm Beach y Eagle Beach), impulsando el consumo nocturno en restaurantes de esa franja.",
    arrivals_port_title: "Puerto de Oranjestad",
    arrivals_cruisers_today_label: "Cruceristas en Puerto Hoy",
    arrivals_cruisers_today_val: "5,600 Pax",
    arrivals_ships_port_lbl: "Barcos en Puerto",
    arrivals_ships_port_val: "2 Cruceros",
    arrivals_econ_impact_lbl: "Inyección Económica",
    arrivals_econ_impact_val: "Est. $672,000 USD",
    arrivals_avg_spend_lbl: "Gasto Promedio/Pax",
    arrivals_avg_spend_val: "$120.00 USD",
    arrivals_commerce_tips_title: "Consejos para Comercios locales",
    arrivals_commerce_tips_desc: "El tránsito de peatones en la zona centro de Oranjestad estará sumamente activo entre las 9:00 AM y las 3:00 PM. Tiendas en L.G. Smith Blvd y Main Street verán una gran demanda.",
    arrivals_local_commerce_title: "Comercio local",
    arrivals_local_commerce_desc: "Los cruceristas buscan principalmente joyería fina, artesanías locales y productos de Aloe Vera de Aruba.",
    arrivals_port_weekly_title: "Puerto: Itinerario Semanal",
    arrivals_weekly_cruisers_lbl: "Cruceristas de la Semana",
    arrivals_weekly_cruisers_val: "15,070 Pax",
    arrivals_scheduled_cruises_lbl: "Cruceros Programados",
    arrivals_scheduled_cruises_val: "5 Cruceros",
    arrivals_weekly_impact_lbl: "Impacto Financiero",
    arrivals_weekly_impact_val: "Est. $1.8M AWG",
    arrivals_largest_ship_lbl: "Barco Más Grande",
    arrivals_largest_ship_val: "Disney Fantasy (4,000 pax)",
    arrivals_port_logistics_title: "Logística de Puerto",
    arrivals_port_logistics_desc: "El viernes se espera el mayor volumen de turistas simultáneos por el Disney Fantasy. Tour operadores en Oranjestad deben prever autobuses suficientes para excursiones a las ruinas de oro y playas del norte.",
    arrivals_port_monthly_title: "Puerto: Proyección Mensual",
    arrivals_monthly_cruisers_lbl: "Total Turistas por Puerto",
    arrivals_monthly_cruisers_val: "67,290 Pax",
    arrivals_monthly_ships_lbl: "Total Barcos del Mes",
    arrivals_monthly_ships_val: "22 barcos",
    arrivals_monthly_impact_lbl: "Impacto Económico Directo",
    arrivals_monthly_impact_val: "Est. $8.1M AWG",
    arrivals_most_frequent_line_lbl: "Línea Más Frecuente",
    arrivals_most_frequent_line_val: "Royal Caribbean Group",
    arrivals_gdp_impact_title: "Impacto en el PIB Comercial",
    arrivals_gdp_impact_desc: "El turismo de cruceros representa aproximadamente el 22% de la inyección directa al comercio minorista de la isla. Las estadísticas del mes indican un repunte en el gasto en restaurantes locales y boutiques tradicionales de la capital.",
    comercio_resorts: "Hoteles Resorts",
    comercio_all_inclusive: "Hoteles Todo Incluidos",
    comercio_condos: "Condominios (Condos)",
    comercio_villas: "Villas",
    comercio_boutique_apts: "Apartamentos Boutique",
    comercio_footfall: "AFLUENCIA",
    comercio_occupancy: "Ocupación",
    comercio_transit: "Tránsito",
    comercio_visitors: "Visitantes",
    comercio_cruises: "Cruceros",
    comercio_tours: "Tours",
    comercio_share_gps_btn: "📍 Compartir Ubicación y Buscar Negocios Cercanos",
    comercio_gps_obtaining: "Obteniendo ubicación satelital GPS...",
    comercio_gps_shared_here: "📍 Ubicación compartida. ¡Te encontramos a ~{dist}m de esta zona! Negocios locales a < 100m:",
    comercio_gps_simulating: "📍 GPS (Lat: {lat}, Lng: {lng}). Simulando rango en {target} para demostración. Negocios a < 100m:",
    comercio_gps_denied: "⚠️ Permiso de ubicación denegado. Cargando negocios simulados a < 100m para esta zona:",
    comercio_gps_not_supported: "⚠️ Geolocalización no soportada. Cargando negocios simulados a < 100m para esta zona:",
    comercio_no_businesses: "No se encontraron negocios cercanos.",
    comercio_lvl_very_high: "Muy Alto 🔥",
    comercio_lvl_high: "Alto 📈",
    comercio_lvl_moderate: "Moderado ⚖️",
    comercio_lvl_low: "Bajo 📉",
    subtab_cursos: "Sabí Cursos",
    subtab_financiero: "Contabilidad Personal",
    subtab_credito: "Sabí Crédito",
    services_courses_title: "🎓 Sabí Cursos - Hub de Aprendizaje",
    services_courses_subtitle: "Desbloquea tu potencial con cursos diseñados para el éxito en negocios online, finanzas e inversión.",
    courses_search_placeholder: "Buscar curso...",
    courses_cat_all: "Todas las Categorías",
    courses_cat_business: "Negocios Online",
    courses_cat_finanzas: "Finanzas",
    courses_cat_inversion: "Inversión",
    finance_lbl_balance: "Balance Actual",
    finance_lbl_income: "Total Ingresos",
    finance_lbl_expenses: "Total Gastos",
    finance_lbl_savings: "Tasa de Ahorro",
    finance_form_title: "💸 Registrar Ingreso / Gasto",
    finance_form_type: "Tipo de Operación",
    finance_type_expense: "Expense (Gasto)",
    finance_type_income: "Income (Ingreso)",
    finance_form_amount: "Monto (Afl. AWG)",
    finance_form_category: "Categoría",
    finance_cat_comida: "Comida & Bebida",
    finance_cat_alquiler: "Alquiler / Vivienda",
    finance_cat_salario: "Salario / Negocios",
    finance_cat_ocio: "Entretenimiento / Ocio",
    finance_cat_transporte: "Transporte",
    finance_cat_servicios: "Servicios (Agua/Luz)",
    finance_cat_otros: "Otros Gastos",
    finance_form_desc: "Descripción",
    finance_btn_save: "💾 Guardar Registro",
    finance_ai_title: "IA Insights Financieros",
    finance_dist_title: "📊 Distribución de Gastos",
    finance_history_title: "📜 Movimientos Recientes",
    finance_col_desc: "Detalle",
    finance_col_cat: "Categoría",
    finance_col_amount: "Monto",
    finance_col_act: "Acción",
    loan_title: "Sabí Crédito - Micropréstamos Instantáneos",
    loan_subtitle: "Financiamiento rápido para emprendedores y proyectos personales en Aruba. Sin papeleo, aprobación al instante.",
    loan_active_header: "Tu Préstamo Activo",
    loan_amount: "Monto del Préstamo",
    loan_term: "Plazo (Meses)",
    loan_interest: "Tasa de Interés Anual (APR)",
    loan_monthly_payment: "Pago Mensual",
    loan_total_repayment: "Total a Repagar",
    loan_status: "Estado",
    loan_status_approved: "Aprobado - Fondos Transferidos",
    loan_repay_btn: "💸 Pagar Cuota / Saldar Lening",
    loan_apply_header: "Solicitar un Nuevo Micropréstamo",
    loan_select_amount: "Monto a Solicitar",
    loan_select_term: "Plazo de Repago",
    loan_purpose: "Propósito del Préstamo",
    loan_purpose_business: "Capital de Trabajo / Negocio",
    loan_purpose_education: "Educación / Cursos",
    loan_purpose_personal: "Gastos Personales / Emergencia",
    loan_purpose_refinance: "Refinanciar Deudas",
    loan_calc_preview: "Vista Previa de tu Crédito",
    loan_monthly_est: "Cuota Mensual Estimada",
    loan_submit_btn: "🚀 Solicitar Aprobación Instantánea",
    loan_success_msg: "🎉 ¡Felicidades! Tu micropréstamo ha sido aprobado al instante. Los fondos se han transferido a tu billetera.",
    loan_repaid_msg: "✅ ¡Pago realizado con éxito! Tu saldo pendiente se ha actualizado.",
    loan_settled_msg: "🎉 ¡Felicidades! Has liquidado por completo tu micropréstamo.",
    loan_error_insufficient: "❌ Fondos insuficientes en tu billetera para realizar este pago.",
    loan_pool_label: "Fondo Común de Crédito",
    loan_pool_earnings: "Intereses Generados (Compuesto)",
    loan_tier_label: "Nivel de Crédito",
    loan_tier_desc: "Paga a tiempo para aumentar tu nivel y desbloquear montos mayores.",
    loan_suspended_label: "Plan Suspendido",
    loan_suspended_desc: "Tu plan de crédito está suspendido debido a pagos fuera de plazo. Estará bloqueado hasta:",
    loan_queue_title: "Cola de Espera (Otros Emprendedores)",
    loan_queue_col_name: "Emprendedor",
    loan_queue_col_amount: "Monto Solicitado",
    loan_queue_col_status: "Estado",
    loan_queue_col_action: "Acción",
    loan_queue_status_pending: "Esperando Fondos",
    loan_queue_status_approved: "Financiado",
    loan_queue_btn_process: "Aprobar Siguiente Solicitud",
    loan_queue_btn_simulate: "Simular Solicitud de Tercero",
    loan_repay_ontime: "Pagar Cuota (A Tiempo)",
    loan_repay_late: "Pagar Cuota (Con Demora)",
    loan_btn_skip_time: "⏩ Avanzar Tiempo (Quitar Suspensión)",
    loan_error_pool_empty: "Fondo Común sin capital suficiente para este préstamo."
  },
  en: {
    app_title: "Sabí",
    app_subtitle: "Aruba Intelligence & Utility",
    footer_disclaimer: "Premium subscription service for Aruba residents and visitors. All utilities, rate comparisons, and imports are based on current Aruban regulations and guidelines.",
    profile_btn: "👤 Premium Account",
    tab_comunidad: "Community",
    tab_servicios: "Services",
    tab_suerte: "Lucky",
    subtab_market: "Buy & Sell",
    subtab_delivery: "Request Delivery",
    subtab_live: "Sabí Live",
    subtab_emergencia: "Emergencies",
    subtab_directorio: "Gov Directory",
    subtab_calculadora: "Calculator",
    subtab_educacion: "Education",
    subtab_deportes: "Sabi Sports",
    subtab_comercio: "Business & Trade",
    subtab_llegadas: "Arrivals",
    market_title: "Verified Classifieds Marketplace",
    market_subtitle: "Find local jobs, long term rentals, vehicles or professional services offered by verified members.",
    search_placeholder: "Search classifieds (e.g. 'Toyota', 'Plumber')...",
    cat_all: "All Categories",
    cat_trabajo: "Jobs",
    cat_alquileres: "Rentals",
    cat_vehiculos: "Vehicles",
    cat_ropa: "Clothing & Accessories",
    cat_electronica: "Electronics",
    cat_joyeria: "Jewelry",
    cat_hogar: "Home Goods",
    cat_servicios_hogar: "Home Services (Plumbing, Cleaning)",
    cat_servicios_profesionales: "Professional Services (Coaching, Tutoring)",
    cat_servicios_salud: "Health & Beauty (Spa, Care)",
    cat_servicios_tecnicos: "Tech Support (PC/Mobile Repair)",
    cat_servicios_transporte: "Transport & Hauling (Freights, Moves)",
    cat_servicios_eventos: "Events & Catering (Food, Parties)",
    custom_delivery_title: "📦 Request Custom Delivery",
    custom_delivery_subtitle: "Request a delivery driver to buy or pick up something specific for you anywhere on the island.",
    label_name: "Your Name",
    placeholder_name: "Your name...",
    label_gps: "Share My Current Location",
    btn_gps: "📍 Share GPS Location",
    gps_status_none: "Location not shared",
    gps_status_shared: "GPS Location shared",
    label_delivery_title: "Delivery Title (What do you need)",
    placeholder_delivery_title: "E.g. Groceries at Kong Hing Supermarket",
    label_delivery_desc: "Order Description (Details)",
    placeholder_delivery_desc: "E.g. Panadol, change of Afl. 50...",
    label_pickup_address: "Pickup Address (Where to collect)",
    placeholder_pickup_address: "E.g. Kong Hing Supermarket, Caya G. F. Croes",
    label_delivery_address: "Delivery Address (Where to drop off)",
    placeholder_delivery_address: "E.g. Caya G. F. Croes 45, Oranjestad",
    label_package_size: "Package Size / Cargo Type",
    size_light: "Light (Documents, Food, Clothes, etc.)",
    size_medium: "Medium (Boxes, Appliances, etc.)",
    size_heavy: "Heavy / Freight (Living sets, Beds, etc.)",
    label_fare: "Agreed Fare (Calculated)",
    delivery_desc_note: "* Night rate applies automatically from 20:00 to 06:00. Base fares: Light Afl. 12/18, Medium Afl. 20/30, Freight Afl. 45/65.",
    btn_send_delivery: "🚀 Send Delivery Request",
    status_searching: "Searching driver... 🔍",
    status_assigned: "Driver Assigned 🚗",
    status_transit: "In transit 📦",
    status_delivered: "Delivered! 🎉",
    history_title: "My Recent Orders",
    btn_clear_history: "🗑️ Clear History",
    no_recent_orders: "You have no recent delivery requests.",
    btn_buy_now: "🛒 Buy Now",
    btn_delete: "🗑️ Delete",
    btn_go_live: "🎥 Go Live",
    btn_close: "Close",
    tab_profile: "👤 My Profile",
    tab_driver: "🛵 Become a Driver",
    tab_upload: " Post an Ad",
    tab_products: "🛍️ My Items",
    tab_b2b: " B2B Advertising",
    select_game: "Select Game:",
    loading_db: "Loading database...",
    lottery_dashboard: "Dashboard",
    lottery_generator: "Generator",
    lottery_history: "Draws",
    filter_analysis: "FILTER ANALYSIS:",
    filter_any_day: "Any Day of the Week",
    day_monday: "Monday",
    day_tuesday: "Tuesday",
    day_wednesday: "Wednesday",
    day_thursday: "Thursday",
    day_friday: "Friday",
    day_saturday: "Saturday",
    day_sunday: "Sunday",
    filter_any_week: "Any Week of the Month",
    week_1: "Week 1 (Days 1-7)",
    week_2: "Week 2 (Days 8-14)",
    week_3: "Week 3 (Days 15-21)",
    week_4: "Week 4 (Days 22+)",
    filter_any_month: "Any Month of the Year",
    month_january: "January",
    month_february: "February",
    month_march: "March",
    month_april: "April",
    month_may: "May",
    month_june: "June",
    month_july: "July",
    month_august: "August",
    month_september: "September",
    month_october: "October",
    month_november: "November",
    month_december: "December",
    filter_any_draw: "Any Shift (All day)",
    draw_midday: "Midday Shift",
    draw_evening: "Evening Shift",
    metric_total_draws: "Analyzed Draws",
    metric_hottest: "Hottest Number",
    metric_coldest: "Coldest Number",
    metric_overdue: "Most Overdue",
    frequency_chart_title: "General Number Frequency",
    times_drawn: "Times drawn",
    top_combos_title: "Most Frequent Pairs & Triplets",
    top_duos_label: "Most common pairs (Duos)",
    top_trios_label: "Most common triplets (Trios)",
    digits_balance_title: "Digits Balance",
    even_odd_balance: "Even vs. Odd Balance",
    history_short: "History",
    low_high_balance: "Low (0-4) vs. High (5-9) Balance",
    pos_analysis_title: "Analysis by Position",
    exit_order: "Exit Order",
    most_common: "Most Common",
    drawn_together: "Drawn together",
    zodiac_signs_freq: "Zodiac Signs Frequency",
    digits_freq_title: "Digits Frequency (0 to 9)",
    by_position: "By position",
    generator_strategy_title: "Smart Recommendation Strategy",
    generator_strategy_desc: "Choose a probabilistic strategy driven by AI patterns to generate your recommended combination.",
    strat_balanced: "Balanced",
    strat_balanced_desc: "Mixes hot and cold numbers under ideal mathematical odd/even ratios.",
    strat_positional: "By Position",
    strat_positional_desc: "Generates the ticket based on the most frequent numbers according to exit position.",
    strat_hot: "Hot Numbers",
    strat_hot_desc: "Combines numbers or digits with the highest general historical recurrence.",
    strat_overdue: "Overdue",
    strat_overdue_desc: "Favors numbers that have gone the longest without being drawn.",
    strat_random: "Random",
    strat_random_desc: "Classic Quick Pick terminal selection simulation.",
    btn_generate: "⚡ Generate Recommendation",
    empty_gen_text: "Click the button above to generate numbers",
    generator_strategy_zodiac_title: "Zodiac Recommendation Strategy",
    generator_strategy_zodiac_desc: "Choose a strategy to generate your recommended 4 digits and zodiac sign.",
    strat_zodiac_balanced_desc: "Combines hot and overdue digits with even/odd balance and a regular sign.",
    strat_zodiac_hot_desc: "Generates the play with the most frequent digits and zodiac sign.",
    strat_zodiac_overdue_desc: "Favors digits and zodiac sign that have gone the longest without being drawn.",
    strat_zodiac_random_desc: "Random Quick Pick of 4 digits and 1 zodiac sign.",
    btn_generate_zodiac: "⚡ Generate Zodiac Play",
    empty_gen_zodiac: "Click the button above to generate your Zodiac play",
    history_explorer_title: "Historical Draws Explorer",
    history_search_placeholder: "Search draw by number, date (e.g. 'Jun 10'), shift or sign...",
    sports_hub_title: "Sabí Sports Analytics Hub",
    sports_hub_subtitle: "Live scores, standings, and intelligent betting predictions.",
    sports_hub_tab_live: "🔴 Live & Fixtures",
    sports_hub_tab_standings: "📊 Standings",
    sports_hub_tab_betting: "💡 AI Predictions",
    sports_hub_sport_local: "Aruba Local",
    sports_hub_sport_futbol: "World Soccer",
    sports_hub_sport_beisbol: "MLB Baseball",
    sports_hub_sport_baloncesto: "NBA Basketball",
    sports_hub_sport_nfl: "NFL",
    sports_hub_sport_nhl: "NHL",
    sports_hub_live_now: "Matches in Progress",
    sports_hub_upcoming: "Upcoming Fixtures",
    sports_hub_h2h: "H2H History",
    sports_hub_win_prob: "Win Probability",
    sports_hub_streak: "Streak",
    sports_hub_best_bet: "Best Bet",
    sports_hub_ai_tip: "AI Analysis",
    sports_hub_totals_prediction: "Totals Prediction",
    sports_hub_odds: "Odds",
    sports_hub_rank: "Pos",
    sports_hub_team: "Team",
    sports_hub_played: "GP",
    sports_hub_won: "W",
    sports_hub_lost: "L",
    sports_hub_drawn: "D",
    sports_hub_points: "Pts",
    sports_hub_pct: "PCT",
    sports_hub_draw: "Draw",
    sports_hub_no_live: "No live matches at the moment.",
    sports_reminder: "Reminder",
    sports_reminder_saved: "Reminder saved for:",
    sports_bestbet_local: "RCA Winner (Home)",
    sports_bestbet_futbol: "Real Madrid or Draw (Double Chance)",
    sports_bestbet_beisbol: "NY Yankees -1.5 (Run Line)",
    sports_bestbet_baloncesto: "Boston Celtics Winner (Moneyline)",
    sports_bestbet_nfl: "Kansas City Chiefs Winner",
    sports_bestbet_nhl: "Edmonton Oilers (Moneyline)",
    sports_aitip_local: "RCA shows historical home dominance in the classic. A close game is expected but favorable to RCA.",
    sports_aitip_futbol: "El Clasico arrives at a moment of high offensive efficiency for both. The home side starts with a slight advantage due to their home undefeated streak.",
    sports_aitip_beisbol: "Gerrit Cole starts for the Yankees today. Boston has had hitting struggles against elite right-handed starters this week.",
    sports_aitip_baloncesto: "Boston has better bench depth. A tense defensive duel with a slow pace is predicted.",
    sports_aitip_nfl: "Super Bowl rematch. Mahomes in big games usually performs better than average. High volatility bet.",
    sports_aitip_nhl: "Edmonton is extremely strong at Rogers Place. Connor McDavid is on a 4-game scoring streak.",
    school_calc_direct_phone: "Direct Phone",
    school_calc_services: "Services / Facilities",
    school_calc_website: "Website",
    school_calc_gps: "GPS Location",
    school_calc_budget_title: "Projected Initial Budget",
    school_calc_school_fees: "Enrollment & Service Fees (Paid to School)",
    school_calc_enrollment: "Enrollment Fee",
    school_calc_airco: "Air Conditioning (A/C) Maintenance",
    school_calc_subtotal: "School Subtotal (Mandatory)",
    school_calc_other_expenses: "Other Estimated Expenses (Third Party / Optional)",
    school_calc_uniforms: "Uniforms (Projection)",
    school_calc_parents_committee: "Parents Committee (Oudercommissie)",
    school_calc_supplies: "School Supplies & Books",
    school_calc_total: "Total Initial Budget",
    school_calc_regulatory_body: "Regulatory Body",
    school_calc_office_phone: "Office Phone",
    school_calc_individual_contact: "Individual contact",
    school_calc_official_website: "Official Website",
    school_calc_office_address: "Office Address",
    school_calc_office_gps: "Office GPS Route",
    calc_not_available: "Not available",
    arrivals_status_delayed: "Delayed",
    arrivals_status_landed: "Landed",
    arrivals_status_expected: "Scheduled",
    arrivals_status_completed: "Completed",
    arrivals_status_intransit: "In Transit",
    arrivals_origin: "Origin",
    arrivals_capacity: "Capacity",
    arrivals_passengers: "Passengers",
    arrivals_main_airlines: "Main Airlines",
    arrivals_main_cruiselines: "Cruise Lines in Transit",
    arrivals_avg_load: "Average Load Factor",
    arrivals_avg_stay: "Average Stay",
    arrivals_airport_title: "Reina Beatrix Airport",
    arrivals_pax_today_label: "Estimated Passengers Today",
    arrivals_pax_val: "5,600 PAX",
    arrivals_flights_arriving: "Arriving Flights",
    arrivals_flights_arriving_val: "8 Flights",
    arrivals_us_market: "US Market Share",
    arrivals_us_market_val: "78% share",
    arrivals_peak_hour: "Peak Flow Hour",
    arrivals_peak_hour_val: "12:00 PM - 03:00 PM",
    arrivals_taxi_tips_title: "Tips for Operators and Taxis",
    arrivals_taxi_tips_desc: "A high flow of passengers from the US is expected between 12:00 PM and 3:00 PM. Taxi drivers are recommended to position themselves at the north terminal.",
    arrivals_exemption_title: "Customs Exemption",
    arrivals_exemption_desc: "Travelers can bring personal duty-free purchases up to a maximum value of Afl. 400.00.",
    arrivals_weekly_proj_title: "Weekly Projection",
    arrivals_weekly_flights_label: "Flights of the Week",
    arrivals_weekly_flights_val: "182 Arrivals",
    arrivals_weekly_pax_lbl: "Estimated Pax",
    arrivals_weekly_pax_val: "36,400 tourists",
    arrivals_weekly_peak_day_lbl: "Peak Day",
    arrivals_weekly_peak_day_val: "Saturday (32 flights)",
    arrivals_weekly_origin_lbl: "Main Origin",
    arrivals_weekly_origin_val: "Miami / JFK",
    arrivals_weekly_tips_title: "Tourism Planning",
    arrivals_weekly_tips_desc: "The weekend (especially Saturday) accounts for 35% of weekly arrival volume. Car rental agencies and transfers should reinforce their fleet at the airport.",
    arrivals_us_terminal_title: "US Terminal",
    arrivals_us_terminal_desc: "US Preclearance operates regularly starting at 8:00 AM.",
    arrivals_monthly_est_title: "Monthly Estimate (June)",
    arrivals_monthly_pax_label: "Total Passengers of the Month",
    arrivals_monthly_pax_val: "156,000 Pax",
    arrivals_monthly_flights_lbl: "Incoming Flights",
    arrivals_monthly_flights_val: "780 flights",
    arrivals_monthly_occ_lbl: "Hotel Occupancy",
    arrivals_monthly_occ_val: "89% Noord / 78% Play",
    arrivals_monthly_leader_lbl: "Leading Airline",
    arrivals_monthly_leader_val: "American Airlines",
    arrivals_monthly_tips_title: "Occupancy Metrics",
    arrivals_monthly_tips_desc: "Hotel flow for the month is strongly concentrated in the Noord district (Palm Beach and Eagle Beach), boosting evening consumption in restaurants in that area.",
    arrivals_port_title: "Oranjestad Port",
    arrivals_cruisers_today_label: "Cruisers in Port Today",
    arrivals_cruisers_today_val: "5,600 Pax",
    arrivals_ships_port_lbl: "Ships in Port",
    arrivals_ships_port_val: "2 Cruises",
    arrivals_econ_impact_lbl: "Economic Injection",
    arrivals_econ_impact_val: "Est. $672,000 USD",
    arrivals_avg_spend_lbl: "Average Spend/Pax",
    arrivals_avg_spend_val: "$120.00 USD",
    arrivals_commerce_tips_title: "Tips for Local Businesses",
    arrivals_commerce_tips_desc: "Pedestrian traffic in Oranjestad city center will be highly active between 9:00 AM and 3:00 PM. Shops on L.G. Smith Blvd and Main Street will see high demand.",
    arrivals_local_commerce_title: "Local Commerce",
    arrivals_local_commerce_desc: "Cruise passengers are mainly looking for fine jewelry, local crafts, and Aruba Aloe products.",
    arrivals_port_weekly_title: "Port: Weekly Schedule",
    arrivals_weekly_cruisers_lbl: "Cruisers of the Week",
    arrivals_weekly_cruisers_val: "15,070 Pax",
    arrivals_scheduled_cruises_lbl: "Scheduled Cruises",
    arrivals_scheduled_cruises_val: "5 Cruises",
    arrivals_weekly_impact_lbl: "Financial Impact",
    arrivals_weekly_impact_val: "Est. $1.8M AWG",
    arrivals_largest_ship_lbl: "Largest Ship",
    arrivals_largest_ship_val: "Disney Fantasy (4,000 pax)",
    arrivals_port_logistics_title: "Port Logistics",
    arrivals_port_logistics_desc: "Friday is expected to have the highest volume of simultaneous tourists due to the Disney Fantasy. Tour operators in Oranjestad must ensure enough buses for excursions to the gold ruins and northern beaches.",
    arrivals_port_monthly_title: "Port: Monthly Projection",
    arrivals_monthly_cruisers_lbl: "Total Cruise Tourists",
    arrivals_monthly_cruisers_val: "67,290 Pax",
    arrivals_monthly_ships_lbl: "Total Ships of the Month",
    arrivals_monthly_ships_val: "22 ships",
    arrivals_monthly_impact_lbl: "Direct Economic Impact",
    arrivals_monthly_impact_val: "Est. $8.1M AWG",
    arrivals_most_frequent_line_lbl: "Most Frequent Line",
    arrivals_most_frequent_line_val: "Royal Caribbean Group",
    arrivals_gdp_impact_title: "Retail GDP Impact",
    arrivals_gdp_impact_desc: "Cruise tourism accounts for approximately 22% of the direct injection into the island's retail trade. Statistics for the month indicate an upturn in spending in local restaurants and traditional boutiques in the capital.",
    comercio_resorts: "Resorts Hotels",
    comercio_all_inclusive: "All-Inclusive Hotels",
    comercio_condos: "Condominiums (Condos)",
    comercio_villas: "Villas",
    comercio_boutique_apts: "Boutique Apartments",
    comercio_footfall: "FOOTFALL",
    comercio_occupancy: "Occupancy",
    comercio_transit: "Transit",
    comercio_visitors: "Visitors",
    comercio_cruises: "Cruises",
    comercio_tours: "Tours",
    comercio_share_gps_btn: "📍 Share Location & Search Nearby Businesses",
    comercio_gps_obtaining: "Obtaining satellite GPS location...",
    comercio_gps_shared_here: "📍 Location shared. Found you ~{dist}m from this zone! Local businesses at < 100m:",
    comercio_gps_simulating: "📍 GPS (Lat: {lat}, Lng: {lng}). Simulating range in {target} for demonstration. Businesses at < 100m:",
    comercio_gps_denied: "⚠️ Location permission denied. Loading simulated businesses at < 100m for this zone:",
    comercio_gps_not_supported: "⚠️ Geolocation not supported. Loading simulated businesses at < 100m for this zone:",
    comercio_no_businesses: "No nearby businesses found.",
    comercio_lvl_very_high: "Very High 🔥",
    comercio_lvl_high: "High 📈",
    comercio_lvl_moderate: "Moderate ⚖️",
    comercio_lvl_low: "Low 📉",
    subtab_cursos: "Sabí Courses",
    subtab_financiero: "Personal Ledger",
    subtab_credito: "Sabí Credit",
    services_courses_title: "🎓 Sabí Courses - Learning Hub",
    services_courses_subtitle: "Unlock your potential with courses designed for online business, finance, and investment success.",
    courses_search_placeholder: "Search course...",
    courses_cat_all: "All Categories",
    courses_cat_business: "Online Business",
    courses_cat_finanzas: "Finance",
    courses_cat_inversion: "Investment",
    finance_lbl_balance: "Current Balance",
    finance_lbl_income: "Total Income",
    finance_lbl_expenses: "Total Expenses",
    finance_lbl_savings: "Savings Rate",
    finance_form_title: "💸 Record Income / Expense",
    finance_form_type: "Operation Type",
    finance_type_expense: "Expense",
    finance_type_income: "Income",
    finance_form_amount: "Amount (Afl. AWG)",
    finance_form_category: "Category",
    finance_cat_comida: "Food & Drink",
    finance_cat_alquiler: "Rent / Housing",
    finance_cat_salario: "Salary / Business",
    finance_cat_ocio: "Entertainment / Leisure",
    finance_cat_transporte: "Transport",
    finance_cat_servicios: "Utilities (Water/Elec)",
    finance_cat_otros: "Other Expenses",
    finance_form_desc: "Description",
    finance_btn_save: "💾 Save Entry",
    finance_ai_title: "Financial AI Insights",
    finance_dist_title: "📊 Expense Distribution",
    finance_history_title: "📜 Recent Transactions",
    finance_col_desc: "Detail",
    finance_col_cat: "Category",
    finance_col_amount: "Amount",
    finance_col_act: "Action",
    loan_title: "Sabí Credit - Instant Microloans",
    loan_subtitle: "Fast financing for entrepreneurs and personal projects in Aruba. No paperwork, instant approval.",
    loan_active_header: "Your Active Loan",
    loan_amount: "Loan Amount",
    loan_term: "Term (Months)",
    loan_interest: "Annual Interest Rate (APR)",
    loan_monthly_payment: "Monthly Payment",
    loan_total_repayment: "Total Repayment",
    loan_status: "Status",
    loan_status_approved: "Approved - Funds Transferred",
    loan_repay_btn: "💸 Pay Installment / Settle Loan",
    loan_apply_header: "Apply for a New Microloan",
    loan_select_amount: "Amount to Request",
    loan_select_term: "Repayment Term",
    loan_purpose: "Loan Purpose",
    loan_purpose_business: "Working Capital / Business",
    loan_purpose_education: "Education / Courses",
    loan_purpose_personal: "Personal Expenses / Emergency",
    loan_purpose_refinance: "Debt Refinancing",
    loan_calc_preview: "Credit Preview",
    loan_monthly_est: "Estimated Monthly Payment",
    loan_submit_btn: "🚀 Request Instant Approval",
    loan_success_msg: "🎉 Congratulations! Your microloan has been instantly approved. Funds have been transferred to your wallet.",
    loan_repaid_msg: "✅ Payment successful! Your outstanding balance has been updated.",
    loan_settled_msg: "🎉 Congratulations! You have fully settled your microloan.",
    loan_error_insufficient: "❌ Insufficient funds in your wallet to make this payment.",
    loan_pool_label: "Lending Capital Pool",
    loan_pool_earnings: "Interests Accumulated (Compound)",
    loan_tier_label: "Credit Level Tier",
    loan_tier_desc: "Pay on time to increase your tier and unlock higher borrowing limits.",
    loan_suspended_label: "Plan Suspended",
    loan_suspended_desc: "Your credit plan is suspended due to late payments. It will be locked until:",
    loan_queue_title: "Waitlist Queue (Other Entrepreneurs)",
    loan_queue_col_name: "Applicant",
    loan_queue_col_amount: "Amount Requested",
    loan_queue_col_status: "Status",
    loan_queue_col_action: "Action",
    loan_queue_status_pending: "Awaiting Capital",
    loan_queue_status_approved: "Funded",
    loan_queue_btn_process: "Approve Next Request",
    loan_queue_btn_simulate: "Simulate Applicant Request",
    loan_repay_ontime: "Pay Installment (On Time)",
    loan_repay_late: "Pay Installment (Late)",
    loan_btn_skip_time: "⏩ Skip Time (Lift Suspension)",
    loan_error_pool_empty: "Lending Pool does not have sufficient capital for this loan."
  },
  nl: {
    app_title: "Sabí",
    app_subtitle: "Aruba Intelligentie & Nut",
    footer_disclaimer: "Premium abonnementsservice voor inwoners en bezoekers van Aruba. Alle nutsvoorzieningen, tariefvergelijkingen en importen zijn gebaseerd op de huidige Arubaanse regelgeving en richtlijnen.",
    profile_btn: "👤 Premium Account",
    tab_comunidad: "Gemeenschap",
    tab_servicios: "Diensten",
    tab_suerte: "Geluk",
    subtab_market: "Kopen & Verkopen",
    subtab_delivery: "Levering Aanvragen",
    subtab_live: "Sabí Live",
    subtab_emergencia: "Noodgevallen",
    subtab_directorio: "Overheidsgids",
    subtab_calculadora: "Rekenmachine",
    subtab_educacion: "Onderwijs",
    subtab_deportes: "Sabi Sport",
    subtab_comercio: "Bedrijven & Handel",
    subtab_llegadas: "Aankomsten",
    market_title: "Geverifieerde Advertenties Marktplaats",
    market_subtitle: "Vind lokale banen, lange termijn verhuur, voertuigen of professionele diensten aangeboden door geverifieerde leden.",
    search_placeholder: "Zoek advertenties (bijv. 'Toyota', 'Loodgieter')...",
    cat_all: "Alle Categorieën",
    cat_trabajo: "Werk",
    cat_alquileres: "Verhuur",
    cat_vehiculos: "Voertuigen",
    cat_ropa: "Kleding & Accessoires",
    cat_electronica: "Elektronica",
    cat_joyeria: "Sieraden",
    cat_hogar: "Huishoudelijke Artikelen",
    cat_servicios_hogar: "Huisdiensten (Loodgieter, Schoonmaak)",
    cat_servicios_profesionales: "Professionele Diensten (Advies, Bijles)",
    cat_servicios_salud: "Gezondheid & Schoonheid (Salon, Zorg)",
    cat_servicios_tecnicos: "Technische Ondersteuning (PC/Mobiel Reparatie)",
    cat_servicios_transporte: "Transport & Verhuizingen (Vracht, Logistiek)",
    cat_servicios_eventos: "Evenementen & Catering (Voedsel, Feesten)",
    custom_delivery_title: "📦 Aangepaste Levering Aanvragen",
    custom_delivery_subtitle: "Vraag een bezorger om iets specifieks voor u te kopen of op te halen overal op het eiland.",
    label_name: "Uw Naam",
    placeholder_name: "Uw naam...",
    label_gps: "Deel Mijn Huidige Locatie",
    btn_gps: "📍 Deel GPS Locatie",
    gps_status_none: "Locatie niet gedeeld",
    gps_status_shared: "GPS Locatie gedeeld",
    label_delivery_title: "Titel van Levering (Wat heeft u nodig)",
    placeholder_delivery_title: "Bijv. Boodschappen bij Kong Hing Supermarkt",
    label_delivery_desc: "Beschrijving van Bestelling (Details)",
    placeholder_delivery_desc: "Bijv. Panadol, wisselgeld van Afl. 50...",
    label_pickup_address: "Ophaaladres (Waar op te halen)",
    placeholder_pickup_address: "Bijv. Kong Hing Supermarkt, Caya G. F. Croes",
    label_delivery_address: "Afleveradres (Waar af te leveren)",
    placeholder_delivery_address: "Bijv. Caya G. F. Croes 45, Oranjestad",
    label_package_size: "Pakketgrootte / Transporstype",
    size_light: "Licht (Documenten, Voedsel, Kleding, etc.)",
    size_medium: "Middelgroot (Dozen, Apparaten, etc.)",
    size_heavy: "Zwaar / Vracht (Bankstellen, Bedden, etc.)",
    label_fare: "Afgesproken Tarief (Berekend)",
    delivery_desc_note: "* Nachttarief geldt automatisch van 20:00 tot 06:00. Basistarieven: Licht Afl. 12/18, Middelgroot Afl. 20/30, Vracht Afl. 45/65.",
    btn_send_delivery: "🚀 Verzend Leveringsaanvraag",
    status_searching: "Bezorger zoeken... 🔍",
    status_assigned: "Bezorger Toegewezen 🚗",
    status_transit: "Onderweg 📦",
    status_delivered: "Bezorgd! 🎉",
    history_title: "Mijn Recente Bestellingen",
    btn_clear_history: "🗑️ Geschiedenis Wissen",
    no_recent_orders: "U heeft geen recente bezorgopdrachten.",
    btn_buy_now: "🛒 Nu Kopen",
    btn_delete: "🗑️ Verwijderen",
    btn_go_live: "🎥 Live Gaan",
    btn_close: "Sluiten",
    tab_profile: "👤 Mijn Profiel",
    tab_driver: "🛵 Bezorger Worden",
    tab_upload: " Advertentie Plaatsen",
    tab_products: "🛍️ Mijn Artikelen",
    tab_b2b: " B2B Adverteren",
    select_game: "Selecteer Spel:",
    loading_db: "Database laden...",
    lottery_dashboard: "Dashboard",
    lottery_generator: "Aanbeveler",
    lottery_history: "Trekkingen",
    filter_analysis: "ANALYSE FILTEREN:",
    filter_any_day: "Elke Dag van de Week",
    day_monday: "Maandag",
    day_tuesday: "Dinsdag",
    day_wednesday: "Woensdag",
    day_thursday: "Donderdag",
    day_friday: "Vrijdag",
    day_saturday: "Zaterdag",
    day_sunday: "Zondag",
    filter_any_week: "Elke Week van de Maand",
    week_1: "Week 1 (Dagen 1-7)",
    week_2: "Week 2 (Dagen 8-14)",
    week_3: "Week 3 (Dagen 15-21)",
    week_4: "Week 4 (Dagen 22+)",
    filter_any_month: "Elke Maand van het Jaar",
    month_january: "Januari",
    month_february: "Februari",
    month_march: "Maart",
    month_april: "April",
    month_may: "Mei",
    month_june: "Juni",
    month_july: "Juli",
    month_august: "Augustus",
    month_september: "September",
    month_october: "Oktober",
    month_november: "November",
    month_december: "December",
    filter_any_draw: "Elke Shift (Hele dag)",
    draw_midday: "Middag Shift",
    draw_evening: "Avond Shift",
    metric_total_draws: "Geanalyseerde Trekkingen",
    metric_hottest: "Heetste Nummer",
    metric_coldest: "Koudste Nummer",
    metric_overdue: "Meest Overdue",
    frequency_chart_title: "Algemene Getal Frequentie",
    times_drawn: "Keer getrokken",
    top_combos_title: "Meest Voorkomende Duo's & Trio's",
    top_duos_label: "Meest voorkomende paren (Duo's)",
    top_trios_label: "Meest voorkomende drietallen (Trio's)",
    digits_balance_title: "Cijferbalans",
    even_odd_balance: "Even vs. Oneven Balans",
    history_short: "Geschiedenis",
    low_high_balance: "Laag (0-4) vs. Hoog (5-9) Balans",
    pos_analysis_title: "Analyse per Positie",
    exit_order: "Uitgangsvolgorde",
    most_common: "Meest Voorkomend",
    drawn_together: "Samen getrokken",
    zodiac_signs_freq: "Dierenriemtekens Frequentie",
    digits_freq_title: "Cijfer Frequentie (0 tot 9)",
    by_position: "Per positie",
    generator_strategy_title: "Slimme Aanbevelingsstrategie",
    generator_strategy_desc: "Kies een probabilistische strategie gestuurd door AI-patronen om uw aanbevolen combinatie te genereren.",
    strat_balanced: "Gebalanceerd",
    strat_balanced_desc: "Mengt hete en koude getallen onder ideale wiskundige even/oneven verhoudingen.",
    strat_positional: "Per Positie",
    strat_positional_desc: "Genereert het lot op basis van de meest voorkomende getallen volgens uitgangspositie.",
    strat_hot: "Hete Getallen",
    strat_hot_desc: "Combineert getallen of cijfers met de hoogste algemene historische herhaling.",
    strat_overdue: "Overdue",
    strat_overdue_desc: "Geeft de voorkeur aan getallen die het langst niet getrokken zijn.",
    strat_random: "Willekeurig",
    strat_random_desc: "Klassieke Quick Pick terminal selectie simulatie.",
    btn_generate: "⚡ Genereer Aanbeveling",
    empty_gen_text: "Klik op de knop hierboven om getallen te genereren",
    generator_strategy_zodiac_title: "Zodiac Aanbevelingsstrategie",
    generator_strategy_zodiac_desc: "Kies een strategie om uw aanbevolen 4 cijfers en dierenriemteken te genereren.",
    strat_zodiac_balanced_desc: "Combineert hete en overdue cijfers met even/oneven balans en een regulier teken.",
    strat_zodiac_hot_desc: "Genereert het spel met de meest voorkomende cijfers en dierenriemteken.",
    strat_zodiac_overdue_desc: "Geeft de voorkeur aan cijfers en dierenriemteken die het langst niet getrokken zijn.",
    strat_zodiac_random_desc: "Willekeurige Quick Pick van 4 cijfers en 1 dierenriemteken.",
    btn_generate_zodiac: "⚡ Genereer Zodiac Spel",
    empty_gen_zodiac: "Klik op de knop hierboven om uw Zodiac-spel te genereren",
    history_explorer_title: "Historische Trekkingen Verkenner",
    history_search_placeholder: "Zoek trekking op nummer, datum (bijv. 'Jun 10'), shift of teken...",
    sports_hub_title: "Sabí Sportanalytische Hub",
    sports_hub_subtitle: "Live scores, standen en intelligente weddenschap voorspellingen.",
    sports_hub_tab_live: "🔴 Live & Schema",
    sports_hub_tab_standings: "📊 Standen",
    sports_hub_tab_betting: "💡 AI Voorspellingen",
    sports_hub_sport_local: "Aruba Lokaal",
    sports_hub_sport_futbol: "Wereldvoetbal",
    sports_hub_sport_beisbol: "MLB Honkbal",
    sports_hub_sport_baloncesto: "NBA Basketbal",
    sports_hub_sport_nfl: "NFL",
    sports_hub_sport_nhl: "NHL",
    sports_hub_live_now: "Lopende Wedstrijden",
    sports_hub_upcoming: "Aankomende Wedstrijden",
    sports_hub_h2h: "H2H Geschiedenis",
    sports_hub_win_prob: "Winnaarskans",
    sports_hub_streak: "Vorm",
    sports_hub_best_bet: "Beste Weddenschap",
    sports_hub_ai_tip: "AI Analyse",
    sports_hub_totals_prediction: "Totalen Voorspelling",
    sports_hub_odds: "Quoteringen",
    sports_hub_rank: "Pos",
    sports_hub_team: "Team",
    sports_hub_played: "Gesp",
    sports_hub_won: "W",
    sports_hub_lost: "V",
    sports_hub_drawn: "G",
    sports_hub_points: "Ptn",
    sports_hub_pct: "PCT",
    sports_hub_draw: "Gelijkspel",
    sports_hub_no_live: "Geen live wedstrijden op dit moment.",
    sports_reminder: "Herinnering",
    sports_reminder_saved: "Herinnering opgeslagen voor:",
    sports_bestbet_local: "RCA Winnaar (Home)",
    sports_bestbet_futbol: "Real Madrid of Gelijkspel (Double Chance)",
    sports_bestbet_beisbol: "NY Yankees -1.5 (Run Line)",
    sports_bestbet_baloncesto: "Boston Celtics Winnaar (Moneyline)",
    sports_bestbet_nfl: "Kansas City Chiefs Winnaar",
    sports_bestbet_nhl: "Edmonton Oilers (Moneyline)",
    sports_aitip_local: "RCA toont historische thuisdominantie in de klassieker. Een nipte wedstrijd wordt verwacht, maar in het voordeel van RCA.",
    sports_aitip_futbol: "El Clasico komt op een moment van hoge offensieve efficiëntie voor beiden. De thuisploeg start met een klein voordeel vanwege hun ongeslagen thuisreeks.",
    sports_aitip_beisbol: "Gerrit Cole start vandaag voor de Yankees. Boston heeft deze week moeite gehad met slaan tegen elite rechtshandige starters.",
    sports_aitip_baloncesto: "Boston heeft een betere bankdiepte. Er wordt een spannende defensieve strijd met een traag tempo voorspeld.",
    sports_aitip_nfl: "Super Bowl rematch. Mahomes presteert in grote wedstrijden meestal beter dan gemiddeld. Weddenschap met hoge volatiliteit.",
    sports_aitip_nhl: "Edmonton is extreem sterk in Rogers Place. Connor McDavid is bezig aan een 4-game scoring streak.",
    school_calc_direct_phone: "Direct Telefoonnummer",
    school_calc_services: "Diensten / Faciliteiten",
    school_calc_website: "Website",
    school_calc_gps: "GPS Locatie",
    school_calc_budget_title: "Verwacht Initieel Budget",
    school_calc_school_fees: "Inschrijfgeld & Servicekosten (Betaald aan School)",
    school_calc_enrollment: "Inschrijfgeld",
    school_calc_airco: "Airconditioning (A/C) Onderhoud",
    school_calc_subtotal: "School Subtotaal (Verplicht)",
    school_calc_other_expenses: "Andere Geschatte Kosten (Derden / Optioneel)",
    school_calc_uniforms: "Uniformen (Projectie)",
    school_calc_parents_committee: "Oudercommissie",
    school_calc_supplies: "Schoolbenodigdheden & Boeken",
    school_calc_total: "Totaal Initieel Budget",
    school_calc_regulatory_body: "Regulerend Orgaan",
    school_calc_office_phone: "Kantoortelefoon",
    school_calc_individual_contact: "Individueel contact",
    school_calc_official_website: "Officiële Website",
    school_calc_office_address: "Kantooradres",
    school_calc_office_gps: "Kantoor GPS Route",
    calc_not_available: "Niet beschikbaar",
    arrivals_status_delayed: "Vertraagd",
    arrivals_status_landed: "Geland",
    arrivals_status_expected: "Gepland",
    arrivals_status_completed: "Voltooid",
    arrivals_status_intransit: "Onderweg",
    arrivals_origin: "Herkomst",
    arrivals_capacity: "Capaciteit",
    arrivals_passengers: "Passagiers",
    arrivals_main_airlines: "Belangrijkste Luchtvaartmaatschappijen",
    arrivals_main_cruiselines: "Cruisemaatschappijen in Transit",
    arrivals_avg_load: "Gemiddelde Bezettingsgraad",
    arrivals_avg_stay: "Gemiddeld Verblijf",
    arrivals_airport_title: "Reina Beatrix Luchthaven",
    arrivals_pax_today_label: "Verwachte Passagiers Vandaag",
    arrivals_pax_val: "5.600 PAX",
    arrivals_flights_arriving: "Aankomende Vluchten",
    arrivals_flights_arriving_val: "8 Vluchten",
    arrivals_us_market: "Amerikaans Marktaandeel",
    arrivals_us_market_val: "78% aandeel",
    arrivals_peak_hour: "Piekstroom Uur",
    arrivals_peak_hour_val: "12:00 - 15:00",
    arrivals_taxi_tips_title: "Tips voor Operators en Taxi's",
    arrivals_taxi_tips_desc: "Er wordt een grote stroom passagiers uit de VS verwacht tussen 12.00 uur en 15.00 uur. Taxichauffeurs wordt geadviseerd zich bij de noordelijke terminal op te stellen.",
    arrivals_douane_exemption_title: "Douanevrijstelling",
    arrivals_douane_exemption_desc: "Reizigers mogen persoonlijke belastingvrije aankopen invoeren tot een maximale waarde van Afl. 400,00.",
    arrivals_weekly_proj_title: "Wekelijkse Projectie",
    arrivals_weekly_flights_label: "Vluchten van de Week",
    arrivals_weekly_flights_val: "182 Aankomsten",
    arrivals_weekly_pax_lbl: "Geschatte Pax",
    arrivals_weekly_pax_val: "36.400 toeristen",
    arrivals_weekly_peak_day_lbl: "Piekdag",
    arrivals_weekly_peak_day_val: "Zaterdag (32 vluchten)",
    arrivals_weekly_origin_lbl: "Belangrijkste Herkomst",
    arrivals_weekly_origin_val: "Miami / JFK",
    arrivals_weekly_tips_title: "Toeristische Planning",
    arrivals_weekly_tips_desc: "Het weekend (vooral zaterdag) registreert 35% van het wekelijkse aankomstvolume. Autoverhuurbedrijven en transfers moeten hun vloot op de luchthaven versterken.",
    arrivals_us_terminal_title: "Amerikaanse Terminal",
    arrivals_us_terminal_desc: "Amerikaanse Preclearance is regelmatig geopend vanaf 8.00 uur.",
    arrivals_monthly_est_title: "Maandelijkse Schatting (Juni)",
    arrivals_monthly_pax_label: "Totaal Passagiers van de Maand",
    arrivals_monthly_pax_val: "156.000 Pax",
    arrivals_monthly_flights_lbl: "Inkomende Vluchten",
    arrivals_monthly_flights_val: "780 vluchten",
    arrivals_monthly_occ_lbl: "Hotelbezetting",
    arrivals_monthly_occ_val: "89% Noord / 78% Play",
    arrivals_monthly_leader_lbl: "Belangrijkste Luchtvaartmaatschappij",
    arrivals_monthly_leader_val: "American Airlines",
    arrivals_monthly_tips_title: "Bezettingsstatistieken",
    arrivals_monthly_tips_desc: "De hotelbezetting voor de maand is sterk geconcentreerd in het Noord-district (Palm Beach en Eagle Beach), wat de avondconsumptie in restaurants in dat gebied stimuleert.",
    arrivals_port_title: "Haven Oranjestad",
    arrivals_cruisers_today_label: "Cruisetoeristen in de Haven Vandaag",
    arrivals_cruisers_today_val: "5.600 Pax",
    arrivals_ships_port_lbl: "Schepen in de Haven",
    arrivals_ships_port_val: "2 Cruiseschepen",
    arrivals_econ_impact_lbl: "Economische Injectie",
    arrivals_econ_impact_val: "Schatting $672.000 USD",
    arrivals_avg_spend_lbl: "Gemiddelde Uitgaven/Pax",
    arrivals_avg_spend_val: "$120.00 USD",
    arrivals_commerce_tips_title: "Tips voor Lokale Bedrijven",
    arrivals_commerce_tips_desc: "Voetgangersverkeer in het centrum van Oranjestad zal zeer actief zijn tussen 9:00 en 15:00 uur. Winkels op L.G. Smith Blvd en Main Street zullen een grote vraag zien.",
    arrivals_local_commerce_title: "Lokale Handel",
    arrivals_local_commerce_desc: "Cruisepassagers zijn voornamelijk op zoek naar fijne sieraden, lokale ambachten en Aloe Vera producten uit Aruba.",
    arrivals_port_weekly_title: "Haven: Wekelijks Schema",
    arrivals_weekly_cruisers_lbl: "Cruisetoeristen van de Week",
    arrivals_weekly_cruisers_val: "15.070 Pax",
    arrivals_scheduled_cruises_lbl: "Geplande Cruises",
    arrivals_scheduled_cruises_val: "5 Cruises",
    arrivals_weekly_impact_lbl: "Financiële Impact",
    arrivals_weekly_impact_val: "Schatting $1.8M AWG",
    arrivals_largest_ship_lbl: "Grootste Schip",
    arrivals_largest_ship_val: "Disney Fantasy (4.000 pax)",
    arrivals_port_logistics_title: "Haven Logistiek",
    arrivals_port_logistics_desc: "Vrijdag wordt het grootste volume gelijktijdige toeristen verwacht vanwege de Disney Fantasy. Touroperators in Oranjestad moeten zorgen voor voldoende bussen voor excursies naar de goudruïnes en de noordelijke stranden.",
    arrivals_port_monthly_title: "Haven: Maandelijkse Projectie",
    arrivals_monthly_cruisers_lbl: "Totaal Cruisetoeristen",
    arrivals_monthly_cruisers_val: "67.290 Pax",
    arrivals_monthly_ships_lbl: "Totaal Schepen van de Maand",
    arrivals_monthly_ships_val: "22 schepen",
    arrivals_monthly_impact_lbl: "Directe Economische Impact",
    arrivals_monthly_impact_val: "Schatting $8.1M AWG",
    arrivals_most_frequent_line_lbl: "Meest Frequente Lijn",
    arrivals_most_frequent_line_val: "Royal Caribbean Group",
    arrivals_gdp_impact_title: "Impact op Detailhandel BBP",
    arrivals_gdp_impact_desc: "Cruisetoerisme is goed voor ongeveer 22% van de directe injectie in de detailhandel van het eiland. Statistieken voor de maand wijzen op een stijging van de uitgaven in lokale restaurants en traditionele boetieks in de hoofdstad.",
    comercio_resorts: "Resort Hotels",
    comercio_all_inclusive: "All-Inclusive Hotels",
    comercio_condos: "Condominiums (Condos)",
    comercio_villas: "Villa's",
    comercio_boutique_apts: "Boutique Appartementen",
    comercio_footfall: "DRUKTE",
    comercio_occupancy: "Bezetting",
    comercio_transit: "Transit",
    comercio_visitors: "Bezoekers",
    comercio_cruises: "Cruises",
    comercio_tours: "Tours",
    comercio_share_gps_btn: "📍 Deel Locatie & Zoek Nabijgelegen Bedrijven",
    comercio_gps_obtaining: "GPS-satellietlocatie ophalen...",
    comercio_gps_shared_here: "📍 Locatie gedeeld. Je bent gevonden op ~{dist}m van deze zone! Lokale bedrijven op < 100m:",
    comercio_gps_simulating: "📍 GPS (Lat: {lat}, Lng: {lng}). Bereik simuleren in {target} voor demonstratie. Bedrijven op < 100m:",
    comercio_gps_denied: "⚠️ Locatietoestemming geweigerd. Laden van gesimuleerde bedrijven op < 100m voor deze zone:",
    comercio_gps_not_supported: "⚠️ Geolocatie niet ondersteund. Laden van gesimuleerde bedrijven op < 100m voor deze zone:",
    comercio_no_businesses: "Geen nabijgelegen bedrijven gevonden.",
    comercio_lvl_very_high: "Zeer Hoog 🔥",
    comercio_lvl_high: "Hoog 📈",
    comercio_lvl_moderate: "Matig ⚖️",
    comercio_lvl_low: "Laag 📉",
    subtab_cursos: "Sabí Cursussen",
    subtab_financiero: "Persoonlijke Boekhouding",
    subtab_credito: "Sabí Krediet",
    services_courses_title: "🎓 Sabí Cursussen - Leersub",
    services_courses_subtitle: "Ontgrendel uw potentieel met cursussen ontworpen voor succes in online ondernemen, financiën en investeringen.",
    courses_search_placeholder: "Zoek cursus...",
    courses_cat_all: "Alle Categorieën",
    courses_cat_business: "Online Ondernemen",
    courses_cat_finanzas: "Financiën",
    courses_cat_inversion: "Investeringen",
    finance_lbl_balance: "Huidig Saldo",
    finance_lbl_income: "Totale Inkomsten",
    finance_lbl_expenses: "Totale Uitgaven",
    finance_lbl_savings: "Spaarpercentage",
    finance_form_title: "💸 Inkomsten / Uitgaven Registreren",
    finance_form_type: "Type Transactie",
    finance_type_expense: "Uitgave",
    finance_type_income: "Inkomsten",
    finance_form_amount: "Bedrag (Afl. AWG)",
    finance_form_category: "Categorie",
    finance_cat_comida: "Eten & Drinken",
    finance_cat_alquiler: "Huur / Huisvesting",
    finance_cat_salario: "Salaris / Handel",
    finance_cat_ocio: "Entertainment / Vrije Tijd",
    finance_cat_transporte: "Vervoer",
    finance_cat_servicios: "Nutsvoorzieningen (Water/Stroom)",
    finance_cat_otros: "Overige Uitgaven",
    finance_form_desc: "Beschrijving",
    finance_btn_save: "💾 Transactie Opslaan",
    finance_ai_title: "Financiële AI Insights",
    finance_dist_title: "📊 Uitgavenverdeling",
    finance_history_title: "📜 Recente Transacties",
    finance_col_desc: "Detail",
    finance_col_cat: "Categorie",
    finance_col_amount: "Bedrag",
    finance_col_act: "Actie",
    loan_title: "Sabí Krediet - Instant Microkredieten",
    loan_subtitle: "Snelle financiering voor ondernemers en persoonlijke projecten in Aruba. Geen papierwerk, direct goedgekeurd.",
    loan_active_header: "Uw Actieve Lening",
    loan_amount: "Lening Bedrag",
    loan_term: "Looptijd (Maanden)",
    loan_interest: "Jaarlijkse Rente (APR)",
    loan_monthly_payment: "Maandelijkse Betaling",
    loan_total_repayment: "Totaal Terug te Betalen",
    loan_status: "Status",
    loan_status_approved: "Goedgekeurd - Fondsen Overgemaakt",
    loan_repay_btn: "💸 Betaal Termijn / Lening Aflossen",
    loan_apply_header: "Nieuwe Microlening Aanvragen",
    loan_select_amount: "Aan te Vragen Bedrag",
    loan_select_term: "Terugbetalingstermijn",
    loan_purpose: "Doel van de Lening",
    loan_purpose_business: "Bedrijfskapitaal / Zakelijk",
    loan_purpose_education: "Educatie / Cursussen",
    loan_purpose_personal: "Persoonlijke Uitgaven / Noodgeval",
    loan_purpose_refinance: "Schulden Herfinancieren",
    loan_calc_preview: "Krediet Voorbeeld",
    loan_monthly_est: "Geschatte Maandelijkse Betaling",
    loan_submit_btn: "🚀 Directe Goedkeuring Aanvragen",
    loan_success_msg: "🎉 Gefeliciteerd! Uw microlening is direct goedgekeurd. Het geld is overgemaakt naar uw portemonnee.",
    loan_repaid_msg: "✅ Betaling geslaagd! Uw openstaande saldo is bijgewerkt.",
    loan_settled_msg: "🎉 Gefeliciteerd! U heeft uw microlening volledig afbetaald.",
    loan_error_insufficient: "❌ Onvoldoende saldo in uw portemonnee om deze betaling te doen.",
    loan_pool_label: "Gemeenschappelijk Kredietfonds",
    loan_pool_earnings: "Gegenereerde Rente (Samengesteld)",
    loan_tier_label: "Kredietniveau Tier",
    loan_tier_desc: "Betaal op tijd om uw niveau te verhogen en hogere limieten te ontgrendelen.",
    loan_suspended_label: "Plan Opgeschort",
    loan_suspended_desc: "Uw kredietplan is opgeschort wegens te late betalingen. Het is geblokkeerd tot:",
    loan_queue_title: "Wachtlijst (Andere Ondernemers)",
    loan_queue_col_name: "Aanvrager",
    loan_queue_col_amount: "Aangevraagd Bedrag",
    loan_queue_col_status: "Status",
    loan_queue_col_action: "Actie",
    loan_queue_status_pending: "Wacht op Fondsen",
    loan_queue_status_approved: "Gefinancierd",
    loan_queue_btn_process: "Volgende Aanvraag Goedkeuren",
    loan_queue_btn_simulate: "Simuleer Derde Aanvraag",
    loan_repay_ontime: "Betaal Termijn (Op Tijd)",
    loan_repay_late: "Betaal Termijn (Te Laat)",
    loan_btn_skip_time: "⏩ Tijd Versnellen (Hef Schorsing Op)",
    loan_error_pool_empty: "Kredietfonds heeft onvoldoende kapitaal voor deze lening."
  },
  pap: {
    app_title: "Sabí",
    app_subtitle: "Inteligencia y Utilidad pa Aruba",
    footer_disclaimer: "Servicio de suscripcion premium pa residentenan y bishitantenan di Aruba. Tur utilidad, comparacion di tarifa y importacion ta basa riba normanan y directrivanan vigente di Aruba.",
    profile_btn: "👤 Cuenta Premium",
    tab_comunidad: "Comunidad",
    tab_servicios: "Servicionan",
    tab_suerte: "Suerte",
    subtab_market: "Cumpra & Bende",
    subtab_delivery: "Pidi un Delivery",
    subtab_live: "Sabí Live",
    subtab_emergencia: "Emergencia",
    subtab_directorio: "Directorio Gov",
    subtab_calculadora: "Calculadora",
    subtab_educacion: "Educacion",
    subtab_deportes: "Deporte Sabi",
    subtab_comercio: "Negoshi y Comercio",
    subtab_llegadas: "Llegada",
    market_title: "Mercado di Clasificadonan Verifica",
    market_subtitle: "Busca trabou local, huur a largo plaso, vehiculo of servicio profesional ofrece pa miembronan verifica.",
    search_placeholder: "Busca clasificadonan (ej. 'Toyota', 'Plomero')...",
    cat_all: "Tur Categoria",
    cat_trabajo: "Trabou",
    cat_alquileres: "Huur",
    cat_vehiculos: "Vehiculo",
    cat_ropa: "Paña y Acesorio",
    cat_electronica: "Electronica",
    cat_joyeria: "Joyeria",
    cat_hogar: "Articulonan pa Hogar",
    cat_servicios_hogar: "Servicio pa Hogar (Plomero, Limpiesa)",
    cat_servicios_profesionales: "Servicio Profesional (Asesoria, Tutoria)",
    cat_servicios_salud: "Salud y Biyesa (Estetica, Cuido)",
    cat_servicios_tecnicos: "Soporte Tecnico (Reparacion di PC/Celular)",
    cat_servicios_transporte: "Transporte y Flete (Mudansa, Carga)",
    cat_servicios_eventos: "Evento y Catering (Cuminda, Fiesta)",
    custom_delivery_title: "📦 Pidi un Delivery Personalisa",
    custom_delivery_subtitle: "Pidi pa un repartido cumpra of retira algo especifico pa bo na cualkier parti di e isla.",
    label_name: "Bo Nomber",
    placeholder_name: "Bo nomber...",
    label_gps: "Comparti Mi Ubicacion Actual",
    btn_gps: "📍 Comparti Ubicacion GPS",
    gps_status_none: "Ubicacion no comparti",
    gps_status_shared: "Ubicacion GPS comparti",
    label_delivery_title: "Titulo di e Delivery (Kico bo mester)",
    placeholder_delivery_title: "Ej. Compras na Supermercado Kong Hing",
    label_delivery_desc: "Descripcion di e Pedido (Detaye)",
    placeholder_delivery_desc: "Ej. Panadol, cambio di Afl. 50...",
    label_pickup_address: "Direccion di Recohida (Unda pa busca)",
    placeholder_pickup_address: "Ej. Supermercado Kong Hing, Caya G. F. Croes",
    label_delivery_address: "Direccion di Entrega (Unda pa ricibi)",
    placeholder_delivery_address: "Ej. Caya G. F. Croes 45, Oranjestad",
    label_package_size: "Tamaño di e Paquete / Tipo di Carga",
    size_light: "Lihe (Documento, Cuminda, Paña, etc.)",
    size_medium: "Mediano (Caha, Electrodomestico, etc.)",
    size_heavy: "Pesao / Flete (Mueble, Cama, etc.)",
    label_fare: "Tarifa Acorda (Calcula)",
    delivery_desc_note: "* Tarifa di anochi ta aplica automaticamente di 20:00 pa 06:00. Tarifanan base: Lihe Afl. 12/18, Mediano Afl. 20/30, Flete Afl. 45/65.",
    btn_send_delivery: "🚀 Manda Solicitud di Delivery",
    status_searching: "Busca repartido... 🔍",
    status_assigned: "Repartido Asigna 🚗",
    status_transit: "Na caminda 📦",
    status_delivered: "Entrega! 🎉",
    history_title: "Mi Pedidonan Reciente",
    btn_clear_history: "🗑️ Borra Historial",
    no_recent_orders: "Bo no tin pedidonan di delivery reciente.",
    btn_buy_now: "🛒 Cumpra Awor",
    btn_delete: "🗑️ Borra",
    btn_go_live: "🎥 Transmiti Live",
    btn_close: "Cera",
    tab_profile: "👤 Mi Perfil",
    tab_driver: "🛵 Birah Repartido",
    tab_upload: " Subi un Producto",
    tab_products: "🛍️ Mi Articulonan",
    tab_b2b: " B2B Publicidad",
    select_game: "Selecciona Huego:",
    loading_db: "Cargando database...",
    lottery_dashboard: "Dashboard",
    lottery_generator: "Recomendado",
    lottery_history: "Sorteo",
    filter_analysis: "FILTRA ANALISIS:",
    filter_any_day: "Cualkier Dia di Seman",
    day_monday: "Dialuna",
    day_tuesday: "Diamars",
    day_wednesday: "Diaranson",
    day_thursday: "Diahuebs",
    day_friday: "Diabierna",
    day_saturday: "Diasabra",
    day_sunday: "Diadomingo",
    filter_any_week: "Cualkier Seman di Luna",
    week_1: "Seman 1 (Dianan 1-7)",
    week_2: "Seman 2 (Dianan 8-14)",
    week_3: "Seman 3 (Dianan 15-21)",
    week_4: "Seman 4 (Dianan 22+)",
    filter_any_month: "Cualkier Luna di Aña",
    month_january: "Hener",
    month_february: "Frebor",
    month_march: "Maart",
    month_april: "Aprel",
    month_may: "Mei",
    month_june: "Huni",
    month_july: "Huli",
    month_august: "Augustus",
    month_september: "September",
    month_october: "Oktober",
    month_november: "November",
    month_december: "December",
    filter_any_draw: "Cualkier Turno (Henter dia)",
    draw_midday: "Turno Atardi",
    draw_evening: "Turno Anochi",
    metric_total_draws: "Sorteo Analisa",
    metric_hottest: "Number Mas Cayente",
    metric_coldest: "Number Mas Frio",
    metric_overdue: "Mas Retrasa",
    frequency_chart_title: "Frecuencia General di Number",
    times_drawn: "Biaha sorteando",
    top_combos_title: "Duos y Trios Mas Frecuente",
    top_duos_label: "Duos (Parekhanan) mas comun",
    top_trios_label: "Trios (Tripletanan) mas comun",
    digits_balance_title: "Balans di Digit",
    even_odd_balance: "Balans Pareha vs. Inpar",
    history_short: "Historial",
    low_high_balance: "Balans Bouw (0-4) vs. Halt (5-9)",
    pos_analysis_title: "Analisis pa Posicion",
    exit_order: "Orden di Salida",
    most_common: "Mas Comun",
    drawn_together: "Sali hunto",
    zodiac_signs_freq: "Frecuencia di Signo Zodiacal",
    digits_freq_title: "Frecuencia di Digit (0 pa 9)",
    by_position: "Pa posicion",
    generator_strategy_title: "Estrategia di Recomendacion Inteligente",
    generator_strategy_desc: "Sigi un estrategia probabilistico empuha pa patrononan di IA pa genera bo combinacion recomenda.",
    strat_balanced: "Balansa",
    strat_balanced_desc: "Mescla numbernan cayente y frio bou di proporcionnan matematico ideal di par y inpar.",
    strat_positional: "Pa Posicion",
    strat_positional_desc: "Genera e billete basa riba e numbernan mas frecuente sigun nan posicion di salida.",
    strat_hot: "Cayente",
    strat_hot_desc: "Combina e numbernan of digitnan di mayor recurrencia historico general.",
    strat_overdue: "Atrasa",
    strat_overdue_desc: "Favorese e numbernan cu tin mas cantidad di sorteo sin wordo hunga.",
    strat_random: "Al Azar",
    strat_random_desc: "Simulacion clasico di Quick Pick di terminal.",
    btn_generate: "⚡ Genera Combinacion Recomenda",
    empty_gen_text: "Click riba e boton ariba pa genera numbernan",
    generator_strategy_zodiac_title: "Estrategia di Recomendacion pa Zodiac",
    generator_strategy_zodiac_desc: "Sigi un estrategia pa genera bo 4 digitnan y signo zodiacal recomenda.",
    strat_zodiac_balanced_desc: "Combina digitnan cayente y atrasa cu un balans di par/inpar y un signo regular.",
    strat_zodiac_hot_desc: "Genera e hungada cu e digitnan y e signo zodiacal di mayor frecuencia.",
    strat_zodiac_overdue_desc: "Favorese e digitnan y e signo cu tin mas sorteo sin sali.",
    strat_zodiac_random_desc: "Quick Pick aleatorio di 4 digit y 1 signo zodiacal.",
    btn_generate_zodiac: "⚡ Genera Hungada Zodiac",
    empty_gen_zodiac: "Click riba e boton ariba pa genera bo hungada Zodiac",
    history_explorer_title: "Explorador di Sorteo Historico",
    history_search_placeholder: "Busca sorteo pa number, fecha (ej. 'Jun 10'), turno of signo...",
    sports_hub_title: "Centro di Analítica Deportivo Sabí",
    sports_hub_subtitle: "Resultado en vivo, clasificacion y pronostico inteligente pa apuesto.",
    sports_hub_tab_live: "🔴 En Vivo",
    sports_hub_tab_standings: "📊 Posicion",
    sports_hub_tab_betting: "💡 Pronostico AI",
    sports_hub_sport_local: "Aruba Local",
    sports_hub_sport_futbol: "Futbol Mundial",
    sports_hub_sport_beisbol: "MLB Beisbol",
    sports_hub_sport_baloncesto: "NBA Basketbal",
    sports_hub_sport_nfl: "NFL",
    sports_hub_sport_nhl: "NHL",
    sports_hub_live_now: "Partidonan Activo",
    sports_hub_upcoming: "Próximo Partidonan",
    sports_hub_h2h: "Historial H2H",
    sports_hub_win_prob: "Probabilidad di Victoria",
    sports_hub_streak: "Racha",
    sports_hub_best_bet: "Miho Apuesto",
    sports_hub_ai_tip: "Analís di AI",
    sports_hub_totals_prediction: "Pronostico di Total",
    sports_hub_odds: "Cuotanan",
    sports_hub_rank: "Pos",
    sports_hub_team: "Equipo",
    sports_hub_played: "PJ",
    sports_hub_won: "G",
    sports_hub_lost: "P",
    sports_hub_drawn: "E",
    sports_hub_points: "Pts",
    sports_hub_pct: "%",
    sports_hub_draw: "Empate",
    sports_hub_no_live: "No tin partido en vivo na e momento aki.",
    sports_reminder: "Reminder",
    sports_reminder_saved: "Reminder guardá pa:",
    sports_bestbet_local: "Ganador RCA (Home)",
    sports_bestbet_futbol: "Real Madrid of Empate (Double Chance)",
    sports_bestbet_beisbol: "NY Yankees -1.5 (Run Line)",
    sports_bestbet_baloncesto: "Boston Celtics Ganador (Moneyline)",
    sports_bestbet_nfl: "Kansas City Chiefs Ganador",
    sports_bestbet_nhl: "Edmonton Oilers (Moneyline)",
    sports_aitip_local: "RCA ta mustra dominio historico di local den e clasico. Ta spera un partido sera pero faborabel pa RCA.",
    sports_aitip_futbol: "El Clasico ta yega na un momento di alta efectividad ofensivo pa ambos. E local ta cuminsa cu un bentaha chikito pa via di su enracha inbisto na cas.",
    sports_aitip_beisbol: "Gerrit Cole ta habri pa Yankees awe. Boston tabatin problema di bateo contra lansadonan drechi di elite e siman aki.",
    sports_aitip_baloncesto: "Boston tin miho profundidad riba banki. Ta pronostica un duelo defensivo tenso cu un ritmo lento.",
    sports_aitip_nfl: "Revancha di Super Bowl. Mahomes den partidonan grandi sa fungi miho cu e promedio. Apuesto di alta volatilidad.",
    sports_aitip_nhl: "Edmonton ta extremadamente fuerte na Rogers Place. Connor McDavid ta riba un racha di gol den 4 partido.",
    school_calc_direct_phone: "Telefono Directo",
    school_calc_services: "Servicionan / Facilidadnan",
    school_calc_website: "Sitio Web",
    school_calc_gps: "Ubicacion den GPS",
    school_calc_budget_title: "Presupuesto Inicial Proyecta",
    school_calc_school_fees: "Costo di Matricula y Servicio (Paga na Colegio)",
    school_calc_enrollment: "Matricula di Inscripcion",
    school_calc_airco: "Mantencion di Aire Acondiciona (A/C)",
    school_calc_subtotal: "Subtotal Colegio (Obligatorio)",
    school_calc_other_expenses: "Otro Gastonan Estima (Tercero / Opcional)",
    school_calc_uniforms: "Uniform (Proyeccion)",
    school_calc_parents_committee: "Comite di Mayornan (Oudercommissie)",
    school_calc_supplies: "Utiles Escolar & Buki",
    school_calc_total: "Presupuesto Inicial Total",
    school_calc_regulatory_body: "Ente Regulador",
    school_calc_office_phone: "Telefono Sede",
    school_calc_individual_contact: "Contacto individual",
    school_calc_official_website: "Sitio Web Oficial",
    school_calc_office_address: "Direccion Sede",
    school_calc_office_gps: "Ruta GPS Sede",
    calc_not_available: "No disponibel",
    arrivals_status_delayed: "Retrasa",
    arrivals_status_landed: "A Tera",
    arrivals_status_expected: "Programa",
    arrivals_status_completed: "Completá",
    arrivals_status_intransit: "Den Transito",
    arrivals_origin: "Origen",
    arrivals_capacity: "Capacidad",
    arrivals_passengers: "Pasajero",
    arrivals_main_airlines: "Lineanan principal",
    arrivals_main_cruiselines: "Lineanan di crucero den transito",
    arrivals_avg_load: "Ocupacion promedio",
    arrivals_avg_stay: "Estancia",
    arrivals_airport_title: "Aeropuerto Reina Beatrix",
    arrivals_pax_today_label: "Pasajeronan Estimá Awe",
    arrivals_pax_val: "5,600 PAX",
    arrivals_flights_arriving: "Vuelonan Yegando",
    arrivals_flights_arriving_val: "8 Vuelo",
    arrivals_us_market: "Mercado di Merca",
    arrivals_us_market_val: "78% quota",
    arrivals_peak_hour: "Ora Pico di Fluhon",
    arrivals_peak_hour_val: "12:00 PM - 03:00 PM",
    arrivals_taxi_tips_title: "Conseho pa Operadornan y Taxi",
    arrivals_taxi_tips_desc: "Ta spera un fluho halto di pasahero for di Merca entre 12:00 PM y 3:00 PM. Ta recomenda taxista pa posiciona na e terminal norte.",
    arrivals_exemption_title: "Exencion di Aduana",
    arrivals_exemption_desc: "Biaheronan por drenta cu compra liber di impuesto personal pa un balor maximo di Afl. 400.00.",
    arrivals_weekly_proj_title: "Proyeccion Semanal",
    arrivals_weekly_flights_label: "Vuelonan di e Siman",
    arrivals_weekly_flights_val: "182 Yegada",
    arrivals_weekly_pax_lbl: "Pasahero Estima",
    arrivals_weekly_pax_val: "36,400 turista",
    arrivals_weekly_peak_day_lbl: "Dia di Mayor Fluho",
    arrivals_weekly_peak_day_val: "Diasabra (32 vuelo)",
    arrivals_weekly_origin_lbl: "Origen Principal",
    arrivals_weekly_origin_val: "Miami / JFK",
    arrivals_weekly_tips_title: "Planificacion Turistico",
    arrivals_weekly_tips_desc: "E fin di siman (specialmente diasabra) ta registra 35% di e volumen semanal di yegada. Agencianan di rent-a-car y transfers mester reforsa nan flota na aeropuerto.",
    arrivals_us_terminal_title: "Terminal di Merca",
    arrivals_us_terminal_desc: "E pre-despacho di aduana di Merca (US Preclearance) ta opera regularmente for di 8:00 AM.",
    arrivals_monthly_est_title: "Estimado Mensual (Juni)",
    arrivals_monthly_pax_label: "Total di Pasahero di e Luna",
    arrivals_monthly_pax_val: "156,000 Pasahero",
    arrivals_monthly_flights_lbl: "Vuelonan drentando",
    arrivals_monthly_flights_val: "780 vuelo",
    arrivals_monthly_occ_lbl: "Ocupacion Hotelero",
    arrivals_monthly_occ_val: "89% Noord / 78% Play",
    arrivals_monthly_leader_lbl: "Aerolinea Lider",
    arrivals_monthly_leader_val: "American Airlines",
    arrivals_monthly_tips_title: "Metricanan di Ocupacion",
    arrivals_monthly_tips_desc: "E fluho hotelero di e luna ta concentra fuertemente den e distrito di Noord (Palm Beach y Eagle Beach), impulsando consumo nocturno den restaurantnan di e area ey.",
    arrivals_port_title: "Puerto di Oranjestad",
    arrivals_cruisers_today_label: "Crucerista den Puerto Awe",
    arrivals_cruisers_today_val: "5,600 Pasahero",
    arrivals_ships_port_lbl: "Barconan den Puerto",
    arrivals_ships_port_val: "2 Crucero",
    arrivals_econ_impact_lbl: "Inyección Economico",
    arrivals_econ_impact_val: "Est. $672,000 USD",
    arrivals_avg_spend_lbl: "Gasto Promedio/Pasahero",
    arrivals_avg_spend_val: "$120.00 USD",
    arrivals_commerce_tips_title: "Conseho pa Comercionan Local",
    arrivals_commerce_tips_desc: "E transito di peaton den centro di Oranjestad lo ta hopi activo entre 9:00 AM y 3:00 PM. Tiendanan na L.G. Smith Blvd y Main Street lo mira un gran demanda.",
    arrivals_local_commerce_title: "Comercio local",
    arrivals_local_commerce_desc: "E cruceristanan ta busca principalmente hoya fino, artesania local y productonan di Aloe Vera di Aruba.",
    arrivals_port_weekly_title: "Puerto: Itinerario Semanal",
    arrivals_weekly_cruisers_lbl: "Cruceristanan di e Siman",
    arrivals_weekly_cruisers_val: "15,070 Pasahero",
    arrivals_scheduled_cruises_lbl: "Cruceronan Programa",
    arrivals_scheduled_cruises_val: "5 Crucero",
    arrivals_weekly_impact_lbl: "Impacto Financiero",
    arrivals_weekly_impact_val: "Est. $1.8M AWG",
    arrivals_largest_ship_lbl: "Barco Mas Grandi",
    arrivals_largest_ship_val: "Disney Fantasy (4,000 pasahero)",
    arrivals_port_logistics_title: "Logistica di Puerto",
    arrivals_port_logistics_desc: "Diabierna ta spera e mayor volumen di turista simultaneamente pa via di Disney Fantasy. Tour operadornan na Oranjestad mester preve autobusnan suficiente pa excursionnan na e ruinanan di oro y playanan di norte.",
    arrivals_port_monthly_title: "Puerto: Proyeccion Mensual",
    arrivals_monthly_cruisers_lbl: "Total Turista pa Puerto",
    arrivals_monthly_cruisers_val: "67,290 Pasahero",
    arrivals_monthly_ships_lbl: "Total Barco di e Luna",
    arrivals_monthly_ships_val: "22 barco",
    arrivals_monthly_impact_lbl: "Impacto Economico Directo",
    arrivals_monthly_impact_val: "Est. $8.1M AWG",
    arrivals_most_frequent_line_lbl: "Linea Mas Frecuente",
    arrivals_most_frequent_line_val: "Royal Caribbean Group",
    arrivals_gdp_impact_title: "Impacto riba e PIB Comercial",
    arrivals_gdp_impact_desc: "E turismo di crucero ta representa aproximadamente 22% di e inyeccion directo na e comercio minorista di e isla. Estadisticanan di e luna ta indica un subida den e gasto den restaurantnan local y tiendanan tradicional di e capital.",
    comercio_resorts: "Hotelnan Resort",
    comercio_all_inclusive: "Hotelnan Todo Incluido",
    comercio_condos: "Condominio (Condos)",
    comercio_villas: "Villas",
    comercio_boutique_apts: "Apartamento Boutique",
    comercio_footfall: "FLUHO DI GENTE",
    comercio_occupancy: "Ocupacion",
    comercio_transit: "Transito",
    comercio_visitors: "Bishitantenan",
    comercio_cruises: "Cruceronan",
    comercio_tours: "Tours",
    comercio_share_gps_btn: "📍 Comparti Ubicacion y Busca Negoshi Cercano",
    comercio_gps_obtaining: "Obteniendo ubicacion di GPS satelital...",
    comercio_gps_shared_here: "📍 Ubicacion comparti. Nos a haya bo na ~{dist}m di e area aki! Negoshinan local na < 100m:",
    comercio_gps_simulating: "📍 GPS (Lat: {lat}, Lng: {lng}). Simulando rango den {target} pa demostracion. Negoshinan na < 100m:",
    comercio_gps_denied: "⚠️ Permiso di ubicacion nenga. Cargando negoshinan simula na < 100m pa e area aki:",
    comercio_gps_not_supported: "⚠️ Geolocation no ta soporta. Cargando negoshinan simula na < 100m pa e area aki:",
    comercio_no_businesses: "No a haya negoshi cerca.",
    comercio_lvl_very_high: "Hopi Halto 🔥",
    comercio_lvl_high: "Halto 📈",
    comercio_lvl_moderate: "Modera ⚖️",
    comercio_lvl_low: "Bou 📉",
    subtab_cursos: "Sabí Cursonan",
    subtab_financiero: "Contabilidad Personal",
    subtab_credito: "Sabí Credito",
    services_courses_title: "🎓 Sabí Cursonan - Centro di Aprendizahe",
    services_courses_subtitle: "Desaroya bo potencial cu cursonan diseña pa exito den negocio online, finansa y inversion.",
    courses_search_placeholder: "Busca curso...",
    courses_cat_all: "Tur Categoria",
    courses_cat_business: "Negoshi Online",
    courses_cat_finanzas: "Finansa",
    courses_cat_inversion: "Inversion",
    finance_lbl_balance: "Saldo Actual",
    finance_lbl_income: "Total Entrada",
    finance_lbl_expenses: "Total Gasto",
    finance_lbl_savings: "Tasa di Ahoro",
    finance_form_title: "💸 Registra Entrada / Gasto",
    finance_form_type: "Tipo di Operacion",
    finance_type_expense: "Gasto",
    finance_type_income: "Entrada",
    finance_form_amount: "Monto (Afl. AWG)",
    finance_form_category: "Categoria",
    finance_cat_comida: "Cuminda & Bevida",
    finance_cat_alquiler: "Hur / Cas",
    finance_cat_salario: "Salario / Negoshi",
    finance_cat_ocio: "Entretenimento / Ocio",
    finance_cat_transporte: "Transport",
    finance_cat_servicios: "Servicionan (Awa/Coriente)",
    finance_cat_otros: "Otro Gastonan",
    finance_form_desc: "Descripcion",
    finance_btn_save: "💾 Guarda Registro",
    finance_ai_title: "AI Insights Financiero",
    finance_dist_title: "📊 Distribucion di Gastonan",
    finance_history_title: "📜 Transaccionnan Reciente",
    finance_col_desc: "Detaye",
    finance_col_cat: "Categoria",
    finance_col_amount: "Monto",
    finance_col_act: "Accion",
    loan_title: "Sabí Credito - Prestamo Micro Instantaneo",
    loan_subtitle: "Financiamento rapido pa emprendedor y proyecto personal na Aruba. Sin papeleo, aprobacion al instante.",
    loan_active_header: "Bo Prestamo Activo",
    loan_amount: "Monto di Prestamo",
    loan_term: "Plaso (Luna)",
    loan_interest: "Interes Anual (APR)",
    loan_monthly_payment: "Pago Mensual",
    loan_total_repayment: "Total pa Repaga",
    loan_status: "Estado",
    loan_status_approved: "Aproba - Placa Transferi",
    loan_repay_btn: "💸 Paga Cuota / Cera Prestamo",
    loan_apply_header: "Pediment pa un Prestamo Micro Nobo",
    loan_select_amount: "Monto pa Pidi",
    loan_select_term: "Plaso di Repago",
    loan_purpose: "Proposito di Prestamo",
    loan_purpose_business: "Capital de Trabao / Negoshi",
    loan_purpose_education: "Educacion / Cursonan",
    loan_purpose_personal: "Gasto Personal / Emergencia",
    loan_purpose_refinance: "Refinancia Deuda",
    loan_calc_preview: "Bista Previa di bo Credito",
    loan_monthly_est: "Cuota Mensual Estimá",
    loan_submit_btn: "🚀 Pidi Aprobacion Instantaneo",
    loan_success_msg: "🎉 Pabien! Bo microprestamo a wordo aproba instantaneamente. E placa a wordo transferi pa bo wallet.",
    loan_repaid_msg: "✅ Pago exitoso! Bo saldo pendiente a wordo actualisa.",
    loan_settled_msg: "🎉 Pabien! Bo a cera bo microprestamo completamente.",
    loan_error_insufficient: "❌ Placa insuficiente den bo wallet pa haci e pago aki.",
    loan_pool_label: "Fondo Comun di Credito",
    loan_pool_earnings: "Interes Genera (Compuesto)",
    loan_tier_label: "Nivel di Credito",
    loan_tier_desc: "Paga na tempo pa aumenta bo nivel y habri limitenan mas halto.",
    loan_suspended_label: "Plan Suspende",
    loan_suspended_desc: "Bo plan di credito ta suspende pa motibo di pago tardi. Lo ta blokia te cu:",
    loan_queue_title: "Fila di Spera (Otro Emprendedornan)",
    loan_queue_col_name: "Solicitante",
    loan_queue_col_amount: "Monto Pidi",
    loan_queue_col_status: "Estado",
    loan_queue_col_action: "Accion",
    loan_queue_status_pending: "Spera riba Fondo",
    loan_queue_status_approved: "Financia",
    loan_queue_btn_process: "Aproba Siguiente Pedido",
    loan_queue_btn_simulate: "Simula Pedido di Tercera Persona",
    loan_repay_ontime: "Paga Cuota (Na Tempo)",
    loan_repay_late: "Paga Cuota (Cu Demora)",
    loan_btn_skip_time: "⏩ Avanza Tempo (Kita Suspension)",
    loan_error_pool_empty: "Fondo Comun no tin suficiente capital pa e prestamo aki."
  }
};

function changeAppLanguage(lang) {
  if (!SABI_TRANSLATIONS[lang]) return;
  
  appState.language = lang;
  localStorage.setItem('sabi_lang', lang);
  SoundEffects.playClick();
  
  translatePage();

  // Re-render active dynamic lists immediately
  if (appState.activeMainTab === 'comunidad') {
    if (appState.activeComunidadTab === 'market') {
      renderClassifieds();
    } else if (appState.activeComunidadTab === 'delivery') {
      renderDeliveryRequestPortal();
    }
  } else if (appState.activeMainTab === 'suerte') {
    renderDashboardUI();
    renderPositionLists();
    renderHistoryTable();
  } else if (appState.activeMainTab === 'servicios') {
    const tab = appState.activeServiceTab;
    if (tab === 'emergencia') renderEmergencies();
    else if (tab === 'directorio') renderDirectory();
    else if (tab === 'educacion') renderSchoolsList();
    else if (tab === 'deportes') renderSportsContent();
    else if (tab === 'comercio') renderComercioStats();
    else if (tab === 'llegadas') renderArrivalsTab();
    else if (tab === 'cursos') renderSabiCourses();
    else if (tab === 'financiero') renderFinancialHub();
    else if (tab === 'credito') renderCredito();
  }

  // Re-render account modal if open
  const accModal = document.getElementById("account-modal");
  if (accModal && accModal.style.display === 'block') {
    renderAccountModal();
  }
}

function translatePage() {
  const lang = appState.language || 'es';
  const dictionary = SABI_TRANSLATIONS[lang];
  
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dictionary && dictionary[key]) {
      el.innerHTML = dictionary[key];
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (dictionary && dictionary[key]) {
      el.placeholder = dictionary[key];
    }
  });

  // Sync select tag
  const langSelector = document.getElementById("lang-selector");
  if (langSelector) {
    langSelector.value = lang;
  }
}

// ==========================================================================
// 🎓 SABÍ CURSOS - BASE DE DATOS Y LÓGICA DE NEGOCIO
// ==========================================================================

const SABI_CURSOS_DATA = [
  // CATEGORY: business (Negocios Online)
  {
    id: "curso-1",
    category: "business",
    title: "Introducción a los Negocios Online y Modelos Web",
    description: "Conoce los fundamentos para crear tu primer modelo de negocio en internet, desde e-commerce hasta servicios digitales.",
    price: 0.00,
    duration: "4 hrs",
    lectures: 5,
    rating: 4.8,
    lecturesList: ["¿Qué es un negocio online?", "Modelos de monetización populares", "Plataformas y herramientas básicas", "Eligiendo tu nicho ideal", "Planificación de tu primer lanzamiento"]
  },
  {
    id: "curso-2",
    category: "business",
    title: "E-commerce Premium y Tiendas Virtuales",
    description: "Construye una tienda online profesional con pasarelas de pago integradas y gestiona envíos sin saber programar.",
    price: 19.00,
    duration: "8 hrs",
    lectures: 7,
    rating: 4.7,
    lecturesList: ["Estructura de un e-commerce", "Configurando Stripe y cobros", "Gestión de inventarios y logística", "Diseño optimizado para conversión", "Estrategias de carrito abandonado", "Campañas iniciales de publicidad", "Escalando ventas internacionales"]
  },
  {
    id: "curso-3",
    category: "business",
    title: "Suscripciones, Membresías y Rentas Recurrentes",
    description: "Crea ingresos predecibles mes a mes implementando comunidades privadas, SaaS, o clubes de suscripción.",
    price: 29.00,
    duration: "10 hrs",
    lectures: 7,
    rating: 4.9,
    lecturesList: ["La economía de la recurrencia", "Sistemas de membresía modernos", "Control y reducción de cancelaciones (Churn)", "Creación de contenido continuo", "Pasarelas de cobro recurrente", "Lanzamientos para membresías", "Casos de estudio exitosos"]
  },
  {
    id: "curso-4",
    category: "business",
    title: "Agencias de Servicios Digitales y Automatizaciones",
    description: "Aprende a vender servicios de alto valor (marketing, IA, diseño) y automatiza el flujo de trabajo con clientes.",
    price: 49.00,
    duration: "12 hrs",
    lectures: 8,
    rating: 4.8,
    lecturesList: ["Definición de tus servicios estrella", "Atrayendo clientes corporativos", "Cotización de proyectos de alto valor", "Sistemas de onboarding automatizados", "Gestión de proyectos con IA", "Contratos y marcos legales", "Delegando y escalando tu agencia", "Proyecto final: Tu primer cliente"]
  },

  // CATEGORY: finanzas (Finanzas)
  {
    id: "curso-5",
    category: "finanzas",
    title: "Finanzas Personales y Contabilidad para Principiantes",
    description: "Aprende a controlar tus ingresos, organizar tus gastos mensuales y establecer hábitos saludables de ahorro.",
    price: 0.00,
    duration: "4 hrs",
    lectures: 5,
    rating: 4.7,
    lecturesList: ["Mentalidad financiera", "El método de los sobres y presupuestos", "Registrando ingresos y gastos diarios", "Identificando gastos hormiga", "Creando tu primer fondo de emergencias"]
  },
  {
    id: "curso-6",
    category: "finanzas",
    title: "Planificación Financiera Familiar y Presupuestos",
    description: "Estrategias avanzadas para organizar presupuestos familiares complejos, reducir deudas rápidamente y planificar metas a largo plazo.",
    price: 15.00,
    duration: "6 hrs",
    lectures: 6,
    rating: 4.6,
    lecturesList: ["Finanzas en pareja y familia", "El método bola de nieve para deudas", "Optimización de gastos fijos y variables", "Ahorrando para metas importantes (casa, auto)", "Seguros y protección patrimonial", "Plantillas interactivas de presupuesto"]
  },
  {
    id: "curso-7",
    category: "finanzas",
    title: "Finanzas para Emprendedores y Estructuras Fiscales",
    description: "Domina el flujo de caja, separa tus finanzas personales de las del negocio y entiende la contabilidad de tu empresa.",
    price: 25.00,
    duration: "8 hrs",
    lectures: 7,
    rating: 4.8,
    lecturesList: ["Diferencias entre flujo de caja y ganancias", "Márgenes de contribución y punto de equilibrio", "Gestión de cuentas por cobrar y pagar", "Impuestos básicos para negocios", "Financiamiento vs. bootstrap", "Herramientas de contabilidad en la nube", "Lectura básica de estados financieros"]
  },
  {
    id: "curso-8",
    category: "finanzas",
    title: "Ingeniería Financiera Avanzada e Inteligencia Fiscal",
    description: "Estrategias de optimización impositiva legal, planificación hereditaria, y apalancamiento financiero corporativo.",
    price: 39.00,
    duration: "10 hrs",
    lectures: 8,
    rating: 4.9,
    lecturesList: ["El poder del interés compuesto avanzado", "Apalancamiento de deuda buena", "Estructuras societarias e impuestos", "Protección de activos avanzada", "Sistemas de retiros optimizados", "Planificación de jubilación", "Vehículos de inversión de bajo impacto impositivo", "Proyecto final: Tu plan de libertad financiera"]
  },

  // CATEGORY: inversion (Inversión)
  {
    id: "curso-9",
    category: "inversion",
    title: "Introducción al Mundo de las Inversiones",
    description: "Conoce las diferencias entre ahorro e inversión, el perfil de riesgo y los tipos de activos disponibles en el mercado.",
    price: 0.00,
    duration: "5 hrs",
    lectures: 5,
    rating: 4.8,
    lecturesList: ["¿Por qué debemos invertir?", "Inflación: El enemigo silencioso", "El triángulo de la inversión (Riesgo, Retorno, Plazo)", "Perfiles de inversionista", "Introducción a los diferentes tipos de activos"]
  },
  {
    id: "curso-10",
    category: "inversion",
    title: "Inversión en Bolsa de Valores y ETFs para Todos",
    description: "Aprende a comprar tus primeras acciones y fondos indexados (ETFs) de forma segura y con comisiones bajas.",
    price: 22.00,
    duration: "9 hrs",
    lectures: 7,
    rating: 4.7,
    lecturesList: ["¿Cómo funciona la Bolsa de Valores?", "Eligiendo un broker regulado y seguro", "ETFs: Diversificación instantánea", "Acciones de dividendos vs. acciones de crecimiento", "Estrategia Dollar-Cost Averaging (DCA)", "Análisis básico de empresas", "Creación de tu portafolio pasivo"]
  },
  {
    id: "curso-11",
    category: "inversion",
    title: "Bienes Raíces e Inversiones Inmobiliarias",
    description: "Descubre cómo invertir en el sector inmobiliario con o sin capital masivo, a través de alquileres tradicionales, alquileres vacacionales y REITs.",
    price: 35.00,
    duration: "10 hrs",
    lectures: 7,
    rating: 4.8,
    lecturesList: ["Fundamentos de la inversión inmobiliaria", "Calculando rentabilidad (Cap Rate y Cash on Cash)", "Estrategias de remodelación y venta (Flipping)", "Gestión de alquileres vacacionales en Aruba", "REITs: Invirtiendo en propiedades desde $100", "Apalancamiento hipotecario inteligente", "Negociación de contratos y cierres"]
  },
  {
    id: "curso-12",
    category: "inversion",
    title: "Portafolios Globales, Criptoactivos e Inversión Avanzada",
    description: "Domina la diversificación multi-activo, inversiones alternativas, oro, metales, y asignación estratégica en criptoactivos.",
    price: 45.00,
    duration: "12 hrs",
    lectures: 8,
    rating: 4.9,
    lecturesList: ["Teoría de portafolios moderna", "Asignación estratégica de activos (Asset Allocation)", "Inversión en materias primas y refugios de valor", "Tecnología Blockchain y Bitcoin como activo", "Análisis macroeconómico básico", "Gestión avanzada de riesgo y volatilidad", "Rebalanceo periódico de portafolios", "Proyecto final: Construyendo tu portafolio global"]
  }
];

function renderSabiCourses() {
  const container = document.getElementById("sabi-courses-grid");
  if (!container) return;

  const searchQuery = document.getElementById("courses-search-input").value.toLowerCase();
  const filterCat = document.getElementById("courses-filter-category").value;

  let html = "";
  const filtered = SABI_CURSOS_DATA.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery) || c.description.toLowerCase().includes(searchQuery);
    const matchesCat = filterCat === 'all' || c.category === filterCat;
    return matchesSearch && matchesCat;
  });

  if (filtered.length === 0) {
    html = `<div style="grid-column: 1/-1; text-align:center; color:var(--text-muted); padding:2rem">No se encontraron cursos que coincidan con la búsqueda.</div>`;
  } else {
    filtered.forEach(c => {
      const isFree = c.price === 0;
      const isPurchased = appState.purchasedCourses.includes(c.id) || isFree;
      const btnText = isPurchased ? "Ver Curso" : `Comprar - Afl. ${c.price.toFixed(2)}`;
      const btnClass = isPurchased ? "btn-cyan" : "btn-purple";
      const ratingStars = "⭐".repeat(Math.round(c.rating));

      html += `
        <div class="card purple-accent" style="display:flex; flex-direction:column; justify-content:space-between; gap:1rem; padding:1.25rem">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem">
              <span style="font-size:0.6rem; background:rgba(192,132,252,0.15); border:1px solid #c084fc; color:#d8b4fe; padding:2px 8px; border-radius:12px; text-transform:uppercase">${c.category}</span>
              <span style="font-size:0.7rem; color:var(--text-muted)">${c.duration}</span>
            </div>
            <h3 style="font-size:0.95rem; font-weight:800; color:white; line-height:1.3; min-height:2.6rem">${c.title}</h3>
            <p style="font-size:0.75rem; color:var(--text-muted); line-height:1.4; margin:0.5rem 0 0.75rem 0; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden">${c.description}</p>
            <div style="display:flex; align-items:center; gap:0.5rem; font-size:0.7rem">
              <span style="color:var(--neon-gold)">${ratingStars}</span>
              <span style="color:var(--text-muted)">(${c.rating})</span>
              <span style="color:var(--text-muted)">•</span>
              <span style="color:var(--text-muted)">${c.lecturesList.length} clases</span>
            </div>
          </div>
          <button class="btn ${btnClass} btn-sm" onclick="window.handleCourseAction('${c.id}')" style="width:100%; font-weight:bold">${btnText}</button>
        </div>
      `;
    });
  }

  container.innerHTML = html;
}

function handleCourseAction(id) {
  const course = SABI_CURSOS_DATA.find(c => c.id === id);
  const isFree = course && course.price === 0;
  if (appState.purchasedCourses.includes(id) || isFree) {
    window.openCoursePlayer(id);
  } else {
    window.buySabiCourse(id);
  }
}

function buySabiCourse(id) {
  const course = SABI_CURSOS_DATA.find(c => c.id === id);
  if (!course) return;

  if (appState.userWallet < course.price) {
    SoundEffects.playAlert();
    showToast("Saldo Insuficiente", "Recarga fondos en tu billetera Sabí-Pay desde el panel de cuenta.");
    return;
  }

  appState.userWallet -= course.price;
  appState.purchasedCourses.push(id);
  localStorage.setItem('sabi_purchased_courses', JSON.stringify(appState.purchasedCourses));
  
  // Save transactions to sync wallet
  localStorage.setItem('sabi_wallet_balance', appState.userWallet.toFixed(2));
  
  SoundEffects.playJingle();
  showToast("¡Compra Realizada!", `Te has inscrito correctamente en: ${course.title}`);
  
  renderSabiCourses();
  
  // Update wallet display if account modal is open
  const walletVal = document.getElementById("wallet-balance-val");
  if (walletVal) walletVal.innerText = `Afl. ${appState.userWallet.toFixed(2)} AWG`;
}

// Course Player State
let activePlayerCourseId = null;
let activeLectureIndex = 0;
let simulatedVideoTimer = null;
let simulatedVideoProgress = 0;

function openCoursePlayer(courseId) {
  const course = SABI_CURSOS_DATA.find(c => c.id === courseId);
  if (!course) return;

  activePlayerCourseId = courseId;
  activeLectureIndex = 0;
  simulatedVideoProgress = 0;
  if (simulatedVideoTimer) clearInterval(simulatedVideoTimer);

  document.getElementById("player-course-category").innerText = course.category.toUpperCase();
  document.getElementById("player-course-title").innerText = course.title;
  
  // Load progress
  const progressKey = `sabi_progress_${courseId}`;
  const completedList = JSON.parse(localStorage.getItem(progressKey) || '[]');
  
  renderPlayerLectures(course, completedList);
  loadLecture(0);

  const modal = document.getElementById("course-player-modal");
  modal.style.display = "flex";
  modal.classList.add("active");
}

function closeCoursePlayer() {
  if (simulatedVideoTimer) clearInterval(simulatedVideoTimer);
  document.getElementById("course-player-modal").style.display = "none";
  document.getElementById("course-player-modal").classList.remove("active");
}

function loadLecture(idx) {
  const course = SABI_CURSOS_DATA.find(c => c.id === activePlayerCourseId);
  if (!course) return;

  activeLectureIndex = idx;
  simulatedVideoProgress = 0;
  if (simulatedVideoTimer) clearInterval(simulatedVideoTimer);

  document.getElementById("video-sim-progress").style.width = "0%";
  document.getElementById("video-sim-overlay").style.display = "block";
  document.getElementById("video-sim-status").innerText = "Haz clic para iniciar la clase";
  document.getElementById("player-lecture-num").innerText = `Clase ${idx + 1}`;
  document.getElementById("player-lecture-title").innerText = course.lecturesList[idx];

  // Highlight active
  document.querySelectorAll(".lecture-item").forEach((el, index) => {
    el.style.background = index === idx ? "rgba(0, 243, 255, 0.08)" : "transparent";
    el.style.borderColor = index === idx ? "var(--neon-cyan)" : "var(--glass-border)";
  });
}

function playSimulatedLecture() {
  document.getElementById("video-sim-overlay").style.display = "none";
  simulatedVideoProgress = 0;
  if (simulatedVideoTimer) clearInterval(simulatedVideoTimer);

  simulatedVideoTimer = setInterval(() => {
    simulatedVideoProgress += 2.5; // reaches 100% in 4 seconds
    document.getElementById("video-sim-progress").style.width = `${simulatedVideoProgress}%`;

    if (simulatedVideoProgress >= 100) {
      clearInterval(simulatedVideoTimer);
      // Mark as completed
      window.markLectureCompleted(activePlayerCourseId, activeLectureIndex);
      showToast("¡Clase Completada!", "Excelente progreso en tu aprendizaje.");
      SoundEffects.playClick();
      
      // Auto play next if exists
      const course = SABI_CURSOS_DATA.find(c => c.id === activePlayerCourseId);
      if (course && activeLectureIndex < course.lecturesList.length - 1) {
        setTimeout(() => {
          loadLecture(activeLectureIndex + 1);
        }, 1000);
      }
    }
  }, 100);
}

function markLectureCompleted(courseId, idx) {
  const progressKey = `sabi_progress_${courseId}`;
  const completedList = JSON.parse(localStorage.getItem(progressKey) || '[]');
  if (!completedList.includes(idx)) {
    completedList.push(idx);
    localStorage.setItem(progressKey, JSON.stringify(completedList));
  }

  const course = SABI_CURSOS_DATA.find(c => c.id === courseId);
  if (course) {
    renderPlayerLectures(course, completedList);
  }
}

function toggleLectureCompleted(idx) {
  const courseId = activePlayerCourseId;
  const progressKey = `sabi_progress_${courseId}`;
  let completedList = JSON.parse(localStorage.getItem(progressKey) || '[]');

  if (completedList.includes(idx)) {
    completedList = completedList.filter(item => item !== idx);
  } else {
    completedList.push(idx);
  }

  localStorage.setItem(progressKey, JSON.stringify(completedList));
  const course = SABI_CURSOS_DATA.find(c => c.id === courseId);
  if (course) {
    renderPlayerLectures(course, completedList);
  }
}

function renderPlayerLectures(course, completedList) {
  const listContainer = document.getElementById("player-lectures-list");
  if (!listContainer) return;

  const pct = Math.round((completedList.length / course.lecturesList.length) * 100);
  document.getElementById("player-progress-pct").innerText = `${pct}%`;

  let html = "";
  course.lecturesList.forEach((lec, idx) => {
    const isCompleted = completedList.includes(idx);
    const checkedAttr = isCompleted ? "checked" : "";
    html += `
      <div class="lecture-item" style="display:flex; align-items:center; justify-content:space-between; padding:0.6rem 0.8rem; border:1px solid var(--glass-border); border-radius:12px; gap:0.75rem; transition:var(--transition-smooth); cursor:pointer" onclick="window.loadLecture(${idx})">
        <div style="display:flex; align-items:center; gap:0.5rem; min-width:0">
          <span style="font-size:0.75rem; color:var(--text-muted)">${idx + 1}.</span>
          <span style="font-size:0.75rem; font-weight:500; color:white; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${lec}</span>
        </div>
        <input type="checkbox" ${checkedAttr} onclick="event.stopPropagation(); window.toggleLectureCompleted(${idx})" style="cursor:pointer; width:16px; height:16px; accent-color:var(--neon-cyan)">
      </div>
    `;
  });

  listContainer.innerHTML = html;
}

// ==========================================================================
// 💰 CONTROL FINANCIERO (CONTABILIDAD PERSONAL) - LÓGICA DE NEGOCIO
// ==========================================================================

function renderFinancialHub() {
  const transactions = appState.financialTransactions;
  
  // Calculate summary stats
  let totalIncome = 0;
  let totalExpenses = 0;
  
  transactions.forEach(t => {
    if (t.type === 'income') totalIncome += t.amount;
    else totalExpenses += t.amount;
  });
  
  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

  // Render stats counters
  document.getElementById("finance-balance-val").innerText = `Afl. ${balance.toFixed(2)} AWG`;
  document.getElementById("finance-income-val").innerText = `Afl. ${totalIncome.toFixed(2)} AWG`;
  document.getElementById("finance-expense-val").innerText = `Afl. ${totalExpenses.toFixed(2)} AWG`;
  document.getElementById("finance-savings-val").innerText = `${savingsRate >= 0 ? savingsRate : 0}%`;

  // Apply colors to balance
  const balanceValEl = document.getElementById("finance-balance-val");
  if (balance >= 0) {
    balanceValEl.style.color = "var(--neon-cyan)";
  } else {
    balanceValEl.style.color = "var(--neon-pink)";
  }

  // Render Ledger List
  const ledgerBody = document.getElementById("finance-ledger-body");
  if (ledgerBody) {
    let html = "";
    if (transactions.length === 0) {
      html = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:1rem">No hay registros financieros guardados.</td></tr>`;
    } else {
      // Sort newest first
      const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
      sorted.forEach(t => {
        const sign = t.type === 'income' ? '+' : '-';
        const color = t.type === 'income' ? 'var(--neon-emerald)' : 'var(--neon-pink)';
        
        html += `
          <tr style="border-bottom:1px solid rgba(255,255,255,0.03)">
            <td style="padding:0.4rem 0.2rem; font-weight:600">${t.desc}</td>
            <td style="padding:0.4rem 0.2rem; text-transform:uppercase; font-size:0.65rem; color:var(--text-muted)">${t.category}</td>
            <td style="padding:0.4rem 0.2rem; text-align:right; font-weight:bold; color:${color}">${sign}Afl. ${t.amount.toFixed(2)}</td>
            <td style="padding:0.4rem 0.2rem; text-align:center">
              <button onclick="window.deleteFinancialTransaction('${t.id}')" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:0.95rem" onmouseover="this.style.color='var(--neon-pink)'" onmouseout="this.style.color='var(--text-muted)'">&times;</button>
            </td>
          </tr>
        `;
      });
    }
    ledgerBody.innerHTML = html;
  }

  // Render Budget Progress Bar by Category
  const categoriesProgress = document.getElementById("finance-categories-progress");
  if (categoriesProgress) {
    const categoryExpenses = {
      comida: 0,
      alquiler: 0,
      ocio: 0,
      transporte: 0,
      servicios: 0,
      otros: 0
    };

    transactions.forEach(t => {
      if (t.type === 'expense' && categoryExpenses[t.category] !== undefined) {
        categoryExpenses[t.category] += t.amount;
      }
    });

    let catHtml = "";
    const mockLimits = {
      comida: 400.00,
      alquiler: 1200.00,
      ocio: 250.00,
      transporte: 200.00,
      servicios: 350.00,
      otros: 200.00
    };

    Object.keys(categoryExpenses).forEach(cat => {
      const exp = categoryExpenses[cat];
      const limit = mockLimits[cat];
      const pct = Math.min(Math.round((exp / limit) * 100), 100);
      let barColor = "var(--neon-cyan)";
      if (pct > 70 && pct <= 90) barColor = "var(--neon-gold)";
      else if (pct > 90) barColor = "var(--neon-pink)";

      catHtml += `
        <div>
          <div style="display:flex; justify-content:space-between; font-size:0.65rem; color:var(--text-muted); margin-bottom:2px">
            <span style="text-transform:capitalize; font-weight:600">${cat}</span>
            <span>Afl. ${exp.toFixed(0)} / Afl. ${limit.toFixed(0)}</span>
          </div>
          <div style="height:6px; background:rgba(255,255,255,0.06); border-radius:3px; overflow:hidden">
            <div style="width:${pct}%; height:100%; background:${barColor}; box-shadow:0 0 5px ${barColor}; border-radius:3px"></div>
          </div>
        </div>
      `;
    });

    categoriesProgress.innerHTML = catHtml;
  }

  updateFinancialAiInsights(balance, totalIncome, totalExpenses, savingsRate);
}

function addFinancialTransaction(event) {
  event.preventDefault();

  const type = document.getElementById("finance-type").value;
  const amount = parseFloat(document.getElementById("finance-amount").value);
  const category = document.getElementById("finance-category").value;
  const desc = document.getElementById("finance-desc").value;

  if (isNaN(amount) || amount <= 0) return;

  const newTx = {
    id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    type,
    amount,
    category,
    desc,
    date: new Date().toISOString()
  };

  appState.financialTransactions.push(newTx);
  localStorage.setItem('sabi_financial_transactions', JSON.stringify(appState.financialTransactions));

  SoundEffects.playClick();
  showToast("Registro Guardado", `${type === 'income' ? 'Ingreso' : 'Gasto'} registrado correctamente.`);
  
  // Reset form inputs (excluding selects)
  document.getElementById("finance-amount").value = "";
  document.getElementById("finance-desc").value = "";

  renderFinancialHub();
}

function deleteFinancialTransaction(id) {
  appState.financialTransactions = appState.financialTransactions.filter(t => t.id !== id);
  localStorage.setItem('sabi_financial_transactions', JSON.stringify(appState.financialTransactions));
  
  SoundEffects.playClick();
  showToast("Registro Eliminado", "La transacción fue borrada con éxito.");
  
  renderFinancialHub();
}

function updateFinancialAiInsights(balance, totalIncome, totalExpenses, savingsRate) {
  const insightsBox = document.getElementById("finance-ai-insights");
  if (!insightsBox) return;

  if (appState.financialTransactions.length === 0) {
    insightsBox.innerHTML = `Registra tus movimientos diarios para que la IA de Sabí comience a analizar tu patrón de gastos y te proporcione consejos personalizados.`;
    return;
  }

  let advice = "";
  if (balance < 0) {
    advice = `⚠️ <b>¡Alerta de Déficit!</b> Estás gastando más de tus ingresos (Balance negativo). Te recomendamos recortar suscripciones y gastos en la categoría <b>Ocio</b> inmediatamente.`;
  } else if (savingsRate < 10) {
    advice = `⚠️ <b>Tasa de ahorro baja (${savingsRate}%).</b> Estás en zona de riesgo. Intenta reducir los gastos de <b>Comida fuera de casa</b> o prepara un presupuesto semanal fijo para elevar tu tasa a más del 15%.`;
  } else if (savingsRate >= 10 && savingsRate < 25) {
    advice = `💡 <b>Buen camino.</b> Tu tasa de ahorro es de ${savingsRate}%. Intenta depositar automáticamente un 5% de tus ingresos mensuales a tu cuenta de ahorros de <b>${appState.userProfile.bankName}</b> para protegerte contra imprevistos.`;
  } else {
    advice = `🌟 <b>¡Excelente salud financiera!</b> Con una tasa de ahorro del ${savingsRate}%, estás construyendo un patrimonio sólido en Aruba. Considera invertir parte del capital excedente en educación o fondos indexados.`;
  }

  insightsBox.innerHTML = advice;
}

// BIND FUNCTIONS GLOBALLY TO WINDOW OBJECT FOR INLINE EVENT HANDLERS
window.renderSabiCourses = renderSabiCourses;
window.handleCourseAction = handleCourseAction;
window.buySabiCourse = buySabiCourse;
window.openCoursePlayer = openCoursePlayer;
window.closeCoursePlayer = closeCoursePlayer;
window.loadLecture = loadLecture;
window.playSimulatedLecture = playSimulatedLecture;
window.toggleLectureCompleted = toggleLectureCompleted;
window.markLectureCompleted = markLectureCompleted;
window.renderFinancialHub = renderFinancialHub;
window.addFinancialTransaction = addFinancialTransaction;
window.deleteFinancialTransaction = deleteFinancialTransaction;
window.updateFinancialAiInsights = updateFinancialAiInsights;

// ==========================================================================
// 🎫 SABÍ CRÉDITO (MICROLOANS PORTAL) - LÓGICA DE NEGOCIO Y RENDERIZADO
// ==========================================================================

function getCreditTierDetails(tier) {
  switch (tier) {
    case 1: return { name: "Tier 1: Starter", limit: 500, aprDiscount: 0 };
    case 2: return { name: "Tier 2: Bronze", limit: 1500, aprDiscount: 0.005 };
    case 3: return { name: "Tier 3: Silver", limit: 3000, aprDiscount: 0.01 };
    case 4: return { name: "Tier 4: Gold", limit: 5000, aprDiscount: 0.015 };
    case 5: return { name: "Tier 5: VIP Platinum", limit: 10000, aprDiscount: 0.02 };
    default: return { name: "Tier 1: Starter", limit: 500, aprDiscount: 0 };
  }
}

function isUserSuspended() {
  if (!appState.loanSuspensionUntil) return false;
  const now = Date.now();
  const suspensionTime = parseInt(appState.loanSuspensionUntil, 10);
  if (isNaN(suspensionTime)) return false;
  if (now < suspensionTime) {
    return true;
  } else {
    appState.loanSuspensionUntil = null;
    localStorage.removeItem('sabi_loan_suspension_until');
    return false;
  }
}

function renderCredito() {
  const container = document.getElementById("service-content-credito");
  if (!container) return;

  const lang = appState.language || 'es';
  const dict = SABI_TRANSLATIONS[lang];

  const activeLoan = appState.activeLoan;

  let leftColHtml = "";

  if (isUserSuspended()) {
    const remainingTimeSec = Math.ceil((parseInt(appState.loanSuspensionUntil, 10) - Date.now()) / 1000);
    leftColHtml = `
      <section class="card pink-accent" style="flex:1; border:2px solid var(--neon-pink); box-shadow:0 0 15px rgba(244,63,94,0.15)">
        <h3 style="font-size:1.1rem; font-weight:800; color:var(--neon-pink); margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem">
          ⚠️ ${dict['loan_suspended_label'] || "Plan Suspende"}
        </h3>
        <p style="color:var(--text-main); font-size:0.85rem; margin-bottom:1.5rem; line-height:1.4">
          ${dict['loan_suspended_desc'] || "Bo plan di credito ta suspende pa motibo di pago tardi. Lo ta blokia te cu:"}
        </p>
        <div style="font-size:2.2rem; font-weight:800; color:var(--neon-pink); text-align:center; padding:1.5rem; background:rgba(255,255,255,0.02); border-radius:12px; margin-bottom:1.5rem">
          ${remainingTimeSec > 0 ? `${remainingTimeSec}s` : "0s"}
        </div>
        <button class="btn btn-sm btn-cyan" onclick="window.skipLoanSuspension()" style="width:100%; font-weight:bold">
          ${dict['loan_btn_skip_time'] || "⏩ Avanza Tempo (Kita Suspension)"}
        </button>
      </section>
    `;
    
    // Auto-update countdown live on screen
    setTimeout(() => {
      if (appState.activeMainTab === 'servicios' && appState.activeServiceTab === 'credito') {
        renderCredito();
      }
    }, 1000);
  } else if (activeLoan) {
    leftColHtml = `
      <section class="card pink-accent" style="flex:1">
        <h3 style="font-size:1.1rem; font-weight:800; color:var(--neon-pink); margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem">
          💰 ${dict['loan_active_header'] || "Tu Préstamo Activo"}
        </h3>
        
        <div style="display:flex; flex-direction:column; gap:0.8rem; margin-bottom:1.5rem">
          <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:0.4rem">
            <span style="color:var(--text-muted); font-size:0.8rem">${dict['loan_amount'] || "Monto del Préstamo"}:</span>
            <span style="font-weight:bold; color:var(--text-main)">Afl. ${activeLoan.amount.toFixed(2)} AWG</span>
          </div>
          <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:0.4rem">
            <span style="color:var(--text-muted); font-size:0.8rem">${dict['loan_term'] || "Plazo (Meses)"}:</span>
            <span style="font-weight:bold; color:var(--text-main)">${activeLoan.remainingTerm} / ${activeLoan.term}</span>
          </div>
          <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:0.4rem">
            <span style="color:var(--text-muted); font-size:0.8rem">${dict['loan_interest'] || "Tasa de Interés Anual (APR)"}:</span>
            <span style="font-weight:bold; color:var(--neon-gold)">${(activeLoan.apr * 100).toFixed(1)}% APR</span>
          </div>
          <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:0.4rem">
            <span style="color:var(--text-muted); font-size:0.8rem">${dict['loan_monthly_payment'] || "Pago Mensual"}:</span>
            <span style="font-weight:bold; color:var(--neon-cyan)">Afl. ${activeLoan.monthlyPayment.toFixed(2)} AWG</span>
          </div>
          <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:0.4rem">
            <span style="color:var(--text-muted); font-size:0.8rem">${dict['loan_total_repayment'] || "Total a Repagar"}:</span>
            <span style="font-weight:bold; color:var(--text-main)">Afl. ${activeLoan.totalRepayment.toFixed(2)} AWG</span>
          </div>
          <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:0.4rem">
            <span style="color:var(--text-muted); font-size:0.8rem">Balance Pendiente:</span>
            <span style="font-weight:bold; color:var(--neon-pink)">Afl. ${activeLoan.remainingRepayment.toFixed(2)} AWG</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding-bottom:0.4rem">
            <span style="color:var(--text-muted); font-size:0.8rem">${dict['loan_status'] || "Estado"}:</span>
            <span class="badge" style="background:rgba(0,245,212,0.15); color:var(--neon-cyan); border:1px solid var(--neon-cyan); padding:0.15rem 0.5rem; border-radius:4px; font-size:0.7rem; font-weight:bold">
              ${dict['loan_status_approved'] || "Aprobado - Fondos Transferidos"}
            </span>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:0.75rem">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem">
            <button class="btn btn-sm btn-cyan" onclick="window.payLoanInstallment(false, true)" style="font-weight:bold; font-size:0.75rem">
              ${dict['loan_repay_ontime'] || "Paga Cuota (A Tiempo)"}
            </button>
            <button class="btn btn-sm btn-cyan" onclick="window.payLoanInstallment(false, false)" style="font-weight:bold; font-size:0.75rem; background:rgba(244,63,94,0.1); border:1px solid var(--neon-pink); color:var(--neon-pink)" onmouseover="this.style.background='rgba(244,63,94,0.2)'" onmouseout="this.style.background='rgba(244,63,94,0.1)'">
              ${dict['loan_repay_late'] || "Paga Cuota (Atrasado)"}
            </button>
          </div>
          <button class="btn btn-sm" onclick="window.payLoanInstallment(true, true)" style="width:100%; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.1); color:var(--text-main); font-weight:bold">
            Saldar Deuda Completa
          </button>
        </div>
      </section>
    `;
  } else {
    const tierDetails = getCreditTierDetails(appState.creditTier);
    leftColHtml = `
      <section class="card purple-accent" style="flex:1">
        <h3 style="font-size:1.1rem; font-weight:800; color:var(--neon-purple); margin-bottom:0.5rem">
          📝 ${dict['loan_apply_header'] || "Solicitar un Nuevo Micropréstamo"}
        </h3>
        <p style="color:var(--text-muted); font-size:0.75rem; margin-bottom:1.5rem">
          Ajusta los parámetros de tu préstamo a continuación. Nuestro sistema Sabí AI evaluará tu historial de transacciones para una aprobación instantánea.
        </p>

        <form id="loan-application-form" onsubmit="window.applyForMicroloan(event)" style="display:flex; flex-direction:column; gap:1.25rem">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem">
              <label style="font-size:0.8rem; color:var(--text-muted); font-weight:600">${dict['loan_select_amount'] || "Monto a Solicitar"}:</label>
              <span id="loan-amount-val" style="font-size:1.1rem; font-weight:bold; color:var(--neon-cyan)">Afl. ${tierDetails.limit} AWG</span>
            </div>
            <input type="range" id="loan-amount-slider" min="100" max="${tierDetails.limit}" step="100" value="${tierDetails.limit}" oninput="window.updateLoanCalculatorPreview()" style="width:100%; cursor:pointer; accent-color:var(--neon-cyan)">
            <div style="display:flex; justify-content:space-between; font-size:0.65rem; color:var(--text-muted); margin-top:0.25rem">
              <span>Afl. 100</span>
              <span>Afl. ${tierDetails.limit / 2}</span>
              <span>Afl. ${tierDetails.limit}</span>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem">
            <div>
              <label style="font-size:0.8rem; color:var(--text-muted); display:block; margin-bottom:0.4rem; font-weight:600">${dict['loan_select_term'] || "Plazo de Repago"}:</label>
              <select class="select-input" id="loan-term-select" onchange="window.updateLoanCalculatorPreview()" style="width:100%">
                <option value="1">1 Mes</option>
                <option value="2">2 Meses</option>
                <option value="3" selected>3 Meses</option>
                <option value="6">6 Meses</option>
                <option value="12">12 Meses</option>
              </select>
            </div>
            <div>
              <label style="font-size:0.8rem; color:var(--text-muted); display:block; margin-bottom:0.4rem; font-weight:600">${dict['loan_purpose'] || "Propósito del Préstamo"}:</label>
              <select class="select-input" id="loan-purpose-select" onchange="window.updateLoanCalculatorPreview()" style="width:100%">
                <option value="business" selected>${dict['loan_purpose_business'] || "Capital de Trabajo / Negocio"}</option>
                <option value="education">${dict['loan_purpose_education'] || "Educación / Cursos"}</option>
                <option value="personal">${dict['loan_purpose_personal'] || "Gastos Personales / Emergencia"}</option>
                <option value="refinance">${dict['loan_purpose_refinance'] || "Refinanciar Deudas"}</option>
              </select>
            </div>
          </div>

          <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:12px; padding:1rem; display:flex; flex-direction:column; gap:0.6rem">
            <h4 style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-muted); margin:0">
              ${dict['loan_calc_preview'] || "Vista Previa de tu Crédito"}
            </h4>
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem">
              <span style="color:var(--text-muted)">${dict['loan_monthly_est'] || "Cuota Mensual Estimada"}:</span>
              <span id="loan-calc-est-payment" style="font-weight:bold; color:var(--neon-cyan); font-size:1.05rem">Afl. 0.00 AWG</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem">
              <span style="color:var(--text-muted)">${dict['loan_total_repayment'] || "Total a Repagar"}:</span>
              <span id="loan-calc-total-repay" style="font-weight:bold; color:var(--text-main)">Afl. 0.00 AWG</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem">
              <span style="color:var(--text-muted)">Tasa de Interés Aplicada:</span>
              <span id="loan-calc-apr" style="font-weight:bold; color:var(--neon-gold)">8% APR</span>
            </div>
          </div>

          <button type="submit" id="loan-submit-btn" class="btn btn-cyan btn-sm" style="width:100%; font-weight:bold; padding:0.6rem 1rem">
            ${dict['loan_submit_btn'] || "🚀 Solicitar Aprobación Instantánea"}
          </button>
        </form>
      </section>
    `;
  }

  const rightColHtml = `
    <div style="display:flex; flex-direction:column; gap:1.5rem">
      <section class="card gold-accent" style="padding:1.2rem">
        <h3 style="font-size:0.85rem; font-weight:800; color:var(--neon-gold); margin-bottom:0.75rem">
          🪙 Mi Billetera Sabí-Pay
        </h3>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem">
          <span style="font-size:0.75rem; color:var(--text-muted)">Saldo Disponible:</span>
          <span style="font-size:1.3rem; font-weight:800; color:var(--neon-gold)">Afl. ${appState.userWallet.toFixed(2)} AWG</span>
        </div>
        <div style="display:flex; gap:0.5rem">
          <button class="btn btn-xs btn-cyan" onclick="window.chargeUserWallet(100.00)" style="flex:1; font-size:0.68rem; padding:4px 8px; background:var(--neon-gold); border-color:var(--neon-gold); color:#000; font-weight:bold">
            ➕ Recargar
          </button>
          <button class="btn btn-xs" onclick="window.withdrawUserWallet()" style="flex:1; font-size:0.68rem; padding:4px 8px; background:rgba(0,245,212,0.1); border:1px solid var(--neon-cyan); color:var(--neon-cyan)">
            💸 Retirar
          </button>
        </div>
      </section>

      <section class="card gold-accent" style="padding:1.2rem">
        <h3 style="font-size:0.85rem; font-weight:800; color:var(--neon-gold); margin-bottom:0.75rem">
          🏦 ${dict['loan_pool_label'] || "Fondo Comun di Credito"}
        </h3>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem">
          <span style="font-size:0.75rem; color:var(--text-muted)">Capital Disponible:</span>
          <span style="font-size:1.15rem; font-weight:800; color:var(--neon-gold)">Afl. ${appState.lendingPool.toFixed(2)} AWG</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center">
          <span style="font-size:0.75rem; color:var(--text-muted)">${dict['loan_pool_earnings'] || "Interes Genera (Compuesto)"}:</span>
          <span style="font-size:1.0rem; font-weight:700; color:var(--neon-cyan)">Afl. ${appState.lendingEarnings.toFixed(2)} AWG</span>
        </div>
      </section>

      <section class="card cyan-accent" style="padding:1.2rem">
        <h3 style="font-size:0.85rem; font-weight:800; color:var(--neon-cyan); margin-bottom:0.75rem">
          📊 ${dict['loan_tier_label'] || "Nivel di Credito"}
        </h3>
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.8rem">
          <div>
            <div style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase">Nivel Actual</div>
            <div style="font-size:1.2rem; font-weight:800; color:var(--neon-cyan); margin-top:0.1rem">
              ${getCreditTierDetails(appState.creditTier).name}
            </div>
          </div>
          <div style="background:rgba(0,245,212,0.06); border:1.5px solid var(--neon-cyan); width:42px; height:42px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; color:var(--neon-cyan); font-size:0.85rem">
            T${appState.creditTier}
          </div>
        </div>
        <p style="color:var(--text-muted); font-size:0.7rem; margin:0 0 0.8rem 0; line-height:1.3">
          ${dict['loan_tier_desc'] || "Paga na tempo pa aumenta bo nivel y habri limitenan mas halto."}
        </p>

        <div style="display:flex; flex-direction:column; gap:0.4rem; font-size:0.7rem">
          <div style="display:flex; justify-content:space-between">
            <span style="color:var(--text-muted)">Límite de Crédito:</span>
            <span style="color:var(--text-main); font-weight:bold">Afl. ${getCreditTierDetails(appState.creditTier).limit} AWG</span>
          </div>
          <div style="display:flex; justify-content:space-between">
            <span style="color:var(--text-muted)">Descuento en APR:</span>
            <span style="color:var(--neon-emerald); font-weight:bold">-${(getCreditTierDetails(appState.creditTier).aprDiscount * 100).toFixed(1)}% APR</span>
          </div>
        </div>
      </section>

      <section class="card purple-accent" style="padding:1rem; font-size:0.75rem; line-height:1.4">
        <h4 style="font-size:0.8rem; font-weight:700; color:var(--text-main); margin:0 0 0.5rem 0; display:flex; align-items:center; gap:0.3rem">
          🤖 Sabí AI Advisor
        </h4>
        <div style="color:var(--text-muted)">
          Tus finanzas personales muestran una tasa de ahorro saludable. Un micropréstamo a corto plazo es ideal para financiar la compra de mercadería o capacitación sin comprometer tu liquidez diaria en Aruba.
        </div>
      </section>
    </div>
  `;  container.innerHTML = `
    <div style="margin-bottom:1.5rem">
      <h2 class="card-title" style="font-size:1.5rem; font-weight:800; margin-bottom:0.25rem">${dict['loan_title'] || "Sabí Crédito - Micropréstamos Instantáneos"}</h2>
      <p style="color:var(--text-muted); font-size:0.85rem">${dict['loan_subtitle'] || "Financiamiento rápido para emprendedores y proyectos personales en Aruba. Sin papeleo, aprobación al instante."}</p>
    </div>
    
    <div class="grid-2-1">
      ${leftColHtml}
      ${rightColHtml}
    </div>
  `;

  if (!activeLoan && !isUserSuspended()) {
    updateLoanCalculatorPreview();
  }
}

function updateLoanCalculatorPreview() {
  const amountSlider = document.getElementById("loan-amount-slider");
  const termSelect = document.getElementById("loan-term-select");
  if (!amountSlider || !termSelect) return;

  const amount = parseFloat(amountSlider.value);
  const term = parseInt(termSelect.value);
  
  const amountValEl = document.getElementById("loan-amount-val");
  if (amountValEl) {
    amountValEl.innerText = `Afl. ${amount.toFixed(0)} AWG`;
  }

  const purposeEl = document.getElementById("loan-purpose-select");
  const purpose = purposeEl ? purposeEl.value : 'business';
  
  let apr = 0.08;
  if (purpose === 'education') apr = 0.06;
  else if (purpose === 'personal') apr = 0.10;
  else if (purpose === 'refinance') apr = 0.09;

  // Apply credit tier discount
  const tierDetails = getCreditTierDetails(appState.creditTier);
  apr = Math.max(0.03, apr - tierDetails.aprDiscount);

  const monthlyRate = apr / 12;
  let monthlyPayment = 0;
  if (monthlyRate > 0) {
    monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);
  } else {
    monthlyPayment = amount / term;
  }

  const totalRepayment = monthlyPayment * term;

  const estPaymentEl = document.getElementById("loan-calc-est-payment");
  const totalRepayEl = document.getElementById("loan-calc-total-repay");
  const aprEl = document.getElementById("loan-calc-apr");

  if (estPaymentEl) estPaymentEl.innerText = `Afl. ${monthlyPayment.toFixed(2)} AWG`;
  if (totalRepayEl) totalRepayEl.innerText = `Afl. ${totalRepayment.toFixed(2)} AWG`;
  if (aprEl) aprEl.innerText = `${(apr * 100).toFixed(1)}% APR`;
}

function applyForMicroloan(event) {
  if (event) event.preventDefault();

  if (isUserSuspended()) {
    showToast("Cuenta Suspendida", "Tu cuenta está bloqueada temporalmente.");
    return;
  }

  const amountSlider = document.getElementById("loan-amount-slider");
  const termSelect = document.getElementById("loan-term-select");
  const purposeSelect = document.getElementById("loan-purpose-select");
  if (!amountSlider || !termSelect) return;

  const amount = parseFloat(amountSlider.value);
  const term = parseInt(termSelect.value);
  const purpose = purposeSelect ? purposeSelect.value : 'business';

  // Check if Lending Pool has enough capital
  if (appState.lendingPool < amount) {
    const lang = appState.language || 'es';
    const dict = SABI_TRANSLATIONS[lang];
    showToast("Fondo Insuficiente", dict['loan_error_pool_empty'] || "El Fondo Común no tiene suficiente capital para este préstamo.");
    return;
  }

  let apr = 0.08;
  if (purpose === 'education') apr = 0.06;
  else if (purpose === 'personal') apr = 0.10;
  else if (purpose === 'refinance') apr = 0.09;

  // Apply credit tier discount
  const tierDetails = getCreditTierDetails(appState.creditTier);
  apr = Math.max(0.03, apr - tierDetails.aprDiscount);

  const monthlyRate = apr / 12;
  const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);
  const totalRepayment = monthlyPayment * term;

  const submitBtn = document.getElementById("loan-submit-btn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span style="display:inline-block; width:1.1rem; height:1.1rem; border:2px solid rgba(255,255,255,0.2); border-top-color:var(--neon-cyan); border-radius:50%; animation: spin 1s linear infinite; vertical-align: middle; margin-right: 0.5rem;"></span> Procesando...`;
  }

  SoundEffects.playClick();

  setTimeout(() => {
    const newLoan = {
      id: `loan-${Date.now()}`,
      amount: amount,
      term: term,
      remainingTerm: term,
      apr: apr,
      monthlyPayment: monthlyPayment,
      totalRepayment: totalRepayment,
      remainingRepayment: totalRepayment,
      purpose: purpose,
      status: 'approved',
      date: new Date().toISOString()
    };

    appState.activeLoan = newLoan;
    localStorage.setItem('sabi_active_loan', JSON.stringify(newLoan));

    // Deduct loan principal from pool
    appState.lendingPool -= amount;
    localStorage.setItem('sabi_lending_pool', appState.lendingPool.toString());

    appState.userWallet += amount;
    localStorage.setItem('sabi_user_wallet', appState.userWallet.toString());

    SoundEffects.playJingle();

    const lang = appState.language || 'es';
    const dict = SABI_TRANSLATIONS[lang];
    showToast("Préstamo Aprobado", dict['loan_success_msg'] || "¡Micropréstamo aprobado y transferido!");

    renderCredito();
  }, 1500);
}

function payLoanInstallment(payFull = false, onTime = true) {
  if (!appState.activeLoan) return;

  const lang = appState.language || 'es';
  const dict = SABI_TRANSLATIONS[lang];

  const loan = appState.activeLoan;
  const amountToPay = payFull ? loan.remainingRepayment : Math.min(loan.monthlyPayment, loan.remainingRepayment);

  if (appState.userWallet < amountToPay) {
    showToast("Fondos Insuficientes", dict['loan_error_insufficient'] || "No tienes saldo suficiente en tu billetera.");
    return;
  }

  appState.userWallet -= amountToPay;
  localStorage.setItem('sabi_user_wallet', appState.userWallet.toString());

  // Refund pool
  appState.lendingPool += amountToPay;

  // Calculate interest component of the paid amount
  const interestRatio = (loan.totalRepayment - loan.amount) / loan.totalRepayment;
  const interestPaid = amountToPay * interestRatio;
  
  if (onTime) {
    // Add interest to community earnings
    appState.lendingEarnings += interestPaid;
    localStorage.setItem('sabi_lending_earnings', appState.lendingEarnings.toString());
  } else {
    // Late payment: reset credit tier, set suspension lockout (2 minutes)
    appState.creditTier = 1;
    localStorage.setItem('sabi_credit_tier', appState.creditTier.toString());
    
    appState.loanSuspensionUntil = (Date.now() + 120000).toString();
    localStorage.setItem('sabi_loan_suspension_until', appState.loanSuspensionUntil);
    
    showToast("Plan Suspendido ⚠️", dict['loan_suspended_desc'] || "Bo plan di credito ta suspende pa motibo di pago tardi.", 5000);
  }

  localStorage.setItem('sabi_lending_pool', appState.lendingPool.toString());

  loan.remainingRepayment -= amountToPay;
  loan.remainingTerm = Math.max(0, loan.remainingTerm - 1);

  SoundEffects.playClick();

  if (loan.remainingRepayment <= 0.01 || payFull || loan.remainingTerm <= 0) {
    // Fully settled!
    appState.activeLoan = null;
    localStorage.removeItem('sabi_active_loan');
    
    if (onTime) {
      // Improve credit tier on successful full repayment
      appState.creditTier = Math.min(5, appState.creditTier + 1);
      localStorage.setItem('sabi_credit_tier', appState.creditTier.toString());
    }
    
    showToast("Crédito Liquidado", dict['loan_settled_msg'] || "Has liquidado por completo tu micropréstamo. ¡Felicidades!");
  } else {
    localStorage.setItem('sabi_active_loan', JSON.stringify(loan));
    if (onTime) {
      showToast("Pago Realizado", dict['loan_repaid_msg'] || "Pago de cuota realizado con éxito.");
    }
  }

  renderCredito();
}

function simulateApplicantRepayment(applicantId, amount, name) {
  setTimeout(() => {
    const index = appState.lendingQueue.findIndex(a => a.id === applicantId);
    if (index !== -1 && appState.lendingQueue[index].status === 'approved') {
      const interest = amount * 0.05;
      appState.lendingPool += amount + interest;
      appState.lendingEarnings += interest;
      appState.lendingQueue.splice(index, 1);
      
      localStorage.setItem('sabi_lending_pool', appState.lendingPool.toString());
      localStorage.setItem('sabi_lending_earnings', appState.lendingEarnings.toString());
      localStorage.setItem('sabi_lending_queue', JSON.stringify(appState.lendingQueue));
      
      showToast("Reembolso Recibido", `El emprendedor ${name} ha pagado su micropréstamo. +Afl. ${(amount + interest).toFixed(2)} AWG retornados al Fondo.`);
      SoundEffects.playJingle();
      
      if (appState.activeMainTab === 'servicios' && appState.activeServiceTab === 'calculadora') {
        renderCredito();
      }
    }
  }, 6000);
}

function approveNextLendingRequest(applicantId = null) {
  let applicant = null;
  if (applicantId) {
    applicant = appState.lendingQueue.find(a => a.id === applicantId && a.status === 'pending');
  } else {
    applicant = appState.lendingQueue.find(a => a.status === 'pending');
  }

  const lang = appState.language || 'es';
  const dict = SABI_TRANSLATIONS[lang];

  if (!applicant) {
    showToast("No hay pendientes", "No hay solicitudes pendientes en la fila.");
    return;
  }

  if (appState.lendingPool < applicant.amount) {
    showToast("Fondo Insuficiente", dict['loan_error_pool_empty'] || "El Fondo Común no tiene suficiente capital.");
    return;
  }

  // Fund request
  appState.lendingPool -= applicant.amount;
  applicant.status = 'approved';

  localStorage.setItem('sabi_lending_pool', appState.lendingPool.toString());
  localStorage.setItem('sabi_lending_queue', JSON.stringify(appState.lendingQueue));

  SoundEffects.playJingle();
  showToast("Préstamo Financiado", `Se ha financiado Afl. ${applicant.amount} AWG para ${applicant.name}.`);

  renderCredito();

  simulateApplicantRepayment(applicant.id, applicant.amount, applicant.name);
}

function simulateNewApplicant() {
  const names = ["Rigoberto Tromp", "Xiomara Kelly", "Geraldo Webb", "Mireya Peterson", "Efraim Croes", "Zaira Geerman"];
  const businesses = ["Chalo's Pastechi", "Kiki's Crafts", "Cadushi Juice Bar", "Aruba Tech Repairs", "Batik Boutique"];
  
  const randomName = names[Math.floor(Math.random() * names.length)];
  const randomBiz = businesses[Math.floor(Math.random() * businesses.length)];
  const randomAmount = 100 + Math.floor(Math.random() * 15) * 100;

  const newApplicant = {
    id: `app-${Date.now()}`,
    name: `${randomName} (${randomBiz})`,
    amount: randomAmount,
    status: 'pending',
    date: new Date().toISOString().split('T')[0]
  };

  appState.lendingQueue.push(newApplicant);
  localStorage.setItem('sabi_lending_queue', JSON.stringify(appState.lendingQueue));

  SoundEffects.playClick();
  showToast("Nuevo Solicitante", `Simulación: ${newApplicant.name} solicita Afl. ${randomAmount} AWG.`);

  renderCredito();
}

function skipLoanSuspension() {
  appState.loanSuspensionUntil = null;
  localStorage.removeItem('sabi_loan_suspension_until');
  SoundEffects.playJingle();
  showToast("Lockout Evadido ⏩", "Se ha levantado la suspensión temporal para pruebas.");
  renderCredito();
}

window.renderCredito = renderCredito;
window.updateLoanCalculatorPreview = updateLoanCalculatorPreview;
window.applyForMicroloan = applyForMicroloan;
window.payLoanInstallment = payLoanInstallment;
window.approveNextLendingRequest = approveNextLendingRequest;
window.simulateNewApplicant = simulateNewApplicant;
window.skipLoanSuspension = skipLoanSuspension;

// Expose all other global functions immediately on load
window.switchSportsHubTab = switchSportsHubTab;
window.switchSportsHubSport = switchSportsHubSport;
window.setBettingReminder = setBettingReminder;
window.toggleCustomImageUrlField = toggleCustomImageUrlField;
window.toggleCpcField = toggleCpcField;
window.switchComunidadTab = switchComunidadTab;
window.openCheckoutModal = openCheckoutModal;
window.closeCheckoutModal = closeCheckoutModal;
window.updateCheckoutFare = updateCheckoutFare;
window.processCheckoutPayment = processCheckoutPayment;
window.rejectDriverTrip = rejectDriverTrip;
window.acceptDriverTrip = acceptDriverTrip;
window.handleDriverRegister = handleDriverRegister;
window.simulateLicenseUpload = simulateLicenseUpload;
window.driverPickupPackage = driverPickupPackage;
window.openPhotoVerification = openPhotoVerification;
window.handleDriverActiveToggle = handleDriverActiveToggle;
window.approveDriver = approveDriver;
window.rejectDriver = rejectDriver;
window.simulateWeeklyPayout = simulateWeeklyPayout;
window.resetDriverSystemState = resetDriverSystemState;
window.handleDeliveryGpsShare = handleDeliveryGpsShare;
window.handleCustomDeliverySubmit = handleCustomDeliverySubmit;
window.clearCustomDeliveries = clearCustomDeliveries;
window.renderDeliveryRequestPortal = renderDeliveryRequestPortal;
window.switchAccountTab = switchAccountTab;
window.renderAccountModal = renderAccountModal;
window.closeAccountModal = closeAccountModal;
window.resetSubscriptionState = resetSubscriptionState;
window.switchPaywallMode = switchPaywallMode;
window.handlePaywallCheckout = handlePaywallCheckout;
window.handlePaywallRegister = handlePaywallRegister;
window.handlePaywallLoginSubmit = handlePaywallLoginSubmit;
window.chargeUserWallet = chargeUserWallet;
window.resetUserWallet = resetUserWallet;
window.withdrawUserWallet = withdrawUserWallet;
window.linkBankAccount = linkBankAccount;
window.switchCheckoutPaymentMethod = switchCheckoutPaymentMethod;
window.handleDriverRegisterSubmit = handleDriverRegisterSubmit;
window.toggleDriverActiveState = toggleDriverActiveState;
window.handleDriverAcceptTrip = handleDriverAcceptTrip;
window.handleDriverPickupPackage = handleDriverPickupPackage;
window.handleDriverCompleteTrip = handleDriverCompleteTrip;
window.handleUserProductUpload = handleUserProductUpload;
window.handleUserProductDelete = handleUserProductDelete;
window.changeTransportType = changeTransportType;
window.simulateDriverDistance = simulateDriverDistance;
window.simulateDriverInfraction = simulateDriverInfraction;
window.evaluateDriverPeriod = evaluateDriverPeriod;
window.switchLlegadasSubTab = switchLlegadasSubTab;
window.renderArrivalsTab = renderArrivalsTab;
window.renderLiveStreams = renderLiveStreams;
window.openLiveStream = openLiveStream;
window.closeLiveStream = closeLiveStream;
window.buyProductFromLive = buyProductFromLive;
window.openSellerLiveStudio = openSellerLiveStudio;
window.closeSellerLiveStudio = closeSellerLiveStudio;
window.startSellerLiveStream = startSellerLiveStream;
window.stopSellerLiveStream = stopSellerLiveStream;
window.updateCustomDeliveryPrice = updateCustomDeliveryPrice;
window.changeAppLanguage = changeAppLanguage;
window.changeAdCategory = changeAdCategory;
window.appState = appState;
window.switchMainTab = switchMainTab;
window.setupMainNavigation = setupMainNavigation;





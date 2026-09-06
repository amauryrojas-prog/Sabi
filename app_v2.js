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

// Global Application State
let appState = {
  activeMainTab: 'suerte',    // 'suerte', 'servicios', 'comunidad'
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
  driverInfo: null,
  adminEarnings: 0.00,
  pendingDrivers: [],
  activeTrip: null,
  activeLlegadasSubTab: 'vuelos'
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

// DOM Initialization
document.addEventListener("DOMContentLoaded", () => {
  // Load Subscription Status
  const subscribed = localStorage.getItem('sabi_subscribed');
  if (subscribed === 'true') {
    appState.sabiSubscribed = true;
    const overlay = document.getElementById("paywall-overlay");
    if (overlay) overlay.classList.remove("active");
  }

  // Load B2B Wallet & Marketplace Ads from Storage
  const wallet = localStorage.getItem('sabi_b2b_wallet');
  if (wallet !== null) {
    appState.b2bWallet = parseFloat(wallet);
  }
  document.getElementById("b2b-wallet-balance").innerText = `$${appState.b2bWallet.toFixed(2)} USD`;

  const clicks = localStorage.getItem('sabi_b2b_clicks');
  if (clicks !== null) {
    appState.b2bClicks = parseInt(clicks);
  }
  const impressions = localStorage.getItem('sabi_b2b_impressions');
  if (impressions !== null) {
    appState.b2bImpressions = parseInt(impressions);
  }
  updateB2BStatsDisplay();

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

  // Set default state
  switchMainTab('suerte');
  switchGame('lottodidia');
  switchLotteryTab('dashboard');
});

// Paywall Onboarding Controller
document.querySelectorAll(".plan-card").forEach(card => {
  card.addEventListener("click", (e) => {
    document.querySelectorAll(".plan-card").forEach(c => c.classList.remove("active"));
    const selected = e.currentTarget;
    selected.classList.add("active");
    appState.sabiPlan = selected.dataset.plan;
    
    const checkoutBtn = document.querySelector(".btn-checkout");
    if (appState.sabiPlan === 'lifetime') {
      checkoutBtn.innerText = "🚀 Comprar Acceso de por Vida ($99.99)";
    } else {
      const trialDays = appState.sabiPlan === 'annual' ? '14' : '7';
      checkoutBtn.innerText = `🚀 Comenzar Prueba Gratuita de ${trialDays} Días`;
    }
  });
});

function handlePaywallCheckout() {
  SoundEffects.playJingle();
  appState.sabiSubscribed = true;
  localStorage.setItem('sabi_subscribed', 'true');
  
  // Animate Paywall close
  const overlay = document.getElementById("paywall-overlay");
  overlay.style.transition = "opacity 0.5s ease";
  overlay.classList.remove("active");
  
  showToast("¡Suscripción Activada!", "Bienvenido a Sabí Premium. Todos los servicios e inteligencia ciudadana están desbloqueados.");
}

function resetSubscriptionState() {
  localStorage.removeItem('sabi_subscribed');
  appState.sabiSubscribed = false;
  closeAccountModal();
  document.getElementById("paywall-overlay").classList.add("active");
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
  profileBtn.addEventListener("click", () => {
    SoundEffects.playClick();
    document.getElementById("profile-subscription-plan").innerText = 
      appState.sabiPlan === 'lifetime' ? "Plan de por Vida - Pagado" : 
      appState.sabiPlan === 'annual' ? "Plan Anual - Próximo cobro: Simulado en 14 días" : "Plan Mensual - Próximo cobro: Simulado en 7 días";
    document.getElementById("account-modal").classList.add("active");
  });
}

function switchMainTab(tab) {
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

  // Mock Mini Mega (4 numbers from 1 to 30 + Mega Ball from 1 to 15, Tue/Fri draws)
  appState.gamesData['minimega'] = generateMockDraws('minimega', 3450, null);
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
      <div class="chart-label chart-label-ball"><div class="small-ball-inline">${i.toString().padStart(2, '0')}</div></div>
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
  const isTwoDigitGame = (appState.currentGame === 'lottodidia' || appState.currentGame === 'lotto5' || appState.currentGame === 'minimega');
  const formattedVal = isTwoDigitGame ? val.toString().padStart(2, '0') : val.toString();
  return `<div class="small-ball-inline ${classType}">${formattedVal}</div>`;
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
  const s = appState.stats;
  const pos = appState.positionActiveTab;
  const activeSource = appState.gamesData[appState.currentGame];
  const total = s.total;

  let posFreqs = Array(36).fill(0);
  let posSeen = Array(36).fill(total);

  activeSource.forEach((draw, index) => {
    let sorted = [...draw.numbers].sort((a,b) => a-b);
    let n = sorted[pos];
    if (n !== undefined) {
      posFreqs[n]++;
      if (posSeen[n] === total) posSeen[n] = index;
    }
  });

  let list = [];
  let limit = (appState.currentGame === 'lottodidia' || appState.currentGame === 'minimega') ? 30 : 35;
  for (let i = 1; i <= limit; i++) {
    list.push({ num: i, freq: posFreqs[i], overdue: posSeen[i] });
  }

  const hots = [...list].sort((a,b) => b.freq - a.freq).slice(0, 5);

  document.getElementById("pos-hot-list").innerHTML = hots.map(h => `
    <div class="pos-list-item" style="display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        ${formatBall(h.num)}
      </div>
      <span>${h.freq} veces</span>
    </div>
  `).join('');

  document.getElementById("pos-overdue-list").innerHTML = hots.map(h => {
    const partner = getBestPartner(appState.currentGame, pos, h.num);
    return `
      <div class="pos-list-item" style="display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          ${formatBall(partner.val)}
        </div>
        <span>(${partner.coFreq} veces)</span>
      </div>
    `;
  }).join('');
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
  for (let pos = 0; pos < digitCount; pos++) {
    const btn = document.createElement("button");
    btn.className = `zodiac-pos-btn ${activePos === pos ? 'active' : ''}`;
    btn.innerText = `Posición ${pos+1}`;
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
      <div class="chart-label chart-label-ball"><div class="small-ball-inline">${i}</div></div>
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

  renderZodiacPositionList();
}

function renderZodiacPositionList() {
  const s = appState.stats;
  let digitCount = appState.currentGame === 'landsloterie' ? 5 : 4;
  
  if (appState.zodiacListPositionActiveTab >= digitCount) {
    appState.zodiacListPositionActiveTab = 0;
  }
  const pos = appState.zodiacListPositionActiveTab;
  const activeSource = appState.gamesData[appState.currentGame];
  
  // Generate dynamic position buttons
  const listTabsWrapper = document.getElementById("zodiac-list-pos-controls");
  listTabsWrapper.innerHTML = "";
  for (let p = 0; p < digitCount; p++) {
    const btn = document.createElement("button");
    btn.className = `zodiac-pos-btn zodiac-list-pos-btn ${pos === p ? 'active' : ''}`;
    btn.innerText = `Pos ${p+1}`;
    btn.addEventListener("click", () => {
      appState.zodiacListPositionActiveTab = p;
      renderZodiacPositionList();
    });
    listTabsWrapper.appendChild(btn);
  }
  
  let freqs = s.posFrequencies[pos];
  let list = [];
  for (let i = 0; i <= 9; i++) {
    list.push({ val: i, freq: freqs[i] });
  }

  const hots = [...list].sort((a,b) => b.freq - a.freq).slice(0, 5);

  document.getElementById("zodiac-pos-hot-list").innerHTML = hots.map(h => `
    <div class="pos-list-item" style="display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        ${formatBall(h.val)}
      </div>
      <span>${h.freq} veces</span>
    </div>
  `).join('');

  document.getElementById("zodiac-pos-overdue-list").innerHTML = hots.map(h => {
    const partner = getBestPartner(appState.currentGame, pos, h.val);
    return `
      <div class="pos-list-item" style="display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          ${formatBall(partner.val)}
        </div>
        <span>(${partner.coFreq} veces)</span>
      </div>
    `;
  }).join('');
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

  const total = appState.filteredHistory.length;
  if (total === 0) {
    container.innerHTML = `<div style="padding:3rem; text-align:center; color:var(--text-muted)">No hay sorteos históricos que coincidan con la búsqueda.</div>`;
    document.getElementById("pag-info").innerText = "Pág. 0 de 0";
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

  // Render specific layout
  let html = "";
  if (appState.currentGame === 'lottodidia' || appState.currentGame === 'lotto5') {
    html = `
      <table class="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Sorteo</th>
            <th>Números Ganadores</th>
          </tr>
        </thead>
        <tbody>
          ${pageItems.map(draw => `
            <tr>
              <td>${formatDateDisplay(draw.date)}</td>
              <td>${draw.draw}</td>
              <td>
                <div style="display:flex; gap:0.4rem">
                  ${draw.numbers.map(n => `<div class="small-ball-inline">${n.toString().padStart(2,'0')}</div>`).join('')}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else if (appState.currentGame === 'zodiac') {
    html = `
      <table class="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Sorteo</th>
            <th>Turno</th>
            <th>Dígitos Ganadores</th>
            <th>Signo Zodiacal</th>
          </tr>
        </thead>
        <tbody>
          ${pageItems.map(draw => `
            <tr>
              <td>${formatDateDisplay(draw.date)}</td>
              <td>${draw.draw}</td>
              <td><span class="turno-badge-inline">${draw.drawType === 'Midday' ? 'Atardi' : 'Anochi'}</span></td>
              <td>
                <div style="display:flex; gap:0.4rem">
                  ${draw.numbers.map(n => `<div class="small-ball-inline">${n}</div>`).join('')}
                </div>
              </td>
              <td><span class="sign-badge-inline">${draw.sign}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else if (appState.currentGame === 'catochi') {
    html = `
      <table class="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Sorteo</th>
            <th>Turno</th>
            <th>1er Premio</th>
            <th>2do Premio</th>
            <th>3er Premio</th>
          </tr>
        </thead>
        <tbody>
          ${pageItems.map(draw => `
            <tr>
              <td>${formatDateDisplay(draw.date)}</td>
              <td>${draw.draw}</td>
              <td><span class="turno-badge-inline">${draw.drawType === 'Midday' ? 'Atardi' : 'Anochi'}</span></td>
              <td style="font-weight:800; color:var(--neon-cyan)">${draw.numbers[0].toString().padStart(4,'0')}</td>
              <td style="font-weight:700; color:var(--neon-gold)">${draw.numbers[1].toString().padStart(4,'0')}</td>
              <td style="font-weight:700; color:var(--text-muted)">${draw.numbers[2].toString().padStart(4,'0')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else if (appState.currentGame === 'big4') {
    html = `
      <table class="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Sorteo</th>
            <th>Turno</th>
            <th>Número Ganador</th>
          </tr>
        </thead>
        <tbody>
          ${pageItems.map(draw => `
            <tr>
              <td>${formatDateDisplay(draw.date)}</td>
              <td>${draw.draw}</td>
              <td><span class="turno-badge-inline">${draw.drawType === 'Midday' ? 'Atardi' : 'Anochi'}</span></td>
              <td style="font-weight:800; color:var(--neon-cyan)">${draw.numbers[0].toString().padStart(4,'0')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else if (appState.currentGame === 'landsloterie') {
    html = `
      <table class="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Sorteo</th>
            <th>Billete Ganador</th>
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
            <th>Fecha</th>
            <th>Sorteo</th>
            <th>Números Ganadores</th>
            <th>Mega Ball</th>
          </tr>
        </thead>
        <tbody>
          ${pageItems.map(draw => `
            <tr>
              <td>${formatDateDisplay(draw.date)}</td>
              <td>${draw.draw}</td>
              <td>
                <div style="display:flex; gap:0.4rem">
                  ${draw.numbers.map(n => `<div class="small-ball-inline">${n.toString().padStart(2,'0')}</div>`).join('')}
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
  document.getElementById("pag-info").innerText = `Pág. ${appState.historyPage} de ${pagesCount}`;
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

  container.innerHTML = SABI_DATA.emergencies.map(em => `
    <div class="emergency-card linear-service-card">
      <div class="service-logo-box">${em.icon}</div>
      <div class="service-title">${em.name}</div>
      <div class="service-desc">${em.subtitle}</div>
      <div class="service-phone">${em.phone}</div>
      <div class="service-buttons-row">
        <a href="tel:${em.phone}" class="btn-sm btn-cyan" onclick="SoundEffects.playClick()">📞 Llamar</a>
        <a href="${em.maps}" target="_blank" class="btn-sm btn-map">📍 Mapa</a>
      </div>
    </div>
  `).join('');
}

// Government directory renderer
function renderDirectory() {
  const container = document.getElementById("directory-container");
  if (!container) return;
  
  const query = document.getElementById("directory-search-input").value.toLowerCase().trim();
  
  let list = SABI_DATA.government;
  if (query !== "") {
    list = list.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.subtitle.toLowerCase().includes(query) || 
      item.desc.toLowerCase().includes(query)
    );
  }

  if (list.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1; padding:3rem; text-align:center; color:var(--text-muted)">No se encontraron dependencias oficiales que coincidan con la búsqueda.</div>`;
    return;
  }

  container.innerHTML = list.map(gov => `
    <div class="directory-card linear-service-card">
      <div class="service-logo-box">${gov.icon}</div>
      <div class="service-title">${gov.name}</div>
      <div class="service-desc">
        <div style="font-size:0.8rem; color:var(--neon-cyan); margin-bottom:0.25rem; font-weight:600">${gov.subtitle}</div>
        <div>${gov.desc}</div>
      </div>
      <div class="service-phone">${gov.phone}</div>
      <div class="service-buttons-row">
        <a href="tel:${gov.phone}" class="btn-sm btn-cyan" onclick="SoundEffects.playClick()">📞 Llamar</a>
        <a href="${gov.link}" target="_blank" class="btn-sm btn-profile">🌐 Web</a>
        <a href="${gov.maps}" target="_blank" class="btn-sm btn-map">📍 Mapa</a>
      </div>
    </div>
  `).join('');
}

function filterDirectory() {
  renderDirectory();
}

// Customs & Courier Calculator
function setupCustomsCalculator() {
  // Populate category dropdown
  const select = document.getElementById("calc-category");
  if (!select) return;

  select.innerHTML = SABI_DATA.customsTariffs.map(t => `
    <option value="${t.category}">${t.name} (Derecho: ${t.duty * 100}%)</option>
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

  // Render customs breakdown
  document.getElementById("calc-results-section").style.display = "block";
  document.getElementById("customs-breakdown-box").innerHTML = `
    <div class="summary-row">
      <span>Valor de Factura:</span>
      <span>$${valUSD.toFixed(2)} USD / Fl. ${valueAWG.toFixed(2)} AWG</span>
    </div>
    <div class="summary-row">
      <span>Valor CIF Declarado:</span>
      <span>Fl. ${cifAWG.toFixed(2)} AWG</span>
    </div>
    <div class="summary-row">
      <span>Derechos de Aduana (${dutyRate*100}%):</span>
      <span>Fl. ${dutyAWG.toFixed(2)} AWG</span>
    </div>
    <div class="summary-row">
      <span>Impuesto Fronterizo (7% BBO):</span>
      <span>Fl. ${borderTaxAWG.toFixed(2)} AWG</span>
    </div>
    <div class="summary-row">
      <span>Impuestos Totales a Pagar en Aduana:</span>
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
        labelVol = ` (Volumétrico: ${dimWt.toFixed(1)} lbs)`;
      }
    }

    let freightCostUSD = courier.baseFee + (billableWeight * courier.ratePerLb);
    let freightCostAWG = freightCostUSD * rateUSD_AWG;

    // Net Total (Courier charge + customs taxes)
    let netTotalAWG = freightCostAWG + totalTaxAWG;
    let netTotalUSD = netTotalAWG / rateUSD_AWG;

    courierResults.push({
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
        <span class="tag-courier">${res.days}</span>
      </td>
    </tr>
  `).join('');
}

function renderBoticasAndFuel() {
  const boticasCon = document.getElementById("boticas-container");
  if (boticasCon) {
    boticasCon.innerHTML = SABI_DATA.boticas.map(b => `
      <div class="league-box" style="margin-bottom:0.75rem">
        <div style="font-weight:700; color:var(--neon-cyan); margin-bottom:0.5rem">${b.week}</div>
        <div style="font-size:0.8rem; line-height:1.4">
          <div>📍 Noord: <strong>${b.boticaNoord}</strong></div>
          <div>📍 Oranjestad: <strong>${b.boticaPlay}</strong></div>
          <div>📍 San Nicolas: <strong>${b.boticaSn}</strong></div>
        </div>
      </div>
    `).join('');
  }

  const fuelCon = document.getElementById("fuel-container");
  if (fuelCon) {
    fuelCon.innerHTML = SABI_DATA.fuelPrices.map(f => `
      <div class="league-box" style="margin-bottom:0.5rem; display:flex; justify-content:space-between; align-items:center">
        <div>
          <div style="font-weight:700">${f.date}</div>
          <div style="font-size:0.75rem; color:var(--text-muted)">Ajuste mensual</div>
        </div>
        <div style="font-size:0.8rem; text-align:right">
          <div>Gasolina: <strong>Fl. ${f.gasoline}</strong></div>
          <div>Diesel: <strong>Fl. ${f.diesel}</strong></div>
          <div style="font-size:0.7rem; color:var(--neon-pink)">Cambio: ${f.change}</div>
        </div>
      </div>
    `).join('');
  }
}

// School Guide Finder & Cost Projections
function setupSchoolsSection() {
  // Bind level filter change
  document.getElementById("school-filter-level").addEventListener("change", renderSchoolsList);
  document.getElementById("school-filter-type").addEventListener("change", renderSchoolsList);
}

function setupDeportesSection() {
  // Las vistas deportivas se renderizan dinámicamente al navegar a la sección
}

function setupMarketplaceSection() {
  // Expose toggle fields globally
  window.toggleCustomImageUrlField = toggleCustomImageUrlField;
  window.toggleCpcField = toggleCpcField;

  // Expose new delivery functions globally
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

  // Expose new arrivals functions globally
  window.switchLlegadasSubTab = switchLlegadasSubTab;
  window.renderArrivalsTab = renderArrivalsTab;

  // Bind Comunidad Sub-Tabs event listeners
  document.querySelectorAll(".comunidad-tab-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const tab = e.currentTarget.dataset.comunidadTab;
      switchComunidadTab(tab);
    });
  });

  // Category select change listener for showing/hiding Sabi Delivery toggle
  const categorySelect = document.getElementById("ad-form-category");
  if (categorySelect) {
    categorySelect.addEventListener("change", () => {
      const deliveryToggleGroup = document.getElementById("ad-form-delivery-toggle-group");
      if (deliveryToggleGroup) {
        const physicalCats = ['vehiculos', 'ropa', 'electronica', 'joyeria', 'hogar'];
        deliveryToggleGroup.style.display = physicalCats.includes(categorySelect.value) ? 'flex' : 'none';
      }
    });
  }
}

function toggleCustomImageUrlField() {
  const preset = document.getElementById("ad-form-image-preset").value;
  const group = document.getElementById("ad-form-custom-image-url-group");
  if (group) {
    group.style.display = preset === "custom" ? "block" : "none";
  }
}

function toggleCpcField() {
  const sponsored = document.getElementById("ad-form-sponsored").value;
  const group = document.getElementById("ad-form-cpc-group");
  if (group) {
    group.style.display = sponsored === "sponsored" ? "block" : "none";
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
  const flights = data.flightsToday;
  
  // Calculate cruise passengers
  let cruisesToday = data.cruises.filter(c => c.date === "Hoy");
  let cruisesList = data.cruises;
  
  let paxToday = cruisesToday.reduce((sum, c) => sum + c.passengers, 0);
  let paxWeek = data.cruises.reduce((sum, c) => sum + c.passengers, 0);
  let paxMonth = paxWeek * 4.2; // monthly estimation
  
  let indexNoord = 0;
  let indexOranjestad = 0;
  let noordFactors = "";
  let oranjestadFactors = "";
  
  if (timeframe === "today") {
    indexNoord = Math.min(100, Math.round(occNoord * 0.95 + (flights.passengers / 10000) * 10));
    indexOranjestad = Math.min(100, Math.round(occOranjestad * 0.6 + (paxToday / 8000) * 40));
    
    noordFactors = `Hoy: Alta ocupación hotelera (${occNoord}%) y llegada de ${flights.passengers.toLocaleString()} pasajeros en ${flights.totalArrivals} vuelos comerciales.`;
    oranjestadFactors = `Hoy: ${cruisesToday.length} cruceros en puerto con ~${paxToday.toLocaleString()} pasajeros estimulando el comercio en Oranjestad.`;
  } else if (timeframe === "week") {
    indexNoord = Math.min(100, Math.round(occNoord * 1.0));
    indexOranjestad = Math.min(100, Math.round(occOranjestad * 0.7 + (paxWeek / 15000) * 30));
    
    noordFactors = `Esta Semana: Ocupación promedio del ${occNoord}% proyectada por el turismo playero en Noord.`;
    oranjestadFactors = `Esta Semana: ${cruisesList.length} barcos programados con ~${paxWeek.toLocaleString()} pasajeros estimulando el centro histórico.`;
  } else if (timeframe === "month") {
    indexNoord = Math.min(100, Math.round(occNoord * 0.98));
    indexOranjestad = Math.min(100, Math.round(occOranjestad * 0.75 + (paxMonth / 60000) * 25));
    
    noordFactors = `Este Mes: Proyección de turismo estable con ocupación hotelera estimada en ${occNoord}%.`;
    oranjestadFactors = `Este Mes: Tránsito de cruceros estimado en ~${Math.round(paxMonth).toLocaleString()} pasajeros en total para el mes.`;
  }
  
  // Set badges
  const getLevelLabel = (val) => {
    if (val >= 85) return { text: "Muy Alto 🔥", color: "var(--neon-emerald)" };
    if (val >= 70) return { text: "Alto 📈", color: "var(--neon-cyan)" };
    if (val >= 50) return { text: "Moderado ⚖️", color: "var(--neon-gold)" };
    return { text: "Bajo 📉", color: "var(--neon-pink)" };
  };
  
  const noordLvl = getLevelLabel(indexNoord);
  const oranjestadLvl = getLevelLabel(indexOranjestad);
  
  // Noord Elements
  const noordLvlEl = document.getElementById("comercio-noord-level");
  if (noordLvlEl) {
    noordLvlEl.innerText = noordLvl.text;
    noordLvlEl.style.color = noordLvl.color;
  }
  
  const noordProgEl = document.getElementById("comercio-noord-progress");
  if (noordProgEl) {
    noordProgEl.innerHTML = `<div style="width:${indexNoord}%; height:100%; background:linear-gradient(90deg, var(--purple-main), ${noordLvl.color}); transition:width 0.5s ease"></div>`;
  }
  
  const noordFactEl = document.getElementById("comercio-noord-factors");
  if (noordFactEl) {
    noordFactEl.innerText = noordFactors;
  }
  
  // Oranjestad Elements
  const oranjestadLvlEl = document.getElementById("comercio-oranjestad-level");
  if (oranjestadLvlEl) {
    oranjestadLvlEl.innerText = oranjestadLvl.text;
    oranjestadLvlEl.style.color = oranjestadLvl.color;
  }
  
  const oranjestadProgEl = document.getElementById("comercio-oranjestad-progress");
  if (oranjestadProgEl) {
    oranjestadProgEl.innerHTML = `<div style="width:${indexOranjestad}%; height:100%; background:linear-gradient(90deg, var(--purple-main), ${oranjestadLvl.color}); transition:width 0.5s ease"></div>`;
  }
  
  const oranjestadFactEl = document.getElementById("comercio-oranjestad-factors");
  if (oranjestadFactEl) {
    oranjestadFactEl.innerText = oranjestadFactors;
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
            <div style="font-size:0.75rem; color:var(--text-muted)">Pasajeros: ${c.passengers.toLocaleString()} | Hora: ${c.time}</div>
          </div>
          <div style="font-size:0.8rem; font-weight:800; color:${isToday ? 'var(--neon-gold)' : 'var(--text-muted)'}">
            ${c.date}
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
  
  const flightsEl = document.getElementById("comercio-stat-flights");
  if (flightsEl) {
    flightsEl.innerText = `${flights.totalArrivals} vuelos (${flights.passengers.toLocaleString()} pax)`;
  }
}

function renderSchoolsList() {
  const container = document.getElementById("schools-container");
  if (!container) return;

  const lvl = document.getElementById("school-filter-level").value;
  const type = document.getElementById("school-filter-type").value;

  let list = SABI_DATA.schools;
  if (lvl !== 'all') list = list.filter(s => s.level === lvl);
  if (type !== 'all') list = list.filter(s => s.type === type);

  if (list.length === 0) {
    container.innerHTML = `<div style="padding:2rem; text-align:center; color:var(--text-muted)">No se encontraron escuelas que coincidan con los filtros.</div>`;
    return;
  }

  container.innerHTML = list.map(school => `
    <div class="school-card" onclick="simulateSchoolCost('${school.id}')">
      <div class="school-info-primary">
        <div class="school-name">${school.name}</div>
        <div class="school-metadata">
          Idioma: <strong>${school.lang}</strong> | Nivel: <span style="text-transform:capitalize">${school.level}</span>
        </div>
      </div>
      <div>
        <span class="school-type-badge ${school.type.toLowerCase()}">${school.type}</span>
      </div>
    </div>
  `).join('');
}

function simulateSchoolCost(id) {
  const school = SABI_DATA.schools.find(s => s.id === id);
  if (!school) return;

  SoundEffects.playClick();
  
  // Highlight active
  document.querySelectorAll(".school-card").forEach(card => {
    const name = card.querySelector(".school-name").innerText;
    card.classList.toggle("active", name === school.name);
  });

  const cardBody = document.getElementById("school-calculator-body");
  const total = school.feeSchoolgeld + school.feeEnroll + school.uniformCost + school.committee + school.supplies;
  
  cardBody.innerHTML = `
    <div class="customs-summary-box" style="margin-bottom:0">
      <h3 style="font-weight:800; font-size:1.15rem; color:var(--neon-cyan); margin-bottom:0.75rem">${school.name}</h3>
      <div class="summary-row">
        <span>Schoolgeld (Cargo Anual Gobierno):</span>
        <span>Fl. ${school.feeSchoolgeld.toFixed(2)} AWG</span>
      </div>
      <div class="summary-row">
        <span>Matrícula de Inscripción:</span>
        <span>Fl. ${school.feeEnroll.toFixed(2)} AWG</span>
      </div>
      <div class="summary-row">
        <span>Uniformes Escolares (Proyección):</span>
        <span>Fl. ${school.uniformCost.toFixed(2)} AWG</span>
      </div>
      <div class="summary-row">
        <span>Oudercommissie (Comité de Padres):</span>
        <span>Fl. ${school.committee.toFixed(2)} AWG</span>
      </div>
      <div class="summary-row">
        <span>Útiles Escolares &amp; Libros:</span>
        <span>Fl. ${school.supplies.toFixed(2)} AWG</span>
      </div>
      <div class="summary-row" style="margin-top:0.75rem; border-top:1.5px solid var(--neon-cyan)">
        <span>Presupuesto Inicial Total Estimado:</span>
        <span>Fl. ${total.toFixed(2)} AWG</span>
      </div>
    </div>
    
    <div style="display:flex; gap:0.5rem; margin-top:1rem">
      <a href="tel:${school.phone}" class="btn btn-sm btn-cyan" style="text-align:center" onclick="SoundEffects.playClick()">📞 Llamar Escuela</a>
      <a href="${school.maps}" target="_blank" class="btn btn-sm" style="text-align:center; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border)">📍 Ubicar en Mapa</a>
    </div>
  `;
}

// Sports & Facilities Reservation contact links
function renderSportsContent() {
  const clubsCon = document.getElementById("sports-clubs-container");
  if (clubsCon) {
    clubsCon.innerHTML = SABI_DATA.sports.clubs.map(c => `
      <div class="sports-card linear-service-card">
        <div class="service-logo-box">${c.icon}</div>
        <div class="service-title">${c.name}</div>
        <div class="service-desc">
          <div>Disciplina: <strong>${c.discipline}</strong></div>
          <div>Público: <strong>${c.target}</strong></div>
        </div>
        <div class="service-phone">${c.contact}</div>
        <div class="service-buttons-row">
          <a href="tel:${c.contact}" class="btn-sm btn-cyan" onclick="SoundEffects.playClick()">📞 Inscribirse</a>
          <a href="${c.maps}" target="_blank" class="btn-sm btn-map">📍 Mapa</a>
        </div>
      </div>
    `).join('');
  }

  const facilitiesCon = document.getElementById("sports-facilities-container");
  if (facilitiesCon) {
    facilitiesCon.innerHTML = SABI_DATA.sports.facilities.map(f => `
      <div class="sports-card linear-service-card">
        <div class="service-logo-box">${f.icon}</div>
        <div class="service-title">${f.name}</div>
        <div class="service-desc">
          <div>Ubicación: <strong>${f.location}</strong></div>
          <div>Canchas: <strong>${f.type}</strong></div>
        </div>
        <div class="service-phone">${f.contact}</div>
        <div class="service-buttons-row">
          <a href="tel:${f.contact}" class="btn-sm btn-cyan" onclick="SoundEffects.playClick()">📞 Reservar</a>
          <a href="${f.maps}" target="_blank" class="btn-sm btn-map">📍 Mapa</a>
        </div>
      </div>
    `).join('');
  }

  const trailsCon = document.getElementById("sports-trails-container");
  if (trailsCon) {
    trailsCon.innerHTML = SABI_DATA.sports.trails.map(t => `
      <div class="league-box" style="margin-bottom:0.75rem">
        <div style="font-weight:700; color:var(--neon-cyan)">🚴 ${t.name}</div>
        <div style="font-size:0.8rem; color:var(--neon-gold); margin-top:0.15rem">Dificultad: ${t.difficulty} | Longitud: ${t.length}</div>
        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.35rem; line-height:1.4">${t.desc}</div>
      </div>
    `).join('');
  }
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

  if (list.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1; padding:3rem; text-align:center; color:var(--text-muted)">No se encontraron anuncios clasificados.</div>`;
    return;
  }

  container.innerHTML = list.map(ad => {
    let isSpon = ad.sponsored && appState.b2bWallet > 0;
    let badgeHtml = isSpon ? `<span class="market-sponsored-badge">Patrocinado</span>` : "";
    let priceLabel = ad.category === 'trabajo' ? "Salario: Fl. " : "Precio: Fl. ";
    
    // Default images depending on category
    let defaultImg = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80"; // shop
    if (ad.category === 'trabajo') defaultImg = "https://images.unsplash.com/photo-1521737711867-e3b904737d88?auto=format&fit=crop&w=400&q=80";
    else if (ad.category === 'alquileres') defaultImg = "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=400&q=80";
    else if (ad.category === 'vehiculos') defaultImg = "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80";
    else if (ad.category === 'ropa') defaultImg = "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80";
    else if (ad.category === 'electronica') defaultImg = "https://images.unsplash.com/photo-1468436139062-f60a71c5c892?auto=format&fit=crop&w=400&q=80";
    else if (ad.category === 'joyeria') defaultImg = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=400&q=80";
    else if (ad.category === 'hogar') defaultImg = "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80";
    
    let adImg = ad.image || defaultImg;
    
    const physicalCats = ['vehiculos', 'ropa', 'electronica', 'joyeria', 'hogar'];
    
    return `
      <div class="market-card ${isSpon ? 'sponsored' : ''}" onclick="handleAdClick('${ad.id}')">
        ${badgeHtml}
        <img src="${adImg}" alt="${ad.title}" class="market-card-img" onerror="this.src='${defaultImg}'">
        <div class="market-card-body">
          <div class="market-card-title">${ad.title}</div>
          <div class="market-card-price">${priceLabel}${ad.price.toLocaleString()} AWG</div>
          <div class="market-card-desc">${ad.desc}</div>
          ${physicalCats.includes(ad.category) && ad.deliveryEnabled ? `
            <button class="btn btn-sm btn-cyan btn-full" style="margin-top: 0.75rem; background: var(--neon-cyan); color: #000; font-weight: bold;" onclick="event.stopPropagation(); window.openCheckoutModal('${ad.id}');">
              🛒 Comprar con Sabí-Delivery
            </button>
          ` : ''}
        </div>
        <div class="market-card-footer">
          <span>Por: <strong>${ad.user}</strong></span>
          <a href="tel:${ad.contact}" class="btn btn-sm btn-cyan" style="max-width:100px; padding:0.25rem 0.5rem" onclick="event.stopPropagation(); SoundEffects.playClick(); handleAdClick('${ad.id}');">📞 Contactar</a>
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
}

// ==================== SABI-DELIVERY DISPATCH, DRIVER PORTAL & ADMIN PANEL ====================

// Comunidad sub-navigation switcher
function switchComunidadTab(tab) {
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
    renderDriverPortal();
  } else if (tab === 'admin') {
    renderAdminDashboard();
  }
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
          Únete a la flota de delivery más rápida de Aruba. Gana el 85% de cada tarifa de viaje que realices.
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
              <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.5rem">Ganancias netas acumuladas del 85% de tus envíos realizados.</p>
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
            <h2 class="card-title">Métricas de Rendimiento</h2>
            <div style="display:flex; flex-direction:column; gap:0.75rem; font-size:0.85rem">
              <div style="display:flex; justify-content:space-between; border-bottom:1.5px solid var(--glass-border); padding-bottom:0.5rem">
                <span style="color:var(--text-muted)">Viajes Completados:</span>
                <span style="font-weight:800; color:var(--text-main)" id="driver-stat-trips-completed">0</span>
              </div>
              <div style="display:flex; justify-content:space-between; border-bottom:1.5px solid var(--glass-border); padding-bottom:0.5rem">
                <span style="color:var(--text-muted)">Calificación:</span>
                <span style="font-weight:800; color:var(--neon-gold)">⭐️ 5.00</span>
              </div>
              <div style="display:flex; justify-content:space-between">
                <span style="color:var(--text-muted)">Tasa de Aceptación:</span>
                <span style="font-weight:800; color:var(--neon-cyan)">100%</span>
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
          <span style="color:var(--text-muted)">Pago del Viaje (85%):</span>
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
  
  updateCheckoutFare();
  
  document.getElementById("checkout-delivery-modal").classList.add("active");
}

function closeCheckoutModal() {
  SoundEffects.playClick();
  document.getElementById("checkout-delivery-modal").classList.remove("active");
}

function updateCheckoutFare() {
  const pickup = document.getElementById("checkout-pickup-district").value;
  const dropoff = document.getElementById("checkout-delivery-district").value;
  const adId = document.getElementById("checkout-ad-id").value;
  const ad = appState.marketplaceAds.find(a => a.id === adId);
  if (!ad) return;
  
  const fare = calculateDeliveryFare(pickup, dropoff);
  const total = ad.price + fare;
  
  document.getElementById("checkout-shipping-cost").innerText = `Afl. ${fare.toFixed(2)}`;
  document.getElementById("checkout-total-amount").innerText = `Afl. ${total.toFixed(2)}`;
}

// District Tariff Algorithm
function calculateDeliveryFare(pickup, dropoff) {
  if (pickup === dropoff) {
    return 7.00; // base fare
  }
  
  // Borders adjacency map
  const neighbors = {
    "Noord": ["Oranjestad"],
    "Oranjestad": ["Noord", "Santa Cruz", "Savaneta"],
    "Santa Cruz": ["Oranjestad", "Savaneta", "San Nicolas"],
    "Savaneta": ["Oranjestad", "Santa Cruz", "San Nicolas"],
    "San Nicolas": ["Savaneta", "Santa Cruz"]
  };
  
  if (neighbors[pickup] && neighbors[pickup].includes(dropoff)) {
    return 11.00;
  }
  
  // Long distance
  if ((pickup === "Noord" && dropoff === "San Nicolas") || (pickup === "San Nicolas" && dropoff === "Noord")) {
    return 22.00;
  }
  
  // Other combinations
  return 15.00;
}

// Payment & Dispatch process
function processCheckoutPayment() {
  const adId = document.getElementById("checkout-ad-id").value;
  const ad = appState.marketplaceAds.find(a => a.id === adId);
  if (!ad) return;
  
  const pickup = document.getElementById("checkout-pickup-district").value;
  const dropoff = document.getElementById("checkout-delivery-district").value;
  const fare = calculateDeliveryFare(pickup, dropoff);
  const total = ad.price + fare;
  
  // Close modal
  document.getElementById("checkout-delivery-modal").classList.remove("active");
  
  // Create active trip state
  appState.activeTrip = {
    adId: ad.id,
    itemTitle: ad.title,
    itemPrice: ad.price,
    pickupDistrict: pickup,
    deliveryDistrict: dropoff,
    totalFare: fare,
    driverEarnings: fare * 0.85,
    platformCommission: fare * 0.15,
    status: 'dispatched'
  };
  
  localStorage.setItem('sabi_active_trip', JSON.stringify(appState.activeTrip));
  
  SoundEffects.playJingle();
  showToast("Pago en Custodia", `Se han retenido Afl. ${total.toFixed(2)} AWG en Garantía. Buscando repartidores activos...`);
  
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
  
  showToast("Viaje Asignado", "Dirígete al punto de recogida. Monitorea tu ubicación en el mapa GPS.");
  
  // Force navigate to driver portal
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
  
  showToast("¡Entrega Exitosa!", `Envío completado. Recibes Afl. ${trip.driverEarnings.toFixed(2)} (85%) en tu billetera Sabí.`);
  
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
        
        return `
          <div style="background:rgba(255,255,255,0.015); border:1px solid var(--glass-border); padding:1rem; border-radius:14px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-weight:800; font-size:1.05rem; color:var(--text-main)">✈️ ${item.flightNo}</div>
              <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.15rem">${item.airline} | Origen: <strong>${item.origin}</strong></div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:800; color:var(--neon-gold); font-size:0.95rem">${item.time}</div>
              <span class="turno-badge-inline" style="background:rgba(0,0,0,0.3); border-color: ${statusColor}; color: ${statusColor}; font-size:0.7rem; padding:2px 8px; margin-top:0.25rem; display:inline-block">${item.status}</span>
              <div style="font-size:0.7rem; color:var(--text-muted); margin-top:0.15rem">${item.terminal}</div>
            </div>
          </div>
        `;
      }).join('');
    } else if (period === 'weekly') {
      container.innerHTML = dataList.map(item => `
        <div style="background:rgba(255,255,255,0.015); border:1px solid var(--glass-border); padding:1rem; border-radius:14px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-size:0.8rem; color:var(--neon-cyan); font-weight:700; text-transform:uppercase">${item.day}</div>
            <div style="font-weight:800; font-size:1.05rem; color:var(--text-main); margin-top:0.15rem">✈️ ${item.flightNo}</div>
            <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.15rem">${item.airline} | Origen: <strong>${item.origin}</strong></div>
          </div>
          <div style="text-align:right">
            <div style="font-weight:800; color:var(--neon-gold); font-size:0.95rem">${item.time}</div>
            <span class="turno-badge-inline" style="background:rgba(0,0,0,0.3); border-color: var(--neon-cyan); color: var(--neon-cyan); font-size:0.7rem; padding:2px 8px; margin-top:0.25rem; display:inline-block">${item.status}</span>
          </div>
        </div>
      `).join('');
    } else if (period === 'monthly') {
      container.innerHTML = dataList.map(item => `
        <div style="background:rgba(255,255,255,0.015); border:1px solid var(--glass-border); padding:1.2rem; border-radius:14px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem">
            <span style="font-size:0.8rem; color:var(--neon-gold); font-weight:800; text-transform:uppercase">${item.period}</span>
            <span class="turno-badge-inline" style="font-size:0.75rem">${item.totalWeekly}</span>
          </div>
          <div style="font-weight:800; font-size:1.1rem; color:var(--text-main)">${item.flightNo}</div>
          <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.25rem">Líneas principales: ${item.airline}</div>
          <div style="font-size:0.8rem; color:var(--text-muted);">Origen: ${item.origin} | Ocupación promedio: <strong style="color:var(--neon-cyan)">${item.avgLoad}</strong></div>
        </div>
      `).join('');
    }
  } else if (subTab === 'cruceros') {
    if (period === 'today') {
      container.innerHTML = dataList.map(item => `
        <div style="background:rgba(255,255,255,0.015); border:1px solid var(--glass-border); padding:1rem; border-radius:14px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:800; font-size:1.05rem; color:var(--text-main)">🚢 ${item.ship}</div>
            <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.15rem">${item.cruiseLine} | Capacidad: <strong>${item.passengers.toLocaleString()} pax</strong></div>
          </div>
          <div style="text-align:right">
            <div style="font-weight:800; color:var(--neon-gold); font-size:0.95rem">${item.time}</div>
            <span class="turno-badge-inline" style="background:rgba(0,0,0,0.3); border-color: var(--neon-cyan); color: var(--neon-cyan); font-size:0.7rem; padding:2px 8px; margin-top:0.25rem; display:inline-block">${item.status}</span>
            <div style="font-size:0.7rem; color:var(--text-muted); margin-top:0.15rem">${item.port}</div>
          </div>
        </div>
      `).join('');
    } else if (period === 'weekly') {
      container.innerHTML = dataList.map(item => {
        let statusColor = "var(--neon-cyan)";
        if (item.status === 'Expected') statusColor = "var(--neon-gold)";
        else if (item.status === 'Completed') statusColor = "rgba(255,255,255,0.3)";
        
        return `
          <div style="background:rgba(255,255,255,0.015); border:1px solid var(--glass-border); padding:1rem; border-radius:14px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:0.8rem; color:var(--neon-cyan); font-weight:700; text-transform:uppercase">${item.day}</div>
              <div style="font-weight:800; font-size:1.05rem; color:var(--text-main); margin-top:0.15rem">🚢 ${item.ship}</div>
              <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.15rem">${item.cruiseLine} | Capacidad: <strong>${item.passengers.toLocaleString()} pax</strong></div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:800; color:var(--neon-gold); font-size:0.95rem">${item.time}</div>
              <span class="turno-badge-inline" style="background:rgba(0,0,0,0.3); border-color: ${statusColor}; color: ${statusColor}; font-size:0.7rem; padding:2px 8px; margin-top:0.25rem; display:inline-block">${item.status}</span>
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
          <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.25rem">Líneas en tránsito: ${item.cruiseLine}</div>
          <div style="font-size:0.8rem; color:var(--text-muted);">Pasajeros estimables: <strong style="color:var(--text-main)">${item.passengers.toLocaleString()} pax</strong> | Estancia: ${item.avgStay}</div>
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
  
  if (subTab === 'vuelos') {
    if (period === 'today') {
      statsCard.innerHTML = `
        <h2 class="card-title" style="color:var(--neon-gold)">Aeropuerto Reina Beatrix</h2>
        <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-top:1rem">Pasajeros Estimados Hoy</div>
        <div style="font-size:2.4rem; font-weight:800; color:var(--neon-gold); margin-top:0.25rem">5,600 <span style="font-size:1.1rem; font-weight:400; color:var(--text-muted)">PAX</span></div>
        
        <div style="background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); padding:1rem; border-radius:12px; font-size:0.85rem; margin-top:1.25rem">
          <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem">
            <span style="color:var(--text-muted)">Vuelos Arribando:</span>
            <span style="font-weight:700">8 Vuelos</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem">
            <span style="color:var(--text-muted)">Mercado de EE.UU.:</span>
            <span style="font-weight:700; color:var(--neon-cyan)">78% de cuota</span>
          </div>
          <div style="display:flex; justify-content:space-between">
            <span style="color:var(--text-muted)">Hora Pico de Flujo:</span>
            <span style="font-weight:700">12:00 PM - 03:00 PM</span>
          </div>
        </div>
      `;
      
      infoCard.innerHTML = `
        <h2 class="card-title">Consejos para Operadores y Taxis</h2>
        <p style="font-size:0.85rem; color:var(--text-muted); line-height:1.5; margin-bottom:1rem">
          Se espera un alto flujo de pasajeros provenientes de EE.UU. entre las 12:00 PM y las 3:00 PM. Se recomienda a los taxistas posicionarse en la terminal norte.
        </p>
        <div style="background:rgba(0, 245, 212, 0.08); border:1px dashed var(--neon-cyan); padding:0.85rem; border-radius:10px; font-size:0.75rem; color:var(--text-main)">
          💡 <strong>Exención Aduanera:</strong> Los viajeros pueden ingresar compras libres de impuestos personales por un valor máximo de hasta Afl. 400.00.
        </div>
      `;
    } else if (period === 'weekly') {
      statsCard.innerHTML = `
        <h2 class="card-title" style="color:var(--neon-gold)">Proyección Semanal</h2>
        <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-top:1rem">Vuelos de la Semana</div>
        <div style="font-size:2.4rem; font-weight:800; color:var(--neon-gold); margin-top:0.25rem">182 <span style="font-size:1.1rem; font-weight:400; color:var(--text-muted)">Arribos</span></div>
        
        <div style="background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); padding:1rem; border-radius:12px; font-size:0.85rem; margin-top:1.25rem">
          <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem">
            <span style="color:var(--text-muted)">Pax Estimados:</span>
            <span style="font-weight:700">36,400 turistas</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem">
            <span style="color:var(--text-muted)">Día de Mayor Flujo:</span>
            <span style="font-weight:700; color:var(--neon-cyan)">Sábado (32 vuelos)</span>
          </div>
          <div style="display:flex; justify-content:space-between">
            <span style="color:var(--text-muted)">Origen Principal:</span>
            <span style="font-weight:700">Miami / JFK</span>
          </div>
        </div>
      `;
      
      infoCard.innerHTML = `
        <h2 class="card-title">Planificación Turística</h2>
        <p style="font-size:0.85rem; color:var(--text-muted); line-height:1.5; margin-bottom:1rem">
          El fin de semana (especialmente el sábado) registra el 35% del volumen semanal de arribos. Agencias de rentas de autos y transfers deben reforzar su flota en el aeropuerto.
        </p>
        <div style="background:rgba(0, 245, 212, 0.08); border:1px dashed var(--neon-cyan); padding:0.85rem; border-radius:10px; font-size:0.75rem; color:var(--text-main)">
          ✈️ <strong>Terminal de EE.UU.:</strong> El pre-despacho de aduanas de EE.UU. (US Preclearance) opera regularmente desde las 8:00 AM.
        </div>
      `;
    } else if (period === 'monthly') {
      statsCard.innerHTML = `
        <h2 class="card-title" style="color:var(--neon-gold)">Estimado Mensual (Junio)</h2>
        <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-top:1rem">Total Pasajeros del Mes</div>
        <div style="font-size:2.2rem; font-weight:800; color:var(--neon-gold); margin-top:0.25rem">156,000 <span style="font-size:1.1rem; font-weight:400; color:var(--text-muted)">Pax</span></div>
        
        <div style="background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); padding:1rem; border-radius:12px; font-size:0.85rem; margin-top:1.25rem">
          <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem">
            <span style="color:var(--text-muted)">Vuelos Entrantes:</span>
            <span style="font-weight:700">780 vuelos</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem">
            <span style="color:var(--text-muted)">Ocupación Hotelera:</span>
            <span style="font-weight:700; color:var(--neon-cyan)">89% Noord / 78% Play</span>
          </div>
          <div style="display:flex; justify-content:space-between">
            <span style="color:var(--text-muted)">Aerolínea Líder:</span>
            <span style="font-weight:700">American Airlines</span>
          </div>
        </div>
      `;
      
      infoCard.innerHTML = `
        <h2 class="card-title">Métricas de Ocupación</h2>
        <p style="font-size:0.85rem; color:var(--text-muted); line-height:1.5; margin-bottom:1rem">
          La afluencia hotelera del mes se concentra fuertemente en el distrito de Noord (Palm Beach y Eagle Beach), impulsando el consumo nocturno en restaurantes de esa franja.
        </p>
      `;
    }
  } else if (subTab === 'cruceros') {
    if (period === 'today') {
      statsCard.innerHTML = `
        <h2 class="card-title" style="color:var(--neon-cyan)">Puerto de Oranjestad</h2>
        <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-top:1rem">Cruceristas en Puerto Hoy</div>
        <div style="font-size:2.4rem; font-weight:800; color:var(--neon-cyan); margin-top:0.25rem">5,600 <span style="font-size:1.1rem; font-weight:400; color:var(--text-muted)">Pax</span></div>
        
        <div style="background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); padding:1rem; border-radius:12px; font-size:0.85rem; margin-top:1.25rem">
          <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem">
            <span style="color:var(--text-muted)">Barcos en Puerto:</span>
            <span style="font-weight:700">2 Cruceros</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem">
            <span style="color:var(--text-muted)">Inyección Económica:</span>
            <span style="font-weight:700; color:var(--neon-gold)">Est. $672,000 USD</span>
          </div>
          <div style="display:flex; justify-content:space-between">
            <span style="color:var(--text-muted)">Gasto Promedio/Pax:</span>
            <span style="font-weight:700">$120.00 USD</span>
          </div>
        </div>
      `;
      
      infoCard.innerHTML = `
        <h2 class="card-title">Consejos para Comercios locales</h2>
        <p style="font-size:0.85rem; color:var(--text-muted); line-height:1.5; margin-bottom:1rem">
          El tránsito de peatones en la zona centro de Oranjestad estará sumamente activo entre las 9:00 AM y las 3:00 PM. Tiendas en L.G. Smith Blvd y Main Street verán una gran demanda.
        </p>
        <div style="background:rgba(255, 224, 0, 0.08); border:1px dashed var(--neon-gold); padding:0.85rem; border-radius:10px; font-size:0.75rem; color:var(--text-main)">
          🛍️ <strong>Comercio local:</strong> Los cruceristas buscan principalmente joyería fina, artesanías locales y productos de Aloe Vera de Aruba.
        </div>
      `;
    } else if (period === 'weekly') {
      statsCard.innerHTML = `
        <h2 class="card-title" style="color:var(--neon-cyan)">Puerto: Itinerario Semanal</h2>
        <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-top:1rem">Cruceristas de la Semana</div>
        <div style="font-size:2.4rem; font-weight:800; color:var(--neon-cyan); margin-top:0.25rem">15,070 <span style="font-size:1.1rem; font-weight:400; color:var(--text-muted)">Pax</span></div>
        
        <div style="background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); padding:1rem; border-radius:12px; font-size:0.85rem; margin-top:1.25rem">
          <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem">
            <span style="color:var(--text-muted)">Cruceros Programados:</span>
            <span style="font-weight:700">5 Cruceros</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem">
            <span style="color:var(--text-muted)">Impacto Financiero:</span>
            <span style="font-weight:700; color:var(--neon-gold)">Est. $1.8M AWG</span>
          </div>
          <div style="display:flex; justify-content:space-between">
            <span style="color:var(--text-muted)">Barco Más Grande:</span>
            <span style="font-weight:700">Disney Fantasy (4,000 pax)</span>
          </div>
        </div>
      `;
      
      infoCard.innerHTML = `
        <h2 class="card-title">Logística de Puerto</h2>
        <p style="font-size:0.85rem; color:var(--text-muted); line-height:1.5; margin-bottom:1rem">
          El viernes se espera el mayor volumen de turistas simultáneos por el Disney Fantasy. Tour operadores en Oranjestad deben prever autobuses suficientes para excursiones a las ruinas de oro y playas del norte.
        </p>
      `;
    } else if (period === 'monthly') {
      statsCard.innerHTML = `
        <h2 class="card-title" style="color:var(--neon-cyan)">Puerto: Proyección Mensual</h2>
        <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-top:1rem">Total Turistas por Puerto</div>
        <div style="font-size:2.2rem; font-weight:800; color:var(--neon-cyan); margin-top:0.25rem">67,290 <span style="font-size:1.1rem; font-weight:400; color:var(--text-muted)">Pax</span></div>
        
        <div style="background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); padding:1rem; border-radius:12px; font-size:0.85rem; margin-top:1.25rem">
          <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem">
            <span style="color:var(--text-muted)">Total Barcos del Mes:</span>
            <span style="font-weight:700">22 barcos</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem">
            <span style="color:var(--text-muted)">Impacto Económico Directo:</span>
            <span style="font-weight:700; color:var(--neon-gold)">Est. $8.1M AWG</span>
          </div>
          <div style="display:flex; justify-content:space-between">
            <span style="color:var(--text-muted)">Línea Más Frecuente:</span>
            <span style="font-weight:700">Royal Caribbean Group</span>
          </div>
        </div>
      `;
      
      infoCard.innerHTML = `
        <h2 class="card-title">Impacto en el PIB Comercial</h2>
        <p style="font-size:0.85rem; color:var(--text-muted); line-height:1.5; margin-bottom:1rem">
          El turismo de cruceros representa aproximadamente el 22% de la inyección directa al comercio minorista de la isla. Las estadísticas del mes indican un repunte en el gasto en restaurantes locales y boutiques tradicionales de la capital.
        </p>
      `;
    }
  }
}

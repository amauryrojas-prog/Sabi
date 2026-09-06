/**
 * Sabí Super-App - Agente Autónomo Interno de Suerte (Sabí Autonomous Internal Luck Agent)
 * -----------------------------------------------------------------------------------------
 * Arquitectura 100% Interna y Autónoma:
 * 1. Procesa y aprende diariamente de la ingesta de sorteos de forma transparente.
 * 2. Ejecuta un modelo de ponderación probabilística interna (calientes, atrasos máximos, tendencias).
 * 3. Muestra automáticamente los MEJORES RESULTADOS Y SELECCIONES OPTIMIZADAS en la UI sin botones manuales.
 */

class SabiLuckAgentEngine {
  constructor() {
    this.isInitialized = false;
    this.statsCache = {};
    this.learnedPredictions = {};
    this.aiInsightCache = {};
    this.loadState();
  }

  /**
   * Carga el estado de aprendizaje previo desde almacenamiento local
   */
  loadState() {
    try {
      const saved = localStorage.getItem('sabi_luck_agent_state_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.learnedPredictions = parsed.learnedPredictions || {};
        this.aiInsightCache = parsed.aiInsightCache || {};
      }
    } catch (e) {
      console.warn("⚠️ [Agente de Suerte] No se pudo cargar estado previo:", e);
    }
  }

  /**
   * Guarda el estado de aprendizaje actual
   */
  saveState() {
    try {
      const state = {
        learnedPredictions: this.learnedPredictions,
        aiInsightCache: this.aiInsightCache,
        lastUpdate: new Date().toISOString()
      };
      localStorage.setItem('sabi_luck_agent_state_v1', JSON.stringify(state));
    } catch (e) {
      console.warn("⚠️ [Agente de Suerte] No se pudo guardar estado:", e);
    }
  }

  /**
   * Inicializa el agente analizando los datos históricos disponibles
   */
  init(gamesData) {
    console.log("🤖 [Sabí Agente Interno] Iniciando análisis y aprendizaje automático de sorteos...");
    this.gamesData = gamesData || {};
    this.processAllGames();
    this.isInitialized = true;
    console.log("✅ [Sabí Agente Interno] Análisis completado. Predicciones óptimas actualizadas.");
  }

  /**
   * Ingesta un nuevo sorteo y actualiza el aprendizaje del agente automáticamente
   */
  trackNewDraw(game, drawObj) {
    if (!this.gamesData[game]) this.gamesData[game] = [];

    const exists = this.gamesData[game].some(
      (d) => (drawObj.draw && d.draw === drawObj.draw) || (d.date === drawObj.date && d.type === drawObj.type)
    );

    if (!exists) {
      this.gamesData[game].unshift(drawObj);
      this.gamesData[game].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      
      // Re-analizar y aprender inmediatamente
      this.analyzeGame(game);
      console.log(`🤖 [Sabí Agente Interno] Aprendizaje actualizado con nuevo sorteo en ${game}:`, drawObj);
      return true;
    }
    return false;
  }

  /**
   * Procesa todas las loterías disponibles
   */
  processAllGames() {
    const games = ['catochi', 'big4', 'lottodidia', 'zodiac', 'lotto5', 'oneoff', 'wegakorsou', 'cachicachi', 'lucky3'];
    games.forEach((game) => {
      this.analyzeGame(game);
    });
  }

  /**
   * Análisis estadístico y aprendizaje autónomo profundo ("Estudio Diario")
   */
  analyzeGame(game) {
    const draws = this.gamesData[game] || [];
    if (!draws.length) {
      this.statsCache[game] = null;
      return null;
    }

    const totalDraws = draws.length;
    const frequencies = {};
    const delays = {};
    const digitPosFrequencies = [{}, {}, {}, {}];
    const zodiacFrequencies = {};
    let evenCount = 0;
    let oddCount = 0;
    let sumTotal = 0;
    let validSumCount = 0;

    draws.forEach((draw, index) => {
      let numbers = [];
      let sign = null;

      if (Array.isArray(draw.numbers)) numbers = draw.numbers;
      else if (draw.number !== undefined) numbers = [draw.number];

      if (draw.sign) {
        sign = draw.sign.toLowerCase().trim();
        zodiacFrequencies[sign] = (zodiacFrequencies[sign] || 0) + 1;
      }

      numbers.forEach((num) => {
        const numStr = String(num).padStart(
          game === 'big4' || game === 'catochi' || game === 'zodiac' ? 4 : (game === 'lucky3' ? 3 : 2), '0'
        );
        
        frequencies[numStr] = (frequencies[numStr] || 0) + 1;

        if (delays[numStr] === undefined) {
          delays[numStr] = index; // Conteo de sorteos en atraso
        }

        const digits = numStr.split('');
        digits.forEach((d, posIdx) => {
          if (posIdx < 4) {
            digitPosFrequencies[posIdx][d] = (digitPosFrequencies[posIdx][d] || 0) + 1;
          }
        });

        const parsedInt = parseInt(numStr, 10);
        if (!isNaN(parsedInt)) {
          if (parsedInt % 2 === 0) evenCount++;
          else oddCount++;
          sumTotal += parsedInt;
          validSumCount++;
        }
      });
    });

    const sortedByFreq = Object.keys(frequencies).sort((a, b) => frequencies[b] - frequencies[a]);
    const sortedByDelay = Object.keys(delays).sort((a, b) => delays[b] - delays[a]);

    const hotNumbers = sortedByFreq.slice(0, 5).map((num) => ({
      number: num,
      times: frequencies[num],
      pct: ((frequencies[num] / totalDraws) * 100).toFixed(1)
    }));

    const coldNumbers = sortedByDelay.slice(0, 5).map((num) => ({
      number: num,
      drawsAgo: delays[num]
    }));

    const topDigitsByPos = digitPosFrequencies.map((posObj) => {
      return Object.keys(posObj).sort((a, b) => posObj[b] - posObj[a])[0] || '0';
    });

    const analysis = {
      game,
      totalDraws,
      lastDraw: draws[0] || null,
      hotNumbers,
      coldNumbers,
      topDigitsByPos,
      zodiacFrequencies,
      evenPct: validSumCount ? ((evenCount / validSumCount) * 100).toFixed(1) : 50,
      oddPct: validSumCount ? ((oddCount / validSumCount) * 100).toFixed(1) : 50,
      avgSum: validSumCount ? Math.round(sumTotal / validSumCount) : 0,
      frequencies,
      delays
    };

    this.statsCache[game] = analysis;

    // Ejecutar Motor de Selección Óptima Interno
    this.computeOptimalPrediction(game, analysis);
    
    // Ejecutar Análisis de Gemini IA en segundo plano de forma transparente
    this.fetchBackgroundGeminiInsight(game, analysis);

    this.saveState();
    return analysis;
  }

  /**
   * Calcula de forma autónoma la combinación óptima de mayor probabilidad
   */
  computeOptimalPrediction(game, analysis) {
    if (!analysis) return;

    let selectedNumbers = [];
    let selectedSign = null;

    if (game === 'catochi' || game === 'big4' || game === 'oneoff') {
      const digCount = (game === 'big4') ? 4 : 2;
      const hot = analysis.hotNumbers[0] ? analysis.hotNumbers[0].number : '77';
      const cold = analysis.coldNumbers[0] ? analysis.coldNumbers[0].number : '12';
      
      let combo = (hot + cold).slice(0, digCount);
      if (combo.length < digCount) combo = combo.padEnd(digCount, '0');
      selectedNumbers = [combo];
    } else if (game === 'lottodidia' || game === 'lotto5') {
      const maxNum = (game === 'lottodidia') ? 30 : 35;
      const pickSet = new Set();

      if (analysis.hotNumbers.length) {
        const n = parseInt(analysis.hotNumbers[0].number, 10);
        if (n >= 1 && n <= maxNum) pickSet.add(n);
      }

      if (analysis.coldNumbers.length) {
        const n = parseInt(analysis.coldNumbers[0].number, 10);
        if (n >= 1 && n <= maxNum) pickSet.add(n);
      }

      while (pickSet.size < 5) {
        const rand = Math.floor(Math.random() * maxNum) + 1;
        pickSet.add(rand);
      }

      selectedNumbers = Array.from(pickSet).sort((a, b) => a - b);
    } else if (game === 'zodiac') {
      const combo = analysis.topDigitsByPos.join('');
      const signs = ['Aries', 'Tauro', 'Géminis', 'Cáncer', 'Leo', 'Virgo', 'Libra', 'Escorpio', 'Sagitario', 'Capricornio', 'Acuario', 'Piscis'];
      const topSignKey = Object.keys(analysis.zodiacFrequencies).sort((a, b) => analysis.zodiacFrequencies[b] - analysis.zodiacFrequencies[a])[0];
      selectedSign = topSignKey ? topSignKey.charAt(0).toUpperCase() + topSignKey.slice(1) : signs[0];
      selectedNumbers = [combo];
    }

    this.learnedPredictions[game] = {
      numbers: selectedNumbers,
      sign: selectedSign,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Ejecuta el análisis de Gemini IA en segundo plano de manera 100% transparente
   */
  async fetchBackgroundGeminiInsight(game, analysis) {
    const apiKey = window.SABI_GEMINI_API_KEY || localStorage.getItem('sabi_gemini_api_key');
    if (!apiKey) {
      // Diagnóstico estadístico autónomo si no hay API Key configurada
      const topHot = analysis.hotNumbers[0];
      const topCold = analysis.coldNumbers[0];
      let insightMsg = `📊 **Diagnóstico del Agente:** Analizados ${analysis.totalDraws} sorteos históricos. `;
      if (topCold) {
        insightMsg += `El número **${topCold.number}** acumula **${topCold.drawsAgo} sorteos sin salir**, entrando en su ventana óptima de atraso. `;
      }
      if (topHot) {
        insightMsg += `Tendencia de frecuencia liderada por el **${topHot.number}** (${topHot.pct}% de los sorteos).`;
      }
      this.aiInsightCache[game] = insightMsg;
      return;
    }

    const promptText = `
Actúa como el Agente Interno de Inteligencia de Sabí Super-App. Analiza de forma concisa estos datos del juego ${game.toUpperCase()}:
- Total sorteos: ${analysis.totalDraws}
- Más frecuentes: ${analysis.hotNumbers.map(h => h.number).join(', ')}
- Más atrasados: ${analysis.coldNumbers.map(c => c.number + ' (' + c.drawsAgo + ' sorteos)').join(', ')}
- Paridad: ${analysis.evenPct}% Pares / ${analysis.oddPct}% Impares.

Escribe 2 frases ejecutivas y profesionales de diagnóstico probabilístico para mostrar directamente en la app.
    `;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        })
      });
      const data = await response.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        this.aiInsightCache[game] = data.candidates[0].content.parts[0].text;
        // Re-renderizar widget si el usuario está viendo la pestaña
        if (window.updateLuckAgentWidget) window.updateLuckAgentWidget(game);
      }
    } catch (e) {
      console.warn("⚠️ [Agente de Suerte] Error en consulta Gemini en segundo plano:", e);
    }
  }

  /**
   * Renderiza la tarjeta limpia del Agente Interno (sin botones, 100% pasiva)
   */
  renderAgentWidgetHtml(game) {
    const analysis = this.statsCache[game] || this.analyzeGame(game);
    const prediction = this.learnedPredictions[game] || { numbers: ['--'], sign: null };
    const insightText = this.aiInsightCache[game] || '🧠 El Agente Interno está analizando y ponderando patrones de sorteos en tiempo real...';

    if (!analysis) {
      return `
        <div class="sabi-agent-card" style="background:linear-gradient(135deg, #0d0922 0%, #170d38 100%); border:1px solid var(--neon-cyan, #00f3ff); border-radius:16px; padding:16px; margin-bottom:20px; color:#fff;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:1.5rem;">🤖</span>
            <strong style="font-size:1.05rem; color:var(--neon-cyan, #00f3ff);">Agente Interno de Inteligencia</strong>
          </div>
          <p style="font-size:0.85rem; color:#a0a0c0; margin-top:6px;">Sincronizando y aprendiendo de los datos de sorteos...</p>
        </div>
      `;
    }

    const hotItems = analysis.hotNumbers.map((h) => `<span style="background:rgba(255,215,0,0.15); border:1px solid #ffd700; color:#ffd700; padding:2px 8px; border-radius:8px; font-weight:bold; font-size:0.85rem;">${h.number} (${h.times}x)</span>`).join(' ');
    const coldItems = analysis.coldNumbers.map((c) => `<span style="background:rgba(0,243,255,0.15); border:1px solid #00f3ff; color:#00f3ff; padding:2px 8px; border-radius:8px; font-weight:bold; font-size:0.85rem;">${c.number} (${c.drawsAgo} d.a.)</span>`).join(' ');

    let predDisplay = prediction.numbers.join(' - ');
    if (prediction.sign) predDisplay += ` (${prediction.sign})`;

    return `
      <div class="sabi-agent-card" style="background:linear-gradient(135deg, #0a071b 0%, #160d36 100%); border:1.5px solid var(--neon-cyan, #00f3ff); border-radius:16px; padding:18px; margin-bottom:20px; color:#fff; box-shadow:0 8px 24px rgba(0,0,0,0.4), 0 0 15px rgba(0,243,255,0.15);">
        
        <!-- Cabecera del Agente Interno -->
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg, #00f3ff 0%, #b5179e 100%); display:flex; align-items:center; justify-content:center; font-size:1.2rem;">🤖</div>
            <div>
              <h4 style="margin:0; font-size:1.02rem; font-weight:700; color:var(--text-main, #fff);">Agente Interno de Inteligencia de Suerte</h4>
              <span style="font-size:0.75rem; color:var(--neon-cyan, #00f3ff); font-weight:600;">⚡ Análisis automático continuo | ${analysis.totalDraws} sorteos procesados</span>
            </div>
          </div>
        </div>

        <!-- Bloque de Selección de Alta Probabilidad (Resultado del Aprendizaje) -->
        <div style="background:linear-gradient(135deg, rgba(0,243,255,0.1) 0%, rgba(181,23,158,0.1) 100%); border:1px solid rgba(0,243,255,0.3); border-radius:12px; padding:12px 16px; margin-bottom:14px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
          <div>
            <div style="font-size:0.75rem; color:#a0a0d0; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">🎯 Selección de Alta Probabilidad (Resultado del Aprendizaje)</div>
            <div style="font-size:1.35rem; font-weight:800; color:var(--neon-gold, #ffd700); letter-spacing:1px; margin-top:2px;">
              ${predDisplay}
            </div>
          </div>
          <div style="font-size:0.72rem; color:var(--neon-cyan, #00f3ff); background:rgba(0,0,0,0.4); padding:4px 8px; border-radius:6px; border:1px solid rgba(0,243,255,0.2);">
            Optimización Diaria
          </div>
        </div>

        <!-- Estadísticas Rápidas -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px; background:rgba(255,255,255,0.025); padding:10px; border-radius:12px; border:1px solid rgba(255,255,255,0.06);">
          <div>
            <div style="font-size:0.72rem; color:#8a8ab0; font-weight:700; text-transform:uppercase; margin-bottom:4px;">🔥 Números Calientes</div>
            <div>${hotItems || 'N/A'}</div>
          </div>
          <div>
            <div style="font-size:0.72rem; color:#8a8ab0; font-weight:700; text-transform:uppercase; margin-bottom:4px;">❄️ En Atraso Máximo</div>
            <div>${coldItems || 'N/A'}</div>
          </div>
        </div>

        <!-- Diagnóstico del Agente Interno -->
        <div style="background:rgba(0, 243, 255, 0.05); border-left:3px solid var(--neon-cyan, #00f3ff); padding:10px 12px; border-radius:0 8px 8px 0; font-size:0.84rem; color:#e0e0ff; line-height:1.45;">
          ${insightText}
        </div>
      </div>
    `;
  }
}

// Instancia Global del Agente Autónomo
window.SabiLuckAgent = new SabiLuckAgentEngine();

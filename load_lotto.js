// Load lottodidia data from Supabase into appState
(async function() {
  const { data, error } = await supabaseClient
    .from('lottery_draws')
    .select('*')
    .eq('game', 'lottodidia')
    .order('draw_date', { ascending: false })
    .limit(5000);

  if (error) {
    console.error('[load_lotto] Error:', error);
    return;
  }

  console.log('[load_lotto] Fetched ' + data.length + ' rows for lottodidia');

  appState.gamesData['lottodidia'] = data.map(d => ({
    date: d.draw_date,
    drawType: d.draw_type || 'Evening',
    draw: d.draw_number,
    numbers: Array.isArray(d.numbers)
      ? d.numbers.map(Number)
      : String(d.numbers || '').split('-').map(Number)
  }));

  appState.filteredHistory = [...appState.gamesData['lottodidia']];
  appState.currentGame = 'lottodidia';

  console.log('[load_lotto] gamesData[lottodidia] = ' + appState.gamesData['lottodidia'].length + ' items');

  // Trigger UI update
  if (appState.activeMainTab === 'suerte') {
    switchLotteryTab('history');
  }
})();

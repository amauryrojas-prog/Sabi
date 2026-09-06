import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const apiKeySports = Deno.env.get("API_KEY_SPORTS") ?? ""; // API key for api-sports.io
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log("⚡ Fetching live sports scores...");

    // Query api-sports.io for live matches
    // For demonstration, let's query the football live fixtures
    const targetUrl = "https://v3.football.api-sports.io/fixtures?live=all";
    const response = await fetch(targetUrl, {
      headers: {
        "x-rapidapi-key": apiKeySports,
        "x-rapidapi-host": "v3.football.api-sports.io"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to load sports API: ${response.statusText}`);
    }

    const result = await response.json();
    const fixtures = result.response || [];
    let updatedCount = 0;

    for (const item of fixtures) {
      const fixtureId = item.fixture.id;
      const leagueName = item.league.name;
      const homeTeam = item.teams.home.name;
      const awayTeam = item.teams.away.name;
      const homeScore = item.goals.home ?? 0;
      const awayScore = item.goals.away ?? 0;
      const minute = item.fixture.status.elapsed ?? 0;
      const statusRaw = item.fixture.status.short;

      let status = "scheduled";
      if (["1H", "2H", "HT", "ET", "P"].includes(statusRaw)) {
        status = "live";
      } else if (["FT", "AET", "PEN"].includes(statusRaw)) {
        status = "finished";
      }

      // Upsert into live_sports_matches
      // We will match based on home_team and away_team for simplicity, or use an ID mapping
      const { error } = await supabase
        .from("live_sports_matches")
        .upsert({
          sport: "futbol",
          league: leagueName,
          home_team: homeTeam,
          away_team: awayTeam,
          home_score: homeScore,
          away_score: awayScore,
          minute: minute,
          status: status,
          prediction_h2h: "H2H Analizado por IA", // Simple stub for predictive analytics
          odds_home: 1.95, // Decimal odds stubs (in production, fetch from /odds endpoint)
          odds_draw: 3.40,
          odds_away: 3.80,
          updated_at: new Date().toISOString()
        }, {
          onConflict: "home_team,away_team,sport"
        });

      if (!error) {
        updatedCount++;
      } else {
        console.error(`Error saving match ${homeTeam} vs ${awayTeam}:`, error.message);
      }
    }

    return new Response(JSON.stringify({ success: true, processed: fixtures.length, updated: updatedCount }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("❌ Sports API Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});

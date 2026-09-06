import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const weatherApiKey = Deno.env.get("WEATHER_API_KEY") ?? ""; // OpenWeatherMap API key
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log("⚡ Fetching weather for Aruba...");

    // Query OpenWeatherMap API for Oranjestad, Aruba
    const targetUrl = `https://api.openweathermap.org/data/2.5/weather?q=Oranjestad,AW&appid=${weatherApiKey}&units=metric`;
    const response = await fetch(targetUrl);

    if (!response.ok) {
      throw new Error(`Failed to load weather API: ${response.statusText}`);
    }

    const data = await response.json();
    const temp = data.main.temp;
    const desc = data.weather[0].description;
    const humidity = data.main.humidity;
    const windSpeed = data.wind.speed;
    const icon = data.weather[0].icon;

    // Upsert weather data (always ID = 1)
    const { error } = await supabase
      .from("weather_data")
      .upsert({
        id: 1,
        temperature: temp,
        description: desc,
        humidity: humidity,
        wind_speed: windSpeed,
        icon: icon,
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return new Response(JSON.stringify({ success: true, temperature: temp, description: desc }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("❌ Weather API Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});

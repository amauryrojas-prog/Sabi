import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const flightApiKey = Deno.env.get("FLIGHT_API_KEY") ?? ""; // FlightAware API or similar
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log("⚡ Fetching flights for Aruba Airport (AUA)...");

    // Mock API query for demonstration purposes
    // In production, fetch from AeroDataBox or FlightAware API:
    // https://aerodatabox.p.rapidapi.com/flights/airports/iata/AUA/departures
    const mockFlights = [
      { flight_number: "AA 1024", airline: "American Airlines", origin: "Miami (MIA)", scheduled_time: "12:15:00", estimated_time: "12:10:00", status: "landed", gate: "A4" },
      { flight_number: "DL 580", airline: "Delta Air Lines", origin: "Atlanta (ATL)", scheduled_time: "13:30:00", estimated_time: "13:45:00", status: "delayed", gate: "B2" },
      { flight_number: "UA 1452", airline: "United Airlines", origin: "New York (EWR)", scheduled_time: "14:10:00", estimated_time: "14:10:00", status: "scheduled", gate: "A6" },
      { flight_number: "B6 1824", airline: "JetBlue Airways", origin: "Boston (BOS)", scheduled_time: "15:00:00", estimated_time: "15:05:00", status: "scheduled", gate: "B5" },
    ];

    let insertedCount = 0;

    for (const flight of mockFlights) {
      // Upsert flight details
      const { error } = await supabase
        .from("flight_arrivals")
        .upsert(flight, {
          onConflict: "flight_number,scheduled_time"
        });

      if (!error) {
        insertedCount++;
      } else {
        console.error(`Error saving flight ${flight.flight_number}:`, error.message);
      }
    }

    return new Response(JSON.stringify({ success: true, processed: mockFlights.length, inserted: insertedCount }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("❌ Flights API Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});

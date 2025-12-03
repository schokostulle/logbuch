// js/supabase.js
//
// Minimaler Verbindungspunkt zu Supabase
// Nutzt ES-Module und gibt eine einzige Instanz zurück

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Supabase Konfiguration
const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-KEY";

// Supabase Client erzeugen
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
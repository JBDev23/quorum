import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl) {
  throw new Error("Falta la variable de entorno EXPO_PUBLIC_SUPABASE_URL. Copia .env.example a .env y rellena los valores (ver README).");
}
if (!supabaseAnonKey) {
  throw new Error("Falta la variable de entorno EXPO_PUBLIC_SUPABASE_ANON_KEY. Copia .env.example a .env y rellena los valores (ver README).");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "pkce",
  },
});
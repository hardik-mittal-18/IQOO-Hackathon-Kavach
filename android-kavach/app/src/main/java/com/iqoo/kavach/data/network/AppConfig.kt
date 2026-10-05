package com.iqoo.kavach.data.network

import com.iqoo.kavach.BuildConfig

object AppConfig {
    const val supabaseUrl: String = BuildConfig.SUPABASE_URL
    const val supabaseAnonKey: String = BuildConfig.SUPABASE_ANON_KEY
    const val backendUrl: String = BuildConfig.BACKEND_URL

    val isValidSupabaseConfig: Boolean
        get() = supabaseUrl.isNotBlank() && supabaseAnonKey.isNotBlank() && supabaseUrl != "https://your-project.supabase.co"
}

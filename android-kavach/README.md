# Kavach Android Migration

This directory contains the Android native migration of the existing Kavach product while preserving the current Supabase auth flow and FastAPI backend contract.

## Project structure

- `app/` – Android app module
- `build.gradle.kts` – project-level Gradle configuration
- `settings.gradle.kts` – module registration
- `local.properties.example` – sample local Android + environment variables

## Required local configuration

Create a `local.properties` file in this folder with the actual values for your machine and Supabase project:

```properties
sdk.dir=/path/to/Android/Sdk
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
BACKEND_URL=http://10.0.2.2:8000
```

Note: `10.0.2.2` is the emulator host address for a backend running on the same machine as the Android emulator.

## Android build command

With JDK 17 and Android SDK Platform 34 installed, build the debug APK with:

```bash
cd android-kavach
gradlew.bat assembleDebug
```

On macOS or Linux, use `./gradlew assembleDebug` instead. The Gradle wrapper downloads Gradle 8.7 when first run.

## Existing app contract preserved

- Supabase authentication is retained for login and signup.
- FastAPI backend endpoints remain the source of truth for live scam analysis and Twilio integration.
- The app routes match the existing Kavach flow: landing -> login/signup -> dashboard -> protection.

## Local build status

The debug APK builds successfully in this workspace. The generated APK is at `app/build/outputs/apk/debug/app-debug.apk`. A local emulator or Android device is required to install and launch it.

# WhisperTranscriber Project Context

## Project Overview
WhisperTranscriber is a React Native mobile application that performs real-time audio transcription using OpenAI's Whisper AI model, optimized for Snapdragon processors (tested on S25 Ultra). The app integrates with messaging apps (WhatsApp, Telegram) to receive audio files and transcribe them automatically.

## Tech Stack
- **Frontend**: React Native 0.85.2 with TypeScript
- **UI Library**: React Native Paper (Material Design 3)
- **Native Audio Processing**: whisper.rn (Whisper.cpp wrapper)
- **Audio Conversion**: FFmpeg Kit React Native
- **File System**: React Native FS
- **Sharing Integration**: React Native Receive Sharing Intent
- **Build System**: Gradle with CMake for native code
- **Node Version**: >= 22.11.0

## Project Structure

```
WhisperTranscriber_backup/
├── App.tsx                          # Main React component with UI
├── useWhisperTranscriber.ts         # Custom hook for Whisper logic
├── app.json                         # App configuration
├── package.json                     # Dependencies & scripts
├── tsconfig.json                    # TypeScript config
├── index.js                         # Entry point
├── metro.config.js                  # Metro bundler config
├── jest.config.js                   # Jest testing config
├── react-native.config.js           # React Native config
├── Gemfile                          # Ruby dependencies for iOS
├── android/                         # Android native code
│   ├── app/
│   │   ├── build.gradle            # App-level gradle config
│   │   ├── CMakeLists.txt          # CMake config for JNI
│   │   └── src/main/
│   │       ├── AndroidManifest.xml # App manifest
│   │       ├── java/com/whispertranscriber/
│   │       │   ├── MainActivity.kt  # Main Activity
│   │       │   ├── MainApplication.kt # Application class
│   │       │   ├── WhisperModule.java # Native bridge module
│   │       │   └── WhisperPackage.java # Package configuration
│   │       ├── assets/
│   │       │   └── index.android.bundle
│   │       ├── jniLibs/            # Native libraries (ARM64, x86_64)
│   │       └── res/                # Android resources
│   ├── settings.gradle
│   ├── build.gradle
│   └── gradle.properties
├── libs_secure/
│   └── ffmpeg-kit-full.aar        # FFmpeg Kit library
└── patches/                        # Patch files for dependencies
    └── react-native-receive-sharing-intent+2.0.0.patch
```

## Key Dependencies

### Production Dependencies
- **react**: 19.2.3 - React framework
- **react-native**: 0.85.2 - React Native framework
- **whisper.rn**: ^0.5.5 - Whisper.cpp wrapper for mobile
- **ffmpeg-kit-react-native**: ^6.0.2 - Audio/video processing
- **react-native-paper**: ^5.15.1 - Material Design 3 UI components
- **react-native-fs**: ^2.20.0 - File system access
- **react-native-receive-sharing-intent**: ^2.0.0 - Intent handling for shared files
- **react-native-safe-area-context**: ^5.7.0 - Safe area support
- **react-native-vector-icons**: ^10.3.0 - Icon library

### Development Dependencies
- **TypeScript**: ^5.8.3
- **Jest**: ^29.6.3 - Testing framework
- **Babel**: ^7.25.2 - JavaScript transpiler
- **ESLint**: ^8.19.0 - Code linting
- **Patch Package**: ^8.0.1 - Local dependency patching
- **Sharp**: ^0.34.5 - Image processing
- **JIMP**: ^1.6.1 - JavaScript image manipulation

## Core Features

### 1. Main App Component (App.tsx)
- Dark-themed Material Design 3 UI with React Native Paper
- Displays model status (downloaded/downloading)
- Shows transcription output with progress
- System logs console
- Download button for Whisper Medium model (1.5GB)
- Responsive layout with ScrollView

**Key UI Elements:**
- Appbar header with app title
- Model status card showing download progress
- Transcription text area with delete functionality
- Debug logs section
- Action buttons (download model / ready indicator)

### 2. Custom Hook (useWhisperTranscriber.ts)
Manages the entire transcription workflow:

**State Management:**
```typescript
- status: 'IDLE' | 'DOWNLOADING' | 'CONVERTING' | 'TRANSCRIBING'
- isModelReady: boolean
- progress: number (0-1)
- transcription: string
- logs: string[]
```

**Core Functions:**
- `downloadModel()`: Downloads Whisper Medium model from HuggingFace
- `transcribe()`: Transcribes audio using the loaded model
- `convertToWav()`: Converts audio to 16kHz WAV using FFmpeg
- `requestPermissions()`: Handles Android permission requests
- Intent handling for WhatsApp/Telegram shared audio files

**Model Configuration:**
- Model: ggml-medium.bin (1.5GB)
- Location: DocumentDirectoryPath
- URL: HuggingFace ggerganov/whisper.cpp
- Min file size check: 1.4GB (corruption prevention)

### 3. Android Native Integration

**MainActivity.kt:**
- Standard React Native activity
- Component name: "WhisperTranscriber"
- Uses DefaultReactActivityDelegate

**WhisperModule.java:**
- React bridge module for native functionality
- Module name: "WhisperModule"
- `transcribe()` method: Takes modelPath and audioPath, returns transcription
- Bridge between JavaScript and native C++ code

**Build Configuration (build.gradle):**
- compileSdk: 34
- minSdkVersion: 24
- targetSdkVersion: 34
- JVM Target: 17
- Supported ABIs: arm64-v8a, x86_64
- NDK Version: 27.0.12077973
- Native build: CMake

## Audio Processing Pipeline

1. **File Reception**: WhatsApp/Telegram shares audio file via Intent
2. **Permission Check**: RequestPermissions for RECORD_AUDIO, READ/WRITE_EXTERNAL_STORAGE
3. **FFmpeg Conversion**: Input audio → 16kHz WAV format
4. **Model Inference**: Whisper model processes WAV → transcription
5. **Result Display**: Shows transcription in UI with status updates

## Permissions Required (Android)
- RECORD_AUDIO
- READ_EXTERNAL_STORAGE
- WRITE_EXTERNAL_STORAGE

## Known Optimizations
- Snapdragon 8 Elite NPU optimization (S25 Ultra targeted)
- Model file validation (checks minimum 1.4GB)
- FFmpeg command-line based audio conversion
- Intent handling with error suppression for "null intent" scenarios
- Local dependency patches for compatibility issues

## Configuration Files

### package.json Scripts
```bash
npm run android     # Run on Android emulator/device
npm run ios        # Run on iOS simulator/device
npm run lint       # ESLint checking
npm start          # Start Metro bundler
npm test           # Run Jest tests
```

### TypeScript Config (tsconfig.json)
- Extends: @react-native/typescript-config
- Includes Jest type definitions
- Includes all .ts and .tsx files
- Excludes node_modules and Pods

## Common Issues & Solutions

### Model Download Failures
- Check file size is > 1.4GB after download
- Verify internet connection stability
- Check DocumentDirectoryPath permissions

### Audio Format Issues
- Ensure FFmpeg conversion to 16kHz WAV
- Validate audio file encoding before processing

### Intent Handling
- Empty array dependency `[]` prevents duplicate processing
- Suppress "intent is null" errors (normal when app opens normally)

## Important Notes

1. **Patch Package**: Uses `patch-package` for local dependency modifications
2. **FFmpeg Kit**: Full AAR included in libs_secure/ folder
3. **React Native Receive Sharing Intent**: Patched for compatibility
4. **Performance**: Optimized for Snapdragon processors with potential NPU acceleration
5. **Language**: Primarily Italian UI strings with some English comments

## Development Commands

```bash
# Install dependencies
npm install

# Start development
npm start

# Build for Android
npm run android

# Run linter
npm run lint

# Run tests
npm test

# Patch dependencies if needed
npx patch-package <package-name>
```

## Next Steps for AI Assistance

When asking for AI help with this project, provide:
1. The specific error message or issue encountered
2. Which component/file is affected (App.tsx, useWhisperTranscriber.ts, native code, etc.)
3. Whether it's frontend, native integration, or build-related
4. Your target device/Android version
5. Logs from the error console or terminal

This context enables the AI to understand:
- Project architecture and data flow
- Dependencies and their versions
- Android native implementation
- Audio processing pipeline
- UI/UX design patterns used

---

# Source Code

## App.tsx

```typescript
import React from 'react';
import { StyleSheet, View, ScrollView, StatusBar, Platform } from 'react-native';
import { 
  Provider as PaperProvider, 
  MD3DarkTheme, 
  Appbar, 
  Button, 
  Card, 
  Text, 
  Avatar, 
  ProgressBar, 
  Divider,
  IconButton
} from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useWhisperTranscriber } from './useWhisperTranscriber';

export default function App() {
  const { 
    status, 
    isModelReady, 
    logs, 
    progress, 
    transcription, 
    downloadModel, 
    setTranscription 
  } = useWhisperTranscriber();

  // Colore dinamico in base allo stato
  const getStatusColor = () => {
    switch (status) {
      case 'DOWNLOADING': return '#ff9800';
      case 'CONVERTING': return '#2196f3';
      case 'TRANSCRIBING': return '#bb86fc';
      default: return '#00e676';
    }
  };

  return (
    <SafeAreaProvider>
      <PaperProvider theme={MD3DarkTheme}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <SafeAreaView style={styles.container}>
          
          <Appbar.Header elevated style={{ backgroundColor: '#000' }}>
            <Appbar.Content 
              title="Whisper AI" 
              subtitle="Snapdragon 8 Elite Optimized" 
              titleStyle={styles.appbarTitle}
            />
            <IconButton icon="dots-vertical" onPress={() => {}} />
          </Appbar.Header>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* CARD STATO MODELLO */}
            <Card style={styles.card} mode="contained">
              <Card.Title
                title="Stato del Modello"
                subtitle={isModelReady ? "Medium Model caricato" : "Modello non presente"}
                left={(props) => (
                  <Avatar.Icon 
                    {...props} 
                    icon={isModelReady ? "check-decagram" : "download-outline"} 
                    backgroundColor={isModelReady ? "#00e676" : "#333"}
                  />
                )}
              />
              {status === 'DOWNLOADING' && (
                <Card.Content>
                  <Text variant="labelMedium" style={{ marginBottom: 4 }}>
                    Scaricamento: {Math.round(progress * 100)}%
                  </Text>
                  <ProgressBar progress={progress} color="#ff9800" style={styles.progress} />
                </Card.Content>
              )}
            </Card>

            {/* AREA TRASCRIZIONE */}
            <Card style={[styles.card, { marginTop: 16 }]} mode="elevated">
              <Card.Content>
                <View style={styles.row}>
                  <Text variant="titleMedium" style={{ color: '#bb86fc' }}>Testo Rilevato</Text>
                  {transcription !== "" && (
                    <IconButton icon="delete-outline" size={20} onPress={() => setTranscription("")} />
                  )}
                </View>
                <Divider style={styles.divider} />
                <Text selectable style={styles.textOutput}>
                  {status === 'TRANSCRIBING' ? "Trascrizione in corso..." : 
                   status === 'CONVERTING' ? "Conversione audio..." :
                   transcription || "In attesa di audio da WhatsApp o Telegram..."}
                </Text>
              </Card.Content>
            </Card>

            {/* LOG DI SISTEMA */}
            <View style={styles.debugSection}>
              <Text style={styles.debugHeader}>CONSOLE LOGS:</Text>
              <ScrollView nestedScrollEnabled={true} style={{ flex: 1 }}>
                {logs.map((log, i) => (
                  <Text key={i} style={styles.logText}>{log}</Text>
                ))}
              </ScrollView>
            </View>
          </ScrollView>

          {/* BOTTONE DINAMICO NEL FOOTER */}
          <View style={styles.footer}>
            {!isModelReady ? (
              <Button 
                mode="contained" 
                icon="download" 
                onPress={downloadModel} 
                loading={status === 'DOWNLOADING'}
                disabled={status === 'DOWNLOADING'}
                style={styles.btnDownload}
                contentStyle={{ height: 50 }}
              >
                Scarica Modello Medium (1.5GB)
              </Button>
            ) : (
              <Button 
                mode="contained" 
                icon="microphone" 
                onPress={() => {}} // Qui potresti aggiungere la registrazione live
                style={[styles.btnReady, { backgroundColor: getStatusColor() }]}
                contentStyle={{ height: 50 }}
              >
                {status === 'IDLE' ? "Modello Pronto" : "Elaborazione..."}
              </Button>
            )}
          </View>
        </SafeAreaView>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  appbarTitle: { fontWeight: 'bold' },
  scrollContent: { padding: 16 },
  card: { backgroundColor: '#121212', borderRadius: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progress: { height: 8, borderRadius: 4 },
  divider: { marginVertical: 8, backgroundColor: '#222' },
  textOutput: { color: '#fff', fontSize: 16, lineHeight: 24, minHeight: 100 },
  debugSection: { 
    marginTop: 24, 
    padding: 12, 
    backgroundColor: '#080808', 
    borderRadius: 12, 
    height: 200, 
    borderWidth: 1, 
    borderColor: '#1a1a1a' 
  },
  debugHeader: { color: '#00e676', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  logText: { color: '#00e676', fontSize: 10, fontFamily: 'monospace', marginBottom: 2 },
  footer: { padding: 16, borderTopWidth: 1, borderColor: '#1a1a1a', backgroundColor: '#000' },
  btnDownload: { borderRadius: 12, backgroundColor: '#6200ee' },
  btnReady: { borderRadius: 12 },
});
```

## useWhisperTranscriber.ts

```typescript
import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import RNFS from 'react-native-fs';
import { initWhisper, WhisperContext } from 'whisper.rn';
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';
import ReceiveSharingIntent from 'react-native-receive-sharing-intent';

const MODEL_PATH = `${RNFS.DocumentDirectoryPath}/ggml-medium.bin`;
const MODEL_URL = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin";

export function useWhisperTranscriber() {
  const [status, setStatus] = useState<'IDLE' | 'DOWNLOADING' | 'CONVERTING' | 'TRANSCRIBING'>('IDLE');
  const [isModelReady, setIsModelReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const whisperRef = useRef<WhisperContext | null>(null);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 20));
  }, []);

  // 1. RICHIESTA PERMESSI (Fondamentale su Android 14/S25 Ultra)
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ]);
        addLog("Permessi controllati.");
      } catch (err) {
        addLog("Errore permessi: " + err);
      }
    }
  };

  // 2. INIZIALIZZAZIONE E CONTROLLO MODELLO
  useEffect(() => {
    const init = async () => {
      await requestPermissions();
      const exists = await RNFS.exists(MODEL_PATH);
      if (exists) {
        try {
          const stats = await RNFS.stat(MODEL_PATH);
          // Controllo che il file sia almeno 1.4GB (non corrotto)
          if (parseInt(stats.size) > 1400000000) {
            setIsModelReady(true);
            addLog("Modello Medium pronto (1.5GB).");
          } else {
            addLog("Modello corrotto o incompleto. Scarica di nuovo.");
            await RNFS.unlink(MODEL_PATH);
          }
        } catch (e) {
          setIsModelReady(false);
        }
      } else {
        addLog("In attesa del download del modello...");
      }
    };
    init();
  }, [addLog]);

  // 3. GESTIONE INTENT (WhatsApp / Telegram)
  useEffect(() => {
    ReceiveSharingIntent.getReceivedFiles(
     (files: any[]) => {
       if (files && files.length > 0) {
        const file = files[0];
        const path = file.filePath || file.contentUri;
        if (path) {
          addLog(`Ricevuto audio: ${file.fileName || 'Vocale'}`);
          handleIncomingFile(path);
        }
      }
    },
    (err: any) => {
      // Ignoriamo silenziosamente l'errore "intent is null"
      const errorMsg = String(err);
      if (!errorMsg.toLowerCase().includes("intent is null")) {
        addLog("Errore Intent: " + errorMsg);
      }
    },
    "WhisperTranscriber"
    );
  }, []);

  // 4. CONVERSIONE FFMPEG (Ottimizzata per S25 Ultra)
  const convertToWav = async (inputPath: string): Promise<string | null> => {
    const outputPath = `${RNFS.CachesDirectoryPath}/audio_16k.wav`;
    
    try {
      if (await RNFS.exists(outputPath)) await RNFS.unlink(outputPath);
      
      addLog("FFmpeg: Elaborazione audio in corso...");
      // Comando per forzare 16kHz Mono PCM (richiesto da Whisper)
      const session = await FFmpegKit.execute(
        `-y -i "${inputPath}" -ar 16000 -ac 1 -c:a pcm_s16le "${outputPath}"`
      );

      const returnCode = await session.getReturnCode();
      if (ReturnCode.isSuccess(returnCode)) {
        addLog("FFmpeg: Conversione OK.");
        return outputPath;
      } else {
        addLog("FFmpeg: Fallito (Codice " + returnCode + ")");
        return null;
      }
    } catch (e: any) {
      addLog("Errore FFmpeg: " + e.message);
      return null;
    }
  };

  // 5. TRASCRIZIONE (Uso intensivo CPU/NPU)
  const transcribeAudio = async (wavPath: string) => {
    if (!isModelReady) {
      Alert.alert("Modello non pronto", "Scarica il modello Medium prima di trascrivere.");
      return;
    }

    try {
      setStatus('TRANSCRIBING');
      addLog("Whisper: Caricamento motore...");

      if (!whisperRef.current) {
        whisperRef.current = await initWhisper({ filePath: MODEL_PATH });
      }

      addLog("Whisper: Trascrizione avviata (8 Threads)...");
      const { promise } = whisperRef.current.transcribe(wavPath, {
        language: 'it',
        maxThreads: 8, // Sfrutta lo Snapdragon 8 Elite
        temperature: 0,
      });

      const result = await promise;
      setTranscription(result.result.trim());
      addLog("✅ Trascrizione completata con successo.");
    } catch (error: any) {
      addLog("Errore Whisper: " + error.message);
    } finally {
      setStatus('IDLE');
    }
  };

  const handleIncomingFile = async (path: string) => {
    // Rimuovi prefisso file:// se presente
    const cleanPath = path.startsWith('file://') ? path.substring(7) : path;
    
    setStatus('CONVERTING');
    const wavPath = await convertToWav(cleanPath);
    
    if (wavPath) {
      await transcribeAudio(wavPath);
    } else {
      setStatus('IDLE');
      Alert.alert("Errore", "Impossibile convertire il file audio.");
    }
  };

  // 6. DOWNLOAD MODELLO
  const downloadModel = async () => {
    if (status === 'DOWNLOADING') return;

    setStatus('DOWNLOADING');
    addLog("Download: Avvio scaricamento Medium Model...");

    const options = {
      fromUrl: MODEL_URL,
      toFile: MODEL_PATH,
      background: true,
      progress: (res: any) => {
        const p = res.bytesWritten / res.contentLength;
        setProgress(p);
      },
    };

    try {
      const result = await RNFS.downloadFile(options).promise;
      if (result.statusCode === 200) {
        setIsModelReady(true);
        addLog("✅ Modello scaricato correttamente.");
      } else {
        addLog(`❌ Errore server: ${result.statusCode}`);
      }
    } catch (e: any) {
      addLog("❌ Errore download: " + e.message);
    } finally {
      setStatus('IDLE');
      setProgress(0);
    }
  };

  return {
    status,
    isModelReady,
    progress,
    transcription,
    logs,
    downloadModel,
    setTranscription,
    handleIncomingFile
  };
}
```

## index.js

```javascript
/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
```

## MainActivity.kt

```kotlin
package com.whispertranscriber

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

    override fun getMainComponentName(): String = "WhisperTranscriber"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, false)
}
```

## MainApplication.kt

```kotlin
package com.whispertranscriber

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader

class MainApplication : Application(), ReactApplication {

    override val reactNativeHost: ReactNativeHost =
        object : DefaultReactNativeHost(this) {
            override fun getPackages(): List<ReactPackage> =
                PackageList(this).packages.apply {
                    // Autolink gestisce tutto
                    add(WhisperPackage())
                }

            override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

            override val isNewArchEnabled: Boolean = false
            override val isHermesEnabled: Boolean = true
        }

    override fun onCreate() {
        super.onCreate()
        SoLoader.init(this, false)
    }
}
```

## WhisperModule.java

```java
package com.whispertranscriber;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import java.io.File;

public class WhisperModule extends ReactContextBaseJavaModule {
    WhisperModule(ReactApplicationContext context) {
        super(context);
    }

    @Override
    public String getName() {
        return "WhisperModule";
    }

    @ReactMethod
    public void transcribe(String modelPath, String audioPath, Promise promise) {
        try {
            File modelFile = new File(modelPath);
            File audioFile = new File(audioPath);

            if (!modelFile.exists()) {
                promise.reject("ERR", "Modello non trovato in: " + modelPath);
                return;
            }

            // NOTA: Qui è dove si aggancia la libreria whisper.cpp
            // Per ora simuliamo il ritorno per testare il ponte
            String result = "Trascrizione avviata su NPU per: " + audioFile.getName();
            promise.resolve(result);
            
        } catch (Exception e) {
            promise.reject("ERR", e.getMessage());
        }
    }
}
```

## WhisperPackage.java

```java
package com.whispertranscriber;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class WhisperPackage implements ReactPackage {
    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new WhisperModule(reactContext));
        return modules;
    }
}
```

## AndroidManifest.xml

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.MANAGE_EXTERNAL_STORAGE" />
    <application
      android:largeHeap="true" 
      android:extractNativeLibs="true"
      android:name=".MainApplication"
      android:label="@string/app_name"
      android:icon="@mipmap/ic_launcher"
      android:roundIcon="@mipmap/ic_launcher_round"
      android:allowBackup="false"
      android:theme="@style/AppTheme"
      android:usesCleartextTraffic="${usesCleartextTraffic}"
      android:supportsRtl="true">
      <activity
        android:name=".MainActivity"
        android:label="@string/app_name"
        android:configChanges="keyboard|keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize|uiMode"
        android:launchMode="singleTask"
        android:windowSoftInputMode="adjustResize"
        android:exported="true">
        <intent-filter>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LAUNCHER" />
        </intent-filter>
        <intent-filter>
          <action android:name="android.intent.action.SEND" />
          <category android:name="android.intent.category.DEFAULT" />
          <data android:mimeType="audio/*" />
          <data android:mimeType="application/octet-stream" />
        </intent-filter>
      </activity>
    </application>
</manifest>
```

## android/app/build.gradle

```gradle
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.facebook.react")
}
react {
    autolinkLibrariesWithApp()
}
android {
    ndkVersion "27.0.12077973"
    compileSdk 34
    namespace "com.whispertranscriber"
    defaultConfig {
        applicationId "com.whispertranscriber"
        minSdkVersion 24
        targetSdkVersion 34
        versionCode 1
        versionName "1.0"
        externalNativeBuild {
            cmake {
                abiFilters "arm64-v8a", "x86_64"
            }
        }
    }
    externalNativeBuild {
        cmake {
            path "CMakeLists.txt"
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    packaging {
        jniLibs {
            useLegacyPackaging = true
        }
    }
}
dependencies {
    implementation("com.facebook.react:react-android")
    implementation("com.facebook.react:hermes-android")
    implementation project(':ffmpeg-kit-react-native')
}
apply from: "../../node_modules/react-native-vector-icons/fonts.gradle"
```

## CMakeLists.txt

```cmake
cmake_minimum_required(VERSION 3.22.1)
project(app_modules)
set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 17)

# Imposta REACT_ANDROID_DIR esplicitamente
set(REACT_ANDROID_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../node_modules/react-native/ReactAndroid")

include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)
```

## react-native.config.js

```javascript
module.exports = {
  dependencies: {
    'whisper.rn': {
      platforms: {
        android: {
          libraryName: null, // Impedisce a CMake di cercare il Codegen C++
        },
      },
    },
    'react-native-vector-icons': {
      platforms: {
        android: {
          libraryName: null,
        },
      },
    },
    'react-native-safe-area-context': {
      platforms: {
        android: {
          libraryName: null,
        },
      },
    },
  },
};
```

## package.json

```json
{
  "name": "WhisperTranscriber",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "lint": "eslint .",
    "start": "react-native start",
    "test": "jest",
    "postinstall": "patch-package"
  },
  "dependencies": {
    "@react-native/new-app-screen": "0.85.2",
    "ffmpeg-kit-react-native": "^6.0.2",
    "react": "19.2.3",
    "react-native": "0.85.2",
    "react-native-fs": "^2.20.0",
    "react-native-paper": "^5.15.1",
    "react-native-receive-sharing-intent": "^2.0.0",
    "react-native-safe-area-context": "^5.7.0",
    "react-native-vector-icons": "^10.3.0",
    "whisper.rn": "^0.5.5"
  },
  "devDependencies": {
    "@babel/core": "^7.25.2",
    "@babel/preset-env": "^7.25.3",
    "@babel/runtime": "^7.25.0",
    "@react-native-community/cli": "20.1.0",
    "@react-native-community/cli-platform-android": "20.1.0",
    "@react-native-community/cli-platform-ios": "20.1.0",
    "@react-native/babel-preset": "0.85.2",
    "@react-native/eslint-config": "0.85.2",
    "@react-native/jest-preset": "0.85.2",
    "@react-native/metro-config": "0.85.2",
    "@react-native/typescript-config": "0.85.2",
    "@types/jest": "^29.5.13",
    "@types/react": "^19.2.0",
    "@types/react-test-renderer": "^19.1.0",
    "eslint": "^8.19.0",
    "jest": "^29.6.3",
    "jimp": "^1.6.1",
    "patch-package": "^8.0.1",
    "postinstall-postinstall": "^2.1.0",
    "prettier": "2.8.8",
    "react-test-renderer": "19.2.3",
    "sharp": "^0.34.5",
    "typescript": "^5.8.3"
  },
  "engines": {
    "node": ">= 22.11.0"
  }
}
```

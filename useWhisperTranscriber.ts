import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import RNFS from 'react-native-fs';
import { initWhisper, WhisperContext } from 'whisper.rn';
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';
import ReceiveSharingIntent from 'react-native-receive-sharing-intent';
import { useWhisper } from 'whisper.rn/src';
import { RealtimeTranscriber } from 'whisper.rn/realtime-transcription';
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
     // perché significa semplicemente che l'app è stata aperta normalmente
    const errorMsg = String(err);
    if (!errorMsg.toLowerCase().includes("intent is null")) {
      addLog("Errore Intent: " + errorMsg);
    }
  },
  "WhisperTranscriber"
  );

    // Rimuoviamo il clearReceivedFiles dal ciclo di smontaggio se legato a isModelReady
   // altrimenti ci brucia l'intent mentre scarichiamo il modello.
    // Lasciamo l'array delle dipendenze vuoto per farlo girare una sola volta!
  }, []); // <-- CHIAVE DELLA SOLUZIONE: array vuoto

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

    let lastUpdate = 0;

    const options = {
      fromUrl: MODEL_URL,
      toFile: MODEL_PATH,
      background: true,
      progressInterval: 1000,
      progress: (res: any) => {
        const now = Date.now();
        // Limita gli aggiornamenti a massimo uno ogni 1000ms (1 secondo)
        // per evitare il blocco "Excessive number of pending callbacks"
        if (now - lastUpdate > 1000) {
          const p = res.bytesWritten / res.contentLength;
          setProgress(p);
          lastUpdate = now;
        }
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
import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import RNFS from 'react-native-fs';
import { initWhisper, WhisperContext } from 'whisper.rn';
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';
import ReceiveSharingIntent from 'react-native-receive-sharing-intent';
import { useWhisper } from 'whisper.rn/src';
import { RealtimeTranscriber } from 'whisper.rn/realtime-transcription';
const MODEL_PATH = `${RNFS.DocumentDirectoryPath}/ggml-small.bin`;
const MODEL_URL = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin";

export function useWhisperTranscriber() {
  const [status, setStatus] = useState<'IDLE' | 'DOWNLOADING' | 'CONVERTING' | 'TRANSCRIBING'>('IDLE');
  const [isModelReady, setIsModelReady] = useState(false);
  const isModelReadyRef = useRef(false); // Ref per evitare closure stale negli intent
  const [progress, setProgress] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const whisperRef = useRef<WhisperContext | null>(null);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 20));
  }, []);

  // Sync ref con lo stato
  useEffect(() => {
    isModelReadyRef.current = isModelReady;
  }, [isModelReady]);

  // 1. RICHIESTA PERMESSI
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ];

        if (Platform.Version >= 33) {
          permissions.push(PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO);
        } else {
          permissions.push(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
          permissions.push(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
        }

        const grants = await PermissionsAndroid.requestMultiple(permissions);
        addLog("Permessi aggiornati.");
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
          // Il modello Small è circa 460MB, controlliamo che sia almeno 450MB
          if (parseInt(stats.size) > 450000000) {
            setIsModelReady(true);
            addLog("Modello Small pronto.");
          } else {
            addLog("Modello incompleto. Riesegui download.");
            await RNFS.unlink(MODEL_PATH);
            setIsModelReady(false);
          }
        } catch (e) {
          setIsModelReady(false);
        }
      }
    };
    init();
  }, []);

  // 3. GESTIONE INTENT
  useEffect(() => {
    addLog("Sistema ricezione attivo.");
    ReceiveSharingIntent.getReceivedFiles(
     (files: any[]) => {
       if (files && files.length > 0) {
        const file = files[0];
        const path = file.filePath || file.contentUri;
        if (path) {
          addLog("Ricevuto file audio.");
          handleIncomingFile(path);
        }
      }
    },
    (err: any) => {
      const errorMsg = String(err);
      if (!errorMsg.toLowerCase().includes("intent is null")) {
        addLog("Errore Intent: " + errorMsg);
      }
    },
    "WhisperTranscriber"
    );
  }, []);

  // 4. CONVERSIONE FFMPEG
  const convertToWav = async (inputPath: string): Promise<string | null> => {
    const outputPath = `${RNFS.CachesDirectoryPath}/audio_16k.wav`;
    
    try {
      if (await RNFS.exists(outputPath)) await RNFS.unlink(outputPath);
      
      addLog("FFmpeg: Elaborazione audio...");
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

  // 5. TRASCRIZIONE
  const transcribeAudio = async (wavPath: string) => {
    // Controllo ref e file fisico per sicurezza
    const fileExists = await RNFS.exists(MODEL_PATH);
    if (!isModelReadyRef.current && !fileExists) {
      addLog("Modello non pronto. Scarica il modello Small.");
      return;
    }

    try {
      setStatus('TRANSCRIBING');
      addLog("Whisper: Caricamento motore...");

      const cleanModelPath = MODEL_PATH.startsWith('file://') ? MODEL_PATH.substring(7) : MODEL_PATH;

      if (!whisperRef.current) {
        whisperRef.current = await initWhisper({ filePath: cleanModelPath });
      }

      addLog("Whisper: Trascrizione avviata...");
      const { promise } = whisperRef.current.transcribe(wavPath, {
        language: 'it',
        maxThreads: 4,
        temperature: 0,
      });

      const result = await promise;
      setTranscription(result.result.trim());
      addLog("✅ Trascrizione completata.");
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
    addLog("Download: Avvio scaricamento Small Model...");

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
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
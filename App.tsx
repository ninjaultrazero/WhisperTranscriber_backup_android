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
                title="Stato del Modello AI"
                subtitle={isModelReady ? "Modello Tiny caricato" : "Modello non presente"}
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
                Scarica Modello Tiny (75MB)
              </Button>
            ) : (
              <Button 
                mode="contained" 
                icon="microphone" 
                onPress={() => {
                  if (status === 'IDLE') {
                    // Se non abbiamo un file, suggeriamo di condividerlo
                    setTranscription("Per provare, condividi un file audio da WhatsApp o Telegram verso questa app.");
                  }
                }}
                style={[styles.btnReady, { backgroundColor: getStatusColor() }]}
                contentStyle={{ height: 50 }}
              >
                {status === 'IDLE' ? "Pronto (Condividi un audio)" : "Elaborazione..."}
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
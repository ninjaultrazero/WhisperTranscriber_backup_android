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
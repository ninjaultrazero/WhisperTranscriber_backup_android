cmake_minimum_required(VERSION 3.22.1)
project(app_modules)
set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 17)

# Imposta REACT_ANDROID_DIR esplicitamente
set(REACT_ANDROID_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../node_modules/react-native/ReactAndroid")

include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)

module.exports = {
  dependencies: {
    '@react-native-firebase/app': {
      platforms: {
        android: {
          sourceDir: '../node_modules/@react-native-firebase/app/android',
          packageImportPath: 'import io.invertase.firebase.app.ReactNativeFirebaseAppPackage;',
        },
      },
    },
    '@react-native-firebase/auth': {
      platforms: {
        android: {
          sourceDir: '../node_modules/@react-native-firebase/auth/android',
          packageImportPath: 'import io.invertase.firebase.auth.ReactNativeFirebaseAuthPackage;',
        },
      },
    },
    '@react-native-firebase/analytics': {
      platforms: {
        android: {
          sourceDir: '../node_modules/@react-native-firebase/analytics/android',
          packageImportPath: 'import io.invertase.firebase.analytics.ReactNativeFirebaseAnalyticsPackage;',
        },
      },
    },
  },
};

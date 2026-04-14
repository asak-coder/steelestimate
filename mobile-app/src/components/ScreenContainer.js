const React = require('react');
const { SafeAreaView, StatusBar, StyleSheet, View } = require('react-native');
const { COLORS, SPACING } = require('../theme/appTheme');

function ScreenContainer({ children, style, contentStyle, offline = false, statusBarStyle = 'light-content' }) {
  return React.createElement(
    SafeAreaView,
    { style: styles.safeArea },
    React.createElement(StatusBar, { barStyle: statusBarStyle, backgroundColor: COLORS.background }),
    React.createElement(
      View,
      { style: [styles.container, style] },
      offline
        ? React.createElement(
            View,
            { style: styles.offlineBar },
            React.createElement(View, { style: styles.offlineDot }),
            React.createElement(
              View,
              { style: styles.offlineTextWrap },
              React.createElement(
                View,
                null,
                React.createElement(require('react-native').Text, { style: styles.offlineTitle }, 'Offline mode'),
              ),
              React.createElement(require('react-native').Text, { style: styles.offlineText }, 'Saved locally. Sync will resume when connected.')
            )
          )
        : null,
      React.createElement(View, { style: [styles.content, contentStyle] }, children)
    )
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  offlineBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#2B1D0C',
    borderBottomWidth: 1,
    borderBottomColor: '#5A3A10',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
  },
  offlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.offline,
  },
  offlineTextWrap: {
    flex: 1,
  },
  offlineTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  offlineText: {
    color: '#FCD9A6',
    fontSize: 12,
    marginTop: 2,
  },
});

module.exports = ScreenContainer;
module.exports.default = ScreenContainer;
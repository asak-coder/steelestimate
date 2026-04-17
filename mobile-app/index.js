import { AppRegistry, StatusBar } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

StatusBar.setBarStyle('light-content', true);
StatusBar.setBackgroundColor('#0F172A', true);

AppRegistry.registerComponent(appName, () => App);

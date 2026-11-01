import React from 'react';
import { registerRootComponent } from 'expo';
import AppNavigator from './navigation/AppNavigator';

function App() {
  return <AppNavigator />;
}

registerRootComponent(App);
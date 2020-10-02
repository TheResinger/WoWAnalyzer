import React from 'react';
import { applyMiddleware, createStore } from 'redux';
import { Provider as ReduxProvider } from 'react-redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import thunk from 'redux-thunk';
import { createBrowserHistory } from 'history';
import { BrowserRouter } from 'react-router-dom';

import createReducers from 'interface/reducers';
import RootErrorBoundary from 'interface/RootErrorBoundary';
import App from 'interface/App';
import RootLocalizationProvider from 'interface/RootLocalizationProvider';

const history = createBrowserHistory();

const store = createStore(
  createReducers(history),
  composeWithDevTools(
    applyMiddleware(thunk),
  ),
);

const Root = () => (
  <ReduxProvider store={store}>
    <RootErrorBoundary>
      <RootLocalizationProvider>
        <BrowserRouter history={history}>
          <App />
        </BrowserRouter>
      </RootLocalizationProvider>
    </RootErrorBoundary>
  </ReduxProvider>
);

export default Root;

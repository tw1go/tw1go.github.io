import React from 'react';
import ReactDOM from 'react-dom/client';
import Banner from './sections/banner';
import Introduction from './sections/introduction';
import Body from './js/body';
import './scss/main.scss';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Body />
    <Banner />
    <Introduction />
  </React.StrictMode>
);

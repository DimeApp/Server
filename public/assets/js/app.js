import React from 'react'
import ReactDOM from 'react-dom'
import {Router, Route, IndexRoute, browswerHistory} from 'react-router'

class Home extends React.Componenet {
  render() {
    return (
      <h1>Dime</h1>
    );
  }
}

ReactDOM.render(
  <Home />,
  document.getElementById('app')
);

import React from 'react';
import logo from './logo.svg';
import './App.css';
import AgentAggregatorComponent from '../components/AgentAggregatorComponent';

const App = () => {
  return (
    <div className="App">
      <AgentAggregatorComponent userInput={"Ex. Microsoft"} />
    </div>
  );
};

export default App;

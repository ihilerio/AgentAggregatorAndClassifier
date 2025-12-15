import React from "react";
import logo from "./logo.svg";
import "./App.css";
import AgentAggregatorComponent from "./AgentAggregatorComponent";

function App() {
  return (
    <div className="App">
      <AgentAggregatorComponent userInput={"Ex. Microsoft"} />
    </div>
  );
}

export default App;

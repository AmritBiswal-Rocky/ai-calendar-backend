import React from 'react';
import TextEditor from './components/TextEditor';
import BlockMenu from './components/BlockMenu';
import NavigationBar from './components/NavigationBar';
import ComposeButton from './components/ComposeButton';
import AIIntegration from './components/AIIntegration';

const App = () => {
  return (
    <div className="flex flex-col h-screen">
      <div className="flex-grow">
        <TextEditor />
        <BlockMenu />
        <AIIntegration className="fixed bottom-4 left-4" />
      </div>
      <NavigationBar />
      <ComposeButton />
    </div>
  );
};

export default App;

import { useProjectStore } from './store/useStore';
import { CatalogTab } from './components/tabs/CatalogTab';
import { GroupsTab } from './components/tabs/GroupsTab';
import { ScriptTab } from './components/tabs/ScriptTab';
import { AudioTab } from './components/tabs/AudioTab';
import { PreviewTab } from './components/tabs/PreviewTab';
import { ProjectTab } from './components/tabs/ProjectTab';
import { TerminalTab } from './components/tabs/TerminalTab';
import { FileImage, FolderTree, FileText, Music, PlaySquare, Settings, Terminal } from 'lucide-react';
import './App.css';

function App() {
  const { currentTab, setCurrentTab, projectName } = useProjectStore();
  
  const tabs = [
    { id: 'catalog', label: 'Catalog', icon: FileImage },
    { id: 'groups', label: 'Groups', icon: FolderTree },
    { id: 'script', label: 'Script', icon: FileText },
    { id: 'audio', label: 'Audio', icon: Music },
    { id: 'preview', label: 'Preview', icon: PlaySquare },
    { id: 'project', label: 'Project', icon: Settings },
    { id: 'terminal', label: 'Terminal', icon: Terminal },
  ] as const;
  
  const renderTab = () => {
    switch (currentTab) {
      case 'catalog':
        return <CatalogTab />;
      case 'groups':
        return <GroupsTab />;
      case 'script':
        return <ScriptTab />;
      case 'audio':
        return <AudioTab />;
      case 'preview':
        return <PreviewTab />;
      case 'project':
        return <ProjectTab />;
      case 'terminal':
        return <TerminalTab />;
      default:
        return <CatalogTab />;
    }
  };
  
  return (
    <div className="app">
      {/* Top Navigation Bar */}
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-logo">VIGNETTE</h1>
          <span className="project-name">{projectName}</span>
        </div>
        
        <nav className="tab-navigation">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`nav-tab ${currentTab === tab.id ? 'active' : ''}`}
                onClick={() => setCurrentTab(tab.id)}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </header>
      
      {/* Main Content Area */}
      <main className="app-main">
        {renderTab()}
      </main>
      
      {/* Footer */}
      <footer className="app-footer">
        <p>VIGNETTE - AI-Powered Video Creation Tool</p>
      </footer>
    </div>
  );
}

export default App;

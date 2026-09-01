import { Header } from './components/Header';
import { DeviceLibrary } from './components/DeviceLibrary';
import { RackView } from './components/RackView';
import { Inspector } from './components/Inspector';
import { PrintSummary } from './components/PrintSummary';

export default function App() {
  return (
    <div className="flex h-screen w-screen flex-col bg-zinc-950 print:h-auto print:bg-white">
      <Header />
      <div className="flex min-h-0 flex-1 print:hidden">
        <DeviceLibrary />
        <RackView />
        <Inspector />
      </div>
      <div className="hidden px-8 py-6 print:block">
        <PrintSummary />
      </div>
    </div>
  );
}

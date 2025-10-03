

import Button from '../common/Button';
import { Play, Pause, Square, RefreshCw } from 'lucide-react';

const ControlBar = () => {
  return (
    <div className="card p-4 flex items-center justify-between mb-4">
      <div className="flex items-center space-x-4">
        <Button variant="primary"><Play className="mr-2" size={16}/> START</Button>
        <Button variant="secondary"><Pause className="mr-2" size={16}/> PAUSE</Button>
        <Button variant="secondary"><Square className="mr-2" size={16}/> STOP</Button>
        <Button variant="secondary"><RefreshCw className="mr-2" size={16}/> RESET</Button>
      </div>
      <div className="text-2xl font-mono bg-gray-900 px-4 py-2 rounded">
        T+00:05:32 / 00:45:00
      </div>
    </div>
  );
};

export default ControlBar;

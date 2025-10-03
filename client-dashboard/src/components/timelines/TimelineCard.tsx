
import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { Eye, Edit, Copy, Trash2 } from 'lucide-react';

interface TimelineCardProps {
  name: string;
  id: string;
  injects: number;
  duration: number;
}

const TimelineCard: React.FC<TimelineCardProps> = ({ name, id, injects, duration }) => {
  return (
    <Card>
      <h3 className="text-lg font-bold text-text-primary">{name}</h3>
      <p className="text-sm text-text-secondary mt-1">ID: {id}</p>
      <div className="text-sm text-text-secondary my-4 space-y-1">
        <p>Injects: {injects}</p>
        <p>Duration: {duration} min</p>
      </div>
      <div className="flex space-x-2">
        <Button variant="secondary"><Eye size={16} /></Button>
        <Button variant="secondary"><Edit size={16} /></Button>
        <Button variant="secondary"><Copy size={16} /></Button>
        <Button variant="secondary"><Trash2 size={16} /></Button>
      </div>
    </Card>
  );
};

export default TimelineCard;

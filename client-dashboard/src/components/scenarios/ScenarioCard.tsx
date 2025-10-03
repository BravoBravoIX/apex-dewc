
import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Tag from '../common/Tag';

interface ScenarioCardProps {
  title: string;
  description: string;
  duration: number;
  maxTeams: number;
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({ title, description, duration, maxTeams }) => {
  return (
    <Card className="flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-bold text-text-primary">{title}</h3>
        <p className="text-sm text-text-secondary mt-2 mb-4">{description}</p>
      </div>
      <div>
        <div className="flex space-x-2 mb-4">
          <Tag>Duration: {duration} min</Tag>
          <Tag>Teams: {maxTeams}</Tag>
        </div>
        <Button>Configure</Button>
      </div>
    </Card>
  );
};

export default ScenarioCard;




const mockTeams = [
  { id: 'blue', name: 'Blue Team', port: 3142, mqtt: '✅', timeline: 'blue-standard', progress: '3/15' },
  { id: 'red', name: 'Red Team', port: 3789, mqtt: '✅', timeline: 'red-aggressive', progress: '5/22' },
  { id: 'orange', name: 'Orange Team', port: 3567, mqtt: '✅', timeline: 'blue-standard', progress: '3/15' },
  { id: 'green', name: 'Green Team', port: 3901, mqtt: '⚠️', timeline: 'custom-timeline', progress: '2/18 (1 miss)' },
];

const TeamStatusTable = () => {
  return (
    <div className="card p-4">
      <h3 className="font-bold mb-4">Team Dashboard Status</h3>
      <table className="w-full text-sm text-left">
        <thead className="border-b border-gray-600 text-text-secondary">
          <tr>
            <th className="p-2">Team</th>
            <th className="p-2">Port</th>
            <th className="p-2">MQTT</th>
            <th className="p-2">Timeline</th>
            <th className="p-2">Delivered/Total</th>
          </tr>
        </thead>
        <tbody>
          {mockTeams.map(team => (
            <tr key={team.id} className="border-b border-gray-700">
              <td className="p-2 font-semibold">{team.name}</td>
              <td className="p-2">{team.port}</td>
              <td className="p-2">{team.mqtt}</td>
              <td className="p-2">{team.timeline}</td>
              <td className="p-2">{team.progress}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TeamStatusTable;

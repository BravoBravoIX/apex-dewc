export interface GeolocationData {
  latitude: string;
  longitude: string;
  altitude: string;
  method: string;
  confidence: string;
  errorRadius: string;
  nearestLandmark?: string;
}

interface EmitterGeolocationProps {
  geolocation: GeolocationData | null;
}

export const EmitterGeolocation = ({ geolocation }: EmitterGeolocationProps) => {
  if (!geolocation) {
    return (
      <section className="mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <h2 className="text-lg font-semibold text-text-primary">
              Emitter Geolocation
            </h2>
          </div>
          <div className="text-center py-8 text-text-secondary">
            No geolocation data available
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">
            Emitter Geolocation
          </h2>
        </div>

        {/* Location Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Latitude */}
          <div className="p-4 bg-background rounded-md">
            <div className="text-xs text-text-muted uppercase tracking-wide mb-1">
              Latitude
            </div>
            <div className="text-base font-semibold text-text-primary">
              {geolocation.latitude}
            </div>
          </div>

          {/* Longitude */}
          <div className="p-4 bg-background rounded-md">
            <div className="text-xs text-text-muted uppercase tracking-wide mb-1">
              Longitude
            </div>
            <div className="text-base font-semibold text-text-primary">
              {geolocation.longitude}
            </div>
          </div>

          {/* Altitude */}
          <div className="p-4 bg-background rounded-md">
            <div className="text-xs text-text-muted uppercase tracking-wide mb-1">
              Altitude
            </div>
            <div className="text-base font-semibold text-text-primary">
              {geolocation.altitude}
            </div>
          </div>

          {/* Method */}
          <div className="p-4 bg-background rounded-md">
            <div className="text-xs text-text-muted uppercase tracking-wide mb-1">
              Method
            </div>
            <div className="text-base font-semibold text-text-primary">
              {geolocation.method}
            </div>
          </div>

          {/* Confidence */}
          <div className="p-4 bg-background rounded-md">
            <div className="text-xs text-text-muted uppercase tracking-wide mb-1">
              Confidence
            </div>
            <div className="text-base font-semibold text-text-primary">
              {geolocation.confidence}
            </div>
          </div>

          {/* Error Radius */}
          <div className="p-4 bg-background rounded-md">
            <div className="text-xs text-text-muted uppercase tracking-wide mb-1">
              Error Radius
            </div>
            <div className="text-base font-semibold text-text-primary">
              {geolocation.errorRadius}
            </div>
          </div>
        </div>

        {/* Nearest Landmark */}
        {geolocation.nearestLandmark && (
          <div className="mt-4 p-4 bg-background rounded text-sm">
            <strong className="text-text-primary">Nearest Landmark:</strong>{' '}
            <span className="text-text-secondary">{geolocation.nearestLandmark}</span>
          </div>
        )}
      </div>
    </section>
  );
};

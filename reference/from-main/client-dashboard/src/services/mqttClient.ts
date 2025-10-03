import mqtt, { MqttClient } from 'mqtt';

export interface MqttMessage {
  command: string;
  parameters?: any;
  timestamp: string;
  source: string;
}

export interface InjectionMessage {
  injection_id: string;
  scenario_id: string;
  team_id: string;
  type: 'media' | 'alert' | 'news' | 'email' | 'twitter';
  target: string;
  timestamp: string;
  content: InjectionContent;
  metadata: {
    source: string;
    classification?: string;
    correlation_id?: string;
    duration?: number;
    auto_remove?: boolean;
  };
}

export interface InjectionContent {
  title: string;
  content: string;
  source: string;
  media_type?: string;
  alert_type?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  sender?: string;
  recipient?: string;
  subject?: string;
  attachments?: string[];
  username?: string;
  handle?: string;
  retweets?: number;
  likes?: number;
  image_url?: string;
  video_url?: string;
}

export class MQTTClientService {
  private client: MqttClient | null = null;
  private messageCallbacks: ((topic: string, message: any) => void)[] = [];
  private connectionCallbacks: ((connected: boolean) => void)[] = [];
  private isConnected = false;

  constructor(private brokerUrl = 'ws://localhost:9001') {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.client = mqtt.connect(this.brokerUrl, {
          clientId: `client-dashboard-${Math.random().toString(16).substr(2, 8)}`,
          clean: true,
          connectTimeout: 4000,
          keepalive: 60,
          protocolVersion: 4
        });

        this.client.on('connect', () => {
          console.log('MQTT Client Connected');
          this.isConnected = true;
          this.notifyConnectionCallbacks(true);
          resolve();
        });

        this.client.on('error', (error) => {
          console.error('MQTT Connection Error:', error);
          this.isConnected = false;
          this.notifyConnectionCallbacks(false);
          reject(error);
        });

        this.client.on('close', () => {
          console.log('MQTT Connection Closed');
          this.isConnected = false;
          this.notifyConnectionCallbacks(false);
        });

        this.client.on('message', (topic, payload) => {
          try {
            const message = JSON.parse(payload.toString());
            this.notifyMessageCallbacks(topic, message);
          } catch (error) {
            console.error('Failed to parse MQTT message:', error);
          }
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.client) {
      this.client.end();
      this.client = null;
      this.isConnected = false;
      this.notifyConnectionCallbacks(false);
    }
  }

  subscribe(topic: string): void {
    if (this.client && this.isConnected) {
      this.client.subscribe(topic, (error) => {
        if (error) {
          console.error('MQTT Subscribe Error:', error);
        } else {
          console.log(`Subscribed to ${topic}`);
        }
      });
    }
  }

  publish(topic: string, message: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.isConnected) {
        reject(new Error('MQTT client not connected'));
        return;
      }

      const payload = JSON.stringify(message);
      this.client.publish(topic, payload, (error) => {
        if (error) {
          console.error('MQTT Publish Error:', error);
          reject(error);
        } else {
          console.log(`Published to ${topic}:`, message);
          resolve();
        }
      });
    });
  }

  onMessage(callback: (topic: string, message: any) => void): void {
    this.messageCallbacks.push(callback);
  }

  onConnectionChange(callback: (connected: boolean) => void): void {
    this.connectionCallbacks.push(callback);
  }

  private notifyMessageCallbacks(topic: string, message: any): void {
    this.messageCallbacks.forEach(callback => callback(topic, message));
  }

  private notifyConnectionCallbacks(connected: boolean): void {
    this.connectionCallbacks.forEach(callback => callback(connected));
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Team-specific test message helpers
  async sendTestMessageToTeam(teamId: string, messageType: 'news' | 'alert' | 'decision' = 'news'): Promise<void> {
    // Use the correct topic format that team dashboards expect
    const exerciseId = '2'; // Default exercise ID from standalone demo

    const topicMap = {
      news: `exercise/${exerciseId}/team/${teamId}/media`,
      alert: `exercise/${exerciseId}/team/${teamId}/alerts`,
      decision: `exercise/${exerciseId}/team/${teamId}/decisions`
    };

    const topic = topicMap[messageType];

    const testMessages = {
      news: {
        id: `test-news-${Date.now()}`,
        type: 'media',
        timestamp: new Date().toISOString(),
        exercise_id: exerciseId,
        team_id: teamId,
        priority: 'routine',
        content: {
          title: '📰 TEST NEWS',
          content: `Manual test news message sent to ${teamId} at ${new Date().toLocaleTimeString()}`,
          source: 'Client Dashboard Manual Test',
          media_type: 'news'
        },
        metadata: {
          source: 'client-dashboard',
          classification: 'UNCLASSIFIED',
          correlation_id: `test-${Date.now()}`
        }
      },
      alert: {
        id: `test-alert-${Date.now()}`,
        type: 'alert',
        timestamp: new Date().toISOString(),
        exercise_id: exerciseId,
        team_id: teamId,
        priority: 'urgent',
        content: {
          title: '⚠️ TEST ALERT',
          content: `Manual security alert test sent to ${teamId} at ${new Date().toLocaleTimeString()}`,
          source: 'Client Dashboard Manual Test',
          alert_type: 'security'
        },
        metadata: {
          source: 'client-dashboard',
          classification: 'UNCLASSIFIED',
          correlation_id: `test-${Date.now()}`
        }
      },
      decision: {
        id: `test-decision-${Date.now()}`,
        type: 'decision',
        timestamp: new Date().toISOString(),
        exercise_id: exerciseId,
        team_id: teamId,
        priority: 'flash',
        content: {
          title: '🤔 TEST DECISION',
          content: `Manual decision request test sent to ${teamId} at ${new Date().toLocaleTimeString()}`,
          source: 'Client Dashboard Manual Test',
          decision_type: 'strategic',
          options: ['Acknowledge', 'Escalate', 'Investigate']
        },
        metadata: {
          source: 'client-dashboard',
          classification: 'UNCLASSIFIED',
          correlation_id: `test-${Date.now()}`
        }
      }
    };

    await this.publish(topic, testMessages[messageType]);
  }

  // SCIP v2 Injection Handlers
  subscribeToInjections(exerciseId: string, teamId: string): void {
    const topics = [
      `scip/exercise/${exerciseId}/teams/${teamId}/injections/+`,
      `scip/exercise/${exerciseId}/teams/${teamId}/media`,
      `scip/exercise/${exerciseId}/teams/${teamId}/alerts`,
      `scip/exercise/${exerciseId}/teams/${teamId}/news`,
      `scip/exercise/${exerciseId}/teams/${teamId}/email`,
      `scip/exercise/${exerciseId}/teams/${teamId}/twitter`
    ];

    topics.forEach(topic => {
      this.subscribe(topic);
    });
  }

  onInjectionReceived(callback: (injection: InjectionMessage) => void): void {
    this.onMessage((topic: string, message: any) => {
      // Check if this is an injection message
      if (topic.includes('/injections/') ||
          topic.includes('/media') ||
          topic.includes('/alerts') ||
          topic.includes('/news') ||
          topic.includes('/email') ||
          topic.includes('/twitter')) {

        try {
          // Convert legacy format to new format if needed
          const injection: InjectionMessage = this.normalizeInjectionMessage(message, topic);
          callback(injection);
        } catch (error) {
          console.error('Failed to parse injection message:', error);
        }
      }
    });
  }

  private normalizeInjectionMessage(message: any, topic: string): InjectionMessage {
    // Handle both new SCIP v2 format and legacy format
    if (message.injection_id) {
      // Already in SCIP v2 format
      return message as InjectionMessage;
    }

    // Convert legacy format
    const topicParts = topic.split('/');
    const type = topicParts[topicParts.length - 1] || 'media';

    return {
      injection_id: message.id || `legacy-${Date.now()}`,
      scenario_id: message.exercise_id || 'unknown',
      team_id: message.team_id || 'unknown',
      type: type as 'media' | 'alert' | 'news' | 'email' | 'twitter',
      target: type,
      timestamp: message.timestamp || new Date().toISOString(),
      content: {
        title: message.content?.title || 'Untitled',
        content: message.content?.content || '',
        source: message.content?.source || 'Unknown',
        ...message.content
      },
      metadata: {
        source: message.metadata?.source || 'legacy',
        classification: message.metadata?.classification,
        correlation_id: message.metadata?.correlation_id,
        duration: message.metadata?.duration || 30000, // 30 seconds default
        auto_remove: message.metadata?.auto_remove !== false
      }
    };
  }

  async acknowledgeInjection(injectionId: string, teamId: string, scenarioId: string): Promise<void> {
    const topic = `scip/exercise/${scenarioId}/teams/${teamId}/injection_ack`;
    const message = {
      injection_id: injectionId,
      team_id: teamId,
      scenario_id: scenarioId,
      timestamp: new Date().toISOString(),
      acknowledged: true
    };

    await this.publish(topic, message);
  }
}

// Singleton instance
export const mqttClient = new MQTTClientService();
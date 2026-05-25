import { Response } from 'express';

interface Client {
  id: string;
  res: Response;
}

export class EventService {
  private clients: Client[] = [];

  addClient(id: string, res: Response) {
    const newClient = { id, res };
    this.clients.push(newClient);

    res.on('close', () => {
      this.clients = this.clients.filter(client => client.id !== id);
    });
  }

  broadcast(event: string, data: any) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    this.clients.forEach(client => client.res.write(payload));
  }
}

// Export a singleton instance
export const eventService = new EventService();

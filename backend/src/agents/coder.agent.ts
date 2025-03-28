import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisCacheService } from 'src/redis/redis.service';
import { BaseAgent, Message } from './base.agent';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CoderAgent {
  private activeSessions: Map<string, BaseAgent>;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisCacheService: RedisCacheService,
  ) {
    this.activeSessions = new Map();
  }

  private async getOrCreateAgent(userId: string): Promise<BaseAgent> {
    if (!this.activeSessions.has(userId)) {
      // Read base template
      const baseTemplatePath = path.join(
        process.cwd(),
        'src',
        'tools',
        'base-template.json',
      );
      const baseTemplate = JSON.parse(
        fs.readFileSync(baseTemplatePath, 'utf-8'),
      );

      const agent = new BaseAgent(
        this.configService,
        this.redisCacheService,
        'coder_agent',
        'claude-3-5-sonnet-20241022',
        fs
          .readFileSync(
            path.join(process.cwd(), 'src', 'prompts', 'coder-agent.prompt.md'),
            'utf-8',
          )
          .replace('{base_template}', JSON.stringify(baseTemplate)),
        userId,
        0.6,
        [],
        'anthropic',
      );

      this.activeSessions.set(userId, agent);
    }

    return this.activeSessions.get(userId)!;
  }

  async generateResponse(message: string, userId: string): Promise<Message[]> {
    try {
      const agent = await this.getOrCreateAgent(userId);
      const thread = await agent.run(message);
      return thread.filter((msg) => msg.role !== 'system');
    } catch (error) {
      console.error('Error generating response:', error);
      return [
        {
          role: 'assistant',
          content: 'Something went wrong, please try again later',
          type: 'error',
        },
      ];
    }
  }

  clearConversation(userId: string): void {
    this.activeSessions.delete(userId);
  }
}

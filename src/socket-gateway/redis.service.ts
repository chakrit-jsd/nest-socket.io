import { Inject, Injectable } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { DB, KeysPrefix } from 'src/constans';

@Injectable()
export class RedisService {
  constructor(@Inject(DB.REDIS_DB) private redis: RedisClientType) {}

  async getOneUnreadCount(id: string, room: string): Promise<string | boolean> {
    const key = KeysPrefix.CHAT_NOTI + '::' + id + '::' + room;
    try {
      const count = await this.redis.get(key);
      return count;
    } catch (error) {
      return false;
    }
  }
  async setOneUnreadCount(id: string, room: string): Promise<boolean> {
    const key = KeysPrefix.CHAT_NOTI + '::' + id + '::' + room;
    try {
      await this.redis.incr(key);
      this.incAllUnreadCount(id);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async delOneUnreadCount(id: string, room: string): Promise<boolean> {
    const key = KeysPrefix.CHAT_NOTI + '::' + id + '::' + room;
    const count = await this.redis.get(key);
    try {
      await this.redis.del(key);
      this.decAllUnreadCount(id, +count || 0);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async getAllUnreadCount(id: string): Promise<string | boolean> {
    const key = KeysPrefix.CHAT_NOTI + '::' + id;
    try {
      return await this.redis.get(key);
    } catch (error) {
      return false;
    }
  }

  async incAllUnreadCount(id: string) {
    const key = KeysPrefix.CHAT_NOTI + '::' + id;
    try {
      this.redis.incr(key);
    } catch (error) {
      console.log(error);
    }
  }

  async decAllUnreadCount(id: string, count: number) {
    const key = KeysPrefix.CHAT_NOTI + '::' + id;
    try {
      this.redis.decrBy(key, count);
    } catch (error) {
      console.log(error);
    }
  }

  async setHistory(members: string[], room: string): Promise<boolean> {
    const commandArr = [];
    for (const id of members) {
      const key = KeysPrefix.CHAT_HISTORY + '::' + id;
      commandArr.push(this.redis.zAdd(key, { score: Date.now(), value: room }));
    }
    try {
      await Promise.all(commandArr);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getHistory(id: string, lastTime?: string): Promise<string[]> {
    const key = KeysPrefix.CHAT_HISTORY + '::' + id;
    const keyCurr = KeysPrefix.CURR_HISTORY + '::' + id;
    let maxScore: number = Date.now();
    let limit = 10;
    if (lastTime) {
      maxScore = +lastTime - 1;
    } else {
      limit = +(await this.redis.get(keyCurr));
    }
    try {
      const res = await this.redis.sendCommand<Array<string>>([
        'ZREVRANGEBYSCORE',
        key,
        `${maxScore}`,
        '0',
        'WITHSCORES',
        'LIMIT',
        '0',
        `${limit || 10}`,
      ]);
      return res;
    } catch (error) {
      console.log(error);
    }
  }

  async getStatus(id: string): Promise<boolean> {
    try {
      const status = await this.redis.get(id);
      return status === '1' ? true : false;
    } catch (error) {
      return false;
    }
  }
  async setOnline(id: string): Promise<boolean> {
    try {
      this.redis.set(id, 1);
    } catch (error) {
      return false;
    }
    return true;
  }
  async setOffline(id: string): Promise<boolean> {
    try {
      this.redis.del(id);
    } catch (error) {
      return false;
    }
    return true;
  }

  async setCurrentHistory(id: string, qty: number): Promise<boolean> {
    const key = KeysPrefix.CURR_HISTORY + '::' + id;
    try {
      await this.redis.set(key, qty);
      return true;
    } catch (error) {
      return false;
    }
  }

  async delCurrentHistory(id: string): Promise<boolean> {
    const key = KeysPrefix.CURR_HISTORY + '::' + id;
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      return false;
    }
  }
}

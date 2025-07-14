import api from './api';

export interface Tag {
  id: string;
  attribute: string;
  value: string;
  color: string;
}

class TagService {
  async getTags(): Promise<Tag[]> {
    const response = await api.get('/tags');
    return response.data;
  }

  async getAttributes(): Promise<string[]> {
    const response = await api.get('/tags/attributes');
    return response.data;
  }

  async createTag(data: { attribute: string; value: string; color?: string }): Promise<Tag> {
    const response = await api.post('/tags', data);
    return response.data;
  }

  async deleteTag(id: string): Promise<void> {
    await api.delete(`/tags/${id}`);
  }
}

export default new TagService(); 
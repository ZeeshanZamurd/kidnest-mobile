import {
  createParentChild,
  fetchParentChildren,
  type CreateChildPayload,
  type CreatedChildResponse,
} from '../api/parent';
import type { AvatarKey } from '../constants/avatars';
import { setChildAvatarKey } from './childProfileMetaStorage';
import { generateChildCredentials } from '../utils/generateChildCredentials';

const MAX_RETRIES = 3;

export async function createChildProfile(input: {
  displayName: string;
  age: number;
  avatarKey: AvatarKey;
}): Promise<CreatedChildResponse> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const { email, password } = generateChildCredentials(input.displayName);
    const payload: CreateChildPayload = {
      displayName: input.displayName.trim(),
      email,
      password,
      age: input.age,
      dailyLimitMins: 60,
    };

    try {
      const created = await createParentChild(payload);
      await setChildAvatarKey(created.id, input.avatarKey);
      return created;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Failed to create child');
      const message = lastError.message.toLowerCase();
      if (!message.includes('email') || attempt === MAX_RETRIES - 1) {
        throw lastError;
      }
    }
  }

  throw lastError ?? new Error('Failed to create child');
}

export async function refreshParentChildren() {
  return fetchParentChildren();
}

import type { AssignedChannel } from '../api/assignments';

export type ChildChannel = {
  id: string;
  name: string;
  thumbnail: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
};

export function mapAssignedChannelToChildChannel(assigned: AssignedChannel): ChildChannel {
  const { channel } = assigned;
  return {
    id: channel.id,
    name: channel.title,
    thumbnail: channel.thumbnailUrl ?? '',
    description: channel.description,
    categoryId: channel.primaryCategory?.id ?? null,
    categoryName: channel.primaryCategory?.name ?? null,
  };
}

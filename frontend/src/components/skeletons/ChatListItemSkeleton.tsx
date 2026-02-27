import { ListItem, ListItemAvatar, ListItemText, Skeleton } from '@mui/material';

export const ChatListItemSkeleton: React.FC = () => (
  <ListItem>
    <ListItemAvatar>
      <Skeleton variant="circular" width={48} height={48} />
    </ListItemAvatar>
    <ListItemText
      primary={<Skeleton variant="text" width={120} height={24} />}
      secondary={<Skeleton variant="text" width={80} height={20} />}
    />
  </ListItem>
);

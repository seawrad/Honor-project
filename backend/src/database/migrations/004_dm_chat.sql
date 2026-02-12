-- Direct message (DM) chat for friends (mutual follow)
-- Friends = users who follow each other

CREATE TABLE IF NOT EXISTS dm_chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user1_id, user2_id),
  CHECK (user1_id < user2_id)
);

CREATE TABLE IF NOT EXISTS dm_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dm_room_id UUID NOT NULL REFERENCES dm_chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dm_chat_rooms_user1 ON dm_chat_rooms(user1_id);
CREATE INDEX IF NOT EXISTS idx_dm_chat_rooms_user2 ON dm_chat_rooms(user2_id);
CREATE INDEX IF NOT EXISTS idx_dm_chat_messages_room ON dm_chat_messages(dm_room_id);
CREATE INDEX IF NOT EXISTS idx_dm_chat_messages_created_at ON dm_chat_messages(created_at);
